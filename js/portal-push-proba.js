
/* =====================================================
   FK OBILIC
   DUGME ZA TEST PUSH OBAVESTENJA
===================================================== */

(() => {
    "use strict";

    const sb = window.fkObilicSupabase;

    if (!sb) {
        return;
    }

    function initialize() {

        const panel =
            document.getElementById(
                "fk-push-panel"
            );

        if (
            !panel ||
            document.getElementById(
                "fk-push-test-button"
            )
        ) {
            return;
        }

        const button =
            document.createElement("button");

        button.type = "button";

        button.id =
            "fk-push-test-button";

        button.className =
            "fk-push-button";

        button.style.background =
            "#41414b";

        button.textContent =
            "ПОШАЉИ ПРОБНО ОБАВЕШТЕЊЕ";

        panel.appendChild(button);

        const status =
            document.getElementById(
                "fk-push-status"
            );

        button.addEventListener(
            "click",
            async () => {

                button.disabled = true;

                button.textContent =
                    "СЛАЊЕ...";

                try {

                    const {
                        data,
                        error
                    } = await sb.functions.invoke(
                        "portal-push-proba",
                        {
                            body: {
                                test: true
                            }
                        }
                    );

                    if (error) {
                        throw error;
                    }

                    if (!data?.ok) {
                        throw new Error(
                            data?.error ||
                            "Обавештење није послато."
                        );
                    }

                    if (status) {

                        status.textContent =
                            "Пробно обавештење је послато на " +
                            data.sent +
                            " уређај(а).";

                        status.className =
                            "fk-push-status success";
                    }

                } catch (error) {

                    console.error(
                        "FK Obilic PUSH test:",
                        error
                    );

                    if (status) {

                        status.textContent =
                            "Слање пробе није успело. Проверите Edge Function Logs.";

                        status.className =
                            "fk-push-status error";
                    }

                } finally {

                    button.disabled = false;

                    button.textContent =
                        "ПОШАЉИ ПРОБНО ОБАВЕШТЕЊЕ";
                }
            }
        );
    }

    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();
    }

})();
