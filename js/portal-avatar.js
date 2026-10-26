
/* ==========================================
   FK OBILIC - PROFILNA FOTOGRAFIJA
========================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;

    const DEFAULT_PHOTO = "images/grb.png";

    let requestVersion = 0;

    function setAvatar(photo) {

        const avatar = document.querySelector(
            "#portal-header-avatar"
        );

        if (!avatar) return;

        avatar.onerror = () => {
            avatar.onerror = null;
            avatar.src = DEFAULT_PHOTO;
        };

        avatar.src = photo || DEFAULT_PHOTO;
    }

    async function loadUserAvatar() {

        const version = ++requestVersion;

        try {

            const { data: sessionData } =
                await sb.auth.getSession();

            const user = sessionData?.session?.user;

            if (!user) {
                setAvatar(null);
                return;
            }

            // Profil prijavljenog korisnika

            const { data: profile, error: profileError } =
                await sb
                    .from("portal_korisnici")
                    .select("uloga,povezani_id,aktivan")
                    .eq("user_id", user.id)
                    .maybeSingle();

            if (
                profileError ||
                !profile ||
                profile.aktivan === false
            ) {
                setAvatar(null);
                return;
            }

            const role = String(
                profile.uloga || ""
            ).trim().toUpperCase();

            // Odredjujemo tabelu sa fotografijom

            let table = null;

            if (role === "IGRAČ" || role === "IGRAC") {
                table = "igraci";
            }

            else if (role === "TRENER") {
                table = "strucni_stab";
            }

            else if (role === "UPRAVA") {
                table = "uprava";
            }

            if (!table || !profile.povezani_id) {
                setAvatar(null);
                return;
            }

            // Fotografija sa javnog sajta

            const { data: person, error } =
                await sb
                    .from(table)
                    .select("fotografija")
                    .eq("id", profile.povezani_id)
                    .maybeSingle();

            if (version !== requestVersion) {
                return;
            }

            if (error) {
                console.error(
                    "Portal avatar error:",
                    error
                );
                setAvatar(null);
                return;
            }

            setAvatar(person?.fotografija || null);

        } catch (error) {

            console.error(
                "Avatar loading error:",
                error
            );

            if (version === requestVersion) {
                setAvatar(null);
            }

        }
    }

    function initializeAvatar() {

        if (!sb) return;

        loadUserAvatar();

        sb.auth.onAuthStateChange(
            (event, session) => {

                if (event === "SIGNED_OUT") {

                    requestVersion++;
                    setAvatar(null);
                    return;
                }

                if (
                    (
                        event === "SIGNED_IN" ||
                        event === "INITIAL_SESSION"
                    ) &&
                    session?.user
                ) {

                    setTimeout(loadUserAvatar, 0);

                }
            }
        );
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initializeAvatar
        );

    } else {

        initializeAvatar();

    }

})();
