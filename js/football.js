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
    Pretvaranje latinice u ćirilicu.
    Koristi se samo za prikaz na sajtu.
*/

function toCyrillic(text = "") {

    const map = {

        "Dž": "Џ",
        "Lj": "Љ",
        "Nj": "Њ",

        "dž": "џ",
        "lj": "љ",
        "nj": "њ",

        "A": "А",
        "B": "Б",
        "C": "Ц",
        "Č": "Ч",
        "Ć": "Ћ",
        "D": "Д",
        "Đ": "Ђ",
        "E": "Е",
        "F": "Ф",
        "G": "Г",
        "H": "Х",
        "I": "И",
        "J": "Ј",
        "K": "К",
        "L": "Л",
        "M": "М",
        "N": "Н",
        "O": "О",
        "P": "П",
        "R": "Р",
        "S": "С",
        "Š": "Ш",
        "T": "Т",
        "U": "У",
        "V": "В",
        "Z": "З",
        "Ž": "Ж",

        "a": "а",
        "b": "б",
        "c": "ц",
        "č": "ч",
        "ć": "ћ",
        "d": "д",
        "đ": "ђ",
        "e": "е",
        "f": "ф",
        "g": "г",
        "h": "х",
        "i": "и",
        "j": "ј",
        "k": "к",
        "l": "л",
        "m": "м",
        "n": "н",
        "o": "о",
        "p": "п",
        "r": "р",
        "s": "с",
        "š": "ш",
        "t": "т",
        "u": "у",
        "v": "в",
        "z": "з",
        "ž": "ж"

    };


    return String(text)

        .replace(
            /Dž|Lj|Nj|dž|lj|nj/g,
            match => map[match]
        )

        .split("")

        .map(
            character =>
                map[character] ?? character
        )

        .join("");

}



/*
    Normalizuje naziv kluba.
*/

function normalizeClubName(name = "") {

    return String(name)

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

    const normalized =
        normalizeClubName(name);

    return (

        normalized.includes("obilic") ||

        String(name)
            .toLowerCase()
            .includes("обилић")

    );

}



/*
    Formatiranje datuma.
*/

function formatMatchDate(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


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
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            timeZone: "Europe/Belgrade"
        }
    ).format(date);

}



/*
    Formatiranje vremena.
*/

function formatMatchTime(dateString) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


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
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Europe/Belgrade"
        }
    ).format(date);

}



/* =========================================================
   CACHE
========================================================= */

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

    const cached =
        getFootballCache();


    /*
        Ako imamo sveže podatke,
        odmah ih prikazujemo.
    */

    if (isCacheValid(cached)) {

        renderFootballData(
            cached.data
        );

        return;

    }


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


        if (data.success === false) {

            throw new Error(

                data.error ||
                "Подаци нису доступни."

            );

        }


        saveFootballCache(data);


        renderFootballData(data);

    }

    catch (error) {

        console.error(

            "Грешка при учитавању фудбалских података:",

            error

        );


        /*
            Ako API trenutno ne radi,
            koristimo poslednje poznate podatke.
        */

        if (
            cached &&
            cached.data
        ) {

            renderFootballData(
                cached.data
            );

            showCachedDataNotice();

            return;

        }


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
        Array.isArray(
            data.standings
        )
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


    /* UTAKMICE */

    if (
        Array.isArray(
            data.matches
        )
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


    if (!container) {

        return;

    }


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
        teams.map(
            (team, index) => {


                /*
                    Obilić prvenstveno prepoznajemo
                    preko Srbijasport ID-a.
                */

                const obilic =

                    Number(team.clubId) ===
                        FOOTBALL_CONFIG.clubId ||

                    team.isObilic === true ||

                    isObilic(team.team);


                const position =
                    team.position ??
                    index + 1;


                /*
                    Gol razlika.
                */

                let goalDifference =
                    team.goalDifference ?? 0;


                if (
                    Number(goalDifference) > 0
                ) {

                    goalDifference =
                        `+${goalDifference}`;

                }


                /*
                    Naziv i mesto prebacujemo
                    na ćirilicu.
                */

                const teamName =
                    toCyrillic(
                        team.team ?? "-"
                    );


                const city =
                    toCyrillic(
                        team.city ?? ""
                    );


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


                            <div class="table-team-info">

                                <strong>

                                    ${teamName}

                                </strong>


                                ${
                                    city
                                    ? `

                                        <span
                                            class="table-team-city"
                                        >

                                            ${city}

                                        </span>

                                    `
                                    : ""
                                }

                            </div>

                        </div>


                        <div>

                            ${team.played ?? "-"}

                        </div>


                        <div>

                            ${team.won ?? "-"}

                        </div>


                        <div>

                            ${team.drawn ?? "-"}

                        </div>


                        <div>

                            ${team.lost ?? "-"}

                        </div>


                        <div class="desktop-stat">

                            ${goalDifference}

                        </div>


                        <div class="col-points">

                            <strong>

                                ${team.points ?? "-"}

                            </strong>

                        </div>

                    </div>

                `;

            }

        ).join("");

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


    const date =
        formatMatchDate(
            match.startDate
        );


    const home =
        toCyrillic(
            match.home ?? "-"
        );


    const away =
        toCyrillic(
            match.away ?? "-"
        );


    container.innerHTML = `

        <span class="match-label">

            ПОСЛЕДЊА УТАКМИЦА

        </span>


        <div class="match-date">

            ${date}

        </div>


        <div class="match-teams">


            <div
                class="
                    match-team
                    ${isObilic(match.home) ? "our-team" : ""}
                "
            >

                ${home}

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

                ${away}

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


    const date =
        formatMatchDate(
            match.startDate
        );


    const time =
        formatMatchTime(
            match.startDate
        );


    const home =
        toCyrillic(
            match.home ?? "-"
        );


    const away =
        toCyrillic(
            match.away ?? "-"
        );


    const location =
        toCyrillic(
            match.location ?? ""
        );


    container.innerHTML = `

        <span class="match-label">

            СЛЕДЕЋА УТАКМИЦА

        </span>


        <div class="match-date">

            ${date}

            ${
                time
                ? ` • ${time}`
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

                ${home}

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

                ${away}

            </div>


        </div>


        ${
            location
            ? `

                <div class="match-location">

                    ${location}

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
        matches.map(
            match => {


                const finished =

                    match.homeScore !== null &&
                    match.homeScore !== undefined &&

                    match.awayScore !== null &&
                    match.awayScore !== undefined;


                const date =
                    formatMatchDate(
                        match.startDate
                    );


                const time =
                    formatMatchTime(
                        match.startDate
                    );


                const home =
                    toCyrillic(
                        match.home ?? "-"
                    );


                const away =
                    toCyrillic(
                        match.away ?? "-"
                    );


                return `

                    <article class="fixture-row">


                        <div class="fixture-round">

                            ${
                                match.round
                                    ? toCyrillic(match.round)
                                    : ""
                            }

                        </div>


                        <div class="fixture-date">

                            ${date}

                            ${
                                time
                                ? `

                                    <span>

                                        ${time}

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

                            ${home}

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

                            ${away}

                        </div>


                    </article>

                `;

            }

        ).join("");

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


    const date =
        new Date(updatedAt);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return;

    }


    const formatted =
        new Intl.DateTimeFormat(
            "sr-Cyrl-RS",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Europe/Belgrade"
            }
        ).format(date);


    element.textContent =
        `Последње ажурирање: ${formatted}`;

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