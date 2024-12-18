// API-Endpunkte
const BUILDINGS_API_URL = "https://www.leitstellenspiel.de/api/buildings";
const BUILDING_UPDATE_URL = "https://www.leitstellenspiel.de/buildings/";

// Authentifizierungstoken ermitteln
const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (!authToken) {
    console.error("Authentifizierungstoken nicht gefunden.");
} else {
    // Hauptfunktion
    async function main() {
        try {
            const response = await fetch(BUILDINGS_API_URL);
            const buildings = await response.json();

            // Leitstellen filtern
            const leitstellen = buildings.filter(b => b.building_type === 7);

            if (leitstellen.length < 2) {
                console.error("Es werden mindestens zwei Leitstellen benötigt.");
                return;
            }

            createDropdowns(leitstellen);
        } catch (error) {
            console.error("Fehler beim Abrufen der Gebäude:", error);
        }
    }

    // Dropdowns für die Leitstellen erstellen
    function createDropdowns(leitstellen) {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.style.position = 'fixed';
        dropdownContainer.style.top = '10px';
        dropdownContainer.style.left = '10px';
        dropdownContainer.style.backgroundColor = 'black';
        dropdownContainer.style.padding = '10px';
        dropdownContainer.style.zIndex = '1000';

        const label1 = document.createElement('label');
        label1.textContent = 'Erste Leitstelle:';
        const select1 = document.createElement('select');

        const label2 = document.createElement('label');
        label2.textContent = 'Zweite Leitstelle:';
        const select2 = document.createElement('select');

        leitstellen.forEach(ls => {
            const option1 = document.createElement('option');
            option1.value = ls.id;
            option1.textContent = `${ls.caption} (ID: ${ls.id})`;

            const option2 = option1.cloneNode(true);

            select1.appendChild(option1);
            select2.appendChild(option2);
        });

        const button = document.createElement('button');
        button.textContent = 'Starte Änderung';
        button.onclick = () => {
            const selectedId1 = parseInt(select1.value);
            const selectedId2 = parseInt(select2.value);

            if (selectedId1 && selectedId2 && selectedId1 !== selectedId2) {
                updateBuildings(selectedId1, selectedId2);
            } else {
                alert("Bitte wähle zwei unterschiedliche Leitstellen aus.");
            }
        };

        dropdownContainer.appendChild(label1);
        dropdownContainer.appendChild(select1);
        dropdownContainer.appendChild(document.createElement('br'));
        dropdownContainer.appendChild(label2);
        dropdownContainer.appendChild(select2);
        dropdownContainer.appendChild(document.createElement('br'));
        dropdownContainer.appendChild(button);

        document.body.appendChild(dropdownContainer);
    }

    // Gebäude basierend auf Leitstellen-IDs aktualisieren
    async function updateBuildings(sourceLeitstelleId, targetLeitstelleId) {
        try {
            // Abrufen aller Gebäude der ersten Leitstelle
            const response = await fetch(BUILDINGS_API_URL);
            const buildings = await response.json();

            const buildingsToUpdate = buildings.filter(
                b => b.leitstelle_building_id === sourceLeitstelleId
            );

            // Sicherheitsabfrage
            if (!confirm(`${buildingsToUpdate.length} Gebäude werden aktualisiert. Fortfahren?`)) {
                return;
            }

            console.log(`${buildingsToUpdate.length} Gebäude werden aktualisiert...`);

            for (const building of buildingsToUpdate) {
                const formData = new FormData();
                formData.append('utf8', '✓');
                formData.append('_method', 'put');
                formData.append('authenticity_token', authToken);
                formData.append('building[leitstelle_building_id]', targetLeitstelleId);
                formData.append('commit', 'Speichern');

                const updateResponse = await fetch(`${BUILDING_UPDATE_URL}${building.id}`, {
                    method: 'POST',
                    body: formData
                });

                if (updateResponse.ok) {
                    console.log(`Gebäude ${building.id} erfolgreich aktualisiert.`);
                } else {
                    console.error(`Fehler beim Aktualisieren von Gebäude ${building.id}.`);
                }

                // 100ms Pause zwischen den Anfragen
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log("Alle Gebäude wurden aktualisiert.");
        } catch (error) {
            console.error("Fehler beim Aktualisieren der Gebäude:", error);
        }
    }

    // Skript starten
    main();
}
