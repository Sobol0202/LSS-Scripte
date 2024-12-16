// ==UserScript==
// @name         LSS DIY-VBGSL Vorschlag
// @namespace    www.leitstellenspiel.de
// @version      1.4
// @description  Gibt einen Vorschlag für eine VBGSL innerhalb eines einstellbaren Bereichs aus
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    const keywordsKey = 'randomPlaceKeywords';
    let currentResultElement = null;

    let keywords = JSON.parse(localStorage.getItem(keywordsKey));
    if (!keywords) {
        keywords = ['Brand', 'Castortransport', 'Grillpary', 'Stadtfest', 'Wasser', 'Explosion', 'Großbrand', 'Zugunglück', 'Flugunfall', 'PKW', 'LKW', 'Gefahrgut', 'Chemie', 'Vermisst', 'Bus', 'Statanistisches Ritual', 'Massenpanik', 'Arbeitsunfall', 'Disko', ];
    }

    //Zufällige Zahl für Patienten erzeugen
    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    //Zufälliges Stichwort erzeugen
    function getRandomKeyword() {
        const randomIndex = Math.floor(Math.random() * keywords.length);
        return keywords[randomIndex];
    }

    //Speichere Stichworte
    function saveKeywordsToLocalStorage() {
        localStorage.setItem(keywordsKey, JSON.stringify(keywords));
    }

    //Funktion zum bearbeiten der Stichworte
    function openEditKeywordsPopup() {
        const popup = prompt('Bearbeite die Stichworte (kommagetrennt):', keywords.join(', '));
        if (popup !== null) {
            keywords = popup.split(',').map(keyword => keyword.trim());
            saveKeywordsToLocalStorage();
        }
    }

    //Funktion für Entfernungsberechnung zwischen 2 Koordinaten, Mathematische Berechnungen
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    //Dom Element für das Interface
    const parentElement = document.getElementById("btn-alliance-new-mission").parentElement;
    const emptyLine1 = document.createElement("br");
    const emptyLine2 = document.createElement("br");
    parentElement.appendChild(emptyLine1);
    parentElement.appendChild(emptyLine2);

    //Dom Element für den Inputcontainer
    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.alignItems = "center";

    //Dom Element für das Stadteingabefelt
    const inputCity = document.createElement("input");
    inputCity.type = "text";
    inputCity.placeholder = "Stadt/Ort";
    inputCity.style.width = "150px";
    inputContainer.appendChild(inputCity);

    //Dom Element für das Entfernungseingabefeld
    const inputDistance = document.createElement("input");
    inputDistance.type = "number";
    inputDistance.placeholder = "Entfernung (km)";
    inputDistance.style.width = "100px";
    inputContainer.appendChild(inputDistance);

    //Dom Element für den Bestätigen Button
    const btnConfirm = document.createElement("button");
    btnConfirm.textContent = "Bestätigen";
    btnConfirm.style.color = "black";
    btnConfirm.style.marginLeft = "10px";
    //Click auf Bestätigen löst API Abfrage aus
    btnConfirm.addEventListener("click", async function() {
        const cityName = inputCity.value;
        const distance = parseFloat(inputDistance.value);
        //API Anfrage und Entfernungsberechnung
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${cityName}`);
            const data = await response.json();

            if (data.length > 0) {
                const city = data[0];
                const latCity = parseFloat(city.lat);
                const lonCity = parseFloat(city.lon);

                const responseNearby = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latCity}&lon=${lonCity}&zoom=10`);
                const dataNearby = await responseNearby.json();

                const latNearby = parseFloat(dataNearby.lat);
                const lonNearby = parseFloat(dataNearby.lon);

                const randomAngle = Math.random() * 2 * Math.PI;
                const randomDistance = Math.random() * distance;

                const latRandom = latNearby + (randomDistance / 111.32) * Math.cos(randomAngle);
                const lonRandom = lonNearby + (randomDistance / (111.32 * Math.cos(latNearby * (Math.PI / 180)))) * Math.sin(randomAngle);

                const responseRandom = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latRandom}&lon=${lonRandom}&zoom=10`);
                const dataRandom = await responseRandom.json();

                const randomPlaceName = dataRandom.address.village || dataRandom.address.town || dataRandom.address.city || dataRandom.address.hamlet || "Unbekannter Ort";

                const randomKeyword = getRandomKeyword();
                const randomNumber = getRandomNumber(0, 100);
                //Ergebnis anzeigen
                const resultElement = document.createElement("p");
                resultElement.textContent = `Einsatzvorschlag: ${randomPlaceName}, ${randomKeyword}, ${randomNumber} Patienten`;
               if (currentResultElement) {
                    parentElement.replaceChild(resultElement, currentResultElement);
                } else {
                    parentElement.appendChild(resultElement);
                }
                currentResultElement = resultElement;
            } else {
                console.log("Ort nicht gefunden.");
            }
        } catch (error) {
            console.error("Fehler bei der API-Anfrage:", error);
        }
    });

    inputContainer.appendChild(btnConfirm);
    parentElement.appendChild(inputContainer);
    //Button zum bearbeiten der Stichworte erzeugen
    const btnEditKeywords = document.createElement('button');
    btnEditKeywords.textContent = 'Stichworte';
    btnEditKeywords.style.color = "black";
    btnEditKeywords.style.marginLeft = '10px';
    btnEditKeywords.addEventListener('click', openEditKeywordsPopup);
    inputContainer.appendChild(btnEditKeywords);
    //Elemente einfügen
    parentElement.appendChild(inputContainer);
})();
