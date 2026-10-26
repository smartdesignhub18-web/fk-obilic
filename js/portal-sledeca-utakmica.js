
/* =========================================================
   FK OBILIC - AUTOMATSKI IZBOR SLEDECE UTAKMICE
   Lokalni portal / Live Server

   Koristi termine iz data/football.json.
   Ne povlaci novi raspored sa interneta.
========================================================= */

(() => {
    "use strict";

    if (window.__fkObilicNextMatchNormalizer) return;
    window.__fkObilicNextMatchNormalizer = true;

    const originalFetch = window.fetch.bind(window);

    /* =====================================================
       PROVERA FAJLA
    ===================================================== */

    function isFootballFile(input) {
        try {
            const address =
                typeof input === "string" ||
                input instanceof URL
                    ? String(input)
                    : input?.url;

            if (!address) return false;

            const url = new URL(
                address,
                document.baseURI
            );

            return (
                url.origin === window.location.origin &&
                /\/data\/football\.json$/i.test(
                    url.pathname
                )
            );

        } catch {
            return false;
        }
    }

    /* =====================================================
       PREPOZNAJ OBILIC
    ===================================================== */

    function isObilic(value) {

        const name = String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        return (
            name.includes("obilic") ||
            name.includes("обилић")
        );
    }

    /* =====================================================
       DATUM UTAKMICE
    ===================================================== */

    function dateMilliseconds(value) {

        if (
            typeof value !== "string" ||
            !value.trim()
        ) {
            return NaN;
        }

        return new Date(value).getTime();
    }

    /* =====================================================
       PRONADJI PRVU BUDUCU UTAKMICU
    ===================================================== */

    function nextMatch(data) {

        const matches = [
            ...(
                Array.isArray(data?.matches)
                    ? data.matches
                    : []
            ),
            ...(
                data?.nextMatch
                    ? [data.nextMatch]
                    : []
            )
        ];

        const now = Date.now();
        const seen = new Set();

        return matches

            .filter(match => {

                if (
                    !match ||
                    typeof match !== "object"
                ) {
                    return false;
                }

                const id = Number(match.id);

                const kickoff =
                    dateMilliseconds(
                        match.startDate
                    );

                const status = String(
                    match.status || ""
                ).toLowerCase();

                if (
                    !Number.isSafeInteger(id) ||
                    id <= 0
                ) {
                    return false;
                }

                if (
                    !Number.isFinite(kickoff) ||
                    kickoff <= now
                ) {
                    return false;
                }

                if (status !== "scheduled") {
                    return false;
                }

                if (
                    !isObilic(match.home) &&
                    !isObilic(match.away)
                ) {
                    return false;
                }

                if (seen.has(id)) {
                    return false;
                }

                seen.add(id);

                return true;
            })

            .sort(
                (a, b) =>
                    dateMilliseconds(a.startDate) -
                    dateMilliseconds(b.startDate)
            )[0] || null;
    }

    /* =====================================================
       UJEDNACI FOOTBALL.JSON

       Samo na lokalnom portalu prepravljamo
       nextMatch u podacima koje vraca fetch.

       Originalni football.json ostaje
       potpuno nepromenjen.

       Svi postojeci moduli koji citaju
       football.json dobijaju isti nextMatch.
    ===================================================== */

    window.fetch = async function (...args) {

        const response =
            await originalFetch(...args);

        if (
            !response.ok ||
            !isFootballFile(args[0])
        ) {
            return response;
        }

        try {

            const data =
                await response.clone().json();

            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                return response;
            }

            const chosen = nextMatch(data);

            const previous = data.nextMatch;

            const updated = {
                ...data,
                nextMatch: chosen
            };

            /* Obavestenje u Console-u */

            if (
                String(previous?.id ?? "") !==
                String(chosen?.id ?? "")
            ) {

                console.info(
                    "FK Obilic - sledeca utakmica:",
                    chosen?.id
                        ? `srbijasport:${chosen.id}`
                        : "Nema buduceg termina"
                );
            }

            /*
               Ostali podaci ostaju isti:
               tabela, rezultati, raspored itd.
            */

            const headers = new Headers(
                response.headers
            );

            headers.delete("content-length");
            headers.delete("content-encoding");

            headers.set(
                "content-type",
                "application/json; charset=utf-8"
            );

            return new Response(
                JSON.stringify(updated),
                {
                    status: response.status,
                    statusText: response.statusText,
                    headers
                }
            );

        } catch (error) {

            console.warn(
                "FK Obilic - izbor sledece utakmice nije uspeo:",
                error
            );

            return response;
        }
    };

})();
