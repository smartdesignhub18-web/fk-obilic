/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   ADMIN - GALERIJA
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

const GALLERY_ADMIN_SUPABASE_URL =
    "https://uvevthgxlnzzkapkjxky.supabase.co";

const GALLERY_ADMIN_SUPABASE_KEY =
    "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";

const GALLERY_ADMIN_BUCKET =
    "galerija";


const galleryAdminSb =
    window.supabase.createClient(
        GALLERY_ADMIN_SUPABASE_URL,
        GALLERY_ADMIN_SUPABASE_KEY
    );



/* =========================================================
   ELEMENTI
========================================================= */

const galleryAddButton =
    document.querySelector(
        "#admin-add-gallery"
    );

const galleryList =
    document.querySelector(
        "#admin-gallery-list"
    );

const galleryModal =
    document.querySelector(
        "#admin-gallery-modal"
    );

const galleryForm =
    document.querySelector(
        "#admin-gallery-form"
    );

const galleryModalTitle =
    document.querySelector(
        "#admin-gallery-modal-title"
    );

const galleryIdInput =
    document.querySelector(
        "#admin-gallery-id"
    );

const galleryCurrentImageInput =
    document.querySelector(
        "#admin-gallery-current-image"
    );

const galleryTitleInput =
    document.querySelector(
        "#admin-gallery-title"
    );

const galleryDateInput =
    document.querySelector(
        "#admin-gallery-date"
    );

const galleryCategoryInput =
    document.querySelector(
        "#admin-gallery-category"
    );

const galleryOrderInput =
    document.querySelector(
        "#admin-gallery-order"
    );

const galleryAltInput =
    document.querySelector(
        "#admin-gallery-alt"
    );

const galleryDescriptionInput =
    document.querySelector(
        "#admin-gallery-description"
    );

const galleryImageInput =
    document.querySelector(
        "#admin-gallery-image"
    );

const galleryImagePreview =
    document.querySelector(
        "#admin-gallery-image-preview img"
    );

const galleryImageName =
    document.querySelector(
        "#admin-gallery-image-name"
    );

const galleryFeaturedInput =
    document.querySelector(
        "#admin-gallery-featured"
    );

const galleryActiveInput =
    document.querySelector(
        "#admin-gallery-active"
    );

const galleryFormMessage =
    document.querySelector(
        "#admin-gallery-form-message"
    );

const gallerySaveButton =
    document.querySelector(
        "#admin-gallery-save-button"
    );



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    setupGalleryAdmin
);



/* =========================================================
   EVENTS
========================================================= */

function setupGalleryAdmin() {

        loadGalleryDashboardCount();

        /*
    Admin.js još uvek pokušava da učita
    stari broj iz data/galerija.json.

    Zato nakon učitavanja admin panela
    ponovo postavljamo tačan broj
    direktno iz Supabase-a.
*/

setTimeout(
    loadGalleryDashboardCount,
    1200
);


/*
    Kada se otvori Kontrolna tabla,
    ponovo osveži broj fotografija.
*/

const dashboardNavButton =
    document.querySelector(
        '[data-admin-page="dashboard"]'
    );


if (dashboardNavButton) {

    dashboardNavButton.addEventListener(
        "click",
        () => {

            loadGalleryDashboardCount();

        }
    );

}

    if (galleryAddButton) {

        galleryAddButton.addEventListener(
            "click",
            () => {

                openGalleryModal();

            }
        );

    }


    document
        .querySelectorAll(
            "[data-close-gallery-modal]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    closeGalleryModal
                );

            }
        );


    if (galleryImageInput) {

        galleryImageInput.addEventListener(
            "change",
            previewGalleryImage
        );

    }


    if (galleryForm) {

        galleryForm.addEventListener(
            "submit",
            saveGalleryItem
        );

    }


    const galleryNavButton =
        document.querySelector(
            '[data-admin-page="galerija"]'
        );


    if (galleryNavButton) {

        galleryNavButton.addEventListener(
            "click",
            () => {

                loadAdminGallery();

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                galleryModal &&
                !galleryModal.hidden
            ) {

                closeGalleryModal();

            }

        }
    );

}



/* =========================================================
   UČITAVANJE GALERIJE
========================================================= */

async function loadAdminGallery() {

    if (!galleryList) {

        return;

    }


    galleryList.innerHTML = `

        <div class="admin-list-loading">
            Учитавање галерије...
        </div>

    `;


    const {
        data,
        error
    } =
        await galleryAdminSb
            .from(
                "galerija"
            )
            .select(
                "id,naslov,opis,fotografija,alt_text,datum,kategorija,istaknuta,redosled,aktivna,created_at"
            )
            .order(
                "istaknuta",
                {
                    ascending:
                        false
                }
            )
            .order(
                "redosled",
                {
                    ascending:
                        true
                }
            )
            .order(
                "datum",
                {
                    ascending:
                        false,
                    nullsFirst:
                        false
                }
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Gallery load error:",
            error
        );


        galleryList.innerHTML = `

            <div class="admin-gallery-empty">
                Грешка при учитавању галерије.
            </div>

        `;

        return;

    }


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        galleryList.innerHTML = `

            <div class="admin-gallery-empty">
                Још нема фотографија у галерији.
            </div>

        `;

        return;

    }


    galleryList.innerHTML =
        data
            .map(
                renderAdminGalleryItem
            )
            .join("");


    galleryList
        .querySelectorAll(
            "[data-edit-gallery]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .editGallery;


                        const item =
                            data.find(
                                galleryItem =>
                                    galleryItem.id === id
                            );


                        if (item) {

                            openGalleryModal(
                                item
                            );

                        }

                    }
                );

            }
        );


    galleryList
        .querySelectorAll(
            "[data-delete-gallery]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .deleteGallery;


                        const item =
                            data.find(
                                galleryItem =>
                                    galleryItem.id === id
                            );


                        if (item) {

                            deleteGalleryItem(
                                item
                            );

                        }

                    }
                );

            }
        );

}



/* =========================================================
   KARTICA FOTOGRAFIJE
========================================================= */

function renderAdminGalleryItem(
    item
) {

    const title =
        item.naslov ||
        "Фотографија ФК Обилић";


    const description =
        item.opis

            ? `

                <p class="admin-gallery-description">
                    ${escapeGalleryHtml(item.opis)}
                </p>

            `

            : "";


    const category =
        item.kategorija

            ? `

                <span class="admin-gallery-category">
                    ${escapeGalleryHtml(item.kategorija)}
                </span>

            `

            : "";


    const date =
        item.datum

            ? `

                <span>
                    ${escapeGalleryHtml(
                        formatGalleryDate(
                            item.datum
                        )
                    )}
                </span>

            `

            : "";


    const featured =
        item.istaknuta

            ? `

                <span class="admin-gallery-featured-badge">
                    ИСТАКНУТА
                </span>

            `

            : "";


    return `

        <article
            class="
                admin-gallery-item
                ${item.istaknuta ? "featured" : ""}
            "
        >


            <div class="admin-gallery-photo">

                ${featured}


                <img
                    src="${escapeGalleryAttribute(item.fotografija || "")}"
                    alt="${escapeGalleryAttribute(item.alt_text || title)}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.src='images/grb.png';
                    "
                >

            </div>


            <div class="admin-gallery-info">

                <strong>
                    ${escapeGalleryHtml(title)}
                </strong>


                ${description}


                <div class="admin-gallery-meta">

                    ${category}

                    ${date}


                    <span>
                        РЕДОСЛЕД:
                        ${escapeGalleryHtml(
                            String(
                                item.redosled ??
                                0
                            )
                        )}
                    </span>


                    <span
                        class="
                            admin-gallery-status
                            ${
                                item.aktivna
                                    ? "active"
                                    : "inactive"
                            }
                        "
                    >
                        ${
                            item.aktivna
                                ? "АКТИВНА"
                                : "НЕАКТИВНА"
                        }
                    </span>

                </div>

            </div>


            <div class="admin-gallery-actions">

                <button
                    type="button"
                    class="admin-gallery-edit"
                    data-edit-gallery="${escapeGalleryAttribute(item.id)}"
                >
                    ИЗМЕНИ
                </button>


                <button
                    type="button"
                    class="admin-gallery-delete"
                    data-delete-gallery="${escapeGalleryAttribute(item.id)}"
                >
                    ОБРИШИ
                </button>

            </div>


        </article>

    `;

}



/* =========================================================
   OTVARANJE MODALA
========================================================= */

function openGalleryModal(
    item = null
) {

    if (
        !galleryModal ||
        !galleryForm
    ) {

        return;

    }


    resetGalleryForm();


    if (item) {

        if (galleryModalTitle) {

            galleryModalTitle.textContent =
                "Измени фотографију";

        }


        if (galleryIdInput) {

            galleryIdInput.value =
                item.id ||
                "";

        }


        if (galleryCurrentImageInput) {

            galleryCurrentImageInput.value =
                item.fotografija ||
                "";

        }


        if (galleryTitleInput) {

            galleryTitleInput.value =
                item.naslov ||
                "";

        }


        if (galleryDateInput) {

            galleryDateInput.value =
                item.datum ||
                "";

        }


        if (galleryCategoryInput) {

            galleryCategoryInput.value =
                item.kategorija ||
                "";

        }


        if (galleryOrderInput) {

            galleryOrderInput.value =
                item.redosled ??
                0;

        }


        if (galleryAltInput) {

            galleryAltInput.value =
                item.alt_text ||
                "";

        }


        if (galleryDescriptionInput) {

            galleryDescriptionInput.value =
                item.opis ||
                "";

        }


        if (galleryFeaturedInput) {

            galleryFeaturedInput.checked =
                item.istaknuta ===
                true;

        }


        if (galleryActiveInput) {

            galleryActiveInput.checked =
                item.aktivna !==
                false;

        }


        if (
            galleryImagePreview &&
            item.fotografija
        ) {

            galleryImagePreview.src =
                item.fotografija;

        }

    }

    else {

        if (galleryModalTitle) {

            galleryModalTitle.textContent =
                "Додај фотографију";

        }


        if (galleryDateInput) {

            galleryDateInput.value =
                getGalleryToday();

        }

    }


    galleryModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";

}



/* =========================================================
   ZATVARANJE MODALA
========================================================= */

function closeGalleryModal() {

    if (!galleryModal) {

        return;

    }


    galleryModal.hidden =
        true;


    document.body.style.overflow =
        "";

}



/* =========================================================
   RESET FORME
========================================================= */

function resetGalleryForm() {

    if (!galleryForm) {

        return;

    }


    galleryForm.reset();


    if (galleryIdInput) {

        galleryIdInput.value =
            "";

    }


    if (galleryCurrentImageInput) {

        galleryCurrentImageInput.value =
            "";

    }


    if (galleryOrderInput) {

        galleryOrderInput.value =
            "0";

    }


    if (galleryFeaturedInput) {

        galleryFeaturedInput.checked =
            false;

    }


    if (galleryActiveInput) {

        galleryActiveInput.checked =
            true;

    }


    if (galleryImagePreview) {

        galleryImagePreview.src =
            "images/grb.png";

    }


    if (galleryImageName) {

        galleryImageName.textContent =
            "Није изабрана фотографија";

    }


    setGalleryFormMessage(
        "",
        ""
    );

}



/* =========================================================
   PREVIEW SLIKE
========================================================= */

function previewGalleryImage() {

    const file =
        galleryImageInput
            ?.files?.[0];


    if (!file) {

        return;

    }


    try {

        validateGalleryImage(
            file
        );

    }

    catch (error) {

        setGalleryFormMessage(
            error.message ||
            "Фотографија није исправна.",
            "error"
        );


        galleryImageInput.value =
            "";


        return;

    }


    if (galleryImageName) {

        galleryImageName.textContent =
            file.name;

    }


    const objectUrl =
        URL.createObjectURL(
            file
        );


    if (galleryImagePreview) {

        galleryImagePreview.src =
            objectUrl;


        galleryImagePreview.onload =
            () => {

                URL.revokeObjectURL(
                    objectUrl
                );

            };

    }

}



/* =========================================================
   ČUVANJE
========================================================= */

async function saveGalleryItem(
    event
) {

    event.preventDefault();


    setGalleryFormMessage(
        "",
        ""
    );


    const id =
        galleryIdInput
            ?.value
            .trim() ||
        "";


    const title =
        galleryTitleInput
            ?.value
            .trim() ||
        "";


    const date =
        galleryDateInput
            ?.value ||
        null;


    const category =
        galleryCategoryInput
            ?.value
            .trim() ||
        null;


    const altText =
        galleryAltInput
            ?.value
            .trim() ||
        null;


    const description =
        galleryDescriptionInput
            ?.value
            .trim() ||
        null;


    const order =
        Number(
            galleryOrderInput
                ?.value ||
            0
        );


    const oldImage =
        galleryCurrentImageInput
            ?.value
            .trim() ||
        "";


    const selectedFile =
        galleryImageInput
            ?.files?.[0];


    /*
        Kod nove fotografije slika je obavezna.
        Kod izmene može ostati postojeća.
    */

    if (
        !id &&
        !selectedFile
    ) {

        setGalleryFormMessage(
            "Изаберите фотографију.",
            "error"
        );

        return;

    }


    let uploadedImage =
        null;


    setGalleryButtonLoading(
        true
    );


    try {

        if (selectedFile) {

            uploadedImage =
                await uploadGalleryImage(
                    selectedFile,
                    title ||
                    category ||
                    "galerija"
                );

        }


        const image =
            uploadedImage ||
            oldImage;


        if (!image) {

            throw new Error(
                "Фотографија је обавезна."
            );

        }


        const payload = {

            naslov:
                title ||
                null,

            opis:
                description,

            fotografija:
                image,

            alt_text:
                altText ||
                title ||
                "ФК Обилић Нови Кнежевац",

            datum:
                date,

            kategorija:
                category,

            istaknuta:
                Boolean(
                    galleryFeaturedInput
                        ?.checked
                ),

            redosled:
                Number.isFinite(
                    order
                )
                    ? order
                    : 0,

            aktivna:
                Boolean(
                    galleryActiveInput
                        ?.checked
                )

        };


        let error;


        if (id) {

            const result =
                await galleryAdminSb
                    .from(
                        "galerija"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        id
                    );


            error =
                result.error;

        }

        else {

            const result =
                await galleryAdminSb
                    .from(
                        "galerija"
                    )
                    .insert(
                        payload
                    );


            error =
                result.error;

        }


        if (error) {

            throw error;

        }


        /*
            Tek kada je zapis uspešno sačuvan,
            brišemo staru fotografiju.
        */

        if (
            uploadedImage &&
            oldImage &&
            uploadedImage !==
                oldImage
        ) {

            await deleteGalleryImageFromUrl(
                oldImage
            );

        }


        setGalleryFormMessage(
            "Фотографија је успешно сачувана.",
            "success"
        );


        await Promise.allSettled(
    [
        loadAdminGallery(),
        loadGalleryDashboardCount()
    ]
);


        setTimeout(
            closeGalleryModal,
            450
        );

    }

    catch (error) {

        console.error(
            "Save gallery error:",
            error
        );


        /*
            Ako je upload uspeo, ali unos u bazu nije,
            brišemo upravo uploadovanu fotografiju.
        */

        if (uploadedImage) {

            await deleteGalleryImageFromUrl(
                uploadedImage
            );

        }


        setGalleryFormMessage(
            getGalleryFriendlyError(
                error,
                "Фотографија није сачувана."
            ),
            "error"
        );

    }

    finally {

        setGalleryButtonLoading(
            false
        );

    }

}



/* =========================================================
   BRISANJE
========================================================= */

async function deleteGalleryItem(
    item
) {

    const title =
        item.naslov ||
        "ову фотографију";


    const confirmed =
        window.confirm(
            `Обрисати „${title}“ из галерије?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } =
        await galleryAdminSb
            .from(
                "galerija"
            )
            .delete()
            .eq(
                "id",
                item.id
            );


    if (error) {

        console.error(
            "Delete gallery error:",
            error
        );


        window.alert(
            "Фотографију није могуће обрисати."
        );


        return;

    }


    if (
        item.fotografija
    ) {

        await deleteGalleryImageFromUrl(
            item.fotografija
        );

    }


    await Promise.allSettled(
    [
        loadAdminGallery(),
        loadGalleryDashboardCount()
    ]
);

}



/* =========================================================
   STORAGE UPLOAD
========================================================= */

async function uploadGalleryImage(
    file,
    title
) {

    validateGalleryImage(
        file
    );


    const extension =
        getGalleryFileExtension(
            file.name,
            file.type
        );


    const safeName =
        createGallerySlug(
            title
        ) ||
        "fotografija";


    const path =
        `slike/${Date.now()}-${safeName}.${extension}`;


    const {
        error
    } =
        await galleryAdminSb
            .storage
            .from(
                GALLERY_ADMIN_BUCKET
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        throw error;

    }


    const {
        data
    } =
        galleryAdminSb
            .storage
            .from(
                GALLERY_ADMIN_BUCKET
            )
            .getPublicUrl(
                path
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "Није добијена адреса фотографије."
        );

    }


    return data.publicUrl;

}



/* =========================================================
   STORAGE BRISANJE
========================================================= */

async function deleteGalleryImageFromUrl(
    url
) {

    const path =
        getGalleryStoragePath(
            url
        );


    if (!path) {

        return;

    }


    const {
        error
    } =
        await galleryAdminSb
            .storage
            .from(
                GALLERY_ADMIN_BUCKET
            )
            .remove(
                [
                    path
                ]
            );


    if (error) {

        console.warn(
            "Gallery storage delete warning:",
            error
        );

    }

}



/* =========================================================
   PUTANJA IZ PUBLIC URL
========================================================= */

function getGalleryStoragePath(
    url
) {

    if (!url) {

        return "";

    }


    try {

        const parsed =
            new URL(
                url
            );


        const marker =
            `/storage/v1/object/public/${GALLERY_ADMIN_BUCKET}/`;


        const index =
            parsed.pathname
                .indexOf(
                    marker
                );


        if (
            index === -1
        ) {

            return "";

        }


        return decodeURIComponent(
            parsed.pathname
                .slice(
                    index +
                    marker.length
                )
        );

    }

    catch {

        return "";

    }

}



/* =========================================================
   VALIDACIJA FOTOGRAFIJE
========================================================= */

function validateGalleryImage(
    file
) {

    const allowedTypes =
        [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        throw new Error(
            "Фотографија мора бити JPG, PNG или WebP."
        );

    }


    const maxSize =
        8 *
        1024 *
        1024;


    if (
        file.size >
        maxSize
    ) {

        throw new Error(
            "Фотографија не сме бити већа од 8 MB."
        );

    }

}



/* =========================================================
   EKSTENZIJA
========================================================= */

function getGalleryFileExtension(
    fileName,
    mimeType
) {

    const extension =
        String(
            fileName ||
            ""
        )
            .split(".")
            .pop()
            .toLowerCase();


    if (
        [
            "jpg",
            "jpeg",
            "png",
            "webp"
        ].includes(
            extension
        )
    ) {

        return extension ===
            "jpeg"
                ? "jpg"
                : extension;

    }


    const map = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp"

    };


    return (
        map[mimeType] ||
        "jpg"
    );

}



/* =========================================================
   SLUG
========================================================= */

function createGallerySlug(
    value
) {

    return latinizeGalleryText(
        String(
            value ||
            ""
        )
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        )
        .slice(
            0,
            80
        );

}



/* =========================================================
   ĆIRILICA -> LATINICA ZA NAZIV FAJLA
========================================================= */

function latinizeGalleryText(
    value
) {

    const map = {

        "А":"A",
        "Б":"B",
        "В":"V",
        "Г":"G",
        "Д":"D",
        "Ђ":"Dj",
        "Е":"E",
        "Ж":"Z",
        "З":"Z",
        "И":"I",
        "Ј":"J",
        "К":"K",
        "Л":"L",
        "Љ":"Lj",
        "М":"M",
        "Н":"N",
        "Њ":"Nj",
        "О":"O",
        "П":"P",
        "Р":"R",
        "С":"S",
        "Т":"T",
        "Ћ":"C",
        "У":"U",
        "Ф":"F",
        "Х":"H",
        "Ц":"C",
        "Ч":"C",
        "Џ":"Dz",
        "Ш":"S",

        "а":"a",
        "б":"b",
        "в":"v",
        "г":"g",
        "д":"d",
        "ђ":"dj",
        "е":"e",
        "ж":"z",
        "з":"z",
        "и":"i",
        "ј":"j",
        "к":"k",
        "л":"l",
        "љ":"lj",
        "м":"m",
        "н":"n",
        "њ":"nj",
        "о":"o",
        "п":"p",
        "р":"r",
        "с":"s",
        "т":"t",
        "ћ":"c",
        "у":"u",
        "ф":"f",
        "х":"h",
        "ц":"c",
        "ч":"c",
        "џ":"dz",
        "ш":"s",

        "Č":"C",
        "Ć":"C",
        "Đ":"Dj",
        "Š":"S",
        "Ž":"Z",

        "č":"c",
        "ć":"c",
        "đ":"dj",
        "š":"s",
        "ž":"z"

    };


    return String(
        value
    )
        .split("")
        .map(
            character =>
                map[character] ??
                character
        )
        .join("");

}



/* =========================================================
   DATUM
========================================================= */

function formatGalleryDate(
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



function getGalleryToday() {

    const now =
        new Date();


    const formatter =
        new Intl.DateTimeFormat(
            "en-CA",
            {
                year:
                    "numeric",

                month:
                    "2-digit",

                day:
                    "2-digit",

                timeZone:
                    "Europe/Belgrade"
            }
        );


    return formatter.format(
        now
    );

}



/* =========================================================
   DUGME - LOADING
========================================================= */

function setGalleryButtonLoading(
    loading
) {

    if (!gallerySaveButton) {

        return;

    }


    gallerySaveButton.disabled =
        loading;


    gallerySaveButton.textContent =
        loading
            ? "ЧУВАЊЕ..."
            : "САЧУВАЈ";

}



/* =========================================================
   PORUKA FORME
========================================================= */

function setGalleryFormMessage(
    message,
    type
) {

    if (!galleryFormMessage) {

        return;

    }


    galleryFormMessage.textContent =
        message;


    galleryFormMessage.className =
        "admin-form-message";


    if (type) {

        galleryFormMessage
            .classList
            .add(
                type
            );

    }

}



/* =========================================================
   GREŠKE
========================================================= */

function getGalleryFriendlyError(
    error,
    fallback
) {

    const message =
        String(
            error?.message ||
            ""
        );


    if (
        message.includes(
            "row-level security"
        )
    ) {

        return "Немате дозволу за ову операцију.";

    }


    if (
        message.includes(
            "Bucket not found"
        )
    ) {

        return "Storage bucket „galerija“ није пронађен.";

    }


    if (
        message.includes(
            "duplicate"
        )
    ) {

        return "Овај запис већ постоји.";

    }


    return (
        message ||
        fallback
    );

}

/* =========================================================
   BROJAČ GALERIJE NA KONTROLNOJ TABLI
========================================================= */

async function loadGalleryDashboardCount() {

    const element =
        document.querySelector(
            "#admin-stat-gallery"
        );


    if (!element) {

        return;

    }


    const {
        count,
        error
    } =
        await galleryAdminSb
            .from(
                "galerija"
            )
            .select(
                "*",
                {
                    count:
                        "exact",

                    head:
                        true
                }
            )
            .eq(
                "aktivna",
                true
            );


    if (error) {

        console.error(
            "Gallery count error:",
            error
        );


        element.textContent =
            "—";


        return;

    }


    element.textContent =
        String(
            count ??
            0
        );

}

/* =========================================================
   BEZBEDAN ISPIS
========================================================= */

function escapeGalleryHtml(
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



function escapeGalleryAttribute(
    value = ""
) {

    return escapeGalleryHtml(
        value
    );

}