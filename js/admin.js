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



/* =========================================================
   NASLOVI SEKCIJA
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
   POKRETANJE
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


    await checkCurrentSession();


    supabaseClient.auth.onAuthStateChange(
        (event, session) => {

            if (
                event === "SIGNED_IN" &&
                session?.user
            ) {

                showAdminPanel(
                    session.user
                );

            }


            if (
                event === "SIGNED_OUT"
            ) {

                showLoginScreen();

            }

        }
    );

}



/* =========================================================
   PROVERA POSTOJEĆE PRIJAVE
========================================================= */

async function checkCurrentSession() {

    try {

        const {
            data,
            error
        } =
            await supabaseClient.auth.getSession();


        if (error) {
            throw error;
        }


        if (
            data?.session?.user
        ) {

            showAdminPanel(
                data.session.user
            );

            return;

        }


        showLoginScreen();

    } catch (error) {

        console.error(
            "Грешка при провери пријаве:",
            error
        );

        showLoginScreen();

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


                showAdminPanel(
                    data.user
                );


                passwordInput.value =
                    "";

            } catch (error) {

                console.error(
                    "Грешка при пријави:",
                    error
                );


                showLoginMessage(
                    getLoginErrorMessage(
                        error
                    )
                );

            } finally {

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

            } catch (error) {

                console.error(
                    "Грешка при одјави:",
                    error
                );

                alert(
                    "Није могуће извршити одјаву."
                );

            } finally {

                logoutButton.disabled =
                    false;

            }

        }
    );

}



/* =========================================================
   PRIKAŽI ADMIN
========================================================= */

function showAdminPanel(
    user
) {

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
   PRIKAŽI LOGIN
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

                }
            );

        }
    );

}



function openAdminPage(
    page
) {

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
   DASHBOARD STATISTIKA
   Za sada čita postojeće JSON fajlove.
   Kasnije ovo prebacujemo direktno na Supabase.
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
   VESTI
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

        const response =
            await fetch(
                "data/vesti.json",
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


        if (
            !Array.isArray(
                data
            )
        ) {

            element.textContent =
                "0";

            return;

        }


        const published =
            data.filter(
                article =>
                    article?.published !==
                    false
            );


        element.textContent =
            published.length;

    } catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   IGRAČI
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

    } catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   GALERIJA
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

    } catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   PARTNERI
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

    } catch {

        element.textContent =
            "—";

    }

}



/* =========================================================
   LOGIN STATUS
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
   PORUKE
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
   PREVOD GREŠAKA
========================================================= */

function getLoginErrorMessage(
    error
) {

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