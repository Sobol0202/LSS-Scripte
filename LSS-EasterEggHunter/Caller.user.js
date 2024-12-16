// ==UserScript==
// @name         Telefonanruf-Simulation
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Simuliert eingehende Telefonanrufe für das Leitstellenspiel
// @author       You
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let incomingCallActive = false;

    // Funktion zum Zufälligen Auswählen von Anrede und Nachname
    function zufälligerAnrufer() {
        const anreden = ['Hallo', 'Guten Tag', 'Mein Name ist', 'Hier', 'Hallo, Feuerwehr?', 'Hallo, Polizei?', '', 'CallerName', 'CallerName von der Polizei', 'Dies ist ein automatischer Notruf von'];
        const nachnamen = ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Meyer', 'Weber', 'Schulz', 'Wagner', 'Becker', 'Hoffmann'];
        const anrede = anreden[Math.floor(Math.random() * anreden.length)];
        const nachname = nachnamen[Math.floor(Math.random() * nachnamen.length)];
        return anrede + ' ' + (Math.random() < 0.5 ? 'Herr' : 'Frau') + ' ' + nachname;
    }

    // Funktion zum Auslösen des eingehenden Anrufs
    function triggerIncomingCall(missionElement) {
        missionElement.classList.add('animated');
                // Sound abspielen (vor dem Annehmen des Anrufs)
        const audio = new Audio('https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/a320-tritone-chime-104562.mp3'); // Ersetzen Sie 'https://www.example.com/ringtone.mp3' durch den tatsächlichen Sounddatei-URL
        audio.loop = true; // Schleife für kontinuierliches Klingeln
        audio.play();

        const missionText = missionElement.getAttribute('search_attribute');
        const missionName = missionText.split(',')[0].trim();
        const missionAddress = missionText.split(',')[1].trim();
        const meldung = "Ich möchte melden: " + missionName;
        const adresse = missionAddress;

        // Erstellen Sie den Button für eingehende Anrufe
        const acceptCallButton = document.createElement('button');
        acceptCallButton.innerHTML = 'Anruf annehmen';
        acceptCallButton.style.position = 'fixed';
        acceptCallButton.style.top = '50%';
        acceptCallButton.style.left = '75%';
        acceptCallButton.style.transform = 'translate(-50%, -50%)';
        acceptCallButton.style.width = '200px';
        acceptCallButton.style.height = '100px';
        acceptCallButton.style.backgroundColor = 'green';
        acceptCallButton.style.color = 'white';
        acceptCallButton.style.fontSize = '20px';
        acceptCallButton.style.border = 'none';
        acceptCallButton.style.borderRadius = '10px';
        acceptCallButton.style.zIndex = '9999';
        acceptCallButton.style.animation = 'blink 1s infinite';
        acceptCallButton.onclick = function() {
            // Wenn der Button geklickt wird, spiele den vorgelesenen Text ab
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(zufälligerAnrufer() + ', ' + meldung + ', ' + adresse);
            utterance.lang = 'de-DE';
            synth.speak(utterance);

            // Formular ausblenden und Einsatzelement sichtbar machen
            missionElement.classList.remove('animated');
            // Den Button entfernen, nachdem der Anruf angenommen wurde
            document.body.removeChild(acceptCallButton);
            incomingCallActive = false;
            audio.pause();
        };

        // Füge den Button zum Dokument hinzu
        document.body.appendChild(acceptCallButton);
        incomingCallActive = true;
    }

    // Überwachen Sie Änderungen im mission_list-Element
    const missionList = document.getElementById('mission_list');
    if (missionList) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                // Überprüfen Sie, ob ein neues Element hinzugefügt wurde und kein aktiver Anruf vorhanden ist
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0 && !incomingCallActive) {
                    // Neues Element wurde hinzugefügt, Auslösen des eingehenden Anrufs
                    const newMissionElement = Array.from(mutation.addedNodes).find(node => node.classList.contains('missionSideBarEntry'));
                    if (newMissionElement) {
                        triggerIncomingCall(newMissionElement);
                    }
                }
            });
        });

        // Konfigurieren und starten Sie den Beobachter für das mission_list-Element
        const config = { childList: true };
        observer.observe(missionList, config);
    }

    // Stil und Animation für den blinkenden Button
    const style = document.createElement('style');
    style.textContent = `
        @keyframes blink {
            0% { background-color: red; }
            50% { background-color: green; }
            100% { background-color: red; }
        }
    `;
    document.head.appendChild(style);
})();
