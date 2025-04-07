(async () => {
  const response = await fetch('https://www.leitstellenspiel.de/einsaetze.json');
  const missions = await response.json();

  const patientThresholds = [10, 20, 30, 50, 100, 101];

  const result = {};

  for (let threshold of patientThresholds) {
    result[threshold] = {
      totalMissions: 0,
      avg: { nef: 0, helicopter: 0, transport: 0 },
      max: { nef: 0, helicopter: 0, transport: 0 }
    };
  }

  missions.forEach(mission => {
    const patients = mission?.additional?.possible_patient;
    const chances = mission?.chances;
    if (!patients || !chances) return;

    for (let threshold of patientThresholds) {
      if ((threshold === 101 && patients > 100) || (threshold !== 101 && patients === threshold)) {
        const nef = (patients * (chances.nef || 0)) / 100;
        const helicopter = (patients * (chances.helicopter || 0)) / 100;
        const transport = (patients * (chances.patient_transport || 0)) / 100;

        const t = result[threshold];
        t.totalMissions++;
        t.avg.nef += nef;
        t.avg.helicopter += helicopter;
        t.avg.transport += transport;

        t.max.nef = Math.max(t.max.nef, nef);
        t.max.helicopter = Math.max(t.max.helicopter, helicopter);
        t.max.transport = Math.max(t.max.transport, transport);
      }
    }
  });

  console.table(Object.entries(result).map(([patients, data]) => {
    const count = data.totalMissions || 1;
    return {
      Patienten: patients === '101' ? '>100' : patients,
      'Ø Ärzte': (data.avg.nef / count).toFixed(2),
      'Ø Helikopter': (data.avg.helicopter / count).toFixed(2),
      'Ø Transporte': (data.avg.transport / count).toFixed(2),
      'Max Ärzte': data.max.nef.toFixed(0),
      'Max Helikopter': data.max.helicopter.toFixed(0),
      'Max Transporte': data.max.transport.toFixed(0)
    };
  }));
})();
