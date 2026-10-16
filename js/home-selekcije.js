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
   UČITAVANJE SELEKCIJA
========================================================= */

async function loadHomeSelections() {

    const container =
        document.querySelector(
            "#home-teams-grid"
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
                    method:
                        "GET",

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

            showHomeSelectionsEmpty(
                container
            );

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
   KARTICA SELEKCIJE
========================================================= */

function createHomeSelectionCard(
    selection
) {

    const code =
        selection.kod ||
        "";


    const name =
        selection.naziv ||
        "Селекција";


    const isFirstTeam =
        code === "prvi-tim";


    const description =
        selection.opis ||
        (
            isFirstTeam
                ? "Сениорска екипа ФК Обилић."
                : "Млађа селекција ФК Обилић."
        );


    /*
        Ako selekcija ima svoju fotografiju,
        koristimo nju.

        Ako nema fotografiju,
        prikazujemo teren.
    */

    const image =
        selection.fotografija ||
        "images/teren.webp";


    /*
        PRVI TIM vodi na ekipе.html.

        Sve mlađe selekcije vode
        na dinamičku stranicu selekcije.
    */

    const href =
        isFirstTeam
            ? "ekipe.html#prvi-tim"
            : `selekcija.html?kod=${encodeURIComponent(code)}`;


    const label =
        isFirstTeam
            ? "СЕНИОРИ"
            : "МЛАЂЕ СЕЛЕКЦИЈЕ";


    const linkText =
        isFirstTeam
            ? "ПОГЛЕДАЈ ЕКИПУ"
            : "ПОГЛЕДАЈ СЕЛЕКЦИЈУ";


    const year =
        selection.godiste
            ? `

                <span class="home-team-card-year">
                    ${escapeHomeSelectionHtml(
                        selection.godiste
                    )}
                </span>

            `
            : "";


    return `

        <a
            href="${escapeHomeSelectionAttribute(href)}"
            class="
                home-team-card
                ${
                    isFirstTeam
                        ? "home-team-card-primary"
                        : ""
                }
            "
        >

            <div class="home-team-card-image">

                <img
                    src="${escapeHomeSelectionAttribute(image)}"
                    alt="${escapeHomeSelectionAttribute(name)}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='images/teren.webp';
                    "
                >

            </div>


            <div class="home-team-card-content">

                ${year}


                <span class="home-team-card-label">
                    ${escapeHomeSelectionHtml(label)}
                </span>


                <h3 class="home-team-card-title">
                    ${escapeHomeSelectionHtml(name)}
                </h3>


                <p class="home-team-card-text">
                    ${escapeHomeSelectionHtml(description)}
                </p>


                <span class="home-team-card-link">

                    ${escapeHomeSelectionHtml(linkText)}

                    <span aria-hidden="true">
                        →
                    </span>

                </span>

            </div>

        </a>

    `;

}


/* =========================================================
   PRAZNO STANJE
========================================================= */

function showHomeSelectionsEmpty(
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