
/* =====================================================
   FK OBILIC NOVI KNEZEVAC
   AVATAR PRIJAVLJENOG KORISNIKA

   Ako korisnik ima fotografiju:
   - prikazuje se njegova fotografija

   Ako nema fotografiju:
   - prikazuje se grb FK Obilic
   - prikazuju se inicijali korisnika
===================================================== */

(() => {
    "use strict";

    if (window.__fkAvatarPrikazLoaded) {
        return;
    }

    window.__fkAvatarPrikazLoaded = true;

    /* ================================================
       STIL
    ================================================= */

    function addStyles() {

        if (
            document.getElementById(
                "fk-avatar-prikaz-css"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id = "fk-avatar-prikaz-css";

        style.textContent = `

            .portal-user-header .portal-user-avatar {
                position: relative;

                display: block !important;

                width: 48px;
                height: 48px;

                min-width: 48px;
                flex: 0 0 48px;

                overflow: hidden;

                border-radius: 12px;

                background: #242429;

                border: 1px solid
                    rgba(255,255,255,.18);
            }

            .portal-user-avatar #portal-header-avatar {
                position: absolute;

                top: 0;
                left: 0;

                width: 100%;
                height: 100%;

                object-fit: cover;

                border-radius: inherit;

                z-index: 2;

                opacity: 1;
            }

            .portal-user-avatar.is-fallback
            #portal-header-avatar {
                opacity: 0;
            }

            .portal-avatar-fallback {
                position: absolute;

                inset: 0;

                display: flex;
                align-items: center;
                justify-content: center;

                overflow: hidden;

                background: linear-gradient(
                    145deg,
                    #35353c,
                    #17171b
                );

                z-index: 1;
            }

            .portal-avatar-fallback img {
                position: absolute;

                width: 75%;
                height: 75%;

                object-fit: contain;

                opacity: .19;

                pointer-events: none;
            }

            .portal-avatar-initials {
                position: relative;

                z-index: 2;

                display: flex;
                align-items: center;
                justify-content: center;

                color: #fff;

                font-family:
                    "Oswald",
                    sans-serif;

                font-size: 21px;
                font-weight: 700;

                letter-spacing: 1px;

                text-shadow:
                    0 2px 5px
                    rgba(0,0,0,.5);
            }

            .portal-user-avatar:not(.is-fallback)
            .portal-avatar-fallback {
                visibility: hidden;
            }

        `;

        document.head.appendChild(style);
    }

    /* ================================================
       INICIJALI KORISNIKA
    ================================================= */

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

    /* ================================================
       PROVERA FOTOGRAFIJE
    ================================================= */

    function isPlaceholderSource(src) {

        if (!src) {
            return true;
        }

        const clean = String(src)
            .split("?")[0]
            .split("#")[0]
            .toLowerCase();

        const filename = clean
            .split("/")
            .pop();

        return (
            filename === "grb.png" ||
            filename === "grb.webp" ||
            filename === "grb.jpg" ||
            filename === "default.png" ||
            filename === "placeholder.png"
        );
    }

    /* ================================================
       GLAVNI PRIKAZ
    ================================================= */

    function initAvatar() {

        const image = document.getElementById(
            "portal-header-avatar"
        );

        const nameElement = document.getElementById(
            "portal-header-name"
        );

        const wrapper = image?.closest(
            ".portal-user-avatar"
        );

        if (
            !image ||
            !nameElement ||
            !wrapper
        ) {
            return;
        }

        addStyles();

        let fallback = wrapper.querySelector(
            ".portal-avatar-fallback"
        );

        if (!fallback) {

            fallback =
                document.createElement("div");

            fallback.className =
                "portal-avatar-fallback";

            const crest =
                document.createElement("img");

            crest.src = "images/grb.png";
            crest.alt = "";

            const initials =
                document.createElement("span");

            initials.className =
                "portal-avatar-initials";

            fallback.append(
                crest,
                initials
            );

            wrapper.appendChild(fallback);
        }

        const initialsElement =
            fallback.querySelector(
                ".portal-avatar-initials"
            );

        function refreshInitials() {

            const name =
                nameElement.textContent?.trim();

            initialsElement.textContent =
                getInitials(name);
        }

        function refreshPhoto() {

            const src =
                image.getAttribute("src") || "";

            const isPlaceholder =
                isPlaceholderSource(src);

            const loaded =
                image.complete &&
                image.naturalWidth > 0;

            const showFallback =
                isPlaceholder ||
                !loaded;

            wrapper.classList.toggle(
                "is-fallback",
                showFallback
            );

            refreshInitials();
        }

        /* Kada se fotografija ucita */

        image.addEventListener(
            "load",
            refreshPhoto
        );

        /* Ako fotografija nije dostupna */

        image.addEventListener(
            "error",
            refreshPhoto
        );

        /* Kada postojece skripte promene sliku */

        const imageObserver =
            new MutationObserver(
                refreshPhoto
            );

        imageObserver.observe(
            image,
            {
                attributes: true,
                attributeFilter: ["src"]
            }
        );

        /* Kada se promeni ime prijavljenog */

        const nameObserver =
            new MutationObserver(
                refreshInitials
            );

        nameObserver.observe(
            nameElement,
            {
                childList: true,
                characterData: true,
                subtree: true
            }
        );

        refreshInitials();
        refreshPhoto();
    }

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initAvatar
        );

    } else {

        initAvatar();
    }

})();
