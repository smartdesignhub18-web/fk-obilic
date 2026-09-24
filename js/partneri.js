/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   PARTNERI
========================================================= */

async function loadPartners() {
    const container =
        document.querySelector("#partners-page-grid");

    if (!container) return;


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
                    createPartnerCard(partner)
                )
                .join("");


    } catch (error) {

        console.error(
            "Грешка при учитавању партнера:",
            error
        );


        container.innerHTML = `
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
}



/* =========================================================
   KARTICA PARTNERA
========================================================= */

function createPartnerCard(partner) {

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
   LINK
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


        return escapePartnerHtml(url.href);

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