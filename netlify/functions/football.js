const LEAGUE_URL =
    "https://srbijasport.net/league/8794-potiska-medjuopstinska-liga";

const CLUB_URL =
    "https://srbijasport.net/club/787-obilic";

const AJAX_URL =
    "https://srbijasport.net/index.php?ajax";

const CLUB_ID = 787;
const CLUB_NAME = "Obilić";

const REQUEST_HEADERS = {
    "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",

    "Accept":
        "text/html,application/xhtml+xml,application/json",

    "Accept-Language":
        "sr-RS,sr;q=0.9,en-US;q=0.8,en;q=0.7,hr;q=0.6"
};


/* ==================================================
   POMOĆNE FUNKCIJE
================================================== */

function decodeHtml(value = "") {
    return String(value)
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#039;/gi, "'")
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&#9650;/gi, "▲")
        .replace(/&#9660;/gi, "▼");
}


function cleanText(value = "") {
    return decodeHtml(value)
        .replace(/<[^>]*>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


function escapeRegex(value = "") {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


function getCell(row, className) {
    const regex = new RegExp(
        `<td[^>]*class=["'][^"']*${escapeRegex(className)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
        "i"
    );

    const match = row.match(regex);

    return match
        ? cleanText(match[1])
        : "";
}


function isObilicName(name = "") {
    return String(name)
        .toLocaleLowerCase("sr-Latn")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .includes("obilic");
}


function absoluteUrl(url = "") {
    if (!url) {
        return "";
    }

    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    return `https://srbijasport.net${
        url.startsWith("/") ? "" : "/"
    }${url}`;
}


/* ==================================================
   TABELA
================================================== */

function parseStandings(html) {
    const standings = [];

    const rowRegex =
        /<tr[^>]*data-club-id=["'](\d+)["'][^>]*>([\s\S]*?)<\/tr>/gi;

    let match;

    while (
        (match = rowRegex.exec(html)) !== null
    ) {
        const clubId =
            Number(match[1]);

        const row =
            match[2];

        const positionMatch =
            row.match(
                /<span[^>]*class=["'][^"']*pos-deleg[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
            );

        const teamMatch =
            row.match(
                /<div[^>]*class=["'][^"']*team-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
            );

        const cityMatch =
            row.match(
                /<div[^>]*class=["'][^"']*team-city[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
            );

        const pointsMatch =
            row.match(
                /<div[^>]*class=["'][^"']*pts-wrapper[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
            );

        if (!teamMatch) {
            continue;
        }

        const position =
            positionMatch
                ? Number(
                    cleanText(
                        positionMatch[1]
                    )
                )
                : null;

        const team =
            cleanText(
                teamMatch[1]
            );

        const city =
            cityMatch
                ? cleanText(
                    cityMatch[1]
                )
                : "";

        const played =
            Number(
                getCell(
                    row,
                    "col-UTAKM"
                )
            ) || 0;

        const won =
            Number(
                getCell(
                    row,
                    "col-POB"
                )
            ) || 0;

        const drawn =
            Number(
                getCell(
                    row,
                    "col-NER"
                )
            ) || 0;

        const lost =
            Number(
                getCell(
                    row,
                    "col-POR"
                )
            ) || 0;

        const goalsFor =
            Number(
                getCell(
                    row,
                    "col-DG"
                )
            ) || 0;

        const goalsAgainst =
            Number(
                getCell(
                    row,
                    "col-PG"
                )
            ) || 0;

        const goalDifferenceText =
            getCell(
                row,
                "col-GR"
            );

        const goalDifference =
            Number(
                goalDifferenceText
                    .replace("+", "")
                    .replace("−", "-")
            ) || 0;

        const points =
            pointsMatch
                ? Number(
                    cleanText(
                        pointsMatch[1]
                    )
                ) || 0
                : 0;

        standings.push({
            position,
            clubId,
            team,
            city,
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            goalDifference,
            points,
            isObilic:
                clubId === CLUB_ID
        });
    }

    return standings.sort(
        (a, b) =>
            (a.position || 999) -
            (b.position || 999)
    );
}


/* ==================================================
   DATUMI
================================================== */

function parseSerbianDate(
    dateText,
    timeText = ""
) {
    if (!dateText) {
        return null;
    }

    const match =
        String(dateText).match(
            /(\d{1,2})\.(\d{1,2})\.(\d{4})/
        );

    if (!match) {
        return null;
    }

    const day =
        match[1].padStart(
            2,
            "0"
        );

    const month =
        match[2].padStart(
            2,
            "0"
        );

    const year =
        match[3];

    let hour = "00";
    let minute = "00";

    const timeMatch =
        String(timeText).match(
            /(\d{1,2}):(\d{2})/
        );

    if (timeMatch) {
        hour =
            timeMatch[1].padStart(
                2,
                "0"
            );

        minute =
            timeMatch[2];
    }

    return (
        `${year}-${month}-${day}` +
        `T${hour}:${minute}:00`
    );
}


/* ==================================================
   UTAKMICE SA STRANICE KLUBA
================================================== */

function splitGameRows(html) {
    const starts = [];

    const startRegex =
        /<div\b(?=[^>]*\bclass=["'][^"']*\bgame-row\b[^"']*["'])(?=[^>]*\bdata-id=["']\d+["'])[^>]*>/gi;

    let match;

    while (
        (match =
            startRegex.exec(html)) !== null
    ) {
        starts.push(
            match.index
        );
    }

    const blocks = [];

    for (
        let i = 0;
        i < starts.length;
        i++
    ) {
        const start =
            starts[i];

        const end =
            i + 1 < starts.length
                ? starts[i + 1]
                : Math.min(
                    html.length,
                    start + 15000
                );

        blocks.push(
            html.substring(
                start,
                end
            )
        );
    }

    return blocks;
}


function extractTeam(
    block,
    className
) {
    const regex =
        new RegExp(
            `<div[^>]*class=["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
            "i"
        );

    const match =
        block.match(regex);

    return match
        ? cleanText(
            match[1]
        )
        : "";
}


function extractScore(
    block,
    className
) {
    const regex =
        new RegExp(
            `<div[^>]*class=["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>[\\s\\S]*?<div[^>]*class=["'][^"']*text-base[^"']*["'][^>]*>\\s*([^<]+)\\s*<\\/div>`,
            "i"
        );

    const match =
        block.match(regex);

    if (!match) {
        return null;
    }

    const value =
        Number(
            cleanText(
                match[1]
            )
        );

    return Number.isFinite(value)
        ? value
        : null;
}


function parseClubGames(
    html,
    forcedStatus = null
) {
    const games = [];

    const blocks =
        splitGameRows(html);

    for (const block of blocks) {

        const idMatch =
            block.match(
                /\bdata-id=["'](\d+)["']/i
            );

        if (!idMatch) {
            continue;
        }

        const id =
            Number(
                idMatch[1]
            );

        const urlMatch =
            block.match(
                /onclick=["'][^"']*location\.href\s*=\s*['"]([^'"]+)['"]/i
            ) ||
            block.match(
                /onkeydown=["'][^"']*location\.href\s*=\s*['"]([^'"]+)['"]/i
            );

        const dateMatch =
            block.match(
                /<div[^>]*class=["'][^"']*hidden\s+sm:block[^"']*["'][^>]*>\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*<\/div>/i
            );

        let timeText = "";

        if (dateMatch) {
            const afterDate =
                block.substring(
                    dateMatch.index,
                    dateMatch.index +
                        1000
                );

            const timeMatch =
                afterDate.match(
                    /(\d{1,2}:\d{2})/
                );

            if (timeMatch) {
                timeText =
                    timeMatch[1];
            }
        }

        const home =
            extractTeam(
                block,
                "team-host"
            );

        const away =
            extractTeam(
                block,
                "team-guest"
            );

        if (
            !home ||
            !away
        ) {
            continue;
        }

        if (
            !isObilicName(home) &&
            !isObilicName(away)
        ) {
            continue;
        }

        const homeScore =
            extractScore(
                block,
                "res-host"
            );

        const awayScore =
            extractScore(
                block,
                "res-guest"
            );

        const hasScore =
            homeScore !== null &&
            awayScore !== null;

        let status =
            forcedStatus;

        if (!status) {
            status =
                hasScore
                    ? "finished"
                    : "scheduled";
        }

        if (
            status === "finished" &&
            !hasScore
        ) {
            status =
                "unknown";
        }

        games.push({
            id,

            round: null,

            home,

            away,

            startDate:
                dateMatch
                    ? parseSerbianDate(
                        dateMatch[1],
                        timeText
                    )
                    : null,

            location: "",

            url:
                urlMatch
                    ? absoluteUrl(
                        urlMatch[1]
                    )
                    : "",

            homeScore,

            awayScore,

            status
        });
    }

    const unique =
        new Map();

    for (
        const game of games
    ) {
        unique.set(
            game.id,
            game
        );
    }

    return [
        ...unique.values()
    ];
}


/* ==================================================
   SF AJAX PODACI
================================================== */

function getHiddenInput(
    html,
    name
) {
    const escapedName =
        escapeRegex(name);

    const regex1 =
        new RegExp(
            `<input[^>]*\\bname=["']${escapedName}["'][^>]*\\bvalue=["']([^"']*)["'][^>]*>`,
            "i"
        );

    const regex2 =
        new RegExp(
            `<input[^>]*\\bvalue=["']([^"']*)["'][^>]*\\bname=["']${escapedName}["'][^>]*>`,
            "i"
        );

    const match =
        html.match(regex1) ||
        html.match(regex2);

    return match
        ? decodeHtml(
            match[1]
        )
        : "";
}


function getClubGamesFormHtml(
    html
) {
    const componentIndex =
        html.indexOf(
            'id="club_games"'
        );

    if (
        componentIndex === -1
    ) {
        return html;
    }

    return html.substring(
        componentIndex,
        Math.min(
            html.length,
            componentIndex +
                100000
        )
    );
}


function getAjaxState(
    clubHtml
) {
    const formHtml =
        getClubGamesFormHtml(
            clubHtml
        );

    const sfView =
        getHiddenInput(
            formHtml,
            "sf_view"
        );

    const sfViewId =
        getHiddenInput(
            formHtml,
            "sf_view_id"
        );

    const sfStateId =
        getHiddenInput(
            formHtml,
            "sf_state_id"
        );

    const sfStateData =
        getHiddenInput(
            formHtml,
            "sf_state_data"
        );

    const sfStateStore =
        getHiddenInput(
            formHtml,
            "sf_state_store"
        ) || "client";

    const sfAjaxKey =
        getHiddenInput(
            formHtml,
            "sf_ajax_key"
        );

    if (
        !sfView ||
        !sfViewId ||
        !sfStateId ||
        !sfStateData ||
        !sfAjaxKey
    ) {
        throw new Error(
            "Nisu pronađeni svi Srbijasport AJAX parametri."
        );
    }

    return {
        sfView,
        sfViewId,
        sfStateId,
        sfStateData,
        sfStateStore,
        sfAjaxKey
    };
}


/* ==================================================
   SESSION COOKIE
================================================== */

function getSessionCookie(
    response
) {
    let setCookies = [];

    if (
        response &&
        response.headers &&
        typeof response.headers
            .getSetCookie ===
            "function"
    ) {
        setCookies =
            response.headers
                .getSetCookie();

    } else if (
        response &&
        response.headers
    ) {
        const single =
            response.headers.get(
                "set-cookie"
            );

        if (single) {
            setCookies = [
                single
            ];
        }
    }

    const cookiePairs = [];

    for (
        const cookie of
            setCookies
    ) {
        const firstPart =
            String(cookie)
                .split(";")[0]
                .trim();

        if (firstPart) {
            cookiePairs.push(
                firstPart
            );
        }
    }

    return cookiePairs.join(
        "; "
    );
}


/* ==================================================
   AJAX: PLANIRANE UTAKMICE
================================================== */

async function fetchScheduledGames(
    clubHtml,
    sessionCookie = ""
) {
    const state =
        getAjaxState(
            clubHtml
        );

    const formData =
        new URLSearchParams();

    formData.set(
        "sf_view",
        state.sfView
    );

    formData.set(
        "sf_view_id",
        state.sfViewId
    );

    formData.set(
        "sf_state_id",
        state.sfStateId
    );

    formData.set(
        "sf_state_data",
        state.sfStateData
    );

    formData.set(
        "sf_state_store",
        state.sfStateStore
    );

    formData.set(
        "sf_ajax_key",
        state.sfAjaxKey
    );

    const body =
        new URLSearchParams();

    body.set(
        "sf_source",
        ""
    );

    body.set(
        "sf_form_data",
        formData.toString()
    );

    body.set(
        "sf_action",
        "#[$view->switchTab('scheduled')]"
    );

    const response =
        await fetch(
            AJAX_URL,
            {
                method:
                    "POST",

                headers: {
                    ...REQUEST_HEADERS,

                    "Accept":
                        "application/json, text/javascript, */*; q=0.01",

                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8",

                    "X-Requested-With":
                        "XMLHttpRequest",

                    "sf-ajax-key":
                        state.sfAjaxKey,

                    "Referer":
                        CLUB_URL,

                    "Origin":
                        "https://srbijasport.net",

                    ...(sessionCookie
                        ? {
                            "Cookie":
                                sessionCookie
                        }
                        : {})
                },

                body:
                    body.toString()
            }
        );

    if (!response.ok) {
        throw new Error(
            `Srbijasport AJAX greška: ${response.status}`
        );
    }

    return await response.text();
}


/* ==================================================
   AJAX ODGOVOR
================================================== */

function collectHtmlStrings(
    value,
    result = []
) {
    if (
        typeof value ===
        "string"
    ) {
        if (
            value.includes(
                "game-row"
            ) ||
            value.includes(
                "team-host"
            ) ||
            value.includes(
                "team-guest"
            ) ||
            value.includes(
                "club_games"
            )
        ) {
            result.push(
                value
            );
        }

        return result;
    }

    if (
        Array.isArray(value)
    ) {
        for (
            const item of value
        ) {
            collectHtmlStrings(
                item,
                result
            );
        }

        return result;
    }

    if (
        value &&
        typeof value ===
            "object"
    ) {
        for (
            const item of
                Object.values(value)
        ) {
            collectHtmlStrings(
                item,
                result
            );
        }
    }

    return result;
}


/*
 * OVDE JE GLAVNA ISPRAVKA.
 *
 * Srbijasport AJAX odgovor je JSON koji u sebi
 * sadrži HTML.
 *
 * Zato PRVO radimo JSON.parse(), pa tek onda
 * izvlačimo HTML.
 */
function extractScheduledHtml(
    responseText
) {
    try {
        const data =
            JSON.parse(
                responseText
            );

        const htmlParts =
            collectHtmlStrings(
                data
            );

        if (
            htmlParts.length
        ) {
            return htmlParts.join(
                "\n"
            );
        }

    } catch (error) {
        /*
         * Ako odgovor nije JSON,
         * proverićemo direktan HTML.
         */
    }

    if (
        responseText.includes(
            "game-row"
        ) &&
        responseText.includes(
            "team-host"
        )
    ) {
        return responseText;
    }

    return "";
}


/* ==================================================
   SPAJANJE UTAKMICA
================================================== */

function mergeMatches(
    playedMatches,
    scheduledMatches
) {
    const map =
        new Map();

    for (
        const match of [
            ...playedMatches,
            ...scheduledMatches
        ]
    ) {
        const key =
            match.id ||
            `${match.home}|${match.away}|${match.startDate}`;

        if (
            !map.has(key)
        ) {
            map.set(
                key,
                match
            );

            continue;
        }

        const old =
            map.get(key);

        if (
            match.status ===
                "finished" &&
            old.status !==
                "finished"
        ) {
            map.set(
                key,
                match
            );
        }
    }

    return [
        ...map.values()
    ].sort(
        (a, b) => {
            const dateA =
                a.startDate
                    ? new Date(
                        a.startDate
                    ).getTime()
                    : Number
                        .MAX_SAFE_INTEGER;

            const dateB =
                b.startDate
                    ? new Date(
                        b.startDate
                    ).getTime()
                    : Number
                        .MAX_SAFE_INTEGER;

            return (
                dateA -
                dateB
            );
        }
    );
}


function findPreviousAndNextMatch(
    matches
) {
    const finished =
        matches
            .filter(
                match =>
                    match.status ===
                    "finished"
            )
            .sort(
                (a, b) =>
                    new Date(
                        a.startDate || 0
                    ).getTime() -
                    new Date(
                        b.startDate || 0
                    ).getTime()
            );

    const scheduled =
        matches
            .filter(
                match =>
                    match.status ===
                    "scheduled"
            )
            .sort(
                (a, b) => {
                    /*
                     * Dok nemamo datum iz scheduled
                     * odgovora, utakmice bez datuma
                     * ostaju na kraju.
                     */
                    if (
                        !a.startDate &&
                        !b.startDate
                    ) {
                        return 0;
                    }

                    if (
                        !a.startDate
                    ) {
                        return 1;
                    }

                    if (
                        !b.startDate
                    ) {
                        return -1;
                    }

                    return (
                        new Date(
                            a.startDate
                        ).getTime() -
                        new Date(
                            b.startDate
                        ).getTime()
                    );
                }
            );

    const lastMatch =
        finished.length
            ? finished[
                finished.length - 1
            ]
            : null;

    const nextMatch =
        scheduled.length
            ? scheduled[0]
            : null;

    return {
        lastMatch,
        nextMatch
    };
}


/* ==================================================
   GLAVNA NETLIFY FUNKCIJA
================================================== */

exports.handler =
async function () {

    try {

        const [
            leagueResponse,
            clubResponse
        ] =
            await Promise.all([
                fetch(
                    LEAGUE_URL,
                    {
                        headers:
                            REQUEST_HEADERS
                    }
                ),

                fetch(
                    CLUB_URL,
                    {
                        headers:
                            REQUEST_HEADERS
                    }
                )
            ]);


        if (
            !leagueResponse.ok
        ) {
            throw new Error(
                `Srbijasport liga HTTP greška: ${leagueResponse.status}`
            );
        }


        if (
            !clubResponse.ok
        ) {
            throw new Error(
                `Srbijasport klub HTTP greška: ${clubResponse.status}`
            );
        }


        /*
         * Srbijasport postavlja PHPSESSID
         * prilikom otvaranja stranice kluba.
         */
        const sessionCookie =
            getSessionCookie(
                clubResponse
            );


        const [
            leagueHtml,
            clubHtml
        ] =
            await Promise.all([
                leagueResponse.text(),
                clubResponse.text()
            ]);


        /* ==============================
           TABELA
        ============================== */

        const standings =
            parseStandings(
                leagueHtml
            );


        /* ==============================
           ODIGRANE UTAKMICE
        ============================== */

        const playedMatches =
            parseClubGames(
                clubHtml,
                "finished"
            );


        /* ==============================
           PLANIRANE UTAKMICE
        ============================== */

        let scheduledMatches =
            [];

        let scheduledError =
            null;


        try {

            const scheduledResponseText =
                await fetchScheduledGames(
                    clubHtml,
                    sessionCookie
                );


            const scheduledHtml =
                extractScheduledHtml(
                    scheduledResponseText
                );


            scheduledMatches =
                parseClubGames(
                    scheduledHtml,
                    "scheduled"
                );


        } catch (error) {

            scheduledError =
                error.message;
        }


        /* ==============================
           SPAJANJE
        ============================== */

        const matches =
            mergeMatches(
                playedMatches,
                scheduledMatches
            );


        const {
            lastMatch,
            nextMatch
        } =
            findPreviousAndNextMatch(
                matches
            );


        const obilicStanding =
            standings.find(
                team =>
                    team.clubId ===
                    CLUB_ID
            ) || null;


        /* ==============================
           ODGOVOR
        ============================== */

        return {
            statusCode: 200,

            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "public, max-age=0, s-maxage=1800"
            },

            body:
                JSON.stringify(
                    {
                        success:
                            true,

                        source:
                            "srbijasport.net",

                        league: {
                            id: 8794,

                            name:
                                "Potiska međuopštinska liga"
                        },

                        club: {
                            id:
                                CLUB_ID,

                            name:
                                CLUB_NAME
                        },

                        updatedAt:
                            new Date()
                                .toISOString(),

                        obilicStanding,

                        standings,

                        matches,

                        lastMatch,

                        nextMatch,

                        debug: {
                            standingsFound:
                                standings.length,

                            playedMatchesFound:
                                playedMatches.length,

                            scheduledMatchesFound:
                                scheduledMatches.length,

                            totalMatchesFound:
                                matches.length,

                            sessionCookieFound:
                                Boolean(
                                    sessionCookie
                                ),

                            scheduledError
                        }
                    },
                    null,
                    2
                )
        };


    } catch (error) {

        return {
            statusCode: 500,

            headers: {
                "Content-Type":
                    "application/json; charset=utf-8"
            },

            body:
                JSON.stringify(
                    {
                        success:
                            false,

                        source:
                            "srbijasport.net",

                        error:
                            error.message
                    },
                    null,
                    2
                )
        };
    }
};