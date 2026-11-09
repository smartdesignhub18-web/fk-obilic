
/* =====================================================
   FK OBILIC - SUPER ADMIN
   PREGLED KONKRETNOG IGRACA

   - Samo citanje
   - Bez prijavljivanja kao drugi korisnik
   - Bez izmene prisustva
===================================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;
    if (!sb) return;

    const get = id => document.getElementById(id);

    let players = [];
    let version = 0;

    function escapeHtml(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function isActive() {
        const panel = get("portal-super-admin-section");
        const tab = get("portal-super-admin-tab");

        return Boolean(
            panel &&
            !panel.hidden &&
            tab &&
            !tab.hidden &&
            get("fk-sa-role")?.value === "IGRAČ"
        );
    }

    function statusLabel(status) {
        if (status === "DOLAZIM") {
            return "ДОЛАЗИ";
        }

        if (status === "NE_DOLAZIM") {
            return "НЕ ДОЛАЗИ";
        }

        return "НИЈЕ ОДГОВОРИО";
    }

    function createInterface() {
        const panel = get("portal-super-admin-section")
            ?.querySelector(".fk-sa-panel");

        if (!panel) return false;

        if (get("fk-sa-player-preview")) return true;

        const wrapper = document.createElement("section");

        wrapper.id = "fk-sa-player-preview";
        wrapper.hidden = true;

        wrapper.innerHTML = `
            <h3 class="fk-sa-subheading">
                ПРЕГЛЕД КОНКРЕТНОГ ИГРАЧА
            </h3>

            <div class="fk-sa-control">
                <label for="fk-sa-player-select">
                    ИЗАБЕРИ ИГРАЧА СА ПОРТАЛ НАЛОГОМ
                </label>

                <select id="fk-sa-player-select">
                    <option value="">
                        Изаберите играча
                    </option>
                </select>
            </div>

            <div class="fk-sa-notice"
                 style="margin-top:15px;">
                Преглед стварних одговора играча.
                Нема измена у евиденцији.
            </div>

            <div id="fk-sa-player-results"
                 class="fk-sa-list"
                 aria-live="polite"></div>
        `;

        // Postavljamo ga iza kontrola za izbor uloge.
        const controls = panel.querySelector(
            ".fk-sa-controls"
        );

        if (controls) {
            controls.insertAdjacentElement(
                "afterend",
                wrapper
            );
        } else {
            panel.appendChild(wrapper);
        }

        get("fk-sa-player-select").addEventListener(
            "change",
            renderPlayer
        );

        get("fk-sa-role")?.addEventListener(
            "change",
            refreshPlayers
        );

        get("fk-sa-selection")?.addEventListener(
            "change",
            refreshPlayers
        );

        get("fk-sa-training")?.addEventListener(
            "change",
            renderPlayer
        );

        get("fk-sa-match-select")?.addEventListener(
            "change",
            renderPlayer
        );

        get("portal-super-admin-tab")?.addEventListener(
            "click",
            () => setTimeout(refreshPlayers, 100)
        );

        return true;
    }

    async function refreshPlayers() {
        const currentVersion = ++version;
        const wrapper = get("fk-sa-player-preview");

        if (!wrapper) return;

        wrapper.hidden = !isActive();

        if (!isActive()) return;

        const select = get("fk-sa-player-select");
        const results = get("fk-sa-player-results");
        const selectionId = get("fk-sa-selection")?.value;

        if (!select || !results) return;

        select.replaceChildren(
            new Option("Учитавање играча...", "")
        );

        results.textContent = "";
        players = [];

        if (!selectionId) {
            select.replaceChildren(
                new Option("Изаберите селекцију", "")
            );
            return;
        }

        const { data, error } = await sb
            .from("portal_korisnici")
            .select(
                "user_id,ime_prezime,selekcija_id,uloga,aktivan"
            )
            .eq("uloga", "IGRAČ")
            .eq("aktivan", true)
            .eq("selekcija_id", selectionId)
            .order("ime_prezime", {
                ascending: true
            });

        if (
            currentVersion !== version ||
            !isActive() ||
            get("fk-sa-selection")?.value !== selectionId
        ) {
            return;
        }

        if (error) {
            console.error(
                "SUPER ADMIN player list:",
                error
            );

            select.replaceChildren(
                new Option("Грешка учитавања", "")
            );

            results.textContent =
                "Није могуће учитати играче.";
            return;
        }

        players = data || [];

        select.replaceChildren(
            new Option("Изабери играча", "")
        );

        for (const player of players) {
            select.appendChild(
                new Option(
                    player.ime_prezime,
                    player.user_id
                )
            );
        }

        if (!players.length) {
            results.textContent =
                "Нема активних играча са портал налогом " +
                "у овој селекцији.";
        }
    }

    async function renderPlayer() {
        const currentVersion = ++version;

        if (!isActive()) return;

        const userId = get("fk-sa-player-select")?.value;
        const results = get("fk-sa-player-results");

        if (!results) return;

        results.textContent = "";

        if (!userId) return;

        const player = players.find(
            item => item.user_id === userId
        );

        if (!player) return;

        const trainingId = get("fk-sa-training")?.value;
        const matchKey = get("fk-sa-match-select")?.value;
        const selectionId = get("fk-sa-selection")?.value;

        results.textContent =
            "Учитавање одговора играча...";

        try {
            const requests = [];

            if (trainingId) {
                requests.push(
                    sb.rpc(
                        "portal_trening_prisustvo_lista",
                        { p_trening_id: trainingId }
                    )
                );
            }

            if (matchKey && selectionId) {
                requests.push(
                    sb.rpc(
                        "portal_utakmica_prisustvo_lista",
                        {
                            p_utakmica_kljuc: matchKey,
                            p_selekcija_id: selectionId
                        }
                    )
                );
            }

            const responses = await Promise.all(requests);

            if (
                currentVersion !== version ||
                !isActive() ||
                get("fk-sa-player-select")?.value !== userId ||
                get("fk-sa-training")?.value !== trainingId ||
                get("fk-sa-match-select")?.value !== matchKey
            ) {
                return;
            }

            let index = 0;
            let trainingStatus = null;
            let matchStatus = null;

            if (trainingId) {
                const response = responses[index++];

                if (response.error) {
                    throw response.error;
                }

                const attendance = (
                    response.data || []
                ).find(
                    row => row.user_id === userId
                );

                trainingStatus = attendance
                    ? statusLabel(attendance.status)
                    : "НИЈЕ ПРОНАЂЕН У СПИСКУ";
            }

            if (matchKey && selectionId) {
                const response = responses[index++];

                if (response.error) {
                    throw response.error;
                }

                const attendance = (
                    response.data || []
                ).find(
                    row => row.user_id === userId
                );

                matchStatus = attendance
                    ? statusLabel(attendance.status)
                    : "НИЈЕ ПРОНАЂЕН У СПИСКУ";
            }

            results.innerHTML = `
                <div class="fk-sa-card">
                    <span>ИГРАЧ</span>
                    <strong>
                        ${escapeHtml(player.ime_prezime)}
                    </strong>
                </div>

                <div class="fk-sa-grid">
                    <div class="fk-sa-card">
                        <span>ИЗАБРАНИ ТРЕНИНГ</span>
                        <strong style="font-size:17px;">
                            ${
                                trainingId
                                    ? escapeHtml(trainingStatus)
                                    : "ИЗАБЕРИ ТРЕНИНГ"
                            }
                        </strong>
                    </div>

                    <div class="fk-sa-card">
                        <span>ИЗАБРАНА УТАКМИЦА</span>
                        <strong style="font-size:17px;">
                            ${
                                matchKey
                                    ? escapeHtml(matchStatus)
                                    : "ИЗАБЕРИ УТАКМИЦУ"
                            }
                        </strong>
                    </div>
                </div>
            `;

        } catch (error) {
            if (currentVersion !== version) return;

            console.error(
                "SUPER ADMIN player preview:",
                error
            );

            results.textContent =
                "Није могуће учитати одговоре.";
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
