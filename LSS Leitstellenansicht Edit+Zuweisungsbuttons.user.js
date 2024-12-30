// ==UserScript==
// @name         LSS Leitstellenansicht Edit+Zuweisungsbuttons+Statusumschalter
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Fügt zwei Buttons zur Leitstellenansicht hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/leitstellenansicht
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Alle relevanten Fahrzeugstatus-Elemente auswählen
    document.querySelectorAll("span[id^='vehicle_overview_vehicle_']").forEach(span => {
        span.addEventListener('click', async function(event) {
            // Verhindert die Standardaktion und das Durchreichen des Events
            event.stopPropagation();
            event.preventDefault();

            // Extrahiere die Fahrzeug-ID aus der ID des Elements
            const idMatch = this.id.match(/^vehicle_overview_vehicle_(\d+)$/);
            if (!idMatch) return;

            const vehicleId = idMatch[1];

            // Zielstatus basierend auf der aktuellen Klasse festlegen
            let targetStatus;
            if (this.classList.contains('building_list_fms_2')) {
                targetStatus = 6; // Status von 2 auf 6 ändern
            } else if (this.classList.contains('building_list_fms_6')) {
                targetStatus = 2; // Status von 6 auf 2 ändern
            } else {
                return; // Keine Aktion, wenn kein relevanter Status
            }

            // Serveranfrage zum Ändern des Status senden
            const url = `https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/${targetStatus}`;
            try {
                await fetch(url);
                console.log(`Status für Fahrzeug ${vehicleId} auf ${targetStatus} gesetzt.`);
            } catch (error) {
                console.error(`Fehler beim Setzen des Status für Fahrzeug ${vehicleId}:`, error);
            }
        });
    });

    // Alle Fahrzeug-Links in der Leitstellenansicht auswählen
    const elements = document.querySelectorAll('a.lightbox-open.list-group-item');

    elements.forEach(element => {
        const href = element.getAttribute('href');

        // Überspringe Elemente, die keine Fahrzeuge darstellen
        if (!href.includes('vehicle')) {
            return;
        }

        // Wrapper für die Buttons erstellen
        const buttonWrapper = document.createElement('span');
        buttonWrapper.style.position = 'absolute';
        buttonWrapper.style.right = '1px';
        buttonWrapper.style.top = '50%';
        buttonWrapper.style.transform = 'translateY(-50%)';
        buttonWrapper.style.display = 'flex';

        // Funktion, um Klicks auf die Buttons vom Eltern-Element zu trennen
        const stopParentClick = (event) => {
            event.stopPropagation();
        };

        // Edit-Button erstellen
        const editButton = document.createElement('a');
        editButton.className = 'btn btn-xs btn-default';
        editButton.innerHTML = '<svg class="svg-inline--fa fa-users" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="users" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" data-fa-i2svg=""><path fill="currentColor" d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192h42.7c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0H21.3C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7h42.7C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3H405.3zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352H378.7C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7H154.7c-14.7 0-26.7-11.9-26.7-26.7z"></path></svg>';
        editButton.setAttribute('href', `${href}/zuweisung`);
        editButton.setAttribute('target', '_blank');
        editButton.addEventListener('click', stopParentClick);

        // Assign-Button erstellen
        const assignButton = document.createElement('a');
        assignButton.className = 'btn btn-xs btn-default';
        assignButton.innerHTML = '<span class="glyphicon glyphicon-pencil"></span>';
        assignButton.setAttribute('href', `${href}/edit`);
        assignButton.setAttribute('target', '_blank');

        // Strg-Taste für alternative Aktion beim Assign-Button
        assignButton.addEventListener('click', (event) => {
            if (event.ctrlKey) {
                assignButton.setAttribute('href', `${href}/move`);
            } else {
                assignButton.setAttribute('href', `${href}/edit`);
            }
            stopParentClick(event);
        });

        // Buttons zum Wrapper hinzufügen
        buttonWrapper.appendChild(editButton);
        buttonWrapper.appendChild(assignButton);

        // Wrapper zum Fahrzeug-Element hinzufügen
        element.style.position = 'relative';
        element.appendChild(buttonWrapper);
    });
})();
