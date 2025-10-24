const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

if (!authToken) {
  console.error("Kein CSRF-Token gefunden!");
} else {
  fetch("https://www.leitstellenspiel.de/tasks/index", {
    method: "GET",
    headers: {
      "X-CSRF-Token": authToken,
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    },
    credentials: "include"
  })
  .then(response => {
    if (!response.ok) throw new Error(`Fehler: ${response.status}`);
    return response.text();
  })
  .then(htmlText => {
    // HTML in ein temporäres DOM-Element einfügen
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Alle task_panel-Elemente auswählen
    const taskPanels = doc.querySelectorAll('.task_panel');

    if (taskPanels.length === 0) {
      console.log("Keine task_panel-Elemente gefunden.");
      return;
    }

    // Jedes task_panel einzeln in der Konsole anzeigen
    taskPanels.forEach((panel, index) => {
      console.group(`Task Panel ${index + 1}`);
      console.log(panel.innerText.trim());
      console.groupEnd();
    });
  })
  .catch(err => console.error("Fehler bei der Anfrage:", err));
}
