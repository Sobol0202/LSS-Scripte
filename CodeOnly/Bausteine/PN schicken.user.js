// Authentifizierungstoken (CSRF-Token) abrufen
const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

if (authToken) {
  // Neue Konstante für die URL
  const messageUrl = "https://www.leitstellenspiel.de/messages/new?target=MissSobol";

  // Nachrichteninformationen
  const recipients = "Username";
  const subject = "Testnachricht";
  const messageBody = "Dies ist ein Test";

  // POST-Anfrage an die URL senden
  fetch(messageUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "X-CSRF-Token": authToken, // Füge den CSRF-Token zum Header hinzu
    },
    body: new URLSearchParams({
      "message[recipients]": recipients,
      "message[subject]": subject,
      "message[body]": messageBody,
      utf8: "✓",
    }).toString(),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Nachricht erfolgreich gesendet!");
      } else {
        console.error("Fehler beim Senden der Nachricht.");
      }
    })
    .catch((error) => {
      console.error("Ein Fehler ist aufgetreten:", error);
    });
} else {
  console.error("CSRF-Token nicht gefunden.");
}
