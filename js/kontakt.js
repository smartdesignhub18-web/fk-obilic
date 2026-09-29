/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   KONTAKT - JAVNI SAJT
========================================================= */

(() => {

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    document.addEventListener(
        "DOMContentLoaded",
        loadContactData
    );



    /* =====================================================
       UČITAVANJE
    ===================================================== */

    async function loadContactData() {

        const container =
            document.querySelector(
                "#contact-details-grid"
            ) ||
            document.querySelector(
                ".contact-details-grid"
            );


        if (!container) {
            return;
        }


        try {

            const url =
                `${SUPABASE_URL}/rest/v1/kontakt` +
                `?select=id,tip,naziv,vrednost,link,redosled,aktivan` +
                `&aktivan=eq.true` +
                `&order=redosled.asc,created_at.asc`;


            const response =
                await fetch(
                    url,
                    {
                        headers: {

                            apikey:
                                SUPABASE_KEY,

                            Authorization:
                                `Bearer ${SUPABASE_KEY}`

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


            const contacts =
                await response.json();


            if (
                !Array.isArray(
                    contacts
                )
            ) {

                throw new Error(
                    "Неисправан формат контакт података."
                );

            }


            renderContacts(
                contacts,
                container
            );

        }

        catch (error) {

            console.error(
                "Greška pri učitavanju kontakta:",
                error
            );


            renderContactError(
                container
            );

        }

    }



    /* =====================================================
       PRIKAZ
    ===================================================== */

    function renderContacts(
        contacts,
        container
    ) {

        if (!contacts.length) {

            container.innerHTML = `

                <div class="contact-data-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <div>

                        <strong>
                            Контакт подаци
                        </strong>

                        <p>
                            Контакт подаци клуба
                            биће додати ускоро.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML =
            contacts
                .map(
                    renderContactItem
                )
                .join("");

    }



    /* =====================================================
       POJEDINAČNI KONTAKT
    ===================================================== */

    function renderContactItem(
        item
    ) {

        const label =
            item.naziv ||
            getContactTypeLabel(
                item.tip
            );


        const value =
            item.vrednost ||
            "";


        const link =
            getSafeContactLink(
                item.link
            );


        const content = `

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(value)}
            </strong>

        `;


        if (link) {

            return `

                <a
                    href="${escapeAttribute(link)}"
                    class="contact-detail-item"
                    ${getLinkAttributes(link)}
                >

                    ${content}

                </a>

            `;

        }


        return `

            <div class="contact-detail-item">

                ${content}

            </div>

        `;

    }



    /* =====================================================
       LABELA
    ===================================================== */

    function getContactTypeLabel(
        type
    ) {

        const labels = {

            telefon:
                "ТЕЛЕФОН",

            email:
                "E-MAIL",

            adresa:
                "АДРЕСА",

            instagram:
                "INSTAGRAM",

            facebook:
                "FACEBOOK",

            youtube:
                "YOUTUBE",

            website:
                "ВЕБ САЈТ",

            ostalo:
                "КОНТАКТ"

        };


        return (
            labels[type] ||
            "КОНТАКТ"
        );

    }



    /* =====================================================
       BEZBEDAN LINK
    ===================================================== */

    function getSafeContactLink(
        value
    ) {

        if (!value) {
            return "";
        }


        const link =
            String(value)
                .trim();


        if (
            link.startsWith("tel:") ||
            link.startsWith("mailto:")
        ) {

            return link;

        }


        try {

            const url =
                new URL(
                    link
                );


            if (
                url.protocol === "http:" ||
                url.protocol === "https:"
            ) {

                return url.href;

            }

        }

        catch {

            return "";

        }


        return "";

    }



    function getLinkAttributes(
        link
    ) {

        if (
            link.startsWith("http://") ||
            link.startsWith("https://")
        ) {

            return `
                target="_blank"
                rel="noopener noreferrer"
            `;

        }


        return "";

    }



    /* =====================================================
       GREŠKA
    ===================================================== */

    function renderContactError(
        container
    ) {

        container.innerHTML = `

            <div class="contact-data-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        Контакт
                    </strong>

                    <p>
                        Контакт податке тренутно
                        није могуће учитати.
                    </p>

                </div>

            </div>

        `;

    }



    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHtml(
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


    function escapeAttribute(
        value = ""
    ) {

        return escapeHtml(
            value
        );

    }

})();