/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   FUDBALSKI PODACI
========================================================= */


/* =========================================================
   PODEŠAVANJA
========================================================= */

const FOOTBALL_CONFIG = {

    // Srbijasport ID kluba
    clubId: 787,

    // Srbijasport ID lige
    leagueId: 8794,

    // Trenutna sezona
    season: "2026/27",

    // Naziv našeg kluba
    clubName: "Обилић",

    // Naš API
    apiUrl: "/api/football",

    // Keširanje podataka - 30 minuta
    cacheTime: 30 * 60 * 1000
};



/* =========================================================
   POMOĆNE FUNKCIJE
========================================================= */


/*
    Normalizuje naziv kluba kako bismo mogli
    pouzdano da prepoznamo Obilić.
*/

function normalizeClubName(name = "") {

    return name
        .toLowerCase()
        .trim()
        .replaceAll("ć", "c")
        .replaceAll("č", "c")
        .replaceAll("š", "s")
        .replaceAll("ž", "z")
        .replaceAll("đ", "dj");

}


/*
    Proverava da li je klub FK Obilić.
*/

function isObilic(name = "") {

    const normalized = normalizeClubName(name);

    return (
        normalized.includes("obilic") ||
        name.toLowerCase().includes("обилић")
    );

}



/* =========================================================
   CACHE
========================================================= */


/*
    Čuvamo poslednje uspešno preuzete podatke
    u browseru.

    Ako API privremeno ne radi, možemo prikazati
    poslednje poznate podatke.
*/

function saveFootballCache(data) {

    try {

        const cache = {

            timestamp: Date.now(),

            data: data

        };

        localStorage.setItem(
            "fkObilicFootballData",
            JSON.stringify(cache)
        );

    }

    catch (error) {

        console.warn(
            "Није могуће сачувати фудбалске податке.",
            error
        );

    }

}



/*
    Učitavanje podataka iz cache-a.
*/

function getFootballCache() {

    try {

        const cached =
            localStorage.getItem(
                "fkObilicFootballData"
            );


        if (!cached) {

            return null;

        }


        const parsed =
            JSON.parse(cached);


        if (
            !parsed.timestamp ||
            !parsed.data
        ) {

            return null;

        }


        return parsed;

    }

    catch (error) {

        console.warn(
            "Грешка приликом читања сачуваних података.",
            error
        );

        return null;

    }

}



/*
    Proveravamo da li je cache još svež.
*/

function isCacheValid(cache) {

    if (!cache) {

        return false;

    }


    const age =
        Date.now() - cache.timestamp;


    return (
        age < FOOTBALL_CONFIG.cacheTime
    );

}



/* =========================================================
   GLAVNO UČITAVANJE PODATAKA
========================================================= */

async function loadFootballData() {

    /*
        Prvo proveravamo da li već imamo
        sveže podatke u browseru.
    */

    const cached =
        getFootballCache();


    if (isCacheValid(cached)) {

        renderFootballData(
            cached.data
        );

        return;

    }


    /*
        Ako nemamo sveže podatke,
        tražimo ih od našeg API-ja.
    */

    try {

        const url =
            `${FOOTBALL_CONFIG.apiUrl}` +
            `?league=${FOOTBALL_CONFIG.leagueId}` +
            `&club=${FOOTBALL_CONFIG.clubId}`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data =
            await response.json();


        /*
            Ako API vrati grešku.
        */

        if (data.success === false) {

            throw new Error(
                data.error ||
                "Подаци нису доступни."
            );

        }


        /*
            Čuvamo uspešno preuzete podatke.
        */

        saveFootballCache(data);


        /*
            Prikazujemo ih na stranici.
        */

        renderFootballData(data);

    }

    catch (error) {

        console.error(
            "Грешка при учитавању фудбалских података:",
            error
        );


        /*
            Ako API trenutno ne radi,
            pokušavamo da prikažemo
            poslednje sačuvane podatke.
        */

        if (cached && cached.data) {

            renderFootballData(
                cached.data
            );

            showCachedDataNotice();

            return;

        }


        /*
            Ako nemamo ni cache,
            prikazujemo poruku o grešci.
        */

        showFootballError();

    }

}



/* =========================================================
   PRIKAZ SVIH PODATAKA
========================================================= */

function renderFootballData(data) {

    if (!data) {

        return;

    }


    /* TABELA */

    if (
        Array.isArray(data.standings)
    ) {

        renderStandings(
            data.standings
        );

    }


    /* POSLEDNJA UTAKMICA */

    if (data.lastMatch) {

        renderLastMatch(
            data.lastMatch
        );

    }


    /* SLEDEĆA UTAKMICA */

    if (data.nextMatch) {

        renderNextMatch(
            data.nextMatch
        );

    }


    /* SVE UTAKMICE */

    if (
        Array.isArray(data.matches)
    ) {

        renderMatches(
            data.matches
        );

    }


    /* VREME AŽURIRANJA */

    updateFootballTimestamp(
        data.updatedAt
    );

}



/* =========================================================
   TABELA
========================================================= */

function renderStandings(teams) {

    const container =
        document.querySelector(
            "#standings-data"
        );


    /*
        Ako se tabela ne nalazi na trenutnoj
        stranici, ništa ne radimo.
    */

    if (!container) {

        return;

    }


    /*
        Ako nema podataka.
    */

    if (
        !Array.isArray(teams) ||
        teams.length === 0
    ) {

        container.innerHTML = `

            <div class="football-error">

                <strong>
                    Табела тренутно није доступна.
                </strong>

            </div>

        `;

        return;

    }


    container.innerHTML =
        teams.map((team, index) => {

            const obilic =
                isObilic(team.name);


            const position =
                team.position ??
                index + 1;


            return `

                <div
                    class="
                        standings-row
                        ${obilic ? "obilic-row" : ""}
                    "
                >

                    <div class="col-position">

                        ${position}

                    </div>


                    <div class="col-team">

                        ${
                            obilic
                            ? `

                                <img
                                    src="images/grb.png"
                                    class="table-club-logo"
                                    alt="ФК Обилић"
                                >

                            `
                            : ""
                        }


                        <span>

                            ${team.name ?? "-"}

                        </span>

                    </div>


                    <div>

                        ${team.played ?? "-"}

                    </div>


                    <div>

                        ${team.wins ?? "-"}

                    </div>


                    <div>

                        ${team.draws ?? "-"}

                    </div>


                    <div>

                        ${team.losses ?? "-"}

                    </div>


                    <div class="desktop-stat">

                        ${team.goalDifference ?? "-"}

                    </div>


                    <div>

                        <strong>

                            ${team.points ?? "-"}

                        </strong>

                    </div>

                </div>

            `;

        }).join("");

}



/* =========================================================
   POSLEDNJA UTAKMICA
========================================================= */

function renderLastMatch(match) {

    const container =
        document.querySelector(
            "#last-match"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <span class="match-label">

            ПОСЛЕДЊА УТАКМИЦА

        </span>


        <div class="match-date">

            ${match.date ?? ""}

        </div>


        <div class="match-teams">


            <div
                class="
                    match-team
                    ${isObilic(match.home) ? "our-team" : ""}
                "
            >

                ${match.home ?? "-"}

            </div>


            <div class="match-score">

                <strong>

                    ${match.homeScore ?? "-"}

                </strong>


                <span>

                    :

                </span>


                <strong>

                    ${match.awayScore ?? "-"}

                </strong>

            </div>


            <div
                class="
                    match-team
                    ${isObilic(match.away) ? "our-team" : ""}
                "
            >

                ${match.away ?? "-"}

            </div>


        </div>


        <span class="match-finished">

            ЗАВРШЕНО

        </span>

    `;

}



/* =========================================================
   SLEDEĆA UTAKMICA
========================================================= */

function renderNextMatch(match) {

    const container =
        document.querySelector(
            "#next-match"
        );


    if (!container) {

        return;

    }


    container.innerHTML = `

        <span class="match-label">

            СЛЕДЕЋА УТАКМИЦА

        </span>


        <div class="match-date">

            ${match.date ?? ""}

            ${
                match.time
                ? ` • ${match.time}`
                : ""
            }

        </div>


        <div class="match-teams">


            <div
                class="
                    match-team
                    ${isObilic(match.home) ? "our-team" : ""}
                "
            >

                ${match.home ?? "-"}

            </div>


            <div class="match-vs">

                VS

            </div>


            <div
                class="
                    match-team
                    ${isObilic(match.away) ? "our-team" : ""}
                "
            >

                ${match.away ?? "-"}

            </div>


        </div>


        ${
            match.location
            ? `

                <div class="match-location">

                    ${match.location}

                </div>

            `
            : ""
        }

    `;

}



/* =========================================================
   SVE UTAKMICE / RASPORED
========================================================= */

function renderMatches(matches) {

    const container =
        document.querySelector(
            "#matches-data"
        );


    if (!container) {

        return;

    }


    if (
        !Array.isArray(matches) ||
        matches.length === 0
    ) {

        container.innerHTML = `

            <div class="football-error">

                Распоред утакмица тренутно није доступан.

            </div>

        `;

        return;

    }


    container.innerHTML =
        matches.map((match) => {


            /*
                Ako postoje oba rezultata,
                utakmica je završena.
            */

            const finished =
                match.homeScore !== null &&
                match.homeScore !== undefined &&
                match.awayScore !== null &&
                match.awayScore !== undefined;


            return `

                <article class="fixture-row">


                    <div class="fixture-round">

                        ${match.round ?? ""}

                    </div>


                    <div class="fixture-date">

                        ${match.date ?? ""}

                        ${
                            match.time
                            ? `

                                <span>

                                    ${match.time}

                                </span>

                            `
                            : ""
                        }

                    </div>


                    <div
                        class="
                            fixture-team
                            ${isObilic(match.home) ? "our-team" : ""}
                        "
                    >

                        ${match.home ?? "-"}

                    </div>


                    <div class="fixture-result">


                        ${
                            finished

                            ? `

                                <strong>

                                    ${match.homeScore}

                                </strong>


                                <span>

                                    :

                                </span>


                                <strong>

                                    ${match.awayScore}

                                </strong>

                            `

                            : `

                                <span class="fixture-vs">

                                    VS

                                </span>

                            `
                        }


                    </div>


                    <div
                        class="
                            fixture-team
                            ${isObilic(match.away) ? "our-team" : ""}
                        "
                    >

                        ${match.away ?? "-"}

                    </div>


                </article>

            `;

        }).join("");

}



/* =========================================================
   DATUM POSLEDNJEG AŽURIRANJA
========================================================= */

function updateFootballTimestamp(
    updatedAt
) {

    const element =
        document.querySelector(
            "#football-updated"
        );


    if (
        !element ||
        !updatedAt
    ) {

        return;

    }


    element.textContent =
        `Последње ажурирање: ${updatedAt}`;

}



/* =========================================================
   OBAVEŠTENJE - CACHE
========================================================= */

function showCachedDataNotice() {

    const element =
        document.querySelector(
            "#football-updated"
        );


    if (!element) {

        return;

    }


    element.textContent =
        "Приказани су последњи доступни подаци.";

}



/* =========================================================
   GREŠKA
========================================================= */

function showFootballError() {


    /* TABELA */

    const standings =
        document.querySelector(
            "#standings-data"
        );


    if (standings) {

        standings.innerHTML = `

            <div class="football-error">

                <strong>

                    Подаци тренутно нису доступни.

                </strong>


                <span>

                    Покушајте поново нешто касније.

                </span>

            </div>

        `;

    }



    /* POSLEDNJA UTAKMICA */

    const lastMatch =
        document.querySelector(
            "#last-match"
        );


    if (lastMatch) {

        lastMatch.innerHTML = `

            <div class="football-error">

                Подаци о последњој утакмици
                тренутно нису доступни.

            </div>

        `;

    }



    /* SLEDEĆA UTAKMICA */

    const nextMatch =
        document.querySelector(
            "#next-match"
        );


    if (nextMatch) {

        nextMatch.innerHTML = `

            <div class="football-error">

                Подаци о следећој утакмици
                тренутно нису доступни.

            </div>

        `;

    }



    /* RASPORED */

    const matches =
        document.querySelector(
            "#matches-data"
        );


    if (matches) {

        matches.innerHTML = `

            <div class="football-error">

                Распоред утакмица
                тренутно није доступан.

            </div>

        `;

    }

}



/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadFootballData
);