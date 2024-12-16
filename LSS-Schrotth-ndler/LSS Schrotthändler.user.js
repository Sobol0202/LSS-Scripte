// ==UserScript==
// @name         LSS Schrotthändler
// @namespace    www.leitstellenspiel.de
// @version      1.4
// @description  Erzeugt die Möglichkeit alle Fahrzeuge eines bestimmten Typs zu löschen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Schrotth-ndler/icons8-garbage-truck-64.png?raw
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Individueller Modal-Name
    var modalName = "Modal_Schrott";

    // Funktion zum Löschen eines Fahrzeugs
    function deleteVehicle(vehicleId) {
        console.log('Deleting vehicle with ID:', vehicleId);
        var deleteUrl = "/vehicles/" + vehicleId;

        // Hole den CSRF-Token aus dem Meta-Tag
        var authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        // Erstelle eine AJAX-Anfrage, um das Fahrzeug zu löschen
        var xhr = new XMLHttpRequest();
        xhr.open("DELETE", deleteUrl, true);

        // Füge den CSRF-Token hinzu, falls vorhanden
        if (authToken) {
            xhr.setRequestHeader("X-CSRF-Token", authToken);
        }

        // Setze den Callback für die Antwort
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                if (xhr.status == 200) {
                    console.log("Fahrzeug " + vehicleId + " erfolgreich gelöscht.");
                } else {
                    console.error("Fehler beim Löschen des Fahrzeugs " + vehicleId + ". Statuscode: " + xhr.status);
                }
            }
        };

        // Sende die Anfrage
        xhr.send();
    }

// Funktion zum Löschen des ausgewählten Fahrzeugtyps
function deleteSelectedVehicle() {
    const selectedTypeId = document.getElementById('vehicleType').value;
    const selectedTypeCaption = document.getElementById('vehicleType').options[document.getElementById('vehicleType').selectedIndex].text;

    console.log('Ausgewählter Fahrzeugtyp zum Löschen:', selectedTypeId, selectedTypeCaption);

    // Hole die Fahrzeug-IDs basierend auf dem ausgewählten Fahrzeugtyp
    const vehicleIdsToDelete = vehicles.filter(vehicle => vehicle.vehicle_type == selectedTypeId).map(vehicle => vehicle.id);

    // Sicherheitsabfrage vor dem Löschen
    var confirmDelete = confirm("Möchtest du wirklich " + vehicleIdsToDelete.length + " Fahrzeuge vom Typ " + selectedTypeCaption + " löschen?");

    // Führe das Löschen aus, wenn bestätigt
    if (confirmDelete) {
        // Durchlaufe die zu löschenden Fahrzeuge und führe das Löschen mit Verzögerung aus
        vehicleIdsToDelete.forEach(function (vehicleId, index) {
            setTimeout(function () {
                deleteVehicle(vehicleId);
            }, index * 100);
        });

        // Warte 100ms für jedes zu löschende Fahrzeug und lade dann die Seite neu
        setTimeout(function () {
            location.reload();
        }, 100 * vehicleIdsToDelete.length);
    } else {
        console.log("Löschvorgang abgebrochen.");
    }

    // Schließe das Modal nach dem Löschen
    closeModal();
}

    // Funktion zum Abrufen der Fahrzeuge über die API
    function getVehicles() {
        console.log('Getting vehicles...');
        var apiUrl = "https://www.leitstellenspiel.de/api/vehicles";

        // Erstelle eine AJAX-Anfrage, um die Fahrzeuge abzurufen
        var xhr = new XMLHttpRequest();
        xhr.open("GET", apiUrl, true);

        // Setze den Callback für die Antwort
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                vehicles = JSON.parse(xhr.responseText); // Aktualisiere vehicles mit den abgerufenen Fahrzeugen

                // Gib die Fahrzeuge in der Konsole aus
                //console.log("Fahrzeuge abgerufen:", vehicles);

                // Öffne das Modal-Fenster, nachdem die Fahrzeuge abgerufen wurden
                openModal();
            }
        };

        // Sende die Anfrage
        xhr.send();
    }

    // Funktion zum Erstellen des Modal-Fensters mit Dropdown-Menü
    function createModal() {
        //console.log('Creating modal...');

        // Überprüfe, ob die Fahrzeuge bereits abgerufen wurden
        if (!vehicles.length) {
            // Lade die Fahrzeugtypen von der API, nur wenn die Fahrzeuge nicht bereits abgerufen wurden
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://api.lss-manager.de/de_DE/vehicles',
                responseType: 'json',
                onload: function (response) {
                    if (response.status === 200) {
                        const vehicleTypes = response.response;

                        // Erstelle Dropdown-Optionen aus den Fahrzeugtypen
                        const options = Object.entries(vehicleTypes).map(([typeId, typeData]) => {
                            return `<option value="${typeId}">${typeData.caption}</option>`;
                        });

                        // Erstelle das Modal-Fenster mit Dropdown-Menü
                        const modalHTML = `
                            <div id="${modalName}" class="modal">
                                <div class="modal-content ${modalName}Content">
                                    <span class="close" id="${modalName}CloseBtn">&times;</span>
                                    <h2>Schrotthändler</h2>
                                    <p>Bitte wähle den Fahrzeugtypen aus, den du löschen möchtest.</p>
                                    <select id="vehicleType">${options}</select>
                                    <button id="deleteVehicleBtn" class="btn btn-xs btn-danger">Fahrzeuge löschen</button>
                                </div>
                            </div>
                        `;

                        // Füge das Modal zum Body hinzu
                        document.body.insertAdjacentHTML('beforeend', modalHTML);

                        // Füge Event-Listener hinzu
                        document.getElementById(`${modalName}CloseBtn`).addEventListener('click', closeModal);
                        document.getElementById('deleteVehicleBtn').addEventListener('click', deleteSelectedVehicle);

                        // Rufe die Funktion zum Abrufen der Fahrzeuge auf
                        getVehicles();
                    } else {
                        console.error('Fehler beim Abrufen der Fahrzeugtypen. Statuscode:', response.status);
                    }
                },
                onerror: function (error) {
                    console.error('Fehler beim Abrufen der Fahrzeugtypen:', error);
                }
            });
        } else {
            // Wenn die Fahrzeuge bereits abgerufen wurden, öffne einfach das Modal
            openModal();
        }
    }

    // Funktion zum Öffnen des Modal-Fensters
    function openModal() {
        // Öffne das Modal-Fenster
        document.getElementById(modalName).style.display = 'block';
    }

    // Funktion zum Schließen des Modal-Fensters
    function closeModal() {
        //console.log('Closing modal...');
        document.getElementById(modalName).style.display = 'none';
    }

    // create a trigger-element
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, 'Schrotthändler');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        createModal();
    });

    // insert the trigger-element to the DOM
    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);

    // Füge das Interface als globales Objekt hinzu
    window.lightboxOpen = createModal;

    // Array zum Speichern der abgerufenen Fahrzeuge
    var vehicles = [];
    // Füge das CSS für das Styling hinzu
    GM_addStyle(`
        #${modalName} {
            display: none;
            justify-content: center;
            align-items: center;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.4);
        }

        .${modalName}Content {
            width: 30%;
            background-color: white;
            padding: 20px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            margin: auto;
        }
    `);
})();
