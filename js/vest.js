/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   POJEDINAČNA VEST - SUPABASE
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const ARTICLE_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const ARTICLE_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";



/* =========================================================
   ELEMENTI STRANICE
========================================================= */

const articleLoading =
    document.querySelector(
        ".article-loading"
    );

const articleContent =
    document.querySelector(
        ".article-content"
    );

const articleError =
    document.querySelector(
        ".article-error"
    );



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadArticle
);



/* =========================================================
   STANJE STRANICE
========================================================= */

function showArticleLoading() {

    if (articleLoading) {
        articleLoading.hidden = false;
    }

    if (articleContent) {
        articleContent.hidden = true;
    }

    if (articleError) {
        articleError.hidden = true;
    }

}



function showArticleContent() {

    if (articleLoading) {
        articleLoading.hidden = true;
    }

    if (articleError) {
        articleError.hidden = true;
    }

    if (articleContent) {
        articleContent.hidden = false;
    }

}



function showArticleError(message) {

    if (articleLoading) {
        articleLoading.hidden = true;
    }

    if (articleContent) {
        articleContent.hidden = true;
    }


    if (articleError) {

        articleError.hidden = false;


        const errorTitle =
            articleError.querySelector(
                "h2"
            );


        const errorText =
            articleError.querySelector(
                "p"
            );


        if (errorTitle) {

            errorTitle.textContent =
                message ||
                "Вест није пронађена.";

        }


        if (errorText) {

            errorText.textContent =
                "Вратите се на страницу вести и покушајте поново.";

        }


        return;
    }


    /*
        Rezerva ako vest.html nema poseban
        article-error element.
    */

    if (articleContent) {

        articleContent.hidden =
            false;


        articleContent.innerHTML = `

            <div class="article-error">

                <img
                    src="images/grb.png"
                    alt="ФК Обилић"
                >

                <h2>
                    ${escapeHtml(message || "Вест није пронађена.")}
                </h2>

                <p>
                    Вратите се на страницу вести и покушајте поново.
                </p>

                <a
                    href="vesti.html"
                    class="article-footer-link"
                >
                    ← НАЗАД НА ВЕСТИ
                </a>

            </div>

        `;

    }

}



/* =========================================================
   UČITAVANJE VESTI
========================================================= */

async function loadArticle() {

    showArticleLoading();


    const params =
        new URLSearchParams(
            window.location.search
        );


    const slug =
        params
            .get("id")
            ?.trim();


    if (!slug) {

        showArticleError(
            "Вест није пронађена."
        );

        return;
    }


    try {

        const url =
            new URL(
                `${ARTICLE_SUPABASE_URL}/rest/v1/vesti`
            );


        url.searchParams.set(
            "select",
            [
                "id",
                "slug",
                "title",
                "category",
                "date",
                "date_display",
                "image",
                "excerpt",
                "content",
                "match_data",
                "source",
                "featured",
                "published"
            ].join(",")
        );


        url.searchParams.set(
            "slug",
            `eq.${slug}`
        );


        url.searchParams.set(
            "published",
            "eq.true"
        );


        url.searchParams.set(
            "limit",
            "1"
        );


        const response =
            await fetch(
                url.toString(),
                {
                    method: "GET",

                    headers: {

                        "apikey":
                            ARTICLE_SUPABASE_KEY,

                        "Authorization":
                            `Bearer ${ARTICLE_SUPABASE_KEY}`,

                        "Accept":
                            "application/json"

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


        const data =
            await response.json();


        if (
            !Array.isArray(data) ||
            data.length === 0
        ) {

            showArticleError(
                "Вест није пронађена."
            );

            return;
        }


        renderArticle(
            data[0]
        );

    }

    catch (error) {

        console.error(
            "Грешка при учитавању вести:",
            error
        );


        showArticleError(
            "Вест тренутно није могуће учитати."
        );

    }

}



/* =========================================================
   PRIKAZ VESTI
========================================================= */

function renderArticle(article) {

    const categoryElement =
        document.querySelector(
            "#article-category"
        );


    const dateElement =
        document.querySelector(
            "#article-date"
        );


    const titleElement =
        document.querySelector(
            "#article-title"
        );


    const excerptElement =
        document.querySelector(
            "#article-excerpt"
        );


    const imageElement =
        document.querySelector(
            "#article-image"
        );


    const matchElement =
        document.querySelector(
            "#article-match"
        );


    const bodyElement =
        document.querySelector(
            "#article-body"
        );



    /* =====================================================
       KATEGORIJA
    ====================================================== */

    if (categoryElement) {

        categoryElement.textContent =
            article.category ||
            "ВЕСТ";

    }



    /* =====================================================
       DATUM
    ====================================================== */

    if (dateElement) {

        dateElement.textContent =
            article.date_display ||
            formatArticleDate(
                article.date
            );

    }



    /* =====================================================
       NASLOV
    ====================================================== */

    if (titleElement) {

        titleElement.textContent =
            article.title ||
            "";

    }



    /* =====================================================
       KRATAK OPIS
    ====================================================== */

    if (excerptElement) {

        if (
            article.excerpt &&
            String(
                article.excerpt
            ).trim()
        ) {

            excerptElement.textContent =
                article.excerpt;


            excerptElement.hidden =
                false;

        }

        else {

            excerptElement.textContent =
                "";


            excerptElement.hidden =
                true;

        }

    }



    /* =====================================================
       FOTOGRAFIJA
    ====================================================== */

    if (imageElement) {

        const image =
            getArticleImage(
                article.image
            );


        imageElement.src =
            image;


        imageElement.alt =
            article.title ||
            "ФК Обилић";


        imageElement.onerror =
            function () {

                this.onerror =
                    null;


                this.src =
                    "images/grb.png";

            };

    }



    /* =====================================================
       REZULTAT UTAKMICE
    ====================================================== */

    if (matchElement) {

        matchElement.innerHTML =
            renderMatch(
                article.match_data
            );

    }



    /* =====================================================
       TEKST VESTI + IZVOR
    ====================================================== */

    if (bodyElement) {

        bodyElement.innerHTML =
            renderArticleBody(
                article.content,
                article.source
            );

    }



    /* =====================================================
       TITLE
    ====================================================== */

    if (article.title) {

        document.title =
            `${article.title} | ФК Обилић`;

    }



    /* =====================================================
       META DESCRIPTION
    ====================================================== */

    const description =
        document.querySelector(
            'meta[name="description"]'
        );


    if (
        description &&
        article.excerpt
    ) {

        description.setAttribute(
            "content",
            article.excerpt
        );

    }



    /*
        Tek kada je sve popunjeno,
        uklanjamo loader i prikazujemo vest.
    */

    showArticleContent();

}



/* =========================================================
   REZULTAT UTAKMICE
========================================================= */

function renderMatch(match) {

    if (
        !match ||
        typeof match !== "object"
    ) {

        return "";

    }


    const home =
        String(
            match.home ||
            ""
        ).trim();


    const away =
        String(
            match.away ||
            ""
        ).trim();


    if (
        !home ||
        !away
    ) {

        return "";

    }


    const homeScore =
        match.homeScore ??
        "";


    const awayScore =
        match.awayScore ??
        "";


    const homeLogo =
        sanitizeImageUrl(
            match.homeLogo
        );


    const awayLogo =
        sanitizeImageUrl(
            match.awayLogo
        );


    return `

        <div class="article-match">

            <span class="article-match-label">
                РЕЗУЛТАТ УТАКМИЦЕ
            </span>


            <div class="article-match-teams">


                <!-- DOMAĆIN -->

                <div class="article-match-team">

                    ${
                        homeLogo
                            ? `
                                <img
                                    src="${escapeAttribute(homeLogo)}"
                                    alt="${escapeAttribute(home)}"
                                    onerror="this.style.display='none';"
                                >
                            `
                            : ""
                    }


                    <strong>
                        ${escapeHtml(home)}
                    </strong>


                    <span>
                        ДОМАЋИН
                    </span>

                </div>



                <!-- REZULTAT -->

                <div class="article-match-score">

                    <strong>
                        ${escapeHtml(homeScore)}
                    </strong>

                    <span>
                        :
                    </span>

                    <strong>
                        ${escapeHtml(awayScore)}
                    </strong>

                </div>



                <!-- GOST -->

                <div class="article-match-team">

                    ${
                        awayLogo
                            ? `
                                <img
                                    src="${escapeAttribute(awayLogo)}"
                                    alt="${escapeAttribute(away)}"
                                    onerror="this.style.display='none';"
                                >
                            `
                            : ""
                    }


                    <strong>
                        ${escapeHtml(away)}
                    </strong>


                    <span>
                        ГОСТ
                    </span>

                </div>


            </div>

        </div>

    `;

}



/* =========================================================
   TEKST VESTI
========================================================= */

function renderArticleBody(
    content,
    source
) {

    let paragraphs =
        [];


    /*
        Supabase content je JSON niz pasusa.
    */

    if (
        Array.isArray(content)
    ) {

        paragraphs =
            content
                .map(
                    paragraph =>
                        String(
                            paragraph ||
                            ""
                        ).trim()
                )
                .filter(Boolean);

    }


    /*
        Rezerva ako nekada bude sačuvan kao tekst.
    */

    else if (
        typeof content === "string"
    ) {

        paragraphs =
            content
                .split(
                    /\n\s*\n/
                )
                .map(
                    paragraph =>
                        paragraph.trim()
                )
                .filter(Boolean);

    }



    let html =
        paragraphs
            .map(
                paragraph => `

                    <p>
                        ${escapeHtml(paragraph)}
                    </p>

                `
            )
            .join("");



    /* =====================================================
       IZVOR
    ====================================================== */

    if (
        source &&
        typeof source === "object" &&
        source.name
    ) {

        const sourceName =
            escapeHtml(
                source.name
            );


        const sourceUrl =
            sanitizeUrl(
                source.url
            );


        if (sourceUrl) {

            html += `

                <p class="article-source">

                    Извор:

                    <a
                        href="${escapeAttribute(sourceUrl)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        ${sourceName} →
                    </a>

                </p>

            `;

        }

        else {

            html += `

                <p class="article-source">

                    Извор:

                    <strong>
                        ${sourceName}
                    </strong>

                </p>

            `;

        }

    }


    /*
        Ako nema teksta.
    */

    if (
        !html.trim()
    ) {

        html = `

            <p>
                Текст вести тренутно није доступан.
            </p>

        `;

    }


    return html;

}



/* =========================================================
   DATUM
========================================================= */

function formatArticleDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(
            `${dateString}T12:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return new Intl.DateTimeFormat(
        "sr-Cyrl-RS",
        {

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric",

            timeZone:
                "Europe/Belgrade"

        }
    ).format(date);

}



/* =========================================================
   FOTOGRAFIJA
========================================================= */

function getArticleImage(value) {

    const image =
        sanitizeImageUrl(
            value
        );


    return image ||
        "images/grb.png";

}



function sanitizeImageUrl(value) {

    const url =
        String(
            value ||
            ""
        ).trim();


    if (!url) {
        return "";
    }


    /*
        Lokalne slike.
    */

    if (
        url.startsWith(
            "images/"
        ) ||
        url.startsWith(
            "./images/"
        )
    ) {

        return url;

    }


    /*
        Supabase Storage i drugi HTTPS izvori.
    */

    if (
        /^https?:\/\//i.test(
            url
        )
    ) {

        return url;

    }


    return "";

}



/* =========================================================
   LINK IZVORA
========================================================= */

function sanitizeUrl(value) {

    const url =
        String(
            value ||
            ""
        ).trim();


    if (!url) {
        return "";
    }


    try {

        const parsed =
            new URL(
                url
            );


        if (
            parsed.protocol === "http:" ||
            parsed.protocol === "https:"
        ) {

            return parsed.href;

        }

    }

    catch {

        return "";

    }


    return "";

}



/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeHtml(value = "") {

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



function escapeAttribute(value = "") {

    return escapeHtml(
        value
    );

}