// ==UserScript==
// @name         LSS Täglicher Bericht
// @namespace    http://tampermonkey.net/
// @version      0.91
// @description  Sendet täglichen Schulungsstatus, Gebäude-Erweiterungen, Lagerräume und Spezialisierungen per PN
// @author       Sobol (Inspiriert von L0rd_Enki)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function() {
    'use strict';

    const BASE_URL = "https://www.leitstellenspiel.de";
    const SCHOOLINGS_URL = BASE_URL + "/schoolings";
    const BUILDINGS_URL = BASE_URL + "/api/buildings";
    const REPORT_INTERVAL = 24 * 60 * 60 * 1000;
    const LAST_REPORT_KEY = 'LSS_LAST_REPORT_TIMESTAMP';

    function getAuthToken() {
        return document.querySelector('meta[name="csrf-token"]')?.content;
    }

    function shouldSendReport() {
        const lastSent = GM_getValue(LAST_REPORT_KEY, 0);
        const now = Date.now();
        return (now - lastSent) >= REPORT_INTERVAL;
    }

    function updateLastReportTime() {
        GM_setValue(LAST_REPORT_KEY, Date.now());
    }

    function getCurrentDate() {
        return new Date().toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    function formatDate(date, withTime = false) {
        try {
            if (!(date instanceof Date) || isNaN(date)) return 'Ungültiges Datum';

            return date.toLocaleDateString('de-DE', {
                timeZone: 'Europe/Berlin',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                ...(withTime && {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZoneName: 'short'
                })
            });
        } catch(e) {
            return 'Ungültiges Datum';
        }
    }

    async function fetchData(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                onload: (response) => response.status === 200
                    ? resolve(response.responseText)
                    : reject(`Status ${response.status}`),
                onerror: () => reject('Netzwerkfehler')
            });
        });
    }

    async function getSchoolings() {
        try {
            const html = await fetchData(SCHOOLINGS_URL);
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            return Array.from(doc.querySelectorAll("table.table-striped tbody tr")).map(row => {
                const cols = row.querySelectorAll("td");
                const durationSeconds = Number(cols[1].getAttribute("sortvalue"));
                const endDate = new Date(Date.now() + (durationSeconds * 1000));

                return {
                    name: cols[0].textContent.trim(),
                    endDate: formatDate(endDate, true),
                    organizer: cols[2].querySelector("a")?.textContent.trim() || cols[2].textContent.trim(),
                    url: BASE_URL + cols[0].querySelector("a").pathname
                };
            });
        } catch (error) {
            console.error("Fehler beim Parsen der Schulungsdaten:", error);
            return [];
        }
    }

    async function getBuildings() {
        try {
            return JSON.parse(await fetchData(BUILDINGS_URL));
        } catch (error) {
            console.error("Fehler beim Abrufen der Gebäude-Daten:", error);
            return [];
        }
    }

    function processTimedItems(buildings, itemType) {
        let result = [];
        const now = new Date();

        buildings.forEach(building => {
            const items = {
                'extension': building.extensions,
                'storage': building.storage_upgrades,
                'specialization': building.specialization ? [building.specialization] : []
            }[itemType] || [];

            items.forEach(item => {
                if (!item.available_at) return;

                const availableAt = new Date(item.available_at);
                if (availableAt > now) {
                    result.push({
                        name: building.caption,
                        item: item.caption || item.upgrade_type,
                        enddate: formatDate(availableAt)
                    });
                }
            });
        });

        return result;
    }

    function parseDate(dateString) {
        const regex = /(\d{2})\.(\d{2})\.(\d{4}), (\d{2}):(\d{2})/;
        const match = dateString.match(regex);
        if (!match) return new Date(NaN);
        const [_, day, month, year, hour, minute] = match;
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:00+01:00`);
    }

    function sortByEndDate(items) {
        return items.sort((a, b) => parseDate(a.endDate) - parseDate(b.endDate));
    }

    async function sendStatusReport() {
        if (!shouldSendReport()) {
            console.log('Bericht wurde bereits innerhalb der letzten 24h versendet');
            return;
        }

        const authToken = getAuthToken();
        if (!authToken) {
            console.error("Kein CSRF-Token!");
            return;
        }

        try {
            const [schoolings, buildings] = await Promise.all([getSchoolings(), getBuildings()]);
            const currentDate = getCurrentDate();
            const subject = `Statusbericht vom ${currentDate}`;

            let messageBody = `📊 Statusbericht vom ${currentDate}\n\n`;

            // Schulungen
            messageBody += "### 🎓 Schulungen:\n\n";
            const sortedSchoolings = sortByEndDate(schoolings);
            sortedSchoolings.forEach(s => messageBody += `🔹 ${s.name} (Ende: ${s.endDate})\n`);
            if (sortedSchoolings.length === 0) messageBody += "❌ Keine aktiven Schulungen\n";

            // Gebäude-Erweiterungen
            const extensions = sortByEndDate(processTimedItems(buildings, 'extension'));
            messageBody += "\n### 🏢 Gebäude-Erweiterungen:\n\n";
            extensions.forEach(e => messageBody += `- ${e.name}: ${e.item} (Fertig am: ${e.date})\n`);
            if (extensions.length === 0) messageBody += "Heute keine Einträge vorhanden.\n";

            // Lagerräume
            const storages = sortByEndDate(processTimedItems(buildings, 'storage'));
            messageBody += "\n### 📦 Lagerräume:\n\n";
            storages.forEach(s => messageBody += `- ${s.name}: ${s.item} (Fertig am: ${s.date})\n`);
            if (storages.length === 0) messageBody += "Heute keine Einträge vorhanden.\n";

            // Spezialisierungen
            const specializations = sortByEndDate(processTimedItems(buildings, 'specialization'));
            messageBody += "\n### 🔧 Spezialisierungen:\n\n";
            specializations.forEach(s => messageBody += `- ${s.name}: ${s.item} (Fertig am: ${s.date})\n`);
            if (specializations.length === 0) messageBody += "Heute keine Einträge vorhanden.\n";

            // Nachricht senden
            fetch(`${BASE_URL}/api/credits`)
                .then(response => response.json())
                .then(creditsData => {
                    const recipients = creditsData.user_name;
                    const messageData = {
                        "message[recipients]": recipients,
                        "message[subject]": subject,
                        "message[body]": messageBody,
                        "utf8": "✓",
                        "authenticity_token": authToken,
                        "commit": "Nachricht absenden"
                    };

                    fetch(`${BASE_URL}/messages`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        },
                        body: new URLSearchParams(messageData).toString(),
                    }).then(response => {
                        if (response.redirected && response.url.includes('/messages')) {
                            console.log("Nachricht erfolgreich versendet!");
                            updateLastReportTime();
                        } else {
                            console.error("Fehler beim Versand:", response.status);
                        }
                    }).catch(error => console.error("Netzwerkfehler:", error));
                })
                .catch(error => console.error("Fehler bei Credits-API:", error));

        } catch (error) {
            console.error("Gesamtfehler:", error);
        }
    }

    window.addEventListener('load', () => {
        setTimeout(() => sendStatusReport(), 5000);
    });
})();
