const $ = (id) => document.getElementById(id);
const money = new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
const STORAGE_INVOICES='driveinvoice.invoices.v1';
const STORAGE_SETTINGS='driveinvoice.settings.v1';
let editingId=null;

function parseAmount(v){
  if(typeof v==='number') return Number.isFinite(v)?v:0;
  const cleaned=String(v??'').trim().replace(/\s/g,'').replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'');
  const n=Number(cleaned); return Number.isFinite(n)?n:0;
}
function dateNL(v){if(!v)return ''; const [y,m,d]=v.split('-'); return `${d}-${m}-${y}`}
function today(){return new Date().toISOString().slice(0,10)}
function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())}
function loadJSON(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
function saveJSON(k,v){localStorage.setItem(k,JSON.stringify(v))}

const defaultSettings={companyName:'Rijschool den Hartog',companyContact:'',companyStreet:'',companyCity:'',companyPhone:'',companyEmail:'',companyWebsite:'www.rijschooldenhartog.nl',companyKvk:'',companyVat:'',companyIban:'',priceLesson:'70,00',pricePractical:'285,00',priceReexam:'260,00',priceTtt:'225,00',priceCbr:'143,50'};

function productPrice(type){
  const s=getSettings();
  const map={
    'Rijles':parseAmount(s.priceLesson),
    'Praktijkexamen':parseAmount(s.pricePractical),
    'Herexamen':parseAmount(s.priceReexam),
    'Tussentijdse toets':parseAmount(s.priceTtt)
  };
  return Object.prototype.hasOwnProperty.call(map,type)?map[type]:60;
}

function addLine(data={}){
  const node=$('lineTemplate').content.firstElementChild.cloneNode(true);
  node.querySelector('.line-type').value=data.type??'Rijles';
  node.querySelector('.line-duration').value=data.duration??'60 minuten';
  node.querySelector('.line-description').value=data.description??'';
  node.querySelector('.line-qty').value=data.qty??1;
  const initialType=data.type??'Rijles';
  const initialPrice=data.price!==undefined?data.price:productPrice(initialType);
  node.querySelector('.line-price').value=Number(initialPrice).toFixed(2).replace('.',',');
  node.querySelector('.line-vat').value=String(data.vat??21);
  node.querySelector('.remove-line').onclick=()=>{node.remove(); if(!$('lines').children.length)addLine(); calculate()};
  const typeSelect=node.querySelector('.line-type');
  typeSelect.addEventListener('change',()=>{
    node.querySelector('.line-price').value=productPrice(typeSelect.value).toFixed(2).replace('.',',');
    syncDescription(node); calculate();
  });
  node.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{syncDescription(node);calculate()}));
  $('lines').appendChild(node); syncDescription(node); calculate();
}
function syncDescription(line){
  const desc=line.querySelector('.line-description');
  if(desc.dataset.manual==='1')return;
  const type=line.querySelector('.line-type').value,duration=line.querySelector('.line-duration').value;
  desc.value=type==='Rijles'?`Rijles ${duration}`:type;
  desc.oninput=()=>desc.dataset.manual='1';
}
function collectLines(){return [...document.querySelectorAll('.invoice-line')].map(line=>({
  type:line.querySelector('.line-type').value,duration:line.querySelector('.line-duration').value,description:line.querySelector('.line-description').value.trim(),qty:Number(line.querySelector('.line-qty').value)||0,price:parseAmount(line.querySelector('.line-price').value),vat:Number(line.querySelector('.line-vat').value)||0
}));}
function calculate(){
  let subtotal=0,vatTotal=0;
  document.querySelectorAll('.invoice-line').forEach(line=>{
    const qty=Number(line.querySelector('.line-qty').value)||0,price=parseAmount(line.querySelector('.line-price').value),vat=Number(line.querySelector('.line-vat').value)||0;
    const total=qty*price; subtotal+=total; vatTotal+=total*vat/100; line.querySelector('.line-total').textContent=money.format(total);
  });
  const grand=subtotal+vatTotal,paid=parseAmount($('paidAmount').value),open=Math.max(0,grand-paid);
  $('subtotal').textContent=money.format(subtotal); $('vatTotal').textContent=money.format(vatTotal); $('grandTotal').textContent=money.format(grand); $('openAmount').textContent=money.format(open);
  return{subtotal,vatTotal,grand,paid,open};
}
function collectInvoice(status='invoice'){
  const totals=calculate(); return {id:editingId??uid(),status,createdAt:new Date().toISOString(),invoiceNumber:$('invoiceNumber').value.trim(),term:$('term').value.trim(),invoiceDate:$('invoiceDate').value,paymentDays:Number($('paymentDays').value)||0,reference:$('reference').value.trim(),customer:{name:$('customerName').value.trim(),street:$('customerStreet').value.trim(),postal:$('customerPostal').value.trim(),city:$('customerCity').value.trim()},lines:collectLines(),paid:totals.paid,...totals};
}
function validateInvoice(inv){if(!inv.invoiceNumber)return 'Vul een factuurnummer in.'; if(!inv.customer.name)return 'Vul de naam van de leerling in.'; if(!inv.lines.length)return 'Voeg minimaal één factuurregel toe.'; return ''}
function saveInvoice(status){
  const inv=collectInvoice(status),error=validateInvoice(inv); if(error){alert(error);return}
  const all=loadJSON(STORAGE_INVOICES,[]),idx=all.findIndex(x=>x.id===inv.id); if(idx>=0)all[idx]=inv;else all.unshift(inv); saveJSON(STORAGE_INVOICES,all); editingId=inv.id; renderSaved(); alert(status==='draft'?'Concept opgeslagen.':'Factuur opgeslagen.');
}
function clearForm(){editingId=null; ['invoiceNumber','term','reference','customerName','customerStreet','customerPostal','customerCity'].forEach(id=>$(id).value=''); $('invoiceDate').value=today(); $('paymentDays').value=14; $('paidAmount').value='0,00'; $('lines').innerHTML=''; addLine();calculate()}
function loadInvoice(id){const inv=loadJSON(STORAGE_INVOICES,[]).find(x=>x.id===id);if(!inv)return;editingId=id;$('invoiceNumber').value=inv.invoiceNumber;$('term').value=inv.term;$('invoiceDate').value=inv.invoiceDate;$('paymentDays').value=inv.paymentDays;$('reference').value=inv.reference;$('customerName').value=inv.customer.name;$('customerStreet').value=inv.customer.street;$('customerPostal').value=inv.customer.postal;$('customerCity').value=inv.customer.city;$('paidAmount').value=(inv.paid||0).toFixed(2).replace('.',',');$('lines').innerHTML='';inv.lines.forEach(addLine);showView('invoice');calculate()}
function duplicateInvoice(id){const inv=loadJSON(STORAGE_INVOICES,[]).find(x=>x.id===id);if(!inv)return;loadInvoice(id);editingId=null;$('invoiceNumber').value='';$('invoiceDate').value=today();if(inv.term&&inv.term.includes('/')){const[a,b]=inv.term.split('/').map(Number);if(a&&b&&a<b)$('term').value=`${a+1}/${b}`;}showView('invoice')}
function deleteInvoice(id){if(!confirm('Deze factuur verwijderen?'))return;saveJSON(STORAGE_INVOICES,loadJSON(STORAGE_INVOICES,[]).filter(x=>x.id!==id));renderSaved()}
function renderSaved(){const root=$('savedInvoices'),all=loadJSON(STORAGE_INVOICES,[]);root.innerHTML='';if(!all.length){root.innerHTML='<p>Nog geen facturen opgeslagen.</p>';return}all.forEach(inv=>{const c=document.createElement('div');c.className='saved-card';c.innerHTML=`<div><strong>${inv.invoiceNumber} — ${inv.customer.name}</strong><small>${dateNL(inv.invoiceDate)} · ${inv.status==='draft'?'Concept':'Factuur'} · ${money.format(inv.grand)}</small></div><div class="saved-actions"><button data-a="open" class="secondary">Openen</button><button data-a="copy" class="secondary">Kopiëren</button><button data-a="delete" class="danger">Verwijderen</button></div>`;c.querySelector('[data-a=open]').onclick=()=>loadInvoice(inv.id);c.querySelector('[data-a=copy]').onclick=()=>duplicateInvoice(inv.id);c.querySelector('[data-a=delete]').onclick=()=>deleteInvoice(inv.id);root.appendChild(c)})}
function getSettings(){return {...defaultSettings,...loadJSON(STORAGE_SETTINGS,{})}}
function loadSettings(){const s=getSettings();Object.keys(s).forEach(k=>{const el=$(k);if(el)el.value=s[k]})}
function saveSettings(){const s={};Object.keys(defaultSettings).forEach(k=>s[k]=$(k).value.trim());saveJSON(STORAGE_SETTINGS,s);alert('Instellingen opgeslagen.')}
function previewHTML(inv){const s=getSettings();const due=new Date(inv.invoiceDate||today());due.setDate(due.getDate()+inv.paymentDays);const lines=inv.lines.map(l=>`<tr><td>${escapeHTML(l.description)}</td><td class="num">${l.qty}</td><td class="num">${money.format(l.price)}</td><td class="num">${l.vat}%</td><td class="num">${money.format(l.qty*l.price)}</td></tr>`).join('');return `<div class="invoice-top"><div><div class="brand-title">${escapeHTML(s.companyName)}</div><p>${escapeHTML(s.companyContact)}<br>${escapeHTML(s.companyStreet)}<br>${escapeHTML(s.companyCity)}</p></div><div class="right"><p>${escapeHTML(s.companyPhone)}<br>${escapeHTML(s.companyEmail)}<br>${escapeHTML(s.companyWebsite)}</p></div></div><div class="invoice-meta"><div><strong>Factuur aan</strong><p>${escapeHTML(inv.customer.name)}<br>${escapeHTML(inv.customer.street)}<br>${escapeHTML(inv.customer.postal)} ${escapeHTML(inv.customer.city)}</p></div><div class="meta-table"><strong>Factuurnummer</strong><span>${escapeHTML(inv.invoiceNumber)}</span><strong>Termijn</strong><span>${escapeHTML(inv.term||'-')}</span><strong>Factuurdatum</strong><span>${dateNL(inv.invoiceDate)}</span><strong>Vervaldatum</strong><span>${due.toLocaleDateString('nl-NL')}</span><strong>Referentie</strong><span>${escapeHTML(inv.reference||'-')}</span></div></div><table class="invoice-table"><thead><tr><th>Omschrijving</th><th class="num">Aantal</th><th class="num">Prijs</th><th class="num">BTW</th><th class="num">Totaal</th></tr></thead><tbody>${lines}</tbody></table><div class="preview-totals"><span>Subtotaal excl. btw</span><strong>${money.format(inv.subtotal)}</strong><span>BTW</span><strong>${money.format(inv.vatTotal)}</strong><span class="grand">Totaal</span><strong class="grand">${money.format(inv.grand)}</strong><span>Reeds voldaan</span><strong>${money.format(inv.paid)}</strong><span class="grand">Openstaand</span><strong class="grand">${money.format(inv.open)}</strong></div><div class="invoice-footer"><div><strong>KvK</strong><br>${escapeHTML(s.companyKvk)}</div><div><strong>BTW-nummer</strong><br>${escapeHTML(s.companyVat)}</div><div><strong>IBAN</strong><br>${escapeHTML(s.companyIban)}</div></div>`}
function escapeHTML(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
function showPreview(){const inv=collectInvoice('invoice'),error=validateInvoice(inv);if(error){alert(error);return}$('invoicePreview').innerHTML=previewHTML(inv);$('previewDialog').showModal()}
function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));$(`${name}View`).classList.add('active');if(name==='saved')renderSaved();if(name==='settings')loadSettings()}

document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>showView(t.dataset.view));$('addLineBtn').onclick=()=>addLine();$('paidAmount').addEventListener('input',calculate);$('saveDraftBtn').onclick=()=>saveInvoice('draft');$('saveInvoiceBtn').onclick=()=>saveInvoice('invoice');$('previewBtn').onclick=showPreview;$('printBtn').onclick=()=>{showPreview();setTimeout(()=>window.print(),150)};$('closePreviewBtn').onclick=()=>$('previewDialog').close();$('printPreviewBtn').onclick=()=>window.print();$('saveSettingsBtn').onclick=saveSettings;$('newInvoiceBtn').onclick=()=>{clearForm();showView('invoice')};
$('invoiceDate').value=today();addLine();loadSettings();renderSaved();

let deferredPrompt;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('installBtn').hidden=false});$('installBtn').onclick=async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$('installBtn').hidden=true};
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
