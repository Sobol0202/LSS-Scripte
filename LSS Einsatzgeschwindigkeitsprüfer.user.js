// ==UserScript==
// @name         LSS Einsatzgeschwindigkeitsprüfer
// @namespace    www.leitstellenspiel.de
// @version      1.3
// @description  Berechnet den Durchschnitt der Zeit zwischen Einsätzen.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    const last100Times = []; // Array zur Speicherung der Zeiten der letzten 100 Einsätze

    // Funktion zum Hinzufügen einer Zeit zur Liste der letzten 100 Zeiten
    function addTimeToLast100(time) {
        last100Times.push(time);
        if (last100Times.length > 100) {
            last100Times.shift(); // Entfernt das älteste Element, wenn die Liste mehr als 100 Einträge hat
        }
    }

    // Funktion zum Berechnen des Durchschnitts der Zeiten in Sekunden
    function calculateAverageTime() {
        if (last100Times.length === 0) {
            console.log("Keine Einsätze gefunden.");
            return;
        }

        const sum = last100Times.reduce((total, time) => total + time, 0);
        const averageInSeconds = sum / last100Times.length;
        console.log("Durchschnittliche Zeit zwischen Einsätzen (in Sekunden):", averageInSeconds);
    }

    let lastMissionId = getLastMissionId();

    function getLastMissionId() {
        const missionList = document.getElementById('mission_list');
        if (missionList) {
            const missions = missionList.querySelectorAll('[search_attribute]');
            if (missions.length > 0) {
                const latestMission = missions[0];
                return latestMission.getAttribute('mission_id');
            }
        }
        return null;
    }

    let lastMissionTime = Date.now();

    // Erstellen eines Mutation Observers
    const missionList = document.getElementById('mission_list');
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            const newNodes = mutation.addedNodes;
            for (const newNode of newNodes) {
                if (newNode.nodeType === Node.ELEMENT_NODE && newNode.getAttribute('search_attribute')) {
                    const missionId = newNode.getAttribute('mission_id');
                    if (parseInt(missionId) > parseInt(lastMissionId)) {
                        const missionName = newNode.getAttribute('search_attribute');
                        const missionTime = Date.now();
                        const timeDifference = (missionTime - lastMissionTime) / 1000; // Zeitdifferenz in Sekunden
                        addTimeToLast100(timeDifference);
                        //console.log("Neuer Einsatz:", missionName);
                        //console.log("Zeit seit letztem Einsatz (in Sekunden):", timeDifference);
                        lastMissionTime = missionTime;
                        lastMissionId = missionId;
                        calculateAverageTime(); // Berechnet und gibt den Durchschnitt in der Konsole aus
                    }
                    break; // Beende die Schleife, sobald ein neuer Einsatz gefunden wurde
                }
            }
        });
    });

    // Konfiguration des Observers und Starten der Überwachung
    const config = { childList: true, subtree: true };
    observer.observe(missionList, config);
})();
