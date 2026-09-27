/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   UPRAVA KLUBA - SUPABASE
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const MANAGEMENT_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const MANAGEMENT_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadManagement
);



/* =========================================================
   UČITAVANJE UPRAVE
========================================================= */

async function loadManagement() {

    const container =
        document.querySelector(
            ".management-grid"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="club-management-empty">

            <img
                src="images/grb.png"
                alt=""
            >

            <div>

                <strong>
                    УЧИТАВАЊЕ УПРАВЕ
                </strong>

                <p>
                    Молимо сачекајте...
                </p>

            </div>

        </div>

    `;


    try {

        const url =
            new URL(
                `${MANAGEMENT_SUPABASE_URL}/rest/v1/uprava`
            );


        url.searchParams.set(
            "select",
            [
                "id",
                "ime_prezime",
                "funkcija",
                "fotografija",
                "istaknut",
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
            "istaknut.desc,redosled.asc,ime_prezime.asc"
        );


        const response =
            await fetch(
                url.toString(),
                {

                    method:
                        "GET",

                    headers: {

                        "apikey":
                            MANAGEMENT_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${MANAGEMENT_SUPABASE_KEY}`,

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


        const management =
            await response.json();


        if (
            !Array.isArray(management) ||
            management.length === 0
        ) {

            showManagementEmpty(
                container
            );

            return;

        }


        container.innerHTML =
            management
                .map(
                    createManagementCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Грешка при учитавању управе:",
            error
        );


        container.innerHTML = `

            <div class="club-management-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        УПРАВА КЛУБА
                    </strong>

                    <p>
                        Подаци тренутно нису доступни.
                    </p>

                </div>

            </div>

        `;

    }

}



/* =========================================================
   KARTICA ČLANA UPRAVE
========================================================= */

function createManagementCard(
    member
) {

    const name =
        member.ime_prezime ||
        "";


    const role =
        member.funkcija ||
        "";


    const photo =
        member.fotografija ||
        "";


    const featuredClass =
        member.istaknut
            ? "management-president"
            : "";


    return `

        <article
            class="
                management-card
                ${featuredClass}
            "
        >


            <div class="management-photo-wrap">

                ${
                    photo

                    ? `

                        <img
                            src="${escapeManagementAttribute(photo)}"
                            alt="${escapeManagementAttribute(name)}"
                            class="management-photo"
                            loading="lazy"

                            onerror="
                                this.style.display='none';
                                this.nextElementSibling.style.display='flex';
                            "
                        >


                        <div
                            class="management-placeholder"
                            style="display:none;"
                        >

                            <img
                                src="images/grb.png"
                                class="management-placeholder-crest"
                                alt=""
                            >

                            <strong>
                                ${escapeManagementHtml(
                                    getManagementInitials(
                                        name
                                    )
                                )}
                            </strong>

                        </div>

                    `

                    : `

                        <div class="management-placeholder">

                            <img
                                src="images/grb.png"
                                class="management-placeholder-crest"
                                alt=""
                            >

                            <strong>
                                ${escapeManagementHtml(
                                    getManagementInitials(
                                        name
                                    )
                                )}
                            </strong>

                        </div>

                    `
                }

            </div>



            <div class="management-card-info">

                <span class="management-role">
                    ${escapeManagementHtml(role)}
                </span>

                <h3>
                    ${escapeManagementHtml(name)}
                </h3>

            </div>


        </article>

    `;

}



/* =========================================================
   PRAZNO STANJE
========================================================= */

function showManagementEmpty(
    container
) {

    container.innerHTML = `

        <div class="club-management-empty">

            <img
                src="images/grb.png"
                alt=""
            >

            <div>

                <strong>
                    УПРАВА КЛУБА
                </strong>

                <p>
                    Подаци о управи биће објављени ускоро.
                </p>

            </div>

        </div>

    `;

}



/* =========================================================
   INICIJALI
========================================================= */

function getManagementInitials(
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

function escapeManagementHtml(
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



function escapeManagementAttribute(
    value = ""
) {

    return escapeManagementHtml(
        value
    );

}