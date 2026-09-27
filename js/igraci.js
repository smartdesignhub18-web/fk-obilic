/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   IGRAČI + STRUČNI ŠTAB
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const PLAYERS_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const PLAYERS_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadTeamData
);



async function loadTeamData() {

    await Promise.allSettled(
        [
            loadPlayers(),
            loadStaff()
        ]
    );

}



/* =========================================================
   IGRAČI - SUPABASE
========================================================= */

async function loadPlayers() {

    const container =
        document.querySelector(
            "#players-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="team-data-empty">
            Учитавање играча...
        </div>

    `;


    try {

        const url =
            new URL(
                `${PLAYERS_SUPABASE_URL}/rest/v1/igraci`
            );


        url.searchParams.set(
            "select",
            [
                "id",
                "ime_prezime",
                "broj",
                "pozicija",
                "pozicija_detaljno",
                "datum_rodjenja",
                "selekcija",
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
            "selekcija",
            "eq.ПРВИ ТИМ"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",

                    headers: {

                        "apikey":
                            PLAYERS_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${PLAYERS_SUPABASE_KEY}`,

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


        const players =
            await response.json();


        if (
            !Array.isArray(players)
        ) {

            throw new Error(
                "Неисправан формат података."
            );

        }


        if (
            players.length === 0
        ) {

            container.innerHTML = `

                <div class="team-data-empty">
                    Тренутно нема играча за приказ.
                </div>

            `;

            return;

        }


        players.sort(
            sortPlayers
        );


        container.innerHTML =
    renderPlayerGroups(
        players
    );

    }

    catch (error) {

        console.error(
            "Грешка при учитавању играча:",
            error
        );


        container.innerHTML = `

            <div class="team-data-empty">
                Играчи тренутно нису доступни.
            </div>

        `;

    }

}



/* =========================================================
   SORTIRANJE
========================================================= */

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


    const positionDifference =

        (
            positionOrder[
                a.pozicija
            ] || 99
        ) -

        (
            positionOrder[
                b.pozicija
            ] || 99
        );


    if (
        positionDifference !==
        0
    ) {

        return positionDifference;

    }


    const orderDifference =

        Number(
            a.redosled || 0
        ) -

        Number(
            b.redosled || 0
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


/* =========================================================
   GRUPISANJE IGRAČA PO POZICIJAMA
========================================================= */

function renderPlayerGroups(players) {

    const groups = [
        "ГОЛМАНИ",
        "ОДБРАНА",
        "ВЕЗНИ РЕД",
        "НАПАД"
    ];


    let html = "";


    groups.forEach(
        groupName => {

            const groupPlayers =
                players.filter(
                    player =>
                        player.pozicija ===
                        groupName
                );


            if (
                groupPlayers.length ===
                0
            ) {
                return;
            }


            html += `

                <div class="player-position-heading">

                    <span>
                        ПРВИ ТИМ
                    </span>

                    <h3>
                        ${escapeHtml(groupName)}
                    </h3>

                </div>

            `;


            html +=
                groupPlayers
                    .map(
                        createPlayerCard
                    )
                    .join("");

        }
    );


    return html;

}
/* =========================================================
   KARTICA IGRAČA
========================================================= */

function createPlayerCard(
    player
) {

    const name =
        player.ime_prezime ||
        "";


    const photo =
        player.fotografija ||
        "";


    const hasNumber =
        player.broj !==
            null &&
        player.broj !==
            undefined &&
        player.broj !==
            "";


    const position =
        getPlayerPosition(
            player
        );


    return `

        <article class="player-card">


            <!-- FOTOGRAFIJA -->

            <div class="player-photo-wrap">

                ${
                    photo

                    ? `

                        <img
                            src="${escapeAttribute(photo)}"
                            alt="${escapeAttribute(name)}"
                            class="player-photo"
                            loading="lazy"
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        >


                        <div
                            class="player-placeholder"
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

                        <div class="player-placeholder">

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


                ${
                    hasNumber

                    ? `

                        <span class="player-number">
                            ${escapeHtml(player.broj)}
                        </span>

                    `

                    : ""
                }

            </div>



            <!-- PODACI -->

            <div class="player-card-info">

                <h3>
                    ${escapeHtml(name)}
                </h3>


                ${
                    position

                    ? `

                        <span class="player-position">
                            ${escapeHtml(position)}
                        </span>

                    `

                    : `

                        <span class="player-position player-position-empty">
                            ФК ОБИЛИЋ
                        </span>

                    `
                }

            </div>


        </article>

    `;

}



/* =========================================================
   POZICIJA
========================================================= */

function getPlayerPosition(
    player
) {

    if (
        player.pozicija_detaljno &&
        String(
            player.pozicija_detaljno
        ).trim()
    ) {

        return String(
            player.pozicija_detaljno
        ).trim();

    }


    const positions = {

        "ГОЛМАНИ":
            "ГОЛМАН",

        "ОДБРАНА":
            "ОДБРАНА",

        "ВЕЗНИ РЕД":
            "ВЕЗНИ РЕД",

        "НАПАД":
            "НАПАД"

    };


    return (
        positions[
            player.pozicija
        ] ||
        ""
    );

}



/* =========================================================
   STRUČNI ŠTAB - SUPABASE
========================================================= */

async function loadStaff() {

    const container =
        document.querySelector(
            "#staff-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="team-data-empty">
            Учитавање стручног штаба...
        </div>

    `;


    try {

        const url =
            new URL(
                `${PLAYERS_SUPABASE_URL}/rest/v1/strucni_stab`
            );


        url.searchParams.set(
            "select",
            [
                "id",
                "ime_prezime",
                "uloga",
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
            "selekcija",
            "eq.ПРВИ ТИМ"
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
                            PLAYERS_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${PLAYERS_SUPABASE_KEY}`,

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


        const staff =
            await response.json();


        if (
            !Array.isArray(staff) ||
            staff.length === 0
        ) {

            container.innerHTML = `

                <div class="team-data-empty">
                    Подаци о стручном штабу тренутно нису доступни.
                </div>

            `;

            return;

        }


        container.innerHTML =
            staff
                .map(
                    createStaffCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Грешка при учитавању стручног штаба:",
            error
        );


        container.innerHTML = `

            <div class="team-data-empty">
                Подаци о стручном штабу тренутно нису доступни.
            </div>

        `;

    }

}


/* =========================================================
   KARTICA STRUČNOG ŠTABA
========================================================= */

function createStaffCard(
    member
) {

    const name =
        member.ime_prezime ||
        "";


    const role =
        member.uloga ||
        "СТРУЧНИ ШТАБ";


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
                            onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
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

                <span class="staff-role">
                    ${escapeHtml(role)}
                </span>

                <h3>
                    ${escapeHtml(name)}
                </h3>

            </div>


        </article>

    `;

}


/* =========================================================
   INICIJALI
========================================================= */

function getInitials(
    name
) {

    const parts =
        String(
            name ||
            ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(Boolean);


    if (
        parts.length ===
        0
    ) {

        return "О";

    }


    if (
        parts.length ===
        1
    ) {

        return parts[0]
            .charAt(0)
            .toUpperCase();

    }


    return (
        parts[0]
            .charAt(0) +

        parts[
            parts.length - 1
        ]
            .charAt(0)
    ).toUpperCase();

}



/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

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