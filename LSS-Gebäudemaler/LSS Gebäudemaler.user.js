// ==UserScript==
// @name         LSS Gebäudemaler
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Ermöglicht das ändern mehrerer Gebäudegrafiken mit einem Klick
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        GM_getResourceURL
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @resource     icon PLACEHOLDERURL
// ==/UserScript==

(function() {
    'use strict';

    // Mapping building_type -> Caption
    const buildingTypeCaptions = {
        0: "Feuerwache",
        1: "Feuerwehrschule",
        2: "Rettungswache",
        3: "Rettungsschule",
        4: "Krankenhaus",
        5: "Rettungshubschrauber-Station",
        6: "Polizeiwache",
        7: "Leitstelle",
        8: "Polizeischule",
        9: "THW Ortsverband",
        10: "THW Bundesschule",
        11: "Bereitschaftpolizei",
        12: "Schnelleinsatzgruppe",
        13: "Polizeihubschrauberstation",
        14: "Bereitstellungsraum",
        15: "Wasserrettung",
        17: "Polizeisondereinheit",
        21: "Rettungshundestaffel",
        22: "Großer Komplex",
        23: "Kleiner Komplex",
        24: "Reiterstaffel",
        25: "Bergrettungswache",
        26: "Seenotrettungswache",
        27: "Seenotschule",
        28: "Seenothubschrauberstation",
    };

    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    //console.log("[Gebäudemaler] Auth Token:", authToken);

    // Button ins Menü einfügen
    const triggerLi = document.createElement('li');
    const triggerA = document.createElement('a');
    const triggerImg = document.createElement('img');
    triggerImg.src = GM_getResourceURL('icon');
    triggerImg.width = 24;
    triggerImg.height = 24;
    triggerA.href = '#';
    triggerA.append(triggerImg, '\xa0Gebäudemaler');
    triggerLi.append(triggerA);

    triggerLi.addEventListener('click', event => {
        event.preventDefault();
        createModal();
    });

    document
        .querySelector('#menu_profile + .dropdown-menu > li.divider')
        ?.before(triggerLi);

    // Modal erstellen
    async function createModal() {
        //console.log("[Gebäudemaler] Modal wird erstellt...");
        const buildings = await fetchBuildings();
        //console.log("[Gebäudemaler] Gebäude geladen:", buildings);

        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '10%';
        modal.style.left = '50%';
        modal.style.transform = 'translateX(-50%)';
        modal.style.background = getComputedStyle(document.body).backgroundColor;
        modal.style.color = getComputedStyle(document.body).color;
        modal.style.padding = '20px';
        modal.style.border = '1px solid #888';
        modal.style.zIndex = '9999';
        modal.style.width = '400px';
        modal.style.maxHeight = '80%';
        modal.style.overflowY = 'auto';
        modal.style.borderRadius = '8px';
        modal.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';

        // Dropdown
        const select = document.createElement('select');
        styleInput(select);
        const optAll = document.createElement('option');
        optAll.value = '';
        optAll.textContent = 'Alle';
        select.appendChild(optAll);
        Object.entries(buildingTypeCaptions).forEach(([id, caption]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = caption;
            select.appendChild(opt);
        });
        modal.appendChild(select);

        // Suchfeld
        const search = document.createElement('input');
        search.type = 'text';
        search.placeholder = 'Suchen...';
        styleInput(search);
        modal.appendChild(search);

        // Liste
        const list = document.createElement('div');
        modal.appendChild(list);

        function renderList() {
            list.innerHTML = '';
            const filterType = select.value;
            const filterSearch = search.value.toLowerCase();
            const filtered = buildings
                .filter(b => !filterType || b.building_type == filterType)
                .filter(b => b.caption.toLowerCase().includes(filterSearch))
                .sort((a,b) => a.caption.localeCompare(b.caption));

            filtered.forEach(b => {
                const label = document.createElement('label');
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.dataset.id = b.id;
                label.appendChild(cb);
                label.append(' ' + b.caption);
                list.appendChild(label);
                list.appendChild(document.createElement('br'));
            });
        }

        select.addEventListener('change', renderList);
        search.addEventListener('input', renderList);
        renderList();

        // File upload
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        styleInput(fileInput);
        modal.appendChild(fileInput);

        // Progressbar
        const progress = document.createElement('progress');
        progress.value = 0;
        progress.max = 100;
        progress.style.width = '100%';
        modal.appendChild(progress);

        // Button "Grafiken ändern"
        const btn = document.createElement('button');
        btn.textContent = 'Grafiken ändern';
        styleButton(btn);
        btn.addEventListener('click', async () => {
            const checked = Array.from(list.querySelectorAll('input[type="checkbox"]:checked'));
            if (!checked.length || !fileInput.files[0]) {
                alert("Bitte Gebäude auswählen und Datei hochladen!");
                return;
            }
            //console.log(`[Gebäudemaler] ${checked.length} Gebäude werden bearbeitet...`);
            for (let i = 0; i < checked.length; i++) {
                const id = checked[i].dataset.id;
                await uploadImage(id, fileInput.files[0]);
                progress.value = ((i+1) / checked.length) * 100;
                await new Promise(r => setTimeout(r, 100));
            }
            //console.log("[Gebäudemaler] Alle Grafiken geändert. Seite wird neu geladen...");
            location.reload();
        });
        modal.appendChild(btn);

        // Close
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Schließen';
        styleButton(closeBtn);
        closeBtn.addEventListener('click', () => modal.remove());
        modal.appendChild(closeBtn);

        document.body.appendChild(modal);
    }

    async function fetchBuildings() {
        const res = await fetch('/api/buildings');
        return res.json();
    }

    async function uploadImage(buildingId, file) {
        //console.log(`[Gebäudemaler] Sende Bild an Gebäude #${buildingId}`);
        const formData = new FormData();
        formData.append('utf8', '✓');
        formData.append('_method', 'patch');
        formData.append('authenticity_token', authToken);
        formData.append('building[image]', file, file.name);
        formData.append('commit', 'Speichern');

        const res = await fetch(`/buildings/${buildingId}`, {
            method: 'POST',
            body: formData
        });
        //console.log(`[Gebäudemaler] Antwort für Gebäude #${buildingId}:`, res.status);
        return res;
    }

    function styleInput(el) {
        el.style.display = 'block';
        el.style.width = '100%';
        el.style.margin = '5px 0';
        el.style.padding = '5px';
        el.style.background = getComputedStyle(document.body).backgroundColor;
        el.style.color = getComputedStyle(document.body).color;
        el.style.border = '1px solid #888';
        el.style.borderRadius = '4px';
    }

    function styleButton(btn) {
        btn.style.margin = '5px';
        btn.style.padding = '5px 10px';
        btn.style.background = '#337ab7';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
    }

})();
