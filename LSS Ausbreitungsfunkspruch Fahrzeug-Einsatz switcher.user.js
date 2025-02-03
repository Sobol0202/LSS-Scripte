// ==UserScript==
// @name         LSS Ausbreitungsfunkspruch Fahrzeug-Einsatz switcher
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Ändert den Fahrzeugbutton zum Einsatzbutton bei Ausbreitungssprechwünschen.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Anpassen des href-Links
    function updateVehicleLinks(mutationList) {
        mutationList.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE && node.matches('li[class^="radio_message_vehicle"]')) {
                    if (node.textContent.includes('hat sich ausgebreitet. Neue Bezeichnung:')) {
                        const links = node.querySelectorAll('a');
                        const vehicleLink = Array.from(links).find(link => link.href.includes('/vehicles/'));
                        const missionLink = Array.from(links).find(link => link.href.includes('/missions/'));

                        if (vehicleLink && missionLink) {
                            vehicleLink.href = missionLink.href;
                            //console.log(`Link aktualisiert: ${vehicleLink.href}`);
                        }
                    }
                }
            });
        });
    }

    // Beobachtet das ul-Element auf neue Einträge
    const targetNode = document.getElementById('radio_messages_important');
    if (targetNode) {
        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(updateVehicleLinks);
        observer.observe(targetNode, config);

        // Führe die Funktion auch initial aus, um bestehende Einträge zu prüfen
        targetNode.querySelectorAll('li[class^="radio_message_vehicle"]').forEach(node => {
            updateVehicleLinks([{ addedNodes: [node] }]);
        });
    } else {
        console.error('Das Element mit der ID "radio_messages_important" wurde nicht gefunden.');
    }
})();
