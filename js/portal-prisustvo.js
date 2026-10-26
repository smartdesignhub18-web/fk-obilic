
/* =========================================================
   FK OBILIĆ
   PORTAL - PRISUSTVO NA TRENINZIMA
========================================================= */

(() => {
    "use strict";

    /* =====================================================
       SUPABASE
    ===================================================== */

    const attendanceSb = window.supabase.createClient(
        "https://uvevthgxlnzzkapkjxky.supabase.co",
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg",
        {
            auth: {
                storageKey: "fk-obilic-portal-auth"
            }
        }
    );

    /* =====================================================
       STATE
    ===================================================== */

    let currentUser = null;
    let currentProfile = null;
    let currentTraining = null;
    let currentAttendance = null;
    let currentStats = null;
    let selectedTraining = null;

    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializeAttendance
    );

    async function initializeAttendance() {

        createAttendanceBox();
        createAttendanceModal();
        setupCalendarAttendanceEvents();

        const {
            data: { session }
        } = await attendanceSb.auth.getSession();

        if (session?.user) {
            await openAttendance(session.user);
        }

        attendanceSb.auth.onAuthStateChange(
            async (event, session) => {

                if (
                    (
                        event === "SIGNED_IN" ||
                        event === "INITIAL_SESSION"
                    ) &&
                    session?.user
                ) {
                    await openAttendance(session.user);
                }

                else if (event === "SIGNED_OUT") {
                    resetAttendance();
                }

            }
        );
    }

    /* =====================================================
       KLIK NA TRENING U KALENDARU
    ===================================================== */

    function setupCalendarAttendanceEvents() {

        window.addEventListener(
            "portal:training-selected",
            async event => {

                const training = event.detail?.training;

                if (!training || !currentProfile) {
                    return;
                }

                const role = normalizeRole(
                    currentProfile.uloga
                );

                if (
                    (
                        role === "IGRAČ" ||
                        role === "TRENER"
                    ) &&
                    training.selekcija_id !==
                        currentProfile.selekcija_id
                ) {

                    if (role === "TRENER") {
                        alert(
                            "Можете да прегледате присуство само за тренинге своје селекције."
                        );
                    }

                    return;
                }

                if (role === "IGRAČ") {

                    if (training.status !== "ZAKAZAN") {
                        alert(
                            "За отказан тренинг није могуће потврдити долазак."
                        );
                        return;
                    }

                    if (
                        new Date(training.pocetak) <=
                        new Date()
                    ) {
                        alert(
                            "Потврда доласка за овај тренинг је затворена."
                        );
                        return;
                    }

                    selectedTraining = training;

                    await openPlayerCalendarAttendance(
                        training
                    );

                } else if (
                    role === "TRENER" ||
                    role === "UPRAVA"
                ) {

                    selectedTraining = training;

                    await openAttendanceList(training);
                }
            }
        );

        window.addEventListener(
            "portal:trainings-refreshed",
            async () => {

                if (!currentUser || !currentProfile) {
                    return;
                }

                await loadNextTraining();
                await renderAttendance();

            }
        );
    }

    /* =====================================================
       KREIRAJ MESTO ISPOD SLEDEĆEG TRENINGA
    ===================================================== */

    function createAttendanceBox() {

        if (
            document.querySelector(
                "#portal-training-attendance"
            )
        ) {
            return;
        }

        const content = document.querySelector(
            "#portal-next-training"
        );

        const card = document.querySelector(
            ".portal-next-training"
        );

        if (!content || !card) {
            return;
        }

        const box = document.createElement("div");

        box.id = "portal-training-attendance";
        box.className = "portal-training-attendance";
        box.hidden = true;

        content.insertAdjacentElement(
            "afterend",
            box
        );
    }

    /* =====================================================
       OTVARANJE
    ===================================================== */

    async function openAttendance(user) {

        currentUser = user;

        await loadProfile();

        if (
            !currentProfile ||
            currentProfile.aktivan === false
        ) {
            return;
        }

        createAttendanceBox();

        await loadNextTraining();
        await renderAttendance();
    }

    /* =====================================================
       PROFIL KORISNIKA
    ===================================================== */

    async function loadProfile() {

        if (!currentUser) {
            return;
        }

        const {
            data,
            error
        } = await attendanceSb
            .from("portal_korisnici")
            .select(
                "user_id,ime_prezime,uloga,selekcija_id,aktivan"
            )
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (error) {
            console.error(
                "Attendance profile error:",
                error
            );
        }

        currentProfile = error
            ? null
            : (data || null);
    }

    /* =====================================================
       SLEDEĆI TRENING
    ===================================================== */

    async function loadNextTraining() {

        currentTraining = null;

        const role = normalizeRole(
            currentProfile?.uloga
        );

        let query = attendanceSb
            .from("treninzi")
            .select(
                "id,selekcija_id,pocetak,kraj,mesto,napomena,status"
            )
            .eq("status", "ZAKAZAN")
            .gte(
                "pocetak",
                new Date().toISOString()
            )
            .order("pocetak", {
                ascending: true
            })
            .limit(1);

        /*
           Igrac i trener:
           samo treninzi svoje selekcije.

           Uprava:
           prvi naredni trening u klubu.
        */

        if (
            role === "IGRAČ" ||
            role === "TRENER"
        ) {

            if (!currentProfile?.selekcija_id) {
                return;
            }

            query = query.eq(
                "selekcija_id",
                currentProfile.selekcija_id
            );
        }

        const {
            data,
            error
        } = await query.maybeSingle();

        if (error) {
            console.error(
                "Attendance training error:",
                error
            );
        }

        currentTraining = error
            ? null
            : (data || null);
    }

    /* =====================================================
       GLAVNI PRIKAZ PRISUSTVA
    ===================================================== */

    async function renderAttendance() {

        createAttendanceBox();

        const box = document.querySelector(
            "#portal-training-attendance"
        );

        if (!box) {
            return;
        }

        if (!currentTraining) {

            box.hidden = true;
            box.innerHTML = "";

            return;
        }

        box.hidden = false;

        const role = normalizeRole(
            currentProfile?.uloga
        );

        if (role === "IGRAČ") {
            await renderPlayerAttendance();
        }

        else if (
            role === "TRENER" ||
            role === "UPRAVA"
        ) {
            await renderStaffAttendance();
        }

        else {
            box.hidden = true;
        }
    }

    /* =====================================================
       IGRAC - POTVRDA DOLASKA
    ===================================================== */

    async function renderPlayerAttendance() {

        const box = document.querySelector(
            "#portal-training-attendance"
        );

        if (
            !box ||
            !currentTraining ||
            !currentUser
        ) {
            return;
        }

        const trainingId = currentTraining.id;
        const userId = currentUser.id;

        box.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање потврде...
            </div>
        `;

        const {
            data,
            error
        } = await attendanceSb
            .from("portal_prisustvo_trening")
            .select("status,updated_at")
            .eq("trening_id", trainingId)
            .eq("user_id", userId)
            .maybeSingle();

        if (
            currentTraining?.id !== trainingId ||
            currentUser?.id !== userId
        ) {
            return;
        }

        if (error) {

            console.error(
                "Player attendance error:",
                error
            );

            box.innerHTML = `
                <div class="portal-attendance-error">
                    Потврда доласка тренутно није доступна.
                </div>
            `;

            return;
        }

        currentAttendance = data || null;

        const status = currentAttendance?.status || null;

        box.innerHTML = `

            <div class="portal-attendance-player">

                <div class="portal-attendance-heading">
                    <span>ТРЕНИНГ</span>
                    <strong>ПОТВРДА ДОЛАСКА</strong>
                </div>

                <div class="portal-attendance-buttons">

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-yes
                            ${status === "DOLAZIM" ? "active" : ""}
                        "
                        data-attendance-status="DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">
                            ✓
                        </span>
                        <span>ДОЛАЗИМ</span>
                    </button>

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-no
                            ${status === "NE_DOLAZIM" ? "active" : ""}
                        "
                        data-attendance-status="NE_DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">
                            ×
                        </span>
                        <span>НЕ ДОЛАЗИМ</span>
                    </button>

                </div>

                <div
                    id="portal-attendance-player-message"
                    class="portal-attendance-player-message"
                >
                    ${
                        status === "DOLAZIM"
                            ? "Потврдили сте да долазите на тренинг."
                            : status === "NE_DOLAZIM"
                                ? "Потврдили сте да не долазите на тренинг."
                                : "Молимо потврдите долазак на тренинг."
                    }
                </div>

            </div>
        `;

        box.querySelectorAll(
            "[data-attendance-status]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    savePlayerAttendance(
                        button.dataset.attendanceStatus
                    );

                }
            );

        });
    }

    /* =====================================================
       SACUVAJ DOLAZAK IGRACA
    ===================================================== */

    async function savePlayerAttendance(status) {

        if (
            !currentTraining ||
            !currentUser ||
            !["DOLAZIM", "NE_DOLAZIM"].includes(status)
        ) {
            return;
        }

        const trainingId = currentTraining.id;
        const userId = currentUser.id;

        const buttons = document.querySelectorAll(
            "#portal-training-attendance [data-attendance-status]"
        );

        buttons.forEach(button => {
            button.disabled = true;
        });

        setPlayerMessage("Чување одговора...");

        const {
            error
        } = await attendanceSb
            .from("portal_prisustvo_trening")
            .upsert(
                {
                    trening_id: trainingId,
                    user_id: userId,
                    status
                },
                {
                    onConflict: "trening_id,user_id"
                }
            );

        if (error) {

            console.error(
                "Save attendance error:",
                error
            );

            setPlayerMessage(
                error.message || "Одговор није сачуван.",
                "error"
            );

            buttons.forEach(button => {
                button.disabled = false;
            });

            return;
        }

        if (
            currentTraining?.id === trainingId &&
            currentUser?.id === userId
        ) {

            currentAttendance = { status };

            await renderPlayerAttendance();
        }
    }

    function setPlayerMessage(message, type = "") {

        const element = document.querySelector(
            "#portal-attendance-player-message"
        );

        if (!element) {
            return;
        }

        element.textContent = message;
        element.className =
            "portal-attendance-player-message";

        if (type) {
            element.classList.add(type);
        }
    }

    /* =====================================================
       TRENER / UPRAVA - STATISTIKA
    ===================================================== */

    async function renderStaffAttendance() {

        const box = document.querySelector(
            "#portal-training-attendance"
        );

        if (!box || !currentTraining) {
            return;
        }

        const trainingAtRender = currentTraining;

        box.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање присуства...
            </div>
        `;

        const {
            data,
            error
        } = await attendanceSb.rpc(
            "portal_trening_prisustvo_statistika",
            {
                p_trening_id: trainingAtRender.id
            }
        );

        if (
            currentTraining?.id !== trainingAtRender.id
        ) {
            return;
        }

        if (error) {

            console.error(
                "Attendance stats error:",
                error
            );

            box.innerHTML = `
                <div class="portal-attendance-error">
                    Статистика присуства тренутно није доступна.
                </div>
            `;

            return;
        }

        const stats = Array.isArray(data)
            ? data[0]
            : data;

        currentStats = stats || {
            ukupno_igraca: 0,
            dolazi: 0,
            ne_dolazi: 0,
            nije_odgovorilo: 0
        };

        box.innerHTML = `

            <button
                type="button"
                id="portal-attendance-stats-button"
                class="portal-attendance-staff"
            >

                <div class="portal-attendance-heading">
                    <span>СЛЕДЕЋИ ТРЕНИНГ</span>
                    <strong>ПРИСУСТВО</strong>
                </div>

                <div class="portal-attendance-stats">

                    <div class="
                        portal-attendance-stat
                        attendance-coming
                    ">
                        <strong>
                            ${numberValue(currentStats.dolazi)}
                        </strong>
                        <span>ДОЛАЗИ</span>
                    </div>

                    <div class="
                        portal-attendance-stat
                        attendance-not-coming
                    ">
                        <strong>
                            ${numberValue(currentStats.ne_dolazi)}
                        </strong>
                        <span>НЕ ДОЛАЗИ</span>
                    </div>

                    <div class="
                        portal-attendance-stat
                        attendance-no-answer
                    ">
                        <strong>
                            ${numberValue(currentStats.nije_odgovorilo)}
                        </strong>
                        <span>НИЈЕ ОДГОВОРИЛО</span>
                    </div>

                </div>

                <div class="portal-attendance-open-list">

                    <span>
                        УКУПНО ИГРАЧА:
                        <strong>
                            ${numberValue(currentStats.ukupno_igraca)}
                        </strong>
                    </span>

                    <span>ПОГЛЕДАЈ СПИСАК →</span>

                </div>

            </button>
        `;

        /* =============================================
           ISPRAVKA OTVARANJA SPISKA

           Klik prosledjuje MouseEvent.
           Mi ovde prosledjujemo pravi trening.
        ============================================= */

        box.querySelector(
            "#portal-attendance-stats-button"
        )?.addEventListener(
            "click",
            () => {

                if (!currentTraining) {

                    alert(
                        "Тренинг није пронађен. Освежите страницу."
                    );

                    return;
                }

                openAttendanceList(currentTraining);
            }
        );
    }

    /* =====================================================
       KREIRANJE PROZORA ZA SPISAK
    ===================================================== */

    function createAttendanceModal() {

        if (
            document.querySelector(
                "#portal-attendance-modal"
            )
        ) {
            return;
        }

        const modal = document.createElement("div");

        modal.id = "portal-attendance-modal";

        modal.className =
            "portal-modal portal-attendance-modal";

        modal.hidden = true;

        modal.innerHTML = `

            <div
                class="portal-modal-backdrop"
                data-close-attendance-modal
            ></div>

            <div class="
                portal-modal-dialog
                portal-attendance-dialog
            ">

                <div class="portal-modal-header">

                    <div>
                        <span>ТРЕНИНГ</span>
                        <h2>Присуство играча</h2>
                    </div>

                    <button
                        type="button"
                        class="portal-modal-close"
                        data-close-attendance-modal
                    >
                        ×
                    </button>

                </div>

                <div
                    id="portal-attendance-modal-training"
                    class="portal-attendance-training-info"
                ></div>

                <div
                    id="portal-attendance-modal-list"
                    class="portal-attendance-modal-list"
                >
                    <div class="portal-attendance-loading">
                        Учитавање списка...
                    </div>
                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll(
            "[data-close-attendance-modal]"
        ).forEach(element => {

            element.addEventListener(
                "click",
                closeAttendanceModal
            );

        });
    }

    /* =====================================================
       OTVORI SPISAK IGRACA
    ===================================================== */

    async function openAttendanceList(
        training = currentTraining
    ) {

        const targetTraining =
            training instanceof Event
                ? currentTraining
                : (training || currentTraining);

        if (!targetTraining?.id) {
            return;
        }

        createAttendanceModal();

        const modal = document.querySelector(
            "#portal-attendance-modal"
        );

        const list = document.querySelector(
            "#portal-attendance-modal-list"
        );

        const info = document.querySelector(
            "#portal-attendance-modal-training"
        );

        if (!modal || !list) {
            return;
        }

        modal.hidden = false;

        document.body.style.overflow = "hidden";

        if (info) {

            const role = normalizeRole(
                currentProfile?.uloga
            );

            const canEdit =
                role === "UPRAVA" ||
                (
                    role === "TRENER" &&
                    targetTraining.selekcija_id ===
                        currentProfile?.selekcija_id
                );

            info.innerHTML = `

                <strong>
                    ${escapeHtml(
                        formatFullDate(targetTraining.pocetak)
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        formatTime(targetTraining.pocetak)
                    )}
                    –
                    ${escapeHtml(
                        formatTime(targetTraining.kraj)
                    )}

                    ${
                        targetTraining.mesto
                            ? ` · ${escapeHtml(targetTraining.mesto)}`
                            : ""
                    }
                </span>

                ${
                    canEdit
                        ? `
                            <button
                                type="button"
                                id="portal-attendance-edit-training"
                                class="portal-secondary-button"
                                style="margin-top:14px;"
                            >
                                ИЗМЕНИ ТРЕНИНГ
                            </button>
                        `
                        : ""
                }
            `;

            info.querySelector(
                "#portal-attendance-edit-training"
            )?.addEventListener(
                "click",
                () => {

                    closeAttendanceModal();

                    window.dispatchEvent(
                        new CustomEvent(
                            "portal:edit-training",
                            {
                                detail: {
                                    training: {
                                        ...targetTraining
                                    }
                                }
                            }
                        )
                    );

                }
            );
        }

        list.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање списка...
            </div>
        `;

        const {
            data,
            error
        } = await attendanceSb.rpc(
            "portal_trening_prisustvo_lista",
            {
                p_trening_id: targetTraining.id
            }
        );

        if (!modal.isConnected || modal.hidden) {
            return;
        }

        if (error) {

            console.error(
                "Attendance list error:",
                error
            );

            list.innerHTML = `
                <div class="portal-attendance-error">
                    Списак тренутно није доступан.
                </div>
            `;

            return;
        }

        renderAttendanceList(
            Array.isArray(data) ? data : []
        );
    }

    /* =====================================================
       IGRAC - TRENING IZ KALENDARA
    ===================================================== */

    async function openPlayerCalendarAttendance(
        training
    ) {

        createAttendanceModal();

        const modal = document.querySelector(
            "#portal-attendance-modal"
        );

        const list = document.querySelector(
            "#portal-attendance-modal-list"
        );

        const info = document.querySelector(
            "#portal-attendance-modal-training"
        );

        if (!modal || !list || !currentUser) {
            return;
        }

        modal.hidden = false;

        document.body.style.overflow = "hidden";

        if (info) {

            info.innerHTML = `

                <strong>
                    ${escapeHtml(
                        formatFullDate(training.pocetak)
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        formatTime(training.pocetak)
                    )}
                    –
                    ${escapeHtml(
                        formatTime(training.kraj)
                    )}

                    ${
                        training.mesto
                            ? ` · ${escapeHtml(training.mesto)}`
                            : ""
                    }
                </span>
            `;
        }

        list.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање потврде...
            </div>
        `;

        const {
            data,
            error
        } = await attendanceSb
            .from("portal_prisustvo_trening")
            .select("status,updated_at")
            .eq("trening_id", training.id)
            .eq("user_id", currentUser.id)
            .maybeSingle();

        if (
            !modal.isConnected ||
            modal.hidden ||
            selectedTraining?.id !== training.id
        ) {
            return;
        }

        if (error) {

            console.error(
                "Calendar player attendance error:",
                error
            );

            list.innerHTML = `
                <div class="portal-attendance-error">
                    Потврда доласка тренутно није доступна.
                </div>
            `;

            return;
        }

        renderPlayerCalendarAttendance(
            data?.status || null
        );
    }

    /* =====================================================
       IGRAC - PRIKAZ POTVRDE IZ KALENDARA
    ===================================================== */

    function renderPlayerCalendarAttendance(status) {

        const list = document.querySelector(
            "#portal-attendance-modal-list"
        );

        if (!list) {
            return;
        }

        list.innerHTML = `

            <div class="portal-attendance-player">

                <div class="portal-attendance-heading">
                    <span>ПОТВРДА</span>
                    <strong>ДОЛАЗАК НА ТРЕНИНГ</strong>
                </div>

                <div class="portal-attendance-buttons">

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-yes
                            ${status === "DOLAZIM" ? "active" : ""}
                        "
                        data-calendar-attendance-status="DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">
                            ✓
                        </span>
                        <span>ДОЛАЗИМ</span>
                    </button>

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-no
                            ${status === "NE_DOLAZIM" ? "active" : ""}
                        "
                        data-calendar-attendance-status="NE_DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">
                            ×
                        </span>
                        <span>НЕ ДОЛАЗИМ</span>
                    </button>

                </div>

                <div
                    id="portal-calendar-attendance-player-message"
                    class="portal-attendance-player-message"
                >
                    ${
                        status === "DOLAZIM"
                            ? "Потврдили сте да долазите на овај тренинг."
                            : status === "NE_DOLAZIM"
                                ? "Потврдили сте да не долазите на овај тренинг."
                                : "Молимо потврдите долазак на овај тренинг."
                    }
                </div>

            </div>
        `;

        list.querySelectorAll(
            "[data-calendar-attendance-status]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    saveCalendarPlayerAttendance(
                        button.dataset.calendarAttendanceStatus
                    );

                }
            );

        });
    }

    /* =====================================================
       IGRAC - SACUVAJ POTVRDU IZ KALENDARA
    ===================================================== */

    async function saveCalendarPlayerAttendance(
        status
    ) {

        if (
            !selectedTraining ||
            !currentUser ||
            !["DOLAZIM", "NE_DOLAZIM"].includes(status)
        ) {
            return;
        }

        const trainingId = selectedTraining.id;
        const userId = currentUser.id;

        const buttons = document.querySelectorAll(
            "[data-calendar-attendance-status]"
        );

        buttons.forEach(button => {
            button.disabled = true;
        });

        const message = document.querySelector(
            "#portal-calendar-attendance-player-message"
        );

        if (message) {
            message.textContent = "Чување одговора...";
        }

        const {
            error
        } = await attendanceSb
            .from("portal_prisustvo_trening")
            .upsert(
                {
                    trening_id: trainingId,
                    user_id: userId,
                    status
                },
                {
                    onConflict: "trening_id,user_id"
                }
            );

        if (error) {

            console.error(
                "Save calendar attendance error:",
                error
            );

            if (message) {

                message.textContent =
                    error.message || "Одговор није сачуван.";

                message.classList.add("error");
            }

            buttons.forEach(button => {
                button.disabled = false;
            });

            return;
        }

        if (
            selectedTraining?.id === trainingId &&
            currentUser?.id === userId
        ) {

            renderPlayerCalendarAttendance(status);

            if (currentTraining?.id === trainingId) {
                await renderPlayerAttendance();
            }
        }
    }

    /* =====================================================
       SPISAK PRISUSTVA
    ===================================================== */

    function renderAttendanceList(players) {

        const list = document.querySelector(
            "#portal-attendance-modal-list"
        );

        if (!list) {
            return;
        }

        if (!players.length) {

            list.innerHTML = `

                <div class="portal-attendance-empty">
                    <strong>НЕМА ИГРАЧА</strong>

                    <span>
                        Још нема играча са активним
                        портал налогом у овој селекцији.
                    </span>
                </div>
            `;

            return;
        }

        const coming = players.filter(
            player => player.status === "DOLAZIM"
        );

        const notComing = players.filter(
            player => player.status === "NE_DOLAZIM"
        );

        const noAnswer = players.filter(
            player => !player.status
        );

        list.innerHTML = `

            ${renderAttendanceGroup(
                "ДОЛАЗИ",
                coming,
                "yes"
            )}

            ${renderAttendanceGroup(
                "НЕ ДОЛАЗИ",
                notComing,
                "no"
            )}

            ${renderAttendanceGroup(
                "НИЈЕ ОДГОВОРИЛО",
                noAnswer,
                "waiting"
            )}
        `;
    }

    /* =====================================================
       GRUPE IGRACA
    ===================================================== */

    function renderAttendanceGroup(
        title,
        players,
        type
    ) {

        return `

            <section class="
                portal-attendance-group
                portal-attendance-group-${type}
            ">

                <div class="portal-attendance-group-heading">
                    <span>${escapeHtml(title)}</span>
                    <strong>${players.length}</strong>
                </div>

                <div class="portal-attendance-player-list">

                    ${
                        players.length

                            ? players.map(player => `

                                <div class="portal-attendance-player-row">

                                    <div
                                        class="portal-attendance-player-avatar"
                                        data-player-user-id="${escapeHtml(player.user_id)}"
                                    >
                                        ${escapeHtml(
                                            getInitials(
                                                player.ime_prezime
                                            )
                                        )}
                                    </div>

                                    <div class="portal-attendance-player-name">

                                        <strong>
                                            ${escapeHtml(
                                                player.ime_prezime || "Играч"
                                            )}
                                        </strong>

                                        <span>
                                            ${
                                                player.status === "DOLAZIM"
                                                    ? "Потврдио долазак"
                                                    : player.status === "NE_DOLAZIM"
                                                        ? "Не долази"
                                                        : "Чека се одговор"
                                            }
                                        </span>

                                    </div>

                                    <div class="
                                        portal-attendance-status-icon
                                        ${type}
                                    ">
                                        ${
                                            type === "yes"
                                                ? "✓"
                                                : type === "no"
                                                    ? "×"
                                                    : "?"
                                        }
                                    </div>

                                </div>

                            `).join("")

                            : `
                                <div class="portal-attendance-group-empty">
                                    Нема играча у овој групи.
                                </div>
                            `
                    }

                </div>

            </section>
        `;
    }

    /* =====================================================
       ZATVARANJE
    ===================================================== */

    function closeAttendanceModal() {

        const modal = document.querySelector(
            "#portal-attendance-modal"
        );

        if (modal) {
            modal.hidden = true;
        }

        document.body.style.overflow = "";

        selectedTraining = null;
    }

    /* =====================================================
       RESET
    ===================================================== */

    function resetAttendance() {

        currentUser = null;
        currentProfile = null;
        currentTraining = null;
        currentAttendance = null;
        currentStats = null;
        selectedTraining = null;

        const box = document.querySelector(
            "#portal-training-attendance"
        );

        if (box) {
            box.hidden = true;
            box.innerHTML = "";
        }

        closeAttendanceModal();
    }

    /* =====================================================
       POMOCNE FUNKCIJE
    ===================================================== */

    function normalizeRole(role) {

        return String(role || "")
            .trim()
            .toUpperCase();
    }

    function numberValue(value) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function formatFullDate(value) {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
                timeZone: "Europe/Belgrade"
            }
        ).format(date);
    }

    function formatTime(value) {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Europe/Belgrade"
            }
        ).format(date);
    }

    function getInitials(name = "") {

        const parts = String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "?";
        }

        return (
            parts[0][0] +
            (
                parts.length > 1
                    ? parts[parts.length - 1][0]
                    : ""
            )
        ).toUpperCase();
    }

    function escapeHtml(value = "") {

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

})();
