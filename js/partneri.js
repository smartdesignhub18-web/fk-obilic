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
        () => {

            injectPartnerPublicStyles();

            loadPartners();

        }
    );


    /* =====================================================
       UČITAVANJE
    ===================================================== */

    async function loadPartners() {

        try {

            const url =
                `${SUPABASE_URL}/rest/v1/partneri` +
                `?select=id,naziv,opis,logo,link,generalni,istaknut,redosled,aktivan` +
                `&aktivan=eq.true` +
                `&order=generalni.desc,istaknut.desc,redosled.asc,naziv.asc`;


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
       POČETNA
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


        const general =
            partners.find(
                partner =>
                    partner.generalni === true
            );


        const featured =
            partners.filter(
                partner =>
                    partner.istaknut === true &&
                    partner.id !==
                        general?.id
            );


        const regular =
            partners.filter(
                partner =>
                    partner.id !==
                        general?.id &&
                    partner.istaknut !== true
            );


        const orderedPartners = [];


        if (general) {

            orderedPartners.push(
                general
            );

        }


        orderedPartners.push(
            ...featured
        );


        orderedPartners.push(
            ...regular
        );


        const visiblePartners =
            orderedPartners.slice(
                0,
                5
            );


        container.innerHTML =
            visiblePartners
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


        const generalBadge =
            partner.generalni
                ? `
                    <span class="general-partner-badge">
                        ГЕНЕРАЛНИ ПАРТНЕР
                    </span>
                `
                : "";


        const content = `

            <div
                class="
                    home-partner-card
                    ${
                        partner.generalni
                            ? "home-general-partner"
                            : ""
                    }
                "
            >

                ${generalBadge}


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
                    class="
                        home-partartner-link
                        home-partner-link
                        ${
                            partner.generalni
                                ? "home-general-partner-link"
                                : ""
                        }
                    "
                >

                    ${content}

                </a>

            `;

        }


        return `

            <div
                class="
                    home-partner-static
                    ${
                        partner.generalni
                            ? "home-general-partner-link"
                            : ""
                    }
                "
            >

                ${content}

            </div>

        `;

    }


    /* =====================================================
       STRANICA PARTNERI
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


       const partnerLabel =
    partner.generalni
        ? "ГЕНЕРАЛНИ ПАРТНЕР"
        : partner.istaknut
            ? "ПАРТНЕР ФК ОБИЛИЋ"
            : "ПАРТНЕР ФК ОБИЛИЋ";


        const generalBadge =
            partner.generalni
                ? `
                    <span class="general-partner-page-badge">
                        ГЕНЕРАЛНИ ПАРТНЕР
                    </span>
                `
                : "";


        const description =
            partner.opis
                ? `
                    <p class="partner-page-description">
                        ${escapeHtml(partner.opis)}
                    </p>
                `
                : "";


        const card = `

            <article
                class="
                    partner-page-card
                    ${
                        partner.generalni
                            ? "partner-page-general"
                            : ""
                    }
                "
            >

                ${generalBadge}


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


                    <span>
                        ${escapeHtml(partnerLabel)}
                    </span>


                    ${description}

                </div>

            </article>

        `;


        if (partner.link) {

            return `

                <a
                    href="${escapeAttribute(partner.link)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="
                        partner-page-card-link
                        ${
                            partner.generalni
                                ? "partner-page-general-link"
                                : ""
                        }
                    "
                >

                    ${card}

                </a>

            `;

        }


        return `

            <div
                class="
                    partner-page-static
                    ${
                        partner.generalni
                            ? "partner-page-general-link"
                            : ""
                    }
                "
            >

                ${card}

            </div>

        `;

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
       STILOVI PARTNERA
    ===================================================== */

    function injectPartnerPublicStyles() {

        if (
            document.querySelector(
                "#general-partner-public-styles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "general-partner-public-styles";


        style.textContent = `

            /* ==============================================
               PARTNERI - POČETNA
            ============================================== */

            #home-partners-grid {
                display: grid;

                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(220px, 280px)
                    );

                justify-content: center;

                gap: 24px;

                margin-top: 45px;
            }


            #home-partners-grid
            .home-partner-link,

            #home-partners-grid
            .home-partner-static {
                width: 100%;

                color: inherit;

                text-decoration: none;
            }


            /* ==============================================
               GENERALNI PARTNER - POČETNA
            ============================================== */

            .home-general-partner-link {
                grid-column: 1 / -1;

                width: 100% !important;
                max-width: 760px;

                margin:
                    0 auto
                    18px;

                justify-self: center;
            }


            .home-partner-card.home-general-partner {
                position: relative;

                display: flex;
                align-items: center;
                justify-content: center;

                gap: 38px;

                width: 100%;

                min-height: 190px;

                padding:
                    35px 45px;

                background:
                    linear-gradient(
                        135deg,
                        #ffffff 0%,
                        #fafafa 100%
                    );

                border:
                    2px solid
                    var(--red, #b1093d);

                border-radius: 12px;

                box-shadow:
                    0 15px 40px
                    rgba(177, 9, 61, 0.10);

                overflow: visible;

                transition:
                    transform .25s ease,
                    box-shadow .25s ease;
            }


            .home-partner-card.home-general-partner:hover {
                transform:
                    translateY(-4px);

                box-shadow:
                    0 20px 45px
                    rgba(177, 9, 61, 0.16);
            }


            .home-general-partner
            .home-partner-logo {
                width: 190px;
                height: 125px;

                flex-shrink: 0;

                margin: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                background: transparent;
            }


            .home-general-partner
            .home-partner-logo img {
                width: auto;
                height: auto;

                max-width: 185px;
                max-height: 120px;

                object-fit: contain;
            }


            .home-general-partner strong {
                display: block;

                width: auto;

                margin: 0;

                text-align: left;

                font-family:
                    "Oswald",
                    sans-serif;

                font-size: 25px;
                font-weight: 700;

                line-height: 1.2;

                color: #181818;
            }


            .general-partner-badge {
                position: absolute;

                top: -16px;
                left: 50%;

                transform:
                    translateX(-50%);

                z-index: 3;

                padding:
                    9px 20px;

                white-space: nowrap;

                border-radius: 5px;

                background:
                    var(--red, #b1093d);

                color: #ffffff;

                font-family:
                    "Oswald",
                    sans-serif;

                font-size: 10px;
                font-weight: 700;

                letter-spacing: 1.6px;
            }


            /* ==============================================
               OSTALI PARTNERI - POČETNA
            ============================================== */

            #home-partners-grid
            .home-partner-card:not(
                .home-general-partner
            ) {
                width: 100%;

                min-height: 190px;

                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                padding: 20px;

                border-radius: 10px;
            }


            #home-partners-grid
            .home-partner-card:not(
                .home-general-partner
            )
            .home-partner-logo {
                height: 105px;
            }


            #home-partners-grid
            .home-partner-card:not(
                .home-general-partner
            )
            .home-partner-logo img {
                max-width: 160px;
                max-height: 100px;
            }


            /* ==============================================
               GENERALNI PARTNER - STRANICA PARTNERI
            ============================================== */

            .partner-page-general-link {
                grid-column: 1 / -1;

                width: 100%;
                max-width: 900px;

                margin:
                    25px auto
                    45px;

                justify-self: center;

                color: inherit;

                text-decoration: none;
            }


            .partner-page-card.partner-page-general {
                position: relative;

                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;

                width: 100%;

                min-height: 360px;

                padding:
                    55px 40px
                    40px;

                background: #ffffff;

                border:
                    2px solid
                    var(--red, #b1093d);

                border-radius: 12px;

                box-shadow:
                    0 18px 45px
                    rgba(177, 9, 61, 0.12);

                text-align: center;

                overflow: visible;
            }


            .partner-page-general
            .partner-page-logo {
                width: 100%;
                height: 170px;

                display: flex;
                align-items: center;
                justify-content: center;

                margin-bottom: 28px;

                background: transparent;
            }


            .partner-page-general
            .partner-page-logo img {
                width: auto;
                height: auto;

                max-width: 300px;
                max-height: 165px;

                object-fit: contain;
            }


            .partner-page-general
            .partner-page-info {
                display: flex;
                flex-direction: column;
                align-items: center;

                width: 100%;
            }


            .partner-page-general
            .partner-page-info h3 {
                margin:
                    0 0
                    8px;

                font-family:
                    "Oswald",
                    sans-serif;

                font-size: 30px;
                font-weight: 700;

                color: #181818;
            }


            .partner-page-general
            .partner-page-info > span {
                font-size: 10px;
                font-weight: 700;

                letter-spacing: 2px;

                color:
                    var(--red, #b1093d);
            }


            .general-partner-page-badge {
                position: absolute;

                top: -17px;
                left: 50%;

                transform:
                    translateX(-50%);

                z-index: 3;

                padding:
                    10px 22px;

                white-space: nowrap;

                border-radius: 5px;

                background:
                    var(--red, #b1093d);

                color: #ffffff;

                font-family:
                    "Oswald",
                    sans-serif;

                font-size: 11px;
                font-weight: 700;

                letter-spacing: 1.6px;
            }


            .partner-page-description {
                max-width: 620px;

                margin:
                    18px auto
                    0;

                font-size: 14px;
                line-height: 1.7;

                color: #666666;
            }


            /* ==============================================
               MOBILNI
            ============================================== */

            @media (max-width: 700px) {

                #home-partners-grid {
                    grid-template-columns:
                        repeat(
                            2,
                            minmax(0, 1fr)
                        );

                    gap: 14px;

                    margin-top: 35px;
                }


                .home-general-partner-link {
                    grid-column: 1 / -1;

                    max-width: 100%;

                    margin-bottom: 15px;
                }


                .home-partner-card.home-general-partner {
                    flex-direction: column;

                    gap: 15px;

                    min-height: 240px;

                    padding:
                        38px 20px
                        25px;

                    text-align: center;
                }


                .home-general-partner
                .home-partner-logo {
                    width: 100%;
                    height: 120px;
                }


                .home-general-partner
                .home-partner-logo img {
                    max-width: 190px;
                    max-height: 115px;
                }


                .home-general-partner strong {
                    text-align: center;

                    font-size: 22px;
                }


                .general-partner-badge {
                    top: -14px;

                    padding:
                        8px 14px;

                    font-size: 9px;
                }


                #home-partners-grid
                .home-partner-card:not(
                    .home-general-partner
                ) {
                    min-height: 150px;

                    padding: 14px;
                }


                #home-partners-grid
                .home-partner-card:not(
                    .home-general-partner
                )
                .home-partner-logo {
                    height: 80px;
                }


                .partner-page-general-link {
                    max-width: 100%;

                    margin:
                        20px auto
                        35px;
                }


                .partner-page-card.partner-page-general {
                    min-height: 300px;

                    padding:
                        45px 20px
                        30px;
                }


                .partner-page-general
                .partner-page-logo {
                    height: 130px;

                    margin-bottom: 20px;
                }


                .partner-page-general
                .partner-page-logo img {
                    max-width: 220px;
                    max-height: 125px;
                }


                .partner-page-general
                .partner-page-info h3 {
                    font-size: 25px;
                }


                .general-partner-page-badge {
                    top: -15px;

                    padding:
                        8px 15px;

                    font-size: 9px;
                }

            }

        `;


        document.head.appendChild(
            style
        );

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