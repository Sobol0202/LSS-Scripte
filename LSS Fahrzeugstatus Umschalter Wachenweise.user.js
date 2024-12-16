// ==UserScript==
// @name         LSS-Fahrzeugstatus Umschalter Wachenweise
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @description  Umschalten des Fahrzeugstatus per Schalter in der Wachenansicht
// @match        https://www.leitstellenspiel.de/buildings/*
// @author       MissSobol
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Erstellen eines Schalterbuttons mit benutzerdefinierten Klassen
    const createSwitchButton = (text, targetStatus, classes) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.classList.add('btn', 'btn-xs', ...classes);
        // Füge einen Eventlistener hinzu, um den Status zu ändern
        button.addEventListener('click', () => toggleAllStatus(targetStatus));
        return button;
    };

    // Funktion zum Extrahieren der Fahrzeug-ID aus dem href-Attribut des Links
    const extractVehicleId = (link) => {
        const href = link.getAttribute('href');
        const matches = href.match(/\/vehicles\/(\d+)/);
        return matches ? matches[1] : null;
    };

    // Funktion zum Hinzufügen der Schalterbuttons
    const addStatusSwitchButtons = () => {
        //console.log('Adding status switch buttons...');
        // Erstelle eine neue Gruppe für die Schalterbuttons
        const newButtonSet = document.createElement('div');
        newButtonSet.classList.add('btn-group');

        // Erstelle Schalterbuttons für Status 2 und Status 6 mit benutzerdefinierten Klassen
        const switchTo2Button = createSwitchButton('Alle auf Status 2', 2, ['btn-success']);
        const switchTo6Button = createSwitchButton('Alle auf Status 6', 6, ['btn-danger']);

        // Füge die Schalterbuttons zur neuen Gruppe hinzu
        newButtonSet.appendChild(switchTo2Button);
        newButtonSet.appendChild(switchTo6Button);

        // Füge einen kleinen Freiraum vor den Schalterbuttons hinzu
        newButtonSet.style.marginLeft = '5px';

        // Finde das Element mit dem Link zum Fahrzeugmarkt
        const marketLink = document.querySelector('a[href*="/vehicles/new"][class*="btn-default"]');
        if (marketLink) {
            //console.log('Inserting new buttons...');
            // Füge die Schalterbuttons nach dem Element ein
            marketLink.parentNode.insertBefore(newButtonSet, marketLink.nextSibling);

            // Extrahiere die Fahrzeug-ID für die Schalterbuttons
            const vehicleId = extractVehicleId(marketLink);
            switchTo2Button.dataset.vehicleId = vehicleId;
            switchTo6Button.dataset.vehicleId = vehicleId;
        }
    };

    // Funktion zum Umschalten aller Fahrzeugstatus
    const toggleAllStatus = async (targetStatus) => {
        const vehicles = document.querySelectorAll('.vehicle_image_reload');
        // Zähler für die Anzahl der umgeschalteten Fahrzeuge
        let count = 0;
        // Für jedes Fahrzeug führe eine Anfrage aus, um den Status zu ändern
        for (const vehicle of vehicles) {
            const vehicleLink = vehicle.closest('tr').querySelector('a[href*="/vehicles/"]');
            if (!vehicleLink) continue; // Überspringe Fahrzeuge ohne Link
            const vehicleId = extractVehicleId(vehicleLink);
            const url = `https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/${targetStatus}`;
            // Führe eine Serveranfrage aus
            await fetch(url);
            // Warte für 100ms, um die Serverlast zu verringern
            await new Promise(resolve => setTimeout(resolve, 100));
            // Aktualisiere die Anzeige des Fahrzeugstatus
            const fmsElement = vehicle.closest('tr').querySelector('.building_list_fms');
            if (fmsElement) {
                fmsElement.textContent = targetStatus;
                count++;
            }
        }
        // Überprüfe, ob alle Fahrzeuge umgeschaltet wurden
        if (count === vehicles.length) {
            // Wenn alle Fahrzeuge umgeschaltet wurden, lade die Seite neu
            window.location.reload();
        }
    };

    // Füge die Schalterbuttons hinzu
    addStatusSwitchButtons();
})();
