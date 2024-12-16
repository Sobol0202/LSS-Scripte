// ==UserScript==
// @name         LSS Easter Egg Checker
// @namespace    www.leitstellenspiel.de
// @version      1.12
// @description  Prüfe auf Ostereier und zeige das entsprechende Symbol im Easter-Egg-Element kurz in Groß an
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Setze diese Variable auf true, um das Remove-Script zu aktivieren, oder auf false, um es zu deaktivieren
    var removeScriptEnabled = true;

    // Prüfe, ob das Element mit der ID "easter-egg-link" vorhanden ist
    var easterEggLink = document.getElementById('easter-egg-link');

    if (easterEggLink) {
        var imageSrc = easterEggLink.querySelector('img').getAttribute('src');
        var audioSrc = '';
        var symbol = '';

        // Prüfe, ob der Bild-Quelltext das Wort "Pumpkin" enthält
        if (imageSrc.includes('pumpkin')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/boo-and-laugh-7060.mp3'; // URL zum Sound für Pumpkin
            symbol = '🎃';
        } else if (imageSrc.includes('oster')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/boing-6222.mp3'; // URL zum Sound für Easter
            symbol = '🐰';
        } else if (imageSrc.includes('heart')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/kiss.mp3'; // URL zum Sound für Valentinstag
            symbol = '❤️';
        } else if (imageSrc.includes('football')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/referee-whistle-blow-gymnasium-6320.mp3'; // URL zum Sound für Fußball
            symbol = '⚽';
        } else if (imageSrc.includes('santa')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/hohoho-36506.mp3'; // URL zum Sound für Christmas
            symbol = '🎅';
        } else if (imageSrc.includes('summer')) {
            audioSrc = 'https://github.com/Sobol0202/LSS-EasterEggHunter/raw/main/ChirpSound.mp3'; // URL zum Sound für Sommer
            symbol = '🌻';
        }

        if (audioSrc) {
            var audio = new Audio(audioSrc);

            // Zufällige Geschwindigkeit zwischen 0,5 und 1,5 festlegen
            audio.playbackRate = 0.5 + Math.random();

            // Warte auf das 'canplaythrough'-Event, um sicherzustellen, dass der Sound vollständig geladen ist
            audio.addEventListener('canplaythrough', function() {

                // Spiele den Sound ab
                audio.play();

                // Zeige das Symbol für 2 Sekunden an
                var symbolElement = document.createElement('div');
                symbolElement.innerHTML = '<span style="font-size: 600px;">' + symbol + '</span>';
                symbolElement.style.position = 'fixed';
                symbolElement.style.top = '0';
                symbolElement.style.left = '0';
                symbolElement.style.width = '100%';
                symbolElement.style.height = '100%';
                symbolElement.style.display = 'flex';
                symbolElement.style.justifyContent = 'center';
                symbolElement.style.alignItems = 'center';
                symbolElement.style.zIndex = '999999';
                document.body.appendChild(symbolElement);

                // Schließe das Symbol nach 2 Sekunden
                setTimeout(function() {
                    symbolElement.remove();
                }, 2000);
            });
        }
    }

    if (removeScriptEnabled) {
        // Funktion zum Entfernen des Alert-Elements mit dem spezifischen Text
        function removeSpecificAlertElement() {
            var alertElements = document.querySelectorAll('.alert.fade.in.alert-success');
            alertElements.forEach(function(alertElement) {
                // Überprüfe den Text des Alert-Elements
                if (alertElement.textContent.includes(' gefunden!')) {
                    // Wenn der spezifische Text gefunden wurde, entferne das Alert-Element
                    alertElement.remove();
                }
            });
        }

        // Funktion zum Überwachen von DOM-Änderungen
        function observeDOM() {
            var targetNode = document.body;

            // Konfiguration des Observers mit einer Callback-Funktion
            var config = { childList: true, subtree: true };

            // Callback-Funktion wird ausgeführt, wenn Änderungen im DOM festgestellt werden
            var callback = function(mutationsList, observer) {
                for (var mutation of mutationsList) {
                    if (mutation.type === 'childList') {
                        // Überprüfe, ob das Alert-Element mit dem spezifischen Text hinzugefügt wurde
                        removeSpecificAlertElement();
                    }
                }
            };

            // Erstelle einen Observer mit der angegebenen Konfiguration und Callback-Funktion
            var observer = new MutationObserver(callback);

            // Starte die Überwachung des Zielknotens für Änderungen
            observer.observe(targetNode, config);
        }

        // Führe das Skript direkt nach dem Laden der Seite aus
        observeDOM();
    }
})();
