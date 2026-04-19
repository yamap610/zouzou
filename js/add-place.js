// OPEN/CLOSE
function openAddModal(){if(!hasAPIKey()){showAPIKeySetup();return;}addState={type:'attractions',inputMethod:'url',input:'',region:'',searchResult:null};document.getElementById('add-modal').classList.add('show');goAddStep(0);}
function closeAddModal(){document.getElementById('add-modal').classList.remove('show');}

// STEPS
function goAddStep(step){document.querySelectorAll('.add-step').forEach(s=>s.classList.remove('active'));if(step===0)document.getElementById('add-step-type').classList.add('active');else if(step===1)document.getElementById('add-step-input').classList.add('active');else if(step===2)document.getElementById('add-step-result').classList.add('active');}
function selectAddType(type){addState.type=type;document.querySelectorAll('.add-type-btn').forEach(btn=>btn.classList.remove('selected'));event.target.closest('.add-type-btn').classList.add('selected');}
function switchInputMethod(method){addState.inputMethod=method;document.getElementById('method-url').classList.toggle('active',method==='url');document.getElementById('method-name').classList.toggle('active',method==='name');}
function clearAddInput(){document.getElementById('add-url-input').value='';document.getElementById('add-name-input').value='';document.getElementById('add-region-input').value='';}

// API KEY SETUP
function showAPIKeySetup(){
  const modal=document.getElementById('add-modal');modal.classList.add('show');
  const content=document.querySelector('.add-modal-content');
  content.innerHTML=`<div class="add-modal-title">🔑 設定 Claude API Key</div><div style="background:#FFF5E8;border-radius:8px;padding:12px;margin-bottom:16px;font-size:13px;line-height:1.6;"><b>步驟：</b><br>1. <a href="https://console.anthropic.com" target="_blank" style="color:#C9A97A">打開 Claude 官網</a><br>2. 點 Create Key<br>3. 複製 sk-ant-... 開頭的 Key<br>4. 貼到下方</div><div style="margin-bottom:16px;"><label style="display:block;font-weight:600;margin-bottom:8px;">API Key</label><input type="password" id="setup-api-key" placeholder="sk-ant-..." style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:monospace;"></div><div style="display:flex;gap:8px;"><button onclick="closeAddModal()" style="flex:1;padding:12px;border:none;border-radius:8px;background:#eee;cursor:pointer;">取消</button><button onclick="saveAPIKey()" style="flex:1;padding:12px;border:none;border-radius:8px;background:#C9A97A;color:white;cursor:pointer;">保存</button></div>`;
}
function saveAPIKey(){
  const key=document.getElementById('setup-api-key').value.trim();
  if(!key||!key.startsWith('sk-ant-')){alert('請輸入有效的 API Key（以 sk-ant- 開頭）');return;}
  setAPIKey(key);showToast('✅ API Key 已保存');closeAddModal();
}

// AI SEARCH
async function startAddSearch(){
  if(!hasAPIKey()){alert('請先設定 API Key');return;}
  addState.input=addState.inputMethod==='url'?document.getElementById('add-url-input').value.trim():document.getElementById('add-name-input').value.trim();
  addState.region=document.getElementById('add-region-input').value.trim();
  if(!addState.input){alert('請輸入');return;}
  goAddStep(2);
  document.getElementById('add-search-loading').style.display='block';
  document.getElementById('add-search-error').style.display='none';
  document.getElementById('add-search-success').style.display='none';
  try{
    const result=await callClaudeSearch(addState.input,addState.region,addState.type);
    addState.searchResult=result;
    displayAddSearchResult(result);
  }catch(error){
    console.error('搜尋失敗:',error);
    showAddError(error.message||'搜尋失敗');
  }
}

async function callClaudeSearch(input,region,type){
  const apiKey=getAPIKey();
  if(!apiKey)throw new Error('未設定 API Key');
  const prompt=`搜尋地點: ${input} ${region?'地區: '+region:''} 類型: ${type}\n\n以 JSON 回傳:\n{\n"name":"名稱",\n"address":"地址",\n"region":"縣市",\n"phone":"電話",\n"website":"網址",\n"hours":"時間",\n"highlights":"簡介"\n}\n\n只回傳 JSON，無其他文字。`;
  const response=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}]})});
  if(!response.ok)throw new Error('API 錯誤: '+(response.status===401?'Key 無效':response.status));
  const data=await response.json();
  let text=data.content[0].text.trim();
  if(text.startsWith('```json'))text=text.replace(/^```json\n?/,'').replace(/\n?```$/,'');else if(text.startsWith('```'))text=text.replace(/^```\n?/,'').replace(/\n?```$/,'');
  return JSON.parse(text);
}

function displayAddSearchResult(result){
  document.getElementById('add-search-loading').style.display='none';
  document.getElementById('add-search-error').style.display='none';
  document.getElementById('add-search-success').style.display='block';
  let html='';
  const fields=['name','address','region','phone','website','hours','highlights'];
  fields.forEach(f=>{if(result[f])html+=`<div class="add-result-field"><label>${f}</label><input type="text" data-field="${f}" value="${(result[f]||'').replace(/"/g,'&quot;')}"></div>`;});
  document.getElementById('add-results-form').innerHTML=html;
}

function showAddError(message){document.getElementById('add-search-loading').style.display='none';document.getElementById('add-search-success').style.display='none';document.getElementById('add-search-error').style.display='block';document.getElementById('add-error-msg').textContent=message;}

// SAVE PLACE
function saveAddPlace(){
  try{
    const formInputs=document.querySelectorAll('.add-result-field input');
    const newPlace={id:'custom_'+Date.now(),cat:addState.type,emoji:'📍',visible:'TRUE',tags:'使用者新增'};
    formInputs.forEach(inp=>{newPlace[inp.dataset.field]=inp.value;});
    if(!newPlace.name||!newPlace.address){alert('需要名稱和地址');return;}
    if(!data[addState.type])data[addState.type]=[];
    data[addState.type].push(newPlace);
    const key=`zou_custom_${addState.type}`;
    const existing=JSON.parse(localStorage.getItem(key)||'[]');
    existing.push(newPlace);
    localStorage.setItem(key,JSON.stringify(existing));
    showToast(`✅ ${newPlace.name} 已新增`);closeAddModal();updatePool();
    if(CATS.includes(currentPage))renderList(currentPage);
  }catch(error){console.error('失敗:',error);alert('保存失敗');}
}
