// ==UserScript==
// @name         LSS Lehrgangsstart im Forum
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Fügt Buttons für Lehrgänge hinzu und öffnet das entsprechende Gebäude bei Klick
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/alliance_threads/123456
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Funktion zum Öffnen des Gebäudes in der Lightbox
  const openBuilding = async (buildingId) => {
    const url = `https://www.leitstellenspiel.de/buildings/${buildingId}`;
    window.location.href = url;
  };

  // Funktion zum Hinzufügen von Buttons
  const addButtons = () => {
    const form = document.getElementById('new_alliance_post');
    const buttons = [
      { name: 'Feuerwehrlehrgang', type: 1 },
      { name: 'Rettungsdienstlehrgang', type: 3 },
      { name: 'Polizeilehrgang', type: 8 },
      { name: 'THW-Lehrgang', type: 10 },
    ];

    buttons.forEach((buttonInfo) => {
      const button = document.createElement('button');
      button.textContent = buttonInfo.name;
      button.className = 'btn btn-success';
      button.addEventListener('click', async () => {
        // API-Aufruf zur Suche nach freien Klassenräumen
        const response = await fetch(
          'https://www.leitstellenspiel.de/api/alliance_buildings'
        );
        const buildings = await response.json();

        // Filtern nach dem entsprechenden building_type und verfügbaren Klassenräumen
        const matchingBuilding = buildings.find(
          (building) =>
            building.building_type === buttonInfo.type &&
            building.extensions.some((ext) => ext.available)
        );

        if (matchingBuilding) {
          // Öffnen des Gebäudes in der Lightbox
          openBuilding(matchingBuilding.id);
        } else {
          alert('Kein passendes Gebäude gefunden.');
        }
      });

      form.parentNode.insertBefore(button, form);
    });
  };

  // Hinzufügen der Buttons direkt nach dem Parsen des DOM
  addButtons();
})();
