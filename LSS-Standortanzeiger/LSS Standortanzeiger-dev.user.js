// ==UserScript==
// @name         Standortanzeiger
// @namespace    https://github.com/Glaeydar/LSS_Scripts/Standortanzeiger.user.js
// @version      0.6dev
// @description  Zeigt die Standorte von Wachen an
// @author       Glaeydar -edit by MissSobol
// @match        https://www.leitstellenspiel.de/
// @require      https://github.com/tyrasd/osmtogeojson/raw/gh-pages/osmtogeojson.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    var scriptEnabled = false;
    var poiLayer;
    var selectedPOIType = null; // Default: POIs aus
    var requestToken = 0; // Hinzugefügte Token-Variable

    // Zähler und Zeitpunkt des letzten Resets im Local Storage
    var requestCounter = parseInt(localStorage.getItem('requestCounter')) || 0;
    var lastResetTime = parseInt(localStorage.getItem('lastResetTime')) || 0;

    // Überprüfen, ob ein Reset erforderlich ist (mehr als 24 Stunden vergangen)
    if (Date.now() - lastResetTime > 24 * 60 * 60 * 1000) {
        resetRequestCounter();
    }

    // Dropdown-Menü erstellen
    var dropdown = document.createElement('select');
    dropdown.style.padding = '2px';
    dropdown.style.cursor = 'pointer';
    dropdown.style.border = 'none';
    dropdown.style.background = '#3498db';
    dropdown.style.color = '#fff';
    dropdown.style.borderRadius = '0px';

    var poiTypes = [
        { label: "POIs aus", value: null },
        { label: "FW POIs", value: "amenity=fire_station" },
        { label: "RW POIs", value: "emergency=ambulance_station" },
        { label: "Pol POIs", value: "amenity=police" },
        { label: "THW POIs", value: "emergency_service=technical" }
    ];

    poiTypes.forEach(function (poi) {
        var option = document.createElement('option');
        option.value = poi.value;
        option.text = poi.label;
        dropdown.add(option);
    });

    dropdown.addEventListener('change', function () {
        selectedPOIType = dropdown.value;
        scriptEnabled = selectedPOIType === null ? false : selectedPOIType !== "" && selectedPOIType !== "POIs aus"; // Aktualisierte Überprüfung
        updatePOI();
    });

    // Steuerungsbutton einfügen
    var leafletControl = document.querySelector('.leaflet-control-attribution');
    leafletControl.appendChild(dropdown);

    // Event-Listener direkt hinzufügen und entfernen
    map.on('zoomend moveend', updatePOI);

    function enableScript() {
        scriptEnabled = true;
        console.log("Script aktiviert");
        updatePOI();
    }

    function disableScript() {
        if (scriptEnabled) {
            scriptEnabled = false;
            console.log("Script deaktiviert");
            clearPOILayer();
            requestToken++; // Erhöhe das Token, um die ausstehenden Anfragen abzubrechen
        }
    }

    function updatePOI() {
        console.log("Update POI: scriptEnabled =", scriptEnabled, ", selectedPOIType =", selectedPOIType);

        var currentToken = requestToken; // Speichere das aktuelle Token

        if (scriptEnabled && selectedPOIType !== null && selectedPOIType !== "") {
            if (requestCounter < 10000) {
                clearPOILayer();
                loadPOI(selectedPOIType, currentToken);
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
            console.log("POI-Layer entfernt");
        }
    }

    function loadPOI(type, currentToken) {
        // Überprüfe, ob das Token übereinstimmt und die Option nicht "POIs aus" ist, bevor die POIs hinzugefügt werden
        if (currentToken === requestToken && type !== null && scriptEnabled) {
            console.log("loading data");

            incrementRequestCounter();

            let overpassApiUrl = buildOverpassApiUrl(map, type);

            $.get(overpassApiUrl, function (osmDataAsXml) {
                // Überprüfe, ob das Token übereinstimmt, bevor die POIs hinzugefügt werden
                if (currentToken === requestToken) {
                    var resultAsGeojson = osmtogeojson(osmDataAsXml);
                    poiLayer = L.geoJson(resultAsGeojson, {
                        style: function (feature) {
                            return { color: "#ff0000" };
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
