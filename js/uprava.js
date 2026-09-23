/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   UPRAVA KLUBA
========================================================= */

async function loadClubManagement() {
    const container = document.querySelector("#uprava-grid");

    if (!container) return;

    try {
        const response = await fetch("data/uprava.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        const members =
            Array.isArray(data?.uprava?.clanovi)
                ? data.uprava.clanovi
                : [];

        if (members.length === 0) {
            container.innerHTML = `
                <div class="club-management-empty">
                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <div>
                        <strong>
                            УПРАВА ФК ОБИЛИЋ
                        </strong>

                        <p>
                            Подаци о члановима управе биће додати након уноса званичних података.
                        </p>
                    </div>
                </div>
            `;

            return;
        }

        container.innerHTML =
            members
                .map(member => createManagementCard(member))
                .join("");

    } catch (error) {
        console.error(
            "Грешка при учитавању управе клуба:",
            error
        );

        container.innerHTML = `
            <div class="club-management-empty">
                <p>
                    Подаци о управи тренутно нису доступни.
                </p>
            </div>
        `;
    }
}


function createManagementCard(member) {
    const rawName =
        member.ime || "Име није унето";

    const name =
        escapeManagementHtml(rawName);

    const role =
        escapeManagementHtml(
            member.funkcija || ""
        );

    const image =
        escapeManagementHtml(
            member.slika || ""
        );

    const initials =
        escapeManagementHtml(
            getManagementInitials(rawName)
        );


    const visual = image
        ? `
            <img
                src="${image}"
                alt="${name}"
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
                    alt=""
                    class="management-placeholder-crest"
                >

                <strong>
                    ${initials}
                </strong>

            </div>
        `
        : `
            <div class="management-placeholder">

                <img
                    src="images/grb.png"
                    alt=""
                    class="management-placeholder-crest"
                >

                <strong>
                    ${initials}
                </strong>

            </div>
        `;


    return `
        <article class="management-card">

            <div class="management-photo-wrap">
                ${visual}
            </div>

            <div class="management-card-info">

                ${
                    role
                        ? `
                            <span class="management-role">
                                ${role}
                            </span>
                        `
                        : ""
                }

                <h3>
                    ${name}
                </h3>

            </div>

        </article>
    `;
}


function getManagementInitials(name = "") {
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


function escapeManagementHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


document.addEventListener(
    "DOMContentLoaded",
    loadClubManagement
);