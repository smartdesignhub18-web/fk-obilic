/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   DINAMIČKI KONTAKT U FOOTERU
========================================================= */

(() => {

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";


    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    document.addEventListener(
        "DOMContentLoaded",
        loadFooterContacts
    );



    /* =====================================================
       UČITAVANJE KONTAKATA
    ===================================================== */

    async function loadFooterContacts() {

        const footerContent =
            document.querySelector(
                ".footer .footer-content"
            );


        if (!footerContent) {
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


            if (!Array.isArray(contacts)) {

                throw new Error(
                    "Неисправни контакт подаци."
                );

            }


            const validContacts =
                contacts.filter(
                    item => {

                        return Boolean(
                            getSafeFooterLink(
                                item.link
                            )
                        );

                    }
                );


            /*
                Ako Supabase još nema nijedan
                validan kontakt, ne diramo
                postojeći footer sadržaj.
            */

            if (!validContacts.length) {
                return;
            }


            renderFooterContacts(
                validContacts,
                footerContent
            );

        }

        catch (error) {

            console.error(
                "Footer kontakt error:",
                error
            );

            /*
                Ako Supabase ne radi,
                ostaje postojeći footer sadržaj.
            */

        }

    }



    /* =====================================================
       PRIKAZ KONTAKATA
    ===================================================== */

    function renderFooterContacts(
        contacts,
        footerContent
    ) {

        let wrapper =
            footerContent.querySelector(
                ".footer-socials"
            );


        /*
            Ako footer.js već ima svoj blok,
            koristićemo njega.

            Ako ga nema, napravićemo novi.
        */

        if (!wrapper) {

            wrapper =
                document.createElement(
                    "div"
                );


            wrapper.className =
                "footer-socials";


            footerContent.appendChild(
                wrapper
            );

        }


        wrapper.innerHTML = `

            <span class="footer-socials-title">
                КОНТАКТ И ДРУШТВЕНЕ МРЕЖЕ
            </span>


            <div class="footer-social-links">

                ${contacts
                    .map(
                        renderFooterContact
                    )
                    .join("")}

            </div>

        `;

    }



    /* =====================================================
       JEDAN KONTAKT
    ===================================================== */

    function renderFooterContact(
        item
    ) {

        const link =
            getSafeFooterLink(
                item.link
            );


        if (!link) {
            return "";
        }


        return `

            <a
                href="${escapeAttribute(link)}"
                class="footer-social-link"
                ${getExternalAttributes(link)}
            >

                ${getFooterIcon(item.tip)}

                <span>
                    ${escapeHtml(
                        getFooterLabel(item)
                    )}
                </span>

            </a>

        `;

    }



    /* =====================================================
       NAZIV KONTAKTA
    ===================================================== */

    function getFooterLabel(
        item
    ) {

        switch (item.tip) {

            case "telefon":

                return (
                    item.vrednost ||
                    "ТЕЛЕФОН"
                );


            case "email":

                return (
                    item.vrednost ||
                    "E-MAIL"
                );


            case "instagram":

                return "INSTAGRAM";


            case "facebook":

                return "FACEBOOK";


            case "youtube":

                return "YOUTUBE";


            case "website":

                return "ВЕБ САЈТ";


            case "adresa":

            case "address":

                return (
                    item.naziv ||
                    "АДРЕСА"
                );


            default:

                return (
                    item.naziv ||
                    "КОНТАКТ"
                );

        }

    }



    /* =====================================================
       IKONICE
    ===================================================== */

    function getFooterIcon(
        type
    ) {

        /* TELEFON */

        if (type === "telefon") {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M6.6 10.8c1.6 3.1 3.5 5 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.8 21 3 13.2 3 3.7c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1z"
                    />
                </svg>
            `;

        }


        /* EMAIL */

        if (type === "email") {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M3 5h18v14H3V5zm9 7 7-5H5l7 5zm0 2.4L5 9.5V17h14V9.5l-7 4.9z"
                    />
                </svg>
            `;

        }


        /* INSTAGRAM */

        if (type === "instagram") {

            return `
                <svg
                    class="footer-instagram-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >

                    <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="5"
                    ></rect>

                    <circle
                        cx="12"
                        cy="12"
                        r="4"
                    ></circle>

                    <circle
                        class="footer-icon-dot"
                        cx="17.5"
                        cy="6.5"
                        r="1"
                    ></circle>

                </svg>
            `;

        }


        /* FACEBOOK */

        if (type === "facebook") {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M15 8h3V4h-3c-3.6 0-6 2.2-6 6v2H6v4h3v8h4v-8h4l1-4h-5v-2c0-1.4.6-2 2-2z"
                    />
                </svg>
            `;

        }


        /* YOUTUBE */

        if (type === "youtube") {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M21.6 7.2c-.2-1-.9-1.7-1.9-2C18 4.8 12 4.8 12 4.8s-6 0-7.7.4c-1 .3-1.7 1-1.9 2C2 8.9 2 12 2 12s0 3.1.4 4.8c.2 1 .9 1.7 1.9 2 1.7.4 7.7.4 7.7.4s6 0 7.7-.4c1-.3 1.7-1 1.9-2 .4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z"
                    />
                </svg>
            `;

        }


        /* ADRESA */

        if (
            type === "adresa" ||
            type === "address"
        ) {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="
                            M12 2
                            C7.6 2 4 5.6 4 10
                            C4 15.7 12 22 12 22
                            C12 22 20 15.7 20 10
                            C20 5.6 16.4 2 12 2
                            Z

                            M12 6
                            C14.2 6 16 7.8 16 10
                            C16 12.2 14.2 14 12 14
                            C9.8 14 8 12.2 8 10
                            C8 7.8 9.8 6 12 6
                            Z
                        "
                        fill-rule="evenodd"
                    />
                </svg>
            `;

        }


        /* WEB SAJT */

        if (type === "website") {

            return `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="
                            M12 2
                            a10 10 0 1 0 0 20
                            a10 10 0 0 0 0-20

                            M4.1 11
                            h3.1
                            c.1-2 .5-3.8 1.1-5.2
                            A8 8 0 0 0 4.1 11

                            M4.1 13
                            a8 8 0 0 0 4.2 5.2
                            c-.6-1.4-1-3.2-1.1-5.2

                            M9.2 11
                            h5.6
                            c-.2-2.2-.8-4.1-1.6-5.4
                            C12.8 5 12.4 4.5 12 4.2
                            c-.4.3-.8.8-1.2 1.4
                            c-.8 1.3-1.4 3.2-1.6 5.4

                            M9.2 13
                            c.2 2.2.8 4.1 1.6 5.4
                            c.4.6.8 1.1 1.2 1.4
                            c.4-.3.8-.8 1.2-1.4
                            c.8-1.3 1.4-3.2 1.6-5.4

                            M16.8 11
                            h3.1
                            a8 8 0 0 0-4.2-5.2
                            c.6 1.4 1 3.2 1.1 5.2

                            M16.8 13
                            c-.1 2-.5 3.8-1.1 5.2
                            a8 8 0 0 0 4.2-5.2
                        "
                    />
                </svg>
            `;

        }


        /* OSTALO / GENERIČKI LINK */

        return `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
            >
                <path
                    d="M10.6 13.4a2 2 0 0 0 2.8 0l3-3a2 2 0 0 0-2.8-2.8l-1.4 1.4-1.4-1.4 1.4-1.4a4 4 0 1 1 5.6 5.6l-3 3a4 4 0 0 1-5.6 0l1.4-1.4z"
                />
            </svg>
        `;

    }



    /* =====================================================
       PROVERA LINKA
    ===================================================== */

    function getSafeFooterLink(
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
                new URL(link);


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



    /* =====================================================
       EXTERNAL LINK ATRIBUTI
    ===================================================== */

    function getExternalAttributes(
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
       BEZBEDAN ISPIS
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