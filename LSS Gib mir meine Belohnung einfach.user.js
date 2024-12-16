// ==UserScript==
// @name         LSS Gib mir meine Belohnung einfach
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt einen Haken hinzu um die Aufgabenbelohnungen einfacher ab zu holen.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Authentifizierungstoken (CSRF-Token) abrufen
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Liste der URLs, die nacheinander per POST aufgerufen werden sollen
    const postUrls = [
        "https://www.leitstellenspiel.de/tasks/claim_all_rewards",
        "https://www.leitstellenspiel.de/tasks/claim_all_rewards",
        "https://www.leitstellenspiel.de/tasks/claim_all_rewards",
        "https://www.leitstellenspiel.de/tasks/claim_all_rewards",
        "https://www.leitstellenspiel.de/tasks/claim_all_rewards",
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

    // Funktion zum Hinzufügen des Hakens
    const addCheckmark = (profileLi) => {
        if (!profileLi.querySelector(".profile-checkmark")) {
            const checkmark = document.createElement("span");
            checkmark.textContent = "✔";
            checkmark.style.cursor = "pointer";
            checkmark.style.color = "green";
            checkmark.style.marginLeft = "10px";
            checkmark.title = "Aktion ausführen";
            checkmark.classList.add("profile-checkmark");

            // Event-Listener für Klick auf den Haken
            checkmark.addEventListener("click", (event) => {
                event.stopPropagation(); // Verhindert, dass der Klick das Dropdown auslöst
                executePostRequests();
            });

            // Haken innerhalb des Ankers hinzufügen
            profileLi.appendChild(checkmark);
        }
    };

    // Funktion zum Entfernen des Hakens
    const removeCheckmark = (profileLi) => {
        const checkmark = profileLi.querySelector(".profile-checkmark");
        if (checkmark) {
            checkmark.remove();
        }
    };

    // Funktion zum Überwachen des Elements
    const observer = new MutationObserver(() => {
        const profileLi = document.querySelector("a#menu_profile");

        if (profileLi) {
            if (profileLi.classList.contains("alliance_forum_new")) {
                addCheckmark(profileLi);
            } else {
                removeCheckmark(profileLi);
            }
        }
    });

    // Observer auf das gesamte Dokument anwenden
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'] // Beobachtet nur Änderungen an Klassen
    });

    // Initialer Check beim Laden der Seite
    const profileLi = document.querySelector("a#menu_profile");
    if (profileLi && profileLi.classList.contains("alliance_forum_new")) {
        addCheckmark(profileLi);
    }
})();
