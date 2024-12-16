// ==UserScript==
// @name         LSS Scrollbar Verstecken
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Versteckt die Scrollbar in der Einsatzliste
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Füge CSS hinzu, um die Scrollbar auszublenden
    GM_addStyle(`
        #missions-panel-body {
            scrollbar-width: none; /* Firefox */
            -ms-overflow-style: none; /* Internet Explorer 10+ */
        }
        #missions-panel-body::-webkit-scrollbar {
            width: 0; /* WebKit */
            height: 0;
        }
    `);
})();
