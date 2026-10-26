
/* =========================================================
   FK OBILIĆ
   PORTAL - PRISUSTVO NA UTAKMICI
========================================================= */

(() => {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";

    const matchAttendanceSb =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    storageKey:
                        "fk-obilic-portal-auth"
                }
            }
        );

    /* =====================================================
       STATE
    ===================================================== */

    let currentUser = null;
    let currentProfile = null;
    let selections = [];
    let currentSelection = null;
    let currentMatch = null;
    let currentMatchKey = null;
    let currentAttendance = null;

    let savingPlayerAttendance = false;
    let playerRenderVersion = 0;

    let refreshTimer = null;
    let cardObserver = null;

    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializeMatchAttendance
    );

    async function initializeMatchAttendance() {

        createAttendanceModal();
        watchMatchCard();

        const {
            data: {
                session
            }
        } =
            await matchAttendanceSb.auth
                .getSession();

        if (session?.user) {
            await openMatchAttendance(
                session.user
            );
        }

        matchAttendanceSb.auth
            .onAuthStateChange(
                async (event, session) => {

                    if (
                        (
                            event === "SIGNED_IN" ||
                            event === "INITIAL_SESSION"
                        ) &&
                        session?.user
                    ) {
                        await openMatchAttendance(
                            session.user
                        );
                    }

                    if (event === "SIGNED_OUT") {
                        resetMatchAttendance();
                    }
                }
            );

        /*
            Uprava može da menja selekciju
            u kartici utakmice.
        */

        document.addEventListener(
            "change",
            event => {

                const card =
                    document.querySelector(
                        "#portal-next-match-card"
                    );

                if (
                    card &&
                    event.target instanceof HTMLSelectElement &&
                    card.contains(event.target)
                ) {
                    scheduleRefresh();
                }
            }
        );
    }

    /* =====================================================
       GLAVNO UČITAVANJE
    ===================================================== */

    async function openMatchAttendance(user) {

        currentUser = user;

        await loadProfile();
        await loadSelections();

        scheduleRefresh(150);
    }

    /* =====================================================
       PROFIL
    ===================================================== */

    async function loadProfile() {

        const { data, error } =
            await matchAttendanceSb
                .from("portal_korisnici")
                .select(
                    "user_id,ime_prezime,uloga,selekcija_id,aktivan"
                )
                .eq("user_id", currentUser.id)
                .maybeSingle();

        if (error) {

            console.error(
                "Match attendance profile error:",
                error
            );

            currentProfile = null;
            return;
        }

        currentProfile = data || null;
    }

    /* =====================================================
       SELEKCIJE
    ===================================================== */

    async function loadSelections() {

        const { data, error } =
            await matchAttendanceSb
                .from("selekcije")
                .select(
                    "id,naziv,redosled,aktivna"
                )
                .eq("aktivna", true)
                .order("redosled", {
                    ascending: true
                });

        if (error) {

            console.error(
                "Match attendance selections error:",
                error
            );

            selections = [];
            return;
        }

        selections =
            Array.isArray(data) ? data : [];
    }

    /* =====================================================
       PRATI KARTICU UTAKMICE
    ===================================================== */

    function watchMatchCard() {

        if (cardObserver) {
            return;
        }

        cardObserver =
            new MutationObserver(
                mutations => {

                    const card =
                        document.querySelector(
                            "#portal-next-match-card"
                        );

                    if (!card) {
                        return;
                    }

                    /*
                        Ignorišemo promene
                        samog modula prisustva.
                    */

                    const relevantMutation =
                        mutations.some(
                            mutation => {

                                const target =
                                    mutation.target;

                                if (
                                    target instanceof Element
                                ) {

                                    if (
                                        target.id ===
                                        "portal-match-attendance"
                                    ) {
                                        return false;
                                    }

                                    if (
                                        target.closest(
                                            "#portal-match-attendance"
                                        )
                                    ) {
                                        return false;
                                    }
                                }

                                if (target === card) {
                                    return true;
                                }

                                if (
                                    target instanceof Element &&
                                    card.contains(target)
                                ) {
                                    return true;
                                }

                                return Array
                                    .from(
                                        mutation.addedNodes
                                    )
                                    .some(
                                        node => {

                                            if (
                                                !(
                                                    node instanceof
                                                    Element
                                                )
                                            ) {
                                                return false;
                                            }

                                            return (
                                                node.id ===
                                                "portal-next-match-card" ||
                                                Boolean(
                                                    node.querySelector(
                                                        "#portal-next-match-card"
                                                    )
                                                )
                                            );
                                        }
                                    );
                            }
                        );

                    if (!relevantMutation) {
                        return;
                    }

                    ensureAttendanceBox();
                    scheduleRefresh(250);
                }
            );

        cardObserver.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
    }

    function scheduleRefresh(delay = 100) {

        clearTimeout(refreshTimer);

        refreshTimer =
            setTimeout(
                refreshMatchAttendance,
                delay
            );
    }

    /* =====================================================
       ATTENDANCE BOX
    ===================================================== */

    function ensureAttendanceBox() {

        const card =
            document.querySelector(
                "#portal-next-match-card"
            );

        if (!card) {
            return null;
        }

        let box =
            card.querySelector(
                "#portal-match-attendance"
            );

        if (box) {
            return box;
        }

        box = document.createElement("div");

        box.id = "portal-match-attendance";
        box.className =
            "portal-match-attendance";

        box.hidden = true;

        card.appendChild(box);

        return box;
    }

    /* =====================================================
       ODREDI SELEKCIJU
    ===================================================== */

    function resolveCurrentSelection() {

        if (!currentProfile) {
            return null;
        }

        const role =
            normalizeRole(
                currentProfile.uloga
            );

        /*
            Igrač i trener koriste
            svoju selekciju.
        */

        if (
            role === "IGRAČ" ||
            role === "TRENER"
        ) {
            return (
                selections.find(
                    selection =>
                        selection.id ===
                        currentProfile.selekcija_id
                ) ||
                null
            );
        }

        /*
            Uprava može da bira selekciju.
        */

        if (role === "UPRAVA") {

            const card =
                document.querySelector(
                    "#portal-next-match-card"
                );

            const select =
                card?.querySelector("select");

            if (select?.value) {

                const byId =
                    selections.find(
                        selection =>
                            selection.id ===
                            select.value
                    );

                if (byId) {
                    return byId;
                }
            }

            const optionText =
                select
                    ?.selectedOptions?.[0]
                    ?.textContent
                    ?.trim();

            if (optionText) {

                const byName =
                    selections.find(
                        selection =>
                            normalizeText(
                                selection.naziv
                            ) ===
                            normalizeText(
                                optionText
                            )
                    );

                if (byName) {
                    return byName;
                }
            }

            return (
                selections.find(isFirstTeam) ||
                selections[0] ||
                null
            );
        }

        return null;
    }

    /* =====================================================
       GLAVNI REFRESH
    ===================================================== */

    async function refreshMatchAttendance() {

        const box = ensureAttendanceBox();

        if (
            !box ||
            !currentUser ||
            !currentProfile
        ) {
            return;
        }

        currentSelection =
            resolveCurrentSelection();

        if (!currentSelection) {
            hideAttendanceBox();
            return;
        }

        await loadNextMatch();

        if (
            !currentMatch ||
            !currentMatchKey
        ) {
            hideAttendanceBox();
            return;
        }

        await renderMatchAttendance();
    }

    /* =====================================================
       SLEDEĆA UTAKMICA
    ===================================================== */

    async function loadNextMatch() {

        currentMatch = null;
        currentMatchKey = null;

        if (isFirstTeam(currentSelection)) {
            await loadFirstTeamMatch();
        } else {
            await loadPortalMatch();
        }
    }

    /* =====================================================
       PRVI TIM - FOOTBALL.JSON
    ===================================================== */

    async function loadFirstTeamMatch() {

        try {

            const response =
                await fetch(
                    `data/football.json?t=${Date.now()}`,
                    {
                        cache: "no-store"
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Football data nije dostupan."
                );
            }

            const data =
                await response.json();

            const match =
                data?.nextMatch;

            if (!match) {
                return;
            }

            currentMatch = {
                source: "srbijasport",
                id: match.id,
                pocetak: match.startDate,
                home: match.home || "",
                away: match.away || "",
                mesto: match.location || "",
                takmicenje: "ПРВИ ТИМ"
            };

            /*
                Koristimo stabilni ID utakmice.
            */

            if (
                match.id !== null &&
                match.id !== undefined
            ) {

                currentMatchKey =
                    `srbijasport:${match.id}`;

            } else {

                currentMatchKey =
                    "srbijasport:" +
                    encodeURIComponent(
                        [
                            match.startDate || "",
                            match.home || "",
                            match.away || ""
                        ].join("|")
                    );
            }

        } catch (error) {

            console.error(
                "First team attendance match error:",
                error
            );
        }
    }

    /* =====================================================
       MLAĐE KATEGORIJE - SUPABASE
    ===================================================== */

    async function loadPortalMatch() {

        const { data, error } =
            await matchAttendanceSb
                .from("portal_utakmice")
                .select(
                    "id,selekcija_id,pocetak,protivnik,domacin_gost,mesto,takmicenje,napomena,status"
                )
                .eq(
                    "selekcija_id",
                    currentSelection.id
                )
                .eq("status", "ZAKAZANA")
                .gte(
                    "pocetak",
                    new Date().toISOString()
                )
                .order("pocetak", {
                    ascending: true
                })
                .limit(1)
                .maybeSingle();

        if (error) {

            console.error(
                "Portal match attendance error:",
                error
            );

            return;
        }

        if (!data) {
            return;
        }

        const isHome =
            data.domacin_gost ===
            "DOMACIN";

        currentMatch = {
            source: "portal",
            id: data.id,
            pocetak: data.pocetak,

            home: isHome
                ? "Обилић"
                : data.protivnik,

            away: isHome
                ? data.protivnik
                : "Обилић",

            mesto: data.mesto || "",
            takmicenje: data.takmicenje || "",
            napomena: data.napomena || ""
        };

        currentMatchKey =
            `portal:${data.id}`;
    }

    /* =====================================================
       RENDER
    ===================================================== */

    async function renderMatchAttendance() {

        const role =
            normalizeRole(
                currentProfile?.uloga
            );

        const box = ensureAttendanceBox();

        if (!box) {
            return;
        }

        box.hidden = false;

        if (role === "IGRAČ") {
            await renderPlayerAttendance();
            return;
        }

        if (
            role === "TRENER" ||
            role === "UPRAVA"
        ) {
            await renderStaffAttendance();
            return;
        }

        box.hidden = true;
    }

    /* =====================================================
       IGRAČ - POTVRDA DOLASKA
    ===================================================== */

    async function renderPlayerAttendance() {

        const box = ensureAttendanceBox();

        if (!box) {
            return;
        }

        /*
            VAŽNA ISPRAVKA:

            Zamrzavamo ID utakmice,
            selekcije i korisnika.

            Ako se učita druga utakmica,
            stari odgovor neće biti prikazan
            kao odgovor za novu.
        */

        const matchKeyAtRender =
            currentMatchKey;

        const selectionIdAtRender =
            currentSelection?.id;

        const userIdAtRender =
            currentUser?.id;

        const renderVersion =
            ++playerRenderVersion;

        if (
            !matchKeyAtRender ||
            !selectionIdAtRender ||
            !userIdAtRender
        ) {
            return;
        }

        box.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање потврде...
            </div>
        `;

        const { data, error } =
            await matchAttendanceSb
                .from(
                    "portal_prisustvo_utakmica"
                )
                .select(
                    "status,updated_at"
                )
                .eq(
                    "utakmica_kljuc",
                    matchKeyAtRender
                )
                .eq(
                    "user_id",
                    userIdAtRender
                )
                .maybeSingle();

        /*
            Ako se utakmica promenila
            tokom učitavanja, odbaci
            stari rezultat.
        */

        if (
            renderVersion !==
                playerRenderVersion ||

            currentMatchKey !==
                matchKeyAtRender ||

            currentSelection?.id !==
                selectionIdAtRender ||

            currentUser?.id !==
                userIdAtRender
        ) {
            return;
        }

        if (error) {

            console.error(
                "Player match attendance error:",
                error
            );

            box.innerHTML = `
                <div class="portal-attendance-error">
                    Потврда доласка тренутно није доступна.
                </div>
            `;

            return;
        }

        currentAttendance =
            data || null;

        const status =
            currentAttendance?.status ||
            null;

        box.innerHTML = `

            <div class="portal-match-attendance-inner">

                <div class="portal-attendance-heading">

                    <span>
                        СЛЕДЕЋА УТАКМИЦА
                    </span>

                    <strong>
                        ПОТВРДА ДОЛАСКА
                    </strong>

                </div>

                <div class="portal-attendance-buttons">

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-yes
                            ${
                                status === "DOLAZIM"
                                    ? "active"
                                    : ""
                            }
                        "
                        data-match-attendance-status="DOLAZIM"
                    >

                        <span class="portal-attendance-button-icon">
                            ✓
                        </span>

                        <span>
                            ДОЛАЗИМ
                        </span>

                    </button>

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-no
                            ${
                                status === "NE_DOLAZIM"
                                    ? "active"
                                    : ""
                            }
                        "
                        data-match-attendance-status="NE_DOLAZIM"
                    >

                        <span class="portal-attendance-button-icon">
                            ×
                        </span>

                        <span>
                            НЕ ДОЛАЗИМ
                        </span>

                    </button>

                </div>

                <div
                    id="portal-match-attendance-message"
                    class="portal-attendance-player-message"
                >

                    ${
                        status === "DOLAZIM"
                            ? "Потврдили сте да долазите на утакмицу."

                            : status === "NE_DOLAZIM"
                                ? "Потврдили сте да не долазите на утакмицу."

                                : "Молимо потврдите долазак на утакмицу."
                    }

                </div>

            </div>
        `;

        /*
            Dugmad pamte utakmicu
            za koju su prikazana.
        */

        box.querySelectorAll(
            "[data-match-attendance-status]"
        ).forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    savePlayerAttendance(
                        button.dataset
                            .matchAttendanceStatus,

                        matchKeyAtRender,
                        selectionIdAtRender,
                        userIdAtRender
                    );
                }
            );
        });
    }

    /* =====================================================
       SAČUVAJ ODGOVOR IGRAČA
    ===================================================== */

    async function savePlayerAttendance(
        status,
        expectedMatchKey,
        expectedSelectionId,
        expectedUserId
    ) {

        if (savingPlayerAttendance) {
            return;
        }

        if (
            status !== "DOLAZIM" &&
            status !== "NE_DOLAZIM"
        ) {
            return;
        }

        /*
            Proveravamo da je utakmica
            još uvek ista.
        */

        const isSameMatch = () =>
            Boolean(
                expectedMatchKey &&
                expectedSelectionId &&
                expectedUserId &&

                currentMatchKey ===
                    expectedMatchKey &&

                currentSelection?.id ===
                    expectedSelectionId &&

                currentUser?.id ===
                    expectedUserId &&

                normalizeRole(
                    currentProfile?.uloga
                ) === "IGRAČ" &&

                currentProfile?.aktivan !== false
            );

        if (!isSameMatch()) {

            window.alert(
                "Утакмица је промењена. " +
                "Освежавамо податке — " +
                "изаберите одговор поново."
            );

            scheduleRefresh(0);
            return;
        }

        const matchLabel = [
            currentMatch?.home || "",
            currentMatch?.away || ""
        ]
            .filter(Boolean)
            .join(" – ");

        const answerLabel =
            status === "DOLAZIM"
                ? "ДОЛАЗИМ"
                : "НЕ ДОЛАЗИМ";

        /*
            Obavezna potvrda pre upisa.
        */

        const confirmed =
            window.confirm(
                `Потврди одговор за утакмицу ${matchLabel}:\n\n${answerLabel}?`
            );

        if (!confirmed) {
            return;
        }

        /*
            Ponovo proveravamo utakmicu
            nakon korisničke potvrde.
        */

        if (!isSameMatch()) {

            window.alert(
                "У међувремену је промењена " +
                "утакмица. Одговор није сачуван."
            );

            scheduleRefresh(0);
            return;
        }

        savingPlayerAttendance = true;

        const buttons =
            document.querySelectorAll(
                "#portal-match-attendance [data-match-attendance-status]"
            );

        buttons.forEach(button => {
            button.disabled = true;
        });

        setPlayerMessage(
            "Чување одговора...",
            ""
        );

        try {

            const { error } =
                await matchAttendanceSb
                    .from(
                        "portal_prisustvo_utakmica"
                    )
                    .upsert(
                        {
                            utakmica_kljuc:
                                expectedMatchKey,

                            selekcija_id:
                                expectedSelectionId,

                            user_id:
                                expectedUserId,

                            status
                        },
                        {
                            onConflict:
                                "utakmica_kljuc,user_id"
                        }
                    );

            if (error) {
                throw error;
            }

            if (isSameMatch()) {

                currentAttendance = {
                    status
                };

                await renderPlayerAttendance();

            } else {

                scheduleRefresh(0);
            }

        } catch (error) {

            console.error(
                "Save match attendance error:",
                error
            );

            setPlayerMessage(
                error?.message ||
                    "Одговор није сачуван.",
                "error"
            );

        } finally {

            savingPlayerAttendance = false;

            buttons.forEach(button => {
                if (button.isConnected) {
                    button.disabled = false;
                }
            });
        }
    }

    /* =====================================================
       PORUKA IGRAČU
    ===================================================== */

    function setPlayerMessage(
        message,
        type
    ) {

        const element =
            document.querySelector(
                "#portal-match-attendance-message"
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
       TRENER / UPRAVA
    ===================================================== */

    async function renderStaffAttendance() {

        const box = ensureAttendanceBox();

        if (!box) {
            return;
        }

        box.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање присуства...
            </div>
        `;

        const { data, error } =
            await matchAttendanceSb
                .rpc(
                    "portal_utakmica_prisustvo_statistika",
                    {
                        p_utakmica_kljuc:
                            currentMatchKey,

                        p_selekcija_id:
                            currentSelection.id
                    }
                );

        if (error) {

            console.error(
                "Match attendance stats error:",
                error
            );

            box.innerHTML = `
                <div class="portal-attendance-error">
                    Статистика присуства тренутно није доступна.
                </div>
            `;

            return;
        }

        const stats =
            Array.isArray(data)
                ? data[0]
                : data;

        const values =
            stats || {
                ukupno_igraca: 0,
                dolazi: 0,
                ne_dolazi: 0,
                nije_odgovorilo: 0
            };

        box.innerHTML = `

            <button
                type="button"
                id="portal-match-attendance-stats-button"
                class="
                    portal-attendance-staff
                    portal-match-attendance-staff
                "
            >

                <div class="portal-attendance-heading">

                    <span>
                        СЛЕДЕЋА УТАКМИЦА
                    </span>

                    <strong>
                        ПРИСУСТВО
                    </strong>

                </div>

                <div class="portal-attendance-stats">

                    <div
                        class="
                            portal-attendance-stat
                            attendance-coming
                        "
                    >

                        <strong>
                            ${numberValue(values.dolazi)}
                        </strong>

                        <span>
                            ДОЛАЗИ
                        </span>

                    </div>

                    <div
                        class="
                            portal-attendance-stat
                            attendance-not-coming
                        "
                    >

                        <strong>
                            ${numberValue(values.ne_dolazi)}
                        </strong>

                        <span>
                            НЕ ДОЛАЗИ
                        </span>

                    </div>

                    <div
                        class="
                            portal-attendance-stat
                            attendance-no-answer
                        "
                    >

                        <strong>
                            ${numberValue(values.nije_odgovorilo)}
                        </strong>

                        <span>
                            НИЈЕ ОДГОВОРИЛО
                        </span>

                    </div>

                </div>

                <div class="portal-attendance-open-list">

                    <span>

                        УКУПНО ИГРАЧА:

                        <strong>
                            ${numberValue(values.ukupno_igraca)}
                        </strong>

                    </span>

                    <span>
                        ПОГЛЕДАЈ СПИСАК →
                    </span>

                </div>

            </button>
        `;

        document
            .querySelector(
                "#portal-match-attendance-stats-button"
            )
            ?.addEventListener(
                "click",
                openAttendanceList
            );
    }

    /* =====================================================
       MODAL - SPISAK PRISUSTVA
    ===================================================== */

    function createAttendanceModal() {

        if (
            document.querySelector(
                "#portal-match-attendance-modal"
            )
        ) {
            return;
        }

        const modal =
            document.createElement("div");

        modal.id =
            "portal-match-attendance-modal";

        modal.className =
            "portal-modal portal-attendance-modal";

        modal.hidden = true;

        modal.innerHTML = `

            <div
                class="portal-modal-backdrop"
                data-close-match-attendance
            ></div>

            <div
                class="
                    portal-modal-dialog
                    portal-attendance-dialog
                "
            >

                <div class="portal-modal-header">

                    <div>

                        <span>
                            СЛЕДЕЋА УТАКМИЦА
                        </span>

                        <h2>
                            Присуство играча
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="portal-modal-close"
                        data-close-match-attendance
                    >
                        ×
                    </button>

                </div>

                <div
                    id="portal-match-attendance-game"
                    class="portal-attendance-training-info"
                ></div>

                <div
                    id="portal-match-attendance-list"
                    class="portal-attendance-modal-list"
                >

                    <div class="portal-attendance-loading">
                        Учитавање списка...
                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(modal);

        modal
            .querySelectorAll(
                "[data-close-match-attendance]"
            )
            .forEach(element => {

                element.addEventListener(
                    "click",
                    closeAttendanceModal
                );
            });
    }

    /* =====================================================
       OTVORI SPISAK
    ===================================================== */

    async function openAttendanceList() {

        if (
            !currentMatch ||
            !currentMatchKey ||
            !currentSelection
        ) {
            return;
        }

        const modal =
            document.querySelector(
                "#portal-match-attendance-modal"
            );

        const list =
            document.querySelector(
                "#portal-match-attendance-list"
            );

        const matchInfo =
            document.querySelector(
                "#portal-match-attendance-game"
            );

        if (!modal || !list) {
            return;
        }

        modal.hidden = false;

        document.body.style.overflow =
            "hidden";

        if (matchInfo) {

            matchInfo.innerHTML = `

                <strong>
                    ${escapeHtml(
                        `${currentMatch.home} – ${currentMatch.away}`
                    )}
                </strong>

                <span>

                    ${escapeHtml(
                        formatFullDate(
                            currentMatch.pocetak
                        )
                    )}

                    ·

                    ${escapeHtml(
                        formatTime(
                            currentMatch.pocetak
                        )
                    )}

                    ${
                        currentMatch.mesto

                            ? ` · ${escapeHtml(
                                currentMatch.mesto
                            )}`

                            : ""
                    }

                </span>
            `;
        }

        list.innerHTML = `
            <div class="portal-attendance-loading">
                Учитавање списка...
            </div>
        `;

        const { data, error } =
            await matchAttendanceSb
                .rpc(
                    "portal_utakmica_prisustvo_lista",
                    {
                        p_utakmica_kljuc:
                            currentMatchKey,

                        p_selekcija_id:
                            currentSelection.id
                    }
                );

        if (error) {

            console.error(
                "Match attendance list error:",
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
            Array.isArray(data)
                ? data
                : []
        );
    }

    /* =====================================================
       SPISAK IGRAČA
    ===================================================== */

    function renderAttendanceList(players) {

        const list =
            document.querySelector(
                "#portal-match-attendance-list"
            );

        if (!list) {
            return;
        }

        if (!players.length) {

            list.innerHTML = `
                <div class="portal-attendance-empty">

                    <strong>
                        НЕМА ИГРАЧА
                    </strong>

                    <span>
                        Још нема играча са активним
                        портал налогом у овој селекцији.
                    </span>

                </div>
            `;

            return;
        }

        const coming =
            players.filter(
                player =>
                    player.status === "DOLAZIM"
            );

        const notComing =
            players.filter(
                player =>
                    player.status === "NE_DOLAZIM"
            );

        const noAnswer =
            players.filter(
                player =>
                    !player.status
            );

        list.innerHTML = `

            ${renderGroup(
                "ДОЛАЗИ",
                coming,
                "yes"
            )}

            ${renderGroup(
                "НЕ ДОЛАЗИ",
                notComing,
                "no"
            )}

            ${renderGroup(
                "НИЈЕ ОДГОВОРИЛО",
                noAnswer,
                "waiting"
            )}
        `;
    }

    /* =====================================================
       GRUPE IGRAČA
    ===================================================== */

    function renderGroup(
        title,
        players,
        type
    ) {

        return `

            <section
                class="
                    portal-attendance-group
                    portal-attendance-group-${type}
                "
            >

                <div class="portal-attendance-group-heading">

                    <span>
                        ${escapeHtml(title)}
                    </span>

                    <strong>
                        ${players.length}
                    </strong>

                </div>

                <div class="portal-attendance-player-list">

                    ${
                        players.length

                            ? players.map(player => `

                                <div
                                    class="portal-attendance-player-row"
                                >

                                    
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

                                    <div
                                        class="portal-attendance-player-name"
                                    >

                                        <strong>
                                            ${escapeHtml(
                                                player.ime_prezime ||
                                                "Играч"
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

                                    <div
                                        class="
                                            portal-attendance-status-icon
                                            ${type}
                                        "
                                    >
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
       ZATVORI MODAL
    ===================================================== */

    function closeAttendanceModal() {

        const modal =
            document.querySelector(
                "#portal-match-attendance-modal"
            );

        if (modal) {
            modal.hidden = true;
        }

        document.body.style.overflow = "";
    }

    /* =====================================================
       SAKRIJ PRISUSTVO
    ===================================================== */

    function hideAttendanceBox() {

        const box =
            document.querySelector(
                "#portal-match-attendance"
            );

        if (box) {
            box.hidden = true;
            box.innerHTML = "";
        }
    }

    /* =====================================================
       RESET
    ===================================================== */

    function resetMatchAttendance() {

        currentUser = null;
        currentProfile = null;
        selections = [];
        currentSelection = null;
        currentMatch = null;
        currentMatchKey = null;
        currentAttendance = null;

        hideAttendanceBox();
    }

    /* =====================================================
       PROVERA PRVOG TIMA
    ===================================================== */

    function isFirstTeam(selection) {

        const name =
            normalizeText(
                selection?.naziv
            );

        return (
            name === "ПРВИ ТИМ" ||
            name === "PRVI TIM"
        );
    }

    /* =====================================================
       POMOĆNE FUNKCIJE
    ===================================================== */

    function normalizeText(value) {

        return String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .toUpperCase();
    }

    function normalizeRole(role) {

        return String(role || "")
            .trim()
            .toUpperCase();
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

    function numberValue(value) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }

    function getInitials(name = "") {

        const parts =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        if (!parts.length) {
            return "?";
        }

        if (parts.length === 1) {

            return parts[0]
                .slice(0, 1)
                .toUpperCase();
        }

        return (
            parts[0].slice(0, 1) +
            parts[parts.length - 1].slice(0, 1)
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
