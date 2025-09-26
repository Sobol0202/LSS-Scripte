(async () => {
  try {
    // Fahrzeuge abrufen
    const response = await fetch("https://www.leitstellenspiel.de/api/vehicles");
    const vehicles = await response.json();

    // Eindeutige IDs sicherstellen
    const uniqueVehicles = Array.from(new Map(vehicles.map(v => [v.id, v])).values());

    console.log(`Insgesamt ${uniqueVehicles.length} Fahrzeuge gefunden. Starte Reset der Fahrzeugbilder...`);

    // Hilfsfunktion für Wartezeit
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < uniqueVehicles.length; i++) {
      const vehicle = uniqueVehicles[i];
      const url = `https://www.leitstellenspiel.de/vehicles/${vehicle.id}/image_delete`;

      try {
        await fetch(url, { method: "GET" });
        const percent = ((i + 1) / uniqueVehicles.length * 100).toFixed(1);
        console.log(`(${i + 1}/${uniqueVehicles.length}, ${percent}%) Bild von Fahrzeug ${vehicle.id} (${vehicle.caption || "Ohne Namen"}) zurückgesetzt.`);
      } catch (err) {
        console.error(`❌ Fehler bei Fahrzeug ${vehicle.id}:`, err);
      }

      // 100ms Pause bis zum nächsten Fahrzeug
      await sleep(100);
    }

    console.log("✅ Alle Fahrzeugbilder wurden zurückgesetzt!");
  } catch (err) {
    console.error("❌ Fehler beim Abrufen der Fahrzeuge:", err);
  }
})();
