fetch('https://www.leitstellenspiel.de/api/buildings')
  .then(response => {
    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Daten');
    }
    return response.json();
  })
  .then(data => {
    // Zählt die Anzahl der Gebäude pro building_type
    const buildingTypeCounts = data.reduce((counts, building) => {
      counts[building.building_type] = (counts[building.building_type] || 0) + 1;
      return counts;
    }, {});

    // Ausgabe der Ergebnisse
    console.log('Anzahl der Gebäude nach building_type:');
    for (const [type, count] of Object.entries(buildingTypeCounts)) {
      console.log(`building_type ${type}: ${count}`);
    }
  })
  .catch(error => {
    console.error('Es ist ein Fehler aufgetreten:', error);
  });
