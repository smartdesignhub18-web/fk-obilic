/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   FOOTER - DRUŠTVENE MREŽE I KONTAKT
========================================================= */

async function loadFooterLinks() {

    const footerContent =
        document.querySelector(".footer-content");

    if (!footerContent) return;


    /*
        Ako su linkovi već napravljeni,
        ne pravimo ih ponovo.
    */

    if (
        footerContent.querySelector(
            ".footer-socials"
        )
    ) {
        return;
    }


    try {

        const response = await fetch(
            "data/kontakt.json",
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

        const contact =
            data?.kontakt || {};


        const socialWrapper =
            document.createElement("div");


        socialWrapper.className =
            "footer-socials";


        socialWrapper.innerHTML = `
            <span class="footer-socials-title">
                ПРАТИТЕ НАС
            </span>

            <div class="footer-social-links">

                ${createFooterContactLink()}

                ${
                    contact.instagram
                        ? createFooterInstagramLink(
                            contact.instagram
                        )
                        : ""
                }

                ${
                    contact.facebook
                        ? createFooterFacebookLink(
                            contact.facebook
                        )
                        : ""
                }

            </div>
        `;


        /*
            Ubacujemo društvene mreže
            pre copyright dela footera.
        */

        const copyright =
            footerContent.querySelector(
                ".copyright"
            );


        if (copyright) {

            footerContent.insertBefore(
                socialWrapper,
                copyright
            );

        } else {

            footerContent.appendChild(
                socialWrapper
            );

        }


    } catch (error) {

        console.error(
            "Грешка при учитавању footer линкова:",
            error
        );

    }
}



/* =========================================================
   KONTAKT
========================================================= */

function createFooterContactLink() {

    return `
        <a
            href="kontakt.html"
            class="footer-social-link"
            aria-label="Контакт"
            title="Контакт"
        >

            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M3 5h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2zm9 7L3.4 7h17.2L12 12zm0 2.3L3 9v8h18V9l-9 5.3z"
                />
            </svg>

            <span>
                КОНТАКТ
            </span>

        </a>
    `;
}



/* =========================================================
   INSTAGRAM
========================================================= */

function createFooterInstagramLink(value) {

    const link =
        sanitizeFooterUrl(value);


    if (!link) {
        return "";
    }


    return `
        <a
            href="${link}"
            class="footer-social-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Инстаграм"
            title="Инстаграм"
        >

            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                class="footer-instagram-icon"
            >

                <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    ry="5"
                />

                <circle
                    cx="12"
                    cy="12"
                    r="4"
                />

                <circle
                    cx="17.5"
                    cy="6.5"
                    r="1"
                    class="footer-icon-dot"
                />

            </svg>

            <span>
                ИНСТАГРАМ
            </span>

        </a>
    `;
}



/* =========================================================
   FACEBOOK
========================================================= */

function createFooterFacebookLink(value) {

    const link =
        sanitizeFooterUrl(value);


    if (!link) {
        return "";
    }


    return `
        <a
            href="${link}"
            class="footer-social-link"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Фејсбук"
            title="Фејсбук"
        >

            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M14 8h3V4.5c-.5-.1-2-.2-3.4-.2-3.3 0-5.6 2-5.6 5.8V13H5v4h3v7h4v-7h3.3l.7-4H12v-2.5C12 9.3 12.3 8 14 8z"
                />
            </svg>

            <span>
                ФЕЈСБУК
            </span>

        </a>
    `;
}



/* =========================================================
   PROVERA LINKA
========================================================= */

function sanitizeFooterUrl(value = "") {

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


        return escapeFooterAttribute(
            url.href
        );


    } catch {

        return "";

    }
}



/* =========================================================
   ZAŠTITA ATRIBUTA
========================================================= */

function escapeFooterAttribute(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
        .replaceAll("<", "")
        .replaceAll(">", "");
}



/* =========================================================
   POKRETANJE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadFooterLinks
);