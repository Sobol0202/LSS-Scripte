// ==UserScript==
// @name         LSS AAO Export/Import
// @version      1.0
// @description  Ermöglicht ein echtes Exportieren und Importieren von AAOs
// @author       Sobol
// @match        https://www.leitstellenspiel.de/aaos
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Hilfsfunktionen
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));

    const getCategories = async () => {
        const res = await fetch("https://www.leitstellenspiel.de/api/v1/aao_categories");
        const data = await res.json();
        const idToName = {}, nameToId = {};
        Object.entries(data).forEach(([id, name]) => {
            idToName[parseInt(id)] = name;
            nameToId[name] = parseInt(id);
        });
        return { idToName, nameToId };
    };

    const authToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    // Buttons einfügen
    const targetLink = document.querySelector('a.btn.btn-xs.btn-danger[href="/aao/alle_loeschen"]');
    if (!targetLink) return;

    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Exportieren';
    exportBtn.className = 'btn btn-xs btn-success';
    exportBtn.style.marginLeft = '5px';

    const importBtn = document.createElement('button');
    importBtn.textContent = 'Importieren';
    importBtn.className = 'btn btn-xs btn-primary';
    importBtn.style.marginLeft = '5px';

    targetLink.insertAdjacentElement('afterend', importBtn);
    importBtn.insertAdjacentElement('afterend', exportBtn);

    // Exportfunktion
    exportBtn.onclick = async () => {
        const aaos = await fetch('https://www.leitstellenspiel.de/api/v1/aaos').then(res => res.json());
        const categories = await getCategories();

        const enriched = aaos.map(aao => ({
            ...aao,
            aao_category_name: categories.idToName[aao.aao_category_id] || 'Unbekannt'
        }));

        const blob = new Blob([JSON.stringify(enriched, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'aaos_export.json';
        a.click();
    };

    // Importfunktion
    importBtn.onclick = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const text = await file.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                alert("Ungültige JSON-Datei.");
                return;
            }

            const categories = await getCategories();

            const usedCategoryNames = new Set(data.map(aao => aao.aao_category_name));
            const missing = Array.from(usedCategoryNames).filter(name => !name || !categories.nameToId[name]);
            if (missing.length > 0) {
                alert(`Import abgebrochen. Die folgenden Kategorien fehlen:\n\n${missing.join('\n')}`);
                return;
            }

            const originalText = importBtn.textContent;

            for (let i = 0; i < data.length; i++) {
                const aao = data[i];

                importBtn.textContent = `Importiere ${i + 1} / ${data.length}`;
                //console.log(`\n[Import] AAO: ${aao.caption}`);

                const form = new URLSearchParams();
                form.append("utf8", "✓");
                form.append("authenticity_token", authToken);
                form.append("aao[caption]", aao.caption || '');
                form.append("aao[color]", aao.color || '');
                form.append("aao[text_color]", aao.text_color || '000000');
                form.append("aao[automatic_text_color]", aao.automatic_text_color ? "1" : "0");
                form.append("aao[column_number]", aao.column?.toString() || '');
                form.append("aao[aao_category_id]", categories.nameToId[aao.aao_category_name]);
                form.append("aao[hotkey]", aao.hotkey || '');
                form.append("aao[equipment_mode]", aao.vehicle_classes?.equipment_mode?.toString() || '0');
                form.append("aao[reset]", aao.reset ? "1" : "0");

                const keys = [];
                keys.forEach(k => form.append(`aao[${k}]`, "0"));

                if (aao.vehicle_classes) {
                    for (let [key, value] of Object.entries(aao.vehicle_classes)) {
                        if (key !== "equipment_mode") {
                            form.set(`aao[${key}]`, value.toString());
                        }
                    }
                }

                // Debug-Ausgabe für vehicle_types
                if (aao.vehicle_types) {
                    for (let [typeId, count] of Object.entries(aao.vehicle_types)) {
                        form.append(`vehicle_type_ids[${typeId}]`, count.toString());
                    }
                }


                // Gesamten Form-Inhalt loggen
                //console.log(`[Import] Gesendete Formulardaten:`);
                for (const [key, value] of form.entries()) {
                    //console.log(`  ${key} = ${value}`);
                }

                try {
                    const response = await fetch("https://www.leitstellenspiel.de/aaos", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-CSRF-Token": authToken
                        },
                        body: form
                    });

                    if (!response.ok) {
                        console.warn(`[Import] Fehlerhafte Antwort für "${aao.caption}":`, response.status);
                    } else {
                        //console.log(`[Import] Erfolgreich importiert: "${aao.caption}"`);
                    }
                } catch (err) {
                    console.error(`[Import] Fehler beim Senden für "${aao.caption}":`, err);
                }

                await sleep(100);
            }

            importBtn.textContent = originalText;
            alert("Import abgeschlossen.");
            location.reload();
        };
        input.click();
    };
})();
