
/* =========================================================
   FK OBILIC - UPRAVA / KORISNICKI NALOZI
   Uloge, aktivan status i selekcije trenera
========================================================= */

(() => {
  "use strict";

  if (window.__fkUpravaNaloziLoaded) return;

  const sb = window.fkObilicSupabase;

  if (!sb) {
    console.error("FK Obilic: Supabase nije dostupan.");
    return;
  }

  window.__fkUpravaNaloziLoaded = true;

  const ROLES = {
    UPRAVA: "Управа",
    TRENER: "Тренер",
    "IGRAČ": "Играч"
  };

  const state = {
    accounts: [],
    selections: [],
    selected: null,
    myId: null,
    search: "",
    role: "ALL",
    status: "ALL",
    open: false,
    busy: false,
    version: 0
  };

  let section = null;
  let grid = null;
  let heading = null;
  let screen = null;

  /* POMOCNE FUNKCIJE */

  const h = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function message(text, error = false) {
    const node = screen?.querySelector(
      "#portal-accounts-message"
    );

    if (!node) return;

    node.textContent = text;
    node.classList.toggle("error", error);
  }

  function activeManagers() {
    return state.accounts.filter(a =>
      a.uloga === "UPRAVA" &&
      a.aktivan === true
    ).length;
  }

  /* FILTERI */

  function filtered() {
    const q = state.search
      .trim()
      .toLocaleLowerCase("sr-RS");

    return state.accounts.filter(a => {
      if (
        state.role !== "ALL" &&
        a.uloga !== state.role
      ) return false;

      if (
        state.status === "ACTIVE" &&
        !a.aktivan
      ) return false;

      if (
        state.status === "INACTIVE" &&
        a.aktivan
      ) return false;

      return [
        a.ime_prezime,
        a.email,
        ROLES[a.uloga],
        a.selekcija_naziv
      ].some(value =>
        String(value || "")
          .toLocaleLowerCase("sr-RS")
          .includes(q)
      );

    }).sort((a, b) =>
      String(a.ime_prezime || a.email || "")
        .localeCompare(
          String(b.ime_prezime || b.email || ""),
          "sr"
        )
    );
  }

  /* STATISTIKA */

  function statsHTML() {
    const total = state.accounts.length;

    const enabled = state.accounts.filter(
      a => a.aktivan
    ).length;

    return [
      ["СВИ НАЛОЗИ", total],
      ["АКТИВНИ", enabled],
      ["АКТИВНА УПРАВА", activeManagers()],
      ["НЕАКТИВНИ", total - enabled]
    ].map(([name, count]) => `
      <div class="portal-account-stat">
        <span>${h(name)}</span>
        <strong>${count}</strong>
      </div>
    `).join("");
  }

  /* SPISAK NALOGA */

  function listHTML() {
    const accounts = filtered();

    if (!accounts.length) {
      return `
        <p class="portal-account-muted">
          Нема налога за изабране филтере.
        </p>
      `;
    }

    return accounts.map(a => `
      <button
        type="button"
        class="portal-account-item
          ${a.user_id === state.selected
            ? "selected" : ""}"
        data-action="select"
        data-id="${h(a.user_id)}"
      >

        <strong>
          ${h(
            a.ime_prezime ||
            a.email ||
            "Корисник"
          )}
        </strong>

        <small>
          ${h(a.email || "Имејл није доступан")}
        </small>

        <span>
          ${h(
            ROLES[a.uloga] ||
            a.uloga ||
            "Без улоге"
          )}

          ·

          <b class="${
            a.aktivan ? "active" : "inactive"
          }">
            ${a.aktivan
              ? "АКТИВАН"
              : "НЕАКТИВАН"}
          </b>

          ${
            a.user_id === state.myId
              ? " · ВАШ НАЛОГ"
              : ""
          }

          ${
            a.uloga === "TRENER" &&
            a.selekcija_naziv
              ? " · " + h(a.selekcija_naziv)
              : ""
          }
        </span>

      </button>
    `).join("");
  }

  /* OPCIJE SELEKCIJE */

 
function selectionOptions(a) {

    return `
        <option value="">
            Изабери селекцију
        </option>
    ` + state.selections.map(s => {

        const selected =
            a.selekcija_id === s.id;

        const disabled =
            !s.aktivna && !selected;

        return `
            <option
                value="${h(s.id)}"
                ${selected ? "selected" : ""}
                ${disabled ? "disabled" : ""}
            >
                ${h(s.naziv)}
                ${
                    s.aktivna
                        ? ""
                        : " (НЕАКТИВНА)"
                }
            </option>
        `;

    }).join("");
}

  /* DETALJI I FORMULAR */

  function detailHTML(a) {
    const own =
      a.user_id === state.myId;

    const lastAdmin =
      a.uloga === "UPRAVA" &&
      a.aktivan &&
      activeManagers() <= 1;

    const restricted =
      own || lastAdmin;

    const knownRole =
      Object.hasOwn(ROLES, a.uloga);

    return `
      <div class="portal-account-panel">

        <h3>
          ПОДЕШАВАЊЕ ПРИСТУПА
        </h3>

        <div class="portal-account-identity">

          <strong>
            ${h(a.ime_prezime || "Корисник")}
          </strong>

          <span>
            ${h(
              a.email ||
              "Имејл није доступан"
            )}
          </span>

        </div>

        <form id="portal-account-form">

          <label>
            УЛОГА У ПОРТАЛУ

            <select
              name="uloga"
              ${
                restricted || !knownRole
                  ? "disabled"
                  : ""
              }
            >
              ${Object.entries(ROLES)
                .map(([value, label]) => `
                  <option
                    value="${h(value)}"
                    ${
                      a.uloga === value
                        ? "selected"
                        : ""
                    }
                  >
                    ${h(label)}
                  </option>
                `).join("")}
            </select>
          </label>

          <div
            id="portal-account-coach-box"
            ${
              a.uloga === "TRENER"
                ? ""
                : "hidden"
            }
          >

            <label>
              СЕЛЕКЦИЈА ТРЕНЕРА

              <select
                name="selekcija_id"
                ${
                  restricted || !knownRole
                    ? "disabled"
                    : ""
                }
              >
                ${selectionOptions(a)}
              </select>
            </label>

            <p class="portal-account-muted">
              Изабери селекцију коју тренер води.
              Ово не креира нови налог.
            </p>

          </div>

          <label class="portal-account-check">

            <input
              type="checkbox"
              name="aktivan"
              ${a.aktivan ? "checked" : ""}
              ${
                restricted || !knownRole
                  ? "disabled"
                  : ""
              }
            >

            <span>
              НАЛОГ ИМА ПРИСТУП ПОРТАЛУ
            </span>

          </label>

          ${
            own
              ? `
                <p class="portal-account-warning">
                  Не можете мењати сопствену
                  улогу или приступ.
                </p>
              `
              : ""
          }

          ${
            lastAdmin && !own
              ? `
                <p class="portal-account-warning">
                  Ово је последњи активни
                  администратор. Његов приступ
                  је заштићен.
                </p>
              `
              : ""
          }

          ${
            !knownRole
              ? `
                <p class="portal-account-warning">
                  Непозната ознака улоге:
                  ${h(a.uloga)}.
                  Измена је блокирана ради
                  заштите налога.
                </p>
              `
              : ""
          }

          ${
            !restricted && knownRole
              ? `
                <button
                  type="submit"
                  class="primary"
                >
                  САЧУВАЈ ИЗМЕНЕ
                </button>
              `
              : ""
          }

        </form>

        <p class="portal-account-muted">
          Промена не брише кориснички налог
          и не мења лозинку. Повезивање
          постојећих играча остаје непромењено.
        </p>

      </div>
    `;
  }

  /* GLAVNI PRIKAZ */

  function render() {
    if (!state.open || !screen) return;

    const chosen = state.accounts.find(
      a => a.user_id === state.selected
    );

    screen.innerHTML = `

      <div class="portal-account-header">

        <button
          type="button"
          data-action="back"
        >
          ← НАЗАД НА УПРАВУ
        </button>

        <span>
          ФК ОБИЛИЋ · ПРИВАТНИ ПОРТАЛ
        </span>

        <h2>КОРИСНИЧКИ НАЛОЗИ</h2>

        <p>
          Улоге, приступ и селекције тренера.
        </p>

      </div>

      <p
        id="portal-accounts-message"
        class="portal-account-message"
        role="status"
      ></p>

      <div class="portal-account-stats">
        ${statsHTML()}
      </div>

      <div class="portal-account-layout">

        <div class="portal-account-panel">

          <div class="portal-account-panel-top">

            <h3>
              РЕГИСТРОВАНИ НАЛОЗИ
            </h3>

            <button
              type="button"
              data-action="refresh"
            >
              ОСВЕЖИ
            </button>

          </div>

          <div class="portal-account-filters">

            <label>
              УЛОГА

              <select
                id="portal-account-role-filter"
              >

                <option value="ALL">
                  Све улоге
                </option>

                ${Object.entries(ROLES)
                  .map(([id, name]) => `
                    <option
                      value="${h(id)}"
                      ${
                        state.role === id
                          ? "selected"
                          : ""
                      }
                    >
                      ${h(name)}
                    </option>
                  `).join("")}

              </select>
            </label>

            <label>
              СТАТУС

              <select
                id="portal-account-status-filter"
              >

                <option
                  value="ALL"
                  ${
                    state.status === "ALL"
                      ? "selected"
                      : ""
                  }
                >
                  Сви налози
                </option>

                <option
                  value="ACTIVE"
                  ${
                    state.status === "ACTIVE"
                      ? "selected"
                      : ""
                  }
                >
                  Активни
                </option>

                <option
                  value="INACTIVE"
                  ${
                    state.status === "INACTIVE"
                      ? "selected"
                      : ""
                  }
                >
                  Неактивни
                </option>

              </select>
            </label>

            <label class="wide">
              ПРЕТРАГА

              <input
                id="portal-account-search"
                type="search"
                placeholder="Име, имејл или селекција..."
                value="${h(state.search)}"
              >
            </label>

          </div>

          <div
            id="portal-account-list"
            class="portal-account-list"
          >
            ${listHTML()}
          </div>

        </div>

        ${
          chosen
            ? detailHTML(chosen)
            : `
              <div class="portal-account-panel">

                <h3>ДЕТАЉИ НАЛОГА</h3>

                <p class="portal-account-muted">
                  Изабери корисника са списка.
                </p>

              </div>
            `
        }

      </div>
    `;

    adjustCoachField();
  }

  /* PRIKAZ SELEKCIJE KADA JE ULOGA TRENER */

  function adjustCoachField() {
    const form = screen?.querySelector(
      "#portal-account-form"
    );

    if (!form) return;

    const role = form.elements
      .namedItem("uloga")?.value;

    const active = Boolean(
      form.elements
        .namedItem("aktivan")?.checked
    );

    const block = screen.querySelector(
      "#portal-account-coach-box"
    );

    const selection = form.elements
      .namedItem("selekcija_id");

    if (!block || !selection) return;

    block.hidden =
      role !== "TRENER";

    selection.required =
      role === "TRENER" && active;
  }

  /* UCITAVANJE IZ SUPABASE */

  async function load() {
    const version = ++state.version;

    const auth =
      await sb.auth.getUser();

    if (
      auth.error ||
      !auth.data?.user
    ) {
      throw new Error(
        "Нема пријављеног корисника."
      );
    }

    const [list, selections] =
      await Promise.all([

        sb.rpc(
          "portal_uprava_lista_naloga_v2"
        ),

        sb.rpc(
          "portal_uprava_lista_selekcija_v2"
        )

      ]);

    if (list.error) {
      throw list.error;
    }

    if (selections.error) {
      throw selections.error;
    }

    if (
      !state.open ||
      version !== state.version
    ) {
      return false;
    }

    state.myId =
      auth.data.user.id;

    state.accounts =
      Array.isArray(list.data)
        ? list.data
        : [];

    state.selections =
      Array.isArray(selections.data)
        ? selections.data
        : [];

    if (
      state.selected &&
      !state.accounts.some(
        a => a.user_id === state.selected
      )
    ) {
      state.selected = null;
    }

    render();

    return true;
  }

  /* OTVARANJE I ZATVARANJE */

  async function open() {
    if (state.open || state.busy) {
      return;
    }

    state.open = true;

    grid.hidden = true;
    heading.hidden = true;
    screen.hidden = false;

    render();

    message("Учитавање...");

    try {
      await load();

    } catch (error) {
      console.error(
        "FK Obilic - nalozi:",
        error
      );

      message(
        "Учитавање није успело: " +
        (error.message || "грешка"),
        true
      );
    }
  }

  function back() {
    state.open = false;
    state.version++;

    if (screen) screen.hidden = true;
    if (grid) grid.hidden = false;
    if (heading) heading.hidden = false;
  }

  /* CUVANJE NALOGA */

  async function save(form) {
    if (state.busy) return;

    const a = state.accounts.find(
      x => x.user_id === state.selected
    );

    if (
      !a ||
      a.user_id === state.myId
    ) {
      return;
    }

    const role = form.elements
      .namedItem("uloga")?.value;

    const active = Boolean(
      form.elements
        .namedItem("aktivan")?.checked
    );

    const selectionId =
      role === "TRENER"
        ? (
            form.elements
              .namedItem("selekcija_id")
              ?.value || null
          )
        : null;

    if (!Object.hasOwn(ROLES, role)) {
      message(
        "Неподржана улога.",
        true
      );
      return;
    }

    if (
      role === "TRENER" &&
      active &&
      !selectionId
    ) {
      message(
        "Изабери селекцију тренера.",
        true
      );
      return;
    }

    if (
      role === "TRENER" &&
      selectionId &&
      !state.selections.some(
        s =>
          s.id === selectionId &&
          (
            s.aktivna ||
            (
              !active &&
              selectionId === a.selekcija_id
            )
          )
      )
    ) {
      message(
        "Изабрана селекција није активна.",
        true
      );
      return;
    }

    const same =
      a.uloga === role &&
      a.aktivan === active &&
      (
        role !== "TRENER" ||
        a.selekcija_id === selectionId
      );

    if (same) {
      message(
        "Нема измена за чување."
      );
      return;
    }

    if (
      a.uloga === "UPRAVA" &&
      a.aktivan &&
      activeManagers() <= 1 &&
      (
        role !== "UPRAVA" ||
        !active
      )
    ) {
      message(
        "Последњи активни администратор је заштићен.",
        true
      );
      return;
    }

    const roleName =
      ROLES[role];

    const selectionName =
      state.selections.find(
        s => s.id === selectionId
      )?.naziv ||
      "Није одређена";

    const confirmed = window.confirm(
      "Променити налог: " +
      (
        a.ime_prezime ||
        a.email ||
        "корисник"
      ) +
      "?\n\n" +
      "Улога: " + roleName + "\n" +
      "Приступ: " +
      (
        active
          ? "АКТИВАН"
          : "НЕАКТИВАН"
      ) +
      (
        role === "TRENER"
          ? "\nСелекција: " + selectionName
          : ""
      )
    );

    if (!confirmed) {
      return;
    }

    state.busy = true;

    const button = form.querySelector(
      'button[type="submit"]'
    );

    if (button) {
      button.disabled = true;
    }

    try {

      const { data, error } =
        await sb.rpc(
          "portal_uprava_sacuvaj_nalog_v2",
          {
            p_user_id: a.user_id,
            p_uloga: role,
            p_aktivan: active,
            p_selekcija_id: selectionId
          }
        );

      if (error) {
        throw error;
      }

      if (data !== true) {
        throw new Error(
          "Налог није пронађен."
        );
      }

      /*
        Ponovo ucitavamo podatke
        da potvrdimo stvarno stanje baze.
      */

      const loaded = await load();

      if (!loaded) return;

      const updated = state.accounts.find(
        x => x.user_id === a.user_id
      );

      if (
        !updated ||
        updated.uloga !== role ||
        updated.aktivan !== active ||
        (
          role === "TRENER" &&
          updated.selekcija_id !== selectionId
        )
      ) {
        throw new Error(
          "Промена је послата, али није " +
          "потврђена поновним учитавањем."
        );
      }

      message(
        "Измене су сачуване и потврђене из базе."
      );

    } catch (error) {

      console.error(
        "FK Obilic - cuvanje naloga:",
        error
      );

      message(
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

  /* KLIKOVI */

  function handleClick(event) {
    const button = event.target.closest(
      "button[data-action]"
    );

    if (!button || state.busy) {
      return;
    }

    const action =
      button.dataset.action;

    if (action === "back") {
      return back();
    }

    if (action === "select") {
      state.selected =
        button.dataset.id;

      return render();
    }

    if (action === "refresh") {
      message("Освежавање...");

      return load().catch(error => {
        message(
          "Грешка при освежавању: " +
          (error.message || "грешка"),
          true
        );
      });
    }
  }

  /* PROMENA FILTERA I ULOGE */

  function handleChange(event) {
    const el = event.target;

    if (
      el.id ===
      "portal-account-role-filter"
    ) {
      state.role = el.value;

    } else if (
      el.id ===
      "portal-account-status-filter"
    ) {
      state.status = el.value;

    } else if (
      el.id ===
      "portal-account-search"
    ) {
      state.search = el.value;

    } else if (
      el.name === "uloga" ||
      el.name === "aktivan"
    ) {
      adjustCoachField();
      return;

    } else {
      return;
    }

    const list = screen.querySelector(
      "#portal-account-list"
    );

    if (list) {
      list.innerHTML = listHTML();
    }
  }

  /* POVEZIVANJE SA KARTICOM UPRAVE */

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

    if (!grid || !heading) {
      return false;
    }

    let card = grid.querySelector(
      ".portal-account-launcher"
    );

    if (!card) {
      card = document.createElement("div");

      card.className =
        "portal-management-card portal-account-launcher";

      card.innerHTML = `
        <h3>КОРИСНИЧКИ НАЛОЗИ</h3>

        <p>
          Улоге, приступ и селекције тренера
        </p>
      `;

      grid.appendChild(card);
    }

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-label",
      "Отвори корисничке налоге"
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

    screen.id = "portal-users-screen";
    screen.hidden = true;

    section.appendChild(screen);

    screen.addEventListener(
      "click",
      handleClick
    );

    screen.addEventListener(
      "submit",
      event => {
        if (
          event.target.id !==
          "portal-account-form"
        ) {
          return;
        }

        event.preventDefault();

        if (!state.busy) {
          save(event.target);
        }
      }
    );

    screen.addEventListener(
      "change",
      handleChange
    );

    screen.addEventListener(
      "input",
      event => {
        if (
          event.target.id ===
          "portal-account-search"
        ) {
          handleChange(event);
        }
      }
    );

    sb.auth.onAuthStateChange(
      event => {
        if (event !== "SIGNED_OUT") {
          return;
        }

        back();

        state.accounts = [];
        state.selections = [];
        state.selected = null;
        state.myId = null;

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
