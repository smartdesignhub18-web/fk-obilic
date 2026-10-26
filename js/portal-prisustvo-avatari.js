
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   AVATARI U SPISKOVIMA PRISUSTVA

   Treninzi + utakmice

   Fotografije iz public.igraci
   Povezivanje preko user_id i povezani_id

   Bez fotografije:
   grb FK Obilic + inicijali
===================================================== */

(() => {
    "use strict";

    if (window.__fkPrisustvoAvatariLoaded) {
        return;
    }

    window.__fkPrisustvoAvatariLoaded = true;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "FK Obilic: Supabase nije dostupan."
        );
        return;
    }

    const LIST_SELECTOR = [
        "#portal-attendance-modal-list",
        "#portal-match-attendance-list"
    ].join(",");

    const AVATAR_SELECTOR =
        ".portal-attendance-player-avatar[data-player-user-id]";

    let scanScheduled = false;

    /* =============================================
       STILOVI
    ============================================= */

    function addStyles() {

        if (
            document.getElementById(
                "fk-prisustvo-avatar-css"
            )
        ) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fk-prisustvo-avatar-css";

        style.textContent = `

            .portal-attendance-player-avatar.fk-attendance-avatar {
                position: relative;
                isolation: isolate;

                display: flex !important;
                align-items: center;
                justify-content: center;

                width: 46px !important;
                height: 46px !important;
                min-width: 46px !important;
                flex: 0 0 46px;

                padding: 0;
                overflow: hidden;

                border-radius: 50%;

                background: linear-gradient(
                    145deg,
                    #383841,
                    #17171b
                );

                border: 1px solid rgba(
                    255,255,255,.14
                );

                color: #fff;
            }

            .fk-attendance-avatar-fallback {
                position: absolute;
                inset: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                overflow: hidden;
            }

            .fk-attendance-avatar-crest {
                position: absolute;

                width: 78%;
                height: 78%;

                object-fit: contain;

                opacity: .20;

                pointer-events: none;
            }

            .fk-attendance-avatar-initials {
                position: relative;
                z-index: 2;

                color: #fff;

                font-family:
                    "Oswald",
                    Arial,
                    sans-serif;

                font-size: 17px;
                font-weight: 700;

                letter-spacing: .5px;

                text-shadow:
                    0 2px 5px
                    rgba(0,0,0,.4);
            }

            .fk-attendance-avatar-photo {
                position: absolute;
                inset: 0;

                width: 100%;
                height: 100%;

                object-fit: cover;

                z-index: 3;
            }

        `;

        document.head.appendChild(style);
    }

    /* =============================================
       INICIJALI
    ============================================= */

    function getInitials(name) {

        const parts = String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!parts.length) {
            return "О";
        }

        if (parts.length === 1) {
            return parts[0]
                .charAt(0)
                .toLocaleUpperCase("sr");
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toLocaleUpperCase("sr");
    }

    /* =============================================
       PROVERA ADRESE FOTOGRAFIJE
    ============================================= */

    function safePhotoUrl(value) {

        if (!value) {
            return null;
        }

        try {

            const url = new URL(
                String(value).trim(),
                document.baseURI
            );

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                return null;
            }

            return url.href;

        } catch {
            return null;
        }
    }

    /* =============================================
       REZERVNI AVATAR
    ============================================= */

    function prepareAvatar(avatar) {

        if (
            avatar.dataset.fkAvatarReady === "1"
        ) {
            return;
        }

        avatar.dataset.fkAvatarReady = "1";

        const row = avatar.closest(
            ".portal-attendance-player-row"
        );

        const name =
            row?.querySelector(
                ".portal-attendance-player-name strong"
            )?.textContent?.trim() || "";

        avatar.classList.add(
            "fk-attendance-avatar"
        );

        avatar.textContent = "";

        const fallback = document.createElement(
            "div"
        );

        fallback.className =
            "fk-attendance-avatar-fallback";

        const crest = document.createElement(
            "img"
        );

        crest.className =
            "fk-attendance-avatar-crest";

        crest.src = "images/grb.png";
        crest.alt = "";

        const initials = document.createElement(
            "span"
        );

        initials.className =
            "fk-attendance-avatar-initials";

        initials.textContent =
            getInitials(name);

        fallback.append(
            crest,
            initials
        );

        avatar.appendChild(fallback);
    }

    /* =============================================
       POSTAVI FOTOGRAFIJU
    ============================================= */

    function setPhoto(avatar, source) {

        const url = safePhotoUrl(source);

        if (!url || !avatar.isConnected) {
            return;
        }

        const fallback = avatar.querySelector(
            ".fk-attendance-avatar-fallback"
        );

        if (
            avatar.querySelector(
                ".fk-attendance-avatar-photo"
            )
        ) {
            return;
        }

        const photo = document.createElement(
            "img"
        );

        photo.className =
            "fk-attendance-avatar-photo";

        photo.alt = "";

        photo.loading = "lazy";

        photo.addEventListener(
            "load",
            () => {

                if (fallback) {
                    fallback.hidden = true;
                }

            },
            { once: true }
        );

        photo.addEventListener(
            "error",
            () => {

                photo.remove();

                if (fallback) {
                    fallback.hidden = false;
                }

            },
            { once: true }
        );

        avatar.appendChild(photo);

        photo.src = url;
    }

    /* =============================================
       UCITAVANJE FOTOGRAFIJA
    ============================================= */

    async function enhanceList(list) {

        const avatars = Array.from(
            list.querySelectorAll(
                AVATAR_SELECTOR
            )
        ).filter(
            avatar =>
                avatar.dataset.fkAvatarReady !== "1"
        );

        if (!avatars.length) {
            return;
        }

        // Rezervni prikaz odmah je vidljiv.

        avatars.forEach(prepareAvatar);

        const userIds = [
            ...new Set(
                avatars
                    .map(
                        avatar =>
                            avatar.dataset.playerUserId
                    )
                    .filter(Boolean)
            )
        ];

        if (!userIds.length) {
            return;
        }

        // Spisak citamo u ogranicenim grupama.

        for (
            let start = 0;
            start < userIds.length;
            start += 100
        ) {

            const batchIds =
                userIds.slice(start, start + 100);

            try {

                const {
                    data,
                    error
                } = await sb.rpc(
                    "portal_prisustvo_avatari",
                    {
                        p_user_ids: batchIds
                    }
                );

                if (error) {
                    throw error;
                }

                const photoByUser = new Map(
                    (data || []).map(
                        item => [
                            item.user_id,
                            item.fotografija
                        ]
                    )
                );

                avatars.forEach(avatar => {

                    const userId =
                        avatar.dataset.playerUserId;

                    if (!batchIds.includes(userId)) {
                        return;
                    }

                    const photo =
                        photoByUser.get(userId);

                    if (photo) {
                        setPhoto(avatar, photo);
                    }

                });

            } catch (error) {

                console.error(
                    "FK Obilic - fotografije prisustva:",
                    error
                );

                // Ako ucitavanje ne uspe,
                // grb i inicijali ostaju vidljivi.

            }

        }
    }

    /* =============================================
       PRONADJI OTVORENE SPISKOVE
    ============================================= */

    function scanLists() {

        document.querySelectorAll(
            LIST_SELECTOR
        ).forEach(
            list => {
                enhanceList(list);
            }
        );
    }

    function scheduleScan() {

        if (scanScheduled) {
            return;
        }

        scanScheduled = true;

        queueMicrotask(() => {

            scanScheduled = false;
            scanLists();

        });
    }

    /* =============================================
       AUTOMATSKI PRATI RENDEROVANJE
    ============================================= */

    function init() {

        addStyles();

        const observer = new MutationObserver(
            mutations => {

                const relevant = mutations.some(
                    mutation => {

                        return Array.from(
                            mutation.addedNodes
                        ).some(node => {

                            if (
                                !(node instanceof Element)
                            ) {
                                return false;
                            }

                            if (
                                node.matches(LIST_SELECTOR) ||
                                node.matches(AVATAR_SELECTOR)
                            ) {
                                return true;
                            }

                            if (
                                node.querySelector(
                                    AVATAR_SELECTOR
                                )
                            ) {
                                return true;
                            }

                            return Boolean(
                                node.closest(LIST_SELECTOR)
                            );

                        });

                    }
                );

                if (relevant) {
                    scheduleScan();
                }

            }
        );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        scheduleScan();
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
