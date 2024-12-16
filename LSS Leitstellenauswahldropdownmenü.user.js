// ==UserScript==
// @name         LSS Leitstellenauswahldropdownmenü
// @namespace    www.leitstellenspiel.de
// @version      1.3
// @description  Fügt ein Dropdown-Menü für die direktauswahl einer Leitstelle hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Hinzufügen eines Dropdown-Menüs
    function addBuildingDropdown(buildings) {
        // Dropdown-Element erstellen
        var dropdown = document.createElement('select');
        dropdown.id = 'buildingDropdown';

        // Option für "Leitstelle auswählen" hinzufügen
        var defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.text = 'Leitstelle auswählen';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        dropdown.appendChild(defaultOption);

        // Gebäude alphabetisch sortieren
        buildings.sort(function(a, b) {
            return a.caption.localeCompare(b.caption);
        });

        // Optionen für jedes Gebäude hinzufügen
        buildings.forEach(function(building) {
            var option = document.createElement('option');
            option.value = building.id;
            option.text = building.caption;
            dropdown.appendChild(option);
        });

        // Event-Handler für Auswahl ändern
        dropdown.addEventListener('change', function() {
            // Prüfen, ob eine gültige Option ausgewählt wurde
            if (dropdown.value !== '') {
                // URL für das ausgewählte Gebäude erstellen
                var selectedBuildingId = dropdown.value;
                var buildingUrl = 'https://www.leitstellenspiel.de/buildings/' + selectedBuildingId;

                // Gebäude öffnen (mit den folgenden 3 Zeilen festlegen, wie die Leitstelle geöffnet werden soll.)
                //window.open(buildingUrl, '_blank').focus(); //neuer Tab
                //window.location.href = buildingUrl; //selber Tab
                window.lightboxOpen(buildingUrl); //neue Lightbox
            }
        });

        // Dropdown in die Navbar einfügen
        var navbar = document.getElementById('navbar-main-collapse');
        if (navbar) {
            var navbarList = navbar.querySelector('.nav.navbar-nav.navbar-right');
            navbarList.insertBefore(dropdown, navbarList.firstChild);
        }
    }

    // API-Aufruf für Gebäudeinformationen
    fetch('https://www.leitstellenspiel.de/api/buildings')
        .then(response => response.json())
        .then(data => {
            // Gebäude mit building_type 7 auswählen
            var selectedBuildings = data.filter(building => building.building_type === 7);

            // Dropdown-Menü hinzufügen
            addBuildingDropdown(selectedBuildings);
        })
        .catch(error => console.error('Error fetching building data:', error));
})();
