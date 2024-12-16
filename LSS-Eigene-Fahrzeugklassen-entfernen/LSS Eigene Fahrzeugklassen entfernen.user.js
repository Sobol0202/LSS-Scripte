// ==UserScript==
// @name         LSS Eigene Fahrzeugklassen entfernen
// @namespace    www.leitstellenspiel.de
// @version      1.2
// @description  Fügt Dialog zum Entfernen der eigenen Fahrzeugklassen ein.
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_getResourceURL
// @resource     icon https://raw.githubusercontent.com/Sobol0202/LSS-Eigene-Fahrzeugklassen-entfernen/main/icons8-car-badge-50.png
// ==/UserScript==

(function() {
    'use strict';

    // Opt-in für die zusätzliche Anzeige in der Sicherheitsabfrage
    const optInAdditionalDisplay = false;

    // create a trigger-element
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Eigene Fahrzeugklassen entfernen');
    triggerLi.append(triggerA);

    // insert the trigger-element to the DOM
    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        main();
    });

    function addGlobalStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            dialog.Klassenschrotter-dialog {
                border: solid 1px #ccc;
                border-radius: 5px;
                padding: 20px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
            dialog.Klassenschrotter-dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
            }
            dialog.Klassenschrotter-dialog form {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            dialog.Klassenschrotter-dialog menu {
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }
            dialog.Klassenschrotter-dialog button {
                padding: 5px 10px;
                border: none;
                border-radius: 3px;
                cursor: pointer;
            }
            dialog.Klassenschrotter-dialog button[type="submit"] {
                background-color: #4CAF50;
                color: white;
            }
            dialog.Klassenschrotter-dialog button[type="button"] {
                background-color: #f44336;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }

    async function main() {
        addGlobalStyles();

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

            // Ermitteln aller einzigartigen vehicle_type_caption und alphabetisch sortieren
            const uniqueCaptions = [...new Set(vehicles.map(vehicle => vehicle.vehicle_type_caption).filter(caption => caption))].sort();

            // Dialog erstellen
            const dialog = document.createElement('dialog');
            dialog.classList.add('Klassenschrotter-dialog');
            dialog.innerHTML = `
                <form method="dialog">
                    <label for="vehicleTypeCaptionSelect">Bitte wähle den gewünschten Fahrzeugtyp aus:</label>
                    <select id="vehicleTypeCaptionSelect" name="vehicleTypeCaption">
                        ${uniqueCaptions.map(caption => `<option value="${caption}">${caption}</option>`).join('')}
                    </select>
                    <menu>
                        <button type="submit" value="confirm">Bestätigen</button>
                        <button type="button" id="cancelButton">Abbrechen</button>
                    </menu>
                </form>
            `;
            document.body.appendChild(dialog);

            // Dialog anzeigen und Auswahl abwarten
            dialog.showModal();
            const form = dialog.querySelector('form');
            const cancelButton = dialog.querySelector('#cancelButton');

            cancelButton.addEventListener('click', () => {
                dialog.close('cancel');
            });

            form.addEventListener('submit', event => {
                event.preventDefault();
                dialog.close(form.returnValue);
            });

            const result = await new Promise(resolve => dialog.addEventListener('close', () => resolve(dialog.returnValue)));
            const selectedCaption = dialog.querySelector('#vehicleTypeCaptionSelect').value;

            // Dialog entfernen
            dialog.remove();

            if (result === 'cancel') {
                console.log("Vorgang abgebrochen.");
                return;
            }

            // Filter Fahrzeuge nach vehicle_type_caption
            const filteredVehicles = vehicles.filter(vehicle => vehicle.vehicle_type_caption === selectedCaption);
            const vehicleIds = filteredVehicles.map(vehicle => vehicle.id);

            console.log(`Anzahl der zu bearbeitenden Anfragen: ${vehicleIds.length}`);

            // Sicherheitsabfrage erstellen
            const confirmDialog = document.createElement('dialog');
            confirmDialog.classList.add('Klassenschrotter-dialog');
            confirmDialog.innerHTML = `
                <form method="dialog">
                    <p>Es wurden ${vehicleIds.length} Fahrzeuge des Typs "${selectedCaption}" gefunden. Sollen diese wirklich ihre Standartklasse erhalten?</p>
                    ${optInAdditionalDisplay ? `
                        <ul>
                            ${filteredVehicles.map(vehicle => `
                                <li>${vehicle.caption}
                                    <button class="openInNewTab" data-id="${vehicle.id}" type="button">Öffnen</button>
                                </li>
                            `).join('')}
                        </ul>` : ''}
                    <menu>
                        <button type="submit" value="confirm">Bestätigen</button>
                        <button type="button" id="cancelConfirmButton">Abbrechen</button>
                    </menu>
                </form>
            `;
            document.body.appendChild(confirmDialog);

            // Dialog anzeigen und Auswahl abwarten
            confirmDialog.showModal();
            const confirmForm = confirmDialog.querySelector('form');
            const cancelConfirmButton = confirmDialog.querySelector('#cancelConfirmButton');

            cancelConfirmButton.addEventListener('click', () => {
                confirmDialog.close('cancel');
            });

            confirmForm.addEventListener('submit', event => {
                event.preventDefault();
                confirmDialog.close(confirmForm.returnValue);
            });

            // Öffnen in neuem Tab
            confirmDialog.querySelectorAll('.openInNewTab').forEach(button => {
                button.addEventListener('click', () => {
                    const id = button.getAttribute('data-id');
                    window.open(`https://www.leitstellenspiel.de/vehicles/${id}`, '_blank');
                });
            });

            const confirmResult = await new Promise(resolve => confirmDialog.addEventListener('close', () => resolve(confirmDialog.returnValue)));

            // Dialog entfernen
            confirmDialog.remove();

            if (confirmResult === 'cancel') {
                console.log("Vorgang abgebrochen.");
                return;
            }

            // Fortschrittsdialog erstellen
            const progressDialog = document.createElement('dialog');
            progressDialog.classList.add('Klassenschrotter-dialog');
            progressDialog.innerHTML = `
                <p>Aktualisiere Fahrzeuge... <span id="progressCount">0</span> / ${vehicleIds.length}</p>
            `;
            document.body.appendChild(progressDialog);
            progressDialog.showModal();

            const progressCount = progressDialog.querySelector('#progressCount');

            // Wartefunktion
            const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

            // Anfragen senden
            for (let i = 0; i < vehicleIds.length; i++) {
                const id = vehicleIds[i];
                const formData = new FormData();
                formData.append('utf8', '✓');
                formData.append('_method', 'put');
                formData.append('authenticity_token', authToken);
                formData.append('vehicle[vehicle_type_ignore_default_aao]', 0);
                formData.append('vehicle[vehicle_type_caption]', "");
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

                // Fortschritt aktualisieren
                progressCount.textContent = i + 1;

                // 100ms warten
                await delay(100);
            }

            // Fortschrittsdialog aktualisieren
            progressDialog.innerHTML = `<p>Vorgang abgeschlossen.</p><menu><button id="okButton">OK</button></menu>`;
            const okButton = progressDialog.querySelector('#okButton');

            okButton.addEventListener('click', () => {
                progressDialog.close();
            });

            // Warten, bis der Benutzer den Fortschrittsdialog schließt
            await new Promise(resolve => progressDialog.addEventListener('close', () => resolve()));

            // Fortschrittsdialog entfernen
            progressDialog.remove();

            console.log("Vorgang abgeschlossen.");
        } catch (error) {
            console.error("Fehler beim Abrufen der Fahrzeugdaten:", error);
        }
    }
})();
