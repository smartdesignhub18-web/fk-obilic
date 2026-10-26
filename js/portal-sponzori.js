
/* FK OBILIC - PORTAL UPRAVE: SPONZORI I UPLATE */
(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const STATUS = {
        POTENCIJALAN: "Потенцијалан",
        AKTIVAN: "Активан",
        ZAVRSEN: "Завршен",
        ODUSTAO: "Одустао"
    };

    const SUPPORT_TYPES = {
        NOVAC: "Новчана средства",
        USLUGA: "Услуга",
        MATERIJAL: "Материјал",
        OSTALO: "Друга врста помоћи"
    };

    const state = {
        sponsors: [],
        payments: [],
        selectedId: null,
        editing: null,
        open: false,
        busy: false,
        version: 0
    };

    let section, grid, heading, card, screen;

    const h = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const toPara = value =>
        Math.round(Number(value || 0) * 100);

    const din = value =>
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

    /* ======================================
       POMOCNE FUNKCIJE
    ====================================== */

    function notice(text, error = false) {
        const el = screen?.querySelector(
            "#portal-sponsors-message"
        );

        if (!el) return;

        el.textContent = text;
        el.classList.toggle("error", error);
    }

    async function readAll(table, columns) {
        const all = [];
        let offset = 0;

        while (true) {
            const { data, error } = await sb
                .from(table)
                .select(columns)
                .order("created_at", {
                    ascending: false
                })
                .range(offset, offset + 499);

            if (error) throw error;

            all.push(...(data || []));

            if (!data || data.length < 500) {
                break;
            }

            offset += 500;
        }

        return all;
    }

    /* ======================================
       UCITAVANJE PODATAKA
    ====================================== */

    async function reload() {
        const version = ++state.version;

        try {
            const [sponsors, payments] =
                await Promise.all([
                    readAll(
                        "portal_sponzori",
                        "id,naziv,kontakt_osoba,telefon,email,ugovoreni_iznos,vrsta_podrske,opis_podrske,realizovano,datum_realizacije,datum_od,datum_do,status,napomena,created_at"
                    ),
                    readAll(
                        "portal_sponzorske_uplate",
                        "id,sponzor_id,iznos,datum_uplate,napomena,stornirano,created_at"
                    )
                ]);

            if (version !== state.version) return;

            state.sponsors = sponsors;
            state.payments = payments;

            if (
                state.selectedId &&
                !sponsors.some(
                    s => s.id === state.selectedId
                )
            ) {
                state.selectedId = null;
            }

            render();

        } catch (error) {
            if (version !== state.version) return;

            console.error(
                "Sponsors loading:",
                error
            );

            notice(
                "Неуспешно учитавање: " +
                (error.message || "грешка"),
                true
            );
        }
    }

    /* ======================================
       FINANSIJSKI OBRACUN
    ====================================== */

    function sumPaid(id) {
        return state.payments
            .filter(
                p =>
                    p.sponzor_id === id &&
                    !p.stornirano
            )
            .reduce(
                (sum, p) =>
                    sum + toPara(p.iznos),
                0
            );
    }

    function summary(s) {
        if (!s) return "";

        if (
            (s.vrsta_podrske || "NOVAC") !== "NOVAC"
        ) {
            return `
                <div class="portal-sponsors-stat">
                    <span>ВРСТА ПОДРШКЕ</span>
                    <strong>
                        ${h(
                            SUPPORT_TYPES[s.vrsta_podrske] ||
                            "Друга помоћ"
                        )}
                    </strong>
                </div>

                <div class="portal-sponsors-stat">
                    <span>РЕАЛИЗАЦИЈА</span>
                    <strong>
                        ${s.realizovano
                            ? "РЕАЛИЗОВАНО"
                            : "НИЈЕ РЕАЛИЗОВАНО"}
                    </strong>
                </div>

                <div class="portal-sponsors-stat">
                    <span>ДАТУМ РЕАЛИЗАЦИЈЕ</span>
                    <strong>
                        ${h(
                            s.datum_realizacije || "—"
                        )}
                    </strong>
                </div>
            `;
        }

        const contracted =
            toPara(s.ugovoreni_iznos);

        const paid = sumPaid(s.id);

        const remaining =
            Math.max(0, contracted - paid);

        return `
            <div class="portal-sponsors-stat">
                <span>УГОВОРЕНО</span>
                <strong>
                    ${h(din(contracted / 100))}
                </strong>
            </div>

            <div class="portal-sponsors-stat">
                <span>УПЛАЋЕНО</span>
                <strong>
                    ${h(din(paid / 100))}
                </strong>
            </div>

            <div class="portal-sponsors-stat">
                <span>ПРЕОСТАЛО</span>
                <strong>
                    ${h(din(remaining / 100))}
                </strong>
            </div>
        `;
    }

    function options(value) {
        return Object.entries(STATUS)
            .map(([key, label]) => `
                <option
                    value="${key}"
                    ${value === key ? "selected" : ""}
                >
                    ${label}
                </option>
            `)
            .join("");
    }

    /* ======================================
       FORMULAR SPONZORA
    ====================================== */

    function sponsorForm() {
        const s = state.editing === "new"
            ? null
            : state.sponsors.find(
                x => x.id === state.editing
            );

        const kind =
            s?.vrsta_podrske || "NOVAC";

        const isMoney =
            kind === "NOVAC";

        return `
            <div class="portal-sponsors-panel">

                <h3>
                    ${s
                        ? "ИЗМЕНИ СПОНЗОРА"
                        : "НОВИ СПОНЗОР"}
                </h3>

                <form
                    id="portal-sponsor-form"
                    class="portal-sponsors-form"
                >

                    <label class="wide">
                        НАЗИВ *

                        <input
                            name="naziv"
                            required
                            maxlength="150"
                            value="${h(s?.naziv || "")}"
                        >
                    </label>

                    <label>
                        КОНТАКТ ОСОБА

                        <input
                            name="kontakt_osoba"
                            maxlength="120"
                            value="${h(s?.kontakt_osoba || "")}"
                        >
                    </label>

                    <label>
                        ТЕЛЕФОН

                        <input
                            name="telefon"
                            maxlength="60"
                            value="${h(s?.telefon || "")}"
                        >
                    </label>

                    <label>
                        Е-МАИЛ

                        <input
                            name="email"
                            type="email"
                            maxlength="200"
                            value="${h(s?.email || "")}"
                        >
                    </label>

                    <label>
                        ВРСТА ПОДРШКЕ *

                        <select
                            name="vrsta_podrske"
                            required
                        >
                            ${Object.entries(
                                SUPPORT_TYPES
                            ).map(([key, label]) => `
                                <option
                                    value="${key}"
                                    ${kind === key
                                        ? "selected"
                                        : ""}
                                >
                                    ${label}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label
                        class="portal-sponsor-money-field"
                        ${isMoney ? "" : "hidden"}
                    >
                        УГОВОРЕНИ ИЗНОС (ДИН.)

                        <input
                            name="ugovoreni_iznos"
                            type="number"
                            min="0"
                            step="0.01"
                            ${isMoney ? "required" : ""}
                            value="${h(
                                s?.ugovoreni_iznos ?? 0
                            )}"
                        >
                    </label>

                    <div
                        class="portal-sponsor-nonmoney-fields wide"
                        ${isMoney ? "hidden" : ""}
                    >

                        <label class="wide">
                            ОПИС ДОГОВОРЕНЕ ПОМОЋИ *

                            <textarea
                                name="opis_podrske"
                                rows="3"
                                maxlength="2000"
                                placeholder="Опиши услугу, материјал или другу помоћ"
                                ${isMoney ? "" : "required"}
                            >${h(s?.opis_podrske || "")}</textarea>
                        </label>

                        <label>
                            РЕАЛИЗАЦИЈА

                            <select name="realizovano">

                                <option
                                    value="false"
                                    ${!s?.realizovano
                                        ? "selected"
                                        : ""}
                                >
                                    НИЈЕ РЕАЛИЗОВАНО
                                </option>

                                <option
                                    value="true"
                                    ${s?.realizovano
                                        ? "selected"
                                        : ""}
                                >
                                    РЕАЛИЗОВАНО
                                </option>

                            </select>
                        </label>

                        <label>
                            ДАТУМ РЕАЛИЗАЦИЈЕ

                            <input
                                type="date"
                                name="datum_realizacije"
                                value="${h(
                                    s?.datum_realizacije || ""
                                )}"
                            >
                        </label>

                    </div>

                    <label>
                        ПОЧЕТАК САРАДЊЕ

                        <input
                            name="datum_od"
                            type="date"
                            value="${h(s?.datum_od || "")}"
                        >
                    </label>

                    <label>
                        КРАЈ САРАДЊЕ

                        <input
                            name="datum_do"
                            type="date"
                            value="${h(s?.datum_do || "")}"
                        >
                    </label>

                    <label>
                        СТАТУС

                        <select name="status">
                            ${options(
                                s?.status || "AKTIVAN"
                            )}
                        </select>
                    </label>

                    <label class="wide">
                        НАПОМЕНА

                        <textarea
                            name="napomena"
                            rows="3"
                            maxlength="2000"
                        >${h(s?.napomena || "")}</textarea>
                    </label>

                    <div
                        class="portal-sponsors-form-actions wide"
                    >
                        <button
                            type="submit"
                            class="primary"
                        >
                            САЧУВАЈ
                        </button>

                        <button
                            type="button"
                            data-action="cancel-edit"
                        >
                            ОДУСТАНИ
                        </button>
                    </div>

                </form>
            </div>
        `;
    }

    /* ======================================
       ZAGLAVLJE DETALJA SPONZORA

       ISTA DUGMAD ZA SVE VRSTE
    ====================================== */

    function detailHeader(s) {
        return `
            <div class="portal-sponsors-panel-head">

                <div>
                    <span>
                        ${h(
                            STATUS[s.status] || s.status
                        )}
                    </span>

                    <h3>
                        ${h(s.naziv)}
                    </h3>
                </div>

                <button
                    type="button"
                    data-action="edit"
                    data-id="${h(s.id)}"
                >
                    ИЗМЕНИ
                </button>

                <button
                    type="button"
                    class="portal-sponsor-delete-button"
                    data-action="delete"
                    data-id="${h(s.id)}"
                >
                    ОБРИШИ СПОНЗОРА
                </button>

            </div>
        `;
    }

    /* ======================================
       DETALJI SPONZORA
    ====================================== */

    function sponsorDetails(s) {
        const header = detailHeader(s);

        /* USLUGA, MATERIJAL I DRUGA POMOC */

        if (
            (s.vrsta_podrske || "NOVAC") !== "NOVAC"
        ) {
            return `
                <div class="portal-sponsors-panel">

                    ${header}

                    <p class="portal-sponsors-meta">
                        Врста подршке:

                        <strong>
                            ${h(
                                SUPPORT_TYPES[
                                    s.vrsta_podrske
                                ] || "Друга помоћ"
                            )}
                        </strong>
                    </p>

                    <p class="portal-sponsors-meta">
                        Период:
                        ${h(s.datum_od || "—")}
                        —
                        ${h(s.datum_do || "—")}
                    </p>

                    <h4>ДОГОВОРЕНА ПОМОЋ</h4>

                    <div class="portal-sponsors-note">
                        ${h(
                            s.opis_podrske ||
                            "Нема описа."
                        )}
                    </div>

                    <h4>СТАТУС РЕАЛИЗАЦИЈЕ</h4>

                    <p class="portal-sponsors-meta">
                        ${s.realizovano
                            ? "Помоћ је реализована."
                            : "Помоћ још није евидентирана као реализована."}
                    </p>

                    ${s.realizovano &&
                        s.datum_realizacije
                        ? `
                            <p class="portal-sponsors-meta">
                                Датум реализације:
                                ${h(
                                    s.datum_realizacije
                                )}
                            </p>
                        `
                        : ""}

                </div>
            `;
        }

        /* NOVCANI SPONZOR */

        const paid = sumPaid(s.id);

        const contract =
            toPara(s.ugovoreni_iznos);

        const remaining =
            Math.max(0, contract - paid);

        const percent = contract > 0
            ? Math.min(
                100,
                paid / contract * 100
            )
            : 0;

        const rows = state.payments.filter(
            p => p.sponzor_id === s.id
        );

        return `
            <div class="portal-sponsors-panel">

                ${header}

                <p class="portal-sponsors-meta">

                    ${h(
                        s.kontakt_osoba ||
                        "Нема контакт особе"
                    )}

                    ${s.telefon
                        ? " · " + h(s.telefon)
                        : ""}

                    ${s.email
                        ? " · " + h(s.email)
                        : ""}
                </p>

                <p class="portal-sponsors-meta">
                    Период:
                    ${h(s.datum_od || "—")}
                    —
                    ${h(s.datum_do || "—")}
                </p>

                ${s.napomena
                    ? `
                        <p class="portal-sponsors-note">
                            ${h(s.napomena)}
                        </p>
                    `
                    : ""}

                <div class="portal-sponsors-money">

                    <span>
                        Уговорено:
                        <strong>
                            ${h(din(contract / 100))}
                        </strong>
                    </span>

                    <span>
                        Уплаћено:
                        <strong>
                            ${h(din(paid / 100))}
                        </strong>
                    </span>

                    <span>
                        Преостало:
                        <strong>
                            ${h(din(remaining / 100))}
                        </strong>
                    </span>

                </div>

                <div
                    class="portal-sponsors-progress"
                    aria-label="Проценат уплате"
                >
                    <div
                        style="width:${percent.toFixed(2)}%"
                    ></div>
                </div>

                ${paid > contract
                    ? `
                        <p class="portal-sponsors-note">
                            Уплаћено је више од уговореног за
                            ${h(
                                din(
                                    (paid - contract) / 100
                                )
                            )}.
                        </p>
                    `
                    : ""}

                <h4>НОВА УПЛАТА</h4>

                <form
                    id="portal-sponsor-payment-form"
                    class="portal-sponsors-form payment"
                >

                    <label>
                        ИЗНОС (ДИН.) *

                        <input
                            name="iznos"
                            type="number"
                            min="0.01"
                            step="0.01"
                            required
                        >
                    </label>

                    <label>
                        ДАТУМ *

                        <input
                            name="datum_uplate"
                            type="date"
                            required
                            value="${today()}"
                        >
                    </label>

                    <label class="wide">
                        НАПОМЕНА

                        <input
                            name="napomena"
                            maxlength="500"
                            placeholder="Опционо"
                        >
                    </label>

                    <div class="wide">

                        <button
                            class="primary"
                            type="submit"
                        >
                            ЕВИДЕНТИРАЈ УПЛАТУ
                        </button>

                    </div>

                </form>

                <h4>ИСТОРИЈА УПЛАТА</h4>

                <div class="portal-sponsors-payments">

                    ${rows.length
                        ? rows.map(p => `
                            <div
                                class="portal-sponsors-payment
                                ${p.stornirano
                                    ? "void"
                                    : ""}"
                            >

                                <div>

                                    <strong>
                                        ${h(din(p.iznos))}
                                    </strong>

                                    <span>
                                        ${h(p.datum_uplate)}

                                        ${p.napomena
                                            ? " · " +
                                              h(p.napomena)
                                            : ""}
                                    </span>

                                </div>

                                ${p.stornirano
                                    ? `
                                        <em>
                                            СТОРНИРАНО
                                        </em>
                                    `
                                    : `
                                        <button
                                            type="button"
                                            data-action="void"
                                            data-id="${h(p.id)}"
                                        >
                                            СТОРНИРАЈ
                                        </button>
                                    `}

                            </div>
                        `).join("")
                        : `
                            <p class="portal-sponsors-empty">
                                Још нема евидентираних уплата.
                            </p>
                        `}

                </div>

            </div>
        `;
    }

    /* ======================================
       GLAVNI PRIKAZ
    ====================================== */

    function render() {
        if (!state.open || !screen) return;

        const selected = state.sponsors.find(
            s => s.id === state.selectedId
        );

        screen.innerHTML = `

            <div class="portal-sponsors-top">

                <button
                    type="button"
                    data-action="back"
                >
                    ← НАЗАД НА УПРАВУ
                </button>

                <div>

                    <span>
                        ФК ОБИЛИЋ · ПРИВАТНА ЕВИДЕНЦИЈА
                    </span>

                    <h2>СПОНЗОРИ</h2>

                </div>

            </div>

            <div
                id="portal-sponsors-message"
                class="portal-sponsors-message"
                role="status"
            ></div>

            ${selected
                ? `
                    <div class="portal-sponsors-stats">
                        ${summary(selected)}
                    </div>
                `
                : ""}

            <div class="portal-sponsors-layout">

                <div class="portal-sponsors-panel">

                    <div class="portal-sponsors-panel-head">

                        <h3>СПИСАК СПОНЗОРА</h3>

                        <button
                            type="button"
                            class="primary"
                            data-action="new"
                        >
                            + ДОДАЈ
                        </button>

                    </div>

                    <div class="portal-sponsors-list">

                        ${state.sponsors.length
                            ? state.sponsors.map(s => `

                                <button
                                    type="button"
                                    data-action="select"
                                    data-id="${h(s.id)}"
                                    class="portal-sponsors-item
                                    ${s.id === state.selectedId
                                        ? "selected"
                                        : ""}"
                                >

                                    <strong>
                                        ${h(s.naziv)}
                                    </strong>

                                    <span>

                                        ${h(
                                            STATUS[s.status] ||
                                            s.status
                                        )}

                                        ·

                                        ${(s.vrsta_podrske ||
                                            "NOVAC") === "NOVAC"

                                            ? h(
                                                din(
                                                    sumPaid(s.id) /
                                                    100
                                                )
                                              ) + " уплаћено"

                                            : h(
                                                SUPPORT_TYPES[
                                                    s.vrsta_podrske
                                                ] ||
                                                "Друга помоћ"
                                              ) + " · " +
                                              (s.realizovano
                                                ? "реализовано"
                                                : "није реализовано")
                                        }

                                    </span>

                                </button>

                            `).join("")

                            : `
                                <p class="portal-sponsors-empty">
                                    Још нема спонзора.
                                    Додај првог.
                                </p>
                            `}

                    </div>

                </div>

                ${state.editing !== null
                    ? sponsorForm()

                    : selected
                        ? sponsorDetails(selected)

                        : `
                            <div class="portal-sponsors-panel">

                                <h3>ДЕТАЉИ</h3>

                                <p class="portal-sponsors-empty">
                                    Изабери спонзора са списка
                                    или додај новог.
                                </p>

                            </div>
                        `}

            </div>
        `;
    }

    /* ======================================
       PROVERA ULOGE UPRAVE
    ====================================== */

    async function verifyManagement() {
        const {
            data: userResult,
            error: userError
        } = await sb.auth.getUser();

        if (userError || !userResult?.user) {
            return false;
        }

        const { data: profile, error } =
            await sb
                .from("portal_korisnici")
                .select("uloga,aktivan")
                .eq("user_id", userResult.user.id)
                .maybeSingle();

        if (error) throw error;

        return (
            profile?.aktivan === true &&
            String(profile.uloga || "")
                .trim()
                .toUpperCase() === "UPRAVA"
        );
    }

    /* ======================================
       OTVARANJE SPONZORA
    ====================================== */

    async function open() {
        if (state.open || state.busy) return;

        try {
            if (!(await verifyManagement())) {

                alert(
                    "Само овлашћена управа има приступ спонзорима."
                );

                return;
            }

            state.open = true;

            grid.hidden = true;
            heading.hidden = true;
            screen.hidden = false;

            render();

            notice("Учитавање...");

            await reload();

        } catch (error) {

            console.error(
                "Sponsors access:",
                error
            );

            alert(
                "Приступ није могуће проверити: " +
                (error.message || "грешка")
            );
        }
    }

    function back() {
        state.open = false;
        state.editing = null;
        state.version++;

        screen.hidden = true;
        grid.hidden = false;
        heading.hidden = false;
    }

    /* ======================================
       KLIKOVI NA DUGMAD
    ====================================== */

    async function click(event) {
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
            return render();
        }

        if (action === "cancel-edit") {
            state.editing = null;
            return render();
        }

        if (action === "select") {
            state.selectedId = btn.dataset.id;
            state.editing = null;
            return render();
        }

        if (action === "edit") {
            if (
                !state.sponsors.some(
                    s => s.id === btn.dataset.id
                )
            ) {
                return;
            }

            state.editing = btn.dataset.id;
            return render();
        }

        /* ==================================
           BRISANJE SPONZORA
        ================================== */

        if (action === "delete") {
            const sponsor = state.sponsors.find(
                s => s.id === btn.dataset.id
            );

            if (!sponsor) return;

            const confirmation = window.prompt(
                "ТРАЈНО БРИСАЊЕ СПОНЗОРА\n\n" +
                "Спонзор: " + sponsor.naziv + "\n\n" +
                "Биће обрисане и све његове уплате.\n\n" +
                "За потврду упиши тачан назив спонзора:"
            );

            if (confirmation !== sponsor.naziv) {
                return;
            }

            state.busy = true;

            try {
                const { data, error } =
                    await sb.rpc(
                        "portal_obrisi_sponzora",
                        {
                            p_sponzor_id: sponsor.id,
                            p_naziv: sponsor.naziv
                        }
                    );

                if (error) throw error;

                if (data !== true) {
                    throw new Error(
                        "Спонзор није пронађен."
                    );
                }

                state.selectedId = null;
                state.editing = null;

                await reload();

                notice(
                    "Спонзор је успешно обрисан."
                );

            } catch (error) {

                console.error(
                    "Sponsor delete error:",
                    error
                );

                notice(
                    "Грешка при брисању: " +
                    (error.message ||
                        "непозната грешка"),
                    true
                );

            } finally {
                state.busy = false;
            }

            return;
        }

        /* ==================================
           STORNIRANJE UPLATE
        ================================== */

        if (action === "void") {
            const payment = state.payments.find(
                p =>
                    p.id === btn.dataset.id &&
                    p.sponzor_id === state.selectedId &&
                    !p.stornirano
            );

            if (
                !payment ||
                !window.confirm(
                    "Сторнирати ову уплату? Запис остаје у историји."
                )
            ) {
                return;
            }

            state.busy = true;

            try {
                const { error } = await sb
                    .from("portal_sponzorske_uplate")
                    .update({
                        stornirano: true
                    })
                    .eq("id", payment.id)
                    .eq(
                        "sponzor_id",
                        state.selectedId
                    );

                if (error) throw error;

                await reload();

                notice(
                    "Уплата је сторнирана."
                );

            } catch (error) {

                notice(
                    "Грешка: " +
                    (error.message ||
                        "није сторнирано"),
                    true
                );

            } finally {
                state.busy = false;
            }
        }
    }

    /* ======================================
       CUVANJE SPONZORA I UPLATA
    ====================================== */

    async function submit(event) {
        const form = event.target;

        if (
            form.id !== "portal-sponsor-form" &&
            form.id !== "portal-sponsor-payment-form"
        ) {
            return;
        }

        event.preventDefault();

        if (state.busy) return;

        const data = new FormData(form);

        state.busy = true;

        try {

            if (form.id === "portal-sponsor-form") {

                const kind = String(
                    data.get("vrsta_podrske") ||
                    "NOVAC"
                );

                if (!SUPPORT_TYPES[kind]) {
                    throw new Error(
                        "Изабери исправну врсту подршке."
                    );
                }

                const isMoney =
                    kind === "NOVAC";

                const amount = isMoney
                    ? Number(
                        data.get("ugovoreni_iznos")
                    )
                    : 0;

                const description = String(
                    data.get("opis_podrske") || ""
                ).trim();

                const realized =
                    !isMoney &&
                    data.get("realizovano") === "true";

                const realizationDate = String(
                    data.get("datum_realizacije") || ""
                );

                const begin = String(
                    data.get("datum_od") || ""
                );

                const end = String(
                    data.get("datum_do") || ""
                );

                if (
                    !Number.isFinite(amount) ||
                    amount < 0 ||
                    (begin && end && end < begin)
                ) {
                    throw new Error(
                        "Провери износ и датуме сарадње."
                    );
                }

                if (!isMoney && !description) {
                    throw new Error(
                        "Унеси опис договорене помоћи."
                    );
                }

                if (
                    !isMoney &&
                    state.editing !== "new" &&
                    state.payments.some(
                        p =>
                            p.sponzor_id ===
                                state.editing &&
                            !p.stornirano
                    )
                ) {
                    throw new Error(
                        "Овај спонзор већ има новчане уплате. " +
                        "За неновчану помоћ отвори посебан запис."
                    );
                }

                const payload = {
                    naziv: String(
                        data.get("naziv") || ""
                    ).trim(),

                    kontakt_osoba: String(
                        data.get("kontakt_osoba") || ""
                    ).trim() || null,

                    telefon: String(
                        data.get("telefon") || ""
                    ).trim() || null,

                    email: String(
                        data.get("email") || ""
                    ).trim() || null,

                    ugovoreni_iznos: amount,

                    vrsta_podrske: kind,

                    opis_podrske:
                        isMoney ? null : description,

                    realizovano:
                        isMoney ? false : realized,

                    datum_realizacije:
                        isMoney || !realized
                            ? null
                            : (
                                realizationDate ||
                                today()
                            ),

                    datum_od: begin || null,
                    datum_do: end || null,

                    status: String(
                        data.get("status") ||
                        "AKTIVAN"
                    ),

                    napomena: String(
                        data.get("napomena") || ""
                    ).trim() || null
                };

                if (!payload.naziv) {
                    throw new Error(
                        "Унеси назив спонзора."
                    );
                }

                const result =
                    state.editing === "new"

                        ? await sb
                            .from("portal_sponzori")
                            .insert(payload)
                            .select("id")
                            .single()

                        : await sb
                            .from("portal_sponzori")
                            .update(payload)
                            .eq(
                                "id",
                                state.editing
                            )
                            .select("id")
                            .single();

                if (result.error) {
                    throw result.error;
                }

                state.selectedId = result.data.id;
                state.editing = null;

                await reload();

                notice(
                    "Подаци спонзора су сачувани."
                );

            } else {

                if (
                    !state.sponsors.some(
                        s =>
                            s.id === state.selectedId
                    )
                ) {
                    throw new Error(
                        "Изабери спонзора."
                    );
                }

                const amount = Number(
                    data.get("iznos")
                );

                const date = String(
                    data.get("datum_uplate") || ""
                );

                if (
                    !Number.isFinite(amount) ||
                    amount <= 0 ||
                    !date
                ) {
                    throw new Error(
                        "Унеси исправан износ и датум."
                    );
                }

                const { error } = await sb
                    .from("portal_sponzorske_uplate")
                    .insert({
                        sponzor_id:
                            state.selectedId,

                        iznos: amount,
                        datum_uplate: date,

                        napomena: String(
                            data.get("napomena") || ""
                        ).trim() || null
                    });

                if (error) throw error;

                await reload();

                notice(
                    "Уплата је евидентирана."
                );
            }

        } catch (error) {

            console.error(
                "Sponsor saving:",
                error
            );

            notice(
                "Грешка: " +
                (error.message || "није сачувано"),
                true
            );

        } finally {
            state.busy = false;
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
            return !!screen;
        }

        grid = section.querySelector(
            ".portal-management-grid"
        );

        heading = section.querySelector(
            ".portal-section-heading"
        );

        card = [
            ...section.querySelectorAll(
                ".portal-management-card"
            )
        ].find(
            c =>
                c.querySelector("h3")
                    ?.textContent.trim() ===
                "СПОНЗОРИ"
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
            "Отвори евиденцију спонзора"
        );

        card.classList.add(
            "portal-sponsors-launcher"
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

        screen.id =
            "portal-sponsors-screen";

        screen.hidden = true;

        section.appendChild(screen);

        screen.addEventListener(
            "click",
            click
        );

        screen.addEventListener(
            "submit",
            submit
        );

        screen.addEventListener(
            "change",
            event => {

                if (
                    event.target.name !==
                    "vrsta_podrske"
                ) {
                    return;
                }

                const form =
                    event.target.closest(
                        "#portal-sponsor-form"
                    );

                if (!form) return;

                const isMoney =
                    event.target.value ===
                    "NOVAC";

                form.querySelector(
                    ".portal-sponsor-money-field"
                ).hidden = !isMoney;

                form.querySelector(
                    ".portal-sponsor-nonmoney-fields"
                ).hidden = isMoney;

                form.elements.namedItem(
                    "ugovoreni_iznos"
                ).required = isMoney;

                form.elements.namedItem(
                    "opis_podrske"
                ).required = !isMoney;

            }
        );

        sb.auth.onAuthStateChange(
            event => {

                if (event === "SIGNED_OUT") {

                    back();

                    state.sponsors = [];
                    state.payments = [];
                    state.selectedId = null;

                    screen.innerHTML = "";

                }

            }
        );

        return true;
    }

    function start() {
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
            start
        );
    } else {
        start();
    }

})();
