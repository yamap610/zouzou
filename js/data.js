// CONFIG
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
  {v:'zoo',l:'🐾 動物園'},{v:'farm',l:'🐄 農場'},{v:'outdoor',l:'🌲 山林'},{v:'water',l:'💧 水域'},
  {v:'science',l:'🔬 科學'},{v:'museum',l:'🏺 博物'},{v:'art',l:'🎨 美術'},{v:'park',l:'🎡 樂園'},
  {v:'cinema',l:'🎬 影城'},{v:'factory',l:'🏭 工廠'},{v:'indoor',l:'🏠 室內'},{v:'other',l:'🌤 其他'},
];
const REST_FEATS = [
  {v:'playarea',l:'🧸 遊戲區'},{v:'kidseat',l:'🪑 兒童椅'},{v:'kidmeal',l:'🍽 兒童餐'},
  {v:'nursing',l:'🤱 哺乳'},{v:'parking',l:'🅿️ 停車'},
];

// STATE
const data={attractions:[],restaurants:[],shopping:[],accommodation:[]};
let currentPage='home', currentDetail=null;
let userLocation=null, isGPS=false;
let favorites=[];
let searchTimers={};
const F={attractions:{regions:[],subCats:[],distance:80},restaurants:{regions:[],feats:[],distance:80},shopping:{regions:[],distance:80},accommodation:{regions:[],distance:80},};
let filterCat='attractions';
let randomPool=[], drawnPlace=null, slotTimer=null;
let addState = {type:'attractions',inputMethod:'url',input:'',region:'',searchResult:null};

// FAVORITES
function loadFavs(){try{return JSON.parse(localStorage.getItem('zou_favorites')||'[]');}catch(e){return [];}}
function saveFavs(){localStorage.setItem('zou_favorites',JSON.stringify(favorites));}

// API KEY
function getAPIKey(){return localStorage.getItem('zou_claude_api_key')||'';}
function setAPIKey(key){if(key)localStorage.setItem('zou_claude_api_key',key);}
function hasAPIKey(){return getAPIKey().length>0;}

// DEMO DATA
function loadDemoData(){
  const demo={attractions:[{id:'a001',cat:'attractions',name:'台北動物園',emoji:'🦁',region:'台北市',price:'low',priceLabel:'$',desc:'親子必訪',address:'台北市文山區',lat:'25',lng:'121.58',hours:'09:00-17:00',phone:'02-2938-2300',website:'https://www.zoo.taipei',tags:'動物,熱門',rating:'4.8',reviews:'2840',bg:'#FFE8E8',subCat:'zoo'}],restaurants:[{id:'r001',cat:'restaurants',name:'親子餐廳',emoji:'🧸',region:'台中市',price:'mid',priceLabel:'$$',desc:'遊戲區+兒童餐',address:'台中市北屯區',lat:'24.16',lng:'120.68',hours:'11:00-21:00',phone:'04-2234-5678',tags:'親子,室內',rating:'4.6',reviews:'1240',bg:'#FFE8E8'}],shopping:[{id:'s001',cat:'shopping',name:'誠品松菸',emoji:'📚',region:'台北市',price:'mid',priceLabel:'$$',desc:'文創商場',address:'台北市信義區',lat:'25.044',lng:'121.560',hours:'11:00-22:00',phone:'02-6636-5888',website:'https://www.esliteliving.com',tags:'文創',rating:'4.6',reviews:'6800',bg:'#FFFAEF'}],accommodation:[{id:'ac001',cat:'accommodation',name:'礁溪老爺',emoji:'♨️',region:'宜蘭縣',price:'high',priceLabel:'$$$',desc:'溫泉度假',address:'宜蘭縣礁溪鄉',lat:'24.67',lng:'121.77',hours:'全天',phone:'03-988-9988',website:'https://www.hotelroyal.com.tw',tags:'溫泉',rating:'4.7',reviews:'4500',bg:'#EDE8F5'}]};
  CATS.forEach(c=>{data[c]=demo[c]||[];});
  updatePool();
}

// CSV PARSE
function parseCSV(txt){const lines=txt.split('\n'),h=csvRow(lines[0]);return lines.slice(1).filter(l=>l.trim()).map(l=>{const v=csvRow(l),o={};h.forEach((k,i)=>o[k.trim()]=(v[i]||'').trim());return o;});}
function csvRow(line){const r=[];let c='',q=false;for(const ch of line){if(ch==='"')q=!q;else if(ch===','&&!q){r.push(c);c='';}else c+=ch;}r.push(c);return r;}

// LOAD SHEET
async function loadSheet(cat){const el=document.getElementById('list-'+cat);if(el)el.innerHTML=`<div class="lw"><div class="spin"></div></div>`;try{const r=await fetch(SHEETS_URL(cat));if(!r.ok)throw 0;const rows=parseCSV(await r.text()).filter(x=>x.name&&x.id);data[cat]=rows;if(currentPage===cat)renderList(cat);updatePool();}catch(e){if(el)el.innerHTML=`<div class="nr"><div class="ne">⚠️</div></div>`;}}

// INIT
window.addEventListener('DOMContentLoaded',()=>{
  favorites=loadFavs();
  loadDemoData();
  setTimeout(()=>{CATS.forEach(cat=>loadSheet(cat));},1000);
});
