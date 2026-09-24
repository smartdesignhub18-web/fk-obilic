/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   KONTAKT
========================================================= */

async function loadContactData() {
    const container =
        document.querySelector("#contact-dynamic");

    if (!container) return;

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

        const items = [];


        /* =====================================================
           TELEFON
        ===================================================== */

        if (contact.telefon) {

            const phone =
                escapeContactHtml(
                    contact.telefon
                );

            const phoneHref =
                String(contact.telefon)
                    .replace(/[^\d+]/g, "");

            items.push(`
                <a
                    href="tel:${phoneHref}"
                    class="contact-detail-item contact-clickable"
                >

                    <div class="contact-detail-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M6.6 10.8c1.6 3.1 3.5 5 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1.1l-2.2 2.1z"
                            />
                        </svg>

                    </div>

                    <div class="contact-detail-content">

                        <span>
                            ТЕЛЕФОН
                        </span>

                        <strong>
                            ${phone}
                        </strong>

                        <small>
                            ПОЗОВИТЕ НАС →
                        </small>

                    </div>

                </a>
            `);
        }


        /* =====================================================
           EMAIL
        ===================================================== */

        if (contact.email) {

            const email =
                escapeContactHtml(
                    contact.email
                );

            items.push(`
                <a
                    href="mailto:${escapeContactAttribute(contact.email)}"
                    class="contact-detail-item contact-clickable"
                >

                    <div class="contact-detail-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M3 5h18c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2zm9 7L3.4 7h17.2L12 12zm0 2.3L3 9v8h18V9l-9 5.3z"
                            />
                        </svg>

                    </div>

                    <div class="contact-detail-content">

                        <span>
                            Е-ПОШТА
                        </span>

                        <strong>
                            ${email}
                        </strong>

                        <small>
                            ПОШАЉИТЕ ПОРУКУ →
                        </small>

                    </div>

                </a>
            `);
        }


        /* =====================================================
           ADRESA / GOOGLE MAPS
        ===================================================== */

        if (contact.adresa) {

            const address =
                escapeContactHtml(
                    contact.adresa
                );

            let mapsUrl = "";

            if (contact.mapa) {
                mapsUrl =
                    sanitizeContactUrl(
                        contact.mapa
                    );
            }

            /*
                Rezervna varijanta:
                ako kasnije nema "mapa" linka,
                napravi Google Maps pretragu iz adrese.
            */

            if (!mapsUrl) {
                mapsUrl =
                    "https://www.google.com/maps/search/?api=1&query=" +
                    encodeURIComponent(
                        contact.adresa
                    );
            }

            items.push(`
                <a
                    href="${mapsUrl}"
                    class="contact-detail-item contact-clickable"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    <div class="contact-detail-icon">

                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                            />
                        </svg>

                    </div>

                    <div class="contact-detail-content">

                        <span>
                            ЛОКАЦИЈА
                        </span>

                        <strong>
                            ${address}
                        </strong>

                        <small>
                            ОТВОРИ GOOGLE MAPS →
                        </small>

                    </div>

                </a>
            `);
        }


        /* =====================================================
           INSTAGRAM
        ===================================================== */

        if (contact.instagram) {

            const instagram =
                sanitizeContactUrl(
                    contact.instagram
                );

            if (instagram) {

                items.push(`
                    <a
                        href="${instagram}"
                        class="contact-detail-item contact-clickable"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <div class="contact-detail-icon">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
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
                                    class="icon-dot"
                                />
                            </svg>

                        </div>

                        <div class="contact-detail-content">

                            <span>
                                ИНСТАГРАМ
                            </span>

                            <strong>
                                @fkobilicnk1930
                            </strong>

                            <small>
                                ПОСЕТИ ПРОФИЛ →
                            </small>

                        </div>

                    </a>
                `);
            }
        }


        /* =====================================================
           FACEBOOK
        ===================================================== */

        if (contact.facebook) {

            const facebook =
                sanitizeContactUrl(
                    contact.facebook
                );

            if (facebook) {

                items.push(`
                    <a
                        href="${facebook}"
                        class="contact-detail-item contact-clickable"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <div class="contact-detail-icon">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M14 8h3V4.5c-.5-.1-2-.2-3.4-.2-3.3 0-5.6 2-5.6 5.8V13H5v4h3v7h4v-7h3.3l.7-4H12v-2.5C12 9.3 12.3 8 14 8z"
                                />
                            </svg>

                        </div>

                        <div class="contact-detail-content">

                            <span>
                                ФЕЈСБУК
                            </span>

                            <strong>
                                ФК Обилић
                            </strong>

                            <small>
                                ПОСЕТИ СТРАНИЦУ →
                            </small>

                        </div>

                    </a>
                `);
            }
        }


        /* =====================================================
           AKO NEMA PODATAKA
        ===================================================== */

        if (items.length === 0) {

            container.innerHTML = `
                <div class="contact-data-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <div>

                        <strong>
                            КОНТАКТ ПОДАЦИ
                        </strong>

                        <p>
                            Званични контакт подаци клуба
                            биће додати ускоро.
                        </p>

                    </div>

                </div>
            `;

            return;
        }


        container.innerHTML =
            items.join("");


    } catch (error) {

        console.error(
            "Грешка при учитавању контакт података:",
            error
        );

        container.innerHTML = `
            <div class="contact-data-empty">

                <p>
                    Контакт подаци тренутно нису доступни.
                </p>

            </div>
        `;
    }
}



/* =========================================================
   PROVERA LINKA
========================================================= */

function sanitizeContactUrl(value = "") {

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

        return escapeContactAttribute(
            url.href
        );

    } catch {

        return "";

    }
}



/* =========================================================
   ZAŠTITA HTML-A
========================================================= */

function escapeContactHtml(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/* =========================================================
   ZAŠTITA ATRIBUTA
========================================================= */

function escapeContactAttribute(value = "") {

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
    loadContactData
);