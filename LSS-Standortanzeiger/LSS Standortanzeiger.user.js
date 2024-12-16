// ==UserScript==
// @name         Standortanzeiger
// @namespace    https://github.com/Glaeydar/LSS_Scripts/Standortanzeiger.user.js
// @version      0.91
// @description  Zeigt die Standorte von Wachen an
// @author       Glaeydar -edit by MissSobol
// @match        https://www.leitstellenspiel.de/
// @require      https://github.com/tyrasd/osmtogeojson/raw/gh-pages/osmtogeojson.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Konfigurationsvariablen für das Ein-/Ausschalten der Dropdown-Menüs
    var enableMainDropdown = true; // Gebäude-Dropdown einschalten
    var enableAdditionalDropdown = false; // POI-Dropdown einschalten

    var scriptEnabled = false;
    var poiLayer;
    var selectedPOIType = null; // Default: POIs aus
    var selectedAdditionalPOIType = null; // Neues Dropdown für zusätzliche POIs
    var requestToken = 0; // Hinzugefügte Token-Variable

    // Zähler und Zeitpunkt des letzten Resets im Local Storage
    var requestCounter = parseInt(localStorage.getItem('requestCounter')) || 0;
    var lastResetTime = parseInt(localStorage.getItem('lastResetTime')) || 0;

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

        return dropdown;
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
        { label: "Biogasanlage", value: "man_made=biogas_plant" },
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

    ];

    // Dropdowns zur Karte hinzufügen
    var leafletControl = document.querySelector('.leaflet-control-attribution');

    // Haupt-Dropdown erstellen und hinzufügen, falls aktiviert
    if (enableMainDropdown) {
        var mainDropdown = createDropdown(primaryPOITypes, function () {
            selectedPOIType = mainDropdown.value;
            scriptEnabled = selectedPOIType !== "" || selectedAdditionalPOIType !== ""; // Aktualisierte Überprüfung
            updatePOI();
        });
        leafletControl.appendChild(mainDropdown);
    }

    // Zusatz-Dropdown erstellen und hinzufügen, falls aktiviert
    if (enableAdditionalDropdown) {
        var additionalDropdown = createDropdown(additionalPOITypes, function () {
            selectedAdditionalPOIType = additionalDropdown.value;
            scriptEnabled = selectedPOIType !== "" || selectedAdditionalPOIType !== ""; // Aktualisierte Überprüfung
            updatePOI();
        });
        leafletControl.appendChild(additionalDropdown);
    }

    // Event-Listener direkt hinzufügen und entfernen
    map.on('zoomend moveend', updatePOI);

    function enableScript() {
        scriptEnabled = true;
        //console.log("Script aktiviert");
        updatePOI();
    }

    function disableScript() {
        if (scriptEnabled) {
            scriptEnabled = false;
            //console.log("Script deaktiviert");
            clearPOILayer();
            requestToken++; // Erhöhe das Token, um die ausstehenden Anfragen abzubrechen
        }
    }

    function updatePOI() {
        //console.log("Update POI: scriptEnabled =", scriptEnabled, ", selectedPOIType =", selectedPOIType, ", selectedAdditionalPOIType =", selectedAdditionalPOIType);

        var currentToken = requestToken; // Speichere das aktuelle Token

        if (scriptEnabled && (selectedPOIType !== null && selectedPOIType !== "" || selectedAdditionalPOIType !== null && selectedAdditionalPOIType !== "")) {
            if (requestCounter < 10000) {
                clearPOILayer();
                if (selectedPOIType !== "") {
                    loadPOI(selectedPOIType, currentToken);
                }
                if (selectedAdditionalPOIType !== "") {
                    loadPOI(selectedAdditionalPOIType, currentToken); // Zusätzliche POIs laden
                }
            } else {
                console.log("Maximale Anfragenanzahl erreicht. Bitte warten Sie bis zum nächsten Tag.");
            }
        } else {
            clearPOILayer();
        }
    }

    function clearPOILayer() {
        if (poiLayer) {
            map.removeLayer(poiLayer);
            //console.log("POI-Layer entfernt");
        }
    }

    function loadPOI(type, currentToken) {
        // Überprüfe, ob das Token übereinstimmt und die Option nicht "POIs aus" ist, bevor die POIs hinzugefügt werden
        if (currentToken === requestToken && type !== null && type !== "" && scriptEnabled) {
            console.log("loading data");

            incrementRequestCounter();

            let overpassApiUrl = buildOverpassApiUrl(map, type);

            $.get(overpassApiUrl, function (osmDataAsXml) {
                // Überprüfe, ob das Token übereinstimmt, bevor die POIs hinzugefügt werden
                if (currentToken === requestToken) {
                    var resultAsGeojson = osmtogeojson(osmDataAsXml);
                    poiLayer = L.geoJson(resultAsGeojson, {
                        pointToLayer: function (feature, latlng) {
                            var icon = L.icon({
                                iconUrl: 'https://www.svgrepo.com/show/302636/map-marker.svg',
                                iconSize: [50, 50], // Größe des Icons in Pixeln
                                iconAnchor: [25, 50], // Ankerpunkt des Icons, hier mitte unten
                                popupAnchor: [0, -25] // Popup-Ankerpunkt: Verschiebt das Popup relativ zum Ankerpunkt des Icons
                            });

                            return L.marker(latlng, { icon: icon });
                        },
                        filter: function (feature, layer) {
                            var isPolygon = (feature.geometry) && (feature.geometry.type !== undefined) && (feature.geometry.type === "Polygon");
                            if (isPolygon) {
                                feature.geometry.type = "Point";
                                var polygonCenter = L.latLngBounds(feature.geometry.coordinates[0]).getCenter();
                                feature.geometry.coordinates = [polygonCenter.lat, polygonCenter.lng];
                            }
                            return true;
                        }
                    }).addTo(map);
                    console.log("finish loading");
                }
            });
        }
    }

    function buildOverpassApiUrl(map, overpassQuery) {
        var bounds = map.getBounds().getSouth() + ',' + map.getBounds().getWest() + ',' + map.getBounds().getNorth() + ',' + map.getBounds().getEast();
        var nodeQuery = 'node[' + overpassQuery + '](' + bounds + ');';
        var wayQuery = 'way[' + overpassQuery + '](' + bounds + ');';
        var relationQuery = 'relation[' + overpassQuery + '](' + bounds + ');';
        var query = '?data=[out:xml][timeout:25];(' + nodeQuery + wayQuery + relationQuery + ');out body;>;out skel qt;';
        var baseUrl = 'https://overpass-api.de/api/interpreter';
        var resultUrl = baseUrl + query;
        return resultUrl;
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

    // Initial setup
    disableScript();

})();
