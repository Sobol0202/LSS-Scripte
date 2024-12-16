// ==UserScript==
// @name         LSS Anti Coins
// @namespace    www.leitstellenspiel.de
// @version      1.3
// @description  Versteckt in der Wache die Menschenhandelelemente und die Coins-Buttons im Fahrzeugmarkt, sowie die Buttons um Erweiterung mit Coins zu kaufen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Schalter für die einzelnen Funktionen
    const hideHumanTraffickingElements = true; // Funktion zum Verstecken der Menschenhandelelemente aktivieren/deaktivieren
    const hideCoinButtons = true; // Funktion zum Verstecken der Coins-Buttons im Fahrzeugmarkt aktivieren/deaktivieren
    const hideExtensionButtons = true; // Funktion zum Verstecken der Buttons um Erweiterung mit Coins zu kaufen aktivieren/deaktivieren
    const hideFinishMissionButton = true; // Funktion zum Verstecken des "Sofort beenden"-Buttons auf der Missionsseite aktivieren/deaktivieren

    // Funktion zum Extrahieren der Gebäude-ID aus der URL
    function getBuildingIDFromURL() {
        const urlParts = window.location.href.split('/');
        return urlParts[urlParts.length - 2];
    }

    // Funktion zum Ausblenden der Menschenhandelelemente
    function hideHumanTraffickingElementsFunction() {
        // Replace BuildingID with a placeholder
        const placeholder = getBuildingIDFromURL();

        // Selector für den Direkteinstellen Button
        const firstElementSelector = `a[href="/buildings/${placeholder}/hire_do/coins"]`;

        // Selector für den Multi-Direkteinstellen Button
        const secondElementSelector = `a[href="/buildings/${placeholder}/hire_do/coins_multiple"]`;

        // Selector für das Ausgebildete Modul
        const thirdElementSelector = 'div:has(h2:contains("Ausgebildetes Personal"))';

        // Elemente ausblenden
        const firstElement = document.querySelector(firstElementSelector);
        const secondElement = document.querySelector(secondElementSelector);
        const thirdElement = findElementByTextContent('Ausgebildetes Personal');
        const fourthElement = findElementByInfoText('Du kannst eine begrenzte Anzahl von Leuten verschieben.');

        if (firstElement) firstElement.style.display = 'none';
        if (secondElement) secondElement.style.display = 'none';
        if (thirdElement) thirdElement.style.display = 'none';
        if (fourthElement) fourthElement.style.display = 'none';
    }

    // Funktion zum Finden eines Elements nach Textinhalt
    function findElementByTextContent(text) {
        const elements = document.querySelectorAll('h2');
        for (const element of elements) {
            if (element.textContent.includes(text)) {
                return element.closest('div');
            }
        }
        return null;
    }

    // Funktion zum Finden eines Elements nach dem Info-Text
    function findElementByInfoText(text) {
        const elements = document.querySelectorAll('div.alert.alert-info');
        for (const element of elements) {
            if (element.textContent.includes(text)) {
                return element;
            }
        }
        return null;
    }

    // Funktion zum Ausblenden der Coins-Buttons im Fahrzeugmarkt
    function hideCoinButtonsFunction() {
        // Alle Links auf der Seite auswählen
        var links = document.querySelectorAll('a');

        // Durch jede Verlinkung iterieren
        links.forEach(function(link) {
            // Überprüfen, ob der Link das Wort "Coins" enthält
            if (link.innerText.includes("Coins")) {
                // Verlinkung ausblenden
                link.style.display = "none";
            }
        });
    }

    // Funktion zum Ausblenden der Buttons um Erweiterung mit Coins zu kaufen
    function hideExtensionButtonsFunction() {
        // Suche nach allen Buttons, die das Wort "Coins" enthalten
        const coinsButtons = document.querySelectorAll('a.btn[data-confirm][data-method][rel="nofollow"]:not(.hidden)');

        // Schleife durch jede gefundene Schaltfläche und verstecke sie
        coinsButtons.forEach(button => {
            if (button.innerText.includes('Coins')) {
                button.style.display = 'none';
            }
        });
    }

    // Funktion zum Ausblenden des "Sofort beenden"-Buttons auf der Missionsseite
    function hideFinishMissionButtonFunction() {
        const finishMissionButton = document.getElementById('mission_finish_now_btn');
        if (finishMissionButton) {
            finishMissionButton.style.display = 'none';
        }
    }

    // Skript sofort nach dem Laden der DOM-Elemente ausführen
    if (hideHumanTraffickingElements && window.location.href.includes("/buildings/")) {
        hideHumanTraffickingElementsFunction();
    }

    // Skript sofort nach dem Laden der DOM-Elemente ausführen
    if (hideCoinButtons && window.location.href.includes("/buildings/")) {
        hideCoinButtonsFunction();
    }

    // Skript sofort nach dem Laden der DOM-Elemente ausführen
    if (hideExtensionButtons && window.location.href.includes("/buildings/")) {
        hideExtensionButtonsFunction();
    }

    // Skript sofort nach dem Laden der DOM-Elemente ausführen
    if (hideFinishMissionButton && window.location.href.includes("/missions/")) {
        hideFinishMissionButtonFunction();
    }

})();
