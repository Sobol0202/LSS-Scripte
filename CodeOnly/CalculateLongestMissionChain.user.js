// Funktion, um die längste Ausbreitungskette zu finden
async function findLongestExpansionChain() {
    const url = 'https://www.leitstellenspiel.de/einsaetze.json';

    try {
        // Einsätze von der URL abrufen
        const response = await fetch(url);
        const data = await response.json();

        // Objekte nach IDs indizieren für schnellen Zugriff
        const missionsById = {};
        data.forEach(mission => {
            missionsById[mission.id] = mission;
        });

        // Funktion zur rekursiven Suche nach der längsten Kette
        function findChain(startId) {
            const mission = missionsById[startId];
            if (!mission) return [];

            let longestChain = [];

            // Überprüfen, ob es weitere Missionen gibt, zu denen sich diese ausbreiten kann
            if (mission.additional && mission.additional.expansion_missions_ids) {
                mission.additional.expansion_missions_ids.forEach(expansionId => {
                    const chain = findChain(expansionId);
                    if (chain.length > longestChain.length) {
                        longestChain = chain;
                    }
                });
            }

            // Aktuelle Mission zur Kette hinzufügen und zurückgeben
            return [startId, ...longestChain];
        }

        // Längste Kette für jede Mission finden und vergleichen
        let longestChain = [];
        data.forEach(mission => {
            const chain = findChain(mission.id);
            if (chain.length > longestChain.length) {
                longestChain = chain;
            }
        });

        // Ausgabe der längsten Kette
        console.log('Längste Ausbreitungskette (IDs):');
        longestChain.forEach((missionId, index) => {
            console.log(`${index + 1}. ${missionId}`);
        });

    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}

// Funktion aufrufen, um die längste Ausbreitungskette zu finden
findLongestExpansionChain();
