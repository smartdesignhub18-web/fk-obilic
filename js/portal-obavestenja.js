/* =========================================================
   FK OBILIĆ
   PORTAL - OBAVEŠTENJA
========================================================= */

(() => {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    const notificationSb =
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

    let notifications =
        [];

    let readIds =
        new Set();

    let currentOpenedNotification =
        null;

    let currentEditingNotification =
        null;

    let notificationRefreshTimer =
        null;

    let notificationRefreshInProgress =
        false;



    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializeNotifications
    );


    async function initializeNotifications() {

        createNotificationModal();

        createComposeModal();

        setupNotificationEvents();


        const {
            data: {
                session
            }
        } =
            await notificationSb.auth
                .getSession();


        if (session?.user) {

            await openNotifications(
                session.user
            );

        }


        notificationSb.auth
            .onAuthStateChange(
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

                        await openNotifications(
                            session.user
                        );

                    }


                    if (
                        event === "SIGNED_OUT"
                    ) {

                        resetNotifications();

                    }

                }
            );

    }



    /* =====================================================
       GLAVNI EVENTS
    ===================================================== */

    function setupNotificationEvents() {

        const button =
            document.querySelector(
                "#portal-notifications-button"
            );


        const dropdown =
            document.querySelector(
                "#portal-notifications-dropdown"
            );


        button?.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                refreshNotifications();


                const open =
                    !dropdown.hidden;


                dropdown.hidden =
                    open;


                button.setAttribute(
                    "aria-expanded",
                    String(!open)
                );

            }
        );


        document.addEventListener(
            "click",
            event => {

                const wrapper =
                    document.querySelector(
                        ".portal-notifications"
                    );


                if (
                    wrapper &&
                    !wrapper.contains(
                        event.target
                    )
                ) {

                    closeDropdown();

                }

            }
        );


        window.addEventListener(
            "focus",
            () => {

                if (currentUser) {

                    refreshNotifications();

                }

            }
        );


        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    currentUser &&
                    !document.hidden
                ) {

                    refreshNotifications();

                }

            }
        );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    closeDropdown();

                    closeNotificationModal();

                    closeComposeModal();

                }

            }
        );

    }



    /* =====================================================
       OTVARANJE
    ===================================================== */

    async function openNotifications(
        user
    ) {

        currentUser =
            user;


        await loadProfile();

        await loadSelections();


        currentSelection =
            selections.find(
                selection =>
                    selection.id ===
                    currentProfile?.selekcija_id
            ) ||
            null;


        setupCreateButton();


        await refreshNotifications();


        startNotificationAutoRefresh();

    }



    async function refreshNotifications() {

        if (
            !currentUser ||
            notificationRefreshInProgress
        ) {

            return;

        }


        notificationRefreshInProgress =
            true;


        try {

            await Promise.all([
                loadNotifications(),
                loadReadNotifications()
            ]);


            renderNotifications();

        }

        finally {

            notificationRefreshInProgress =
                false;

        }

    }


    function startNotificationAutoRefresh() {

        stopNotificationAutoRefresh();


        notificationRefreshTimer =
            window.setInterval(
                () => {

                    if (
                        currentUser &&
                        !document.hidden
                    ) {

                        refreshNotifications();

                    }

                },
                8000
            );

    }


    function stopNotificationAutoRefresh() {

        if (!notificationRefreshTimer) {

            return;

        }


        window.clearInterval(
            notificationRefreshTimer
        );


        notificationRefreshTimer =
            null;

    }



    /* =====================================================
       PROFIL
    ===================================================== */

    async function loadProfile() {

        const {
            data,
            error
        } =
            await notificationSb
                .from(
                    "portal_korisnici"
                )
                .select(
                    "user_id,ime_prezime,uloga,selekcija_id,aktivan"
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Notification profile error:",
                error
            );


            currentProfile =
                null;

            return;

        }


        currentProfile =
            data ||
            null;

    }



    /* =====================================================
       SELEKCIJE
    ===================================================== */

    async function loadSelections() {

        const {
            data,
            error
        } =
            await notificationSb
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
                "Notification selections error:",
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



    /* =====================================================
       UČITAVANJE OBAVEŠTENJA
    ===================================================== */

    async function loadNotifications() {

        const {
            data,
            error
        } =
            await notificationSb
                .from(
                    "portal_obavestenja"
                )
                .select(
                    "id,naslov,sadrzaj,selekcija_id,created_at,updated_at,aktivno,created_by,trening_id,utakmica_id,utakmica_kljuc"
                )
                .eq(
                    "aktivno",
                    true
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    50
                );


        if (error) {

            console.error(
                "Notifications error:",
                error
            );


            notifications =
                [];

            return;

        }


        notifications =
            Array.isArray(data)
                ? data
                : [];

    }



    async function loadReadNotifications() {

        if (!currentUser) {

            return;

        }


        const {
            data,
            error
        } =
            await notificationSb
                .from(
                    "portal_obavestenja_procitano"
                )
                .select(
                    "obavestenje_id"
                )
                .eq(
                    "user_id",
                    currentUser.id
                );


        if (error) {

            console.error(
                "Read notifications error:",
                error
            );


            readIds =
                new Set();

            return;

        }


        readIds =
            new Set(
                (
                    Array.isArray(data)
                        ? data
                        : []
                )
                    .map(
                        item =>
                            item.obavestenje_id
                    )
            );

    }



    /* =====================================================
       NOVO OBAVEŠTENJE +
    ===================================================== */

    function setupCreateButton() {

        const header =
            document.querySelector(
                ".portal-notifications-dropdown-header"
            );


        if (!header) {

            return;

        }


        let button =
            document.querySelector(
                "#portal-new-notification-button"
            );


        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        const allowed =
            role === "TRENER" ||
            role === "UPRAVA";


        if (!allowed) {

            button?.remove();

            return;

        }


        if (button) {

            return;

        }


        button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.id =
            "portal-new-notification-button";


        button.className =
            "portal-new-notification-button";


        button.setAttribute(
            "aria-label",
            "Ново обавештење"
        );


        button.innerHTML = `

            <svg viewBox="0 0 24 24">

                <path d="M12 5v14"></path>

                <path d="M5 12h14"></path>

            </svg>

        `;


        header.appendChild(
            button
        );


        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                currentEditingNotification =
                    null;


                openComposeModal();

            }
        );

    }



    /* =====================================================
       RENDER DROPDOWN
    ===================================================== */

    function renderNotifications() {

        const list =
            document.querySelector(
                "#portal-notifications-list"
            );


        const count =
            document.querySelector(
                "#portal-notifications-count"
            );


        if (
            !list ||
            !count
        ) {

            return;

        }


        const unread =
            notifications.filter(
                item =>
                    !readIds.has(
                        item.id
                    )
            );


        if (
            unread.length
        ) {

            count.hidden =
                false;


            count.textContent =
                unread.length > 99
                    ? "99+"
                    : unread.length;

        }

        else {

            count.hidden =
                true;


            count.textContent =
                "0";

        }


        if (
            !notifications.length
        ) {

            list.innerHTML = `

                <div class="portal-notifications-empty">

                    <svg viewBox="0 0 24 24">

                        <path
                            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                        ></path>

                        <path
                            d="M10 21h4"
                        ></path>

                    </svg>


                    <strong>
                        НЕМА ОБАВЕШТЕЊА
                    </strong>


                    <span>
                        Нова обавештења ће се појавити овде.
                    </span>

                </div>

            `;

            return;

        }


        list.innerHTML =
            notifications
                .slice(
                    0,
                    12
                )
                .map(
                    notification => {

                        const unread =
                            !readIds.has(
                                notification.id
                            );


                        const selection =
                            notification.selekcija_id

                                ? selections.find(
                                    item =>
                                        item.id ===
                                        notification.selekcija_id
                                )

                                : null;


                        return `

                            <button
                                type="button"
                                class="
                                    portal-notification-item
                                    ${
                                        unread
                                            ? "unread"
                                            : ""
                                    }
                                "
                                data-notification-id="${escapeAttribute(
                                    notification.id
                                )}"
                            >

                                <span
                                    class="portal-notification-dot"
                                ></span>


                                <span
                                    class="portal-notification-item-content"
                                >

                                    <span
                                        class="portal-notification-target"
                                    >

                                        ${
                                            selection
                                                ? escapeHtml(
                                                    selection.naziv
                                                )
                                                : "ЦЕО КЛУБ"
                                        }

                                    </span>


                                    <strong>

                                        ${escapeHtml(
                                            notification.naslov
                                        )}

                                    </strong>


                                    <span
                                        class="portal-notification-preview"
                                    >

                                        ${escapeHtml(
                                            notification.sadrzaj
                                        )}

                                    </span>


                                    <small>

                                        ${escapeHtml(
                                            formatDate(
                                                notification.created_at
                                            )
                                        )}

                                    </small>

                                </span>

                            </button>

                        `;

                    }
                )
                .join("");


        list
            .querySelectorAll(
                "[data-notification-id]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const id =
                                button.dataset
                                    .notificationId;


                            const notification =
                                notifications.find(
                                    item =>
                                        item.id ===
                                        id
                                );


                            if (!notification) {

                                return;

                            }


                            await markAsRead(
                                notification
                            );


                            openNotificationModal(
                                notification
                            );

                        }
                    );

                }
            );

    }



    /* =====================================================
       PROČITANO
    ===================================================== */

    async function markAsRead(
        notification
    ) {

        if (
            !currentUser ||
            readIds.has(
                notification.id
            )
        ) {

            closeDropdown();

            return;

        }


        const {
            error
        } =
            await notificationSb
                .from(
                    "portal_obavestenja_procitano"
                )
                .upsert(
                    {
                        obavestenje_id:
                            notification.id,

                        user_id:
                            currentUser.id,

                        procitano_at:
                            new Date()
                                .toISOString()
                    },
                    {
                        onConflict:
                            "obavestenje_id,user_id"
                    }
                );


        if (error) {

            console.error(
                "Mark notification read error:",
                error
            );

        }

        else {

            readIds.add(
                notification.id
            );


            renderNotifications();

        }


        closeDropdown();

    }



    /* =====================================================
       DA LI SME DA MENJA?
    ===================================================== */

    function canManageNotification(
        notification
    ) {

        if (
            !notification ||
            !currentProfile ||
            !currentUser
        ) {

            return false;

        }


        const role =
            normalizeRole(
                currentProfile.uloga
            );


        if (
            role === "UPRAVA"
        ) {

            return true;

        }


        if (
            role === "TRENER"
        ) {

            return (
                notification.created_by ===
                    currentUser.id

                &&

                notification.selekcija_id ===
                    currentProfile.selekcija_id
            );

        }


        return false;

    }



    /* =====================================================
       MODAL - CELO OBAVEŠTENJE
    ===================================================== */

    function createNotificationModal() {

        if (
            document.querySelector(
                "#portal-notification-modal"
            )
        ) {

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "portal-notification-modal";


        modal.className =
            "portal-modal portal-notification-modal";


        modal.hidden =
            true;


        modal.innerHTML = `

            <div
                class="portal-modal-backdrop"
                data-close-notification
            ></div>


            <div
                class="portal-modal-dialog portal-notification-dialog"
            >

                <div class="portal-modal-header">

                    <div>

                        <span>
                            ОБАВЕШТЕЊЕ
                        </span>

                        <h2
                            id="portal-notification-title"
                        ></h2>

                    </div>


                    <button
                        type="button"
                        class="portal-modal-close"
                        data-close-notification
                    >
                        ×
                    </button>

                </div>


                <div class="portal-notification-full">


                    <div
                        id="portal-notification-target-full"
                        class="portal-notification-full-target"
                    ></div>


                    <div
                        id="portal-notification-date"
                        class="portal-notification-full-date"
                    ></div>


                    <div
                        id="portal-notification-body"
                        class="portal-notification-body"
                    ></div>


                    <div
                        id="portal-notification-attendance-action"
                        class="portal-notification-attendance-action"
                    ></div>


                    <div
                        id="portal-notification-management"
                        class="portal-notification-management"
                        hidden
                    >

                        <button
                            type="button"
                            id="portal-notification-edit"
                            class="portal-secondary-button"
                        >
                            ИЗМЕНИ
                        </button>


                        <button
                            type="button"
                            id="portal-notification-delete"
                            class="portal-notification-delete-button"
                        >
                            ОБРИШИ
                        </button>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelectorAll(
                "[data-close-notification]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        closeNotificationModal
                    );

                }
            );


        document
            .querySelector(
                "#portal-notification-edit"
            )
            ?.addEventListener(
                "click",
                editOpenedNotification
            );


        document
            .querySelector(
                "#portal-notification-delete"
            )
            ?.addEventListener(
                "click",
                deleteOpenedNotification
            );

    }



    function openNotificationModal(
        notification
    ) {

        currentOpenedNotification =
            notification;


        const modal =
            document.querySelector(
                "#portal-notification-modal"
            );


        const title =
            document.querySelector(
                "#portal-notification-title"
            );


        const body =
            document.querySelector(
                "#portal-notification-body"
            );


        const date =
            document.querySelector(
                "#portal-notification-date"
            );


        const target =
            document.querySelector(
                "#portal-notification-target-full"
            );


        const management =
            document.querySelector(
                "#portal-notification-management"
            );


        if (
            !modal ||
            !title ||
            !body ||
            !date
        ) {

            return;

        }


        const selection =
            notification.selekcija_id

                ? selections.find(
                    item =>
                        item.id ===
                        notification.selekcija_id
                )

                : null;


        title.textContent =
            notification.naslov;


        body.textContent =
            notification.sadrzaj;


        date.textContent =
            formatDate(
                notification.created_at,
                true
            );


        if (target) {

            target.textContent =
                selection
                    ? selection.naziv
                    : "ЦЕО КЛУБ";

        }


        if (management) {

            management.hidden =
                !canManageNotification(
                    notification
                );

        }


        renderNotificationAttendanceAction(
            notification
        );


        modal.hidden =
            false;


        document.body.style.overflow =
            "hidden";

    }



    async function renderNotificationAttendanceAction(
        notification
    ) {

        const container =
            document.querySelector(
                "#portal-notification-attendance-action"
            );


        if (!container) {

            return;

        }


        container.innerHTML =
            "";


        const role =
            normalizeRole(
                currentProfile
                    ?.uloga
            );


        if (
            role !== "IGRAČ" ||
            !currentUser ||
            !currentProfile
                ?.selekcija_id
        ) {

            return;

        }


        if (
            notification.selekcija_id &&
            notification.selekcija_id !==
                currentProfile
                    .selekcija_id
        ) {

            return;

        }


        if (notification.trening_id) {

            await renderTrainingAttendanceFromNotification(
                notification,
                container
            );

            return;

        }


        if (
            notification.utakmica_id ||
            notification.utakmica_kljuc
        ) {

            await renderMatchAttendanceFromNotification(
                notification,
                container
            );

        }

    }



    async function renderTrainingAttendanceFromNotification(
        notification,
        container
    ) {

        const {
            data: training,
            error: trainingError
        } =
            await notificationSb
                .from(
                    "treninzi"
                )
                .select(
                    "id,selekcija_id,pocetak,kraj,mesto,status"
                )
                .eq(
                    "id",
                    notification.trening_id
                )
                .maybeSingle();


        if (
            trainingError ||
            !training
        ) {

            console.error(
                "Notification training load error:",
                trainingError
            );

            return;

        }


        if (
            training.selekcija_id !==
                currentProfile
                    .selekcija_id
        ) {

            return;

        }


        if (
            training.status !==
                "ZAKAZAN" ||
            new Date(
                training.pocetak
            ) <=
                new Date()
        ) {

            container.innerHTML = `

                <div class="portal-attendance-error">
                    Потврда доласка за овај тренинг више није доступна.
                </div>

            `;

            return;

        }


        const {
            data: attendance,
            error
        } =
            await notificationSb
                .from(
                    "portal_prisustvo_trening"
                )
                .select(
                    "status"
                )
                .eq(
                    "trening_id",
                    training.id
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Notification training attendance error:",
                error
            );

            return;

        }


        renderNotificationAttendanceButtons(
            container,
            {
                type:
                    "training",

                status:
                    attendance?.status ||
                    null,

                title:
                    "ДОЛАЗАК НА ТРЕНИНГ",

                meta:
                    `${formatDate(
                        training.pocetak,
                        true
                    )}${training.mesto
                        ? ` · ${training.mesto}`
                        : ""}`,

                save:
                    status =>
                        saveNotificationTrainingAttendance(
                            notification,
                            training,
                            status,
                            container
                        )
            }
        );

    }



    async function saveNotificationTrainingAttendance(
        notification,
        training,
        status,
        container
    ) {

        const {
            error
        } =
            await notificationSb
                .from(
                    "portal_prisustvo_trening"
                )
                .upsert(
                    {
                        trening_id:
                            training.id,

                        user_id:
                            currentUser.id,

                        status
                    },
                    {
                        onConflict:
                            "trening_id,user_id"
                    }
                );


        if (error) {

            console.error(
                "Notification save training attendance error:",
                error
            );

            setNotificationAttendanceMessage(
                container,
                error?.message ||
                    "Одговор није сачуван.",
                true
            );

            return;

        }


        await renderTrainingAttendanceFromNotification(
            notification,
            container
        );

    }



    async function renderMatchAttendanceFromNotification(
        notification,
        container
    ) {

        let match =
            null;


        let matchKey =
            notification.utakmica_kljuc ||
            null;


        if (notification.utakmica_id) {

            const {
                data,
                error
            } =
                await notificationSb
                    .from(
                        "portal_utakmice"
                    )
                    .select(
                        "id,selekcija_id,pocetak,protivnik,domacin_gost,mesto,status"
                    )
                    .eq(
                        "id",
                        notification.utakmica_id
                    )
                    .maybeSingle();


            if (error) {

                console.error(
                    "Notification match load error:",
                    error
                );

                return;

            }


            match =
                data ||
                null;


            if (match) {

                matchKey =
                    matchKey ||
                    `portal:${match.id}`;

            }

        }


        const selectionId =
            match?.selekcija_id ||
            notification.selekcija_id;


        if (
            !matchKey ||
            !selectionId ||
            selectionId !==
                currentProfile
                    .selekcija_id
        ) {

            return;

        }


        if (
            match &&
            (
                match.status !==
                    "ZAKAZANA" ||
                new Date(
                    match.pocetak
                ) <=
                    new Date()
            )
        ) {

            container.innerHTML = `

                <div class="portal-attendance-error">
                    Потврда доласка за ову утакмицу више није доступна.
                </div>

            `;

            return;

        }


        const {
            data: attendance,
            error
        } =
            await notificationSb
                .from(
                    "portal_prisustvo_utakmica"
                )
                .select(
                    "status"
                )
                .eq(
                    "utakmica_kljuc",
                    matchKey
                )
                .eq(
                    "user_id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Notification match attendance error:",
                error
            );

            return;

        }


        const opponent =
            match?.protivnik
                ? ` · ${match.protivnik}`
                : "";


        const meta =
            match?.pocetak
                ? `${formatDate(
                    match.pocetak,
                    true
                )}${opponent}`
                : "Потврдите долазак на утакмицу.";


        renderNotificationAttendanceButtons(
            container,
            {
                type:
                    "match",

                status:
                    attendance?.status ||
                    null,

                title:
                    "ДОЛАЗАК НА УТАКМИЦУ",

                meta,

                save:
                    status =>
                        saveNotificationMatchAttendance(
                            notification,
                            matchKey,
                            selectionId,
                            status,
                            container
                        )
            }
        );

    }



   
async function saveNotificationMatchAttendance(
    notification,
    matchKey,
    selectionId,
    status,
    container
) {
    if (
        !currentUser?.id ||
        !matchKey ||
        !selectionId ||
        !["DOLAZIM", "NE_DOLAZIM"].includes(status)
    ) {
        return;
    }

    const userId = currentUser.id;

    const odgovor = status === "DOLAZIM"
        ? "ДОЛАЗИМ"
        : "НЕ ДОЛАЗИМ";

    const potvrda = window.confirm(
        "ПОТВРДА ДОЛАСКА НА УТАКМИЦУ\n\n" +
        (notification.sadrzaj || matchKey) +
        "\n\nВаш одговор: " + odgovor +
        "\n\nДа ли потврђујете?"
    );

    if (!potvrda) return;

    if (
        currentUser?.id !== userId ||
        currentProfile?.selekcija_id !== selectionId
    ) {
        window.alert(
            "Подаци о кориснику или селекцији су промењени. Покушајте поново."
        );
        return;
    }

    const { error } = await notificationSb
        .from("portal_prisustvo_utakmica")
        .upsert(
            {
                utakmica_kljuc: matchKey,
                selekcija_id: selectionId,
                user_id: userId,
                status: status
            },
            {
                onConflict: "utakmica_kljuc,user_id"
            }
        );

    if (error) {
        console.error(
            "Notification save match attendance error:",
            error
        );

        setNotificationAttendanceMessage(
            container,
            error.message || "Одговор није сачуван.",
            true
        );

        return;
    }

    await renderMatchAttendanceFromNotification(
        notification,
        container
    );
}




    function renderNotificationAttendanceButtons(
        container,
        options
    ) {

        container.innerHTML = `

            <div
                class="portal-attendance-player"
                style="margin-top:18px;"
            >

                <div class="portal-attendance-heading">

                    <span>
                        ПОТВРДА
                    </span>

                    <strong>
                        ${escapeHtml(
                            options.title
                        )}
                    </strong>

                </div>


                <div
                    class="portal-attendance-training-info"
                    style="margin-bottom:14px;"
                >
                    ${escapeHtml(
                        options.meta ||
                        ""
                    )}
                </div>


                <div class="portal-attendance-buttons">

                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-yes
                            ${
                                options.status ===
                                    "DOLAZIM"
                                    ? "active"
                                    : ""
                            }
                        "
                        data-notification-attendance="DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">✓</span>
                        <span>ДОЛАЗИМ</span>
                    </button>


                    <button
                        type="button"
                        class="
                            portal-attendance-button
                            portal-attendance-no
                            ${
                                options.status ===
                                    "NE_DOLAZIM"
                                    ? "active"
                                    : ""
                            }
                        "
                        data-notification-attendance="NE_DOLAZIM"
                    >
                        <span class="portal-attendance-button-icon">×</span>
                        <span>НЕ ДОЛАЗИМ</span>
                    </button>

                </div>


                <div
                    class="portal-attendance-player-message"
                    data-notification-attendance-message
                >
                    ${
                        options.status ===
                            "DOLAZIM"
                            ? "Потврдили сте да долазите."
                            : options.status ===
                                "NE_DOLAZIM"
                                ? "Потврдили сте да не долазите."
                                : "Изаберите да ли долазите."
                    }
                </div>

            </div>

        `;


        container
            .querySelectorAll(
                "[data-notification-attendance]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        async () => {

                            const buttons =
                                container.querySelectorAll(
                                    "[data-notification-attendance]"
                                );


                            buttons.forEach(
                                item => {

                                    item.disabled =
                                        true;

                                }
                            );


                            setNotificationAttendanceMessage(
                                container,
                                "Чување одговора...",
                                false
                            );


                            await options.save(
                                button.dataset
                                    .notificationAttendance
                            );

                        }
                    );

                }
            );

    }



    function setNotificationAttendanceMessage(
        container,
        message,
        error = false
    ) {

        const element =
            container.querySelector(
                "[data-notification-attendance-message]"
            );


        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.classList.toggle(
            "error",
            Boolean(error)
        );

    }



    function closeNotificationModal() {

        const modal =
            document.querySelector(
                "#portal-notification-modal"
            );


        if (modal) {

            modal.hidden =
                true;

        }


        currentOpenedNotification =
            null;


        document.body.style.overflow =
            "";

    }



    /* =====================================================
       IZMENA OTVORENOG
    ===================================================== */

    async function editOpenedNotification() {

    const notification =
        currentOpenedNotification;


    if (
        !notification ||
        !canManageNotification(
            notification
        )
    ) {

        return;

    }


    /*
        AUTOMATSKO OBAVEŠTENJE ZA TRENING

        Ne menjamo tekst obaveštenja.
        Otvaramo pravi trening.
    */

    if (
        notification.trening_id
    ) {

        const {
            data: training,
            error
        } =
            await notificationSb
                .from(
                    "treninzi"
                )
                .select(
                    "id,selekcija_id,pocetak,kraj,mesto,napomena,status"
                )
                .eq(
                    "id",
                    notification.trening_id
                )
                .maybeSingle();


        if (
            error ||
            !training
        ) {

            console.error(
                "Notification training edit error:",
                error
            );


            window.alert(
                "Тренинг није могуће учитати."
            );

            return;

        }


        closeNotificationModal();


        window.dispatchEvent(
            new CustomEvent(
                "portal:edit-training",
                {
                    detail: {
                        training: {
                            ...training
                        }
                    }
                }
            )
        );


        return;

    }


    /*
        AUTOMATSKO OBAVEŠTENJE ZA UTAKMICU

        Ne dozvoljavamo da se samo promeni
        tekst automatskog obaveštenja.
    */

    if (
        notification.utakmica_id ||
        notification.utakmica_kljuc
    ) {

        window.alert(
            "Аутоматско обавештење за утакмицу се не мења као текст. Измените саму утакмицу."
        );

        return;

    }


    /*
        RUČNO OBAVEŠTENJE

        Ovde ostaje stari sistem:
        trener/uprava menjaju tekst.
    */

    currentEditingNotification =
        notification;


    const modal =
        document.querySelector(
            "#portal-notification-modal"
        );


    if (modal) {

        modal.hidden =
            true;

    }


    openComposeModal(
        currentEditingNotification
    );

}



    /* =====================================================
       BRISANJE
    ===================================================== */

    async function deleteOpenedNotification() {

        const notification =
            currentOpenedNotification;


        if (
            !notification ||
            !canManageNotification(
                notification
            )
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                "Да ли сте сигурни да желите да обришете ово обавештење?"
            );


        if (!confirmed) {

            return;

        }


        const button =
            document.querySelector(
                "#portal-notification-delete"
            );


        setButtonLoading(
            button,
            true,
            "БРИСАЊЕ..."
        );


        try {

            const {
                error
            } =
                await notificationSb
                    .from(
                        "portal_obavestenja"
                    )
                    .delete()
                    .eq(
                        "id",
                        notification.id
                    );


            if (error) {

                throw error;

            }


            closeNotificationModal();


            await refreshNotifications();

        }

        catch (error) {

            console.error(
                "Delete notification error:",
                error
            );


            alert(
                error?.message ||
                "Обавештење није обрисано."
            );

        }

        finally {

            setButtonLoading(
                button,
                false,
                "ОБРИШИ"
            );

        }

    }



    /* =====================================================
       MODAL - NOVO / IZMENA
    ===================================================== */

    function createComposeModal() {

        if (
            document.querySelector(
                "#portal-compose-notification-modal"
            )
        ) {

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "portal-compose-notification-modal";


        modal.className =
            "portal-modal";


        modal.hidden =
            true;


        modal.innerHTML = `

            <div
                class="portal-modal-backdrop"
                data-close-compose-notification
            ></div>


            <div class="portal-modal-dialog">

                <div class="portal-modal-header">

                    <div>

                        <span>
                            ПОРТАЛ КЛУБА
                        </span>

                        <h2
                            id="portal-compose-notification-title"
                        >
                            Ново обавештење
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="portal-modal-close"
                        data-close-compose-notification
                    >
                        ×
                    </button>

                </div>


                <form
                    id="portal-compose-notification-form"
                >

                    <div class="portal-form-grid">


                        <div
                            id="portal-notification-selection-field"
                            class="portal-field portal-field-full"
                        >

                            <label
                                for="portal-notification-selection"
                            >
                                КОМЕ СЕ ШАЉЕ
                            </label>


                            <select
                                id="portal-notification-selection"
                            ></select>

                        </div>


                        <div
                            class="portal-field portal-field-full"
                        >

                            <label
                                for="portal-notification-subject"
                            >
                                НАСЛОВ *
                            </label>


                            <input
                                type="text"
                                id="portal-notification-subject"
                                maxlength="120"
                                placeholder="нпр. Промена термина тренинга"
                                required
                            >

                        </div>


                        <div
                            class="portal-field portal-field-full"
                        >

                            <label
                                for="portal-notification-message"
                            >
                                ОБАВЕШТЕЊЕ *
                            </label>


                            <textarea
                                id="portal-notification-message"
                                rows="8"
                                maxlength="3000"
                                placeholder="Унесите текст обавештења..."
                                required
                            ></textarea>

                        </div>

                    </div>


                    <div
                        id="portal-compose-notification-message"
                        class="portal-message"
                    ></div>


                    <div class="portal-modal-actions">

                        <button
                            type="button"
                            class="portal-secondary-button"
                            data-close-compose-notification
                        >
                            ОДУСТАНИ
                        </button>


                        <button
                            type="submit"
                            id="portal-notification-send"
                            class="portal-primary-button"
                        >
                            ПОШАЉИ ОБАВЕШТЕЊЕ
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
                "[data-close-compose-notification]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        closeComposeModal
                    );

                }
            );


        document
            .querySelector(
                "#portal-compose-notification-form"
            )
            ?.addEventListener(
                "submit",
                saveNotification
            );

    }



    /* =====================================================
       OTVORI FORMU
    ===================================================== */

    function openComposeModal(
        notification = null
    ) {

        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        if (
            role !== "TRENER" &&
            role !== "UPRAVA"
        ) {

            return;

        }


        closeDropdown();


        currentEditingNotification =
            notification ||
            null;


        const modal =
            document.querySelector(
                "#portal-compose-notification-modal"
            );


        const form =
            document.querySelector(
                "#portal-compose-notification-form"
            );


        const title =
            document.querySelector(
                "#portal-compose-notification-title"
            );


        const selectionField =
            document.querySelector(
                "#portal-notification-selection-field"
            );


        const selectionInput =
            document.querySelector(
                "#portal-notification-selection"
            );


        const subjectInput =
            document.querySelector(
                "#portal-notification-subject"
            );


        const messageInput =
            document.querySelector(
                "#portal-notification-message"
            );


        form?.reset();


        setComposeMessage(
            "",
            ""
        );


        if (title) {

            title.textContent =
                currentEditingNotification
                    ? "Измени обавештење"
                    : "Ново обавештење";

        }


        /* =================================================
           UPRAVA
        ================================================= */

        if (
            role === "UPRAVA"
        ) {

            selectionField.hidden =
                false;


            selectionInput.disabled =
                false;


            selectionInput.innerHTML = `

                <option value="">
                    ЦЕО КЛУБ
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


            if (
                currentEditingNotification
            ) {

                selectionInput.value =
                    currentEditingNotification
                        .selekcija_id ||
                    "";

            }

        }


        /* =================================================
           TRENER
        ================================================= */

        if (
            role === "TRENER"
        ) {

            selectionField.hidden =
                false;


            selectionInput.innerHTML = `

                <option
                    value="${escapeAttribute(
                        currentProfile?.selekcija_id ||
                        ""
                    )}"
                >
                    ${escapeHtml(
                        currentSelection?.naziv ||
                        "МОЈА СЕЛЕКЦИЈА"
                    )}
                </option>

            `;


            selectionInput.value =
                currentProfile?.selekcija_id ||
                "";


            selectionInput.disabled =
                true;

        }


        /* =================================================
           IZMENA - POPUNI PODATKE
        ================================================= */

        if (
            currentEditingNotification
        ) {

            subjectInput.value =
                currentEditingNotification
                    .naslov ||
                "";


            messageInput.value =
                currentEditingNotification
                    .sadrzaj ||
                "";

        }


        const sendButton =
            document.querySelector(
                "#portal-notification-send"
            );


        if (sendButton) {

            sendButton.textContent =
                currentEditingNotification
                    ? "САЧУВАЈ ИЗМЕНЕ"
                    : "ПОШАЉИ ОБАВЕШТЕЊЕ";

        }


        modal.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        setTimeout(
            () => {

                subjectInput?.focus();

            },
            50
        );

    }



    function closeComposeModal() {

        const modal =
            document.querySelector(
                "#portal-compose-notification-modal"
            );


        const selectionInput =
            document.querySelector(
                "#portal-notification-selection"
            );


        if (selectionInput) {

            selectionInput.disabled =
                false;

        }


        if (modal) {

            modal.hidden =
                true;

        }


        currentEditingNotification =
            null;


        document.body.style.overflow =
            "";

    }



    /* =====================================================
       NOVO / UPDATE
    ===================================================== */

    async function saveNotification(
        event
    ) {

        event.preventDefault();


        const role =
            normalizeRole(
                currentProfile?.uloga
            );


        const subject =
            document
                .querySelector(
                    "#portal-notification-subject"
                )
                ?.value
                .trim();


        const message =
            document
                .querySelector(
                    "#portal-notification-message"
                )
                ?.value
                .trim();


        let selectionId =
            null;


        if (
            role === "TRENER"
        ) {

            selectionId =
                currentProfile
                    ?.selekcija_id ||
                null;

        }


        if (
            role === "UPRAVA"
        ) {

            selectionId =
                document
                    .querySelector(
                        "#portal-notification-selection"
                    )
                    ?.value ||
                null;

        }


        if (
            !subject ||
            !message
        ) {

            setComposeMessage(
                "Унесите наслов и текст обавештења.",
                "error"
            );

            return;

        }


        if (
            role === "TRENER" &&
            !selectionId
        ) {

            setComposeMessage(
                "Тренер није повезан са селекцијом.",
                "error"
            );

            return;

        }


        const button =
            document.querySelector(
                "#portal-notification-send"
            );


        setButtonLoading(
            button,
            true,
            currentEditingNotification
                ? "ЧУВАЊЕ..."
                : "СЛАЊЕ..."
        );


        try {

            /* =============================================
               IZMENA
            ============================================= */

            if (
                currentEditingNotification
            ) {

                const {
                    error
                } =
                    await notificationSb
                        .from(
                            "portal_obavestenja"
                        )
                        .update(
                            {
                                naslov:
                                    subject,

                                sadrzaj:
                                    message,

                                selekcija_id:
                                    selectionId
                            }
                        )
                        .eq(
                            "id",
                            currentEditingNotification.id
                        );


                if (error) {

                    throw error;

                }


                setComposeMessage(
                    "Обавештење је успешно измењено.",
                    "success"
                );

            }


            /* =============================================
               NOVO
            ============================================= */

            else {

                const {
                    data,
                    error
                } =
                    await notificationSb
                        .from(
                            "portal_obavestenja"
                        )
                        .insert(
                            {
                                naslov:
                                    subject,

                                sadrzaj:
                                    message,

                                selekcija_id:
                                    selectionId,

                                created_by:
                                    currentUser.id,

                                aktivno:
                                    true
                            }
                        )
                        .select(
                            "id"
                        )
                        .single();


                if (error) {

                    throw error;

                }


                /*
                    Pošiljalac ne treba da dobije
                    crveni broj za obaveštenje
                    koje je upravo sam poslao.
                */

                if (
                    data?.id
                ) {

                    await notificationSb
                        .from(
                            "portal_obavestenja_procitano"
                        )
                        .upsert(
                            {
                                obavestenje_id:
                                    data.id,

                                user_id:
                                    currentUser.id,

                                procitano_at:
                                    new Date()
                                        .toISOString()
                            },
                            {
                                onConflict:
                                    "obavestenje_id,user_id"
                            }
                        );

                }


                setComposeMessage(
                    "Обавештење је успешно послато.",
                    "success"
                );

            }


            await refreshNotifications();


            setTimeout(
                () => {

                    closeComposeModal();

                    closeNotificationModal();

                },
                450
            );

        }

        catch (error) {

            console.error(
                "Save notification error:",
                error
            );


            setComposeMessage(
                error?.message ||
                "Обавештење није сачувано.",
                "error"
            );

        }

        finally {

            setButtonLoading(
                button,
                false,
                currentEditingNotification
                    ? "САЧУВАЈ ИЗМЕНЕ"
                    : "ПОШАЉИ ОБАВЕШТЕЊЕ"
            );

        }

    }



    /* =====================================================
       PORUKA FORME
    ===================================================== */

    function setComposeMessage(
        message,
        type
    ) {

        const element =
            document.querySelector(
                "#portal-compose-notification-message"
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



    /* =====================================================
       DROPDOWN
    ===================================================== */

    function closeDropdown() {

        const dropdown =
            document.querySelector(
                "#portal-notifications-dropdown"
            );


        const button =
            document.querySelector(
                "#portal-notifications-button"
            );


        if (dropdown) {

            dropdown.hidden =
                true;

        }


        button?.setAttribute(
            "aria-expanded",
            "false"
        );

    }



    /* =====================================================
       RESET
    ===================================================== */

    function resetNotifications() {

        stopNotificationAutoRefresh();


        currentUser =
            null;

        currentProfile =
            null;

        currentSelection =
            null;

        currentOpenedNotification =
            null;

        currentEditingNotification =
            null;

        selections =
            [];

        notifications =
            [];

        readIds =
            new Set();


        renderNotifications();

        closeDropdown();

    }



    /* =====================================================
       DATUM
    ===================================================== */

    function formatDate(
        value,
        full = false
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
            full
                ? {
                    day:
                        "2-digit",

                    month:
                        "long",

                    year:
                        "numeric",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    timeZone:
                        "Europe/Belgrade"
                }
                : {
                    day:
                        "2-digit",

                    month:
                        "short",

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    timeZone:
                        "Europe/Belgrade"
                }
        ).format(date);

    }



    /* =====================================================
       ROLE
    ===================================================== */

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

/* =====================================================
   FK OBILIC
   OZNACI SVA OBAVESTENJA KAO PROCITANA
===================================================== */

function setupMarkAllReadButton() {

    const header = document.querySelector(
        ".portal-notifications-dropdown-header"
    );

    if (!header) return;

    if (
        document.getElementById(
            "portal-mark-all-read"
        )
    ) {
        return;
    }

    const button =
        document.createElement("button");

    button.type = "button";
    button.id = "portal-mark-all-read";

    button.textContent =
        "ОЗНАЧИ СВЕ КАО ПРОЧИТАНО";

    button.style.cssText = `
        border: 1px solid #d8d8dc;
        background: #f4f4f5;
        color: #333;
        border-radius: 8px;
        padding: 9px 11px;
        font-size: 10px;
        line-height: 1.4;
        font-weight: 800;
        cursor: pointer;
        margin-left: auto;
        max-width: 165px;
    `;

    header.appendChild(button);

    button.addEventListener(
        "click",
        async event => {

            event.preventDefault();
            event.stopPropagation();

            if (
                !currentUser ||
                button.disabled
            ) {
                return;
            }

            const userId = currentUser.id;

            button.disabled = true;

            button.textContent =
                "ОЗНАЧАВАЊЕ...";

            try {

                /*
                   Citamo sva aktivna obavestenja
                   koja trenutni korisnik sme
                   da vidi.

                   Ucitavamo u stranicama da
                   ne zavisimo od limita 50.
                */

                const allIds = [];

                const pageSize = 200;

                for (
                    let offset = 0;
                    ;
                    offset += pageSize
                ) {

                    const {
                        data,
                        error
                    } = await notificationSb
                        .from("portal_obavestenja")
                        .select("id")
                        .eq("aktivno", true)
                        .order("created_at", {
                            ascending: false
                        })
                        .range(
                            offset,
                            offset + pageSize - 1
                        );

                    if (error) {
                        throw error;
                    }

                    const rows = data || [];

                    allIds.push(
                        ...rows.map(row => row.id)
                    );

                    if (
                        rows.length < pageSize
                    ) {
                        break;
                    }
                }

                const unreadIds = allIds.filter(
                    id => !readIds.has(id)
                );

                if (!unreadIds.length) {

                    window.alert(
                        "Сва обавештења су већ прочитана."
                    );

                    return;
                }

                /*
                   Upisujemo samo za prijavljenog
                   korisnika.

                   Ne menjamo obavestenja
                   drugih igraca.
                */

                const now =
                    new Date().toISOString();

                for (
                    let i = 0;
                    i < unreadIds.length;
                    i += 100
                ) {

                    const batch = unreadIds
                        .slice(i, i + 100)
                        .map(id => ({
                            obavestenje_id: id,
                            user_id: userId,
                            procitano_at: now
                        }));

                    const {
                        error
                    } = await notificationSb
                        .from(
                            "portal_obavestenja_procitano"
                        )
                        .upsert(batch, {
                            onConflict:
                                "obavestenje_id,user_id"
                        });

                    if (error) {
                        throw error;
                    }
                }

                /*
                   Osvezavamo broj neprocitanih
                   bez ponovnog ucitavanja
                   cele stranice.
                */

                if (
                    currentUser?.id === userId
                ) {

                    unreadIds.forEach(id => {
                        readIds.add(id);
                    });

                    renderNotifications();

                }

            } catch (error) {

                console.error(
                    "Mark all notifications:",
                    error
                );

                window.alert(
                    "Није успело означавање: " +
                    (error.message || "грешка")
                );

                /*
                   Ponovo citamo stanje baze
                   ako je deo upisa vec uspeo.
                */

                await refreshNotifications();

            } finally {

                button.disabled = false;

                button.textContent =
                    "ОЗНАЧИ СВЕ КАО ПРОЧИТАНО";

            }

        }
    );

}


/* Pokretanje dugmeta */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        setupMarkAllReadButton
    );

} else {

    setupMarkAllReadButton();

}

})();