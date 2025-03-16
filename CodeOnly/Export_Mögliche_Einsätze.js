fetch("https://www.leitstellenspiel.de/einsaetze.json")
  .then(response => response.json())
  .then(data => {
    // Alle möglichen Schlüssel für requirements, prerequisites und mission_categories sammeln
    const allRequirements = new Set();
    const allPrerequisites = new Set();
    const allCategories = new Set();
    
    data.forEach(mission => {
      Object.keys(mission.requirements || {}).forEach(req => allRequirements.add(req));
      Object.keys(mission.prerequisites || {}).forEach(pre => allPrerequisites.add(pre));
      (mission.mission_categories || []).forEach(cat => allCategories.add(cat));
    });
    
    const requirementKeys = Array.from(allRequirements).sort();
    const prerequisiteKeys = Array.from(allPrerequisites).sort();
    const categoryKeys = Array.from(allCategories).sort();
    
    // CSV Header mit Kategorien
    let csvContent = [
      ["id", "name", "average_credits", ...requirementKeys.map(() => "requirement"), ...prerequisiteKeys.map(() => "prerequisite"), ...categoryKeys.map(() => "category")].join(";"),
      ["id", "name", "average_credits", ...requirementKeys, ...prerequisiteKeys, ...categoryKeys].join(";")
    ];
    
    // Datenzeilen füllen
    data.forEach(mission => {
      const row = [
        mission.id,
        `"${mission.name}"`,
        mission.average_credits,
        ...requirementKeys.map(key => mission.requirements?.[key] || 0),
        ...prerequisiteKeys.map(key => mission.prerequisites?.[key] || 0),
        ...categoryKeys.map(key => (mission.mission_categories?.includes(key) ? 1 : 0))
      ];
      csvContent.push(row.join(";"));
    });
    
    // CSV-Datei mit UTF-8 BOM erstellen und herunterladen
    const csvBlob = new Blob(["﻿" + csvContent.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(csvBlob);
    link.download = "einsatzdaten.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  })
  .catch(error => console.error("Fehler beim Abrufen der Einsätze:", error));
