// ==UserScript==
// @name         LSS Profil Navigation
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Füge Navigation durch Pfeiltasten auf der Profilseite hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um die Profil-ID aus der aktuellen URL zu extrahieren
    function getProfileId() {
        const match = window.location.href.match(/\/profile\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    // Funktion, um zu überprüfen, ob die Seite erreichbar ist
    async function isProfilePageAccessible(profileId) {
        const response = await fetch(`https://www.leitstellenspiel.de/profile/${profileId}`);
        return response.status !== 404;
    }

    // Funktion zum Navigieren zu einem neuen Profil
    async function navigateToProfile(newProfileId) {
        let originalProfileId = newProfileId;
        let maxProfileId = newProfileId + 100; // Überprüfe die nächsten 100 Profile
        while (!(await isProfilePageAccessible(newProfileId)) && newProfileId <= maxProfileId) {
            await sleep(100); // Warte 100ms zwischen den Abfragen
            newProfileId++;
            // Überprüfen, ob alle Profile bis zum Ausgangspunkt durchsucht wurden
            if (newProfileId === originalProfileId) {
                console.error('Kein erreichbares Profil gefunden.');
                return;
            }
        }
        window.location.href = `https://www.leitstellenspiel.de/profile/${newProfileId}`;
    }

    // Hilfsfunktion zum Warten
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Überwachen der Pfeiltasten links/rechts für die Navigation
    document.addEventListener('keydown', async (event) => {
        const currentProfileId = getProfileId();
        if (event.key === 'ArrowLeft') {
            await navigateToProfile(currentProfileId - 1);
        } else if (event.key === 'ArrowRight') {
            await navigateToProfile(currentProfileId + 1);
        }
    });
})();
