
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   SUPER ADMIN - BEZBEDAN PREGLED

   - Samo nalog sa super_admin = true
   - Izbor uloge za pregled
   - Izbor selekcije
   - Pregled igraca, treninga i utakmica
   - Bez upisivanja podataka
===================================================== */

(() => {
    "use strict";

    if (window.__fkSuperAdminLoaded) return;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error("SUPER ADMIN: Supabase nije dostupan.");
        return;
    }

    let currentUserId = null;
    let enabled = false;
    let active = false;
    let role = "UPRAVA";
    let selectionId = "";
    let selections = [];
    let refreshVersion = 0;

    let navigation = null;
    let tab = null;
    let section = null;

    const $ = id => document.getElementById(id);

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

    function addStyles() {
        if ($("fk-super-admin-css")) return;

        const style = document.createElement("style");
        style.id = "fk-super-admin-css";

        style.textContent = `
            #portal-super-admin-section[hidden],
            #portal-super-admin-tab[hidden] {
                display: none !important;
            }

            .fk-sa-panel {
                padding: 24px;
                border-radius: 18px;
                background: #202025;
                color: #fff;
                border: 1px solid rgba(255,255,255,.12);
            }

            .fk-sa-heading {
                margin-bottom: 20px;
            }

            .fk-sa-heading span {
                color: #e15269;
                font-size: 12px;
                font-weight: 700;
                letter-spacing: 1px;
            }

            .fk-sa-heading h2 {
                margin: 8px 0;
                color: #fff;
                font-family: Oswald, sans-serif;
                font-size: 28px;
            }

            .fk-sa-heading p {
                color: #bbb;
                line-height: 1.6;
            }

            .fk-sa-controls {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                margin-bottom: 20px;
            }

            .fk-sa-control {
                display: flex;
                flex-direction: column;
                gap: 7px;
                flex: 1 1 220px;
            }

            .fk-sa-control label {
                color: #ddd;
                font-size: 12px;
                font-weight: 700;
            }

            .fk-sa-control select {
                width: 100%;
                padding: 12px;
                border-radius: 10px;
                border: 1px solid #555;
                background: #303037;
                color: #fff;
                font-size: 14px;
            }

            .fk-sa-notice {
                padding: 13px;
                border-radius: 10px;
                background: rgba(189,24,54,.14);
                border: 1px solid rgba(189,24,54,.35);
                margin-bottom: 20px;
                color: #f5d8df;
                line-height: 1.5;
                font-size: 13px;
            }

            .fk-sa-grid {
                display: grid;
                grid-template-columns:
                    repeat(auto-fit, minmax(220px, 1fr));
                gap: 14px;
            }

            .fk-sa-card {
                background: #2e2e35;
                border: 1px solid rgba(255,255,255,.1);
                border-radius: 12px;
                padding: 18px;
            }

            .fk-sa-card span {
                display: block;
                color: #aaa;
                font-size: 12px;
                margin-bottom: 9px;
            }

            .fk-sa-card strong {
                display: block;
                font-size: 23px;
                color: #fff;
            }

            .fk-sa-list {
                margin-top: 20px;
                display: grid;
                gap: 12px;
            }

            .fk-sa-item {
                padding: 15px;
                background: #2e2e35;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,.08);
            }

            .fk-sa-item strong {
                display: block;
                color: #fff;
                margin-bottom: 6px;
            }

            .fk-sa-item span {
                color: #bbb;
                font-size: 13px;
                line-height: 1.5;
            }

            .fk-sa-subheading {
                margin: 22px 0 12px;
                color: #fff;
                font-family: Oswald, sans-serif;
                font-size: 21px;
            }

            @media(max-width:600px) {
                .fk-sa-panel {
                    padding: 16px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function createPanel() {
        if ($("portal-super-admin-section")) return true;

        navigation = document.querySelector(
            ".portal-view-navigation"
        );

        const app = $("portal-app");

        const mainContainer = app?.querySelector(
            ".portal-main .portal-container"
        );

        if (!navigation || !mainContainer) return false;

        addStyles();

        tab = document.createElement("button");

        tab.type = "button";
        tab.id = "portal-super-admin-tab";
        tab.className = "portal-view-button";
        tab.hidden = true;

        tab.innerHTML = `
            <span class="portal-view-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
            </span>
            <span>SUPER ADMIN</span>
        `;

        navigation.appendChild(tab);

        section = document.createElement("section");

        section.id = "portal-super-admin-section";
        section.className = "portal-section";
        section.hidden = true;

        section.innerHTML = `
            <div class="fk-sa-panel">

                <div class="fk-sa-heading">
                    <span>SMART DESIGN HUB</span>
                    <h2>SUPER ADMIN</h2>
                    <p>
                        Контролни преглед портала ФК Обилић.
                    </p>
                </div>

                <div class="fk-sa-controls">

                    <div class="fk-sa-control">
                        <label for="fk-sa-role">
                            ПРИКАЗ УЛОГЕ
                        </label>

                        <select id="fk-sa-role">
                            <option value="UPRAVA">УПРАВА</option>
                            <option value="TRENER">ТРЕНЕР</option>
                            <option value="IGRAČ">ИГРАЧ</option>
                        </select>
                    </div>

                    <div class="fk-sa-control">
                        <label for="fk-sa-selection">
                            СЕЛЕКЦИЈА
                        </label>

                        <select id="fk-sa-selection"></select>
                    </div>

                </div>

                <div class="fk-sa-notice">
                    Режим провере – само читање.
                    Промене тренинга, утакмица,
                    присуства и других података
                    нису омогућене у овом панелу.
                </div>

                <div id="fk-sa-results"
                     aria-live="polite">
                    Учитавање...
                </div>

            </div>
        `;

        mainContainer.appendChild(section);

        tab.addEventListener("click", openPanel);

        navigation.addEventListener("click", event => {
            if (!event.target.closest("#portal-super-admin-tab")) {
                closePanel();
            }
        });

        $("fk-sa-role").addEventListener("change", event => {
            role = event.target.value;
            loadOverview();
        });

        $("fk-sa-selection").addEventListener(
            "change",
            event => {
                selectionId = event.target.value;
                loadOverview();
            }
        );

        return true;
    }

    function openPanel() {
        if (!enabled || !section || !navigation) return;

        active = true;

        document.querySelectorAll(
            ".portal-dashboard-grid, " +
            "#portal-team-section, " +
            "#portal-management-section"
        ).forEach(element => {
            element.hidden = true;
        });

        const calendar = $("portal-training-list")
            ?.closest(".portal-section");

        if (calendar) calendar.hidden = true;

        document.body.classList.remove(
            "portal-management-open"
        );

        navigation.querySelectorAll(
            ".portal-view-button"
        ).forEach(button => {
            const selected = button === tab;

            button.classList.toggle("active", selected);
            button.setAttribute(
                "aria-pressed",
                String(selected)
            );
        });

        section.hidden = false;

        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        loadOverview();
    }

    function closePanel() {
        active = false;
        refreshVersion++;

        if (section) section.hidden = true;

        if (tab) {
            tab.classList.remove("active");
            tab.setAttribute("aria-pressed", "false");
        }
    }

    function resetPanel() {
        enabled = false;
        currentUserId = null;
        selections = [];
        closePanel();

        if (tab) tab.hidden = true;
    }

    function fillSelections() {
        const select = $("fk-sa-selection");
        if (!select) return;

        select.replaceChildren();

        for (const selection of selections) {
            const option = document.createElement("option");

            option.value = selection.id;
            option.textContent = selection.naziv;

            select.appendChild(option);
        }

        if (
            !selections.some(item => item.id === selectionId)
        ) {
            selectionId = selections[0]?.id || "";
        }

        select.value = selectionId;
    }

    async function loadOverview() {
        if (!enabled || !active) return;

        const version = ++refreshVersion;
        const results = $("fk-sa-results");

        if (!results) return;

        results.textContent = "Учитавање података...";

        if (!selectionId) {
            results.textContent =
                "Нема доступне селекције.";
            return;
        }

        const selection = selections.find(
            item => item.id === selectionId
        );

        const now = new Date().toISOString();

        try {
            const [playersResult, trainingResult, matchResult] =
                await Promise.all([

                    sb.from("igraci")
                        .select("id,ime_prezime,aktivan", {
                            count: "exact"
                        })
                        .eq("aktivan", true)
                        .eq("selekcija", selection.naziv)
                        .limit(5),

                    sb.from("treninzi")
                        .select(
                            "id,pocetak,mesto,status"
                        )
                        .eq("selekcija_id", selectionId)
                        .gte("pocetak", now)
                        .order("pocetak", {
                            ascending: true
                        })
                        .limit(5),

                    sb.from("portal_utakmice")
                        .select(
                            "id,pocetak,protivnik,status"
                        )
                        .eq("selekcija_id", selectionId)
                        .gte("pocetak", now)
                        .order("pocetak", {
                            ascending: true
                        })
                        .limit(5)
                ]);

            if (version !== refreshVersion || !active) {
                return;
            }

            const error =
                playersResult.error ||
                trainingResult.error ||
                matchResult.error;

            if (error) throw error;

            const players = playersResult.data || [];
            const trainings = trainingResult.data || [];
            const matches = matchResult.data || [];

            const roleTitle = {
                UPRAVA: "УПРАВА",
                TRENER: "ТРЕНЕР",
                "IGRAČ": "ИГРАЧ"
            }[role];

            const count = playersResult.count ?? players.length;

            results.innerHTML = `
                <div class="fk-sa-grid">

                    <div class="fk-sa-card">
                        <span>РЕЖИМ ПРЕГЛЕДА</span>
                        <strong>${escapeHtml(roleTitle)}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>АКТИВНИ ИГРАЧИ</span>
                        <strong>${count}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>НАРЕДНИ ТРЕНИНЗИ</span>
                        <strong>${trainings.length}</strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>НАРЕДНЕ УТАКМИЦЕ</span>
                        <strong>${matches.length}</strong>
                    </div>

                </div>

                <h3 class="fk-sa-subheading">
                    ИГРАЧИ – ПРВИХ 5
                </h3>

                <div class="fk-sa-list">
                    ${
                        players.length
                            ? players.map(player => `
                                <div class="fk-sa-item">
                                    <strong>
                                        ${escapeHtml(player.ime_prezime)}
                                    </strong>
                                </div>
                            `).join("")
                            : `<div class="fk-sa-item">
                                Нема доступних играча.
                               </div>`
                    }
                </div>

                <h3 class="fk-sa-subheading">
                    ПРЕДСТОЈЕЋИ ТРЕНИНЗИ
                </h3>

                <div class="fk-sa-list">
                    ${
                        trainings.length
                            ? trainings.map(training => `
                                <div class="fk-sa-item">
                                    <strong>
                                        ${escapeHtml(formatDate(training.pocetak))}
                                    </strong>
                                    <span>
                                        ${escapeHtml(training.mesto || "Место није унето")}
                                        · ${escapeHtml(training.status)}
                                    </span>
                                </div>
                            `).join("")
                            : `<div class="fk-sa-item">
                                Нема предстојећих тренинга.
                               </div>`
                    }
                </div>

                <h3 class="fk-sa-subheading">
                    ПРЕДСТОЈЕЋЕ УТАКМИЦЕ
                </h3>

                <div class="fk-sa-list">
                    ${
                        matches.length
                            ? matches.map(match => `
                                <div class="fk-sa-item">
                                    <strong>
                                        ${escapeHtml(match.protivnik)}
                                    </strong>
                                    <span>
                                        ${escapeHtml(formatDate(match.pocetak))}
                                        · ${escapeHtml(match.status)}
                                    </span>
                                </div>
                            `).join("")
                            : `<div class="fk-sa-item">
                                Нема наредних ручно унетих утакмица.
                               </div>`
                    }
                </div>
            `;

        } catch (error) {
            console.error("SUPER ADMIN overview:", error);

            if (version === refreshVersion) {
                results.textContent =
                    "Није могуће учитати податке. " +
                    "Проверите дозволе у Supabase-у.";
            }
        }
    }

    async function checkAccess() {
        const version = ++refreshVersion;

        try {
            const { data: auth, error: authError } =
                await sb.auth.getUser();

            if (authError) throw authError;

            const user = auth?.user;

            if (!user) {
                resetPanel();
                return;
            }

            const { data: profile, error } = await sb
                .from("portal_korisnici")
                .select("aktivan,super_admin")
                .eq("user_id", user.id)
                .maybeSingle();

            if (version !== refreshVersion) return;

            if (error) throw error;

            const allowed =
                profile?.aktivan === true &&
                profile?.super_admin === true;

            if (!allowed) {
                resetPanel();
                return;
            }

            currentUserId = user.id;
            enabled = true;

            if (tab) tab.hidden = false;

            const response = await sb
                .from("selekcije")
                .select("id,naziv,redosled")
                .eq("aktivna", true)
                .order("redosled", {
                    ascending: true
                });

            if (
                version !== refreshVersion ||
                currentUserId !== user.id
            ) {
                return;
            }

            if (response.error) {
                throw response.error;
            }

            selections = response.data || [];
            fillSelections();

        } catch (error) {
            console.error("SUPER ADMIN access:", error);
            resetPanel();
        }
    }

    function initialize() {
        const attach = () => {
            if (!createPanel()) return false;

            window.__fkSuperAdminLoaded = true;
            checkAccess();

            sb.auth.onAuthStateChange((event) => {
                if (
                    event === "SIGNED_IN" ||
                    event === "SIGNED_OUT" ||
                    event === "INITIAL_SESSION"
                ) {
                    if (event === "SIGNED_OUT") {
                        resetPanel();
                    } else {
                        setTimeout(checkAccess, 0);
                    }
                }
            });

            return true;
        };

        if (attach()) return;

        const observer = new MutationObserver(() => {
            if (attach()) observer.disconnect();
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
