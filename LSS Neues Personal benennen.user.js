// ==UserScript==
// @name         LSS Neues Personal benennen
// @namespace    www.leitstellenspiel.de
// @version      1.0
// @description  Automatisch Vor- und Nachnamen für Mitarbeiter zuweisen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/buildings/*/personals
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const assignNames = async () => {
        // Extrahiere alle Zeilen aus der Tabelle
        const rows = document.querySelectorAll('#personal_table tbody tr');

        try {
            // Lade die Vornamen und Nachnamen
            const femaleNames = await loadNames('https://raw.githubusercontent.com/ndsvw/JSON-Namen/master/vornamen_w.json');
            const maleNames = await loadNames('https://raw.githubusercontent.com/ndsvw/JSON-Namen/master/vornamen_m.json');
            const lastNames = await loadNames('https://raw.githubusercontent.com/ndsvw/JSON-Namen/master/nachnamen.json');

            // Iteriere über jede Zeile
            for (const row of rows) {
                // Extrahiere den Link zum Bearbeiten des Mitarbeiters
                const editLink = row.querySelector('.btn-group a[href^="/personals/"]');
                if (editLink) {
                    const editUrl = editLink.getAttribute('href');
                    const response = await fetch(editUrl);
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extrahiere den Input für den Namen des Mitarbeiters
                    const nameInput = doc.querySelector('#personal_name');
                    if (nameInput) {
                        const currentName = nameInput.value;
                        if (currentName.includes('.')) {
                            // Wähle zufällig einen Vornamen
                            const allNames = femaleNames.concat(maleNames);
                            const newName = allNames[Math.floor(Math.random() * allNames.length)];

                            // Wähle zufällig einen Nachnamen
                            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

                            // Aktualisiere den Namen im Input
                            nameInput.value = `${newName} ${lastName}`;

                            // Extrahiere den CSRF-Token
                            const csrfToken = doc.querySelector('meta[name=csrf-token]').getAttribute('content');

                            // Extrahiere die ID des gebundenen Fahrzeugs (falls vorhanden)
                            let bindingVehicleId = '';
                            const bindingVehicleSelect = doc.querySelector('#personal_binding_vehicle_id');
                            if (bindingVehicleSelect) {
                                bindingVehicleId = bindingVehicleSelect.value;
                            }

                            // Simuliere das Absenden des Formulars, um den Namen zu speichern
                            const formData = new FormData();
                            formData.append('utf8', '✓');
                            formData.append('_method', 'put');
                            formData.append('authenticity_token', csrfToken);
                            formData.append('personal[name]', `${newName} ${lastName}`);
                            formData.append('personal[binding_vehicle_id]', bindingVehicleId);
                            formData.append('commit', 'Speichern');

                            // Extrahiere die Personal-ID aus der Edit-URL
                            const personalId = editUrl.match(/\/personals\/(\d+)\/edit/)[1];

                            // Konstruiere den richtigen Endpunkt für die POST-Anfrage
                            const postUrl = `/personals/${personalId}`;

                            // Sende die Anfrage mit einer Wartezeit von 100ms
                            await sendRequestWithDelay(postUrl, formData, 100);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Fehler beim Laden der Namen:', error);
        }

        // Seite neu laden, nachdem alle Namen geändert wurden
        location.reload();
    };

    const loadNames = async (url) => {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    };

    const sendRequestWithDelay = async (url, formData, delay) => {
        return new Promise(resolve => {
            setTimeout(async () => {
                await fetch(url, {
                    method: 'POST',
                    body: formData
                });
                resolve();
            }, delay);
        });
    };

    // Füge den Button zur automatischen Zuweisung von Namen hinzu
    const addButton = () => {
        const button = document.createElement('button');
        button.textContent = 'Neues Personal benennen';
        button.classList.add('btn', 'btn-default');
        button.addEventListener('click', async () => {
            // Ändere den Button-Stil und die Beschriftung
            button.classList.remove('btn-default');
            button.classList.add('btn-danger');
            button.textContent = 'Personal wird benannt...';

            await assignNames();
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.marginTop = '10px';
        buttonContainer.appendChild(button);

        const table = document.getElementById('personal_table');
        table.parentNode.insertBefore(buttonContainer, table.nextSibling);
    };

    // Füge den Button hinzu, wenn die Tabelle vorhanden ist
    const table = document.getElementById('personal_table');
    if (table) {
        addButton();
    }
})();
