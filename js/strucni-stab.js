/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   STRUČNI ŠTAB NA STRANICI KLUBA
========================================================= */

const STAFF_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const STAFF_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


/* =========================================================
   UČITAVANJE
========================================================= */

async function loadClubStaff() {

    const container =
        document.querySelector(
            "#club-staff-grid"
        );

    if (!container) {
        return;
    }


    try {

        const url =
            `${STAFF_SUPABASE_URL}` +
            `/rest/v1/strucni_stab` +
            `?select=id,ime_prezime,uloga,selekcija,fotografija,redosled,aktivan` +
            `&aktivan=eq.true` +
            `&order=redosled.asc,ime_prezime.asc`;


        const response =
            await fetch(
                url,
                {
                    cache: "no-store",

                    headers: {

                        apikey:
                            STAFF_SUPABASE_KEY,

                        Authorization:
                            `Bearer ${STAFF_SUPABASE_KEY}`

                    }

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
            createClubStaffSections(
                staff
            );

    }

    catch (error) {

        console.error(
            "Грешка при учитавању стручног штаба:",
            error
        );


        container.innerHTML = `
            <div class="team-data-empty">
                Није могуће учитати стручни штаб.
            </div>
        `;

    }

}



/* =========================================================
   GRUPISANJE PO SELEKCIJAMA
========================================================= */

function createClubStaffSections(
    staff
) {

    const grouped =
        new Map();


    staff.forEach(
        member => {

            const selection =
                member.selekcija ||
                "ОСТАЛО";


            if (
                !grouped.has(
                    selection
                )
            ) {

                grouped.set(
                    selection,
                    []
                );

            }


            grouped
                .get(selection)
                .push(member);

        }
    );


    /*
        Prvi tim uvek ide prvi.
    */

    const selections =
        [
            ...grouped.keys()
        ].sort(
            (a, b) => {

                if (
                    a === "ПРВИ ТИМ"
                ) {
                    return -1;
                }


                if (
                    b === "ПРВИ ТИМ"
                ) {
                    return 1;
                }


                return a.localeCompare(
                    b,
                    "sr"
                );

            }
        );


    return selections
        .map(
            selection => {

                const members =
                    grouped.get(
                        selection
                    );


                return `
                    <div class="club-staff-section">

                        <div class="club-staff-selection-title">

                            ${escapeClubStaffHtml(
                                selection
                            )}

                        </div>


                        <div class="players-grid club-staff-selection-grid">

                            ${members
                                .map(
                                    member =>
                                        createClubStaffCard(
                                            member
                                        )
                                )
                                .join("")}

                        </div>

                    </div>
                `;

            }
        )
        .join("");

}



/* =========================================================
   KARTICA ČLANA STRUČNOG ŠTABA
========================================================= */

function createClubStaffCard(
    member
) {

    const rawName =
        member.ime_prezime ||
        "Име није унето";


    const name =
        escapeClubStaffHtml(
            rawName
        );


    const role =
        escapeClubStaffHtml(
            member.uloga ||
            "Стручни штаб"
        );


    const image =
        escapeClubStaffHtml(
            member.fotografija ||
            ""
        );


    const initials =
        escapeClubStaffHtml(
            getClubStaffInitials(
                rawName
            )
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
                <div class="player-placeholder staff-placeholder">

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
   INICIJALI
========================================================= */

function getClubStaffInitials(
    name = ""
) {

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        parts.length === 0
    ) {

        return "ФК";

    }


    return parts
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
   ZAŠTITA TEKSTA
========================================================= */

function escapeClubStaffHtml(
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



/* =========================================================
   POKRETANJE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadClubStaff
);