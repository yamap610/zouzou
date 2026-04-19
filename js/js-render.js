// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function goPage(page){
  document.getElementById('page-'+currentPage).classList.remove('active');
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  currentPage=page;
  if(page==='favorites') renderFavorites();
  else if(page==='home'){
    const pre=document.getElementById('home-pre-content');
    if(pre) pre.style.display='';
    document.getElementById('rcw').classList.remove('show');
    document.getElementById('daw').classList.remove('show');
    document.getElementById('slot-drum').classList.remove('show');
    renderHomePage();
  }
  else if(CATS.includes(page)){
    if(data[page].length===0) loadSheet(page); else renderList(page);
  }
}

// ══════════════════════════════════════════════
// RENDER LIST
// ══════════════════════════════════════════════
function renderList(cat){
  const el=document.getElementById('list-'+cat);
  const items=getFiltered(cat);
  el.innerHTML=items.length?items.map(cardHTML).join(''):`<div class="nr"><div class="ne">🔍</div><p>沒有找到符合條件的地點</p></div>`;
  renderFR(cat);
}

function cardHTML(item){
  const isFav=favorites.includes(item.id);
  const cat=item.cat||'';
  const bg=item.bg||(CAT_INFO[cat]?.bg)||'#F0F0F0';
  const tags=(item.tags||'').split(',').filter(Boolean).slice(0,2);
  const dist=item._d!==undefined?`<span class="ld">📍${item._d.toFixed(1)}km</span>`:'';
  return `<div class="lc" onclick="goDetail('${item.id}','${cat}')">
    <div class="lc-icon" style="background:${bg}">${item.emoji||'📍'}</div>
    <div class="lc-body">
      <h3>${item.name}</h3>
      <p>${item.desc||''}</p>
      <div class="lc-meta">
        <span class="lp">${item.priceLabel||''}</span>
        ${tags.map(t=>`<span class="lt">${t}</span>`).join('')}
        ${item.region?`<span class="lt">${item.region}</span>`:''}
        ${dist}
      </div>
    </div>
    <div class="lc-right">
      <button class="fb ${isFav?'on':''}" onclick="event.stopPropagation();toggleFav('${item.id}',this)">${isFav?'❤️':'🤍'}</button>
      ${item.rating?`<div style="font-size:11px;color:#F4B942;font-weight:700">★${item.rating}</div>`:''}
    </div>
  </div>`;
}

// ══════════════════════════════════════════════
// FILTER CHIPS
// ══════════════════════════════════════════════
function renderFR(cat){
  const el=document.getElementById('fr-'+cat);if(!el)return;
  const cf=F[cat];
  const active=[];
  cf.regions.forEach(r=>active.push({l:'📍'+r,k:'r_'+r}));
  if(cat==='attractions') cf.subCats.forEach(s=>{const o=ATT_TYPES.find(x=>x.v===s);if(o)active.push({l:o.l,k:'s_'+s});});
  if(cat==='restaurants') cf.feats.forEach(f=>{const o=REST_FEATS.find(x=>x.v===f);if(o)active.push({l:o.l,k:'f_'+f});});
  el.innerHTML=`<div class="chip ${active.length?'':'active'}" onclick="clearFilters('${cat}')" style="${active.length?'':'pointer-events:none;opacity:.6'}">全部</div>`
    +active.map(a=>`<div class="chip active" onclick="rmChip('${cat}','${a.k}')">${a.l} ✕</div>`).join('')
    +`<div class="chip" onclick="openFilter('${cat}')">＋ 篩選</div>`;
}

function rmChip(cat,k){
  const cf=F[cat];
  if(k.startsWith('r_')) cf.regions=cf.regions.filter(v=>v!==k.slice(2));
  if(k.startsWith('s_')) cf.subCats=cf.subCats.filter(v=>v!==k.slice(2));
  if(k.startsWith('f_')) cf.feats=cf.feats.filter(v=>v!==k.slice(2));
  renderList(cat);
}

// ══════════════════════════════════════════════
// FILTER MODAL
// ══════════════════════════════════════════════
function openFilter(cat){
  filterCat=cat;
  const cf=F[cat];
  const titles={attractions:'🏞️ 景點篩選',restaurants:'🍽️ 餐廳篩選',shopping:'🛍️ 購物篩選',accommodation:'🏨 住宿篩選'};
  document.getElementById('fmo-title').textContent=titles[cat]||'篩選';
  let html='';
  html+=`<div class="msc"><div class="mst"><div class="sd-dot" style="background:var(--mint-dark)"></div>定位距離篩選</div>
    <div class="gpsbtn ${isGPS?'on':''}" onclick="reqGPS()"><span>📍</span><span id="gpslbl">${isGPS?'✅ 已定位 · 按距離排序':'啟用定位（按距離排序）'}</span></div>
    <div id="gpsdist" style="display:${isGPS?'block':'none'}">
      <input type="range" id="distslider" min="5" max="80" value="${cf.distance||80}" oninput="onDist(this.value,'${cat}')">
      <div class="rl"><span>5km</span><span id="distval">${cf.distance||80}km 以內</span><span>80km</span></div>
    </div>
  </div>`;
  if(cat==='attractions'){
    html+=`<div class="msc"><div class="mst"><div class="sd-dot"></div>景點類型（可多選）</div>
      <div class="cw">${ATT_TYPES.map(o=>`<div class="chip ${cf.subCats.includes(o.v)?'active':''}" onclick="toggleType(this,'${cat}','${o.v}')">${o.l}</div>`).join('')}</div>
    </div>`;
  }
  if(cat==='restaurants'){
    html+=`<div class="msc"><div class="mst"><div class="sd-dot"></div>餐廳特色（可多選）</div>
      <div class="cw">${REST_FEATS.map(o=>`<div class="chip ${cf.feats.includes(o.v)?'active':''}" onclick="toggleFeat(this,'${cat}','${o.v}')">${o.l}</div>`).join('')}</div>
    </div>`;
  }
  html+=`<div class="msc"><div class="mst"><div class="sd-dot" style="background:var(--tan-dark)"></div>地區（可多選）</div>
    <div class="cw">${REGIONS.map(r=>`<div class="chip ${cf.regions.includes(r)?'active':''}" onclick="toggleReg(this,'${cat}','${r}')">${r}</div>`).join('')}</div>
  </div>`;
  document.getElementById('fmo-body').innerHTML=html;
  updateFC();
  document.getElementById('fmo').classList.add('open');
}

function handleOverlayClick(e){if(e.target.id==='fmo')applyFilters();}
function toggleType(el,cat,v){el.classList.toggle('active');const cf=F[cat];if(el.classList.contains('active')){if(!cf.subCats.includes(v))cf.subCats.push(v);}else cf.subCats=cf.subCats.filter(x=>x!==v);updateFC();}
function toggleFeat(el,cat,v){el.classList.toggle('active');const cf=F[cat];if(el.classList.contains('active')){if(!cf.feats.includes(v))cf.feats.push(v);}else cf.feats=cf.feats.filter(x=>x!==v);updateFC();}
function toggleReg(el,cat,r){el.classList.toggle('active');const cf=F[cat];if(el.classList.contains('active')){if(!cf.regions.includes(r))cf.regions.push(r);}else cf.regions=cf.regions.filter(x=>x!==r);updateFC();}
function onDist(v,cat){F[cat].distance=+v;document.getElementById('distval').textContent=v+'km 以內';updateFC();}
function updateFC(){document.getElementById('fcb').textContent=`找到 ${getFiltered(filterCat).length} 個`;}
function clearFilters(cat){const c=cat||filterCat;F[c]={regions:[],subCats:[],feats:[],distance:80};document.getElementById('fmo').classList.remove('open');renderList(c);}
function applyFilters(){document.getElementById('fmo').classList.remove('open');renderList(filterCat);}

// ══════════════════════════════════════════════
// DETAIL PAGE
// ══════════════════════════════════════════════
function goDetail(id,cat){
  const item=(cat?data[cat]:CATS.reduce((a,c)=>a.concat(data[c]),[])).find(x=>x.id===id);
  if(!item)return;currentDetail=item;
  const hero=document.getElementById('dhr');
  const emo=document.getElementById('dhe');
  hero.querySelectorAll('img').forEach(i=>i.remove());
  if(item.imageUrl&&item.imageUrl.trim()){
    const img=document.createElement('img');img.src=item.imageUrl.trim();
    img.onerror=()=>{img.remove();emo.style.display='';};
    hero.appendChild(img);emo.style.display='none';
  } else {emo.style.display='';emo.textContent=item.emoji||'📍';}
  hero.style.background=item.bg||(CAT_INFO[item.cat||'']?.bg)||'#F0EDE8';

  const fv=document.getElementById('dfv');
  const isFav=favorites.includes(item.id);
  fv.textContent=isFav?'❤️':'🤍';fv.classList.toggle('on',isFav);

  const ci=CAT_INFO[item.cat]||{};
  const tags=(item.tags||'').split(',').filter(Boolean);
  const feats=(item.features||'').split(',').filter(Boolean).filter(f=>!['playarea','kidseat','kidmeal','kidcutlery','nursing','parking'].includes(f));
  const rat=item.rating?`<div class="rrow"><span class="stars">${'★'.repeat(Math.round(+item.rating))}${'☆'.repeat(5-Math.round(+item.rating))}</span><span style="font-size:14px;font-weight:700">${item.rating}</span>${item.reviews?`<span style="font-size:12px;color:var(--text-tertiary)">(${item.reviews}則)</span>`:''}</div>`:'';
  const dist=item._d!==undefined?`<br><span style="font-size:12px;color:var(--text-tertiary)">📍 距離約 ${item._d.toFixed(1)} km</span>`:'';

  document.getElementById('dbd').innerHTML=`
    <h1>${item.name}</h1>${rat}
    <div class="dtgs">
      ${ci.label?`<div class="dtag">${ci.emoji||''} ${ci.label}</div>`:''}
      ${item.priceLabel?`<div class="dtag dpx">💰 ${item.priceLabel}</div>`:''}
      ${item.indoor==='TRUE'?'<div class="dtag">🏠 室內</div>':item.indoor==='FALSE'?'<div class="dtag">🌿 戶外</div>':''}
      ${tags.map(t=>`<div class="dtag">${t}</div>`).join('')}
    </div>
    <div class="ddsc"><p>${item.desc||'暫無簡介'}</p></div>
    <div class="dir"><div class="diic">📍</div><div class="dic"><div class="dlb">地址</div><div class="dvl">${item.address||'—'}${dist}</div></div></div>
    <div class="dir"><div class="diic">⏰</div><div class="dic"><div class="dlb">營業時間</div><div class="dvl">${item.hours||'—'}${item.closed?' ｜ 公休：'+item.closed:''}</div></div></div>
    ${item.phone?`<div class="dir"><div class="diic">📞</div><div class="dic"><div class="dlb">電話</div><a class="dvl" href="tel:${item.phone}">${item.phone}</a></div></div>`:''}
    ${item.region?`<div class="dir"><div class="diic">🗺️</div><div class="dic"><div class="dlb">縣市</div><div class="dvl">${item.region}</div></div></div>`:''}
    ${feats.length?`<div class="dfeat"><h3>設施</h3><div class="fcw">${feats.map(f=>`<div class="fchip">${f}</div>`).join('')}</div></div>`:''}
    ${item.bookingUrl?`<div style="margin-top:16px"><a href="${item.bookingUrl}" target="_blank" class="btn btn-coral" style="display:block;text-decoration:none;text-align:center;padding:14px">🏨 立即訂房</a></div>`:''}
    ${item.reservationUrl?`<div style="margin-top:10px"><a href="${item.reservationUrl}" target="_blank" class="btn btn-mint" style="display:block;text-decoration:none;text-align:center;padding:14px;color:white">📅 線上訂位</a></div>`:''}
  `;
  document.getElementById('app').style.display='none';
  document.getElementById('dp').style.display='flex';
}

// ══════════════════════════════════════════════
// HOME PAGE
// ══════════════════════════════════════════════
function renderHomePage(){
  renderHomeFeatured();
  renderHomeFavPreview();
}

function renderHomeFeatured(){
  const el=document.getElementById('home-featured');
  if(!el)return;
  const pool=['attractions','restaurants','shopping'].reduce((a,c)=>a.concat(data[c]),[]);
  if(!pool.length){el.innerHTML='<div style="padding:8px;font-size:13px;color:var(--text-tertiary)">資料載入中...</div>';return;}
  const today=new Date();
  const seed=today.getFullYear()*10000+(today.getMonth()+1)*100+today.getDate();
  function seededRand(s){let x=Math.sin(s)*10000;return x-Math.floor(x);}
  const shuffled=[...pool].sort((a,b)=>seededRand(seed+pool.indexOf(a))-seededRand(seed+pool.indexOf(b)));
  const picks=shuffled.slice(0,6);
  el.innerHTML=picks.map(p=>{
    const bg=p.bg||(CAT_INFO[p.cat||'']?.bg)||'#F0EDE8';
    const tags=(p.tags||'').split(',').filter(Boolean).slice(0,1);
    const imgHtml=p.imageUrl&&p.imageUrl.trim()
      ?`<img src="${p.imageUrl}" onerror="this.remove()"><span class="hcard-img-em">${p.emoji||'📍'}</span>`
      :`<span class="hcard-img-em">${p.emoji||'📍'}</span>`;
    return `<div class="hcard" onclick="goDetail('${p.id}','${p.cat}')">
      <div class="hcard-img" style="background:${bg}">${imgHtml}</div>
      <div class="hcard-body">
        <div class="hcard-name">${p.name}</div>
        <div class="hcard-meta">
          <span class="hcard-price">${p.priceLabel||''}</span>
          ${tags.map(t=>`<span class="hcard-tag">${t}</span>`).join('')}
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderHomeFavPreview(){
  const el=document.getElementById('home-fav-preview');
  if(!el)return;
  if(!favorites.length){
    el.innerHTML=`<div class="fav-preview-empty">
      <div class="fpe-icon">🤍</div>
      <div class="fpe-text">
        <h4>還沒有收藏</h4>
        <p>逛景點、餐廳時按 🤍<br>加入你的最愛清單</p>
      </div>
    </div>`;
    return;
  }
  const all=CATS.reduce((a,c)=>a.concat(data[c]),[]);
  const items=favorites.slice(0,8).map(id=>all.find(x=>x.id===id)).filter(Boolean);
  if(!items.length){
    el.innerHTML=`<div class="fav-preview-empty"><div class="fpe-icon">🤍</div><div class="fpe-text"><h4>收藏載入中</h4><p>稍候即可看到你的收藏</p></div></div>`;
    return;
  }
  el.innerHTML=`<div class="fav-mini-scroll">${items.map(p=>{
    const bg=p.bg||(CAT_INFO[p.cat||'']?.bg)||'#F0EDE8';
    return `<div class="fav-mini-card" onclick="goDetail('${p.id}','${p.cat}')">
      <div class="fav-mini-icon" style="background:${bg}">${p.emoji||'📍'}</div>
      <div class="fav-mini-name">${p.name}</div>
    </div>`;
  }).join('')}</div>`;
}

function renderFavorites(){
  const el=document.getElementById('list-favorites');
  if(!favorites.length){el.innerHTML=`<div class="empty-st"><div class="ee">🤍</div><h3>還沒有收藏</h3><p>瀏覽地點時點擊 🤍 即可加入</p></div>`;return;}
  const all=CATS.reduce((a,c)=>a.concat(data[c]),[]);
  const items=favorites.map(id=>all.find(x=>x.id===id)).filter(Boolean);
  el.innerHTML=items.length?items.map(cardHTML).join(''):`<div class="lw"><div class="spin"></div></div>`;
}

// ══════════════════════════════════════════════
// SLOT MACHINE
// ══════════════════════════════════════════════
function startDraw(){
  const pool=randomPool.length?randomPool:Object.values(data).flat();
  if(!pool.length){showToast('資料載入中，請稍後再試');return;}
  const pre=document.getElementById('home-pre-content');
  if(pre) pre.style.display='none';
  document.getElementById('rcw').classList.remove('show');
  document.getElementById('daw').classList.remove('show');
  const drum=document.getElementById('slot-drum');drum.classList.add('show');
  const winner=pool[Math.floor(Math.random()*pool.length)];drawnPlace=winner;
  const items=[...Array(12)].map(()=>pool[Math.floor(Math.random()*pool.length)]);items.push(winner);
  const inner=document.getElementById('slot-inner');
  inner.style.transition='none';inner.style.transform='translateY(0)';
  inner.innerHTML=items.map(p=>`<div class="sit"><div class="sit-ic">${p.emoji||'📍'}</div><div><div class="sit-nm">${p.name}</div><div class="sit-cy">${p.region||''}</div></div></div>`).join('');
  const tot=items.length-1;let cnt=0,spd=30;clearInterval(slotTimer);
  slotTimer=setInterval(()=>{
    cnt++;inner.style.transition=`transform ${spd/1000}s linear`;inner.style.transform=`translateY(-${cnt*60}px)`;
    if(cnt<tot-4)spd=30;else spd=Math.min(spd+40,300);
    if(cnt>=tot){clearInterval(slotTimer);setTimeout(showResult,400);}
  },spd);
}

function showResult(){
  const p=drawnPlace;if(!p)return;
  const cat=p.cat||'attractions';const info=CAT_INFO[cat]||{};
  const tags=(p.tags||'').split(',').filter(Boolean);
  document.getElementById('slot-drum').classList.remove('show');
  const banner=document.getElementById('rcb');
  banner.style.background='linear-gradient(135deg,#EDE8E3,#DFC8B0)';
  if(p.imageUrl&&p.imageUrl.trim()){
    banner.innerHTML=`<img src="${p.imageUrl}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0" onerror="this.remove()"><span class="rcb-em">${p.emoji||'📍'}</span>`;
  } else {
    banner.innerHTML=`<span class="rcb-em">${p.emoji||'📍'}</span>`;
  }

  const badgeClass = {
    attractions:'rb-mint', restaurants:'rb-rose',
    shopping:'rb-tan', accommodation:'rb-lav'
  }[cat]||'rb-stone';

  document.getElementById('rcbg').innerHTML=
    `<span class="rcbadge ${badgeClass}">${info.label||cat}</span>`+
    (p.indoor==='TRUE'?'<span class="rcbadge rb-stone">室內</span>':p.indoor==='FALSE'?'<span class="rcbadge rb-stone">戶外</span>':'')+
    (p.priceLabel?`<span class="rcbadge rb-stone">${p.priceLabel}</span>`:'');
  document.getElementById('rcn').textContent=p.name;
  document.getElementById('rcy').textContent=`📍 ${p.region||''}`;
  document.getElementById('rctg').innerHTML=tags.map(t=>`<span class="rctag">${t}</span>`).join('');

  document.getElementById('rcmap').onclick=()=>window.open(buildMapUrl(p),'_blank');

  document.getElementById('rcw').classList.add('show');
  document.getElementById('daw').classList.add('show');
}

function openDetailFromResult(){if(drawnPlace)goDetail(drawnPlace.id,drawnPlace.cat);}
