/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   PRVI TIM
========================================================= */


async function loadFirstTeam() {

    const playersContainer =
        document.querySelector(
            "#players-grid"
        );

    const staffContainer =
        document.querySelector(
            "#staff-grid"
        );


    /*
        Ako na stranici nema dela za igrače
        ni stručni štab, prekidamo.
    */

    if (
        !playersContainer &&
        !staffContainer
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                "data/igraci.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        const firstTeam =
            data.prviTim || {};


        /*
            IGRAČI
        */

        if (playersContainer) {

            const players =
                Array.isArray(
                    firstTeam.igraci
                )
                    ? firstTeam.igraci
                    : [];


            if (players.length === 0) {

                playersContainer.innerHTML = `

                    <div class="team-data-empty">
                        Подаци о играчима тренутно нису доступни.
                    </div>

                `;

            }
            else {

                playersContainer.innerHTML =
                    players
                        .map(
                            player =>
                                createPlayerCard(
                                    player
                                )
                        )
                        .join("");

            }

        }


        /*
            STRUČNI ŠTAB
        */

        if (staffContainer) {

            const staff =
                Array.isArray(
                    firstTeam.strucniStab
                )
                    ? firstTeam.strucniStab
                    : [];


            if (staff.length === 0) {

                staffContainer.innerHTML = `

                    <div class="team-data-empty">
                        Подаци о стручном штабу тренутно нису доступни.
                    </div>

                `;

            }
            else {

                staffContainer.innerHTML =
                    staff
                        .map(
                            member =>
                                createStaffCard(
                                    member
                                )
                        )
                        .join("");

            }

        }

    }
    catch (error) {

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
   KARTICA IGRAČA
========================================================= */

function createPlayerCard(player) {

    const name =
        escapeTeamHtml(
            player.ime || "Име није унето"
        );


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


    /*
        Ako imamo fotografiju igrača,
        prikazujemo nju.

        Ako je još nemamo,
        prikazujemo jednostavan placeholder.
    */

    const visual =
        image
            ? `

                <img
                    src="${image}"
                    alt="${name}"
                    class="player-photo"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="player-placeholder"
                    style="display:none;"
                >
                    ${
                        number
                            ? `<strong>${number}</strong>`
                            : `<span>ФК</span>`
                    }
                </div>

            `
            : `

                <div class="player-placeholder">

                    ${
                        number
                            ? `<strong>${number}</strong>`
                            : `<span>ФК</span>`
                    }

                </div>

            `;


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

                            <span class="player-position player-position-empty">
                                ПРВИ ТИМ
                            </span>

                        `
                }

            </div>

        </article>

    `;

}



/* =========================================================
   KARTICA STRUČNOG ŠTABA
========================================================= */

function createStaffCard(member) {

    const name =
        escapeTeamHtml(
            member.ime || "Име није унето"
        );


    const role =
        escapeTeamHtml(
            member.uloga || "Стручни штаб"
        );


    const image =
        escapeTeamHtml(
            member.slika || ""
        );


    const visual =
        image
            ? `

                <img
                    src="${image}"
                    alt="${name}"
                    class="player-photo"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >

                <div
                    class="player-placeholder staff-placeholder"
                    style="display:none;"
                >
                    <span>ФК</span>
                </div>

            `
            : `

                <div class="player-placeholder staff-placeholder">
                    <span>ФК</span>
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
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadFirstTeam
);