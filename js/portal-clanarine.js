
/* ==========================================
   FK OBILIC - EVIDENCIJA CLANARINA
   PIONIRI I PETLICI
========================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;

    if (!sb) return;

    
const TEAM_NAMES = {
    pioniri: "ПИОНИРИ",
    petlici: "ПЕТЛИЋИ 1",
    "petlici-2": "ПЕТЛИЋИ",
    "najmladji-petlici": "НАЈМЛАЂИ ПЕТЛИЋИ"
};


    const DEFAULT_PHOTO = "images/grb.png";

    let players = [];
    let payments = new Map();
    let refreshNumber = 0;
    let saving = false;

    const escapeHtml = value => String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

    function localDate() {
        const parts = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Belgrade",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).formatToParts(new Date());

        const get = key =>
            parts.find(p => p.type === key)?.value;

        return `${get("year")}-${get("month")}-${get("day")}`;
    }

    function safePhoto(value) {
        const src = String(value || "").trim();

        if (
            /^https?:\/\//i.test(src) ||
            /^images\/[a-z0-9/_ .-]+$/i.test(src)
        ) {
            return src;
        }

        return DEFAULT_PHOTO;
    }

    function message(text, error = false) {
        const el = document.querySelector(
            "#portal-membership-message"
        );

        if (!el) return;

        el.textContent = text;
        el.classList.toggle("is-error", error);
    }

    function hide() {
        refreshNumber++;

        document.querySelector(
            "#portal-membership-section"
        )?.setAttribute("hidden", "");

        players = [];
        payments = new Map();
    }

    function activeTeam() {
        return document.querySelector(
            "#portal-membership-selection"
        )?.selectedOptions[0]?.dataset.code || "";
    }

    /* ======================================
       UCITAVANJE PODATAKA
    ====================================== */

    async function loadMembership() {
        const token = ++refreshNumber;

        const teamCode = activeTeam();

        const month = document.querySelector(
            "#portal-membership-month"
        )?.value || "";

        const list = document.querySelector(
            "#portal-membership-list"
        );

        if (
            !list ||
            !TEAM_NAMES[teamCode] ||
            !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)
        ) {
            return;
        }

        message("");

        list.textContent = "Учитавање евиденције...";

        document.querySelector(
            "#portal-membership-summary"
        ).textContent = "";

        try {
            const {
                data: teamPlayers,
                error: playersError
            } = await sb
                .from("igraci")
                .select("id,ime_prezime,fotografija")
                .eq("selekcija", TEAM_NAMES[teamCode])
                .eq("aktivan", true)
                .order("ime_prezime", {
                    ascending: true
                });

            if (playersError) throw playersError;
            if (token !== refreshNumber) return;

            players = teamPlayers || [];

            let rows = [];

            if (players.length) {
                const { data, error } = await sb
                    .from("portal_clanarine")
                    .select(
                        "igrac_id,placeno,iznos,datum_uplate"
                    )
                    .eq("mesec", `${month}-01`)
                    .in(
                        "igrac_id",
                        players.map(p => p.id)
                    );

                if (error) throw error;

                rows = data || [];
            }

            if (token !== refreshNumber) return;

            payments = new Map(
                rows.map(row => [
                    row.igrac_id,
                    row
                ])
            );

            render();

        } catch (error) {
            if (token !== refreshNumber) return;

            console.error(
                "Membership loading:",
                error
            );

            list.textContent =
                "Евиденцију није могуће учитати.";

            message(
                error.message || "Грешка при учитавању.",
                true
            );
        }
    }

    /* ======================================
       PRIKAZ IGRACA
    ====================================== */

    function render() {
        const list = document.querySelector(
            "#portal-membership-list"
        );

        const summary = document.querySelector(
            "#portal-membership-summary"
        );

        const paid = players.filter(
            p => payments.get(p.id)?.placeno
        ).length;

        summary.textContent =
            `Укупно: ${players.length} · ` +
            `Уплаћено: ${paid} · ` +
            `Није евидентирано: ${players.length - paid}`;

        if (!players.length) {
            list.textContent =
                "Нема активних играча у овој селекцији.";

            return;
        }

        list.innerHTML = players.map(player => {
            const row = payments.get(player.id);
            const isPaid = row?.placeno === true;

            const amount =
                row?.iznos == null ? "" : row.iznos;

            const date =
                row?.datum_uplate || localDate();

            return `
                <div
                    class="portal-membership-row"
                    data-player-id="${escapeHtml(player.id)}"
                >

                    <div class="portal-membership-person">

                        
<div class="portal-membership-avatar">

    <span class="portal-membership-initials">
        ${escapeHtml(
            String(player.ime_prezime || "?")
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map(part => Array.from(part)[0] || "")
                .join("")
                .toUpperCase()
        )}
    </span>

    ${
        player.fotografija &&
        safePhoto(player.fotografija) !== DEFAULT_PHOTO
            ? `
                <img
                    src="${escapeHtml(
                        safePhoto(player.fotografija)
                    )}"
                    alt=""
                    loading="lazy"
                >
            `
            : ""
    }

</div>


                        <div>
                            <strong>
                                ${escapeHtml(player.ime_prezime)}
                            </strong>

                            <span class="${isPaid ? "is-paid" : ""}">
                                ${isPaid
                                    ? "УПЛАЋЕНО"
                                    : "НИЈЕ ЕВИДЕНТИРАНО"}
                            </span>
                        </div>

                    </div>

                    <div class="portal-membership-fields">

                        <label>
                            ИЗНОС (ДИН.)

                            <input
                                class="portal-membership-amount"
                                type="number"
                                min="0"
                                step="0.01"
                                value="${escapeHtml(amount)}"
                                placeholder="Износ"
                            >
                        </label>

                        <label>
                            ДАТУМ УПЛАТЕ

                            <input
                                class="portal-membership-date"
                                type="date"
                                value="${escapeHtml(date)}"
                            >
                        </label>

                    </div>

                    <div class="portal-membership-actions">

                        <button
                            type="button"
                            data-action="save"
                        >
                            ${isPaid
                                ? "ИЗМЕНИ УПЛАТУ"
                                : "ЕВИДЕНТИРАЈ"}
                        </button>

                        ${isPaid ? `
                            <button
                                type="button"
                                data-action="cancel"
                                class="portal-membership-cancel"
                            >
                                ПОНИШТИ
                            </button>
                        ` : ""}

                    </div>

                </div>
            `;
        }).join("");

       
list.querySelectorAll(
    ".portal-membership-avatar img"
).forEach(img => {

    img.addEventListener(
        "error",
        () => {
            img.remove();
        },
        { once: true }
    );

});

    }

    /* ======================================
       CUVANJE I PONISTAVANJE UPLATE
    ====================================== */

    async function handleClick(event) {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button || saving) return;

        const row = button.closest(
            "[data-player-id]"
        );

        const playerId = row?.dataset.playerId;

        if (
            !players.some(p => p.id === playerId)
        ) {
            return;
        }

        const cancel =
            button.dataset.action === "cancel";

        if (
            cancel &&
            !window.confirm(
                "Поништити евидентирану уплату?"
            )
        ) {
            return;
        }

        const month = document.querySelector(
            "#portal-membership-month"
        )?.value;

        const value = row.querySelector(
            ".portal-membership-amount"
        ).value.trim();

        const date = row.querySelector(
            ".portal-membership-date"
        ).value;

        const amount =
            value === "" ? null : Number(value);

        if (
            !cancel &&
            value !== "" &&
            (!Number.isFinite(amount) || amount < 0)
        ) {
            message(
                "Унеси исправан износ.",
                true
            );
            return;
        }

        if (!cancel && !date) {
            message(
                "Изабери датум уплате.",
                true
            );
            return;
        }

        saving = true;
        button.disabled = true;

        message("Чување...");

        try {
            const { error } = await sb
                .from("portal_clanarine")
                .upsert({
                    igrac_id: playerId,
                    mesec: `${month}-01`,
                    placeno: !cancel,
                    iznos: cancel ? null : amount,
                    datum_uplate: cancel ? null : date
                }, {
                    onConflict: "igrac_id,mesec"
                });

            if (error) throw error;

            await loadMembership();

            message(
                cancel
                    ? "Уплата је поништена."
                    : "Уплата је сачувана."
            );

        } catch (error) {
            console.error(
                "Membership saving:",
                error
            );

            message(
                error.message || "Уплата није сачувана.",
                true
            );

        } finally {
            saving = false;
            button.disabled = false;
        }
    }

    /* ======================================
       PROVERA KORISNIKA I SELEKCIJE
    ====================================== */

    async function checkAccess() {
        const token = ++refreshNumber;

        try {
            const {
                data: { session }
            } = await sb.auth.getSession();

            if (token !== refreshNumber) return;
            if (!session?.user) return hide();

            const {
                data: profile,
                error: profileError
            } = await sb
                .from("portal_korisnici")
                .select("uloga,selekcija_id,aktivan")
                .eq("user_id", session.user.id)
                .maybeSingle();

            if (profileError) throw profileError;
            if (token !== refreshNumber) return;

            if (
                !profile ||
                profile.aktivan !== true
            ) {
                return hide();
            }

            const role = String(
                profile.uloga || ""
            ).trim().toUpperCase();

            if (
                !["TRENER", "UPRAVA"].includes(role)
            ) {
                return hide();
            }

            const {
                data: selections,
                error: selectionsError
            } = await sb
                .from("selekcije")
                .select("id,kod,naziv")
                .eq("aktivna", true)
                .in(
                    "kod",
                    Object.keys(TEAM_NAMES)
                );

            if (selectionsError) {
                throw selectionsError;
            }

            if (token !== refreshNumber) return;

            const permitted =
                role === "UPRAVA"
                    ? (selections || [])
                    : (selections || []).filter(
                        s => s.id === profile.selekcija_id
                    );

            if (!permitted.length) {
                return hide();
            }

            const section = document.querySelector(
                "#portal-membership-section"
            );

            const choice = document.querySelector(
                "#portal-membership-selection"
            );

            const previous = choice.value;

            choice.innerHTML = permitted.map(s => `
                <option
                    data-code="${escapeHtml(s.kod)}"
                    value="${escapeHtml(s.id)}"
                >
                    ${escapeHtml(s.naziv)}
                </option>
            `).join("");

            if (
                permitted.some(s => s.id === previous)
            ) {
                choice.value = previous;
            }

            choice.disabled = permitted.length === 1;

            section.hidden = false;

            await loadMembership();

        } catch (error) {
            console.error(
                "Membership access:",
                error
            );

            hide();
        }
    }

    /* ======================================
       DODAVANJE SEKCIJE U PORTAL
    ====================================== */

    function initialize() {
        const training = document.querySelector(
            "#portal-training-list"
        )?.closest(".portal-section");

        if (!training) return;

        const section = document.createElement(
            "section"
        );

        section.id = "portal-membership-section";

        section.className =
            "portal-section portal-membership-section";

        section.hidden = true;

        section.innerHTML = `
            <div class="portal-section-heading">

                <div>
                    <span>МЛАЂЕ СЕЛЕКЦИЈЕ</span>

                    <h2>
                        ЕВИДЕНЦИЈА ЧЛАНАРИНЕ
                    </h2>

                    <p>
                        Уплате се воде посебно
                        за сваки месец.
                    </p>
                </div>

            </div>

            <div class="portal-membership-toolbar">

                <label>
                    СЕЛЕКЦИЈА

                    <select
                        id="portal-membership-selection"
                    ></select>
                </label>

                <label>
                    МЕСЕЦ

                    <input
                        id="portal-membership-month"
                        type="month"
                    >
                </label>

            </div>

            <p
                id="portal-membership-summary"
                class="portal-membership-summary"
            ></p>

            <p
                id="portal-membership-message"
                class="portal-membership-message"
                role="status"
            ></p>

            <div
                id="portal-membership-list"
                class="portal-membership-list"
            ></div>
        `;

        training.insertAdjacentElement(
            "afterend",
            section
        );

        section.querySelector(
            "#portal-membership-month"
        ).value = localDate().slice(0, 7);

        section.querySelector(
            "#portal-membership-month"
        ).addEventListener(
            "change",
            loadMembership
        );

        section.querySelector(
            "#portal-membership-selection"
        ).addEventListener(
            "change",
            loadMembership
        );

        section.querySelector(
            "#portal-membership-list"
        ).addEventListener(
            "click",
            handleClick
        );

        checkAccess();

        sb.auth.onAuthStateChange(
            (event, session) => {

                if (event === "SIGNED_OUT") {
                    hide();
                }

                if (
                    ["SIGNED_IN", "INITIAL_SESSION"]
                        .includes(event) &&
                    session?.user
                ) {
                    setTimeout(checkAccess, 0);
                }
            }
        );
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );
    } else {
        initialize();
    }

})();
