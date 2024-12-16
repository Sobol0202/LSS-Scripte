// ==UserScript==
// @name         LSS-Kartenkreuz
// @namespace    leitstellenspiel
// @version      4r
// @description  Fügt ein Kreuz in der Mitte der Karte auf www.leitstellenspiel.de hinzu
// @match        https://www.leitstellenspiel.de*
// @grant        None
// @author       MissSobol
// ==/UserScript==

(function() {
    'use strict';

    // CSS für das Kreuz
    var crossStyle = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        z-index: 9999;
        background-color: transparent;
        pointer-events: none;
    `;

    // CSS für die Kreuzlinien
    var lineStyle = `
        position: absolute;
        top: 50%;
        left: 50%;
        width: 30px;
        height: 2px;
        background-color: gray;
        transform-origin: center;
    `;

    // Kreuz-Element erstellen und dem map_outer-Element hinzufügen
    var mapOuter = document.getElementById('map_outer');
    var cross = document.createElement('div');
    cross.style = crossStyle;

    // Kreuzlinien erstellen und dem Kreuz-Element hinzufügen
    var line1 = document.createElement('div');
    line1.style = lineStyle + 'transform: translate(-50%, -50%) rotate(0deg);';
    var line2 = document.createElement('div');
    line2.style = lineStyle + 'transform: translate(-50%, -50%) rotate(90deg);';

    cross.appendChild(line1);
    cross.appendChild(line2);

    mapOuter.appendChild(cross);
})();
