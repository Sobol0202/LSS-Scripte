// ==UserScript==
// @name         LSS Fahrzeugeinsatzbeteiligung auf Karte
// @version      1.0
// @description  Zeigt Linien von Einsatz zu Wachen an, abhängig von der Anzahl der Fahrzeuge dieser Wache am Einsatzort
// @author       Sobol
// @match        https://www.leitstellenspiel.de/
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    function init() {
        if (!unsafeWindow.mission_markers || unsafeWindow.mission_markers.length === 0) {
            return setTimeout(init, 1000);
        }
        //console.log('[Einsatzlinien] mission_markers geladen');
        unsafeWindow.mission_markers.forEach(marker => attachHover(marker));
    }

    const drawnItems = [];

    function clearItems() {
        drawnItems.forEach(item => item.remove());
        drawnItems.length = 0;
    }

    function getLatLngFromIcon(icon) {
        let pos = null;
        unsafeWindow.map.eachLayer(l => {
            if (l._icon === icon && l.getLatLng) {
                pos = l.getLatLng();
            }
        });
        return pos;
    }

    function countToColor(count, max) {
        const percent = Math.min(1, count / max);
        // 0=grün, 0.5=gelb, 1=rot
        const r = percent < 0.5 ? Math.floor(510 * percent) : 255;
        const g = percent < 0.5 ? 255 : Math.floor(510 * (1 - percent));
        return `rgb(${r},${g},0)`;
    }

    function attachHover(marker) {
        const elm = marker._icon;
        if (!elm) return;

        elm.addEventListener('mouseenter', async (event) => {
            if (!event.shiftKey) return;

            clearItems();

            const missionId = marker.mission_id;
            //console.log('[Einsatzlinien] Mission-ID:', missionId);

            const url = `https://www.leitstellenspiel.de/missions/${missionId}`;
            const html = await fetch(url).then(r => r.text());
            const div = document.createElement('div');
            div.innerHTML = html;

            const wacheCounter = {};
            ['mission_vehicle_driving', 'mission_vehicle_at_mission'].forEach(tableId => {
                const table = div.querySelector(`#${tableId}`);
                if (!table) return;
                table.querySelectorAll('tr').forEach(tr => {
                    const wache = tr.querySelectorAll('td')[2]?.innerText?.trim();
                    if (!wache) return;
                    wacheCounter[wache] = (wacheCounter[wache] || 0) + 1;
                });
            });

            const missionLatLng = marker.getLatLng();
            const maxCount = Math.max(...Object.values(wacheCounter));

            document.querySelectorAll('.leaflet-marker-icon[title]').forEach(icon => {
                const wacheName = icon.getAttribute('title');
                const count = wacheCounter[wacheName];
                if (!count) return;

                const wachPos = getLatLngFromIcon(icon);
                if (!wachPos) return;

                const poly = L.polyline([missionLatLng, wachPos], {
                    weight: Math.min(15, 2 + count),
                    opacity: 0.8,
                    color: countToColor(count, maxCount)
                }).addTo(unsafeWindow.map);
                drawnItems.push(poly);

                // Label (mittig auf der Linie)
                const midLat = (missionLatLng.lat + wachPos.lat) / 2;
                const midLng = (missionLatLng.lng + wachPos.lng) / 2;
                const label = L.marker([midLat, midLng], {
                    icon: L.divIcon({
                        className: 'line-count-label',
                        html: `<div style="background: white; border:1px solid #333; padding:2px 4px; border-radius:4px; font-size:10px">${count}</div>`
                    }),
                    interactive: false
                }).addTo(unsafeWindow.map);
                drawnItems.push(label);
            });
        });

        elm.addEventListener('mouseleave', clearItems);
    }

    init();
})();
