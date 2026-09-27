/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   ADMIN PANEL
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


const NEWS_BUCKET =
    "vesti";



/* =========================================================
   ELEMENTI - LOGIN / PANEL
========================================================= */

const loginScreen =
    document.querySelector("#admin-login-screen");

const adminPanel =
    document.querySelector("#admin-panel");

const loginForm =
    document.querySelector("#admin-login-form");

const emailInput =
    document.querySelector("#admin-email");

const passwordInput =
    document.querySelector("#admin-password");

const loginMessage =
    document.querySelector("#admin-login-message");

const logoutButton =
    document.querySelector("#admin-logout-button");

const adminUserEmail =
    document.querySelector("#admin-user-email");

const adminPageTitle =
    document.querySelector("#admin-page-title");

const navigationButtons =
    document.querySelectorAll(".admin-nav-item");

const adminPages =
    document.querySelectorAll(".admin-page");



/* =========================================================
   ELEMENTI - VESTI
========================================================= */

const adminNewsList =
    document.querySelector("#admin-news-list");

const addNewsButton =
    document.querySelector("#admin-add-news");

const newsModal =
    document.querySelector("#admin-news-modal");

const newsForm =
    document.querySelector("#admin-news-form");

const newsModalTitle =
    document.querySelector("#admin-news-modal-title");

const newsIdInput =
    document.querySelector("#admin-news-id");

const currentImageInput =
    document.querySelector("#admin-news-current-image");

const newsTitleInput =
    document.querySelector("#admin-news-title");

const newsCategoryInput =
    document.querySelector("#admin-news-category");

const newsDateInput =
    document.querySelector("#admin-news-date");

const newsExcerptInput =
    document.querySelector("#admin-news-excerpt");

const newsContentInput =
    document.querySelector("#admin-news-content");

const newsImageInput =
    document.querySelector("#admin-news-image");

const newsImagePreview =
    document.querySelector(
        "#admin-news-image-preview img"
    );

const newsImageName =
    document.querySelector("#admin-news-image-name");

const newsSourceNameInput =
    document.querySelector("#admin-news-source-name");

const newsSourceUrlInput =
    document.querySelector("#admin-news-source-url");

const newsHasMatchInput =
    document.querySelector("#admin-news-has-match");

const newsMatchFields =
    document.querySelector("#admin-news-match-fields");

const newsHomeInput =
    document.querySelector("#admin-news-home");

const newsAwayInput =
    document.querySelector("#admin-news-away");

const newsHomeScoreInput =
    document.querySelector("#admin-news-home-score");

const newsAwayScoreInput =
    document.querySelector("#admin-news-away-score");

const newsFeaturedInput =
    document.querySelector("#admin-news-featured");

const newsPublishedInput =
    document.querySelector("#admin-news-published");

const newsFormMessage =
    document.querySelector("#admin-news-form-message");

const newsSaveButton =
    document.querySelector("#admin-news-save-button");

const closeNewsModalButtons =
    document.querySelectorAll("[data-close-news-modal]");



/* =========================================================
   STANJE
========================================================= */

let editingNews =
    null;

let previewObjectUrl =
    null;

let savingNews =
    false;



/* =========================================================
   NASLOVI STRANICA
========================================================= */

const pageTitles = {

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



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeAdmin
);



async function initializeAdmin() {

    if (!window.supabase) {

        showLoginMessage(
            "Није могуће учитати систем за пријаву."
        );

        return;
    }


    setupLogin();

    setupLogout();

    setupNavigation();

    setupNewsActions();

    setupNewsModal();

    setupNewsImagePreview();

    setupMatchFields();


    await checkCurrentSession();


    supabaseClient.auth.onAuthStateChange(
        event => {

            if (event === "SIGNED_OUT") {

                showLoginScreen();

            }

        }
    );

}



/* =========================================================
   SESIJA
========================================================= */

async function checkCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .auth
                .getSession();


        if (error) {
            throw error;
        }


        if (data?.session?.user) {

            await handleAuthenticatedUser(
                data.session.user
            );

            return;
        }


        showLoginScreen();

    }

    catch (error) {

        console.error(
            "Грешка при провери пријаве:",
            error
        );


        showLoginScreen();


        showLoginMessage(
            "Није могуће проверити пријаву."
        );

    }

}



/* =========================================================
   ADMIN PROVERA
========================================================= */

async function verifyAdminUser(user) {

    if (!user?.id) {
        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_users")
            .select("user_id")
            .eq(
                "user_id",
                user.id
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    return Boolean(data);

}



async function handleAuthenticatedUser(user) {

    try {

        const isAdmin =
            await verifyAdminUser(
                user
            );


        if (!isAdmin) {

            await supabaseClient
                .auth
                .signOut();


            showLoginScreen();


            showLoginMessage(
                "Овај налог нема администраторски приступ."
            );

            return false;
        }


        showAdminPanel(
            user
        );


        return true;

    }

    catch (error) {

        console.error(
            "Грешка при провери администратора:",
            error
        );


        showLoginScreen();


        showLoginMessage(
            "Није могуће проверити администраторски приступ."
        );


        return false;
    }

}



/* =========================================================
   LOGIN
========================================================= */

function setupLogin() {

    if (!loginForm) {
        return;
    }


    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                emailInput?.value?.trim();

            const password =
                passwordInput?.value;


            if (!email || !password) {

                showLoginMessage(
                    "Унесите е-маил и лозинку."
                );

                return;
            }


            setLoginLoading(true);

            clearLoginMessage();


            try {

                const {
                    data,
                    error
                } =
                    await supabaseClient
                        .auth
                        .signInWithPassword({
                            email,
                            password
                        });


                if (error) {
                    throw error;
                }


                if (!data?.user) {

                    throw new Error(
                        "Корисник није пронађен."
                    );

                }


                const allowed =
                    await handleAuthenticatedUser(
                        data.user
                    );


                if (
                    allowed &&
                    passwordInput
                ) {

                    passwordInput.value =
                        "";

                }

            }

            catch (error) {

                console.error(
                    "Грешка при пријави:",
                    error
                );


                showLoginMessage(
                    getLoginErrorMessage(
                        error
                    )
                );

            }

            finally {

                setLoginLoading(false);

            }

        }
    );

}



/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled =
                true;


            try {

                const {
                    error
                } =
                    await supabaseClient
                        .auth
                        .signOut();


                if (error) {
                    throw error;
                }


                showLoginScreen();

            }

            catch (error) {

                console.error(
                    "Грешка при одјави:",
                    error
                );


                alert(
                    "Није могуће извршити одјаву."
                );

            }

            finally {

                logoutButton.disabled =
                    false;

            }

        }
    );

}



/* =========================================================
   PRIKAZ ADMIN PANELA
========================================================= */

function showAdminPanel(user) {

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
            user?.email ||
            "Администратор";

    }


    clearLoginMessage();

    openAdminPage("dashboard");

    loadDashboardStats();

}



/* =========================================================
   LOGIN EKRAN
========================================================= */

function showLoginScreen() {

    closeNewsModal();


    if (adminPanel) {

        adminPanel.hidden =
            true;

    }


    if (loginScreen) {

        loginScreen.hidden =
            false;

    }


    if (adminUserEmail) {

        adminUserEmail.textContent =
            "—";

    }

}



/* =========================================================
   NAVIGACIJA
========================================================= */

function setupNavigation() {

    navigationButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.adminPage;


                    if (!page) {
                        return;
                    }


                    openAdminPage(page);


                    if (page === "vesti") {

                        loadAdminNews();

                    }

                }
            );

        }
    );

}



function openAdminPage(page) {

    navigationButtons.forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.adminPage === page
            );

        }
    );


    adminPages.forEach(
        section => {

            section.classList.toggle(
                "active",
                section.dataset.page === page
            );

        }
    );


    if (adminPageTitle) {

        adminPageTitle.textContent =
            pageTitles[page] ||
            "Админ панел";

    }

}



/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboardStats() {

    await Promise.all([

        loadNewsCount(),

        loadPlayersCount(),

        loadGalleryCount(),

        loadPartnersCount()

    ]);

}



/* =========================================================
   BROJ VESTI
========================================================= */

async function loadNewsCount() {

    const element =
        document.querySelector(
            "#admin-stat-news"
        );


    if (!element) {
        return;
    }


    try {

        const {
            count,
            error
        } =
            await supabaseClient
                .from("vesti")
                .select(
                    "id",
                    {
                        count: "exact",
                        head: true
                    }
                )
                .eq(
                    "published",
                    true
                );


        if (error) {
            throw error;
        }


        element.textContent =
            count ?? 0;

    }

    catch (error) {

        console.error(
            "Грешка при бројању вести:",
            error
        );


        element.textContent =
            "—";

    }

}



/* =========================================================
   IGRAČI - JOŠ UVEK JSON
========================================================= */

async function loadPlayersCount() {

    const element =
        document.querySelector(
            "#admin-stat-players"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                "data/igraci.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {
            throw new Error();
        }


        const data =
            await response.json();


        const players =
            data?.prviTim?.igraci;


        element.textContent =
            Array.isArray(players)
                ? players.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   GALERIJA - JOŠ UVEK JSON
========================================================= */

async function loadGalleryCount() {

    const element =
        document.querySelector(
            "#admin-stat-gallery"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                "data/galerija.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {
            throw new Error();
        }


        const data =
            await response.json();


        const photos =
            data?.fotografije;


        element.textContent =
            Array.isArray(photos)
                ? photos.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   PARTNERI - JOŠ UVEK JSON
========================================================= */

async function loadPartnersCount() {

    const element =
        document.querySelector(
            "#admin-stat-partners"
        );


    if (!element) {
        return;
    }


    try {

        const response =
            await fetch(
                "data/partneri.json",
                {
                    cache:
                        "no-store"
                }
            );


        if (!response.ok) {
            throw new Error();
        }


        const data =
            await response.json();


        const partners =
            data?.partneri;


        element.textContent =
            Array.isArray(partners)
                ? partners.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   UČITAVANJE VESTI
========================================================= */

async function loadAdminNews() {

    if (!adminNewsList) {
        return;
    }


    adminNewsList.innerHTML = `

        <div class="admin-data-loading">

            <div class="loader"></div>

            <span>
                Учитавање вести...
            </span>

        </div>

    `;


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("vesti")
                .select(`
                    id,
                    slug,
                    title,
                    category,
                    date,
                    date_display,
                    image,
                    excerpt,
                    featured,
                    published,
                    created_at
                `)
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
            throw error;
        }


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            renderEmptyNews();

            return;
        }


        renderAdminNews(data);

    }

    catch (error) {

        console.error(
            "Грешка при учитавању вести:",
            error
        );


        renderNewsError();

    }

}



/* =========================================================
   PRIKAZ VESTI
========================================================= */

function renderAdminNews(news) {

    if (!adminNewsList) {
        return;
    }


    adminNewsList.innerHTML =
        news
            .map(article => {

                const image =
                    getNewsImage(
                        article.image
                    );


                const date =
                    article.date_display ||
                    formatDateDisplay(
                        article.date
                    );


                const category =
                    article.category ||
                    "ВЕСТ";


                const statusClass =
                    article.published
                        ? "published"
                        : "draft";


                const statusText =
                    article.published
                        ? "ОБЈАВЉЕНО"
                        : "НАЦРТ";


                const featured =
                    article.featured
                        ? " • ИСТАКНУТА"
                        : "";


                return `

                    <article
                        class="admin-news-row"
                        data-news-id="${escapeAttribute(article.id)}"
                    >


                        <div class="admin-news-image">

                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(article.title || "ФК Обилић")}"
                                onerror="this.onerror=null;this.src='images/grb.png';"
                            >

                        </div>


                        <div class="admin-news-info">

                            <span class="admin-news-category">

                                ${escapeHtml(category)}
                                ${featured}

                            </span>


                            <h3>
                                ${escapeHtml(article.title || "")}
                            </h3>


                            ${
                                article.excerpt
                                    ? `
                                        <p>
                                            ${escapeHtml(article.excerpt)}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>


                        <div class="admin-news-date">
                            ${escapeHtml(date)}
                        </div>


                        <div>

                            <span
                                class="admin-news-status ${statusClass}"
                            >
                                ${statusText}
                            </span>

                        </div>


                        <div class="admin-news-actions">

                            <button
                                type="button"
                                class="admin-news-action edit"
                                data-edit-news="${escapeAttribute(article.id)}"
                            >
                                ИЗМЕНИ
                            </button>


                            <button
                                type="button"
                                class="admin-news-action delete"
                                data-delete-news="${escapeAttribute(article.id)}"
                                data-news-title="${escapeAttribute(article.title || "")}"
                            >
                                ОБРИШИ
                            </button>

                        </div>


                    </article>

                `;

            })
            .join("");

}



/* =========================================================
   PRAZNA LISTA
========================================================= */

function renderEmptyNews() {

    adminNewsList.innerHTML = `

        <div class="admin-news-empty">

            <img
                src="images/grb.png"
                alt=""
            >

            <strong>
                НЕМА ВЕСТИ
            </strong>

            <span>
                Додајте прву вест на сајт.
            </span>

        </div>

    `;

}



/* =========================================================
   GREŠKA
========================================================= */

function renderNewsError() {

    adminNewsList.innerHTML = `

        <div class="admin-news-empty">

            <img
                src="images/grb.png"
                alt=""
            >

            <strong>
                ГРЕШКА ПРИ УЧИТАВАЊУ
            </strong>

            <span>
                Вести тренутно није могуће учитати.
            </span>

        </div>

    `;

}



/* =========================================================
   AKCIJE VESTI
========================================================= */

function setupNewsActions() {

    if (addNewsButton) {

        addNewsButton.addEventListener(
            "click",
            () => {

                openNewNewsModal();

            }
        );

    }


    if (!adminNewsList) {
        return;
    }


    adminNewsList.addEventListener(
        "click",
        async event => {

            const editButton =
                event.target.closest(
                    "[data-edit-news]"
                );


            if (editButton) {

                const id =
                    editButton.dataset.editNews;


                await openEditNewsModal(
                    id
                );

                return;
            }


            const deleteButton =
                event.target.closest(
                    "[data-delete-news]"
                );


            if (!deleteButton) {
                return;
            }


            const newsId =
                deleteButton.dataset.deleteNews;


            const newsTitle =
                deleteButton.dataset.newsTitle ||
                "ову вест";


            const confirmed =
                window.confirm(
                    `Да ли сте сигурни да желите да обришете вест:\n\n${newsTitle}?`
                );


            if (!confirmed) {
                return;
            }


            await deleteNews(
                newsId,
                deleteButton
            );

        }
    );

}



/* =========================================================
   MODAL
========================================================= */

function setupNewsModal() {

    closeNewsModalButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                closeNewsModal
            );

        }
    );


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
                event.key === "Escape" &&
                newsModal &&
                !newsModal.hidden
            ) {

                closeNewsModal();

            }

        }
    );

}



function openNewNewsModal() {

    resetNewsForm();


    editingNews =
        null;


    if (newsModalTitle) {

        newsModalTitle.textContent =
            "Додај нову вест";

    }


    if (newsDateInput) {

        newsDateInput.value =
            getTodayDateValue();

    }


    if (newsPublishedInput) {

        newsPublishedInput.checked =
            true;

    }


    openNewsModal();

}



async function openEditNewsModal(id) {

    if (!id) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("vesti")
                .select("*")
                .eq("id", id)
                .single();


        if (error) {
            throw error;
        }


        editingNews =
            data;


        resetNewsForm(
            false
        );


        if (newsModalTitle) {

            newsModalTitle.textContent =
                "Измени вест";

        }


        newsIdInput.value =
            data.id || "";


        currentImageInput.value =
            data.image || "";


        newsTitleInput.value =
            data.title || "";


        newsCategoryInput.value =
            data.category ||
            "ПРВИ ТИМ";


        newsDateInput.value =
            data.date || "";


        newsExcerptInput.value =
            data.excerpt || "";


        newsContentInput.value =
            Array.isArray(data.content)
                ? data.content.join("\n\n")
                : "";


        newsSourceNameInput.value =
            data.source?.name ||
            "";


        newsSourceUrlInput.value =
            data.source?.url ||
            "";


        newsFeaturedInput.checked =
            Boolean(
                data.featured
            );


        newsPublishedInput.checked =
            Boolean(
                data.published
            );


        if (data.match_data) {

            newsHasMatchInput.checked =
                true;


            newsMatchFields.hidden =
                false;


            newsHomeInput.value =
                data.match_data.home ||
                "";


            newsAwayInput.value =
                data.match_data.away ||
                "";


            newsHomeScoreInput.value =
                data.match_data.homeScore ??
                "";


            newsAwayScoreInput.value =
                data.match_data.awayScore ??
                "";

        }


        setNewsPreview(
            data.image ||
            "images/grb.png"
        );


        if (newsImageName) {

            newsImageName.textContent =
                data.image
                    ? "Тренутна фотографија"
                    : "Није изабрана фотографија";

        }


        openNewsModal();

    }

    catch (error) {

        console.error(
            "Грешка при учитавању вести:",
            error
        );


        alert(
            "Вест није могуће учитати за измену."
        );

    }

}



function openNewsModal() {

    if (!newsModal) {
        return;
    }


    newsModal.hidden =
        false;


    document.body.classList.add(
        "admin-modal-open"
    );


    setTimeout(
        () => {

            newsTitleInput?.focus();

        },
        50
    );

}



function closeNewsModal() {

    if (!newsModal) {
        return;
    }


    newsModal.hidden =
        true;


    document.body.classList.remove(
        "admin-modal-open"
    );


    clearPreviewObjectUrl();

}



/* =========================================================
   RESET FORME
========================================================= */

function resetNewsForm(
    clearEditing = true
) {

    if (newsForm) {

        newsForm.reset();

    }


    if (clearEditing) {

        editingNews =
            null;

    }


    if (newsIdInput) {

        newsIdInput.value =
            "";

    }


    if (currentImageInput) {

        currentImageInput.value =
            "";

    }


    if (newsPublishedInput) {

        newsPublishedInput.checked =
            true;

    }


    if (newsHasMatchInput) {

        newsHasMatchInput.checked =
            false;

    }


    if (newsMatchFields) {

        newsMatchFields.hidden =
            true;

    }


    setNewsPreview(
        "images/grb.png"
    );


    if (newsImageName) {

        newsImageName.textContent =
            "Није изабрана нова фотографија";

    }


    clearNewsFormMessage();

}



/* =========================================================
   REZULTAT UTAKMICE
========================================================= */

function setupMatchFields() {

    if (!newsHasMatchInput) {
        return;
    }


    newsHasMatchInput.addEventListener(
        "change",
        () => {

            if (!newsMatchFields) {
                return;
            }


            newsMatchFields.hidden =
                !newsHasMatchInput.checked;

        }
    );

}



/* =========================================================
   PREVIEW SLIKE
========================================================= */

function setupNewsImagePreview() {

    if (!newsImageInput) {
        return;
    }


    newsImageInput.addEventListener(
        "change",
        () => {

            const file =
                newsImageInput.files?.[0];


            if (!file) {

                if (editingNews?.image) {

                    setNewsPreview(
                        editingNews.image
                    );

                }

                return;
            }


            const allowedTypes = [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !allowedTypes.includes(
                    file.type
                )
            ) {

                alert(
                    "Дозвољене су JPG, PNG и WEBP фотографије."
                );


                newsImageInput.value =
                    "";

                return;
            }


            clearPreviewObjectUrl();


            previewObjectUrl =
                URL.createObjectURL(
                    file
                );


            setNewsPreview(
                previewObjectUrl
            );


            if (newsImageName) {

                newsImageName.textContent =
                    file.name;

            }

        }
    );

}



function setNewsPreview(src) {

    if (!newsImagePreview) {
        return;
    }


    newsImagePreview.src =
        src ||
        "images/grb.png";

}



function clearPreviewObjectUrl() {

    if (!previewObjectUrl) {
        return;
    }


    URL.revokeObjectURL(
        previewObjectUrl
    );


    previewObjectUrl =
        null;

}



/* =========================================================
   ČUVANJE VESTI
========================================================= */

async function saveNews(event) {

    event.preventDefault();


    if (savingNews) {
        return;
    }


    clearNewsFormMessage();


    const title =
        newsTitleInput?.value
            ?.trim();


    const date =
        newsDateInput?.value;


    const contentText =
        newsContentInput?.value
            ?.trim();


    if (
        !title ||
        !date ||
        !contentText
    ) {

        showNewsFormMessage(
            "Попуните наслов, датум и текст вести.",
            "error"
        );

        return;
    }


    const paragraphs =
        contentText
            .split(/\n\s*\n/)
            .map(
                paragraph =>
                    paragraph.trim()
            )
            .filter(Boolean);


    if (!paragraphs.length) {

        showNewsFormMessage(
            "Унесите текст вести.",
            "error"
        );

        return;
    }


    if (
        newsHasMatchInput?.checked
    ) {

        if (
            !newsHomeInput.value.trim() ||
            !newsAwayInput.value.trim() ||
            newsHomeScoreInput.value === "" ||
            newsAwayScoreInput.value === ""
        ) {

            showNewsFormMessage(
                "Попуните све податке о резултату утакмице.",
                "error"
            );

            return;
        }

    }


    savingNews =
        true;


    setNewsSaveLoading(
        true
    );


    let uploadedImagePath =
        null;


    try {

        const id =
            newsIdInput?.value ||
            null;


        let slug =
            editingNews?.slug ||
            "";


        if (!slug) {

            slug =
                await createUniqueSlug(
                    title
                );

        }


        let image =
            currentImageInput?.value ||
            editingNews?.image ||
            "";


        const newImageFile =
            newsImageInput
                ?.files?.[0];


        if (newImageFile) {

            const uploadResult =
                await uploadNewsImage(
                    newImageFile,
                    slug
                );


            image =
                uploadResult.publicUrl;


            uploadedImagePath =
                uploadResult.path;

        }


        const sourceName =
            newsSourceNameInput
                ?.value
                ?.trim() ||
            "";


        const sourceUrl =
            newsSourceUrlInput
                ?.value
                ?.trim() ||
            "";


        const source =
            sourceName ||
            sourceUrl
                ? {
                    name:
                        sourceName ||
                        "Извор",

                    url:
                        sourceUrl ||
                        ""
                }
                : null;


        const matchData =
            buildMatchData();


        const articleData = {

            slug,

            title,

            category:
                newsCategoryInput?.value ||
                "ПРВИ ТИМ",

            date,

            date_display:
                formatDateDisplay(
                    date
                ),

            image:
                image ||
                null,

            excerpt:
                newsExcerptInput
                    ?.value
                    ?.trim() ||
                "",

            content:
                paragraphs,

            match_data:
                matchData,

            source,

            featured:
                Boolean(
                    newsFeaturedInput
                        ?.checked
                ),

            published:
                Boolean(
                    newsPublishedInput
                        ?.checked
                )

        };


        let result;


        if (id) {

            result =
                await supabaseClient
                    .from("vesti")
                    .update(
                        articleData
                    )
                    .eq(
                        "id",
                        id
                    )
                    .select()
                    .single();

        }

        else {

            result =
                await supabaseClient
                    .from("vesti")
                    .insert(
                        articleData
                    )
                    .select()
                    .single();

        }


        if (result.error) {

            throw result.error;

        }


        /*
         * Ako smo prilikom izmene postavili novu sliku,
         * staru Supabase sliku brišemo tek kada je baza
         * uspešno sačuvana.
         */

        if (
            id &&
            newImageFile &&
            editingNews?.image
        ) {

            const oldPath =
                extractNewsStoragePath(
                    editingNews.image
                );


            if (
                oldPath &&
                oldPath !== uploadedImagePath
            ) {

                await supabaseClient
                    .storage
                    .from(
                        NEWS_BUCKET
                    )
                    .remove([
                        oldPath
                    ]);

            }

        }


        showNewsFormMessage(
            id
                ? "Вест је успешно измењена."
                : "Вест је успешно додата.",
            "success"
        );


        await Promise.all([

            loadAdminNews(),

            loadNewsCount()

        ]);


        setTimeout(
            () => {

                closeNewsModal();

            },
            500
        );

    }

    catch (error) {

        console.error(
            "Грешка при чувању вести:",
            error
        );


        /*
         * Ako je upload uspeo, a upis u bazu nije,
         * uklanjamo novu sliku da ne ostane nepotreban
         * fajl u Storage-u.
         */

        if (uploadedImagePath) {

            try {

                await supabaseClient
                    .storage
                    .from(
                        NEWS_BUCKET
                    )
                    .remove([
                        uploadedImagePath
                    ]);

            }

            catch {
                // Nije kritično.
            }

        }


        let message =
            "Вест није могуће сачувати.";


        if (
            String(
                error?.message || ""
            )
                .toLowerCase()
                .includes("duplicate")
        ) {

            message =
                "Вест са овим називом већ постоји.";

        }


        showNewsFormMessage(
            message,
            "error"
        );

    }

    finally {

        savingNews =
            false;


        setNewsSaveLoading(
            false
        );

    }

}



/* =========================================================
   MATCH DATA
========================================================= */

function buildMatchData() {

    if (
        !newsHasMatchInput?.checked
    ) {

        return null;

    }


    const home =
        newsHomeInput
            .value
            .trim();


    const away =
        newsAwayInput
            .value
            .trim();


    const homeScore =
        Number(
            newsHomeScoreInput.value
        );


    const awayScore =
        Number(
            newsAwayScoreInput.value
        );


    return {

        home,

        away,

        homeLogo:
            getClubLogoPath(
                home
            ),

        awayLogo:
            getClubLogoPath(
                away
            ),

        homeScore,

        awayScore

    };

}



/* =========================================================
   GRBOVI KLUBOVA
========================================================= */

function getClubLogoPath(teamName = "") {

    const team =
        normalizeTeamName(
            teamName
        );


    const logos = {

        "obilic":
            "images/grbovi/obilic.webp",

        "potisje":
            "images/grbovi/potisje.webp",

        "djala 1922":
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


    return logos[team] ||
        "";

}



/* =========================================================
   UPLOAD FOTOGRAFIJE
========================================================= */

async function uploadNewsImage(
    file,
    slug
) {

    const extension =
        getFileExtension(
            file
        );


    const safeSlug =
        slug
            .slice(0, 70) ||
        "vest";


    const path =
        `slike/${Date.now()}-${safeSlug}.${extension}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(
                NEWS_BUCKET
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
        supabaseClient
            .storage
            .from(
                NEWS_BUCKET
            )
            .getPublicUrl(
                path
            );


    if (!data?.publicUrl) {

        throw new Error(
            "Јавни URL фотографије није добијен."
        );

    }


    return {

        path,

        publicUrl:
            data.publicUrl

    };

}



function getFileExtension(file) {

    const type =
        file?.type ||
        "";


    if (
        type === "image/jpeg"
    ) {

        return "jpg";

    }


    if (
        type === "image/png"
    ) {

        return "png";

    }


    if (
        type === "image/webp"
    ) {

        return "webp";

    }


    const nameExtension =
        String(
            file?.name || ""
        )
            .split(".")
            .pop()
            .toLowerCase();


    return nameExtension ||
        "jpg";

}



/* =========================================================
   BRISANJE VESTI
========================================================= */

async function deleteNews(
    newsId,
    button
) {

    if (!newsId) {
        return;
    }


    if (button) {

        button.disabled =
            true;


        button.textContent =
            "БРИСАЊЕ...";

    }


    try {

        /*
         * Prvo učitamo vest da bismo znali
         * da li ima fotografiju u Supabase Storage-u.
         */

        const {
            data: article,
            error: readError
        } =
            await supabaseClient
                .from("vesti")
                .select(
                    "id, image"
                )
                .eq(
                    "id",
                    newsId
                )
                .single();


        if (readError) {
            throw readError;
        }


        const {
            error
        } =
            await supabaseClient
                .from("vesti")
                .delete()
                .eq(
                    "id",
                    newsId
                );


        if (error) {
            throw error;
        }


        /*
         * Lokalnu sliku iz images/vesti ne diramo.
         * Brišemo samo sliku koja pripada našem
         * Supabase bucket-u.
         */

        const storagePath =
            extractNewsStoragePath(
                article?.image
            );


        if (storagePath) {

            const {
                error: storageError
            } =
                await supabaseClient
                    .storage
                    .from(
                        NEWS_BUCKET
                    )
                    .remove([
                        storagePath
                    ]);


            if (storageError) {

                console.warn(
                    "Вест је обрисана, али слика није уклоњена:",
                    storageError
                );

            }

        }


        await Promise.all([

            loadAdminNews(),

            loadNewsCount()

        ]);

    }

    catch (error) {

        console.error(
            "Грешка при брисању вести:",
            error
        );


        alert(
            "Вест није могуће обрисати."
        );


        if (button) {

            button.disabled =
                false;


            button.textContent =
                "ОБРИШИ";

        }

    }

}



/* =========================================================
   STORAGE PATH
========================================================= */

function extractNewsStoragePath(url = "") {

    const marker =
        `/storage/v1/object/public/${NEWS_BUCKET}/`;


    const value =
        String(
            url || ""
        );


    if (
        !value.includes(
            marker
        )
    ) {

        return null;

    }


    const path =
        value
            .split(marker)[1]
            ?.split("?")[0];


    if (!path) {
        return null;
    }


    try {

        return decodeURIComponent(
            path
        );

    }

    catch {

        return path;

    }

}



/* =========================================================
   SLUG
========================================================= */

async function createUniqueSlug(
    title
) {

    let base =
        createSlug(
            title
        );


    if (!base) {

        base =
            `vest-${Date.now()}`;

    }


    let candidate =
        base;


    for (
        let attempt = 0;
        attempt < 50;
        attempt++
    ) {

        const {
            data,
            error
        } =
            await supabaseClient
                .from("vesti")
                .select(
                    "id"
                )
                .eq(
                    "slug",
                    candidate
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            return candidate;

        }


        candidate =
            `${base}-${attempt + 2}`;

    }


    return `${base}-${Date.now()}`;

}



function createSlug(value = "") {

    return transliterateSerbian(
        value
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .replace(
            /-+/g,
            "-"
        );

}



/* =========================================================
   PRETVARANJE ĆIRILICE
========================================================= */

function transliterateSerbian(
    value = ""
) {

    const map = {

        А: "A",
        Б: "B",
        В: "V",
        Г: "G",
        Д: "D",
        Ђ: "Dj",
        Е: "E",
        Ж: "Z",
        З: "Z",
        И: "I",
        Ј: "J",
        К: "K",
        Л: "L",
        Љ: "Lj",
        М: "M",
        Н: "N",
        Њ: "Nj",
        О: "O",
        П: "P",
        Р: "R",
        С: "S",
        Т: "T",
        Ћ: "C",
        У: "U",
        Ф: "F",
        Х: "H",
        Ц: "C",
        Ч: "C",
        Џ: "Dz",
        Ш: "S",

        а: "a",
        б: "b",
        в: "v",
        г: "g",
        д: "d",
        ђ: "dj",
        е: "e",
        ж: "z",
        з: "z",
        и: "i",
        ј: "j",
        к: "k",
        л: "l",
        љ: "lj",
        м: "m",
        н: "n",
        њ: "nj",
        о: "o",
        п: "p",
        р: "r",
        с: "s",
        т: "t",
        ћ: "c",
        у: "u",
        ф: "f",
        х: "h",
        ц: "c",
        ч: "c",
        џ: "dz",
        ш: "s"

    };


    return String(value)
        .split("")
        .map(
            character =>
                map[character] ??
                character
        )
        .join("");

}



/* =========================================================
   NORMALIZACIJA NAZIVA KLUBA
========================================================= */

function normalizeTeamName(
    value = ""
) {

    return transliterateSerbian(
        value
    )
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /đ/g,
            "dj"
        )
        .replace(
            /[^a-z0-9]+/g,
            " "
        )
        .trim();

}



/* =========================================================
   DATUM
========================================================= */

function getTodayDateValue() {

    const date =
        new Date();


    const local =
        new Date(
            date.getTime() -
            date.getTimezoneOffset() *
            60000
        );


    return local
        .toISOString()
        .slice(
            0,
            10
        );

}



function formatDateDisplay(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const parts =
        String(dateString)
            .split("-");


    if (
        parts.length !== 3
    ) {

        return dateString;

    }


    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const day =
        Number(parts[2]);


    const months = [

        "јануар",
        "фебруар",
        "март",
        "април",
        "мај",
        "јун",
        "јул",
        "август",
        "септембар",
        "октобар",
        "новембар",
        "децембар"

    ];


    if (
        !year ||
        !month ||
        !day ||
        !months[
            month - 1
        ]
    ) {

        return dateString;

    }


    return `${day}. ${months[month - 1]} ${year}.`;

}



/* =========================================================
   SLIKA VESTI
========================================================= */

function getNewsImage(value) {

    const image =
        String(
            value || ""
        ).trim();


    if (!image) {

        return "images/grb.png";

    }


    if (
        image.startsWith("images/") ||
        image.startsWith("./images/") ||
        /^https?:\/\//i.test(
            image
        )
    ) {

        return image;

    }


    return "images/grb.png";

}



/* =========================================================
   FORMA - PORUKE
========================================================= */

function showNewsFormMessage(
    message,
    type
) {

    if (!newsFormMessage) {
        return;
    }


    newsFormMessage.className =
        "admin-news-form-message";


    if (type) {

        newsFormMessage.classList.add(
            type
        );

    }


    newsFormMessage.textContent =
        message;

}



function clearNewsFormMessage() {

    if (!newsFormMessage) {
        return;
    }


    newsFormMessage.className =
        "admin-news-form-message";


    newsFormMessage.textContent =
        "";

}



/* =========================================================
   SAVE LOADING
========================================================= */

function setNewsSaveLoading(
    loading
) {

    if (!newsSaveButton) {
        return;
    }


    newsSaveButton.disabled =
        loading;


    newsSaveButton.textContent =
        loading
            ? "ЧУВАЊЕ..."
            : "САЧУВАЈ ВЕСТ";

}



/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(
    loading
) {

    const button =
        loginForm?.querySelector(
            ".admin-login-button"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    const span =
        button.querySelector(
            "span"
        );


    if (!span) {
        return;
    }


    span.textContent =
        loading
            ? "ПРИЈАВА..."
            : "ПРИЈАВИ СЕ";

}



/* =========================================================
   LOGIN PORUKE
========================================================= */

function showLoginMessage(
    message
) {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        message;

}



function clearLoginMessage() {

    if (!loginMessage) {
        return;
    }


    loginMessage.textContent =
        "";

}



/* =========================================================
   LOGIN GREŠKE
========================================================= */

function getLoginErrorMessage(
    error
) {

    const message =
        String(
            error?.message ||
            ""
        ).toLowerCase();


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
            "too many requests"
        )
    ) {

        return "Превише покушаја. Покушајте поново мало касније.";

    }


    return "Пријава није успела. Проверите податке и покушајте поново.";

}



/* =========================================================
   ESCAPE
========================================================= */

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