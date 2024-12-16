// ==UserScript==
// @name         LSS Neuer Einsatz vorleser
// @namespace    www.leitstellenspiel.de
// @version      1.6
// @description  Liest neue Missionen vor.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

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

    // Funktion zum Vorlesen des Textes
    function speakText(text) {
        const speechSynthesis = window.speechSynthesis;
        const speechUtterance = new SpeechSynthesisUtterance(`Neuer Einsatz: ${text}`);
        speechSynthesis.speak(speechUtterance);
    }

    // Erstellen eines Mutation Observers
    const missionList = document.getElementById('mission_list');
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            const newNodes = mutation.addedNodes;
            for (const newNode of newNodes) {
                if (newNode.nodeType === Node.ELEMENT_NODE && newNode.getAttribute('search_attribute')) {
                    const missionId = newNode.getAttribute('mission_id');
                    //console.log('Neue Mission ID:', missionId);
                    //console.log('Letzte Mission ID:', lastMissionId);
                    if (parseInt(missionId) > parseInt(lastMissionId)) {
                        const searchAttribute = newNode.getAttribute('search_attribute');
                        if (searchAttribute) {
                            //console.log('Neuer Einsatz gefunden:', searchAttribute);
                            speakText(searchAttribute);
                            lastMissionId = missionId;
                            //console.log('Letzte Mission ID aktualisiert auf:', lastMissionId);
                        }
                    }
                }
            }
        });
    });

    // Konfiguration des Observers und Starten der Überwachung
    const config = { childList: true, subtree: true };
    observer.observe(missionList, config);
})();
