
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   MODERAN GRUPNI CET

   - Plutajuce dugme
   - Jedan cet za sve aktivne clanove
   - Poruke u realnom vremenu
   - Broj neprocitanih poruka
   - Prilagodjen Android PWA aplikaciji
===================================================== */

(() => {
    "use strict";

    if (window.__fkObilicChatLoaded) return;
    window.__fkObilicChatLoaded = true;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "FK Obilic CHAT: Supabase nije dostupan."
        );
        return;
    }

    const TABLE = "portal_chat_poruke";
    const SEND_RPC = "portal_chat_posalji";

    let userId = null;
    let messages = [];
    let channel = null;
    let polling = null;
    let loading = false;
    let sending = false;
    let authVersion = 0;

    let launcher;
    let panel;
    let list;
    let badge;
    let input;
    let form;
    let sendButton;

    /* =============================================
       POMOCNE FUNKCIJE
    ============================================= */

    function initials(name) {
        const words = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!words.length) return "О";

        return (
            words[0][0] +
            (words.length > 1
                ? words[words.length - 1][0]
                : "")
        ).toLocaleUpperCase("sr");
    }

    function getTime(value) {
        return new Date(value).toLocaleTimeString(
            "sr-RS",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );
    }

    function dateKey(value) {
        const d = new Date(value);

        return [
            d.getFullYear(),
            d.getMonth(),
            d.getDate()
        ].join("-");
    }

    function dateLabel(value) {
        const d = new Date(value);
        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(today.getDate() - 1);

        if (dateKey(d) === dateKey(today)) {
            return "ДАНАС";
        }

        if (dateKey(d) === dateKey(yesterday)) {
            return "ЈУЧЕ";
        }

        return d.toLocaleDateString(
            "sr-Cyrl-RS",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );
    }

    function storageKey() {
        return "fk-obilic-chat-read-" + userId;
    }

    function getLastRead() {
        if (!userId) return null;

        try {
            return localStorage.getItem(
                storageKey()
            );
        } catch {
            return null;
        }
    }

    function setLastRead(value) {
        if (!userId) return;

        try {
            localStorage.setItem(
                storageKey(),
                value
            );
        } catch {
            // Chat radi i kada localStorage nije dostupan.
        }
    }

    function isOpen() {
        return panel && !panel.hidden;
    }

    /* =============================================
       KREIRAJ CHAT
    ============================================= */

    function createChat() {

        const app = document.getElementById(
            "portal-app"
        );

        if (!app) return false;

        const wrapper = document.createElement("div");

        wrapper.id = "fk-chat-root";

        wrapper.innerHTML = `

            <button
                type="button"
                id="fk-chat-launcher"
                aria-label="Отвори групни чет"
                aria-expanded="false"
                aria-controls="fk-chat-panel"
                hidden
            >

                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="
                        M20 11.5
                        a8 8 0 0 1-8 8
                        a8.6 8.6 0 0 1-3.5-.7
                        L4 20l1.3-4.4
                        A8 8 0 1 1 20 11.5Z
                    " />
                    <path d="M8 11.5h8"/>
                    <path d="M8 14.5h5"/>
                </svg>

                <span
                    id="fk-chat-badge"
                    class="fk-chat-badge"
                    hidden
                >0</span>

            </button>

            <aside
                id="fk-chat-panel"
                role="dialog"
                aria-label="Групни чет ФК Обилић"
                hidden
            >

                <div class="fk-chat-header">

                    <div class="fk-chat-header-logo">
                        <img
                            src="images/grb.png"
                            alt=""
                        >
                    </div>

                    <div class="fk-chat-header-info">

                        <strong class="fk-chat-header-title">
                            Групни чет
                        </strong>

                        <span class="fk-chat-header-subtitle">
                            ФК Обилић · Сви чланови портала
                        </span>

                    </div>

                    <button
                        type="button"
                        id="fk-chat-close"
                        class="fk-chat-close"
                        aria-label="Затвори чет"
                    >×</button>

                </div>

                <div
                    id="fk-chat-messages"
                    class="fk-chat-messages"
                    role="log"
                    aria-label="Поруке"
                    aria-live="polite"
                >
                    <div class="fk-chat-loading">
                        Учитавање порука...
                    </div>
                </div>

                <div class="fk-chat-footer">

                    <form
                        id="fk-chat-form"
                        class="fk-chat-form"
                    >

                        <textarea
                            id="fk-chat-input"
                            class="fk-chat-input"
                            rows="1"
                            maxlength="1000"
                            placeholder="Напиши поруку..."
                            aria-label="Нова порука"
                            required
                        ></textarea>

                        <button
                            type="submit"
                            id="fk-chat-send"
                            class="fk-chat-send"
                            aria-label="Пошаљи поруку"
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M12 19V5"/>
                                <path d="m5 12 7-7 7 7"/>
                            </svg>
                        </button>

                    </form>

                    <div class="fk-chat-footer-note">
                        Заједнички чет свих чланова клуба
                    </div>

                </div>

            </aside>
        `;

        app.appendChild(wrapper);

        launcher = document.getElementById(
            "fk-chat-launcher"
        );

        panel = document.getElementById(
            "fk-chat-panel"
        );

        list = document.getElementById(
            "fk-chat-messages"
        );

        badge = document.getElementById(
            "fk-chat-badge"
        );

        input = document.getElementById(
            "fk-chat-input"
        );

        form = document.getElementById(
            "fk-chat-form"
        );

        sendButton = document.getElementById(
            "fk-chat-send"
        );

        launcher.addEventListener(
            "click",
            () => {

                if (isOpen()) {
                    closeChat();
                } else {
                    openChat();
                }
            }
        );

        document.getElementById(
            "fk-chat-close"
        ).addEventListener(
            "click",
            closeChat
        );

        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    isOpen()
                ) {
                    closeChat();
                }
            }
        );

        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.isComposing
                ) {

                    event.preventDefault();
                    form.requestSubmit();
                }
            }
        );

        form.addEventListener(
            "submit",
            sendMessage
        );

        return true;
    }

    /* =============================================
       OTVARANJE / ZATVARANJE
    ============================================= */

    function openChat() {

        if (!userId) return;

        panel.hidden = false;

        launcher.setAttribute(
            "aria-expanded",
            "true"
        );

        markAsRead();

        loadMessages();

        requestAnimationFrame(() => {
            list.scrollTop = list.scrollHeight;
            input.focus();
        });
    }

    function closeChat() {

        panel.hidden = true;

        launcher.setAttribute(
            "aria-expanded",
            "false"
        );

        launcher.focus();
    }

    /* =============================================
       BROJ NEPROCITANIH
    ============================================= */

    function updateUnread() {

        if (!userId) {
            badge.hidden = true;
            return;
        }

        const lastRead = getLastRead();

        const unread = messages.filter(
            message => {

                if (message.user_id === userId) {
                    return false;
                }

                return (
                    !lastRead ||
                    new Date(message.created_at).getTime() >
                        new Date(lastRead).getTime()
                );
            }
        ).length;

        badge.hidden = unread === 0;

        badge.textContent =
            unread > 99
                ? "99+"
                : String(unread);
    }

    function markAsRead() {

        setLastRead(
            new Date().toISOString()
        );

        updateUnread();
    }

    /* =============================================
       PRIKAZ PORUKA
    ============================================= */

    function renderMessages() {

        const distanceFromBottom =
            list.scrollHeight -
            list.scrollTop -
            list.clientHeight;

        const wasNearBottom =
            distanceFromBottom < 120;

        list.replaceChildren();

        if (!messages.length) {

            const empty = document.createElement(
                "div"
            );

            empty.className = "fk-chat-empty";

            empty.textContent =
                "Још нема порука. " +
                "Напишите прву поруку у групном чету!";

            list.appendChild(empty);
            return;
        }

        const fragment =
            document.createDocumentFragment();

        let previousDay = "";

        for (const message of messages) {

            const currentDay =
                dateKey(message.created_at);

            if (currentDay !== previousDay) {

                const separator =
                    document.createElement("div");

                separator.className =
                    "fk-chat-day";

                separator.textContent =
                    dateLabel(message.created_at);

                fragment.appendChild(separator);

                previousDay = currentDay;
            }

            const own =
                message.user_id === userId;

            const row =
                document.createElement("div");

            row.className =
                "fk-chat-row " +
                (own ? "own" : "other");

            const avatar =
                document.createElement("div");

            avatar.className =
                "fk-chat-avatar";

            avatar.textContent =
                initials(message.ime_prezime);

            const content =
                document.createElement("div");

            content.className =
                "fk-chat-content";

            const meta =
                document.createElement("div");

            meta.className =
                "fk-chat-meta";

            const name =
                document.createElement("span");

            name.textContent =
                own
                    ? "Ви"
                    : (
                        message.ime_prezime ||
                        "Члан клуба"
                    );

            const time =
                document.createElement("span");

            time.textContent =
                getTime(message.created_at);

            meta.append(name, time);

            const bubble =
                document.createElement("div");

            bubble.className =
                "fk-chat-bubble";

            // Bezbedan tekst, bez izvrsavanja HTML-a.
            bubble.textContent =
                message.sadrzaj || "";

            content.append(meta, bubble);

            if (!own) {
                row.appendChild(avatar);
            }

            row.appendChild(content);

            fragment.appendChild(row);
        }

        list.appendChild(fragment);

        if (isOpen() && wasNearBottom) {

            requestAnimationFrame(() => {
                list.scrollTop = list.scrollHeight;
            });
        }
    }

    /* =============================================
       UCITAVANJE IZ SUPABASE
    ============================================= */

    async function loadMessages() {

        if (!userId || loading) {
            return;
        }

        loading = true;

        const expectedUser = userId;

        try {

            const { data, error } = await sb
                .from(TABLE)
                .select(
                    "id,user_id,ime_prezime,sadrzaj,created_at"
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                )
                .limit(80);

            if (error) throw error;

            if (userId !== expectedUser) {
                return;
            }

            messages = (data || []).reverse();

            renderMessages();

            if (isOpen()) {
                markAsRead();
            } else {
                updateUnread();
            }

        } catch (error) {

            console.error(
                "FK Obilic CHAT load:",
                error
            );

            if (isOpen()) {

                list.innerHTML = "";

                const notice =
                    document.createElement("div");

                notice.className =
                    "fk-chat-error";

                notice.textContent =
                    "Поруке тренутно нису доступне. " +
                    "Проверите интернет и подешавања чета.";

                list.appendChild(notice);
            }

        } finally {
            loading = false;
        }
    }

    /* =============================================
       SLANJE PORUKE
    ============================================= */

    async function sendMessage(event) {

        event.preventDefault();

        if (!userId || sending) return;

        const text = input.value.trim();

        if (
            !text ||
            text.length > 1000
        ) {
            return;
        }

        sending = true;
        sendButton.disabled = true;

        try {

            const { error } = await sb.rpc(
                SEND_RPC,
                {
                    p_sadrzaj: text
                }
            );

            if (error) throw error;

            input.value = "";

            await loadMessages();

            requestAnimationFrame(() => {
                list.scrollTop = list.scrollHeight;
                input.focus();
            });

        } catch (error) {

            console.error(
                "FK Obilic CHAT send:",
                error
            );

            window.alert(
                error.message ||
                "Порука није послата."
            );

        } finally {

            sending = false;
            sendButton.disabled = false;
        }
    }

    /* =============================================
       REALTIME
    ============================================= */

    function startListening() {

        stopListening();

        channel = sb
            .channel(
                "fk-obilic-chat-" + userId
            )
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: TABLE
                },
                () => {
                    loadMessages();
                }
            )
            .subscribe();

        // Rezervna provera ako Realtime prekine vezu.
        polling = window.setInterval(
            () => {

                if (!document.hidden && userId) {
                    loadMessages();
                }

            },
            15000
        );
    }

    function stopListening() {

        if (polling) {
            clearInterval(polling);
            polling = null;
        }

        if (channel) {
            sb.removeChannel(channel);
            channel = null;
        }
    }

    /* =============================================
       PRAVA PRISTUPA I NALOG
    ============================================= */

    async function setCurrentUser(user) {

        const nextId = user?.id || null;

        if (nextId === userId && nextId) {
            return;
        }

        const version = ++authVersion;

        stopListening();

        userId = null;
        messages = [];

        launcher.hidden = true;
        panel.hidden = true;
        badge.hidden = true;

        if (!nextId) return;

        const { data: profile, error } = await sb
            .from("portal_korisnici")
            .select("aktivan,uloga")
            .eq("user_id", nextId)
            .maybeSingle();

        if (version !== authVersion) {
            return;
        }

        if (
            error ||
            !profile ||
            profile.aktivan !== true ||
            !["UPRAVA", "TRENER", "IGRAČ"]
                .includes(profile.uloga)
        ) {
            return;
        }

        userId = nextId;

        if (!getLastRead()) {
            setLastRead(
                new Date().toISOString()
            );
        }

        launcher.hidden = false;

        await loadMessages();

        startListening();
    }

    /* =============================================
       POKRETANJE
    ============================================= */

    async function initialize() {

        if (!createChat()) return;

        const {
            data: { session }
        } = await sb.auth.getSession();

        await setCurrentUser(
            session?.user || null
        );

        sb.auth.onAuthStateChange(
            (event, session) => {

                if (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION" ||
                    event === "SIGNED_OUT"
                ) {

                    setTimeout(
                        () => {
                            setCurrentUser(
                                session?.user || null
                            );
                        },
                        0
                    );
                }
            }
        );

        document.addEventListener(
            "visibilitychange",
            () => {

                if (!document.hidden && userId) {
                    loadMessages();
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
