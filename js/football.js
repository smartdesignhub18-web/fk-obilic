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
   apiUrl: "data/football.json",

    // Keširanje podataka - 2 minuta
    cacheTime: 2 * 60 * 1000
};

const CLUB_LOGOS = {
    "Обилић": "images/grbovi/obilic.webp",
    "Obilić": "images/grbovi/obilic.webp",

    "Потисје": "images/grbovi/potisje.webp",
    "Potisje": "images/grbovi/potisje.webp",

    "Ђала 1922": "images/grbovi/djala-1922.webp",
    "Đala 1922": "images/grbovi/djala-1922.webp",

    "Хоргош 1911": "images/grbovi/horgos-1911.webp",
    "Horgoš 1911": "images/grbovi/horgos-1911.webp",

    "Бачка": "images/grbovi/backa.webp",
    "Bačka": "images/grbovi/backa.webp",

    "Јединство (СК)": "images/grbovi/jedinstvo-sk.webp",
    "Jedinstvo (SK)": "images/grbovi/jedinstvo-sk.webp",

    "Славија": "images/grbovi/slavija.webp",
    "Slavija": "images/grbovi/slavija.webp",

    "Слога (О)": "images/grbovi/sloga-o.webp",
    "Sloga (O)": "images/grbovi/sloga-o.webp",

    "Шампион": "images/grbovi/sampion.webp",
    "Šampion": "images/grbovi/sampion.webp",

    "Тиса": "images/grbovi/tisa.webp",
    "Tisa": "images/grbovi/tisa.webp",

    "Јадран": "images/grbovi/jadran.webp",
    "Jadran": "images/grbovi/jadran.webp",

    "Тромеђа": "images/grbovi/tromedja.webp",
    "Tromeđa": "images/grbovi/tromedja.webp",

    "Јединство (М)": "images/grbovi/jedinstvo-m.webp",
    "Jedinstvo (M)": "images/grbovi/jedinstvo-m.webp"
};

function getClubLogo(teamName) {
    return CLUB_LOGOS[teamName] || "images/grbovi/default.webp";
}





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
    FOOTBALL_CONFIG.apiUrl;


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
                    Prepoznavanje Obilića.
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
                    Naziv i mesto na ćirilici.
                */

                const teamName =
                    toCyrillic(
                        team.team ?? "-"
                    );


                const city =
                    toCyrillic(
                        team.city ?? ""
                    );


                /*
                    Grb kluba.
                */

                const clubLogo =
                    getClubLogo(
                        teamName
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


                            <img
                                src="${clubLogo}"
                                class="table-club-logo"
                                alt="${teamName}"
                                onerror="this.style.display='none'"
                            >


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
        document.querySelector("#last-match");

    if (!container) {
        return;
    }

    const date =
        formatMatchDate(match.startDate);

    const home =
        toCyrillic(match.home ?? "-");

    const away =
        toCyrillic(match.away ?? "-");

    const homeLogo =
        getClubLogo(match.home);

    const awayLogo =
        getClubLogo(match.away);

    const hasScore =
        match.homeScore !== null &&
        match.homeScore !== undefined &&
        match.awayScore !== null &&
        match.awayScore !== undefined;

    container.innerHTML = `

        <div class="featured-match-top">

            <span class="match-date">
                ${date || "ДАТУМ НИЈЕ ДОСТУПАН"}
            </span>

            <span class="match-status-finished">
                ЗАВРШЕНО
            </span>

        </div>


        <div class="featured-match-teams">

            <!-- DOMAĆIN -->

            <div class="featured-team">

                <div class="featured-logo-wrap">

                    <img
                        src="${homeLogo}"
                        alt="${home}"
                        class="featured-club-logo"
                        onerror="this.src='images/grbovi/default.webp'"
                    >

                </div>

                <strong>
                    ${home}
                </strong>

                <span>
                    ДОМАЋИН
                </span>

            </div>


            <!-- REZULTAT -->

            <div class="featured-match-center">

                ${
                    hasScore
                        ? `
                            <div class="featured-score">

                                <strong>
                                    ${match.homeScore}
                                </strong>

                                <span>:</span>

                                <strong>
                                    ${match.awayScore}
                                </strong>

                            </div>
                        `
                        : `
                            <span class="featured-vs">
                                —
                            </span>
                        `
                }

            </div>


            <!-- GOST -->

            <div class="featured-team">

                <div class="featured-logo-wrap">

                    <img
                        src="${awayLogo}"
                        alt="${away}"
                        class="featured-club-logo"
                        onerror="this.src='images/grbovi/default.webp'"
                    >

                </div>

                <strong>
                    ${away}
                </strong>

                <span>
                    ГОСТ
                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   SLEDEĆA UTAKMICA
========================================================= */

function renderNextMatch(match) {

    const container =
        document.querySelector("#next-match");

    if (!container) {
        return;
    }

    const date =
        formatMatchDate(match.startDate);

    const time =
        formatMatchTime(match.startDate);

    const home =
        toCyrillic(match.home ?? "-");

    const away =
        toCyrillic(match.away ?? "-");

    const homeLogo =
        getClubLogo(match.home);

    const awayLogo =
        getClubLogo(match.away);

    const location =
        toCyrillic(match.location ?? "");

    container.innerHTML = `

        <div class="featured-match-top">

            <span class="match-date">
                ${date || "ТЕРМИН НИЈЕ ОДРЕЂЕН"}
                ${time ? ` • ${time}` : ""}
            </span>

        </div>


        <div class="featured-match-teams">

            <div class="featured-team">

                <div class="featured-logo-wrap">

                    <img
                        src="${homeLogo}"
                        alt="${home}"
                        class="featured-club-logo"
                        onerror="this.src='images/grbovi/default.webp'"
                    >

                </div>

                <strong>
                    ${home}
                </strong>

                <span>
                    ДОМАЋИН
                </span>

            </div>


            <div class="featured-match-center">

                <span class="featured-vs">
                    VS
                </span>

            </div>


            <div class="featured-team">

                <div class="featured-logo-wrap">

                    <img
                        src="${awayLogo}"
                        alt="${away}"
                        class="featured-club-logo"
                        onerror="this.src='images/grbovi/default.webp'"
                    >

                </div>

                <strong>
                    ${away}
                </strong>

                <span>
                    ГОСТ
                </span>

            </div>

        </div>


        ${
            location
                ? `
                    <div class="featured-match-location">
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
        document.querySelector("#matches-data");

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
        matches.map(match => {

            const finished =
                match.homeScore !== null &&
                match.homeScore !== undefined &&
                match.awayScore !== null &&
                match.awayScore !== undefined;


            const date =
                formatMatchDate(match.startDate);

            const time =
                formatMatchTime(match.startDate);


            const home =
                toCyrillic(match.home ?? "-");

            const away =
                toCyrillic(match.away ?? "-");


            const homeLogo =
                getClubLogo(match.home);

            const awayLogo =
                getClubLogo(match.away);


            const round =
                match.round
                    ? toCyrillic(match.round)
                    : "";


            return `

                <article class="
                    fixture-row
                    ${finished ? "fixture-finished" : "fixture-scheduled"}
                ">


                    <!-- KOLO -->

                    <div class="fixture-round">

                        ${
                            round
                                ? `<span>${round}</span>`
                                : `<span>—</span>`
                        }

                    </div>


                    <!-- DATUM -->

                    <div class="fixture-date">

                        ${
                            date
                                ? `
                                    <strong>
                                        ${date}
                                    </strong>

                                    ${
                                        time
                                            ? `
                                                <span>
                                                    ${time}
                                                </span>
                                            `
                                            : ""
                                    }
                                `
                                : `
                                    <span class="fixture-date-pending">
                                        ТЕРМИН НАКНАДНО
                                    </span>
                                `
                        }

                    </div>


                    <!-- DOMAĆIN -->

                    <div class="
                        fixture-team
                        fixture-home
                        ${isObilic(match.home) ? "our-team" : ""}
                    ">

                        <div class="fixture-team-name">

                            <strong>
                                ${home}
                            </strong>

                        </div>

                        <img
                            src="${homeLogo}"
                            alt="${home}"
                            class="fixture-club-logo"
                            onerror="this.src='images/grbovi/default.webp'"
                        >

                    </div>


                    <!-- REZULTAT / VS -->

                    <div class="fixture-result">

                        ${
                            finished
                                ? `
                                    <div class="fixture-score">

                                        <strong>
                                            ${match.homeScore}
                                        </strong>

                                        <span>:</span>

                                        <strong>
                                            ${match.awayScore}
                                        </strong>

                                    </div>
                                `
                                : `
                                    <span class="fixture-vs">
                                        VS
                                    </span>
                                `
                        }

                    </div>


                    <!-- GOST -->

                    <div class="
                        fixture-team
                        fixture-away
                        ${isObilic(match.away) ? "our-team" : ""}
                    ">

                        <img
                            src="${awayLogo}"
                            alt="${away}"
                            class="fixture-club-logo"
                            onerror="this.src='images/grbovi/default.webp'"
                        >

                        <div class="fixture-team-name">

                            <strong>
                                ${away}
                            </strong>

                        </div>

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