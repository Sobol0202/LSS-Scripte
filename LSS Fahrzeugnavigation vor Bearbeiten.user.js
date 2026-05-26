// ==UserScript==
// @name         LSS Fahrzeugnavigation vor Bearbeiten
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Verschiebt die Fahrzeugnavigationspfeile vor den Bearbeiten-Button
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicles/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const groups = document.querySelectorAll('.btn-group.pull-right');

    let navGroup;
    let actionGroup;
    let editButton;

    for (const group of groups) {
        if (group.querySelector('.glyphicon-arrow-left, .glyphicon-arrow-right')) {
            navGroup = group;
        }

        const edit = group.querySelector('a[href$="/edit"] .glyphicon-pencil');
        if (edit) {
            actionGroup = group;
            editButton = edit.closest('a');
        }
    }

    if (!navGroup || !actionGroup || !editButton) return;

    const navButtons = Array.from(
        navGroup.querySelectorAll('a.btn')
    );

    navButtons.forEach(button => {
        button.classList.remove('btn-xs');
        button.classList.add('btn-default');

        actionGroup.insertBefore(button, editButton);
    });

    navGroup.remove();
})();
