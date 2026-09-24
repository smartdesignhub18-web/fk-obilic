/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   GALERIJA
========================================================= */

let galleryItems = [];
let currentGalleryFilter = "sve";


async function loadGallery() {
    const container =
        document.querySelector("#gallery-grid");

    if (!container) return;


    try {
        const response = await fetch(
            "data/galerija.json",
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


        galleryItems =
            Array.isArray(data?.fotografije)
                ? data.fotografije
                : [];


        renderGallery();


    } catch (error) {

        console.error(
            "Грешка при учитавању галерије:",
            error
        );


        container.innerHTML = `
            <div class="gallery-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        ГАЛЕРИЈА ТРЕНУТНО НИЈЕ ДОСТУПНА
                    </strong>

                    <p>
                        Није могуће учитати фотографије.
                    </p>

                </div>

            </div>
        `;
    }
}



/* =========================================================
   PRIKAZ GALERIJE
========================================================= */

function renderGallery() {

    const container =
        document.querySelector("#gallery-grid");

    if (!container) return;


    const filteredItems =
        currentGalleryFilter === "sve"
            ? galleryItems
            : galleryItems.filter(item =>
                normalizeGalleryCategory(
                    item.kategorija
                ) === currentGalleryFilter
            );


    if (filteredItems.length === 0) {

        container.innerHTML = `
            <div class="gallery-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <div>

                    <strong>
                        ${
                            currentGalleryFilter === "sve"
                                ? "ГАЛЕРИЈА ФК ОБИЛИЋ"
                                : "НЕМА ФОТОГРАФИЈА"
                        }
                    </strong>

                    <p>
                        ${
                            currentGalleryFilter === "sve"
                                ? "Фотографије ће бити додате ускоро."
                                : "У овој категорији тренутно нема фотографија."
                        }
                    </p>

                </div>

            </div>
        `;

        return;
    }


    container.innerHTML =
        filteredItems
            .map(item =>
                createGalleryItem(item)
            )
            .join("");
}



/* =========================================================
   POJEDINAČNA FOTOGRAFIJA
========================================================= */

function createGalleryItem(item) {

    const title =
        escapeGalleryHtml(
            item.naslov || "ФК Обилић"
        );


    const category =
        normalizeGalleryCategory(
            item.kategorija
        );


    const categoryLabel =
        getGalleryCategoryLabel(
            category
        );


    const image =
        escapeGalleryHtml(
            item.slika || ""
        );


    const date =
        escapeGalleryHtml(
            item.datum || ""
        );


    if (!image) {
        return "";
    }


    return `
        <article
            class="gallery-item"
            data-category="${category}"
        >

            <img
                src="${image}"
                alt="${title}"
                loading="lazy"
                onerror="
                    this.closest('.gallery-item').style.display='none';
                "
            >


            <div class="gallery-item-info">

                <span>
                    ${categoryLabel}
                    ${
                        date
                            ? ` • ${date}`
                            : ""
                    }
                </span>

                <strong>
                    ${title}
                </strong>

            </div>

        </article>
    `;
}



/* =========================================================
   FILTERI
========================================================= */

function setupGalleryFilters() {

    const buttons =
        document.querySelectorAll(
            ".gallery-filter"
        );


    if (!buttons.length) return;


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const filter =
                    button.dataset.filter || "sve";


                currentGalleryFilter =
                    normalizeGalleryCategory(filter);


                buttons.forEach(btn =>
                    btn.classList.remove("active")
                );


                button.classList.add("active");


                renderGallery();
            }
        );

    });
}



/* =========================================================
   NAZIV KATEGORIJE
========================================================= */

function getGalleryCategoryLabel(category) {

    const labels = {
        utakmice: "УТАКМИЦЕ",
        treninzi: "ТРЕНИНЗИ",
        klub: "КЛУБ"
    };


    return labels[category] || "ФК ОБИЛИЋ";
}



/* =========================================================
   NORMALIZACIJA KATEGORIJE
========================================================= */

function normalizeGalleryCategory(category = "") {

    return String(category)
        .trim()
        .toLowerCase();
}



/* =========================================================
   ZAŠTITA TEKSTA
========================================================= */

function escapeGalleryHtml(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}



/* =========================================================
   POKRETANJE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupGalleryFilters();

        loadGallery();

    }
);