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

        if (!response.ok) {
            throw new Error(
                `Srbijasport HTTP greška: ${response.status}`
            );
        }

        const html = await response.text();

        // Tražimo sva pojavljivanja Obilića u HTML-u
        const lowerHtml = html.toLowerCase();

        const searchTerms = [
            "obilić",
            "obilic",
            "обилић"
        ];

        let positions = [];

        searchTerms.forEach(term => {
            let start = 0;

            while (true) {
                const index = lowerHtml.indexOf(term, start);

                if (index === -1) break;

                positions.push(index);

                start = index + term.length;

                // Dovoljno nam je nekoliko primera
                if (positions.length >= 10) break;
            }
        });

        positions = [...new Set(positions)]
            .sort((a, b) => a - b)
            .slice(0, 10);

        const snippets = positions.map((position, i) => {
            const start = Math.max(0, position - 1500);
            const end = Math.min(
                html.length,
                position + 2500
            );

            return {
                number: i + 1,
                position,
                html: html
                    .slice(start, end)
                    .replace(/\r/g, "")
            };
        });

        return {
            statusCode: 200,
            headers: {
                "Content-Type":
                    "application/json; charset=utf-8",
                "Cache-Control":
                    "no-store"
            },

            body: JSON.stringify(
                {
                    success: true,
                    source: "srbijasport.net",
                    sourceStatus: response.status,
                    htmlLength: html.length,
                    obilicOccurrences: positions.length,
                    snippets
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
                    error: error.message
                },
                null,
                2
            )
        };
    }
};