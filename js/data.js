// ══════════════════════════════════════════════
// CONFIG
// ══════════════════════════════════════════════
const SHEETS_ID = '18zR6LX5qCoTWivTKKDlKavVOBA6kVNAznU2qLgoe5C8';
const SHEETS_URL = s=>`https://docs.google.com/spreadsheets/d/${SHEETS_ID}/gviz/tq?tqx=out:csv&sheet=${s}`;
const CATS = ['attractions','restaurants','shopping','accommodation'];
const CAT_INFO = {
  attractions:   {label:'景點', emoji:'🏞️', bg:'#E8F5F0'},
  restaurants:   {label:'餐廳', emoji:'🍽️', bg:'#FFE8E8'},
  shopping:      {label:'購物', emoji:'🛍️', bg:'#FFFAEF'},
  accommodation: {label:'住宿', emoji:'🏨', bg:'#EDE8F5'},
};
const REGIONS = ['台北市','新北市','基隆市','桃園市','新竹市','新竹縣','苗栗縣','台中市','彰化縣','南投縣','雲林縣','嘉義市','嘉義縣','台南市','高雄市','屏東縣','宜蘭縣','花蓮縣','台東縣'];

const ATT_TYPES = [
  {v:'zoo',       l:'🐾 動物園'},   {v:'farm',       l:'🐄 農場'},
  {v:'outdoor',   l:'🌲 山林草地'}, {v:'water',      l:'💧 水域戲水'},
  {v:'science',   l:'🔬 科學館'},   {v:'museum',     l:'🏺 博物館'},
  {v:'art_museum',l:'🎨 美術館'},   {v:'themepark',  l:'🎡 遊樂園'},
  {v:'cinema',    l:'🎬 親子影城'}, {v:'factory',    l:'🏭 觀光工廠'},
  {v:'indoor',    l:'🏠 其他室內'}, {v:'other_out',  l:'🌤 其他戶外'},
];

const REST_FEATS = [
  {v:'playarea',   l:'🧸 兒童遊戲區'}, {v:'kidseat',    l:'🪑 兒童座椅'},
  {v:'kidmeal',    l:'🍽 兒童餐/寶寶粥'},{v:'kidcutlery', l:'🔪 可提供兒童餐具'},
  {v:'nursing',    l:'🤱🏻 哺乳空間'},  {v:'parking',    l:'🅿️ 附設停車場'},
];

// ══════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════
const data={attractions:[],restaurants:[],shopping:[],accommodation:[]};
let currentPage='home', currentDetail=null;
let userLocation=null, isGPS=false;
let favorites=loadFavs();
let searchTimers={};
const F={
  attractions:{regions:[],subCats:[],distance:80},
  restaurants:{regions:[],feats:[],distance:80},
  shopping:{regions:[],distance:80},
  accommodation:{regions:[],distance:80},
};
let filterCat='attractions';
let randomPool=[], drawnPlace=null, slotTimer=null;

// Add Place State
let addState = {
  type: 'attractions',
  inputMethod: 'url',
  input: '',
  region: '',
  searchResult: null
};

// ══════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════
function loadDemoData(){
  const demo={
    attractions:[
      {id:'a001',cat:'attractions',name:'台北市立動物園',emoji:'🦁',region:'台北市',indoor:'FALSE',price:'low',priceLabel:'$300以下',desc:'台灣最大的動物園，逾400種動物親子必訪。',address:'台北市文山區新光路二段30號',lat:'25.0000',lng:'121.5800',hours:'09:00-17:00',closed:'週一',phone:'02-2938-2300',website:'https://www.zoo.taipei',features:'停車場,哺乳室,無障礙',tags:'戶外,動物,熱門',rating:'4.8',reviews:'2840',bg:'#FFE8E8',subCat:'zoo',imageUrl:''},
    ],
    restaurants:[
      {id:'r001',cat:'restaurants',name:'小食光親子餐廳',emoji:'🧸',region:'台中市',indoor:'TRUE',price:'mid',priceLabel:'$300-500',desc:'寬敞的兒童遊戲區、提供兒童餐與寶寶粥，深受媽媽好評。',address:'台中市北屯區旅順路一段99號',lat:'24.1648',lng:'120.6878',hours:'11:00-21:00',closed:'週二',phone:'04-2234-5678',website:'',features:'兒童遊戲區,兒童座椅,哺乳室,停車場,playarea,kidseat,nursing,parking',tags:'室內,親子,兒童餐',rating:'4.6',reviews:'1240',bg:'#FFE8E8',subCat:'family',imageUrl:'',hasPlayarea:'TRUE',hasKidSeat:'TRUE',hasNursing:'TRUE'},
    ],
    shopping:[
      {id:'s001',cat:'shopping',name:'誠品生活松菸',emoji:'📚',region:'台北市',indoor:'TRUE',price:'mid',priceLabel:'$300-500',desc:'文創複合商場，書店餐廳精品一應俱全。',address:'台北市信義區菸廠路88號',lat:'25.0443',lng:'121.5609',hours:'11:00-22:00',closed:'無',phone:'02-6636-5888',website:'https://www.esliteliving.com',features:'停車場,無障礙,餐廳',tags:'室內,文創,書店',rating:'4.6',reviews:'6800',bg:'#FFFAEF',imageUrl:''},
    ],
    accommodation:[
      {id:'ac001',cat:'accommodation',name:'礁溪老爺大酒店',emoji:'♨️',region:'宜蘭縣',indoor:'TRUE',price:'high',priceLabel:'$500+',desc:'礁溪溫泉度假，每房附湯，親子設施完善。',address:'宜蘭縣礁溪鄉五峰路69號',lat:'24.6710',lng:'121.7740',hours:'全天',closed:'無',phone:'03-988-9988',website:'https://www.hotelroyal.com.tw',features:'溫泉,游泳池,停車場',tags:'溫泉,度假,親子',rating:'4.7',reviews:'4500',bg:'#EDE8F5',imageUrl:'',bookingUrl:'https://www.booking.com'},
    ],
  };
  CATS.forEach(c=>{data[c]=demo[c]||[];});
  updatePool();
  CATS.forEach(c=>{if(currentPage===c) renderList(c);});
  if(currentPage==='home') renderHomePage();
}

// ══════════════════════════════════════════════
// CSV PARSE
// ══════════════════════════════════════════════
function parseCSV(txt){
  const lines=txt.split('\n'), h=csvRow(lines[0]);
  return lines.slice(1).filter(l=>l.trim()).map(l=>{
    const v=csvRow(l),o={};h.forEach((k,i)=>o[k.trim()]=(v[i]||'').trim());return o;
  });
}
function csvRow(line){
  const r=[];let c='',q=false;
  for(const ch of line){if(ch==='"')q=!q;else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}
  r.push(c);return r;
}

// ══════════════════════════════════════════════
// LOAD SHEET
// ══════════════════════════════════════════════
async function loadSheet(cat){
  const el=document.getElementById('list-'+cat);
  if(el) el.innerHTML=`<div class="lw"><div class="spin"></div><div style="font-size:13px;color:var(--text-tertiary)">載入中...</div></div>`;
  try{
    const r=await fetch(SHEETS_URL(cat));if(!r.ok)throw 0;
    const rows=parseCSV(await r.text()).filter(x=>x.name&&x.id&&x.visible!=='FALSE');
    data[cat]=rows;if(currentPage===cat)renderList(cat);updatePool();
  }catch(e){
    if(el) el.innerHTML=`<div class="nr"><div class="ne">⚠️</div><p>載入失敗，請確認 Google Sheets 已公開</p></div>`;
  }
}

// ══════════════════════════════════════════════
// API KEY 管理
// ══════════════════════════════════════════════
function getAPIKey(){
  return localStorage.getItem('zou_claude_api_key') || '';
}

function setAPIKey(key){
  if(key){
    localStorage.setItem('zou_claude_api_key', key);
  }
}

function hasAPIKey(){
  return getAPIKey().length > 0;
}
