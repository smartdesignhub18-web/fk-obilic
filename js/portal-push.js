
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   PUSH OBAVESTENJA - ANDROID / PWA

   - Dugme za ukljucivanje i iskljucivanje
   - Dozvola za obavestenja
   - Javni VAPID kljuc iz Supabase Edge Function
   - Registracija PushSubscription
   - Cuvanje pretplate u Supabase
   - Provera statusa telefona
===================================================== */

(() => {
    "use strict";

    if (window.__fkObilicPushLoaded) {
        return;
    }

    window.__fkObilicPushLoaded = true;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "FK Obilic PUSH: Supabase klijent nije dostupan."
        );
        return;
    }

    const FUNCTION_NAME = "portal-push-javni-kljuc";
    const TABLE_NAME = "portal_push_pretplate";

    let enabled = false;
    let busy = false;

    let panel = null;
    let button = null;
    let statusElement = null;

    /* ================================================
       STILOVI
    ================================================ */

    function addStyles() {

        if (document.getElementById("fk-push-css")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fk-push-css";

        style.textContent = `

            .fk-push-panel {
                margin: 18px 0 24px;
                padding: 18px;

                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;

                gap: 16px;

                background: #232329;
                border: 1px solid rgba(255,255,255,.15);
                border-radius: 14px;

                color: #fff;
            }

            .fk-push-info {
                display: flex;
                align-items: center;
                gap: 13px;

                flex: 1 1 220px;
            }

            .fk-push-icon {
                width: 45px;
                height: 45px;
                min-width: 45px;

                display: flex;
                align-items: center;
                justify-content: center;

                border-radius: 12px;
                background: #38303a;

                font-size: 23px;
            }

            .fk-push-title {
                display: block;

                color: #fff;

                font-size: 14px;
                font-weight: 700;
            }

            .fk-push-status {
                display: block;

                margin-top: 5px;

                color: #c8c8d0;

                font-size: 12px;
                line-height: 1.5;
            }

            .fk-push-status.success {
                color: #9be3b8;
            }

            .fk-push-status.error {
                color: #ff9bad;
            }

            .fk-push-button {
                padding: 12px 17px;

                min-height: 42px;

                border: none;
                border-radius: 9px;

                background: #c51e3c;

                color: #fff;

                font-size: 12px;
                font-weight: 700;
                letter-spacing: .3px;

                cursor: pointer;
            }

            .fk-push-button:hover:not(:disabled) {
                background: #a81530;
            }

            .fk-push-button.is-enabled {
                background: #454650;
            }

            .fk-push-button:disabled {
                opacity: .6;
                cursor: not-allowed;
            }

            @media (max-width: 600px) {

                .fk-push-panel {
                    padding: 15px;
                }

                .fk-push-button {
                    width: 100%;
                }
            }

        `;

        document.head.appendChild(style);
    }

    /* ================================================
       KREIRAJ PANEL
    ================================================ */

    function createPanel() {

        const app = document.querySelector(
            "#portal-app"
        );

        if (!app) {
            return false;
        }

        const welcome = app.querySelector(
            ".portal-welcome"
        );

        if (!welcome) {
            console.warn(
                "FK Obilic PUSH: Welcome sekcija nije pronadjena."
            );
            return false;
        }

        panel = document.getElementById(
            "fk-push-panel"
        );

        if (!panel) {

            panel = document.createElement("section");

            panel.id = "fk-push-panel";
            panel.className = "fk-push-panel";

            panel.innerHTML = `

                <div class="fk-push-info">

                    <div
                        class="fk-push-icon"
                        aria-hidden="true"
                    >
                        🔔
                    </div>

                    <div>

                        <strong class="fk-push-title">
                            ОБАВЕШТЕЊА НА ТЕЛЕФОНУ
                        </strong>

                        <span
                            id="fk-push-status"
                            class="fk-push-status"
                            role="status"
                            aria-live="polite"
                        >
                            Провера обавештења...
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    id="fk-push-button"
                    class="fk-push-button"
                    disabled
                >
                    ПРОВЕРА...
                </button>

            `;

            welcome.insertAdjacentElement(
                "afterend",
                panel
            );
        }

        button = document.getElementById(
            "fk-push-button"
        );

        statusElement = document.getElementById(
            "fk-push-status"
        );

        return Boolean(button && statusElement);
    }

    /* ================================================
       STATUS
    ================================================ */

    function setStatus(text, type = "") {

        if (!statusElement) {
            return;
        }

        statusElement.textContent = text;

        statusElement.className =
            "fk-push-status" +
            (type ? " " + type : "");
    }

    function updateButton() {

        if (!button) {
            return;
        }

        button.disabled = busy;

        button.classList.toggle(
            "is-enabled",
            enabled
        );

        button.textContent = busy
            ? "ОБРАДА..."
            : enabled
                ? "ИСКЉУЧИ ОБАВЕШТЕЊА"
                : "УКЉУЧИ ОБАВЕШТЕЊА";
    }

    /* ================================================
       PROVERA PODRSKE
    ================================================ */

    function supported() {

        return (
            window.isSecureContext &&
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window
        );
    }

    /* ================================================
       KORISNIK
    ================================================ */

    async function getCurrentUser() {

        const {
            data,
            error
        } = await sb.auth.getUser();

        if (error) {
            throw error;
        }

        return data?.user || null;
    }

    /* ================================================
       SERVICE WORKER
    ================================================ */

    async function getRegistration() {

        await navigator.serviceWorker.register(
            "./sw.js",
            {
                scope: "./"
            }
        );

        return navigator.serviceWorker.ready;
    }

    /* ================================================
       JAVNI VAPID KLJUC
    ================================================ */

    async function getPublicKey() {

        const {
            data,
            error
        } = await sb.functions.invoke(
            FUNCTION_NAME,
            {
                body: {
                    purpose: "push-subscription"
                }
            }
        );

        if (error) {
            throw error;
        }

        const key = data?.publicKey;

        if (
            typeof key !== "string" ||
            !key.trim()
        ) {
            throw new Error(
                "Javni VAPID kljuc nije dostupan."
            );
        }

        return key.trim();
    }

    /* ================================================
       BASE64URL U UINT8ARRAY
    ================================================ */

    function urlBase64ToUint8Array(value) {

        const padding = "=".repeat(
            (4 - value.length % 4) % 4
        );

        const base64 = (
            value + padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const raw = atob(base64);

        const result = new Uint8Array(raw.length);

        for (let i = 0; i < raw.length; i++) {
            result[i] = raw.charCodeAt(i);
        }

        return result;
    }

    /* ================================================
       ARRAYBUFFER U BASE64URL
    ================================================ */

    function bufferToBase64Url(buffer) {

        if (!buffer) {
            throw new Error(
                "Push pretplata nema potrebne kljuceve."
            );
        }

        const bytes = new Uint8Array(buffer);

        let binary = "";

        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }

        return btoa(binary)
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");
    }

    /* ================================================
       SACUVAJ PRETPLATU U SUPABASE
    ================================================ */

    async function saveSubscription(
        subscription,
        userId
    ) {

        const p256dh = bufferToBase64Url(
            subscription.getKey("p256dh")
        );

        const authKey = bufferToBase64Url(
            subscription.getKey("auth")
        );

        const {
            error
        } = await sb
            .from(TABLE_NAME)
            .upsert(
                {
                    user_id: userId,
                    endpoint: subscription.endpoint,
                    p256dh,
                    auth_key: authKey,
                    updated_at:
                        new Date().toISOString()
                },
                {
                    onConflict: "endpoint"
                }
            );

        if (error) {
            throw error;
        }
    }

    /* ================================================
       UKLJUCI PUSH OBAVESTENJA
    ================================================ */

    async function enablePush() {

        if (busy) {
            return;
        }

        if (!supported()) {

            setStatus(
                "Овај прегледач не подржава push обавештења.",
                "error"
            );

            return;
        }

        /*
           Zahtev za dozvolu pokrecemo
           direktno nakon korisnikovog klika.
        */

        const permission = (
            Notification.permission === "granted"
        )
            ? "granted"
            : await Notification.requestPermission();

        if (permission !== "granted") {

            setStatus(
                "Обавештења нису дозвољена. Дозволите их у подешавањима телефона.",
                "error"
            );

            return;
        }

        busy = true;
        updateButton();

        try {

            const user = await getCurrentUser();

            if (!user) {
                throw new Error(
                    "Пријавите се на портал."
                );
            }

            const publicKey =
                await getPublicKey();

            const registration =
                await getRegistration();

            let subscription =
                await registration.pushManager
                    .getSubscription();

            if (!subscription) {

                subscription =
                    await registration.pushManager
                        .subscribe({
                            userVisibleOnly: true,

                            applicationServerKey:
                                urlBase64ToUint8Array(
                                    publicKey
                                )
                        });
            }

            await saveSubscription(
                subscription,
                user.id
            );

            enabled = true;

            setStatus(
                "Телефон је повезан. Push обавештења су укључена.",
                "success"
            );

        } catch (error) {

            console.error(
                "FK Obilic PUSH enable:",
                error
            );

            enabled = false;

            setStatus(
                "Повезивање није успело: " +
                (
                    error?.message ||
                    "Непозната грешка."
                ),
                "error"
            );

        } finally {

            busy = false;
            updateButton();
        }
    }

    /* ================================================
       ISKLJUCI PUSH OBAVESTENJA
    ================================================ */

    async function disablePush() {

        if (busy) {
            return;
        }

        busy = true;
        updateButton();

        try {

            const user = await getCurrentUser();

            if (!user) {
                throw new Error(
                    "Пријавите се на портал."
                );
            }

            const registration =
                await getRegistration();

            const subscription =
                await registration.pushManager
                    .getSubscription();

            if (subscription) {

                const {
                    error
                } = await sb
                    .from(TABLE_NAME)
                    .delete()
                    .eq("user_id", user.id)
                    .eq(
                        "endpoint",
                        subscription.endpoint
                    );

                if (error) {
                    throw error;
                }

                await subscription.unsubscribe();
            }

            enabled = false;

            setStatus(
                "Обавештења су искључена на овом уређају."
            );

        } catch (error) {

            console.error(
                "FK Obilic PUSH disable:",
                error
            );

            setStatus(
                "Искључивање није успело: " +
                (
                    error?.message ||
                    "Непозната грешка."
                ),
                "error"
            );

        } finally {

            busy = false;
            updateButton();
        }
    }

    /* ================================================
       PROVERA TRENUTNE PRETPLATE
    ================================================ */

    async function refreshState() {

        if (!button || busy) {
            return;
        }

        busy = true;
        updateButton();

        try {

            enabled = false;

            if (!supported()) {

                setStatus(
                    "Push обавештења нису подржана на овом уређају.",
                    "error"
                );

                return;
            }

            const user = await getCurrentUser();

            if (!user) {

                setStatus(
                    "Пријавите се да бисте укључили обавештења."
                );

                return;
            }

            if (Notification.permission === "denied") {

                setStatus(
                    "Обавештења су блокирана у подешавањима телефона.",
                    "error"
                );

                return;
            }

            const registration =
                await getRegistration();

            const subscription =
                await registration.pushManager
                    .getSubscription();

            if (!subscription) {

                setStatus(
                    "Укључите обавештења да стижу и када је апликација затворена."
                );

                return;
            }

            const {
                data,
                error
            } = await sb
                .from(TABLE_NAME)
                .select("id")
                .eq("user_id", user.id)
                .eq(
                    "endpoint",
                    subscription.endpoint
                )
                .maybeSingle();

            if (error) {
                throw error;
            }

            enabled = Boolean(data);

            if (enabled) {

                setStatus(
                    "Овај телефон је повезан за push обавештења.",
                    "success"
                );

            } else {

                setStatus(
                    "Телефон има дозволу, али још није повезан са овим налогом."
                );
            }

        } catch (error) {

            console.error(
                "FK Obilic PUSH status:",
                error
            );

            setStatus(
                "Провера обавештења није успела.",
                "error"
            );

        } finally {

            busy = false;
            updateButton();
        }
    }

    /* ================================================
       POKRETANJE
    ================================================ */

    function initialize() {

        addStyles();

        if (!createPanel()) {
            return;
        }

        button.addEventListener(
            "click",
            () => {

                if (busy) {
                    return;
                }

                if (enabled) {
                    disablePush();
                } else {
                    enablePush();
                }
            }
        );

        sb.auth.onAuthStateChange(
            (event) => {

                if (
                    event === "SIGNED_IN" ||
                    event === "INITIAL_SESSION"
                ) {

                    queueMicrotask(
                        () => refreshState()
                    );

                }

                if (event === "SIGNED_OUT") {

                    enabled = false;

                    setStatus(
                        "Пријавите се да бисте укључили обавештења."
                    );

                    updateButton();
                }
            }
        );

        document.addEventListener(
            "visibilitychange",
            () => {

                if (!document.hidden) {
                    refreshState();
                }
            }
        );

        refreshState();
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
