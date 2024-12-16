// ==UserScript==
// @name         LSS-Gebäude löschen
// @namespace    http://tampermonkey.net/
// @version      0.3r
// @description  Fügt einen Button hinzu, um alle Gebäude zu löschen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // Erstelle einen Button
    const deleteButton = document.createElement('button');
    deleteButton.innerText = 'Gebäude abreißen';
    deleteButton.style.margin = '5px';
    deleteButton.onclick = startDeleteProcess;
    document.querySelector('.container-fluid').prepend(deleteButton);

    async function startDeleteProcess() {
        const confirmFirst = confirm('Bist du sicher, dass du alle Gebäude abreißen möchtest? Das kann nicht rückgängig gemacht werden!');
        if (confirmFirst) {
            const userConfirmation = prompt('Du bist dabei alle Gebäude abzureißen. Um das zu bestätigen gib bitte NEUSTART ein');
            if (userConfirmation === 'NEUSTART') {
                const buildings = await getBuildingIds();
                for (const buildingId of buildings) {
                    await deleteAndCloseBuilding(buildingId);
                    await wait(500); // Warte 500ms vor dem Öffnen des nächsten Gebäudes
                }
                alert('Alle Gebäude wurden abgerissen!');
            } else {
                alert('Bestätigung falsch. Vorgang abgebrochen!');
            }
        } else {
            alert('Vorgang abgebrochen!');
        }
    }

    // Funktion, um die Gebäude-IDs zu erhalten
    async function getBuildingIds() {
        const response = await fetch('https://www.leitstellenspiel.de/api/buildings');
        const data = await response.json();
        return data.map(building => building.id);
    }

    // Funktion, um ein Gebäude zu löschen, Tab zu schließen
    async function deleteAndCloseBuilding(buildingId) {
        const url = `https://www.leitstellenspiel.de/buildings/${buildingId}`;
        const newTab = window.open(url, '_blank');
        await wait(1000); // Warte 1 Sekunde, bis die Seite geladen ist
        const deleteButton = newTab.document.querySelector('#delete_no_refund');
        if (deleteButton) {
            deleteButton.click(); // Klick auf den "Löschen"-Button
            await wait(1000); // Warte 1 Sekunde, bis die nachfolgende Abfrage erscheint
            // Simuliere die Bestätigung der Abfrage
            newTab.confirm = () => true;
        }
        // Schließe den Tab nach dem Löschen
        await wait(500); // Warte 500ms, bevor den Tab zu schließen
        newTab.close();
    }

    // Funktion, um eine Wartezeit zu ermöglichen
    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

})();
