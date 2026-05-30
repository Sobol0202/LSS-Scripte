// ==UserScript==
// @name         LSS Leitstellenansicht zu Excel
// @namespace    https://www.leitstellenspiel.de/
// @version      1.0
// @author       Sobol
// @description  Exportiert sichtbare Wachen gruppiert nach Leitstelle und Kategorie als xlsx
// @match        https://www.leitstellenspiel.de/leitstellenansicht*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    async function loadJsPDF() {
        if (window.jspdf?.jsPDF) return;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function isVisible(el) {
        return !!(
            el.offsetWidth ||
            el.offsetHeight ||
            el.getClientRects().length
        );
    }

    function getDispatchCenters() {
        const centers = {};

        document.querySelectorAll('a.leitstelle_selection[leitstelle]').forEach(a => {
            centers[a.getAttribute('leitstelle')] = a.textContent.trim();
        });

        return centers;
    }

    function getBuildingCategories() {
        const categories = {};

        document.querySelectorAll('a.building_selection[building_type_ids]').forEach(a => {
            const categoryName = a.textContent.trim();
            const rawIds = a.getAttribute('building_type_ids');

            try {
                const ids = JSON.parse(rawIds);
                ids.forEach(id => {
                    categories[String(id)] = categoryName;
                });
            } catch (e) {
                console.warn('Kategorie konnte nicht gelesen werden:', rawIds);
            }
        });

        return categories;
    }

    function getVisibleBuildingsGrouped() {
        const dispatchCenters = getDispatchCenters();
        const categories = getBuildingCategories();

        const grouped = {};

        document.querySelectorAll('div[data-building-id][building_type_id][leitstelle_building_id]').forEach(building => {
            if (!isVisible(building)) return;

            const dispatchId = building.getAttribute('leitstelle_building_id');
            const typeId = building.getAttribute('building_type_id');

            const dispatchName = dispatchCenters[dispatchId] || 'Unbekannte Leitstelle';
            const categoryName = categories[typeId] || 'Sonstige';

            const buildingLink = building.querySelector('.content > a.lightbox-open.list-group-item');

            const buildingName =
                buildingLink?.textContent.trim() ||
                building.getAttribute('search_attribute') ||
                'Unbekannte Wache';

            if (!grouped[dispatchName]) {
                grouped[dispatchName] = {};
            }

            if (!grouped[dispatchName][categoryName]) {
                grouped[dispatchName][categoryName] = [];
            }

            grouped[dispatchName][categoryName].push(buildingName);
        });

        Object.values(grouped).forEach(categories => {
            Object.values(categories).forEach(buildings => {
                buildings.sort((a, b) => a.localeCompare(b, 'de'));
            });
        });

        return grouped;
    }

    async function exportExcel() {
        try {
            if (!window.XLSX) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            if (!window.XLSX) {
                alert('XLSX konnte nicht geladen werden.');
                return;
            }

            const grouped = getVisibleBuildingsGrouped();

            if (!Object.keys(grouped).length) {
                alert('Keine sichtbaren Wachen gefunden.');
                return;
            }

            const rows = [];

            rows.push(['Übersicht Wachen']);
            rows.push([]);

            Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'de')).forEach(dispatchName => {
                rows.push(['Leitstelle:', dispatchName]);
                rows.push([]);

                const categories = grouped[dispatchName];

                Object.keys(categories).sort((a, b) => a.localeCompare(b, 'de')).forEach(categoryName => {
                    rows.push(['Kategorie:', categoryName]);
                    rows.push([]);

                    categories[categoryName].forEach(buildingName => {
                        rows.push([buildingName]);
                    });

                    rows.push([]);
                });

                rows.push([]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(rows);

            worksheet['!cols'] = [
                { wch: 35 },
                { wch: 35 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Wachen');

            XLSX.writeFile(workbook, 'leitstellenspiel-wachen-uebersicht.xlsx');

        } catch (e) {
            console.error(e);
            alert('Fehler beim Erstellen der Excel-Datei. Details siehe Konsole.');
        }
    }
    function addButton() {
        const navbar = document.querySelector('nav.navbar.navbar-default.navbar-fixed-bottom');

        if (!navbar) {
            setTimeout(addButton, 1000);
            return;
        }

        if (document.getElementById('lss_pdf_export_button')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'pull-left';
        wrapper.style.marginTop = '7px';
        wrapper.style.marginLeft = '5px';

        const button = document.createElement('button');
        button.id = 'lss_pdf_export_button';
        button.className = 'btn btn-primary';
        button.textContent = 'Wachen-Übersicht Excel';
        button.addEventListener('click', exportExcel);
        wrapper.appendChild(button);
        navbar.appendChild(wrapper);
    }

    addButton();

})();
