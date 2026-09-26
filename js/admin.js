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



/* =========================================================
   ELEMENTI
========================================================= */

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

const navigationButtons =
    document.querySelectorAll(
        ".admin-nav-item"
    );

const adminPages =
    document.querySelectorAll(
        ".admin-page"
    );

const adminNewsList =
    document.querySelector(
        "#admin-news-list"
    );

const addNewsButton =
    document.querySelector(
        "#admin-add-news"
    );



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


    await checkCurrentSession();


    supabaseClient.auth.onAuthStateChange(
        event => {

            if (
                event === "SIGNED_OUT"
            ) {

                showLoginScreen();

            }

        }
    );

}



/* =========================================================
   PROVERA SESIJE
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


        if (
            data?.session?.user
        ) {

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
   PROVERA ADMIN PRISTUPA
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

        console.error(
            "Грешка при провери администратора:",
            error
        );

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
            "Није могуће потврдити администратора:",
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
                emailInput?.value
                    ?.trim();

            const password =
                passwordInput?.value;


            if (
                !email ||
                !password
            ) {

                showLoginMessage(
                    "Унесите е-маил и лозинку."
                );

                return;
            }


            setLoginLoading(
                true
            );


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


                if (
                    !data?.user
                ) {

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

                setLoginLoading(
                    false
                );

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


    openAdminPage(
        "dashboard"
    );


    loadDashboardStats();

}



/* =========================================================
   PRIKAZ LOGIN EKRANA
========================================================= */

function showLoginScreen() {

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
                        button.dataset
                            .adminPage;


                    if (!page) {
                        return;
                    }


                    openAdminPage(
                        page
                    );


                    /*
                        Kada otvorimo VESTI,
                        učitavamo podatke iz Supabase-a.
                    */

                    if (
                        page === "vesti"
                    ) {

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

            const isActive =
                button.dataset
                    .adminPage === page;


            button.classList.toggle(
                "active",
                isActive
            );

        }
    );


    adminPages.forEach(
        section => {

            const isActive =
                section.dataset
                    .page === page;


            section.classList.toggle(
                "active",
                isActive
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
   BROJ VESTI - SUPABASE
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
   IGRAČI
   ZA SADA POSTOJEĆI JSON
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
            data?.prviTim
                ?.igraci;


        element.textContent =
            Array.isArray(
                players
            )
                ? players.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   GALERIJA
   ZA SADA POSTOJEĆI JSON
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
            Array.isArray(
                photos
            )
                ? photos.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   PARTNERI
   ZA SADA POSTOJEĆI JSON
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
            Array.isArray(
                partners
            )
                ? partners.length
                : "0";

    }

    catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   VESTI - UČITAVANJE IZ SUPABASE
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
                        ascending: false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: false
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


        renderAdminNews(
            data
        );

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
   PRIKAZ LISTE VESTI
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
                    formatAdminDate(
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


                const featuredText =
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
                                ${featuredText}

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
                                class="
                                    admin-news-status
                                    ${statusClass}
                                "
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

    if (!adminNewsList) {
        return;
    }


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
   GREŠKA PRI UČITAVANJU
========================================================= */

function renderNewsError() {

    if (!adminNewsList) {
        return;
    }


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

    /*
        DODAJ NOVU VEST

        Forma dolazi u sledećem koraku.
    */

    if (addNewsButton) {

        addNewsButton.addEventListener(
            "click",
            () => {

                alert(
                    "Следећи корак је форма за додавање нове вести."
                );

            }
        );

    }


    /*
        Event delegation za
        IZMENI i OBRIŠI.
    */

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

                alert(
                    "Форму за измену вести правимо у следећем кораку."
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
                deleteButton.dataset
                    .deleteNews;


            const newsTitle =
                deleteButton.dataset
                    .newsTitle ||
                "ову вест";


            if (!newsId) {
                return;
            }


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
   BRISANJE VESTI
========================================================= */

async function deleteNews(
    newsId,
    button
) {

    if (button) {

        button.disabled =
            true;

        button.textContent =
            "БРИСАЊЕ...";

    }


    try {

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
        image.startsWith(
            "images/"
        ) ||
        image.startsWith(
            "./images/"
        ) ||
        /^https?:\/\//i.test(
            image
        )
    ) {

        return image;

    }


    return "images/grb.png";

}



/* =========================================================
   DATUM
========================================================= */

function formatAdminDate(dateString) {

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


    return new Intl.DateTimeFormat(
        "sr-Cyrl-RS",
        {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Belgrade"
        }
    ).format(date);

}



/* =========================================================
   LOGIN LOADING
========================================================= */

function setLoginLoading(loading) {

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

function showLoginMessage(message) {

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

function getLoginErrorMessage(error) {

    const message =
        String(
            error?.message || ""
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

function escapeHtml(value = "") {

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



function escapeAttribute(value = "") {

    return escapeHtml(
        value
    );

}