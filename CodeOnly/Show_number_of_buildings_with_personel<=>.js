fetch("https://www.leitstellenspiel.de/api/buildings")
  .then(res => res.json())
  .then(data => {
    let gleich = 0;
    let groesser = 0;
    let kleiner = 0;

    data.forEach(b => {
      const ist = b.personal_count;
      const soll = b.personal_count_target;

      if (ist === soll) gleich++;
      else if (ist > soll) groesser++;
      else kleiner++;
    });

    console.log("Gleich:", gleich);
    console.log("Größer:", groesser);
    console.log("Kleiner:", kleiner);
  })
  .catch(err => console.error("Fehler beim Abrufen der API:", err));
