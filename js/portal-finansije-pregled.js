
/* =========================================================
   FK OBILIC - OBJEDINJENI FINANSIJSKI PREGLED
   Cita postojece evidencije bez duplog upisa.
   Prikazuje se unutar kartice FINANSIJE samo upravi.
========================================================= */
(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const TABLES = {
        other: "portal_finansijski_unosi",
        sponsors: "portal_sponzorske_uplate",
        dues: "portal_clanarine"
    };

    let screen = null;
    let currentPanel = null;
    let currentKey = null;
    let requestNumber = 0;

    const escapeHTML = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    const money = cents =>
        new Intl.NumberFormat("sr-RS", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(cents / 100) + " дин.";

    const cents = amount =>
        Math.round(Number(amount) * 100);

    function currentMonth() {
        return new Intl.DateTimeFormat("sv-SE", {
            timeZone: "Europe/Belgrade",
            year: "numeric",
            month: "2-digit"
        }).format(new Date());
    }

    function nextMonth(month) {
        const [year, num] =
            month.split("-").map(Number);

        if (num === 12) {
            return `${year + 1}-01-01`;
        }

        return `${year}-${String(num + 1).padStart(2, "0")}-01`;
    }

    /* ======================================
       CITANJE PODATAKA IZ SUPABASE
    ====================================== */

    async function readRows(
        table,
        columns,
        conditions
    ) {
        const all = [];
        const pageSize = 400;

        for (
            let offset = 0;
            ;
            offset += pageSize
        ) {
            let query = sb
                .from(table)
                .select(columns)
                .order("id", {
                    ascending: true
                })
                .range(
                    offset,
                    offset + pageSize - 1
                );

            for (
                const [method, column, value]
                of conditions
            ) {
                query = query[method](
                    column,
                    value
                );
            }

            const { data, error } =
                await query;

            if (error) {
                throw new Error(
                    `${table}: ${error.message}`
                );
            }

            all.push(...(data || []));

            if (
                !data ||
                data.length < pageSize
            ) {
                break;
            }
        }

        return all;
    }

    function filterDates(
        field,
        allTime,
        month
    ) {
        if (allTime) return [];

        return [
            [
                "gte",
                field,
                `${month}-01`
            ],
            [
                "lt",
                field,
                nextMonth(month)
            ]
        ];
    }

    /* ======================================
       OBJEDINJAVANJE TRI EVIDENCIJE
    ====================================== */

    async function collect(
        allTime,
        month
    ) {
        const [
            manual,
            sponsors,
            dues,
            undatedDues
        ] = await Promise.all([

            // Ostali prihodi i rashodi

            readRows(
                TABLES.other,
                "id,datum,vrsta,iznos,stornirano",
                [
                    [
                        "eq",
                        "stornirano",
                        false
                    ],
                    ...filterDates(
                        "datum",
                        allTime,
                        month
                    )
                ]
            ),

            // Primljene sponzorske uplate

            readRows(
                TABLES.sponsors,
                "id,datum_uplate,iznos,stornirano",
                [
                    [
                        "eq",
                        "stornirano",
                        false
                    ],
                    ...filterDates(
                        "datum_uplate",
                        allTime,
                        month
                    )
                ]
            ),

            // Naplacene clanarine

            readRows(
                TABLES.dues,
                "id,mesec,placeno,iznos,datum_uplate",
                [
                    [
                        "eq",
                        "placeno",
                        true
                    ],
                    ...filterDates(
                        "datum_uplate",
                        allTime,
                        month
                    )
                ]
            ),

            // Clanarine bez datuma uplate

            readRows(
                TABLES.dues,
                "id",
                [
                    [
                        "eq",
                        "placeno",
                        true
                    ],
                    [
                        "is",
                        "datum_uplate",
                        null
                    ],
                    ...(
                        allTime
                            ? []
                            : [[
                                "eq",
                                "mesec",
                                `${month}-01`
                            ]]
                    )
                ]
            )

        ]);

        const summary = {
            otherIncome: 0,
            expenses: 0,
            sponsors: 0,
            dues: 0,

            otherIncomeCount: 0,
            expenseCount: 0,
            sponsorCount: 0,
            duesCount: 0,

            missingAmounts: 0,
            undatedDues: undatedDues.length
        };

        function validAmount(value) {
            return (
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(
                    Number(value)
                ) &&
                Number(value) >= 0
            );
        }

        for (const row of manual) {
            if (!validAmount(row.iznos)) {
                summary.missingAmounts++;
                continue;
            }

            if (row.vrsta === "PRIHOD") {
                summary.otherIncome +=
                    cents(row.iznos);

                summary.otherIncomeCount++;
            }

            if (row.vrsta === "RASHOD") {
                summary.expenses +=
                    cents(row.iznos);

                summary.expenseCount++;
            }
        }

        for (const row of sponsors) {
            if (!validAmount(row.iznos)) {
                summary.missingAmounts++;
                continue;
            }

            summary.sponsors +=
                cents(row.iznos);

            summary.sponsorCount++;
        }

        for (const row of dues) {
            if (!validAmount(row.iznos)) {
                summary.missingAmounts++;
                continue;
            }

            summary.dues +=
                cents(row.iznos);

            summary.duesCount++;
        }

        return summary;
    }

    /* ======================================
       PRIKAZ OBJEDINJENIH FINANSIJA
    ====================================== */

    function renderSummary(
        panel,
        allTime,
        month,
        s
    ) {
        const income =
            s.dues +
            s.sponsors +
            s.otherIncome;

        const difference =
            income - s.expenses;

        const heading = allTime
            ? "СВИ МЕСЕЦИ"
            : `МЕСЕЦ ${month.split("-").reverse().join("/")}`;

        panel.innerHTML = `

            <div class="portal-overview-heading">

                <div>

                    <span>
                        ОБЈЕДИЊЕНИ ПРЕГЛЕД ·
                        ${escapeHTML(heading)}
                    </span>

                    <h3>
                        УКУПНЕ ФИНАНСИЈЕ КЛУБА
                    </h3>

                    <p>
                        Наплаћене чланарине,
                        примљене спонзорске уплате
                        и остали уноси.
                    </p>

                </div>

                <button
                    type="button"
                    data-finance-overview-refresh
                >
                    ОСВЕЖИ ПРЕГЛЕД
                </button>

            </div>


            <div class="portal-overview-stats">

                <div>

                    <span>
                        УКУПНИ ПРИХОДИ
                    </span>

                    <strong>
                        ${escapeHTML(money(income))}
                    </strong>

                </div>


                <div>

                    <span>
                        УКУПНИ РАСХОДИ
                    </span>

                    <strong>
                        ${escapeHTML(money(s.expenses))}
                    </strong>

                </div>


                <div>

                    <span>
                        РАЗЛИКА
                    </span>

                    <strong
                        class="${
                            difference < 0
                                ? "negative"
                                : "positive"
                        }"
                    >
                        ${difference > 0 ? "+" : ""}
                        ${escapeHTML(money(difference))}
                    </strong>

                </div>

            </div>


            <div class="portal-overview-breakdown">

                <h4>
                    ОДАКЛЕ ДОЛАЗИ НОВАЦ
                </h4>


                <div>

                    <span>
                        Чланарине
                        <small>
                            (${s.duesCount} уплата)
                        </small>
                    </span>

                    <strong>
                        ${escapeHTML(money(s.dues))}
                    </strong>

                </div>


                <div>

                    <span>
                        Спонзорске уплате
                        <small>
                            (${s.sponsorCount})
                        </small>
                    </span>

                    <strong>
                        ${escapeHTML(money(s.sponsors))}
                    </strong>

                </div>


                <div>

                    <span>
                        Остали приходи
                        <small>
                            (${s.otherIncomeCount})
                        </small>
                    </span>

                    <strong>
                        ${escapeHTML(money(s.otherIncome))}
                    </strong>

                </div>


                <div class="expense">

                    <span>
                        Остали расходи
                        <small>
                            (${s.expenseCount})
                        </small>
                    </span>

                    <strong>
                        −${escapeHTML(money(s.expenses))}
                    </strong>

                </div>

            </div>


            <p class="portal-overview-footnote">

                Ово је преглед евидентираног
                новчаног тока, не стања на рачуну
                нити званично књиговодство.

                Неновчана спонзорства, неуплаћене
                чланарине и сторнирани уноси
                нису урачунати.

            </p>


            ${
                s.missingAmounts || s.undatedDues
                    ? `

                        <p class="portal-overview-warning">

                            Пажња:
                            ${s.missingAmounts}
                            евидентираних уплата
                            нема исправан износ,

                            а ${s.undatedDues}
                            плаћених чланарина
                            нема датум уплате
                            ${
                                allTime
                                    ? ""
                                    : "за изабрани месец чланарине"
                            }.

                            Те ставке нису урачунате
                            у приказани збир.

                        </p>

                    `
                    : ""
            }

        `;
    }

    /* ======================================
       UCITAVANJE PREGLEDA
    ====================================== */

    async function refresh(
        panel,
        allTime,
        month
    ) {
        const n = ++requestNumber;

        panel.innerHTML = `
            <p class="portal-overview-loading">
                Учитавање заједничког прегледа...
            </p>
        `;

        try {
            const result = await collect(
                allTime,
                month
            );

            if (
                n !== requestNumber ||
                !panel.isConnected ||
                screen.hidden
            ) {
                return;
            }

            renderSummary(
                panel,
                allTime,
                month,
                result
            );

        } catch (error) {

            if (
                n !== requestNumber ||
                !panel.isConnected ||
                screen.hidden
            ) {
                return;
            }

            console.error(
                "Objedinjene finansije:",
                error
            );

            panel.innerHTML = `

                <p class="portal-overview-warning">

                    Није могуће учитати
                    све евиденције:

                    ${escapeHTML(
                        error.message || "грешка"
                    )}.

                    Збир није приказан како
                    не бисмо приказали
                    погрешне износе.

                </p>

                <button
                    type="button"
                    data-finance-overview-refresh
                >
                    ПОКУШАЈ ПОНОВО
                </button>

            `;
        }
    }

    /* ======================================
       UBACIVANJE U FINANSIJSKI EKRAN
    ====================================== */

    function ensurePanel(force = false) {
        if (
            !screen ||
            screen.hidden
        ) {
            return;
        }

        const originalStats =
            screen.querySelector(
                "#portal-finance-stats"
            );

        if (!originalStats) {
            return;
        }

        let panel = screen.querySelector(
            "#portal-overall-finances"
        );

        if (!panel) {

            panel =
                document.createElement("section");

            panel.id =
                "portal-overall-finances";

            panel.className =
                "portal-overview-finances";

            originalStats.insertAdjacentElement(
                "beforebegin",
                panel
            );
        }

        // Oznaka ispred starih pokazatelja,
        // da se zna da su samo rucni unosi.

        if (
            !screen.querySelector(
                "#portal-finance-manual-label"
            )
        ) {

            const label =
                document.createElement("p");

            label.id =
                "portal-finance-manual-label";

            label.className =
                "portal-overview-manual-label";

            label.textContent =
                "САМО РУЧНИ УНОСИ (БЕЗ ЧЛАНАРИНА И СПОНЗОРА)";

            originalStats.insertAdjacentElement(
                "beforebegin",
                label
            );

        }

        const period =
            screen.querySelector(
                "#portal-finance-period"
            )?.value || "month";

        const month =
            screen.querySelector(
                "#portal-finance-month"
            )?.value || currentMonth();

        const allTime =
            period === "all";

        const key =
            allTime ? "all" : month;

        if (
            force ||
            panel !== currentPanel ||
            key !== currentKey
        ) {

            currentPanel = panel;
            currentKey = key;

            refresh(
                panel,
                allTime,
                month
            );

        }
    }

    /* ======================================
       POVEZIVANJE SA POSTOJECIM MODULOM
    ====================================== */

    function setup() {

        screen = document.querySelector(
            "#portal-finance-screen"
        );

        if (!screen) return false;

        const observer =
            new MutationObserver(
                () => ensurePanel()
            );

        observer.observe(
            screen,
            {
                childList: true
            }
        );

        // Mesec ili svi meseci

        screen.addEventListener(
            "change",
            event => {

                if (
                    event.target.id ===
                        "portal-finance-month" ||

                    event.target.id ===
                        "portal-finance-period"
                ) {

                    ensurePanel();

                }

            }
        );

        // Rucno osvezavanje pregleda

        screen.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        "[data-finance-overview-refresh]"
                    )
                ) {

                    ensurePanel(true);

                }

            }
        );

        // Odjava iz portala

        sb.auth.onAuthStateChange(
            event => {

                if (event === "SIGNED_OUT") {

                    requestNumber++;

                    currentPanel = null;
                    currentKey = null;

                    screen.querySelector(
                        "#portal-overall-finances"
                    )?.remove();

                }

            }
        );

        ensurePanel();

        return true;
    }

    function init() {

        if (setup()) return;

        const observer =
            new MutationObserver(() => {

                if (setup()) {
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
