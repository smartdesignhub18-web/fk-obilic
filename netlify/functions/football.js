exports.handler = async function () {
    const LEAGUE_URL =
        "https://srbijasport.net/league/8794-potiska-medjuopstinska-liga";

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

        const html = await response.text();

        const containsObilic =
            html.toLowerCase().includes("obilić") ||
            html.toLowerCase().includes("obilic") ||
            html.toLowerCase().includes("обилић");

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                "Cache-Control": "public, max-age=0, s-maxage=1800"
            },
            body: JSON.stringify({
                success: true,
                source: "srbijasport.net",
                sourceStatus: response.status,
                htmlReceived: html.length > 0,
                htmlLength: html.length,
                containsObilic: containsObilic,
                message: "Netlify функција ради."
            })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json; charset=utf-8"
            },
            body: JSON.stringify({
                success: false,
                source: "srbijasport.net",
                error: error.message
            })
        };
    }
};