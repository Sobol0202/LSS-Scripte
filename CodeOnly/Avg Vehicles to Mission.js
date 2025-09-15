// Funktion zum Abrufen der Daten von der angegebenen URL
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}

// Funktion zur Berechnung des Durchschnitts der benötigten Fahrzeuge für Einsätze
async function calculateAverageVehicles() {
    const missionsDataUrl = "https://v3.lss-manager.de/modules/lss-missionHelper/missions/de_DE.json";
    const missionsData = await fetchData(missionsDataUrl);

    if (missionsData) {
        let totalVehicles = 0;
        let totalMissions = 0;

        // Iteriere durch jeden Einsatz und addiere die Anzahl der benötigten Fahrzeuge (ohne water_needed, min_pump_speed und personnel_educations)
        for (const missionId in missionsData) {
            const mission = missionsData[missionId];
            if (mission.requirements && Object.keys(mission.requirements).length > 0) {
                // Filtere water_needed, min_pump_speed und personnel_educations heraus und summiere die übrigen Werte
                const vehiclesCount = Object.entries(mission.requirements)
                    .filter(([key, value]) => key !== 'water_needed' && key !== 'min_pump_speed' && key !== 'personnel_educations')
                    .reduce((acc, [key, value]) => acc + value, 0);
                totalVehicles += vehiclesCount;
                totalMissions++;
                console.log(`Einsatz ID: ${missionId}, Benötigte Fahrzeuge: ${vehiclesCount}`);
            } else {
                console.log(`Einsatz ID: ${missionId} hat keine Anforderungen.`);
            }
        }

        // Berechne den Durchschnitt der benötigten Fahrzeuge, nur wenn es Einsätze mit Anforderungen gibt
        if (totalMissions > 0) {
            const averageVehicles = totalVehicles / totalMissions;
            console.log(`Gesamtanzahl der Einsätze: ${totalMissions}`);
            console.log(`Gesamtanzahl der benötigten Fahrzeuge: ${totalVehicles}`);
            console.log(`Durchschnittlich werden ${averageVehicles.toFixed(2)} Fahrzeuge pro Einsatz benötigt.`);
            return averageVehicles;
        } else {
            console.log("Keine Einsätze mit Anforderungen gefunden.");
            return 0;
        }
    }
}

// Funktion aufrufen und Durchschnitt anzeigen
calculateAverageVehicles();
