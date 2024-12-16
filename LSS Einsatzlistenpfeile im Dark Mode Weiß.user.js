// ==UserScript==
// @name           LSS-Einsatzlistenpfeile im Dark Mode Weiß
// @namespace      leitstellenspiel.de
// @version        1.3r
// @description    Ändert die Sortier-Pfeile der Möglichen Einsatzliste in Weiß im Dark-Modus
// @author         MissSobol
// @match          https://www.leitstellenspiel.de/einsaetze
// @grant          GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Überprüfe das Erscheinungsbild der Website
    const backgroundColor = window.getComputedStyle(document.body).getPropertyValue('background-color');
    const isDarkMode = backgroundColor !== 'rgb(250, 250, 250)';

    // Wenn der Dark-Modus aktiv ist, ändere die Pfeilfarbe
    if (isDarkMode) {
        // Füge benutzerdefinierten CSS-Stil hinzu, um die Pfeile zu ändern
        GM_addStyle(`
            /* Entferne die Hintergrundgrafiken für Pfeile und setze die Hintergrundfarbe */
            .tablesorter-header.tablesorter-headerAsc {
                background-image: none !important;
               //background-color: #000000 !important;
                padding-right: 20px !important;
            }

            .tablesorter-header.tablesorter-headerDesc {
                background-image: none !important;
                //background-color: #000000 !important;
                padding-right: 20px !important;
            }

            .tablesorter-header.tablesorter-headerUnSorted {
                background-image: none !important;
                //background-color: #000000 !important;
                padding-right: 20px !important;
            }

            /* Füge benutzerdefinierte Pfeile hinzu */
            .tablesorter-header.tablesorter-headerAsc .tablesorter-header-inner::after {
                content: "▲";
                color: #ffffff !important;
                float: right !important;
            }
            .tablesorter-header.tablesorter-headerUnSorted .tablesorter-header-inner::after {
                content: "=";
                color: #ffffff !important;
                float: right !important;
            }
            .tablesorter-header.tablesorter-headerDesc .tablesorter-header-inner::after {
                content: "▼";
                color: #ffffff !important;
                float: right !important;
            }
        `);
    }
})();
