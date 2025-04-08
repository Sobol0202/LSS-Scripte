// ==UserScript==
// @name         LSS Patientenanalyse
// @version      1.1
// @description  Analyse für NEF, Heli, Transport je Patientenanzahl
// @author       Sobol
// @match        https://www.leitstellenspiel.de/einsaetze
// @grant        GM.setValue
// @grant        GM.getValue
// @require      https://cdn.jsdelivr.net/npm/chart.js
// ==/UserScript==

(function () {
  'use strict';

  // Schlüssel für die Speicherung im lokalen Speicher
  const STORAGE_KEY = 'einsatzAnalyseVerlauf';

  // Schwellenwerte für Patientenanzahl
  const thresholds = [10, 20, 30, 50, 100, 101];

  // Darstellungstexte für die Schwellen
  const thresholdLabels = { 10: "10", 20: "20", 30: "30", 50: "50", 100: "100", 101: ">100" };

  // UI-Elemente erzeugen und ins DOM einfügen
  const createUI = () => {
    const missionTable = document.getElementById('possible_missions_table');
    if (!missionTable) return;

    const container = document.createElement('div');
    container.style.marginTop = '20px';

    // Analyse starten Button
    const button = document.createElement('button');
    button.textContent = 'Analyse starten (Verlauf)';
    button.className = 'btn btn-default';
    button.style.marginRight = '10px';

    // CSV-Export Button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'CSV Export';
    exportBtn.className = 'btn btn-default';
    exportBtn.style.marginRight = '10px';

    // Dropdown für Schwellenwert
    const select = document.createElement('select');
    select.className = 'form-control';
    select.style.width = '150px';
    select.style.display = 'inline-block';
    select.style.marginRight = '10px';

    thresholds.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = `${thresholdLabels[t]} Patienten`;
      select.appendChild(opt);
    });

    // Checkbox für Maximalwert-Umschaltung
    const checkboxLabel = document.createElement('label');
    checkboxLabel.style.marginLeft = '10px';
    checkboxLabel.style.userSelect = 'none';
    checkboxLabel.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.marginRight = '5px';
    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(document.createTextNode('Maximal Anforderung'));

    // Diagramm-Container
    const chartContainer = document.createElement('div');
    chartContainer.id = 'einsatz-analyse-chart';
    chartContainer.style.marginTop = '30px';
    chartContainer.style.maxWidth = '1000px';

    const canvas = document.createElement('canvas');
    canvas.id = 'chartCanvas';
    chartContainer.appendChild(canvas);

    // Tabelle für aktuelle Analysewerte
    const tableContainer = document.createElement('div');
    tableContainer.id = 'wertetabelle';
    tableContainer.style.marginTop = '20px';
    tableContainer.style.maxWidth = '500px';

    // Alles zusammenfügen
    container.appendChild(button);
    container.appendChild(exportBtn);
    container.appendChild(select);
    container.appendChild(checkboxLabel);
    container.appendChild(chartContainer);
    container.appendChild(tableContainer);
    missionTable.parentNode.insertBefore(container, missionTable.nextSibling);

    return { button, exportBtn, select, checkbox };
  };

  // Holt Einsatzdaten von der JSON-API
  const fetchData = async () => {
    const res = await fetch('https://www.leitstellenspiel.de/einsaetze.json');
    return res.json();
  };

  // Führt die Analyse der Einsatzdaten durch
  const analyse = (missions) => {
    const result = {};

    // Initialisiert die Struktur je Schwellenwert
    for (let threshold of thresholds) {
      result[threshold] = {
        totalMissions: 0,
        avg: { nef: 0, helicopter: 0, transport: 0 },
        max: { nef: 0, helicopter: 0, transport: 0 }
      };
    }

    // Geht alle Einsätze durch
    missions.forEach(m => {
      const patients = m?.additional?.possible_patient;
      const chances = m?.chances;
      if (!patients || !chances) return;

      // Weist Einsätze der passenden Schwelle zu
      for (let threshold of thresholds) {
        if ((threshold === 101 && patients > 100) || (threshold !== 101 && patients === threshold)) {
          const nef = (patients * (chances.nef || 0)) / 100;
          const heli = (patients * (chances.helicopter || 0)) / 100;
          const transport = (patients * (chances.patient_transport || 0)) / 100;

          const t = result[threshold];
          t.totalMissions++;
          t.avg.nef += nef;
          t.avg.helicopter += heli;
          t.avg.transport += transport;

          // Maximalwerte merken
          t.max.nef = Math.max(t.max.nef, nef);
          t.max.helicopter = Math.max(t.max.helicopter, heli);
          t.max.transport = Math.max(t.max.transport, transport);
        }
      }
    });

    return result;
  };

  // Speichert Analyseergebnis mit Zeitstempel und gibt Gesamthistorie zurück
  const saveAndRender = async (result) => {
    const timestamp = new Date().toISOString();
    const old = await GM.getValue(STORAGE_KEY, []);
    old.push({ timestamp, result });
    await GM.setValue(STORAGE_KEY, old);
    return old;
  };

  // Zeichnet das Diagramm für die gewählte Schwelle
  const renderChart = (dataSeries, selectedThreshold, showMax = false) => {
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    const labels = dataSeries.map(e => new Date(e.timestamp).toLocaleString('de-DE'));
    const key = showMax ? 'max' : 'avg';

    const values = {
      nef: dataSeries.map(e => {
        const v = e.result[selectedThreshold];
        return ((key === 'avg' ? v.avg.nef : v.max.nef) / (key === 'avg' ? v.totalMissions || 1 : 1)).toFixed(2);
      }),
      transport: dataSeries.map(e => {
        const v = e.result[selectedThreshold];
        return ((key === 'avg' ? v.avg.transport : v.max.transport) / (key === 'avg' ? v.totalMissions || 1 : 1)).toFixed(2);
      }),
      helicopter: dataSeries.map(e => {
        const v = e.result[selectedThreshold];
        return ((key === 'avg' ? v.avg.helicopter : v.max.helicopter) / (key === 'avg' ? v.totalMissions || 1 : 1)).toFixed(2);
      }),
    };

    // Vorheriges Diagramm entfernen
    if (window.timelineChart) window.timelineChart.destroy();

    // Neues Diagramm erzeugen
    window.timelineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${showMax ? 'Max' : 'Ø'} NEF`,
            data: values.nef,
            borderColor: 'rgb(255, 99, 132)',
            fill: false,
            tension: 0.2
          },
          {
            label: `${showMax ? 'Max' : 'Ø'} Transport`,
            data: values.transport,
            borderColor: 'rgb(54, 162, 235)',
            fill: false,
            tension: 0.2
          },
          {
            label: `${showMax ? 'Max' : 'Ø'} Helikopter`,
            data: values.helicopter,
            borderColor: 'rgb(255, 206, 86)',
            fill: false,
            tension: 0.2
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${showMax ? 'Maximale' : 'Durchschnittliche'} Anforderungen bei ${thresholdLabels[selectedThreshold]} Patienten`
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Anzahl' }
          },
          x: {
            title: { display: true, text: 'Zeitpunkt' }
          }
        }
      }
    });

    renderTable(dataSeries[dataSeries.length - 1], selectedThreshold);
  };

  // Aktuelle Analysewerte in Tabellenform darstellen
  const renderTable = (latest, threshold) => {
    const container = document.getElementById('wertetabelle');
    const data = latest.result[threshold];
    const format = (val, count = 1) => (val / (count || 1)).toFixed(2);

    container.innerHTML = `
      <h4>Letzte Analyse für ${thresholdLabels[threshold]} Patienten (${new Date(latest.timestamp).toLocaleString('de-DE')})</h4>
      <table class="table table-striped table-bordered">
        <thead>
          <tr>
            <th>Typ</th><th>Ø</th><th>Max</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>NEF</td><td>${format(data.avg.nef, data.totalMissions)}</td><td>${data.max.nef.toFixed(2)}</td></tr>
          <tr><td>Transport</td><td>${format(data.avg.transport, data.totalMissions)}</td><td>${data.max.transport.toFixed(2)}</td></tr>
          <tr><td>Helikopter</td><td>${format(data.avg.helicopter, data.totalMissions)}</td><td>${data.max.helicopter.toFixed(2)}</td></tr>
        </tbody>
      </table>
    `;
  };

  // CSV-Datei mit Verlaufsdaten generieren und herunterladen
  const exportToCSV = async () => {
    const data = await GM.getValue(STORAGE_KEY, []);
    if (!data.length) return alert('Keine Verlaufsdaten zum Exportieren.');

    const separator = ';';
    const headers = ['Zeitpunkt', 'Patientenschwelle', 'Ø NEF', 'Max NEF', 'Ø Transport', 'Max Transport', 'Ø Heli', 'Max Heli'];
    const csvRows = [headers.join(separator)];

    // Durch alle gespeicherten Zeitpunkte iterieren
    data.forEach(entry => {
      const timestamp = new Date(entry.timestamp).toLocaleString('de-DE');
      thresholds.forEach(thresh => {
        const res = entry.result[thresh];
        if (!res.totalMissions) return;

        const avgDiv = res.totalMissions || 1;
        const row = [
          timestamp,
          thresholdLabels[thresh],
          (res.avg.nef / avgDiv).toFixed(2),
          res.max.nef.toFixed(2),
          (res.avg.transport / avgDiv).toFixed(2),
          res.max.transport.toFixed(2),
          (res.avg.helicopter / avgDiv).toFixed(2),
          res.max.helicopter.toFixed(2)
        ];
        csvRows.push(row.join(separator));
      });
    });

    // Datei erzeugen und herunterladen
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `einsatz_analyse_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // UI-Elemente auslesen
  const { button, exportBtn, select, checkbox } = createUI();

  // Aktualisiert das Diagramm bei Auswahlwechsel
  const updateChart = async () => {
    const data = await GM.getValue(STORAGE_KEY, []);
    const selectedThreshold = parseInt(select.value);
    renderChart(data, selectedThreshold, checkbox.checked);
  };

  // Bei Klick auf "Analyse starten"
  button.addEventListener('click', async () => {
    button.disabled = true;
    button.textContent = 'Analysiere...';

    const missions = await fetchData();
    const result = analyse(missions);
    const allData = await saveAndRender(result);

    renderChart(allData, parseInt(select.value), checkbox.checked);
    button.disabled = false;
    button.textContent = 'Analyse starten (Verlauf)';
  });

  // Event Listener für Auswahlfelder
  select.addEventListener('change', updateChart);
  checkbox.addEventListener('change', updateChart);
  exportBtn.addEventListener('click', exportToCSV);

  // Initial: vorhandene Daten laden und anzeigen
  GM.getValue(STORAGE_KEY, []).then(data => {
    if (data.length > 0) {
      renderChart(data, parseInt(select.value), checkbox.checked);
    }
  });
})();
