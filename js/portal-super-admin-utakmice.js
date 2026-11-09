
/* =====================================================
   FK OBILIC - SUPER ADMIN
   UTAKMICE I TESTIRANJE PRISUSTVA

   UPRAVA / TRENER:
   - Pravi spisak i statistika prisustva

   IGRAC:
   - Aktivna simulacija odgovora
   - Bez upisa u Supabase

   Prvi tim: data/football.json
   Mladje selekcije: public.portal_utakmice
===================================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    let initialized = false;
    let requestVersion = 0;
    let matches = [];

    // Iskljucivo lokalni testni odgovor.
    let demoStatus = null;
    let demoMatchKey = null;

    const get = id => document.getElementById(id);

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&quot;")
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

    function isFirstTeam(name) {
        return ["ПРВИ ТИМ", "PRVI TIM"].includes(
            String(name || "").trim().toUpperCase()
        );
    }

    function isPanelActive() {
        const panel = get("portal-super-admin-section");
        const tab = get("portal-super-admin-tab");

        return Boolean(
            panel &&
            !panel.hidden &&
            tab &&
            !tab.hidden
        );
    }

    function createInterface() {
        const panel = get("portal-super-admin-section")
            ?.querySelector(".fk-sa-panel");

        if (!panel) return false;
        if (get("fk-sa-matches")) return true;

        const wrapper = document.createElement("div");

        wrapper.id = "fk-sa-matches";

        wrapper.innerHTML = `
            <h3 class="fk-sa-subheading">
                ПРИСУСТВО НА УТАКМИЦАМА
            </h3>

            <div class="fk-sa-control">
                <label for="fk-sa-match-select">
                    ИЗАБЕРИ УТАКМИЦУ
                </label>

                <select id="fk-sa-match-select">
                    <option value="">
                        Изаберите утакмицу
                    </option>
                </select>
            </div>

            <div
                id="fk-sa-match-results"
                class="fk-sa-list"
                aria-live="polite"
            ></div>
        `;

        panel.appendChild(wrapper);

        get("fk-sa-match-select").addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoMatchKey = null;
                loadAttendance();
            }
        );

        get("fk-sa-role")?.addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoMatchKey = null;
                loadAttendance();
            }
        );

        get("fk-sa-selection")?.addEventListener(
            "change",
            () => {
                demoStatus = null;
                demoMatchKey = null;
                refreshMatches();
            }
        );

        get("portal-super-admin-tab")?.addEventListener(
            "click",
            () => {
                setTimeout(refreshMatches, 0);
            }
        );

        initialized = true;
        return true;
    }

    async function refreshMatches() {
        if (!initialized || !isPanelActive()) return;

        const version = ++requestVersion;

        const select = get("fk-sa-match-select");
        const results = get("fk-sa-match-results");
        const selectionSelect = get("fk-sa-selection");

        if (!select || !results || !selectionSelect) {
            return;
        }

        matches = [];
        demoStatus = null;
        demoMatchKey = null;

        results.textContent = "";

        select.replaceChildren(
            new Option("Учитавање утакмица...", "")
        );

        const selectionId = selectionSelect.value;

        const selectionName =
            selectionSelect.selectedOptions[0]
                ?.textContent || "";

        if (!selectionId) {
            select.replaceChildren(
                new Option("Нема изабране селекције", "")
            );
            return;
        }

        try {
            if (isFirstTeam(selectionName)) {
                await loadFirstTeamMatch(version);
            } else {
                await loadYoungerMatches(
                    selectionId,
                    version
                );
            }

            if (
                version !== requestVersion ||
                !isPanelActive()
            ) {
                return;
            }

            select.replaceChildren(
                new Option("Изабери утакмицу", "")
            );

            for (const match of matches) {
                select.appendChild(
                    new Option(
                        formatDate(match.pocetak) +
                        " · " +
                        match.protivnik,
                        match.key
                    )
                );
            }

            if (!matches.length) {
                results.textContent =
                    "Нема доступних предстојећих утакмица.";
            }

        } catch (error) {
            if (version !== requestVersion) return;

            console.error(
                "SUPER ADMIN match loading:",
                error
            );

            select.replaceChildren(
                new Option("Грешка учитавања", "")
            );

            results.textContent =
                "Није могуће учитати утакмице.";
        }
    }


async function loadFirstTeamMatch(version) {
    const response = await fetch(
        `data/football.json?t=${Date.now()}`,
        { cache: "no-store" }
    );

    if (!response.ok) {
        throw new Error("Football JSON nije dostupan.");
    }

    const data = await response.json();

    if (version !== requestVersion) return;

    const candidates = [];

    if (data?.nextMatch) {
        candidates.push(data.nextMatch);
    }

    if (Array.isArray(data?.matches)) {
        candidates.push(...data.matches);
    }

    const now = Date.now();

    const future = candidates
        .filter(match => {
            if (!match?.startDate) return false;

            const time = new Date(
                match.startDate
            ).getTime();

            return (
                Number.isFinite(time) &&
                time >= now &&
                match.status === "scheduled"
            );
        })
        .sort(
            (a, b) =>
                new Date(a.startDate) -
                new Date(b.startDate)
        );

    const match = future[0];

    if (!match) {
        matches = [];
        return;
    }

    const key =
        match.id !== null &&
        match.id !== undefined
            ? `srbijasport:${match.id}`
            : "srbijasport:" +
              encodeURIComponent([
                  match.startDate || "",
                  match.home || "",
                  match.away || ""
              ].join("|"));

    matches = [{
        key,
        pocetak: match.startDate,
        protivnik:
            `${match.home || "—"} – ${match.away || "—"}`,
        mesto: match.location || ""
    }];
}


    async function loadYoungerMatches(
        selectionId,
        version
    ) {
        const { data, error } = await sb
            .from("portal_utakmice")
            .select(
                "id,pocetak,protivnik,mesto,status"
            )
            .eq("selekcija_id", selectionId)
            .eq("status", "ZAKAZANA")
            .gte(
                "pocetak",
                new Date().toISOString()
            )
            .order("pocetak", {
                ascending: true
            })
            .limit(30);

        if (error) throw error;
        if (version !== requestVersion) return;

        matches = (data || []).map(match => ({
            key: `portal:${match.id}`,
            pocetak: match.pocetak,
            protivnik: match.protivnik || "—",
            mesto: match.mesto || ""
        }));
    }

    function renderPlayerDemo(match) {
        const results = get("fk-sa-match-results");

        if (!results || !isPanelActive()) return;

        if (demoMatchKey !== match.key) {
            demoMatchKey = match.key;
            demoStatus = null;
        }

        const yes = demoStatus === "DOLAZIM";
        const no = demoStatus === "NE_DOLAZIM";

        results.innerHTML = `
            <div class="fk-sa-item">
                <strong>
                    ТЕСТНИ ПРИКАЗ ИГРАЧА
                </strong>

                <span>
                    ${escapeHtml(match.protivnik)}
                    ·
                    ${escapeHtml(formatDate(match.pocetak))}
                </span>

                <p style="
                    color:#bbb;
                    margin:14px 0;
                ">
                    Изабери одговор за ову утакмицу.
                </p>

                <div style="
                    display:flex;
                    gap:12px;
                    flex-wrap:wrap;
                ">
                    <button
                        type="button"
                        id="fk-sa-match-demo-yes"
                        class="
                            portal-attendance-button
                            portal-attendance-yes
                            ${yes ? "active" : ""}
                        "
                        aria-pressed="${yes}"
                    >
                        ✓ ДОЛАЗИМ
                    </button>

                    <button
                        type="button"
                        id="fk-sa-match-demo-no"
                        class="
                            portal-attendance-button
                            portal-attendance-no
                            ${no ? "active" : ""}
                        "
                        aria-pressed="${no}"
                    >
                        × НЕ ДОЛАЗИМ
                    </button>
                </div>

                <div style="
                    margin-top:18px;
                    color:#fff;
                    font-weight:600;
                ">
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
                    margin-top:14px;
                    font-size:13px;
                ">
                    ДЕМО РЕЖИМ:
                    Одговор није уписан у базу
                    и не утиче на стварну евиденцију.
                </p>
            </div>
        `;

        function chooseStatus(status) {
            if (
                !isPanelActive() ||
                get("fk-sa-role")?.value !== "IGRAČ" ||
                get("fk-sa-match-select")?.value !== match.key
            ) {
                return;
            }

            demoStatus = status;
            renderPlayerDemo(match);
        }

        get("fk-sa-match-demo-yes")?.addEventListener(
            "click",
            () => chooseStatus("DOLAZIM")
        );

        get("fk-sa-match-demo-no")?.addEventListener(
            "click",
            () => chooseStatus("NE_DOLAZIM")
        );
    }

    async function loadAttendance() {
        const version = ++requestVersion;

        const select = get("fk-sa-match-select");
        const results = get("fk-sa-match-results");

        if (!select || !results || !isPanelActive()) {
            return;
        }

        results.textContent = "";

        const matchKey = select.value;
        const selectionId = get("fk-sa-selection")?.value;
        const role = get("fk-sa-role")?.value;

        if (!matchKey || !selectionId) return;

        const match = matches.find(
            item => item.key === matchKey
        );

        if (!match) return;

        if (role === "IGRAČ") {
            renderPlayerDemo(match);
            return;
        }

        results.textContent =
            "Учитавање статистике и списка...";

        try {
            const [statsResponse, listResponse] =
                await Promise.all([
                    sb.rpc(
                        "portal_utakmica_prisustvo_statistika",
                        {
                            p_utakmica_kljuc: matchKey,
                            p_selekcija_id: selectionId
                        }
                    ),
                    sb.rpc(
                        "portal_utakmica_prisustvo_lista",
                        {
                            p_utakmica_kljuc: matchKey,
                            p_selekcija_id: selectionId
                        }
                    )
                ]);

            if (
                version !== requestVersion ||
                !isPanelActive() ||
                get("fk-sa-match-select")?.value !== matchKey ||
                get("fk-sa-selection")?.value !== selectionId ||
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
                p => p.status === "DOLAZIM"
            );

            const notComing = players.filter(
                p => p.status === "NE_DOLAZIM"
            );

            const waiting = players.filter(
                p =>
                    p.status !== "DOLAZIM" &&
                    p.status !== "NE_DOLAZIM"
            );

            const groups = [
                ["ДОЛАЗИ", coming],
                ["НЕ ДОЛАЗИ", notComing],
                ["НИЈЕ ОДГОВОРИЛО", waiting]
            ];

            results.innerHTML = `
                <div class="fk-sa-item">
                    <strong>
                        ${escapeHtml(match.protivnik)}
                    </strong>

                    <span>
                        ${escapeHtml(formatDate(match.pocetak))}
                        ${
                            match.mesto
                                ? " · " + escapeHtml(match.mesto)
                                : ""
                        }
                    </span>
                </div>

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
                                    ? members.map(
                                        player => escapeHtml(
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
                "SUPER ADMIN match attendance:",
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
