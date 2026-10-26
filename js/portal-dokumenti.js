
/* ==========================================
   FK OBILIC - PRIVATNA ARHIVA DOKUMENATA
========================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const BUCKET = "fk-obilic-dokumenti";
    const LIMIT = 10 * 1024 * 1024;

    const CATEGORIES = {
        UGOVOR: "Уговори",
        STATUT: "Статут",
        ZAPISNIK: "Записници",
        ODLUKA: "Одлуке управе",
        TAKMICENJE: "Такмичења",
        OSTALO: "Остала документа"
    };

    const state = {
        items: [],
        contracts: [],
        selectedId: null,
        editing: null,
        search: "",
        category: "ALL",
        open: false,
        busy: false,
        version: 0
    };

    let section;
    let grid;
    let heading;
    let screen;

    /* ======================================
       POMOCNE FUNKCIJE
    ====================================== */

    const esc = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const date = value =>
        value
            ? new Date(value).toLocaleDateString("sr-RS")
            : "—";

    const size = value =>
        value < 1024 * 1024
            ? `${Math.ceil(value / 1024)} KB`
            : `${(value / 1024 / 1024).toFixed(2)} MB`;

    function inform(value, isError = false) {
        const el = screen?.querySelector(
            "#portal-documents-message"
        );

        if (!el) return;

        el.textContent = value;
        el.classList.toggle("error", isError);
    }

    /* ======================================
       PROVERA PRISTUPA
    ====================================== */

    async function isManagement() {
        const {
            data: { user },
            error
        } = await sb.auth.getUser();

        if (error || !user) return false;

        const result = await sb
            .from("portal_korisnici")
            .select("uloga,aktivan")
            .eq("user_id", user.id)
            .maybeSingle();

        if (result.error) throw result.error;

        return (
            result.data?.aktivan === true &&
            String(result.data.uloga || "")
                .trim()
                .toUpperCase() === "UPRAVA"
        );
    }

    /* ======================================
       SUPABASE PODACI
    ====================================== */

    async function readAll(table, fields) {
        let offset = 0;
        const result = [];

        while (true) {
            const { data, error } = await sb
                .from(table)
                .select(fields)
                .order("created_at", {
                    ascending: false
                })
                .range(offset, offset + 499);

            if (error) throw error;

            result.push(...(data || []));

            if (!data || data.length < 500) {
                break;
            }

            offset += 500;
        }

        return result;
    }

    async function reload() {
        const version = ++state.version;

        const [items, contracts] =
            await Promise.all([
                readAll(
                    "portal_dokumenti",
                    "id,naziv,kategorija,opis,ugovor_id,storage_path,naziv_fajla,mime_type,velicina,created_at"
                ),

                readAll(
                    "portal_ugovori",
                    "id,naziv,broj_ugovora,created_at"
                )
            ]);

        if (
            version !== state.version ||
            !state.open
        ) return;

        state.items = items;
        state.contracts = contracts;

        if (
            state.selectedId &&
            !items.some(
                d => d.id === state.selectedId
            )
        ) {
            state.selectedId = null;
        }

        render();
    }

    function contractName(id) {
        return state.contracts.find(
            c => c.id === id
        )?.naziv || "—";
    }

    function options(values, current) {
        return Object.entries(values)
            .map(([key, label]) => `
                <option
                    value="${esc(key)}"
                    ${current === key ? "selected" : ""}
                >
                    ${esc(label)}
                </option>
            `)
            .join("");
    }

    /* ======================================
       SPISAK DOKUMENATA
    ====================================== */

    function listHTML() {
        const q = state.search
            .trim()
            .toLocaleLowerCase("sr-RS");

        const filtered = state.items.filter(
            d =>
                (
                    state.category === "ALL" ||
                    d.kategorija === state.category
                ) &&

                [
                    d.naziv,
                    d.naziv_fajla,
                    d.opis,
                    contractName(d.ugovor_id)
                ].some(
                    value =>
                        String(value || "")
                            .toLocaleLowerCase("sr-RS")
                            .includes(q)
                )
        );

        if (!filtered.length) {
            return `
                <p class="portal-documents-empty">
                    ${
                        state.items.length
                            ? "Нема докумената за изабрану претрагу."
                            : "Архива је празна. Додај први PDF документ."
                    }
                </p>
            `;
        }

        return filtered.map(d => `
            <button
                type="button"
                class="portal-documents-list-item
                    ${d.id === state.selectedId ? "selected" : ""}"
                data-action="select"
                data-id="${esc(d.id)}"
            >

                <strong>
                    ${esc(d.naziv)}
                </strong>

                <span>
                    ${esc(
                        CATEGORIES[d.kategorija] || "Остало"
                    )}
                    ·
                    ${esc(size(d.velicina))}
                </span>

                <small>
                    ${esc(date(d.created_at))}
                </small>

            </button>
        `).join("");
    }

    /* ======================================
       DODAVANJE I IZMENA
    ====================================== */

    function formHTML() {
        const d = state.editing === "new"
            ? null
            : state.items.find(
                item => item.id === state.editing
            );

        return `
            <div class="portal-documents-panel">

                <h3>
                    ${
                        d
                            ? "ИЗМЕНИ ПОДАТКЕ"
                            : "ДОДАЈ PDF ДОКУМЕНТ"
                    }
                </h3>

                <form
                    id="portal-document-form"
                    class="portal-documents-form"
                >

                    <label>
                        НАЗИВ ДОКУМЕНТА *

                        <input
                            name="naziv"
                            required
                            maxlength="200"
                            value="${esc(d?.naziv || "")}"
                        >
                    </label>

                    <label>
                        КАТЕГОРИЈА *

                        <select
                            name="kategorija"
                            required
                        >
                            ${options(
                                CATEGORIES,
                                d?.kategorija || "OSTALO"
                            )}
                        </select>
                    </label>

                    <label>
                        ПОВЕЗАНИ УГОВОР (ОПЦИОНО)

                        <select name="ugovor_id">

                            <option value="">
                                Није повезано са уговором
                            </option>

                            ${state.contracts.map(c => `
                                <option
                                    value="${esc(c.id)}"
                                    ${
                                        d?.ugovor_id === c.id
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${esc(c.naziv)}
                                    ${
                                        c.broj_ugovora
                                            ? " — " +
                                              esc(c.broj_ugovora)
                                            : ""
                                    }
                                </option>
                            `).join("")}

                        </select>
                    </label>

                    ${
                        d
                            ? `
                                <p class="portal-documents-help">
                                    Фајл:
                                    ${esc(d.naziv_fajla)}.

                                    Измена мења податке,
                                    али не замењује PDF.
                                </p>
                            `
                            : `
                                <label>
                                    PDF ФАЈЛ * (ДО 10 MB)

                                    <input
                                        name="file"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        required
                                    >
                                </label>
                            `
                    }

                    <label>
                        ОПИС / НАПОМЕНА

                        <textarea
                            name="opis"
                            rows="4"
                            maxlength="4000"
                        >${esc(d?.opis || "")}</textarea>
                    </label>

                    <div class="portal-documents-actions">

                        <button
                            type="submit"
                            class="primary"
                        >
                            ${
                                d
                                    ? "САЧУВАЈ ИЗМЕНЕ"
                                    : "ДОДАЈ У АРХИВУ"
                            }
                        </button>

                        <button
                            type="button"
                            data-action="cancel"
                        >
                            ОДУСТАНИ
                        </button>

                    </div>

                </form>

            </div>
        `;
    }

    /* ======================================
       DETALJI DOKUMENTA
    ====================================== */

    function detailHTML(d) {
        return `
            <div class="portal-documents-panel">

                <div class="portal-documents-panel-head">

                    <div>

                        <span>
                            ${esc(
                                CATEGORIES[d.kategorija] ||
                                "Остало"
                            )}
                        </span>

                        <h3>
                            ${esc(d.naziv)}
                        </h3>

                    </div>

                    <button
                        type="button"
                        data-action="edit"
                        data-id="${esc(d.id)}"
                    >
                        ИЗМЕНИ
                    </button>

                </div>

                <div class="portal-documents-details">

                    <div>
                        <span>ФАЈЛ</span>
                        <strong>
                            ${esc(d.naziv_fajla)}
                        </strong>
                    </div>

                    <div>
                        <span>ВЕЛИЧИНА</span>
                        <strong>
                            ${esc(size(d.velicina))}
                        </strong>
                    </div>

                    <div>
                        <span>ДОДАТО</span>
                        <strong>
                            ${esc(date(d.created_at))}
                        </strong>
                    </div>

                    <div>
                        <span>ПОВЕЗАН УГОВОР</span>
                        <strong>
                            ${esc(
                                d.ugovor_id
                                    ? contractName(d.ugovor_id)
                                    : "—"
                            )}
                        </strong>
                    </div>

                </div>

                ${
                    d.opis
                        ? `
                            <div class="portal-documents-note">

                                <strong>НАПОМЕНА</strong>

                                <p>
                                    ${esc(d.opis)}
                                </p>

                            </div>
                        `
                        : ""
                }

                <div class="portal-documents-actions">

                    <button
                        type="button"
                        class="primary"
                        data-action="preview"
                        data-id="${esc(d.id)}"
                    >
                        ОТВОРИ PDF
                    </button>

                    <button
                        type="button"
                        data-action="download"
                        data-id="${esc(d.id)}"
                    >
                        ПРЕУЗМИ
                    </button>

                    <button
                        type="button"
                        class="danger"
                        data-action="delete"
                        data-id="${esc(d.id)}"
                    >
                        ОБРИШИ ДОКУМЕНТ
                    </button>

                </div>

                <p class="portal-documents-help">
                    Фајл је у приватној архиви.
                    Приступ се проверава преко
                    Supabase налога.
                </p>

            </div>
        `;
    }

    /* ======================================
       GLAVNI PRIKAZ
    ====================================== */

    function render() {
        if (!state.open || !screen) return;

        const selected = state.items.find(
            d => d.id === state.selectedId
        );

        screen.innerHTML = `

            <div class="portal-documents-header">

                <button
                    type="button"
                    data-action="back"
                >
                    ← НАЗАД НА УПРАВУ
                </button>

                <span>
                    ФК ОБИЛИЋ · ПРИВАТНА АРХИВА
                </span>

                <h2>
                    КЛУПСКА ДОКУМЕНТА
                </h2>

                <p>
                    Уговори, одлуке, записници
                    и документација клуба.
                </p>

            </div>

            <p
                id="portal-documents-message"
                class="portal-documents-message"
                role="status"
            ></p>

            <div class="portal-documents-stats">

                <div>
                    <span>УКУПНО ДОКУМЕНАТА</span>

                    <strong>
                        ${state.items.length}
                    </strong>
                </div>

                <div>
                    <span>УГОВОРИ</span>

                    <strong>
                        ${
                            state.items.filter(
                                d => d.kategorija === "UGOVOR"
                            ).length
                        }
                    </strong>
                </div>

                <div>
                    <span>ОСТАЛА ДОКУМЕНТА</span>

                    <strong>
                        ${
                            state.items.filter(
                                d => d.kategorija !== "UGOVOR"
                            ).length
                        }
                    </strong>
                </div>

            </div>

            <div class="portal-documents-layout">

                <div class="portal-documents-panel">

                    <div class="portal-documents-panel-head">

                        <h3>АРХИВА</h3>

                        <button
                            type="button"
                            class="primary"
                            data-action="new"
                        >
                            + ДОДАЈ
                        </button>

                    </div>

                    <input
                        type="search"
                        id="portal-documents-search"
                        placeholder="Претражи документа..."
                        aria-label="Претрага докумената"
                        value="${esc(state.search)}"
                    >

                    <select
                        id="portal-documents-filter"
                        aria-label="Филтер категорије"
                    >

                        <option value="ALL">
                            Све категорије
                        </option>

                        ${options(
                            CATEGORIES,
                            state.category
                        )}

                    </select>

                    <div
                        id="portal-documents-list"
                        class="portal-documents-list"
                    >
                        ${listHTML()}
                    </div>

                </div>

                ${
                    state.editing !== null
                        ? formHTML()

                        : selected
                            ? detailHTML(selected)

                            : `
                                <div class="portal-documents-panel">

                                    <h3>ДЕТАЉИ</h3>

                                    <p class="portal-documents-empty">
                                        Изабери документ
                                        или додај нови PDF.
                                    </p>

                                </div>
                            `
                }

            </div>
        `;
    }

    /* ======================================
       OTVARANJE SEKCIJE
    ====================================== */

    async function open() {
        if (state.open || state.busy) return;

        try {
            if (!(await isManagement())) {
                window.alert(
                    "Само овлашћена управа може да отвори документа."
                );

                return;
            }

            state.open = true;

            grid.hidden = true;
            heading.hidden = true;
            screen.hidden = false;

            render();

            inform("Учитавање докумената...");

            await reload();

        } catch (error) {
            console.error(
                "Document access/loading:",
                error
            );

            if (state.open) {
                inform(
                    "Грешка при учитавању: " +
                    (error.message || "непозната грешка"),
                    true
                );
            } else {
                window.alert(
                    "Приступ није успео: " +
                    (error.message || "непозната грешка")
                );
            }
        }
    }

    function back() {
        state.open = false;
        state.editing = null;
        state.version++;

        if (screen) screen.hidden = true;
        if (grid) grid.hidden = false;
        if (heading) heading.hidden = false;
    }

    /* ======================================
       PROVERA PDF FAJLA
    ====================================== */

    async function checkPdf(file) {
        if (!file || !(file instanceof File)) {
            throw new Error(
                "Изабери PDF документ."
            );
        }

        if (!/\.pdf$/i.test(file.name)) {
            throw new Error(
                "Дозвољени су само .pdf фајлови."
            );
        }

        if (
            file.type &&
            file.type !== "application/pdf"
        ) {
            throw new Error(
                "Изабрани фајл није PDF."
            );
        }

        if (
            file.size <= 0 ||
            file.size > LIMIT
        ) {
            throw new Error(
                "PDF мора имати највише 10 MB."
            );
        }

        const header = await file
            .slice(0, 1024)
            .text();

        if (!header.includes("%PDF-")) {
            throw new Error(
                "Фајл нема исправно PDF заглавље."
            );
        }
    }

    /* ======================================
       CUVANJE DOKUMENTA
    ====================================== */

    async function save(event) {
        if (
            event.target.id !==
            "portal-document-form"
        ) return;

        event.preventDefault();

        if (state.busy) return;

        const form = event.target;
        const fd = new FormData(form);

        const str = key =>
            String(fd.get(key) || "").trim();

        const isNew =
            state.editing === "new";

        const name = str("naziv");
        const category = str("kategorija");

        const contractId =
            str("ugovor_id") || null;

        if (
            !name ||
            !CATEGORIES[category] ||
            (
                contractId &&
                !state.contracts.some(
                    c => c.id === contractId
                )
            )
        ) {
            inform(
                "Провери назив, категорију и повезани уговор.",
                true
            );

            return;
        }

        state.busy = true;

        let uploadedPath = null;

        const saveButton = form.querySelector(
            'button[type="submit"]'
        );

        if (saveButton) {
            saveButton.disabled = true;
        }

        try {
            const payload = {
                naziv: name,
                kategorija: category,
                ugovor_id: contractId,
                opis: str("opis") || null
            };

            let result;

            if (isNew) {
                const file = form.elements
                    .namedItem("file")
                    ?.files?.[0];

                await checkPdf(file);

                if (!window.crypto?.randomUUID) {
                    throw new Error(
                        "Прегледач не подржава безбедан ID. " +
                        "Отвори портал преко localhost/HTTPS."
                    );
                }

                uploadedPath =
                    `documents/${window.crypto.randomUUID()}.pdf`;

                // 1. Privatno cuvanje PDF fajla

                const upload = await sb.storage
                    .from(BUCKET)
                    .upload(
                        uploadedPath,
                        file,
                        {
                            contentType: "application/pdf",
                            upsert: false
                        }
                    );

                if (upload.error) {
                    throw upload.error;
                }

                // 2. Evidencija dokumenta u bazi

                Object.assign(payload, {
                    storage_path: uploadedPath,
                    naziv_fajla: file.name,
                    mime_type: "application/pdf",
                    velicina: file.size
                });

                result = await sb
                    .from("portal_dokumenti")
                    .insert(payload)
                    .select("id")
                    .single();

            } else {
                // Izmena podataka bez menjanja PDF-a

                result = await sb
                    .from("portal_dokumenti")
                    .update(payload)
                    .eq("id", state.editing)
                    .select("id")
                    .single();
            }

            if (result.error) {
                throw result.error;
            }

            uploadedPath = null;

            state.selectedId = result.data.id;
            state.editing = null;

            await reload();

            inform(
                isNew
                    ? "Документ је додат у архиву."
                    : "Подаци су сачувани."
            );

        } catch (error) {
            console.error(
                "Document saving:",
                error
            );

            let extra = "";

            // Ako upis u bazu nije uspeo,
            // uklanjamo prethodno otpremljeni PDF.

            if (uploadedPath) {
                const cleanup = await sb.storage
                    .from(BUCKET)
                    .remove([uploadedPath]);

                if (cleanup.error) {
                    extra =
                        " Отпремљени фајл треба ручно " +
                        "уклонити из Storage-а.";
                }
            }

            inform(
                "Грешка при чувању: " +
                (error.message || "непозната грешка") +
                extra,
                true
            );

        } finally {
            state.busy = false;

            if (saveButton?.isConnected) {
                saveButton.disabled = false;
            }
        }
    }

    /* ======================================
       OTVARANJE I PREUZIMANJE PDF-a
    ====================================== */

    async function openFile(doc, download) {
        let tab = null;

        // Novi tab otvaramo direktno na klik,
        // da ga browser ne blokira.

        if (!download) {
            tab = window.open(
                "about:blank",
                "_blank"
            );

            if (!tab) {
                inform(
                    "Прегледач блокира нови прозор. " +
                    "Користи ПРЕУЗМИ.",
                    true
                );
                return;
            }

            tab.opener = null;
        }

        state.busy = true;

        try {
            // Privatni fajl se preuzima
            // preko prijavljenog korisnika.

            const { data, error } =
                await sb.storage
                    .from(BUCKET)
                    .download(doc.storage_path);

            if (error) throw error;

            const url =
                URL.createObjectURL(data);

            if (download) {
                const a =
                    document.createElement("a");

                a.href = url;

                a.download =
                    doc.naziv_fajla || "dokument.pdf";

                document.body.appendChild(a);

                a.click();
                a.remove();

            } else {
                tab.location.href = url;
            }

            setTimeout(
                () => URL.revokeObjectURL(url),
                120000
            );

        } catch (error) {
            if (tab && !tab.closed) {
                tab.close();
            }

            inform(
                "Не могу да отворим PDF: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;
        }
    }

    /* ======================================
       BRISANJE DOKUMENTA
    ====================================== */

    async function deleteFile(doc) {
        const answer = window.prompt(
            "ТРАЈНО БРИСАЊЕ ДОКУМЕНТА\n\n" +
            doc.naziv + "\n\n" +
            "Биће уклоњен PDF и запис из архиве.\n" +
            "За потврду упиши тачан назив документа:"
        );

        if (answer !== doc.naziv) {
            return;
        }

        state.busy = true;

        try {
            const { data, error } = await sb
                .from("portal_dokumenti")
                .delete()
                .eq("id", doc.id)
                .select("id")
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                throw new Error(
                    "Запис није пронађен или немаш право брисања."
                );
            }

            state.selectedId = null;
            state.editing = null;

            // Fizicki uklanjamo PDF kroz Storage API.

            const remove = await sb.storage
                .from(BUCKET)
                .remove([doc.storage_path]);

            await reload();

            if (remove.error) {
                inform(
                    "Запис је обрисан, али PDF није " +
                    "уклоњен из Storage-а. " +
                    "Обриши фајл ручно: " +
                    doc.storage_path,
                    true
                );

            } else {
                inform(
                    "Документ и PDF су обрисани."
                );
            }

        } catch (error) {
            console.error(
                "Document deletion:",
                error
            );

            inform(
                "Брисање није успело: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;
        }
    }

    /* ======================================
       KLIKOVI
    ====================================== */

    async function click(event) {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button || state.busy) return;

        const action = button.dataset.action;

        if (action === "back") {
            return back();
        }

        if (action === "new") {
            state.editing = "new";
            return render();
        }

        if (action === "cancel") {
            state.editing = null;
            return render();
        }

        if (action === "select") {
            state.selectedId = button.dataset.id;
            state.editing = null;
            return render();
        }

        const doc = state.items.find(
            d => d.id === button.dataset.id
        );

        if (!doc) return;

        if (action === "edit") {
            state.editing = doc.id;
            return render();
        }

        if (action === "preview") {
            return openFile(doc, false);
        }

        if (action === "download") {
            return openFile(doc, true);
        }

        if (action === "delete") {
            return deleteFile(doc);
        }
    }

    /* ======================================
       POVEZIVANJE SA UPRAVOM
    ====================================== */

    function mount() {
        section = document.querySelector(
            "#portal-management-section"
        );

        if (!section || screen) {
            return Boolean(screen);
        }

        grid = section.querySelector(
            ".portal-management-grid"
        );

        heading = section.querySelector(
            ".portal-section-heading"
        );

        const card = [
            ...section.querySelectorAll(
                ".portal-management-card"
            )
        ].find(
            el =>
                el.querySelector("h3")
                    ?.textContent.trim() ===
                "ДОКУМЕНТА"
        );

        if (!card || !grid || !heading) {
            return false;
        }

        card.tabIndex = 0;

        card.setAttribute(
            "role",
            "button"
        );

        card.setAttribute(
            "aria-label",
            "Отвори приватна документа клуба"
        );

        card.classList.add(
            "portal-documents-launcher"
        );

        card.addEventListener(
            "click",
            open
        );

        card.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    open();
                }
            }
        );

        screen = document.createElement("div");

        screen.id =
            "portal-documents-screen";

        screen.hidden = true;

        section.appendChild(screen);

        screen.addEventListener(
            "click",
            click
        );

        screen.addEventListener(
            "submit",
            save
        );

        /* Pretraga */

        screen.addEventListener(
            "input",
            event => {
                if (
                    event.target.id ===
                    "portal-documents-search"
                ) {
                    state.search =
                        event.target.value;

                    screen.querySelector(
                        "#portal-documents-list"
                    ).innerHTML = listHTML();
                }
            }
        );

        /* Filter kategorija */

        screen.addEventListener(
            "change",
            event => {
                if (
                    event.target.id ===
                    "portal-documents-filter"
                ) {
                    state.category =
                        event.target.value;

                    screen.querySelector(
                        "#portal-documents-list"
                    ).innerHTML = listHTML();
                }
            }
        );

        /* Odjava */

        sb.auth.onAuthStateChange(
            event => {
                if (event === "SIGNED_OUT") {
                    back();

                    state.items = [];
                    state.contracts = [];
                    state.selectedId = null;
                    state.search = "";
                    state.category = "ALL";

                    screen.innerHTML = "";
                }
            }
        );

        return true;
    }

    function init() {
        if (mount()) return;

        const observer =
            new MutationObserver(() => {
                if (mount()) {
                    observer.disconnect();
                }
            });

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );
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
