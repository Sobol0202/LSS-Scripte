// ==UserScript==
// @name         LSS Leitstellenansicht Edit+Zuweisungsbuttons
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fügt zwei Buttons zu bestimmten Links hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/leitstellenansicht
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Alle a-Elemente mit der Klasse "lightbox-open list-group-item" auswählen
    const elements = document.querySelectorAll('a.lightbox-open.list-group-item');

    // Über jedes Element iterieren
    elements.forEach(element => {
        const href = element.getAttribute('href');

        // Überspringen, wenn href kein "vehicle" enthält oder die Klasse "active" hat
        if (!href.includes('vehicle')) {
            return;
        }

        // Container für die Buttons erstellen
        const buttonWrapper = document.createElement('span');
        buttonWrapper.style.position = 'absolute';
        buttonWrapper.style.right = '1px';
        buttonWrapper.style.top = '50%';
        buttonWrapper.style.transform = 'translateY(-50%)';
        buttonWrapper.style.display = 'flex';

        // Funktion zum Verhindern des Klickens auf das Eltern-a-Element
        const stopParentClick = (event) => {
            event.stopPropagation();
        };

        // Ersten Button erstellen
        const editButton = document.createElement('a');
        editButton.className = 'btn btn-xs btn-default';
        editButton.innerHTML = '<svg class="svg-inline--fa fa-users" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="users" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" data-fa-i2svg=""><path fill="currentColor" d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z"></path></svg>';
        editButton.setAttribute('href', `${href}/zuweisung`);
        editButton.setAttribute('target', '_blank');
        editButton.addEventListener('click', stopParentClick);

        // Zweiten Button erstellen
        const assignButton = document.createElement('a');
        assignButton.className = 'btn btn-xs btn-default';
        assignButton.innerHTML = '<span class="glyphicon glyphicon-pencil"></span>';
        assignButton.setAttribute('href', `${href}/edit`);
        assignButton.setAttribute('target', '_blank');
        assignButton.addEventListener('click', stopParentClick);

        // Buttons dem Wrapper hinzufügen
        buttonWrapper.appendChild(editButton);
        buttonWrapper.appendChild(assignButton);

        // Wrapper dem Element hinzufügen
        element.style.position = 'relative';
        element.appendChild(buttonWrapper);
    });
})();
