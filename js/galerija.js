/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   JAVNA GALERIJA - SUPABASE
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const PUBLIC_GALLERY_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const PUBLIC_GALLERY_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


/* =========================================================
   PODACI GALERIJE
========================================================= */

let publicGalleryItems = [];

let activePublicGalleryFilter =
    "all";


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadPublicGallery
);


/* =========================================================
   GLAVNO UČITAVANJE
========================================================= */

async function loadPublicGallery() {

    const homeGrid =
        document.querySelector(
            "#home-gallery-grid"
        );


    const fullGrid =
        document.querySelector(
            "#gallery-page-grid"
        );


    if (
        !homeGrid &&
        !fullGrid
    ) {

        return;

    }


    try {

        const items =
            await fetchPublicGallery();


        publicGalleryItems =
            items;


        if (homeGrid) {

            renderHomeGallery(
                items,
                homeGrid
            );

        }


        if (fullGrid) {

            setupPublicGalleryFilters(
                fullGrid
            );

            renderFilteredPublicGallery(
                fullGrid
            );

        }

    }

    catch (error) {

        console.error(
            "Грешка при учитавању галерије:",
            error
        );


        if (homeGrid) {

            homeGrid.innerHTML = `
                <div class="home-gallery-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <span>
                        Галерија тренутно није доступна.
                    </span>

                </div>
            `;

        }


        if (fullGrid) {

            fullGrid.innerHTML = `
                <div class="gallery-page-empty">

                    <img
                        src="images/grb.png"
                        alt=""
                    >

                    <span>
                        Галерија тренутно није доступна.
                    </span>

                </div>
            `;

        }

    }

}


/* =========================================================
   SUPABASE FETCH
========================================================= */

async function fetchPublicGallery() {

    const url =
        new URL(
            `${PUBLIC_GALLERY_SUPABASE_URL}/rest/v1/galerija`
        );


    url.searchParams.set(
        "select",
        [
            "id",
            "naslov",
            "opis",
            "fotografija",
            "alt_text",
            "datum",
            "kategorija",
            "selekcija",
            "istaknuta",
            "redosled",
            "aktivna",
            "created_at"
        ].join(",")
    );


    url.searchParams.set(
        "aktivna",
        "eq.true"
    );


    url.searchParams.set(
        "order",
        [
            "istaknuta.desc",
            "redosled.asc",
            "datum.desc.nullslast",
            "created_at.desc"
        ].join(",")
    );


    const response =
        await fetch(
            url.toString(),
            {
                method:
                    "GET",

                headers: {

                    "apikey":
                        PUBLIC_GALLERY_SUPABASE_KEY,

                    "Authorization":
                        `Bearer ${PUBLIC_GALLERY_SUPABASE_KEY}`,

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


    return Array.isArray(
        data
    )
        ? data
        : [];

}


/* =========================================================
   POČETNA STRANA
========================================================= */

function renderHomeGallery(
    items,
    container
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        container.innerHTML = `
            <div class="home-gallery-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <span>
                    Фотографије ће бити додате ускоро.
                </span>

            </div>
        `;

        return;

    }


    /*
        Na početnoj prikazujemo najviše 6.
    */

    const homeItems =
        items.slice(
            0,
            6
        );


    container.innerHTML =
        homeItems
            .map(
                createHomeGalleryItem
            )
            .join("");


    setupGalleryClicks(
        container,
        homeItems
    );

}


/* =========================================================
   KARTICA NA POČETNOJ
========================================================= */

function createHomeGalleryItem(
    item,
    index
) {

    const image =
        item.fotografija ||
        "images/grb.png";


    const title =
        item.naslov ||
        "ФК Обилић";


    const category =
        getPublicGalleryCategoryLabel(
            item
        );


    return `
        <button
            type="button"
            class="home-gallery-item"
            data-gallery-index="${index}"
            aria-label="${escapeGalleryPublicAttribute(title)}"
        >

            <img
                src="${escapeGalleryPublicAttribute(image)}"
                alt="${escapeGalleryPublicAttribute(
                    item.alt_text ||
                    title
                )}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='images/grb.png';
                "
            >


            <span class="home-gallery-overlay"></span>


            <span class="home-gallery-info">

                <span>
                    ${escapeGalleryPublicHtml(category)}
                </span>

                <strong>
                    ${escapeGalleryPublicHtml(title)}
                </strong>

            </span>

        </button>
    `;

}


/* =========================================================
   FILTERI
========================================================= */

function setupPublicGalleryFilters(
    container
) {

    const filterContainer =
        document.querySelector(
            "#gallery-page-filters"
        );


    if (!filterContainer) {
        return;
    }


    const buttons =
        filterContainer.querySelectorAll(
            "[data-gallery-filter]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    activePublicGalleryFilter =
                        button.dataset
                            .galleryFilter ||
                        "all";


                    buttons.forEach(
                        otherButton => {

                            otherButton
                                .classList
                                .remove(
                                    "active"
                                );

                        }
                    );


                    button
                        .classList
                        .add(
                            "active"
                        );


                    renderFilteredPublicGallery(
                        container
                    );

                }
            );

        }
    );

}


/* =========================================================
   FILTRIRANA GALERIJA
========================================================= */

function renderFilteredPublicGallery(
    container
) {

    let items =
        publicGalleryItems;


    if (
        activePublicGalleryFilter !==
        "all"
    ) {

        items =
            publicGalleryItems.filter(
                item =>
                    item.kategorija ===
                    activePublicGalleryFilter
            );

    }


    renderFullGallery(
        items,
        container
    );

}


/* =========================================================
   CELA GALERIJA
========================================================= */

function renderFullGallery(
    items,
    container
) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        container.innerHTML = `
            <div class="gallery-page-empty">

                <img
                    src="images/grb.png"
                    alt=""
                >

                <span>
                    Нема фотографија у овој категорији.
                </span>

            </div>
        `;

        return;

    }


    container.innerHTML =
        items
            .map(
                createFullGalleryItem
            )
            .join("");


    setupGalleryClicks(
        container,
        items
    );

}


/* =========================================================
   KARTICA NA STRANICI GALERIJE
========================================================= */

function createFullGalleryItem(
    item,
    index
) {

    const image =
        item.fotografija ||
        "images/grb.png";


    const title =
        item.naslov ||
        "ФК Обилић";


    const category =
        getPublicGalleryCategoryLabel(
            item
        );


    const date =
        item.datum
            ? formatPublicGalleryDate(
                item.datum
            )
            : "";


    return `
        <button
            type="button"
            class="gallery-page-item"
            data-gallery-index="${index}"
            aria-label="${escapeGalleryPublicAttribute(title)}"
        >

            <img
                src="${escapeGalleryPublicAttribute(image)}"
                alt="${escapeGalleryPublicAttribute(
                    item.alt_text ||
                    title
                )}"
                loading="lazy"
                onerror="
                    this.onerror=null;
                    this.src='images/grb.png';
                "
            >


            <span class="gallery-page-overlay"></span>


            <span class="gallery-page-info">

                <span class="gallery-page-category">
                    ${escapeGalleryPublicHtml(category)}
                </span>


                <strong>
                    ${escapeGalleryPublicHtml(title)}
                </strong>


                ${
                    date
                        ? `
                            <small>
                                ${escapeGalleryPublicHtml(date)}
                            </small>
                        `
                        : ""
                }

            </span>

        </button>
    `;

}


/* =========================================================
   NAZIV KATEGORIJE
========================================================= */

function getPublicGalleryCategoryLabel(
    item
) {

    const category =
        item.kategorija ||
        "ГАЛЕРИЈА";


    /*
        Ako je mlađa kategorija,
        prikazujemo i konkretnu selekciju.
    */

    if (
        category ===
            "МЛАЂЕ КАТЕГОРИЈЕ" &&
        item.selekcija
    ) {

        return (
            `${category} • ${item.selekcija}`
        );

    }


    return category;

}


/* =========================================================
   KLIK NA FOTOGRAFIJU
========================================================= */

function setupGalleryClicks(
    container,
    items
) {

    container
        .querySelectorAll(
            "[data-gallery-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset
                                    .galleryIndex
                            );


                        if (
                            Number.isInteger(
                                index
                            ) &&
                            items[index]
                        ) {

                            openPublicGalleryLightbox(
                                items,
                                index
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   LIGHTBOX
========================================================= */

let galleryLightboxItems =
    [];

let galleryLightboxIndex =
    0;


function openPublicGalleryLightbox(
    items,
    index
) {

    galleryLightboxItems =
        items;


    galleryLightboxIndex =
        index;


    let lightbox =
        document.querySelector(
            "#public-gallery-lightbox"
        );


    if (!lightbox) {

        lightbox =
            createPublicGalleryLightbox();

    }


    updatePublicGalleryLightbox();


    lightbox.hidden =
        false;


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   KREIRANJE LIGHTBOXA
========================================================= */

function createPublicGalleryLightbox() {

    const lightbox =
        document.createElement(
            "div"
        );


    lightbox.id =
        "public-gallery-lightbox";


    lightbox.className =
        "public-gallery-lightbox";


    lightbox.hidden =
        true;


    lightbox.innerHTML = `

        <div
            class="public-gallery-lightbox-backdrop"
            data-gallery-lightbox-close
        ></div>


        <button
            type="button"
            class="public-gallery-lightbox-close"
            data-gallery-lightbox-close
            aria-label="Затвори"
        >
            ×
        </button>


        <button
            type="button"
            class="
                public-gallery-lightbox-arrow
                public-gallery-lightbox-prev
            "
            data-gallery-lightbox-prev
            aria-label="Претходна фотографија"
        >
            ‹
        </button>


        <div class="public-gallery-lightbox-content">

            <img
                id="public-gallery-lightbox-image"
                src=""
                alt=""
            >


            <div class="public-gallery-lightbox-info">

                <span
                    id="public-gallery-lightbox-category"
                ></span>


                <strong
                    id="public-gallery-lightbox-title"
                ></strong>


                <p
                    id="public-gallery-lightbox-description"
                ></p>


                <small
                    id="public-gallery-lightbox-counter"
                ></small>

            </div>

        </div>


        <button
            type="button"
            class="
                public-gallery-lightbox-arrow
                public-gallery-lightbox-next
            "
            data-gallery-lightbox-next
            aria-label="Следећа фотографија"
        >
            ›
        </button>

    `;


    document.body.appendChild(
        lightbox
    );


    lightbox
        .querySelectorAll(
            "[data-gallery-lightbox-close]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closePublicGalleryLightbox
                );

            }
        );


    lightbox
        .querySelector(
            "[data-gallery-lightbox-prev]"
        )
        ?.addEventListener(
            "click",
            showPreviousPublicGalleryImage
        );


    lightbox
        .querySelector(
            "[data-gallery-lightbox-next]"
        )
        ?.addEventListener(
            "click",
            showNextPublicGalleryImage
        );


    document.addEventListener(
        "keydown",
        handlePublicGalleryKeyboard
    );


    return lightbox;

}


/* =========================================================
   LIGHTBOX SADRŽAJ
========================================================= */

function updatePublicGalleryLightbox() {

    const item =
        galleryLightboxItems[
            galleryLightboxIndex
        ];


    if (!item) {
        return;
    }


    const image =
        document.querySelector(
            "#public-gallery-lightbox-image"
        );


    const category =
        document.querySelector(
            "#public-gallery-lightbox-category"
        );


    const title =
        document.querySelector(
            "#public-gallery-lightbox-title"
        );


    const description =
        document.querySelector(
            "#public-gallery-lightbox-description"
        );


    const counter =
        document.querySelector(
            "#public-gallery-lightbox-counter"
        );


    if (image) {

        image.src =
            item.fotografija ||
            "images/grb.png";


        image.alt =
            item.alt_text ||
            item.naslov ||
            "ФК Обилић";

    }


    if (category) {

        category.textContent =
            getPublicGalleryCategoryLabel(
                item
            );

    }


    if (title) {

        title.textContent =
            item.naslov ||
            "ФК Обилић";

    }


    if (description) {

        description.textContent =
            item.opis ||
            "";


        description.hidden =
            !item.opis;

    }


    if (counter) {

        counter.textContent =
            `${galleryLightboxIndex + 1} / ${galleryLightboxItems.length}`;

    }

}


/* =========================================================
   PRETHODNA
========================================================= */

function showPreviousPublicGalleryImage() {

    if (
        galleryLightboxItems.length ===
        0
    ) {

        return;

    }


    galleryLightboxIndex =
        (
            galleryLightboxIndex -
            1 +
            galleryLightboxItems.length
        ) %
        galleryLightboxItems.length;


    updatePublicGalleryLightbox();

}


/* =========================================================
   SLEDEĆA
========================================================= */

function showNextPublicGalleryImage() {

    if (
        galleryLightboxItems.length ===
        0
    ) {

        return;

    }


    galleryLightboxIndex =
        (
            galleryLightboxIndex +
            1
        ) %
        galleryLightboxItems.length;


    updatePublicGalleryLightbox();

}


/* =========================================================
   ZATVARANJE
========================================================= */

function closePublicGalleryLightbox() {

    const lightbox =
        document.querySelector(
            "#public-gallery-lightbox"
        );


    if (!lightbox) {
        return;
    }


    lightbox.hidden =
        true;


    document.body.style.overflow =
        "";

}


/* =========================================================
   TASTATURA
========================================================= */

function handlePublicGalleryKeyboard(
    event
) {

    const lightbox =
        document.querySelector(
            "#public-gallery-lightbox"
        );


    if (
        !lightbox ||
        lightbox.hidden
    ) {

        return;

    }


    if (
        event.key ===
        "Escape"
    ) {

        closePublicGalleryLightbox();

    }


    if (
        event.key ===
        "ArrowLeft"
    ) {

        showPreviousPublicGalleryImage();

    }


    if (
        event.key ===
        "ArrowRight"
    ) {

        showNextPublicGalleryImage();

    }

}


/* =========================================================
   DATUM
========================================================= */

function formatPublicGalleryDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const parts =
        String(
            dateString
        )
            .split("-");


    if (
        parts.length !==
        3
    ) {

        return dateString;

    }


    return (
        `${parts[2]}.` +
        `${parts[1]}.` +
        `${parts[0]}.`
    );

}


/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeGalleryPublicHtml(
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


function escapeGalleryPublicAttribute(
    value = ""
) {

    return escapeGalleryPublicHtml(
        value
    );

}