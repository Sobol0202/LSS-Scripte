// ==UserScript==
// @name         LSS Stuhlhändler
// @version      1.1
// @description  Passt die Anzahl der Sitzplätze in den Fahrzeugen an
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_getResourceURL
// @resource     icon https://github.com/Sobol0202/LSS-Scripte/raw/main/LSS-Stuhlh%C3%A4ndler/icons8-car-seat-64.png
// ==/UserScript==

(function() {
    'use strict';

    // CSS
    const style = document.createElement('style');
    style.textContent = `
      .custom-modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 9999;
        background-color: #fff;
        color: #000;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.25);
        width: 420px;
        max-width: 90%;
        font-family: "Segoe UI", sans-serif;
        box-sizing: border-box;
      }

      .custom-modal h3 {
        margin-top: 0;
        font-size: 1.3em;
        margin-bottom: 16px;
      }

      .custom-modal select,
      .custom-modal button {
        width: 100%;
        padding: 10px;
        margin: 8px 0;
        border-radius: 6px;
        font-size: 1em;
        box-sizing: border-box;
      }

      .custom-modal progress {
        width: 100%;
        margin-top: 10px;
      }

      @media (prefers-color-scheme: dark) {
        .custom-modal {
          background-color: #1e1e1e;
          color: #fff;
          border: 1px solid #333;
        }

        .custom-modal select {
          background-color: #2a2a2a;
          color: #fff;
          border: 1px solid #444;
        }
      }
    `;
    document.head.append(style);

    // === Trigger-Element erstellen ===
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Sitzplatzhändler');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        createModal();
    });

    document.querySelector('#menu_profile + .dropdown-menu > li.divider')?.before(triggerLi);

    async function createModal() {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';

        const title = document.createElement('h3');
        title.textContent = 'Wähle Typ & Sitzanzahl';

        const typeSelect = document.createElement('select');
        const defaultOption = document.createElement('option');
        defaultOption.textContent = 'Fahrzeugtyp auswählen';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        typeSelect.appendChild(defaultOption);

        const seatSelect = document.createElement('select');
        seatSelect.disabled = true;

        const progressBar = document.createElement('progress');
        progressBar.value = 0;
        progressBar.max = 100;

        const vehicleTypes = await fetch('https://api.lss-manager.de/de_DE/vehicles').then(r => r.json());

        const types = Object.entries(vehicleTypes);

        // Sortieren nach dem caption (Fahrzeugname)
        types.sort((a, b) => a[1].caption.localeCompare(b[1].caption, 'de', { sensitivity: 'base' }));

        types.forEach(([id, data]) => {
            if (data.minPersonnel < data.maxPersonnel) {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = data.caption;
                typeSelect.appendChild(option);
            }
        });

        typeSelect.addEventListener('change', () => {
            const selected = vehicleTypes[typeSelect.value];
            seatSelect.innerHTML = '';
            for (let i = selected.minPersonnel; i <= selected.maxPersonnel; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = i + ' Sitzplatz' + (i > 1 ? 'e' : '');
                seatSelect.appendChild(opt);
            }
            seatSelect.disabled = false;
            submitButton.disabled = false;
        });

        const buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'space-between';
        buttonContainer.style.gap = '10px';
        buttonContainer.style.marginTop = '12px';

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Abbrechen';
        cancelButton.className = 'btn btn-danger';
        cancelButton.addEventListener('click', () => modal.remove());

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Anpassen starten';
        submitButton.className = 'btn btn-success';
        submitButton.disabled = true;

        submitButton.addEventListener('click', async () => {
            const selectedType = parseInt(typeSelect.value);
            const selectedSeats = parseInt(seatSelect.value);

            modal.querySelectorAll('button').forEach(btn => btn.disabled = true);

            const res = await fetch('/api/vehicles');
            const allVehicles = await res.json();

            const matching = allVehicles.filter(v =>
                                                v.vehicle_type === selectedType &&
                                                v.max_personnel_override !== selectedSeats
                                               );

            const confirm = window.confirm(`${matching.length} Fahrzeuge mit anderer Sitzanzahl gefunden. Fortfahren?`);
            if (!confirm) {
                modal.remove();
                return;
            }

            for (let i = 0; i < matching.length; i++) {
                await updateVehicle(matching[i].id, selectedSeats);
                progressBar.value = ((i + 1) / matching.length) * 100;
            }

            alert('Alle Fahrzeuge angepasst.');
            modal.remove();
        });

        buttonContainer.append(cancelButton, submitButton);
        modal.append(title, typeSelect, seatSelect, buttonContainer, progressBar);
        document.body.appendChild(modal);
    }

    async function updateVehicle(vehicleId, newSeats) {
        return new Promise((resolve) => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = `/vehicles/${vehicleId}/edit`;

            iframe.onload = () => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow.document;
                    const select = doc.querySelector('#vehicle_personal_max');
                    const form = doc.querySelector('form[action*="/vehicles/"]');

                    if (select && form) {
                        select.value = String(newSeats);
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                        form.submit();
                    }
                } catch (err) {
                    console.error('Fehler bei Fahrzeug ' + vehicleId, err);
                }

                setTimeout(() => {
                    iframe.remove();
                    resolve();
                }, 200);
            };

            document.body.appendChild(iframe);
        });
    }
})();
