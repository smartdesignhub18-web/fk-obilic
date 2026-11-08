
/* =====================================================
   FK OBILIC - PWA SERVICE WORKER

   PUSH OBAVESTENJA:
   - Treninzi i utakmice -> portal
   - Grupni cet -> direktno otvara cet
   - Radi i kada je aplikacija u pozadini
===================================================== */

"use strict";

const CHAT_MESSAGE_TYPE = "FK_OBILIC_OPEN_CHAT";


/* =====================================================
   INSTALACIJA
===================================================== */

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

    if (!payload || typeof payload !== "object") {
        payload = {};
    }

    const isChat = payload.kind === "chat";

    const title =
        typeof payload.title === "string" &&
        payload.title.trim()
            ? payload.title
            : "ФК Обилић";

    const body =
        typeof payload.body === "string" &&
        payload.body.trim()
            ? payload.body
            : "Имате ново обавештење.";

    const destination = new URL(
        "portal.html",
        self.registration.scope
    );

    if (isChat) {
        destination.searchParams.set("chat", "1");
    }

    
const iconUrl = new URL(
    "images/grb.png",
    self.registration.scope
).href;

const badgeUrl = new URL(
    "images/pwa-transparent-192.png",
    self.registration.scope
).href;


    const options = {
        body: body,

        icon: iconUrl,
badge: badgeUrl,

        tag: payload.id
            ? String(payload.id)
            : undefined,

        data: {
            kind: isChat ? "chat" : "portal",
            url: destination.href
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

                // 1. Ako je portal vec otvoren,
                // pronadji taj prozor.

                for (const client of windows) {

                    const currentUrl = new URL(
                        client.url
                    );

                    if (
                        currentUrl.origin !==
                            portalUrl.origin ||

                        currentUrl.pathname !==
                            portalUrl.pathname
                    ) {
                        continue;
                    }

                    // Obicna obavestenja:
                    // samo prikazi portal.

                    if (!isChat) {

                        if ("focus" in client) {
                            return await client.focus();
                        }

                        return;
                    }

                    // CHAT:
                    // navigacija na ?chat=1
                    // je pouzdanija od samog
                    // slanja postMessage komande,
                    // narocito na Android PWA.

                    if ("navigate" in client) {

                        try {

                            const opened =
                                await client.navigate(
                                    destination.href
                                );

                            if (opened) {

                                if ("focus" in opened) {
                                    return await opened.focus();
                                }

                                return opened;
                            }

                        } catch (error) {

                            console.warn(
                                "Chat navigate:",
                                error
                            );
                        }
                    }

                    // Rezervna varijanta ako
                    // navigate nije podrzan.

                    client.postMessage({
                        type: CHAT_MESSAGE_TYPE
                    });

                    if ("focus" in client) {
                        return await client.focus();
                    }

                    return;
                }

                // 2. Ako aplikacija nije otvorena,
                // pokreni portal sa ?chat=1.

                if (self.clients.openWindow) {

                    return await self.clients.openWindow(
                        destination.href
                    );
                }

            })()
        );
    }
);
