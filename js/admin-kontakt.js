/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   ADMIN - KONTAKT
========================================================= */

(() => {

    const CONTACT_ADMIN_SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const CONTACT_ADMIN_SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    const contactAdminSb =
        window.supabase.createClient(
            CONTACT_ADMIN_SUPABASE_URL,
            CONTACT_ADMIN_SUPABASE_KEY
        );


    let adminContacts = [];



    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        setupContactAdmin
    );


    function setupContactAdmin() {

        injectContactAdminStyles();

        createContactModal();


        const addButton =
            document.querySelector(
                "#admin-add-contact"
            );


        if (addButton) {

            addButton.addEventListener(
                "click",
                () => {

                    openContactModal();

                }
            );

        }


        const navButton =
            document.querySelector(
                '[data-admin-page="kontakt"]'
            );


        if (navButton) {

            navButton.addEventListener(
                "click",
                () => {

                    loadAdminContacts();

                }
            );

        }


        const list =
            document.querySelector(
                "#admin-contact-list"
            );


        if (list) {

            list.addEventListener(
                "click",
                handleContactListClick
            );

        }

    }



    /* =====================================================
       UČITAVANJE
    ===================================================== */

    async function loadAdminContacts() {

        const container =
            document.querySelector(
                "#admin-contact-list"
            );


        if (!container) {
            return;
        }


        container.innerHTML = `

            <div class="admin-data-loading">

                <div class="loader"></div>

                <span>
                    Учитавање контакт података...
                </span>

            </div>

        `;


        const {
            data,
            error
        } =
            await contactAdminSb
                .from("kontakt")
                .select(
                    "id,tip,naziv,vrednost,link,redosled,aktivan,created_at,updated_at"
                )
                .order(
                    "redosled",
                    {
                        ascending: true
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending: true
                    }
                );


        if (error) {

            console.error(
                "Contact load error:",
                error
            );


            container.innerHTML = `

                <div class="contact-admin-empty">

                    Контакт податке није могуће учитати.

                </div>

            `;

            return;

        }


        adminContacts =
            Array.isArray(data)
                ? data
                : [];


        renderAdminContacts();

    }



    /* =====================================================
       PRIKAZ
    ===================================================== */

    function renderAdminContacts() {

        const container =
            document.querySelector(
                "#admin-contact-list"
            );


        if (!container) {
            return;
        }


        if (!adminContacts.length) {

            container.innerHTML = `

                <div class="contact-admin-empty">

                    <strong>
                        Још нема контакт података
                    </strong>

                    <span>
                        Кликните на „Додај контакт“
                        да унесете први контакт.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="contact-admin-grid">

                ${adminContacts
                    .map(renderContactCard)
                    .join("")}

            </div>

        `;

    }



    function renderContactCard(
        item
    ) {

        const typeLabel =
            getContactTypeLabel(
                item.tip
            );


        return `

            <article class="contact-admin-card">

                <div class="contact-admin-main">

                    <div class="contact-admin-top">

                        <span class="contact-admin-type">
                            ${escapeHtml(typeLabel)}
                        </span>

                        <span
                            class="${
                                item.aktivan
                                    ? "contact-admin-status active"
                                    : "contact-admin-status inactive"
                            }"
                        >
                            ${
                                item.aktivan
                                    ? "АКТИВАН"
                                    : "НЕАКТИВАН"
                            }
                        </span>

                    </div>


                    <h3>
                        ${escapeHtml(item.naziv || "")}
                    </h3>


                    <strong class="contact-admin-value">

                        ${escapeHtml(item.vrednost || "")}

                    </strong>


                    <div class="contact-admin-meta">

                        <span>
                            Редослед:
                            <b>
                                ${Number(item.redosled || 0)}
                            </b>
                        </span>


                        ${
                            item.link
                                ? `
                                    <a
                                        href="${escapeAttribute(item.link)}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        ОТВОРИ ЛИНК ↗
                                    </a>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div class="contact-admin-actions">

                    <button
                        type="button"
                        data-edit-contact="${escapeAttribute(item.id)}"
                    >
                        ИЗМЕНИ
                    </button>


                    <button
                        type="button"
                        class="delete"
                        data-delete-contact="${escapeAttribute(item.id)}"
                    >
                        ОБРИШИ
                    </button>

                </div>

            </article>

        `;

    }



    /* =====================================================
       KLIKOVI
    ===================================================== */

    function handleContactListClick(
        event
    ) {

        const edit =
            event.target.closest(
                "[data-edit-contact]"
            );


        if (edit) {

            const item =
                adminContacts.find(
                    contact =>
                        contact.id ===
                        edit.dataset
                            .editContact
                );


            if (item) {

                openContactModal(
                    item
                );

            }


            return;

        }


        const remove =
            event.target.closest(
                "[data-delete-contact]"
            );


        if (remove) {

            const item =
                adminContacts.find(
                    contact =>
                        contact.id ===
                        remove.dataset
                            .deleteContact
                );


            if (item) {

                deleteContact(
                    item
                );

            }

        }

    }



    /* =====================================================
       MODAL
    ===================================================== */

    function createContactModal() {

        if (
            document.querySelector(
                "#contact-admin-modal"
            )
        ) {
            return;
        }


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "contact-admin-modal";

        modal.className =
            "contact-admin-modal";

        modal.hidden =
            true;


        modal.innerHTML = `

            <div
                class="contact-admin-overlay"
                data-close-contact-modal
            ></div>


            <div class="contact-admin-dialog">


                <div class="contact-admin-modal-header">

                    <div>

                        <span>
                            КОНТАКТ ПОДАЦИ
                        </span>

                        <h2 id="contact-admin-modal-title">
                            Додај контакт
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="contact-admin-close"
                        data-close-contact-modal
                        aria-label="Затвори"
                    >
                        ×
                    </button>

                </div>



                <form
                    id="contact-admin-form"
                    class="contact-admin-form"
                >

                    <input
                        type="hidden"
                        id="contact-admin-id"
                    >


                    <div class="contact-admin-form-grid">


                        <div class="contact-admin-field">

                            <label for="contact-admin-type">
                                ТИП КОНТАКТА *
                            </label>

                            <select
                                id="contact-admin-type"
                                required
                            >

                                <option value="telefon">
                                    Телефон
                                </option>

                                <option value="email">
                                    E-mail
                                </option>

                                <option value="adresa">
                                    Адреса
                                </option>

                                <option value="instagram">
                                    Instagram
                                </option>

                                <option value="facebook">
                                    Facebook
                                </option>

                                <option value="youtube">
                                    YouTube
                                </option>

                                <option value="website">
                                    Веб сајт
                                </option>

                                <option value="ostalo">
                                    Остало
                                </option>

                            </select>

                        </div>


                        <div class="contact-admin-field">

                            <label for="contact-admin-name">
                                НАЗИВ *
                            </label>

                            <input
                                type="text"
                                id="contact-admin-name"
                                placeholder="Нпр. ТЕЛЕФОН"
                                required
                            >

                        </div>


                        <div class="contact-admin-field full">

                            <label for="contact-admin-value">
                                ПОДАТАК *
                            </label>

                            <input
                                type="text"
                                id="contact-admin-value"
                                placeholder="Нпр. 064 123 45 67"
                                required
                            >

                        </div>


                        <div class="contact-admin-field full">

                            <label for="contact-admin-link">
                                ЛИНК
                            </label>

                            <input
                                type="text"
                                id="contact-admin-link"
                                placeholder="Оставите празно ако није потребно"
                            >

                            <small>
                                За телефон и e-mail линк може
                                аутоматски да се направи.
                            </small>

                        </div>


                        <div class="contact-admin-field">

                            <label for="contact-admin-order">
                                РЕДОСЛЕД
                            </label>

                            <input
                                type="number"
                                id="contact-admin-order"
                                value="0"
                                min="0"
                                step="1"
                            >

                        </div>


                        <div class="contact-admin-check">

                            <label>

                                <input
                                    type="checkbox"
                                    id="contact-admin-active"
                                    checked
                                >

                                <span>
                                    Активан контакт
                                </span>

                            </label>

                        </div>


                    </div>


                    <div
                        id="contact-admin-message"
                        class="contact-admin-message"
                    ></div>


                    <div class="contact-admin-form-actions">

                        <button
                            type="button"
                            class="contact-admin-cancel"
                            data-close-contact-modal
                        >
                            ОТКАЖИ
                        </button>


                        <button
                            type="submit"
                            id="contact-admin-save"
                            class="admin-primary-button"
                        >
                            САЧУВАЈ
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
                "[data-close-contact-modal]"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        closeContactModal
                    );

                }
            );


        document
            .querySelector(
                "#contact-admin-form"
            )
            ?.addEventListener(
                "submit",
                saveContact
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    !modal.hidden
                ) {

                    closeContactModal();

                }

            }
        );


        document
            .querySelector(
                "#contact-admin-type"
            )
            ?.addEventListener(
                "change",
                handleContactTypeChange
            );

    }



    /* =====================================================
       OTVARANJE
    ===================================================== */

    function openContactModal(
        item = null
    ) {

        const modal =
            document.querySelector(
                "#contact-admin-modal"
            );


        if (!modal) {
            return;
        }


        resetContactForm();


        const title =
            document.querySelector(
                "#contact-admin-modal-title"
            );


        if (item) {

            title.textContent =
                "Измени контакт";


            document.querySelector(
                "#contact-admin-id"
            ).value =
                item.id || "";


            document.querySelector(
                "#contact-admin-type"
            ).value =
                item.tip || "ostalo";


            document.querySelector(
                "#contact-admin-name"
            ).value =
                item.naziv || "";


            document.querySelector(
                "#contact-admin-value"
            ).value =
                item.vrednost || "";


            document.querySelector(
                "#contact-admin-link"
            ).value =
                item.link || "";


            document.querySelector(
                "#contact-admin-order"
            ).value =
                item.redosled ?? 0;


            document.querySelector(
                "#contact-admin-active"
            ).checked =
                item.aktivan !== false;

        }

        else {

            title.textContent =
                "Додај контакт";


            handleContactTypeChange();

        }


        modal.hidden =
            false;


        document.body.style.overflow =
            "hidden";


        setTimeout(
            () => {

                document.querySelector(
                    "#contact-admin-name"
                )?.focus();

            },
            50
        );

    }



    /* =====================================================
       ZATVARANJE
    ===================================================== */

    function closeContactModal() {

        const modal =
            document.querySelector(
                "#contact-admin-modal"
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

    function resetContactForm() {

        const form =
            document.querySelector(
                "#contact-admin-form"
            );


        if (!form) {
            return;
        }


        form.reset();


        document.querySelector(
            "#contact-admin-id"
        ).value =
            "";


        document.querySelector(
            "#contact-admin-order"
        ).value =
            "0";


        document.querySelector(
            "#contact-admin-active"
        ).checked =
            true;


        setContactMessage(
            "",
            ""
        );

    }



    /* =====================================================
       TIP KONTAKTA
    ===================================================== */

    function handleContactTypeChange() {

        const type =
            document.querySelector(
                "#contact-admin-type"
            )?.value;


        const name =
            document.querySelector(
                "#contact-admin-name"
            );


        const value =
            document.querySelector(
                "#contact-admin-value"
            );


        if (
            !name ||
            !value
        ) {
            return;
        }


        const presets = {

            telefon: {
                name: "ТЕЛЕФОН",
                placeholder:
                    "Нпр. 064 123 45 67"
            },

            email: {
                name: "E-MAIL",
                placeholder:
                    "Нпр. klub@example.com"
            },

            adresa: {
                name: "АДРЕСА",
                placeholder:
                    "Нпр. Нови Кнежевац"
            },

            instagram: {
                name: "INSTAGRAM",
                placeholder:
                    "Нпр. @fkobilic"
            },

            facebook: {
                name: "FACEBOOK",
                placeholder:
                    "Нпр. ФК Обилић"
            },

            youtube: {
                name: "YOUTUBE",
                placeholder:
                    "Назив YouTube канала"
            },

            website: {
                name: "ВЕБ САЈТ",
                placeholder:
                    "Нпр. www..."
            },

            ostalo: {
                name: "",
                placeholder:
                    "Унесите контакт податак"
            }

        };


        const preset =
            presets[type];


        if (!preset) {
            return;
        }


        if (
            !document.querySelector(
                "#contact-admin-id"
            )?.value
        ) {

            name.value =
                preset.name;

        }


        value.placeholder =
            preset.placeholder;

    }



    /* =====================================================
       ČUVANJE
    ===================================================== */

    async function saveContact(
        event
    ) {

        event.preventDefault();


        setContactMessage(
            "",
            ""
        );


        const id =
            document.querySelector(
                "#contact-admin-id"
            )
                ?.value
                .trim() || "";


        const type =
            document.querySelector(
                "#contact-admin-type"
            )
                ?.value
                .trim();


        const name =
            document.querySelector(
                "#contact-admin-name"
            )
                ?.value
                .trim();


        const value =
            document.querySelector(
                "#contact-admin-value"
            )
                ?.value
                .trim();


        let link =
            document.querySelector(
                "#contact-admin-link"
            )
                ?.value
                .trim() || "";


        const order =
            Number(
                document.querySelector(
                    "#contact-admin-order"
                )?.value || 0
            );


        const active =
            document.querySelector(
                "#contact-admin-active"
            )?.checked === true;


        if (
            !type ||
            !name ||
            !value
        ) {

            setContactMessage(
                "Попуните сва обавезна поља.",
                "error"
            );

            return;

        }


        /*
            Ako link nije ručno unet,
            napravi ga automatski
            za telefon i email.
        */

        if (!link) {

            link =
                createAutomaticContactLink(
                    type,
                    value
                );

        }

        else {

            link =
                normalizeContactLink(
                    type,
                    link
                );

        }


        const payload = {

            tip:
                type,

            naziv:
                name,

            vrednost:
                value,

            link:
                link || null,

            redosled:
                Number.isFinite(order)
                    ? order
                    : 0,

            aktivan:
                active

        };


        const button =
            document.querySelector(
                "#contact-admin-save"
            );


        setContactSaveLoading(
            button,
            true
        );


        try {

            let error;


            if (id) {

                const result =
                    await contactAdminSb
                        .from("kontakt")
                        .update(payload)
                        .eq(
                            "id",
                            id
                        );


                error =
                    result.error;

            }

            else {

                const result =
                    await contactAdminSb
                        .from("kontakt")
                        .insert(payload);


                error =
                    result.error;

            }


            if (error) {

                throw error;

            }


            setContactMessage(
                "Контакт је успешно сачуван.",
                "success"
            );


            await loadAdminContacts();


            setTimeout(
                closeContactModal,
                450
            );

        }

        catch (error) {

            console.error(
                "Contact save error:",
                error
            );


            setContactMessage(
                getContactFriendlyError(
                    error
                ),
                "error"
            );

        }

        finally {

            setContactSaveLoading(
                button,
                false
            );

        }

    }



    /* =====================================================
       BRISANJE
    ===================================================== */

    async function deleteContact(
        item
    ) {

        const confirmed =
            window.confirm(
                `Обрисати контакт „${item.naziv}“?`
            );


        if (!confirmed) {
            return;
        }


        const {
            error
        } =
            await contactAdminSb
                .from("kontakt")
                .delete()
                .eq(
                    "id",
                    item.id
                );


        if (error) {

            console.error(
                "Contact delete error:",
                error
            );


            window.alert(
                "Контакт није могуће обрисати."
            );

            return;

        }


        await loadAdminContacts();

    }



    /* =====================================================
       AUTOMATSKI LINK
    ===================================================== */

    function createAutomaticContactLink(
        type,
        value
    ) {

        if (
            type === "telefon"
        ) {

            let phone =
                value.replace(
                    /[^0-9+]/g,
                    ""
                );


            if (
                phone.startsWith("0")
            ) {

                phone =
                    "+381" +
                    phone.slice(1);

            }


            return `tel:${phone}`;

        }


        if (
            type === "email"
        ) {

            return `mailto:${value}`;

        }


        return "";

    }



    /* =====================================================
       NORMALIZACIJA LINKA
    ===================================================== */

    function normalizeContactLink(
        type,
        link
    ) {

        if (
            type === "telefon" &&
            !link.startsWith("tel:")
        ) {

            return createAutomaticContactLink(
                "telefon",
                link
            );

        }


        if (
            type === "email" &&
            !link.startsWith("mailto:")
        ) {

            return `mailto:${link}`;

        }


        if (
            link.startsWith("tel:") ||
            link.startsWith("mailto:")
        ) {

            return link;

        }


        if (
            !/^https?:\/\//i.test(
                link
            )
        ) {

            return `https://${link}`;

        }


        return link;

    }



    /* =====================================================
       LABELA TIPA
    ===================================================== */

    function getContactTypeLabel(
        type
    ) {

        const labels = {

            telefon:
                "ТЕЛЕФОН",

            email:
                "E-MAIL",

            adresa:
                "АДРЕСА",

            instagram:
                "INSTAGRAM",

            facebook:
                "FACEBOOK",

            youtube:
                "YOUTUBE",

            website:
                "ВЕБ САЈТ",

            ostalo:
                "КОНТАКТ"

        };


        return (
            labels[type] ||
            "КОНТАКТ"
        );

    }



    /* =====================================================
       PORUKA
    ===================================================== */

    function setContactMessage(
        message,
        type
    ) {

        const element =
            document.querySelector(
                "#contact-admin-message"
            );


        if (!element) {
            return;
        }


        element.textContent =
            message;


        element.className =
            "contact-admin-message";


        if (type) {

            element.classList.add(
                type
            );

        }

    }



    function getContactFriendlyError(
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


        return (
            message ||
            "Контакт није сачуван."
        );

    }



    function setContactSaveLoading(
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
                : "САЧУВАЈ";

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
       CSS
    ===================================================== */

    function injectContactAdminStyles() {

        if (
            document.querySelector(
                "#contact-admin-styles"
            )
        ) {
            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "contact-admin-styles";


        style.textContent = `

            .contact-admin-grid {
                display: grid;
                gap: 14px;
                margin-top: 20px;
            }

            .contact-admin-card {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 20px;
                align-items: center;

                padding: 20px;

                background: #fff;
                border: 1px solid #e5e5e5;
                border-radius: 10px;
            }

            .contact-admin-top {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 8px;
                margin-bottom: 8px;
            }

            .contact-admin-type {
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 1px;
                color: #b1093d;
            }

            .contact-admin-status {
                padding: 4px 7px;
                border-radius: 4px;
                font-size: 9px;
                font-weight: 700;
            }

            .contact-admin-status.active {
                background: #e7f7ec;
                color: #18723a;
            }

            .contact-admin-status.inactive {
                background: #eee;
                color: #666;
            }

            .contact-admin-card h3 {
                margin: 0 0 7px;
                font-size: 19px;
            }

            .contact-admin-value {
                display: block;
                font-size: 15px;
                margin-bottom: 11px;
            }

            .contact-admin-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 14px;

                font-size: 12px;
                color: #777;
            }

            .contact-admin-meta a {
                color: #b1093d;
                font-weight: 700;
                text-decoration: none;
            }

            .contact-admin-actions {
                display: flex;
                gap: 8px;
            }

            .contact-admin-actions button {
                padding: 10px 14px;
                border: 0;
                border-radius: 6px;

                cursor: pointer;
                font-weight: 700;
            }

            .contact-admin-actions button:not(.delete) {
                background: #191919;
                color: #fff;
            }

            .contact-admin-actions .delete {
                background: #f7e3e8;
                color: #a50031;
            }

            .contact-admin-empty {
                margin-top: 20px;
                padding: 40px 20px;

                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;

                text-align: center;

                background: #fff;
                border: 1px dashed #ccc;
                border-radius: 10px;
            }

            .contact-admin-empty span {
                color: #777;
            }


            /* MODAL */

            .contact-admin-modal[hidden] {
                display: none !important;
            }

            .contact-admin-modal {
                position: fixed;
                inset: 0;
                z-index: 9999;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 20px;
            }

            .contact-admin-overlay {
                position: absolute;
                inset: 0;

                background: rgba(0,0,0,.72);
                backdrop-filter: blur(4px);
            }

            .contact-admin-dialog {
                position: relative;
                z-index: 2;

                width: min(720px, 100%);
                max-height: calc(100vh - 40px);
                overflow-y: auto;

                background: #fff;
                border-radius: 12px;

                box-shadow:
                    0 25px 70px rgba(0,0,0,.35);
            }

            .contact-admin-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;

                padding: 22px 24px;

                border-bottom: 1px solid #e8e8e8;
            }

            .contact-admin-modal-header span {
                display: block;
                margin-bottom: 4px;

                font-size: 11px;
                font-weight: 700;
                letter-spacing: 1.5px;

                color: #b1093d;
            }

            .contact-admin-modal-header h2 {
                margin: 0;
            }

            .contact-admin-close {
                width: 40px;
                height: 40px;

                border: 0;
                border-radius: 50%;

                background: #f2f2f2;

                font-size: 26px;
                cursor: pointer;
            }

            .contact-admin-form {
                padding: 24px;
            }

            .contact-admin-form-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 18px;
            }

            .contact-admin-field {
                display: flex;
                flex-direction: column;
                gap: 7px;
            }

            .contact-admin-field.full {
                grid-column: 1 / -1;
            }

            .contact-admin-field label {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: .7px;
            }

            .contact-admin-field input,
            .contact-admin-field select {
                width: 100%;

                padding: 12px 13px;

                border: 1px solid #d7d7d7;
                border-radius: 6px;

                font: inherit;
                background: #fff;
                outline: none;
            }

            .contact-admin-field input:focus,
            .contact-admin-field select:focus {
                border-color: #b1093d;
            }

            .contact-admin-field small {
                color: #777;
                line-height: 1.5;
            }

            .contact-admin-check {
                display: flex;
                align-items: center;
                padding-top: 25px;
            }

            .contact-admin-check label {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
            }

            .contact-admin-message {
                min-height: 24px;
                margin-top: 18px;

                font-size: 13px;
                font-weight: 600;
            }

            .contact-admin-message.success {
                color: #18813d;
            }

            .contact-admin-message.error {
                color: #b00030;
            }

            .contact-admin-form-actions {
                display: flex;
                justify-content: flex-end;
                gap: 10px;

                margin-top: 20px;
                padding-top: 20px;

                border-top: 1px solid #eee;
            }

            .contact-admin-cancel {
                padding: 11px 18px;

                border: 1px solid #ccc;
                border-radius: 6px;

                background: #fff;
                cursor: pointer;
                font-weight: 700;
            }


            @media (max-width: 650px) {

                .contact-admin-card {
                    grid-template-columns: 1fr;
                }

                .contact-admin-actions {
                    width: 100%;
                }

                .contact-admin-actions button {
                    flex: 1;
                }

                .contact-admin-form-grid {
                    grid-template-columns: 1fr;
                }

                .contact-admin-field.full {
                    grid-column: auto;
                }

                .contact-admin-check {
                    padding-top: 0;
                }

            }

        `;


        document.head.appendChild(
            style
        );

    }

})();