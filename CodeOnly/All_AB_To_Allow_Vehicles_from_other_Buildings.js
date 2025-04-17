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
          const checkbox = doc.querySelector('#vehicle_tractive_building_random');
          const form = doc.querySelector('form[action*="/vehicles/"]');

          if (!checkbox) {
            console.warn(`⚠️ Checkbox nicht gefunden bei Fahrzeug ${vehicleId}`);
          } else {
            console.log(`➡️ Fahrzeug ${vehicleId}: Checkbox-Status vor Änderung: ${checkbox.checked}`);
            if (!checkbox.checked) {
              checkbox.checked = true;
              checkbox.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`🟢 Checkbox aktiviert`);
            } else {
              console.log(`ℹ️ Checkbox war bereits gesetzt`);
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
