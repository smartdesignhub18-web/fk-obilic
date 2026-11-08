
/* =====================================================
   FK OBILIC - PWA SERVICE WORKER

   - Sistemska push obavestenja
   - Automatsko otvaranje grupnog ceta
   - Postojeca klupska obavestenja
   - Bez kesiranja privatnih podataka
===================================================== */

"use strict";

self.addEventListener("install", event => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        self.clients.claim()
    );
});


/* =====================================================
   PRIJEM PUSH OBAVESTENJA
===================================================== */

self.addEventListener("push", event => {

    let payload = {};

    try {
        payload = event.data
            ? event.data.json()
            : {};
    } catch {
        payload = {
            body: event.data?.text() || ""
        };
    }

    const title =
        typeof payload.title === "string" &&
        payload.title.trim()
            ? payload.title
            : "ФК Обилић";

    const body =
        typeof payload.body === "string" &&
        payload.body.trim()
            ? payload.body
            : "Имате ново обавештење на порталу.";

    // Prepoznaj poruku iz grupnog ceta.
    const isChat = payload.kind === "chat";

    const appUrl = new URL(
        "portal.html",
        self.registration.scope
    );

    if (isChat) {
        appUrl.searchParams.set("chat", "1");
    }

    const iconUrl = new URL(
        "images/pwa-transparent-192.png",
        self.registration.scope
    ).href;

    const options = {
        body,
        icon: iconUrl,
        badge: iconUrl,

        tag: payload.id
            ? String(payload.id)
            : undefined,

        data: {
            url: appUrl.href,
            kind: isChat ? "chat" : "portal"
        }
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


/* =====================================================
   KLIK NA PUSH OBAVESTENJE
===================================================== */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const isChat =
            event.notification.data?.kind === "chat";

        const portalUrl = new URL(
            "portal.html",
            self.registration.scope
        );

        const destination = new URL(
            portalUrl.href
        );

        if (isChat) {
            destination.searchParams.set(
                "chat",
                "1"
            );
        }

        event.waitUntil(
            (async () => {

                const windows =
                    await self.clients.matchAll({
                        type: "window",
                        includeUncontrolled: true
                    });

                // Ako je portal vec otvoren,
                // aktiviraj postojeci prozor.

                for (const client of windows) {

                    const clientUrl =
                        new URL(client.url);

                    if (
                        clientUrl.origin ===
                            portalUrl.origin &&

                        clientUrl.pathname ===
                            portalUrl.pathname
                    ) {

                        // Ako je obavestenje iz ceta,
                        // kazi portalu da otvori chat.

                        if (
                            isChat &&
                            "postMessage" in client
                        ) {

                            client.postMessage({
                                type:
                                    "FK_OBILIC_OPEN_CHAT"
                            });
                        }

                        if ("focus" in client) {
                            return client.focus();
                        }
                    }
                }

                // Ako portal nije otvoren,
                // pokreni ga sa odgovarajucom
                // adresom.

                if (self.clients.openWindow) {

                    return self.clients.openWindow(
                        destination.href
                    );
                }

            })()
        );
    }
);
