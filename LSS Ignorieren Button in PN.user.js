// ==UserScript==
// @name         LSS Ignorieren Button in PN
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt einen "Nutzer ignorieren"-Button hinzu um User direkt in der PN zu ignorieren.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/messages/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Extrahieren der User ID aus dem href-Attribut
    function extractUserId(profileLink) {
        var userIdMatch = profileLink.href.match(/\/profile\/(\d+)/);
        return userIdMatch && userIdMatch[1] ? userIdMatch[1] : null;
    }

    // Funktion zum Hinzufügen des "Nutzer ignorieren"-Buttons
    function addIgnoreButton(container) {
        var profileLink = container.querySelector('a[href^="/profile/"]');
        if (profileLink) {
            var userId = extractUserId(profileLink);

            if (userId) {
                var ignoreButton = document.createElement('button');
                ignoreButton.textContent = 'Nutzer ignorieren';
                ignoreButton.className = 'btn btn-danger';
                ignoreButton.addEventListener('click', function() {
                    // Ignorieren-URL erstellen
                    var ignoreUrl = 'https://www.leitstellenspiel.de/ignoriert/hinzufuegen/' + userId + '?user=' + userId;

                    // Debug-Ausgabe
                    console.log('Ignorieren-URL:', ignoreUrl);

                    // Unsichtbare Anfrage an die Ignorieren-URL senden
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', ignoreUrl, true);
                    xhr.send();

                    // Seitenneuladen mit einer Verzögerung von 100ms
                    setTimeout(function() {
                        location.reload();
                    }, 100);
                });

                // Button dem Container hinzufügen
                container.appendChild(ignoreButton);
            }
        }
    }

    // Alle Nachrichten-Container auswählen
    var messageContainers = document.querySelectorAll('.well[data-message-time]');
    if (messageContainers) {
        messageContainers.forEach(function(container) {
            // "Nutzer ignorieren"-Button hinzufügen, wenn auf einer Nachrichten-Seite
            addIgnoreButton(container);
        });
    }
})();
