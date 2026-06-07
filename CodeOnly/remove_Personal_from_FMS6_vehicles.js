(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    const vehicles = await fetch('/api/vehicles')
        .then(r => r.json());

    const status6Vehicles = vehicles.filter(v => v.fms_real === 6);

    console.log(`Gefunden: ${status6Vehicles.length} Fahrzeuge in Status 6`);

    for (let i = 0; i < status6Vehicles.length; i++) {
        const vehicle = status6Vehicles[i];

        console.log(
            `[${i + 1}/${status6Vehicles.length}] Bearbeite ${vehicle.caption} (${vehicle.id})`
        );

        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = `/vehicles/${vehicle.id}/zuweisung`;

        document.body.appendChild(iframe);

        await new Promise(resolve => {
            iframe.onload = resolve;
        });

        const doc = iframe.contentDocument;

        // max. 30 Sekunden auf Personalzuweiser warten
        let removeButton = null;

        for (let t = 0; t < 120; t++) {
            removeButton = doc.querySelector(
                '#vehicle-assigner-button-group .btn-danger'
            );

            if (removeButton) break;

            await sleep(250);
        }

        if (!removeButton) {
            console.warn(
                `Kein Entfernen-Button gefunden bei Fahrzeug ${vehicle.id}`
            );
            iframe.remove();
            continue;
        }

        const finished = new Promise(resolve => {
            doc.addEventListener(
                'bos-ernie.personalzuweiser.reset-completed',
                resolve,
                { once: true }
            );

            // Fallback nach 60 Sekunden
            setTimeout(resolve, 60000);
        });

        removeButton.click();

        await finished;

        console.log(`✓ Fahrzeug ${vehicle.id} fertig`);

        iframe.remove();

        // kleine Pause zwischen Fahrzeugen
        await sleep(1000);
    }

    console.log('Alle Status-6-Fahrzeuge bearbeitet');
})();
