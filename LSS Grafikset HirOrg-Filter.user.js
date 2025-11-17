// ==UserScript==
// @name         LSS Grafikset HirOrg-Filter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Fügt HirOrg-Filter auf der Grafiksetbearbeitungsseite hinzu
// @author       Sobol
// @match        https://www.leitstellenspiel.de/vehicle_graphics/*/edit
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const $ = window.jQuery;

    // Kategorien & Button-Daten
    const categories = {
        fw:  { name: "Feuerwehr", active: true },
        rd:  { name: "Rettungsdienst",active: true },
        thw: { name: "THW", active: true },
        pol: { name: "Polizei", active: true }
    };

    // Buttons erzeugen
    function createButtons() {
        const form = $('form[id^="edit_vehicle_graphic_"]');
        if (!form.length) return;

        const saveButton = form.find("input.btn-success").last();

        const container = $('<div style="margin-top:10px;"></div>');

        Object.keys(categories).forEach(cat => {
            const btn = $('<button class="btn btn-success" style="margin-right:5px;"></button>')
                .text(categories[cat].name)
                .attr("data-cat", cat);

            // Klick = toggeln
            btn.on("click", function(e) {
                e.preventDefault();
                toggleCategory(cat);
            });

            // Doppelklick = Solo
            btn.on("dblclick", function(e) {
                e.preventDefault();
                soloCategory(cat);
            });

            container.append(btn);
        });

        saveButton.after(container);
    }

    // Kategorie toggeln
    function toggleCategory(cat) {
        categories[cat].active = !categories[cat].active;
        updateButtons();
        filterRows();
    }

    // Solo-Modus
    function soloCategory(cat) {
        Object.keys(categories).forEach(c => {
            categories[c].active = (c === cat);
        });
        updateButtons();
        filterRows();
    }

    // Buttons optisch aktualisieren
    function updateButtons() {
        Object.keys(categories).forEach(cat => {
            const btn = $('button[data-cat="' + cat + '"]');
            if (categories[cat].active) {
                btn.removeClass("btn-danger").addClass("btn-success");
            } else {
                btn.removeClass("btn-success").addClass("btn-danger");
            }
        });
    }

    // Tabelle filtern
    function filterRows() {
        $("table.table.table-striped tbody tr").each(function() {
            const row = $(this);
            const href = row.find('a[href*="vehicle_graphic_images"]').attr("href");
            if (!href) return;

            const type = href.split("/").slice(-2, -1)[0];
            const category = getCategoryFromType(type);

            if (!categories[category]?.active) {
                row.hide();
            } else {
                row.show();
            }
        });
    }

    // Fahrzeugtypkategoriemapping
    function getCategoryFromType(typeId) {
        typeId = parseInt(typeId);

        if ([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,30,33,34,35,37,46,47,48,49,53,54,57,62,63,64,75,76,77,78,84,85,86,87,88,89,90,104,105,106,107,108,111,113,114,115,116,117,118,119,120,121,128,129,138,139,140,141,143,162,163,164,166,167,168,169,170,].includes(typeId)) return "fw"; // Feuerwehr
        if ([28,29,31,38,55,56,58,59,60,73,74,91,92,93,97,127,142,149,150,151,152,153,154,155,157,158,159,160,161,171,172,173,174,175].includes(typeId)) return "rd"; // Rettungsdienst
        if ([39,40,41,42,43,44,45,65,66,67,68,69,70,71,100,101,102,109,110,112,122,123,124,125,126,130,131,132,133,145,146,147,148].includes(typeId)) return "thw"; // THW
        if ([32,36,50,51,52,61,72,79,80,81,82,83,94,95,96,98,103,134,135,136,137,156,165,].includes(typeId)) return "pol"; // Polizei

        return "fw"; // Default
    }

    $(document).ready(function() {
        createButtons();
        filterRows();
    });

})();
