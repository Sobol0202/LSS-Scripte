(async () => {
  const allowedTypes = [47, 48, 49, 54, 62, 71, 77, 78, 108, 116, 117, 119, 142, 164, 169, 170];

  console.log("🔄 Fahrzeuge werden geladen...");
  const response = await fetch('/api/vehicles');
  const vehicles = await response.json();
  const matchingVehicles = vehicles.filter(v => allowedTypes.includes(v.vehicle_type));
  console.log(`✅ ${matchingVehicles.length} Fahrzeuge gefunden.`);

  async function updateVehicle(vehicleId) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = `/vehicles/${vehicleId}/edit`;

      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          const select = doc.querySelector('#vehicle_vehicle_mode');
          const form = doc.querySelector('form[action*="/vehicles/"]');

          if (!select) {
            console.warn(`⚠️ Dropdown nicht gefunden bei Fahrzeug ${vehicleId}`);
          } else {
            console.log(`➡️ Fahrzeug ${vehicleId}: Aktueller Modus: ${select.value}`);
            if (select.value !== '3') {
              select.value = '3';
              select.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`🟢 Modus auf "Zur Wache schicken" geändert`);
            } else {
              console.log(`ℹ️ Modus war bereits korrekt`);
            }
          }

          if (form) {
            console.log(`📨 Formular wird abgeschickt für Fahrzeug ${vehicleId}`);
            form.submit();
          } else {
            console.warn(`❌ Formular nicht gefunden bei Fahrzeug ${vehicleId}`);
          }

        } catch (err) {
          console.error(`❌ Fehler bei Fahrzeug ${vehicleId}:`, err);
        }

        setTimeout(() => {
          iframe.remove();
          resolve();
        }, 2000);
      };

      document.body.appendChild(iframe);
    });
  }

  for (const vehicle of matchingVehicles) {
    console.log(`\n🚚 Bearbeite Fahrzeug ${vehicle.id}`);
    await updateVehicle(vehicle.id);
  }

  console.log("✅ Alle Fahrzeuge wurden verarbeitet.");
})();

//Ihr könnt nach Hause geht, ihr könnte nach Hause gehn
