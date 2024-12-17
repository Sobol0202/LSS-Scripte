// Funktion zum Laden des Inhalts der Indexdatei
async function loadIndexFile(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error('Fehler beim Laden der Indexdatei:', error);
    return null;
  }
}

// Funktion zum Extrahieren der POI-IDs aus dem Indextext
function extractPOIIds(indexText) {
  const regex = /"id":(\d+),.*?"icon_path":"https:\/\/www\.leitstellenspiel\.de\/images\/letter_p\.png"/g;
  const poiIDs = [];
  let match;
  while ((match = regex.exec(indexText)) !== null) {
    poiIDs.push(parseInt(match[1]));
  }
  return poiIDs;
}

// Funktion zum Löschen eines einzelnen POIs
async function deletePOI(poiID, authToken) {
  const url = `https://www.leitstellenspiel.de/mission_positions/${poiID}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': authToken
      }
    });
    if (response.ok) {
      console.log(`POI mit ID ${poiID} erfolgreich gelöscht.`);
    } else {
      console.error(`Fehler beim Löschen des POIs mit ID ${poiID}.`);
    }
  } catch (error) {
    console.error(`Fehler beim Löschen des POIs mit ID ${poiID}:`, error);
  }
}

// Hauptfunktion, um den Prozess zu steuern
async function main() {
  // URL zur Indexdatei der Website
  const indexURL = 'https://www.leitstellenspiel.de/';

  // Laden des Inhalts der Indexdatei
  const indexText = await loadIndexFile(indexURL);
  if (!indexText) {
    console.error('Fehler beim Laden des Indexinhalts.');
    return;
  }

  // Extrahieren der POI-IDs
  const poiIDs = extractPOIIds(indexText);

  // Ausgabe der extrahierten IDs
  console.log('Extrahierte POI-IDs:', poiIDs);

  // Ermitteln des Sessiontokens
  const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  if (!authToken) {
    console.error('Sessiontoken nicht gefunden.');
    return;
  }

  // Sicherheitsabfrage vor dem Löschen der POIs
  const confirmation = window.confirm(`Achtung. Du bist dabei ${poiIDs.length} POIs zu löschen! Willst du wirklich fortfahren?`);
  if (!confirmation) {
    console.log('Vorgang abgebrochen.');
    return;
  }

  // Löschen aller POIs nacheinander mit 100ms Verzögerung zwischen jedem
  for (const poiID of poiIDs) {
    await deletePOI(poiID, authToken);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Aufruf der Hauptfunktion
main();
