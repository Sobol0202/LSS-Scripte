// ==UserScript==
// @name         LSS POI Importer
// @version      1.0
// @description  Ermöglicht es GPX-Dateien als POIs zu importieren
// @author       Sobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_getResourceURL
// @resource     icon https://raw.githubusercontent.com/Sobol0202/LSS-Scripte/refs/heads/main/LSS-POI%20Importer/icons8-punktobjekte-64.png
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  //POI-Typ-Mapping
  const POI_TYPES = [
    { id: 15, name: 'Auto-Werkstatt', tag: 'shop=car_repair' },
    { id: 16, name: 'Autobahnauf.- / abfahrt', tag: 'highway=motorway_junction'},
    { id: 41, name: 'Automobilindustrie', tag: 'industrial=automotive' },
    { id: 7, name: 'Bahnhof (Regional und Fernverkehr)', tag: 'railway=station' },
    { id: 6, name: 'Bahnhof (Regionalverkehr)', tag: 'railway=station' },
    { id: 24, name: 'Bahnübergang', tag: 'railway=level_crossing' },
    { id: 37, name: 'Bank', tag: 'amenity=bank' },
    { id: 21, name: 'Bauernhof', tag: 'landuse=farm' },
    { id: 28, name: 'Baumarkt', tag: 'shop=doityourself' },
    { id: 36, name: 'Biogasanlage', tag: 'generator:source=biomass' },
    { id: 58, name: 'Brücke', tag: 'man_made=bridge' },
    { id: 4, name: 'Bushaltestelle', tag: 'highway=bus_stop' },
    { id: 22, name: 'Bürokomplex', tag: 'office=business' },
    { id: 50, name: 'Campingplatz', tag: 'tourism=camp_site' },
    { id: 39, name: 'Chemiepark', tag: 'landuse=industrial' },
    { id: 19, name: 'Diskothek', tag: 'amenity=nightclub' },
    { id: 14, name: 'Einkaufszentrum', tag: 'shop=mall' },
    { id: 60, name: 'Eisenbahntunnel', tag: 'railway=subway' },
    { id: 43, name: 'Eishalle', tag: 'leisure=ice_rink' },
    { id: 26, name: 'Festplatz', tag: 'leisure=common' },
    { id: 35, name: 'Flughafen (groß): Parkhaus', tag: '' },
    { id: 32, name: 'Flughafen (groß): Start-/Landebahn', tag: 'aeroway=runway' },
    { id: 33, name: 'Flughafen (groß): Terminal', tag: 'aeroway=terminal' },
    { id: 34, name: 'Flughafen (groß): Vorfeld / Standplätze', tag: 'aeroway=apron' },
    { id: 31, name: 'Flughafen (klein): Flugzeug Standplatz', tag: 'aeroway=apron' },
    { id: 30, name: 'Flughafen (klein): Gebäude', tag: 'aeroway=terminal' },
    { id: 29, name: 'Flughafen (klein): Start-/Landebahn', tag: 'aeroway=runway' },
    { id: 27, name: 'Fluss', tag: 'waterway=river' },
    { id: 8, name: 'Güterbahnhof', tag: 'railway=station' },
    { id: 44, name: 'Holzverarbeitung', tag: 'industrial=wood' },
    { id: 54, name: 'Hüttenwerk', tag: 'industrial=metal' },
    { id: 40, name: 'Industrie-Allgemein', tag: 'landuse=industrial' },
    { id: 48, name: 'Innenstadt', tag: 'place=city_centre' },
    { id: 38, name: 'Kirche', tag: 'amenity=place_of_worship' },
    { id: 47, name: 'Klärwerk', tag: 'man_made=wastewater_plant' },
    { id: 62, name: 'Kohlekraftwerk', tag: 'plant:source=coal' },
    { id: 51, name: 'Kompostieranlage', tag: 'man_made=composting' },
    { id: 55, name: 'Kraftwerk', tag: 'power=plant' },
    { id: 2, name: 'Krankenhaus', tag: 'amenity=hospital' },
    { id: 18, name: 'Lagerhalle', tag: 'building=warehouse' },
    { id: 53, name: 'Moor', tag: 'wetland=bog' },
    { id: 45, name: 'Motorsportanlage', tag: 'leisure=track' },
    { id: 13, name: 'Museum', tag: 'tourism=museum' },
    { id: 49, name: 'Möbelhaus', tag: 'shop=furniture' },
    { id: 42, name: 'Müllverbrennungsanlage', tag: 'man_made=incinerator' },
    { id: 0, name: 'Park', tag: 'leisure=park' },
    { id: 12, name: 'Schule', tag: 'amenity=school' },
    { id: 23, name: 'Schwimmbad', tag: 'leisure=swimming_pool' },
    { id: 1, name: 'See', tag: 'natural=water' },
    { id: 57, name: 'Seilbahn', tag: 'aerialway=cable_car' },
    { id: 20, name: 'Stadion', tag: 'leisure=stadium' },
    { id: 5, name: 'Straßenbahnhaltestelle', tag: 'railway=tram_stop' },
    { id: 10, name: 'Supermarkt (Groß)', tag: 'shop=supermarket' },
    { id: 9, name: 'Supermarkt (Klein)', tag: 'shop=supermarket' },
    { id: 11, name: 'Tankstelle', tag: 'amenity=fuel' },
    { id: 52, name: 'Textilverarbeitung', tag: 'industrial=textile' },
    { id: 25, name: 'Theater', tag: 'amenity=theatre' },
    { id: 46, name: 'Tunnel', tag: 'highway=tunnel' },
    { id: 59, name: 'U-Bahn Station', tag: 'station=subway' },
    { id: 3, name: 'Wald', tag: 'landuse=forest' },
    { id: 17, name: 'Weihnachtsmarkt', tag: 'chrismas=yes' },
    { id: 56, name: 'Werksgelände', tag: 'landuse=industrial' },
    { id: 61, name: 'Zoo', tag: 'tourism=zoo' },
  ];

  //Hilfsfunktion zur Berechnung des Mittelpunkts
  function calculateCentroid(trkpts) {
    let latSum = 0, lonSum = 0;
    const n = trkpts.length;
    if (n === 0) return null;
    for (const pt of trkpts) {
      latSum += parseFloat(pt.getAttribute('lat'));
      lonSum += parseFloat(pt.getAttribute('lon'));
    }
    return {
      lat: (latSum / n).toFixed(6),
      lon: (lonSum / n).toFixed(6),
    };
  }

  //UI Trigger erstellen
  const triggerLi = document.createElement('li');
  const triggerA = document.createElement('a');
  const triggerImg = document.createElement('img');
  triggerImg.src = GM_getResourceURL('icon');
  triggerImg.width = 24;
  triggerImg.height = 24;
  triggerA.href = '#';
  triggerA.append(triggerImg, '\xa0POI Importer');
  triggerLi.append(triggerA);

  triggerLi.addEventListener('click', (event) => {
    event.preventDefault();
    createModal();
  });

  //Trigger im Menü einfügen (vor Divider)
  document.querySelector('#menu_profile + .dropdown-menu > li.divider')?.before(triggerLi);

  let gpxWaypoints = [];
  let abortImport = false;

  function createModal() {
    //Modal erstellen
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.background = '#fff';
    modal.style.padding = '20px';
    modal.style.zIndex = '10000';
    modal.style.borderRadius = '8px';
    modal.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    modal.style.minWidth = '300px';

    const poiSelect = document.createElement('select');
    poiSelect.className = 'form-control';
    POI_TYPES.forEach((poi) => {
      const opt = document.createElement('option');
      opt.value = poi.id;
      opt.textContent = poi.tag ? `${poi.name} (${poi.tag})` : poi.name;
      poiSelect.append(opt);
    });

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.gpx';
    fileInput.className = 'form-control mt-2';

    const importBtn = document.createElement('button');
    importBtn.textContent = 'POIs setzen (0)';
    importBtn.disabled = true;
    importBtn.className = 'btn btn-success';

    const overpassBtn = document.createElement('button');
    overpassBtn.textContent = 'Overpass öffnen';
    overpassBtn.className = 'btn btn-info';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.className = 'btn btn-danger';

    const progress = document.createElement('progress');
    progress.max = 100;
    progress.value = 0;
    progress.style.width = '100%';
    progress.style.marginTop = '10px';

    //GPX Datei laden und parsen
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;

      const text = await file.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');

      //Namespace für GPX 1.1 beachten
      const GPX_NS = "http://www.topografix.com/GPX/1/1";

      //Einzelne Wegpunkte aus <wpt>
      const wpts = Array.from(xml.getElementsByTagNameNS(GPX_NS, 'wpt')).map(wpt => ({
        lat: wpt.getAttribute('lat'),
        lon: wpt.getAttribute('lon'),
      }));

      //Mittelpunkte der Track-Segmente (<trkseg>, darin <trkpt>) berechnen
      const centroidPts = [];
      const trksegs = xml.getElementsByTagNameNS(GPX_NS, 'trkseg');
      for (const seg of trksegs) {
        const trkpts = Array.from(seg.getElementsByTagNameNS(GPX_NS, 'trkpt'));
        if (trkpts.length > 0) {
          const centroid = calculateCentroid(trkpts);
          if (centroid) centroidPts.push(centroid);
        }
      }

      //Zusammenführen aller POIs
      gpxWaypoints = wpts.concat(centroidPts);

      //UI aktualisieren
      importBtn.textContent = `POIs setzen (${gpxWaypoints.length})`;
      importBtn.disabled = gpxWaypoints.length === 0;
      progress.value = 0;
    });

    //Import starten
    importBtn.addEventListener('click', async () => {
      abortImport = false;
      importBtn.disabled = true;
      cancelBtn.disabled = true;
      const poiType = poiSelect.value;

      //Hole CSRF-Token
      const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      for (let i = 0; i < gpxWaypoints.length; i++) {
        if (abortImport) {
          alert('Import abgebrochen.');
          importBtn.disabled = false;
          cancelBtn.disabled = false;
          return;
        }

        const wp = gpxWaypoints[i];
        const formData = new URLSearchParams();
        formData.append('utf8', '✓');
        formData.append('mission_position[poi_type]', poiType);
        formData.append('mission_position[latitude]', wp.lat);
        formData.append('mission_position[longitude]', wp.lon);
        formData.append('commit', 'Speichern');

        try {
          const response = await fetch('https://www.leitstellenspiel.de/mission_positions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-CSRF-Token': authToken,
            },
            body: formData.toString(),
          });
          if (!response.ok) {
            console.error('Fehler beim Import von POI:', response.status, await response.text());
            alert(`Fehler beim Import eines POIs (Index ${i}). Siehe Konsole.`);
            break;
          }
        } catch (e) {
          console.error('Fetch-Fehler:', e);
          alert('Fehler beim Import. Siehe Konsole.');
          break;
        }

        progress.value = ((i + 1) / gpxWaypoints.length) * 100;
        await new Promise(r => setTimeout(r, 100));
      }

      location.reload();
    });

    overpassBtn.addEventListener('click', () => {
      window.open('https://overpass-turbo.eu/', '_blank');
    });

    cancelBtn.addEventListener('click', () => {
      abortImport = true;
      modal.remove();
    });

    const buttonWrapper = document.createElement('div');
    buttonWrapper.style.display = 'flex';
    buttonWrapper.style.justifyContent = 'space-between';
    buttonWrapper.style.gap = '10px';
    buttonWrapper.style.marginTop = '10px';
    buttonWrapper.append(importBtn, overpassBtn, cancelBtn);

    modal.append(poiSelect, fileInput, buttonWrapper, progress);
    document.body.append(modal);
  }
})();
