// ══════════════════════════════════════════════
// APP INIT
// ══════════════════════════════════════════════
window.addEventListener('DOMContentLoaded',()=>{
  // 恢復 GPS 狀態
  try{
    const s=JSON.parse(localStorage.getItem('zou_gps')||'null');
    if(s&&Date.now()-s.ts<3600000){
      userLocation={lat:s.lat,lng:s.lng};
      isGPS=true;
    }
  }catch(e){}

  // 恢復收藏
  try{
    favorites=JSON.parse(localStorage.getItem('zou_favorites')||'[]');
  }catch(e){}

  // 載入示範資料
  loadDemoData();

  // 嘗試載入 Google Sheets
  let ok=false;
  const fb=setTimeout(()=>{
    if(!ok)loadDemoData();
  },5000);

  Promise.all(CATS.map(cat=>
    fetch(SHEETS_URL(cat))
      .then(r=>{if(!r.ok)throw 0;return r.text();})
      .then(txt=>{
        const rows=parseCSV(txt).filter(x=>x.name&&x.id&&x.visible!=='FALSE');
        if(rows.length){
          data[cat]=rows;ok=true;
        }
      })
      .catch(()=>{})
  )).then(()=>{
    clearTimeout(fb);
    if(ok){
      updatePool();
      if(CATS.includes(currentPage))renderList(currentPage);
      if(currentPage==='home')renderHomePage();
    }
  });
});

// ══════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const dp = document.getElementById('dp');
    const fmo = document.getElementById('fmo');
    const am = document.getElementById('add-modal');
    
    if(dp.style.display==='flex') closeDetail();
    else if(fmo.classList.contains('open')) applyFilters();
    else if(am.classList.contains('show')) closeAddModal();
  }
});

// ══════════════════════════════════════════════
// PWA SERVICE WORKER
// ══════════════════════════════════════════════
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  });
}
