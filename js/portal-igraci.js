/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   PORTAL - IGRAČI
========================================================= */

(() => {

    /* =====================================================
       SUPABASE
    ===================================================== */

    const SUPABASE_URL =
        "https://uvevthgxlnzzkapkjxky.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_xFUfALjFsxDlA_b5-SRxBA_5R42c8Xg";


    const teamSb =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_KEY,
            {
                auth: {
                    storageKey:
                        "fk-obilic-portal-auth"
                }
            }
        );


    /* =====================================================
       STATE
    ===================================================== */

    let portalProfile =
        null;

    let portalSelections =
        [];

    let selectedSelection =
        null;


    /* =====================================================
       START
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        initializePortalPlayers
    );


    async function initializePortalPlayers() {

        createPlayersSection();


        const {
            data: {
                session
            }
        } =
            await teamSb.auth
                .getSession();


        if (
            session &&
            session.user
        ) {

            await loadPortalTeam(
                session.user
            );

        }


        teamSb.auth.onAuthStateChange(
            async (
                event,
                session
            ) => {

                if (
                    (
                        event ===
                            "SIGNED_IN" ||
                        event ===
                            "INITIAL_SESSION"
                    ) &&
                    session?.user
                ) {

                    await loadPortalTeam(
                        session.user
                    );

                }


                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    resetTeamSection();

                }

            }
        );

    }



    /* =====================================================
       KREIRANJE SEKCIJE
    ===================================================== */

    function createPlayersSection() {

        if (
            document.querySelector(
                "#portal-team-section"
            )
        ) {

            return;

        }


        const calendarSection =
            document.querySelector(
                ".portal-section"
            );


        if (!calendarSection) {

            return;

        }


        const section =
            document.createElement(
                "section"
            );


        section.id =
            "portal-team-section";


        section.className =
            "portal-section portal-team-section";


        section.innerHTML = `

            <div class="portal-team-heading">

                <div>

                    <span class="portal-team-kicker">
                        ЕКИПА
                    </span>

                    <h2 id="portal-team-title">
                        МОЈА СЕЛЕКЦИЈА
                    </h2>

                    <p id="portal-team-subtitle">
                        Учитавање играча...
                    </p>

                </div>


                <div
                    id="portal-team-selection-wrap"
                    class="portal-team-selection-wrap"
                    hidden
                >

                    <label
                        for="portal-team-selection"
                    >
                        СЕЛЕКЦИЈА
                    </label>

                    <select
                        id="portal-team-selection"
                    ></select>

                </div>

            </div>


            <div
                id="portal-team-summary"
                class="portal-team-summary-bar"
            >

                <div>

                    <span>
                        СЕЛЕКЦИЈА
                    </span>

                    <strong
                        id="portal-team-selection-name"
                    >
                        —
                    </strong>

                </div>


                <div>

                    <span>
                        БРОЈ ИГРАЧА
                    </span>

                    <strong
                        id="portal-team-count"
                    >
                        —
                    </strong>

                </div>

            </div>


            <div
                id="portal-players-content"
                class="portal-players-content"
            >

                <div class="portal-players-loading">
                    Учитавање играча...
                </div>

            </div>

        `;


        calendarSection
            .parentNode
            .insertBefore(
                section,
                calendarSection
            );


        const select =
            document.querySelector(
                "#portal-team-selection"
            );


        if (select) {

            select.addEventListener(
                "change",
                async () => {

                    selectedSelection =
                        portalSelections.find(
                            item =>
                                item.id ===
                                select.value
                        ) ||
                        null;


                    await loadPlayers();

                }
            );

        }

    }



    /* =====================================================
       UČITAVANJE PROFILA
    ===================================================== */

    async function loadPortalTeam(
        user
    ) {

        const {
            data: profile,
            error
        } =
            await teamSb
                .from(
                    "portal_korisnici"
                )
                .select(
                    "user_id,ime_prezime,uloga,selekcija_id,aktivan"
                )
                .eq(
                    "user_id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Portal team profile error:",
                error
            );

            showPlayersError();

            return;

        }


        if (
            !profile ||
            profile.aktivan === false
        ) {

            return;

        }


        portalProfile =
            profile;


        await loadSelections();


        setupSelection();


        await loadPlayers();

    }



    /* =====================================================
       SELEKCIJE
    ===================================================== */

    async function loadSelections() {

        const {
            data,
            error
        } =
            await teamSb
                .from(
                    "selekcije"
                )
                .select(
                    "id,kod,naziv,redosled,aktivna"
                )
                .eq(
                    "aktivna",
                    true
                )
                .order(
                    "redosled",
                    {
                        ascending:
                            true
                    }
                );


        if (error) {

            console.error(
                "Portal team selections error:",
                error
            );

            portalSelections =
                [];

            return;

        }


        portalSelections =
            Array.isArray(data)
                ? data
                : [];

    }



    /* =====================================================
       ODABIR SELEKCIJE
    ===================================================== */

    function setupSelection() {

        const role =
            normalizeRole(
                portalProfile?.uloga
            );


        const selectWrap =
            document.querySelector(
                "#portal-team-selection-wrap"
            );


        const select =
            document.querySelector(
                "#portal-team-selection"
            );


        const title =
            document.querySelector(
                "#portal-team-title"
            );


        if (
            role ===
            "UPRAVA"
        ) {

            if (title) {

                title.textContent =
                    "СЕЛЕКЦИЈЕ КЛУБА";

            }


            if (selectWrap) {

                selectWrap.hidden =
                    false;

            }


            if (select) {

                select.innerHTML =
                    portalSelections
                        .map(
                            selection => `

                                <option
                                    value="${escapeAttribute(
                                        selection.id
                                    )}"
                                >
                                    ${escapeHtml(
                                        selection.naziv
                                    )}
                                </option>

                            `
                        )
                        .join("");

            }


            selectedSelection =
                portalSelections[0] ||
                null;


            if (
                select &&
                selectedSelection
            ) {

                select.value =
                    selectedSelection.id;

            }


            return;

        }


        if (title) {

            title.textContent =
                "МОЈА СЕЛЕКЦИЈА";

        }


        if (selectWrap) {

            selectWrap.hidden =
                true;

        }


        selectedSelection =
            portalSelections.find(
                selection =>
                    selection.id ===
                    portalProfile
                        ?.selekcija_id
            ) ||
            null;

    }



    /* =====================================================
       IGRAČI
    ===================================================== */

    async function loadPlayers() {

        const container =
            document.querySelector(
                "#portal-players-content"
            );


        const countElement =
            document.querySelector(
                "#portal-team-count"
            );


        const selectionElement =
            document.querySelector(
                "#portal-team-selection-name"
            );


        const subtitle =
            document.querySelector(
                "#portal-team-subtitle"
            );


        if (!container) {

            return;

        }


        if (!selectedSelection) {

            container.innerHTML = `

                <div class="portal-players-empty">
                    Корисник није повезан са селекцијом.
                </div>

            `;

            return;

        }


        container.innerHTML = `

            <div class="portal-players-loading">
                Учитавање играча...
            </div>

        `;


        if (selectionElement) {

            selectionElement.textContent =
                selectedSelection.naziv;

        }


        const {
            data,
            error
        } =
            await teamSb
                .from(
                    "igraci"
                )
                .select(
                    "id,ime_prezime,broj,pozicija,pozicija_detaljno,datum_rodjenja,selekcija,fotografija,redosled,aktivan"
                )
                .eq(
                    "aktivan",
                    true
                )
                .eq(
                    "selekcija",
                    selectedSelection.naziv
                );


        if (error) {

            console.error(
                "Portal players error:",
                error
            );


            showPlayersError();

            return;

        }


        const players =
            Array.isArray(data)
                ? [...data]
                : [];


        players.sort(
            sortPlayers
        );


        if (countElement) {

            countElement.textContent =
                players.length;

        }


        if (subtitle) {

            subtitle.textContent =
                `${selectedSelection.naziv} · ${players.length} играча`;

        }


        if (
            players.length ===
            0
        ) {

            container.innerHTML = `

                <div class="portal-players-empty">

                    Тренутно нема унетих играча
                    за ову селекцију.

                </div>

            `;

            return;

        }


        container.innerHTML =
            renderPlayerGroups(
                players
            );

    }



    /* =====================================================
       SORTIRANJE
    ===================================================== */

    function sortPlayers(
        a,
        b
    ) {

        const positionOrder = {

            "ГОЛМАНИ":
                1,

            "ОДБРАНА":
                2,

            "ВЕЗНИ РЕД":
                3,

            "НАПАД":
                4

        };


        const positionDifference =

            (
                positionOrder[
                    a.pozicija
                ] ||
                99
            )

            -

            (
                positionOrder[
                    b.pozicija
                ] ||
                99
            );


        if (
            positionDifference !==
            0
        ) {

            return positionDifference;

        }


        const orderDifference =

            Number(
                a.redosled ||
                0
            )

            -

            Number(
                b.redosled ||
                0
            );


        if (
            orderDifference !==
            0
        ) {

            return orderDifference;

        }


        return String(
            a.ime_prezime ||
            ""
        )
            .localeCompare(
                String(
                    b.ime_prezime ||
                    ""
                ),
                "sr"
            );

    }



    /* =====================================================
       GRUPE
    ===================================================== */

    function renderPlayerGroups(
        players
    ) {

        const groups = [

            "ГОЛМАНИ",
            "ОДБРАНА",
            "ВЕЗНИ РЕД",
            "НАПАД"

        ];


        let html =
            "";


        groups.forEach(
            groupName => {

                const groupPlayers =
                    players.filter(
                        player =>
                            player.pozicija ===
                            groupName
                    );


                if (
                    !groupPlayers.length
                ) {

                    return;

                }


                html += `

                    <div class="portal-player-group">

                        <div class="portal-player-group-heading">

                            <span>
                                ${escapeHtml(
                                    selectedSelection?.naziv ||
                                    ""
                                )}
                            </span>

                            <h3>
                                ${escapeHtml(
                                    groupName
                                )}
                            </h3>

                            <div>
                                ${groupPlayers.length}
                            </div>

                        </div>


                        <div class="portal-player-grid">

                            ${
                                groupPlayers
                                    .map(
                                        renderPlayerCard
                                    )
                                    .join("")
                            }

                        </div>

                    </div>

                `;

            }
        );


        /*
            Ako postoji neki igrač bez
            standardne pozicije.
        */

        const standardGroups =

            new Set(
                groups
            );


        const otherPlayers =
            players.filter(
                player =>
                    !standardGroups.has(
                        player.pozicija
                    )
            );


        if (
            otherPlayers.length
        ) {

            html += `

                <div class="portal-player-group">

                    <div class="portal-player-group-heading">

                        <span>
                            ${escapeHtml(
                                selectedSelection?.naziv ||
                                ""
                            )}
                        </span>

                        <h3>
                            ОСТАЛИ
                        </h3>

                        <div>
                            ${otherPlayers.length}
                        </div>

                    </div>


                    <div class="portal-player-grid">

                        ${
                            otherPlayers
                                .map(
                                    renderPlayerCard
                                )
                                .join("")
                        }

                    </div>

                </div>

            `;

        }


        return html;

    }



    /* =====================================================
       KARTICA
    ===================================================== */

    function renderPlayerCard(
        player
    ) {

        const name =
            player.ime_prezime ||
            "";


        const photo =
            player.fotografija ||
            "";


        const number =
            player.broj !==
                null &&
            player.broj !==
                undefined &&
            player.broj !==
                ""

                ? player.broj

                : "—";


        const position =
            getPlayerPosition(
                player
            );


        const birthDate =
            formatBirthDate(
                player.datum_rodjenja
            );


        return `

            <article class="portal-player-card">


                <div class="portal-player-photo">

                    ${
                        photo

                            ? `

                                <img
                                    src="${escapeAttribute(photo)}"
                                    alt="${escapeAttribute(name)}"
                                    loading="lazy"
                                    onerror="
                                        this.style.display='none';
                                        this.nextElementSibling.style.display='flex';
                                    "
                                >

                                <div
                                    class="portal-player-placeholder"
                                    style="display:none;"
                                >

                                    <img
                                        src="images/grb.png"
                                        alt=""
                                    >

                                    <strong>
                                        ${escapeHtml(
                                            getInitials(
                                                name
                                            )
                                        )}
                                    </strong>

                                </div>

                            `

                            : `

                                <div class="portal-player-placeholder">

                                    <img
                                        src="images/grb.png"
                                        alt=""
                                    >

                                    <strong>
                                        ${escapeHtml(
                                            getInitials(
                                                name
                                            )
                                        )}
                                    </strong>

                                </div>

                            `
                    }


                    <span class="portal-player-number">
                        ${escapeHtml(number)}
                    </span>

                </div>


                <div class="portal-player-card-info">

                    <span class="portal-player-category">
                        ${escapeHtml(
                            player.pozicija ||
                            "ИГРАЧ"
                        )}
                    </span>


                    <h4>
                        ${escapeHtml(name)}
                    </h4>


                    <div class="portal-player-details">

                        <div>

                            <span>
                                ПОЗИЦИЈА
                            </span>

                            <strong>
                                ${escapeHtml(
                                    position ||
                                    "—"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                ДАТУМ РОЂЕЊА
                            </span>

                            <strong>
                                ${escapeHtml(
                                    birthDate ||
                                    "—"
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


            </article>

        `;

    }



    /* =====================================================
       POZICIJA
    ===================================================== */

    function getPlayerPosition(
        player
    ) {

        if (
            player.pozicija_detaljno &&
            String(
                player.pozicija_detaljno
            ).trim()
        ) {

            return String(
                player.pozicija_detaljno
            ).trim();

        }


        const positions = {

            "ГОЛМАНИ":
                "ГОЛМАН",

            "ОДБРАНА":
                "ОДБРАНА",

            "ВЕЗНИ РЕД":
                "ВЕЗНИ РЕД",

            "НАПАД":
                "НАПАД"

        };


        return (
            positions[
                player.pozicija
            ] ||
            ""
        );

    }



    /* =====================================================
       DATUM ROĐENJA
    ===================================================== */

    function formatBirthDate(
        value
    ) {

        if (!value) {

            return "";

        }


        const date =
            new Date(
                `${value}T00:00:00`
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "";

        }


        return new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"
            }
        ).format(
            date
        );

    }



    /* =====================================================
       INITIALS
    ===================================================== */

    function getInitials(
        name
    ) {

        return String(
            name ||
            ""
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(
                0,
                2
            )
            .map(
                part =>
                    part.charAt(0)
            )
            .join("")
            .toUpperCase();

    }



    /* =====================================================
       ERROR
    ===================================================== */

    function showPlayersError() {

        const container =
            document.querySelector(
                "#portal-players-content"
            );


        if (container) {

            container.innerHTML = `

                <div class="portal-players-empty">
                    Играчи тренутно нису доступни.
                </div>

            `;

        }

    }



    /* =====================================================
       RESET
    ===================================================== */

    function resetTeamSection() {

        portalProfile =
            null;

        portalSelections =
            [];

        selectedSelection =
            null;


        const container =
            document.querySelector(
                "#portal-players-content"
            );


        if (container) {

            container.innerHTML = `

                <div class="portal-players-loading">
                    Учитавање играча...
                </div>

            `;

        }

    }



    /* =====================================================
       ROLE
    ===================================================== */

    function normalizeRole(
        role
    ) {

        return String(
            role ||
            ""
        )
            .trim()
            .toUpperCase();

    }



    /* =====================================================
       ESCAPE
    ===================================================== */

    function escapeHtml(
        value = ""
    ) {

        return String(value)
            .replaceAll(
                "&",
                "&amp;"
            )
            .replaceAll(
                "<",
                "&lt;"
            )
            .replaceAll(
                ">",
                "&gt;"
            )
            .replaceAll(
                '"',
                "&quot;"
            )
            .replaceAll(
                "'",
                "&#039;"
            );

    }


    function escapeAttribute(
        value = ""
    ) {

        return escapeHtml(
            value
        );

    }

})();