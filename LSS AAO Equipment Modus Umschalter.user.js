// ==UserScript==
// @name         LSS AAO Equipment Modus Umschalter
// @namespace    www.leitstellenspiel.de
// @version      1.1
// @description  Schaltet den Equipment-Modus der AAO zwischen Ein und Aus
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/aaos
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    // Extrahiere den CSRF-Token aus dem Meta-Tag
    const authToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

    // Funktion zum Umschalten des Equipment-Modus
    const toggleEquipmentMode = async (equipmentMode) => {
        // Lade die AAO-Einträge
        const aaoEntries = await loadAAOEntries();

        // Für jeden Eintrag
        for (const entry of aaoEntries) {
            // Erstelle ein FormData-Objekt mit den benötigten Daten
            const formData = new FormData();
            formData.append('utf8', '✓');
            formData.append('_method', 'put');
            formData.append('authenticity_token', authToken);
            formData.append('aao[equipment_mode]', equipmentMode);
            formData.append('commit', 'Speichern');

            // Extrahiere die ID aus der URL
            const id = entry.id;
            const postUrl = `https://www.leitstellenspiel.de/aaos/${id}`;

            // Sende die Anfrage mit einer Verzögerung von 100ms
            await sendRequestWithDelay(postUrl, formData, 100);
        }

        // Aktualisiere die Seite nach dem Umschalten aller Einträge
        location.reload();
    };

    // Funktion zum Laden der AAO-Einträge über die API
    const loadAAOEntries = async () => {
        const response = await fetch('https://www.leitstellenspiel.de/api/v1/aaos');
        const data = await response.json();
        return data;
    };

    // Funktion zum Senden einer Anfrage mit Verzögerung
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

    // Funktion zum Hinzufügen der Buttons vor dem Element mit der ID "tutorial_video_show"
    const addButton = () => {
        // Wähle das Element mit der ID "tutorial_video_show"
        const tutorialVideoShow = document.getElementById('tutorial_video_show');

        // Erstelle den Button zum Ausschalten der automatischen Equipmentzuweisung
        const buttonOff = document.createElement('button');
        buttonOff.textContent = 'Automatische Equipmentzuweisung abschalten';
        buttonOff.classList.add('btn','btn-xs', 'btn-danger');
        buttonOff.style.marginRight = '10px';
        buttonOff.addEventListener('click', async () => {
            await toggleEquipmentMode(0); // Setze den Wert auf 0 (Aus)
        });

        // Erstelle den Button zum Einschalten der automatischen Equipmentzuweisung
        const buttonOn = document.createElement('button');
        buttonOn.textContent = 'Automatische Equipmentzuweisung anschalten';
        buttonOn.classList.add('btn','btn-xs', 'btn-success');
        buttonOn.addEventListener('click', async () => {
            await toggleEquipmentMode(1); // Setze den Wert auf 1 (Ein)
        });

        // Füge die Buttons vor dem Element mit der ID "tutorial_video_show" ein
        tutorialVideoShow.parentElement.insertBefore(buttonOn, tutorialVideoShow);
        tutorialVideoShow.parentElement.insertBefore(buttonOff, tutorialVideoShow);
    };

    // Füge die Buttons hinzu, sobald das Skript ausgeführt wird
    addButton();
})();
