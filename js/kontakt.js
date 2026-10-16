/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   KONTAKT STRANICA
========================================================= */

(() => {

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    document.addEventListener(
        "DOMContentLoaded",
        loadContacts
    );


    /* =====================================================
       UČITAVANJE KONTAKATA
    ===================================================== */

    async function loadContacts() {

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


        container.innerHTML = `

            <div class="contact-data-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        Учитавање контакта...
                    </strong>

                    <p>
                        Молимо сачекајте.
                    </p>

                </div>

            </div>

        `;


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


            if (!Array.isArray(contacts)) {

                throw new Error(
                    "Неисправни контакт подаци."
                );

            }


            renderContacts(
                contacts,
                container
            );

        }

        catch (error) {

            console.error(
                "Грешка при учитавању контакта:",
                error
            );


            container.innerHTML = `

                <div class="contact-data-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <div>

                        <strong>
                            Контакт подаци тренутно нису доступни.
                        </strong>

                        <p>
                            Покушајте поново касније.
                        </p>

                    </div>

                </div>

            `;

        }

    }



    /* =====================================================
       PRIKAZ KONTAKATA
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
                            Контакт подаци ће бити додати ускоро.
                        </strong>

                        <p>
                            ФК Обилић Нови Кнежевац
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
       POJEDINAČNA KARTICA
    ===================================================== */

    function renderContactItem(
        item
    ) {

        const type =
            String(
                item.tip ||
                "ostalo"
            )
                .trim()
                .toLowerCase();


        const label =
            getContactLabel(
                item
            );


        const value =
            item.vrednost ||
            item.naziv ||
            "";


        const link =
            getContactLink(
                item
            );


        const icon =
            getContactIcon(
                type
            );


        const innerContent = `

            <div class="contact-detail-icon">
                ${icon}
            </div>


            <div class="contact-detail-content">

                <span>
                    ${escapeHtml(label)}
                </span>

                <strong>
                    ${escapeHtml(value)}
                </strong>

            </div>

        `;


        if (link) {

            return `

                <a
                    href="${escapeAttribute(link)}"
                    class="contact-detail-item contact-clickable"
                    ${getExternalAttributes(link)}
                >

                    ${innerContent}

                    <span
                        class="contact-detail-arrow"
                        aria-hidden="true"
                    >
                        →
                    </span>

                </a>

            `;

        }


        return `

            <div class="contact-detail-item">

                ${innerContent}

            </div>

        `;

    }



    /* =====================================================
       NAZIV KONTAKTA
    ===================================================== */

    function getContactLabel(
        item
    ) {

        if (
            item.naziv &&
            String(
                item.naziv
            ).trim()
        ) {

            return String(
                item.naziv
            ).trim();

        }


        switch (
            String(
                item.tip ||
                ""
            )
                .trim()
                .toLowerCase()
        ) {

            case "telefon":
                return "ТЕЛЕФОН";

            case "email":
                return "E-MAIL";

            case "adresa":
                return "АДРЕСА";

            case "instagram":
                return "ИНСТАГРАМ";

            case "facebook":
                return "ФЕЈСБУК";

            case "youtube":
                return "YOUTUBE";

            case "website":
                return "ВЕБ САЈТ";

            case "whatsapp":
                return "WHATSAPP";

            default:
                return "КОНТАКТ";

        }

    }



    /* =====================================================
       LINK KONTAKTA
    ===================================================== */

    function getContactLink(
        item
    ) {

        const type =
            String(
                item.tip ||
                ""
            )
                .trim()
                .toLowerCase();


        const value =
            String(
                item.vrednost ||
                ""
            ).trim();


        const savedLink =
            String(
                item.link ||
                ""
            ).trim();


        /* LINK IZ BAZE */

        if (savedLink) {

            return getSafeLink(
                savedLink
            );

        }


        /* TELEFON */

        if (
            type === "telefon" &&
            value
        ) {

            const phone =
                value.replace(
                    /[^0-9+]/g,
                    ""
                );


            return phone
                ? `tel:${phone}`
                : "";

        }


        /* EMAIL */

        if (
            type === "email" &&
            value
        ) {

            return `mailto:${value}`;

        }


        return "";

    }



    /* =====================================================
       IKONICE
    ===================================================== */

    function getContactIcon(
        type
    ) {

        switch (type) {


            /* =================================================
               INSTAGRAM
            ================================================= */

            case "instagram":

                return `

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

                `;



            /* =================================================
               FACEBOOK
            ================================================= */

            case "facebook":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <path
                            d="
                                M14 8
                                h3
                                V4.5
                                c-.8-.1-1.8-.2-3-.2
                                -3 0-5 1.8-5 5.2
                                V12
                                H6
                                v4
                                h3
                                v6
                                h4
                                v-6
                                h3.2
                                l.8-4
                                h-4
                                V9.8
                                c0-1.2.4-1.8 1-1.8
                            "
                        />

                    </svg>

                `;



            /* =================================================
               TELEFON
            ================================================= */

            case "telefon":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <path
                            d="
                                M6.5 3.5
                                9 3
                                l2 5
                                -2.2 1.5
                                a15 15 0 0 0
                                5.7 5.7
                                L16 13
                                l5 2
                                -.5 2.5
                                c-.4 2-2.2 3.5-4.2 3
                                C9.5 19
                                5 14.5
                                3.5 7.7
                                3 5.7
                                4.5 3.9
                                6.5 3.5
                                Z
                            "
                        />

                    </svg>

                `;



            /* =================================================
               EMAIL
            ================================================= */

            case "email":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <rect
                            x="3"
                            y="5"
                            width="18"
                            height="14"
                            rx="2"
                        />

                        <path
                            d="
                                M4 7
                                l8 6
                                8-6
                            "
                        />

                    </svg>

                `;



            /* =================================================
               ADRESA
            ================================================= */

            case "adresa":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <path
                            d="
                                M12 21
                                s7-6.2
                                7-12
                                a7 7 0 1 0
                                -14 0
                                c0 5.8
                                7 12
                                7 12
                                Z
                            "
                        />

                        <circle
                            cx="12"
                            cy="9"
                            r="2.5"
                        />

                    </svg>

                `;



            /* =================================================
               YOUTUBE
            ================================================= */

            case "youtube":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <rect
                            x="3"
                            y="6"
                            width="18"
                            height="12"
                            rx="4"
                        />

                        <path
                            d="
                                M10 9
                                l5 3
                                -5 3
                                Z
                            "
                        />

                    </svg>

                `;



            /* =================================================
               WEBSITE
            ================================================= */

            case "website":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                        />

                        <path d="M3 12h18"/>

                        <path
                            d="
                                M12 3
                                c2.5 2.5
                                3.8 5.5
                                3.8 9
                                S14.5 18.5
                                12 21
                            "
                        />

                        <path
                            d="
                                M12 3
                                C9.5 5.5
                                8.2 8.5
                                8.2 12
                                S9.5 18.5
                                12 21
                            "
                        />

                    </svg>

                `;



            /* =================================================
               WHATSAPP
            ================================================= */

            case "whatsapp":

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <path
                            d="
                                M20 11.5
                                a8 8 0 0 1
                                -11.8 7
                                L4 20
                                l1.5-4
                                A8 8 0 1 1
                                20 11.5
                                Z
                            "
                        />

                        <path
                            d="
                                M9 8
                                c.7 3
                                2.2 4.5
                                5 5.5
                            "
                        />

                    </svg>

                `;



            /* =================================================
               OSTALO
            ================================================= */

            default:

                return `

                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >

                        <circle
                            cx="12"
                            cy="12"
                            r="9"
                        />

                        <path d="M8 12h8"/>

                        <path d="M12 8v8"/>

                    </svg>

                `;

        }

    }



    /* =====================================================
       BEZBEDAN LINK
    ===================================================== */

    function getSafeLink(
        value
    ) {

        const link =
            String(
                value ||
                ""
            ).trim();


        if (!link) {
            return "";
        }


        if (
            link.startsWith(
                "https://"
            ) ||
            link.startsWith(
                "http://"
            ) ||
            link.startsWith(
                "mailto:"
            ) ||
            link.startsWith(
                "tel:"
            )
        ) {

            return link;

        }


        return "";

    }



    /* =====================================================
       TARGET BLANK ZA SPOLJNE LINKOVE
    ===================================================== */

    function getExternalAttributes(
        link
    ) {

        if (
            link.startsWith(
                "http://"
            ) ||
            link.startsWith(
                "https://"
            )
        ) {

            return `
                target="_blank"
                rel="noopener noreferrer"
            `;

        }


        return "";

    }



    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHtml(
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



    function escapeAttribute(
        value = ""
    ) {

        return escapeHtml(
            value
        );

    }

})();