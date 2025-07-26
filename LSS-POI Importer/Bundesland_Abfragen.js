// Dependency installieren
// osmtogeojson (0.5.4)
let script1 = document.createElement("script");
script1.src = "https://unpkg.com/togpx@0.5.4/togpx.js";
document.head.appendChild(script1);

// togpx (0.6.0)
let script2 = document.createElement("script");
script2.src = "https://unpkg.com/osmtogeojson@3.0.0-beta.5/osmtogeojson.js";
document.head.appendChild(script2);


// Hauptscript
(async () => {
  const bundesland = "Berlin"; // <- Bundesland hier anpassen
  const queries = [
    ["Autowerkstatt", `nwr["shop"="car_repair"]`],
    ["Autobahnauffahrt", `nwr["highway"="motorway_junction"]`],
    ["Bahnhof", `nwr["railway"="station"]`],
    ["Bahnübergang", `nwr["railway"="level_crossing"]`],
    ["Bank", `nwr["amenity"="bank"]`],
    ["Baumarkt", `nwr["shop"="doityourself"]`],
    ["Biogasanlage", `nwr["generator:source"="biomass"]`],
    ["Bruecke", `nwr["man_made"="bridge"]`],
    ["Bushaltestelle", `nwr["highway"="bus_stop"]`],
    ["Campingplatz", `nwr["tourism"="camp_site"]`],
    ["Disco", `nwr["amenity"="nightclub"]`],
    ["Einkaufszentrum", `nwr["shop"="mall"]`],
    ["Landebahn", `nwr["aeroway"="runway"]`],
    ["Kirche", `nwr["amenity"="place_of_worship"]`],
    ["Klaerwerk", `nwr["man_made"="wastewater_plant"]`],
    ["Kraftwerk", `nwr["power"="plant"]`],
    ["Krankenhaus", `nwr["amenity"="hospital"]`],
    ["Lagerhalle", `nwr["building"="warehouse"]`],
    ["Moor", `nwr["wetland"="bog"]`],
    ["Museum", `nwr["tourism"="museum"]`],
    ["Moebelhaus", `nwr["shop"="furniture"]`],
    ["Park", `nwr["leisure"="park"]`],
    ["Schule", `nwr["amenity"="school"]`],
    ["Schwimmbad", `nwr["leisure"="swimming_pool"]`],
    ["Stadion", `nwr["leisure"="stadium"]`],
    ["Strassenbahnhaltestelle", `nwr["railway"="tram_stop"]`],
    ["Supermarkt", `nwr["shop"="supermarket"]`],
    ["Tankstelle", `nwr["amenity"="fuel"]`],
    ["Theater", `nwr["amenity"="theatre"]`],
  ];

  const baseQuery = (filter) => `
[out:json][timeout:45];
area["name"="${bundesland}"]->.searchArea;
${filter}(area.searchArea);
out body;
>;
out skel qt;`;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  for (const [name, filter] of queries) {
    const query = baseQuery(filter);
    console.log(`⏳ Abfrage für ${name} wird gesendet...`);

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query
    });

    const data = await response.json();

    const geojson = osmtogeojson(data);
    const gpx = togpx(geojson, { creator: "OverpassTurboBatch" });

    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}_${bundesland}.gpx`;
    a.click();

    console.log(`✅ ${name}.gpx wurde heruntergeladen.`);
    await sleep(1500); // etwas Verzögerung für Serverentlastung
  }
})();
