// ==UserScript==
// @name         LSS Neue AAO im Einsatzfenster
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Fügt einen Button zum Erzeugen einer neuen AAO im Einsatzfenster ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @match        https://www.leitstellenspiel.de/aaos/new
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Ausblenden des Close-Buttons im Einsatzfenster
    function hideCloseButton() {
        parent.eval("parent.eval('lightboxShowClose(false);');");
    }

    // Funktion zum Neuladen des Einsatzfensters
    function reloadMissionWindow() {
        parent.location.reload();
    }

    // Wenn wir im Einsatzfenster sind
    if (window.location.pathname.startsWith('/missions/')) {
        // Erstelle den neuen Button
        var newButton = document.createElement("a");
        newButton.setAttribute("class", "btn btn-xs btn-default lightbox-open");
        newButton.setAttribute("href", "/aaos/new");
        newButton.innerHTML = "Neue AAO Anlegen";

        // Finde das Element, bevor dem der neue Button eingefügt werden soll
        var targetElement = document.getElementById("navbar-right-help-button");

        // Füge den neuen Button vor dem Ziel-Element ein
        targetElement.parentNode.insertBefore(newButton, targetElement);

        // Füge einen Eventlistener hinzu, um auf Klicks des neuen Buttons zu reagieren
        newButton.addEventListener("click", function(event) {
            event.preventDefault();
        });
    }
    // Wenn wir im AAO-Fenster sind und das AAO-Fenster in einem Einsatzfenster geöffnet wurde
    else if (window.location.pathname.startsWith('/aaos/new') && parent.location.pathname.startsWith('/missions/')) {
        // Rufe die Funktionen zum Ausblenden des Close-Buttons und zum Neuladen des Einsatzfensters auf
        hideCloseButton();
        // Füge einen Eventlistener für das Lightbox-Close-Event hinzu
        window.addEventListener("unload", reloadMissionWindow);
    }
})();
