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


        if (contact.telefon) {
            items.push(`
                <a
                    href="tel:${escapeContactAttribute(contact.telefon)}"
                    class="contact-detail-item"
                >
                    <span>ТЕЛЕФОН</span>
                    <strong>
                        ${escapeContactHtml(contact.telefon)}
                    </strong>
                </a>
            `);
        }


        if (contact.email) {
            items.push(`
                <a
                    href="mailto:${escapeContactAttribute(contact.email)}"
                    class="contact-detail-item"
                >
                    <span>Е-ПОШТА</span>
                    <strong>
                        ${escapeContactHtml(contact.email)}
                    </strong>
                </a>
            `);
        }


        if (contact.adresa) {
            items.push(`
                <div class="contact-detail-item">
                    <span>АДРЕСА</span>
                    <strong>
                        ${escapeContactHtml(contact.adresa)}
                    </strong>
                </div>
            `);
        }


        if (contact.instagram) {
            const instagram =
                sanitizeContactUrl(contact.instagram);

            if (instagram) {
                items.push(`
                    <a
                        href="${instagram}"
                        class="contact-detail-item"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>ИНСТАГРАМ</span>
                        <strong>
                            Званични профил
                        </strong>
                    </a>
                `);
            }
        }


        if (contact.facebook) {
            const facebook =
                sanitizeContactUrl(contact.facebook);

            if (facebook) {
                items.push(`
                    <a
                        href="${facebook}"
                        class="contact-detail-item"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span>ФЕЈСБУК</span>
                        <strong>
                            Званична страница
                        </strong>
                    </a>
                `);
            }
        }


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
   URL PROVERA
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

        return escapeContactAttribute(url.href);

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