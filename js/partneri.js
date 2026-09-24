/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   PARTNERI
========================================================= */

async function loadPartners() {

    const pageContainer =
        document.querySelector("#partners-page-grid");

    const homeContainer =
        document.querySelector("#home-partners-grid");


    if (!pageContainer && !homeContainer) return;


    try {

        const response = await fetch(
            "data/partneri.json",
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


        const partners =
            Array.isArray(data?.partneri)
                ? data.partneri
                : [];


        /* =====================================================
           POSEBNA STRANICA PARTNERA
        ===================================================== */

        if (pageContainer) {

            renderPartnersPage(
                pageContainer,
                partners
            );

        }


        /* =====================================================
           PARTNERI NA POČETNOJ
        ===================================================== */

        if (homeContainer) {

            renderHomePartners(
                homeContainer,
                partners
            );

        }


    } catch (error) {

        console.error(
            "Грешка при учитавању партнера:",
            error
        );


        if (pageContainer) {

            pageContainer.innerHTML = `
                <div class="partners-page-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <div>

                        <strong>
                            ПАРТНЕРИ ТРЕНУТНО НИСУ ДОСТУПНИ
                        </strong>

                        <p>
                            Није могуће учитати податке о партнерима.
                        </p>

                    </div>

                </div>
            `;

        }


        if (homeContainer) {

            homeContainer.innerHTML = `
                <div class="home-partners-empty">
                    Партнери тренутно нису доступни.
                </div>
            `;

        }

    }
}



/* =========================================================
   POSEBNA STRANICA PARTNERA
========================================================= */

function renderPartnersPage(
    container,
    partners
) {

    if (partners.length === 0) {

        container.innerHTML = `
            <div class="partners-page-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        ПАРТНЕРИ КЛУБА
                    </strong>

                    <p>
                        Подаци о партнерима биће додати ускоро.
                    </p>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML =
        partners
            .map(partner =>
                createPartnerPageCard(partner)
            )
            .join("");
}



/* =========================================================
   PARTNERI NA POČETNOJ
========================================================= */

function renderHomePartners(
    container,
    partners
) {

    if (partners.length === 0) {

        container.innerHTML = `
            <div class="home-partners-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <span>
                    Партнери клуба биће додати ускоро.
                </span>

            </div>
        `;

        return;
    }


    /*
        Na početnoj prikazujemo prvih 5 partnera.
        Svi partneri ostaju dostupni na partneri.html.
    */

    const homePartners =
        partners.slice(0, 5);


    container.innerHTML =
        homePartners
            .map(partner =>
                createHomePartnerCard(partner)
            )
            .join("");
}



/* =========================================================
   KARTICA NA STRANICI PARTNERA
========================================================= */

function createPartnerPageCard(partner) {

    const name =
        escapePartnerHtml(
            partner.naziv || "Партнер клуба"
        );


    const logo =
        escapePartnerHtml(
            partner.logo || ""
        );


    const link =
        sanitizePartnerLink(
            partner.link || ""
        );


    const type =
        escapePartnerHtml(
            partner.tip || "Партнер клуба"
        );


    const content = `
        <article class="partner-page-card">

            <div class="partner-page-logo">

                ${
                    logo
                        ? `
                            <img
                                src="${logo}"
                                alt="${name}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none';
                                "
                            >
                        `
                        : `
                            <img
                                src="images/grb.png"
                                alt=""
                                loading="lazy"
                                style="
                                    opacity:0.12;
                                    filter:grayscale(1);
                                "
                            >
                        `
                }

            </div>


            <div class="partner-page-info">

                <h3>
                    ${name}
                </h3>

                <span>
                    ${type}
                </span>

            </div>

        </article>
    `;


    if (!link) {
        return content;
    }


    return `
        <a
            href="${link}"
            class="partner-page-card-link"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${content}
        </a>
    `;
}



/* =========================================================
   KARTICA PARTNERA NA POČETNOJ
========================================================= */

function createHomePartnerCard(partner) {

    const name =
        escapePartnerHtml(
            partner.naziv || "Партнер клуба"
        );


    const logo =
        escapePartnerHtml(
            partner.logo || ""
        );


    const link =
        sanitizePartnerLink(
            partner.link || ""
        );


    const content = `
        <div class="home-partner-card">

            <div class="home-partner-logo">

                ${
                    logo
                        ? `
                            <img
                                src="${logo}"
                                alt="${name}"
                                loading="lazy"
                                onerror="
                                    this.style.display='none';
                                "
                            >
                        `
                        : `
                            <img
                                src="images/grb.png"
                                alt=""
                                loading="lazy"
                                class="home-partner-placeholder"
                            >
                        `
                }

            </div>

            <strong>
                ${name}
            </strong>

        </div>
    `;


    if (!link) {
        return content;
    }


    return `
        <a
            href="${link}"
            class="home-partner-link"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${content}
        </a>
    `;
}



/* =========================================================
   LINK PARTNERA
========================================================= */

function sanitizePartnerLink(value = "") {

    const link =
        String(value).trim();


    if (!link) {
        return "";
    }


    try {

        const url =
            new URL(link);


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return "";
        }


        return escapePartnerHtml(
            url.href
        );


    } catch {

        return "";

    }
}



/* =========================================================
   ZAŠTITA TEKSTA
========================================================= */

function escapePartnerHtml(value = "") {

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
    loadPartners
);