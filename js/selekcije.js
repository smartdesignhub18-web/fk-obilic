/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   SELEKCIJE - SUPABASE
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const SELECTIONS_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const SELECTIONS_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadSelections
);



/* =========================================================
   UČITAVANJE SELEKCIJA
========================================================= */

async function loadSelections() {

    const container =
        document.querySelector(
            ".teams-main-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="team-data-empty">
            Учитавање селекција...
        </div>

    `;


    try {

        const url =
            new URL(
                `${SELECTIONS_SUPABASE_URL}/rest/v1/selekcije`
            );


        url.searchParams.set(
            "select",
            [
                "id",
                "kod",
                "naziv",
                "opis",
                "godiste",
                "fotografija",
                "redosled",
                "aktivna"
            ].join(",")
        );


        url.searchParams.set(
            "aktivna",
            "eq.true"
        );


        url.searchParams.set(
            "order",
            "redosled.asc,naziv.asc"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method:
                        "GET",

                    headers: {

                        "apikey":
                            SELECTIONS_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${SELECTIONS_SUPABASE_KEY}`,

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


        const selections =
            await response.json();


        if (
            !Array.isArray(selections) ||
            selections.length === 0
        ) {

            showSelectionsEmpty(
                container
            );

            return;

        }


        container.innerHTML =
            selections
                .map(
                    createSelectionCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Грешка при учитавању селекција:",
            error
        );


        container.innerHTML = `

            <div class="team-data-empty">
                Селекције тренутно нису доступне.
            </div>

        `;

    }

}



/* =========================================================
   KARTICA SELEKCIJE
========================================================= */

function createSelectionCard(
    selection
) {

    const code =
        selection.kod ||
        "";


    const name =
        selection.naziv ||
        "";


    const description =
        selection.opis ||
        "";


    const year =
        selection.godiste ||
        "";


    const image =
        selection.fotografija ||
        "images/grb.png";


    const isFirstTeam =
        code === "prvi-tim";


    const cardClass =
        isFirstTeam
            ? "team-card team-page-card team-primary"
            : "team-card team-page-card";


    const label =
        isFirstTeam
            ? "СЕНИОРИ"
            : "МЛАЂЕ СЕЛЕКЦИЈЕ";


    /*
        PRVI TIM ostaje na istoj stranici
        i vodi do postojeće sekcije #prvi-tim.

        Mlađe selekcije otvaraju
        dinamičku stranicu selekcija.html.
    */

    const href =
        isFirstTeam
            ? "#prvi-tim"
            : `selekcija.html?kod=${encodeURIComponent(code)}`;


    const additionalInfo =
        year
            ? `

                <span class="team-selection-year">
                    ГОДИШТЕ ${escapeSelectionHtml(year)}
                </span>

            `
            : "";


    const bottomText =
        isFirstTeam
            ? `

                <strong class="team-card-link">
                    ПОГЛЕДАЈ ЕКИПУ →
                </strong>

            `
            : `

                <span class="team-soon">
                    ПОГЛЕДАЈ СЕЛЕКЦИЈУ →
                </span>

            `;


    return `

        <a
            href="${escapeSelectionAttribute(href)}"
            class="${cardClass}"
        >

            <div
                class="
                    team-page-logo
                    ${
                        selection.fotografija
                            ? "team-selection-photo"
                            : ""
                    }
                "
            >

                <img
                    src="${escapeSelectionAttribute(image)}"
                    alt="${escapeSelectionAttribute(name)}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='images/grb.png';
                        this.parentElement.classList.remove('team-selection-photo');
                    "
                >

            </div>


            <span class="team-label">
                ${label}
            </span>


            <h3>
                ${escapeSelectionHtml(name)}
            </h3>


            ${additionalInfo}


            ${
                description
                    ? `

                        <p>
                            ${escapeSelectionHtml(description)}
                        </p>

                    `
                    : ""
            }


            ${bottomText}

        </a>

    `;

}



/* =========================================================
   PRAZNO STANJE
========================================================= */

function showSelectionsEmpty(
    container
) {

    container.innerHTML = `

        <div class="team-data-empty">
            Тренутно нема активних селекција.
        </div>

    `;

}



/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeSelectionHtml(
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



function escapeSelectionAttribute(
    value = ""
) {

    return escapeSelectionHtml(
        value
    );

}