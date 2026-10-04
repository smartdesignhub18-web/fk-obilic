/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   SELEKCIJE NA POČETNOJ
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const HOME_SELECTIONS_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const HOME_SELECTIONS_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadHomeSelections
);


/* =========================================================
   UČITAVANJE
========================================================= */

async function loadHomeSelections() {

    const container =
        document.querySelector(
            "#home-teams-grid"
        );


    if (!container) {
        return;
    }


    try {

        const url =
            new URL(
                `${HOME_SELECTIONS_SUPABASE_URL}/rest/v1/selekcije`
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
                    method: "GET",

                    headers: {

                        "apikey":
                            HOME_SELECTIONS_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${HOME_SELECTIONS_SUPABASE_KEY}`,

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

            container.innerHTML = `

                <div class="team-data-empty">
                    Тренутно нема активних селекција.
                </div>

            `;

            return;

        }


        container.innerHTML =
            selections
                .map(
                    createHomeSelectionCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Грешка при учитавању селекција на почетној:",
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
   KARTICA
========================================================= */

function createHomeSelectionCard(
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


    const isFirstTeam =
        code === "prvi-tim";


    const href =
        isFirstTeam
            ? "ekipe.html#prvi-tim"
            : `selekcija.html?kod=${encodeURIComponent(code)}`;


    const text =
        description ||
        (
            isFirstTeam
                ? "Играчи и стручни штаб"
                : "Млађе селекције клуба"
        );


    return `

        <a
            href="${escapeHomeSelectionAttribute(href)}"
            class="team-card"
        >

            <svg
                class="team-football-icon"
                viewBox="0 0 64 64"
                aria-hidden="true"
            >

                <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="#ffffff"
                    stroke="currentColor"
                    stroke-width="3"
                />

                <path
                    d="
                        M32 19
                        L42 26
                        L38 38
                        L26 38
                        L22 26
                        Z
                    "
                    fill="currentColor"
                />

                <path
                    d="
                        M32 19 L32 6
                        M42 26 L55 22
                        M38 38 L46 51
                        M26 38 L18 51
                        M22 26 L9 22
                    "
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                />

            </svg>


            <h3>
                ${escapeHomeSelectionHtml(name)}
            </h3>


            <p>
                ${escapeHomeSelectionHtml(text)}
            </p>

        </a>

    `;

}


/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeHomeSelectionHtml(
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


function escapeHomeSelectionAttribute(
    value = ""
) {

    return escapeHomeSelectionHtml(
        value
    );

}