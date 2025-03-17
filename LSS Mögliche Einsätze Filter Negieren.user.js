// ==UserScript==
// @name         LSS Mögliche Einsätze Filter Negieren
// @version      1.0
// @description  Erlaubt das Negieren von Filtern auf der Einsatzseite mit Shift-Klick
// @author       Sobol
// @match        https://www.leitstellenspiel.de/einsaetze
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Mapping von Anzeige-Text zu data-filterable-by-requirement
    const filterMapping = {
        "Bahnrettungs-Erweiterungen": "railway_fire_count",
        "BePo: Gefangenenkraftwagen-Erweiterungen": "detention_unit_count",
        "BePo: Lautsprecherkraftwagen-Erweiterungen": "police_speaker_count",
        "BePo: Wasserwerfer-Erweiterungen": "water_cannon_count",
        "BePo: Züge der 1. Hundertschaft": "bereitschaftspolizei_count",
        "Bereitschaftspolizei-Wachen": "bereitschaftspolizei_count",
        "Bergrettungswachen": "mountain_rescue_count",
        "Betreuungs- und Verpflegungsdienst-Erweiterungen": "care_service_count",
        "Dienstgruppenleitung-Erweiterungen": "police_service_group_leader_count",
        "Diensthundestaffeln": "guard_dog_count",
        "Drohnen-Erweiterungen (FW, THW, SEG)": "drone_count",
        "Feuerwachen": "feuerwache_count",
        "Hubschrauberstationen (Seenotrettung)": "water_rescue_heliport_count",
        "Höhenrettung-Erweiterungen": "mountain_height_rescue_count",
        "Kriminalpolizei-Erweiterungen": "criminal_investigation_count",
        "Lüfter-Erweiterungen": "ventilation_count",
        "MEK-Wachen": "mek_count",
        "NEA200-Erweiterungen": "energy_supply_2_count",
        "NEA50-Erweiterungen": ":energy_supply_count",
        "Polizei-Motorradstaffeln": "police_motorcycle_count",
        "Polizeihubschrauberstation": "polizeihubschrauber_count",
        "Polizeiwachen": "police_count",
        "Reiterstaffeln": "police_horse_count",
        "Rettungshundestaffeln": "rescue_dog_count",
        "Rettungswachen": "rettungswache_count",
        "SEG-Wachen": "seg_count",
        "SEK-Wachen": "sek_count",
        "Seenotrettungswachen": "coastal_rescue_count",
        "THW-Wachen": "thw_count",
        "THW-Zugtrupps": "thw_zugtrupp_count",
        "THW: 2. Technische Züge": "thw_gkw_count",
        "THW: Fachgruppen N": "energy_supply_count",
        "THW: Fachgruppen Räumen": "thw_fg_raeumen_count",
        "THW: Fachgruppen SB": "heavy_rescue_count",
        "THW: Fachgruppen Wasserschaden/Pumpen": "water_damage_pump_count",
        "THW: Fachzüge Führung und Kommunikation": "thw_command_count",
        "Verpflegungsdienst-Erweiterungen": "fire_care_service_count",
        "Wasserrettungs-Wachen": "wasserrettung_count",
        "Werkfeuerwehren": "werkfeuerwehr_count",
        "Windenrettungs-Erweiterungen": "lift_count",
    };

    let negatedFilters = new Set();

    document.addEventListener('click', function(event) {
        if (event.target.closest('li') && event.shiftKey) {
            event.preventDefault();
            event.stopPropagation();

            let liElement = event.target.closest('li');
            let filterText = liElement.querySelector('span.text');
            let filterKey = filterMapping[filterText?.innerText.trim()];

            if (!filterKey) {
                console.log("Kein Mapping für diesen Filter gefunden.");
                return;
            }

            if (negatedFilters.has(filterKey)) {
                negatedFilters.delete(filterKey);
                filterText.style.textDecoration = "none";
                console.log("Negierung aufgehoben für: ", filterText.innerText);
            } else {
                negatedFilters.add(filterKey);
                filterText.style.textDecoration = "line-through";
                console.log("Filter negiert: ", filterText.innerText);
            }

            let rows = document.querySelectorAll('#possible_missions_table tr');
            rows.forEach(row => {
                let requirement = row.getAttribute('data-filterable-by-requirement');
                if (requirement) {
                    let isNegated = [...negatedFilters].some(filter => requirement.includes(filter));
                    row.style.display = isNegated ? 'none' : '';
                }
            });
        }
    }, true);
})();
