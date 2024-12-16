// ==UserScript==
// @name         LSS Personal Soll-Ist
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Fügt Personalverwaltungsfunktionen hinzu
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Funktion zum Lesen von Daten aus dem lokalen Speicher
    function getLocalStorageData() {
        const data = localStorage.getItem('personalData');
        return data ? JSON.parse(data) : {};
    }

    // Funktion zum Schreiben von Daten in den lokalen Speicher
    function setLocalStorageData(data) {
        localStorage.setItem('personalData', JSON.stringify(data));
    }

    // Funktion zum Lesen von Textdaten aus dem lokalen Speicher
    function getLocalStorageTextData() {
        const data = localStorage.getItem('personalTextData');
        return data ? JSON.parse(data) : {};
    }

    // Funktion zum Schreiben von Textdaten in den lokalen Speicher
    function setLocalStorageTextData(data) {
        localStorage.setItem('personalTextData', JSON.stringify(data));
    }

    // Funktion zur Aktualisierung des Eingabefelds
    function updateInputField(buildingId) {
        const personalData = getLocalStorageData();
        const personalCount = personalData[buildingId] || 0;
        inputField.value = personalCount;
    }

    // Funktion zur Aktualisierung des Eingabefelds für Freitext
    function updateTextInputField(buildingId) {
        const textData = getLocalStorageTextData();
        const textValue = textData[buildingId] || '';
        textInputField.value = textValue;
    }

    // Funktion zur Aktualisierung der Personalanzahl
    function updatePersonalCount(buildingId, count) {
        const personalData = getLocalStorageData();
        personalData[buildingId] = count;
        setLocalStorageData(personalData);
    }

    // Funktion zum Aktualisieren des Freitexts
    function updateTextValue(buildingId, text) {
        const textData = getLocalStorageTextData();
        textData[buildingId] = text;
        setLocalStorageTextData(textData);
    }

    // Funktion zum Löschen der Personalanzahl
    function deletePersonalCount(buildingId) {
        const personalData = getLocalStorageData();
        delete personalData[buildingId];
        setLocalStorageData(personalData);
        updateInputField(buildingId);
    }

    // Funktion zum Löschen des Freitexts
    function deleteTextValue(buildingId) {
        const textData = getLocalStorageTextData();
        delete textData[buildingId];
        setLocalStorageTextData(textData);
        updateTextInputField(buildingId);
    }

    // Erstellen eines DIV-Elements für die Benutzeroberfläche
    const personalDiv = document.createElement('div');
    personalDiv.innerHTML = `
        <input id="personalCountInput" type="number" placeholder="Personalzahl">
        <input id="personalTextInput" type="text" placeholder="Freitext">
        <button id="confirmButton" class="btn btn-xs btn-success">Bestätigen</button>
        <button id="deleteButton" class="btn btn-xs btn-danger">-</button>
        <button id="showTableButton" class="btn btn-default btn-xs">Zeige Tabelle</button>
    `;

    // Suchen des "Rekrutieren"-Buttons auf der Seite und Einfügen des DIV-Elements danach
    const recruitButton = document.querySelector('a[href$="/hire"]');
    recruitButton.insertAdjacentElement('afterend', personalDiv);

    // Abfragen von DOM-Elementen
    const inputField = document.getElementById('personalCountInput');
    const textInputField = document.getElementById('personalTextInput');
    const confirmButton = document.getElementById('confirmButton');
    const deleteButton = document.getElementById('deleteButton');
    const showTableButton = document.getElementById('showTableButton');

    // Extrahieren der Gebäude-ID aus der aktuellen URL
    const buildingId = window.location.pathname.split('/').pop();
    updateInputField(buildingId);
    updateTextInputField(buildingId);

    // Event-Listener für den "Bestätigen"-Button
    confirmButton.addEventListener('click', function() {
        const personalCount = parseInt(inputField.value);
        const textValue = textInputField.value;
        updatePersonalCount(buildingId, personalCount);
        updateTextValue(buildingId, textValue);
        alert(`Personalzahl ${personalCount} und Freitext "${textValue}" für Gebäude ${buildingId} gespeichert!`);
    });

    // Event-Listener für den "Löschen"-Button
    deleteButton.addEventListener('click', function() {
        if (confirm('Möchten Sie diese Personalzahl und den Freitext löschen?')) {
            deletePersonalCount(buildingId);
            deleteTextValue(buildingId);
            alert(`Personalzahl und Freitext für Gebäude ${buildingId} gelöscht!`);
        }
    });

    // Event-Listener für den "Zeige Tabelle"-Button
    showTableButton.addEventListener('click', function() {
        showBuildingTable();
    });

    // Funktion zum Anzeigen einer Tabelle mit Gebäudeinformationen
    async function showBuildingTable() {
        const buildingsResponse = await fetch('https://www.leitstellenspiel.de/api/buildings');
        const buildingsData = await buildingsResponse.json();

        // Erstellen einer HTML-Tabelle
        const table = document.createElement('table');
        table.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Soll Personal</th>
                <th>Ist Personal</th>
                <th>Freitext</th>
            </tr>
        `;

        const personalData = getLocalStorageData();
        const textData = getLocalStorageTextData();

        // Iterieren durch die gespeicherten Personaldaten und Gebäudeinformationen
    for (const buildingId in personalData) {
        const buildingInfo = buildingsData.find(building => building.id === parseInt(buildingId));
        const textInfo = textData[buildingId] || ''; // Freitext für diese Paarung
        if (buildingInfo) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${buildingId}</td>
                <td><a href="https://www.leitstellenspiel.de/buildings/${buildingId}" target="_blank">${buildingInfo.caption}</a></td>
                <td>${personalData[buildingId]}</td>
                <td>${buildingInfo.personal_count}</td>
                <td>${textInfo}</td>
            `;

            // Überprüfen, ob der PersonalCount kleiner als das Ist Personal ist und die Zeile grün einfärben
            if (personalData[buildingId] < buildingInfo.personal_count) {
                row.style.backgroundColor = 'green'; // Hintergrundfarbe grün setzen
            }

            table.appendChild(row);
        }
    }

        // Öffnen eines Popup-Fensters und Anhängen der Tabelle
        const popup = window.open('', '_blank');
        popup.document.body.appendChild(table);
    }
})();
