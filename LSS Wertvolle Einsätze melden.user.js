// ==UserScript==
// @name         LSS Wertvolle Einsätze melden
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Überwachung und Meldung von Wertvollen Einsätzen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const CREDIT_THRESHOLD = 20000; // Filterwert für Credits
    const ALERT_INTERVAL = 60000; // Mindestzeit zwischen Alerts in Millisekunden
    let lastAlertTime = 0; // Zeitstempel des letzten Alerts

    // Überwachungsfunktion für Einsätze
    function checkMissions() {
        //console.log('Starte Überprüfung der Einsätze...');

        const lists = [
            { id: 'mission_list', target: 'mission_select_emergency' },
            { id: 'mission_list_sicherheitswache', target: 'mission_select_sicherheitswache' },
            { id: 'mission_list_sicherheitswache_alliance', target: 'mission_select_sicherheitswache' },
            { id: 'mission_list_alliance', target: 'mission_select_alliance' }
        ];

        lists.forEach(list => {
            //console.log(`Überprüfe Liste mit ID: ${list.id}`);
            const listElement = document.getElementById(list.id);
            const targetElement = document.getElementById(list.target);
            if (!listElement || !targetElement) {
                console.warn(`Element mit ID ${list.id} oder ${list.target} nicht gefunden.`);
                return;
            }

            const missions = listElement.querySelectorAll('.missionSideBarEntry');
            let hasHighValueMission = false;

            missions.forEach(mission => {
                //console.log(`Überprüfe Einsatz mit ID: ${mission.id}`);
                const data = mission.getAttribute('data-sortable-by');
                if (!data) {
                    console.warn(`Einsatz mit ID ${mission.id} hat keine Daten.`);
                    return;
                }

                const missionData = JSON.parse(data.replace(/&quot;/g, '"'));
                const averageCredits = missionData.average_credits;
                const hasAsterisk = mission.querySelector('.glyphicon-asterisk:not(.hidden)');

                //console.log(`Einsatz: ${missionData.caption}, Credits: ${averageCredits}, Asterisk sichtbar: ${!!hasAsterisk}`);

                if (averageCredits > CREDIT_THRESHOLD && hasAsterisk) {
                    hasHighValueMission = true;
                }
            });

            if (hasHighValueMission) {
                const currentTime = Date.now();
                if (currentTime - lastAlertTime >= ALERT_INTERVAL) {
                    console.log(`Mindestens ein hochwertiger Einsatz in Liste ${list.id} gefunden.`);
                    alert(`Wertvoller Einsatz in ${list.id} gefunden`);
                    lastAlertTime = currentTime; // Zeitstempel aktualisieren
                }

                if (!targetElement.textContent.includes('!')) {
                    targetElement.textContent += ' !';
                    //console.warn(`Ausrufezeichen zu ${list.target} hinzugefügt.`);
                }
            } else {
                if (targetElement.textContent.includes(' !')) {
                    targetElement.textContent = targetElement.textContent.replace(' !', '');
                    //console.warn(`Ausrufezeichen von ${list.target} entfernt.`);
                }
            }
        });
    }

    // Proxy für missionMarkerAdd erstellen
    function proxyMissionMarkerAdd() {
        const interval = setInterval(() => {
            if (typeof window.missionMarkerAdd === 'function' && !window.missionMarkerAdd.proxied) {
                const originalFunction = window.missionMarkerAdd;
                window.missionMarkerAdd = function() {
                    //console.log('missionMarkerAdd function called. Starte Überprüfung der Einsätze.');
                    checkMissions();
                    return originalFunction.apply(this, arguments);
                };
                window.missionMarkerAdd.proxied = true;
                //console.log('Proxy für missionMarkerAdd erstellt.');
                clearInterval(interval);
            }
        }, 100);
    }

    // Initialer Check beim Laden der Seite
    //console.log('Initialer Seitencheck gestartet.');
    checkMissions();

    // Proxy missionMarkerAdd für dynamische Änderungen erstellen
    proxyMissionMarkerAdd();
})();
