// ==UserScript==
// @name         LSS - POI Löscher
// @version      1.1
// @description  Fügt einen Button hinzu, um alle POIs zu löschen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/pois*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const waitForElement = (selector, callback) => {
        const existingElement = document.querySelector(selector);

        if (existingElement) {
            callback(existingElement);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);

            if (element) {
                observer.disconnect();
                callback(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    };

    const getCSRFToken = () => {
        return document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') || '';
    };

    const loadPOIs = async () => {
        const response = await fetch('/mission_positions', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(
                `POIs konnten nicht geladen werden: HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data.mission_positions)) {
            return data.mission_positions;
        }

        throw new Error(
            'Unbekanntes Datenformat beim Laden der POIs.'
        );
    };

    const deletePOI = async (poiId, csrfToken) => {
        const response = await fetch(`/mission_positions/${poiId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-CSRF-Token': csrfToken,
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json, text/javascript, */*; q=0.01'
            },
            credentials: 'same-origin',
            body: '_method=delete'
        });

        if (!response.ok) {
            throw new Error(
                `POI ${poiId} konnte nicht gelöscht werden: HTTP ${response.status}`
            );
        }
    };

    const createDeleteButton = () => {

        if (document.querySelector('#delete_all_pois_button')) {
            return;
        }

        const poiCount = document.querySelector('#poi_count');

        if (!poiCount) {
            return;
        }

        const footer = poiCount.closest('.panel-footer');

        if (!footer) {
            console.error(
                '[POI Löscher] Panel-Footer wurde nicht gefunden.'
            );
            return;
        }

        const buttonContainer =
            footer.querySelector('.btn-group') || footer;

        const btn = document.createElement('button');

        btn.id = 'delete_all_pois_button';
        btn.className = 'btn btn-danger';
        btn.type = 'button';
        btn.textContent = 'Alle löschen';

        btn.addEventListener('click', async () => {
            const originalText = 'Alle löschen';

            try {
                btn.disabled = true;
                btn.textContent = 'Lade POIs...';

                const pois = await loadPOIs();

                if (!pois.length) {
                    alert('Keine POIs vorhanden.');

                    btn.textContent = originalText;
                    btn.disabled = false;
                    return;
                }

                const confirmed = confirm(
                    `Es werden ${pois.length} POIs gelöscht.\n\n` +
                    'Dieser Vorgang kann nicht rückgängig gemacht werden!\n\n' +
                    'Möchtest du wirklich ALLE POIs löschen?'
                );

                if (!confirmed) {
                    btn.textContent = originalText;
                    btn.disabled = false;
                    return;
                }

                const csrfToken = getCSRFToken();

                if (!csrfToken) {
                    throw new Error('CSRF-Token wurde nicht gefunden.');
                }

                for (let i = 0; i < pois.length; i++) {
                    const poi = pois[i];

                    if (!poi?.id) {
                        console.warn(
                            '[POI Löscher] POI ohne ID übersprungen:',
                            poi
                        );
                        continue;
                    }

                    btn.textContent =
                        `Lösche ${i + 1} / ${pois.length}...`;

                    await deletePOI(poi.id, csrfToken);
                    await sleep(100);
                }

                btn.textContent =
                    `Alle gelöscht (${pois.length})`;

                await sleep(500);

                location.reload();

            } catch (error) {
                console.error(
                    '[POI Löscher] Fehler beim Löschen:',
                    error
                );

                alert(
                    'Beim Löschen der POIs ist ein Fehler aufgetreten.\n\n' +
                    error.message +
                    '\n\nWeitere Details findest du in der Browser-Konsole.'
                );

                btn.textContent = originalText;
                btn.disabled = false;
            }
        });

        buttonContainer.prepend(btn);

        console.log(
            '[POI Löscher] "Alle löschen"-Button wurde hinzugefügt.'
        );
    };

    waitForElement('#poi_count', createDeleteButton);

})();
