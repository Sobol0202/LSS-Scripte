// ==UserScript==
// @name         LSS Duplicate Finder
// @namespace    LSS-Duplicate-Finder
// @version      5r
// @description  Adds buttons to find duplicate buildings and vehicles in LSS game.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // create button to find duplicate buildings
    let gbButton = document.createElement("button");
    gbButton.innerHTML = "GB-Dup";
    gbButton.style.fontSize = "0.5em";
    gbButton.style.marginRight = "5px";
    gbButton.style.color = "black";
    gbButton.onclick = function() {
        let duplicates = lssmv4.$stores.api.buildings.filter(({caption}) => lssmv4.$stores.api.buildings.filter(({caption: scaption}) => scaption === caption).length > 1)
          .sort().map(({caption, id}) => `${caption}: https://leitstellenspiel.de/buildings/${id}`);
        if (duplicates.length === 0) {
            let newTab = window.open();
            newTab.document.body.innerHTML = "Du hast keine doppelten Gebäude.";
        } else {
            let content = duplicates.join('\n');
            let newTab = window.open();
            newTab.document.body.innerHTML = content.replace(/\n/g, "<br>");
        }
    };

    // create button to find duplicate vehicles
    let kzfButton = document.createElement("button");
    kzfButton.innerHTML = "KFZ-Dup";
    kzfButton.style.fontSize = "0.5em";
    kzfButton.style.marginRight = "5px";
    kzfButton.style.color = "black";
    kzfButton.onclick = function() {
        let duplicates = lssmv4.$stores.api.vehicles.filter(({caption}) => lssmv4.$stores.api.vehicles.filter(({caption: scaption}) => scaption === caption).length > 1)
          .sort().map(({caption, building_id}) => `<a href='https://leitstellenspiel.de/buildings/${building_id}' target='_blank'>${caption}</a>`);
        if (duplicates.length === 0) {
            let newTab = window.open();
            newTab.document.body.innerHTML = "Du hast keine doppelten Fahrzeuge.";
        } else {
            let content = duplicates.join('<br>');
            let newTab = window.open();
            newTab.document.body.innerHTML = content;
        }
    };

    // add buttons to building panel heading
    let buildingPanelHeading = document.getElementById("building_panel_heading");
    buildingPanelHeading.appendChild(gbButton);
    buildingPanelHeading.appendChild(kzfButton);

})();
