// ==UserScript==
// @name         Standortanzeiger
// @namespace    https://github.com/Glaeydar/LSS_Scripts/Standortanzeiger.user.js
// @version      0.96
// @description  Zeigt die Standorte von Wachen an
// @author       Glaeydar -edit by MissSobol
// @match        https://www.leitstellenspiel.de/
// @require      https://github.com/tyrasd/osmtogeojson/raw/gh-pages/osmtogeojson.js
// @connect      overpass-api.de
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    var OVERPASS_INTERPRETER_URL = 'https://overpass-api.de/api/interpreter';
    var OVERPASS_STATUS_URL = 'https://overpass-api.de/api/status';
    var MAX_REQUESTS_PER_DAY = 10000;

    // Konfiguration für Verbandsgebäudenamen.
    // Die Einträge werden nur dann und in dieser Reihenfolge angewendet,
    // wenn "<POI-Name> Verband" länger als MAX_ASSOCIATION_NAME_LENGTH ist.
    // Weitere Abkürzungen können einfach als zusätzliche Objekte ergänzt werden.
    // Längere Begriffe/Phrasen sollten vor kürzeren Teilbegriffen stehen.
    var MAX_ASSOCIATION_NAME_LENGTH = 40;
    var ASSOCIATION_NAME_SUFFIX = ' Verband';
    var ASSOCIATION_NAME_ABBREVIATIONS = [
        { search: 'Fachkrankenhaus', replace: 'FachKH' },
        { search: 'Krankenhaus', replace: 'KH' },
        { search: 'Klinikum', replace: 'Klinik' },
        { search: 'Polizeiinspektion', replace: 'Pol.inspek.' },
    ];

    // Konfigurationsvariablen für das Ein-/Ausschalten der Dropdown-Menüs
    var enableMainDropdown = true; // Gebäude-Dropdown einschalten
    var enableAdditionalDropdown = false; // POI-Dropdown einschalten

    var pageWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
    var map = pageWindow.map;
    var L = pageWindow.L;
    var convertOsmToGeoJson = typeof osmtogeojson === 'function' ? osmtogeojson : pageWindow.osmtogeojson;

    if (!map || !L || typeof convertOsmToGeoJson !== 'function') {
        console.error('Standortanzeiger: Karte, Leaflet oder osmtogeojson wurde nicht gefunden.');
        return;
    }

    var poiLayer = null;
    var selectedPOIType = null;
    var selectedAdditionalPOIType = null;
    var requestToken = 0;
    var isQueryRunning = false;

    var actionButtonContainer = null;
    var queryButton = null;
    var hideButton = null;
    var mapLockOverlay = null;
    var mapInteractionState = null;
    var dropdowns = [];

    var rateLimitBlockedUntil = 0;
    var rateLimitTimer = null;
    var temporaryButtonMessage = '';
    var temporaryButtonMessageUntil = 0;
    var temporaryButtonMessageTimer = null;

    // Zähler und Zeitpunkt des letzten Resets im Local Storage
    var requestCounter = parseInt(localStorage.getItem('requestCounter'), 10) || 0;
    var lastResetTime = parseInt(localStorage.getItem('lastResetTime'), 10) || 0;

    // Überprüfen, ob ein Reset erforderlich ist (mehr als 24 Stunden vergangen)
    if (Date.now() - lastResetTime > 24 * 60 * 60 * 1000) {
        resetRequestCounter();
    }

    // Funktion zum Erstellen eines Dropdown-Menüs
    function createDropdown(poiTypes, onChange) {
        var dropdown = document.createElement('select');
        dropdown.style.padding = '2px';
        dropdown.style.cursor = 'pointer';
        dropdown.style.border = 'none';
        dropdown.style.background = '#3498db';
        dropdown.style.color = '#fff';
        dropdown.style.borderRadius = '0px';

        poiTypes.forEach(function (poi) {
            var option = document.createElement('option');
            option.value = poi.value;
            option.text = poi.label;
            dropdown.add(option);
        });

        dropdown.addEventListener('change', onChange);
        dropdowns.push(dropdown);
        return dropdown;
    }

    function createActionButtons() {
        actionButtonContainer = document.createElement('div');
        actionButtonContainer.style.position = 'absolute';
        actionButtonContainer.style.left = '10px';
        actionButtonContainer.style.bottom = '10px';
        actionButtonContainer.style.zIndex = '10001';
        actionButtonContainer.style.display = 'none';
        actionButtonContainer.style.gap = '8px';
        actionButtonContainer.style.alignItems = 'center';

        queryButton = createButton('POIs abfragen', '#3498db');
        hideButton = createButton('POIs ausblenden', '#e67e22');

        queryButton.addEventListener('click', requestVisiblePOIs);
        hideButton.addEventListener('click', hidePOIs);

        actionButtonContainer.appendChild(queryButton);
        actionButtonContainer.appendChild(hideButton);
        document.body.appendChild(actionButtonContainer);

        updateActionButtons();
    }

    function createButton(text, background) {
        var button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.style.padding = '8px 12px';
        button.style.background = background;
        button.style.color = '#fff';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.boxShadow = '0 2px 6px rgba(0,0,0,0.25)';
        return button;
    }

    function hasSelectedPOIType() {
        return getSelectedPOITypes().length > 0;
    }

    function getSelectedPOITypes() {
        var types = [];

        if (selectedPOIType) {
            types.push(selectedPOIType);
        }
        if (selectedAdditionalPOIType && types.indexOf(selectedAdditionalPOIType) === -1) {
            types.push(selectedAdditionalPOIType);
        }

        return types;
    }

    function updateActionButtons() {
        if (!queryButton || !hideButton || !actionButtonContainer) return;

        var hasSelection = hasSelectedPOIType();
        var isRateLimited = rateLimitBlockedUntil > Date.now();
        var hasTemporaryMessage = temporaryButtonMessage && temporaryButtonMessageUntil > Date.now();
        var shouldShow = hasSelection || !!poiLayer || isQueryRunning || isRateLimited || hasTemporaryMessage;

        actionButtonContainer.style.display = shouldShow ? 'flex' : 'none';

        dropdowns.forEach(function (dropdown) {
            dropdown.disabled = isQueryRunning;
        });

        if (isQueryRunning) {
            queryButton.disabled = true;
            queryButton.textContent = 'POIs werden abgefragt';
        } else if (isRateLimited) {
            var remainingSeconds = Math.max(1, Math.ceil((rateLimitBlockedUntil - Date.now()) / 1000));
            queryButton.disabled = true;
            queryButton.textContent = 'Nächste Abfrage in ' + remainingSeconds + ' Sekunden möglich';
        } else if (hasTemporaryMessage) {
            queryButton.disabled = true;
            queryButton.textContent = temporaryButtonMessage;
        } else {
            queryButton.disabled = !hasSelection;
            queryButton.textContent = 'POIs abfragen';
        }

        hideButton.disabled = isQueryRunning || !poiLayer;

        queryButton.style.cursor = queryButton.disabled ? 'not-allowed' : 'pointer';
        queryButton.style.opacity = queryButton.disabled ? '0.75' : '1';
        hideButton.style.cursor = hideButton.disabled ? 'not-allowed' : 'pointer';
        hideButton.style.opacity = hideButton.disabled ? '0.75' : '1';
    }

    function showTemporaryButtonMessage(message, durationMilliseconds) {
        temporaryButtonMessage = message;
        temporaryButtonMessageUntil = Date.now() + durationMilliseconds;

        if (temporaryButtonMessageTimer) {
            clearTimeout(temporaryButtonMessageTimer);
        }

        temporaryButtonMessageTimer = setTimeout(function () {
            temporaryButtonMessage = '';
            temporaryButtonMessageUntil = 0;
            temporaryButtonMessageTimer = null;
            updateActionButtons();
        }, durationMilliseconds);

        updateActionButtons();
    }

    function startRateLimitCountdown(waitSeconds) {
        var safeWaitSeconds = Math.max(1, parseInt(waitSeconds, 10) || 1);

        // Eine zusätzliche Sekunde verhindert, dass knapp vor der Serverfreigabe abgefragt wird.
        rateLimitBlockedUntil = Date.now() + (safeWaitSeconds + 1) * 1000;

        if (rateLimitTimer) {
            clearInterval(rateLimitTimer);
        }

        rateLimitTimer = setInterval(function () {
            if (rateLimitBlockedUntil <= Date.now()) {
                clearRateLimitCountdown();
            } else {
                updateActionButtons();
            }
        }, 250);

        updateActionButtons();
    }

    function clearRateLimitCountdown() {
        rateLimitBlockedUntil = 0;

        if (rateLimitTimer) {
            clearInterval(rateLimitTimer);
            rateLimitTimer = null;
        }

        updateActionButtons();
    }

    function lockMap() {
        if (mapLockOverlay) return;

        var handlerNames = [
            'dragging',
            'touchZoom',
            'doubleClickZoom',
            'scrollWheelZoom',
            'boxZoom',
            'keyboard',
            'tap'
        ];

        mapInteractionState = {};

        handlerNames.forEach(function (handlerName) {
            var handler = map[handlerName];
            var wasEnabled = !!(handler && typeof handler.enabled === 'function' && handler.enabled());
            mapInteractionState[handlerName] = wasEnabled;

            if (wasEnabled && typeof handler.disable === 'function') {
                handler.disable();
            }
        });

        var mapContainer = map.getContainer();
        mapContainer.setAttribute('aria-busy', 'true');

        mapLockOverlay = document.createElement('div');
        mapLockOverlay.textContent = 'POIs werden abgefragt …';
        mapLockOverlay.style.position = 'absolute';
        mapLockOverlay.style.top = '0';
        mapLockOverlay.style.right = '0';
        mapLockOverlay.style.bottom = '0';
        mapLockOverlay.style.left = '0';
        mapLockOverlay.style.zIndex = '10000';
        mapLockOverlay.style.display = 'flex';
        mapLockOverlay.style.alignItems = 'center';
        mapLockOverlay.style.justifyContent = 'center';
        mapLockOverlay.style.background = 'rgba(255,255,255,0.25)';
        mapLockOverlay.style.color = '#222';
        mapLockOverlay.style.fontWeight = 'bold';
        mapLockOverlay.style.fontSize = '16px';
        mapLockOverlay.style.textShadow = '0 1px 2px #fff';
        mapLockOverlay.style.cursor = 'wait';
        mapLockOverlay.style.pointerEvents = 'all';

        mapContainer.appendChild(mapLockOverlay);
    }

    function unlockMap() {
        if (mapLockOverlay && mapLockOverlay.parentNode) {
            mapLockOverlay.parentNode.removeChild(mapLockOverlay);
        }
        mapLockOverlay = null;

        var mapContainer = map.getContainer();
        mapContainer.removeAttribute('aria-busy');

        if (mapInteractionState) {
            Object.keys(mapInteractionState).forEach(function (handlerName) {
                var handler = map[handlerName];

                if (mapInteractionState[handlerName] && handler && typeof handler.enable === 'function') {
                    handler.enable();
                }
            });
        }

        mapInteractionState = null;
    }

    // POI-Typen für das Haupt-Dropdown
    var primaryPOITypes = [
        { label: "Gebäude POIs", value: "" },
        { label: "FW POIs", value: "amenity=fire_station" },
        { label: "RW POIs", value: "emergency=ambulance_station" },
        { label: "Pol POIs", value: "amenity=police" },
        { label: "KH POIs", value: "amenity=hospital" },
        { label: "WR POIs", value: "emergency=lifeguard" },
        { label: "THW POIs", value: "emergency_service=technical" },
        { label: "Lst POIs", value: "emergency=control_centre" },
        { label: "BW POIs", value: "emergency=mountain_rescue" },
        { label: "KW POIs", value: "amenity=coast_guard" }
    ];

    // POI-Typen für das Zusatz-Dropdown
    var additionalPOITypes = [
        { label: "POI POIs", value: "" },
        { label: "Park", value: "leisure=park" },
        { label: "See", value: "natural=water" },
        { label: "Krankenhaus", value: "amenity=hospital" },
        { label: "Wald", value: "landuse=forest" },
        { label: "Bushaltestelle", value: "highway=bus_stop" },
        { label: "Strab.-haltestelle", value: "railway=tram_stop" },
        { label: "Bahnhof", value: "railway=station" },
        { label: "Güterbahnhof", value: "railway=station" },
        { label: "Supermarkt", value: "shop=supermarket" },
        { label: "Tankstelle", value: "amenity=fuel" },
        { label: "Schule", value: "amenity=school" },
        { label: "Museum", value: "tourism=museum" },
        { label: "Einkaufszentrum", value: "shop=mall" },
        { label: "Autobahnauf.- / abfahrt", value: "highway=motorway_junction" },
        { label: "Weihnachtsmarkt", value: "chrismas=yes" },
        { label: "Lagerhalle", value: "building=warehouse" },
        { label: "Diskothek", value: "amenity=nightclub" },
        { label: "Stadion", value: "leisure=stadium" },
        { label: "Bauernhof", value: "landuse=farm" },
        { label: "Bürokomplex", value: "office=business" },
        { label: "Schwimmbad", value: "leisure=swimming_pool" },
        { label: "Bahnübergang", value: "railway=level_crossing" },
        { label: "Theater", value: "amenity=theatre" },
        { label: "Festplatz", value: "leisure=common" },
        { label: "Fluss", value: "waterway=river" },
        { label: "Baumarkt", value: "shop=doityourself" },
        { label: "Flughafen: Piste", value: "aeroway=runway" },
        { label: "Flughafen: Standplatz", value: "aeroway=apron" },
        { label: "Flughafen: Terminal", value: "aeroway=terminal" },
        { label: "Biogasanlage", value: "generator:source=biomass" },
        { label: "Bank", value: "amenity=bank" },
        { label: "Kirche", value: "amenity=place_of_worship" },
        { label: "Chemiepark", value: "landuse=industrial" },
        { label: "Industrie-Allgemein", value: "landuse=industrial" },
        { label: "Automobilindustrie", value: "industrial=automotive" },
        { label: "Müllverbrennungsanlage", value: "man_made=incinerator" },
        { label: "Eishalle", value: "leisure=ice_rink" },
        { label: "Holzverarbeitung", value: "industrial=wood" },
        { label: "Motorsportanlage", value: "leisure=track" },
        { label: "Tunnel", value: "highway=tunnel" },
        { label: "Klärwerk", value: "man_made=wastewater_plant" },
        { label: "Innenstadt", value: "place=city_centre" },
        { label: "Möbelhaus", value: "shop=furniture" },
        { label: "Campingplatz", value: "tourism=camp_site" },
        { label: "Kompostieranlage", value: "man_made=composting" },
        { label: "Textilverarbeitung", value: "industrial=textile" },
        { label: "Moor", value: "wetland=bog" },
        { label: "Hüttenwerk", value: "industrial=metal" },
        { label: "Kraftwerk", value: "power=plant" },
        { label: "Werksgelände", value: "landuse=industrial" },
        { label: "Brücke", value: "man_made=bridge" },
        { label: "Eisenbahntunnel", value: "railway=subway" },
        { label: "Kohlekraftwerk", value: "plant:source=coal" },
        { label: "Seilbahn", value: "aerialway=cable_car" },
        { label: "U-Bahn Station", value: "station=subway" },
        { label: "Zoo", value: "tourism=zoo" }
    ];

    // Dropdowns zur Karte hinzufügen
    var leafletControl = document.querySelector('.leaflet-control-attribution');

    if (!leafletControl) {
        console.error('Standortanzeiger: Leaflet-Steuerelement wurde nicht gefunden.');
        return;
    }

    // Haupt-Dropdown erstellen und hinzufügen, falls aktiviert
    if (enableMainDropdown) {
        var mainDropdown = createDropdown(primaryPOITypes, function () {
            selectedPOIType = mainDropdown.value || null;
            updateActionButtons();
        });
        leafletControl.appendChild(mainDropdown);
    }

    // Zusatz-Dropdown erstellen und hinzufügen, falls aktiviert
    if (enableAdditionalDropdown) {
        var additionalDropdown = createDropdown(additionalPOITypes, function () {
            selectedAdditionalPOIType = additionalDropdown.value || null;
            updateActionButtons();
        });
        leafletControl.appendChild(additionalDropdown);
    }

    createActionButtons();


    async function requestVisiblePOIs() {
        if (isQueryRunning || rateLimitBlockedUntil > Date.now()) return;

        var selectedTypes = getSelectedPOITypes();
        if (!selectedTypes.length) return;

        if (requestCounter >= MAX_REQUESTS_PER_DAY) {
            console.warn('Maximale Anfragenanzahl erreicht. Bitte bis zum nächsten Tagesreset warten.');
            showTemporaryButtonMessage('Tageslimit erreicht', 5000);
            return;
        }

        isQueryRunning = true;
        var currentToken = ++requestToken;
        var queryWasSent = false;

        updateActionButtons();
        lockMap();

        try {
            var statusBefore = await getOverpassStatus();

            if (currentToken !== requestToken) return;

            if (statusBefore.availableSlots <= 0) {
                startRateLimitCountdown(statusBefore.waitSeconds);
                return;
            }

            clearRateLimitCountdown();

            var overpassQuery = buildOverpassQuery(map, selectedTypes);
            queryWasSent = true;
            incrementRequestCounter();

            var osmDataAsText = await requestOverpassQuery(overpassQuery);

            if (currentToken !== requestToken) return;

            var xmlDocument = new DOMParser().parseFromString(osmDataAsText, 'text/xml');
            var parserError = xmlDocument.querySelector('parsererror');

            if (parserError) {
                throw new Error('Die Overpass-Antwort konnte nicht als XML verarbeitet werden.');
            }

            var resultAsGeojson = convertOsmToGeoJson(xmlDocument);
            replacePOILayer(resultAsGeojson);
            console.log('Standortanzeiger: POIs wurden geladen.');
        } catch (error) {
            console.error('Standortanzeiger: POI-Abfrage fehlgeschlagen:', error);
            showTemporaryButtonMessage('Abfrage fehlgeschlagen – erneut versuchen', 5000);
        } finally {
            // Nach jeder tatsächlichen POI-Abfrage den aktuellen Slot-Status erneut prüfen
            if (queryWasSent) {
                try {
                    var statusAfter = await getOverpassStatus();

                    if (statusAfter.availableSlots <= 0) {
                        startRateLimitCountdown(statusAfter.waitSeconds);
                    } else {
                        clearRateLimitCountdown();
                    }
                } catch (statusError) {
                    // Vor der nächsten POI-Abfrage wird der Status erneut geprüft.
                    console.warn('Standortanzeiger: Overpass-Status konnte nach der Abfrage nicht gelesen werden:', statusError);
                }
            }

            isQueryRunning = false;
            unlockMap();
            updateActionButtons();
        }
    }

    function hidePOIs() {
        if (isQueryRunning) return;

        requestToken++;
        clearPOILayer();
        updateActionButtons();
    }

    function replacePOILayer(resultAsGeojson) {
        clearPOILayer();

        poiLayer = L.geoJson(resultAsGeojson, {
            pointToLayer: function (feature, latlng) {
                var icon = L.icon({
                    iconUrl: 'https://www.svgrepo.com/show/302636/map-marker.svg',
                    iconSize: [50, 50],
                    iconAnchor: [25, 50],
                    popupAnchor: [0, -25]
                });

                return L.marker(latlng, { icon: icon });
            },
            filter: function (feature) {
                var geometry = feature.geometry;
                var isPolygon = geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon');

                if (isPolygon) {
                    var polygonLayer = L.geoJson(feature);
                    var polygonCenter = polygonLayer.getBounds().getCenter();
                    feature.geometry = {
                        type: 'Point',
                        coordinates: [polygonCenter.lng, polygonCenter.lat]
                    };
                }

                return true;
            },
            onEachFeature: function (feature, layer) {
                var markerName = getFeatureName(feature);
                var tooltipText = markerName || 'Kein Name vorhanden';

                layer.bindTooltip(createTooltipContent(tooltipText), {
                    direction: 'top',
                    offset: [0, -45],
                    opacity: 0.95
                });

                if (!markerName) {
                    // Marker ohne Namen zeigen nur den Hinweis an und sind nicht anklickbar.
                    layer.on('add', function () {
                        setLayerCursor(layer, 'not-allowed');
                    });
                    layer.on('mouseover', function () {
                        setLayerCursor(layer, 'not-allowed');
                    });
                    return;
                }

                layer.on('add', function () {
                    setLayerCursor(layer, 'pointer');
                });

                layer.on('click', function (event) {
                    var originalEvent = event && event.originalEvent;

                    if (originalEvent && originalEvent.shiftKey) {
                        var associationNameResult = buildAssociationBuildingName(markerName);
                        copyTextToClipboard(associationNameResult.name);

                        if (associationNameResult.isTooLong) {
                            setTimeout(function () {
                                alert(
                                    'Der Verbandsgebäudename konnte trotz Abkürzungen nicht auf maximal ' +
                                    MAX_ASSOCIATION_NAME_LENGTH + ' Zeichen gekürzt werden.\n\n' +
                                    'Der Name wurde trotzdem kopiert (' + associationNameResult.name.length + ' Zeichen):\n' +
                                    associationNameResult.name
                                );
                            }, 0);
                        }

                        return;
                    }

                    copyTextToClipboard(markerName);
                });
            }
        }).addTo(map);

        updateActionButtons();
    }

    function clearPOILayer() {
        if (poiLayer) {
            map.removeLayer(poiLayer);
            poiLayer = null;
        }
    }

    function buildOverpassQuery(leafletMap, overpassQueries) {
        var mapBounds = leafletMap.getBounds();
        var bounds = [
            mapBounds.getSouth(),
            mapBounds.getWest(),
            mapBounds.getNorth(),
            mapBounds.getEast()
        ].join(',');
        var queryParts = [];

        overpassQueries.forEach(function (overpassQuery) {
            var selector = buildTagSelector(overpassQuery);
            queryParts.push('node' + selector + '(' + bounds + ');');
            queryParts.push('way' + selector + '(' + bounds + ');');
            queryParts.push('relation' + selector + '(' + bounds + ');');
        });

        return '[out:xml][timeout:25];(' + queryParts.join('') + ');out body;>;out skel qt;';
    }

    function buildTagSelector(overpassQuery) {
        var separatorIndex = overpassQuery.indexOf('=');

        if (separatorIndex === -1) {
            return '["' + escapeOverpassString(overpassQuery) + '"]';
        }

        var key = overpassQuery.slice(0, separatorIndex);
        var value = overpassQuery.slice(separatorIndex + 1);
        return '["' + escapeOverpassString(key) + '"="' + escapeOverpassString(value) + '"]';
    }

    function escapeOverpassString(value) {
        return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    }

    async function getOverpassStatus() {
        var statusText;

        try {
            statusText = await requestText({
                method: 'GET',
                url: OVERPASS_STATUS_URL + '?_=' + Date.now(),
                headers: {
                    'Cache-Control': 'no-cache'
                },
                timeout: 10000
            });
        } catch (error) {
            showTemporaryButtonMessage('Overpass-Status nicht verfügbar', 5000);
            throw error;
        }

        return parseOverpassStatus(statusText);
    }

    function parseOverpassStatus(statusText) {
        var rateLimitMatch = statusText.match(/Rate limit:\s*(\d+)/i);
        var availableMatch = statusText.match(/(\d+)\s+slots?\s+available\s+now\.?/i);
        var rateLimit = rateLimitMatch ? parseInt(rateLimitMatch[1], 10) : null;
        var availableSlots = availableMatch ? parseInt(availableMatch[1], 10) : null;
        var waitSeconds = getShortestWaitTime(statusText);

        if (rateLimit === 0) {
            return {
                rateLimit: 0,
                availableSlots: Number.POSITIVE_INFINITY,
                waitSeconds: 0
            };
        }

        if (availableSlots === null) {
            if (/Slot available after:/i.test(statusText)) {
                availableSlots = 0;
            } else {
                throw new Error('Unbekanntes Format der Overpass-Statusantwort.');
            }
        }

        return {
            rateLimit: rateLimit,
            availableSlots: availableSlots,
            waitSeconds: availableSlots > 0 ? 0 : Math.max(1, waitSeconds || 1)
        };
    }

    function getShortestWaitTime(statusText) {
        var waits = [];
        var secondsPattern = /\bin\s+(\d+)\s+seconds?\.?/gi;
        var secondsMatch;

        while ((secondsMatch = secondsPattern.exec(statusText)) !== null) {
            waits.push(parseInt(secondsMatch[1], 10));
        }

        if (waits.length) {
            return Math.min.apply(Math, waits);
        }

        // Fallback: Zeitstempel auswerten, falls die Sekundenangabe fehlt.
        var currentTimeMatch = statusText.match(/Current time:\s*([^\r\n]+)/i);
        var currentTime = currentTimeMatch ? Date.parse(currentTimeMatch[1].trim()) : NaN;
        var slotPattern = /Slot available after:\s*([^,\r\n]+(?:Z|[+-]\d\d:\d\d)?)/gi;
        var slotMatch;

        while ((slotMatch = slotPattern.exec(statusText)) !== null) {
            var slotTime = Date.parse(slotMatch[1].trim());

            if (!Number.isNaN(slotTime)) {
                var baseTime = Number.isNaN(currentTime) ? Date.now() : currentTime;
                waits.push(Math.max(1, Math.ceil((slotTime - baseTime) / 1000)));
            }
        }

        return waits.length ? Math.min.apply(Math, waits) : 1;
    }

    function requestOverpassQuery(overpassQuery) {
        var pageJQuery = pageWindow.jQuery || pageWindow.$;


        if (pageJQuery && typeof pageJQuery.ajax === 'function') {
            return new Promise(function (resolve, reject) {
                pageJQuery.ajax({
                    url: OVERPASS_INTERPRETER_URL,
                    method: 'POST',
                    data: {
                        data: overpassQuery
                    },
                    dataType: 'text',
                    timeout: 45000,
                    cache: false,
                    success: function (responseText) {
                        resolve(responseText);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        var status = xhr && typeof xhr.status === 'number' ? xhr.status : 0;
                        var responseText = xhr && xhr.responseText ? String(xhr.responseText) : '';
                        var responseHint = responseText
                            .replace(/<[^>]*>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 250);
                        var message;

                        if (textStatus === 'timeout') {
                            message = 'Zeitüberschreitung bei ' + OVERPASS_INTERPRETER_URL;
                        } else if (status) {
                            message = 'HTTP ' + status + ' bei ' + OVERPASS_INTERPRETER_URL;
                        } else {
                            message = 'Netzwerkfehler bei ' + OVERPASS_INTERPRETER_URL;
                        }

                        if (errorThrown) {
                            message += ': ' + errorThrown;
                        }
                        if (responseHint) {
                            message += ' – ' + responseHint;
                        }

                        reject(new Error(message));
                    }
                });
            });
        }

        if (pageWindow.fetch && typeof pageWindow.fetch === 'function') {
            return pageWindow.fetch.call(pageWindow, OVERPASS_INTERPRETER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'Accept': 'application/xml, text/xml, */*;q=0.8'
                },
                body: 'data=' + encodeURIComponent(overpassQuery),
                cache: 'no-store',
                credentials: 'omit',
                referrer: pageWindow.location.href,
                referrerPolicy: 'strict-origin-when-cross-origin'
            }).then(function (response) {
                return response.text().then(function (responseText) {
                    if (!response.ok) {
                        var responseHint = responseText
                            .replace(/<[^>]*>/g, ' ')
                            .replace(/\s+/g, ' ')
                            .trim()
                            .slice(0, 250);
                        var message = 'HTTP ' + response.status + ' bei ' + OVERPASS_INTERPRETER_URL;

                        if (responseHint) {
                            message += ' – ' + responseHint;
                        }
                        throw new Error(message);
                    }

                    return responseText;
                });
            });
        }

        return Promise.reject(new Error('Für die Overpass-Abfrage wurde weder jQuery noch fetch gefunden.'));
    }

    function requestText(options) {
        if (typeof GM_xmlhttpRequest === 'function') {
            return new Promise(function (resolve, reject) {
                GM_xmlhttpRequest({
                    method: options.method || 'GET',
                    url: options.url,
                    headers: options.headers || {},
                    data: options.data,
                    timeout: options.timeout || 30000,
                    responseType: 'text',
                    onload: function (response) {
                        if (response.status >= 200 && response.status < 300) {
                            resolve(response.responseText);
                        } else {
                            reject(new Error('HTTP ' + response.status + ' bei ' + options.url));
                        }
                    },
                    ontimeout: function () {
                        reject(new Error('Zeitüberschreitung bei ' + options.url));
                    },
                    onerror: function () {
                        reject(new Error('Netzwerkfehler bei ' + options.url));
                    }
                });
            });
        }

        // Fallback für Umgebungen ohne GM_xmlhttpRequest.
        return fetch(options.url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.data,
            cache: 'no-store'
        }).then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ' bei ' + options.url);
            }
            return response.text();
        });
    }

    function getFeatureName(feature) {
        var properties = feature && feature.properties ? feature.properties : {};
        var tags = properties.tags || {};
        var markerName = tags.name || properties.name || '';

        return String(markerName).replace(/\s+/g, ' ').trim();
    }

    function createTooltipContent(text) {
        var tooltipContent = document.createElement('span');
        tooltipContent.textContent = text;
        return tooltipContent;
    }

    function setLayerCursor(layer, cursor) {
        if (!layer || typeof layer.getElement !== 'function') return;

        var markerElement = layer.getElement();
        if (markerElement) {
            markerElement.style.cursor = cursor;
        }
    }

    function buildAssociationBuildingName(markerName) {
        var baseName = String(markerName || '').replace(/\s+/g, ' ').trim();
        var escapedSuffix = escapeRegularExpression(ASSOCIATION_NAME_SUFFIX.trim());

        baseName = baseName.replace(new RegExp('\\s+' + escapedSuffix + '$', 'i'), '').trim();

        var associationName = baseName + ASSOCIATION_NAME_SUFFIX;

        if (associationName.length <= MAX_ASSOCIATION_NAME_LENGTH) {
            return {
                name: associationName,
                isTooLong: false
            };
        }

        for (var index = 0; index < ASSOCIATION_NAME_ABBREVIATIONS.length; index++) {
            var abbreviation = ASSOCIATION_NAME_ABBREVIATIONS[index];

            if (!abbreviation || !abbreviation.search) continue;

            baseName = replaceWholeWords(
                baseName,
                String(abbreviation.search),
                String(abbreviation.replace || '')
            );
            baseName = cleanupAbbreviatedName(baseName);
            associationName = baseName + ASSOCIATION_NAME_SUFFIX;

            if (associationName.length <= MAX_ASSOCIATION_NAME_LENGTH) {
                break;
            }
        }

        return {
            name: associationName,
            isTooLong: associationName.length > MAX_ASSOCIATION_NAME_LENGTH
        };
    }

    function replaceWholeWords(text, searchText, replacementText) {
        var escapedSearchText = escapeRegularExpression(searchText.trim()).replace(/\s+/g, '\\s+');
        var wordCharacterClass = 'A-Za-zÄÖÜäöüß0-9';
        var pattern = new RegExp(
            '(^|[^' + wordCharacterClass + '])(' + escapedSearchText + ')(?=$|[^' + wordCharacterClass + '])',
            'gi'
        );

        return text.replace(pattern, function (match, prefix) {
            return prefix + replacementText;
        });
    }

    function cleanupAbbreviatedName(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s+([,.;:])/g, '$1')
            .trim();
    }

    function escapeRegularExpression(text) {
        return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Text in die Zwischenablage kopieren
    function copyTextToClipboard(text) {
        if (!text) return;

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text)
                .then(function () {
                    console.log('Marker-Name in Zwischenablage kopiert:', text);
                })
                .catch(function (error) {
                    console.error('Kopieren in die Zwischenablage fehlgeschlagen:', error);
                    fallbackCopyTextToClipboard(text);
                });
        } else {
            fallbackCopyTextToClipboard(text);
        }
    }

    // Fallback für Browser/Umgebungen ohne navigator.clipboard
    function fallbackCopyTextToClipboard(text) {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            console.log('Marker-Name in Zwischenablage kopiert:', text);
        } catch (error) {
            console.error('Kopieren in die Zwischenablage fehlgeschlagen:', error);
        }

        document.body.removeChild(textArea);
    }

    function incrementRequestCounter() {
        requestCounter++;
        localStorage.setItem('requestCounter', requestCounter);
    }

    function resetRequestCounter() {
        requestCounter = 0;
        lastResetTime = Date.now();
        localStorage.setItem('requestCounter', requestCounter);
        localStorage.setItem('lastResetTime', lastResetTime);
    }

})();
