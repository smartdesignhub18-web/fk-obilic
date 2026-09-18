/* =========================================================
   FK OBILIĆ NOVI KNEŽEVAC
   FOOTBALL API
   Izvor podataka: Srbijasport.net
========================================================= */

export default async function handler(req, res) {

    /* =====================================================
       PODEŠAVANJA
    ===================================================== */

    const LEAGUE_ID = 8794;
    const CLUB_ID = 787;

    const LEAGUE_URL =
        `https://srbijasport.net/league/${LEAGUE_ID}-potiska-medjuopstinska-liga`;


    /* =====================================================
       CACHE HEADER
       Browser/CDN može čuvati odgovor 30 minuta
    ===================================================== */

    res.setHeader(
        "Cache-Control",
        "s-maxage=1800, stale-while-revalidate=3600"
    );


    try {

        /* =================================================
           PREUZIMANJE SRBIJASPORT STRANICE
        ================================================= */

        const response = await fetch(
            LEAGUE_URL,
            {
                headers: {

                    "User-Agent":
                        "Mozilla/5.0 (compatible; FKObilicWebsite/1.0)",

                    "Accept":
                        "text/html,application/xhtml+xml",

                    "Accept-Language":
                        "sr-RS,sr;q=0.9,en;q=0.8"

                }
            }
        );


        if (!response.ok) {

            throw new Error(
                `Srbijasport HTTP greška: ${response.status}`
            );

        }


        const html =
            await response.text();


        if (!html) {

            throw new Error(
                "Srbijasport nije vratio sadržaj."
            );

        }


        /* =================================================
           ZA SADA PROVERAVAMO DA LI JE STRANICA PREUZETA
        ================================================= */

        const containsObilic =
            html.toLowerCase().includes("obilić") ||
            html.toLowerCase().includes("obilic") ||
            html.toLowerCase().includes("обилић");


        /* =================================================
           ODGOVOR NAŠEM FRONTENDU
        ================================================= */

        return res.status(200).json({

            success: true,

            source: "srbijasport.net",

            league: {

                id: LEAGUE_ID,

                name:
                    "Потиска међуопштинска лига",

                season:
                    "2026/27"

            },

            club: {

                id: CLUB_ID,

                name:
                    "ФК Обилић Нови Кнежевац"

            },

            sourceCheck: {

                htmlReceived:
                    html.length > 0,

                htmlLength:
                    html.length,

                containsObilic:
                    containsObilic

            },

            /*
                Parser još nije uključen.

                Zato za sada vraćamo prazne
                nizove umesto izmišljenih
                podataka.
            */

            standings: [],

            lastMatch: null,

            nextMatch: null,

            matches: [],

            updatedAt:
                new Date().toLocaleString(
                    "sr-RS",
                    {
                        timeZone:
                            "Europe/Belgrade"
                    }
                )

        });


    }

    catch (error) {

        console.error(
            "Football API:",
            error
        );


        return res.status(500).json({

            success: false,

            source:
                "srbijasport.net",

            error:
                "Подаци тренутно нису доступни."

        });

    }

}