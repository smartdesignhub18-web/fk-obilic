/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   POJEDINAČNA SELEKCIJA
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SELECTION_PAGE_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const SELECTION_PAGE_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";



/* =========================================================
   ELEMENTI
========================================================= */

const selectionLoading =
    document.querySelector(
        "#selection-loading"
    );

const selectionContent =
    document.querySelector(
        "#selection-content"
    );

const selectionError =
    document.querySelector(
        "#selection-error"
    );

const selectionHeroTitle =
    document.querySelector(
        "#selection-hero-title"
    );

const selectionHeroYear =
    document.querySelector(
        "#selection-hero-year"
    );

const selectionName =
    document.querySelector(
        "#selection-name"
    );

const selectionYear =
    document.querySelector(
        "#selection-year"
    );

const selectionDescription =
    document.querySelector(
        "#selection-description"
    );

const selectionPhoto =
    document.querySelector(
        "#selection-photo"
    );

const playersSelectionLabel =
    document.querySelector(
        "#players-selection-label"
    );

const selectionPlayersGrid =
    document.querySelector(
        "#selection-players-grid"
    );

const selectionStaffGrid =
    document.querySelector(
        "#selection-staff-grid"
    );



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadSelectionPage
);



/* =========================================================
   GLAVNO UČITAVANJE
========================================================= */

async function loadSelectionPage() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const code =
        params
            .get(
                "kod"
            )
            ?.trim();


    if (!code) {

        showSelectionError();

        return;

    }


    try {

        const selection =
            await loadSelection(
                code
            );


        if (!selection) {

            showSelectionError();

            return;

        }


        renderSelection(
            selection
        );


        await Promise.allSettled(
            [
                loadSelectionPlayers(
                    selection.naziv
                ),

                loadSelectionStaff(
                    selection.naziv
                )
            ]
        );


        if (selectionLoading) {

            selectionLoading.hidden =
                true;

        }


        if (selectionContent) {

            selectionContent.hidden =
                false;

        }

    }

    catch (error) {

        console.error(
            "Грешка при учитавању селекције:",
            error
        );


        showSelectionError();

    }

}



/* =========================================================
   SELEKCIJA
========================================================= */

async function loadSelection(
    code
) {

    const url =
        new URL(
            `${SELECTION_PAGE_SUPABASE_URL}/rest/v1/selekcije`
        );


    url.searchParams.set(
        "select",
        "id,kod,naziv,opis,godiste,fotografija,redosled,aktivna"
    );


    url.searchParams.set(
        "kod",
        `eq.${code}`
    );


    url.searchParams.set(
        "aktivna",
        "eq.true"
    );


    url.searchParams.set(
        "limit",
        "1"
    );


    const response =
        await fetch(
            url.toString(),
            {
                headers: {

                    "apikey":
                        SELECTION_PAGE_SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${SELECTION_PAGE_SUPABASE_KEY}`,

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


    const data =
        await response.json();


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        return null;

    }


    return data[0];

}



/* =========================================================
   PRIKAZ PODATAKA SELEKCIJE
========================================================= */

function renderSelection(
    selection
) {

    const name =
        selection.naziv ||
        "СЕЛЕКЦИЈА";


    const year =
        selection.godiste ||
        "";


    const description =
        selection.opis ||
        "Селекција ФК Обилић.";


    const image =
        selection.fotografija ||
        "images/grb.png";


    document.title =
        `${name} | ФК Обилић Нови Кнежевац`;


    if (selectionHeroTitle) {

        selectionHeroTitle.textContent =
            name;

    }


    if (selectionHeroYear) {

        selectionHeroYear.textContent =
            year
                ? `Годиште ${year}`
                : "ФК Обилић";

    }


    if (selectionName) {

        selectionName.textContent =
            name;

    }


    if (playersSelectionLabel) {

        playersSelectionLabel.textContent =
            name;

    }


    if (selectionDescription) {

        selectionDescription.textContent =
            description;

    }


    if (selectionYear) {

        if (year) {

            selectionYear.hidden =
                false;


            selectionYear.textContent =
                `ГОДИШТЕ ${year}`;

        }

        else {

            selectionYear.hidden =
                true;

        }

    }


    if (selectionPhoto) {

        selectionPhoto.src =
            image;


        selectionPhoto.alt =
            name;


        selectionPhoto.onerror =
            () => {

                selectionPhoto.onerror =
                    null;


                selectionPhoto.src =
                    "images/grb.png";

            };

    }

}



/* =========================================================
   IGRAČI
========================================================= */

async function loadSelectionPlayers(
    selectionName
) {

    if (!selectionPlayersGrid) {

        return;

    }


    selectionPlayersGrid.innerHTML = `

        <div class="team-data-empty">
            Учитавање играча...
        </div>

    `;


    try {

        const url =
            new URL(
                `${SELECTION_PAGE_SUPABASE_URL}/rest/v1/igraci`
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
            `eq.${selectionName}`
        );


        url.searchParams.set(
            "order",
            "redosled.asc,ime_prezime.asc"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    headers: {

                        "apikey":
                            SELECTION_PAGE_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${SELECTION_PAGE_SUPABASE_KEY}`,

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


        renderSelectionPlayers(
            players
        );

    }

    catch (error) {

        console.error(
            "Грешка при учитавању играча:",
            error
        );


        selectionPlayersGrid.innerHTML = `

            <div class="team-data-empty">
                Играчи тренутно нису доступни.
            </div>

        `;

    }

}



/* =========================================================
   GRUPISANJE IGRAČA
========================================================= */

function renderSelectionPlayers(
    players
) {

    if (
        !Array.isArray(players) ||
        players.length === 0
    ) {

        selectionPlayersGrid.innerHTML = `

            <div class="team-data-empty">
                Играчи ове селекције још нису унети.
            </div>

        `;

        return;

    }


    const groups =
        [
            "ГОЛМАНИ",
            "ОДБРАНА",
            "ВЕЗНИ РЕД",
            "НАПАД"
        ];


    let html =
        "";


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
                        ИГРАЧИ
                    </span>

                    <h3>
                        ${escapeSelectionPageHtml(groupName)}
                    </h3>

                </div>

            `;


            html +=
                groupPlayers
                    .map(
                        createSelectionPlayerCard
                    )
                    .join("");

        }
    );


    selectionPlayersGrid.innerHTML =
        html;

}



/* =========================================================
   KARTICA IGRAČA
========================================================= */

function createSelectionPlayerCard(
    player
) {

    const image =
        player.fotografija ||
        "images/grb.png";


    const number =
        player.broj !== null &&
        player.broj !== undefined
            ? player.broj
            : "";


    const position =
        player.pozicija_detaljno ||
        player.pozicija ||
        "";


    return `

        <article class="player-card">


            <div class="player-photo-wrap">


                ${
                    player.fotografija

                        ? `

                            <img
                                src="${escapeSelectionPageAttribute(image)}"
                                alt="${escapeSelectionPageAttribute(player.ime_prezime || "")}"
                                class="player-photo"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.src='images/grb.png';
                                "
                            >

                        `

                        : `

                            <div class="player-placeholder">

                                <img
                                    src="images/grb.png"
                                    alt=""
                                    class="player-placeholder-crest"
                                >

                                <strong>
                                    ${escapeSelectionPageHtml(
                                        getSelectionInitials(
                                            player.ime_prezime
                                        )
                                    )}
                                </strong>

                            </div>

                        `
                }


                ${
                    number !== ""

                        ? `

                            <span class="player-number">
                                ${escapeSelectionPageHtml(String(number))}
                            </span>

                        `

                        : ""
                }


            </div>


            <div class="player-card-info">

                <h3>
                    ${escapeSelectionPageHtml(player.ime_prezime || "")}
                </h3>


                <span class="player-position">
                    ${escapeSelectionPageHtml(position)}
                </span>

            </div>


        </article>

    `;

}



/* =========================================================
   STRUČNI ŠTAB
========================================================= */

async function loadSelectionStaff(
    selectionName
) {

    if (!selectionStaffGrid) {

        return;

    }


    selectionStaffGrid.innerHTML = `

        <div class="team-data-empty">
            Учитавање стручног штаба...
        </div>

    `;


    try {

        const url =
            new URL(
                `${SELECTION_PAGE_SUPABASE_URL}/rest/v1/strucni_stab`
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
            `eq.${selectionName}`
        );


        url.searchParams.set(
            "order",
            "redosled.asc,ime_prezime.asc"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    headers: {

                        "apikey":
                            SELECTION_PAGE_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${SELECTION_PAGE_SUPABASE_KEY}`,

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


        renderSelectionStaff(
            staff
        );

    }

    catch (error) {

        console.error(
            "Грешка при учитавању стручног штаба:",
            error
        );


        selectionStaffGrid.innerHTML = `

            <div class="team-data-empty">
                Стручни штаб тренутно није доступан.
            </div>

        `;

    }

}



/* =========================================================
   PRIKAZ STRUČNOG ŠTABA
========================================================= */

function renderSelectionStaff(
    staff
) {

    if (
        !Array.isArray(staff) ||
        staff.length === 0
    ) {

        selectionStaffGrid.innerHTML = `

            <div class="team-data-empty">
                Стручни штаб ове селекције још није унет.
            </div>

        `;

        return;

    }


    selectionStaffGrid.innerHTML =
        staff
            .map(
                createSelectionStaffCard
            )
            .join("");

}



/* =========================================================
   KARTICA TRENERA
========================================================= */

function createSelectionStaffCard(
    member
) {

    const image =
        member.fotografija ||
        "images/grb.png";


    return `

        <article class="player-card staff-card">


            <div class="player-photo-wrap">


                ${
                    member.fotografija

                        ? `

                            <img
                                src="${escapeSelectionPageAttribute(image)}"
                                alt="${escapeSelectionPageAttribute(member.ime_prezime || "")}"
                                class="player-photo"
                                loading="lazy"
                                onerror="
                                    this.onerror=null;
                                    this.src='images/grb.png';
                                "
                            >

                        `

                        : `

                            <div class="player-placeholder staff-placeholder">

                                <img
                                    src="images/grb.png"
                                    alt=""
                                    class="player-placeholder-crest"
                                >

                                <strong>
                                    ${escapeSelectionPageHtml(
                                        getSelectionInitials(
                                            member.ime_prezime
                                        )
                                    )}
                                </strong>

                            </div>

                        `
                }


            </div>


            <div class="player-card-info">

                <span class="staff-role">
                    ${escapeSelectionPageHtml(member.uloga || "")}
                </span>


                <h3>
                    ${escapeSelectionPageHtml(member.ime_prezime || "")}
                </h3>

            </div>


        </article>

    `;

}



/* =========================================================
   INICIJALI
========================================================= */

function getSelectionInitials(
    name = ""
) {

    return String(
        name
    )
        .trim()
        .split(
            /\s+/
        )
        .filter(Boolean)
        .slice(
            0,
            2
        )
        .map(
            part =>
                part.charAt(0)
        )
        .join("")
        .toUpperCase();

}



/* =========================================================
   GREŠKA
========================================================= */

function showSelectionError() {

    if (selectionLoading) {

        selectionLoading.hidden =
            true;

    }


    if (selectionContent) {

        selectionContent.hidden =
            true;

    }


    if (selectionError) {

        selectionError.hidden =
            false;

    }


    if (selectionHeroTitle) {

        selectionHeroTitle.textContent =
            "СЕЛЕКЦИЈА";

    }


    if (selectionHeroYear) {

        selectionHeroYear.textContent =
            "Подаци нису доступни";

    }

}



/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeSelectionPageHtml(
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



function escapeSelectionPageAttribute(
    value = ""
) {

    return escapeSelectionPageHtml(
        value
    );

}