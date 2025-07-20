(async () => {
    console.log("[LSS Memberbuildings CSV Export] Starte Export...");

    // ================================
    const WAIT_TIME = 100;
    const LIMIT_USERS = null;  // z.B. Anzahl User zum Testen oder null für alle
    // ================================

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    async function fetchAllianceInfo() {
        console.log("[LSS Memberbuildings CSV Export] Lade Verbandsinfo...");
        const response = await fetch('https://www.leitstellenspiel.de/api/allianceinfo');
        if (!response.ok) {
            console.error("[LSS Memberbuildings CSV Export] Fehler beim Abrufen der Verbandsinfo:", response.status);
            throw new Error("Fehler beim Abrufen der Verbandsinfo");
        }
        const json = await response.json();
        console.log(`[LSS Memberbuildings CSV Export] ${json.users.length} Mitglieder gefunden.`);
        return json.users;
    }

    async function fetchUserProfile(userId) {
        console.log(`[LSS Memberbuildings CSV Export] Lade Profil für User ${userId}...`);
        const response = await fetch(`https://www.leitstellenspiel.de/profile/${userId}`);
        if (!response.ok) {
            console.error(`[LSS Memberbuildings CSV Export] Fehler beim Abrufen Profil ${userId}:`, response.status);
            throw new Error(`Profil ${userId} nicht abrufbar`);
        }
        return await response.text();
    }

    function extractBuildings(html, userId) {
        const regex = /buildingMarkerAddSingle\((\{.*?\})\);/g;
        const buildings = [];
        let match;
        while ((match = regex.exec(html)) !== null) {
            try {
                const building = JSON.parse(match[1]);
                buildings.push(building);
            } catch (e) {
                console.error(`[LSS Memberbuildings CSV Export] Fehler beim Parsen bei User ${userId}:`, e, match[1]);
            }
        }
        console.log(`[LSS Memberbuildings CSV Export] ${buildings.length} Gebäude bei User ${userId} gefunden.`);
        return buildings;
    }

    function convertToCSV(buildings) {
        const header = ["Name", "Building_Type", "Longitude", "Latitude", "ID", "User_ID"];
        const rows = [header];
        for (const b of buildings) {
            rows.push([
                `"${b.name.replace(/"/g, '""')}"`,
                b.building_type,
                b.longitude,
                b.latitude,
                b.id,
                b.user_id
            ]);
        }
        return rows.map(r => r.join(";")).join("\n");
    }

    async function run() {
        try {
            const users = await fetchAllianceInfo();

            const allBuildings = [];
            let count = 0;

            for (const user of users) {
                if (LIMIT_USERS && count >= LIMIT_USERS) {
                    console.log(`[LSS CSV Export] Testlimit ${LIMIT_USERS} erreicht.`);
                    break;
                }

                try {
                    const html = await fetchUserProfile(user.id);
                    const buildings = extractBuildings(html, user.id);
                    allBuildings.push(...buildings);
                } catch (e) {
                    console.error(`[LSS CSV Export] Fehler bei User ${user.id}:`, e);
                }

                count++;
                await sleep(WAIT_TIME);
            }

            console.log(`[LSS CSV Export] Gesamt Gebäude: ${allBuildings.length}`);
            const csv = convertToCSV(allBuildings);

            // CSV als Datei zum Download anbieten
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `LSS_Gebaeude_Export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log("[LSS CSV Export] Download abgeschlossen.");
            alert(`[LSS Memberbuildings CSV Export] Fertig! ${allBuildings.length} Gebäude exportiert.`);
        } catch (e) {
            console.error("[LSS Memberbuildings CSV Export] Fehler:", e);
            alert(`[LSS Memberbuildings CSV Export] Abbruch mit Fehler. Siehe Konsole.`);
        }
    }

    await run();
})();
