// Funktion zum Löschen eines Fahrzeugs
function deleteVehicle(vehicleId) {
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

// Funktion zum Abrufen der Fahrzeuge über die API
function getVehicles() {
    var apiUrl = "https://www.leitstellenspiel.de/api/vehicles";
    
    // Erstelle eine AJAX-Anfrage, um die Fahrzeuge abzurufen
    var xhr = new XMLHttpRequest();
    xhr.open("GET", apiUrl, true);

    // Setze den Callback für die Antwort
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var vehicles = JSON.parse(xhr.responseText);

            // Gib die Fahrzeuge in der Konsole aus
            console.log("Fahrzeuge abgerufen:", vehicles);

            // Lass den Benutzer den zu löschenden Fahrzeugtyp auswählen
            var vehicleTypeToDelete = prompt("Welchen Fahrzeugtyp möchtest du löschen? (Die Nummern findest du im Forum)");

            // Überprüfe, ob die Eingabe eine Zahl zwischen 0 und 133 ist
            if (!isNaN(vehicleTypeToDelete) && vehicleTypeToDelete >= 0 && vehicleTypeToDelete <= 133) {
                // Filtere die Fahrzeuge nach dem ausgewählten Fahrzeugtyp
                var vehiclesToDelete = vehicles.filter(function (vehicle) {
                    return vehicle.vehicle_type == vehicleTypeToDelete;
                });

                // Gib die Anzahl der zu löschenden Fahrzeuge aus
                console.log("Anzahl der zu löschenden Fahrzeuge:", vehiclesToDelete.length);

                // Sicherheitsabfrage vor dem Löschen
                var confirmDelete = confirm("Möchtest du wirklich " + vehiclesToDelete.length + " Fahrzeuge vom Typ " + vehicleTypeToDelete + " löschen?");
                
                // Führe das Löschen aus, wenn bestätigt
                if (confirmDelete) {
                    // Durchlaufe die zu löschenden Fahrzeuge und führe das Löschen mit Verzögerung aus
                    vehiclesToDelete.forEach(function (vehicle, index) {
                        setTimeout(function () {
                            deleteVehicle(vehicle.id);
                        }, index * 100);
                    });
                } else {
                    console.log("Löschvorgang abgebrochen.");
                }
            } else {
                console.error("Ungültige Eingabe für Fahrzeugtyp.");
            }
        }
    };

    // Sende die Anfrage
    xhr.send();
}

// Rufe die Funktion zum Abrufen der Fahrzeuge auf
getVehicles();
