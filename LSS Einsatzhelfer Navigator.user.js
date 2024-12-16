// ==UserScript==
// @name         LSS Einsatzhelfer Navigator
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Fügt Buttons für vorherigen und nächsten Einsatz auf der Einsatzseite hinzu.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/einsaetze/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // Funktion um JSON Daten von der API zu holen
    function fetchMissions(callback) {
        const missions = GM_getValue("missions");
        const lastFetch = GM_getValue("lastFetch");
        const now = new Date().getTime();

        // Wenn die Daten älter als 24 Stunden sind oder noch nicht vorhanden, API-Abfrage durchführen
        if (!missions || !lastFetch || (now - lastFetch) > 24 * 60 * 60 * 1000) {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://www.leitstellenspiel.de/einsaetze.json",
                onload: function(response) {
                    if (response.status === 200) {
                        const missionsData = JSON.parse(response.responseText);
                        GM_setValue("missions", missionsData);
                        GM_setValue("lastFetch", now);
                        callback(missionsData);
                    } else {
                        console.error("Fehler beim Abrufen der Einsätze: " + response.status);
                        if (missions) {
                            callback(missions);
                        }
                    }
                }
            });
        } else {
            // Wenn die Daten noch gültig sind, aus dem Speicher laden
            callback(missions);
        }
    }

    // Funktion um die aktuelle Einsatz-ID und den Zusatz aus der URL zu extrahieren
    function getCurrentMissionID() {
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = window.location.pathname.split('/');
        const id = pathParts[pathParts.length - 1];
        const additiveOverlays = urlParams.get('additive_overlays');
        return { id, additiveOverlays };
    }

    // Funktion um die nächste und vorherige Einsatz-IDs zu finden
    function findAdjacentMissions(missions, currentID, currentAdditive) {
        let previousID = null;
        let nextID = null;
        let previousAdditive = null;
        let nextAdditive = null;

        for (let i = 0; i < missions.length; i++) {
            let missionID = missions[i].id;
            let missionAdditive = null;

            if (missionID.includes('/')) {
                const parts = missionID.split('/');
                missionID = parts[0];
                missionAdditive = parts[1];
            }

            if (missionID === currentID && missionAdditive === currentAdditive) {
                if (i > 0) {
                    previousID = missions[i - 1].id;
                    if (previousID.includes('/')) {
                        const parts = previousID.split('/');
                        previousID = parts[0];
                        previousAdditive = parts[1];
                    }
                }
                if (i < missions.length - 1) {
                    nextID = missions[i + 1].id;
                    if (nextID.includes('/')) {
                        const parts = nextID.split('/');
                        nextID = parts[0];
                        nextAdditive = parts[1];
                    }
                }
                break;
            }
        }

        return { previousID, previousAdditive, nextID, nextAdditive };
    }

    // Buttons einfügen und Klick-Ereignisse hinzufügen
    function insertNavigationButtons(previousID, previousAdditive, nextID, nextAdditive) {
        const header = document.querySelector('h1');
        if (!header) return;

        const previousButton = document.createElement('button');
        previousButton.innerText = "Vorheriger Einsatz";
        previousButton.className = "btn btn-default";
        previousButton.style.marginLeft = "10px";
        previousButton.onclick = function() {
            if (previousID) {
                let url = `https://www.leitstellenspiel.de/einsaetze/${previousID}`;
                if (previousAdditive) {
                    url += `?additive_overlays=${previousAdditive}`;
                }
                window.location.href = url;
            } else {
                alert("Kein vorheriger Einsatz gefunden.");
            }
        };

        const nextButton = document.createElement('button');
        nextButton.innerText = "Nächster Einsatz";
        nextButton.className = "btn btn-default";
        nextButton.style.marginLeft = "10px";
        nextButton.onclick = function() {
            if (nextID) {
                let url = `https://www.leitstellenspiel.de/einsaetze/${nextID}`;
                if (nextAdditive) {
                    url += `?additive_overlays=${nextAdditive}`;
                }
                window.location.href = url;
            } else {
                alert("Kein nächster Einsatz gefunden.");
            }
        };

        header.appendChild(previousButton);
        header.appendChild(nextButton);
    }

    // Hauptfunktion
    function main() {
        const { id, additiveOverlays } = getCurrentMissionID();
        fetchMissions(function(missions) {
            const { previousID, previousAdditive, nextID, nextAdditive } = findAdjacentMissions(missions, id, additiveOverlays);
            insertNavigationButtons(previousID, previousAdditive, nextID, nextAdditive);
        });
    }

    // Skript starten
    main();
})();
