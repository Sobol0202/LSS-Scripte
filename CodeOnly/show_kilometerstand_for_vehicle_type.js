(async () => {
    // Gewünschten Fahrzeugtyp eintragen
    const VEHICLE_TYPE = 185;

    try {
        const [vehiclesResponse, distancesResponse] = await Promise.all([
            fetch("/api/vehicles"),
            fetch("/api/v1/vehicle_distances")
        ]);

        if (!vehiclesResponse.ok) {
            throw new Error(`Fahrzeug-API: HTTP ${vehiclesResponse.status}`);
        }

        if (!distancesResponse.ok) {
            throw new Error(`Kilometer-API: HTTP ${distancesResponse.status}`);
        }

        const vehicles = await vehiclesResponse.json();
        const distanceData = await distancesResponse.json();

        const distanceMap = new Map(
            distanceData.result.map(entry => [
                entry.vehicle_id,
                entry
            ])
        );

        const result = vehicles
            .filter(vehicle => vehicle.vehicle_type === VEHICLE_TYPE)
            .map(vehicle => {
                const distance = distanceMap.get(vehicle.id);

                return {
                    ID: vehicle.id,
                    Fahrzeug: vehicle.caption,
                    Typ: vehicle.vehicle_type,
                    "Kilometer gesamt": distance
                        ? Number(distance.distance_km.toFixed(2))
                        : null,
                    "Kilometer 30 Tage": distance
                        ? Number(distance.distance_km_30d.toFixed(2))
                        : null
                };
            })
            .sort((a, b) =>
                (b["Kilometer gesamt"] ?? 0) -
                (a["Kilometer gesamt"] ?? 0)
            );

        console.log(
            `Fahrzeuge vom Typ ${VEHICLE_TYPE}: ${result.length}`
        );

        console.table(result);

    } catch (error) {
        console.error("Fehler beim Abrufen der Fahrzeugdaten:", error);
    }
})();
