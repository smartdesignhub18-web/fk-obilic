
/* =====================================================
   FK OBILIC - SUPER ADMIN
   TESTIRANJE PRISUSTVA NA TRENINZIMA

   UPRAVA / TRENER:
   - Stvarna statistika i spisak prisustva

   IGRAC:
   - Simulacija odgovora
   - Bez upisa u Supabase
===================================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    let initialized = false;
    let requestVersion = 0;

    // Testni odgovor postoji samo u memoriji.
    let demoStatus = null;
    let demoTrainingId = null;

    const get = id => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "—";

        return new Intl.DateTimeFormat("sr-RS", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Belgrade"
        }).format(date);
    }

    function isActive() {
        const section = get("portal-super-admin-section");
        const tab = get("portal-super-admin-tab");

        return Boolean(
            section &&
            !section.hidden &&
            tab &&
            !tab.hidden
        );
    }

    function createInterface() {
        const panel = get("portal-super-admin-section")
            ?.querySelector(".fk-sa-panel");

        if (!panel) return false;

        if (get("fk-sa-attendance")) return true;

        const wrapper = document.createElement("div");

        wrapper.id = "fk-sa-attendance";

        wrapper.innerHTML = `
            <h3 class="fk-sa-subheading">
                ПРИСУСТВО НА ТРЕНИНЗИМА
            </h3>

            <div class="fk-sa-control">
                <label for="fk-sa-training">
                    ИЗАБЕРИ ТРЕНИНГ
                </label>

                <select id="fk-sa-training">
                    <option value="">
                        Изаберите тренинг
                    </option>
                </select>
            </div>

            <div
                id="fk-sa-attendance-results"
                class="fk-sa-list"
                aria-live="polite"
            ></div>
        `;

        panel.appendChild(wrapper);

        get("fk-sa-training").addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoTrainingId = null;
                loadAttendance();
            }
        );

        get("fk-sa-role")?.addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoTrainingId = null;
                loadAttendance();
            }
        );

        get("fk-sa-selection")?.addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoTrainingId = null;
                refreshTrainings();
            }
        );

        get("portal-super-admin-tab")?.addEventListener(
            "click",
            () => {
                setTimeout(refreshTrainings, 0);
            }
        );

        initialized = true;
        return true;
    }

    async function refreshTrainings() {
        if (!initialized || !isActive()) return;

        const version = ++requestVersion;

        const selectionId = get("fk-sa-selection")?.value;
        const select = get("fk-sa-training");
        const results = get("fk-sa-attendance-results");

        if (!select || !results) return;

        demoStatus = null;
        demoTrainingId = null;

        select.replaceChildren(
            new Option("Учитавање тренинга...", "")
        );

        results.textContent = "";

        if (!selectionId) {
            select.replaceChildren(
                new Option("Нема селекције", "")
            );
            return;
        }

        const { data, error } = await sb
            .from("treninzi")
            .select(
                "id,pocetak,mesto,status,selekcija_id"
            )
            .eq("selekcija_id", selectionId)
            .order("pocetak", {
                ascending: false
            })
            .limit(30);

        if (
            version !== requestVersion ||
            !isActive()
        ) {
            return;
        }

        if (error) {
            console.error("SUPER ADMIN trainings:", error);

            select.replaceChildren(
                new Option("Грешка учитавања", "")
            );

            return;
        }

        select.replaceChildren(
            new Option("Изабери тренинг", "")
        );

        for (const training of data || []) {
            const option = new Option(
                formatDate(training.pocetak) +
                " · " +
                (training.mesto || "Без места") +
                (training.status === "OTKAZAN"
                    ? " · ОТКАЗАН"
                    : ""),
                training.id
            );

            select.appendChild(option);
        }

        if (!data?.length) {
            results.textContent =
                "Нема тренинга за изабрану селекцију.";
        }
    }

    function renderPlayerDemo(trainingId) {
        const results = get("fk-sa-attendance-results");

        if (!results || !isActive()) return;

        if (demoTrainingId !== trainingId) {
            demoStatus = null;
            demoTrainingId = trainingId;
        }

        const yes = demoStatus === "DOLAZIM";
        const no = demoStatus === "NE_DOLAZIM";

        results.innerHTML = `
            <div class="fk-sa-item">
                <strong>
                    ТЕСТНИ ПРИКАЗ ИГРАЧА
                </strong>

                <span>
                    Притисни једно од дугмади
                    да провериш како ради потврда.
                </span>

                <div style="
                    display:flex;
                    gap:12px;
                    flex-wrap:wrap;
                    margin-top:18px;
                ">

                    <button
                        type="button"
                        id="fk-sa-demo-yes"
                        class="portal-attendance-button portal-attendance-yes
                        ${yes ? "active" : ""}"
                        aria-pressed="${yes}"
                    >
                        ✓ ДОЛАЗИМ
                    </button>

                    <button
                        type="button"
                        id="fk-sa-demo-no"
                        class="portal-attendance-button portal-attendance-no
                        ${no ? "active" : ""}"
                        aria-pressed="${no}"
                    >
                        × НЕ ДОЛАЗИМ
                    </button>

                </div>

                <div
                    id="fk-sa-demo-message"
                    style="
                        margin-top:18px;
                        color:#fff;
                        font-weight:600;
                    "
                >
                    ${
                        yes
                            ? "Потврдили сте долазак (демо)."
                            : no
                                ? "Потврдили сте да не долазите (демо)."
                                : "Још нисте изабрали одговор."
                    }
                </div>

                <p style="
                    color:#f1adba;
                    font-size:13px;
                    margin-top:14px;
                ">
                    ДЕМО РЕЖИМ:
                    Одговор није сачуван у бази
                    и не утиче на статистику клуба.
                </p>
            </div>
        `;

        get("fk-sa-demo-yes")?.addEventListener(
            "click",
            () => {
                if (
                    !isActive() ||
                    get("fk-sa-role")?.value !== "IGRAČ" ||
                    get("fk-sa-training")?.value !== trainingId
                ) return;

                demoStatus = "DOLAZIM";
                renderPlayerDemo(trainingId);
            }
        );

        get("fk-sa-demo-no")?.addEventListener(
            "click",
            () => {
                if (
                    !isActive() ||
                    get("fk-sa-role")?.value !== "IGRAČ" ||
                    get("fk-sa-training")?.value !== trainingId
                ) return;

                demoStatus = "NE_DOLAZIM";
                renderPlayerDemo(trainingId);
            }
        );
    }

    async function loadAttendance() {
        const version = ++requestVersion;

        const trainingId = get("fk-sa-training")?.value;
        const role = get("fk-sa-role")?.value;
        const results = get("fk-sa-attendance-results");

        if (!results) return;

        results.textContent = "";

        if (!trainingId || !isActive()) return;

        if (role === "IGRAČ") {
            renderPlayerDemo(trainingId);
            return;
        }

        results.textContent =
            "Учитавање статистике и списка...";

        try {
            const [statsResponse, listResponse] =
                await Promise.all([
                    sb.rpc(
                        "portal_trening_prisustvo_statistika",
                        { p_trening_id: trainingId }
                    ),
                    sb.rpc(
                        "portal_trening_prisustvo_lista",
                        { p_trening_id: trainingId }
                    )
                ]);

            if (
                version !== requestVersion ||
                !isActive() ||
                get("fk-sa-training")?.value !== trainingId ||
                get("fk-sa-role")?.value !== role
            ) {
                return;
            }

            if (statsResponse.error) {
                throw statsResponse.error;
            }

            if (listResponse.error) {
                throw listResponse.error;
            }

            const players = Array.isArray(listResponse.data)
                ? listResponse.data
                : [];

            const coming = players.filter(
                player => player.status === "DOLAZIM"
            );

            const notComing = players.filter(
                player => player.status === "NE_DOLAZIM"
            );

            const waiting = players.filter(
                player =>
                    player.status !== "DOLAZIM" &&
                    player.status !== "NE_DOLAZIM"
            );

            // Brojimo iste aktivne igrace
            // koje vraca lista prisustva.
            const groups = [
                ["ДОЛАЗИ", coming],
                ["НЕ ДОЛАЗИ", notComing],
                ["НИЈЕ ОДГОВОРИЛО", waiting]
            ];

            results.innerHTML = `
                <div class="fk-sa-grid">

                    <div class="fk-sa-card">
                        <span>УКУПНО ИГРАЧА</span>
                        <strong>${players.length}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>ДОЛАЗИ</span>
                        <strong>${coming.length}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>НЕ ДОЛАЗИ</span>
                        <strong>${notComing.length}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>НИЈЕ ОДГОВОРИЛО</span>
                        <strong>${waiting.length}</strong>
                    </div>

                </div>

                ${groups.map(([title, members]) => `
                    <div class="fk-sa-item">
                        <strong>
                            ${title} (${members.length})
                        </strong>

                        <span>
                            ${
                                members.length
                                    ? members.map(player =>
                                        escapeHtml(
                                            player.ime_prezime
                                        )
                                    ).join(", ")
                                    : "Нема играча."
                            }
                        </span>
                    </div>
                `).join("")}
            `;

        } catch (error) {
            if (version !== requestVersion) return;

            console.error(
                "SUPER ADMIN attendance:",
                error
            );

            results.textContent =
                "Није могуће учитати присуство.";
        }
    }

    function initialize() {
        if (createInterface()) return;

        const observer = new MutationObserver(() => {
            if (createInterface()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            { once: true }
        );
    } else {
        initialize();
    }

})();
