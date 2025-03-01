const profileLinks = [
"https://www.leitstellenspiel.de/profile/1",
"https://www.leitstellenspiel.de/profile/1",
"https://www.leitstellenspiel.de/profile/1",
]; //Profil-Links

const allianceText = "Sachsen,Dresden und Osterz.";
const allianceSelector = "a[href='/alliances/3771']";

async function checkProfile(link) {
    try {
        // console.log(`Überprüfe Profil: ${link}`);
        const response = await fetch(link);
        if (!response.ok) throw new Error(`Fehler beim Laden: ${link}`);
        const text = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, "text/html");
        
        const allianceElement = doc.querySelector(allianceSelector);
        if (!allianceElement || !allianceElement.textContent.includes(allianceText)) {
            console.warn(`Profil ohne Allianz '${allianceText}':`, link);
        } else {
            console.log(`Profil OK: ${link}`);
        }
    } catch (error) {
        console.error(`Fehler bei ${link}:`, error);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async function () {
    for (const link of profileLinks) {
        await checkProfile(link);
        await delay(100);
    }
})();
