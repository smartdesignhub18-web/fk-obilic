/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   ADMIN - PARTNERI
========================================================= */

(() => {

    const PARTNERS_BUCKET =
        "partneri";


    let adminPartners = [];


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializePartnersAdmin
    );


    function initializePartnersAdmin() {

        injectPartnerStyles();

        createPartnerModal();


        const addButton =
            document.querySelector(
                "#admin-add-partner"
            );


        if (addButton) {

            addButton.addEventListener(
                "click",
                () => {

                    openPartnerEditor();

                }
            );

        }


        const partnersNav =
            document.querySelector(
                '[data-admin-page="partneri"]'
            );


        if (partnersNav) {

            partnersNav.addEventListener(
                "click",
                () => {

                    loadAdminPartners();

                }
            );

        }


        const dashboardNav =
            document.querySelector(
                '[data-admin-page="dashboard"]'
            );


        if (dashboardNav) {

            dashboardNav.addEventListener(
                "click",
                () => {

                    loadPartnersCount();

                }
            );

        }


        const list =
            document.querySelector(
                "#admin-partners-list"
            );


        if (list) {

            list.addEventListener(
                "click",
                handlePartnerListClick
            );

        }


        setTimeout(
            loadPartnersCount,
            1000
        );

    }


    /* =====================================================
       BROJ PARTNERA
    ===================================================== */

    async function loadPartnersCount() {

        const element =
            document.querySelector(
                "#admin-stat-partners"
            );


        if (!element) {
            return;
        }


        const {
            count,
            error
        } =
            await sb
                .from(
                    "partneri"
                )
                .select(
                    "*",
                    {
                        count:
                            "exact",

                        head:
                            true
                    }
                );


        if (error) {

            console.warn(
                "Partner count error:",
                error
            );

            return;

        }


        element.textContent =
            String(
                count ?? 0
            );

    }


    /* =====================================================
       UČITAVANJE PARTNERA
    ===================================================== */

    async function loadAdminPartners() {

        const container =
            document.querySelector(
                "#admin-partners-list"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="admin-data-loading">

                <div class="loader"></div>

                <span>
                    Учитавање партнера...
                </span>

            </div>

        `;


        const {
            data,
            error
        } =
            await sb
                .from(
                    "partneri"
                )
                .select(
                    "id,naziv,opis,logo,link,generalni,istaknut,redosled,aktivan,created_at,updated_at"
                )
                .order(
                    "generalni",
                    {
                        ascending: false
                    }
                )
                .order(
                    "istaknut",
                    {
                        ascending: false
                    }
                )
                .order(
                    "redosled",
                    {
                        ascending: true
                    }
                )
                .order(
                    "naziv",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Partner load error:",
                error
            );


            container.innerHTML = `

                <div class="partner-admin-empty">
                    Није могуће учитати партнере.
                </div>

            `;

            return;

        }


        adminPartners =
            Array.isArray(data)
                ? data
                : [];


        renderAdminPartners();

        await loadPartnersCount();

    }


    /* =====================================================
       PRIKAZ PARTNERA
    ===================================================== */

    function renderAdminPartners() {

        const container =
            document.querySelector(
                "#admin-partners-list"
            );


        if (!container) {
            return;
        }


        if (!adminPartners.length) {

            container.innerHTML = `

                <div class="partner-admin-empty">

                    <strong>
                        Још нема партнера
                    </strong>

                    <span>
                        Кликните на „Додај партнера“
                        да унесете првог партнера клуба.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="partner-admin-grid">

                ${
                    adminPartners
                        .map(
                            renderPartnerCard
                        )
                        .join("")
                }

            </div>

        `;

    }


    function renderPartnerCard(
        partner
    ) {

        const logo =
            partner.logo
                ? `
                    <img
                        src="${escapeAttribute(partner.logo)}"
                        alt="${escapeAttribute(partner.naziv || "")}"
                    >
                `
                : `
                    <div class="partner-admin-no-logo">
                        ◇
                    </div>
                `;


        const link =
            partner.link
                ? `
                    <a
                        href="${escapeAttribute(partner.link)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="partner-admin-link"
                    >
                        ОТВОРИ ЛИНК ↗
                    </a>
                `
                : "";


        return `

            <article
                class="
                    partner-admin-card
                    ${
                        partner.generalni
                            ? "general"
                            : ""
                    }
                "
            >

                <div class="partner-admin-logo">
                    ${logo}
                </div>


                <div class="partner-admin-card-content">

                    <div class="partner-admin-badges">

                        <span
                            class="${
                                partner.aktivan
                                    ? "partner-admin-badge active"
                                    : "partner-admin-badge inactive"
                            }"
                        >
                            ${
                                partner.aktivan
                                    ? "АКТИВАН"
                                    : "НЕАКТИВАН"
                            }
                        </span>


                        ${
                            partner.generalni
                                ? `
                                    <span class="partner-admin-badge general">
                                        ГЕНЕРАЛНИ ПАРТНЕР
                                    </span>
                                `
                                : ""
                        }


                        ${
                            partner.istaknut
                                ? `
                                    <span class="partner-admin-badge featured">
                                        ИСТАКНУТ
                                    </span>
                                `
                                : ""
                        }

                    </div>


                    <h3>
                        ${escapeHtml(partner.naziv || "")}
                    </h3>


                    ${
                        partner.opis
                            ? `
                                <p>
                                    ${escapeHtml(partner.opis)}
                                </p>
                            `
                            : ""
                    }


                    <div class="partner-admin-meta">

                        <span>
                            Редослед:
                            <strong>
                                ${Number(partner.redosled || 0)}
                            </strong>
                        </span>

                        ${link}

                    </div>

                </div>


                <div class="partner-admin-actions">

                    <button
                        type="button"
                        data-edit-partner="${escapeAttribute(partner.id)}"
                    >
                        ИЗМЕНИ
                    </button>


                    <button
                        type="button"
                        class="delete"
                        data-delete-partner="${escapeAttribute(partner.id)}"
                    >
                        ОБРИШИ
                    </button>

                </div>

            </article>

        `;

    }


    /* =====================================================
       KLIK NA LISTI
    ===================================================== */

    function handlePartnerListClick(
        event
    ) {

        const editButton =
            event.target.closest(
                "[data-edit-partner]"
            );


        if (editButton) {

            const partner =
                adminPartners.find(
                    item =>
                        item.id ===
                        editButton.dataset
                            .editPartner
                );


            if (partner) {

                openPartnerEditor(
                    partner
                );

            }


            return;

        }


        const deleteButton =
            event.target.closest(
                "[data-delete-partner]"
            );


        if (deleteButton) {

            const partner =
                adminPartners.find(
                    item =>
                        item.id ===
                        deleteButton.dataset
                            .deletePartner
                );


            if (partner) {

                deletePartner(
                    partner
                );

            }

        }

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function createPartnerModal() {

        if (
            document.querySelector(
                "#partner-admin-modal"
            )
        ) {

            return;

        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "partner-admin-modal";


        modal.className =
            "partner-admin-modal";


        modal.hidden =
            true;


        modal.innerHTML = `

            <div
                class="partner-admin-overlay"
                data-close-partner-modal
            ></div>


            <div class="partner-admin-dialog">

                <div class="partner-admin-modal-header">

                    <div>

                        <span>
                            ПАРТНЕРИ КЛУБА
                        </span>

                        <h2 id="partner-admin-modal-title">
                            Додај партнера
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="partner-admin-close"
                        data-close-partner-modal
                        aria-label="Затвори"
                    >
                        ×
                    </button>

                </div>


                <form
                    id="partner-admin-form"
                    class="partner-admin-form"
                >

                    <input
                        type="hidden"
                        id="partner-admin-id"
                    >

                    <input
                        type="hidden"
                        id="partner-admin-current-logo"
                    >


                    <div class="partner-admin-form-grid">


                        <div class="partner-admin-field">

                            <label for="partner-admin-name">
                                НАЗИВ ПАРТНЕРА *
                            </label>

                            <input
                                type="text"
                                id="partner-admin-name"
                                placeholder="Нпр. Smart Design Hub"
                                required
                            >

                        </div>


                        <div class="partner-admin-field">

                            <label for="partner-admin-link">
                                ЛИНК
                            </label>

                            <input
                                type="text"
                                id="partner-admin-link"
                                placeholder="https://..."
                            >

                        </div>


                        <div class="partner-admin-field full">

                            <label for="partner-admin-description">
                                ОПИС
                            </label>

                            <textarea
                                id="partner-admin-description"
                                rows="4"
                                placeholder="Кратак опис партнера..."
                            ></textarea>

                        </div>


                        <div class="partner-admin-field">

                            <label for="partner-admin-order">
                                РЕДОСЛЕД
                            </label>

                            <input
                                type="number"
                                id="partner-admin-order"
                                value="0"
                                min="0"
                                step="1"
                            >

                        </div>


                        <div class="partner-admin-checks">

                            <label>

                                <input
                                    type="checkbox"
                                    id="partner-admin-general"
                                >

                                <span>
                                    Генерални партнер
                                </span>

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    id="partner-admin-featured"
                                >

                                <span>
                                    Истакнути партнер
                                </span>

                            </label>


                            <label>

                                <input
                                    type="checkbox"
                                    id="partner-admin-active"
                                    checked
                                >

                                <span>
                                    Активан
                                </span>

                            </label>

                        </div>


                        <div class="partner-admin-field full">

                            <label>
                                ЛОГО ПАРТНЕРА
                            </label>


                            <div class="partner-admin-upload">

                                <div
                                    id="partner-admin-logo-preview"
                                    class="partner-admin-logo-preview"
                                >

                                    <img
                                        src="images/grb.png"
                                        alt=""
                                    >

                                </div>


                                <div class="partner-admin-upload-info">

                                    <input
                                        type="file"
                                        id="partner-admin-logo"
                                        accept="image/jpeg,image/png,image/webp"
                                    >


                                    <span id="partner-admin-logo-name">
                                        Није изабран лого
                                    </span>


                                    <small>
                                        JPG, PNG или WebP.
                                        Максимално 8 MB.
                                    </small>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div
                        id="partner-admin-form-message"
                        class="partner-admin-message"
                    ></div>


                    <div class="partner-admin-form-actions">

                        <button
                            type="button"
                            class="partner-admin-cancel"
                            data-close-partner-modal
                        >
                            ОТКАЖИ
                        </button>


                        <button
                            type="submit"
                            id="partner-admin-save"
                            class="admin-primary-button"
                        >
                            САЧУВАЈ ПАРТНЕРА
                        </button>

                    </div>

                </form>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        modal
            .querySelectorAll(
                "[data-close-partner-modal]"
            )
            .forEach(
                element => {

                    element.addEventListener(
                        "click",
                        closePartnerEditor
                    );

                }
            );


        const form =
            document.querySelector(
                "#partner-admin-form"
            );


        if (form) {

            form.addEventListener(
                "submit",
                savePartner
            );

        }


        const logoInput =
            document.querySelector(
                "#partner-admin-logo"
            );


        if (logoInput) {

            logoInput.addEventListener(
                "change",
                previewPartnerLogo
            );

        }


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    !modal.hidden
                ) {

                    closePartnerEditor();

                }

            }
        );

    }


    /* =====================================================
       OTVARANJE EDITORA
    ===================================================== */

    function openPartnerEditor(
        partner = null
    ) {

        const modal =
            document.querySelector(
                "#partner-admin-modal"
            );


        if (!modal) {
            return;
        }


        resetPartnerForm();


        const title =
            document.querySelector(
                "#partner-admin-modal-title"
            );


        if (partner) {

            title.textContent =
                "Измени партнера";


            document.querySelector(
                "#partner-admin-id"
            ).value =
                partner.id || "";


            document.querySelector(
                "#partner-admin-current-logo"
            ).value =
                partner.logo || "";


            document.querySelector(
                "#partner-admin-name"
            ).value =
                partner.naziv || "";


            document.querySelector(
                "#partner-admin-link"
            ).value =
                partner.link || "";


            document.querySelector(
                "#partner-admin-description"
            ).value =
                partner.opis || "";


            document.querySelector(
                "#partner-admin-order"
            ).value =
                partner.redosled ?? 0;


            document.querySelector(
                "#partner-admin-general"
            ).checked =
                partner.generalni === true;


            document.querySelector(
                "#partner-admin-featured"
            ).checked =
                partner.istaknut === true;


            document.querySelector(
                "#partner-admin-active"
            ).checked =
                partner.aktivan !== false;


            if (partner.logo) {

                document.querySelector(
                    "#partner-admin-logo-preview img"
                ).src =
                    partner.logo;


                document.querySelector(
                    "#partner-admin-logo-name"
                ).textContent =
                    "Тренутни лого";

            }

        }

        else {

            title.textContent =
                "Додај партнера";

        }


        modal.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        setTimeout(
            () => {

                document.querySelector(
                    "#partner-admin-name"
                )?.focus();

            },
            50
        );

    }


    /* =====================================================
       ZATVARANJE
    ===================================================== */

    function closePartnerEditor() {

        const modal =
            document.querySelector(
                "#partner-admin-modal"
            );


        if (!modal) {
            return;
        }


        modal.hidden =
            true;


        document.body.style.overflow =
            "";

    }


    /* =====================================================
       RESET
    ===================================================== */

    function resetPartnerForm() {

        const form =
            document.querySelector(
                "#partner-admin-form"
            );


        if (!form) {
            return;
        }


        form.reset();


        document.querySelector(
            "#partner-admin-id"
        ).value =
            "";


        document.querySelector(
            "#partner-admin-current-logo"
        ).value =
            "";


        document.querySelector(
            "#partner-admin-order"
        ).value =
            "0";


        document.querySelector(
            "#partner-admin-general"
        ).checked =
            false;


        document.querySelector(
            "#partner-admin-featured"
        ).checked =
            false;


        document.querySelector(
            "#partner-admin-active"
        ).checked =
            true;


        document.querySelector(
            "#partner-admin-logo-preview img"
        ).src =
            "images/grb.png";


        document.querySelector(
            "#partner-admin-logo-name"
        ).textContent =
            "Није изабран лого";


        setPartnerMessage(
            "",
            ""
        );

    }


    /* =====================================================
       PREVIEW LOGOA
    ===================================================== */

    function previewPartnerLogo() {

        const input =
            document.querySelector(
                "#partner-admin-logo"
            );


        const file =
            input?.files?.[0];


        if (!file) {
            return;
        }


        try {

            validateImageFile(
                file
            );

        }

        catch (error) {

            setPartnerMessage(
                error.message,
                "error"
            );


            input.value =
                "";

            return;

        }


        document.querySelector(
            "#partner-admin-logo-name"
        ).textContent =
            file.name;


        const objectUrl =
            URL.createObjectURL(
                file
            );


        const image =
            document.querySelector(
                "#partner-admin-logo-preview img"
            );


        image.src =
            objectUrl;


        image.onload =
            () => {

                URL.revokeObjectURL(
                    objectUrl
                );

            };

    }


    /* =====================================================
       ČUVANJE
    ===================================================== */

    async function savePartner(
        event
    ) {

        event.preventDefault();


        setPartnerMessage(
            "",
            ""
        );


        const id =
            document.querySelector(
                "#partner-admin-id"
            )
                ?.value
                .trim();


        const name =
            document.querySelector(
                "#partner-admin-name"
            )
                ?.value
                .trim();


        const description =
            document.querySelector(
                "#partner-admin-description"
            )
                ?.value
                .trim();


        const rawLink =
            document.querySelector(
                "#partner-admin-link"
            )
                ?.value
                .trim();


        const order =
            Number(
                document.querySelector(
                    "#partner-admin-order"
                )?.value || 0
            );


        const general =
            document.querySelector(
                "#partner-admin-general"
            )
                ?.checked === true;


        const featured =
            document.querySelector(
                "#partner-admin-featured"
            )
                ?.checked === true;


        const active =
            document.querySelector(
                "#partner-admin-active"
            )
                ?.checked === true;


        const oldLogo =
            document.querySelector(
                "#partner-admin-current-logo"
            )
                ?.value
                .trim() || "";


        if (!name) {

            setPartnerMessage(
                "Назив партнера је обавезан.",
                "error"
            );

            return;

        }


        let link =
            null;


        if (rawLink) {

            try {

                link =
                    normalizePartnerLink(
                        rawLink
                    );

            }

            catch {

                setPartnerMessage(
                    "Линк није исправан.",
                    "error"
                );

                return;

            }

        }


        const saveButton =
            document.querySelector(
                "#partner-admin-save"
            );


        setSaveButton(
            saveButton,
            true
        );


        let uploadedLogo =
            null;


        try {

            const file =
                document.querySelector(
                    "#partner-admin-logo"
                )
                    ?.files?.[0];


            if (file) {

                uploadedLogo =
                    await uploadPartnerLogo(
                        file,
                        name
                    );

            }


            const logo =
                uploadedLogo ||
                oldLogo ||
                null;


            /*
                Ako je ovaj partner označen
                kao generalni, prethodnom
                generalnom skidamo oznaku.
            */

            if (general) {

                let clearQuery =
                    sb
                        .from(
                            "partneri"
                        )
                        .update({
                            generalni:
                                false
                        })
                        .eq(
                            "generalni",
                            true
                        );


                if (id) {

                    clearQuery =
                        clearQuery.neq(
                            "id",
                            id
                        );

                }


                const {
                    error:
                        clearGeneralError
                } =
                    await clearQuery;


                if (clearGeneralError) {

                    throw clearGeneralError;

                }

            }


            const payload = {

                naziv:
                    name,

                opis:
                    description ||
                    null,

                logo,

                link,

                generalni:
                    general,

                istaknut:
                    featured,

                redosled:
                    Number.isFinite(order)
                        ? order
                        : 0,

                aktivan:
                    active

            };


            let error;


            if (id) {

                const result =
                    await sb
                        .from(
                            "partneri"
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
                    await sb
                        .from(
                            "partneri"
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


            if (
                uploadedLogo &&
                oldLogo &&
                uploadedLogo !== oldLogo
            ) {

                await deletePartnerLogo(
                    oldLogo
                );

            }


            setPartnerMessage(
                "Партнер је успешно сачуван.",
                "success"
            );


            await Promise.allSettled(
                [
                    loadAdminPartners(),
                    loadPartnersCount()
                ]
            );


            setTimeout(
                closePartnerEditor,
                500
            );

        }

        catch (error) {

            console.error(
                "Save partner error:",
                error
            );


            if (uploadedLogo) {

                await deletePartnerLogo(
                    uploadedLogo
                );

            }


            setPartnerMessage(
                friendlyPartnerError(
                    error
                ),
                "error"
            );

        }

        finally {

            setSaveButton(
                saveButton,
                false
            );

        }

    }


    /* =====================================================
       BRISANJE
    ===================================================== */

    async function deletePartner(
        partner
    ) {

        const confirmed =
            window.confirm(
                `Обрисати партнера „${partner.naziv}“?`
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await sb
                .from(
                    "partneri"
                )
                .delete()
                .eq(
                    "id",
                    partner.id
                );


        if (error) {

            console.error(
                "Delete partner error:",
                error
            );


            window.alert(
                "Партнера није могуће обрисати."
            );

            return;

        }


        if (partner.logo) {

            await deletePartnerLogo(
                partner.logo
            );

        }


        await Promise.allSettled(
            [
                loadAdminPartners(),
                loadPartnersCount()
            ]
        );

    }


    /* =====================================================
       STORAGE - UPLOAD
    ===================================================== */

    async function uploadPartnerLogo(
        file,
        partnerName
    ) {

        validateImageFile(
            file
        );


        const extension =
            getFileExtension(
                file
            );


        const safeName =
            createSafeName(
                partnerName
            ) ||
            "partner";


        const path =
            `logos/${Date.now()}-${safeName}.${extension}`;


        const {
            error
        } =
            await sb
                .storage
                .from(
                    PARTNERS_BUCKET
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
            sb
                .storage
                .from(
                    PARTNERS_BUCKET
                )
                .getPublicUrl(
                    path
                );


        if (
            !data ||
            !data.publicUrl
        ) {

            throw new Error(
                "Није добијен URL логоа."
            );

        }


        return data.publicUrl;

    }


    /* =====================================================
       STORAGE - BRISANJE
    ===================================================== */

    async function deletePartnerLogo(
        url
    ) {

        const path =
            getPartnerStoragePath(
                url
            );


        if (!path) {
            return;
        }


        const {
            error
        } =
            await sb
                .storage
                .from(
                    PARTNERS_BUCKET
                )
                .remove(
                    [
                        path
                    ]
                );


        if (error) {

            console.warn(
                "Partner logo delete warning:",
                error
            );

        }

    }


    function getPartnerStoragePath(
        url
    ) {

        try {

            const parsed =
                new URL(
                    url
                );


            const marker =
                `/storage/v1/object/public/${PARTNERS_BUCKET}/`;


            const index =
                parsed.pathname.indexOf(
                    marker
                );


            if (index === -1) {

                return "";

            }


            return decodeURIComponent(
                parsed.pathname.slice(
                    index +
                    marker.length
                )
            );

        }

        catch {

            return "";

        }

    }


    /* =====================================================
       VALIDACIJA
    ===================================================== */

    function validateImageFile(
        file
    ) {

        const allowed =
            [
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


        if (
            !allowed.includes(
                file.type
            )
        ) {

            throw new Error(
                "Лого мора бити JPG, PNG или WebP."
            );

        }


        const maxSize =
            8 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            throw new Error(
                "Лого не сме бити већи од 8 MB."
            );

        }

    }


    function getFileExtension(
        file
    ) {

        const typeMap = {

            "image/jpeg":
                "jpg",

            "image/png":
                "png",

            "image/webp":
                "webp"

        };


        return (
            typeMap[file.type] ||
            file.name
                .split(".")
                .pop()
                .toLowerCase()
        );

    }


    function normalizePartnerLink(
        value
    ) {

        let link =
            String(value)
                .trim();


        if (
            !/^https?:\/\//i.test(
                link
            )
        ) {

            link =
                `https://${link}`;

        }


        const parsed =
            new URL(
                link
            );


        if (
            parsed.protocol !== "http:" &&
            parsed.protocol !== "https:"
        ) {

            throw new Error(
                "Invalid URL"
            );

        }


        return parsed.href;

    }


    /* =====================================================
       PORUKE
    ===================================================== */

    function setPartnerMessage(
        message,
        type
    ) {

        const element =
            document.querySelector(
                "#partner-admin-form-message"
            );


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            "partner-admin-message";


        if (type) {

            element.classList.add(
                type
            );

        }

    }


    function friendlyPartnerError(
        error
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

            return "Storage bucket „partneri“ није пронађен.";

        }


        return (
            message ||
            "Партнер није сачуван."
        );

    }


    function setSaveButton(
        button,
        loading
    ) {

        if (!button) {
            return;
        }


        button.disabled =
            loading;


        button.textContent =
            loading
                ? "ЧУВАЊЕ..."
                : "САЧУВАЈ ПАРТНЕРА";

    }


    /* =====================================================
       SAFE NAME
    ===================================================== */

    function createSafeName(
        value
    ) {

        return String(
            value || ""
        )
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .toLowerCase()
            .replace(
                /đ/g,
                "dj"
            )
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
                60
            );

    }


    /* =====================================================
       ESCAPE
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


    /* =====================================================
       CSS ADMIN PARTNERA
    ===================================================== */

    function injectPartnerStyles() {

        if (
            document.querySelector(
                "#partner-admin-styles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "partner-admin-styles";


        style.textContent = `

            .partner-admin-grid {
                display: grid;
                gap: 14px;
                margin-top: 20px;
            }


            .partner-admin-card {
                display: grid;
                grid-template-columns: 120px 1fr auto;
                align-items: center;
                gap: 20px;

                padding: 18px;

                background: #ffffff;

                border: 1px solid #e5e5e5;
                border-radius: 10px;
            }


            .partner-admin-card.general {
                border: 2px solid #b1093d;

                box-shadow:
                    0 10px 26px
                    rgba(177, 9, 61, 0.13);
            }


            .partner-admin-logo {
                width: 120px;
                height: 90px;

                display: flex;
                align-items: center;
                justify-content: center;

                background: #f7f7f7;

                border-radius: 8px;

                overflow: hidden;
            }


            .partner-admin-logo img {
                width: 100%;
                height: 100%;

                object-fit: contain;

                padding: 10px;
            }


            .partner-admin-no-logo {
                font-size: 40px;

                opacity: .35;
            }


            .partner-admin-card-content h3 {
                margin: 8px 0 6px;

                font-size: 20px;
            }


            .partner-admin-card-content p {
                margin: 0 0 10px;

                color: #666666;

                line-height: 1.5;
            }


            .partner-admin-badges {
                display: flex;
                flex-wrap: wrap;

                gap: 6px;
            }


            .partner-admin-badge {
                padding: 5px 8px;

                border-radius: 4px;

                font-size: 10px;
                font-weight: 700;

                letter-spacing: .5px;
            }


            .partner-admin-badge.active {
                background: #e6f6ec;

                color: #18723a;
            }


            .partner-admin-badge.inactive {
                background: #eeeeee;

                color: #666666;
            }


            .partner-admin-badge.featured {
                background: #fff3d2;

                color: #8a6500;
            }


            .partner-admin-badge.general {
                background: #b1093d;

                color: #ffffff;
            }


            .partner-admin-meta {
                display: flex;
                flex-wrap: wrap;
                align-items: center;

                gap: 15px;

                font-size: 12px;

                color: #777777;
            }


            .partner-admin-link {
                color: #b1093d;

                font-weight: 700;

                text-decoration: none;
            }


            .partner-admin-actions {
                display: flex;
                flex-direction: column;

                gap: 8px;
            }


            .partner-admin-actions button {
                min-width: 85px;

                padding: 9px 12px;

                border: 0;
                border-radius: 5px;

                cursor: pointer;

                font-weight: 700;
            }


            .partner-admin-actions button:first-child {
                background: #111111;

                color: #ffffff;
            }


            .partner-admin-actions .delete {
                background: #f6e5e8;

                color: #a20c2c;
            }


            .partner-admin-empty {
                padding: 30px;

                display: flex;
                flex-direction: column;

                gap: 5px;

                text-align: center;

                border: 1px dashed #dddddd;

                border-radius: 10px;

                color: #777777;
            }


            .partner-admin-modal {
                position: fixed;

                inset: 0;

                z-index: 99999;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 20px;
            }


            .partner-admin-modal[hidden] {
                display: none;
            }


            .partner-admin-overlay {
                position: absolute;

                inset: 0;

                background:
                    rgba(0, 0, 0, .72);
            }


            .partner-admin-dialog {
                position: relative;

                z-index: 2;

                width: min(760px, 100%);
                max-height: 92vh;

                overflow-y: auto;

                background: #ffffff;

                border-radius: 12px;

                box-shadow:
                    0 30px 80px
                    rgba(0, 0, 0, .30);
            }


            .partner-admin-modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;

                gap: 20px;

                padding: 20px 24px;

                border-bottom:
                    1px solid #eeeeee;
            }


            .partner-admin-modal-header span {
                display: block;

                margin-bottom: 3px;

                font-size: 10px;
                font-weight: 700;

                letter-spacing: 1px;

                color: #b1093d;
            }


            .partner-admin-modal-header h2 {
                margin: 0;
            }


            .partner-admin-close {
                width: 38px;
                height: 38px;

                border: 0;
                border-radius: 50%;

                background: #f1f1f1;

                font-size: 24px;

                cursor: pointer;
            }


            .partner-admin-form {
                padding: 24px;
            }


            .partner-admin-form-grid {
                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 18px;
            }


            .partner-admin-field {
                display: flex;
                flex-direction: column;

                gap: 7px;
            }


            .partner-admin-field.full {
                grid-column: 1 / -1;
            }


            .partner-admin-field label {
                font-size: 11px;
                font-weight: 700;

                letter-spacing: .7px;
            }


            .partner-admin-field input,
            .partner-admin-field textarea {
                width: 100%;

                padding: 12px 13px;

                border: 1px solid #d7d7d7;
                border-radius: 6px;

                font: inherit;

                outline: none;
            }


            .partner-admin-field input:focus,
            .partner-admin-field textarea:focus {
                border-color: #b1093d;
            }


            .partner-admin-checks {
                display: flex;
                align-items: center;
                flex-wrap: wrap;

                gap: 16px;

                padding-top: 24px;
            }


            .partner-admin-checks label {
                display: flex;
                align-items: center;

                gap: 7px;

                cursor: pointer;
            }


            .partner-admin-upload {
                display: grid;

                grid-template-columns:
                    150px 1fr;

                gap: 18px;

                padding: 15px;

                border: 1px solid #dddddd;
                border-radius: 8px;

                background: #fafafa;
            }


            .partner-admin-logo-preview {
                height: 110px;

                display: flex;
                align-items: center;
                justify-content: center;

                background: #ffffff;

                border-radius: 7px;

                overflow: hidden;
            }


            .partner-admin-logo-preview img {
                width: 100%;
                height: 100%;

                object-fit: contain;

                padding: 10px;
            }


            .partner-admin-upload-info {
                display: flex;
                flex-direction: column;
                justify-content: center;

                gap: 8px;
            }


            .partner-admin-upload-info small {
                color: #777777;
            }


            .partner-admin-message {
                min-height: 22px;

                margin-top: 15px;

                font-size: 13px;
            }


            .partner-admin-message.error {
                color: #b1093d;
            }


            .partner-admin-message.success {
                color: #18723a;
            }


            .partner-admin-form-actions {
                display: flex;
                justify-content: flex-end;

                gap: 10px;

                margin-top: 10px;
            }


            .partner-admin-cancel {
                padding: 11px 17px;

                border: 1px solid #dddddd;
                border-radius: 5px;

                background: #ffffff;

                cursor: pointer;
            }


            @media (max-width: 700px) {

                .partner-admin-card {
                    grid-template-columns:
                        80px 1fr;
                }


                .partner-admin-logo {
                    width: 80px;
                    height: 70px;
                }


                .partner-admin-actions {
                    grid-column: 1 / -1;

                    flex-direction: row;
                }


                .partner-admin-form-grid {
                    grid-template-columns:
                        1fr;
                }


                .partner-admin-field.full {
                    grid-column: auto;
                }


                .partner-admin-checks {
                    padding-top: 0;
                }


                .partner-admin-upload {
                    grid-template-columns:
                        1fr;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }


})();