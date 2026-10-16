/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   STRUČNI ŠTAB + TEHNIČKO OSOBLJE
========================================================= */

(() => {

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    document.addEventListener(
        "DOMContentLoaded",
        loadClubStaff
    );


    /* =====================================================
       UČITAVANJE
    ===================================================== */

    async function loadClubStaff() {

        const staffContainer =
            document.querySelector(
                "#club-staff-grid"
            );

        const technicalContainer =
            document.querySelector(
                "#club-technical-grid"
            );


        if (
            !staffContainer &&
            !technicalContainer
        ) {
            return;
        }


        try {

            const url =
                new URL(
                    `${SUPABASE_URL}/rest/v1/strucni_stab`
                );


            url.searchParams.set(
                "select",
                [
                    "id",
                    "ime_prezime",
                    "uloga",
                    "tip_osoblja",
                    "selekcija",
                    "datum_rodjenja",
                    "fotografija",
                    "redosled",
                    "aktivan"
                ].join(",")
            );


            url.searchParams.set(
                "aktivan",
                "eq.true"
            );


            url.searchParams.set(
                "order",
                "redosled.asc,ime_prezime.asc"
            );


            const response =
                await fetch(
                    url.toString(),
                    {
                        method: "GET",

                        headers: {
                            "apikey":
                                SUPABASE_KEY,

                            "Authorization":
                                `Bearer ${SUPABASE_KEY}`,

                            "Accept":
                                "application/json"
                        },

                        cache:
                            "no-store"
                    }
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );

            }


            const people =
                await response.json();


            if (!Array.isArray(people)) {

                throw new Error(
                    "Неисправан формат података."
                );

            }


            const staff =
                people.filter(
                    person =>
                        (
                            person.tip_osoblja ||
                            "СТРУЧНИ ШТАБ"
                        ) ===
                        "СТРУЧНИ ШТАБ"
                );


            const technical =
                people.filter(
                    person =>
                        person.tip_osoblja ===
                        "ТЕХНИЧКО ОСОБЉЕ"
                );


            renderStaff(
                staffContainer,
                staff
            );


            renderTechnicalStaff(
                technicalContainer,
                technical
            );

        }

        catch (error) {

            console.error(
                "Грешка при учитавању особља:",
                error
            );


            if (staffContainer) {

                staffContainer.innerHTML = `
                    <div class="team-data-empty">
                        Подаци о стручном штабу тренутно нису доступни.
                    </div>
                `;

            }


            if (technicalContainer) {

                technicalContainer.innerHTML = `
                    <div class="team-data-empty">
                        Подаци о техничком особљу тренутно нису доступни.
                    </div>
                `;

            }

        }

    }


    /* =====================================================
       STRUČNI ŠTAB
    ===================================================== */

    function renderStaff(
        container,
        staff
    ) {

        if (!container) {
            return;
        }


        if (!staff.length) {

            container.innerHTML = `
                <div class="team-data-empty">
                    Подаци о стручном штабу тренутно нису доступни.
                </div>
            `;

            return;

        }


        const groups =
            new Map();


        staff.forEach(
            member => {

                const selection =
                    String(
                        member.selekcija ||
                        "КЛУБ"
                    ).trim();


                if (!groups.has(selection)) {

                    groups.set(
                        selection,
                        []
                    );

                }


                groups
                    .get(selection)
                    .push(member);

            }
        );


        container.innerHTML =
            Array
                .from(groups.entries())
                .map(
                    ([selection, members]) => `

                        <section class="club-staff-section">

                            <h3 class="club-staff-selection-title">
                                ${escapeHtml(selection)}
                            </h3>

                            <div class="club-staff-selection-grid">

                                ${
                                    members
                                        .map(
                                            createPersonCard
                                        )
                                        .join("")
                                }

                            </div>

                        </section>

                    `
                )
                .join("");

    }


    /* =====================================================
       TEHNIČKO OSOBLJE
    ===================================================== */

    function renderTechnicalStaff(
        container,
        people
    ) {

        if (!container) {
            return;
        }


        if (!people.length) {

            container.innerHTML = `
                <div class="team-data-empty">
                    Техничко особље ће бити додато ускоро.
                </div>
            `;

            return;

        }


        container.innerHTML =
            people
                .map(
                    createPersonCard
                )
                .join("");

    }


    /* =====================================================
       KARTICA OSOBE
    ===================================================== */

    function createPersonCard(
        member
    ) {

        const name =
            member.ime_prezime ||
            "";


        const role =
            member.uloga ||
            "";


        const photo =
            member.fotografija ||
            "";


        return `

            <article class="player-card staff-card">


                <div class="player-photo-wrap">

                    ${
                        photo

                            ? `

                                <img
                                    src="${escapeAttribute(photo)}"
                                    alt="${escapeAttribute(name)}"
                                    class="player-photo"
                                    loading="lazy"
                                    onerror="
                                        this.style.display='none';
                                        this.nextElementSibling.style.display='flex';
                                    "
                                >


                                <div
                                    class="player-placeholder staff-placeholder"
                                    style="display:none;"
                                >

                                    <img
                                        src="images/grb.png"
                                        class="player-placeholder-crest"
                                        alt=""
                                    >

                                    <span class="player-initials">
                                        ${escapeHtml(getInitials(name))}
                                    </span>

                                </div>

                            `

                            : `

                                <div class="player-placeholder staff-placeholder">

                                    <img
                                        src="images/grb.png"
                                        class="player-placeholder-crest"
                                        alt=""
                                    >

                                    <span class="player-initials">
                                        ${escapeHtml(getInitials(name))}
                                    </span>

                                </div>

                            `
                    }

                </div>


                <div class="player-card-info">

                    ${
                        role
                            ? `
                                <span class="staff-role">
                                    ${escapeHtml(role)}
                                </span>
                            `
                            : ""
                    }

                    <h3>
                        ${escapeHtml(name)}
                    </h3>

                </div>


            </article>

        `;

    }


    /* =====================================================
       INICIJALI
    ===================================================== */

    function getInitials(
        name
    ) {

        return String(
            name ||
            ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(
                part =>
                    part.charAt(0)
            )
            .join("")
            .toUpperCase();

    }


    /* =====================================================
       BEZBEDAN ISPIS
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