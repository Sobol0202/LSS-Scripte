(async function() {
    const startId = 3103766; // Anfangs-ID
    const maxConsecutiveErrors = 200; // Maximale aufeinanderfolgende Fehler, bevor das Skript abbricht
    const baseUrl = "https://www.leitstellenspiel.de/profile/";
    const delay = 100;
    
    // CSRF-Token
    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!authToken) {
        console.error('CSRF token not found. Aborting script.'); // Abbruch, wenn CSRF-Token nicht gefunden wird
        return;
    }

    let consecutiveErrors = 0; // Zähler für aufeinanderfolgende Fehler
    
    // Liste von Wörtern, die im Benutzerprofil Warnungen auslösen sollen
    const filterWords = ['Registriert', 'Reg', 'Registrierung', 'Start', 'Spielstart', 'Anfang', 'Anwärter', 'Begonnen'];

    // Funktion zum Warten für eine bestimmte Zeit
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Funktion zur Überprüfung, ob ein Text ein bestimmtes Filterwort enthält
function containsFilterWord(text, filterWords) {
    const lowerCaseText = text.toLowerCase();
    return filterWords.some(word => lowerCaseText.includes(word.toLowerCase()));
}

    // Funktion zur Ausgabe mit Warnungsüberprüfung
    function outputWithWarningCheck(userId, username, profileText, profileImage) {
        const containsWarning = containsFilterWord(username, filterWords) || 
                                containsFilterWord(profileText, filterWords) || 
                                containsFilterWord(profileImage, filterWords);

        if (containsWarning) {
            console.warn(`https://www.leitstellenspiel.de/profile/${userId}, ${username}, ${profileText}, ${profileImage}`);
        } else {
            console.log(`https://www.leitstellenspiel.de/profile/${userId}, ${username}, ${profileText}, ${profileImage}`);
        }
    }

    let lastSuccessfulId = startId; // Variable zur Speicherung der letzten erfolgreich abgefragten ID

    // Schleife zum Durchlaufen der Benutzer-IDs
    for (let userId = startId; consecutiveErrors < maxConsecutiveErrors; userId++) {
        try {
            // Anfrage an die Benutzerprofil-Seite senden
            const response = await fetch(`${baseUrl}${userId}`, {
                headers: {
                    'X-CSRF-Token': authToken
                }
            });

            // Überprüfen, ob der Benutzer nicht gefunden wurde (404)
            if (response.status === 404) {
                console.log(`User-ID ${userId} not found (404). Skipping...`);
                consecutiveErrors++;
                await sleep(delay);
                continue;
            }

            // Antworttext parsen und als HTML-Dokument laden
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // Benutzerinfo-Div-Element finden
            const userInfoDiv = doc.getElementById('userinfo');
            
            // Überprüfen, ob Benutzerprofil (depricated)
            if (!userInfoDiv) {
                console.log(`User-ID ${userId} structure mismatch. Skipping...`);
                consecutiveErrors++;
                await sleep(delay);
                continue;
            }
            
            // Benutzername aus dem H1-Element des Benutzerinfo-Divs extrahieren
            const usernameElement = userInfoDiv.querySelector('h1');
            const username = usernameElement ? usernameElement.textContent.trim() : 'Unknown User';

            let profileText = 'No profile text';
            let profileImage = 'No profile image';

            // Profiltext und Profilbild aus dem Profiltext-Foto-Div extrahieren
            const profileTextPhotoDiv = doc.getElementById('profile_text_photo');
            if (profileTextPhotoDiv) {
                const profileTextElement = profileTextPhotoDiv.querySelector('p');
                profileText = profileTextElement ? profileTextElement.innerText.trim() : 'No profile text';
                
                const profileImageElement = profileTextPhotoDiv.querySelector('img');
                profileImage = profileImageElement ? profileImageElement.src.split('/').pop() : 'No profile image';
            }

            // Ergebnis ausgeben und Warnungen überprüfen
            outputWithWarningCheck(userId, username, profileText, profileImage);
            consecutiveErrors = 0; // Bei Erfolg auf 0 zurücksetzen
            lastSuccessfulId = userId; // Letzte erfolgreiche ID aktualisieren
        } catch (error) {
            console.log(`Error fetching User-ID ${userId}:`, error);
            consecutiveErrors++;
        }

        await sleep(delay);
    }
    
    // Skript wird beendet, wenn zu viele aufeinanderfolgende Fehler auftreten
    console.log(`Script terminated due to too many consecutive errors. Last successful ID: ${lastSuccessfulId}`);
})();
