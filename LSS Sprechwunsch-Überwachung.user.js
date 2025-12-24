// ==UserScript==
// @name         LSS Sprechwunsch-Überwachung
// @namespace    Sobol
// @version      1.0
// @description  Erkennt Sprechwünsche und schlägt Alarm, wenn dieser vor über einer Stunde schon mal erkannt wurde.
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {

    // Einstellungen
    const CHECK_INTERVAL = 120 * 1000;      // alle 120s prüfen
    const MAX_ALERT_AGE  = 60 * 60 * 1000; // 1h → Alarm
    const MAX_STORE_AGE  = 24 * 60 * 60 * 1000; // 24h → aus Speicher entfernen

    // Hilfsfunktionen
    function log(...args) { console.log("[Sprechwunsch-Skript]", ...args); }

    function gmSetObject(k, obj) { GM_setValue(k, JSON.stringify(obj)); }
    function gmGetObject(k) {
        try {
            const v = GM_getValue(k);
            if (!v) return null;
            return typeof v === "object" ? v : JSON.parse(v);
        } catch(e){ return null; }
    }
    function gmListObjects(prefix="") {
        return GM_listValues().filter(k=>k.startsWith(prefix)).map(k=>({key:k,value:gmGetObject(k)})).filter(o=>o.value);
    }
    function key(vehicleId, missionId) { return `sprechwunsch_${vehicleId}_${missionId}`; }

    // Speicher: Neu / Löschen
    function storeSprechwunsch(vehicleId, missionId) {
        const k = key(vehicleId, missionId);
        if (gmGetObject(k)) return; // nicht überschreiben
        gmSetObject(k, {vehicleId, missionId, timestamp: Date.now()});
        log("Neu gespeichert:", vehicleId, missionId);
    }
    function deleteEntryByKey(k){ GM_deleteValue(k); log("Eintrag gelöscht:", k); }

    function checkIfVehicleHasSprechwunsch(vehicleId, missionId, callback){
        const url = `https://www.leitstellenspiel.de/missions/${missionId}`;
        GM_xmlhttpRequest({
            method:"GET", url,
            onload: r => {
                try {
                    const doc = new DOMParser().parseFromString(r.responseText,"text/html");
                    const row = doc.querySelector(`#vehicle_row_${vehicleId}`);
                    callback(!!row?.querySelector("td span.building_list_fms_5"));
                } catch(e){ callback(false); }
            },
            onerror:()=>callback(false)
        });
    }

    function showSprechwunschAlerts(alertEntries){
        if(!alertEntries||alertEntries.length===0) return;
        let overlay=document.getElementById("sw-alert-overlay");
        if(overlay) overlay.remove();

        overlay=document.createElement("div");
        overlay.id="sw-alert-overlay";
        overlay.style.position="fixed"; overlay.style.top="10px"; overlay.style.right="10px";
        overlay.style.width="300px"; overlay.style.maxHeight="80vh"; overlay.style.overflowY="auto";
        overlay.style.background="#ffdddd"; overlay.style.border="2px solid red"; overlay.style.padding="10px";
        overlay.style.zIndex="99999"; overlay.style.boxShadow="0 0 10px rgba(0,0,0,0.5)";
        overlay.style.fontFamily="Arial, sans-serif";

        const title=document.createElement("div");
        title.textContent="🚨 Sprechwünsche (>1h)";
        title.style.fontWeight="bold"; title.style.marginBottom="5px";
        overlay.appendChild(title);

        alertEntries.forEach(e=>{
            const link=document.createElement("a");
            link.href=`https://www.leitstellenspiel.de/missions/${e.missionId}`;
            link.target="_blank"; link.style.display="block"; link.style.marginBottom="3px"; link.style.color="red";
            link.textContent=`Fahrzeug ${e.vehicleId} – Einsatz ${e.missionId}`;
            overlay.appendChild(link);
        });

        const closeBtn=document.createElement("button");
        closeBtn.textContent="Schließen"; closeBtn.style.marginTop="5px"; closeBtn.style.padding="2px 5px";
        closeBtn.style.cursor="pointer"; closeBtn.onclick=()=>overlay.remove();
        overlay.appendChild(closeBtn);

        document.body.appendChild(overlay);
    }

    function checkStoredEntriesLive(){
        const entries=gmListObjects("sprechwunsch_");
        if(entries.length===0) return;
        const now=Date.now();
        window.swAlertEntries=[];
        entries.forEach(({key:k,value:entry})=>{
            if(!entry||!entry.timestamp||!entry.vehicleId||!entry.missionId){ deleteEntryByKey(k); return; }
            if(now-entry.timestamp>MAX_STORE_AGE){ deleteEntryByKey(k); return; }

            checkIfVehicleHasSprechwunsch(entry.vehicleId, entry.missionId, stillOpen=>{
                if(stillOpen){
                    if(now-entry.timestamp>MAX_ALERT_AGE) window.swAlertEntries.push(entry);
                } else deleteEntryByKey(k);
                setTimeout(()=>{ if(window.swAlertEntries.length) { showSprechwunschAlerts(window.swAlertEntries); window.swAlertEntries=[]; } }, 500);
            });
        });
    }

    // Sprechwünsche suchen
    function loadMissionAndStore(missionId){
        const url=`https://www.leitstellenspiel.de/missions/${missionId}`;
        GM_xmlhttpRequest({
            method:"GET", url,
            onload:r=>{
                try{
                    const doc=new DOMParser().parseFromString(r.responseText,"text/html");
                    const rows=doc.querySelectorAll("#mission_vehicle_at_mission tbody tr");
                    rows.forEach(row=>{
                        if(row.querySelector("td span.building_list_fms_5")){
                            const vehicleId=row.id.replace("vehicle_row_","");
                            if(vehicleId) storeSprechwunsch(vehicleId,missionId);
                        }
                    });
                }catch(e){log("Fehler beim Parsen Mission",missionId,e);}
            },
            onerror: err=>log("Fehler beim Laden Mission",missionId,err)
        });
    }

    function checkPanels(){
        ["#mission_list","#mission_list_alliance","#mission_list_alliance_event"].forEach(sel=>{
            const container=document.querySelector(sel); if(!container) return;
            container.querySelectorAll("div[id^='mission_']").forEach(panel=>{
                const missionId=panel.id.replace("mission_","");
                const missing=panel.querySelector(`#mission_missing_short_${missionId}`);
                if(missing?.textContent.includes("Ein Fahrzeug hat einen Sprechwunsch")) loadMissionAndStore(missionId);
            });
        });
        checkStoredEntriesLive();
    }

    // Zeitstempel auf Einsatzseite einfügen
    function addSprechwunschInfoOnMissionPage(){
        const match=window.location.pathname.match(/^\/missions\/(\d+)/);
        if(!match) return;
        const missionId=match[1];
        const entries=gmListObjects("sprechwunsch_").map(o=>o.value).filter(e=>String(e.missionId)===String(missionId));
        if(entries.length===0) return;
        const now=Date.now();

        entries.forEach(entry=>{
            const ageMin=Math.floor((now-entry.timestamp)/60000);
            const hintText=` (Sprechwunsch seit ${ageMin} min)`;
            const row=document.querySelector(`#vehicle_row_${entry.vehicleId}`);
            if(!row) return;
            const desktop=row.querySelector("td.hidden-xs a[href^='/profile/']");
            if(desktop && !desktop.dataset.swAdded){ desktop.textContent+=hintText; desktop.dataset.swAdded="1"; }
            const mobile=row.querySelector("small.visible-xs a[href^='/profile/']");
            if(mobile && !mobile.dataset.swAdded){ mobile.textContent+=hintText; mobile.dataset.swAdded="1"; }
        });
    }

    log("Sprechwunsch-Skript gestartet – Intervall:",CHECK_INTERVAL,"ms");
    setInterval(checkPanels,CHECK_INTERVAL);

    window.addEventListener("load",()=>{ setTimeout(addSprechwunschInfoOnMissionPage,500); });

    const observer=new MutationObserver(()=>{ addSprechwunschInfoOnMissionPage(); });
    observer.observe(document.body,{childList:true,subtree:true});

})();
