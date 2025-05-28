// ==UserScript==
// @name         LSS POI Löscher
// @version      1.0
// @description  Fügt einen Button hinzu, um alle POIs zu löschen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const waitForElement = (selector, callback) => {
        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                callback(element);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    };

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    // CSRF-Token auslesen
    const getCSRFToken = () =>
        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    // Funktion zum Erstellen des "Alle POIs löschen"-Buttons
    const createDeleteButton = () => {
        const form = document.querySelector('#new_mission_position');
        if (!form) return;

        const actionsDiv = form.querySelector('.form-actions');
        if (!actionsDiv) return;

        // Falls der Button bereits existiert, abbrechen
        if (document.querySelector('#delete_all_pois_button')) return;

        // Neuen Button erstellen
        const btn = document.createElement('button');
        btn.id = 'delete_all_pois_button';
        btn.className = 'btn btn-danger';
        btn.type = 'button';
        btn.textContent = 'Alle POIs löschen';

        // Klick-Event hinzufügen
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            btn.textContent = 'Lade POIs...';

            try {
                // API-Abfrage, um alle POIs als JSON zu laden
                const res = await fetch('https://www.leitstellenspiel.de/mission_positions', {
                    headers: { 'Accept': 'application/json' },
                    credentials: 'same-origin'
                });
                const data = await res.json();
                const pois = data.mission_positions;

                // Falls keine POIs vorhanden sind
                if (!pois.length) {
                    alert('Keine POIs vorhanden.');
                    btn.textContent = 'Alle POIs löschen';
                    btn.disabled = false;
                    return;
                }

                // Sicherheitsabfrage vor dem Löschen
                const confirmDelete = confirm(`Es werden ${pois.length} POI gelöscht. Dieser Vorgang kann nicht rückgängig gemacht werden!`);
                if (!confirmDelete) {
                    btn.textContent = 'Alle POIs löschen';
                    btn.disabled = false;
                    return;
                }

                const token = getCSRFToken();

                // Alle POIs einzeln löschen
                for (let i = 0; i < pois.length; i++) {
                    const poi = pois[i];
                    btn.textContent = `Lösche ${i + 1} / ${pois.length}...`;

                    await fetch(`https://www.leitstellenspiel.de/mission_positions/${poi.id}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'X-CSRF-Token': token,
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin',
                        body: '_method=delete'
                    });

                    await sleep(100);
                }

                btn.textContent = `Alle POIs gelöscht (${pois.length})`;

                // Seite neu laden
                await sleep(500);
                location.reload();

            } catch (e) {
                // Fehlerbehandlung
                console.error('Fehler beim Löschen der POIs:', e);
                alert('Ein Fehler ist aufgetreten. Details siehe Konsole.'); // Keks? Keks!
                btn.textContent = 'Alle POIs löschen';
                btn.disabled = false;
            }
        });

        // Button ins Formular einfügen
        actionsDiv.appendChild(btn);
    };

    // Warte auf das POI-Formular und füge dann den Button hinzu
    waitForElement('#new_mission_position', createDeleteButton);
})();
