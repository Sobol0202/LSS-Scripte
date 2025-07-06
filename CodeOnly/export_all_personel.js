(async () => {
    // Benutzerdefinierte building_types eingeben
    let typesInput = prompt("Bitte BuildingTypes (durch Komma getrennt) eingeben, z.B.: 0,1,2");
    if (!typesInput) return;
    let buildingTypes = typesInput.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));

    // Fortschrittsanzeige im Browser
    const progressDiv = document.createElement('div');
    Object.assign(progressDiv.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#222',
        color: '#0f0',
        padding: '10px',
        zIndex: 9999,
        fontFamily: 'monospace',
        maxHeight: '90vh',
        overflowY: 'auto',
        whiteSpace: 'pre'
    });
    progressDiv.textContent = "Starte Download...";
    document.body.appendChild(progressDiv);

    function updateProgress(text) {
        progressDiv.textContent = text;
        console.log(text);
    }

    const sleep = ms => new Promise(res => setTimeout(res, ms));

    // Gebäude abrufen
    updateProgress("Lade Gebäudeliste...");
    const response = await fetch("https://www.leitstellenspiel.de/api/buildings");
    const allBuildings = await response.json();

    const selectedBuildings = allBuildings.filter(b => buildingTypes.includes(b.building_type));
    updateProgress(`Gefundene Gebäude: ${selectedBuildings.length}`);

    let csvLines = ["Name;Ausbildung;GebäudeID"];
    let count = 0;
    let totalEntries = 0;

    for (const building of selectedBuildings) {
        count++;
        const info = `(${count}/${selectedBuildings.length}) Lade Personal von Gebäude: ${building.caption} [ID: ${building.id}]`;
        updateProgress(info);

        try {
            const resp = await fetch(`https://www.leitstellenspiel.de/buildings/${building.id}/personals`);
            const htmlText = await resp.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const table = doc.querySelector("#personal_table");

            if (table) {
                const rows = table.querySelectorAll("tbody tr");
                if (rows.length === 0) {
                    console.log(`⚠️ Kein Personal in ${building.caption} [ID: ${building.id}]`);
                }
                for (const row of rows) {
                    const tds = row.querySelectorAll("td");
                    if (tds.length >= 2) {
                        const name = (tds[0].innerText.trim().replace(/;/g, ',')).replace(/\r?\n|\r/g, " ") || "";
                        const ausbildung = (tds[1].innerText.trim().replace(/;/g, ',')).replace(/\r?\n|\r/g, " ") || "";
                        csvLines.push(`${name};${ausbildung};${building.id}`);
                        totalEntries++;
                    }
                }
            } else {
                console.log(`⚠️ Keine Personaltabelle in ${building.caption} [ID: ${building.id}]`);
            }
        } catch (e) {
            console.error(`❌ Fehler bei ${building.caption} [ID: ${building.id}]`, e);
        }

        await sleep(100);
    }

    updateProgress(`Erstelle CSV mit ${totalEntries} Einträgen...`);

    const csvContent = "\uFEFF" + csvLines.join("\n"); // UTF-8 BOM für Excel
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = `leitstellenspiel_personal_export.csv`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    updateProgress(`✅ Fertig! CSV heruntergeladen mit ${totalEntries} Einträgen.`);
})();
