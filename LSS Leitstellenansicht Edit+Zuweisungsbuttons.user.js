// ==UserScript==
// @name         LSS Leitstellenansicht Edit+Zuweisungsbuttons+Statusumschalter+Leitstellenumschalter
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Erweitert die Leitstellenansicht um einige Funktionen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/leitstellenansicht
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ==================== Funktionen für das Umschalten der Fahrzeug-Status ====================

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
                //console.log(`Status für Fahrzeug ${vehicleId} auf ${targetStatus} gesetzt.`);
            } catch (error) {
                console.error(`Fehler beim Setzen des Status für Fahrzeug ${vehicleId}:`, error);
            }
        });
    });

    // ==================== Funktionen für das Hinzufügen von Edit- und Assign-Buttons ====================

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
        editButton.innerHTML = '<span class="glyphicon glyphicon-user"></span>';
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

    // ==================== Funktionen für das Umschalten der Leitstelle ====================

    // Hilfsfunktion für API-Anfragen
    function fetchAPI(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: function (response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            resolve(data);
                        } catch (e) {
                            console.error('Fehler beim Parsen der API-Daten:', e);
                            reject(e);
                        }
                    } else {
                        console.error(`API-Anfrage fehlgeschlagen: ${response.status}`);
                        reject(`API request failed: ${response.status}`);
                    }
                },
                onerror: function (error) {
                    console.error('Fehler bei der API-Anfrage:', error);
                    reject(error);
                }
            });
        });
    }

    // Funktion, um das Dropdown-Menü zu erstellen
    function createDropdown(building, allLeitstellen) {
        const toggleButton = document.createElement('button');
        toggleButton.className = 'btn btn-default btn-xs dropdown-toggle pull-right';
        toggleButton.setAttribute('aria-haspopup', 'true');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.innerHTML = '<span class="caret"></span>';
        toggleButton.style.marginLeft = '5px';

        const menu = document.createElement('ul');
        menu.className = 'dropdown-menu';
        menu.style.display = 'none';

        const noneLeitstelleItem = document.createElement('li');
        const noneLeitstelleLink = document.createElement('a');
        noneLeitstelleLink.href = '#';
        noneLeitstelleLink.textContent = 'Keiner Leitstelle';

        const noneLeitstelleButton = document.createElement('button');
        noneLeitstelleButton.className = 'btn btn-xs btn-danger pull-right';
        noneLeitstelleButton.innerHTML = '<span class="glyphicon glyphicon-remove"></span>';
        noneLeitstelleButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const assignUrl = `/buildings/${building.id}/leitstelle-set/0`;
            fetch(assignUrl)
                .then(() => {})
                .catch(err => {
                    console.error(`Fehler beim Setzen der Leitstelle: ${err}`);
                });
        });

        noneLeitstelleLink.appendChild(noneLeitstelleButton);
        noneLeitstelleItem.appendChild(noneLeitstelleLink);
        menu.appendChild(noneLeitstelleItem);

        allLeitstellen.forEach(leitstelle => {
            const menuItem = document.createElement('li');
            const menuLink = document.createElement('a');
            menuLink.href = '#';
            menuLink.textContent = leitstelle.caption;

            const assignButton = document.createElement('button');
            assignButton.className = 'btn btn-xs btn-success pull-right';
            assignButton.style.marginLeft = '1ch';
            assignButton.innerHTML = '<span class="glyphicon glyphicon-ok"></span>';
            assignButton.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                const assignUrl = `/buildings/${building.id}/leitstelle-set/${leitstelle.id}`;
                fetch(assignUrl)
                    .then(() => {})
                    .catch(err => {
                        console.error(`Fehler beim Setzen der Leitstelle: ${err}`);
                    });
            });

            menuLink.appendChild(assignButton);
            menuItem.appendChild(menuLink);
            menu.appendChild(menuItem);

            // Überprüfen, ob dies die aktuell zugewiesene Leitstelle ist
            if (building.leitstelle_building_id && leitstelle.id === building.leitstelle_building_id) {
                menuLink.style.textDecoration = 'underline'; // Unterstreiche die aktuell zugewiesene Leitstelle
            }
        });

        const dropdownGroup = document.createElement('div');
        dropdownGroup.className = 'btn-group';

        dropdownGroup.appendChild(toggleButton);
        dropdownGroup.appendChild(menu);

        toggleButton.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const isOpen = menu.style.display === 'block';
            menu.style.display = isOpen ? 'none' : 'block';
            toggleButton.setAttribute('aria-expanded', !isOpen);
        });

        menu.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        return dropdownGroup;
    }

    // ==================== Initialisierung der Leitstellenumschaltung ====================

    async function init() {
        try {
            const buildings = await fetchAPI('https://www.leitstellenspiel.de/api/buildings');
            const leitstellen = buildings.filter(building => building.building_type === 7);

            const buildingSelector = 'a.lightbox-open.list-group-item.active';
            const buildingLinks = Array.from(document.querySelectorAll(buildingSelector));
            buildingLinks.forEach((a) => {
                const match = a.href.match(/\/buildings\/(\d+)/);
                if (!match) {
                    return;
                }

                const buildingId = match[1];
                const building = buildings.find(b => b.id == buildingId);
                if (!building) {
                    return;
                }

                if (a.nextSibling && a.nextSibling.classList && a.nextSibling.classList.contains('btn-group')) {
                    return;
                }

                const dropdown = createDropdown(building, leitstellen);
                a.appendChild(dropdown);
            });
        } catch (err) {
            console.error('Fehler während der Initialisierung:', err);
        }
    }

    init();
})();
