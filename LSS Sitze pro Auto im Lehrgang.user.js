// ==UserScript==
// @name         LSS Sitze pro Auto im Lehrgang
// @namespace    www.leitstellenspiel.de
// @version      0.8
// @description  Fügt die Anzahl der Fahrzeugplätze bei den Lehrgängen ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    //console.log('Script wird ausgeführt...');

    // Array der Originaltexte und ihrer Änderungen
    var textChanges = [
        { original: 'GW-Messtechnik Lehrgang', change: ' || 3 Pro Fahrzeug' },
        { original: 'GW-Gefahrgut Lehrgang', change: ' || 3 Pro Fahrzeug' },
        { original: 'Höhenrettung Lehrgang', change: ' || 9 Pro Fahrzeug' },
        { original: 'ELW 2 Lehrgang', change: ' || 6 Pro Fahrzeug' },
        { original: 'Wechsellader Lehrgang', change: ' || 3 Pro Fahrzeug' },
        { original: 'Dekon-P Lehrgang', change: ' || 6 Pro Fahrzeug' },
        { original: 'Feuerwehrkran Lehrgang', change: ' || 2 Pro Fahrzeug' },
        { original: 'GW-Wasserrettung Lehrgang', change: ' || 6 Pro Fahrzeug' },
        { original: 'GW-Taucher Lehrgang', change: ' || 2 Pro Fahrzeug' },
        { original: 'Notarzt-Ausbildung', change: ' || 2/3 Pro Fahrzeug' },
        { original: 'Flugfeldlöschfahrzeug-Ausbildung', change: ' || 3 Pro Fahrzeug' },
        { original: 'Rettungstreppen-Ausbildung', change: ' || 2 Pro Fahrzeug' },
        { original: 'Werkfeuerwehr-Ausbildung', change: ' || 9/3 Pro Fahrzeug' },
        { original: 'Intensivpflege', change: ' || 3 Pro Fahrzeug' },
        { original: 'NEA200 Fortbildung', change: ' || 1 im Zugfahrzeug' },
        { original: 'Drohnen-Schulung', change: ' || 5 (ELW), 6 (ELW2) Pro Fahrzeug' },
        { original: 'Zugführer (leBefKw)', change: ' || 3 Pro Fahrzeug' },
        { original: 'Hundertschaftsführer (FüKw)', change: ' || 3 Pro Fahrzeug' },
        { original: 'Polizeihubschrauber', change: ' || 3 Pro Fahrzeug' },
        { original: 'Wasserwerfer', change: ' || 5 Pro Fahrzeug' },
        { original: 'SEK', change: ' || 4/9 Pro Fahrzeug' },
        { original: 'MEK', change: ' || 4/9 Pro Fahrzeug' },
        { original: 'Hundeführer (Schutzhund)', change: ' || 2 Pro Fahrzeug' },
        { original: 'Motorradstaffel', change: ' || 1 Pro Fahrzeug' },
        { original: 'Brandbekämpfung', change: ' || 1 Pro Fahrzeug' },
        { original: 'Kriminalpolizei', change: ' || 2 Pro Fahrzeug' },
        { original: 'Dienstgruppenleitung', change: ' || 2 Pro Fahrzeug' },
        { original: 'Reiterstaffel', change: ' || 2/4/6 Pro Fahrzeug' },
        { original: 'LNA-Ausbildung', change: ' || 1 Pro Fahrzeug' },
        { original: 'OrgL-Ausbildung', change: ' || 1 Pro Fahrzeug' },
        { original: 'SEG - Einsatzleitung', change: ' || 2 Pro Fahrzeug' },
        { original: 'SEG - GW-San', change: ' || 6 Pro Fahrzeug' },
        { original: 'SEG Drohne', change: ' || 4 Pro Fahrzeug' },
        { original: 'Betreuungsdienst', change: ' || 3/9 Pro Fahrzeug' },
        { original: 'Verpflegungshelfer', change: ' || 9 Pro Fahrzeug' },
        { original: 'Zugtrupp', change: ' || 4 Pro Fahrzeug' },
        { original: 'Fachgruppe Räumen', change: ' || 3/6 Pro Fahrzeug' },
        { original: 'Fachgruppe Wassergefahren', change: ' || 2 Pro Fahrzeug' },
        { original: 'Fachgruppe Bergungstaucher', change: ' || 2 Pro Fahrzeug' },
        { original: 'Fachgruppe Rettungshundeführer', change: ' || 4 Pro Fahrzeug' },
        { original: 'Fachgruppe Wasserschaden/Pumpen', change: ' || 3/7 Pro Fahrzeug' },
        { original: 'Fachgruppe Schwere Bergung', change: ' || 9 Pro Fahrzeug' },
        { original: 'Fachgruppe Elektroversorgung', change: ' || 3 Pro Fahrzeug' },
        { original: 'Trupp Unbemannte Luftfahrtsysteme', change: ' || 4 Pro Fahrzeug' },
    ];

    // Suche nach allen Elementen mit der Klasse "radio"
    var radioElements = document.querySelectorAll('.radio');

    //console.log('Gefundene Radio-Elemente:', radioElements);

    // Iteriere über alle gefundenen Radio-Elemente
    radioElements.forEach(function(radio) {
        // Überprüfe den Text des Labels innerhalb des Radio-Elements
        var labelElement = radio.querySelector('label.radio');
        if (labelElement) {
            //console.log('Gefundenes Label-Element:', labelElement);

            // Suche nach dem Input-Element
            var inputElement = labelElement.querySelector('input.radio');
            if (inputElement) {
                // Iteriere über alle Änderungen und wende sie an, wenn der Originaltext übereinstimmt
                textChanges.forEach(function(change) {
                    if (labelElement.textContent.includes(change.original)) {
                        var textNode = document.createTextNode(change.change);
                        labelElement.appendChild(textNode);
                        //console.log('Text geändert für:', change.original);
                    }
                });
            }
        }
    });

    //console.log('Skript abgeschlossen.');
})();
