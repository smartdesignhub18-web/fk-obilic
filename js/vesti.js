/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   VESTI
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadNews
);


/* =========================================================
   UČITAVANJE VESTI
========================================================= */

async function loadNews() {

    try {

        const response =
            await fetch(
                "data/vesti.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "Неисправан формат вести."
            );

        }


        /*
            Prikazujemo samo objavljene vesti.
        */

        const news =
            data
                .filter(
                    article =>
                        article.published !== false
                )
                .sort(
                    (a, b) =>
                        getNewsTimestamp(b.date) -
                        getNewsTimestamp(a.date)
                );


        /*
            POČETNA STRANA
        */

        renderHomeNews(news);


        /*
            STRANICA VESTI
        */

        renderNewsPage(news);

    }

    catch (error) {

        console.error(
            "Грешка при учитавању вести:",
            error
        );

    }

}


/* =========================================================
   POČETNA - 3 NAJNOVIJE VESTI
========================================================= */

function renderHomeNews(news) {

    const container =
        document.querySelector(
            "#home-news-list"
        );


    if (!container) {
        return;
    }


    if (!news.length) {

        container.innerHTML = `
            <div class="football-error">
                Тренутно нема објављених вести.
            </div>
        `;

        return;
    }


    const latestNews =
        news.slice(0, 3);


    container.innerHTML =
        latestNews
            .map(article => {

                const image =
                    article.image ||
                    "images/grb.png";


                const date =
                    article.dateDisplay ||
                    formatNewsDate(article.date);


                const category =
                    article.category ||
                    "ВЕСТ";


                return `
                    <a
                        href="vest.html?id=${encodeURIComponent(article.slug)}"
                        class="news-item home-news-item"
                    >

                        <div class="news-placeholder news-thumb">

                            <img
                                src="${escapeAttribute(image)}"
                                alt="${escapeAttribute(article.title || "ФК Обилић")}"
                                onerror="this.src='images/grb.png'"
                            >

                        </div>


                        <div class="home-news-content">

                            <div class="home-news-meta">

                                <span class="home-news-category">
                                    ${escapeHtml(category)}
                                </span>

                                <span class="home-news-date">
                                    ${escapeHtml(date)}
                                </span>

                            </div>


                            <h3>
                                ${escapeHtml(article.title || "")}
                            </h3>


                            ${
                                article.excerpt
                                    ? `
                                        <p>
                                            ${escapeHtml(article.excerpt)}
                                        </p>
                                    `
                                    : ""
                            }


                            <span class="home-news-read">
                                ПРОЧИТАЈ ВЕСТ →
                            </span>

                        </div>

                    </a>
                `;

            })
            .join("");

}


/* =========================================================
   STRANICA VESTI
========================================================= */

function renderNewsPage(news) {

    /*
        Ovaj selektor postoji samo na vesti.html.
    */

    const container =
        document.querySelector(
            ".news-page-grid"
        );


    const loading =
        document.querySelector(
            "#news-page-loading"
        );


    if (!container) {
        return;
    }


    if (loading) {
        loading.remove();
    }


    if (!news.length) {

        container.innerHTML = `

            <div class="football-error">
                Тренутно нема објављених вести.
            </div>

        `;

        return;
    }


    /*
        Ako postoji vest sa featured: true,
        ona ide prva.

        Ako ne postoji,
        koristimo najnoviju.
    */

    const featured =
        news.find(
            article =>
                article.featured === true
        ) || news[0];


    const otherNews =
        news.filter(
            article =>
                article.slug !== featured.slug
        );


    container.innerHTML = `

        ${renderFeaturedNews(featured)}

        ${otherNews
            .map(renderNewsCard)
            .join("")}

    `;

}


/* =========================================================
   GLAVNA VEST
========================================================= */

function renderFeaturedNews(article) {

    const image =
        article.image ||
        "images/grb.png";


    const date =
        article.dateDisplay ||
        formatNewsDate(article.date);


    return `

        <article class="news-feature-card">

            <a
                href="vest.html?id=${encodeURIComponent(article.slug)}"
                class="news-feature-image"
            >

                <div class="news-image-placeholder">

                    <img
                        src="${escapeAttribute(image)}"
                        alt="${escapeAttribute(article.title || "ФК Обилић")}"
                        onerror="this.src='images/grb.png'"
                    >

                </div>

            </a>


            <div class="news-feature-content">

                <span class="news-category">
                    ${escapeHtml(article.category || "ВЕСТ")}
                </span>


                <span class="news-date">
                    ${escapeHtml(date)}
                </span>


                <h2>

                    <a
                        href="vest.html?id=${encodeURIComponent(article.slug)}"
                    >
                        ${escapeHtml(article.title || "")}
                    </a>

                </h2>


                ${
                    article.excerpt
                        ? `
                            <p>
                                ${escapeHtml(article.excerpt)}
                            </p>
                        `
                        : ""
                }


                <a
                    href="vest.html?id=${encodeURIComponent(article.slug)}"
                    class="news-read-more"
                >
                    ПРОЧИТАЈ ВЕСТ →
                </a>

            </div>

        </article>

    `;

}


/* =========================================================
   OSTALE VESTI
========================================================= */

function renderNewsCard(article) {

    const image =
        article.image ||
        "images/grb.png";


    const date =
        article.dateDisplay ||
        formatNewsDate(article.date);


    return `

        <article class="news-list-card">

            <a
                href="vest.html?id=${encodeURIComponent(article.slug)}"
                class="news-list-image"
            >

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(article.title || "ФК Обилић")}"
                    onerror="this.src='images/grb.png'"
                >

            </a>


            <div class="news-list-content">

                <span class="news-category">
                    ${escapeHtml(article.category || "ВЕСТ")}
                </span>


                <span class="news-card-date">
                    ${escapeHtml(date)}
                </span>


                <h3>

                    <a
                        href="vest.html?id=${encodeURIComponent(article.slug)}"
                    >
                        ${escapeHtml(article.title || "")}
                    </a>

                </h3>


                ${
                    article.excerpt
                        ? `
                            <p>
                                ${escapeHtml(article.excerpt)}
                            </p>
                        `
                        : ""
                }


                <a
                    href="vest.html?id=${encodeURIComponent(article.slug)}"
                    class="news-read-more"
                >
                    ПРОЧИТАЈ →
                </a>

            </div>

        </article>

    `;

}


/* =========================================================
   DATUM
========================================================= */

function getNewsTimestamp(dateString) {

    if (!dateString) {
        return 0;
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

        return 0;

    }


    return date.getTime();

}


function formatNewsDate(dateString) {

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
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "Europe/Belgrade"
        }
    ).format(date);

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

    return escapeHtml(value);

}