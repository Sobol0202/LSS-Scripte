// Start: chatAuto.start("START")
// Stop: chatAuto.stop()
// Status: chatAuto.status()
(() => {
    "use strict";

    const PASSPHRASE = "START";

    // Abstand zwischen Nachrichten in Millisekunden
    const INTERVAL_MS = 1000;

    const POST_URL = "https://www.leitstellenspiel.de/alliance_chats";

    let timer = null;
    let messageNumber = 0;
    let running = false;

    function getAuthToken() {
        const authToken = document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute("content");

        if (!authToken) {
            throw new Error("CSRF-/Authenticity-Token wurde nicht gefunden.");
        }

        return authToken;
    }

    function getUsername() {

        if (
            typeof window.username === "string" &&
            window.username.trim() !== ""
        ) {
            return window.username.trim();
        }

        for (const script of document.scripts) {
            if (!script.textContent) continue;

            const match = script.textContent.match(
                /\bvar\s+username\s*=\s*["']([^"']+)["']/
            );

            if (match) {
                return match[1];
            }
        }

        throw new Error('Username aus "var username = ..." nicht gefunden.');
    }

    async function sendMessage() {
        if (!running) return;

        try {
            const authToken = getAuthToken();
            const username = getUsername();

            const nextNumber = messageNumber + 1;

            const message =
                `/w ${username} Automatisierte Nachricht Nummer ${nextNumber}`;

            const body = new URLSearchParams({
                utf8: "✓",
                authenticity_token: authToken,
                "alliance_chat[message]": message
            });

            const response = await fetch(POST_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: body.toString()
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status} ${response.statusText}`
                );
            }

            messageNumber = nextNumber;

            console.log(
                `[chatAuto] Nachricht ${messageNumber} gesendet:`,
                message
            );
        } catch (error) {
            console.error("[chatAuto] Versand fehlgeschlagen:", error);
        }
    }

    function start(passphrase) {
        if (passphrase !== PASSPHRASE) {
            console.error("[chatAuto] Falsche Passphrase.");
            return false;
        }

        if (running) {
            console.warn("[chatAuto] Läuft bereits.");
            return false;
        }

        running = true;

        console.log(
            `[chatAuto] Gestartet. Intervall: ${INTERVAL_MS / 1000} Sekunden.`
        );

        sendMessage();

        timer = setInterval(sendMessage, INTERVAL_MS);

        return true;
    }

    function stop() {
        running = false;

        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }

        console.log(
            `[chatAuto] Gestoppt. Insgesamt ${messageNumber} Nachrichten gesendet.`
        );
    }

    function status() {
        const info = {
            running,
            messageNumber,
            intervalMs: INTERVAL_MS
        };

        console.table(info);
        return info;
    }

    window.chatAuto = Object.freeze({
        start,
        stop,
        status
    });

    console.log(
        "[chatAuto] Geladen und inaktiv. " +
        'Start: chatAuto.start("PASSWORT") | ' +
        "Stop: chatAuto.stop() | " +
        "Status: chatAuto.status()"
    );
})();
