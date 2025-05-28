// ==UserScript==
// @name         LSS Personalzuweisungssavigationsbuttonverschieber
// @namespace    http://tampermonkey.net/
// @version      1.1
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

        // Neuen Container für H1 + Buttons
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '45px';

        // Elementstruktur umbauen
        h1.parentNode.insertBefore(container, h1);
        container.appendChild(h1);
        container.appendChild(btnGroup);

        // Pfeiltasten-Navigation
        const [leftBtn, rightBtn] = btnGroup.querySelectorAll('a');

        document.addEventListener('keydown', function(e) {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft' && leftBtn) leftBtn.click();
            if (e.key === 'ArrowRight' && rightBtn) rightBtn.click();
        });
    }
})();
