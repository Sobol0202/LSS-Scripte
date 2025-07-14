// ==UserScript==
// @name         Einsatzlisten frei sortierbar.u
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Erlaubt das einfache Festlegen der Reihenfolge der Einsatzlisten
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Hier REIHENFOLGE anpassen:
    var order = [
        'mission_list_sicherheitswache',
        'mission_list_sicherheitswache_alliance',
        'mission_list_krankentransporte',
        'mission_list',
        'mission_list_alliance',
        'mission_list_alliance_event'
    ];

    function reorderLists() {
        var firstElement = null;
        order.forEach(function(id) {
            var element = document.getElementById(id);
            if (element) {
                if (firstElement === null) {
                    // Ersten gefundenen als Referenz setzen
                    firstElement = element;
                } else {
                    // Danach jedes Element vor dem Referenz-Element einfügen
                    firstElement.parentNode.insertBefore(element, firstElement.nextSibling);
                    firstElement = element;
                }
            }
        });
    }

    // Warten bis DOM fertig ist
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', reorderLists);
    } else {
        reorderLists();
    }
})();
