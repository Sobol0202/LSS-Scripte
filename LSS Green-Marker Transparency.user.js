// ==UserScript==
// @name         LSS Green-Marker Transparency
// @version      1.3r
// @description  Setzt grüne Einsatzmarker durchsichtig
// @author       MissSobol
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_addStyle
// ==/UserScript==

// Festlege den gewünschten Durchsichtigkeitswert für aktive Marker (0 durchsichtig - 1 Sichtbar)
var transparency = 0;

// Füge CSS-Stilregeln hinzu, um die Transparenz anzupassen
GM_addStyle(`
    img.leaflet-marker-icon.leaflet-zoom-animated.leaflet-interactive[src*="/green_images/"] {
        opacity: ${transparency} !important;
    }
`);

// Überwache Veränderungen im DOM-Baum
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        // Prüfe, ob das Element mit der Klasse "leaflet-zoom-animated" hinzugefügt wurde
        if (mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
                if (node.classList && node.classList.contains('leaflet-zoom-animated')) {
                    // Überwache Veränderungen im Karten-Container
                    observeMapContainer(node);
                }
            });
        }
    });
});

// Starte die Beobachtung des DOM-Baums
observer.observe(document, {
    childList: true,
    subtree: true
});

// Überwache Veränderungen im Karten-Container
function observeMapContainer(container) {
    const mapObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Prüfe, ob sich ein Marker ändert
            if (mutation.target.classList && mutation.target.classList.contains('leaflet-marker-icon')) {
                adjustMarkerTransparency(mutation.target);
            }
        });
    });

    // Starte die Beobachtung des Karten-Containers
    mapObserver.observe(container, {
        childList: true,
        subtree: true
    });
}

// Passe die Transparenz des Markers anhand seines Bildzustands an
function adjustMarkerTransparency(marker) {
    const imageSrc = marker.querySelector('img').getAttribute('src');

    if (imageSrc.includes('/green_images/')) {
        marker.style.opacity = transparency;
    } else {
        marker.style.opacity = '1';
    }
}
