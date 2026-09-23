/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   PRVI TIM
========================================================= */

async function loadFirstTeam() {
    const playersContainer =
        document.querySelector("#players-grid");

    const staffContainer =
        document.querySelector("#staff-grid");

    if (!playersContainer && !staffContainer) return;

    try {
        const response = await fetch(
            "data/igraci.json",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const firstTeam =
            data.prviTim || {};


        /* =====================================================
           IGRAČI
        ===================================================== */

        if (playersContainer) {

            const players =
                Array.isArray(firstTeam.igraci)
                    ? firstTeam.igraci
                    : [];


            if (players.length === 0) {

                playersContainer.innerHTML = `
                    <div class="team-data-empty">
                        Подаци о играчима тренутно нису доступни.
                    </div>
                `;

            } else {

                /*
                    Spoljni kontejner više nije jedan grid.
                    Svaka linija tima dobija svoj poseban grid.
                */

                playersContainer.classList.remove(
                    "players-grid"
                );

                playersContainer.classList.add(
                    "players-groups"
                );


                playersContainer.innerHTML =
                    createPlayerGroups(players);
            }
        }



        /* =====================================================
           STRUČNI ŠTAB
        ===================================================== */

        if (staffContainer) {

            const staff =
                Array.isArray(firstTeam.strucniStab)
                    ? firstTeam.strucniStab
                    : [];


            if (staff.length === 0) {

                staffContainer.innerHTML = `
                    <div class="team-data-empty">
                        Подаци о стручном штабу тренутно нису доступни.
                    </div>
                `;

            } else {

                staffContainer.innerHTML =
                    staff
                        .map(member =>
                            createStaffCard(member)
                        )
                        .join("");
            }
        }

    } catch (error) {

        console.error(
            "Грешка при учитавању првог тима:",
            error
        );


        if (playersContainer) {

            playersContainer.innerHTML = `
                <div class="team-data-empty">
                    Није могуће учитати списак играча.
                </div>
            `;
        }


        if (staffContainer) {

            staffContainer.innerHTML = `
                <div class="team-data-empty">
                    Није могуће учитати стручни штаб.
                </div>
            `;
        }
    }
}



/* =========================================================
   GRUPE IGRAČA
========================================================= */

function createPlayerGroups(players) {

    const groups = [
        {
            key: "golmani",
            title: "ГОЛМАНИ"
        },
        {
            key: "odbrana",
            title: "ОДБРАНА"
        },
        {
            key: "vezni",
            title: "ВЕЗНИ РЕД"
        },
        {
            key: "napad",
            title: "НАПАД"
        }
    ];


    const sections = groups
        .map(group => {

            const groupPlayers =
                players.filter(player =>
                    normalizeGroup(player.grupa) === group.key
                );


            /*
                Ako neka grupa nema igrače,
                ne prikazujemo prazan naslov.
            */

            if (groupPlayers.length === 0) {
                return "";
            }


            return `
                <section
                    class="player-group-section"
                    data-group="${group.key}"
                >

                    <div class="player-group-heading">

                        <span>
                            ПРВИ ТИМ
                        </span>

                        <h3>
                            ${group.title}
                        </h3>

                        <div class="player-group-line"></div>

                    </div>


                    <div
                        class="players-grid player-group-grid"
                    >

                        ${groupPlayers
                            .map(player =>
                                createPlayerCard(player)
                            )
                            .join("")}

                    </div>

                </section>
            `;
        })
        .join("");


    /*
        Sigurnosna grupa:
        ako se kasnije u adminu doda igrač bez pravilno
        izabrane grupe, neće nestati sa sajta.
    */

    const knownGroups = [
        "golmani",
        "odbrana",
        "vezni",
        "napad"
    ];


    const otherPlayers =
        players.filter(player =>
            !knownGroups.includes(
                normalizeGroup(player.grupa)
            )
        );


    const otherSection =
        otherPlayers.length > 0
            ? `
                <section class="player-group-section">

                    <div class="player-group-heading">

                        <span>
                            ПРВИ ТИМ
                        </span>

                        <h3>
                            ОСТАЛИ ИГРАЧИ
                        </h3>

                        <div class="player-group-line"></div>

                    </div>


                    <div
                        class="players-grid player-group-grid"
                    >

                        ${otherPlayers
                            .map(player =>
                                createPlayerCard(player)
                            )
                            .join("")}

                    </div>

                </section>
            `
            : "";


    return sections + otherSection;
}



/* =========================================================
   KARTICA IGRAČA
========================================================= */

function createPlayerCard(player) {

    const rawName =
        player.ime || "Име није унето";


    const name =
        escapeTeamHtml(rawName);


    const position =
        escapeTeamHtml(
            player.pozicija || ""
        );


    const image =
        escapeTeamHtml(
            player.slika || ""
        );


    const number =
        player.broj !== null &&
        player.broj !== undefined &&
        player.broj !== ""
            ? escapeTeamHtml(
                String(player.broj)
            )
            : "";


    const initials =
        escapeTeamHtml(
            getInitials(rawName)
        );


    const placeholderContent =
        number
            ? `
                <strong>
                    ${number}
                </strong>
            `
            : `
                <strong class="player-initials">
                    ${initials}
                </strong>
            `;



    /* =====================================================
       FOTOGRAFIJA / PLACEHOLDER
    ===================================================== */

    const visual =
        image
            ? `
                <img
                    src="${image}"
                    alt="${name}"
                    class="player-photo"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="player-placeholder"
                    style="display:none;"
                >

                    <img
                        src="images/grb.png"
                        alt=""
                        class="player-placeholder-crest"
                    >

                    ${placeholderContent}

                </div>
            `
            : `
                <div class="player-placeholder">

                    <img
                        src="images/grb.png"
                        alt=""
                        class="player-placeholder-crest"
                    >

                    ${placeholderContent}

                </div>
            `;



    /* =====================================================
       KARTICA
    ===================================================== */

    return `
        <article class="player-card">

            <div class="player-photo-wrap">

                ${visual}

                ${
                    number
                        ? `
                            <span class="player-number">
                                ${number}
                            </span>
                        `
                        : ""
                }

            </div>


            <div class="player-card-info">

                <h3>
                    ${name}
                </h3>

                ${
                    position
                        ? `
                            <span class="player-position">
                                ${position}
                            </span>
                        `
                        : `
                            <span
                                class="player-position player-position-empty"
                            >
                                ПРВИ ТИМ
                            </span>
                        `
                }

            </div>

        </article>
    `;
}



/* =========================================================
   STRUČNI ŠTAB
========================================================= */

function createStaffCard(member) {

    const rawName =
        member.ime || "Име није унето";


    const name =
        escapeTeamHtml(rawName);


    const role =
        escapeTeamHtml(
            member.uloga || "Стручни штаб"
        );


    const image =
        escapeTeamHtml(
            member.slika || ""
        );


    const initials =
        escapeTeamHtml(
            getInitials(rawName)
        );


    const visual =
        image
            ? `
                <img
                    src="${image}"
                    alt="${name}"
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
                        alt=""
                        class="player-placeholder-crest"
                    >

                    <strong class="player-initials">
                        ${initials}
                    </strong>

                </div>
            `
            : `
                <div
                    class="player-placeholder staff-placeholder"
                >

                    <img
                        src="images/grb.png"
                        alt=""
                        class="player-placeholder-crest"
                    >

                    <strong class="player-initials">
                        ${initials}
                    </strong>

                </div>
            `;


    return `
        <article class="player-card staff-card">

            <div class="player-photo-wrap">
                ${visual}
            </div>

            <div class="player-card-info">

                <span class="staff-role">
                    ${role}
                </span>

                <h3>
                    ${name}
                </h3>

            </div>

        </article>
    `;
}



/* =========================================================
   NORMALIZACIJA GRUPE
========================================================= */

function normalizeGroup(group = "") {

    return String(group)
        .trim()
        .toLowerCase();
}



/* =========================================================
   INICIJALI
========================================================= */

function getInitials(name = "") {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 0) {
        return "ФК";
    }


    return parts
        .slice(0, 2)
        .map(part =>
            part.charAt(0)
        )
        .join("")
        .toUpperCase();
}



/* =========================================================
   ZAŠTITA TEKSTA
========================================================= */

function escapeTeamHtml(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/* =========================================================
   POKRETANJE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadFirstTeam
);