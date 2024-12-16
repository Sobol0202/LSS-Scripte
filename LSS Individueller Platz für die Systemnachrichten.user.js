// ==UserScript==
// @name         LSS Individueller Platz für die Systemnachrichten
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Erweitert die Anzeige von Systemnachrichte.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/messages
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion, um das Resize-Verhalten des Elements zu ändern
    function adjustMessageContainer(container) {
        container.style.resize = 'vertical';
        container.style.overflowX = 'hidden';
        container.style.overflowY = 'auto';
        container.style.maxHeight = '2000px'; // Setze die maximale Höhe des Containers auf 2000px (kann angepasst werden)

        // Speichere die Größe im Local Storage
        container.addEventListener('mouseup', function() {
            localStorage.setItem('messageContainerHeight', container.offsetHeight);
        });
    }

    // Warte auf das Laden der Seite
    //window.addEventListener('load', function() {
        // Finde das Nachrichtencontainer-Element
        var container = document.querySelector('.system_messages_content_container');

        // Lade die gespeicherte Größe aus dem Local Storage und wende sie an
        var savedHeight = localStorage.getItem('messageContainerHeight');
        if (savedHeight) {
            container.style.height = savedHeight + 'px';
        }

        // Füge das Resize-Verhalten zum Nachrichtencontainer hinzu
        if (container) {
            adjustMessageContainer(container);
        }
    ;
})();
