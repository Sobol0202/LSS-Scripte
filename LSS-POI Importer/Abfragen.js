//Autowerkstatt
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["shop"="car_repair"](area.searchArea);
out body;
>;
out skel qt;

//Autobahnabfahrt/-auffahrt
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["haighway"="motorway_junction"](area.searchArea);
out body;
>;
out skel qt;

//Bahnhof
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["railway"="station"](area.searchArea);
out body;
>;
out skel qt;

//Bahnübergang
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["railway"="level_crossing"](area.searchArea);
out body;
>;
out skel qt;

//Bank
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="bank"](area.searchArea);
out body;
>;
out skel qt;

//Baumarkt
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["shop"="doityourself"](area.searchArea);
out body;
>;
out skel qt;

//Biogasanlage
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["generator:source"="biomass"](area.searchArea);
out body;
>;
out skel qt;

//Brücke
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["man_made"="bridge"](area.searchArea);
out body;
>;
out skel qt;

//Bushaltestelle
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["highway"="bus_stop"](area.searchArea);
out body;
>;
out skel qt;

//Campingplatz
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["tourism"="camp_site"](area.searchArea);
out body;
>;
out skel qt;

//Disco
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="nightclub"](area.searchArea);
out body;
>;
out skel qt;

//Einkaufszentrum
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["shop"="mall"](area.searchArea);
out body;
>;
out skel qt;

//Landebahn
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["aeroway"="runway"](area.searchArea);
out body;
>;
out skel qt;

//Kirche
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="place_of_worship"](area.searchArea);
out body;
>;
out skel qt;

//Klärwerk
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["man_made"="wastewater_plant"](area.searchArea);
out body;
>;
out skel qt;

//Kraftwerk
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["power"="plant"](area.searchArea);
out body;
>;
out skel qt;

//Krankenhaus
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="hospital"](area.searchArea);
out body;
>;
out skel qt;

//Lagerhalle
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["building"="warehouse"](area.searchArea);
out body;
>;
out skel qt;

//Moor
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["wetland"="bog"](area.searchArea);
out body;
>;
out skel qt;

//Museum
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["tourism"="museum"](area.searchArea);
out body;
>;
out skel qt;

//Möbelhaus
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["shop"="furniture"](area.searchArea);
out body;
>;
out skel qt;

//Park
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["leisure"="park"](area.searchArea);
out body;
>;
out skel qt;

//Schule
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="school"](area.searchArea);
out body;
>;
out skel qt;

//Schwimmbad
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["leisure"="swimming_pool"](area.searchArea);
out body;
>;
out skel qt;

//Stadion
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["leisure"="stadium"](area.searchArea);
out body;
>;
out skel qt;

//Straßenbahnhaltestelle
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["railway"="tram_stop"](area.searchArea);
out body;
>;
out skel qt;

//Supermarkt
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["shop"="supermarket"](area.searchArea);
out body;
>;
out skel qt;

//Tankstelle
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="fuel"](area.searchArea);
out body;
>;
out skel qt;

//Theater
[out:json][timeout:45];
area["name"="Sachsen"]->.searchArea;
nwr["amenity"="theatre"](area.searchArea);
out body;
>;
out skel qt;




//Deutschlandweit
[out:json][timeout:25];
area["ISO3166-1"="DE"][admin_level=2]->.searchArea;
(
  nwr["___"="____"](area.searchArea);
);
out body;
>;
out skel qt;
