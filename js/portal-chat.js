
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   GRUPNI CET - ISPRAVLJENA VERZIJA

   - Grupni cet za aktivne clanove
   - Realtime poruke
   - Neprocitane poruke
   - Android PWA i push otvaranje
   - Utisavanje obavestenja u zaglavlju
===================================================== */

(() => {
    "use strict";

    if (window.__fkObilicChatLoaded) return;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "FK Obilic CHAT: Supabase nije dostupan."
        );
        return;
    }

    const TABLE = "portal_chat_poruke";
    const SETTINGS = "portal_chat_podesavanja";
    const SEND_RPC = "portal_chat_posalji";

    const ALLOWED_ROLES = [
        "UPRAVA",
        "TRENER",
        "IGRAČ",
        "IGRAC",
        "УПРАВА",
        "ТРЕНЕР",
        "ИГРАЧ"
    ];

    let userId = null;
    let messages = [];
    let channel = null;
    let polling = null;
    let loading = false;
    let sending = false;
    let muteSaving = false;
    let chatMuted = false;
    let authVersion = 0;

    let pendingOpenFromPush =
        new URLSearchParams(
            window.location.search
        ).get("chat") === "1";

    let launcher;
    let panel;
    let list;
    let badge;
    let input;
    let form;
    let sendButton;
    let muteButton;

    /* =============================================
       POMOCNE FUNKCIJE
    ============================================= */

    function byId(id) {
        return document.getElementById(id);
    }

    function isOpen() {
        return Boolean(panel && !panel.hidden);
    }

    function initials(name) {
        const words = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!words.length) return "О";

        return (
            words[0][0] +
            (
                words.length > 1
                    ? words[words.length - 1][0]
                    : ""
            )
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
        const today = new Date();
        const yesterday = new Date(today);

        yesterday.setDate(
            today.getDate() - 1
        );

        if (dateKey(value) === dateKey(today)) {
            return "ДАНАС";
        }

        if (dateKey(value) === dateKey(yesterday)) {
            return "ЈУЧЕ";
        }

        return new Date(value).toLocaleDateString(
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
            // Cet radi i bez localStorage.
        }
    }

    /* =============================================
       STIL ZA DUGME ZA UTISAVANJE
    ============================================= */

    function addMuteStyles() {
        if (byId("fk-chat-mute-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fk-chat-mute-styles";

        style.textContent = `
            #fk-chat-panel .fk-chat-header {
                display: flex;
                align-items: center;
            }

            #fk-chat-panel .fk-chat-header-info {
                flex: 1;
                min-width: 0;
            }

            #fk-chat-panel .fk-chat-header-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-left: auto;
                flex-shrink: 0;
            }

            #fk-chat-panel #fk-chat-mute {
                position: static;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                padding: 7px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,.3);
                color: inherit;
                background: rgba(255,255,255,.12);
                cursor: pointer;
                flex-shrink: 0;
            }

            #fk-chat-panel #fk-chat-mute svg {
                width: 21px;
                height: 21px;
                fill: none;
                stroke: currentColor;
                stroke-width: 1.9;
                stroke-linecap: round;
                stroke-linejoin: round;
            }

            #fk-chat-panel #fk-chat-mute
            .fk-chat-mute-slash {
                display: none;
            }

            #fk-chat-panel #fk-chat-mute.is-muted
            .fk-chat-mute-slash {
                display: block;
            }

            #fk-chat-panel #fk-chat-mute.is-muted {
                background: rgba(255,255,255,.27);
            }

            #fk-chat-panel #fk-chat-mute:disabled {
                opacity: .5;
                cursor: wait;
            }

            #fk-chat-panel #fk-chat-mute:focus-visible {
                outline: 2px solid currentColor;
                outline-offset: 2px;
            }

            #fk-chat-panel #fk-chat-close {
                flex-shrink: 0;
            }
        `;

        document.head.appendChild(style);
    }

    /* =============================================
       KREIRANJE CETA
    ============================================= */

    function createChat() {
        const app = byId("portal-app");

        if (!app) {
            console.error(
                "FK Obilic CHAT: portal-app nije pronadjen."
            );
            return false;
        }

        if (byId("fk-chat-root")) {
            return false;
        }

        addMuteStyles();

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
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 11.5a8 8 0 0 1-8 8 8.6 8.6 0 0 1-3.5-.7L4 20l1.3-4.4A8 8 0 1 1 20 11.5Z"/>
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
                        <img src="images/grb.png" alt="">
                    </div>

                    <div class="fk-chat-header-info">
                        <strong class="fk-chat-header-title">
                            Групни чет
                        </strong>

                        <span class="fk-chat-header-subtitle">
                            ФК Обилић · Сви чланови портала
                        </span>
                    </div>

                    <div class="fk-chat-header-actions">

                        <button
                            type="button"
                            id="fk-chat-mute"
                            class="fk-chat-mute"
                            title="Утишај обавештења из чета"
                            aria-label="Утишај обавештења из чета"
                            aria-pressed="false"
                            disabled
                        >
                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/>
                                <path d="M10 21h4"/>
                                <path
                                    class="fk-chat-mute-slash"
                                    d="M3 3l18 18"
                                />
                            </svg>
                        </button>

                        <button
                            type="button"
                            id="fk-chat-close"
                            class="fk-chat-close"
                            aria-label="Затвори чет"
                        >×</button>

                    </div>
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

        launcher = byId("fk-chat-launcher");
        panel = byId("fk-chat-panel");
        list = byId("fk-chat-messages");
        badge = byId("fk-chat-badge");
        input = byId("fk-chat-input");
        form = byId("fk-chat-form");
        sendButton = byId("fk-chat-send");
        muteButton = byId("fk-chat-mute");

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

        byId("fk-chat-close").addEventListener(
            "click",
            closeChat
        );

        muteButton.addEventListener(
            "click",
            toggleChatMute
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
       OTVARANJE I ZATVARANJE
    ============================================= */

    function openChat() {
        if (!userId || !panel) return;

        panel.hidden = false;

        launcher.setAttribute(
            "aria-expanded",
            "true"
        );

        loadMessages();
        markAsRead();

        requestAnimationFrame(() => {
            if (!isOpen()) return;

            list.scrollTop = list.scrollHeight;
            input.focus();
        });
    }

    function closeChat() {
        if (!panel) return;

        panel.hidden = true;

        launcher.setAttribute(
            "aria-expanded",
            "false"
        );

        launcher.focus();
    }

    /* =============================================
       OTVARANJE IZ PUSH OBAVESTENJA
    ============================================= */

    function openChatFromPush() {
        if (
            !pendingOpenFromPush ||
            !userId ||
            !launcher ||
            !panel
        ) {
            return;
        }

        pendingOpenFromPush = false;

        openChat();

        const url = new URL(
            window.location.href
        );

        if (
            url.searchParams.get("chat") === "1"
        ) {
            url.searchParams.delete("chat");

            window.history.replaceState(
                window.history.state,
                "",
                url.pathname + url.search + url.hash
            );
        }
    }

    /* =============================================
       NECITANE PORUKE
    ============================================= */

    function updateUnread() {
        if (!badge) return;

        if (!userId || isOpen()) {
            badge.hidden = true;
            return;
        }

        const lastRead = getLastRead();

        const readTime = lastRead
            ? new Date(lastRead).getTime()
            : 0;

        const unread = messages.filter(
            message => {
                if (message.user_id === userId) {
                    return false;
                }

                return (
                    new Date(
                        message.created_at
                    ).getTime() > readTime
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
        if (!userId) return;

        setLastRead(
            new Date().toISOString()
        );

        updateUnread();
    }

    /* =============================================
       PRIKAZ PORUKA
    ============================================= */

    function renderMessages() {
        if (!list) return;

        const distanceFromBottom =
            list.scrollHeight -
            list.scrollTop -
            list.clientHeight;

        const wasNearBottom =
            distanceFromBottom < 120;

        list.replaceChildren();

        if (!messages.length) {
            const empty =
                document.createElement("div");

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

            if (!own) {
                const avatar =
                    document.createElement("div");

                avatar.className =
                    "fk-chat-avatar";

                avatar.textContent =
                    initials(message.ime_prezime);

                row.appendChild(avatar);
            }

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

            name.textContent = own
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

            // Poruke se prikazuju kao bezbedan tekst.
            bubble.textContent =
                message.sadrzaj || "";

            content.append(meta, bubble);

            row.appendChild(content);

            fragment.appendChild(row);
        }

        list.appendChild(fragment);

        if (isOpen() && wasNearBottom) {
            requestAnimationFrame(() => {
                if (isOpen()) {
                    list.scrollTop =
                        list.scrollHeight;
                }
            });
        }
    }

    /* =============================================
       UCITAVANJE PORUKA IZ SUPABASE
    ============================================= */

    async function loadMessages() {
        if (!userId || loading) return;

        loading = true;

        const expectedUser = userId;
        const version = authVersion;

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

            if (
                userId !== expectedUser ||
                version !== authVersion
            ) {
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
            if (
                userId !== expectedUser ||
                version !== authVersion
            ) {
                return;
            }

            console.error(
                "FK Obilic CHAT load:",
                error
            );

            if (isOpen()) {
                const notice =
                    document.createElement("div");

                notice.className =
                    "fk-chat-error";

                notice.textContent =
                    "Поруке тренутно нису доступне. " +
                    "Проверите интернет и подешавања чета.";

                list.replaceChildren(notice);
            }

        } finally {
            loading = false;
        }
    }

    /* =============================================
       SLANJE PORUKA
    ============================================= */

    async function sendMessage(event) {
        event.preventDefault();

        if (!userId || sending) return;

        const text = input.value.trim();

        if (!text || text.length > 1000) {
            return;
        }

        const expectedUser = userId;

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

            if (expectedUser !== userId) {
                return;
            }

            input.value = "";

            await loadMessages();

            requestAnimationFrame(() => {
                if (!isOpen()) return;

                list.scrollTop = list.scrollHeight;
                input.focus();
            });

        } catch (error) {
            console.error(
                "FK Obilic CHAT send:",
                error
            );

            if (expectedUser === userId) {
                window.alert(
                    error.message ||
                    "Порука није послата."
                );
            }

        } finally {
            sending = false;
            sendButton.disabled = false;
        }
    }

    /* =============================================
       REALTIME
    ============================================= */

    function stopListening() {
        if (polling !== null) {
            clearInterval(polling);
            polling = null;
        }

        if (channel) {
            sb.removeChannel(channel);
            channel = null;
        }
    }

    function startListening() {
        stopListening();

        if (!userId) return;

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

        // Rezervna provera svakih 15 sekundi.
        polling = window.setInterval(
            () => {
                if (
                    !document.hidden &&
                    userId
                ) {
                    loadMessages();
                }
            },
            15000
        );
    }

    /* =============================================
       UTISAVANJE OBAVESTENJA
    ============================================= */

    function refreshMuteButton() {
        if (!muteButton) return;

        muteButton.classList.toggle(
            "is-muted",
            chatMuted
        );

        const label = chatMuted
            ? "Укључи обавештења из чета"
            : "Утишај обавештења из чета";

        muteButton.title = label;

        muteButton.setAttribute(
            "aria-label",
            label
        );

        muteButton.setAttribute(
            "aria-pressed",
            String(chatMuted)
        );
    }

    async function loadChatMute(
        expectedUser,
        version
    ) {
        if (!muteButton) return;

        muteButton.disabled = true;

        try {
            const { data, error } = await sb
                .from(SETTINGS)
                .select("utisan")
                .eq("user_id", expectedUser)
                .maybeSingle();

            if (error) throw error;

            if (
                userId !== expectedUser ||
                version !== authVersion
            ) {
                return;
            }

            chatMuted = data?.utisan === true;

            refreshMuteButton();

            muteButton.disabled = false;

        } catch (error) {
            console.error(
                "FK Obilic CHAT mute load:",
                error
            );

            if (
                userId === expectedUser &&
                version === authVersion
            ) {
                muteButton.title =
                    "Подешавања обавештења нису доступна";
            }
        }
    }

    async function toggleChatMute() {
        if (
            !userId ||
            !muteButton ||
            muteSaving ||
            muteButton.disabled
        ) {
            return;
        }

        const expectedUser = userId;
        const version = authVersion;

        const newValue = !chatMuted;

        muteSaving = true;
        muteButton.disabled = true;

        try {
            const { error } = await sb
                .from(SETTINGS)
                .upsert(
                    {
                        user_id: expectedUser,
                        utisan: newValue,
                        izmenjeno_u:
                            new Date().toISOString()
                    },
                    {
                        onConflict: "user_id"
                    }
                );

            if (error) throw error;

            if (
                userId !== expectedUser ||
                version !== authVersion
            ) {
                return;
            }

            chatMuted = newValue;

            refreshMuteButton();

        } catch (error) {
            console.error(
                "FK Obilic CHAT mute save:",
                error
            );

            if (
                userId === expectedUser &&
                version === authVersion
            ) {
                window.alert(
                    "Није могуће сачувати " +
                    "подешавање обавештења."
                );
            }

        } finally {
            muteSaving = false;

            if (
                userId === expectedUser &&
                version === authVersion
            ) {
                muteButton.disabled = false;
            }
        }
    }

    /* =============================================
       PRIJAVA I PRAVA PRISTUPA
    ============================================= */

    async function setCurrentUser(user) {
        const nextId = user?.id || null;

        if (
            nextId === userId &&
            nextId
        ) {
            return;
        }

        const version = ++authVersion;

        stopListening();

        userId = null;
        messages = [];
        chatMuted = false;

        refreshMuteButton();

        muteButton.disabled = true;

        launcher.hidden = true;
        panel.hidden = true;
        badge.hidden = true;

        if (!nextId) return;

        try {
            const { data: profile, error } =
                await sb
                    .from("portal_korisnici")
                    .select("aktivan,uloga")
                    .eq("user_id", nextId)
                    .maybeSingle();

            if (version !== authVersion) {
                return;
            }

            if (error) throw error;

            if (
                !profile ||
                profile.aktivan !== true ||
                !ALLOWED_ROLES.includes(
                    profile.uloga
                )
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

            startListening();

            openChatFromPush();

            await Promise.all([
                loadChatMute(nextId, version),
                loadMessages()
            ]);

        } catch (error) {
            console.error(
                "FK Obilic CHAT profile:",
                error
            );
        }
    }

    /* =============================================
       POKRETANJE
    ============================================= */

    async function initialize() {
        if (!createChat()) return;

        window.__fkObilicChatLoaded = true;

        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.addEventListener(
                "message",
                event => {
                    if (
                        event.data?.type ===
                        "FK_OBILIC_OPEN_CHAT"
                    ) {
                        pendingOpenFromPush = true;
                        openChatFromPush();
                    }
                }
            );
        }

        sb.auth.onAuthStateChange(
            (event, session) => {
                if (
                    [
                        "SIGNED_IN",
                        "INITIAL_SESSION",
                        "SIGNED_OUT",
                        "USER_UPDATED"
                    ].includes(event)
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

        try {
            const { data, error } =
                await sb.auth.getSession();

            if (error) throw error;

            await setCurrentUser(
                data?.session?.user || null
            );

        } catch (error) {
            console.error(
                "FK Obilic CHAT session:",
                error
            );
        }

        document.addEventListener(
            "visibilitychange",
            () => {
                if (
                    !document.hidden &&
                    userId
                ) {
                    loadMessages();
                }
            }
        );
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
