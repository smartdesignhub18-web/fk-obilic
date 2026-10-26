
/* FK OBILIC - PORTAL UPRAVE / CLANOVI KLUBA */

(() => {
  "use strict";

  const sb = window.fkObilicSupabase;

  if (!sb) {
    console.error("FK Obilic: Supabase nije dostupan");
    return;
  }

  const TYPES = {
    CLAN: "Члан клуба",
    UPRAVA: "Управа",
    TRENER: "Тренер",
    STRUCNI_STAB: "Стручни штаб",
    VOLONTER: "Волонтер",
    POCASNI: "Почасни члан",
    OSTALO: "Остало"
  };

  const STATUSES = {
    AKTIVAN: "Активан",
    NEAKTIVAN: "Неактиван",
    ISTUPIO: "Иступио"
  };

  const state = {
    items: [],
    selected: null,
    editing: null,
    search: "",
    type: "ALL",
    status: "ALL",
    open: false,
    busy: false,
    version: 0
  };

  let section, grid, heading, screen;

  /* POMOCNE FUNKCIJE */

  const h = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const today = () =>
    new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

  function diffDays(date) {
    if (!date) return null;

    return Math.round((
      Date.parse(date + "T00:00:00Z") -
      Date.parse(today() + "T00:00:00Z")
    ) / 86400000);
  }

  function fmt(date) {
    if (!date) return "—";

    const p = date.slice(0, 10).split("-");

    return p.length === 3
      ? `${p[2]}.${p[1]}.${p[0]}.`
      : date;
  }

  function options(obj, chosen, label = null) {
    return (
      label === null
        ? ""
        : `<option value="ALL"
            ${chosen === "ALL" ? "selected" : ""}>
            ${h(label)}
          </option>`
    ) + Object.entries(obj).map(
      ([key, value]) => `
        <option
          value="${h(key)}"
          ${chosen === key ? "selected" : ""}
        >
          ${h(value)}
        </option>
      `
    ).join("");
  }

  function message(text, bad = false) {
    const el = screen?.querySelector(
      "#portal-members-message"
    );

    if (!el) return;

    el.textContent = text;
    el.classList.toggle("error", bad);
  }

  /* PROVERA PRISTUPA */

  async function verifyAdmin() {
    const { data, error } =
      await sb.auth.getUser();

    if (error || !data?.user) return false;

    const r = await sb
      .from("portal_korisnici")
      .select("uloga,aktivan")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (r.error) throw r.error;

    return (
      r.data?.aktivan === true &&
      String(r.data.uloga || "")
        .trim()
        .toUpperCase() === "UPRAVA"
    );
  }

  /* UCITAVANJE CLANOVA */

  async function readAll() {
    const arr = [];

    for (let from = 0; ; from += 400) {
      const { data, error } = await sb
        .from("portal_clanovi_kluba")
        .select(
          "id,ime_prezime,clanski_broj,vrsta,funkcija,telefon,email,datum_uclanjenja,datum_isteka_mandata,status,napomena,created_at"
        )
        .order("created_at", {
          ascending: false
        })
        .range(from, from + 399);

      if (error) throw error;

      arr.push(...(data || []));

      if (!data || data.length < 400) break;
    }

    return arr;
  }

  async function reload() {
    const version = ++state.version;
    const rows = await readAll();

    if (
      version !== state.version ||
      !state.open
    ) return;

    state.items = rows;

    if (
      state.selected &&
      !rows.some(x => x.id === state.selected)
    ) {
      state.selected = null;
      state.editing = null;
    }

    render();
  }

  /* MANDATI UPRAVE */

  function mandate(c) {
    if (
      c.vrsta !== "UPRAVA" ||
      c.status !== "AKTIVAN" ||
      !c.datum_isteka_mandata
    ) return "";

    const d = diffDays(c.datum_isteka_mandata);

    if (d < 0) {
      return "Истекао мандат";
    }

    if (d <= 30) {
      return d === 0
        ? "Мандат истиче данас"
        : `Мандат истиче за ${d} дана`;
    }

    return "";
  }

  /* STATISTIKA */

  function statistics() {
    const all = state.items;

    const cards = [
      ["УКУПНО", all.length],

      [
        "АКТИВНИ",
        all.filter(
          x => x.status === "AKTIVAN"
        ).length
      ],

      [
        "УПРАВА",
        all.filter(
          x =>
            x.vrsta === "UPRAVA" &&
            x.status === "AKTIVAN"
        ).length
      ],

      [
        "МАНДАТИ ДО 30 ДАНА",
        all.filter(
          x =>
            x.vrsta === "UPRAVA" &&
            x.status === "AKTIVAN" &&
            x.datum_isteka_mandata &&
            diffDays(x.datum_isteka_mandata) >= 0 &&
            diffDays(x.datum_isteka_mandata) <= 30
        ).length
      ]
    ];

    return cards.map(
      ([key, val]) => `
        <div class="portal-member-stat">
          <span>${key}</span>
          <strong>${val}</strong>
        </div>
      `
    ).join("");
  }

  /* PRETRAGA I FILTERI */

  function filteredItems() {
    const q = state.search
      .trim()
      .toLocaleLowerCase("sr-RS");

    return state.items.filter(c => {
      if (
        state.type !== "ALL" &&
        c.vrsta !== state.type
      ) return false;

      if (
        state.status !== "ALL" &&
        c.status !== state.status
      ) return false;

      return [
        c.ime_prezime,
        c.clanski_broj,
        c.funkcija,
        c.telefon,
        c.email
      ].some(
        v => String(v || "")
          .toLocaleLowerCase("sr-RS")
          .includes(q)
      );

    }).sort(
      (a, b) =>
        a.ime_prezime.localeCompare(
          b.ime_prezime,
          "sr"
        )
    );
  }

  /* SPISAK CLANOVA */

  function listHTML() {
    const items = filteredItems();

    if (!items.length) {
      return `
        <p class="portal-member-muted">
          Нема чланова за изабране филтере.
        </p>
      `;
    }

    return items.map(c => `
      <button
        type="button"
        data-action="select"
        data-id="${h(c.id)}"
        class="portal-member-item
          ${c.id === state.selected ? "selected" : ""}"
      >

        <strong>${h(c.ime_prezime)}</strong>

        <span>
          ${h(TYPES[c.vrsta] || c.vrsta)}
          ${
            c.funkcija
              ? ` · ${h(c.funkcija)}`
              : ""
          }
        </span>

        <small class="${
          c.status === "AKTIVAN"
            ? "active"
            : "inactive"
        }">
          ${h(STATUSES[c.status] || c.status)}
        </small>

        ${
          mandate(c)
            ? `<small class="warn">
                ${h(mandate(c))}
              </small>`
            : ""
        }

      </button>
    `).join("");
  }

  /* FORMULAR */

  function editorHTML() {
    const c = state.editing === "new"
      ? null
      : state.items.find(
          x => x.id === state.editing
        );

    return `
      <div class="portal-member-panel">

        <h3>
          ${
            c
              ? "ИЗМЕНИ ЧЛАНА"
              : "НОВИ ЧЛАН КЛУБА"
          }
        </h3>

        <form
          id="portal-member-form"
          class="portal-member-form"
        >

          <label class="wide">
            ИМЕ И ПРЕЗИМЕ *

            <input
              name="ime_prezime"
              required
              minlength="2"
              maxlength="150"
              value="${h(c?.ime_prezime || "")}"
            >
          </label>

          <label>
            ЧЛАНСКИ БРОЈ

            <input
              name="clanski_broj"
              maxlength="50"
              value="${h(c?.clanski_broj || "")}"
              placeholder="Опционо"
            >
          </label>

          <label>
            КАТЕГОРИЈА *

            <select name="vrsta" required>
              ${options(
                TYPES,
                c?.vrsta || "CLAN"
              )}
            </select>
          </label>

          <label class="wide">
            ФУНКЦИЈА У КЛУБУ

            <input
              name="funkcija"
              maxlength="150"
              value="${h(c?.funkcija || "")}"
              placeholder="Нпр. председник клуба, секретар, тренер пионира"
            >
          </label>

          <label>
            СТАТУС *

            <select name="status" required>
              ${options(
                STATUSES,
                c?.status || "AKTIVAN"
              )}
            </select>
          </label>

          <label>
            ДАТУМ УЧЛАЊЕЊА

            <input
              type="date"
              name="datum_uclanjenja"
              value="${h(c?.datum_uclanjenja || "")}"
            >
          </label>

          <label>
            ИСТЕК МАНДАТА (АКО ПОСТОЈИ)

            <input
              type="date"
              name="datum_isteka_mandata"
              value="${h(c?.datum_isteka_mandata || "")}"
            >
          </label>

          <label>
            ТЕЛЕФОН

            <input
              type="tel"
              name="telefon"
              maxlength="60"
              value="${h(c?.telefon || "")}"
            >
          </label>

          <label class="wide">
            ИМЕЈЛ

            <input
              type="email"
              name="email"
              maxlength="250"
              value="${h(c?.email || "")}"
            >
          </label>

          <label class="wide">
            НАПОМЕНА

            <textarea
              name="napomena"
              rows="4"
              maxlength="4000"
            >${h(c?.napomena || "")}</textarea>
          </label>

          <div class="portal-member-actions wide">

            <button
              class="primary"
              type="submit"
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

      </div>
    `;
  }

  /* DETALJI CLANA */

  function detailsHTML(c) {
    const field = (key, val) => `
      <div>
        <span>${key}</span>
        <strong>${h(val || "—")}</strong>
      </div>
    `;

    return `
      <div class="portal-member-panel">

        <div class="portal-member-detail-head">

          <div>

            <span>
              ${h(TYPES[c.vrsta] || c.vrsta)}
            </span>

            <h3>
              ${h(c.ime_prezime)}
            </h3>

            <p>
              ${h(STATUSES[c.status] || c.status)}
              ${
                mandate(c)
                  ? ` · ${h(mandate(c))}`
                  : ""
              }
            </p>

          </div>

          <button
            type="button"
            data-action="edit"
            data-id="${h(c.id)}"
          >
            ИЗМЕНИ
          </button>

        </div>

        <div class="portal-member-details">

          ${field(
            "ЧЛАНСКИ БРОЈ",
            c.clanski_broj
          )}

          ${field(
            "ФУНКЦИЈА",
            c.funkcija
          )}

          ${field(
            "ТЕЛЕФОН",
            c.telefon
          )}

          ${field(
            "ИМЕЈЛ",
            c.email
          )}

          ${field(
            "ДАТУМ УЧЛАЊЕЊА",
            c.datum_uclanjenja
              ? fmt(c.datum_uclanjenja)
              : ""
          )}

          ${field(
            "ИСТЕК МАНДАТА",
            c.datum_isteka_mandata
              ? fmt(c.datum_isteka_mandata)
              : ""
          )}

        </div>

        ${
          c.napomena
            ? `
              <div class="portal-member-note">
                <strong>НАПОМЕНА</strong>
                <p>${h(c.napomena)}</p>
              </div>
            `
            : ""
        }

        <div class="portal-member-actions">

          <button
            type="button"
            class="danger"
            data-action="delete"
            data-id="${h(c.id)}"
          >
            ОБРИШИ ЧЛАНА
          </button>

        </div>

        <p class="portal-member-muted">
          Ако је особа престала да буде члан
          клуба, боље је променити статус на
          „Иступио“ него брисати историју.
          Трајно брисање користи за погрешно
          унете записе.
        </p>

      </div>
    `;
  }

  /* GLAVNI EKRAN */

  function render() {
    if (!state.open || !screen) return;

    const selected = state.items.find(
      x => x.id === state.selected
    );

    screen.innerHTML = `

      <div class="portal-member-header">

        <button
          type="button"
          data-action="back"
        >
          ← НАЗАД НА УПРАВУ
        </button>

        <span>
          ФК ОБИЛИЋ · ПРИВАТНА ЕВИДЕНЦИЈА
        </span>

        <h2>ЧЛАНОВИ КЛУБА</h2>

        <p>
          Управа, тренери, особље,
          волонтери и остали чланови.
        </p>

      </div>

      <p
        id="portal-members-message"
        class="portal-member-message"
        role="status"
      ></p>

      <div class="portal-member-stats">
        ${statistics()}
      </div>

      <div class="portal-member-layout">

        <div class="portal-member-panel">

          <div class="portal-member-panel-head">

            <h3>
              ЕВИДЕНЦИЈА ЧЛАНОВА
            </h3>

            <button
              type="button"
              class="primary"
              data-action="new"
            >
              + ДОДАЈ
            </button>

          </div>

          <div class="portal-member-filters">

            <label>
              КАТЕГОРИЈА

              <select id="portal-member-filter-type">
                ${options(
                  TYPES,
                  state.type,
                  "Све категорије"
                )}
              </select>
            </label>

            <label>
              СТАТУС

              <select id="portal-member-filter-status">
                ${options(
                  STATUSES,
                  state.status,
                  "Сви статуси"
                )}
              </select>
            </label>

            <label class="wide">
              ПРЕТРАГА

              <input
                id="portal-member-search"
                type="search"
                placeholder="Име, број, функција..."
                value="${h(state.search)}"
              >
            </label>

          </div>

          <div
            id="portal-member-list"
            class="portal-member-list"
          >
            ${listHTML()}
          </div>

        </div>

        ${
          state.editing !== null
            ? editorHTML()
            : selected
              ? detailsHTML(selected)
              : `
                <div class="portal-member-panel">

                  <h3>ДЕТАЉИ</h3>

                  <p class="portal-member-muted">
                    Изабери члана или додај новог.
                  </p>

                </div>
              `
        }

      </div>
    `;
  }

  /* OTVARANJE SEKCIJE */

  async function open() {
    if (state.open || state.busy) return;

    try {
      if (!await verifyAdmin()) {
        window.alert(
          "Само управа може да приступи евиденцији чланова клуба."
        );
        return;
      }

      state.open = true;

      grid.hidden = true;
      heading.hidden = true;
      screen.hidden = false;

      render();
      message("Учитавање...");

      await reload();

    } catch (error) {
      console.error("Clanovi kluba:", error);

      if (state.open) {
        message(
          "Учитавање није успело: " +
          (error.message || "грешка"),
          true
        );
      } else {
        window.alert(
          "Приступ није успео: " +
          (error.message || "грешка")
        );
      }
    }
  }

  function back() {
    state.open = false;
    state.editing = null;
    state.version++;

    if (screen) screen.hidden = true;
    if (grid) grid.hidden = false;
    if (heading) heading.hidden = false;
  }

  /* DODAVANJE I IZMENA */

  async function save(form) {
    const fd = new FormData(form);

    const val = key =>
      String(fd.get(key) || "").trim();

    const name = val("ime_prezime");
    const type = val("vrsta");
    const status = val("status");

    if (
      name.length < 2 ||
      name.length > 150 ||
      !TYPES[type] ||
      !STATUSES[status]
    ) {
      message(
        "Провери име, категорију и статус члана.",
        true
      );
      return;
    }

    const payload = {
      ime_prezime: name,

      clanski_broj:
        val("clanski_broj") || null,

      vrsta: type,

      funkcija:
        val("funkcija") || null,

      telefon:
        val("telefon") || null,

      email:
        val("email") || null,

      datum_uclanjenja:
        val("datum_uclanjenja") || null,

      datum_isteka_mandata:
        val("datum_isteka_mandata") || null,

      status,

      napomena:
        val("napomena") || null
    };

    const isNew =
      state.editing === "new";

    state.busy = true;

    const btn = form.querySelector(
      'button[type="submit"]'
    );

    if (btn) btn.disabled = true;

    try {
      const result = isNew
        ? await sb
            .from("portal_clanovi_kluba")
            .insert(payload)
            .select("id")
            .single()

        : await sb
            .from("portal_clanovi_kluba")
            .update(payload)
            .eq("id", state.editing)
            .select("id")
            .single();

      if (result.error) throw result.error;

      state.selected = result.data.id;
      state.editing = null;

      await reload();

      message(
        isNew
          ? "Члан је додат."
          : "Подаци су сачувани."
      );

    } catch (error) {
      console.error("Cuvanje clana:", error);

      message(
        "Чување није успело: " +
        (error.message || "грешка"),
        true
      );

    } finally {
      state.busy = false;

      if (btn?.isConnected) {
        btn.disabled = false;
      }
    }
  }

  /* BRISANJE */

  async function removeMember(c) {
    const answer = window.prompt(
      "ТРАЈНО БРИСАЊЕ ЧЛАНА\n\n" +
      c.ime_prezime +
      "\n\nЗа потврду упиши тачно име и презиме:"
    );

    if (answer !== c.ime_prezime) return;

    state.busy = true;

    try {
      const { data, error } = await sb.rpc(
        "portal_obrisi_clana_kluba",
        {
          p_clan_id: c.id,
          p_ime_prezime: c.ime_prezime
        }
      );

      if (error) throw error;

      if (data !== true) {
        throw new Error(
          "Члан није пронађен."
        );
      }

      state.selected = null;
      state.editing = null;

      await reload();

      message(
        "Запис је трајно обрисан."
      );

    } catch (error) {
      console.error("Brisanje clana:", error);

      message(
        "Брисање није успело: " +
        (error.message || "грешка"),
        true
      );

    } finally {
      state.busy = false;
    }
  }

  /* DUGMAD I FILTERI */

  function click(event) {
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

    if (action === "cancel") {
      state.editing = null;
      return render();
    }

    if (action === "select") {
      state.selected = btn.dataset.id;
      state.editing = null;
      return render();
    }

    const c = state.items.find(
      x => x.id === btn.dataset.id
    );

    if (!c) return;

    if (action === "edit") {
      state.editing = c.id;
      return render();
    }

    if (action === "delete") {
      return removeMember(c);
    }
  }

  function filters(event) {
    const el = event.target;

    if (
      el.id === "portal-member-filter-type"
    ) {
      state.type = el.value;

    } else if (
      el.id === "portal-member-filter-status"
    ) {
      state.status = el.value;

    } else if (
      el.id === "portal-member-search"
    ) {
      state.search = el.value;

    } else {
      return;
    }

    const list = screen.querySelector(
      "#portal-member-list"
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

    const card = [
      ...section.querySelectorAll(
        ".portal-management-card"
      )
    ].find(
      el =>
        el.querySelector("h3")
          ?.textContent.trim() ===
        "ЧЛАНОВИ КЛУБА"
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
      "Отвори евиденцију чланова клуба"
    );

    card.classList.add(
      "portal-member-launcher"
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

    screen.id = "portal-members-screen";
    screen.hidden = true;

    section.appendChild(screen);

    screen.addEventListener(
      "click",
      click
    );

    screen.addEventListener(
      "submit",
      event => {
        if (
          event.target.id !==
          "portal-member-form"
        ) return;

        event.preventDefault();

        if (!state.busy) {
          save(event.target);
        }
      }
    );

    screen.addEventListener(
      "change",
      filters
    );

    screen.addEventListener(
      "input",
      event => {
        if (
          event.target.id ===
          "portal-member-search"
        ) {
          filters(event);
        }
      }
    );

    sb.auth.onAuthStateChange(
      event => {
        if (event !== "SIGNED_OUT") {
          return;
        }

        back();

        state.items = [];
        state.selected = null;
        state.search = "";

        if (screen) {
          screen.innerHTML = "";
        }
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
