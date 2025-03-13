// ==UserScript==
// @name         LSS Auto kaputt
// @namespace    www.leitstellenspiel.de
// @version      1.13
// @description  Simuliert den Ausfall von Fahrzeugen aus technischen Gründen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Funktion, um eine zufällige Zahl zwischen min und max zu generieren
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Funktion, um ein Popup anzuzeigen
    function showPopup(message) {
        const popup = document.createElement('div');
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        popup.style.color = '#fff';
        popup.style.padding = '10px';
        popup.style.borderRadius = '5px';
        popup.textContent = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            document.body.removeChild(popup);
        }, 5000);
    }

// Funktion, um den Kilometerstand eines Fahrzeugs abzurufen
function getVehicleDistance(vehicleId, caption) {
    fetch('https://www.leitstellenspiel.de/api/v1/vehicle_distances.json')
        .then(response => response.json())
        .then(distanceData => {
            // Durchsuchen Sie die Liste der Kilometerstände nach der vehicle_id des ausgewählten Fahrzeugs
            const vehicleDistance = distanceData.result.find(item => item.vehicle_id === vehicleId || item.id === vehicleId);
            if (vehicleDistance && typeof vehicleDistance.distance_km !== 'undefined') {
                const distance = vehicleDistance.distance_km;
                console.log(`Fahrzeug "${caption}", ID: ${vehicleId}, Kilometerstand: ${distance} km`);

                // Berechnung der Wahrscheinlichkeit eines Totalschadens hier...
                // In den folgenden 4 Zeilen kann die Wahrscheinlichkeit eines Totalausfalls eingestellt werden. Es darf immer nur 1 Zeile aktiv sein. Zum aktivieren die beiden Linien am Anfang der Zeile entfernen. Zum deaktivieren diese wieder einfügen.
                //const probability = 101; //Jedes Fahrzeug ist Totalausfall
                const probability = Math.exp(1.23072 + 6.98756e-05 * distance); //Fahrzeuge über 55kkm sind immer Totalschaden
                //const probability = Math.cosh((6.86197e-05) * (distance - 1.09594)); //Fahrzeuge über 100kkm sind immer Totalschaden
                //const probability = coshyp((-3.45427e-05) * (distance - 32928)); //Fahrzeuge über 200kkm sind immer Totalschaden
                console.log(`Berechnete Wahrscheinlichkeit eines Totalschadens: ${probability}`);

                // Überprüfen, ob das Fahrzeug einen Totalschaden erleidet
                if (probability >= 100 || probability >= Math.random() * 100) {
                    // Das Fahrzeug erleidet einen Totalschaden
                    setVehicleOutOfService(vehicleId, caption, true, distance);
                } else {
                    // Das Fahrzeug muss für 10 Minuten in die Werkstatt
                    setVehicleOutOfService(vehicleId, caption, false, distance);
                    localStorage.setItem('outOfServiceVehicle', JSON.stringify({ vehicleId: vehicleId, timestamp: new Date().getTime(), caption }));
                }
            } else {
                console.error(`Kilometerstand für Fahrzeug "${caption}", ID: ${vehicleId} nicht gefunden oder undefiniert.`);
            }
        })
        .catch(error => {
            console.error(`Fehler beim Abrufen des Kilometerstands für Fahrzeug "${caption}", ID: ${vehicleId}:`, error);
        });
}
// Funktion, um ein Fahrzeug außer Dienst zu setzen
function setVehicleOutOfService(vehicleId, caption, sendMessage, vehicleDistance) {
    fetch(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/6`, {
        method: 'GET'
    }).then(response => {
        if (response.ok) {
            console.log(`Das Fahrzeug ${vehicleId} ist außer Dienst.`);
            if (sendMessage) {
                // Hier wird die Fahrzeug-ID korrekt übergeben
                sendMessageToPlayer(`Das Fahrzeug "${caption}" hat nach ${vehicleDistance} Kilometern einen Totalschaden erlitten und muss ausgewechselt werden. Link zum Fahrzeug: https://www.leitstellenspiel.de/vehicles/${vehicleId}`, caption, vehicleDistance, vehicleId);
            }
            showPopup(`Das Fahrzeug "${caption}" ist wegen Reparaturarbeiten außer Dienst.`);
        } else {
            console.error(`Fehler beim Setzen des Fahrzeugs ${vehicleId} außer Dienst.`);
        }
    });
}

    // Funktion, um ein Fahrzeug wieder in den Dienst zu setzen
    function setVehicleInService(vehicleId, caption) {
        fetch(`https://www.leitstellenspiel.de/vehicles/${vehicleId}/set_fms/2`, {
            method: 'GET'
        }).then(response => {
            if (response.ok) {
                console.log(`Das Fahrzeug ${vehicleId} ist wieder einsatzbereit.`);
                showPopup(`Das Fahrzeug "${caption}" ist wieder einsatzbereit.`);
            } else {
                console.error(`Fehler beim Setzen des Fahrzeugs ${vehicleId} wieder einsatzbereit.`);
            }
        });
    }

    // Funktion zur Berechnung des Intervalls basierend auf der Fahrzeuganzahl
    function calculateInterval(vehicleCount) {
        const minTime = Math.pow(1.666649e-07 * vehicleCount, -0.307978);
        const maxTime = minTime + (minTime * 0.5);
        // Umrechnung von Millisekunden in Minuten
        return getRandomInt(minTime, maxTime) / 0.001 * 60;
    }

// Funktion zur Nachrichtenversendung an den Spieler
function sendMessageToPlayer(messageBody, vehicleCaption, vehicleDistance, vehicleId) {
    // Authentifizierungstoken (CSRF-Token) abrufen
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (authToken) {
        // Neue Konstante für die URL
        const messageUrl = "https://www.leitstellenspiel.de/messages";

        // Kilometerstand runden
        const roundedDistance = Math.round(vehicleDistance);

        // Nachrichteninformationen
        fetch('https://www.leitstellenspiel.de/api/credits')
            .then(response => response.json())
            .then(creditsData => {
                const recipients = creditsData.user_name; // Spielername als Empfänger
                const subject = "Fahrzeug Totalschaden";
                const messageData = {
                    "message[recipients]": recipients,
                    "message[subject]": subject,
                    "message[body]": `Das Fahrzeug "${vehicleCaption}" hat nach ${roundedDistance} Kilometern einen Totalschaden erlitten und muss ausgewechselt werden. Link zum Fahrzeug: https://www.leitstellenspiel.de/vehicles/${vehicleId}`,
                    "utf8": "✓",
                    "authenticity_token": authToken,
                    "commit": "Nachricht absenden",
                };

                // POST-Anfrage an die URL senden mit Nachrichtenobjekt im Body
                fetch(messageUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    },
                    body: new URLSearchParams(messageData).toString(),
                })
                    .then((response) => {
                        if (response.ok) {
                            console.log("Nachricht erfolgreich gesendet!");
                        } else {
                            console.error("Fehler beim Senden der Nachricht.");
                        }
                    })
                    .catch((error) => {
                        console.error("Ein Fehler ist aufgetreten:", error);
                    });
            })
            .catch(error => {
                console.error("Fehler beim Abrufen des Spielername:", error);
            });
    } else {
        console.error("CSRF-Token nicht gefunden.");
    }
}
    // Hauptfunktion, um den Prozess zu steuern
    function simulateVehicleFailure() {
        // Fahrzeuganzahl aus der API abrufen
        fetch('https://www.leitstellenspiel.de/api/vehicles')
            .then(response => response.json())
            .then(data => {
                const vehicleCount = data.length;

                // Prüfen, ob bereits ein Fahrzeug außer Dienst ist
                const storedVehicle = localStorage.getItem('outOfServiceVehicle');
                if (storedVehicle) {
                    const { vehicleId, timestamp, caption } = JSON.parse(storedVehicle);
                    const currentTime = new Date().getTime();
                    if (currentTime - timestamp >= 600000) { // 10 Minuten Reparaturzeit
                        // Fahrzeug ist seit mindestens 10 Minuten außer Dienst, wieder einsatzbereit setzen
                        setVehicleInService(vehicleId, caption);
                        localStorage.removeItem('outOfServiceVehicle');
                    }
                } else {
                    // Fahrzeug auswählen und überprüfen, ob es einen Totalschaden erleidet
                    const vehiclesWithFMS2 = data.filter(vehicle => vehicle.fms_real === 2);
                    if (vehiclesWithFMS2.length > 0) {
                        const randomIndex = getRandomInt(0, vehiclesWithFMS2.length - 1);
                        const selectedVehicle = vehiclesWithFMS2[randomIndex];
                        const { id, caption } = selectedVehicle;

                        // Kilometerstand des ausgewählten Fahrzeugs abrufen und in der Konsole anzeigen
                        getVehicleDistance(id, caption);
                    }
                }

                // Simulation in festgelegtem Intervall ausführen
                setTimeout(simulateVehicleFailure, calculateInterval(vehicleCount));
            });
    }

    // Skript starten
    simulateVehicleFailure();
})();
