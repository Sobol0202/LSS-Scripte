// ==UserScript==
// @name         LSS Login-Bonus Sammler
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt einen Haken zum Daily-Login-Button hinzu und sammelt die Belohnung ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Authentifizierungstoken (CSRF-Token) abrufen
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Liste der URLs, die nacheinander per POST aufgerufen werden sollen
    const postUrls = [
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=1",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=2",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=3",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=4",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=5",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=6",
        "https://www.leitstellenspiel.de/daily_bonuses/collect?day=7",
    ];

    // Hilfsfunktion für eine Pause
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Funktion zum Ausführen der POST-Anfragen mit CSRF-Token und Pausen
    const executePostRequests = async () => {
        if (!authToken) {
            console.error("CSRF-Token konnte nicht abgerufen werden!");
            return;
        }

        for (const url of postUrls) {
            try {
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': authToken
                    }
                });
                console.log(`POST erfolgreich zu ${url}`);
            } catch (error) {
                console.error(`Fehler bei POST zu ${url}:`, error);
            }
            await delay(100); // Pause von 100ms
        }
        console.log("Alle URLs wurden erfolgreich aufgerufen.");
    };

    // Funktion zum Überwachen des Elements
    const observer = new MutationObserver(() => {
        const dailyRewardsLi = document.getElementById("daily_rewards_li");

        if (dailyRewardsLi && dailyRewardsLi.classList.contains("daily_bonus_not_taken")) {
            // Prüfen, ob der Haken bereits eingefügt wurde
            const anchor = dailyRewardsLi.querySelector("a#menu_daily_rewards");
            if (anchor && !anchor.querySelector(".daily-rewards-checkmark")) {
                const checkmark = document.createElement("span");
                checkmark.textContent = "✔";
                checkmark.style.cursor = "pointer";
                checkmark.style.color = "green";
                checkmark.style.marginLeft = "10px";
                checkmark.title = "Belohnungen einlösen";
                checkmark.classList.add("daily-rewards-checkmark");

                // Event-Listener für Klick auf den Haken
                checkmark.addEventListener("click", (event) => {
                    event.stopPropagation(); // Verhindert, dass der Klick das Dropdown auslöst
                    executePostRequests();
                });

                // Haken innerhalb des Ankers hinzufügen
                anchor.appendChild(checkmark);
            }
        }
    });

    // Observer auf das gesamte Dokument anwenden
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
})();
