// ==UserScript==
// @name         LSS Globale Steuerung für Einsatzbereiche
// @version      1.0
// @description  Ändert Global die Einsatzbereichseinstellung in allen Leitstellen
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    // Funktionen für API-Anfragen und Einstellungsänderungen
    const setBuildingPreferences = async () => {
        const leitstellen = await returnLeitstellen();
        const activated = localStorage.getItem('activated') === 'true';
        for (const [index, leitstelle] of leitstellen.entries()) {
            if (activated) {
                await sendBuildingRequest(leitstelle.id, true);
            } else {
                await sendBuildingRequest(leitstelle.id, false);
            }
            // Füge eine Wartezeit von 100ms ein, außer für den letzten Request
            if (index < leitstellen.length - 1) {
                await delay(100);
            }
        }
    };

    const sendBuildingRequest = async (buildingId, activate) => {
        const formData = new FormData();
        formData.append('utf8', '✓');
        formData.append('_method', 'put');
        formData.append('authenticity_token', $("meta[name=csrf-token]").attr("content"));
        formData.append('building[generate_own_missions]', activate ? '1' : '0');
        formData.append('commit', 'Speichern');

        const response = await fetch(`/buildings/${buildingId}`, {
            method: 'POST',
            body: formData
        });
    };

    const returnLeitstellen = async () => {
        const buildingsData = await $.getJSON('/api/buildings');
        return buildingsData.filter(building => building.building_type === 7);
    };

    // Funktion zum Erstellen des Buttons
    const createModal = async () => {
        const activated = localStorage.getItem('activated') === 'true';
        await setBuildingPreferences();
        if (activated) {
            localStorage.setItem('activated', 'false');
        } else {
            localStorage.setItem('activated', 'true');
        }
        alert(activated ? "Einsatzbereiche wurden erfolgreich aktiviert!" : "Einsatzbereiche wurden erfolgreich deaktiviert!");
        updateTriggerText(!activated);
    };
    
    //Bärenkatapult
    const updateTriggerText = (activated) => {
        const triggerA = document.getElementById('buildingSettingsTrigger');
        triggerA.textContent = activated ? 'Einsatzbereiche einschalten' : 'Einsatzbereiche abschalten';
    };

    const delay = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };

    // create a trigger-element
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    triggerA.id = 'buildingSettingsTrigger';
    triggerA.href = '#';
    triggerA.textContent = localStorage.getItem('activated') === 'true' ? 'Einsatzbereiche einschalten' : 'Einsatzbereiche abschalten';
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        createModal();
    });

    // insert the trigger-element to the DOM
    /** @type {HTMLLIElement | undefined} */
    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);

})();
