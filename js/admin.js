const SUPABASE_URL = "https://uvevthgxlnzzkapkjxky.supabase.co";
const SUPABASE_KEY = "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";

const NEWS_BUCKET = "vesti";
const PLAYERS_BUCKET = "igraci";
const STAFF_BUCKET = "strucni-stab";
const MANAGEMENT_BUCKET = "uprava";
const SELECTIONS_BUCKET = "selekcije";

const sb = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let adminSelections = [];

const loginScreen =
    document.querySelector(
        "#admin-login-screen"
    );

const adminPanel =
    document.querySelector(
        "#admin-panel"
    );

const loginForm =
    document.querySelector(
        "#admin-login-form"
    );

const emailInput =
    document.querySelector(
        "#admin-email"
    );

const passwordInput =
    document.querySelector(
        "#admin-password"
    );

const loginMessage =
    document.querySelector(
        "#admin-login-message"
    );

const logoutButton =
    document.querySelector(
        "#admin-logout-button"
    );

const adminUserEmail =
    document.querySelector(
        "#admin-user-email"
    );

const adminPageTitle =
    document.querySelector(
        "#admin-page-title"
    );


document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);


async function initializeAdmin() {

    setupNavigation();
    setupNewsAdmin();
    setupPlayersAdmin();
    setupStaffAdmin();
    setupManagementAdmin();
    setupSelectionsAdmin();

    const {
        data: {
            session
        }
    } =
        await sb.auth.getSession();

    if (
        session &&
        session.user
    ) {

        await openAdminPanel(
            session.user
        );

    }

    else {

        showLoginScreen();

    }

}


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();

            setLoginMessage(
                "",
                ""
            );

            const email =
                emailInput?.value
                    .trim();

            const password =
                passwordInput?.value;

            if (
                !email ||
                !password
            ) {

                setLoginMessage(
                    "Унесите е-маил и лозинку.",
                    "error"
                );

                return;

            }

            const submitButton =
                loginForm.querySelector(
                    'button[type="submit"]'
                );

            if (submitButton) {

                submitButton.disabled =
                    true;

            }

            try {

                const {
                    data,
                    error
                } =
                    await sb.auth
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

                const isAdmin =
                    await checkAdminMembership(
                        data.user.id
                    );

                if (!isAdmin) {

                    await sb.auth
                        .signOut();

                    throw new Error(
                        "Овај налог нема приступ админ панелу."
                    );

                }

                await openAdminPanel(
                    data.user
                );

            }

            catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                setLoginMessage(
                    getFriendlyError(
                        error,
                        "Пријава није успела."
                    ),
                    "error"
                );

            }

            finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                }

            }

        }
    );

}


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            await sb.auth
                .signOut();

            showLoginScreen();

        }
    );

}


async function checkAdminMembership(
    userId
) {

    const {
        data,
        error
    } =
        await sb
            .from(
                "admin_users"
            )
            .select(
                "user_id"
            )
            .eq(
                "user_id",
                userId
            )
            .maybeSingle();

    if (error) {

        console.error(
            "Admin membership error:",
            error
        );

        return false;

    }

    return Boolean(
        data
    );

}


async function openAdminPanel(
    user
) {

    const isAdmin =
        await checkAdminMembership(
            user.id
        );

    if (!isAdmin) {

        await sb.auth
            .signOut();

        showLoginScreen();

        return;

    }

    if (loginScreen) {

        loginScreen.hidden =
            true;

    }

    if (adminPanel) {

        adminPanel.hidden =
            false;

    }

    if (adminUserEmail) {

        adminUserEmail.textContent =
            user.email ||
            "Администратор";

    }

    await loadAdminSelectionOptions();

    await Promise.allSettled(
        [
            loadDashboardStats(),
            loadAdminNews(),
            loadAdminPlayers(),
            loadAdminStaff(),
            loadAdminManagement(),
            loadAdminSelections()
        ]
    );

}


function showLoginScreen() {

    if (loginScreen) {

        loginScreen.hidden =
            false;

    }

    if (adminPanel) {

        adminPanel.hidden =
            true;

    }

    if (passwordInput) {

        passwordInput.value =
            "";

    }

}


function setupNavigation() {

    const navButtons =
        document.querySelectorAll(
            "[data-admin-page]"
        );

    const pages =
        document.querySelectorAll(
            ".admin-page"
        );

    navButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const pageName =
                        button.dataset
                            .adminPage;

                    navButtons.forEach(
                        item => {

                            item.classList
                                .remove(
                                    "active"
                                );

                        }
                    );

                    button.classList
                        .add(
                            "active"
                        );

                    pages.forEach(
                        page => {

                            page.classList
                                .toggle(
                                    "active",
                                    page.dataset.page ===
                                        pageName
                                );

                        }
                    );

                    if (adminPageTitle) {

                        adminPageTitle.textContent =
                            getAdminPageTitle(
                                pageName
                            );

                    }

                    if (
                        pageName ===
                        "vesti"
                    ) {

                        loadAdminNews();

                    }

                    if (
                        pageName ===
                        "igraci"
                    ) {

                        loadAdminPlayers();

                    }

                    if (
                        pageName ===
                        "strucni-stab"
                    ) {

                        loadAdminStaff();

                    }

                    if (
                        pageName ===
                        "uprava"
                    ) {

                        loadAdminManagement();

                    }

                    if (
                        pageName ===
                        "selekcije"
                    ) {

                        loadAdminSelections();

                    }

                }
            );

        }
    );

}


function getAdminPageTitle(
    pageName
) {

    const titles = {

        dashboard:
            "Контролна табла",

        vesti:
            "Вести",

        igraci:
            "Играчи",

        "strucni-stab":
            "Стручни штаб",

        uprava:
            "Управа",

        selekcije:
            "Селекције",

        galerija:
            "Галерија",

        partneri:
            "Партнери",

        kontakt:
            "Контакт"

    };

    return (
        titles[pageName] ||
        "Админ панел"
    );

}


async function loadDashboardStats() {

    await Promise.allSettled(
        [
            loadNewsCount(),
            loadPlayersCount(),
            loadGalleryCount(),
            loadPartnersCount()
        ]
    );

}


async function loadNewsCount() {

    const element =
        document.querySelector(
            "#admin-stat-news"
        );

    if (!element) {

        return;

    }

    const {
        count,
        error
    } =
        await sb
            .from(
                "vesti"
            )
            .select(
                "*",
                {
                    count:
                        "exact",

                    head:
                        true
                }
            )
            .eq(
                "published",
                true
            );

    element.textContent =
        error
            ? "—"
            : String(
                count ?? 0
            );

}


async function loadPlayersCount() {

    const element =
        document.querySelector(
            "#admin-stat-players"
        );

    if (!element) {

        return;

    }

    const {
        count,
        error
    } =
        await sb
            .from(
                "igraci"
            )
            .select(
                "*",
                {
                    count:
                        "exact",

                    head:
                        true
                }
            )
            .eq(
                "aktivan",
                true
            );

    element.textContent =
        error
            ? "—"
            : String(
                count ?? 0
            );

}

async function loadGalleryCount() {

    const element =
        document.querySelector(
            "#admin-stat-gallery"
        );


    if (!element) {
        return;
    }


    const {
        count,
        error
    } =
        await sb
            .from(
                "galerija"
            )
            .select(
                "*",
                {
                    count:
                        "exact",

                    head:
                        true
                }
            )
            .eq(
                "aktivna",
                true
            );


    element.textContent =
        error
            ? "—"
            : String(
                count ?? 0
            );

}



async function loadPartnersCount() {

    const element =
        document.querySelector(
            "#admin-stat-partners"
        );


    if (!element) {
        return;
    }


    const {
        count,
        error
    } =
        await sb
            .from(
                "partneri"
            )
            .select(
                "*",
                {
                    count:
                        "exact",

                    head:
                        true
                }
            )
            .eq(
                "aktivan",
                true
            );


    element.textContent =
        error
            ? "—"
            : String(
                count ?? 0
            );

}


async function loadJsonCount(
    url,
    key,
    selector
) {

    const element =
        document.querySelector(
            selector
        );

    if (!element) {

        return;

    }

    try {

        const response =
            await fetch(
                url,
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

        const value =
            Array.isArray(
                data
            )

                ? data.length

                : Array.isArray(
                    data?.[key]
                )

                    ? data[key].length

                    : 0;

        element.textContent =
            String(
                value
            );

    }

    catch {

        element.textContent =
            "—";

    }

}


/* =========================================================
   SELEKCIJE ZA IGRAČE I STRUČNI ŠTAB
========================================================= */

async function loadAdminSelectionOptions() {

    const {
        data,
        error
    } =
        await sb
            .from(
                "selekcije"
            )
            .select(
                "id,kod,naziv,redosled,aktivna"
            )
            .order(
                "redosled",
                {
                    ascending:
                        true
                }
            )
            .order(
                "naziv",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        console.error(
            "Selection options load error:",
            error
        );

        return;

    }

    adminSelections =
        Array.isArray(
            data
        )
            ? data
            : [];

    populateAdminSelectionSelect(
        playerSelectionInput
    );

    populateAdminSelectionSelect(
        staffSelectionInput
    );

}


function populateAdminSelectionSelect(
    selectElement,
    selectedValue = ""
) {

    if (!selectElement) {

        return;

    }

    const currentValue =
        selectedValue ||
        selectElement.value ||
        "";

    if (
        !adminSelections.length
    ) {

        if (currentValue) {

            const exists =
                Array.from(
                    selectElement.options
                )
                    .some(
                        option =>
                            option.value ===
                            currentValue
                    );

            if (exists) {

                selectElement.value =
                    currentValue;

            }

        }

        return;

    }

    const existingNames =
        adminSelections.map(
            selection =>
                selection.naziv
        );

    let html =
        "";

    if (
        currentValue &&
        !existingNames.includes(
            currentValue
        )
    ) {

        html += `

            <option
                value="${escapeAttribute(currentValue)}"
            >
                ${escapeHtml(currentValue)}
            </option>

        `;

    }

    html +=
        adminSelections
            .map(
                selection => {

                    const inactive =
                        selection.aktivna ===
                        false;

                    return `

                        <option
                            value="${escapeAttribute(selection.naziv || "")}"
                            ${inactive ? "disabled" : ""}
                        >
                            ${escapeHtml(selection.naziv || "")}${inactive ? " — НЕАКТИВНА" : ""}
                        </option>

                    `;

                }
            )
            .join("");

    selectElement.innerHTML =
        html;

    const targetValue =
        currentValue ||
        getDefaultAdminSelectionName();

    if (!targetValue) {

        return;

    }

    const optionExists =
        Array.from(
            selectElement.options
        )
            .some(
                option =>
                    option.value ===
                    targetValue
            );

    if (optionExists) {

        selectElement.value =
            targetValue;

    }

}


function getDefaultAdminSelectionName() {

    const firstTeam =
        adminSelections.find(
            selection =>
                selection.kod ===
                    "prvi-tim" &&
                selection.aktivna !==
                    false
        );

    if (firstTeam) {

        return firstTeam.naziv;

    }

    const firstActive =
        adminSelections.find(
            selection =>
                selection.aktivna !==
                    false
        );

    return (
        firstActive?.naziv ||
        "ПРВИ ТИМ"
    );

}


function getAdminSelectionOrder(
    selectionName
) {

    const index =
        adminSelections.findIndex(
            selection =>
                selection.naziv ===
                selectionName
        );

    return index === -1
        ? 999
        : index + 1;

}


/* =========================================================
   VESTI
========================================================= */

const addNewsButton =
    document.querySelector(
        "#admin-add-news"
    );

const newsList =
    document.querySelector(
        "#admin-news-list"
    );

const newsModal =
    document.querySelector(
        "#admin-news-modal"
    );

const newsForm =
    document.querySelector(
        "#admin-news-form"
    );

const newsModalTitle =
    document.querySelector(
        "#admin-news-modal-title"
    );

const newsIdInput =
    document.querySelector(
        "#admin-news-id"
    );

const newsCurrentImage =
    document.querySelector(
        "#admin-news-current-image"
    );

const newsTitleInput =
    document.querySelector(
        "#admin-news-title"
    );

const newsCategoryInput =
    document.querySelector(
        "#admin-news-category"
    );

const newsDateInput =
    document.querySelector(
        "#admin-news-date"
    );

const newsExcerptInput =
    document.querySelector(
        "#admin-news-excerpt"
    );

const newsContentInput =
    document.querySelector(
        "#admin-news-content"
    );

const newsImageInput =
    document.querySelector(
        "#admin-news-image"
    );

const newsImagePreview =
    document.querySelector(
        "#admin-news-image-preview img"
    );

const newsImageName =
    document.querySelector(
        "#admin-news-image-name"
    );

const newsSourceName =
    document.querySelector(
        "#admin-news-source-name"
    );

const newsSourceUrl =
    document.querySelector(
        "#admin-news-source-url"
    );

const newsHasMatch =
    document.querySelector(
        "#admin-news-has-match"
    );

const newsMatchFields =
    document.querySelector(
        "#admin-news-match-fields"
    );

const newsHome =
    document.querySelector(
        "#admin-news-home"
    );

const newsAway =
    document.querySelector(
        "#admin-news-away"
    );

const newsHomeScore =
    document.querySelector(
        "#admin-news-home-score"
    );

const newsAwayScore =
    document.querySelector(
        "#admin-news-away-score"
    );

const newsFeatured =
    document.querySelector(
        "#admin-news-featured"
    );

const newsPublished =
    document.querySelector(
        "#admin-news-published"
    );

const newsFormMessage =
    document.querySelector(
        "#admin-news-form-message"
    );

const newsSaveButton =
    document.querySelector(
        "#admin-news-save-button"
    );


function setupNewsAdmin() {

    if (addNewsButton) {

        addNewsButton.addEventListener(
            "click",
            () => {

                openNewsModal();

            }
        );

    }

    document
        .querySelectorAll(
            "[data-close-news-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeNewsModal
                );

            }
        );

    if (newsHasMatch) {

        newsHasMatch.addEventListener(
            "change",
            updateMatchFieldsVisibility
        );

    }

    if (newsImageInput) {

        newsImageInput.addEventListener(
            "change",
            previewNewsImage
        );

    }

    if (newsForm) {

        newsForm.addEventListener(
            "submit",
            saveNews
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                newsModal &&
                !newsModal.hidden
            ) {

                closeNewsModal();

            }

        }
    );

}


async function loadAdminNews() {

    if (!newsList) {

        return;

    }

    newsList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање вести...
        </div>

    `;

    const {
        data,
        error
    } =
        await sb
            .from(
                "vesti"
            )
            .select(
                "id,slug,title,category,date,date_display,image,excerpt,content,match_data,source,featured,published,created_at"
            )
            .order(
                "date",
                {
                    ascending:
                        false
                }
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );

    if (error) {

        console.error(
            "News load error:",
            error
        );

        newsList.innerHTML = `

            <div class="admin-list-loading">
                Грешка при учитавању вести.
            </div>

        `;

        return;

    }

    if (
        !Array.isArray(
            data
        ) ||
        data.length ===
            0
    ) {

        newsList.innerHTML = `

            <div class="admin-list-loading">
                Још нема вести.
            </div>

        `;

        return;

    }

    newsList.innerHTML =
        data
            .map(
                article =>
                    renderAdminNewsItem(
                        article
                    )
            )
            .join("");

    newsList
        .querySelectorAll(
            "[data-edit-news]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editNews;

                        const article =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (article) {

                            openNewsModal(
                                article
                            );

                        }

                    }
                );

            }
        );

    newsList
        .querySelectorAll(
            "[data-delete-news]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deleteNews;

                        const article =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (article) {

                            deleteNews(
                                article
                            );

                        }

                    }
                );

            }
        );

}


function renderAdminNewsItem(
    article
) {

    const image =
        article.image ||
        "images/grb.png";

    const date =
        article.date_display ||
        formatDateDisplay(
            article.date
        );

    return `

        <article class="admin-news-item">

            <div class="admin-news-image">

                <img
                    src="${escapeAttribute(image)}"
                    alt=""
                    onerror="this.onerror=null;this.src='images/grb.png';"
                >

            </div>

            <div class="admin-news-info">

                <span class="admin-news-date">
                    ${escapeHtml(date)}
                </span>

                <strong>
                    ${escapeHtml(article.title || "")}
                </strong>

                <div class="admin-news-status">

                    <span>
                        ${escapeHtml(article.category || "ВЕСТ")}
                    </span>

                    <span>
                        ${
                            article.published
                                ? "ОБЈАВЉЕНО"
                                : "СКРИВЕНО"
                        }
                    </span>

                    ${
                        article.featured
                            ? "<span>ИСТАКНУТО</span>"
                            : ""
                    }

                </div>

            </div>

            <div class="admin-news-actions">

                <button
                    type="button"
                    data-edit-news="${escapeAttribute(article.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    data-delete-news="${escapeAttribute(article.id)}"
                >
                    ОБРИШИ
                </button>

            </div>

        </article>

    `;

}


function openNewsModal(
    article = null
) {

    if (
        !newsModal ||
        !newsForm
    ) {

        return;

    }

    resetNewsForm();

    if (article) {

        if (newsModalTitle) {

            newsModalTitle.textContent =
                "Измени вест";

        }

        newsIdInput.value =
            article.id ||
            "";

        newsCurrentImage.value =
            article.image ||
            "";

        newsTitleInput.value =
            article.title ||
            "";

        newsCategoryInput.value =
            article.category ||
            "ВЕСТ";

        newsDateInput.value =
            article.date ||
            "";

        newsExcerptInput.value =
            article.excerpt ||
            "";

        newsContentInput.value =
            Array.isArray(
                article.content
            )

                ? article.content
                    .join(
                        "\n\n"
                    )

                : article.content ||
                    "";

        if (article.image) {

            newsImagePreview.src =
                article.image;

        }

        const source =
            article.source &&
            typeof article.source ===
                "object"

                ? article.source

                : {};

        newsSourceName.value =
            source.name ||
            "";

        newsSourceUrl.value =
            source.url ||
            "";

        if (
            article.match_data &&
            typeof article.match_data ===
                "object"
        ) {

            newsHasMatch.checked =
                true;

            newsHome.value =
                article.match_data.home ||
                "";

            newsAway.value =
                article.match_data.away ||
                "";

            newsHomeScore.value =
                article.match_data
                    .homeScore ??
                "";

            newsAwayScore.value =
                article.match_data
                    .awayScore ??
                "";

        }

        newsFeatured.checked =
            article.featured ===
            true;

        newsPublished.checked =
            article.published !==
            false;

    }

    else {

        if (newsModalTitle) {

            newsModalTitle.textContent =
                "Додај вест";

        }

        if (newsDateInput) {

            newsDateInput.value =
                getTodayInputValue();

        }

    }

    updateMatchFieldsVisibility();

    newsModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

}


function closeNewsModal() {

    if (!newsModal) {

        return;

    }

    newsModal.hidden =
        true;

    document.body.style.overflow =
        "";

}


function resetNewsForm() {

    if (!newsForm) {

        return;

    }

    newsForm.reset();

    if (newsIdInput) {

        newsIdInput.value =
            "";

    }

    if (newsCurrentImage) {

        newsCurrentImage.value =
            "";

    }

    if (newsImagePreview) {

        newsImagePreview.src =
            "images/grb.png";

    }

    if (newsImageName) {

        newsImageName.textContent =
            "Није изабрана фотографија";

    }

    if (newsPublished) {

        newsPublished.checked =
            true;

    }

    if (newsFeatured) {

        newsFeatured.checked =
            false;

    }

    if (newsHasMatch) {

        newsHasMatch.checked =
            false;

    }

    setNewsFormMessage(
        "",
        ""
    );

}


function updateMatchFieldsVisibility() {

    if (!newsMatchFields) {

        return;

    }

    newsMatchFields.hidden =
        !newsHasMatch?.checked;

}


function previewNewsImage() {

    const file =
        newsImageInput
            ?.files?.[0];

    if (!file) {

        return;

    }

    if (newsImageName) {

        newsImageName.textContent =
            file.name;

    }

    const objectUrl =
        URL.createObjectURL(
            file
        );

    newsImagePreview.src =
        objectUrl;

    newsImagePreview.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


async function saveNews(
    event
) {

    event.preventDefault();

    setNewsFormMessage(
        "",
        ""
    );

    const id =
        newsIdInput
            ?.value
            .trim();

    const title =
        newsTitleInput
            ?.value
            .trim();

    const category =
        newsCategoryInput
            ?.value
            .trim() ||
        "ВЕСТ";

    const date =
        newsDateInput
            ?.value;

    const excerpt =
        newsExcerptInput
            ?.value
            .trim() ||
        null;

    const rawContent =
        newsContentInput
            ?.value
            .trim();

    if (
        !title ||
        !date ||
        !rawContent
    ) {

        setNewsFormMessage(
            "Наслов, датум и текст вести су обавезни.",
            "error"
        );

        return;

    }

    const content =
        rawContent
            .split(
                /\n\s*\n/
            )
            .map(
                paragraph =>
                    paragraph.trim()
            )
            .filter(
                Boolean
            );

    let matchData =
        null;

    if (
        newsHasMatch?.checked
    ) {

        const home =
            newsHome
                ?.value
                .trim();

        const away =
            newsAway
                ?.value
                .trim();

        const homeScore =
            newsHomeScore
                ?.value;

        const awayScore =
            newsAwayScore
                ?.value;

        if (
            !home ||
            !away ||
            homeScore ===
                "" ||
            awayScore ===
                ""
        ) {

            setNewsFormMessage(
                "Попуните оба клуба и резултат утакмице.",
                "error"
            );

            return;

        }

        matchData = {

            home,

            away,

            homeScore:
                Number(
                    homeScore
                ),

            awayScore:
                Number(
                    awayScore
                ),

            homeLogo:
                getClubLogoPath(
                    home
                ),

            awayLogo:
                getClubLogoPath(
                    away
                )

        };

    }

    const sourceName =
        newsSourceName
            ?.value
            .trim();

    const sourceUrl =
        newsSourceUrl
            ?.value
            .trim();

    const source =
        sourceName

            ? {
                name:
                    sourceName,

                url:
                    sourceUrl ||
                    null
            }

            : null;

    const oldImage =
        newsCurrentImage
            ?.value
            .trim() ||
        "";

    let uploadedImage =
        null;

    setButtonLoading(
        newsSaveButton,
        true,
        "ЧУВАЊЕ..."
    );

    try {

        const selectedFile =
            newsImageInput
                ?.files?.[0];

        if (selectedFile) {

            uploadedImage =
                await uploadStorageImage(
                    NEWS_BUCKET,
                    selectedFile,
                    title
                );

        }

        const image =
            uploadedImage ||
            oldImage ||
            null;

        const baseSlug =
            createSlug(
                title
            );

        let slug =
            baseSlug;

        if (!id) {

            slug =
                `${baseSlug}-${Date.now()}`;

        }

        const payload = {

            title,

            category,

            date,

            date_display:
                formatDateDisplay(
                    date
                ),

            image,

            excerpt,

            content,

            match_data:
                matchData,

            source,

            featured:
                Boolean(
                    newsFeatured
                        ?.checked
                ),

            published:
                Boolean(
                    newsPublished
                        ?.checked
                )

        };

        let error;

        if (id) {

            const result =
                await sb
                    .from(
                        "vesti"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );

            error =
                result.error;

        }

        else {

            payload.slug =
                slug;

            const result =
                await sb
                    .from(
                        "vesti"
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

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteStorageImageFromUrl(
                NEWS_BUCKET,
                oldImage
            );

        }

        setNewsFormMessage(
            "Вест је успешно сачувана.",
            "success"
        );

        await Promise.allSettled(
            [
                loadAdminNews(),
                loadNewsCount()
            ]
        );

        setTimeout(
            closeNewsModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save news error:",
            error
        );

        if (uploadedImage) {

            await deleteStorageImageFromUrl(
                NEWS_BUCKET,
                uploadedImage
            );

        }

        setNewsFormMessage(
            getFriendlyError(
                error,
                "Вест није сачувана."
            ),
            "error"
        );

    }

    finally {

        setButtonLoading(
            newsSaveButton,
            false,
            "САЧУВАЈ ВЕСТ"
        );

    }

}


async function deleteNews(
    article
) {

    const confirmed =
        window.confirm(
            `Обрисати вест „${article.title}“?`
        );

    if (!confirmed) {

        return;

    }

    const {
        error
    } =
        await sb
            .from(
                "vesti"
            )
            .delete()
            .eq(
                "id",
                article.id
            );

    if (error) {

        window.alert(
            "Вест није могуће обрисати."
        );

        console.error(
            error
        );

        return;

    }

    if (
        article.image
    ) {

        await deleteStorageImageFromUrl(
            NEWS_BUCKET,
            article.image
        );

    }

    await Promise.allSettled(
        [
            loadAdminNews(),
            loadNewsCount()
        ]
    );

}


/* =========================================================
   IGRAČI
========================================================= */

const addPlayerButton =
    document.querySelector(
        "#admin-add-player"
    );

const playersList =
    document.querySelector(
        "#admin-players-list"
    );

const playerModal =
    document.querySelector(
        "#admin-player-modal"
    );

const playerForm =
    document.querySelector(
        "#admin-player-form"
    );

const playerModalTitle =
    document.querySelector(
        "#admin-player-modal-title"
    );

const playerIdInput =
    document.querySelector(
        "#admin-player-id"
    );

const playerCurrentImage =
    document.querySelector(
        "#admin-player-current-image"
    );

const playerNameInput =
    document.querySelector(
        "#admin-player-name"
    );

const playerNumberInput =
    document.querySelector(
        "#admin-player-number"
    );

const playerPositionInput =
    document.querySelector(
        "#admin-player-position"
    );

const playerPositionDetailInput =
    document.querySelector(
        "#admin-player-position-detail"
    );

const playerBirthDateInput =
    document.querySelector(
        "#admin-player-birth-date"
    );

const playerSelectionInput =
    document.querySelector(
        "#admin-player-selection"
    );

const playerOrderInput =
    document.querySelector(
        "#admin-player-order"
    );

const playerImageInput =
    document.querySelector(
        "#admin-player-image"
    );

const playerImagePreview =
    document.querySelector(
        "#admin-player-image-preview img"
    );

const playerImageName =
    document.querySelector(
        "#admin-player-image-name"
    );

const playerActiveInput =
    document.querySelector(
        "#admin-player-active"
    );

const playerFormMessage =
    document.querySelector(
        "#admin-player-form-message"
    );

const playerSaveButton =
    document.querySelector(
        "#admin-player-save-button"
    );


function setupPlayersAdmin() {

    if (addPlayerButton) {

        addPlayerButton.addEventListener(
            "click",
            () => {

                openPlayerModal();

            }
        );

    }

    document
        .querySelectorAll(
            "[data-close-player-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closePlayerModal
                );

            }
        );

    if (playerImageInput) {

        playerImageInput.addEventListener(
            "change",
            previewPlayerImage
        );

    }

    if (playerForm) {

        playerForm.addEventListener(
            "submit",
            savePlayer
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                playerModal &&
                !playerModal.hidden
            ) {

                closePlayerModal();

            }

        }
    );

}


async function loadAdminPlayers() {

    if (!playersList) {

        return;

    }

    playersList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање играча...
        </div>

    `;

    const {
        data,
        error
    } =
        await sb
            .from(
                "igraci"
            )
            .select(
                "id,ime_prezime,broj,pozicija,pozicija_detaljno,datum_rodjenja,selekcija,fotografija,redosled,aktivan,created_at"
            );

    if (error) {

        console.error(
            "Players load error:",
            error
        );

        playersList.innerHTML = `

            <div class="admin-list-loading">
                Грешка при учитавању играча.
            </div>

        `;

        return;

    }

    if (
        !Array.isArray(
            data
        ) ||
        data.length ===
            0
    ) {

        playersList.innerHTML = `

            <div class="admin-players-empty">
                Још нема унетих играча.
            </div>

        `;

        return;

    }

    const sortedPlayers =
        [...data]
            .sort(
                sortPlayers
            );

    playersList.innerHTML =
        renderPlayerGroups(
            sortedPlayers
        );

    playersList
        .querySelectorAll(
            "[data-edit-player]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editPlayer;

                        const player =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (player) {

                            openPlayerModal(
                                player
                            );

                        }

                    }
                );

            }
        );

    playersList
        .querySelectorAll(
            "[data-delete-player]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deletePlayer;

                        const player =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (player) {

                            deletePlayer(
                                player
                            );

                        }

                    }
                );

            }
        );

}


function sortPlayers(
    a,
    b
) {

    const positionOrder = {

        "ГОЛМАНИ":
            1,

        "ОДБРАНА":
            2,

        "ВЕЗНИ РЕД":
            3,

        "НАПАД":
            4

    };

    const selectionDifference =

        getAdminSelectionOrder(
            a.selekcija
        ) -

        getAdminSelectionOrder(
            b.selekcija
        );

    if (
        selectionDifference !==
        0
    ) {

        return selectionDifference;

    }

    const positionDifference =

        (
            positionOrder[
                a.pozicija
            ] ||
            99
        ) -

        (
            positionOrder[
                b.pozicija
            ] ||
            99
        );

    if (
        positionDifference !==
        0
    ) {

        return positionDifference;

    }

    const orderDifference =

        Number(
            a.redosled ||
            0
        ) -

        Number(
            b.redosled ||
            0
        );

    if (
        orderDifference !==
        0
    ) {

        return orderDifference;

    }

    return String(
        a.ime_prezime ||
        ""
    ).localeCompare(
        String(
            b.ime_prezime ||
            ""
        ),
        "sr"
    );

}


function renderPlayerGroups(
    players
) {

    const positions = [

        "ГОЛМАНИ",

        "ОДБРАНА",

        "ВЕЗНИ РЕД",

        "НАПАД"

    ];

    const selections =
        adminSelections
            .map(
                selection =>
                    selection.naziv
            )
            .filter(
                Boolean
            );

    players.forEach(
        player => {

            const selection =
                player.selekcija;

            if (
                selection &&
                !selections.includes(
                    selection
                )
            ) {

                selections.push(
                    selection
                );

            }

        }
    );

    let html =
        "";

    selections.forEach(
        selection => {

            const selectionPlayers =
                players.filter(
                    player =>
                        player.selekcija ===
                        selection
                );

            if (
                selectionPlayers.length ===
                0
            ) {

                return;

            }

            html += `

                <div class="admin-player-selection">

                    <div class="admin-player-group-title">
                        ${escapeHtml(selection)}
                    </div>

            `;

            positions.forEach(
                position => {

                    const group =
                        selectionPlayers.filter(
                            player =>
                                player.pozicija ===
                                position
                        );

                    if (
                        group.length ===
                        0
                    ) {

                        return;

                    }

                    html += `

                        <div class="admin-player-group">

                            <div class="admin-player-group-title">
                                ${escapeHtml(position)}
                            </div>

                            ${group
                                .map(
                                    renderAdminPlayer
                                )
                                .join("")}

                        </div>

                    `;

                }
            );

            html += `

                </div>

            `;

        }
    );

    return html;

}


function renderAdminPlayer(
    player
) {

    const photo =
        player.fotografija ||
        "images/grb.png";

    const number =
        player.broj !==
            null &&
        player.broj !==
            undefined

            ? `#${player.broj}`

            : "БЕЗ БРОЈА";

    const positionDetail =
        player.pozicija_detaljno

            ? `
                <span>
                    ${escapeHtml(player.pozicija_detaljno)}
                </span>
            `

            : "";

    const birthDate =
        player.datum_rodjenja

            ? `
                <span>
                    ${escapeHtml(formatBirthDate(player.datum_rodjenja))}
                </span>
            `

            : "";

    return `

        <article class="admin-player-item">

            <div class="admin-player-photo">

                <img
                    src="${escapeAttribute(photo)}"
                    alt="${escapeAttribute(player.ime_prezime || "")}"
                    onerror="this.onerror=null;this.src='images/grb.png';"
                >

            </div>

            <div class="admin-player-info">

                <strong>
                    ${escapeHtml(player.ime_prezime || "")}
                </strong>

                <div class="admin-player-meta">

                    <span class="admin-player-number">
                        ${escapeHtml(number)}
                    </span>

                    ${positionDetail}

                    ${birthDate}

                    <span>
                        ${escapeHtml(player.selekcija || "")}
                    </span>

                    <span
                        class="
                            admin-player-status
                            ${
                                player.aktivan
                                    ? "active"
                                    : "inactive"
                            }
                        "
                    >
                        ${
                            player.aktivan
                                ? "АКТИВАН"
                                : "НЕАКТИВАН"
                        }
                    </span>

                </div>

            </div>

            <div class="admin-player-actions">

                <button
                    type="button"
                    class="admin-player-edit"
                    data-edit-player="${escapeAttribute(player.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    class="admin-player-delete"
                    data-delete-player="${escapeAttribute(player.id)}"
                >
                    ОБРИШИ
                </button>

            </div>

        </article>

    `;

}


function openPlayerModal(
    player = null
) {

    if (
        !playerModal ||
        !playerForm
    ) {

        return;

    }

    resetPlayerForm();

    if (player) {

        if (playerModalTitle) {

            playerModalTitle.textContent =
                "Измени играча";

        }

        playerIdInput.value =
            player.id ||
            "";

        playerCurrentImage.value =
            player.fotografija ||
            "";

        playerNameInput.value =
            player.ime_prezime ||
            "";

        playerNumberInput.value =
            player.broj ??
            "";

        playerPositionInput.value =
            player.pozicija ||
            "";

        playerPositionDetailInput.value =
            player.pozicija_detaljno ||
            "";

        playerBirthDateInput.value =
            player.datum_rodjenja ||
            "";

        populateAdminSelectionSelect(
            playerSelectionInput,
            player.selekcija ||
                getDefaultAdminSelectionName()
        );

        playerOrderInput.value =
            player.redosled ??
            0;

        playerActiveInput.checked =
            player.aktivan !==
            false;

        if (
            player.fotografija
        ) {

            playerImagePreview.src =
                player.fotografija;

        }

    }

    else {

        if (playerModalTitle) {

            playerModalTitle.textContent =
                "Додај играча";

        }

    }

    playerModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

}


function closePlayerModal() {

    if (!playerModal) {

        return;

    }

    playerModal.hidden =
        true;

    document.body.style.overflow =
        "";

}


function resetPlayerForm() {

    if (!playerForm) {

        return;

    }

    playerForm.reset();

    if (playerIdInput) {

        playerIdInput.value =
            "";

    }

    if (playerCurrentImage) {

        playerCurrentImage.value =
            "";

    }

    if (playerImagePreview) {

        playerImagePreview.src =
            "images/grb.png";

    }

    if (playerImageName) {

        playerImageName.textContent =
            "Није изабрана фотографија";

    }

    if (playerSelectionInput) {

        populateAdminSelectionSelect(
            playerSelectionInput,
            getDefaultAdminSelectionName()
        );

    }

    if (playerOrderInput) {

        playerOrderInput.value =
            "0";

    }

    if (playerActiveInput) {

        playerActiveInput.checked =
            true;

    }

    setPlayerFormMessage(
        "",
        ""
    );

}


function previewPlayerImage() {

    const file =
        playerImageInput
            ?.files?.[0];

    if (!file) {

        return;

    }

    if (playerImageName) {

        playerImageName.textContent =
            file.name;

    }

    const objectUrl =
        URL.createObjectURL(
            file
        );

    playerImagePreview.src =
        objectUrl;

    playerImagePreview.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


async function savePlayer(
    event
) {

    event.preventDefault();

    setPlayerFormMessage(
        "",
        ""
    );

    const id =
        playerIdInput
            ?.value
            .trim();

    const name =
        playerNameInput
            ?.value
            .trim();

    const numberRaw =
        playerNumberInput
            ?.value
            .trim();

    const position =
        playerPositionInput
            ?.value;

    const positionDetail =
        playerPositionDetailInput
            ?.value
            .trim() ||
        null;

    const birthDate =
        playerBirthDateInput
            ?.value ||
        null;

    const selection =
        playerSelectionInput
            ?.value ||
        getDefaultAdminSelectionName();

    const orderRaw =
        playerOrderInput
            ?.value;

    if (
        !name ||
        !position
    ) {

        setPlayerFormMessage(
            "Име и презиме и група су обавезни.",
            "error"
        );

        return;

    }

    let number =
        null;

    if (
        numberRaw !==
        ""
    ) {

        number =
            Number(
                numberRaw
            );

        if (
            !Number.isInteger(
                number
            ) ||
            number < 0 ||
            number > 99
        ) {

            setPlayerFormMessage(
                "Број дреса мора бити од 0 до 99.",
                "error"
            );

            return;

        }

    }

    const order =
        Number.isFinite(
            Number(
                orderRaw
            )
        )

            ? Number(
                orderRaw
            )

            : 0;

    const oldImage =
        playerCurrentImage
            ?.value
            .trim() ||
        "";

    let uploadedImage =
        null;

    setButtonLoading(
        playerSaveButton,
        true,
        "ЧУВАЊЕ..."
    );

    try {

        const selectedFile =
            playerImageInput
                ?.files?.[0];

        if (selectedFile) {

            uploadedImage =
                await uploadStorageImage(
                    PLAYERS_BUCKET,
                    selectedFile,
                    name
                );

        }

        const photo =
            uploadedImage ||
            oldImage ||
            null;

        const payload = {

            ime_prezime:
                name,

            broj:
                number,

            pozicija:
                position,

            pozicija_detaljno:
                positionDetail,

            datum_rodjenja:
                birthDate,

            selekcija:
                selection,

            fotografija:
                photo,

            redosled:
                order,

            aktivan:
                Boolean(
                    playerActiveInput
                        ?.checked
                )

        };

        let error;

        if (id) {

            const result =
                await sb
                    .from(
                        "igraci"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );

            error =
                result.error;

        }

        else {

            const result =
                await sb
                    .from(
                        "igraci"
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

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteStorageImageFromUrl(
                PLAYERS_BUCKET,
                oldImage
            );

        }

        setPlayerFormMessage(
            "Играч је успешно сачуван.",
            "success"
        );

        await Promise.allSettled(
            [
                loadAdminPlayers(),
                loadPlayersCount()
            ]
        );

        setTimeout(
            closePlayerModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save player error:",
            error
        );

        if (uploadedImage) {

            await deleteStorageImageFromUrl(
                PLAYERS_BUCKET,
                uploadedImage
            );

        }

        setPlayerFormMessage(
            getFriendlyError(
                error,
                "Играч није сачуван."
            ),
            "error"
        );

    }

    finally {

        setButtonLoading(
            playerSaveButton,
            false,
            "САЧУВАЈ ИГРАЧА"
        );

    }

}


async function deletePlayer(
    player
) {

    const confirmed =
        window.confirm(
            `Обрисати играча „${player.ime_prezime}“?`
        );

    if (!confirmed) {

        return;

    }

    const {
        error
    } =
        await sb
            .from(
                "igraci"
            )
            .delete()
            .eq(
                "id",
                player.id
            );

    if (error) {

        console.error(
            "Delete player error:",
            error
        );

        window.alert(
            "Играч није могуће обрисати."
        );

        return;

    }

    if (
        player.fotografija
    ) {

        await deleteStorageImageFromUrl(
            PLAYERS_BUCKET,
            player.fotografija
        );

    }

    await Promise.allSettled(
        [
            loadAdminPlayers(),
            loadPlayersCount()
        ]
    );

}


/* =========================================================
   STRUČNI ŠTAB
========================================================= */

const addStaffButton =
    document.querySelector(
        "#admin-add-staff"
    );

const staffList =
    document.querySelector(
        "#admin-staff-list"
    );

const staffModal =
    document.querySelector(
        "#admin-staff-modal"
    );

const staffForm =
    document.querySelector(
        "#admin-staff-form"
    );

const staffModalTitle =
    document.querySelector(
        "#admin-staff-modal-title"
    );

const staffIdInput =
    document.querySelector(
        "#admin-staff-id"
    );

const staffCurrentImage =
    document.querySelector(
        "#admin-staff-current-image"
    );

const staffNameInput =
    document.querySelector(
        "#admin-staff-name"
    );

const staffRoleInput =
    document.querySelector(
        "#admin-staff-role"
    );

const staffSelectionInput =
    document.querySelector(
        "#admin-staff-selection"
    );

const staffBirthDateInput =
    document.querySelector(
        "#admin-staff-birth-date"
    );

const staffOrderInput =
    document.querySelector(
        "#admin-staff-order"
    );

const staffImageInput =
    document.querySelector(
        "#admin-staff-image"
    );

const staffImagePreview =
    document.querySelector(
        "#admin-staff-image-preview img"
    );

const staffImageName =
    document.querySelector(
        "#admin-staff-image-name"
    );

const staffActiveInput =
    document.querySelector(
        "#admin-staff-active"
    );

const staffFormMessage =
    document.querySelector(
        "#admin-staff-form-message"
    );

const staffSaveButton =
    document.querySelector(
        "#admin-staff-save-button"
    );


function setupStaffAdmin() {

    if (addStaffButton) {

        addStaffButton.addEventListener(
            "click",
            () => {

                openStaffModal();

            }
        );

    }

    document
        .querySelectorAll(
            "[data-close-staff-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeStaffModal
                );

            }
        );

    if (staffImageInput) {

        staffImageInput.addEventListener(
            "change",
            previewStaffImage
        );

    }

    if (staffForm) {

        staffForm.addEventListener(
            "submit",
            saveStaffMember
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                staffModal &&
                !staffModal.hidden
            ) {

                closeStaffModal();

            }

        }
    );

}


async function loadAdminStaff() {

    if (!staffList) {

        return;

    }

    staffList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање стручног штаба...
        </div>

    `;

    const {
        data,
        error
    } =
        await sb
            .from(
                "strucni_stab"
            )
            .select(
                "id,ime_prezime,uloga,selekcija,datum_rodjenja,fotografija,redosled,aktivan,created_at"
            )
            .order(
                "redosled",
                {
                    ascending:
                        true
                }
            )
            .order(
                "ime_prezime",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        console.error(
            "Staff load error:",
            error
        );

        staffList.innerHTML = `

            <div class="admin-list-loading">
                Грешка при учитавању стручног штаба.
            </div>

        `;

        return;

    }

    if (
        !Array.isArray(
            data
        ) ||
        data.length ===
            0
    ) {

        staffList.innerHTML = `

            <div class="admin-staff-empty">
                Још нема унетих чланова стручног штаба.
            </div>

        `;

        return;

    }

    staffList.innerHTML =
        data
            .map(
                renderAdminStaffMember
            )
            .join("");

    staffList
        .querySelectorAll(
            "[data-edit-staff]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editStaff;

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (member) {

                            openStaffModal(
                                member
                            );

                        }

                    }
                );

            }
        );

    staffList
        .querySelectorAll(
            "[data-delete-staff]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deleteStaff;

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (member) {

                            deleteStaffMember(
                                member
                            );

                        }

                    }
                );

            }
        );

}


function renderAdminStaffMember(
    member
) {

    const photo =
        member.fotografija ||
        "images/grb.png";

    const birthDate =
        member.datum_rodjenja

            ? `
                <span>
                    ${escapeHtml(formatBirthDate(member.datum_rodjenja))}
                </span>
            `

            : "";

    return `

        <article class="admin-staff-item">

            <div class="admin-staff-photo">

                <img
                    src="${escapeAttribute(photo)}"
                    alt="${escapeAttribute(member.ime_prezime || "")}"
                    onerror="this.onerror=null;this.src='images/grb.png';"
                >

            </div>

            <div class="admin-staff-info">

                <strong>
                    ${escapeHtml(member.ime_prezime || "")}
                </strong>

                <div class="admin-staff-meta">

                    <span class="admin-staff-role">
                        ${escapeHtml(member.uloga || "")}
                    </span>

                    <span>
                        ${escapeHtml(member.selekcija || "")}
                    </span>

                    ${birthDate}

                    <span
                        class="
                            admin-staff-status
                            ${
                                member.aktivan
                                    ? "active"
                                    : "inactive"
                            }
                        "
                    >
                        ${
                            member.aktivan
                                ? "АКТИВАН"
                                : "НЕАКТИВАН"
                        }
                    </span>

                </div>

            </div>

            <div class="admin-staff-actions">

                <button
                    type="button"
                    class="admin-staff-edit"
                    data-edit-staff="${escapeAttribute(member.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    class="admin-staff-delete"
                    data-delete-staff="${escapeAttribute(member.id)}"
                >
                    ОБРИШИ
                </button>

            </div>

        </article>

    `;

}


function openStaffModal(
    member = null
) {

    if (
        !staffModal ||
        !staffForm
    ) {

        return;

    }

    resetStaffForm();

    if (member) {

        staffModalTitle.textContent =
            "Измени члана";

        staffIdInput.value =
            member.id ||
            "";

        staffCurrentImage.value =
            member.fotografija ||
            "";

        staffNameInput.value =
            member.ime_prezime ||
            "";

        staffRoleInput.value =
            member.uloga ||
            "";

        populateAdminSelectionSelect(
            staffSelectionInput,
            member.selekcija ||
                getDefaultAdminSelectionName()
        );

        staffBirthDateInput.value =
            member.datum_rodjenja ||
            "";

        staffOrderInput.value =
            member.redosled ??
            0;

        staffActiveInput.checked =
            member.aktivan !==
            false;

        if (
            member.fotografija
        ) {

            staffImagePreview.src =
                member.fotografija;

        }

    }

    else {

        staffModalTitle.textContent =
            "Додај члана";

    }

    staffModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

}


function closeStaffModal() {

    if (!staffModal) {

        return;

    }

    staffModal.hidden =
        true;

    document.body.style.overflow =
        "";

}


function resetStaffForm() {

    if (!staffForm) {

        return;

    }

    staffForm.reset();

    staffIdInput.value =
        "";

    staffCurrentImage.value =
        "";

    populateAdminSelectionSelect(
        staffSelectionInput,
        getDefaultAdminSelectionName()
    );

    staffOrderInput.value =
        "0";

    staffActiveInput.checked =
        true;

    staffImagePreview.src =
        "images/grb.png";

    staffImageName.textContent =
        "Није изабрана фотографија";

    setStaffFormMessage(
        "",
        ""
    );

}


function previewStaffImage() {

    const file =
        staffImageInput
            ?.files?.[0];

    if (!file) {

        return;

    }

    staffImageName.textContent =
        file.name;

    const objectUrl =
        URL.createObjectURL(
            file
        );

    staffImagePreview.src =
        objectUrl;

    staffImagePreview.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


async function saveStaffMember(
    event
) {

    event.preventDefault();

    setStaffFormMessage(
        "",
        ""
    );

    const id =
        staffIdInput
            ?.value
            .trim();

    const name =
        staffNameInput
            ?.value
            .trim();

    const role =
        staffRoleInput
            ?.value
            .trim();

    const selection =
        staffSelectionInput
            ?.value ||
        getDefaultAdminSelectionName();

    const birthDate =
        staffBirthDateInput
            ?.value ||
        null;

    const order =
        Number(
            staffOrderInput
                ?.value ||
            0
        );

    if (
        !name ||
        !role
    ) {

        setStaffFormMessage(
            "Име и презиме и улога су обавезни.",
            "error"
        );

        return;

    }

    const oldImage =
        staffCurrentImage
            ?.value
            .trim() ||
        "";

    let uploadedImage =
        null;

    setButtonLoading(
        staffSaveButton,
        true,
        "ЧУВАЊЕ..."
    );

    try {

        const selectedFile =
            staffImageInput
                ?.files?.[0];

        if (selectedFile) {

            uploadedImage =
                await uploadStorageImage(
                    STAFF_BUCKET,
                    selectedFile,
                    name
                );

        }

        const photo =
            uploadedImage ||
            oldImage ||
            null;

        const payload = {

            ime_prezime:
                name,

            uloga:
                role,

            selekcija:
                selection,

            datum_rodjenja:
                birthDate,

            fotografija:
                photo,

            redosled:
                Number.isFinite(
                    order
                )
                    ? order
                    : 0,

            aktivan:
                Boolean(
                    staffActiveInput
                        ?.checked
                )

        };

        let error;

        if (id) {

            const result =
                await sb
                    .from(
                        "strucni_stab"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );

            error =
                result.error;

        }

        else {

            const result =
                await sb
                    .from(
                        "strucni_stab"
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

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteStorageImageFromUrl(
                STAFF_BUCKET,
                oldImage
            );

        }

        setStaffFormMessage(
            "Члан стручног штаба је успешно сачуван.",
            "success"
        );

        await loadAdminStaff();

        setTimeout(
            closeStaffModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save staff error:",
            error
        );

        if (uploadedImage) {

            await deleteStorageImageFromUrl(
                STAFF_BUCKET,
                uploadedImage
            );

        }

        setStaffFormMessage(
            getFriendlyError(
                error,
                "Подаци нису сачувани."
            ),
            "error"
        );

    }

    finally {

        setButtonLoading(
            staffSaveButton,
            false,
            "САЧУВАЈ"
        );

    }

}


async function deleteStaffMember(
    member
) {

    const confirmed =
        window.confirm(
            `Обрисати члана „${member.ime_prezime}“?`
        );

    if (!confirmed) {

        return;

    }

    const {
        error
    } =
        await sb
            .from(
                "strucni_stab"
            )
            .delete()
            .eq(
                "id",
                member.id
            );

    if (error) {

        console.error(
            "Delete staff error:",
            error
        );

        window.alert(
            "Члана није могуће обрисати."
        );

        return;

    }

    if (
        member.fotografija
    ) {

        await deleteStorageImageFromUrl(
            STAFF_BUCKET,
            member.fotografija
        );

    }

    await loadAdminStaff();

}


function setStaffFormMessage(
    message,
    type
) {

    if (!staffFormMessage) {

        return;

    }

    staffFormMessage.textContent =
        message;

    staffFormMessage.className =
        "admin-form-message";

    if (type) {

        staffFormMessage
            .classList
            .add(
                type
            );

    }

}


/* =========================================================
   UPRAVA
========================================================= */

const addManagementButton =
    document.querySelector(
        "#admin-add-management"
    );

const managementList =
    document.querySelector(
        "#admin-management-list"
    );

const managementModal =
    document.querySelector(
        "#admin-management-modal"
    );

const managementForm =
    document.querySelector(
        "#admin-management-form"
    );

const managementModalTitle =
    document.querySelector(
        "#admin-management-modal-title"
    );

const managementIdInput =
    document.querySelector(
        "#admin-management-id"
    );

const managementCurrentImage =
    document.querySelector(
        "#admin-management-current-image"
    );

const managementNameInput =
    document.querySelector(
        "#admin-management-name"
    );

const managementRoleInput =
    document.querySelector(
        "#admin-management-role"
    );

const managementOrderInput =
    document.querySelector(
        "#admin-management-order"
    );

const managementImageInput =
    document.querySelector(
        "#admin-management-image"
    );

const managementImagePreview =
    document.querySelector(
        "#admin-management-image-preview img"
    );

const managementImageName =
    document.querySelector(
        "#admin-management-image-name"
    );

const managementFeaturedInput =
    document.querySelector(
        "#admin-management-featured"
    );

const managementActiveInput =
    document.querySelector(
        "#admin-management-active"
    );

const managementFormMessage =
    document.querySelector(
        "#admin-management-form-message"
    );

const managementSaveButton =
    document.querySelector(
        "#admin-management-save-button"
    );


function setupManagementAdmin() {

    if (addManagementButton) {

        addManagementButton.addEventListener(
            "click",
            () => {

                openManagementModal();

            }
        );

    }

    document
        .querySelectorAll(
            "[data-close-management-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeManagementModal
                );

            }
        );

    if (managementImageInput) {

        managementImageInput.addEventListener(
            "change",
            previewManagementImage
        );

    }

    if (managementForm) {

        managementForm.addEventListener(
            "submit",
            saveManagementMember
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                managementModal &&
                !managementModal.hidden
            ) {

                closeManagementModal();

            }

        }
    );

}


async function loadAdminManagement() {

    if (!managementList) {

        return;

    }

    managementList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање управе...
        </div>

    `;

    const {
        data,
        error
    } =
        await sb
            .from(
                "uprava"
            )
            .select(
                "id,ime_prezime,funkcija,fotografija,istaknut,redosled,aktivan,created_at"
            )
            .order(
                "istaknut",
                {
                    ascending:
                        false
                }
            )
            .order(
                "redosled",
                {
                    ascending:
                        true
                }
            )
            .order(
                "ime_prezime",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        console.error(
            "Management load error:",
            error
        );

        managementList.innerHTML = `

            <div class="admin-list-loading">
                Грешка при учитавању управе.
            </div>

        `;

        return;

    }

    if (
        !Array.isArray(
            data
        ) ||
        data.length ===
            0
    ) {

        managementList.innerHTML = `

            <div class="admin-management-empty">
                Још нема унетих чланова управе.
            </div>

        `;

        return;

    }

    managementList.innerHTML =
        data
            .map(
                renderAdminManagementMember
            )
            .join("");

    managementList
        .querySelectorAll(
            "[data-edit-management]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editManagement;

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (member) {

                            openManagementModal(
                                member
                            );

                        }

                    }
                );

            }
        );

    managementList
        .querySelectorAll(
            "[data-delete-management]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deleteManagement;

                        const member =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (member) {

                            deleteManagementMember(
                                member
                            );

                        }

                    }
                );

            }
        );

}


function renderAdminManagementMember(
    member
) {

    const photo =
        member.fotografija ||
        "images/grb.png";

    return `

        <article
            class="
                admin-management-item
                ${member.istaknut ? "featured" : ""}
            "
        >

            <div class="admin-management-photo">

                <img
                    src="${escapeAttribute(photo)}"
                    alt="${escapeAttribute(member.ime_prezime || "")}"
                    onerror="this.onerror=null;this.src='images/grb.png';"
                >

            </div>

            <div class="admin-management-info">

                <strong>
                    ${escapeHtml(member.ime_prezime || "")}
                </strong>

                <div class="admin-management-meta">

                    <span class="admin-management-role">
                        ${escapeHtml(member.funkcija || "")}
                    </span>

                    ${
                        member.istaknut

                            ? `
                                <span class="admin-management-featured">
                                    ИСТАКНУТ
                                </span>
                            `

                            : ""
                    }

                    <span
                        class="
                            admin-management-status
                            ${
                                member.aktivan
                                    ? "active"
                                    : "inactive"
                            }
                        "
                    >
                        ${
                            member.aktivan
                                ? "АКТИВАН"
                                : "НЕАКТИВАН"
                        }
                    </span>

                </div>

            </div>

            <div class="admin-management-actions">

                <button
                    type="button"
                    class="admin-management-edit"
                    data-edit-management="${escapeAttribute(member.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    class="admin-management-delete"
                    data-delete-management="${escapeAttribute(member.id)}"
                >
                    ОБРИШИ
                </button>

            </div>

        </article>

    `;

}


function openManagementModal(
    member = null
) {

    if (
        !managementModal ||
        !managementForm
    ) {

        return;

    }

    resetManagementForm();

    if (member) {

        managementModalTitle.textContent =
            "Измени члана управе";

        managementIdInput.value =
            member.id ||
            "";

        managementCurrentImage.value =
            member.fotografija ||
            "";

        managementNameInput.value =
            member.ime_prezime ||
            "";

        managementRoleInput.value =
            member.funkcija ||
            "";

        managementOrderInput.value =
            member.redosled ??
            0;

        managementFeaturedInput.checked =
            member.istaknut ===
            true;

        managementActiveInput.checked =
            member.aktivan !==
            false;

        if (
            member.fotografija
        ) {

            managementImagePreview.src =
                member.fotografija;

        }

    }

    else {

        managementModalTitle.textContent =
            "Додај члана управе";

    }

    managementModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

}


function closeManagementModal() {

    if (!managementModal) {

        return;

    }

    managementModal.hidden =
        true;

    document.body.style.overflow =
        "";

}


function resetManagementForm() {

    if (!managementForm) {

        return;

    }

    managementForm.reset();

    managementIdInput.value =
        "";

    managementCurrentImage.value =
        "";

    managementOrderInput.value =
        "0";

    managementFeaturedInput.checked =
        false;

    managementActiveInput.checked =
        true;

    managementImagePreview.src =
        "images/grb.png";

    managementImageName.textContent =
        "Није изабрана фотографија";

    setManagementFormMessage(
        "",
        ""
    );

}


function previewManagementImage() {

    const file =
        managementImageInput
            ?.files?.[0];

    if (!file) {

        return;

    }

    managementImageName.textContent =
        file.name;

    const objectUrl =
        URL.createObjectURL(
            file
        );

    managementImagePreview.src =
        objectUrl;

    managementImagePreview.onload =
        () => {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


async function saveManagementMember(
    event
) {

    event.preventDefault();

    setManagementFormMessage(
        "",
        ""
    );

    const id =
        managementIdInput
            ?.value
            .trim();

    const name =
        managementNameInput
            ?.value
            .trim();

    const role =
        managementRoleInput
            ?.value
            .trim();

    const order =
        Number(
            managementOrderInput
                ?.value ||
            0
        );

    if (
        !name ||
        !role
    ) {

        setManagementFormMessage(
            "Име и презиме и функција су обавезни.",
            "error"
        );

        return;

    }

    const oldImage =
        managementCurrentImage
            ?.value
            .trim() ||
        "";

    let uploadedImage =
        null;

    setButtonLoading(
        managementSaveButton,
        true,
        "ЧУВАЊЕ..."
    );

    try {

        const selectedFile =
            managementImageInput
                ?.files?.[0];

        if (selectedFile) {

            uploadedImage =
                await uploadStorageImage(
                    MANAGEMENT_BUCKET,
                    selectedFile,
                    name
                );

        }

        const photo =
            uploadedImage ||
            oldImage ||
            null;

        const payload = {

            ime_prezime:
                name,

            funkcija:
                role,

            fotografija:
                photo,

            istaknut:
                Boolean(
                    managementFeaturedInput
                        ?.checked
                ),

            redosled:
                Number.isFinite(
                    order
                )
                    ? order
                    : 0,

            aktivan:
                Boolean(
                    managementActiveInput
                        ?.checked
                )

        };

        let error;

        if (id) {

            const result =
                await sb
                    .from(
                        "uprava"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );

            error =
                result.error;

        }

        else {

            const result =
                await sb
                    .from(
                        "uprava"
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

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteStorageImageFromUrl(
                MANAGEMENT_BUCKET,
                oldImage
            );

        }

        setManagementFormMessage(
            "Члан управе је успешно сачуван.",
            "success"
        );

        await loadAdminManagement();

        setTimeout(
            closeManagementModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save management error:",
            error
        );

        if (uploadedImage) {

            await deleteStorageImageFromUrl(
                MANAGEMENT_BUCKET,
                uploadedImage
            );

        }

        setManagementFormMessage(
            getFriendlyError(
                error,
                "Подаци нису сачувани."
            ),
            "error"
        );

    }

    finally {

        setButtonLoading(
            managementSaveButton,
            false,
            "САЧУВАЈ"
        );

    }

}


async function deleteManagementMember(
    member
) {

    const confirmed =
        window.confirm(
            `Обрисати члана управе „${member.ime_prezime}“?`
        );

    if (!confirmed) {

        return;

    }

    const {
        error
    } =
        await sb
            .from(
                "uprava"
            )
            .delete()
            .eq(
                "id",
                member.id
            );

    if (error) {

        console.error(
            "Delete management error:",
            error
        );

        window.alert(
            "Члана управе није могуће обрисати."
        );

        return;

    }

    if (
        member.fotografija
    ) {

        await deleteStorageImageFromUrl(
            MANAGEMENT_BUCKET,
            member.fotografija
        );

    }

    await loadAdminManagement();

}


function setManagementFormMessage(
    message,
    type
) {

    if (!managementFormMessage) {

        return;

    }

    managementFormMessage.textContent =
        message;

    managementFormMessage.className =
        "admin-form-message";

    if (type) {

        managementFormMessage
            .classList
            .add(
                type
            );

    }

}


/* =========================================================
   SELEKCIJE
========================================================= */

const addSelectionButton =
    document.querySelector(
        "#admin-add-selection"
    );

const selectionsList =
    document.querySelector(
        "#admin-selections-list"
    );

const selectionModal =
    document.querySelector(
        "#admin-selection-modal"
    );

const selectionForm =
    document.querySelector(
        "#admin-selection-form"
    );

const selectionModalTitle =
    document.querySelector(
        "#admin-selection-modal-title"
    );

const selectionIdInput =
    document.querySelector(
        "#admin-selection-id"
    );

const selectionCodeInput =
    document.querySelector(
        "#admin-selection-code"
    );

const selectionCurrentImage =
    document.querySelector(
        "#admin-selection-current-image"
    );

const selectionNameInput =
    document.querySelector(
        "#admin-selection-name"
    );

const selectionYearInput =
    document.querySelector(
        "#admin-selection-year"
    );

const selectionOrderInput =
    document.querySelector(
        "#admin-selection-order"
    );

const selectionDescriptionInput =
    document.querySelector(
        "#admin-selection-description"
    );

const selectionImageInput =
    document.querySelector(
        "#admin-selection-image"
    );

const selectionImagePreview =
    document.querySelector(
        "#admin-selection-image-preview img"
    );

const selectionImageName =
    document.querySelector(
        "#admin-selection-image-name"
    );

const selectionActiveInput =
    document.querySelector(
        "#admin-selection-active"
    );

const selectionFormMessage =
    document.querySelector(
        "#admin-selection-form-message"
    );

const selectionSaveButton =
    document.querySelector(
        "#admin-selection-save-button"
    );


function setupSelectionsAdmin() {

    if (addSelectionButton) {

        addSelectionButton.addEventListener(
            "click",
            () => {

                openSelectionModal();

            }
        );

    }

    document
        .querySelectorAll(
            "[data-close-selection-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeSelectionModal
                );

            }
        );

    if (selectionImageInput) {

        selectionImageInput.addEventListener(
            "change",
            previewSelectionImage
        );

    }

    if (selectionForm) {

        selectionForm.addEventListener(
            "submit",
            saveSelection
        );

    }

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                    "Escape" &&
                selectionModal &&
                !selectionModal.hidden
            ) {

                closeSelectionModal();

            }

        }
    );

}


async function loadAdminSelections() {

    if (!selectionsList) {

        return;

    }

    selectionsList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање селекција...
        </div>

    `;

    const {
        data,
        error
    } =
        await sb
            .from(
                "selekcije"
            )
            .select(
                "id,kod,naziv,opis,godiste,fotografija,redosled,aktivna,created_at"
            )
            .order(
                "redosled",
                {
                    ascending:
                        true
                }
            )
            .order(
                "naziv",
                {
                    ascending:
                        true
                }
            );

    if (error) {

        console.error(
            "Selections load error:",
            error
        );

        selectionsList.innerHTML = `

            <div class="admin-list-loading">
                Грешка при учитавању селекција.
            </div>

        `;

        return;

    }

    if (
        !Array.isArray(
            data
        ) ||
        data.length ===
            0
    ) {

        selectionsList.innerHTML = `

            <div class="admin-selections-empty">
                Још нема унетих селекција.
            </div>

        `;

        return;

    }

    selectionsList.innerHTML =
        data
            .map(
                renderAdminSelection
            )
            .join("");

    selectionsList
        .querySelectorAll(
            "[data-edit-selection]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editSelection;

                        const selection =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (selection) {

                            openSelectionModal(
                                selection
                            );

                        }

                    }
                );

            }
        );

    selectionsList
        .querySelectorAll(
            "[data-delete-selection]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deleteSelection;

                        const selection =
                            data.find(
                                item =>
                                    item.id ===
                                    id
                            );

                        if (selection) {

                            deleteSelection(
                                selection
                            );

                        }

                    }
                );

            }
        );

}


function renderAdminSelection(
    selection
) {

    const photo =
        selection.fotografija ||
        "images/grb.png";

    const description =
        selection.opis

            ? `
                <p class="admin-selection-description">
                    ${escapeHtml(selection.opis)}
                </p>
            `

            : "";

    const year =
        selection.godiste

            ? `
                <span class="admin-selection-year">
                    ${escapeHtml(selection.godiste)}
                </span>
            `

            : "";

    return `

        <article class="admin-selection-item">

            <div class="admin-selection-photo">

                <img
                    src="${escapeAttribute(photo)}"
                    alt="${escapeAttribute(selection.naziv || "")}"
                    onerror="this.onerror=null;this.src='images/grb.png';"
                >

            </div>

            <div class="admin-selection-info">

                <strong>
                    ${escapeHtml(selection.naziv || "")}
                </strong>

                ${description}

                <div class="admin-selection-meta">

                    ${year}

                    <span>
                        РЕДОСЛЕД:
                        ${escapeHtml(
                            String(
                                selection.redosled ??
                                0
                            )
                        )}
                    </span>

                    <span
                        class="
                            admin-selection-status
                            ${
                                selection.aktivna
                                    ? "active"
                                    : "inactive"
                            }
                        "
                    >
                        ${
                            selection.aktivna
                                ? "АКТИВНА"
                                : "НЕАКТИВНА"
                        }
                    </span>

                </div>

            </div>

            <div class="admin-selection-actions">

                <button
                    type="button"
                    class="admin-selection-edit"
                    data-edit-selection="${escapeAttribute(selection.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    class="admin-selection-delete"
                    data-delete-selection="${escapeAttribute(selection.id)}"
                >
                    ОБРИШИ
                </button>

            </div>

        </article>

    `;

}


function openSelectionModal(
    selection = null
) {

    if (
        !selectionModal ||
        !selectionForm
    ) {

        return;

    }

    resetSelectionForm();

    if (selection) {

        if (selectionModalTitle) {

            selectionModalTitle.textContent =
                "Измени селекцију";

        }

        if (selectionIdInput) {

            selectionIdInput.value =
                selection.id ||
                "";

        }

        if (selectionCodeInput) {

            selectionCodeInput.value =
                selection.kod ||
                "";

        }

        if (selectionCurrentImage) {

            selectionCurrentImage.value =
                selection.fotografija ||
                "";

        }

        if (selectionNameInput) {

            selectionNameInput.value =
                selection.naziv ||
                "";

        }

        if (selectionYearInput) {

            selectionYearInput.value =
                selection.godiste ||
                "";

        }

        if (selectionDescriptionInput) {

            selectionDescriptionInput.value =
                selection.opis ||
                "";

        }

        if (selectionOrderInput) {

            selectionOrderInput.value =
                selection.redosled ??
                0;

        }

        if (selectionActiveInput) {

            selectionActiveInput.checked =
                selection.aktivna !==
                false;

        }

        if (
            selectionImagePreview &&
            selection.fotografija
        ) {

            selectionImagePreview.src =
                selection.fotografija;

        }

    }

    else {

        if (selectionModalTitle) {

            selectionModalTitle.textContent =
                "Додај селекцију";

        }

    }

    selectionModal.hidden =
        false;

    document.body.style.overflow =
        "hidden";

}


function closeSelectionModal() {

    if (!selectionModal) {

        return;

    }

    selectionModal.hidden =
        true;

    document.body.style.overflow =
        "";

}


function resetSelectionForm() {

    if (!selectionForm) {

        return;

    }

    selectionForm.reset();

    if (selectionIdInput) {

        selectionIdInput.value =
            "";

    }

    if (selectionCodeInput) {

        selectionCodeInput.value =
            "";

    }

    if (selectionCurrentImage) {

        selectionCurrentImage.value =
            "";

    }

    if (selectionOrderInput) {

        selectionOrderInput.value =
            "0";

    }

    if (selectionActiveInput) {

        selectionActiveInput.checked =
            true;

    }

    if (selectionImagePreview) {

        selectionImagePreview.src =
            "images/grb.png";

    }

    if (selectionImageName) {

        selectionImageName.textContent =
            "Није изабрана фотографија";

    }

    setSelectionFormMessage(
        "",
        ""
    );

}


function previewSelectionImage() {

    const file =
        selectionImageInput
            ?.files?.[0];

    if (!file) {

        return;

    }

    try {

        validateImageFile(
            file
        );

    }

    catch (error) {

        setSelectionFormMessage(
            getFriendlyError(
                error,
                "Фотографија није исправна."
            ),
            "error"
        );

        if (selectionImageInput) {

            selectionImageInput.value =
                "";

        }

        return;

    }

    if (selectionImageName) {

        selectionImageName.textContent =
            file.name;

    }

    const objectUrl =
        URL.createObjectURL(
            file
        );

    if (selectionImagePreview) {

        selectionImagePreview.src =
            objectUrl;

        selectionImagePreview.onload =
            () => {

                URL.revokeObjectURL(
                    objectUrl
                );

            };

    }

}


function createSelectionCode(
    name = ""
) {

    return (
        createSlug(
            name
        ) ||
        `selekcija-${Date.now()}`
    );

}


async function saveSelection(
    event
) {

    event.preventDefault();

    setSelectionFormMessage(
        "",
        ""
    );

    const id =
        selectionIdInput
            ?.value
            .trim() ||
        "";

    const name =
        selectionNameInput
            ?.value
            .trim() ||
        "";

    const year =
        selectionYearInput
            ?.value
            .trim() ||
        "";

    const description =
        selectionDescriptionInput
            ?.value
            .trim() ||
        "";

    const orderRaw =
        selectionOrderInput
            ?.value;

    if (!name) {

        setSelectionFormMessage(
            "Назив селекције је обавезан.",
            "error"
        );

        return;

    }

    const order =
        Number.isFinite(
            Number(
                orderRaw
            )
        )

            ? Number(
                orderRaw
            )

            : 0;

    const oldImage =
        selectionCurrentImage
            ?.value
            .trim() ||
        "";

    const existingCode =
        selectionCodeInput
            ?.value
            .trim() ||
        "";

    const code =
        existingCode ||
        createSelectionCode(
            name
        );

    let previousName =
        "";

    if (id) {

        const {
            data: currentSelection,
            error: currentSelectionError
        } =
            await sb
                .from(
                    "selekcije"
                )
                .select(
                    "naziv"
                )
                .eq(
                    "id",
                    id
                )
                .maybeSingle();

        if (currentSelectionError) {

            console.error(
                "Current selection load error:",
                currentSelectionError
            );

        }

        previousName =
            currentSelection?.naziv ||
            "";

    }

    let uploadedImage =
        null;

    setButtonLoading(
        selectionSaveButton,
        true,
        "ЧУВАЊЕ..."
    );

    try {

        const selectedFile =
            selectionImageInput
                ?.files?.[0];

        if (selectedFile) {

            uploadedImage =
                await uploadStorageImage(
                    SELECTIONS_BUCKET,
                    selectedFile,
                    name
                );

        }

        const photo =
            uploadedImage ||
            oldImage ||
            null;

        const payload = {

            kod:
                code,

            naziv:
                name,

            opis:
                description ||
                null,

            godiste:
                year ||
                null,

            fotografija:
                photo,

            redosled:
                order,

            aktivna:
                Boolean(
                    selectionActiveInput
                        ?.checked
                )

        };

        let error;

        if (id) {

            const result =
                await sb
                    .from(
                        "selekcije"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );

            error =
                result.error;

        }

        else {

            const result =
                await sb
                    .from(
                        "selekcije"
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

        if (
            id &&
            previousName &&
            previousName !==
                name
        ) {

            const [
                playersRenameResult,
                staffRenameResult
            ] =
                await Promise.all(
                    [
                        sb
                            .from(
                                "igraci"
                            )
                            .update(
                                {
                                    selekcija:
                                        name
                                }
                            )
                            .eq(
                                "selekcija",
                                previousName
                            ),

                        sb
                            .from(
                                "strucni_stab"
                            )
                            .update(
                                {
                                    selekcija:
                                        name
                                }
                            )
                            .eq(
                                "selekcija",
                                previousName
                            )
                    ]
                );

            if (
                playersRenameResult.error ||
                staffRenameResult.error
            ) {

                console.error(
                    "Selection rename relation error:",
                    playersRenameResult.error ||
                    staffRenameResult.error
                );

                window.alert(
                    "Назив селекције је сачуван, али неки повезани играчи или чланови стручног штаба нису аутоматски ажурирани. Проверите њихову селекцију у админ панелу."
                );

            }

        }

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteStorageImageFromUrl(
                SELECTIONS_BUCKET,
                oldImage
            );

        }

        setSelectionFormMessage(
            "Селекција је успешно сачувана.",
            "success"
        );

        await loadAdminSelectionOptions();

        await Promise.allSettled(
            [
                loadAdminSelections(),
                loadAdminPlayers(),
                loadAdminStaff()
            ]
        );

        setTimeout(
            closeSelectionModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save selection error:",
            error
        );

        if (uploadedImage) {

            await deleteStorageImageFromUrl(
                SELECTIONS_BUCKET,
                uploadedImage
            );

        }

        setSelectionFormMessage(
            getFriendlyError(
                error,
                "Селекција није сачувана."
            ),
            "error"
        );

    }

    finally {

        setButtonLoading(
            selectionSaveButton,
            false,
            "САЧУВАЈ"
        );

    }

}


async function deleteSelection(
    selection
) {

    const [
        playersCheck,
        staffCheck
    ] =
        await Promise.all(
            [
                sb
                    .from(
                        "igraci"
                    )
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )
                    .eq(
                        "selekcija",
                        selection.naziv
                    ),

                sb
                    .from(
                        "strucni_stab"
                    )
                    .select(
                        "id",
                        {
                            count:
                                "exact",

                            head:
                                true
                        }
                    )
                    .eq(
                        "selekcija",
                        selection.naziv
                    )
            ]
        );

    if (
        playersCheck.error ||
        staffCheck.error
    ) {

        console.error(
            "Selection relation check error:",
            playersCheck.error ||
            staffCheck.error
        );

        window.alert(
            "Није могуће проверити да ли селекција има играче или стручни штаб."
        );

        return;

    }

    const playerCount =
        playersCheck.count ??
        0;

    const staffCount =
        staffCheck.count ??
        0;

    if (
        playerCount > 0 ||
        staffCount > 0
    ) {

        window.alert(
            `Селекција „${selection.naziv}“ не може бити обрисана док има повезане играче или чланове стручног штаба.\n\nИграчи: ${playerCount}\nСтручни штаб: ${staffCount}`
        );

        return;

    }

    const confirmed =
        window.confirm(
            `Обрисати селекцију „${selection.naziv}“?`
        );

    if (!confirmed) {

        return;

    }

    const {
        error
    } =
        await sb
            .from(
                "selekcije"
            )
            .delete()
            .eq(
                "id",
                selection.id
            );

    if (error) {

        console.error(
            "Delete selection error:",
            error
        );

        window.alert(
            "Селекцију није могуће обрисати."
        );

        return;

    }

    if (
        selection.fotografija
    ) {

        await deleteStorageImageFromUrl(
            SELECTIONS_BUCKET,
            selection.fotografija
        );

    }

    await loadAdminSelectionOptions();

    await Promise.allSettled(
        [
            loadAdminSelections(),
            loadAdminPlayers(),
            loadAdminStaff()
        ]
    );

}


function setSelectionFormMessage(
    message,
    type
) {

    if (!selectionFormMessage) {

        return;

    }

    selectionFormMessage.textContent =
        message;

    selectionFormMessage.className =
        "admin-form-message";

    if (type) {

        selectionFormMessage
            .classList
            .add(
                type
            );

    }

}


/* =========================================================
   STORAGE
========================================================= */

async function uploadStorageImage(
    bucket,
    file,
    title
) {

    validateImageFile(
        file
    );

    const extension =
        getFileExtension(
            file.name,
            file.type
        );

    const safeName =
        createSlug(
            title
        ) ||
        "slika";

    const path =
        `slike/${Date.now()}-${safeName}.${extension}`;

    const {
        error
    } =
        await sb
            .storage
            .from(
                bucket
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );

    if (error) {

        throw error;

    }

    const {
        data
    } =
        sb
            .storage
            .from(
                bucket
            )
            .getPublicUrl(
                path
            );

    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Није добијена јавна адреса фотографије."
        );

    }

    return data.publicUrl;

}


async function deleteStorageImageFromUrl(
    bucket,
    url
) {

    const path =
        getStoragePathFromPublicUrl(
            bucket,
            url
        );

    if (!path) {

        return;

    }

    const {
        error
    } =
        await sb
            .storage
            .from(
                bucket
            )
            .remove(
                [
                    path
                ]
            );

    if (error) {

        console.warn(
            "Storage delete warning:",
            error
        );

    }

}


function getStoragePathFromPublicUrl(
    bucket,
    url
) {

    if (!url) {

        return "";

    }

    try {

        const parsed =
            new URL(
                url
            );

        const marker =
            `/storage/v1/object/public/${bucket}/`;

        const index =
            parsed.pathname
                .indexOf(
                    marker
                );

        if (
            index ===
            -1
        ) {

            return "";

        }

        return decodeURIComponent(
            parsed.pathname
                .slice(
                    index +
                    marker.length
                )
        );

    }

    catch {

        return "";

    }

}


function validateImageFile(
    file
) {

    const allowedTypes =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Фотографија мора бити JPG, PNG или WebP."
        );

    }

    const maxSize =
        8 *
        1024 *
        1024;

    if (
        file.size >
        maxSize
    ) {

        throw new Error(
            "Фотографија не сме бити већа од 8 MB."
        );

    }

}


function getFileExtension(
    fileName,
    mimeType
) {

    const extension =
        String(
            fileName ||
            ""
        )
            .split(
                "."
            )
            .pop()
            .toLowerCase();

    if (
        [
            "jpg",
            "jpeg",
            "png",
            "webp"
        ].includes(
            extension
        )
    ) {

        return extension ===
            "jpeg"
                ? "jpg"
                : extension;

    }

    const map = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp"

    };

    return (
        map[mimeType] ||
        "jpg"
    );

}


/* =========================================================
   GRBOVI
========================================================= */

function getClubLogoPath(
    teamName
) {

    const name =
        normalizeText(
            teamName
        );

    const logos = {

        "obilic":
            "images/grbovi/obilic.webp",

        "fk obilic":
            "images/grbovi/obilic.webp",

        "djala 1922":
            "images/grbovi/djala-1922.webp",

        "dj ala 1922":
            "images/grbovi/djala-1922.webp",

        "potisje":
            "images/grbovi/potisje.webp",

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
        logos[name] ||
        ""
    );

}


/* =========================================================
   DATUMI
========================================================= */

function formatDateDisplay(
    dateString
) {

    if (!dateString) {

        return "";

    }

    const date =
        new Date(
            `${dateString}T12:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

    const result =
        new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric",

                timeZone:
                    "Europe/Belgrade"
            }
        )
            .format(
                date
            );

    return `${result}.`;

}


function formatBirthDate(
    dateString
) {

    if (!dateString) {

        return "";

    }

    const parts =
        dateString
            .split(
                "-"
            );

    if (
        parts.length !==
        3
    ) {

        return dateString;

    }

    return (
        `${parts[2]}.` +
        `${parts[1]}.` +
        `${parts[0]}.`
    );

}


function getTodayInputValue() {

    const now =
        new Date();

    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                timeZone:
                    "Europe/Belgrade"
            }
        );

    return formatter.format(
        now
    );

}


/* =========================================================
   SLUG
========================================================= */

function createSlug(
    value
) {

    return latinize(
        String(
            value ||
            ""
        )
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            80
        );

}


function latinize(
    value
) {

    const map = {

        "А":"A","Б":"B","В":"V","Г":"G",
        "Д":"D","Ђ":"Dj","Е":"E","Ж":"Z",
        "З":"Z","И":"I","Ј":"J","К":"K",
        "Л":"L","Љ":"Lj","М":"M","Н":"N",
        "Њ":"Nj","О":"O","П":"P","Р":"R",
        "С":"S","Т":"T","Ћ":"C","У":"U",
        "Ф":"F","Х":"H","Ц":"C","Ч":"C",
        "Џ":"Dz","Ш":"S",

        "а":"a","б":"b","в":"v","г":"g",
        "д":"d","ђ":"dj","е":"e","ж":"z",
        "з":"z","и":"i","ј":"j","к":"k",
        "л":"l","љ":"lj","м":"m","н":"n",
        "њ":"nj","о":"o","п":"p","р":"r",
        "с":"s","т":"t","ћ":"c","у":"u",
        "ф":"f","х":"h","ц":"c","ч":"c",
        "џ":"dz","ш":"s",

        "Č":"C","Ć":"C","Đ":"Dj",
        "Š":"S","Ž":"Z",

        "č":"c","ć":"c","đ":"dj",
        "š":"s","ž":"z"

    };

    return String(
        value
    )
        .split(
            ""
        )
        .map(
            character =>
                map[character] ??
                character
        )
        .join(
            ""
        );

}


function normalizeText(
    value
) {

    return latinize(
        String(
            value ||
            ""
        )
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}


/* =========================================================
   PORUKE
========================================================= */

function setLoginMessage(
    message,
    type
) {

    if (!loginMessage) {

        return;

    }

    loginMessage.textContent =
        message;

    loginMessage.className =
        "admin-login-message";

    if (type) {

        loginMessage.classList
            .add(
                type
            );

    }

}


function setNewsFormMessage(
    message,
    type
) {

    if (!newsFormMessage) {

        return;

    }

    newsFormMessage.textContent =
        message;

    newsFormMessage.className =
        "admin-form-message";

    if (type) {

        newsFormMessage.classList
            .add(
                type
            );

    }

}


function setPlayerFormMessage(
    message,
    type
) {

    if (!playerFormMessage) {

        return;

    }

    playerFormMessage.textContent =
        message;

    playerFormMessage.className =
        "admin-form-message";

    if (type) {

        playerFormMessage.classList
            .add(
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


function getFriendlyError(
    error,
    fallback
) {

    const message =
        String(
            error?.message ||
            ""
        );

    if (
        message.includes(
            "duplicate key"
        )
    ) {

        return "Већ постоји исти запис.";

    }

    if (
        message.includes(
            "row-level security"
        )
    ) {

        return "Немате дозволу за ову операцију.";

    }

    if (
        message.includes(
            "Bucket not found"
        )
    ) {

        return "Storage bucket није пронађен.";

    }

    return (
        message ||
        fallback
    );

}


function escapeHtml(
    value = ""
) {

    return String(
        value
    )
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