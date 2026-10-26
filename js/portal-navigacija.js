/* =========================================================
   FK OBILIĆ
   PORTAL - NAVIGACIJA
========================================================= */

(() => {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            /*
                Čekamo da portal-igraci.js
                napravi sekciju igrača.
            */

            setTimeout(
                setupPortalNavigation,
                0
            );

        }
    );


    function setupPortalNavigation() {

        const welcome =
            document.querySelector(
                ".portal-welcome"
            );


        const dashboard =
            document.querySelector(
                ".portal-dashboard-grid"
            );


        const teamSection =
            document.querySelector(
                "#portal-team-section"
            );


        const trainingList =
            document.querySelector(
                "#portal-training-list"
            );


        const calendarSection =
            trainingList
                ?.closest(
                    ".portal-section"
                );


        if (
            !welcome ||
            !dashboard ||
            !teamSection ||
            !calendarSection
        ) {

            console.warn(
                "Portal navigation: sekcije nisu pronađene."
            );

            return;

        }


        /* =================================================
           NAVIGACIJA
        ================================================= */

        const navigation =
            document.createElement(
                "nav"
            );


        navigation.className =
            "portal-view-navigation";


        navigation.setAttribute(
            "aria-label",
            "Навигација портала"
        );


        navigation.innerHTML = `

            <button
                type="button"
                class="portal-view-button active"
                data-portal-view="overview"
            >

                <span class="portal-view-icon">

                    <svg viewBox="0 0 24 24">

                        <rect
                            x="3"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                        />

                        <rect
                            x="14"
                            y="3"
                            width="7"
                            height="7"
                            rx="1"
                        />

                        <rect
                            x="3"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                        />

                        <rect
                            x="14"
                            y="14"
                            width="7"
                            height="7"
                            rx="1"
                        />

                    </svg>

                </span>

                <span>
                    ПРЕГЛЕД
                </span>

            </button>


            <button
                type="button"
                class="portal-view-button"
                data-portal-view="players"
            >

                <span class="portal-view-icon">

                    <svg viewBox="0 0 24 24">

                        <circle
                            cx="8"
                            cy="8"
                            r="3"
                        />

                        <circle
                            cx="16"
                            cy="8"
                            r="3"
                        />

                        <path
                            d="M3 20v-2a5 5 0 0 1 10 0v2"
                        />

                        <path
                            d="M13 18a5 5 0 0 1 8 0v2"
                        />

                    </svg>

                </span>

                <span>
                    ИГРАЧИ
                </span>

            </button>


            <button
                type="button"
                class="portal-view-button"
                data-portal-view="calendar"
            >

                <span class="portal-view-icon">

                    <svg viewBox="0 0 24 24">

                        <rect
                            x="3"
                            y="5"
                            width="18"
                            height="16"
                            rx="2"
                        />

                        <path d="M8 3v4"/>
                        <path d="M16 3v4"/>
                        <path d="M3 10h18"/>

                    </svg>

                </span>

                <span>
                    КАЛЕНДАР
                </span>


                
            </button>

            
<button
    type="button"
    id="portal-management-tab"
    class="portal-view-button"
    data-portal-view="management"
    hidden
>

    <span class="portal-view-icon">

        <svg viewBox="0 0 24 24">

            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
            />

            <path d="M3 9h18"/>

            <path d="M9 9v12"/>

            <path d="M13 14h4"/>

            <path d="M13 18h4"/>

        </svg>

    </span>

    <span>
        УПРАВА
    </span>

</button>


        `;


        welcome.insertAdjacentElement(
            "afterend",
            navigation
        );


/* ==========================================
   PORTAL - SEKCIJA UPRAVE
========================================== */

const managementSection =
    document.createElement("section");

managementSection.id =
    "portal-management-section";

managementSection.className =
    "portal-section portal-management-section";

managementSection.hidden = true;

managementSection.innerHTML = `

    <div class="portal-section-heading">

        <div>

            <span>
                АДМИНИСТРАЦИЈА КЛУБА
            </span>

            <h2>
                УПРАВА ФК ОБИЛИЋ
            </h2>

            <p>
                Управљање спонзорима,
                уговорима, документацијом
                и пословањем клуба.
            </p>

        </div>

    </div>


    <div class="portal-management-grid">

        <article class="portal-management-card">

            <span>01 / ПАРТНЕРСТВА</span>

            <h3>СПОНЗОРИ</h3>

            <p>
                Евиденција спонзора,
                сарадње, уговорених
                износа и уплата.
            </p>

        </article>


        <article class="portal-management-card">

            <span>02 / ПРАВНИ ПОСЛОВИ</span>

            <h3>УГОВОРИ</h3>

            <p>
                Уговори са спонзорима,
                тренерима и другим
                сарадницима клуба.
            </p>

        </article>


        <article class="portal-management-card">

            <span>03 / АРХИВА</span>

            <h3>ДОКУМЕНТА</h3>

            <p>
                Статут, записници,
                одлуке управе и
                остала документа.
            </p>

        </article>


        <article class="portal-management-card">

            <span>04 / ПОСЛОВАЊЕ</span>

            <h3>ФИНАНСИЈЕ</h3>

            <p>
                Приходи, расходи,
                чланарине и финансијски
                преглед клуба.
            </p>

        </article>


        <article class="portal-management-card">

            <span>05 / ОРГАНИЗАЦИЈА</span>

            <h3>ОБАВЕЗЕ</h3>

            <p>
                Задаци, важни рокови,
                регистрације и
                подсетници.
            </p>

        </article>


        <article class="portal-management-card">

            <span>06 / КЛУПСКА СТРУКТУРА</span>

            <h3>ЧЛАНОВИ КЛУБА</h3>

            <p>
                Преглед управе,
                тренера и корисничких
                приступа порталу.
            </p>

        </article>

    </div>

`;

calendarSection.insertAdjacentElement(
    "afterend",
    managementSection
);


/* ==========================================
   PROVERA PRISTUPA UPRAVI
========================================== */

const managementButton =
    navigation.querySelector(
        "#portal-management-tab"
    );

const managementSb =
    window.fkObilicSupabase;

let managementAllowed = false;

let managementCheckVersion = 0;


function setManagementAccess(allowed) {

    managementAllowed = allowed;

    managementButton.hidden = !allowed;

    navigation.classList.toggle(
        "portal-has-management",
        allowed
    );

    if (
        !allowed &&
        !managementSection.hidden
    ) {

        showPortalView(
            "overview",
            false
        );

    }

}


async function checkManagementAccess() {

    const version = ++managementCheckVersion;

    try {

        if (!managementSb) {
            setManagementAccess(false);
            return;
        }

        const {
            data: { session },
            error: sessionError
        } = await managementSb.auth.getSession();

        if (version !== managementCheckVersion) {
            return;
        }

        if (sessionError || !session?.user) {
            setManagementAccess(false);
            return;
        }

        const { data: profile, error } =
            await managementSb
                .from("portal_korisnici")
                .select("uloga,aktivan")
                .eq("user_id", session.user.id)
                .maybeSingle();

        if (version !== managementCheckVersion) {
            return;
        }

        if (error) {
            throw error;
        }

        const allowed =
            profile?.aktivan === true &&
            String(profile?.uloga || "")
                .trim()
                .toUpperCase() === "UPRAVA";

        setManagementAccess(allowed);

    } catch (error) {

        console.error(
            "Management access error:",
            error
        );

        if (version === managementCheckVersion) {
            setManagementAccess(false);
        }

    }

}


/* Provera nakon prijave i odjave */

if (managementSb) {

    managementSb.auth.onAuthStateChange(
        (event, session) => {

            if (event === "SIGNED_OUT") {

                managementCheckVersion++;

                setManagementAccess(false);

                return;

            }

            if (
                (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION"
                ) &&
                session?.user
            ) {

                setTimeout(
                    checkManagementAccess,
                    0
                );

            }

        }
    );

}

checkManagementAccess();

        const buttons =
            navigation.querySelectorAll(
                "[data-portal-view]"
            );


        buttons.forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showPortalView(
                            button.dataset
                                .portalView,
                            true
                        );

                    }
                );

            }
        );


        /* POČETNO STANJE */

        showPortalView(
            "overview",
            false
        );


        /* =================================================
           PRIKAZ SEKCIJE
        ================================================= */

        function showPortalView(
            view,
            shouldScroll
        ) {

/* Pristup upravi samo za ovlascene */

if (
    view === "management" &&
    !managementAllowed
) {

    return;

}


/* Prikaz posebne sekcije uprave */

managementSection.hidden =
    view !== "management";


document.body.classList.toggle(
    "portal-management-open",
    view === "management"
);

            dashboard.hidden =
                view !==
                "overview";


            teamSection.hidden =
                view !==
                "players";


            calendarSection.hidden =
                view !==
                "calendar";


            buttons.forEach(
                button => {

                    const active =
                        button.dataset
                            .portalView ===
                        view;


                    button.classList.toggle(
                        "active",
                        active
                    );


                    button.setAttribute(
                        "aria-pressed",
                        String(active)
                    );

                }
            );


            if (!shouldScroll) {

                return;

            }


            let target =
                dashboard;


            if (
                view ===
                "players"
            ) {

                target =
                    teamSection;

            }


            if (
                view ===
                "calendar"
            ) {

                target =
                    calendarSection;

            }

if (
    view === "management"
) {

    target = managementSection;

}


            requestAnimationFrame(
                () => {

                    target.scrollIntoView({
                        behavior:
                            "smooth",

                        block:
                            "start"
                    });

                }
            );

        }

    }

})();