const CLUB_URL =
    "https://srbijasport.net/club/787-obilic";

exports.handler = async function () {

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

        if (!response.ok) {
            throw new Error(
                `Srbijasport HTTP greška: ${response.status}`
            );
        }

        const html = await response.text();

        /*
         * Tražimo delove HTML-a koji nam mogu otkriti
         * kako Srbijasport učitava tab "Planirano".
         */

        const searchTerms = [
            "planned",
            "played",
            "club_games",
            "Planirano",
            "Odigramo",
            "Odigrao"
        ];

        const samples = [];

        for (const term of searchTerms) {

            let startIndex = 0;
            let found = 0;

            while (found < 10) {

                const index = html.indexOf(term, startIndex);

                if (index === -1) {
                    break;
                }

                samples.push(
                    "\n\n========================================\n" +
                    `POJAM: ${term} / POJAVA ${found + 1}\n` +
                    "========================================\n\n" +
                    html.substring(
                        Math.max(0, index - 3500),
                        Math.min(html.length, index + 5000)
                    )
                );

                startIndex = index + term.length;
                found++;
            }
        }

        return {
            statusCode: 200,

            headers: {
                "Content-Type":
                    "text/plain; charset=utf-8"
            },

            body:
                `HTML DUŽINA: ${html.length}\n` +
                `PRONAĐENIH ISEČAKA: ${samples.length}\n\n` +
                samples.join("\n")
        };

    } catch (error) {

        return {
            statusCode: 500,

            headers: {
                "Content-Type":
                    "text/plain; charset=utf-8"
            },

            body:
                `GREŠKA: ${error.message}`
        };

    }

};