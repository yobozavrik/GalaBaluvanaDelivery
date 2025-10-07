'use strict';

/* ---------- SAFE HELPERS (чтобы не висло на загрузке) ---------- */
function createIconsSafe(){ try{ window.lucide && typeof lucide.createIcons==='function' && lucide.createIcons(); }catch(e){ console.warn('lucide error:', e);} }
function hideLoaderSafe(){ const el=document.getElementById('loadingScreen'); if(el) el.style.display='none'; }
window.addEventListener('error', hideLoaderSafe);
window.addEventListener('unhandledrejection', hideLoaderSafe);

/* ---------- APP STATE ---------- */
class AppState{
  constructor(){ this.screen='main'; this.tab='home'; this.isUnloading=false; this.isDelivery=false; this.editingItemId=null; }
  setScreen(screen,opts={}){
    this.screen=screen;
    if(opts.isUnloading!==undefined) this.isUnloading=opts.isUnloading;
    if(opts.isDelivery!==undefined) this.isDelivery=opts.isDelivery;
    if(opts.editingItemId!==undefined) this.editingItemId=opts.editingItemId;
    else if(screen==='main') this.editingItemId=null;
    this.updateUI();
  }
  setTab(tab){ this.tab=tab; this.updateUI(); }
  updateUI(){
    document.getElementById('mainScreen').style.display = this.screen==='main'?'block':'none';
    document.getElementById('purchaseFormScreen').style.display = this.screen==='purchase-form'?'block':'none';
    document.querySelectorAll('.tab-content').forEach(t=>t.style.display='none');
    const activeTab=document.getElementById(`${this.tab}Tab`); if(activeTab) activeTab.style.display='block';
    document.querySelectorAll('.nav-button').forEach(btn=>btn.classList.toggle('active', btn.dataset.tab===this.tab));
    this.updateHeader();
    document.getElementById('bottomNavigation').style.display=this.screen==='main'?'flex':'none';
  }
  updateHeader(){
    const backButton=document.getElementById('backButton');
    const headerTitle=document.getElementById('headerTitle');
    if(this.screen==='purchase-form'){
      backButton.style.display='flex';
      if(this.editingItemId) headerTitle.textContent='Редагувати запис';
      else headerTitle.textContent=(this.isUnloading||this.isDelivery)?'Нове відвантаження':'Нова закупівля';
    }else{
      backButton.style.display='none';
      headerTitle.textContent='Облік закупівель';
    }
  }
}
const appState=new AppState();

/* ---------- CONFIG ---------- */
const getSecureWebhookUrl=()=>{
  const productionProxyUrl='/api/delivery';
  const localProxyUrl='http://localhost:3000/api/delivery';
  const productionDirectUrl='https://n8n.dmytrotovstytskyi.online/webhook/delivery';
  const testDirectUrl='https://n8n.dmytrotovstytskyi.online/webhook-test/delivery';

  const adjustTargetParam=(url,target)=>{
    if(!url) return url;
    const absolutePattern=/^[a-zA-Z][a-zA-Z\d+\-.]*:/;
    const isAbsolute=absolutePattern.test(url);
    const parsed=isAbsolute?new URL(url):new URL(url,'http://placeholder.local');
    if(target==='test') parsed.searchParams.set('target','test');
    else parsed.searchParams.delete('target');
    if(isAbsolute) return parsed.toString();
    const serialized=parsed.pathname+(parsed.search?parsed.search:'');
    return serialized||'/';
  };

  if(typeof window!=='undefined'){
    if(window.__SECURE_WEBHOOK_URL__) return window.__SECURE_WEBHOOK_URL__;

    let baseUrl=productionProxyUrl;
    let requested='auto';

    try{
      const params=new URLSearchParams(window.location?.search ?? '');
      const requestedWebhook=params.get('webhook');
      if(requestedWebhook){
        const normalized=requestedWebhook.toLowerCase();
        if(normalized==='test' || normalized==='production') requested=normalized;
      }
    }catch(error){
      console.warn('Не удалось прочитать параметры URL для выбора webhook.',error);
    }

    const hostname=window.location?.hostname ?? '';
    if(hostname==='localhost' || hostname==='127.0.0.1') baseUrl=localProxyUrl;

    const isProxy=typeof baseUrl==='string' && baseUrl.includes('/api/delivery');

    if(requested==='test'){
      if(isProxy) return adjustTargetParam(baseUrl,'test');
      return testDirectUrl;
    }

    if(requested==='production'){
      if(isProxy) return adjustTargetParam(baseUrl,null);
      return productionDirectUrl;
    }

    if(isProxy) return adjustTargetParam(baseUrl,null);
    return productionDirectUrl;
  }

  return productionProxyUrl;
};
const appConfig={
  N8N_WEBHOOK_URL:getSecureWebhookUrl(),
  units:[
    {value:'kg',label:'кг'},{value:'piece',label:'шт'},
    {value:'pack',label:'упаковка'},{value:'box',label:'ящик'},
    {value:'bunch',label:'пучок'},{value:'other',label:'інше'}
  ],
  marketLocations:['Калинівський ринок','Зелений ринок','Метро','Інше'],
  unloadingLocations:['Героїв Майдану','Ентузіастів','Бульвар','Гравітон','Садова','Флоріда','Ентузіастів 2 поверх','Піцерія','Руська','Інше'],
  products:['Картопля','Цибуля','Капуста','Морква','Буряк','Гриби','Помідори','Банан','Часник','Перець','Кабачки','Баклажан','Лимон']
};

let selectedPhotoBase64=null;

const buildWebhookAttemptUrls=(baseUrl)=>{
  const attempts=[];
  const seen=new Set();
  const add=(value)=>{ if(value && typeof value==='string' && !seen.has(value)){ seen.add(value); attempts.push(value); } };

  if(!baseUrl) return attempts;
  add(baseUrl);

  try{
    const absolutePattern=/^[a-zA-Z][a-zA-Z\d+\-.]*:/;
    const isAbsolute=absolutePattern.test(baseUrl);
    const origin=(typeof window!=='undefined' && window.location?.origin) || 'http://placeholder.local';
    const parsed=isAbsolute?new URL(baseUrl):new URL(baseUrl,origin);
    const pathname=parsed.pathname || '';
    const serialize=(urlObj)=> isAbsolute ? urlObj.toString() : (urlObj.pathname + (urlObj.search?urlObj.search:''));

    if(pathname.endsWith('/api/delivery')){
      const productionUrl=new URL(parsed.toString());
      productionUrl.searchParams.delete('target');
      add(serialize(productionUrl));

      const testUrl=new URL(parsed.toString());
      testUrl.searchParams.set('target','test');
      add(serialize(testUrl));
    }else if(pathname.includes('/webhook-test/')){
      const productionUrl=new URL(parsed.toString());
      productionUrl.pathname=productionUrl.pathname.replace('/webhook-test/','/webhook/');
      add(serialize(productionUrl));
    }else if(pathname.includes('/webhook/')){
      const testUrl=new URL(parsed.toString());
      testUrl.pathname=testUrl.pathname.replace('/webhook/','/webhook-test/');
      add(serialize(testUrl));
    }
  }catch(error){
    console.warn('Не удалось построить список fallback webhook URL.', error);
  }

  return attempts;
};

/* ---------- STORAGE / TOAST / THEME ---------- */
class StorageManager{
  static get(key,def=[]){ try{ const v=localStorage.getItem(key); return v?JSON.parse(v):def; }catch(e){ return def; } }
  static set(key,val){ localStorage.setItem(key,JSON.stringify(val)); }
  static getHistoryItems(){ return this.get('purchase_history',[]); }
  static setHistoryItems(items){ this.set('purchase_history',items); }
  static addToHistory(item){ const items=this.getHistoryItems(); items.unshift(item); this.setHistoryItems(items); }
  static updateHistoryItem(id,upd){ let items=this.getHistoryItems(); const i=items.findIndex(x=>x.id===id); if(i>-1){ items[i]={...items[i],...upd}; this.setHistoryItems(items);} }
  static deleteHistoryItem(id){ let items=this.getHistoryItems(); items=items.filter(x=>x.id!==id); this.setHistoryItems(items); }
  static clearHistory(){ localStorage.removeItem('purchase_history'); }
}
class ToastManager{
  static show(message,type='success'){
    const c=document.getElementById('toastContainer');
    const t=document.createElement('div'); t.className=`toast ${type}`; t.textContent=message;
    c.appendChild(t);
    setTimeout(()=>{ t.style.animationName='toast-out'; setTimeout(()=>t.remove(),500)},3000);
  }
}
class ThemeManager{
  static init(){
    const saved=localStorage.getItem('theme')||'light';
    this.setTheme(saved);
    document.getElementById('themeToggle').addEventListener('click',()=>{
      const newTheme=document.documentElement.getAttribute('data-theme')==='light'?'dark':'light';
      this.setTheme(newTheme);
    });
  }
  static setTheme(theme){
    document.documentElement.setAttribute('data-theme',theme);
    localStorage.setItem('theme',theme);
    const themeIcon=document.querySelector('.theme-icon');
    if(themeIcon){ themeIcon.setAttribute('data-lucide', theme==='light'?'moon':'sun'); createIconsSafe(); }
  }
}

/* ---------- INIT (safe) ---------- */
document.addEventListener('DOMContentLoaded', async ()=>{
  const killSwitch=setTimeout(hideLoaderSafe,3000);
  try{
    createIconsSafe();
    ThemeManager.init();
    setupEventListeners();
    populateUnitSelect();
    appState.updateUI();

    if('serviceWorker' in navigator){
      try{ await navigator.serviceWorker.register('/service-worker.js'); console.log('SW registered'); }
      catch(err){ console.warn('SW failed:', err); }
    }
  }catch(e){ console.error('Init error:', e); }
  finally{ clearTimeout(killSwitch); hideLoaderSafe(); }
});

/* ---------- UI handlers ---------- */
function setupEventListeners(){
  document.getElementById('backButton').addEventListener('click',()=>appState.setScreen('main'));
  document.getElementById('purchaseForm').addEventListener('submit',handleFormSubmit);
  document.getElementById('photoInput').addEventListener('change',handlePhotoSelect);
  document.getElementById('quantity').addEventListener('input',updateTotalAmount);
  document.getElementById('pricePerUnit').addEventListener('input',updateTotalAmount);
  document.getElementById('location').addEventListener('change',handleLocationChange);

  document.getElementById('sendPurchasesButton').addEventListener('click',()=>sendAllToServer('purchasesList'));
  document.getElementById('sendUnloadingsButton').addEventListener('click',()=>sendAllToServer('unloadingList'));

  document.getElementById('cancelEndDay').addEventListener('click',hideEndDayModal);
  document.getElementById('confirmEndDay').addEventListener('click',endWorkDay);
}
function switchTab(tab){
  appState.setTab(tab);
  if(tab==='purchasesList') updateDisplay('purchasesList');
  if(tab==='unloadingList') updateDisplay('unloadingList');
  if(tab==='reports') renderReports();
}
function startPurchase(){ appState.setScreen('purchase-form',{isUnloading:false,isDelivery:false}); setupPurchaseForm(); }
function startUnloading(){ appState.setScreen('purchase-form',{isUnloading:true,isDelivery:false}); setupPurchaseForm(); }
function startDelivery(){ appState.setScreen('purchase-form',{isUnloading:false,isDelivery:true}); setupPurchaseForm(); }

function startEdit(itemId){
  const items=StorageManager.getHistoryItems();
  const item=items.find(i=>i.id===itemId);
  if(!item) return;
  const isUnloading=item.type==='Відвантаження';
  const isDelivery=item.type==='Доставка';

  appState.setScreen('purchase-form',{isUnloading,isDelivery,editingItemId:itemId});
  setupPurchaseForm();

  document.getElementById('productName').value=item.productName;
  document.getElementById('quantity').value=item.quantity;
  document.getElementById('unit').value=item.unit;
  document.getElementById('pricePerUnit').value=item.pricePerUnit;

  const locationSelect=document.getElementById('location');
  const locationExists=Array.from(locationSelect.options).some(opt=>opt.value===item.location);
  if(locationExists){ locationSelect.value=item.location; handleLocationChange(); }
  else{ locationSelect.value='Інше'; handleLocationChange(); document.getElementById('customLocation').value=item.location; }

  if(item.photoBase64){
    selectedPhotoBase64=item.photoBase64;
    document.getElementById('previewImage').src=item.photoBase64;
    document.getElementById('photoPreview').style.display='block';
  }
  updateTotalAmount();
}

function setupPurchaseForm(){
  document.getElementById('purchaseForm').reset();
  removePhoto();
  populateDatalist();

  const priceGroup=document.getElementById('priceGroup');
  const totalGroup=document.getElementById('totalGroup');
  const locationLabel=document.getElementById('locationLabel');
  const saveButtonText=document.getElementById('saveButtonText');
  const formTitle=document.getElementById('formTitle');
  const formSubtitle=document.getElementById('formSubtitle');

  let locations;
  const isEditing=!!appState.editingItemId;
  let currentType='';
  if(isEditing){ const it=StorageManager.getHistoryItems().find(i=>i.id===appState.editingItemId); if(it) currentType=it.type; }
  const isUnlOrDel=(!isEditing&&(appState.isUnloading||appState.isDelivery)) || (isEditing&&(currentType==='Відвантаження'||currentType==='Доставка'));

  if(isUnlOrDel){
    priceGroup.style.display='none';
    totalGroup.style.display='none';
    locationLabel.textContent='Магазин (відвантаження/доставка)';
    locations=appConfig.unloadingLocations;
  }else{
    priceGroup.style.display='block';
    totalGroup.style.display='block';
    locationLabel.textContent='Локація закупки';
    locations=appConfig.marketLocations;
  }

  if(isEditing){
    formTitle.textContent='Редагувати запис';
    formSubtitle.textContent='Змініть дані та збережіть';
    saveButtonText.textContent='Оновити запис';
  }else if(isUnlOrDel){
    formTitle.textContent='Нове відвантаження';
    formSubtitle.textContent='Вкажіть дані для переміщення';
    saveButtonText.textContent='Зберегти локально';
  }else{
    formTitle.textContent='Нова закупівля';
    formSubtitle.textContent='Вкажіть дані про товар';
    saveButtonText.textContent='Зберегти локально';
  }

  setupLocationOptions(locations);
  updateTotalAmount();
  createIconsSafe();
}

function populateDatalist(){
  const datalist=document.getElementById('productSuggestions');
  datalist.innerHTML='';
  appConfig.products.forEach(p=>datalist.innerHTML+=`<option value="${p}">`);
}
function populateUnitSelect(){
  const select=document.getElementById('unit');
  select.innerHTML='';
  appConfig.units.forEach(u=>select.innerHTML+=`<option value="${u.value}">${u.label}</option>`);
}
function setupLocationOptions(locations){
  const select=document.getElementById('location');
  select.innerHTML='<option value="">Оберіть...</option>';
  locations.forEach(loc=>select.innerHTML+=`<option value="${loc}">${loc}</option>`);
}
function handleLocationChange(){
  const group=document.getElementById('customLocationGroup');
  const customInput=document.getElementById('customLocation');
  const isCustom=document.getElementById('location').value==='Інше';
  group.style.display=isCustom?'block':'none';
  customInput.disabled=!isCustom;
  customInput.required=isCustom;
  if(!isCustom) customInput.value='';
}
function updateTotalAmount(){
  if(appState.isUnloading||appState.isDelivery) return;
  const qty=parseFloat(document.getElementById('quantity').value)||0;
  const price=parseFloat(document.getElementById('pricePerUnit').value)||0;
  document.getElementById('totalAmount').textContent=(qty*price).toFixed(2)+' ₴';
}
function handlePhotoSelect(e){
  const file=e.target.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=(ev)=>{ selectedPhotoBase64=ev.target.result; document.getElementById('previewImage').src=ev.target.result; document.getElementById('photoPreview').style.display='block'; };
  reader.readAsDataURL(file);
}
function removePhoto(){ selectedPhotoBase64=null; document.getElementById('photoPreview').style.display='none'; document.getElementById('photoInput').value=''; }

async function handleFormSubmit(e){
  e.preventDefault();
  const isEditing=!!appState.editingItemId;
  let type='Закупка';
  if(!isEditing){ if(appState.isUnloading) type='Відвантаження'; if(appState.isDelivery) type='Доставка'; }
  else{ const it=StorageManager.getHistoryItems().find(i=>i.id===appState.editingItemId); if(it) type=it.type; }

  const productName=document.getElementById('productName').value.trim();
  const quantity=parseFloat(document.getElementById('quantity').value);
  let location=document.getElementById('location').value;
  if(location==='Інше'){ location=document.getElementById('customLocation').value.trim(); }

  const itemData={
    id: isEditing ? appState.editingItemId : crypto.randomUUID(),
    productName, quantity,
    unit: document.getElementById('unit').value,
    pricePerUnit: (type==='Закупка') ? (parseFloat(document.getElementById('pricePerUnit').value)||0) : 0,
    totalAmount: (type==='Закупка') ? (quantity*(parseFloat(document.getElementById('pricePerUnit').value)||0)) : 0,
    location, timestamp:new Date().toISOString(), type,
    photoBase64: selectedPhotoBase64,
  };

  if(isEditing){ StorageManager.updateHistoryItem(appState.editingItemId,itemData); ToastManager.show(`'${productName}' оновлено локально`,'success'); }
  else{ StorageManager.addToHistory(itemData); ToastManager.show(`'${productName}' збережено локально`,'success'); }

  appState.setScreen('main');
  if(itemData.type==='Закупка') appState.setTab('purchasesList'); else appState.setTab('unloadingList');
  updateDisplay(appState.tab);
}

/* ---------- FILE HELPERS ---------- */
function dataURLToBlob(dataUrl){
  if(typeof dataUrl!=='string') return null;
  const parts=dataUrl.split(','); if(parts.length<2) return null;
  const meta=parts[0]; const base64Data=parts[1];
  const mimeMatch=meta.match(/data:(.*?);base64/); const mimeType=mimeMatch?mimeMatch[1]:'application/octet-stream';
  try{
    const byteString=atob(base64Data); const arr=new Uint8Array(byteString.length);
    for(let i=0;i<byteString.length;i++) arr[i]=byteString.charCodeAt(i);
    return new Blob([arr],{type:mimeType});
  }catch(e){ console.error('Blob convert error:', e); return null; }
}
function buildPhotoFilename(item,mimeType){
  const safe=(item.productName||'photo').toLowerCase().replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'')||'photo';
  const ts=item.timestamp ? new Date(item.timestamp).toISOString().replace(/[:.]/g,'-') : Date.now();
  const ext = mimeType==='image/png'?'png' : (mimeType==='image/webp'?'webp':'jpg');
  return `${safe}-${ts}.${ext}`;
}

/* ---------- SENDER (последовательно, с паузой) ---------- */
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));

async function sendAllToServer(listType, gapMs=150, perRequestTimeoutMs=12000){
  const buttonId=listType==='purchasesList'?'sendPurchasesButton':'sendUnloadingsButton';
  const button=document.getElementById(buttonId);
  const buttonIcon=button.querySelector('.button-icon');
  const buttonSpinner=button.querySelector('.button-spinner');

  button.disabled=true; buttonIcon.style.display='none'; buttonSpinner.style.display='inline-block';

  const allItems=StorageManager.getHistoryItems();
  const itemsToSend=allItems.filter(item=> listType==='purchasesList' ? item.type==='Закупка' : (item.type==='Відвантаження'||item.type==='Доставка') );

  if(itemsToSend.length===0){
    ToastManager.show('Немає записів для відправки','info');
    button.disabled=false; buttonIcon.style.display='inline-block'; buttonSpinner.style.display='none';
    return;
  }

  console.log(`📤 Отправка ${itemsToSend.length} записей...`);
  const attemptUrls=buildWebhookAttemptUrls(appConfig.N8N_WEBHOOK_URL);
  if(attemptUrls.length===0){
    console.error('❌ Немає валідних webhook URL для відправки.');
    ToastManager.show('Не налаштовано webhook для відправки','error');
    button.disabled=false; buttonIcon.style.display='inline-block'; buttonSpinner.style.display='none';
    return;
  }

  const successfulIds=new Set();

  for(let i=0;i<itemsToSend.length;i++){
    const item=itemsToSend[i];
    console.log(`📦 [${i+1}/${itemsToSend.length}] ${item.productName}`);

    try{
      const eventDate=new Date(item.timestamp);
      const isoDate=eventDate.toISOString();
      const [datePart,timePartWithMs]=isoDate.split('T');
      const timePart=timePartWithMs?timePartWithMs.split('.')[0]:'';

      const payload={
        id:item.id, type:item.type, timestamp:item.timestamp,
        date:datePart, time:timePart,
        productName:item.productName, quantity:item.quantity, unit:item.unit,
        pricePerUnit:item.pricePerUnit, totalAmount:item.totalAmount, location:item.location
      };

      const formData=new FormData();
      formData.append('data', JSON.stringify(payload));

      if(item.photoBase64){
        const blob=dataURLToBlob(item.photoBase64);
        if(blob){
          const filename=buildPhotoFilename(item, blob.type);
          formData.append('file', blob, filename);
          console.log(`📸 файл: ${filename} (${(blob.size/1024).toFixed(1)} KB)`);
        }
      }

      let delivered=false;
      let lastError=null;

      for(const url of attemptUrls){
        const attemptController=new AbortController();
        const attemptTimeout=setTimeout(()=>attemptController.abort(), perRequestTimeoutMs);
        try{
          const res=await fetch(url,{ method:'POST', body:formData, signal:attemptController.signal, mode:'cors' });
          const text=await res.text();
          if(!res.ok){
            lastError=new Error(`HTTP ${res.status}`);
            console.error(`❌ HTTP ${res.status} (${url})`, text);
            continue;
          }
          console.log(`✅ ok (${url}):`, item.productName);
          successfulIds.add(item.id);
          delivered=true;
          break;
        }catch(err){
          lastError=err;
          console.error(`❌ fetch error (${url}):`, err?.message||err);
        }finally{
          clearTimeout(attemptTimeout);
        }
      }

      if(!delivered && lastError){
        console.error('❌ Повторні спроби вичерпані для запису:', item.productName, lastError?.message||lastError);
      }
    }catch(e){ console.error('❌ unexpected:', e?.message||e); }

    // пауза между отправками
    await sleep(gapMs);
  }

  // обновляем локальное хранилище: удаляем только успешно отправленные
  const remaining=allItems.filter(it=>!successfulIds.has(it.id));
  StorageManager.setHistoryItems(remaining);

  updateDisplay(listType);

  const failedCount=itemsToSend.length - successfulIds.size;
  if(failedCount>0) ToastManager.show(`Відправлено: ${successfulIds.size}. Помилка: ${failedCount}`, 'error');
  else ToastManager.show(`Всі ${successfulIds.size} записи успішно відправлено`, 'success');

  button.disabled=false; buttonIcon.style.display='inline-block'; buttonSpinner.style.display='none';
}

/* ---------- LIST / REPORTS / MISC ---------- */
function updateDisplay(listType){
  const allItems=StorageManager.getHistoryItems();
  let itemsToShow, container, summary, empty;

  if(listType==='purchasesList'){
    itemsToShow=allItems.filter(i=>i.type==='Закупка');
    container=document.getElementById('purchasesListItems');
    summary=document.getElementById('purchasesListSummary');
    empty=document.getElementById('purchasesListEmpty');
  }else{
    itemsToShow=allItems.filter(i=>i.type==='Відвантаження'||i.type==='Доставка');
    container=document.getElementById('unloadingListItems');
    summary=document.getElementById('unloadingListSummary');
    empty=document.getElementById('unloadingListEmpty');
  }

  container.innerHTML='';
  if(itemsToShow.length>0){
    empty.style.display='none';
    itemsToShow.forEach(item=>{
      const itemEl=document.createElement('div');
      itemEl.className='cart-item glassmorphism';
      const unitLabel=appConfig.units.find(u=>u.value===item.unit)?.label||item.unit;
      const photoPreviewHTML=item.photoBase64
        ? `<img src="${item.photoBase64}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;margin-right:12px;">`
        : '<div style="width:40px;height:40px;margin-right:12px;"></div>';

      itemEl.innerHTML=`
        <div class="cart-item-header">
          <div style="display:flex;align-items:center;flex-grow:1;">
            ${photoPreviewHTML}
            <div>
              <div class="cart-item-name">${item.productName}</div>
              <div class="cart-item-category">${item.type}</div>
            </div>
          </div>
          <div class="cart-item-actions">
            <button onclick="startEdit('${item.id}')"><i data-lucide="edit-2"></i></button>
            <button class="delete" onclick="deleteItem('${item.id}')"><i data-lucide="trash-2"></i></button>
          </div>
        </div>
        <div class="cart-item-details">
          <div><span class="cart-item-detail-label">Кількість:</span> ${item.quantity} ${unitLabel}</div>
          <div><span class="cart-item-detail-label">Локація:</span> ${item.location}</div>
          <div class="cart-item-total"><span class="cart-item-detail-label">Сума:</span> ${Number(item.totalAmount||0).toFixed(2)} ₴</div>
        </div>`;
      container.appendChild(itemEl);
    });
    summary.textContent=`${itemsToShow.length} запис(ів)`;
  }else{
    empty.style.display='block';
    summary.textContent='Ще немає записів';
  }
  createIconsSafe();
}

function deleteItem(id){
  const item=StorageManager.getHistoryItems().find(x=>x.id===id);
  StorageManager.deleteHistoryItem(id);
  if(item?.type==='Закупка') updateDisplay('purchasesList'); else updateDisplay('unloadingList');
  ToastManager.show('Запис видалено','success');
}

let typeChartInstance=null;
function renderReports(){
  const items=StorageManager.getHistoryItems();
  const statsGrid=document.getElementById('statsGrid');
  statsGrid.innerHTML='';

  const totalSpent=items.reduce((s,i)=>s+(i.totalAmount||0),0);
  const totalItems=items.length;

  const stats=[{label:'Всього витрачено', value:`${totalSpent.toFixed(2)} ₴`},{label:'Всього операцій', value:totalItems}];
  stats.forEach(s=>{
    statsGrid.innerHTML+=`
      <div class="stat-card glassmorphism">
        <div class="stat-card-value">${s.value}</div>
        <div class="stat-card-label">${s.label}</div>
      </div>`;
  });

  const ctx=document.getElementById('typeChart').getContext('2d');
  const dataByType=items.reduce((acc,i)=>{ acc[i.type]=(acc[i.type]||0)+(i.totalAmount||0); return acc; },{});
  if(typeChartInstance) typeChartInstance.destroy();
  typeChartInstance=new Chart(ctx,{
    type:'doughnut',
    data:{ labels:Object.keys(dataByType), datasets:[{ label:'Витрати за типом', data:Object.values(dataByType), backgroundColor:['#4f46e5','#10b981','#f59e0b'], borderColor:'var(--card)', borderWidth:4 }] },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color:'var(--foreground)'} } } }
  });
}

function showEndDayModal(){ document.getElementById('endDayModal').classList.add('visible'); }
function hideEndDayModal(){ document.getElementById('endDayModal').classList.remove('visible'); }
function endWorkDay(){ StorageManager.clearHistory(); updateDisplay('purchasesList'); updateDisplay('unloadingList'); hideEndDayModal(); ToastManager.show('Робочий день завершено. Історію очищено.','success'); }

/* expose */
window.switchTab=switchTab;
window.startPurchase=startPurchase;
window.startUnloading=startUnloading;
window.startDelivery=startDelivery;
window.startEdit=startEdit;
window.deleteItem=deleteItem;
window.showEndDayModal=showEndDayModal;
window.removePhoto=removePhoto;
window.hideEndDayModal=hideEndDayModal;
window.endWorkDay=endWorkDay;
window.sendAllToServer=sendAllToServer;
