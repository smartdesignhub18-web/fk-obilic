
/* ========================================================
   FK OBILIC - CLANOVI KLUBA / POVEZIVANJE NALOGA
   Samo prikazuje i povezuje postojece naloge.
   Ne kreira Auth korisnike i NE menja prava pristupa.
======================================================== */
(() => {
  "use strict";

  const sb = window.fkObilicSupabase;
  if (!sb) return;

  const ROLES = {
    UPRAVA: "Управа",
    TRENER: "Тренер",
    IGRAC: "Играч",
    CLAN: "Члан"
  };

  const h = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  let screen = null;
  let busy = false;
  let revision = 0;

  function label(account) {
    const email = account.nalog_email ||
      `Налог ${String(account.nalog_user_id).slice(0, 8)}`;

    const role = ROLES[account.nalog_uloga] ||
      account.nalog_uloga || "Без улоге";

    return `${email} · ${role}${
      account.nalog_aktivan ? "" : " · НЕАКТИВАН"
    }`;
  }

  function msg(panel, text, isError = false) {
    const target = panel.querySelector(
      "#portal-member-link-message"
    );

    if (!target) return;

    target.textContent = text;
    target.classList.toggle("error", isError);
  }

  /* UCITAVANJE POSTOJECIH NALOGA */

  async function renderPanel(panel, successText = "") {
    const memberId = panel.dataset.memberId;
    const myRevision = ++revision;

    panel.innerHTML = `
      <h4>НАЛОГ ЗА ПОРТАЛ</h4>
      <p class="portal-member-link-help">
        Учитавање постојећих налога...
      </p>
    `;

    try {
      const { data, error } = await sb.rpc(
        "portal_lista_naloga_clanova"
      );

      if (error) throw error;

      if (
        myRevision !== revision ||
        !panel.isConnected ||
        screen.hidden
      ) return;

      const accounts = Array.isArray(data) ? data : [];

      const current = accounts.find(
        a => a.povezan_clan_id === memberId
      ) || null;

      const available = accounts.filter(
        a =>
          !a.povezan_clan_id ||
          a.povezan_clan_id === memberId
      );

      panel.innerHTML = `
        <h4>НАЛОГ ЗА ПОРТАЛ</h4>

        <p class="portal-member-link-help">
          Повежи члана са већ постојећим налогом.
          Ово не мења улогу, лозинку
          нити права приступа.
        </p>

        <label
          class="portal-member-link-label"
          for="portal-member-link-select"
        >
          ПОВЕЗАНИ НАЛОГ

          <select id="portal-member-link-select">

            <option value="">
              Нема повезаног налога
            </option>

            ${available.map(a => `
              <option
                value="${h(a.nalog_user_id)}"
                ${
                  current?.nalog_user_id ===
                  a.nalog_user_id
                    ? "selected"
                    : ""
                }
              >
                ${h(label(a))}
              </option>
            `).join("")}

          </select>
        </label>

        ${!available.length ? `
          <p class="portal-member-link-help">
            Нема слободних регистрованих налога.
          </p>
        ` : ""}

        ${current ? `
          <p class="portal-member-link-current">
            Тренутно повезан:
            <strong>${h(label(current))}</strong>
          </p>
        ` : `
          <p class="portal-member-link-help">
            Овај члан тренутно нема повезан налог.
          </p>
        `}

        <div class="portal-member-link-actions">

          <button
            type="button"
            data-member-link-save
          >
            САЧУВАЈ ВЕЗУ
          </button>

          <button
            type="button"
            data-member-link-reload
          >
            ОСВЕЖИ НАЛОГЕ
          </button>

        </div>

        <p
          id="portal-member-link-message"
          class="portal-member-link-message"
          role="status"
        ></p>
      `;

      if (successText) {
        msg(panel, successText);
      }

    } catch (error) {
      if (
        myRevision !== revision ||
        !panel.isConnected
      ) return;

      console.error("Povezivanje naloga:", error);

      panel.innerHTML = `
        <h4>НАЛОГ ЗА ПОРТАЛ</h4>

        <p class="portal-member-link-message error">
          Учитавање налога није успело:
          ${h(error.message || "непозната грешка")}
        </p>

        <button
          type="button"
          data-member-link-reload
        >
          ПОКУШАЈ ПОНОВО
        </button>
      `;
    }
  }

  /* UBACIVANJE U POSTOJECE DETALJE CLANA */

  function attachPanel() {
    if (!screen || screen.hidden) return;

    const detail = screen.querySelector(
      ".portal-member-details"
    );

    const editButton = screen.querySelector(
      '.portal-member-detail-head button[data-action="edit"][data-id]'
    );

    if (!detail || !editButton) return;

    const memberId = editButton.dataset.id;

    if (
      !memberId ||
      screen.querySelector("#portal-member-account-link")
    ) return;

    const panel = document.createElement("section");

    panel.id = "portal-member-account-link";
    panel.className = "portal-member-account-link";
    panel.dataset.memberId = memberId;

    detail.insertAdjacentElement("afterend", panel);

    renderPanel(panel);
  }

  /* CUVANJE VEZE */

  async function onClick(event) {
    const saveButton = event.target.closest(
      "[data-member-link-save]"
    );

    const reloadButton = event.target.closest(
      "[data-member-link-reload]"
    );

    if (!saveButton && !reloadButton) return;

    const panel = event.target.closest(
      "#portal-member-account-link"
    );

    if (!panel || busy) return;

    if (reloadButton) {
      await renderPanel(panel);
      return;
    }

    const memberId = panel.dataset.memberId;

    const userId = panel.querySelector(
      "#portal-member-link-select"
    )?.value || null;

    if (!memberId) return;

    busy = true;
    saveButton.disabled = true;

    try {
      const { data, error } = await sb.rpc(
        "portal_postavi_nalog_clana",
        {
          p_clan_id: memberId,
          p_nalog_user_id: userId
        }
      );

      if (error) throw error;

      if (data !== true) {
        throw new Error("Члан није пронађен.");
      }

      await renderPanel(
        panel,
        userId
          ? "Налог је успешно повезан са чланом."
          : "Веза је уклоњена. Налог није обрисан."
      );

    } catch (error) {
      console.error("Cuvanje veze naloga:", error);

      msg(
        panel,
        "Чување није успело: " +
        (error.message || "грешка"),
        true
      );

    } finally {
      busy = false;

      if (saveButton.isConnected) {
        saveButton.disabled = false;
      }
    }
  }

  /* POVEZIVANJE SA MODULOM CLANOVA */

  function mount() {
    screen = document.querySelector(
      "#portal-members-screen"
    );

    if (!screen) return false;

    const observer = new MutationObserver(
      () => attachPanel()
    );

    // Originalni modul ponovo iscrtava ekran.
    // Pratimo samo neposrednu decu ekrana.

    observer.observe(screen, {
      childList: true
    });

    screen.addEventListener("click", onClick);

    sb.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") {
        revision++;
      }
    });

    attachPanel();
    return true;
  }

  function init() {
    if (mount()) return;

    const observer = new MutationObserver(() => {
      if (mount()) {
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
      init
    );
  } else {
    init();
  }

})();
