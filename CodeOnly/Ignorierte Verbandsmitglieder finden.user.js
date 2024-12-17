// Funktion, um den Bannstatus eines Mitglieds zu überprüfen
async function checkBanStatus(memberId) {
    return new Promise(resolve => {
        // Verzögerung für die AGB
        setTimeout(async () => {
            // API-Anfrage an das Profil des Mitglieds senden
            const response = await fetch(`https://www.leitstellenspiel.de/profile/${memberId}`);
            // HTML-Text der Profilseite abrufen
            const htmlText = await response.text();
            // HTML-Text analysieren und parsen
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(htmlText, 'text/html');
            // Überprüfen, ob der "Nicht mehr ignorieren"-Button existiert
            const ignoreButton = htmlDoc.querySelector('a[href^="/ignoriert/entfernen/"]');

            // Wenn der Button existiert, das Mitglied ist ignoriert
            if (ignoreButton) {
                resolve(memberId);
            } else {
                resolve(null);
            }
        }, 100); // Verzögerung von 100ms zwischen den Anfragen
    });
}

// Funktion, um alle Mitglieder des Verbands zu überprüfen
async function checkAllMembers() {
    // API-Anfrage für Informationen zum Verband senden
    const response = await fetch('https://www.leitstellenspiel.de/api/allianceinfo');
    // JSON-Daten der API-Antwort abrufen
    const allianceInfo = await response.json();
    // Alle Mitglieder des Verbands aus den JSON-Daten extrahieren
    const members = allianceInfo.users;
    let foundIgnored = false; // Variable, um zu verfolgen, ob ein gebannter Benutzer gefunden wurde

    // Durchlaufen aller Mitglieder des Verbands
    for (let i = 0; i < members.length; i++) {
        const memberId = members[i].id;
        // Bannstatus jedes Mitglieds überprüfen
        const ignoredId = await checkBanStatus(memberId);
        // Wenn das Mitglied gebannt ist
        if (ignoredId !== null) {
            foundIgnored = true;
            // Profilnummer des gebannten Benutzers als Hyperlink ausgeben
            console.log(`Benutzer mit der ID "https://www.leitstellenspiel.de/profile/${ignoredId}" ist ignoriert.`);
        }
    }

    // Wenn kein gebannter Benutzer gefunden wurde
    if (!foundIgnored) {
        console.log("Keine gebannten Benutzer gefunden.");
    }
}

// Funktion aufrufen, um alle Mitglieder des Verbands zu überprüfen
checkAllMembers();
