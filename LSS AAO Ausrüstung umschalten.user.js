// ==UserScript==
// @name         LSS-AAO Ausrüstung umschalten
// @version      1.0
// @description  Fügt einen Button ein, der die Umschaltung der Ausrüstung für alle AAOs durchführt.
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Button einfügen
    const tutorialVideoButton = document.getElementById('tutorial_video_show');
    if (!tutorialVideoButton) return;

    const newButton = document.createElement('button');
    newButton.className = 'btn btn-xs btn-danger';
    newButton.textContent = 'Ausrüstung umschalten';
    newButton.style.marginRight = '10px';

    const progressContainer = document.createElement('div');
    progressContainer.style.marginLeft = '10px';
    progressContainer.style.padding = '5px';
    progressContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    progressContainer.style.color = 'white';
    progressContainer.style.borderRadius = '5px';
    progressContainer.style.display = 'none';
    progressContainer.style.fontSize = '12px';

    const progressText = document.createElement('span');
    progressText.textContent = 'Fortschritt: 0/0';
    progressContainer.appendChild(progressText);

    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.appendChild(newButton);
    container.appendChild(progressContainer);

    tutorialVideoButton.parentNode.insertBefore(container, tutorialVideoButton);

    newButton.addEventListener('click', async () => {
        const aaoButtons = document.querySelectorAll('.btn-group.aao_btn_group > a');
        const totalAAOs = aaoButtons.length;
        let currentAAO = 0;

        progressContainer.style.display = 'block';

        for (const button of aaoButtons) {
            currentAAO++;
            progressText.textContent = `Fortschritt: ${currentAAO}/${totalAAOs}`;

            const href = button.getAttribute('href');
            if (!href) continue;

            const url = new URL(href, window.location.origin);

            try {
                const response = await fetch(url.href);
                const html = await response.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const aaoEquipmentMode = doc.getElementById('aao_equipment_mode');
                const saveButton = doc.getElementById('save-button');

                if (aaoEquipmentMode && saveButton) {
                    if (!aaoEquipmentMode.checked) {
                        aaoEquipmentMode.checked = true;

                        // Simuliere Events für Änderungen
                        const eventChange = new Event('change', { bubbles: true });
                        aaoEquipmentMode.dispatchEvent(eventChange);
                    }

                    // Speichern simulieren
                    const form = saveButton.closest('form');
                    if (form) {
                        const formData = new FormData(form);
                        await fetch(form.action, {
                            method: form.method,
                            body: formData,
                        });
                    }
                }
            } catch (e) {
                console.error('Fehler beim Verarbeiten der AAO:', e);
            }

            await new Promise(r => setTimeout(r, 200)); // Warte 200ms zwischen den Anfragen
        }

        progressText.textContent = 'Umschaltung abgeschlossen!';
        setTimeout(() => {
            progressContainer.style.display = 'none';
        }, 2000);
    });
})();
