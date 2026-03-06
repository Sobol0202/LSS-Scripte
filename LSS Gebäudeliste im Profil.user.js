// ==UserScript==
// @name         LSS Gebäudeliste im Profil
// @version      1.1
// @description  Zeige eine Liste der Gebäude des Spielers als Tab mit interaktiven Diagrammen
// @author       Sobol
// @match        https://www.leitstellenspiel.de/profile/*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    const BUILDING_TYPE_CAPTIONS = {
        0: 'Feuerwache',
        1: 'Feuerwehrschule',
        2: 'Rettungswache',
        3: 'Rettungsschule',
        4: 'Krankenhaus',
        5: 'Rettungshubschrauber-Station',
        6: 'Polizeiwache',
        7: 'Leitstelle',
        8: 'Polizeischule',
        9: 'THW',
        10: 'THW Bundesschule',
        11: 'Bereitschaftspolizei',
        12: 'Schnelleinsatzgruppe (SEG)',
        13: 'Polizeihubschrauberstation',
        14: 'Bereitstellungsraum',
        15: 'Wasserrettung',
        16: 'Verbandszellen',
        17: 'Polizei-Sondereinheiten',
        18: 'Feuerwache (Kleinwache)',
        19: 'Polizeiwache (Kleinwache)',
        20: 'Rettungswache (Kleinwache)',
        21: 'Rettungshundestaffel',
        22: 'Großer Komplex',
        23: 'Kleiner Komplex',
        24: 'Reiterstaffel',
        25: 'Bergrettungswache',
        26: 'Seenotrettungswache',
        27: 'Schule für Seefahrt und Seenotrettung',
        28: 'Hubschrauberstation (Seenotrettung)'
    };

    const CHART_COLORS = [
        '#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f',
        '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ab',
        '#6b8fd6', '#ffa552', '#d66b6b', '#5ac8c8', '#6ac36a',
        '#d4b83f', '#9e7cc1', '#ff8fab', '#8d6e63', '#90a4ae'
    ];

    let allBuildings = [];
    let activeFilter = null;

    function injectStyles() {
        if ($('#gebaeudeliste-styles').length) {
            return;
        }

        $('head').append(`
            <style id="gebaeudeliste-styles">
                #profile_buildings .gebaeudeliste-charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 15px;
                    margin-bottom: 15px;
                }

                #profile_buildings .gebaeudeliste-chart-card {
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: #fff;
                    padding: 12px;
                }

                #profile_buildings .gebaeudeliste-chart-title {
                    font-weight: 700;
                    margin-bottom: 12px;
                    font-size: 15px;
                }

                #profile_buildings .gebaeudeliste-chart-wrap {
                    display: flex;
                    gap: 14px;
                    align-items: flex-start;
                    flex-wrap: wrap;
                }

                #profile_buildings .gebaeudeliste-pie {
                    width: 140px;
                    height: 140px;
                    border-radius: 50%;
                    flex: 0 0 140px;
                    border: 1px solid #ddd;
                    background: #eee;
                    cursor: pointer;
                }

                #profile_buildings .gebaeudeliste-legend {
                    flex: 1 1 180px;
                    min-width: 180px;
                }

                #profile_buildings .gebaeudeliste-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                    line-height: 1.3;
                    cursor: pointer;
                    user-select: none;
                }

                #profile_buildings .gebaeudeliste-legend-item:hover .gebaeudeliste-legend-label {
                    text-decoration: underline;
                }

                #profile_buildings .gebaeudeliste-legend-color {
                    width: 12px;
                    height: 12px;
                    border-radius: 2px;
                    flex: 0 0 12px;
                    border: 1px solid rgba(0,0,0,0.1);
                }

                #profile_buildings .gebaeudeliste-legend-label {
                    flex: 1 1 auto;
                }

                #profile_buildings .gebaeudeliste-legend-value {
                    color: #666;
                    white-space: nowrap;
                    margin-left: auto;
                }

                #profile_buildings .gebaeudeliste-legend-item.active .gebaeudeliste-legend-label,
                #profile_buildings .gebaeudeliste-legend-item.active .gebaeudeliste-legend-value {
                    font-weight: 700;
                    text-decoration: underline;
                    color: #000;
                }

                #profile_buildings .gebaeudeliste-meta {
                    color: #666;
                    margin-top: 6px;
                    font-size: 12px;
                }

                #profile_buildings .gebaeudeliste-entry .panel-heading h4 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    flex-wrap: wrap;
                }

                #profile_buildings .gebaeudeliste-filter-status {
                    margin-bottom: 15px;
                }

                #profile_buildings .gebaeudeliste-filter-actions {
                    margin-top: 8px;
                }

                #profile_buildings .gebaeudeliste-chart-hint {
                    margin-top: 10px;
                    font-size: 12px;
                    color: #666;
                }
            </style>
        `);
    }

    function getUserIdFromUrl() {
        const match = window.location.pathname.match(/\/profile\/(\d+)/);
        if (!match) {
            console.error('[Gebaeudeliste] Konnte USERID nicht aus URL lesen:', window.location.href);
            return null;
        }
        return match[1];
    }

    function getAddress(lat, lon) {

        return new Promise(resolve => {
            $.get(`/reverse_address?latitude=${lat}&longitude=${lon}`, function (data) {
                resolve(data);
            }).fail(err => {
                console.error('[Gebaeudeliste] Fehler bei reverse_address:', err);
                resolve('Adresse nicht gefunden');
            });
        });
    }

    function loadBuildings(userId) {
        const url = `/building/buildings_json?load_alliance_buildings=false&user_to_load_id=${userId}`;

        return new Promise(resolve => {
            $.getJSON(url, function (data) {

                if (!data || !Array.isArray(data.buildings)) {
                    console.warn('[Gebaeudeliste] Antwort enthält keine gültige building-Liste');
                    resolve([]);
                    return;
                }

                resolve(data.buildings);
            }).fail(err => {
                console.error('[Gebaeudeliste] Fehler beim Laden der Gebäude:', err);
                resolve([]);
            });
        });
    }

    function ensureTabExists() {
        if (!$('#profile_buildings').length) {
            $('.tab-content').append(`
                <div id="profile_buildings" role="tabpanel" class="tab-pane"></div>
            `);
        }

        if (!$('#tab_profile_buildings').length) {
            $('#tabs').append(`
                <li id="tab_profile_buildings" role="presentation">
                    <a href="#profile_buildings" aria-controls="profile_buildings" role="tab" data-toggle="tab">
                        Gebäudeliste
                    </a>
                </li>
            `);
        }
    }

    function getBuildingTypeCaption(type) {
        return BUILDING_TYPE_CAPTIONS[type] || `Typ ${type}`;
    }

    function sortBuildings(buildings) {
        return [...buildings].sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB, 'de');
        });
    }

    function countBy(items, getKey, getLabel) {
        const counts = new Map();

        for (const item of items) {
            const key = getKey(item);
            if (key === undefined || key === null || key === '') {
                continue;
            }

            if (!counts.has(key)) {
                counts.set(key, {
                    key,
                    label: getLabel(key, item),
                    count: 0
                });
            }

            counts.get(key).count += 1;
        }

        return [...counts.values()];
    }

    function getPersonalBucketLabel(value) {
        if (value === 0) return '0';
        if (value >= 1 && value <= 10) return '1–10';
        if (value >= 11 && value <= 25) return '11–25';
        if (value >= 26 && value <= 50) return '26–50';
        if (value >= 51 && value <= 100) return '51–100';
        if (value >= 101 && value <= 250) return '101–250';
        if (value >= 251 && value <= 500) return '251–500';
        return '500+';
    }

    function getTypeChartData(buildings) {
        return countBy(
            buildings,
            building => building.building_type,
            key => getBuildingTypeCaption(key)
        ).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'de'))
         .map(entry => ({
             ...entry,
             filter: {
                 dimension: 'building_type',
                 value: entry.key,
                 label: entry.label
             }
         }));
    }

    function getLevelChartData(buildings) {
        return countBy(
            buildings,
            building => building.level ?? 0,
            key => `Stufe ${key}`
        ).sort((a, b) => Number(a.key) - Number(b.key))
         .map(entry => ({
             ...entry,
             filter: {
                 dimension: 'level',
                 value: entry.key,
                 label: entry.label
             }
         }));
    }

    function getPersonalChartData(buildings) {
        return countBy(
            buildings,
            building => getPersonalBucketLabel(Number(building.personal_count) || 0),
            key => key
        ).sort((a, b) => {
            const order = ['0', '1–10', '11–25', '26–50', '51–100', '101–250', '251–500', '500+'];
            return order.indexOf(a.key) - order.indexOf(b.key);
        }).map(entry => ({
            ...entry,
            filter: {
                dimension: 'personal_bucket',
                value: entry.key,
                label: entry.label
            }
        }));
    }

    function isFilterActive(filter) {
        return !!activeFilter &&
            activeFilter.dimension === filter.dimension &&
            String(activeFilter.value) === String(filter.value);
    }

    function createPieChartHtml(title, data, totalCount, chartKey) {
        if (!data.length) {
            return `
                <div class="gebaeudeliste-chart-card">
                    <div class="gebaeudeliste-chart-title">${title}</div>
                    <div class="alert alert-info" style="margin-bottom:0;">Keine Daten vorhanden.</div>
                </div>
            `;
        }

        let currentPercent = 0;
        const gradientParts = [];

        data.forEach((entry, index) => {
            const percent = totalCount > 0 ? (entry.count / totalCount) * 100 : 0;
            const start = currentPercent;
            const end = currentPercent + percent;
            const color = CHART_COLORS[index % CHART_COLORS.length];
            entry.color = color;
            entry.startPercent = start;
            entry.endPercent = end;

            gradientParts.push(`${color} ${start}% ${end}%`);
            currentPercent = end;
        });

        const gradient = `conic-gradient(${gradientParts.join(', ')})`;

        const legendHtml = data.map((entry, index) => {
            const percent = totalCount > 0 ? ((entry.count / totalCount) * 100).toFixed(1).replace('.', ',') : '0,0';
            const activeClass = isFilterActive(entry.filter) ? 'active' : '';

            return `
                <div
                    class="gebaeudeliste-legend-item ${activeClass}"
                    data-chart-key="${chartKey}"
                    data-segment-index="${index}"
                    data-filter-dimension="${entry.filter.dimension}"
                    data-filter-value="${entry.filter.value}"
                >
                    <span class="gebaeudeliste-legend-color" style="background:${entry.color};"></span>
                    <span class="gebaeudeliste-legend-label">${entry.label}</span>
                    <span class="gebaeudeliste-legend-value">${entry.count} (${percent} %)</span>
                </div>
            `;
        }).join('');

        return `
            <div class="gebaeudeliste-chart-card">
                <div class="gebaeudeliste-chart-title">${title}</div>
                <div
                    class="gebaeudeliste-pie"
                    data-chart-key="${chartKey}"
                    title="Tortenstück anklicken zum Filtern"
                    style="background:${gradient};"
                ></div>
                <div class="gebaeudeliste-chart-wrap" style="margin-top:12px;">
                    <div class="gebaeudeliste-legend">
                        ${legendHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function renderCharts(buildings) {
        const totalCount = buildings.length;
        const typeChartData = getTypeChartData(buildings);
        const levelChartData = getLevelChartData(buildings);
        const personalChartData = getPersonalChartData(buildings);

        window.gebaeudelisteChartData = {
            building_type: typeChartData,
            level: levelChartData,
            personal_bucket: personalChartData
        };

        return `
            <div class="gebaeudeliste-charts-grid">
                ${createPieChartHtml('Aufteilung der Gebäudetypen', typeChartData, totalCount, 'building_type')}
                ${createPieChartHtml('Aufteilung der Ausbaustufen', levelChartData, totalCount, 'level')}
                ${createPieChartHtml('Aufteilung des Personals', personalChartData, totalCount, 'personal_bucket')}
            </div>
        `;
    }

    function renderFilterStatus(filteredBuildings) {
        const activeText = activeFilter
            ? `Aktiver Filter: <strong>${activeFilter.label}</strong>`
            : 'Aktiver Filter: <strong>Keiner</strong>';

        return `
            <div class="alert alert-info gebaeudeliste-filter-status">
                <div>${activeText}</div>
                <div style="margin-top:6px;">
                    <strong>${filteredBuildings.length}</strong> Gebäude angezeigt
                </div>
                ${activeFilter ? `
                    <div class="gebaeudeliste-filter-actions">
                        <button type="button" class="btn btn-default btn-xs" id="gebaeudeliste-reset-filter">
                            Filter zurücksetzen
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function matchesFilter(building, filter) {
        if (!filter) {
            return true;
        }

        if (filter.dimension === 'building_type') {
            return String(building.building_type) === String(filter.value);
        }

        if (filter.dimension === 'level') {
            return String(building.level ?? 0) === String(filter.value);
        }

        if (filter.dimension === 'personal_bucket') {
            return getPersonalBucketLabel(Number(building.personal_count) || 0) === String(filter.value);
        }

        return true;
    }

    function renderBuildings(buildings) {
        const $container = $('#profile_buildings');
        $container.empty();

        if (!buildings.length) {
            console.warn('[Gebaeudeliste] Keine Gebäude zum Anzeigen');
            $container.append(`
                <div class="alert alert-info">
                    Keine Gebäude gefunden.
                </div>
            `);
            return;
        }

        const sortedBuildings = sortBuildings(buildings);
        const filteredBuildings = sortedBuildings.filter(building => matchesFilter(building, activeFilter));

        $container.append(renderCharts(buildings));
        $container.append(renderFilterStatus(filteredBuildings));

        const $listContainer = $('<div id="gebaeudeliste-list"></div>');
        $container.append($listContainer);

        if (!filteredBuildings.length) {
            $listContainer.append(`
                <div class="alert alert-info">
                    Für den gewählten Filter wurden keine Gebäude gefunden.
                </div>
            `);
        } else {
            for (const building of filteredBuildings) {

                const icon = building.icon || '';
                const name = building.name || `Gebäude ${building.id}`;
                const lat = building.latitude;
                const lon = building.longitude;
                const personalCount = building.personal_count ?? '-';
                const level = building.level ?? 0;
                const typeCaption = getBuildingTypeCaption(building.building_type);

                const insertHtml = `
                    <div class="panel panel-default gebaeudeliste-entry" data-building-type="${building.building_type}">
                        <div class="panel-heading">
                            <h4>
                                <img src="${icon}" alt="" style="max-height:24px;">
                                <a href="/buildings/${building.id}" class="lightbox-open">${name}</a>
                                <small style="color:#777;">(${typeCaption})</small>
                            </h4>
                        </div>
                        <div class="panel-body">
                            <div><strong>Personal:</strong> ${personalCount}</div>
                            <div><strong>Ausbaustufe:</strong> ${level}</div>
                            <div style="margin-top:8px;">
                                <span
                                    class="gebaeudeliste-address-link"
                                    data-lat="${lat}"
                                    data-lon="${lon}"
                                    style="cursor:pointer; color:#337ab7;"
                                >
                                    Adresse anzeigen
                                </span>
                            </div>
                        </div>
                    </div>
                `;

                $listContainer.append(insertHtml);
            }
        }
    }

    function toggleFilter(filter) {
        if (isFilterActive(filter)) {
            activeFilter = null;
        } else {
            activeFilter = filter;
        }

        renderBuildings(allBuildings);
    }

    function getSegmentIndexFromClick(event, pieElement, segments) {
        const rect = pieElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;

        const radius = rect.width / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > radius) {
            return null;
        }

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        angle = (angle + 90 + 360) % 360;
        const percent = (angle / 360) * 100;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (percent >= segment.startPercent && percent < segment.endPercent) {
                return i;
            }
        }

        if (segments.length) {
            const last = segments[segments.length - 1];
            if (Math.abs(percent - last.endPercent) < 0.0001) {
                return segments.length - 1;
            }
        }

        return null;
    }

    const userId = getUserIdFromUrl();
    if (!userId) {
        return;
    }

    injectStyles();
    ensureTabExists();

    allBuildings = await loadBuildings(userId);

    renderBuildings(allBuildings);

    $('body').on('click', '#gebaeudeliste-reset-filter', function () {
        activeFilter = null;
        renderBuildings(allBuildings);
    });

    $('body').on('click', '.gebaeudeliste-legend-item', function () {
        const filter = {
            dimension: $(this).attr('data-filter-dimension'),
            value: $(this).attr('data-filter-value'),
            label: $(this).find('.gebaeudeliste-legend-label').text().trim()
        };

        toggleFilter(filter);
    });

    $('body').on('click', '.gebaeudeliste-pie', function (event) {
        const chartKey = $(this).attr('data-chart-key');
        const chartData = window.gebaeudelisteChartData?.[chartKey];

        if (!chartData || !chartData.length) {
            return;
        }

        const segmentIndex = getSegmentIndexFromClick(event, this, chartData);
        if (segmentIndex === null) {
            return;
        }

        const segment = chartData[segmentIndex];
        if (!segment || !segment.filter) {
            return;
        }

        toggleFilter(segment.filter);
    });

    $('body').on('click', '.gebaeudeliste-address-link', async function () {
        const $this = $(this);

        if ($this.data('loaded')) {
            return;
        }

        const lat = $this.attr('data-lat');
        const lon = $this.attr('data-lon');

        console.log('[Gebaeudeliste] Klick auf Adresse:', lat, lon);

        $this.text('Lade Adresse …').css({ cursor: 'wait' });

        const address = await getAddress(lat, lon);

        $this
            .text(address)
            .css({ cursor: 'text', color: 'inherit' })
            .data('loaded', true);
    });
})();
