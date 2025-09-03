fetch("https://www.leitstellenspiel.de/einsaetze.json")
  .then(res => res.json())
  .then(data => {
    // Zählt, wie viele Versionen es pro Einsatznamen gibt
    const counts = {};
    data.forEach(mission => {
      counts[mission.name] = (counts[mission.name] || 0) + 1;
    });

    // Finde den Einsatz mit den meisten Versionen
    let maxName = null;
    let maxCount = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxName = name;
        maxCount = count;
      }
    }

    console.log("Einsatz mit den meisten Versionen:");
    console.log(maxName, "-", maxCount, "Versionen");
  })
  .catch(err => console.error("Fehler beim Abrufen:", err));
