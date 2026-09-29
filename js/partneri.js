/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   PARTNERI
========================================================= */

(() => {

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    document.addEventListener(
        "DOMContentLoaded",
        loadPartners
    );



    /* =====================================================
       UČITAVANJE
    ===================================================== */

    async function loadPartners() {

        try {

            const url =
                `${SUPABASE_URL}/rest/v1/partneri` +
                `?select=id,naziv,opis,logo,link,istaknut,redosled,aktivan` +
                `&aktivan=eq.true` +
                `&order=redosled.asc,naziv.asc`;


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


            const partners =
                await response.json();


            if (
                !Array.isArray(
                    partners
                )
            ) {

                throw new Error(
                    "Неисправан формат партнера."
                );

            }


            renderHomePartners(
                partners
            );


            renderPartnersPage(
                partners
            );

        }

        catch (error) {

            console.error(
                "Greška pri učitavanju partnera:",
                error
            );


            renderPartnersError();

        }

    }



    /* =====================================================
       POČETNA STRANA
    ===================================================== */

    function renderHomePartners(
        partners
    ) {

        const container =
            document.querySelector(
                "#home-partners-grid"
            );


        if (!container) {
            return;
        }


        if (!partners.length) {

            container.innerHTML = `

                <div class="home-partners-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <span>
                        Партнери клуба ће бити додати ускоро.
                    </span>

                </div>

            `;

            return;

        }


        /*
            Na početnoj prvo prikazujemo
            istaknute partnere.

            Ako nema istaknutih,
            prikazujemo prvih 5.
        */

        const featured =
            partners.filter(
                partner =>
                    partner.istaknut === true
            );


        const homePartners =
            (
                featured.length
                    ? featured
                    : partners
            )
                .slice(
                    0,
                    5
                );


        container.innerHTML =
            homePartners
                .map(
                    renderHomePartner
                )
                .join("");

    }



    function renderHomePartner(
        partner
    ) {

        const logo =
            partner.logo ||
            "images/grb.png";


        const imageClass =
            partner.logo
                ? ""
                : "home-partner-placeholder";


        const content = `

            <div class="home-partner-card">

                <div class="home-partner-logo">

                    <img
                        src="${escapeAttribute(logo)}"
                        alt="${escapeAttribute(partner.naziv || "Партнер ФК Обилић")}"
                        class="${imageClass}"
                        loading="lazy"
                    >

                </div>


                <strong>
                    ${escapeHtml(partner.naziv || "")}
                </strong>

            </div>

        `;


        if (partner.link) {

            return `

                <a
                    href="${escapeAttribute(partner.link)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="home-partner-link"
                >

                    ${content}

                </a>

            `;

        }


        return content;

    }



    /* =====================================================
       STRANICA SVI PARTNERI
    ===================================================== */

    function renderPartnersPage(
        partners
    ) {

        const container =
            document.querySelector(
                ".partners-page-grid"
            );


        if (!container) {
            return;
        }


        if (!partners.length) {

            container.innerHTML = `

                <div class="partners-page-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >


                    <div>

                        <strong>
                            Партнери клуба
                        </strong>

                        <p>
                            Партнери ФК Обилић
                            биће приказани овде.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        container.innerHTML =
            partners
                .map(
                    renderPartnerPageCard
                )
                .join("");

    }



    function renderPartnerPageCard(
        partner
    ) {

        const logo =
            partner.logo ||
            "images/grb.png";


        const placeholderClass =
            partner.logo
                ? ""
                : "home-partner-placeholder";


        const card = `

            <article class="partner-page-card">

                <div class="partner-page-logo">

                    <img
                        src="${escapeAttribute(logo)}"
                        alt="${escapeAttribute(partner.naziv || "Партнер ФК Обилић")}"
                        class="${placeholderClass}"
                        loading="lazy"
                    >

                </div>


                <div class="partner-page-info">

                    <h3>
                        ${escapeHtml(partner.naziv || "")}
                    </h3>


                    ${
                        partner.opis
                            ? `
                                <span>
                                    ${escapeHtml(partner.opis)}
                                </span>
                            `
                            : `
                                <span>
                                    ПАРТНЕР ФК ОБИЛИЋ
                                </span>
                            `
                    }

                </div>

            </article>

        `;


        if (partner.link) {

            return `

                <a
                    href="${escapeAttribute(partner.link)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="partner-page-card-link"
                >

                    ${card}

                </a>

            `;

        }


        return card;

    }



    /* =====================================================
       GREŠKA
    ===================================================== */

    function renderPartnersError() {

        const home =
            document.querySelector(
                "#home-partners-grid"
            );


        if (home) {

            home.innerHTML = `

                <div class="home-partners-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <span>
                        Партнере тренутно није могуће учитати.
                    </span>

                </div>

            `;

        }


        const page =
            document.querySelector(
                ".partners-page-grid"
            );


        if (page) {

            page.innerHTML = `

                <div class="partners-page-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >


                    <div>

                        <strong>
                            Партнери клуба
                        </strong>

                        <p>
                            Партнере тренутно није могуће учитати.
                        </p>

                    </div>

                </div>

            `;

        }

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