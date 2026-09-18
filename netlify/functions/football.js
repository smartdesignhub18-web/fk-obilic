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
        "Mozilla/5.0 (compatible; FKObilicWebsite/1.0)",
    "Accept":
        "text/html,application/xhtml+xml,application/json",
    "Accept-Language":
        "sr-RS,sr;q=0.9,en;q=0.8"
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
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}


function getCell(row, className) {
    const regex = new RegExp(
        `<td[^>]*class=["'][^"']*${escapeRegex(className)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
        "i"
    );

    const match = row.match(regex);

    return match ? cleanText(match[1]) : "";
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

    while ((match = rowRegex.exec(html)) !== null) {
        const clubId = Number(match[1]);
        const row = match[2];

        const positionMatch = row.match(
            /<span[^>]*class=["'][^"']*pos-deleg[^"']*["'][^>]*>([\s\S]*?)<\/span>/i
        );

        const teamMatch = row.match(
            /<div[^>]*class=["'][^"']*team-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );

        const cityMatch = row.match(
            /<div[^>]*class=["'][^"']*team-city[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );

        const pointsMatch = row.match(
            /<div[^>]*class=["'][^"']*pts-wrapper[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
        );

        if (!teamMatch) {
            continue;
        }

        const position = positionMatch
            ? Number(cleanText(positionMatch[1]))
            : null;

        const team = cleanText(teamMatch[1]);

        const city = cityMatch
            ? cleanText(cityMatch[1])
            : "";

        const played =
            Number(getCell(row, "col-UTAKM")) || 0;

        const won =
            Number(getCell(row, "col-POB")) || 0;

        const drawn =
            Number(getCell(row, "col-NER")) || 0;

        const lost =
            Number(getCell(row, "col-POR")) || 0;

        const goalsFor =
            Number(getCell(row, "col-DG")) || 0;

        const goalsAgainst =
            Number(getCell(row, "col-PG")) || 0;

        const goalDifferenceText =
            getCell(row, "col-GR");

        const goalDifference =
            Number(
                goalDifferenceText
                    .replace("+", "")
                    .replace("−", "-")
            ) || 0;

        const points = pointsMatch
            ? Number(cleanText(pointsMatch[1])) || 0
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
            isObilic: clubId === CLUB_ID
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

function parseSerbianDate(dateText, timeText = "") {
    if (!dateText) {
        return null;
    }

    const match = String(dateText).match(
        /(\d{1,2})\.(\d{1,2})\.(\d{4})/
    );

    if (!match) {
        return null;
    }

    const day = match[1].padStart(2, "0");
    const month = match[2].padStart(2, "0");
    const year = match[3];

    let hour = "00";
    let minute = "00";

    const timeMatch = String(timeText).match(
        /(\d{1,2}):(\d{2})/
    );

    if (timeMatch) {
        hour = timeMatch[1].padStart(2, "0");
        minute = timeMatch[2];
    }

    /*
     * Srbijasport prikazuje lokalno vreme Srbije.
     * Frontend već formatira Europe/Belgrade.
     */
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
}


/* ==================================================
   UTAKMICE SA STRANICE KLUBA
================================================== */

function splitGameRows(html) {
    const starts = [];

    const startRegex =
        /<div\b(?=[^>]*\bclass=["'][^"']*\bgame-row\b[^"']*["'])(?=[^>]*\bdata-id=["']\d+["'])[^>]*>/gi;

    let match;

    while ((match = startRegex.exec(html)) !== null) {
        starts.push(match.index);
    }

    const blocks = [];

    for (let i = 0; i < starts.length; i++) {
        const start = starts[i];

        const end =
            i + 1 < starts.length
                ? starts[i + 1]
                : Math.min(
                    html.length,
                    start + 15000
                );

        blocks.push(
            html.substring(start, end)
        );
    }

    return blocks;
}


function extractTeam(block, className) {
    const regex = new RegExp(
        `<div[^>]*class=["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/div>`,
        "i"
    );

    const match = block.match(regex);

    return match
        ? cleanText(match[1])
        : "";
}


function extractScore(block, className) {
    const regex = new RegExp(
        `<div[^>]*class=["'][^"']*\\b${escapeRegex(className)}\\b[^"']*["'][^>]*>[\\s\\S]*?<div[^>]*class=["'][^"']*text-base[^"']*["'][^>]*>\\s*([^<]+)\\s*<\\/div>`,
        "i"
    );

    const match = block.match(regex);

    if (!match) {
        return null;
    }

    const value = Number(
        cleanText(match[1])
    );

    return Number.isFinite(value)
        ? value
        : null;
}


function parseClubGames(html, forcedStatus = null) {
    const games = [];

    const blocks = splitGameRows(html);

    for (const block of blocks) {
        const idMatch = block.match(
            /\bdata-id=["'](\d+)["']/i
        );

        if (!idMatch) {
            continue;
        }

        const id = Number(idMatch[1]);

        const urlMatch =
            block.match(
                /onclick=["'][^"']*location\.href\s*=\s*['"]([^'"]+)['"]/i
            ) ||
            block.match(
                /onkeydown=["'][^"']*location\.href\s*=\s*['"]([^'"]+)['"]/i
            );

        const dateMatch = block.match(
            /<div[^>]*class=["'][^"']*hidden\s+sm:block[^"']*["'][^>]*>\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*<\/div>/i
        );

        /*
         * Vreme se na Srbijasportu nalazi odmah nakon
         * desktop/mobilnog prikaza datuma.
         */
        let timeText = "";

        if (dateMatch) {
            const afterDate =
                block.substring(
                    dateMatch.index,
                    dateMatch.index + 1000
                );

            const timeMatch = afterDate.match(
                /(\d{1,2}:\d{2})/
            );

            if (timeMatch) {
                timeText = timeMatch[1];
            }
        }

        const home =
            extractTeam(block, "team-host");

        const away =
            extractTeam(block, "team-guest");

        if (!home || !away) {
            continue;
        }

        /*
         * Pošto je ovo stranica konkretnog kluba,
         * dodatno proveravamo da je Obilić učesnik.
         */
        if (
            !isObilicName(home) &&
            !isObilicName(away)
        ) {
            continue;
        }

        const homeScore =
            extractScore(block, "res-host");

        const awayScore =
            extractScore(block, "res-guest");

        const hasScore =
            homeScore !== null &&
            awayScore !== null;

        let status = forcedStatus;

        if (!status) {
            status = hasScore
                ? "finished"
                : "scheduled";
        }

        /*
         * Ako je forcedStatus finished, ali izvor ipak
         * nema rezultat, ne izmišljamo rezultat.
         */
        if (
            status === "finished" &&
            !hasScore
        ) {
            status = "unknown";
        }

        games.push({
            id,
            round: null,
            home,
            away,
            startDate: dateMatch
                ? parseSerbianDate(
                    dateMatch[1],
                    timeText
                )
                : null,
            location: "",
            url: urlMatch
                ? absoluteUrl(urlMatch[1])
                : "",
            homeScore,
            awayScore,
            status
        });
    }

    const unique = new Map();

    for (const game of games) {
        unique.set(game.id, game);
    }

    return [...unique.values()];
}


/* ==================================================
   SF AJAX PODACI
================================================== */

function getHiddenInput(html, name) {
    const escapedName =
        escapeRegex(name);

    const regex1 = new RegExp(
        `<input[^>]*\\bname=["']${escapedName}["'][^>]*\\bvalue=["']([^"']*)["'][^>]*>`,
        "i"
    );

    const regex2 = new RegExp(
        `<input[^>]*\\bvalue=["']([^"']*)["'][^>]*\\bname=["']${escapedName}["'][^>]*>`,
        "i"
    );

    const match =
        html.match(regex1) ||
        html.match(regex2);

    return match
        ? decodeHtml(match[1])
        : "";
}


function getClubGamesFormHtml(html) {
    const componentIndex =
        html.indexOf('id="club_games"');

    if (componentIndex === -1) {
        return html;
    }

    /*
     * Ograničavamo pretragu na komponentu utakmica
     * kako ne bismo uzeli sf_state podatke neke
     * druge komponente sa stranice.
     */
    return html.substring(
        componentIndex,
        Math.min(
            html.length,
            componentIndex + 100000
        )
    );
}


function getAjaxState(clubHtml) {
    const formHtml =
        getClubGamesFormHtml(clubHtml);

    const sfView =
        getHiddenInput(formHtml, "sf_view");

    const sfViewId =
        getHiddenInput(formHtml, "sf_view_id");

    const sfStateId =
        getHiddenInput(formHtml, "sf_state_id");

    const sfStateData =
        getHiddenInput(formHtml, "sf_state_data");

    const sfStateStore =
        getHiddenInput(formHtml, "sf_state_store") ||
        "client";

    const sfAjaxKey =
        getHiddenInput(formHtml, "sf_ajax_key");

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
   AJAX: PLANIRANE UTAKMICE
================================================== */

async function fetchScheduledGames(clubHtml) {
    const state =
        getAjaxState(clubHtml);

    /*
     * Ovo je isti sadržaj koji browser šalje
     * kroz sf_form_data.
     */
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

    /*
     * SF.a() šalje ova dva POST polja:
     * sf_source
     * sf_form_data
     * sf_action
     *
     * sf_source je prazan u uhvaćenom zahtevu.
     */
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
        await fetch(AJAX_URL, {
            method: "POST",

            headers: {
                ...REQUEST_HEADERS,
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                "X-Requested-With":
                    "XMLHttpRequest",
                "Referer":
                    CLUB_URL,
                "Origin":
                    "https://srbijasport.net"
            },

            body: body.toString()
        });

    if (!response.ok) {
        throw new Error(
            `Srbijasport AJAX greška: ${response.status}`
        );
    }

    const text =
        await response.text();

    return text;
}


/* ==================================================
   AJAX ODGOVOR
================================================== */

function collectHtmlStrings(value, result = []) {
    if (typeof value === "string") {
        if (
            value.includes("game-row") ||
            value.includes("team-host") ||
            value.includes("team-guest") ||
            value.includes("club_games")
        ) {
            result.push(value);
        }

        return result;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            collectHtmlStrings(
                item,
                result
            );
        }

        return result;
    }

    if (
        value &&
        typeof value === "object"
    ) {
        for (const item of Object.values(value)) {
            collectHtmlStrings(
                item,
                result
            );
        }
    }

    return result;
}


function extractScheduledHtml(responseText) {
    /*
     * Neke SF instalacije vraćaju HTML direktno,
     * a neke JSON koji u sebi sadrži HTML.
     * Podržavamo oba slučaja.
     */
    if (
        responseText.includes("game-row") &&
        responseText.includes("team-host")
    ) {
        return responseText;
    }

    try {
        const data =
            JSON.parse(responseText);

        const htmlParts =
            collectHtmlStrings(data);

        if (htmlParts.length) {
            return htmlParts.join("\n");
        }
    } catch (error) {
        // Odgovor nije JSON.
    }

    return responseText;
}


/* ==================================================
   SPAJANJE UTAKMICA
================================================== */

function mergeMatches(
    playedMatches,
    scheduledMatches
) {
    const map = new Map();

    for (const match of [
        ...playedMatches,
        ...scheduledMatches
    ]) {
        const key =
            match.id ||
            `${match.home}|${match.away}|${match.startDate}`;

        if (!map.has(key)) {
            map.set(key, match);
            continue;
        }

        const old =
            map.get(key);

        /*
         * Ako imamo završenu utakmicu sa rezultatom,
         * ona ima prednost nad planiranom verzijom.
         */
        if (
            match.status === "finished" &&
            old.status !== "finished"
        ) {
            map.set(key, match);
        }
    }

    return [...map.values()]
        .sort((a, b) => {
            const dateA =
                a.startDate
                    ? new Date(
                        a.startDate
                    ).getTime()
                    : Number.MAX_SAFE_INTEGER;

            const dateB =
                b.startDate
                    ? new Date(
                        b.startDate
                    ).getTime()
                    : Number.MAX_SAFE_INTEGER;

            return dateA - dateB;
        });
}


function findPreviousAndNextMatch(matches) {
    const finished =
        matches
            .filter(
                match =>
                    match.status === "finished"
            )
            .sort((a, b) => {
                return (
                    new Date(
                        a.startDate || 0
                    ).getTime() -
                    new Date(
                        b.startDate || 0
                    ).getTime()
                );
            });

    const scheduled =
        matches
            .filter(
                match =>
                    match.status === "scheduled"
            )
            .sort((a, b) => {
                return (
                    new Date(
                        a.startDate || 0
                    ).getTime() -
                    new Date(
                        b.startDate || 0
                    ).getTime()
                );
            });

    const lastMatch =
        finished.length
            ? finished[
                finished.length - 1
            ]
            : null;

    /*
     * Ne određujemo planiranu utakmicu samo na osnovu
     * toga da li je datum u budućnosti. Status dolazi
     * sa taba "Planirano".
     */
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

exports.handler = async function () {
    try {

        /*
         * Tabelu i stranicu kluba možemo učitati
         * paralelno.
         */
        const [
            leagueResponse,
            clubResponse
        ] = await Promise.all([
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

        if (!leagueResponse.ok) {
            throw new Error(
                `Srbijasport liga HTTP greška: ${leagueResponse.status}`
            );
        }

        if (!clubResponse.ok) {
            throw new Error(
                `Srbijasport klub HTTP greška: ${clubResponse.status}`
            );
        }

        const [
            leagueHtml,
            clubHtml
        ] = await Promise.all([
            leagueResponse.text(),
            clubResponse.text()
        ]);

        /*
         * Tabela ostaje iz istog izvora kao do sada.
         */
        const standings =
            parseStandings(
                leagueHtml
            );

        /*
         * Početna stranica kluba prikazuje tab
         * "Odigrano".
         */
        const playedMatches =
            parseClubGames(
                clubHtml,
                "finished"
            );

        /*
         * Tab "Planirano" učitavamo istim AJAX
         * mehanizmom kao Srbijasport browser.
         */
        let scheduledMatches = [];

        let scheduledError = null;

        try {
            const scheduledResponseText =
                await fetchScheduledGames(
                    clubHtml
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
            /*
             * Ako Srbijasport privremeno promeni AJAX,
             * ne rušimo celu tabelu i rezultate.
             */
            scheduledError =
                error.message;
        }

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
                    team.clubId === CLUB_ID
            ) || null;

        return {
            statusCode: 200,

            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",

                "Cache-Control":
                    "public, max-age=0, s-maxage=1800"
            },

            body: JSON.stringify(
                {
                    success: true,

                    source:
                        "srbijasport.net",

                    league: {
                        id: 8794,
                        name:
                            "Potiska međuopštinska liga"
                    },

                    club: {
                        id: CLUB_ID,
                        name: CLUB_NAME
                    },

                    updatedAt:
                        new Date().toISOString(),

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

            body: JSON.stringify(
                {
                    success: false,
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