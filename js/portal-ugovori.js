
/* =========================================================
   FK OBILIC - PORTAL UPRAVE
   UGOVORI + PRIVATNI PDF PRILOZI + BRISANJE
========================================================= */
(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const BUCKET = "fk-obilic-dokumenti";
    const PDF_LIMIT = 10 * 1024 * 1024;

    const TYPES = {
        SPONZORSKI: "Спонзорски уговор",
        TRENER: "Уговор са тренером",
        DOBAVLJAC: "Уговор са добављачем",
        SARADNJA: "Уговор о сарадњи",
        OSTALO: "Други уговор"
    };

    const STATUSES = {
        U_PRIPREMI: "У припреми",
        AKTIVAN: "Активан",
        ISTEKAO: "Истекао",
        RASKINUT: "Раскинут"
    };

    const state = {
        contracts: [],
        sponsors: [],
        documents: [],
        selectedId: null,
        editing: null,
        attachmentForm: false,
        search: "",
        open: false,
        busy: false,
        version: 0
    };

    let section, grid, heading, screen;

    /* ======================================
       POMOCNE FUNKCIJE
    ====================================== */

    const esc = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const money = value =>
        new Intl.NumberFormat("sr-RS", {
            maximumFractionDigits: 2
        }).format(Number(value || 0)) + " дин.";

    const today = () =>
        new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Belgrade",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());

    function thirtyDaysFromNow() {
        const d = new Date(
            today() + "T12:00:00Z"
        );

        d.setUTCDate(
            d.getUTCDate() + 30
        );

        return d.toISOString().slice(0, 10);
    }

    function formatDate(value) {
        if (!value) return "—";

        const p = String(value)
            .slice(0, 10)
            .split("-");

        return p.length === 3
            ? `${p[2]}.${p[1]}.${p[0]}.`
            : String(value);
    }

    function fileSize(value) {
        const bytes = Number(value || 0);

        return bytes < 1048576
            ? `${Math.ceil(bytes / 1024)} KB`
            : `${(bytes / 1048576).toFixed(2)} MB`;
    }

    function message(text, error = false) {
        const el = screen?.querySelector(
            "#portal-contracts-message"
        );

        if (!el) return;

        el.textContent = text;
        el.classList.toggle("error", error);
    }

    /* ======================================
       STATUSI I ROKOVI
    ====================================== */

    function actualStatus(c) {
        if (
            c.status === "RASKINUT" ||
            c.status === "ISTEKAO"
        ) {
            return c.status;
        }

        if (
            c.status === "AKTIVAN" &&
            c.datum_isteka
        ) {
            if (c.datum_isteka < today()) {
                return "ISTEKAO";
            }

            if (
                c.datum_isteka <=
                thirtyDaysFromNow()
            ) {
                return "USKORO";
            }
        }

        return c.status;
    }

    function statusLabel(c) {
        const key = actualStatus(c);

        return key === "USKORO"
            ? "Ускоро истиче"
            : STATUSES[key] || "—";
    }

    function statusClass(c) {
        return {
            AKTIVAN: "active",
            USKORO: "soon",
            ISTEKAO: "expired",
            RASKINUT: "ended",
            U_PRIPREMI: "draft"
        }[actualStatus(c)] || "draft";
    }

    const sponsorName = id =>
        state.sponsors.find(
            s => s.id === id
        )?.naziv || "—";

    const options = (items, selected) =>
        Object.entries(items)
            .map(([value, label]) => `
                <option
                    value="${esc(value)}"
                    ${
                        selected === value
                            ? "selected"
                            : ""
                    }
                >
                    ${esc(label)}
                </option>
            `)
            .join("");

    /* ======================================
       UCITAVANJE PODATAKA
    ====================================== */

    async function readAll(table, columns) {
        const rows = [];

        for (
            let start = 0;
            ;
            start += 400
        ) {
            const { data, error } =
                await sb
                    .from(table)
                    .select(columns)
                    .order("created_at", {
                        ascending: false
                    })
                    .range(
                        start,
                        start + 399
                    );

            if (error) throw error;

            rows.push(...(data || []));

            if (
                !data ||
                data.length < 400
            ) {
                break;
            }
        }

        return rows;
    }

    async function reload() {
        const version = ++state.version;

        const [
            contracts,
            sponsors,
            documents
        ] = await Promise.all([

            readAll(
                "portal_ugovori",
                "id,naziv,broj_ugovora,vrsta,druga_strana,sponzor_id,datum_potpisivanja,datum_pocetka,datum_isteka,iznos,status,napomena,created_at"
            ),

            readAll(
                "portal_sponzori",
                "id,naziv,created_at"
            ),

            readAll(
                "portal_dokumenti",
                "id,naziv,kategorija,opis,ugovor_id,storage_path,naziv_fajla,mime_type,velicina,created_at"
            )

        ]);

        if (
            version !== state.version ||
            !state.open
        ) {
            return;
        }

        state.contracts = contracts;
        state.sponsors = sponsors;
        state.documents = documents;

        if (
            state.selectedId &&
            !contracts.some(
                c => c.id === state.selectedId
            )
        ) {
            state.selectedId = null;
            state.attachmentForm = false;
        }

        render();
    }

    /* ======================================
       STATISTIKA
    ====================================== */

    function statsHTML() {
        const values =
            state.contracts.map(actualStatus);

        const active = values.filter(
            s =>
                s === "AKTIVAN" ||
                s === "USKORO"
        ).length;

        const soon = values.filter(
            s => s === "USKORO"
        ).length;

        const expired = values.filter(
            s => s === "ISTEKAO"
        ).length;

        return `
            <div class="portal-contract-stat">
                <span>АКТИВНИ</span>
                <strong>${active}</strong>
            </div>

            <div class="portal-contract-stat">
                <span>
                    ИСТИЧУ У НАРЕДНИХ 30 ДАНА
                </span>
                <strong>${soon}</strong>
            </div>

            <div class="portal-contract-stat">
                <span>ИСТЕКЛИ</span>
                <strong>${expired}</strong>
            </div>
        `;
    }

    /* ======================================
       SPISAK UGOVORA
    ====================================== */

    function listHTML() {
        const q = state.search
            .trim()
            .toLocaleLowerCase("sr-RS");

        const found = state.contracts.filter(
            c => [
                c.naziv,
                c.druga_strana,
                c.broj_ugovora,
                sponsorName(c.sponzor_id)
            ].some(
                v =>
                    String(v || "")
                        .toLocaleLowerCase("sr-RS")
                        .includes(q)
            )
        );

        if (!found.length) {
            return `
                <p class="portal-contract-empty">
                    ${
                        state.contracts.length
                            ? "Нема резултата претраге."
                            : "Још нема унетих уговора. Додај први."
                    }
                </p>
            `;
        }

        return found.map(c => `
            <button
                type="button"
                data-action="select"
                data-id="${esc(c.id)}"
                class="portal-contract-list-item
                    ${c.id === state.selectedId
                        ? "selected"
                        : ""}"
            >

                <strong>
                    ${esc(c.naziv)}
                </strong>

                <span>
                    ${esc(
                        c.druga_strana ||
                        TYPES[c.vrsta] ||
                        "Уговор"
                    )}
                </span>

                <small
                    class="portal-contract-badge
                    ${statusClass(c)}"
                >
                    ${esc(statusLabel(c))}
                </small>

                <span>
                    Истиче:
                    ${esc(formatDate(c.datum_isteka))}
                </span>

            </button>
        `).join("");
    }

    /* ======================================
       FORMULAR UGOVORA
    ====================================== */

    function editorHTML() {
        const c = state.editing === "new"
            ? null
            : state.contracts.find(
                x => x.id === state.editing
            );

        return `
            <div class="portal-contract-panel">

                <h3>
                    ${
                        c
                            ? "ИЗМЕНИ УГОВОР"
                            : "НОВИ УГОВОР"
                    }
                </h3>

                <form
                    id="portal-contract-form"
                    class="portal-contract-form"
                >

                    <label class="wide">
                        НАЗИВ УГОВОРА *

                        <input
                            name="naziv"
                            required
                            maxlength="200"
                            value="${esc(c?.naziv || "")}"
                        >
                    </label>

                    <label>
                        БРОЈ УГОВОРА

                        <input
                            name="broj_ugovora"
                            maxlength="100"
                            value="${esc(c?.broj_ugovora || "")}"
                        >
                    </label>

                    <label>
                        ВРСТА УГОВОРА *

                        <select name="vrsta" required>
                            ${options(
                                TYPES,
                                c?.vrsta || "SPONZORSKI"
                            )}
                        </select>
                    </label>

                    <label class="wide">
                        ДРУГА УГОВОРНА СТРАНА

                        <input
                            name="druga_strana"
                            maxlength="200"
                            value="${esc(c?.druga_strana || "")}"
                        >
                    </label>

                    <label class="wide">
                        ПОВЕЗАНИ СПОНЗОР (ОПЦИОНО)

                        <select name="sponzor_id">

                            <option value="">
                                Није повезан са спонзором
                            </option>

                            ${state.sponsors.map(s => `
                                <option
                                    value="${esc(s.id)}"
                                    ${
                                        c?.sponzor_id === s.id
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${esc(s.naziv)}
                                </option>
                            `).join("")}

                        </select>
                    </label>

                    <label>
                        ДАТУМ ПОТПИСИВАЊА

                        <input
                            type="date"
                            name="datum_potpisivanja"
                            value="${esc(
                                c?.datum_potpisivanja || ""
                            )}"
                        >
                    </label>

                    <label>
                        ПОЧЕТАК ВАЖЕЊА

                        <input
                            type="date"
                            name="datum_pocetka"
                            value="${esc(
                                c?.datum_pocetka || ""
                            )}"
                        >
                    </label>

                    <label>
                        ИСТЕК УГОВОРА

                        <input
                            type="date"
                            name="datum_isteka"
                            value="${esc(
                                c?.datum_isteka || ""
                            )}"
                        >
                    </label>

                    <label>
                        ИЗНОС (ДИН., ОПЦИОНО)

                        <input
                            type="number"
                            name="iznos"
                            min="0"
                            step="0.01"
                            value="${esc(c?.iznos ?? "")}"
                        >
                    </label>

                    <label>
                        СТАТУС

                        <select name="status">
                            ${options(
                                STATUSES,
                                c?.status || "U_PRIPREMI"
                            )}
                        </select>
                    </label>

                    <label class="wide">
                        НАПОМЕНА

                        <textarea
                            name="napomena"
                            rows="4"
                            maxlength="4000"
                        >${esc(c?.napomena || "")}</textarea>
                    </label>

                    <div class="portal-contract-actions wide">

                        <button
                            type="submit"
                            class="primary"
                        >
                            САЧУВАЈ УГОВОР
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
       FORMULAR ZA PDF PRILOG
    ====================================== */

    function attachmentFormHTML(c) {
        return `
            <div class="portal-contract-file-form-box">

                <h4>
                    ДОДАЈ PDF ПРИЛОГ
                </h4>

                <form
                    id="portal-contract-file-form"
                    class="portal-contract-file-form"
                >

                    <label>
                        НАЗИВ ДОКУМЕНТА *

                        <input
                            name="naziv"
                            required
                            maxlength="200"
                            placeholder="Нпр. Потписан уговор"
                        >
                    </label>

                    <label>
                        PDF ФАЈЛ * (ДО 10 MB)

                        <input
                            name="file"
                            type="file"
                            accept=".pdf,application/pdf"
                            required
                        >
                    </label>

                    <label>
                        НАПОМЕНА

                        <textarea
                            name="opis"
                            maxlength="4000"
                            rows="3"
                        ></textarea>
                    </label>

                    <p>
                        Прилог ће бити аутоматски
                        повезан са уговором:

                        <strong>
                            ${esc(c.naziv)}
                        </strong>.
                    </p>

                    <div class="portal-contract-actions">

                        <button
                            type="submit"
                            class="primary"
                        >
                            САЧУВАЈ ПРИЛОГ
                        </button>

                        <button
                            type="button"
                            data-action="cancel-file"
                        >
                            ОДУСТАНИ
                        </button>

                    </div>

                </form>
            </div>
        `;
    }

    /* ======================================
       PDF PRILOZI UGOVORA
    ====================================== */

    function attachmentsHTML(c) {
        const docs = state.documents.filter(
            d => d.ugovor_id === c.id
        );

        return `
            <div class="portal-contract-files">

                <div class="portal-contract-files-head">

                    <div>

                        <h4>
                            ПРИЛОЗИ УГОВОРА
                        </h4>

                        <p>
                            ${docs.length}
                            ${
                                docs.length === 1
                                    ? "документ"
                                    : "докумената"
                            }
                            у приватној архиви
                        </p>

                    </div>

                    ${state.attachmentForm
                        ? ""
                        : `
                            <button
                                type="button"
                                class="primary"
                                data-action="add-file"
                            >
                                + ДОДАЈ PDF
                            </button>
                        `
                    }

                </div>

                ${docs.length
                    ? `
                        <div class="portal-contract-file-list">

                            ${docs.map(d => `
                                <div class="portal-contract-file-item">

                                    <div
                                        class="portal-contract-file-icon"
                                        aria-hidden="true"
                                    >
                                        PDF
                                    </div>

                                    <div class="portal-contract-file-info">

                                        <strong>
                                            ${esc(d.naziv)}
                                        </strong>

                                        <span>
                                            ${esc(d.naziv_fajla)}
                                            ·
                                            ${esc(fileSize(d.velicina))}
                                        </span>

                                        ${d.opis
                                            ? `
                                                <small>
                                                    ${esc(d.opis)}
                                                </small>
                                            `
                                            : ""
                                        }

                                    </div>

                                    <div class="portal-contract-file-actions">

                                        <button
                                            type="button"
                                            data-action="preview-file"
                                            data-id="${esc(d.id)}"
                                        >
                                            ОТВОРИ
                                        </button>

                                        <button
                                            type="button"
                                            data-action="download-file"
                                            data-id="${esc(d.id)}"
                                        >
                                            ПРЕУЗМИ
                                        </button>

                                    </div>

                                </div>
                            `).join("")}

                        </div>
                    `
                    : `
                        <p class="portal-contract-empty">
                            Овај уговор још нема приложен PDF.
                        </p>
                    `
                }

                ${
                    state.attachmentForm
                        ? attachmentFormHTML(c)
                        : ""
                }

            </div>
        `;
    }

    /* ======================================
       DETALJI UGOVORA
    ====================================== */

    function detailsHTML(c) {
        const detail = (label, value) => `
            <div>
                <span>${label}</span>
                <strong>${esc(value)}</strong>
            </div>
        `;

        const linkedDocs = state.documents.filter(
            d => d.ugovor_id === c.id
        ).length;

        return `
            <div class="portal-contract-panel">

                <div class="portal-contract-panel-top">

                    <div>

                        <span
                            class="portal-contract-badge
                            ${statusClass(c)}"
                        >
                            ${esc(statusLabel(c))}
                        </span>

                        <h3>
                            ${esc(c.naziv)}
                        </h3>

                        <p>
                            ${esc(
                                TYPES[c.vrsta] || c.vrsta
                            )}
                        </p>

                    </div>

                    <div class="portal-contract-detail-buttons">

                        <button
                            type="button"
                            data-action="edit"
                            data-id="${esc(c.id)}"
                        >
                            ИЗМЕНИ
                        </button>

                        <button
                            type="button"
                            class="portal-contract-delete-button"
                            data-action="delete-contract"
                            data-id="${esc(c.id)}"
                        >
                            ОБРИШИ УГОВОР
                        </button>

                    </div>

                </div>

                <div class="portal-contract-details">

                    ${detail(
                        "БРОЈ УГОВОРА",
                        c.broj_ugovora || "—"
                    )}

                    ${detail(
                        "ДРУГА СТРАНА",
                        c.druga_strana || "—"
                    )}

                    ${detail(
                        "ПОВЕЗАНИ СПОНЗОР",
                        c.sponzor_id
                            ? sponsorName(c.sponzor_id)
                            : "—"
                    )}

                    ${detail(
                        "ДАТУМ ПОТПИСА",
                        formatDate(c.datum_potpisivanja)
                    )}

                    ${detail(
                        "ВАЖИ ОД",
                        formatDate(c.datum_pocetka)
                    )}

                    ${detail(
                        "ВАЖИ ДО",
                        formatDate(c.datum_isteka)
                    )}

                    ${detail(
                        "УГОВОРЕНИ ИЗНОС",
                        c.iznos == null
                            ? "—"
                            : money(c.iznos)
                    )}

                    ${detail(
                        "СТАТУС У ЕВИДЕНЦИЈИ",
                        STATUSES[c.status] || c.status
                    )}

                </div>

                ${c.napomena
                    ? `
                        <div class="portal-contract-note">

                            <strong>НАПОМЕНА</strong>

                            <p>
                                ${esc(c.napomena)}
                            </p>

                        </div>
                    `
                    : ""
                }

                ${attachmentsHTML(c)}

                ${linkedDocs
                    ? `
                        <p class="portal-contract-delete-note">
                            Брисање уговора не брише
                            његових ${linkedDocs} PDF прилога.
                            Они остају у архиви
                            „ДОКУМЕНТА“, без везе са уговором.
                        </p>
                    `
                    : ""
                }

            </div>
        `;
    }

    /* ======================================
       GLAVNI PRIKAZ
    ====================================== */

    function render() {
        if (!state.open || !screen) return;

        const selected = state.contracts.find(
            c => c.id === state.selectedId
        );

        screen.innerHTML = `

            <div class="portal-contract-header">

                <button
                    type="button"
                    data-action="back"
                >
                    ← НАЗАД НА УПРАВУ
                </button>

                <span>
                    ФК ОБИЛИЋ · ПРИВАТНА ЕВИДЕНЦИЈА
                </span>

                <h2>УГОВОРИ</h2>

                <p>
                    Преглед уговора, рокова важења,
                    сарадње и PDF прилога.
                </p>

            </div>

            <p
                id="portal-contracts-message"
                class="portal-contract-message"
                role="status"
            ></p>

            <div class="portal-contract-stats">
                ${statsHTML()}
            </div>

            <div class="portal-contract-layout">

                <div class="portal-contract-panel">

                    <div class="portal-contract-panel-top">

                        <h3>СПИСАК УГОВОРА</h3>

                        <button
                            type="button"
                            class="primary"
                            data-action="new"
                        >
                            + ДОДАЈ
                        </button>

                    </div>

                    <input
                        id="portal-contract-search"
                        class="portal-contract-search"
                        type="search"
                        placeholder="Претражи уговоре..."
                        aria-label="Претрага уговора"
                        value="${esc(state.search)}"
                    >

                    <div
                        id="portal-contract-list"
                        class="portal-contract-list"
                    >
                        ${listHTML()}
                    </div>

                </div>

                ${
                    state.editing !== null
                        ? editorHTML()
                        : selected
                            ? detailsHTML(selected)
                            : `
                                <div class="portal-contract-panel">

                                    <h3>ДЕТАЉИ</h3>

                                    <p class="portal-contract-empty">
                                        Изабери уговор
                                        или додај нови.
                                    </p>

                                </div>
                            `
                }

            </div>
        `;
    }

    /* ======================================
       PROVERA PRAVA UPRAVE
    ====================================== */

    async function isManagement() {
        const { data, error } =
            await sb.auth.getUser();

        if (error || !data?.user) {
            return false;
        }

        const result = await sb
            .from("portal_korisnici")
            .select("uloga,aktivan")
            .eq("user_id", data.user.id)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return (
            result.data?.aktivan === true &&
            String(result.data.uloga || "")
                .trim()
                .toUpperCase() === "UPRAVA"
        );
    }

    /* ======================================
       OTVARANJE UGOVORA
    ====================================== */

    async function open() {
        if (state.open || state.busy) return;

        try {
            if (!(await isManagement())) {
                alert(
                    "Само овлашћена управа има приступ уговорима."
                );
                return;
            }

            state.open = true;

            grid.hidden = true;
            heading.hidden = true;
            screen.hidden = false;

            render();

            message("Учитавање...");

            await reload();

        } catch (error) {
            console.error(
                "Contracts access/loading:",
                error
            );

            if (state.open) {
                message(
                    "Грешка при учитавању: " +
                    (error.message || "грешка"),
                    true
                );
            } else {
                alert(
                    "Приступ уговорима није успео: " +
                    (error.message || "грешка")
                );
            }
        }
    }

    function back() {
        state.open = false;
        state.editing = null;
        state.attachmentForm = false;
        state.version++;

        if (screen) screen.hidden = true;
        if (grid) grid.hidden = false;
        if (heading) heading.hidden = false;
    }

    /* ======================================
       BRISANJE UGOVORA
       PDF FAJLOVI OSTAJU U ARHIVI
    ====================================== */

    async function deleteContract(c) {
        const relatedCount =
            state.documents.filter(
                d => d.ugovor_id === c.id
            ).length;

        const explanation = relatedCount
            ? `
                \n\nПОВЕЗАНИ PDF-ОВИ: ${relatedCount}
                \nPDF фајлови остају у архиви,
                али ће веза са овим уговором бити уклоњена.
              `
            : "";

        const answer = window.prompt(
            "ТРАЈНО БРИСАЊЕ УГОВОРА\n\n" +
            "Уговор: " + c.naziv +
            explanation +
            "\n\nЗа потврду упиши тачан назив уговора:"
        );

        if (answer !== c.naziv) {
            return;
        }

        state.busy = true;

        try {
            const { data, error } =
                await sb.rpc(
                    "portal_obrisi_ugovor",
                    {
                        p_ugovor_id: c.id,
                        p_naziv: c.naziv
                    }
                );

            if (error) throw error;

            if (data !== true) {
                throw new Error(
                    "Уговор није пронађен."
                );
            }

            state.selectedId = null;
            state.editing = null;
            state.attachmentForm = false;

            await reload();

            message(
                "Уговор је обрисан. Повезани PDF-ови " +
                "су сачувани у архиви."
            );

        } catch (error) {
            console.error(
                "Contract deletion:",
                error
            );

            message(
                "Грешка при брисању: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;
        }
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

        if (
            !/\.pdf$/i.test(file.name) ||
            (
                file.type &&
                file.type !== "application/pdf"
            )
        ) {
            throw new Error(
                "Дозвољени су само PDF документи."
            );
        }

        if (
            file.size <= 0 ||
            file.size > PDF_LIMIT
        ) {
            throw new Error(
                "Величина PDF-а мора бити до 10 MB."
            );
        }

        const header = await file
            .slice(0, 1024)
            .text();

        if (!header.includes("%PDF-")) {
            throw new Error(
                "Фајл нема PDF заглавље."
            );
        }
    }

    /* ======================================
       CUVANJE PDF PRILOGA
    ====================================== */

    async function saveAttachment(form) {
        const c = state.contracts.find(
            x => x.id === state.selectedId
        );

        if (!c) {
            return message(
                "Изабери уговор.",
                true
            );
        }

        const fd = new FormData(form);

        const name = String(
            fd.get("naziv") || ""
        ).trim();

        const description = String(
            fd.get("opis") || ""
        ).trim() || null;

        const file = form.elements
            .namedItem("file")?.files?.[0];

        if (!name) {
            return message(
                "Унеси назив документа.",
                true
            );
        }

        state.busy = true;

        const saveBtn = form.querySelector(
            'button[type="submit"]'
        );

        if (saveBtn) {
            saveBtn.disabled = true;
        }

        let uploadedPath = null;

        try {
            await checkPdf(file);

            if (!window.crypto?.randomUUID) {
                throw new Error(
                    "Отвори портал преко localhost или HTTPS."
                );
            }

            const path =
                `documents/${window.crypto.randomUUID()}.pdf`;

            const upload = await sb.storage
                .from(BUCKET)
                .upload(
                    path,
                    file,
                    {
                        contentType: "application/pdf",
                        upsert: false
                    }
                );

            if (upload.error) {
                throw upload.error;
            }

            uploadedPath = path;

            const { error } = await sb
                .from("portal_dokumenti")
                .insert({
                    naziv: name,
                    kategorija: "UGOVOR",
                    opis: description,
                    ugovor_id: c.id,
                    storage_path: path,
                    naziv_fajla: file.name,
                    mime_type: "application/pdf",
                    velicina: file.size
                });

            if (error) {
                throw error;
            }

            uploadedPath = null;
            state.attachmentForm = false;

            await reload();

            message(
                "PDF прилог је сачуван и повезан са уговором."
            );

        } catch (error) {
            console.error(
                "Contract attachment upload:",
                error
            );

            let extra = "";

            if (uploadedPath) {
                const cleanup = await sb.storage
                    .from(BUCKET)
                    .remove([uploadedPath]);

                if (cleanup.error) {
                    extra =
                        ` Преостали фајл у Storage-у: ${uploadedPath}`;
                }
            }

            message(
                "Грешка при додавању PDF-а: " +
                (error.message || "грешка") +
                extra,
                true
            );

        } finally {
            state.busy = false;

            if (saveBtn?.isConnected) {
                saveBtn.disabled = false;
            }
        }
    }

    /* ======================================
       OTVARANJE / PREUZIMANJE PDF-a
    ====================================== */

    async function openPdf(doc, download) {
        let tab = null;

        if (!download) {
            tab = window.open(
                "about:blank",
                "_blank"
            );

            if (!tab) {
                return message(
                    "Прегледач блокира прозор. " +
                    "Користи ПРЕУЗМИ.",
                    true
                );
            }

            tab.opener = null;
        }

        state.busy = true;

        try {
            const { data, error } =
                await sb.storage
                    .from(BUCKET)
                    .download(doc.storage_path);

            if (error) {
                throw error;
            }

            const url =
                URL.createObjectURL(data);

            if (download) {
                const link =
                    document.createElement("a");

                link.href = url;

                link.download =
                    doc.naziv_fajla || "ugovor.pdf";

                document.body.appendChild(link);

                link.click();
                link.remove();

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

            message(
                "Не могу да отворим PDF: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;
        }
    }

    /* ======================================
       CUVANJE UGOVORA
    ====================================== */

    async function saveContract(form) {
        const fd = new FormData(form);

        const str = key =>
            String(
                fd.get(key) || ""
            ).trim();

        const kind = str("vrsta");
        const status = str("status");

        const raw = str("iznos");

        const amount = raw === ""
            ? null
            : Number(raw);

        const start = str("datum_pocetka");
        const end = str("datum_isteka");

        const sponsorId =
            str("sponzor_id") || null;

        if (
            !str("naziv") ||
            !TYPES[kind] ||
            !STATUSES[status] ||
            (
                amount !== null &&
                (
                    !Number.isFinite(amount) ||
                    amount < 0
                )
            ) ||
            (
                start &&
                end &&
                end < start
            ) ||
            (
                sponsorId &&
                !state.sponsors.some(
                    s => s.id === sponsorId
                )
            )
        ) {
            return message(
                "Провери назив, врсту, износ, " +
                "датуме и спонзора.",
                true
            );
        }

        const payload = {
            naziv: str("naziv"),

            broj_ugovora:
                str("broj_ugovora") || null,

            vrsta: kind,

            druga_strana:
                str("druga_strana") || null,

            sponzor_id: sponsorId,

            datum_potpisivanja:
                str("datum_potpisivanja") || null,

            datum_pocetka:
                start || null,

            datum_isteka:
                end || null,

            iznos: amount,
            status,

            napomena:
                str("napomena") || null
        };

        state.busy = true;

        const btn = form.querySelector(
            'button[type="submit"]'
        );

        if (btn) {
            btn.disabled = true;
        }

        try {
            const result =
                state.editing === "new"

                    ? await sb
                        .from("portal_ugovori")
                        .insert(payload)
                        .select("id")
                        .single()

                    : await sb
                        .from("portal_ugovori")
                        .update(payload)
                        .eq("id", state.editing)
                        .select("id")
                        .single();

            if (result.error) {
                throw result.error;
            }

            state.selectedId = result.data.id;
            state.editing = null;

            await reload();

            message(
                "Уговор је успешно сачуван."
            );

        } catch (error) {
            console.error(
                "Contract saving:",
                error
            );

            message(
                "Грешка при чувању: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;

            if (btn?.isConnected) {
                btn.disabled = false;
            }
        }
    }

    /* ======================================
       OBRADA FORMULARA
    ====================================== */

    async function handleSubmit(event) {
        const form = event.target;

        if (
            form.id !== "portal-contract-form" &&
            form.id !== "portal-contract-file-form"
        ) {
            return;
        }

        event.preventDefault();

        if (state.busy) return;

        return form.id === "portal-contract-form"
            ? saveContract(form)
            : saveAttachment(form);
    }

    /* ======================================
       KLIKOVI NA DUGMAD
    ====================================== */

    async function handleClick(event) {
        const btn = event.target.closest(
            "button[data-action]"
        );

        if (!btn || state.busy) return;

        const action = btn.dataset.action;

        if (action === "back") {
            return back();
        }

        if (action === "new") {
            state.editing = "new";
            state.attachmentForm = false;

            return render();
        }

        if (action === "cancel") {
            state.editing = null;

            return render();
        }

        if (action === "select") {
            state.selectedId = btn.dataset.id;
            state.editing = null;
            state.attachmentForm = false;

            return render();
        }

        if (action === "edit") {
            if (
                !state.contracts.some(
                    c => c.id === btn.dataset.id
                )
            ) {
                return;
            }

            state.editing = btn.dataset.id;
            state.attachmentForm = false;

            return render();
        }

        /* BRISANJE UGOVORA */

        if (action === "delete-contract") {
            const c = state.contracts.find(
                x => x.id === btn.dataset.id
            );

            if (!c) return;

            return deleteContract(c);
        }

        /* DODAVANJE PDF-a */

        if (action === "add-file") {
            if (!state.selectedId) return;

            state.attachmentForm = true;

            render();

            screen.querySelector(
                "#portal-contract-file-form"
            )?.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

            return;
        }

        if (action === "cancel-file") {
            state.attachmentForm = false;

            return render();
        }

        /* OTVARANJE I PREUZIMANJE PDF-a */

        if (
            action === "preview-file" ||
            action === "download-file"
        ) {
            const doc = state.documents.find(
                d =>
                    d.id === btn.dataset.id &&
                    d.ugovor_id === state.selectedId
            );

            if (doc) {
                return openPdf(
                    doc,
                    action === "download-file"
                );
            }
        }
    }

    /* ======================================
       POVEZIVANJE SA PORTALOM
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
                "УГОВОРИ"
        );

        if (!grid || !heading || !card) {
            return false;
        }

        card.tabIndex = 0;

        card.setAttribute(
            "role",
            "button"
        );

        card.setAttribute(
            "aria-label",
            "Отвори евиденцију уговора"
        );

        card.classList.add(
            "portal-contract-launcher"
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

        screen.id = "portal-contracts-screen";
        screen.hidden = true;

        section.appendChild(screen);

        screen.addEventListener(
            "click",
            handleClick
        );

        screen.addEventListener(
            "submit",
            handleSubmit
        );

        screen.addEventListener(
            "input",
            event => {
                if (
                    event.target.id !==
                    "portal-contract-search"
                ) {
                    return;
                }

                state.search =
                    event.target.value;

                const list = screen.querySelector(
                    "#portal-contract-list"
                );

                if (list) {
                    list.innerHTML = listHTML();
                }
            }
        );

        sb.auth.onAuthStateChange(
            event => {
                if (event !== "SIGNED_OUT") {
                    return;
                }

                back();

                state.contracts = [];
                state.sponsors = [];
                state.documents = [];

                state.selectedId = null;
                state.search = "";

                screen.innerHTML = "";
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
