// ==UserScript==
// @name         LSS Zufällige Streifenroute erstellen
// @version      1.0
// @description  Erstellen von zufälligen Streifenrouten mit der aktuellen Kartenposition
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS%20Zuweisungschecker/icons8-approve-80.png
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Funktion zum Erstellen des Triggerelements
    function createTriggerElement() {
        //console.log("Trigger-Element wird erstellt");

        const triggerLi = document.createElement('li');
        const triggerA = document.createElement('a');
        const triggerImg = document.createElement('img');
        triggerImg.src = GM_getResourceURL('icon');
        triggerImg.width = 24;
        triggerImg.height = 24;
        triggerA.href = '#';
        triggerA.append(triggerImg, '\xa0Zufällige Streifenroute erstellen');
        triggerLi.append(triggerA);

        triggerLi.addEventListener('click', event => {
            event.preventDefault();
            //console.log("Triggerelement geklickt, Modal wird erstellt");
            createModal();
        });

        // Insert the trigger-element to the DOM
        /** @type {HTMLLIElement | undefined} */
        document
            .querySelector('#menu_profile + .dropdown-menu > li.divider')
            ?.before(triggerLi);
    }

    // Funktion zum Erstellen des Modals für die Eingabe
    function createModal() {
        //console.log("Modal wird erstellt");

        const modalHtml = `
            <div id="routeModal" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: darkgrey; padding: 20px; border: 1px solid #ccc; z-index: 9999;">
                <h3>Streifenroute erstellen</h3>
                <label for="radius">Radius (in km):</label>
                <input type="number" id="radius" value="5" min="1" max="100" style="width: 100%; margin-bottom: 10px;">
                <label for="numPoints">Punkteanzahl:</label>
                <input type="number" id="numPoints" value="5" min="3" max="50" style="width: 100%; margin-bottom: 10px;">
                <label for="routeName">Route Name:</label>
                <input type="text" id="routeName" placeholder="Gib einen Namen ein" style="width: 100%; margin-bottom: 10px;">
                <button id="submitRoute" class="btn btn-success">Route erstellen</button>
                <button id="cancelRoute" class="btn btn-danger">Abbrechen</button>
            </div>
        `;

        // Modal in den Body einfügen
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Event Listener für das Absenden der Route
        document.getElementById('submitRoute').addEventListener('click', function () {
            const radius = parseInt(document.getElementById('radius').value, 10);
            const numPoints = parseInt(document.getElementById('numPoints').value, 10);
            const routeName = document.getElementById('routeName').value;

            if (routeName.trim() === '') {
                alert('Bitte einen Namen für die Route eingeben.');
                return;
            }

            //console.log(`Erstelle Route: Name = ${routeName}, Radius = ${radius} km, Punkteanzahl = ${numPoints}`);
            createRandomRoute(radius, numPoints, routeName);

            // Modal schließen
            document.getElementById('routeModal').remove();
        });

        // Event Listener für das Schließen des Modals
        document.getElementById('cancelRoute').addEventListener('click', function () {
            //console.log("Route-Erstellung abgebrochen");
            document.getElementById('routeModal').remove();
        });
    }

    // Funktion zum Erstellen der zufälligen Streifenroute
    function createRandomRoute(radiusInKm, numPoints, routeName) {
        if (typeof map === 'undefined') {
            console.warn('Leaflet-Karte (map) nicht verfügbar.');
            return;
        }

        const center = map.getCenter(); // Kartenmittelpunkt abrufen
        const earthRadius = 6371; // Erdradius in km
        const coords = [];

        //console.log('📍 Kartenmittelpunkt:', center);
        //console.log(`🗺️ ${numPoints} Punkte im Umkreis von ${radiusInKm} km:`);

        // Zufällige Punkte innerhalb des Kreises berechnen
        for (let i = 0; i < numPoints; i++) {
            // Zufälligen Winkel im Kreis erzeugen
            const angle = Math.random() * 2 * Math.PI;

            // Zufällige Entfernung im Kreis erzeugen (muss <= radius sein)
            const randomRadius = Math.random() * radiusInKm;

            const dx = randomRadius * Math.cos(angle);
            const dy = randomRadius * Math.sin(angle);

            const deltaLat = dy / earthRadius * (180 / Math.PI);
            const deltaLng = dx / (earthRadius * Math.cos(center.lat * Math.PI / 180)) * (180 / Math.PI);

            const newLat = center.lat + deltaLat;
            const newLng = center.lng + deltaLng;

            coords.push({ lat: newLat, lng: newLng });

            //console.log(`${i + 1}: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
        }

        /* Punkte als Marker anzeigen
        coords.forEach(point => {
            L.marker([point.lat, point.lng], {
                title: `Punkt: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
            }).addTo(map);
        });
        */

        // Authentifizierungs-Token abrufen
        const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!authToken) {
            alert('Authentifizierung fehlgeschlagen. Bitte neu laden.');
            return;
        }

        // Koordinaten in URL-Format umwandeln (jetzt mit | als Trennzeichen)
        const waypoints = coords.map(coord => `${coord.lat},${coord.lng}`).join('|');

        // POST-Daten vorbereiten
        const postData = new URLSearchParams();
        postData.append('utf8', '✓');
        postData.append('authenticity_token', authToken);
        postData.append('patrol[caption]', routeName);
        postData.append('patrol[waypoints]', waypoints);

        // POST-Anfrage senden
        //console.log("POST-Daten werden gesendet:", postData.toString());

        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://www.leitstellenspiel.de/patrols',
            data: postData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            onload: function(response) {
                if (response.status === 200) {
                    //console.log('Streifenroute erfolgreich erstellt!');
                    alert('Streifenroute erfolgreich erstellt!');
                } else {
                    console.error('Fehler beim Erstellen der Streifenroute:', response);
                    alert('Fehler beim Erstellen der Streifenroute.');
                }
            }
        });
    }

    // Triggerelement einfügen, wenn die Seite vollständig geladen ist
    window.addEventListener('load', () => {
        createTriggerElement();
    });
})();
