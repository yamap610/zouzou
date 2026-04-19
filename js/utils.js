// ══════════════════════════════════════════════
// FAVORITES
// ══════════════════════════════════════════════
function loadFavs(){try{return JSON.parse(localStorage.getItem('zou_favorites')||'[]');}catch(e){return[];}}
function saveFavs(){localStorage.setItem('zou_favorites',JSON.stringify(favorites));}
function toggleFavById(id){const i=favorites.indexOf(id);if(i===-1){favorites.push(id);showToast('❤️ 已加入收藏');}else{favorites.splice(i,1);showToast('移除收藏');}saveFavs();}
function toggleFav(id,btn){toggleFavById(id);const on=favorites.includes(id);btn.textContent=on?'❤️':'🤍';btn.classList.toggle('on',on);if(currentPage==='favorites')renderFavorites();renderHomeFavPreview();}

// ══════════════════════════════════════════════
// GPS
// ══════════════════════════════════════════════
function reqGPS(){
  if(!navigator.geolocation){showToast('此裝置不支援定位');return;}
  showToast('📍 定位中...');
  navigator.geolocation.getCurrentPosition(pos=>{
    userLocation={lat:pos.coords.latitude,lng:pos.coords.longitude};isGPS=true;
    localStorage.setItem('zou_gps',JSON.stringify({...userLocation,ts:Date.now()}));
    showToast('✅ 定位成功！已按距離排序');
    const lbl=document.getElementById('gpslbl');if(lbl)lbl.textContent='✅ 已定位 · 按距離排序';
    const gb=document.querySelector('.gpsbtn');if(gb)gb.classList.add('on');
    const gd=document.getElementById('gpsdist');if(gd)gd.style.display='block';
    if(CATS.includes(currentPage))renderList(currentPage);updatePool();
  },()=>showToast('定位失敗，請允許位置存取'));
}
function requestGPS(){reqGPS();}
function haversine(a,b,c,d){if(isNaN(c)||isNaN(d))return 999;const R=6371,dl=(c-a)*Math.PI/180,dn=(d-b)*Math.PI/180;const x=Math.sin(dl/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dn/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
let tT;
function showToast(m){
  const e=document.getElementById('toast');
  e.textContent=m;
  e.classList.add('show');
  clearTimeout(tT);
  tT=setTimeout(()=>e.classList.remove('show'),2200);
}

// ══════════════════════════════════════════════
// FILTER LOGIC
// ══════════════════════════════════════════════
function matchFeat(item, feat){
  const f=(item.features||'').toLowerCase();
  if(feat==='playarea')   return item.hasPlayarea==='TRUE'||f.includes('playarea')||f.includes('遊戲區');
  if(feat==='kidseat')    return item.hasKidSeat==='TRUE'||f.includes('kidseat')||f.includes('兒童座椅');
  if(feat==='kidmeal')    return f.includes('kidmeal')||f.includes('兒童餐')||f.includes('寶寶粥');
  if(feat==='kidcutlery') return f.includes('kidcutlery')||f.includes('兒童餐具');
  if(feat==='nursing')    return item.hasNursing==='TRUE'||f.includes('nursing')||f.includes('哺乳');
  if(feat==='parking')    return f.includes('parking')||f.includes('停車');
  return true;
}

function getFiltered(cat){
  const srch=(document.getElementById('search-'+cat)||{value:''}).value.toLowerCase();
  const cf=F[cat];
  return (data[cat]||[]).filter(x=>{
    if(cf.regions.length&&!cf.regions.includes(x.region))return false;
    if(srch&&!(x.name+x.tags+x.desc+x.region).toLowerCase().includes(srch))return false;
    if(cat==='attractions'&&cf.subCats.length&&!cf.subCats.includes(x.subCat))return false;
    if(cat==='restaurants'&&cf.feats.length&&!cf.feats.every(f=>matchFeat(x,f)))return false;
    if(isGPS&&userLocation&&cf.distance<80){
      if(haversine(userLocation.lat,userLocation.lng,+x.lat,+x.lng)>cf.distance)return false;
    }
    return true;
  }).map(x=>{
    if(isGPS&&userLocation) x._d=haversine(userLocation.lat,userLocation.lng,+x.lat,+x.lng);
    return x;
  }).sort((a,b)=>(a._d??999)-(b._d??999));
}

function filterList(cat){clearTimeout(searchTimers[cat]);searchTimers[cat]=setTimeout(()=>renderList(cat),200);}

// ══════════════════════════════════════════════
// DETAIL PAGE
// ══════════════════════════════════════════════
function buildMapUrl(item){
  if(!item) return '';
  const q = item.name + (item.address ? ' ' + item.address : '') + (item.region ? ' ' + item.region : '');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function openMap(){
  if(!currentDetail) return;
  window.open(buildMapUrl(currentDetail), '_blank');
}

function openWebsite(){
  if(!currentDetail)return;
  const u=currentDetail.website||currentDetail.bookingUrl;
  u?window.open(u,'_blank'):showToast('此地點尚未提供官方網站');
}

function copyAddr(){
  if(!currentDetail)return;
  navigator.clipboard?.writeText(currentDetail.address||currentDetail.name).then(()=>showToast('✅ 已複製地址')).catch(()=>showToast('📋 '+currentDetail.address));
}

function toggleFavDetail(){
  if(!currentDetail)return;
  toggleFavById(currentDetail.id);
  const isFav=favorites.includes(currentDetail.id);
  const b=document.getElementById('dfv');
  b.textContent=isFav?'❤️':'🤍';
  b.classList.toggle('on',isFav);
}

function closeDetail(){
  document.getElementById('dp').style.display='none';
  document.getElementById('app').style.display='';
}

// ══════════════════════════════════════════════
// POOL UPDATE
// ══════════════════════════════════════════════
function updatePool(){
  randomPool=['attractions','restaurants','shopping'].reduce((a,c)=>a.concat(data[c]),[]);
  renderHomeFeatured();
}
