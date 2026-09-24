/* =========================================================
   FK OBILIĆ NOVI KNEZEVAC
   KLUPSKA PESMA
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    setupClubSong
);


function setupClubSong() {

    const button =
        document.querySelector(
            "#club-song-button"
        );

    const audio =
        document.querySelector(
            "#club-song-audio"
        );

    if (!button || !audio) {
        return;
    }


    const icon =
        button.querySelector(
            ".club-song-icon"
        );

    const text =
        button.querySelector(
            ".club-song-text"
        );


    /* =====================================================
       KLIK NA DUGME
    ===================================================== */

    button.addEventListener(
        "click",
        async () => {

            if (audio.paused) {

                try {

                    await audio.play();

                } catch (error) {

                    console.error(
                        "Није могуће покренути песму:",
                        error
                    );

                }

            } else {

                audio.pause();

            }

        }
    );


    /* =====================================================
       KADA PESMA KRENE
    ===================================================== */

    audio.addEventListener(
        "play",
        () => {

            button.classList.add(
                "is-playing"
            );

            if (icon) {
                icon.textContent = "❚❚";
            }

            if (text) {
                text.textContent =
                    "ПАУЗИРАЈ ПЕСМУ";
            }

            button.setAttribute(
                "aria-label",
                "Паузирај клупску песму"
            );

        }
    );


    /* =====================================================
       KADA JE PAUZIRANA
    ===================================================== */

    audio.addEventListener(
        "pause",
        () => {

            button.classList.remove(
                "is-playing"
            );

            if (icon) {
                icon.textContent = "▶";
            }

            if (text) {
                text.textContent =
                    "ПУСТИ КЛУПСКУ ПЕСМУ";
            }

            button.setAttribute(
                "aria-label",
                "Пусти клупску песму"
            );

        }
    );


    /* =====================================================
       KADA SE PESMA ZAVRŠI
    ===================================================== */

    audio.addEventListener(
        "ended",
        () => {

            button.classList.remove(
                "is-playing"
            );

            if (icon) {
                icon.textContent = "▶";
            }

            if (text) {
                text.textContent =
                    "ПУСТИ КЛУПСКУ ПЕСМУ";
            }

            button.setAttribute(
                "aria-label",
                "Пусти клупску песму"
            );

            audio.currentTime = 0;

        }
    );


    /* =====================================================
       AKO AUDIO FAJL NE POSTOJI
    ===================================================== */

    audio.addEventListener(
        "error",
        () => {

            button.classList.remove(
                "is-playing"
            );

            button.classList.add(
                "song-error"
            );

            if (icon) {
                icon.textContent = "!";
            }

            if (text) {
                text.textContent =
                    "ПЕСМА НИЈЕ ДОСТУПНА";
            }

            button.disabled = true;

        }
    );

}