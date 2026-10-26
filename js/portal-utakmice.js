/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   PORTAL - SLEDEĆA UTAKMICA
========================================================= */

(() => {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    const matchSb =
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

    let selections =
        [];

    let selectedSelection =
        null;

    let currentManualMatch =
        null;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializeMatches
    );


    async function initializeMatches() {

        createMatchCard();

        createMatchModal();


        const {
            data: {
                session
            }
        } =
            await matchSb.auth
                .getSession();


        if (
            session &&
            session.user
        ) {

            await openMatches(
                session.user
            );

        }


        matchSb.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    (
                        event === "SIGNED_IN" ||
                        event === "INITIAL_SESSION"
                    ) &&
                    session?.user
                ) {

                    await openMatches(
                        session.user
                    );

                }


                if (
                    event === "SIGNED_OUT"
                ) {

                    resetMatches();

                }

            }
        );

    }


    /* =====================================================
       KARTICA
    ===================================================== */

    function createMatchCard() {

        if (
            document.querySelector(
                "#portal-next-match-card"
            )
        ) {

            return;

        }


        const grid =
            document.querySelector(
                ".portal-dashboard-grid"
            );


        if (!grid) {

            return;

        }


        const card =
            document.createElement(
                "article"
            );


        card.id =
            "portal-next-match-card";


        card.className =
            "portal-dashboard-card portal-match-card";


        card.innerHTML = `

            <div class="portal-card-heading">

                <div class="portal-card-icon">

                    <svg viewBox="0 0 24 24">

                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                        />

                        <path
                            d="M8.5 8.5 12 6l3.5 2.5-1.3 4H9.8z"
                        />

                        <path
                            d="m8.5 8.5-3 .5"
                        />

                        <path
                            d="m15.5 8.5 3 .5"
                        />

                        <path
                            d="m9.8 12.5-2 4"
                        />

                        <path
                            d="m14.2 12.5 2 4"
                        />

                    </svg>

                </div>


                <div>

                    <span>
                        РАСПОРЕД
                    </span>

                    <h2>
                        СЛЕДЕЋА УТАКМИЦА
                    </h2>

                </div>

            </div>


            <div
                id="portal-match-management-selection"
                class="portal-match-management-selection"
                hidden
            >

                <label
                    for="portal-match-card-selection"
                >
                    ПРИКАЖИ СЕЛЕКЦИЈУ
                </label>

                <select
                    id="portal-match-card-selection"
                ></select>

            </div>


            <div
                id="portal-next-match-content"
                class="portal-next-match-content"
            >

                <div class="portal-loading">
                    Учитавање...
                </div>

            </div>


            <div class="portal-match-card-actions">

                <button
                    type="button"
                    id="portal-manage-match"
                    class="portal-match-edit-button"
                    hidden
                >
                    + УНЕСИ УТАКМИЦУ
                </button>

            </div>

        `;


        /*
            Stavljamo sledeću utakmicu
            odmah iza sledećeg treninga.
        */

        const firstCard =
            grid.firstElementChild;


        if (firstCard) {

            firstCard.insertAdjacentElement(
                "afterend",
                card
            );

        }

        else {

            grid.appendChild(
                card
            );

        }


        document
            .querySelector(
                "#portal-match-card-selection"
            )
            ?.addEventListener(
                "change",
                async event => {

                    selectedSelection =
                        selections.find(
                            selection =>
                                selection.id ===
                                event.target.value
                        ) ||
                        null;


                    await loadNextMatch();

                }
            );


        document
            .querySelector(
                "#portal-manage-match"
            )
            ?.addEventListener(
                "click",
                openMatchModal
            );

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function createMatchModal() {

        if (
            document.querySelector(
                "#portal-match-modal"
            )
        ) {

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "portal-match-modal";

        modal.className =
            "portal-modal";

        modal.hidden =
            true;


        modal.innerHTML = `

            <div
                class="portal-modal-backdrop"
                data-close-match-modal
            ></div>


            <div class="portal-modal-dialog">

                <div class="portal-modal-header">

                    <div>

                        <span>
                            УТАКМИЦА
                        </span>

                        <h2 id="portal-match-modal-title">
                            Унеси следећу утакмицу
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="portal-modal-close"
                        data-close-match-modal
                    >
                        ×
                    </button>

                </div>


                <form id="portal-match-form">


                    <div class="portal-form-grid">


                        <div
                            id="portal-match-selection-field"
                            class="portal-field portal-field-full"
                            hidden
                        >

                            <label
                                for="portal-match-selection"
                            >
                                СЕЛЕКЦИЈА *
                            </label>

                            <select
                                id="portal-match-selection"
                            ></select>

                        </div>


                        <div class="portal-field">

                            <label
                                for="portal-match-date"
                            >
                                ДАТУМ *
                            </label>

                            <input
                                type="date"
                                id="portal-match-date"
                                required
                            >

                        </div>


                        <div class="portal-field">

                            <label
                                for="portal-match-time"
                            >
                                ВРЕМЕ *
                            </label>

                            <input
                                type="time"
                                id="portal-match-time"
                                required
                            >

                        </div>


                        <div class="portal-field portal-field-full">

                            <label
                                for="portal-match-opponent"
                            >
                                ПРОТИВНИК *
                            </label>

                            <input
                                type="text"
                                id="portal-match-opponent"
                                placeholder="нпр. ФК Сента"
                                required
                            >

                        </div>


                        <div class="portal-field">

                            <label
                                for="portal-match-home-away"
                            >
                                ДОМАЋИН / ГОСТ *
                            </label>

                            <select
                                id="portal-match-home-away"
                                required
                            >

                                <option value="DOMACIN">
                                    ДОМАЋИН
                                </option>

                                <option value="GOST">
                                    ГОСТ
                                </option>

                            </select>

                        </div>


                        <div class="portal-field">

                            <label
                                for="portal-match-place"
                            >
                                МЕСТО
                            </label>

                            <input
                                type="text"
                                id="portal-match-place"
                                placeholder="нпр. Главни терен"
                            >

                        </div>


                        <div class="portal-field portal-field-full">

                            <label
                                for="portal-match-competition"
                            >
                                ТАКМИЧЕЊЕ
                            </label>

                            <input
                                type="text"
                                id="portal-match-competition"
                                placeholder="нпр. Лига пионира"
                            >

                        </div>


                        <div class="portal-field portal-field-full">

                            <label
                                for="portal-match-note"
                            >
                                НАПОМЕНА
                            </label>

                            <textarea
                                id="portal-match-note"
                                rows="3"
                                placeholder="Опциона напомена..."
                            ></textarea>

                        </div>

                    </div>


                    <div
                        id="portal-match-message"
                        class="portal-message"
                    ></div>


                    <div class="portal-modal-actions">

                        <button
                            type="button"
                            class="portal-secondary-button"
                            data-close-match-modal
                        >
                            ОДУСТАНИ
                        </button>


                        <button
                            type="submit"
                            id="portal-match-save"
                            class="portal-primary-button"
                        >
                            САЧУВАЈ УТАКМИЦУ
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelectorAll(
                "[data-close-match-modal]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        closeMatchModal
                    );

                }
            );


        document
            .querySelector(
                "#portal-match-form"
            )
            ?.addEventListener(
                "submit",
                saveMatch
            );

    }


    /* =====================================================
       OTVARANJE
    ===================================================== */

    async function openMatches(
        user
    ) {

        currentUser =
            user;


        const {
            data: profile,
            error
        } =
            await matchSb
                .from(
                    "portal_korisnici"
                )
                .select(
                    "user_id,ime_prezime,uloga,selekcija_id,aktivan"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Portal match profile error:",
                error
            );

            return;

        }


        if (
            !profile ||
            profile.aktivan === false
        ) {

            return;

        }


        currentProfile =
            profile;


        await loadSelections();


        setupCurrentSelection();


        await loadNextMatch();

    }


    /* =====================================================
       SELEKCIJE
    ===================================================== */

    async function loadSelections() {

        const {
            data,
            error
        } =
            await matchSb
                .from(
                    "selekcije"
                )
                .select(
                    "id,kod,naziv,redosled,aktivna"
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
                "Match selections error:",
                error
            );

            selections =
                [];

            return;

        }


        selections =
            Array.isArray(data)
                ? data
                : [];

    }


    function setupCurrentSelection() {

        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        const managementWrap =
            document.querySelector(
                "#portal-match-management-selection"
            );


        const managementSelect =
            document.querySelector(
                "#portal-match-card-selection"
            );


        if (
            role === "UPRAVA"
        ) {

            if (managementWrap) {

                managementWrap.hidden =
                    false;

            }


            if (managementSelect) {

                managementSelect.innerHTML =
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
                        .join("");

            }


            selectedSelection =
                selections.find(
                    selection =>
                        selection.kod ===
                        "prvi-tim"
                ) ||
                selections[0] ||
                null;


            if (
                managementSelect &&
                selectedSelection
            ) {

                managementSelect.value =
                    selectedSelection.id;

            }


            return;

        }


        if (managementWrap) {

            managementWrap.hidden =
                true;

        }


        selectedSelection =
            selections.find(
                selection =>
                    selection.id ===
                    currentProfile?.selekcija_id
            ) ||
            null;

    }


    /* =====================================================
       GLAVNO UČITAVANJE
    ===================================================== */

    async function loadNextMatch() {

        const container =
            document.querySelector(
                "#portal-next-match-content"
            );


        if (!container) {

            return;

        }


        currentManualMatch =
            null;


        container.innerHTML = `

            <div class="portal-loading">
                Учитавање...
            </div>

        `;


        if (!selectedSelection) {

            renderNoMatch(
                "Селекција није одређена."
            );

            updateManageButton();

            return;

        }


        if (
            selectedSelection.kod ===
            "prvi-tim"
        ) {

            await loadFirstTeamMatch();

        }

        else {

            await loadManualMatch();

        }


        updateManageButton();

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
                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const data =
                await response.json();


            const match =
                chooseNextFirstTeamMatch(
                    data
                );


            if (!match) {

                renderNoMatch(
                    "Следећа утакмица још није доступна."
                );

                return;

            }


            renderFirstTeamMatch(
                match
            );

        }

        catch (error) {

            console.error(
                "First team match error:",
                error
            );


            renderNoMatch(
                "Подаци о следећој утакмици тренутно нису доступни."
            );

        }

    }


    function chooseNextFirstTeamMatch(
        data
    ) {

        const now =
            Date.now();


        const candidates =
            [];


        if (data?.nextMatch) {

            candidates.push(
                data.nextMatch
            );

        }


        if (
            Array.isArray(
                data?.matches
            )
        ) {

            candidates.push(
                ...data.matches
            );

        }


        const future =
            candidates
                .filter(
                    match => {

                        if (
                            !match ||
                            match.status !==
                                "scheduled" ||
                            !match.startDate
                        ) {

                            return false;

                        }


                        const time =
                            new Date(
                                match.startDate
                            )
                                .getTime();


                        return (
                            !Number.isNaN(
                                time
                            ) &&
                            time >= now
                        );

                    }
                )
                .sort(
                    (a, b) =>
                        new Date(
                            a.startDate
                        ) -
                        new Date(
                            b.startDate
                        )
                );


        if (
            future.length
        ) {

            return future[0];

        }


        /*
            Ako Srbijasport još nema
            datum narednog kola, ipak
            koristimo nextMatch.
        */

        return (
            data?.nextMatch ||
            null
        );

    }


    /* =====================================================
       MLAĐE SELEKCIJE
    ===================================================== */

    async function loadManualMatch() {

        const {
            data,
            error
        } =
            await matchSb
                .from(
                    "portal_utakmice"
                )
                .select(
                    "id,selekcija_id,pocetak,protivnik,domacin_gost,mesto,takmicenje,napomena,status,created_by"
                )
                .eq(
                    "selekcija_id",
                    selectedSelection.id
                )
                .eq(
                    "status",
                    "ZAKAZANA"
                )
                .gte(
                    "pocetak",
                    new Date()
                        .toISOString()
                )
                .order(
                    "pocetak",
                    {
                        ascending:
                            true
                    }
                )
                .limit(
                    1
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Portal manual match error:",
                error
            );


            renderNoMatch(
                "Утакмица тренутно није доступна."
            );

            return;

        }


        currentManualMatch =
            data ||
            null;


        if (!data) {

            renderNoMatch(
                "Следећа утакмица још није унета."
            );

            return;

        }


        renderManualMatch(
            data
        );

    }


    /* =====================================================
       RENDER - PRVI TIM
    ===================================================== */

    function renderFirstTeamMatch(
        match
    ) {

        const container =
            document.querySelector(
                "#portal-next-match-content"
            );


        if (!container) {

            return;

        }


        const home =
            toCyrillic(
                match.home ||
                ""
            );


        const away =
            toCyrillic(
                match.away ||
                ""
            );


        const date =
            formatMatchDate(
                match.startDate
            );


        const time =
            formatMatchTime(
                match.startDate
            );


        const safeLink =
            getSafeSrbijasportLink(
                match.url
            );


        container.innerHTML = `

            <div class="portal-match-source">
                АУТОМАТСКИ · ПРВИ ТИМ
            </div>


            <div class="portal-match-date">

                ${
                    date ||
                    "ТЕРМИН НИЈЕ ОДРЕЂЕН"
                }

                ${
                    time
                        ? `<strong>${escapeHtml(time)}</strong>`
                        : ""
                }

            </div>


            <div class="portal-match-teams">

                ${renderTeam(
                    home,
                    match.home
                    
                )}


                <div class="portal-match-vs">
                    VS
                </div>


                ${renderTeam(
                    away,
                    match.away
                )}

            </div>


            ${
                match.location
                    ? `
                        <div class="portal-match-meta">
                            ${escapeHtml(
                                toCyrillic(
                                    match.location
                                )
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                safeLink
                    ? `
                        <a
                            href="${escapeAttribute(
                                safeLink
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="portal-match-source-link"
                        >
                            ДЕТАЉИ УТАКМИЦЕ →
                        </a>
                    `
                    : ""
            }

        `;

    }


    /* =====================================================
       RENDER - MLAĐE
    ===================================================== */

    function renderManualMatch(
        match
    ) {

        const container =
            document.querySelector(
                "#portal-next-match-content"
            );


        if (!container) {

            return;

        }


        const isHome =
            match.domacin_gost ===
            "DOMACIN";


        const home =
            isHome
                ? "ОБИЛИЋ"
                : match.protivnik;


        const away =
            isHome
                ? match.protivnik
                : "ОБИЛИЋ";


        container.innerHTML = `

            <div class="portal-match-source">
                ${escapeHtml(
                    selectedSelection?.naziv ||
                    ""
                )}
            </div>


            <div class="portal-match-date">

                ${escapeHtml(
                    formatMatchDate(
                        match.pocetak
                    )
                )}

                <strong>
                    ${escapeHtml(
                        formatMatchTime(
                            match.pocetak
                        )
                    )}
                </strong>

            </div>


            <div class="portal-match-teams">

                ${renderTeam(
                    home,
                    home
                )}


                <div class="portal-match-vs">
                    VS
                </div>


                ${renderTeam(
                    away,
                    away
                )}

            </div>


            ${
                match.takmicenje
                    ? `
                        <div class="portal-match-competition">
                            ${escapeHtml(
                                match.takmicenje
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                match.mesto
                    ? `
                        <div class="portal-match-meta">
                            ${escapeHtml(
                                match.mesto
                            )}
                        </div>
                    `
                    : ""
            }


            ${
                match.napomena
                    ? `
                        <div class="portal-match-note">
                            ${escapeHtml(
                                match.napomena
                            )}
                        </div>
                    `
                    : ""
            }

        `;

    }


    /* =====================================================
       TIM
    ===================================================== */

    function renderTeam(
        displayName,
        originalName
    
    ) {
        

        const logo =
            getClubLogo(
                originalName
            );


        return `

            <div class="portal-match-team">

                <div class="portal-match-logo">

                    <img
                        src="${escapeAttribute(
                            logo
                        )}"
                        alt=""
                       
onerror="
    this.onerror=null;
    this.parentElement.textContent='⚽';
"

                    >

                </div>

                <strong>
                    ${escapeHtml(
                        displayName ||
                        "—"
                    )}
                </strong>

            </div>

        `;

    }


    /* =====================================================
       BUTTON
    ===================================================== */

    function updateManageButton() {

        const button =
            document.querySelector(
                "#portal-manage-match"
            );


        if (!button) {

            return;

        }


        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        /*
            Prvi tim automatski vučemo.
            Nema ručnog unosa trenera.
        */

        if (
            !selectedSelection ||
            selectedSelection.kod ===
                "prvi-tim"
        ) {

            button.hidden =
                true;

            return;

        }


        const allowed =
            role === "TRENER" ||
            role === "UPRAVA";


        button.hidden =
            !allowed;


        if (allowed) {

            button.textContent =
                currentManualMatch
                    ? "ИЗМЕНИ УТАКМИЦУ"
                    : "+ УНЕСИ УТАКМИЦУ";

        }

    }


    /* =====================================================
       OTVARANJE MODALA
    ===================================================== */

    function openMatchModal() {

        if (!selectedSelection) {

            return;

        }


        if (
            selectedSelection.kod ===
            "prvi-tim"
        ) {

            return;

        }


        const modal =
            document.querySelector(
                "#portal-match-modal"
            );


        const form =
            document.querySelector(
                "#portal-match-form"
            );


        if (
            !modal ||
            !form
        ) {

            return;

        }


        form.reset();


        setMatchMessage(
            "",
            ""
        );


        populateMatchSelections();


        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        const selectionField =
            document.querySelector(
                "#portal-match-selection-field"
            );


        const selectionInput =
            document.querySelector(
                "#portal-match-selection"
            );


        if (
            role === "UPRAVA"
        ) {

            selectionField.hidden =
                false;


            selectionInput.required =
                true;


            selectionInput.value =
                selectedSelection.id;

        }

        else {

            selectionField.hidden =
                true;


            selectionInput.required =
                false;

        }


        const title =
            document.querySelector(
                "#portal-match-modal-title"
            );


        if (title) {

            title.textContent =
                currentManualMatch
                    ? "Измени следећу утакмицу"
                    : "Унеси следећу утакмицу";

        }


        if (
            currentManualMatch
        ) {

            const start =
                new Date(
                    currentManualMatch
                        .pocetak
                );


            document.querySelector(
                "#portal-match-date"
            ).value =
                formatInputDate(
                    start
                );


            document.querySelector(
                "#portal-match-time"
            ).value =
                formatInputTime(
                    start
                );


            document.querySelector(
                "#portal-match-opponent"
            ).value =
                currentManualMatch
                    .protivnik ||
                "";


            document.querySelector(
                "#portal-match-home-away"
            ).value =
                currentManualMatch
                    .domacin_gost ||
                "DOMACIN";


            document.querySelector(
                "#portal-match-place"
            ).value =
                currentManualMatch
                    .mesto ||
                "";


            document.querySelector(
                "#portal-match-competition"
            ).value =
                currentManualMatch
                    .takmicenje ||
                "";


            document.querySelector(
                "#portal-match-note"
            ).value =
                currentManualMatch
                    .napomena ||
                "";

        }

        else {

            const tomorrow =
                new Date();


            tomorrow.setDate(
                tomorrow.getDate() +
                1
            );


            document.querySelector(
                "#portal-match-date"
            ).value =
                formatInputDate(
                    tomorrow
                );

        }


        modal.hidden =
            false;


        document.body.style.overflow =
            "hidden";

    }


    function closeMatchModal() {

        const modal =
            document.querySelector(
                "#portal-match-modal"
            );


        if (modal) {

            modal.hidden =
                true;

        }


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       SELEKCIJE U MODALU
    ===================================================== */

    function populateMatchSelections() {

        const select =
            document.querySelector(
                "#portal-match-selection"
            );


        if (!select) {

            return;

        }


        /*
            Ne nudimo prvi tim za ručni unos.
        */

        const manualSelections =
            selections.filter(
                selection =>
                    selection.kod !==
                    "prvi-tim"
            );


        select.innerHTML =
            manualSelections
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
                .join("");

    }


    /* =====================================================
       ČUVANJE
    ===================================================== */

    async function saveMatch(
        event
    ) {

        event.preventDefault();


        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        const selectionId =
            role === "UPRAVA"

                ? document
                    .querySelector(
                        "#portal-match-selection"
                    )
                    ?.value

                : currentProfile
                    ?.selekcija_id;


        const selection =
            selections.find(
                item =>
                    item.id ===
                    selectionId
            );


        if (
            !selectionId ||
            !selection
        ) {

            setMatchMessage(
                "Изаберите селекцију.",
                "error"
            );

            return;

        }


        if (
            selection.kod ===
            "prvi-tim"
        ) {

            setMatchMessage(
                "Први тим се аутоматски ажурира.",
                "error"
            );

            return;

        }


        const date =
            document.querySelector(
                "#portal-match-date"
            )?.value;


        const time =
            document.querySelector(
                "#portal-match-time"
            )?.value;


        const opponent =
            document.querySelector(
                "#portal-match-opponent"
            )?.value
                .trim();


        const homeAway =
            document.querySelector(
                "#portal-match-home-away"
            )?.value;


        if (
            !date ||
            !time ||
            !opponent ||
            !homeAway
        ) {

            setMatchMessage(
                "Унесите датум, време, противника и домаћин/гост.",
                "error"
            );

            return;

        }


        const start =
            new Date(
                `${date}T${time}:00`
            );


        if (
            Number.isNaN(
                start.getTime()
            )
        ) {

            setMatchMessage(
                "Неисправан датум или време.",
                "error"
            );

            return;

        }


        const button =
            document.querySelector(
                "#portal-match-save"
            );


        setButtonLoading(
            button,
            true,
            "ЧУВАЊЕ..."
        );


        const payload = {

            selekcija_id:
                selectionId,

            pocetak:
                start.toISOString(),

            protivnik:
                opponent,

            domacin_gost:
                homeAway,

            mesto:
                document
                    .querySelector(
                        "#portal-match-place"
                    )
                    ?.value
                    .trim() ||
                null,

            takmicenje:
                document
                    .querySelector(
                        "#portal-match-competition"
                    )
                    ?.value
                    .trim() ||
                null,

            napomena:
                document
                    .querySelector(
                        "#portal-match-note"
                    )
                    ?.value
                    .trim() ||
                null,

            status:
                "ZAKAZANA",

            created_by:
                currentUser.id

        };


        try {

            let error =
                null;


            if (
                currentManualMatch &&
                currentManualMatch
                    .selekcija_id ===
                    selectionId
            ) {

                const result =
                    await matchSb
                        .from(
                            "portal_utakmice"
                        )
                        .update(
                            payload
                        )
                        .eq(
                            "id",
                            currentManualMatch.id
                        );


                error =
                    result.error;

            }

            else {

                const result =
                    await matchSb
                        .from(
                            "portal_utakmice"
                        )
                        .insert(
                            payload
                        );


                error =
                    result.error;

            }


            if (error) {

                throw error;

            }


            setMatchMessage(
                "Утакмица је успешно сачувана.",
                "success"
            );


            selectedSelection =
                selection;


            const cardSelect =
                document.querySelector(
                    "#portal-match-card-selection"
                );


            if (
                cardSelect &&
                role === "UPRAVA"
            ) {

                cardSelect.value =
                    selection.id;

            }


            await loadNextMatch();


            setTimeout(
                closeMatchModal,
                450
            );

        }

        catch (error) {

            console.error(
                "Save match error:",
                error
            );


            setMatchMessage(
                error?.message ||
                "Утакмица није сачувана.",
                "error"
            );

        }

        finally {

            setButtonLoading(
                button,
                false,
                "САЧУВАЈ УТАКМИЦУ"
            );

        }

    }


    /* =====================================================
       EMPTY
    ===================================================== */

    function renderNoMatch(
        message
    ) {

        const container =
            document.querySelector(
                "#portal-next-match-content"
            );


        if (!container) {

            return;

        }


        container.innerHTML = `

            <div class="portal-match-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <strong>
                    НЕМА ЗАКАЗАНЕ УТАКМИЦЕ
                </strong>

                <p>
                    ${escapeHtml(
                        message
                    )}
                </p>

            </div>

        `;

    }


    /* =====================================================
       LOGO
    ===================================================== */

    function getClubLogo(
        name = ""
    ) {

        const normalized =
            normalizeText(
                name
            );

    // Automatski grb FK Obilic
    // Radi za domacina i gosta

    if (
        [
            "obilic",
            "fk obilic",
            "обилић",
            "фк обилић"
        ].includes(normalized)
    ) {
        return "images/grb.png";
    }


        const logos = {

            "obilic":
                "images/grbovi/obilic.webp",

            "potisje":
                "images/grbovi/potisje.webp",

            "dj﻿ala 1922":
                "images/grbovi/djala-1922.webp",

            "dj﻿ala":
                "images/grbovi/djala-1922.webp",

            "horgos 1911":
                "images/grbovi/horgos-1911.webp",

            "backa":
                "images/grbovi/backa.webp",

            "jedinstvo sk":
                "images/grbovi/jedinstvo-sk.webp",

            "slavija":
                "images/grbovi/slavija.webp",

            "sloga o":
                "images/grbovi/sloga-o.webp",

            "sampion":
                "images/grbovi/sampion.webp",

            "tisa":
                "images/grbovi/tisa.webp",

            "jadran":
                "images/grbovi/jadran.webp",

            "tromedja":
                "images/grbovi/tromedja.webp",

            "jedinstvo m":
                "images/grbovi/jedinstvo-m.webp"

        };


        return (
            logos[
                normalized
            ] ||
            "images/grbovi/default.webp"
        );

    }


    function normalizeText(
        value = ""
    ) {

        return String(value)
            .toLowerCase()
            .trim()
            .replaceAll("č", "c")
            .replaceAll("ć", "c")
            .replaceAll("š", "s")
            .replaceAll("ž", "z")
            .replaceAll("đ", "dj")
            .replace(/[()]/g, "")
            .replace(/\s+/g, " ");

    }


    /* =====================================================
       LATINICA -> ĆIRILICA
    ===================================================== */

    function toCyrillic(
        text = ""
    ) {

        const map = {

            "Dž": "Џ",
            "Lj": "Љ",
            "Nj": "Њ",

            "dž": "џ",
            "lj": "љ",
            "nj": "њ",

            "A": "А",
            "B": "Б",
            "C": "Ц",
            "Č": "Ч",
            "Ć": "Ћ",
            "D": "Д",
            "Đ": "Ђ",
            "E": "Е",
            "F": "Ф",
            "G": "Г",
            "H": "Х",
            "I": "И",
            "J": "Ј",
            "K": "К",
            "L": "Л",
            "M": "М",
            "N": "Н",
            "O": "О",
            "P": "П",
            "R": "Р",
            "S": "С",
            "Š": "Ш",
            "T": "Т",
            "U": "У",
            "V": "В",
            "Z": "З",
            "Ž": "Ж",

            "a": "а",
            "b": "б",
            "c": "ц",
            "č": "ч",
            "ć": "ћ",
            "d": "д",
            "đ": "ђ",
            "e": "е",
            "f": "ф",
            "g": "г",
            "h": "х",
            "i": "и",
            "j": "ј",
            "k": "к",
            "l": "л",
            "m": "м",
            "n": "н",
            "o": "о",
            "p": "п",
            "r": "р",
            "s": "с",
            "š": "ш",
            "t": "т",
            "u": "у",
            "v": "в",
            "z": "з",
            "ž": "ж"

        };


        return String(text)
            .replace(
                /Dž|Lj|Nj|dž|lj|nj/g,
                match =>
                    map[match]
            )
            .split("")
            .map(
                character =>
                    map[character] ??
                    character
            )
            .join("");

    }


    /* =====================================================
       DATUM
    ===================================================== */

    function formatMatchDate(
        value
    ) {

        if (!value) {

            return "";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                weekday:
                    "short",

                day:
                    "2-digit",

                month:
                    "long",

                year:
                    "numeric",

                timeZone:
                    "Europe/Belgrade"
            }
        )
            .format(date);

    }


    function formatMatchTime(
        value
    ) {

        if (!value) {

            return "";

        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    false,

                timeZone:
                    "Europe/Belgrade"
            }
        )
            .format(date);

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


    /* =====================================================
       LINK
    ===================================================== */

    function getSafeSrbijasportLink(
        value
    ) {

        if (!value) {

            return "";

        }


        try {

            const url =
                new URL(value);


            if (
                url.protocol ===
                    "https:" &&
                (
                    url.hostname ===
                        "srbijasport.net" ||
                    url.hostname.endsWith(
                        ".srbijasport.net"
                    )
                )
            ) {

                return url.href;

            }

        }

        catch (error) {

            return "";

        }


        return "";

    }


    /* =====================================================
       UI
    ===================================================== */

    function setMatchMessage(
        message,
        type
    ) {

        const element =
            document.querySelector(
                "#portal-match-message"
            );


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


    function normalizeRole(
        role
    ) {

        return String(
            role ||
            ""
        )
            .trim()
            .toUpperCase();

    }


    function resetMatches() {

        currentUser =
            null;

        currentProfile =
            null;

        selections =
            [];

        selectedSelection =
            null;

        currentManualMatch =
            null;

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