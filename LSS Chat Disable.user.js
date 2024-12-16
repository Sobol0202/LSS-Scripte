// ==UserScript==
// @name         LSS Chat Hider
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Versteckt den ingame Chat zum Screenshots machen.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Option: Aktiviere oder deaktiviere den Button
    var enableButton = false;

    // Füge einen Klick-Eventlistener zum "Chat" Text hinzu
    document.addEventListener('click', function(e) {
        if (e.target.id === 'chat_panel_heading') {
            // Überdecke oder entferne die Überdeckung für das mission_chat_messages Element
            toggleOverlay('mission_chat_messages');
        }
    });

    // Füge optional einen Button vor dem Wort "Chat" hinzu
    if (enableButton) {
        var chatHeading = document.getElementById('chat_panel_heading');
        if (chatHeading) {
            var toggleButton = document.createElement('button');
            toggleButton.className = 'btn btn-xs btn-default';
            toggleButton.textContent = '👁';
            toggleButton.addEventListener('click', function() {
                // Überdecke oder entferne die Überdeckung für das mission_chat_messages Element
                toggleOverlay('mission_chat_messages');
            });

            // Füge den Button vor dem Wort "Chat" ein
            chatHeading.insertBefore(toggleButton, chatHeading.firstChild);
        }
    }

    // Funktion zum Überdecken oder Entfernen der Überdeckung für ein bestimmtes Element
    function toggleOverlay(elementId) {
        var element = document.getElementById(elementId);
        if (element) {
            // Überprüfe, ob das Element bereits überdeckt ist
            var isOverlayed = element.style.display === 'none';

            // Überdecke oder entferne die Überdeckung je nach aktuellem Zustand
            element.style.display = isOverlayed ? '' : 'none';
        } else {
            // Konsolenausgabe für Debugging, falls das Element nicht gefunden wurde
            console.error('Element with ID', elementId, 'not found.');
        }
    }
})();
