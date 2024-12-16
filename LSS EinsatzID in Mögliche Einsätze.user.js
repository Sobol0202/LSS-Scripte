// ==UserScript==
// @name         LSS EinsatzID in Mögliche Einsätze
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Fügt die Einsatz-IDs zu jedem Einsatz in der Liste "Mögliche Einsätze" ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/einsaetze
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Finde alle Einsatz-Zeilen
    var einsatzZeilen = document.querySelectorAll('tr[data-filterable-by-name]');

    // Iteriere über jede Einsatz-Zeile
    einsatzZeilen.forEach(function(zeile) {
        // Extrahiere die Einsatz-ID aus dem href-Attribut des ersten Links in der Zeile
        var einsatzLink = zeile.querySelector('a[href^="/einsaetze/"]');
        var href = einsatzLink.getAttribute('href');

        // Entferne "?additive_overlays=" aus dem href, falls vorhanden
        href = href.replace('?additive_overlays=', '');

        // Entferne "?overlay_index=0" aus dem href, falls vorhanden
        href = href.replace('?overlay_index=0', '');

        var einsatzID = href.split('/').pop();

        // Erstelle ein neues Element für die Einsatz-ID
        var idElement = document.createElement('td');
        idElement.textContent = einsatzID;

        // Füge das ID-Element am Anfang der Zeile hinzu
        zeile.insertBefore(idElement, zeile.firstChild);
    });
})();
