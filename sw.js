
/* =====================================================
   FK OBILIC - PWA SERVICE WORKER

   Instalacija aplikacije
   Prijem sistemskih push obavestenja
   Otvaranje portala kada se klikne na obavestenje

   Bez kesiranja privatnih podataka korisnika.
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
   PUSH OBAVESTENJE
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
            : "Имате ново обавештење на порталу клуба.";

    const appUrl = new URL(
        "portal.html",
        self.registration.scope
    ).href;

    const iconUrl = new URL(
        "images/pwa-192.png",
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
            url: appUrl
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
   KLIK NA OBAVESTENJE
===================================================== */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const destination = new URL(
            "portal.html",
            self.registration.scope
        ).href;

        event.waitUntil(
            (async () => {

                const windows =
                    await self.clients.matchAll({
                        type: "window",
                        includeUncontrolled: true
                    });

                for (const client of windows) {

                    const url = new URL(client.url);

                    if (
                        url.origin ===
                            new URL(destination).origin &&
                        url.pathname.endsWith(
                            "/portal.html"
                        )
                    ) {

                        if ("focus" in client) {
                            return client.focus();
                        }
                    }
                }

                if (self.clients.openWindow) {
                    return self.clients.openWindow(
                        destination
                    );
                }

            })()
        );
    }
);
