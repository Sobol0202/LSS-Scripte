// ==UserScript==
// @name         LSS Give me back my Grafiksets
// @namespace    https://www.leitstellenspiel.de/*
// @version      1.0
// @description  Fügt einen zusätzlichen Link "Grafiksets" zum Footer hinzu.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Erstelle ein neues Element für den "Grafiksets" Link
    var grafiksetsLink = document.createElement('a');
    grafiksetsLink.href = 'https://www.leitstellenspiel.de/vehicle_graphics';
    grafiksetsLink.target = '_blank'; // Öffnet den Link in einem neuen Tab
    grafiksetsLink.innerText = 'Grafiksets';

    // Finde das Element für "Impressum" im Footer
    var impressumLink = document.querySelector('.footer.hidden-xs a[href="/impressum"]');

    // Erstelle ein neues Element für den Trennpunkt
    var separator = document.createElement('span');
    separator.innerText = ' · ';

    // Füge den "Grafiksets" Link vor dem "Impressum" Link ein
    if (impressumLink && impressumLink.parentNode) {
        impressumLink.parentNode.insertBefore(grafiksetsLink, impressumLink);
        impressumLink.parentNode.insertBefore(separator, impressumLink);
    }
})();
