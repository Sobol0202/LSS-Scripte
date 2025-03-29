async function fetchAllianceBuildings() {
    const response = await fetch("https://www.leitstellenspiel.de/api/alliance_buildings");
    const buildings = await response.json();
    
    let csvContent = "Name;Type;Latitude;Longitude\n";
    
    buildings.forEach(building => {
        const name = building.caption;
        const type = building.building_type;
        const lat = building.latitude.toString().replace(".", ",");
        const lon = building.longitude.toString().replace(".", ",");
        
        csvContent += `${name};${type};${lat};${lon}\n`;
    });
    
    console.log(csvContent);
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "buildings.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

fetchAllianceBuildings();


// https://www.geoapify.com/tools/reverse-geocoding-online/
