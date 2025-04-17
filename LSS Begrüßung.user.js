// ==UserScript==
// @name         LSS Begrüßung mit Wartezeit
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Zeige eine Begrüßung nach dem Login mit einstellbarer Wartezeit
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // 🕒 Wartezeit in Millisekunden (z.B. 5000 = 5 Sekunden)
    const WARTEZEIT_MS = 5000;

    // Überprüfen ob Login-Seite
    const isLoginPage = window.location.href.includes("/users/sign_in");

    // Wenn Login-Seite: Beim Klick auf den Login-Button den Wert zurücksetzen
    if (isLoginPage) {
        const loginButton = document.querySelector("input[type='submit']");
        if (loginButton) {
            loginButton.addEventListener("click", () => {
                GM_setValue("justLoggedIn", false);
            });
        }
        return;
    }

    // Wenn nicht Login-Seite und frisch eingeloggt:
    const justLoggedIn = GM_getValue("justLoggedIn", true);

    if (!justLoggedIn) {
        GM_setValue("justLoggedIn", true);

        // Begrüßung nach definierter Wartezeit anzeigen
        setTimeout(() => {
                    
            // Holt den Benutzernamen, falls verfügbar, sonst Standardwert
            const name = typeof username !== "undefined" ? username : "Spieler";

            // Extrahiert die aktuellen Credits des Spielers aus dem Seiteninhalt
            const creditsMatch = document.body.innerHTML.match(/creditsUpdate\((\d+)\)/);
            const credits = creditsMatch ? parseInt(creditsMatch[1], 10) : 0;

            // Hilfsfunktion: Liest die aktuelle Anzahl bestimmter Einsätze aus dem DOM
            const getNumberFromElement = (id) => {
                const el = document.getElementById(id);
                if (!el) return 0;
                const match = el.innerText.match(/(\d+)\s*\/\s*\d+$/);
                return match ? parseInt(match[1], 10) : 0;
            };

            // Anzahl verschiedener Einsatzarten
            const notfälle = getNumberFromElement("mission_select_emergency");
            const ktw = getNumberFromElement("mission_select_krankentransport");
            const sicherheitswache = getNumberFromElement("mission_select_sicherheitswache");
            const alliance = getNumberFromElement("mission_select_alliance");
            const einsätze = notfälle + ktw + sicherheitswache;

            // Gibt eine zufällige Begrüßung je nach Tageszeit zurück
            const greetingsTime = () => {
                const hour = new Date().getHours();
                if (Math.random() < 0.5) {
                    if (hour < 11) return "Guten Morgen";
                    if (hour < 14) return "Mahlzeit";
                    if (hour < 18) return "Guten Tag";
                    return "Guten Abend";
                } else {
                    const options = ["Hallo", "Hey", "Grüße", "Moin", "Servus", "Hi", "Schön das du da bist", "Schön dich zu sehen"];
                    return options[Math.floor(Math.random() * options.length)];
                }
            };

            // Informative Textzeilen für die Begrüßung
            const infos = [
                `Es ist ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Uhr.`,
                `Gerade warten ${einsätze} Einsätze auf dich.`,
                `Aktuell gibt es ${alliance} offene Verbandseinsätze.`,
                `Du hast gerade ${credits.toLocaleString()} Credits zum Ausgeben bereit.`
            ];

            // Mischt die Infos zufällig und zeigt zwei davon an
            const shuffledInfos = infos.sort(() => 0.5 - Math.random()).slice(0, 2);

            // Zufälliger Motivationsspruch
            const anfeuerungen = ["Lass uns anfangen!", "Auf geht’s!", "Lass uns beginnen!", "Los geht’s!", "Fangen wir an!", "Zeit, loszulegen!", "Jetzt geht’s los!", "Ran an die Arbeit!", "Packen wir’s an!"];
            const anfeuerung = anfeuerungen[Math.floor(Math.random() * anfeuerungen.length)];

            // Erstellt das Begrüßungs-Element im DOM
            const box = document.createElement("div");
            box.id = "begruessung-box";
            box.innerHTML = `
                <div id="begruesung-inhalt">
                    <h2>${greetingsTime()}, <span style="text-decoration: underline;">${name}</span>!</h2>
                    <p>${shuffledInfos.join("<br>")}</p>
                    <strong>${anfeuerung}</strong>
                </div>
            `;
            
            // Fügt die Box zur Seite hinzu
            document.body.appendChild(box);

            // Fügt CSS für die Box hinzu
            GM_addStyle(`
                #begruessung-box {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: #28a745;
                    color: white;
                    padding: 30px 40px;
                    border-radius: 20px;
                    box-shadow: 0 0 30px rgba(0,0,0,0.4);
                    font-family: "Segoe UI", sans-serif;
                    font-size: 18px;
                    text-align: center;
                    z-index: 9999;
                    opacity: 0;
                    transition: opacity 0.6s ease, transform 0.6s ease;
                    max-width: 90%;
                    width: 400px;
                }

                #begruesung-inhalt h2 {
                    margin-top: 0;
                    font-size: 24px;
                }

                #begruesung-inhalt p {
                    margin: 15px 0;
                }
            `);

            // Animation: Einblenden → nach 3s ausblenden → entfernen
            setTimeout(() => {
                box.style.opacity = 1;
                setTimeout(() => {
                    box.style.opacity = 0;
                    setTimeout(() => box.remove(), 500);
                }, 3000);
            }, 300);
        }, WARTEZEIT_MS);
    }
})();
