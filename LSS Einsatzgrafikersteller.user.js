// ==UserScript==
// @name         LSS Einsatzgrafikersteller
// @version      1.0
// @description  Erzeugt automatisch die Einsatzgrafik und lädt diese nach Klick hoch
// @author       Sobol
// @match        https://www.leitstellenspiel.de/mission_graphics/*/mission_graphic_images/*/edit
// @grant        GM_xmlhttpRequest
// @connect      www.leitstellenspiel.de
// ==/UserScript==

(function () {
    'use strict';

    const match = window.location.pathname.match(/mission_graphic_images\/(\d+)\/edit/);
    if (!match || match.length < 2) return;
    const einsatzId = match[1];
    const einsatzUrl = `https://www.leitstellenspiel.de/einsaetze/${einsatzId}`;

    function extractFromHelpPage(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tableContainer = doc.querySelector('.col-md-4');
        if (!tableContainer) return { credits: 'Nicht gefunden', einsatzart: 'Nicht gefunden' };

        let credits = 'Nicht gefunden';
        let einsatzart = 'Nicht gefunden';

        const rows = tableContainer.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const label = cells[0]?.innerText.trim();
            const value = cells[1]?.innerText.trim();

            if (label === 'Credits im Durchschnitt') credits = value;
            if (label === 'Einsatzart') einsatzart = value.replace(/\s+/g, ' ').trim();
        });

        return { credits, einsatzart };
    }

    function getFillColor(einsatzart) {
        if (einsatzart.includes("Polizei")) return "#cce5ff";
        if (einsatzart.includes("Feuerwehr")) return "#ffcccc";
        if (einsatzart.includes("Rettung")) return "#ffcc33";
        return "#ffffff";
    }

    function getLevelFromCredits(credits) {
        const numericCredits = parseInt(credits.replace(/\D/g, '')) || 0;
        if (numericCredits <= 1000) return 1;
        if (numericCredits <= 2000) return 2;
        return Math.floor((numericCredits) / 1000);
    }


    function createSVGString(level, fillColor, strokeColor) {
        return `
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <circle cx="50" cy="50" r="40" fill="${fillColor}" stroke="${strokeColor}" stroke-width="10"/>
  <text x="50%" y="54%" text-anchor="middle" font-size="48" fill="black" dominant-baseline="middle" font-family="Arial, sans-serif">${level}</text>
</svg>`;
    }


    function svgToPngBlob(svgText, size = 30) {
        return new Promise((resolve) => {
            const img = new Image();
            const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, size, size);
                canvas.toBlob(blob => {
                    resolve(blob);
                    URL.revokeObjectURL(url);
                }, 'image/png');
            };
            img.src = url;
        });
    }

    async function uploadPNGsToInputs(credits, einsatzart) {
        const fillColor = getFillColor(einsatzart);
        const level = getLevelFromCredits(credits);

        const inputs = {
            green: {
                input: document.querySelector("#mission_graphic_image_green_image"),
                color: "#28a745" // Bootstrap Green
            },
            yellow: {
                input: document.querySelector("#mission_graphic_image_yellow_image"),
                color: "#ffc107" // Bootstrap Yellow
            },
            red: {
                input: document.querySelector("#mission_graphic_image_red_image"),
                color: "#dc3545" // Bootstrap Red
            }
        };

        for (const [key, { input, color }] of Object.entries(inputs)) {
            if (!input) continue;

            const svg = createSVGString(level, fillColor, color);
            const pngBlob = await svgToPngBlob(svg, 30);
            const file = new File([pngBlob], `auto_${key}.png`, { type: "image/png" });

            // Neue DataTransfer-Instanz pro Input
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;

            input.dispatchEvent(new Event('change', {
                bubbles: true,
                composed: true
            }));

            //console.log(`[AutoUpload] ${key} Bild gesetzt & getriggert`);
        }
    }


    GM_xmlhttpRequest({
        method: "GET",
        url: einsatzUrl,
        onload: function (response) {
            const html = response.responseText;
            const { credits, einsatzart } = extractFromHelpPage(html);

            //console.log(`[LSS Script] Extrahiert: Credits=${credits}, Einsatzart=${einsatzart}`);

            const infoBox = document.createElement('div');
            infoBox.style.border = '2px solid #007bff';
            infoBox.style.padding = '10px';
            infoBox.style.margin = '15px 0';
            infoBox.style.borderRadius = '8px';
            infoBox.style.backgroundColor = '#e9f5ff';

            const previewSvg = createSVGString(getLevelFromCredits(credits), getFillColor(einsatzart), '#dc3545');
            const svgBlob = new Blob([previewSvg], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const img = document.createElement('img');
            img.src = svgUrl;
            img.width = 50;
            img.height = 50;

            infoBox.innerHTML = `
                <strong>Einsatzhilfe:</strong><br>
                <b>Credits im Durchschnitt:</b> ${credits}<br>
                <b>Einsatzart:</b> ${einsatzart}<br>
            `;
            infoBox.appendChild(img);

            const uploadBtn = document.createElement('button');
            uploadBtn.textContent = "Auto-Bilder hochladen";
            uploadBtn.className = "btn btn-primary";
            uploadBtn.style.marginTop = "10px";
            uploadBtn.addEventListener('click', function(event) {
                event.preventDefault();
                uploadPNGsToInputs(credits, einsatzart);
            });

            infoBox.appendChild(uploadBtn);

            const form = document.querySelector('form') || document.body;
            form.prepend(infoBox);
        },
        onerror: function (err) {
            console.error('[LSS Script] Fehler beim Laden der Einsatzseite:', err);
        }
    });
})();
