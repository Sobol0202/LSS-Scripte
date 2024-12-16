// ==UserScript==
// @name         LSS Building Navigation
// @namespace    www.leitstellenspiel.de
// @version      1.7
// @description  Fügt Buttons für das nächste und vorherige gebaute Gebäude ein, inklusive zusätzlicher Gruppen für dieselbe Leitstelle und den gleichen Gebäudetyp.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Konfigurationsoptionen
    const enableOriginalButtons = true; // Aktiviere/deaktiviere die ursprünglichen Buttons (vorheriges/nächstes gebautes Gebäude)
    const enableSameLeitstelleSort = false; // Aktiviere/deaktiviere die Sortierung mit gleicher Leitstelle
    const enableSameBuildingTypeSort = false; // Aktiviere/deaktiviere die Sortierung mit gleichem Gebäudetyp
    const enableSameTypeInSameLeitstelleSort = false; // Aktiviere/deaktiviere die Sortierung mit gleichem Typ in gleicher Leitstelle

    // Funktion zum Extrahieren der Gebäude-ID aus der aktuellen URL
    function getCurrentBuildingId() {
        const urlParts = window.location.href.split('/');
        return parseInt(urlParts[urlParts.length - 1]);
    }

    // Funktion zum Laden der Gebäude-API und Navigation zu vorherigem oder nächstem Gebäude
    function navigateBuilding(direction, sameLeitstelle, sameBuildingType, sameTypeInSameLeitstelle) {
        const currentBuildingId = getCurrentBuildingId();

        // Gebäude-API aufrufen
        fetch("https://www.leitstellenspiel.de/api/buildings")
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                // Filtern des aktuellen Gebäudes
                const currentBuilding = data.find(building => building.id === currentBuildingId);

                // Filtern der Gebäude mit gleicher leitstelle_building_id (optional)
                const buildingsWithSameId = enableSameLeitstelleSort
                    ? data.filter(building => building.leitstelle_building_id === currentBuilding.leitstelle_building_id)
                    : data;

                // Filtern der Gebäude mit gleichem Gebäudetyp (optional)
                const buildingsWithSameType = enableSameBuildingTypeSort
                    ? buildingsWithSameId.filter(building => building.building_type === currentBuilding.building_type)
                    : buildingsWithSameId;

                // Filtern der Gebäude mit gleichem Typ in gleicher Leitstelle (optional)
                const buildingsWithSameTypeInSameLeitstelle = enableSameTypeInSameLeitstelleSort
                    ? buildingsWithSameId.filter(building => building.building_type === currentBuilding.building_type && building.leitstelle_building_id === currentBuilding.leitstelle_building_id)
                    : buildingsWithSameType;

                // Sortieren der Gebäude nach ID
                buildingsWithSameTypeInSameLeitstelle.sort((a, b) => a.id - b.id);

                // Index des aktuellen Gebäudes im Array finden
                const currentIndex = buildingsWithSameTypeInSameLeitstelle.findIndex(building => building.id === currentBuildingId);

                // Index des nächsten oder vorherigen Gebäudes berechnen
                const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

                // Überprüfen, ob das nächste oder vorherige Gebäude existiert
                if (newIndex >= 0 && newIndex < buildingsWithSameTypeInSameLeitstelle.length) {
                    const newBuildingId = buildingsWithSameTypeInSameLeitstelle[newIndex].id;
                    // Weiterleitung zur neuen Gebäude-ID
                    const url = sameLeitstelle ? `https://www.leitstellenspiel.de/buildings/${newBuildingId}` : `https://www.leitstellenspiel.de/buildings/${newBuildingId}`;
                    window.location.href = url;
                }
            })
            .catch(error => console.error('Error fetching/building data:', error));
    }

    // Funktion zum Hinzufügen der Navigationsschaltflächen
    function addNavigationButtons() {
        const buildingNavigationContainer = document.querySelector('#building-navigation-container');

        // Überprüfen, ob das Element vorhanden ist
        if (buildingNavigationContainer) {
            //console.log('Adding navigation buttons');

            // Neuen Buttons erstellen (normale Navigation), wenn aktiviert
            if (enableOriginalButtons) {
                const originalButtonsContainer = document.createElement('div');

                const prevButton = document.createElement('a');
                prevButton.href = '#';
                prevButton.className = 'btn btn-xs btn-success';
                prevButton.innerHTML = 'vorheriges gebautes Gebäude';
                prevButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Prev button clicked');
                    navigateBuilding('prev', false, false, false);
                });

                const nextButton = document.createElement('a');
                nextButton.href = '#';
                nextButton.className = 'btn btn-xs btn-success';
                nextButton.innerHTML = 'nächstes gebautes Gebäude';
                nextButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Next button clicked');
                    navigateBuilding('next', false, false, false);
                });

                originalButtonsContainer.appendChild(prevButton);
                originalButtonsContainer.appendChild(document.createTextNode(' '));
                originalButtonsContainer.appendChild(nextButton);

                // Buttons zum DOM hinzufügen, direkt unter den vorhandenen Buttons
                buildingNavigationContainer.appendChild(originalButtonsContainer);
                buildingNavigationContainer.appendChild(document.createElement('br'));
            }

            // Neuen Buttons erstellen (gleiche Leitstelle), wenn aktiviert
            if (enableSameLeitstelleSort) {
                const prevSameLeitstelleButton = document.createElement('a');
                prevSameLeitstelleButton.href = '#';
                prevSameLeitstelleButton.className = 'btn btn-xs btn-info';
                prevSameLeitstelleButton.innerHTML = 'vorheriges gebautes Gebäude (gleiche Leitstelle)';
                prevSameLeitstelleButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Prev (same Leitstelle) button clicked');
                    navigateBuilding('prev', true, false, false);
                });

                const nextSameLeitstelleButton = document.createElement('a');
                nextSameLeitstelleButton.href = '#';
                nextSameLeitstelleButton.className = 'btn btn-xs btn-info';
                nextSameLeitstelleButton.innerHTML = 'nächstes gebautes Gebäude (gleiche Leitstelle)';
                nextSameLeitstelleButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Next (same Leitstelle) button clicked');
                    navigateBuilding('next', true, false, false);
                });

                // Buttons zum DOM hinzufügen, direkt unter den vorhandenen Buttons
                buildingNavigationContainer.appendChild(prevSameLeitstelleButton);
                buildingNavigationContainer.appendChild(document.createTextNode(' '));
                buildingNavigationContainer.appendChild(nextSameLeitstelleButton);
                buildingNavigationContainer.appendChild(document.createElement('br'));
            }

            // Neuen Buttons erstellen (gleicher Gebäudetyp), wenn aktiviert
            if (enableSameBuildingTypeSort) {
                const prevSameBuildingTypeButton = document.createElement('a');
                prevSameBuildingTypeButton.href = '#';
                prevSameBuildingTypeButton.className = 'btn btn-xs btn-warning';
                prevSameBuildingTypeButton.innerHTML = 'vorheriges gebautes Gebäude (gleicher Gebäudetyp)';
                prevSameBuildingTypeButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Prev (same Building Type) button clicked');
                    navigateBuilding('prev', false, true, false);
                });

                const nextSameBuildingTypeButton = document.createElement('a');
                nextSameBuildingTypeButton.href = '#';
                nextSameBuildingTypeButton.className = 'btn btn-xs btn-warning';
                nextSameBuildingTypeButton.innerHTML = 'nächstes gebautes Gebäude (gleicher Gebäudetyp)';
                nextSameBuildingTypeButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Next (same Building Type) button clicked');
                    navigateBuilding('next', false, true, false);
                });

                // Buttons zum DOM hinzufügen, direkt unter den vorhandenen Buttons
                buildingNavigationContainer.appendChild(prevSameBuildingTypeButton);
                buildingNavigationContainer.appendChild(document.createTextNode(' '));
                buildingNavigationContainer.appendChild(nextSameBuildingTypeButton);
                buildingNavigationContainer.appendChild(document.createElement('br'));
            }

            // Neuen Buttons erstellen (gleicher Typ in gleicher Leitstelle), wenn aktiviert
            if (enableSameTypeInSameLeitstelleSort) {
                const prevSameTypeInSameLeitstelleButton = document.createElement('a');
                prevSameTypeInSameLeitstelleButton.href = '#';
                prevSameTypeInSameLeitstelleButton.className = 'btn btn-xs btn-danger';
                prevSameTypeInSameLeitstelleButton.innerHTML = 'vorheriges gebautes Gebäude (gleicher Typ in gleicher Leitstelle)';
                prevSameTypeInSameLeitstelleButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Prev (same Type in same Leitstelle) button clicked');
                    navigateBuilding('prev', true, false, true);
                });

                const nextSameTypeInSameLeitstelleButton = document.createElement('a');
                nextSameTypeInSameLeitstelleButton.href = '#';
                nextSameTypeInSameLeitstelleButton.className = 'btn btn-xs btn-danger';
                nextSameTypeInSameLeitstelleButton.innerHTML = 'nächstes gebautes Gebäude (gleicher Typ in gleicher Leitstelle)';
                nextSameTypeInSameLeitstelleButton.addEventListener('click', function(event) {
                    event.preventDefault();
                    //console.log('Next (same Type in same Leitstelle) button clicked');
                    navigateBuilding('next', true, false, true);
                });

                // Buttons zum DOM hinzufügen, direkt unter den vorhandenen Buttons
                buildingNavigationContainer.appendChild(prevSameTypeInSameLeitstelleButton);
                buildingNavigationContainer.appendChild(document.createTextNode(' '));
                buildingNavigationContainer.appendChild(nextSameTypeInSameLeitstelleButton);
                buildingNavigationContainer.appendChild(document.createElement('br'));
            }
        } else {
            console.error('Element with ID "building-navigation-container" not found.');
        }
    }

    // Warte 1 Sekunden, bevor die Navigationsschaltflächen hinzugefügt werden
    setTimeout(function() {
        //console.log('Adding navigation buttons after delay');
        addNavigationButtons();
    }, 1000);
})();
