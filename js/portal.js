/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   PORTAL KLUBA
========================================================= */

(() => {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    const portalSb =
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

    let currentUser =
        null;

    let currentProfile =
        null;

    let currentSelection =
        null;

    let selections =
        [];

    let calendarTrainings =
        [];

    let nextTraining =
        null;

    let trainingRefreshTimer =
        null;

    let editingTraining =
        null;


    let calendarCursor =
        new Date();

    calendarCursor =
        new Date(
            calendarCursor.getFullYear(),
            calendarCursor.getMonth(),
            1
        );



    /* =====================================================
       ELEMENTI
    ===================================================== */

    const loginScreen =
        document.querySelector(
            "#portal-login-screen"
        );

    const portalApp =
        document.querySelector(
            "#portal-app"
        );

    const loginForm =
        document.querySelector(
            "#portal-login-form"
        );

    const emailInput =
        document.querySelector(
            "#portal-email"
        );

    const passwordInput =
        document.querySelector(
            "#portal-password"
        );

    const loginButton =
        document.querySelector(
            "#portal-login-button"
        );

    const loginMessage =
        document.querySelector(
            "#portal-login-message"
        );

    const logoutButton =
        document.querySelector(
            "#portal-logout-button"
        );

    const headerName =
        document.querySelector(
            "#portal-header-name"
        );

    const headerRole =
        document.querySelector(
            "#portal-header-role"
        );

    const welcomeName =
        document.querySelector(
            "#portal-welcome-name"
        );

    const roleBadge =
        document.querySelector(
            "#portal-role-badge"
        );

    const selectionBadge =
        document.querySelector(
            "#portal-selection-badge"
        );

    const selectionName =
        document.querySelector(
            "#portal-selection-name"
        );

    const selectionDescription =
        document.querySelector(
            "#portal-selection-description"
        );

    const nextTrainingContainer =
        document.querySelector(
            "#portal-next-training"
        );

    const trainingList =
        document.querySelector(
            "#portal-training-list"
        );

    const calendarDescription =
        document.querySelector(
            "#portal-calendar-description"
        );

    const addTrainingButton =
        document.querySelector(
            "#portal-add-training"
        );

    const trainingModal =
        document.querySelector(
            "#portal-training-modal"
        );

    const trainingForm =
        document.querySelector(
            "#portal-training-form"
        );

    const trainingSelectionField =
        document.querySelector(
            "#portal-training-selection-field"
        );

    const trainingSelectionInput =
        document.querySelector(
            "#portal-training-selection"
        );

    const trainingDateInput =
        document.querySelector(
            "#portal-training-date"
        );

    const trainingStartInput =
        document.querySelector(
            "#portal-training-start"
        );

    const trainingEndInput =
        document.querySelector(
            "#portal-training-end"
        );

    const trainingPlaceInput =
        document.querySelector(
            "#portal-training-place"
        );

    const trainingNoteInput =
        document.querySelector(
            "#portal-training-note"
        );

    const trainingConflict =
        document.querySelector(
            "#portal-training-conflict"
        );

    const trainingMessage =
        document.querySelector(
            "#portal-training-message"
        );

    const trainingSaveButton =
        document.querySelector(
            "#portal-training-save"
        );



    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializePortal
    );


    async function initializePortal() {

        setupEvents();


        const {
            data: {
                session
            }
        } =
            await portalSb.auth
                .getSession();


        if (
            session &&
            session.user
        ) {

            await openPortal(
                session.user
            );

        }

        else {

            showLogin();

        }

    }



    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );

        }


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                handleLogout
            );

        }


        if (addTrainingButton) {

            addTrainingButton.addEventListener(
                "click",
                () => {

                    openTrainingModal(
                        formatInputDate(
                            new Date()
                        )
                    );

                }
            );

        }


        document
            .querySelectorAll(
                "[data-close-training-modal]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        closeTrainingModal
                    );

                }
            );


        if (trainingForm) {

            trainingForm.addEventListener(
                "submit",
                saveTraining
            );

        }


        [
            trainingDateInput,
            trainingStartInput,
            trainingEndInput,
            trainingSelectionInput
        ]
            .filter(Boolean)
            .forEach(
                element => {

                    element.addEventListener(
                        "change",
                        checkTrainingConflict
                    );

                }
            );


        if (trainingList) {

            trainingList.addEventListener(
                "click",
                handleCalendarClick
            );

        }


        window.addEventListener(
            "portal:edit-training",
            event => {

                const training =
                    event.detail
                        ?.training;

                if (!training) {

                    return;

                }

                const role =
                    normalizeRole(
                        currentProfile
                            ?.uloga
                    );

                const canEdit =
                    role === "UPRAVA" ||
                    (
                        role === "TRENER" &&
                        training.selekcija_id ===
                            currentProfile
                                ?.selekcija_id
                    );

                if (!canEdit) {

                    return;

                }

                openTrainingModal(
                    null,
                    training
                );

            }
        );


        window.addEventListener(
            "focus",
            () => {

                refreshTrainingData();

            }
        );


        document.addEventListener(
            "visibilitychange",
            () => {

                if (!document.hidden) {

                    refreshTrainingData();

                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Escape" &&
                    trainingModal &&
                    !trainingModal.hidden
                ) {

                    closeTrainingModal();

                }

            }
        );

    }



    /* =====================================================
       LOGIN
    ===================================================== */

    async function handleLogin(
        event
    ) {

        event.preventDefault();


        setMessage(
            loginMessage,
            "",
            ""
        );


        const email =
            emailInput
                ?.value
                .trim();


        const password =
            passwordInput
                ?.value;


        if (
            !email ||
            !password
        ) {

            setMessage(
                loginMessage,
                "Унесите е-маил и лозинку.",
                "error"
            );

            return;

        }


        setButtonLoading(
            loginButton,
            true,
            "ПРИЈАВА..."
        );


        try {

            const {
                data,
                error
            } =
                await portalSb.auth
                    .signInWithPassword(
                        {
                            email,
                            password
                        }
                    );


            if (error) {

                throw error;

            }


            if (!data.user) {

                throw new Error(
                    "Пријава није успела."
                );

            }


            const opened =
                await openPortal(
                    data.user
                );


            if (!opened) {

                await portalSb.auth
                    .signOut();

            }

        }

        catch (error) {

            console.error(
                "Portal login error:",
                error
            );


            setMessage(
                loginMessage,
                getFriendlyError(
                    error
                ),
                "error"
            );

        }

        finally {

            setButtonLoading(
                loginButton,
                false,
                "ПРИЈАВИ СЕ"
            );

        }

    }



    /* =====================================================
       LOGOUT
    ===================================================== */

    async function handleLogout() {

        await portalSb.auth
            .signOut();


        currentUser =
            null;

        currentProfile =
            null;

        currentSelection =
            null;

        selections =
            [];

        calendarTrainings =
            [];

        nextTraining =
            null;


        stopTrainingAutoRefresh();


        showLogin();

    }



    /* =====================================================
       OTVARANJE PORTALA
    ===================================================== */

    async function openPortal(
        user
    ) {

        currentUser =
            user;


        const profile =
            await loadPortalProfile(
                user.id
            );


        if (!profile) {

            showLogin();


            setMessage(
                loginMessage,
                "Ваш налог нема приступ порталу клуба.",
                "error"
            );


            return false;

        }


        if (
            profile.aktivan ===
            false
        ) {

            showLogin();


            setMessage(
                loginMessage,
                "Ваш налог тренутно није активан.",
                "error"
            );


            return false;

        }


        currentProfile =
            profile;


        selections =
            await loadSelections();


        currentSelection =
            selections.find(
                selection =>
                    selection.id ===
                    profile.selekcija_id
            ) ||
            null;


        calendarCursor =
            new Date();

        calendarCursor =
            new Date(
                calendarCursor.getFullYear(),
                calendarCursor.getMonth(),
                1
            );


        renderProfile();

        showPortal();


        await Promise.all(
            [
                loadCalendarTrainings(),
                loadNextTraining()
            ]
        );


        renderCalendar();

        renderNextTraining();


        startTrainingAutoRefresh();


        return true;

    }



    /* =====================================================
       AUTOMATSKO OSVEŽAVANJE TRENINGA
    ===================================================== */

   async function refreshTrainingData() {

    if (
        !currentUser ||
        document.hidden
    ) {

        return;

    }


    const getTrainingsSignature =
        trainings => {

            return JSON.stringify(
                (
                    Array.isArray(trainings)
                        ? trainings
                        : []
                )
                    .map(
                        training => [
                            training.id,
                            training.selekcija_id,
                            training.pocetak,
                            training.kraj,
                            training.mesto || "",
                            training.napomena || "",
                            training.status
                        ]
                    )
            );

        };


    const getTrainingSignature =
        training => {

            if (!training) {

                return "";

            }


            return JSON.stringify([
                training.id,
                training.selekcija_id,
                training.pocetak,
                training.kraj,
                training.mesto || "",
                training.napomena || "",
                training.status
            ]);

        };


    const previousCalendarSignature =
        getTrainingsSignature(
            calendarTrainings
        );


    const previousNextSignature =
        getTrainingSignature(
            nextTraining
        );


    try {

        await Promise.all(
            [
                loadCalendarTrainings(),
                loadNextTraining()
            ]
        );


        const newCalendarSignature =
            getTrainingsSignature(
                calendarTrainings
            );


        const newNextSignature =
            getTrainingSignature(
                nextTraining
            );


        const calendarChanged =
            previousCalendarSignature !==
            newCalendarSignature;


        const nextTrainingChanged =
            previousNextSignature !==
            newNextSignature;


        /*
            Ništa se nije promenilo u bazi:
            ne diramo DOM i ne osvežavamo
            prisustvo bez potrebe.
        */

        if (
            !calendarChanged &&
            !nextTrainingChanged
        ) {

            return;

        }


        if (calendarChanged) {

            renderCalendar();

        }


        if (nextTrainingChanged) {

            renderNextTraining();

        }


        window.dispatchEvent(
            new CustomEvent(
                "portal:trainings-refreshed"
            )
        );

    }

    catch (error) {

        console.error(
            "Training auto refresh error:",
            error
        );

    }

}

    function startTrainingAutoRefresh() {

        stopTrainingAutoRefresh();


        trainingRefreshTimer =
            window.setInterval(
                refreshTrainingData,
                8000
            );

    }


    function stopTrainingAutoRefresh() {

        if (!trainingRefreshTimer) {

            return;

        }


        window.clearInterval(
            trainingRefreshTimer
        );


        trainingRefreshTimer =
            null;

    }



    /* =====================================================
       PROFIL
    ===================================================== */

    async function loadPortalProfile(
        userId
    ) {

        const {
            data,
            error
        } =
            await portalSb
                .from(
                    "portal_korisnici"
                )
                .select(
                    "user_id,ime_prezime,uloga,povezani_id,selekcija_id,aktivan"
                )
                .eq(
                    "user_id",
                    userId
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Portal profile error:",
                error
            );

            return null;

        }


        return data || null;

    }



    /* =====================================================
       SELEKCIJE
    ===================================================== */

    async function loadSelections() {

        const {
            data,
            error
        } =
            await portalSb
                .from(
                    "selekcije"
                )
                .select(
                    "id,kod,naziv,opis,godiste,redosled,aktivna"
                )
                .eq(
                    "aktivna",
                    true
                )
                .order(
                    "redosled",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Portal selections error:",
                error
            );

            return [];

        }


        return Array.isArray(data)
            ? data
            : [];

    }



    /* =====================================================
       RENDER PROFILA
    ===================================================== */

    function renderProfile() {

        const name =
            currentProfile
                ?.ime_prezime ||
            currentUser
                ?.email ||
            "Корисник";


        const role =
            normalizeRole(
                currentProfile
                    ?.uloga
            );


        const selection =
            currentSelection
                ?.naziv ||
            (
                role ===
                    "UPRAVA"
                    ? "СВЕ СЕЛЕКЦИЈЕ"
                    : "БЕЗ СЕЛЕКЦИЈЕ"
            );


        if (headerName) {

            headerName.textContent =
                name;

        }


        if (headerRole) {

            headerRole.textContent =
                role;

        }


        if (welcomeName) {

            welcomeName.textContent =
                name;

        }


        if (roleBadge) {

            roleBadge.textContent =
                role;

        }


        if (selectionBadge) {

            selectionBadge.textContent =
                selection;

        }


        if (selectionName) {

            selectionName.textContent =
                selection;

        }


        if (selectionDescription) {

            selectionDescription.textContent =
                currentSelection
                    ?.opis ||
                (
                    role ===
                        "UPRAVA"

                        ? "Преглед свих селекција клуба."

                        : "Подаци о вашој селекцији."
                );

        }


        if (addTrainingButton) {

            addTrainingButton.hidden =
                ![
                    "TRENER",
                    "UPRAVA"
                ].includes(
                    role
                );

        }


        if (calendarDescription) {

            if (
                role ===
                "IGRAČ"
            ) {

                calendarDescription.textContent =
                    "Тренинзи ваше селекције.";

            }

            else {

                calendarDescription.textContent =
                    "Кликните на датум да закажете тренинг. Приказани су термини свих селекција.";

            }

        }

    }



    /* =====================================================
       TRENINZI - KALENDAR
    ===================================================== */

    async function loadCalendarTrainings() {

        const start =
            new Date(
                calendarCursor.getFullYear(),
                calendarCursor.getMonth(),
                1,
                0,
                0,
                0,
                0
            );


        const end =
            new Date(
                calendarCursor.getFullYear(),
                calendarCursor.getMonth() +
                    1,
                1,
                0,
                0,
                0,
                0
            );


        const {
            data,
            error
        } =
            await portalSb
                .from(
                    "treninzi"
                )
                .select(
                    "id,selekcija_id,pocetak,kraj,mesto,napomena,status,created_by,created_at"
                )
                .gte(
                    "pocetak",
                    start.toISOString()
                )
                .lt(
                    "pocetak",
                    end.toISOString()
                )
                .order(
                    "pocetak",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Calendar trainings error:",
                error
            );


            calendarTrainings =
                [];

            return;

        }


        calendarTrainings =
            Array.isArray(data)
                ? data
                : [];

    }



    /* =====================================================
       SLEDEĆI TRENING
    ===================================================== */

   
async function loadNextTraining() {

    nextTraining = null;

    if (!currentProfile) {
        return;
    }

    const role = normalizeRole(
        currentProfile.uloga
    );

    let query = portalSb
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

    // Igrac i trener vide svoju selekciju.

    if (
        role === "IGRAČ" ||
        role === "TRENER"
    ) {

        if (!currentProfile.selekcija_id) {
            return;
        }

        query = query.eq(
            "selekcija_id",
            currentProfile.selekcija_id
        );

    } else if (role !== "UPRAVA") {

        return;
    }

    // Uprava vidi prvi naredni trening
    // bilo koje selekcije kluba.

    const { data, error } =
        await query.maybeSingle();

    if (error) {

        console.error(
            "Next training error:",
            error
        );

        return;
    }

    nextTraining = data || null;
}



    /* =====================================================
       RENDER SLEDEĆEG TRENINGA
    ===================================================== */

    function renderNextTraining() {

        if (!nextTrainingContainer) {

            return;

        }


        if (!nextTraining) {

            nextTrainingContainer.innerHTML = `

                <div class="portal-empty-small">

                    <strong>
                        Нема заказаног тренинга
                    </strong>

                    <p>
                        Следећи термин још није унет.
                    </p>

                </div>

            `;

            return;

        }


        nextTrainingContainer.innerHTML = `

            <span class="portal-training-date-large">
                ${escapeHtml(
                    formatFullDate(
                        nextTraining.pocetak
                    )
                )}
            </span>

            <span class="portal-training-time-large">

                ${escapeHtml(
                    formatTime(
                        nextTraining.pocetak
                    )
                )}

                –

                ${escapeHtml(
                    formatTime(
                        nextTraining.kraj
                    )
                )}

            </span>

            ${
                nextTraining.mesto
                    ? `
                        <div class="portal-training-place">
                            ${escapeHtml(
                                nextTraining.mesto
                            )}
                        </div>
                    `
                    : ""
            }

        `;

    }



    /* =====================================================
       RENDER KALENDARA
    ===================================================== */

    function renderCalendar() {

        if (!trainingList) {

            return;

        }


        const year =
            calendarCursor
                .getFullYear();


        const month =
            calendarCursor
                .getMonth();


        const firstDay =
            new Date(
                year,
                month,
                1
            );


        const daysInMonth =
            new Date(
                year,
                month + 1,
                0
            )
                .getDate();


        /*
            JS:
            nedelja = 0
            ponedeljak = 1

            Nama treba:
            ponedeljak = 0
        */

        const leadingEmptyDays =
            (
                firstDay.getDay() +
                6
            ) %
            7;


        const todayKey =
            formatInputDate(
                new Date()
            );


        const monthTitle =
            new Intl.DateTimeFormat(
                "sr-Cyrl-RS",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            )
                .format(
                    calendarCursor
                )
                .toUpperCase();


        let daysHtml =
            "";


        for (
            let index = 0;
            index < leadingEmptyDays;
            index++
        ) {

            daysHtml += `

                <div
                    class="
                        portal-calendar-day
                        portal-calendar-day-empty
                    "
                ></div>

            `;

        }


        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const date =
                new Date(
                    year,
                    month,
                    day
                );


            const dateKey =
                formatInputDate(
                    date
                );


            const dayTrainings =
                getTrainingsForDay(
                    dateKey
                );


            const isToday =
                dateKey ===
                todayKey;


            daysHtml += `

                <button
                    type="button"
                    class="
                        portal-calendar-day
                        ${
                            isToday
                                ? "portal-calendar-day-today"
                                : ""
                        }
                    "
                    data-calendar-day="${dateKey}"
                >

                    <span class="portal-calendar-day-number">
                        ${day}
                    </span>


                    <div class="portal-calendar-events">

                        ${
                            renderCalendarEvents(
                                dayTrainings
                            )
                        }

                    </div>

                </button>

            `;

        }


        trainingList.innerHTML = `

            <div class="portal-calendar">


                <div class="portal-calendar-toolbar">

                    <button
                        type="button"
                        class="portal-calendar-nav"
                        data-calendar-action="prev"
                        aria-label="Претходни месец"
                    >
                        ‹
                    </button>


                    <div class="portal-calendar-title">

                        <strong>
                            ${escapeHtml(
                                monthTitle
                            )}
                        </strong>

                        <button
                            type="button"
                            data-calendar-action="today"
                        >
                            ДАНАС
                        </button>

                    </div>


                    <button
                        type="button"
                        class="portal-calendar-nav"
                        data-calendar-action="next"
                        aria-label="Следећи месец"
                    >
                        ›
                    </button>

                </div>


                <div class="portal-calendar-weekdays">

                    <span>ПОН</span>
                    <span>УТО</span>
                    <span>СРЕ</span>
                    <span>ЧЕТ</span>
                    <span>ПЕТ</span>
                    <span>СУБ</span>
                    <span>НЕД</span>

                </div>


                <div class="portal-calendar-grid">

                    ${daysHtml}

                </div>


            </div>

        `;

    }



    /* =====================================================
       TRENING PO DANU
    ===================================================== */

    function getTrainingsForDay(
        dateKey
    ) {

        return calendarTrainings
            .filter(
                training => {

                    return (
                        toLocalDateKey(
                            training.pocetak
                        ) ===
                        dateKey
                    );

                }
            )
            .sort(
                (a, b) => {

                    return (
                        new Date(
                            a.pocetak
                        ) -
                        new Date(
                            b.pocetak
                        )
                    );

                }
            );

    }



    /* =====================================================
       TERMINI U POLJU KALENDARA
    ===================================================== */

    function renderCalendarEvents(
        trainings
    ) {

        if (
            !trainings.length
        ) {

            return "";

        }


        const maximum =
            3;


        const visible =
            trainings.slice(
                0,
                maximum
            );


        const extra =
            trainings.length -
            visible.length;


        let html =
            visible
                .map(
                    training => {

                        const selection =
                            selections.find(
                                item =>
                                    item.id ===
                                    training.selekcija_id
                            );


                        const cancelled =
                            training.status ===
                            "OTKAZAN";


                        return `

                            <div
                                class="
                                    portal-calendar-event
                                    ${
                                        cancelled
                                            ? "portal-calendar-event-cancelled"
                                            : ""
                                    }
                                "
                                data-training-id="${escapeAttribute(
                                    training.id
                                )}"
                            >

                                <strong>
                                    ${escapeHtml(
                                        formatTime(
                                            training.pocetak
                                        )
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        selection?.naziv ||
                                        "СЕЛЕКЦИЈА"
                                    )}
                                </span>

                            </div>

                        `;

                    }
                )
                .join("");


        if (
            extra >
            0
        ) {

            html += `

                <div class="portal-calendar-more">
                    +${extra} још
                </div>

            `;

        }


        return html;

    }



    /* =====================================================
       KLIK NA KALENDAR
    ===================================================== */

    async function handleCalendarClick(
        event
    ) {

        const actionButton =
            event.target.closest(
                "[data-calendar-action]"
            );


        if (actionButton) {

            const action =
                actionButton.dataset
                    .calendarAction;


            if (
                action ===
                "prev"
            ) {

                calendarCursor =
                    new Date(
                        calendarCursor
                            .getFullYear(),
                        calendarCursor
                            .getMonth() -
                            1,
                        1
                    );

            }


            if (
                action ===
                "next"
            ) {

                calendarCursor =
                    new Date(
                        calendarCursor
                            .getFullYear(),
                        calendarCursor
                            .getMonth() +
                            1,
                        1
                    );

            }


            if (
                action ===
                "today"
            ) {

                const now =
                    new Date();


                calendarCursor =
                    new Date(
                        now.getFullYear(),
                        now.getMonth(),
                        1
                    );

            }


            await loadCalendarTrainings();

            renderCalendar();

            return;

        }


        const trainingEvent =
            event.target.closest(
                "[data-training-id]"
            );


        if (trainingEvent) {

            event.preventDefault();

            event.stopPropagation();


            const trainingId =
                trainingEvent.dataset
                    .trainingId;


            const training =
                calendarTrainings.find(
                    item =>
                        item.id ===
                        trainingId
                );


            if (training) {

                window.dispatchEvent(
                    new CustomEvent(
                        "portal:training-selected",
                        {
                            detail: {
                                training: {
                                    ...training
                                }
                            }
                        }
                    )
                );

            }


            return;

        }


        const dayButton =
            event.target.closest(
                "[data-calendar-day]"
            );


        if (!dayButton) {

            return;

        }


        const role =
            normalizeRole(
                currentProfile
                    ?.uloga
            );


        /*
            Igrači za sada samo vide
            raspored.

            Trener i uprava mogu
            klikom da dodaju termin.
        */

        if (
            ![
                "TRENER",
                "UPRAVA"
            ].includes(
                role
            )
        ) {

            return;

        }


        const selectedDate =
            dayButton.dataset
                .calendarDay;


        openTrainingModal(
            selectedDate
        );

    }



    /* =====================================================
       MODAL
    ===================================================== */

    function openTrainingModal(
        selectedDate = null,
        training = null
    ) {

        if (!trainingModal) {

            return;

        }


        editingTraining =
            training
                ? {
                    ...training
                }
                : null;


        trainingForm?.reset();


        setMessage(
            trainingMessage,
            "",
            ""
        );


        if (trainingConflict) {

            trainingConflict.hidden =
                true;

            trainingConflict.innerHTML =
                "";

        }


        populateTrainingSelections();


        const role =
            normalizeRole(
                currentProfile
                    ?.uloga
            );


        if (
            role ===
            "TRENER"
        ) {

            trainingSelectionField.hidden =
                true;


            trainingSelectionInput.required =
                false;


            if (
                currentProfile
                    ?.selekcija_id
            ) {

                trainingSelectionInput.innerHTML = `

                    <option
                        value="${escapeAttribute(
                            currentProfile
                                .selekcija_id
                        )}"
                    >
                        ${escapeHtml(
                            currentSelection
                                ?.naziv ||
                            "МОЈА СЕЛЕКЦИЈА"
                        )}
                    </option>

                `;


                trainingSelectionInput.value =
                    currentProfile
                        .selekcija_id;

            }

        }

        else {

            trainingSelectionField.hidden =
                false;


            trainingSelectionInput.required =
                true;

        }


        const modalTitle =
            trainingModal.querySelector(
                ".portal-modal-header h2"
            );


        if (editingTraining) {

            const startDate =
                new Date(
                    editingTraining.pocetak
                );


            const endDate =
                new Date(
                    editingTraining.kraj
                );


            if (
                role === "UPRAVA" &&
                trainingSelectionInput
            ) {

                trainingSelectionInput.value =
                    editingTraining
                        .selekcija_id ||
                    "";

            }


            trainingDateInput.value =
                formatInputDate(
                    startDate
                );


            trainingStartInput.value =
                formatInputTime(
                    startDate
                );


            trainingEndInput.value =
                formatInputTime(
                    endDate
                );


            trainingPlaceInput.value =
                editingTraining.mesto ||
                "";


            trainingNoteInput.value =
                editingTraining.napomena ||
                "";


            if (modalTitle) {

                modalTitle.textContent =
                    "Измени тренинг";

            }


            if (trainingSaveButton) {

                trainingSaveButton.textContent =
                    "САЧУВАЈ ИЗМЕНЕ";

            }

        }

        else {

            trainingDateInput.value =
                selectedDate ||
                formatInputDate(
                    new Date()
                );


            if (modalTitle) {

                modalTitle.textContent =
                    "Закажи тренинг";

            }


            if (trainingSaveButton) {

                trainingSaveButton.textContent =
                    "САЧУВАЈ ТРЕНИНГ";

            }

        }


        trainingModal.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        setTimeout(
            () => {

                trainingStartInput
                    ?.focus();

            },
            50
        );

    }



    function closeTrainingModal() {

        if (!trainingModal) {

            return;

        }


        trainingModal.hidden =
            true;


        editingTraining =
            null;


        const modalTitle =
            trainingModal.querySelector(
                ".portal-modal-header h2"
            );


        if (modalTitle) {

            modalTitle.textContent =
                "Закажи тренинг";

        }


        if (trainingSaveButton) {

            trainingSaveButton.textContent =
                "САЧУВАЈ ТРЕНИНГ";

        }


        document.body.style.overflow =
            "";

    }



    /* =====================================================
       SELECT SELEKCIJA
    ===================================================== */

    function populateTrainingSelections() {

        if (!trainingSelectionInput) {

            return;

        }


        trainingSelectionInput.innerHTML = `

            <option value="">
                Изаберите селекцију
            </option>

            ${
                selections
                    .map(
                        selection => `

                            <option
                                value="${escapeAttribute(
                                    selection.id
                                )}"
                            >
                                ${escapeHtml(
                                    selection.naziv
                                )}
                            </option>

                        `
                    )
                    .join("")
            }

        `;

    }



    /* =====================================================
       PREKLAPANJE TERMINA
    ===================================================== */

    async function checkTrainingConflict() {

        if (!trainingConflict) {

            return [];

        }


        const range =
            getTrainingFormRange();


        if (!range) {

            trainingConflict.hidden =
                true;

            trainingConflict.innerHTML =
                "";

            return [];

        }


        const dayStart =
            new Date(
                range.start
            );


        dayStart.setHours(
            0,
            0,
            0,
            0
        );


        const dayEnd =
            new Date(
                dayStart
            );


        dayEnd.setDate(
            dayEnd.getDate() +
            1
        );


        const {
            data,
            error
        } =
            await portalSb
                .from(
                    "treninzi"
                )
                .select(
                    "id,selekcija_id,pocetak,kraj,status"
                )
                .gte(
                    "pocetak",
                    dayStart.toISOString()
                )
                .lt(
                    "pocetak",
                    dayEnd.toISOString()
                );


        if (error) {

            console.error(
                "Conflict check error:",
                error
            );


            return [];

        }


        const conflicts =
            (
                Array.isArray(data)
                    ? data
                    : []
            )
                .filter(
                    training => {

                        if (
                            editingTraining?.id &&
                            training.id ===
                                editingTraining.id
                        ) {

                            return false;

                        }


                        if (
                            training.status ===
                            "OTKAZAN"
                        ) {

                            return false;

                        }


                        const start =
                            new Date(
                                training.pocetak
                            );


                        const end =
                            new Date(
                                training.kraj
                            );


                        return (
                            range.start <
                                end &&
                            range.end >
                                start
                        );

                    }
                );


        if (
            !conflicts.length
        ) {

            trainingConflict.hidden =
                true;

            trainingConflict.innerHTML =
                "";

            return [];

        }


        trainingConflict.hidden =
            false;


        trainingConflict.innerHTML = `

            <strong>
                ПАЖЊА — ПРЕКЛАПАЊЕ ТЕРМИНА
            </strong>

            <br><br>

            ${
                conflicts
                    .map(
                        training => {

                            const selection =
                                selections.find(
                                    item =>
                                        item.id ===
                                        training.selekcija_id
                                );


                            return `

                                ${escapeHtml(
                                    selection?.naziv ||
                                    "СЕЛЕКЦИЈА"
                                )}

                                —

                                ${escapeHtml(
                                    formatTime(
                                        training.pocetak
                                    )
                                )}

                                до

                                ${escapeHtml(
                                    formatTime(
                                        training.kraj
                                    )
                                )}

                            `;

                        }
                    )
                    .join("<br>")
            }

            <br><br>

            Тренинг ипак можете сачувати
            ако је истовремено коришћење
            терена могуће.

        `;


        return conflicts;

    }



    /* =====================================================
       ČUVANJE TRENINGA
    ===================================================== */

    async function saveTraining(
        event
    ) {

        event.preventDefault();


        setMessage(
            trainingMessage,
            "",
            ""
        );


        const role =
            normalizeRole(
                currentProfile
                    ?.uloga
            );


        const selectionId =
            role ===
                "TRENER"

                ? currentProfile
                    ?.selekcija_id

                : trainingSelectionInput
                    ?.value;


        const range =
            getTrainingFormRange();


        if (
            !selectionId ||
            !range
        ) {

            setMessage(
                trainingMessage,
                "Унесите селекцију, датум и време тренинга.",
                "error"
            );

            return;

        }


        const wasEditing =
            Boolean(
                editingTraining
                    ?.id
            );


        setButtonLoading(
            trainingSaveButton,
            true,
            "ЧУВАЊЕ..."
        );


        try {

            await checkTrainingConflict();


            const payload = {

                selekcija_id:
                    selectionId,

                pocetak:
                    range.start
                        .toISOString(),

                kraj:
                    range.end
                        .toISOString(),

                mesto:
                    trainingPlaceInput
                        ?.value
                        .trim() ||
                    null,

                napomena:
                    trainingNoteInput
                        ?.value
                        .trim() ||
                    null,

                status:
                    editingTraining
                        ?.status ||
                    "ZAKAZAN"

            };


            let query;


            if (wasEditing) {

                query =
                    portalSb
                        .from(
                            "treninzi"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            editingTraining.id
                        );

            }

            else {

                query =
                    portalSb
                        .from(
                            "treninzi"
                        )
                        .insert(
                            {
                                ...payload,

                                created_by:
                                    currentUser.id
                            }
                        );

            }


            const {
                error
            } =
                await query;


            if (error) {

                throw error;

            }


            setMessage(
                trainingMessage,
                wasEditing
                    ? "Измене тренинга су успешно сачуване."
                    : "Тренинг је успешно заказан.",
                "success"
            );


            calendarCursor =
                new Date(
                    range.start
                        .getFullYear(),
                    range.start
                        .getMonth(),
                    1
                );


            await Promise.all(
                [
                    loadCalendarTrainings(),
                    loadNextTraining()
                ]
            );


            renderCalendar();

            renderNextTraining();


            window.dispatchEvent(
                new CustomEvent(
                    "portal:trainings-refreshed"
                )
            );


            setTimeout(
                closeTrainingModal,
                500
            );

        }

        catch (error) {

            console.error(
                "Save training error:",
                error
            );


            setMessage(
                trainingMessage,
                getFriendlyError(
                    error
                ),
                "error"
            );

        }

        finally {

            setButtonLoading(
                trainingSaveButton,
                false,
                wasEditing
                    ? "САЧУВАЈ ИЗМЕНЕ"
                    : "САЧУВАЈ ТРЕНИНГ"
            );

        }

    }



    /* =====================================================
       FORM RANGE
    ===================================================== */

    function getTrainingFormRange() {

        const date =
            trainingDateInput
                ?.value;


        const startTime =
            trainingStartInput
                ?.value;


        const endTime =
            trainingEndInput
                ?.value;


        if (
            !date ||
            !startTime ||
            !endTime
        ) {

            return null;

        }


        const start =
            new Date(
                `${date}T${startTime}:00`
            );


        const end =
            new Date(
                `${date}T${endTime}:00`
            );


        if (
            Number.isNaN(
                start.getTime()
            ) ||
            Number.isNaN(
                end.getTime()
            ) ||
            end <= start
        ) {

            return null;

        }


        return {
            start,
            end
        };

    }



    /* =====================================================
       UI
    ===================================================== */

    function showLogin() {

        if (loginScreen) {

            loginScreen.hidden =
                false;

        }


        if (portalApp) {

            portalApp.hidden =
                true;

        }


        if (passwordInput) {

            passwordInput.value =
                "";

        }

    }



    function showPortal() {

        if (loginScreen) {

            loginScreen.hidden =
                true;

        }


        if (portalApp) {

            portalApp.hidden =
                false;

        }

    }



    function setButtonLoading(
        button,
        loading,
        text
    ) {

        if (!button) {

            return;

        }


        button.disabled =
            loading;


        button.textContent =
            text;

    }



    function setMessage(
        element,
        message,
        type
    ) {

        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.className =
            "portal-message";


        if (type) {

            element.classList.add(
                type
            );

        }

    }



    /* =====================================================
       ROLE
    ===================================================== */

    function normalizeRole(
        role
    ) {

        return String(
            role || ""
        )
            .trim()
            .toUpperCase();

    }



    /* =====================================================
       DATUM
    ===================================================== */

    function toLocalDateKey(
        value
    ) {

        return formatInputDate(
            new Date(value)
        );

    }



    function formatFullDate(
        value
    ) {

        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                weekday:
                    "long",

                day:
                    "2-digit",

                month:
                    "long"
            }
        ).format(
            new Date(value)
        );

    }



    function formatTime(
        value
    ) {

        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false
            }
        ).format(
            new Date(value)
        );

    }



    function formatInputTime(
        date
    ) {

        const hours =
            String(
                date.getHours()
            )
                .padStart(
                    2,
                    "0"
                );


        const minutes =
            String(
                date.getMinutes()
            )
                .padStart(
                    2,
                    "0"
                );


        return `${hours}:${minutes}`;

    }



    function formatInputDate(
        date
    ) {

        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() +
                1
            )
                .padStart(
                    2,
                    "0"
                );


        const day =
            String(
                date.getDate()
            )
                .padStart(
                    2,
                    "0"
                );


        return `${year}-${month}-${day}`;

    }



    /* =====================================================
       ERROR
    ===================================================== */

    function getFriendlyError(
        error
    ) {

        const message =
            String(
                error?.message ||
                ""
            )
                .toLowerCase();


        if (
            message.includes(
                "invalid login credentials"
            )
        ) {

            return "Погрешан е-маил или лозинка.";

        }


        if (
            message.includes(
                "email not confirmed"
            )
        ) {

            return "Е-маил адреса још није потврђена.";

        }


        if (
            message.includes(
                "row-level security"
            )
        ) {

            return "Немате дозволу за ову радњу.";

        }


        return (
            error?.message ||
            "Дошло је до грешке."
        );

    }



    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHtml(
        value = ""
    ) {

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }



    function escapeAttribute(
        value = ""
    ) {

        return escapeHtml(
            value
        );

    }

})();