// ==UserScript==
// @name         [LSS] Forum: Forumbeschreibung ausblenden
// @namespace    forum.leitstellenspiel.de
// @version      1.1
// @description  Blendet die Forenbeschreibungen aus.
// @author       MissSobol
// @match        https://forum.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Selektiere alle Elemente mit der Klasse "wbbBoardDescription"
    var elements = document.getElementsByClassName('wbbBoardDescription');

    // Iteriere durch alle ausgewählten Elemente und blende sie aus
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = 'none';
    }
})();