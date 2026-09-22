/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   POJEDINAČNA VEST
========================================================= */


document.addEventListener(
    "DOMContentLoaded",
    loadArticle
);



/* =========================================================
   GLAVNA FUNKCIJA
========================================================= */

async function loadArticle() {

    const loading =
        document.querySelector(
            "#article-loading"
        );

    const content =
        document.querySelector(
            "#article-content"
        );

    const errorBox =
        document.querySelector(
            "#article-error"
        );


    try {

        /*
            Uzimamo slug iz URL-a:

            vest.html?id=tromedja-obilic
        */

        const params =
            new URLSearchParams(
                window.location.search
            );

        const slug =
            params.get("id");


        if (!slug) {

            throw new Error(
                "Недостаје ID вести."
            );

        }



        /*
            Učitavanje svih vesti
        */

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


        const news =
            await response.json();


        if (!Array.isArray(news)) {

            throw new Error(
                "Неисправан формат вести."
            );

        }



        /*
            Pronalazimo vest
        */

        const article =
            news.find(
                item =>
                    item.slug === slug &&
                    item.published !== false
            );


        if (!article) {

            throw new Error(
                "Вест није пронађена."
            );

        }



        /*
            Prikaz vesti
        */

        renderArticle(article);


        if (loading) {
            loading.hidden = true;
        }


        if (content) {
            content.hidden = false;
        }

    }

    catch (error) {

        console.error(
            "Грешка при учитавању вести:",
            error
        );


        if (loading) {
            loading.hidden = true;
        }


        if (content) {
            content.hidden = true;
        }


        if (errorBox) {
            errorBox.hidden = false;
        }

    }

}



/* =========================================================
   PRIKAZ VESTI
========================================================= */

function renderArticle(article) {

    /*
        Naslov stranice u browseru
    */

    document.title =
        `${article.title} | ФК Обилић Нови Кнежевац`;



    /* KATEGORIJA */

    setText(
        "#article-category",
        article.category || "ВЕСТ"
    );



    /* DATUM */

    setText(
        "#article-date",
        article.dateDisplay ||
        formatArticleDate(article.date)
    );



    /* NASLOV */

    setText(
        "#article-title",
        article.title || ""
    );



    /* KRATAK UVOD */

    setText(
        "#article-excerpt",
        article.excerpt || ""
    );



    /* SLIKA */

    const image =
        document.querySelector(
            "#article-image"
        );


    if (image) {

        image.src =
            article.image ||
            "images/grb.png";

        image.alt =
            article.title ||
            "ФК Обилић";

        image.onerror = function () {

            this.onerror = null;

            this.src =
                "images/grb.png";

        };

    }



    /*
        Rezultat utakmice,
        ako postoji u toj vesti.
    */

    renderArticleMatch(
        article.match
    );



    /*
        Glavni tekst vesti
    */

    renderArticleBody(
        article.content
    );

}



/* =========================================================
   REZULTAT UTAKMICE
========================================================= */

function renderArticleMatch(match) {

    const container =
        document.querySelector(
            "#article-match"
        );


    if (!container) {
        return;
    }


    if (!match) {

        container.hidden = true;

        return;

    }


    container.hidden = false;


    setText(
        "#article-home-team",
        match.home || "-"
    );

    setText(
        "#article-away-team",
        match.away || "-"
    );


    setText(
        "#article-home-score",
        match.homeScore ?? "-"
    );

    setText(
        "#article-away-score",
        match.awayScore ?? "-"
    );



    /* DOMAĆIN GRB */

    const homeLogo =
        document.querySelector(
            "#article-home-logo"
        );


    if (homeLogo) {

        homeLogo.src =
            match.homeLogo ||
            "images/grbovi/default.webp";

        homeLogo.alt =
            match.home || "";

        homeLogo.onerror = function () {

            this.onerror = null;

            this.src =
                "images/grb.png";

        };

    }



    /* GOST GRB */

    const awayLogo =
        document.querySelector(
            "#article-away-logo"
        );


    if (awayLogo) {

        awayLogo.src =
            match.awayLogo ||
            "images/grbovi/default.webp";

        awayLogo.alt =
            match.away || "";

        awayLogo.onerror = function () {

            this.onerror = null;

            this.src =
                "images/grb.png";

        };

    }

}



/* =========================================================
   TEKST VESTI
========================================================= */

function renderArticleBody(content) {

    const container =
        document.querySelector(
            "#article-body"
        );


    if (!container) {
        return;
    }


    if (
        !Array.isArray(content) ||
        content.length === 0
    ) {

        container.innerHTML = `

            <p>
                Текст вести тренутно није доступан.
            </p>

        `;

        return;

    }


    container.innerHTML =
        content
            .map(paragraph => {

                return `

                    <p>
                        ${escapeHtml(paragraph)}
                    </p>

                `;

            })
            .join("");

}



/* =========================================================
   FORMATIRANJE DATUMA
========================================================= */

function formatArticleDate(dateString) {

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
   POMOĆNE FUNKCIJE
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        document.querySelector(
            selector
        );


    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}



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