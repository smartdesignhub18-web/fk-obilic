const LEAGUE_URL =
    "https://srbijasport.net/league/8794-potiska-medjuopstinska-liga";
const CLUB_URL =
    "https://srbijasport.net/club/787-obilic";
const CLUB_ID = 787;
const CLUB_NAME = "Obilić";

function cleanText(value = "") {
    return value
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&#9650;/g, "▲")
        .replace(/&#9660;/g, "▼")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
}

function getCell(row, className) {
    const regex = new RegExp(
        `<td[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\\/td>`,
        "i"
    );

    const match = row.match(regex);

    return match ? cleanText(match[1]) : "";
}

function parseStandings(html) {
    const standings = [];

    const rowRegex =
        /<tr[^>]*data-club-id="(\d+)"[^>]*>([\s\S]*?)<\/tr>/gi;

    let match;

    while ((match = rowRegex.exec(html)) !== null) {
        const clubId = Number(match[1]);
        const row = match[2];

        const positionMatch = row.match(
            /<span[^>]*class="[^"]*pos-deleg[^"]*"[^>]*>([\s\S]*?)<\/span>/i
        );

        const teamMatch = row.match(
            /<div[^>]*class="team-name"[^>]*>([\s\S]*?)<\/div>/i
        );

        const cityMatch = row.match(
            /<div[^>]*class="team-city"[^>]*>([\s\S]*?)<\/div>/i
        );

        const pointsMatch = row.match(
            /<div[^>]*class="pts-wrapper"[^>]*>([\s\S]*?)<\/div>/i
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

        const played = Number(getCell(row, "col-UTAKM")) || 0;
        const won = Number(getCell(row, "col-POB")) || 0;
        const drawn = Number(getCell(row, "col-NER")) || 0;
        const lost = Number(getCell(row, "col-POR")) || 0;

        const goalsFor = Number(getCell(row, "col-DG")) || 0;
        const goalsAgainst = Number(getCell(row, "col-PG")) || 0;

        const goalDifferenceText = getCell(row, "col-GR");

        const goalDifference =
            Number(goalDifferenceText.replace("+", "")) || 0;

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
        (a, b) => (a.position || 999) - (b.position || 999)
    );
}

function parseSportsEvents(html) {
    const events = [];

    const scriptRegex =
        /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
        const jsonText = match[1].trim();

        try {
            const data = JSON.parse(jsonText);

            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                if (!item || item["@type"] !== "SportsEvent") {
                    continue;
                }

                const home =
                    item.homeTeam && item.homeTeam.name
                        ? item.homeTeam.name
                        : "";

                const away =
                    item.awayTeam && item.awayTeam.name
                        ? item.awayTeam.name
                        : "";

                if (!home || !away) {
                    continue;
                }

                events.push({
                    name: item.name || `${home} – ${away}`,
                    home,
                    away,
                    startDate: item.startDate || null,
                    location:
                        item.location && item.location.name
                            ? item.location.name
                            : "",
                    url: item.url || ""
                });
            }
        } catch (error) {
            // Neki JSON-LD blokovi na stranici mogu biti
            // nevezani za utakmice ili drugačije strukture.
        }
    }

    const unique = new Map();

    for (const event of events) {
        const key =
            event.url ||
            `${event.home}|${event.away}|${event.startDate}`;

        unique.set(key, event);
    }

    return [...unique.values()];
}

function isObilicName(name = "") {
    return name
        .toLocaleLowerCase("sr-Latn")
        .replace(/ć/g, "c")
        .includes("obilic");
}

function getObilicMatches(events) {
    return events
        .filter(event => {
            return (
                isObilicName(event.home) ||
                isObilicName(event.away)
            );
        })
        .sort((a, b) => {
            const dateA = new Date(a.startDate || 0).getTime();
            const dateB = new Date(b.startDate || 0).getTime();

            return dateA - dateB;
        });
}

function findPreviousAndNextMatch(matches) {
    const now = Date.now();

    let lastMatch = null;
    let nextMatch = null;

    for (const match of matches) {
        if (!match.startDate) {
            continue;
        }

        const time = new Date(match.startDate).getTime();

        if (Number.isNaN(time)) {
            continue;
        }

        if (time < now) {
            lastMatch = match;
        }

        if (time >= now && !nextMatch) {
            nextMatch = match;
        }
    }

    return {
        lastMatch,
        nextMatch
    };
}

exports.handler = async function () {
        if (process.env.DIAG_CLUB === "1") {

        try {

            const response = await fetch(CLUB_URL, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (compatible; FKObilicWebsite/1.0)",
                    "Accept":
                        "text/html,application/xhtml+xml",
                    "Accept-Language":
                        "sr-RS,sr;q=0.9,en;q=0.8"
                }
            });

            const html = await response.text();

            const index = html.indexOf("Bačka");

            const sample =
                index !== -1
                    ? html.substring(
                        Math.max(0, index - 4000),
                        index + 4000
                    )
                    : html.substring(0, 8000);

            return {
                statusCode: 200,
                headers: {
                    "Content-Type":
                        "text/plain; charset=utf-8"
                },
                body: sample
            };

        } catch (error) {

            return {
                statusCode: 500,
                body: error.message
            };

        }

    }
    try {
        const response = await fetch(LEAGUE_URL, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (compatible; FKObilicWebsite/1.0)",
                "Accept":
                    "text/html,application/xhtml+xml",
                "Accept-Language":
                    "sr-RS,sr;q=0.9,en;q=0.8"
            }
        });

        if (!response.ok) {
            throw new Error(
                `Srbijasport HTTP greška: ${response.status}`
            );
        }

        const html = await response.text();

        const standings = parseStandings(html);

        const events = parseSportsEvents(html);

        const matches = getObilicMatches(events);

        const {
            lastMatch,
            nextMatch
        } = findPreviousAndNextMatch(matches);

        const obilicStanding =
            standings.find(team => team.clubId === CLUB_ID) || null;

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

                    source: "srbijasport.net",

                    league: {
                        id: 8794,
                        name: "Potiska međuopštinska liga"
                    },

                    club: {
                        id: CLUB_ID,
                        name: CLUB_NAME
                    },

                    updatedAt: new Date().toISOString(),

                    obilicStanding,

                    standings,

                    matches,

                    lastMatch,

                    nextMatch,

                    debug: {
                        standingsFound: standings.length,
                        sportsEventsFound: events.length,
                        obilicMatchesFound: matches.length
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
                    source: "srbijasport.net",
                    error: error.message
                },
                null,
                2
            )
        };
    }
};