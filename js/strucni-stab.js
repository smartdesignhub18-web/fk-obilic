/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   STRUČNI ŠTAB NA STRANICI KLUBA
========================================================= */

async function loadClubStaff() {
    const container =
        document.querySelector("#club-staff-grid");

    if (!container) return;

    try {
        const response = await fetch(
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

        const data = await response.json();

        const staff =
            Array.isArray(
                data?.prviTim?.strucniStab
            )
                ? data.prviTim.strucniStab
                : [];


        if (staff.length === 0) {
            container.innerHTML = `
                <div class="team-data-empty">
                    Подаци о стручном штабу тренутно нису доступни.
                </div>
            `;

            return;
        }


        container.innerHTML =
            staff
                .map(member =>
                    createClubStaffCard(member)
                )
                .join("");

    } catch (error) {

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
   KARTICA ČLANA STRUČNOG ŠTABA
========================================================= */

function createClubStaffCard(member) {

    const rawName =
        member.ime || "Име није унето";

    const name =
        escapeClubStaffHtml(rawName);

    const role =
        escapeClubStaffHtml(
            member.uloga || "Стручни штаб"
        );

    const image =
        escapeClubStaffHtml(
            member.slika || ""
        );

    const initials =
        escapeClubStaffHtml(
            getClubStaffInitials(rawName)
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

function getClubStaffInitials(name = "") {

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
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();
}



/* =========================================================
   ZAŠTITA TEKSTA
========================================================= */

function escapeClubStaffHtml(value = "") {

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
    loadClubStaff
);