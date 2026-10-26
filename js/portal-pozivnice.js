
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   POZIVNICE ZA PORTAL - KORAK 3

   Dodavanje novih korisnika preko uprave.
   Povezivanje sa postojecim osobama na sajtu.

   Vazno:
   Slanje je privremeno iskljuceno dok
   ne objavimo stranicu za aktivaciju.
===================================================== */

(() => {
    "use strict";

    if (window.__fkObilicPozivniceLoaded) {
        return;
    }

    window.__fkObilicPozivniceLoaded = true;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "FK Obilic: Supabase nije dostupan."
        );
        return;
    }

    // Ukljucicemo nakon objavljivanja
    // stranice portal-aktivacija.html.

    
const ENABLE_INVITATIONS = true;


    const SOURCES = {
        igraci: "ИГРАЧ",
        strucni_stab: "ТРЕНЕР",
        uprava: "УПРАВА"
    };

    const state = {
        candidates: [],
        loading: false,
        sending: false
    };

    let modal = null;

    /* ================================================
       POMOCNE FUNKCIJE
    ================================================= */

    function h(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function get(id) {
        return document.getElementById(id);
    }

    function showMessage(text, error = false) {
        const element = get("fk-invite-message");

        if (!element) return;

        element.textContent = text;
        element.classList.toggle(
            "is-error",
            error
        );
    }

    function validEmail(email) {
        return (
            email.length <= 254 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        );
    }

    function safePhoto(value) {
        if (!value) return "";

        try {
            const url = new URL(
                String(value),
                window.location.href
            );

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                return "";
            }

            return url.href;

        } catch {
            return "";
        }
    }

    /* ================================================
       CSS
    ================================================= */

    function addStyles() {
        if (get("fk-invite-styles")) return;

        const style = document.createElement("style");

        style.id = "fk-invite-styles";

        style.textContent = `
            #fk-invite-open {
                background: #c41e32;
                border: 1px solid #c41e32;
                color: #fff;
                padding: 11px 15px;
                border-radius: 9px;
                cursor: pointer;
                font-weight: 800;
                font-size: 12px;
            }

            #fk-invite-open:hover {
                background: #a8192a;
            }

            #fk-invite-modal[hidden] {
                display: none !important;
            }

            #fk-invite-modal {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                box-sizing: border-box;
            }

            .fk-invite-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.75);
            }

            .fk-invite-dialog {
                position: relative;
                z-index: 1;
                background: #fff;
                color: #222;
                width: min(100%, 560px);
                max-height: 90vh;
                overflow-y: auto;
                border-radius: 18px;
                padding: 25px;
                box-sizing: border-box;
                box-shadow: 0 18px 60px rgba(0,0,0,.3);
            }

            .fk-invite-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 15px;
                margin-bottom: 22px;
            }

            .fk-invite-header span {
                display: block;
                color: #c41e32;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1px;
                margin-bottom: 5px;
            }

            .fk-invite-header h2 {
                margin: 0;
                font-size: 25px;
                color: #222;
                font-family: Oswald, sans-serif;
            }

            .fk-invite-close {
                border: none;
                background: #f1f2f4;
                color: #222;
                width: 35px;
                height: 35px;
                border-radius: 50%;
                font-size: 23px;
                cursor: pointer;
            }

            .fk-invite-form {
                display: grid;
                gap: 16px;
            }

            .fk-invite-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .fk-invite-field label {
                font-size: 11px;
                font-weight: 800;
                color: #555;
            }

            .fk-invite-field input,
            .fk-invite-field select {
                box-sizing: border-box;
                width: 100%;
                padding: 12px;
                font-size: 14px;
                color: #222;
                background: #fff;
                border: 1px solid #dcdfe4;
                border-radius: 10px;
            }

            .fk-invite-profile {
                display: flex;
                align-items: center;
                gap: 13px;
                padding: 15px;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                background: #f8f8f9;
                min-height: 60px;
            }

            .fk-invite-profile img {
                width: 62px;
                height: 62px;
                flex-shrink: 0;
                border-radius: 10px;
                object-fit: cover;
                background: #ddd;
            }

            .fk-invite-profile strong {
                display: block;
                margin-bottom: 5px;
                font-size: 15px;
            }

            .fk-invite-profile small {
                display: block;
                font-size: 12px;
                color: #666;
                line-height: 1.6;
            }

            .fk-invite-muted {
                margin: 0;
                color: #777;
                font-size: 12px;
                line-height: 1.6;
            }

            .fk-invite-warning {
                padding: 12px;
                background: #fff7e8;
                border: 1px solid #f0ddad;
                border-radius: 10px;
                color: #7a561a;
                font-size: 12px;
                line-height: 1.6;
            }

            .fk-invite-message {
                min-height: 18px;
                margin: 0;
                color: #16804c;
                font-size: 12px;
                line-height: 1.6;
            }

            .fk-invite-message.is-error {
                color: #b91c34;
            }

            .fk-invite-submit {
                width: 100%;
                padding: 14px;
                border: none;
                border-radius: 10px;
                background: #c41e32;
                color: #fff;
                font-size: 13px;
                font-weight: 800;
                cursor: pointer;
            }

            .fk-invite-submit:disabled {
                opacity: .6;
                cursor: not-allowed;
            }

            @media (max-width: 600px) {
                .fk-invite-dialog {
                    padding: 18px;
                }

                .fk-invite-header h2 {
                    font-size: 22px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* ================================================
       KREIRANJE PROZORA
    ================================================= */

    function createModal() {
        if (modal) return;

        addStyles();

        modal = document.createElement("div");

        modal.id = "fk-invite-modal";
        modal.hidden = true;

        modal.setAttribute(
            "role",
            "dialog"
        );

        modal.setAttribute(
            "aria-modal",
            "true"
        );

        modal.setAttribute(
            "aria-labelledby",
            "fk-invite-title"
        );

        modal.innerHTML = `

            <div
                class="fk-invite-backdrop"
                data-invite-close
            ></div>

            <div class="fk-invite-dialog">

                <div class="fk-invite-header">

                    <div>
                        <span>
                            ФК ОБИЛИЋ · УПРАВА
                        </span>

                        <h2 id="fk-invite-title">
                            ДОДАЈ КОРИСНИКА
                        </h2>
                    </div>

                    <button
                        type="button"
                        class="fk-invite-close"
                        data-invite-close
                        aria-label="Затвори"
                    >
                        ×
                    </button>

                </div>

                <form
                    id="fk-invite-form"
                    class="fk-invite-form"
                >

                    <div class="fk-invite-field">

                        <label for="fk-invite-source">
                            УЛОГА У ПОРТАЛУ
                        </label>

                        <select
                            id="fk-invite-source"
                            required
                        >
                            <option value="igraci">
                                Играч
                            </option>

                            <option value="strucni_stab">
                                Тренер
                            </option>

                            <option value="uprava">
                                Управа
                            </option>
                        </select>

                    </div>

                    <div class="fk-invite-field">

                        <label for="fk-invite-search">
                            ПРЕТРАЖИ ОСОБУ
                        </label>

                        <input
                            id="fk-invite-search"
                            type="search"
                            placeholder="Унеси име или презиме..."
                            autocomplete="off"
                        >

                    </div>

                    <div class="fk-invite-field">

                        <label for="fk-invite-person">
                            ОСОБА СА САЈТА
                        </label>

                        <select
                            id="fk-invite-person"
                            required
                        >
                            <option value="">
                                Учитавање...
                            </option>
                        </select>

                    </div>

                    <div
                        id="fk-invite-profile"
                        class="fk-invite-profile"
                    >
                        <p class="fk-invite-muted">
                            Изабери особу са списка.
                        </p>
                    </div>

                    <div class="fk-invite-field">

                        <label for="fk-invite-email">
                            Е-МАИЛ АДРЕСА
                        </label>

                        <input
                            id="fk-invite-email"
                            type="email"
                            placeholder="primer@gmail.com"
                            maxlength="254"
                            autocomplete="off"
                            required
                        >

                    </div>

                    <p class="fk-invite-muted">
                        Корисник ће на ову адресу
                        добити позивницу и сам
                        поставити своју лозинку.
                    </p>

                    <div
                        id="fk-invite-warning"
                        class="fk-invite-warning"
                    >
                        Позивнице ћемо укључити
                        након што поставимо
                        страницу за активацију.
                    </div>

                    <p
                        id="fk-invite-message"
                        class="fk-invite-message"
                        role="status"
                    ></p>

                    <button
                        id="fk-invite-submit"
                        type="submit"
                        class="fk-invite-submit"
                        disabled
                    >
                        ПОШАЉИ ПОЗИВНИЦУ
                    </button>

                </form>

            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "[data-invite-close]"
                    )
                ) {
                    closeModal();
                }

            }
        );

        get("fk-invite-source")
            .addEventListener(
                "change",
                renderCandidates
            );

        get("fk-invite-search")
            .addEventListener(
                "input",
                renderCandidates
            );

        get("fk-invite-person")
            .addEventListener(
                "change",
                renderProfile
            );

        get("fk-invite-email")
            .addEventListener(
                "input",
                updateSubmitButton
            );

        get("fk-invite-form")
            .addEventListener(
                "submit",
                sendInvitation
            );

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    !modal.hidden
                ) {
                    closeModal();
                }

            }
        );
    }

    /* ================================================
       DUGME U POSTOJECOJ UPRAVI
    ================================================= */

    function addButton() {
        const screen = get(
            "portal-users-screen"
        );

        if (!screen) return;

        const toolbar = screen.querySelector(
            ".portal-account-panel-top"
        );

        if (!toolbar) return;

        if (
            screen.querySelector(
                "#fk-invite-open"
            )
        ) {
            return;
        }

        const button =
            document.createElement("button");

        button.id = "fk-invite-open";
        button.type = "button";

        button.textContent =
            "+ ДОДАЈ КОРИСНИКА";

        toolbar.appendChild(button);
    }

    /* ================================================
       OTVARANJE
    ================================================= */

    async function openModal() {
        createModal();

        modal.hidden = false;

        get("fk-invite-form").reset();

        get("fk-invite-source").value =
            "igraci";

        state.candidates = [];

        state.loading = true;

        showMessage("Учитавање особа са сајта...");

        renderCandidates();

        try {

            const {
                data,
                error
            } = await sb.rpc(
                "portal_uprava_kandidati_za_nalog"
            );

            if (error) {
                throw error;
            }

            if (modal.hidden) return;

            state.candidates =
                Array.isArray(data)
                    ? data
                    : [];

            showMessage("");

        } catch (error) {

            console.error(
                "FK Obilic - kandidati:",
                error
            );

            showMessage(
                "Учитавање није успело: " +
                (error.message || "грешка"),
                true
            );

        } finally {

            state.loading = false;

            if (!modal.hidden) {
                renderCandidates();
            }

        }
    }

    function closeModal() {
        if (!modal) return;

        if (state.sending) return;

        modal.hidden = true;
    }

    /* ================================================
       SPISAK OSOBA
    ================================================= */

    function renderCandidates() {
        const source = get(
            "fk-invite-source"
        )?.value;

        const search = String(
            get("fk-invite-search")?.value || ""
        )
            .trim()
            .toLocaleLowerCase("sr-RS");

        const select = get(
            "fk-invite-person"
        );

        if (!select) return;

        const previousValue = select.value;

        const people = state.candidates
            .filter(person => {

                if (person.izvor !== source) {
                    return false;
                }

                const searchable = [
                    person.ime_prezime,
                    person.opis,
                    person.selekcija
                ]
                    .join(" ")
                    .toLocaleLowerCase("sr-RS");

                return searchable.includes(search);

            })
            .sort((a, b) =>
                String(a.ime_prezime || "")
                    .localeCompare(
                        String(b.ime_prezime || ""),
                        "sr"
                    )
            );

        select.innerHTML = `
            <option value="">
                ${
                    state.loading
                        ? "Учитавање..."
                        : "Изабери особу"
                }
            </option>
        `;

        people.forEach(person => {

            const option =
                document.createElement("option");

            option.value =
                String(person.osoba_id);

            let label =
                String(person.ime_prezime || "");

            if (person.selekcija) {
                label +=
                    " · " + person.selekcija;
            }

            if (person.ima_nalog) {
                label += " · ИМА НАЛОГ";
                option.disabled = true;
            }

            option.textContent = label;

            select.appendChild(option);

        });

        if (
            previousValue &&
            people.some(
                person =>
                    person.osoba_id === previousValue &&
                    !person.ima_nalog
            )
        ) {
            select.value = previousValue;
        }

        renderProfile();

        if (
            !state.loading &&
            people.length === 0
        ) {

            showMessage(
                "Нема особа за изабрану улогу и претрагу."
            );

        }
    }

    /* ================================================
       IZABRANA OSOBA
    ================================================= */

    function selectedPerson() {
        const source = get(
            "fk-invite-source"
        )?.value;

        const id = get(
            "fk-invite-person"
        )?.value;

        return state.candidates.find(
            person =>
                person.izvor === source &&
                String(person.osoba_id) === id
        ) || null;
    }

    function renderProfile() {
        const container = get(
            "fk-invite-profile"
        );

        if (!container) return;

        const person = selectedPerson();

        if (!person) {

            container.innerHTML = `
                <p class="fk-invite-muted">
                    Изабери постојећу особу са сајта.
                </p>
            `;

            updateSubmitButton();
            return;
        }

        const photo =
            safePhoto(person.fotografija);

        const selection = person.izvor === "uprava"
            ? "Управа клуба"
            : (
                person.selekcija ||
                "Селекција није повезана"
            );

        container.innerHTML = `

            ${
                photo
                    ? `
                        <img
                            src="${h(photo)}"
                            alt="${h(person.ime_prezime)}"
                            referrerpolicy="no-referrer"
                        >
                    `
                    : ""
            }

            <div>

                <strong>
                    ${h(person.ime_prezime)}
                </strong>

                <small>
                    ${h(
                        SOURCES[person.izvor] ||
                        "КОРИСНИК"
                    )}
                </small>

                <small>
                    ${h(selection)}
                </small>

                ${
                    person.opis
                        ? `
                            <small>
                                ${h(person.opis)}
                            </small>
                        `
                        : ""
                }

            </div>
        `;

        if (
            person.izvor !== "uprava" &&
            !person.selekcija_id
        ) {

            showMessage(
                "Ова особа нема повезану селекцију. " +
                "Прво треба ускладити назив селекције " +
                "са подацима на сајту.",
                true
            );

        } else {

            showMessage("");

        }

        updateSubmitButton();
    }

    /* ================================================
       PROVERA FORMULARA
    ================================================= */

    function updateSubmitButton() {
        const button = get(
            "fk-invite-submit"
        );

        if (!button) return;

        const person = selectedPerson();

        const email = String(
            get("fk-invite-email")?.value || ""
        )
            .trim()
            .toLowerCase();

        const validPerson =
            person &&
            !person.ima_nalog &&
            (
                person.izvor === "uprava" ||
                Boolean(person.selekcija_id)
            );

        button.disabled =
            !ENABLE_INVITATIONS ||
            state.loading ||
            state.sending ||
            !validPerson ||
            !validEmail(email);

        button.textContent =
            state.sending
                ? "СЛАЊЕ..."
                : ENABLE_INVITATIONS
                    ? "ПОШАЉИ ПОЗИВНИЦУ"
                    : "ПОЗИВНИЦЕ ЈОШ НИСУ АКТИВНЕ";
    }

    /* ================================================
       SLANJE POZIVNICE
    ================================================= */

    async function sendInvitation(event) {
        event.preventDefault();

        if (
            !ENABLE_INVITATIONS ||
            state.loading ||
            state.sending
        ) {
            return;
        }

        const person = selectedPerson();

        const email = String(
            get("fk-invite-email")?.value || ""
        )
            .trim()
            .toLowerCase();

        if (
            !person ||
            person.ima_nalog
        ) {

            showMessage(
                "Изабери особу која још нема налог.",
                true
            );

            return;
        }

        if (
            person.izvor !== "uprava" &&
            !person.selekcija_id
        ) {

            showMessage(
                "Није одређена селекција.",
                true
            );

            return;
        }

        if (!validEmail(email)) {

            showMessage(
                "Унеси исправну мејл адресу.",
                true
            );

            return;
        }

        const confirmed = window.confirm(
            "Послати позивницу?\n\n" +
            "Особа: " + person.ime_prezime +
            "\nУлога: " + SOURCES[person.izvor] +
            "\nЕ-маил: " + email
        );

        if (!confirmed) return;

        state.sending = true;

        updateSubmitButton();

        showMessage("Слање позивнице...");

        try {

            const {
                data,
                error
            } = await sb.functions.invoke(
                "portal-poslaji-pozivnicu",
                {
                    body: {
                        izvor:
                            person.izvor,

                        osoba_id:
                            person.osoba_id,

                        email,

                        selekcija_id:
                            person.izvor === "uprava"
                                ? null
                                : person.selekcija_id
                    }
                }
            );

            if (error) {

                let message = error.message;

                try {
                    const details =
                        await error.context.json();

                    message =
                        details.error || message;

                } catch {
                    // Ostavlja osnovnu poruku.
                }

                throw new Error(message);
            }

            if (data?.ok !== true) {

                throw new Error(
                    data?.error ||
                    "Сервер није потврдио слање."
                );
            }

            person.ima_nalog = true;

            get("fk-invite-email").value = "";

            get("fk-invite-person").value = "";

            renderCandidates();

            showMessage(
                "Позивница је успешно послата за: " +
                person.ime_prezime
            );

            const refresh = document.querySelector(
                "#portal-users-screen " +
                'button[data-action="refresh"]'
            );

            if (refresh) {
                refresh.click();
            }

        } catch (error) {

            console.error(
                "FK Obilic - pozivnica:",
                error
            );

            showMessage(
                "Позивница није потврђена: " +
                (error.message || "грешка"),
                true
            );

        } finally {

            state.sending = false;
            updateSubmitButton();

        }
    }

    /* ================================================
       POVEZIVANJE SA UPRAVOM
    ================================================= */

    function init() {

        createModal();

        document.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "#fk-invite-open"
                    )
                ) {

                    event.preventDefault();

                    openModal();
                }

            }
        );

        const observer =
            new MutationObserver(() => {
                addButton();
            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        addButton();
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }

})();
