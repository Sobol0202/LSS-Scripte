const urlB = [
'https://www.leitstellenspiel.de/buildings/BUILDINGID/vehicle/BUILDINGID/VEHICLETYPE0/credits?building=BUILDINGID',
];

const requests = [];

urlB.forEach(url => {
  for (let i = 0; i < 1; i++) {
    requests.push(fetch(url).catch(console.error));
  }
});
