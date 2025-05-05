(() => {
    const delay = (ms) => new Promise(res => setTimeout(res, ms));
    const pattern = /Feuerwache/; // Namens-Muster hier anpassen

    // Dateiinput und Button erstellen
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';

    const button = document.createElement('button');
    button.innerText = "Bild für Gebäude hochladen";
    button.style.position = 'fixed';
    button.style.top = '20px';
    button.style.left = '20px';
    button.style.zIndex = 10000;
    button.style.padding = '10px';
    button.style.backgroundColor = '#28a745';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    document.body.appendChild(fileInput);
    document.body.appendChild(button);

    button.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) {
            alert("Keine Datei ausgewählt.");
            return;
        }

        button.innerText = "Verarbeite Gebäude...";
        button.disabled = true;

        const response = await fetch("https://www.leitstellenspiel.de/api/buildings");
        const buildings = await response.json();
        const filtered = buildings.filter(b => pattern.test(b.caption));

        console.log(`Gefundene passende Gebäude: ${filtered.length}`);

        for (const building of filtered) {
            console.log(`Bearbeite Gebäude: ${building.caption} (ID: ${building.id})`);
            try {
                const editUrl = `https://www.leitstellenspiel.de/buildings/${building.id}/edit`;
                const page = await fetch(editUrl, { credentials: 'include' });
                const html = await page.text();
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                const form = doc.querySelector('form[action*="/buildings/"]');
                if (!form) continue;

                const formData = new FormData(form);
                formData.set("building[image]", file);

                const action = form.getAttribute('action');
                const postUrl = action.startsWith('http') ? action : `https://www.leitstellenspiel.de${action}`;

                await fetch(postUrl, {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                console.log(`✅ Bild hochgeladen: ${building.caption}`);
            } catch (e) {
                console.error(`❌ Fehler bei Gebäude ID ${building.id}:`, e);
            }

            await delay(100);
        }

        alert("Fertig! Alle passenden Gebäude wurden aktualisiert.");
        button.innerText = "Fertig ✅";
    });
})();
