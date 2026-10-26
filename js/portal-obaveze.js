
/* =====================================================
   FK OBILIC - PORTAL UPRAVE / OBAVEZE
   Zaduzenja, rokovi, ugovori koji isticu
   Koristi postojece Supabase tabele i RLS.
===================================================== */
(() => {
  "use strict";

  const sb = window.fkObilicSupabase;
  if (!sb) {
    console.error("FK Obilic: Supabase nije dostupan.");
    return;
  }

  const CATEGORIES = {
    ADMINISTRACIJA: "Администрација",
    FINANSIJE: "Финансије",
    UTAKMICE: "Утакмице",
    OPREMA: "Опрема",
    SPONZORI: "Спонзори",
    DOKUMENTA: "Документа",
    OSTALO: "Остало"
  };

  const PRIORITIES = {
    NIZAK: "Низак",
    SREDNJI: "Средњи",
    VISOK: "Висок",
    HITNO: "Хитно"
  };

  const STATUSES = {
    NOVO: "Ново",
    U_TOKU: "У току",
    ZAVRSENO: "Завршено",
    OTKAZANO: "Отказано"
  };

  const state = {
    tasks: [],
    contracts: [],
    selectedId: null,
    editing: null,
    filter: "AKTIVNO",
    category: "ALL",
    priority: "ALL",
    search: "",
    open: false,
    busy: false,
    version: 0
  };

  let section, grid, heading, screen;

  const h = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  function today() {
    return new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Belgrade",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());
  }

  function addDays(day, amount) {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + Number(amount));
    return d.toISOString().slice(0, 10);
  }

  function daysUntil(day) {
    if (!day) return null;
    const from = Date.parse(`${today()}T00:00:00Z`);
    const to = Date.parse(`${day}T00:00:00Z`);
    return Math.round((to - from) / 86400000);
  }

  function showDate(day) {
    if (!day) return "Без рока";
    const p = String(day).slice(0, 10).split("-");
    return p.length === 3 ? `${p[2]}.${p[1]}.${p[0]}.` : day;
  }

  function options(items, selected, allLabel = null) {
    return (allLabel === null ? "" : `<option value="ALL" ${selected === "ALL" ? "selected" : ""}>${h(allLabel)}</option>`) +
      Object.entries(items).map(([key, label]) =>
        `<option value="${h(key)}" ${key === selected ? "selected" : ""}>${h(label)}</option>`
      ).join("");
  }

  function active(t) {
    return t.status !== "ZAVRSENO" && t.status !== "OTKAZANO";
  }

  function timing(t) {
    if (!active(t) || !t.datum_roka) return "none";
    const remaining = daysUntil(t.datum_roka);
    if (remaining < 0) return "late";
    if (remaining <= Number(t.podsetnik_dana_pre ?? 7)) return "soon";
    return "normal";
  }

  function timingLabel(t) {
    const type = timing(t);
    if (type === "late") return `КАСНИ ${Math.abs(daysUntil(t.datum_roka))} ДАНА`;
    if (type === "soon") {
      const days = daysUntil(t.datum_roka);
      return days === 0 ? "РОК ЈЕ ДАНАС" : `РОК ЗА ${days} ДАНА`;
    }
    return STATUSES[t.status] || "—";
  }

  function contractName(id) {
    return state.contracts.find(c => c.id === id)?.naziv || "—";
  }

  function notify(message, isError = false) {
    const el = screen?.querySelector("#portal-tasks-message");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("error", isError);
  }

  async function isManagement() {
    const { data, error } = await sb.auth.getUser();
    if (error || !data?.user) return false;

    const result = await sb.from("portal_korisnici")
      .select("uloga,aktivan")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (result.error) throw result.error;
    return result.data?.aktivan === true &&
      String(result.data.uloga || "").trim().toUpperCase() === "UPRAVA";
  }

  async function readAll(table, columns) {
    const result = [];
    for (let from = 0; ; from += 400) {
      const { data, error } = await sb.from(table)
        .select(columns)
        .order("created_at", { ascending: false })
        .range(from, from + 399);
      if (error) throw error;
      result.push(...(data || []));
      if (!data || data.length < 400) break;
    }
    return result;
  }

  async function reload() {
    const version = ++state.version;
    const [tasks, contracts] = await Promise.all([
      readAll("portal_obaveze",
        "id,naziv,opis,kategorija,prioritet,status,zaduzen_ime,datum_pocetka,datum_roka,podsetnik_dana_pre,ugovor_id,napomena,zavrseno_at,created_at"),
      readAll("portal_ugovori",
        "id,naziv,broj_ugovora,status,datum_isteka,created_at")
    ]);

    if (!state.open || version !== state.version) return;
    state.tasks = tasks;
    state.contracts = contracts;
    if (state.selectedId && !tasks.some(t => t.id === state.selectedId)) {
      state.selectedId = null;
      state.editing = null;
    }
    render();
  }

  function statsHTML() {
    const count = condition => state.tasks.filter(condition).length;
    const cards = [
      ["АКТИВНЕ", count(active)],
      ["УСКОРО", count(t => timing(t) === "soon")],
      ["КАСНЕ", count(t => timing(t) === "late")],
      ["ЗАВРШЕНЕ", count(t => t.status === "ZAVRSENO")]
    ];
    return cards.map(([label, num]) => `
      <div class="portal-task-stat"><span>${label}</span><strong>${num}</strong></div>
    `).join("");
  }

  function warningsHTML() {
    const expiring = state.contracts
      .filter(c => c.status === "AKTIVAN" && c.datum_isteka &&
        daysUntil(c.datum_isteka) <= 30)
      .sort((a, b) => a.datum_isteka.localeCompare(b.datum_isteka));

    if (!expiring.length) {
      return `<div class="portal-task-contract-alerts">
        <h3>РОКОВИ УГОВОРА</h3>
        <p class="portal-task-muted">Нема активних уговора који истичу у наредних 30 дана или су већ прекорачили рок.</p>
      </div>`;
    }

    return `<div class="portal-task-contract-alerts">
      <h3>РОКОВИ УГОВОРА</h3>
      <p class="portal-task-muted">Аутоматска упозорења из евиденције уговора. Нису нови задаци.</p>
      <div class="portal-task-contract-list">
        ${expiring.map(c => {
          const n = daysUntil(c.datum_isteka);
          const label = n < 0 ? `Истекао пре ${Math.abs(n)} дана` :
            n === 0 ? "Истиче данас" : `Истиче за ${n} дана`;
          return `<div class="portal-task-contract-row">
            <div><strong>${h(c.naziv)}</strong>
              <small>${h(showDate(c.datum_isteka))}${c.broj_ugovora ? ` · Бр. ${h(c.broj_ugovora)}` : ""}</small>
            </div>
            <span class="${n < 0 ? "late" : "soon"}">${h(label)}</span>
          </div>`;
        }).join("")}
      </div>
    </div>`;
  }

  function visibleTasks() {
    const q = state.search.trim().toLocaleLowerCase("sr-RS");
    return state.tasks.filter(t => {
      if (state.filter === "AKTIVNO" && !active(t)) return false;
      if (state.filter === "KASNI" && timing(t) !== "late") return false;
      if (state.filter === "USKORO" && timing(t) !== "soon") return false;
      if (STATUSES[state.filter] && t.status !== state.filter) return false;
      if (state.category !== "ALL" && t.kategorija !== state.category) return false;
      if (state.priority !== "ALL" && t.prioritet !== state.priority) return false;
      return [t.naziv, t.opis, t.zaduzen_ime, t.napomena,
        contractName(t.ugovor_id)].some(v =>
        String(v || "").toLocaleLowerCase("sr-RS").includes(q));
    }).sort((a, b) => {
      const rank = t => timing(t) === "late" ? 0 :
        timing(t) === "soon" ? 1 : active(t) ? 2 : 3;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const ad = a.datum_roka || "9999-12-31";
      const bd = b.datum_roka || "9999-12-31";
      if (ad !== bd) return ad.localeCompare(bd);
      return b.created_at.localeCompare(a.created_at);
    });
  }

  function listHTML() {
    const tasks = visibleTasks();
    if (!tasks.length) return `<p class="portal-task-muted">Нема обавеза за изабране филтере.</p>`;

    return tasks.map(t => `
      <button type="button" data-action="select" data-id="${h(t.id)}"
        class="portal-task-list-item ${state.selectedId === t.id ? "selected" : ""}">
        <div class="portal-task-line">
          <strong>${h(t.naziv)}</strong>
          <span class="portal-task-priority priority-${h(t.prioritet.toLowerCase())}">${h(PRIORITIES[t.prioritet])}</span>
        </div>
        <span class="portal-task-list-meta">${h(CATEGORIES[t.kategorija] || t.kategorija)} · ${h(t.zaduzen_ime || "Није додељено")}</span>
        <span class="portal-task-deadline ${timing(t)}">${h(timingLabel(t))} · ${h(showDate(t.datum_roka))}</span>
      </button>
    `).join("");
  }

  function formHTML() {
    const t = state.editing === "new" ? null :
      state.tasks.find(x => x.id === state.editing);

    return `<div class="portal-task-panel">
      <h3>${t ? "ИЗМЕНИ ОБАВЕЗУ" : "НОВА ОБАВЕЗА"}</h3>
      <form id="portal-task-form" class="portal-task-form">
        <label class="wide">НАЗИВ ОБАВЕЗЕ *
          <input name="naziv" required minlength="2" maxlength="200" value="${h(t?.naziv || "")}" placeholder="Нпр. Припремити записник седнице">
        </label>
        <label>КАТЕГОРИЈА *
          <select name="kategorija" required>${options(CATEGORIES, t?.kategorija || "ADMINISTRACIJA")}</select>
        </label>
        <label>ПРИОРИТЕТ *
          <select name="prioritet" required>${options(PRIORITIES, t?.prioritet || "SREDNJI")}</select>
        </label>
        <label>СТАТУС *
          <select name="status" required>${options(STATUSES, t?.status || "NOVO")}</select>
        </label>
        <label>ЗАДУЖЕНА ОСОБА
          <input name="zaduzen_ime" maxlength="150" value="${h(t?.zaduzen_ime || "")}" placeholder="Име и презиме">
        </label>
        <label>ДАТУМ ПОЧЕТКА
          <input type="date" name="datum_pocetka" value="${h(t?.datum_pocetka || "")}">
        </label>
        <label>РОК ЗА ИЗВРШЕЊЕ
          <input type="date" name="datum_roka" value="${h(t?.datum_roka || "")}">
        </label>
        <label>УПОЗОРЕЊЕ ПРЕ РОКА (ДАНА)
          <input type="number" name="podsetnik_dana_pre" min="0" max="60" step="1"
            value="${h(t?.podsetnik_dana_pre ?? 7)}" required>
        </label>
        <label class="wide">ПОВЕЗАНИ УГОВОР (ОПЦИОНО)
          <select name="ugovor_id">
            <option value="">Није повезано са уговором</option>
            ${state.contracts.map(c => `<option value="${h(c.id)}" ${t?.ugovor_id === c.id ? "selected" : ""}>${h(c.naziv)}</option>`).join("")}
          </select>
        </label>
        <label class="wide">ОПИС
          <textarea name="opis" rows="3">${h(t?.opis || "")}</textarea>
        </label>
        <label class="wide">НАПОМЕНА
          <textarea name="napomena" rows="3">${h(t?.napomena || "")}</textarea>
        </label>
        <div class="portal-task-actions wide">
          <button class="primary" type="submit">САЧУВАЈ</button>
          <button type="button" data-action="cancel">ОДУСТАНИ</button>
        </div>
      </form>
      <p class="portal-task-muted">Упозорење се приказује у порталу. Не шаље се мејл нити телефонско обавештење.</p>
    </div>`;
  }

  function detailsHTML(t) {
    const field = (label, value) => `<div><span>${label}</span><strong>${h(value)}</strong></div>`;

    return `<div class="portal-task-panel">
      <div class="portal-task-detail-heading">
        <div><span class="portal-task-deadline ${timing(t)}">${h(timingLabel(t))}</span>
          <h3>${h(t.naziv)}</h3>
          <p>${h(CATEGORIES[t.kategorija] || t.kategorija)}</p>
        </div>
      </div>
      <div class="portal-task-details">
        ${field("СТАТУС", STATUSES[t.status] || t.status)}
        ${field("ПРИОРИТЕТ", PRIORITIES[t.prioritet] || t.prioritet)}
        ${field("ЗАДУЖЕН", t.zaduzen_ime || "Није додељено")}
        ${field("ПОЧЕТАК", showDate(t.datum_pocetka))}
        ${field("РОК", showDate(t.datum_roka))}
        ${field("ПОДСЕТНИК", `${t.podsetnik_dana_pre} дана пре рока`)}
        ${field("УГОВОР", t.ugovor_id ? contractName(t.ugovor_id) : "—")}
        ${t.zavrseno_at ? field("ЗАВРШЕНО", new Date(t.zavrseno_at).toLocaleString("sr-RS", { timeZone: "Europe/Belgrade" })) : ""}
      </div>
      ${t.opis ? `<div class="portal-task-note"><strong>ОПИС</strong><p>${h(t.opis)}</p></div>` : ""}
      ${t.napomena ? `<div class="portal-task-note"><strong>НАПОМЕНА</strong><p>${h(t.napomena)}</p></div>` : ""}
      <div class="portal-task-actions">
        <button type="button" data-action="edit" data-id="${h(t.id)}">ИЗМЕНИ</button>
        ${active(t) ? `<button type="button" class="primary" data-action="complete" data-id="${h(t.id)}">ОЗНАЧИ КАО ЗАВРШЕНО</button>` : ""}
        ${t.status === "ZAVRSENO" ? `<button type="button" data-action="reopen" data-id="${h(t.id)}">ПОНОВО ОТВОРИ</button>` : ""}
        <button type="button" class="danger" data-action="delete" data-id="${h(t.id)}">ОБРИШИ ОБАВЕЗУ</button>
      </div>
    </div>`;
  }

  function render() {
    if (!state.open || !screen) return;
    const chosen = state.tasks.find(t => t.id === state.selectedId);

    screen.innerHTML = `
      <div class="portal-task-header">
        <button type="button" data-action="back">← НАЗАД НА УПРАВУ</button>
        <span>ФК ОБИЛИЋ · ПРИВАТНИ ПОРТАЛ</span>
        <h2>ОБАВЕЗЕ УПРАВЕ</h2>
        <p>Задужења, рокови, приоритети и уговори који истичу.</p>
      </div>
      <p id="portal-tasks-message" class="portal-task-message" role="status"></p>
      <div class="portal-task-stats">${statsHTML()}</div>
      ${warningsHTML()}
      <div class="portal-task-layout">
        <div class="portal-task-panel">
          <div class="portal-task-panel-head">
            <h3>СПИСАК ОБАВЕЗА</h3>
            <button class="primary" type="button" data-action="new">+ ДОДАЈ</button>
          </div>
          <div class="portal-task-filters">
            <label>ПРИКАЗ
              <select id="portal-task-filter">
                ${options({ AKTIVNO: "Активне", KASNI: "Касне", USKORO: "Ускоро", ...STATUSES }, state.filter, "Све обавезе")}
              </select>
            </label>
            <label>КАТЕГОРИЈА
              <select id="portal-task-category">${options(CATEGORIES, state.category, "Све категорије")}</select>
            </label>
            <label>ПРИОРИТЕТ
              <select id="portal-task-priority">${options(PRIORITIES, state.priority, "Сви приоритети")}</select>
            </label>
            <label>ПРЕТРАГА
              <input id="portal-task-search" type="search" placeholder="Назив, особа, уговор..." value="${h(state.search)}">
            </label>
          </div>
          <div class="portal-task-list" id="portal-task-list">${listHTML()}</div>
        </div>
        ${state.editing !== null ? formHTML() :
          chosen ? detailsHTML(chosen) :
            `<div class="portal-task-panel"><h3>ДЕТАЉИ</h3><p class="portal-task-muted">Изабери обавезу или додај нову.</p></div>`}
      </div>
    `;
  }

  async function open() {
    if (state.open || state.busy) return;
    try {
      if (!await isManagement()) {
        window.alert("Само управа може да приступи обавезама.");
        return;
      }
      state.open = true;
      grid.hidden = true;
      heading.hidden = true;
      screen.hidden = false;
      render();
      notify("Учитавање...");
      await reload();
    } catch (error) {
      console.error("Obaveze:", error);
      if (state.open) notify("Грешка при учитавању: " + (error.message || "непозната грешка"), true);
      else window.alert("Приступ није успео: " + (error.message || "грешка"));
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

  async function save(form) {
    const fd = new FormData(form);
    const str = key => String(fd.get(key) || "").trim();
    const start = str("datum_pocetka");
    const due = str("datum_roka");
    const reminder = Number(str("podsetnik_dana_pre"));
    const contractId = str("ugovor_id") || null;
    const title = str("naziv");

    if (title.length < 2 || title.length > 200 ||
      !CATEGORIES[str("kategorija")] ||
      !PRIORITIES[str("prioritet")] ||
      !STATUSES[str("status")] ||
      !Number.isInteger(reminder) || reminder < 0 || reminder > 60 ||
      (start && due && start > due) ||
      (contractId && !state.contracts.some(c => c.id === contractId))) {
      notify("Провери назив, категорију, приоритет, датуме и подсећање (0–60 дана).", true);
      return;
    }

    const payload = {
      naziv: title,
      opis: str("opis") || null,
      kategorija: str("kategorija"),
      prioritet: str("prioritet"),
      status: str("status"),
      zaduzen_ime: str("zaduzen_ime") || null,
      datum_pocetka: start || null,
      datum_roka: due || null,
      podsetnik_dana_pre: reminder,
      ugovor_id: contractId,
      napomena: str("napomena") || null
    };

    state.busy = true;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    try {
      const result = state.editing === "new"
        ? await sb.from("portal_obaveze").insert(payload).select("id").single()
        : await sb.from("portal_obaveze").update(payload)
            .eq("id", state.editing).select("id").single();
      if (result.error) throw result.error;
      state.selectedId = result.data.id;
      state.editing = null;
      await reload();
      notify("Обавеза је сачувана.");
    } catch (error) {
      console.error("Cuvanje obaveze:", error);
      notify("Чување није успело: " + (error.message || "грешка"), true);
    } finally {
      state.busy = false;
      if (btn?.isConnected) btn.disabled = false;
    }
  }

  async function changeStatus(task, newStatus) {
    state.busy = true;
    try {
      const { data, error } = await sb.from("portal_obaveze")
        .update({ status: newStatus })
        .eq("id", task.id)
        .select("id")
        .single();
      if (error) throw error;
      if (!data) throw new Error("Задатак није пронађен.");
      await reload();
      notify(newStatus === "ZAVRSENO" ? "Обавеза је завршена." : "Обавеза је поново отворена.");
    } catch (error) {
      console.error("Status obaveze:", error);
      notify("Промена статуса није успела: " + (error.message || "грешка"), true);
    } finally {
      state.busy = false;
    }
  }

  async function deleteTask(task) {
    const answer = window.prompt(
      "ТРАЈНО БРИСАЊЕ ОБАВЕЗЕ\n\n" + task.naziv +
      "\n\nЗа потврду упиши тачан назив обавезе:"
    );
    if (answer !== task.naziv) return;
    state.busy = true;
    try {
      const { data, error } = await sb.from("portal_obaveze")
        .delete().eq("id", task.id).select("id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Обавеза није пронађена или немаш дозволу.");
      state.selectedId = null;
      state.editing = null;
      await reload();
      notify("Обавеза је трајно обрисана.");
    } catch (error) {
      console.error("Brisanje obaveze:", error);
      notify("Брисање није успело: " + (error.message || "грешка"), true);
    } finally {
      state.busy = false;
    }
  }

  async function handleClick(event) {
    const btn = event.target.closest("button[data-action]");
    if (!btn || state.busy) return;
    const action = btn.dataset.action;

    if (action === "back") return back();
    if (action === "new") {
      state.editing = "new";
      return render();
    }
    if (action === "cancel") {
      state.editing = null;
      return render();
    }
    if (action === "select") {
      state.selectedId = btn.dataset.id;
      state.editing = null;
      return render();
    }

    const task = state.tasks.find(t => t.id === btn.dataset.id);
    if (!task) return;
    if (action === "edit") {
      state.editing = task.id;
      return render();
    }
    if (action === "complete" && active(task)) return changeStatus(task, "ZAVRSENO");
    if (action === "reopen" && task.status === "ZAVRSENO") return changeStatus(task, "U_TOKU");
    if (action === "delete") return deleteTask(task);
  }

  function refreshList() {
    const list = screen?.querySelector("#portal-task-list");
    if (list) list.innerHTML = listHTML();
  }

  function handleFilter(event) {
    const el = event.target;
    if (el.id === "portal-task-filter") state.filter = el.value;
    else if (el.id === "portal-task-category") state.category = el.value;
    else if (el.id === "portal-task-priority") state.priority = el.value;
    else if (el.id === "portal-task-search") state.search = el.value;
    else return;
    refreshList();
  }

  function mount() {
    section = document.querySelector("#portal-management-section");
    if (!section || screen) return Boolean(screen);
    grid = section.querySelector(".portal-management-grid");
    heading = section.querySelector(".portal-section-heading");
    const card = [...section.querySelectorAll(".portal-management-card")]
      .find(el => el.querySelector("h3")?.textContent.trim() === "ОБАВЕЗЕ");
    if (!grid || !heading || !card) return false;

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "Отвори обавезе управе");
    card.classList.add("portal-task-launcher");
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });

    screen = document.createElement("div");
    screen.id = "portal-tasks-screen";
    screen.hidden = true;
    section.appendChild(screen);

    screen.addEventListener("click", handleClick);
    screen.addEventListener("submit", event => {
      if (event.target.id !== "portal-task-form") return;
      event.preventDefault();
      if (!state.busy) save(event.target);
    });
    screen.addEventListener("change", handleFilter);
    screen.addEventListener("input", event => {
      if (event.target.id === "portal-task-search") handleFilter(event);
    });

    sb.auth.onAuthStateChange(event => {
      if (event !== "SIGNED_OUT") return;
      back();
      state.tasks = [];
      state.contracts = [];
      state.selectedId = null;
      state.search = "";
      if (screen) screen.innerHTML = "";
    });
    return true;
  }

  function init() {
    if (mount()) return;
    const observer = new MutationObserver(() => {
      if (mount()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
