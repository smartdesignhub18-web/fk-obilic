
/* ==========================================
   FK OBILIC - PORTAL
   AUTOMATSKA OBAVESTENJA ZA PRVI TIM
========================================== */

(() => {
    "use strict";

    const CHECK_EVERY_MS = 3 * 60 * 1000;

    const sb = window.fkObilicSupabase;

    if (!sb) {
        console.error(
            "Supabase klijent nije dostupan."
        );
        return;
    }

    let checking = false;

    async function checkNewMatch() {

        if (checking || document.hidden) {
            return;
        }

        checking = true;

        try {

            // Provera prijavljenog korisnika

            const { data: sessionData } =
                await sb.auth.getSession();

            const user = sessionData?.session?.user;

            if (!user) {
                return;
            }

            // Ucitavanje profila

            const { data: profile, error: profileError } =
                await sb
                    .from("portal_korisnici")
                    .select("uloga,selekcija_id,aktivan")
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (
                profileError ||
                !profile ||
                profile.aktivan === false
            ) {
                return;
            }

            const role = String(
                profile.uloga || ""
            ).trim().toUpperCase();

            if (
                !["UPRAVA", "TRENER", "IGRAČ", "IGRAC"]
                    .includes(role)
            ) {
                return;
            }

            // Proveravamo da li korisnik
            // pripada prvom timu

            if (role !== "UPRAVA") {

                const { data: selection, error } =
                    await sb
                        .from("selekcije")
                        .select("kod")
                        .eq("id", profile.selekcija_id)
                        .maybeSingle();

                if (error || selection?.kod !== "prvi-tim") {
                    return;
                }
            }

            // Ucitavanje utakmica

            const response = await fetch(
                `data/football.json?t=${Date.now()}`,
                {
                    cache: "no-store"
                }
            );

            if (!response.ok) {
                throw new Error(
                    "Greska pri ucitavanju football.json"
                );
            }

            const football = await response.json();

            if (football?.success === false) {
                return;
            }

            const matches = [
                ...(
                    Array.isArray(football.matches)
                        ? football.matches
                        : []
                ),
                ...(
                    football.nextMatch
                        ? [football.nextMatch]
                        : []
                )
            ];

            const now = Date.now();

            // Pronalazimo sledecu zakazanu utakmicu

            const nextMatch = matches
                .filter(match => {

                    const date = new Date(
                        match?.startDate
                    ).getTime();

                    const id = Number(match?.id);

                    return (
                        match?.status === "scheduled" &&
                        Number.isSafeInteger(id) &&
                        id > 0 &&
                        Number.isFinite(date) &&
                        date > now &&
                        typeof match.home === "string" &&
                        typeof match.away === "string"
                    );

                })
                .sort(
                    (a, b) =>
                        new Date(a.startDate) -
                        new Date(b.startDate)
                )[0];

            if (!nextMatch) {
                return;
            }

            // Pozivanje Supabase funkcije.
            // Baza sprecava duplikate.

            const { data: created, error } =
                await sb.rpc(
                    "portal_obavesti_novu_utakmicu_prvog_tima",
                    {
                        p_srbijasport_id:
                            Number(nextMatch.id),

                        p_pocetak:
                            new Date(
                                nextMatch.startDate
                            ).toISOString(),

                        p_domacin:
                            nextMatch.home,

                        p_gost:
                            nextMatch.away
                    }
                );

            if (error) {
                throw error;
            }

            if (created) {

                console.info(
                    "FK Obilic: novo obavestenje za utakmicu."
                );

            }

        } catch (error) {

            console.error(
                "Provera nove utakmice:",
                error
            );

        } finally {

            checking = false;

        }
    }

    // Pokretanje provere

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            checkNewMatch();

            // Periodicna provera

            window.setInterval(
                checkNewMatch,
                CHECK_EVERY_MS
            );

            // Provera pri povratku na portal

            window.addEventListener(
                "focus",
                checkNewMatch
            );

            document.addEventListener(
                "visibilitychange",
                () => {
                    if (!document.hidden) {
                        checkNewMatch();
                    }
                }
            );

            // Provera nakon prijave

            sb.auth.onAuthStateChange(
                (event, session) => {

                    if (
                        (
                            event === "SIGNED_IN" ||
                            event === "INITIAL_SESSION"
                        ) &&
                        session?.user
                    ) {

                        window.setTimeout(
                            checkNewMatch,
                            0
                        );

                    }

                }
            );

        }
    );

})();
