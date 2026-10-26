
/* =========================================================
   FK OBILIC - PORTAL UPRAVE / FINANSIJE
   Ostali prihodi i rashodi, bez dupliranja clanarina
   i sponzorskih uplata
========================================================= */
(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const CATEGORIES = {
        DONACIJA: "Донације",
        ULAZNICE: "Улазнице",
        DOGADJAJ: "Догађаји",
        OPREMA: "Опрема",
        PREVOZ: "Превоз",
        SUDIJE: "Судије",
        KOTIZACIJA: "Котизације",
        TEREN: "Терен и одржавање",
        KOMUNALIJE: "Комуналије",
        OSTALO: "Остало"
    };

    const PAYMENT_METHODS = {
        GOTOVINA: "Готовина",
        BANKA: "Банка",
        OSTALO: "Друго"
    };

    const TYPE_CATEGORIES = {
        PRIHOD: [
            "DONACIJA",
            "ULAZNICE",
            "DOGADJAJ",
            "OSTALO"
        ],
        RASHOD: [
            "OPREMA",
            "PREVOZ",
            "SUDIJE",
            "KOTIZACIJA",
            "TEREN",
            "KOMUNALIJE",
            "DOGADJAJ",
            "OSTALO"
        ]
    };

    const state = {
        rows: [],
        selectedId: null,
        editing: null,
        period: "month",
        month: belgradeToday().slice(0, 7),
        type: "ALL",
        search: "",
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

    const money = value =>
        new Intl.NumberFormat("sr-RS", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(Number(value || 0)) + " дин.";

    function belgradeToday() {
        return new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Belgrade",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(new Date());
    }

    function displayDate(value) {
        if (!value) return "—";

        const parts = String(value)
            .slice(0, 10)
            .split("-");

        return parts.length === 3
            ? `${parts[2]}.${parts[1]}.${parts[0]}.`
            : String(value);
    }

    function dateTime(iso) {
        return new Date(iso).toLocaleString(
            "sr-RS",
            {
                timeZone: "Europe/Belgrade",
                dateStyle: "short",
                timeStyle: "short"
            }
        );
    }

    function showMessage(text, isError = false) {
        const el = screen?.querySelector(
            "#portal-finance-message"
        );

        if (!el) return;

        el.textContent = text;
        el.classList.toggle("error", isError);
    }

    function selectOptions(values, selected) {
        return Object.entries(values)
            .map(([key, label]) => `
                <option
                    value="${esc(key)}"
                    ${key === selected ? "selected" : ""}
                >
                    ${esc(label)}
                </option>
            `)
            .join("");
    }

    function categoryOptions(type, selected) {
        const keys = [
            ...(TYPE_CATEGORIES[type] ||
                TYPE_CATEGORIES.RASHOD)
        ];

        if (
            selected &&
            CATEGORIES[selected] &&
            !keys.includes(selected)
        ) {
            keys.push(selected);
        }

        return keys.map(key => `
            <option
                value="${esc(key)}"
                ${key === selected ? "selected" : ""}
            >
                ${esc(CATEGORIES[key])}
            </option>
        `).join("");
    }

    /* ======================================
       PRAVA PRISTUPA
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
       UCITAVANJE FINANSIJA
    ====================================== */

    async function readAll() {
        const items = [];

        for (
            let offset = 0;
            ;
            offset += 400
        ) {
            const { data, error } = await sb
                .from("portal_finansijski_unosi")
                .select(
                    "id,datum,vrsta,kategorija,opis,iznos,nacin_placanja,druga_strana,napomena,stornirano,storno_razlog,stornirano_at,created_at"
                )
                .order("created_at", {
                    ascending: false
                })
                .range(offset, offset + 399);

            if (error) throw error;

            items.push(...(data || []));

            if (
                !data ||
                data.length < 400
            ) {
                break;
            }
        }

        return items;
    }

    async function reload() {
        const version = ++state.version;

        try {
            const rows = await readAll();

            if (
                !state.open ||
                version !== state.version
            ) {
                return;
            }

            state.rows = rows;

            if (
                state.selectedId &&
                !rows.some(
                    row => row.id === state.selectedId
                )
            ) {
                state.selectedId = null;
            }

            render();

        } catch (error) {
            if (version !== state.version) {
                return;
            }

            console.error(
                "Finansije ucitavanje:",
                error
            );

            showMessage(
                "Грешка при учитавању: " +
                (error.message || "непозната грешка"),
                true
            );
        }
    }

    /* ======================================
       FILTERI
    ====================================== */

    function inPeriod(row) {
        return (
            state.period === "all" ||
            String(row.datum || "")
                .startsWith(state.month)
        );
    }

    function visibleRows() {
        const q = state.search
            .trim()
            .toLocaleLowerCase("sr-RS");

        return state.rows.filter(row => {
            if (!inPeriod(row)) {
                return false;
            }

            if (
                state.type !== "ALL" &&
                row.vrsta !== state.type
            ) {
                return false;
            }

            if (!q) return true;

            return [
                row.opis,
                row.druga_strana,
                row.napomena,
                CATEGORIES[row.kategorija],
                PAYMENT_METHODS[row.nacin_placanja]
            ].some(
                value =>
                    String(value || "")
                        .toLocaleLowerCase("sr-RS")
                        .includes(q)
            );

        }).sort(
            (a, b) =>
                b.datum.localeCompare(a.datum) ||
                b.created_at.localeCompare(
                    a.created_at
                )
        );
    }

    /* ======================================
       STATISTIKA
    ====================================== */

    function statsHTML() {
        let income = 0;
        let expense = 0;

        for (const row of state.rows) {
            if (
                !inPeriod(row) ||
                row.stornirano
            ) {
                continue;
            }

            const cents = Math.round(
                Number(row.iznos) * 100
            );

            if (row.vrsta === "PRIHOD") {
                income += cents;
            }

            if (row.vrsta === "RASHOD") {
                expense += cents;
            }
        }

        const difference =
            income - expense;

        return `
            <div class="portal-finance-stat">

                <span>ПРИХОДИ</span>

                <strong>
                    ${esc(money(income / 100))}
                </strong>

            </div>

            <div class="portal-finance-stat">

                <span>РАСХОДИ</span>

                <strong>
                    ${esc(money(expense / 100))}
                </strong>

            </div>

            <div class="portal-finance-stat">

                <span>РАЗЛИКА</span>

                <strong
                    class="${
                        difference < 0
                            ? "negative"
                            : "positive"
                    }"
                >
                    ${difference > 0 ? "+" : ""}
                    ${esc(money(difference / 100))}
                </strong>

            </div>
        `;
    }

    /* ======================================
       SPISAK TRANSAKCIJA
    ====================================== */

    function listHTML() {
        const rows = visibleRows();

        if (!rows.length) {
            return `
                <p class="portal-finance-empty">
                    ${
                        state.rows.length
                            ? "Нема уноса за изабране филтере."
                            : "Још нема финансијских уноса. Додај први."
                    }
                </p>
            `;
        }

        return rows.map(row => `
            <button
                type="button"
                class="portal-finance-item
                    ${
                        row.id === state.selectedId
                            ? "selected"
                            : ""
                    }
                    ${
                        row.stornirano
                            ? "void"
                            : ""
                    }"
                data-action="select"
                data-id="${esc(row.id)}"
            >

                <span class="portal-finance-item-top">

                    <strong>
                        ${esc(row.opis)}
                    </strong>

                    <b
                        class="${
                            row.vrsta === "PRIHOD"
                                ? "income"
                                : "expense"
                        }"
                    >
                        ${
                            row.vrsta === "PRIHOD"
                                ? "+"
                                : "−"
                        }
                        ${esc(money(row.iznos))}
                    </b>

                </span>

                <span class="portal-finance-item-meta">

                    ${esc(displayDate(row.datum))}

                    ·

                    ${esc(
                        CATEGORIES[row.kategorija] ||
                        row.kategorija
                    )}

                    ${
                        row.stornirano
                            ? " · СТОРНИРАНО"
                            : ""
                    }

                </span>

            </button>
        `).join("");
    }

    /* ======================================
       FORMULAR ZA UNOS
    ====================================== */

    function editorHTML() {
        const row = state.editing === "new"
            ? null
            : state.rows.find(
                item => item.id === state.editing
            );

        const type =
            row?.vrsta || "RASHOD";

        const category =
            row?.kategorija || "OPREMA";

        return `
            <div class="portal-finance-panel">

                <h3>
                    ${
                        row
                            ? "ИЗМЕНИ УНОС"
                            : "НОВИ ФИНАНСИЈСКИ УНОС"
                    }
                </h3>

                <form
                    id="portal-finance-form"
                    class="portal-finance-form"
                >

                    <label>
                        ВРСТА *

                        <select
                            name="vrsta"
                            required
                        >

                            <option
                                value="PRIHOD"
                                ${
                                    type === "PRIHOD"
                                        ? "selected"
                                        : ""
                                }
                            >
                                ПРИХОД
                            </option>

                            <option
                                value="RASHOD"
                                ${
                                    type === "RASHOD"
                                        ? "selected"
                                        : ""
                                }
                            >
                                РАСХОД
                            </option>

                        </select>
                    </label>

                    <label>
                        ДАТУМ *

                        <input
                            type="date"
                            name="datum"
                            required
                            value="${esc(
                                row?.datum ||
                                belgradeToday()
                            )}"
                        >
                    </label>

                    <label class="wide">
                        ОПИС *

                        <input
                            name="opis"
                            required
                            maxlength="300"
                            placeholder="Нпр. Куповина лопти"
                            value="${esc(
                                row?.opis || ""
                            )}"
                        >
                    </label>

                    <label>
                        КАТЕГОРИЈА *

                        <select
                            name="kategorija"
                            required
                        >
                            ${categoryOptions(
                                type,
                                category
                            )}
                        </select>
                    </label>

                    <label>
                        ИЗНОС (ДИН.) *

                        <input
                            type="number"
                            name="iznos"
                            min="0.01"
                            step="0.01"
                            required
                            value="${esc(
                                row?.iznos ?? ""
                            )}"
                        >
                    </label>

                    <label>
                        НАЧИН ПЛАЋАЊА *

                        <select
                            name="nacin_placanja"
                            required
                        >
                            ${selectOptions(
                                PAYMENT_METHODS,
                                row?.nacin_placanja ||
                                "GOTOVINA"
                            )}
                        </select>
                    </label>

                    <label>
                        ОД КОГА / КОМЕ (ОПЦИОНО)

                        <input
                            name="druga_strana"
                            maxlength="200"
                            value="${esc(
                                row?.druga_strana || ""
                            )}"
                        >
                    </label>

                    <label class="wide">
                        НАПОМЕНА

                        <textarea
                            name="napomena"
                            rows="3"
                            maxlength="2000"
                        >${esc(
                            row?.napomena || ""
                        )}</textarea>
                    </label>

                    <div class="portal-finance-actions wide">

                        <button
                            type="submit"
                            class="primary"
                        >
                            САЧУВАЈ
                        </button>

                        <button
                            type="button"
                            data-action="cancel"
                        >
                            ОДУСТАНИ
                        </button>

                    </div>

                </form>

                <p class="portal-finance-help">
                    Чланарине и спонзорске уплате
                    већ имају своје евиденције.
                    Не уноси их поново овде.
                </p>

            </div>
        `;
    }

    /* ======================================
       DETALJI UNOSA
    ====================================== */

    function detailsHTML(row) {
        const field = (label, value) => `
            <div>
                <span>${label}</span>
                <strong>${esc(value)}</strong>
            </div>
        `;

        return `
            <div class="portal-finance-panel">

                <div class="portal-finance-detail-head">

                    <div>

                        <span>
                            ${
                                row.vrsta === "PRIHOD"
                                    ? "ПРИХОД"
                                    : "РАСХОД"
                            }

                            ${
                                row.stornirano
                                    ? " · СТОРНИРАНО"
                                    : ""
                            }
                        </span>

                        <h3>
                            ${esc(row.opis)}
                        </h3>

                    </div>

                    <strong
                        class="portal-finance-amount
                        ${
                            row.vrsta === "PRIHOD"
                                ? "income"
                                : "expense"
                        }"
                    >
                        ${
                            row.vrsta === "PRIHOD"
                                ? "+"
                                : "−"
                        }
                        ${esc(money(row.iznos))}
                    </strong>

                </div>

                <div class="portal-finance-details">

                    ${field(
                        "ДАТУМ",
                        displayDate(row.datum)
                    )}

                    ${field(
                        "КАТЕГОРИЈА",
                        CATEGORIES[row.kategorija] ||
                        row.kategorija
                    )}

                    ${field(
                        "НАЧИН ПЛАЋАЊА",
                        PAYMENT_METHODS[
                            row.nacin_placanja
                        ] || row.nacin_placanja
                    )}

                    ${field(
                        "ОД КОГА / КОМЕ",
                        row.druga_strana || "—"
                    )}

                </div>

                ${row.napomena
                    ? `
                        <div class="portal-finance-note">

                            <b>НАПОМЕНА</b>

                            <p>
                                ${esc(row.napomena)}
                            </p>

                        </div>
                    `
                    : ""
                }

                ${row.stornirano
                    ? `
                        <div class="portal-finance-storno">

                            <b>СТОРНИРАНО</b>

                            <p>
                                Разлог:
                                ${esc(
                                    row.storno_razlog ||
                                    "—"
                                )}
                            </p>

                            <p>
                                Датум:
                                ${esc(
                                    row.stornirano_at
                                        ? dateTime(
                                            row.stornirano_at
                                          )
                                        : "—"
                                )}
                            </p>

                            <p>
                                Овај износ се не рачуна
                                у финансијски преглед.
                            </p>

                        </div>
                    `
                    : `
                        <div class="portal-finance-actions">

                            <button
                                type="button"
                                data-action="edit"
                                data-id="${esc(row.id)}"
                            >
                                ИЗМЕНИ
                            </button>

                            <button
                                type="button"
                                class="danger"
                                data-action="void"
                                data-id="${esc(row.id)}"
                            >
                                СТОРНИРАЈ УНОС
                            </button>

                        </div>
                    `
                }

            </div>
        `;
    }

    /* ======================================
       GLAVNI PRIKAZ
    ====================================== */

    function render() {
        if (!state.open || !screen) {
            return;
        }

        const chosen = state.rows.find(
            row => row.id === state.selectedId
        );

        screen.innerHTML = `

            <div class="portal-finance-header">

                <button
                    type="button"
                    data-action="back"
                >
                    ← НАЗАД НА УПРАВУ
                </button>

                <span>
                    ФК ОБИЛИЋ · ПРИВАТНА ЕВИДЕНЦИЈА
                </span>

                <h2>
                    ФИНАНСИЈЕ КЛУБА
                </h2>

                <p>
                    Остали приходи и расходи.
                    Чланарине и спонзорске уплате
                    воде се одвојено.
                </p>

            </div>

            <p
                id="portal-finance-message"
                class="portal-finance-message"
                role="status"
            ></p>

            <div
                class="portal-finance-stats"
                id="portal-finance-stats"
            >
                ${statsHTML()}
            </div>

            <div class="portal-finance-layout">

                <div class="portal-finance-panel">

                    <div class="portal-finance-panel-head">

                        <h3>
                            ЕВИДЕНЦИЈА
                        </h3>

                        <button
                            type="button"
                            class="primary"
                            data-action="new"
                        >
                            + ДОДАЈ
                        </button>

                    </div>

                    <div class="portal-finance-filters">

                        <label>
                            ПЕРИОД

                            <select
                                id="portal-finance-period"
                            >
                                <option
                                    value="month"
                                    ${
                                        state.period === "month"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Изабрани месец
                                </option>

                                <option
                                    value="all"
                                    ${
                                        state.period === "all"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Сви месеци
                                </option>
                            </select>
                        </label>

                        <label>
                            МЕСЕЦ

                            <input
                                id="portal-finance-month"
                                type="month"
                                value="${esc(state.month)}"
                                ${
                                    state.period === "all"
                                        ? "disabled"
                                        : ""
                                }
                            >
                        </label>

                        <label>
                            ВРСТА УНОСА

                            <select
                                id="portal-finance-type"
                            >
                                <option
                                    value="ALL"
                                    ${
                                        state.type === "ALL"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Сви уноси
                                </option>

                                <option
                                    value="PRIHOD"
                                    ${
                                        state.type === "PRIHOD"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Само приходи
                                </option>

                                <option
                                    value="RASHOD"
                                    ${
                                        state.type === "RASHOD"
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    Само расходи
                                </option>
                            </select>
                        </label>

                        <label>
                            ПРЕТРАГА

                            <input
                                id="portal-finance-search"
                                type="search"
                                placeholder="Опис, категорија, прималац..."
                                value="${esc(state.search)}"
                            >
                        </label>

                    </div>

                    <p class="portal-finance-help">
                        Горњи износи важе за изабрани
                        период. Филтер врсте и претрага
                        мењају само списак.
                    </p>

                    <div
                        id="portal-finance-list"
                        class="portal-finance-list"
                    >
                        ${listHTML()}
                    </div>

                </div>

                ${
                    state.editing !== null
                        ? editorHTML()

                        : chosen
                            ? detailsHTML(chosen)

                            : `
                                <div class="portal-finance-panel">

                                    <h3>ДЕТАЉИ</h3>

                                    <p class="portal-finance-empty">
                                        Изабери унос или додај нови.
                                    </p>

                                </div>
                            `
                }

            </div>
        `;
    }

    /* ======================================
       OSVEZAVANJE FILTERA
    ====================================== */

    function refreshFilters() {
        if (!screen || !state.open) return;

        const stats = screen.querySelector(
            "#portal-finance-stats"
        );

        const list = screen.querySelector(
            "#portal-finance-list"
        );

        const month = screen.querySelector(
            "#portal-finance-month"
        );

        if (stats) {
            stats.innerHTML = statsHTML();
        }

        if (list) {
            list.innerHTML = listHTML();
        }

        if (month) {
            month.disabled =
                state.period === "all";
        }
    }

    /* ======================================
       OTVARANJE FINANSIJA
    ====================================== */

    async function open() {
        if (state.open || state.busy) {
            return;
        }

        try {
            if (!(await isManagement())) {
                window.alert(
                    "Само овлашћена управа има приступ финансијама."
                );

                return;
            }

            state.open = true;

            grid.hidden = true;
            heading.hidden = true;
            screen.hidden = false;

            render();

            showMessage("Учитавање...");

            await reload();

        } catch (error) {
            console.error(
                "Finansije pristup:",
                error
            );

            if (state.open) {
                showMessage(
                    "Учитавање није успело: " +
                    (error.message || "грешка"),
                    true
                );
            } else {
                window.alert(
                    "Приступ финансијама није успео: " +
                    (error.message || "грешка")
                );
            }
        }
    }

    function back() {
        state.open = false;
        state.editing = null;
        state.version++;

        if (screen) {
            screen.hidden = true;
        }

        if (grid) {
            grid.hidden = false;
        }

        if (heading) {
            heading.hidden = false;
        }
    }

    /* ======================================
       CUVANJE FINANSIJSKOG UNOSA
    ====================================== */

    async function save(event) {
        const form = event.target;

        if (
            form.id !== "portal-finance-form"
        ) {
            return;
        }

        event.preventDefault();

        if (state.busy) return;

        const fd = new FormData(form);

        const str = key =>
            String(fd.get(key) || "").trim();

        const type = str("vrsta");
        const category = str("kategorija");
        const payment = str("nacin_placanja");

        const amount = Number(
            str("iznos")
        );

        const description = str("opis");
        const datum = str("datum");

        if (
            !TYPE_CATEGORIES[type] ||
            !CATEGORIES[category] ||
            !PAYMENT_METHODS[payment] ||
            !description ||
            !/^\d{4}-\d{2}-\d{2}$/.test(datum) ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            Math.abs(
                Math.round(amount * 100) -
                amount * 100
            ) > 1e-6
        ) {
            showMessage(
                "Провери обавезна поља, датум и износ (највише две децимале).",
                true
            );

            return;
        }

        const payload = {
            datum,
            vrsta: type,
            kategorija: category,
            opis: description,
            iznos: amount,
            nacin_placanja: payment,

            druga_strana:
                str("druga_strana") || null,

            napomena:
                str("napomena") || null
        };

        const isNew =
            state.editing === "new";

        state.busy = true;

        const button = form.querySelector(
            'button[type="submit"]'
        );

        if (button) {
            button.disabled = true;
        }

        try {
            const result = isNew

                ? await sb
                    .from("portal_finansijski_unosi")
                    .insert(payload)
                    .select("id")
                    .single()

                : await sb
                    .from("portal_finansijski_unosi")
                    .update(payload)
                    .eq("id", state.editing)
                    .eq("stornirano", false)
                    .select("id")
                    .single();

            if (result.error) {
                throw result.error;
            }

            state.selectedId = result.data.id;
            state.editing = null;

            await reload();

            showMessage(
                isNew
                    ? "Унос је успешно додат."
                    : "Измене су сачуване."
            );

        } catch (error) {
            console.error(
                "Finansije cuvanje:",
                error
            );

            showMessage(
                "Чување није успело: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;

            if (button?.isConnected) {
                button.disabled = false;
            }
        }
    }

    /* ======================================
       STORNIRANJE UNOSA
    ====================================== */

    async function voidEntry(row) {
        const reason = window.prompt(
            "СТОРНИРАЊЕ УНОСА\n\n" +
            row.opis + " — " +
            money(row.iznos) + "\n\n" +
            "Унос остаје у историји, " +
            "али не улази у збир.\n" +
            "Упиши разлог сторнирања " +
            "(најмање 3 знака):"
        );

        if (reason === null) {
            return;
        }

        if (reason.trim().length < 3) {
            showMessage(
                "Унеси разлог сторнирања од најмање 3 знака.",
                true
            );

            return;
        }

        if (
            !window.confirm(
                "Потврђујеш сторнирање овог уноса?"
            )
        ) {
            return;
        }

        state.busy = true;

        try {
            const { data, error } =
                await sb.rpc(
                    "portal_storniraj_finansijski_unos",
                    {
                        p_id: row.id,
                        p_razlog: reason.trim()
                    }
                );

            if (error) {
                throw error;
            }

            if (data !== true) {
                throw new Error(
                    "Унос није пронађен или је већ сторниран."
                );
            }

            await reload();

            showMessage(
                "Унос је сторниран и више се не рачуна у збир."
            );

        } catch (error) {
            console.error(
                "Finansije storno:",
                error
            );

            showMessage(
                "Сторнирање није успело: " +
                (error.message || "грешка"),
                true
            );

        } finally {
            state.busy = false;
        }
    }

    /* ======================================
       KLIKOVI NA DUGMAD
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

        const row = state.rows.find(
            item => item.id === button.dataset.id
        );

        if (!row || row.stornirano) {
            return;
        }

        if (action === "edit") {
            state.editing = row.id;

            return render();
        }

        if (action === "void") {
            return voidEntry(row);
        }
    }

    /* ======================================
       PROMENA FILTERA
    ====================================== */

    function change(event) {
        const el = event.target;

        if (el.id === "portal-finance-period") {
            state.period =
                el.value === "all"
                    ? "all"
                    : "month";

            refreshFilters();
        }

        if (el.id === "portal-finance-month") {
            if (
                /^\d{4}-\d{2}$/.test(el.value)
            ) {
                state.month = el.value;

                refreshFilters();
            }
        }

        if (el.id === "portal-finance-type") {
            state.type = [
                "ALL",
                "PRIHOD",
                "RASHOD"
            ].includes(el.value)
                ? el.value
                : "ALL";

            refreshFilters();
        }

        if (el.id === "portal-finance-search") {
            state.search = el.value;

            refreshFilters();
        }

        /* Kategorije po vrsti unosa */

        if (
            el.name === "vrsta" &&
            el.closest("#portal-finance-form")
        ) {
            const form = el.closest(
                "#portal-finance-form"
            );

            const category = form.elements
                .namedItem("kategorija");

            const keys =
                TYPE_CATEGORIES[el.value] || [];

            const chosen =
                keys.includes(category.value)
                    ? category.value
                    : keys[0];

            category.innerHTML =
                categoryOptions(
                    el.value,
                    chosen
                );
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
                "ФИНАНСИЈЕ"
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
            "Отвори финансије клуба"
        );

        card.classList.add(
            "portal-finance-launcher"
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

        screen = document.createElement(
            "div"
        );

        screen.id = "portal-finance-screen";
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

        screen.addEventListener(
            "change",
            change
        );

        screen.addEventListener(
            "input",
            event => {
                if (
                    event.target.id ===
                    "portal-finance-search"
                ) {
                    change(event);
                }
            }
        );

        sb.auth.onAuthStateChange(
            event => {
                if (event !== "SIGNED_OUT") {
                    return;
                }

                back();

                state.rows = [];
                state.selectedId = null;
                state.search = "";
                state.type = "ALL";
                state.period = "month";

                state.month =
                    belgradeToday().slice(0, 7);

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

    if (
        document.readyState === "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {
        init();
    }

})();
