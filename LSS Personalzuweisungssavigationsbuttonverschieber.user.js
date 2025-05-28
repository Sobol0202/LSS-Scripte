// ==UserScript==
// @name         LSS Personalzuweisungssavigationsbuttonverschieber
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Verschiebt die Navigationsbuttons im Personalzuweisungsfenster und fügt Tastennavigation ein.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicles/*/zuweisung
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const btnGroup = document.querySelector('.btn-group.pull-right');
    const pageHeader = document.querySelector('.page-header');
    const h1 = pageHeader?.querySelector('h1');

    if (btnGroup && h1 && pageHeader) {
        // Buttons größer machen
        btnGroup.querySelectorAll('.btn').forEach(btn => {
            btn.classList.remove('btn-xs');
        });

        // Buttons nebeneinander
        pageHeader.style.display = 'flex';
        pageHeader.style.alignItems = 'center';
        h1.style.marginRight = '8px';
        btnGroup.style.margin = '0';
        btnGroup.style.display = 'inline-flex';

        // Buttons direkt hinter das h1 setzen
        pageHeader.insertBefore(btnGroup, h1.nextSibling);

        // Tastatursteuerung
        const buttons = btnGroup.querySelectorAll('a');
        const leftBtn = buttons[0];
        const rightBtn = buttons[1];

        document.addEventListener('keydown', function(e) {
            // Eingabefeld-Fokus ignorieren
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

            if (e.key === 'ArrowLeft' && leftBtn) {
                leftBtn.click();
            } else if (e.key === 'ArrowRight' && rightBtn) {
                rightBtn.click();
            }
        });
    }
})();
