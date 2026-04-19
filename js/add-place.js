// ══════════════════════════════════════════════
// ADD PLACE MODAL
// ══════════════════════════════════════════════
function openAddModal(){
  // 檢查是否有 API Key
  if(!hasAPIKey()){
    showToast('⚠️ 需要設定 Claude API Key');
    showAPIKeySetup();
    return;
  }

  addState = {
    type: 'attractions',
    inputMethod: 'url',
    input: '',
    region: '',
    searchResult: null
  };
  const modal = document.getElementById('add-modal');
  modal.classList.add('show');
  goAddStep(0);
}

function closeAddModal(){
  document.getElementById('add-modal').classList.remove('show');
}

function goAddStep(step){
  const steps = document.querySelectorAll('.add-step');
  steps.forEach(s => s.classList.remove('active'));
  document.getElementById('add-step-type').classList.toggle('active', step===0);
  document.getElementById('add-step-input').classList.toggle('active', step===1);
  document.getElementById('add-step-result').classList.toggle('active', step===2);
}

function selectAddType(type){
  addState.type = type;
  document.querySelectorAll('.add-type-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.closest('.add-type-btn').classList.add('selected');
}

function switchInputMethod(method){
  addState.inputMethod = method;
  document.getElementById('method-url').classList.toggle('active', method==='url');
  document.getElementById('method-name').classList.toggle('active', method==='name');
}

function clearAddInput(){
  document.getElementById('add-url-input').value = '';
  document.getElementById('add-name-input').value = '';
  document.getElementById('add-region-input').value = '';
}

// ══════════════════════════════════════════════
// API KEY SETUP
// ══════════════════════════════════════════════
function showAPIKeySetup(){
  const modal = document.getElementById('add-modal');
  modal.classList.add('show');
  
  // 清空 add-modal-content 並顯示 API Key 設定
  const content = document.querySelector('.add-modal-content');
  content.innerHTML = `
    <div class="add-modal-title">🔑 設定 Claude API Key</div>
    
    <div style="background:#FFF5E8;border-radius:var(--r-lg);padding:12px;margin-bottom:16px;">
      <div style="font-size:13px;line-height:1.6;color:#333;">
        <b>需要 Claude API Key 才能使用 AI 搜尋功能</b><br>
        <br>
        1. 打開 <a href="https://console.anthropic.com" target="_blank" style="color:#C9A97A;text-decoration:underline">Claude 官網</a><br>
        2. 登入帳號<br>
        3. 進入 API Keys 頁面<br>
        4. 點「Create Key」<br>
        5. 複製 Key（看起來像 sk-ant-...）<br>
        6. 貼到下方欄位
      </div>
    </div>

    <div style="margin-bottom:16px;">
      <label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px;">Claude API Key</label>
      <input type="password" id="setup-api-key" placeholder="sk-ant-..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:var(--r-md);font-family:monospace;font-size:12px;">
      <small style="color:var(--text-tertiary);margin-top:4px;display:block;">你的 Key 只會保存在這台裝置的本機儲存</small>
    </div>

    <div style="display:flex;gap:8px;">
      <button onclick="closeAddModal()" class="add-btn-secondary" style="flex:1">取消</button>
      <button onclick="saveAPIKey()" class="add-btn-primary" style="flex:1">保存 Key</button>
    </div>
  `;
}

function saveAPIKey(){
  const keyInput = document.getElementById('setup-api-key');
  const key = keyInput.value.trim();

  if(!key){
    alert('請輸入 API Key');
    return;
  }

  if(!key.startsWith('sk-ant-')){
    alert('API Key 格式不正確，應該以 sk-ant- 開頭');
    return;
  }

  setAPIKey(key);
  showToast('✅ API Key 已保存');
  closeAddModal();
}

// ══════════════════════════════════════════════
// AI SEARCH
// ══════════════════════════════════════════════
async function startAddSearch(){
  try {
    // 檢查 API Key
    if(!hasAPIKey()){
      alert('請先設定 API Key（點 ➕ 按鈕）');
      return;
    }

    // Collect input
    if(addState.inputMethod === 'url'){
      addState.input = document.getElementById('add-url-input').value.trim();
    } else {
      addState.input = document.getElementById('add-name-input').value.trim();
      addState.region = document.getElementById('add-region-input').value.trim();
    }

    if(!addState.input){
      alert('請輸入店名或 Google Maps 連結');
      return;
    }

    goAddStep(2);
    
    // Show loading
    document.getElementById('add-search-loading').style.display = 'block';
    document.getElementById('add-search-error').style.display = 'none';
    document.getElementById('add-search-success').style.display = 'none';

    // Call AI
    const result = await callClaudeSearch(addState.input, addState.region, addState.type);
    
    addState.searchResult = result;
    displayAddSearchResult(result);

  } catch(error){
    console.error('搜尋失敗:', error);
    showAddError(error.message || '搜尋失敗，請稍後重試');
  }
}

async function callClaudeSearch(input, region, type){
  const apiKey = getAPIKey();
  
  if(!apiKey){
    throw new Error('未設定 API Key');
  }

  // Build prompt based on type
  let prompt = buildSearchPrompt(input, region, type);
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if(!response.ok){
      const err = await response.text();
      if(response.status === 401){
        throw new Error('API Key 無效，請檢查是否正確');
      }
      throw new Error(`API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.content[0].text;
    
    return validateAndParseJSON(responseText);

  } catch(error){
    throw new Error('AI 搜尋失敗: ' + error.message);
  }
}

function buildSearchPrompt(input, region, type){
  let jsonSchema = '';
  
  if(type === 'restaurants'){
    jsonSchema = `{
  "name": "店名",
  "englishName": "英文名稱",
  "address": "完整地址",
  "region": "行政區",
  "phone": "電話號碼",
  "website": "官方網站 URL",
  "facebook": "Facebook 粉絲團連結",
  "hours": "營業時間",
  "closed": "公休日",
  "minConsumption": "低消金額",
  "highlights": "親子特色簡介",
  "features": "特色列表",
  "priceLabel": "價格範圍"
}`;
  } else if(type === 'attractions'){
    jsonSchema = `{
  "name": "地點名稱",
  "englishName": "英文名稱",
  "address": "完整地址",
  "region": "行政區",
  "phone": "電話號碼",
  "website": "官方網站",
  "hours": "營業時間",
  "closed": "公休日",
  "ticketPrice": "門票價格",
  "ageRecommendation": "推薦年齡",
  "highlights": "景點特色簡介",
  "features": "特色列表",
  "priceLabel": "價格範圍"
}`;
  } else {
    jsonSchema = `{
  "name": "店名",
  "address": "完整地址",
  "region": "行政區",
  "phone": "電話號碼",
  "website": "官方網站",
  "hours": "營業時間",
  "closed": "公休日",
  "highlights": "店家特色簡介",
  "features": "特色列表",
  "priceLabel": "價格範圍"
}`;
  }

  return `搜尋並回傳以下地點的詳細資訊：

地點資訊：${input}
${region ? `地區：${region}` : ''}
地點類型：${type}

請根據你的知識庫回傳精確且完整的資訊，以 JSON 格式回傳，不包括任何前言、解釋或 Markdown 標記。

JSON 結構：
${jsonSchema}

重要提醒：
1. 只回傳 JSON，不要有任何其他文字
2. 電話號碼必須是完整格式
3. 地址必須是完整地址
4. 時間格式統一為 HH:MM-HH:MM（24小時制）
5. 若資訊不確定，請留空或標注為空字符串
6. highlights 必須是中文，3-5句話，實用且親子相關

請回傳 JSON：`;
}

function validateAndParseJSON(jsonString){
  try {
    let cleaned = jsonString.trim();
    if(cleaned.startsWith('```json')){
      cleaned = cleaned.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if(cleaned.startsWith('```')){
      cleaned = cleaned.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(cleaned);
    return data;

  } catch(error){
    throw new Error('JSON 格式錯誤：' + error.message);
  }
}

function displayAddSearchResult(result){
  document.getElementById('add-search-loading').style.display = 'none';
  document.getElementById('add-search-error').style.display = 'none';
  document.getElementById('add-search-success').style.display = 'block';

  const formHtml = generateAddResultForm(result);
  document.getElementById('add-results-form').innerHTML = formHtml;
}

function generateAddResultForm(result){
  let html = '';
  
  const fields = [
    {key: 'name', label: '店名/地點'},
    {key: 'englishName', label: '英文名稱'},
    {key: 'address', label: '完整地址'},
    {key: 'region', label: '行政區'},
    {key: 'phone', label: '電話'},
    {key: 'website', label: '官網'},
    {key: 'facebook', label: 'Facebook'},
    {key: 'hours', label: '營業時間'},
    {key: 'closed', label: '公休日'},
    {key: 'minConsumption', label: '低消'},
    {key: 'ticketPrice', label: '門票'},
    {key: 'ageRecommendation', label: '推薦年齡'},
    {key: 'highlights', label: '特色簡介'},
    {key: 'priceLabel', label: '價格範圍'}
  ];

  for(const field of fields){
    const value = result[field.key] || '';
    if(value){
      html += `
        <div class="add-result-field">
          <label>${field.label}</label>
          <input type="text" data-field="${field.key}" value="${escapeHTML(value)}">
        </div>`;
    }
  }

  return html;
}

function escapeHTML(text){
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function showAddError(message){
  document.getElementById('add-search-loading').style.display = 'none';
  document.getElementById('add-search-success').style.display = 'none';
  document.getElementById('add-search-error').style.display = 'block';
  document.getElementById('add-error-msg').textContent = message;
}

// ══════════════════════════════════════════════
// SAVE PLACE
// ══════════════════════════════════════════════
function saveAddPlace(){
  try {
    // Collect form data
    const formInputs = document.querySelectorAll('.add-result-field input');
    const newPlace = {
      id: 'custom_' + Date.now(),
      cat: addState.type,
      emoji: getEmojiForType(addState.type),
      visible: 'TRUE',
      tags: ' 使用者新增',
    };

    formInputs.forEach(input => {
      const field = input.dataset.field;
      newPlace[field] = input.value;
    });

    // Validate required fields
    if(!newPlace.name || !newPlace.address){
      alert('請至少填入地點名稱和地址');
      return;
    }

    // Add to data
    if(!data[addState.type]) data[addState.type] = [];
    data[addState.type].push(newPlace);

    // Save to localStorage as backup
    const key = `zou_custom_${addState.type}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push(newPlace);
    localStorage.setItem(key, JSON.stringify(existing));

    showToast(`✅ ${newPlace.name} 已新增`);
    closeAddModal();
    updatePool();
    
    // Refresh current page
    if(CATS.includes(currentPage)) renderList(currentPage);

  } catch(error){
    console.error('保存失敗:', error);
    alert('保存失敗: ' + error.message);
  }
}

function getEmojiForType(type){
  const emojis = {
    attractions: '🏞️',
    restaurants: '🍽️',
    shopping: '🛍️',
    accommodation: '🏨'
  };
  return emojis[type] || '📍';
}
