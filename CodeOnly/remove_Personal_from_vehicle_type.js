(async () => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Gewünschten Fahrzeugtyp hier festlegen
    const TARGET_VEHICLE_TYPE = 123;

    try {
        const response = await fetch('/api/vehicles');

        if (!response.ok) {
            throw new Error(`HTTP-Fehler ${response.status}`);
        }

        const vehicles = await response.json();

        const matchingVehicles = vehicles.filter(
            vehicle => vehicle.vehicle_type === TARGET_VEHICLE_TYPE
        );

        console.log(
            `Gefunden: ${matchingVehicles.length} Fahrzeuge mit vehicle_type ${TARGET_VEHICLE_TYPE}`
        );

        for (let i = 0; i < matchingVehicles.length; i++) {
            const vehicle = matchingVehicles[i];

            console.log(
                `[${i + 1}/${matchingVehicles.length}] Bearbeite ` +
                `${vehicle.caption} (${vehicle.id})`
            );

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `/vehicles/${vehicle.id}/zuweisung`;

            document.body.appendChild(iframe);

            try {
                await new Promise((resolve, reject) => {
                    iframe.onload = resolve;
                    iframe.onerror = () => reject(
                        new Error(
                            `Zuweisungsseite für Fahrzeug ${vehicle.id} konnte nicht geladen werden`
                        )
                    );
                });

                const doc = iframe.contentDocument;

                if (!doc) {
                    console.warn(
                        `Kein Zugriff auf das Dokument von Fahrzeug ${vehicle.id}`
                    );
                    continue;
                }

                let removeButton = null;

                for (let t = 0; t < 120; t++) {
                    removeButton = doc.querySelector(
                        '#vehicle-assigner-button-group .btn-danger'
                    );

                    if (removeButton) {
                        break;
                    }

                    await sleep(250);
                }

                if (!removeButton) {
                    console.warn(
                        `Kein Entfernen-Button bei Fahrzeug ${vehicle.id} gefunden`
                    );
                    continue;
                }

                const finished = new Promise(resolve => {
                    let completed = false;

                    const finish = () => {
                        if (completed) return;
                        completed = true;
                        resolve();
                    };

                    doc.addEventListener(
                        'bos-ernie.personalzuweiser.reset-completed',
                        finish,
                        { once: true }
                    );

                    // Fallback nach 60 Sekunden
                    setTimeout(finish, 60000);
                });

                removeButton.click();

                await finished;

                console.log(
                    `✓ ${vehicle.caption} (${vehicle.id}) fertig`
                );
            } catch (error) {
                console.error(
                    `Fehler bei Fahrzeug ${vehicle.caption} (${vehicle.id}):`,
                    error
                );
            } finally {
                iframe.remove();
            }
            await sleep(1000);
        }

        console.log(
            `Alle Fahrzeuge mit vehicle_type ${TARGET_VEHICLE_TYPE} bearbeitet`
        );
    } catch (error) {
        console.error('Fehler beim Laden oder Bearbeiten der Fahrzeuge:', error);
    }
})();
