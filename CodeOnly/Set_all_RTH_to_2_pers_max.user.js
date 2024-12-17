(async function() {
    // Fahrzeugtyp festlegen
    const vehicle_type = 31;

    if (isNaN(vehicle_type)) {
        console.error("Fehler. Fahrzeugtyp nicht erkannt");
        return;
    }

    // Authentizitätstoken ermitteln
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!authToken) {
        console.error("Authentizitätstoken konnte nicht gefunden werden.");
        return;
    }

    try {
        // Fahrzeug-API abrufen
        const response = await fetch("https://www.leitstellenspiel.de/api/vehicles");
        const vehicles = await response.json();

        // Filter Fahrzeuge nach vehicle_type
        const filteredVehicles = vehicles.filter(vehicle => vehicle.vehicle_type === vehicle_type);
        const vehicleIds = filteredVehicles.map(vehicle => vehicle.id);

        console.log(`Anzahl der zu bearbeitenden Anfragen: ${vehicleIds.length}`);
        alert(`Es wurden ${vehicleIds.length} Rettungshubschrauber gefunden. Sollen diese wirklich auf 2 Personan max gesetzt werden?`);

        // Wartefunktion
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

        // Anfragen senden
        for (const id of vehicleIds) {
            const formData = new FormData();
            formData.append('utf8', '✓');
            formData.append('_method', 'put');
            formData.append('authenticity_token', authToken);
            formData.append('vehicle[personal_max]', 2);
            formData.append('commit', 'Speichern');

            try {
                const response = await fetch(`https://www.leitstellenspiel.de/vehicles/${id}`, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    console.log(`Fahrzeug mit ID ${id} erfolgreich aktualisiert.`);
                } else {
                    console.error(`Fehler beim Aktualisieren des Fahrzeugs mit ID ${id}: ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Fehler beim Aktualisieren des Fahrzeugs mit ID ${id}: ${error}`);
            }

            // 100ms warten
            await delay(100);
        }

        console.log("Vorgang abgeschlossen.");
    } catch (error) {
        console.error("Fehler beim Abrufen der Fahrzeugdaten:", error);
    }
})();
