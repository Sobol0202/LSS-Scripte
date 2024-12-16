// ==UserScript==
// @name         LSS Gebäudeeditbutton nach oben
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Legt die Gebäudebearbeiten Funktion ganz nach oben in die Kopfzeile
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Finde das Breadcrumb-Element
    var breadcrumb = document.querySelector('.breadcrumb li.active');

    // Überprüfe, ob das Breadcrumb-Element gefunden wurde
    if (breadcrumb) {
        // Füge einen Klick-Event-Listener hinzu
        breadcrumb.addEventListener('click', function() {
            // Finde den Button mit dem href "/buildings/id/edit"
            var editButton = document.querySelector('a[href^="/buildings/"][href$="/edit"]');

            // Überprüfe, ob der Button gefunden wurde
            if (editButton) {
                // Rufe die vorhandene Funktion für den Button-Klick auf
                simulateClick(editButton);
            }
        });
    }

    // Funktion zum simulierten Klicken auf ein Element
    function simulateClick(element) {
        var event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        element.dispatchEvent(event);
    }
})();
