// ==UserScript==
// @name         LSS Leitstellenweise Gebäude Leitstellenzuweisung
// @version      1.0
// @description  Ermöglicht das verschieben aller Gebäude einer bestimmten Leitstelle in eine andere Leitstelle.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_getResourceURL
// @grant        GM_addStyle
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS%20Leitstellenweise%20Geb%C3%A4ude%20Leitstellenzuweisung/icons8-houses-64.png
// ==/UserScript==

(function() {
    'use strict';

    // Modal erstellen
    function createModal() {
        const BUILDINGS_API_URL = "https://www.leitstellenspiel.de/api/buildings";
        const BUILDING_UPDATE_URL = "https://www.leitstellenspiel.de/buildings/";

        const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (!authToken) {
            console.error("Authentifizierungstoken nicht gefunden.");
            return;
        }

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.backgroundColor = '#1e1e1e';
        modal.style.padding = '20px';
        modal.style.zIndex = '1000';
        modal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        modal.style.borderRadius = '10px';
        modal.style.color = 'white';
        modal.style.fontFamily = 'Arial, sans-serif';

        const loadingText = document.createElement('p');
        loadingText.textContent = 'Leitstellen werden geladen...';
        modal.appendChild(loadingText);

        document.body.appendChild(modal);

        // Leitstellen-Daten abrufen
        fetch(BUILDINGS_API_URL)
            .then(response => response.json())
            .then(buildings => {
                const leitstellen = buildings.filter(b => b.building_type === 7);

                if (leitstellen.length < 2) {
                    alert("Es werden mindestens zwei Leitstellen benötigt.");
                    document.body.removeChild(modal);
                    return;
                }

                // Dropdowns erstellen
                modal.innerHTML = ''; // Entferne Lade-Text
                createDropdowns(modal, leitstellen, authToken);
            })
            .catch(error => {
                console.error("Fehler beim Abrufen der Leitstellen:", error);
                alert("Fehler beim Abrufen der Leitstellen.");
                document.body.removeChild(modal);
            });
    }

    function createDropdowns(modal, leitstellen, authToken) {
        const label1 = document.createElement('label');
        label1.textContent = 'Quellleitstelle:';
        const select1 = document.createElement('select');
        styleDropdown(select1);

        const label2 = document.createElement('label');
        label2.textContent = 'Zielleitstelle:';
        const select2 = document.createElement('select');
        styleDropdown(select2);

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
        styleButton(button, 'green');

        button.onclick = () => {
            const selectedId1 = parseInt(select1.value);
            const selectedId2 = parseInt(select2.value);

            if (selectedId1 && selectedId2 && selectedId1 !== selectedId2) {
                updateBuildings(modal, selectedId1, selectedId2, authToken);
            } else {
                alert("Bitte wähle zwei unterschiedliche Leitstellen aus.");
            }
        };

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Schließen';
        styleButton(closeButton, 'red');
        closeButton.onclick = () => document.body.removeChild(modal);

        modal.appendChild(label1);
        modal.appendChild(select1);
        modal.appendChild(document.createElement('br'));
        modal.appendChild(label2);
        modal.appendChild(select2);
        modal.appendChild(document.createElement('br'));
        modal.appendChild(button);
        modal.appendChild(closeButton);
    }

    function styleDropdown(dropdown) {
        dropdown.style.width = '100%';
        dropdown.style.padding = '5px';
        dropdown.style.marginBottom = '10px';
        dropdown.style.border = '1px solid #ccc';
        dropdown.style.borderRadius = '4px';
        dropdown.style.backgroundColor = '#2e2e2e';
        dropdown.style.color = 'white';
    }

    function styleButton(button, color) {
        button.style.padding = '10px 20px';
        button.style.margin = '5px';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.color = 'white';
        button.style.backgroundColor = color === 'green' ? '#4caf50' : '#f44336';
        button.style.fontSize = '14px';
        button.style.fontWeight = 'bold';
        button.style.transition = 'background-color 0.3s';

        button.onmouseover = () => {
            button.style.backgroundColor = color === 'green' ? '#45a049' : '#e53935';
        };
        button.onmouseout = () => {
            button.style.backgroundColor = color === 'green' ? '#4caf50' : '#f44336';
        };
    }

    async function updateBuildings(modal, sourceLeitstelleId, targetLeitstelleId, authToken) {
        const BUILDINGS_API_URL = "https://www.leitstellenspiel.de/api/buildings";
        const BUILDING_UPDATE_URL = "https://www.leitstellenspiel.de/buildings/";

        try {
            const response = await fetch(BUILDINGS_API_URL);
            const buildings = await response.json();

            const buildingsToUpdate = buildings.filter(
                b => b.leitstelle_building_id === sourceLeitstelleId
            );

            if (!confirm(`${buildingsToUpdate.length} Gebäude werden aktualisiert. Fortfahren?`)) {
                return;
            }

            // Fortschrittsanzeige erstellen
            modal.innerHTML = ''; // Leere Modal
            const progressBarContainer = document.createElement('div');
            progressBarContainer.style.width = '100%';
            progressBarContainer.style.backgroundColor = '#ccc';
            progressBarContainer.style.borderRadius = '5px';
            progressBarContainer.style.overflow = 'hidden';
            progressBarContainer.style.marginBottom = '10px';

            const progressBar = document.createElement('div');
            progressBar.style.height = '20px';
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#4caf50';
            progressBar.style.transition = 'width 0.3s';

            progressBarContainer.appendChild(progressBar);
            modal.appendChild(progressBarContainer);

            const progressText = document.createElement('div');
            progressText.textContent = '0% abgeschlossen';
            modal.appendChild(progressText);

            let completed = 0;
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

                if (!updateResponse.ok) {
                    console.error(`Fehler beim Aktualisieren von Gebäude ${building.id}.`);
                }

                completed++;
                const progress = Math.round((completed / buildingsToUpdate.length) * 100);
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${progress}% abgeschlossen`;

                await new Promise(resolve => setTimeout(resolve, 100));
            }

            alert("Alle Gebäude wurden aktualisiert.");
            document.body.removeChild(modal);
        } catch (error) {
            console.error("Fehler beim Aktualisieren der Gebäude:", error);
        }
    }

    // Trigger-Button erstellen
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Leitstellengebäudewechsler');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        createModal();
    });

    // In die Navigation einfügen
    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);
})();
