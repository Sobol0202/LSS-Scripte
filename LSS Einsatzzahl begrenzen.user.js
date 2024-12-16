// ==UserScript==
// @name         LSS Einsatzzahl begrenzen
// @namespace    www.leitstellenspiel.de
// @version      1.4
// @description  Überprüft die aktuelle Einsatzzahl und setzt automatisch Pause oder Run
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global user_premium, mission_count_max */

(function() {
    'use strict';

    // Festgelegter Grenzwert (Standardwert, wird durch Dialog ersetzt)
    let threshold = localStorage.getItem('max_einsatzzahl') ? parseInt(localStorage.getItem('max_einsatzzahl'), 10) : 729;

    // URLs für die unterschiedlichen Geschwindigkeiten abhängig vom Premium-Status
    const urlHighSpeed = "https://www.leitstellenspiel.de/missionSpeed?redirect_back=true&speed=6";
    const urlLowSpeedPremium = "https://www.leitstellenspiel.de/missionSpeed?redirect_back=true&speed=3";
    const urlLowSpeedNonPremium = "https://www.leitstellenspiel.de/missionSpeed?redirect_back=true&speed=2";

    // Variable, um den letzten Zustand zu speichern
    let lastStateHighSpeed = false;

    // Funktion zum Überprüfen der Einsatzzahl
    function checkEinsatzzahl() {
        // Überprüfen, ob die Variable user_premium existiert und ihren Wert ermitteln
        const userPremium = typeof user_premium !== 'undefined' ? user_premium : false;

        // Element mit der ID "mission_select_emergency" auswählen
        const einsatzElement = document.getElementById('mission_select_emergency');
        if (einsatzElement) {
            // Textinhalt des Elements auslesen
            const textContent = einsatzElement.textContent.trim();
            // Zahl nach dem / extrahieren
            const totalEinsaetze = parseInt(textContent.split('/')[1], 10);
            //console.log(`Gesamtzahl der Einsätze: ${totalEinsaetze} | Threshold: ${threshold} | Premium: ${userPremium}`);

            // Überprüfen, ob die Gesamtzahl der Einsätze den Grenzwert überschreitet
            if (totalEinsaetze > threshold && !lastStateHighSpeed) {
                // URL für hohe Geschwindigkeit im Hintergrund aufrufen
                fetch(urlHighSpeed).then(response => console.log('Pause gesetzt:', response));
                lastStateHighSpeed = true;
            } else if (totalEinsaetze <= threshold && lastStateHighSpeed) {
                // URL für niedrige Geschwindigkeit im Hintergrund aufrufen, abhängig vom Premium-Status
                const urlLowSpeed = userPremium ? urlLowSpeedPremium : urlLowSpeedNonPremium;
                fetch(urlLowSpeed).then(response => console.log('Run gesetzt:', response));
                lastStateHighSpeed = false;
            }
        } else {
            console.log('Das Element mit der ID "mission_select_emergency" wurde nicht gefunden.');
        }
    }

    // Funktion zum Einhaken in missionMarkerAdd
    function hookMissionMarkerAdd() {
        if (typeof window.missionMarkerAdd === 'function' && !window.missionMarkerAdd.logged) {
            const originalFunction = window.missionMarkerAdd;

            window.missionMarkerAdd = function() {
                //console.log('missionMarkerAdd function called with arguments:', arguments, lastStateHighSpeed);
                // Überprüfe die Einsatzzahl bei jedem Aufruf von missionMarkerAdd
                checkEinsatzzahl();
                return originalFunction.apply(this, arguments);
            };
            window.missionMarkerAdd.logged = true;
        }
    }

    // MutationObserver zur Überwachung von Änderungen im DOM
    const observer = new MutationObserver(() => {
        hookMissionMarkerAdd();
    });

    observer.observe(document, { childList: true, subtree: true });

    // Sofortiges Überprüfen, falls die Funktion bereits definiert ist
    hookMissionMarkerAdd();

    // Dialogfeld für die maximale Einsatzzahl
    function showThresholdDialog() {
        const maxAllowed = mission_count_max;
        const userInput = prompt(`Bitte gib die maximale Einsatzzahl ein (bei mehr als ${maxAllowed} schaltet das Script nie um):`);
        if (userInput !== null) {
            const newThreshold = parseInt(userInput, 10);
            if (!isNaN(newThreshold) && newThreshold >= 0) {
                threshold = newThreshold;
                // Speichern der neuen Einsatzzahl im LocalStorage
                localStorage.setItem('max_einsatzzahl', threshold);
                //console.log(`Maximale Einsatzzahl auf ${threshold} gesetzt.`);

                // Aktualisierung des Textes im Button mit der neuen Grenze
                const button = document.getElementById('btnSetMaxEinsatz');
                if (button) {
                    button.textContent = `Max. Einsatzzahl: ${threshold}`;
                } else {
                    console.log('Button nicht gefunden.');
                }
            } else {
                alert(`Ungültige Eingabe. Bitte gib eine Zahl größer oder gleich 0 ein.`);
            }
        }
    }

    // Button erstellen und einfügen
    function addThresholdButton() {
        const existingButton = document.getElementById('mission_select_sicherheitswache');
        if (existingButton && existingButton.parentNode) {
            // Erstelle den neuen Button
            const newButton = document.createElement('button');
            newButton.id = 'btnSetMaxEinsatz';
            newButton.className = 'btn btn-xs btn-default';
            newButton.addEventListener('click', showThresholdDialog);

            // Lade die aktuelle Grenze aus dem LocalStorage oder setze einen Standardwert
            const storedThreshold = localStorage.getItem('max_einsatzzahl');
            const currentThreshold = storedThreshold ? parseInt(storedThreshold, 10) : 729; // Standardwert 729

            // Setze den Text des Buttons entsprechend der aktuellen Grenze
            newButton.textContent = `Max. Einsatzzahl: ${currentThreshold}`;

            // Füge den neuen Button nach dem existierenden Button ein
            existingButton.parentNode.insertBefore(newButton, existingButton.nextSibling);
        } else {
            console.log('Das Element mit der ID "mission_select_sicherheitswache" oder dessen Elternknoten wurde nicht gefunden.');
        }
    }

    // Initialisierung des Buttons
    addThresholdButton();

    // Überprüfe die Einsatzzahl direkt beim Start des Skripts
    checkEinsatzzahl();

})();
