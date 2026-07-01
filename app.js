const VERSION = "1.2";
const KEY = "listeo_data_v12";

const STORES = [
  ["lidl","Lidl","🟡"],["carrefour","Carrefour","🔵"],["aldi","Aldi","🔷"],["leclerc","E.Leclerc","🛒"],
  ["auchan","Auchan","🔴"],["inter","Intermarché","🛒"],["action","Action","🛍️"],["grandfrais","Grand Frais","🥕"],
  ["picard","Picard","❄️"],["u","Super U","🔵"],["marche","Marché","🧺"],["todo","À acheter","📝"]
];

const RAYONS = [
  ["Fruits & légumes","🥕"],["Boucherie","🥩"],["Traiteur","🍽️"],["Poissonnerie","🐟"],["Frais","🥛"],
  ["Salé","🥫"],["Sucré","🍪"],["Boulangerie","🥖"],["Boissons","🥤"],["Surgelés","❄️"],
  ["Bio","🍃"],["Enfants","🍼"],["Beauté/Soin","💄"],["Parapharmacie","➕"],["Entretien","🧽"],
  ["Maison","🏠"],["Animalerie","🐱"],["Textile","👕"],["Sport","🏋️"],["Culture/Loisirs","📚"],
  ["Multimédia","🖥️"],["Électroménager","🔌"],["Bricolage/Jardin","🛠️"],["Automobile","🚗"],["Autres","•••"]
];

const CATALOG = [
  ["Poire","Fruits & légumes","🍐",1.8],["Banane","Fruits & légumes","🍌",1.6],["Tomate","Fruits & légumes","🍅",2.4],
  ["Endives","Fruits & légumes","🥬",2.2],["Oignon","Fruits & légumes","🧅",1.2],["Poivron","Fruits & légumes","🫑",2.9],
  ["Merguez","Boucherie","🌭",4.5],["Croque monsieur","Traiteur","🥪",2.5],["Hot-dog","Traiteur","🌭",2.2],
  ["Saumon fumé","Poissonnerie","🐟",5.8],["Emmental","Frais","🧀",2.4],["Fromage fondu","Frais","🧀",1.9],
  ["Bagels","Boulangerie","🥯",2.1],["Lait","Frais","🥛",1.2],["Pizza","Traiteur","🍕",3.6],
  ["Lessive","Entretien","🧴",7.9],["Papier toilette","Maison","🧻",4.8]
];

let data = load();
let screen = "home";
let currentId = data.lists[0]?.id || "todo";
let tab = "list";
let menuOpen = false;
let search = "";

function id(){ return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()); }

function emptyStart(){
  return {
    version: VERSION,
    theme: "light",
    primary: "#7CB342",
    driveConnected: false,
    driveEmail: "",
    lists: STORES.map(s => ({ id:s[0], name:s[1], icon:s[2], order:RAYONS.map(r=>r[0]), items:[] })),
    loyalty: [],
    savedAt: new Date().toISOString()
  };
}

function load(){
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY)); } catch(e) {}
  if(!d){
    d = emptyStart();
    localStorage.setItem(KEY, JSON.stringify(d));
  }
  return d;
}

function save(){
  data.version = VERSION;
  data.savedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(data));
  document.body.className = data.theme === "dark" ? "dark" : "";
  document.documentElement.style.setProperty("--primary", data.primary || "#7CB342");
}

function current(){ return data.lists.find(l => l.id === currentId) || data.lists[0]; }
function unbought(l=current()){ return l.items.filter(i => !i.checked); }
function total(l=current()){ return unbought(l).reduce((s,i)=>s+(Number(i.price)||0),0); }
function euro(v){ return (Math.round((Number(v)||0)*100)/100).toFixed(2).replace(".",",") + " €"; }
function ri(r){ return (RAYONS.find(x=>x[0]===r)||["","🛒"])[1]; }
function esc(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }

function render(){
  save();
  let html = "";
  if(screen === "home") html = appbar("Listeo", false, "v1.2 · listes vides par défaut") + home() + bottom("home");
  if(screen === "list") html = appbar(current().name, true, `${unbought().length} produits · ${euro(total())}`) + tabs() + listPage() + bottom("home") + `<button class="fab" onclick="openAdd()">+</button>`;
  if(screen === "backup") html = appbar("Sauvegarde", true, "Téléphone + export + Google") + backupPage() + bottom("backup");
  if(screen === "cards") html = appbar("Cartes de fidélité") + cardsPage() + bottom("cards");
  if(screen === "settings") html = appbar("Paramètres") + settingsPage() + bottom("settings");
  if(screen === "order") html = appbar("Ordre des rayons", true, current().name) + orderPage() + bottom("home");
  document.getElementById("app").innerHTML = html + menuHtml() + dialogs();
}

function appbar(title, back, sub){
  return `<header class="appbar"><div class="appbar-row">
    <button class="iconbtn" onclick="${back ? "screen='home';render()" : "menuOpen=true;render()"}">${back ? "‹" : "☰"}</button>
    <h1>${title}</h1>
    <button class="iconbtn" onclick="menuOpen=!menuOpen;render()">⋮</button>
  </div>${sub ? `<div class="sub">${sub}</div>` : ""}</header>`;
}

function bottom(active){
  return `<nav class="bottom">
    <button class="${active==='home'?'active':''}" onclick="screen='home';render()"><span>🏠</span>Listes</button>
    <button class="${active==='backup'?'active':''}" onclick="screen='backup';render()"><span>💾</span>Sauvegarde</button>
    <button class="${active==='cards'?'active':''}" onclick="screen='cards';render()"><span>💳</span>Cartes</button>
    <button class="${active==='settings'?'active':''}" onclick="screen='settings';render()"><span>⚙️</span>Réglages</button>
  </nav>`;
}

function menuHtml(){
  if(!menuOpen) return "";
  return `<div class="menu">
    <button onclick="shareList()">Partager</button>
    <button onclick="openAdd()">Ajouter un produit</button>
    <button onclick="voiceAdd()">Reconnaissance vocale</button>
    <button onclick="screen='order';menuOpen=false;render()">Ordre des rayons</button>
    <button onclick="clearChecked()">Supprimer les cochés</button>
    <button onclick="emptyCurrent()">Vider cette liste</button>
    <button onclick="screen='backup';menuOpen=false;render()">Sauvegarde / Google</button>
  </div>`;
}

function home(){
  const count = data.lists.reduce((s,l)=>s+unbought(l).length,0);
  return `<main class="container">
    <div class="notice">Aucun produit n’est ajouté automatiquement. Les listes sont vides tant que tu n’ajoutes rien.</div>
    <div class="kpis"><div><b>${count}</b><span class="small">produits à acheter</span></div><div><b>${euro(data.lists.reduce((s,l)=>s+total(l),0))}</b><span class="small">total estimé</span></div></div>
    <button class="btn full" onclick="newList()">+ Nouvelle liste personnalisée</button><br><br>
    ${data.lists.map(l=>`<div class="card">
      <button class="store" onclick="openList('${l.id}')">
        <div class="logo">${l.icon}</div>
        <div class="info"><div class="name">${esc(l.name)}</div><div class="meta">${unbought(l).length} produit${unbought(l).length>1?'s':''} à acheter · ${euro(total(l))}</div></div>
        <span class="small">›</span>
      </button>
    </div>`).join("")}
  </main>`;
}

function openList(listId){
  currentId = listId;
  tab = "list";
  screen = "list";
  menuOpen = false;
  search = "";
  render();
}

function tabs(){
  return `<div class="tabs">
    <button class="${tab==='list'?'active':''}" onclick="tab='list';render()">LISTE ${unbought().length}</button>
    <button class="${tab==='products'?'active':''}" onclick="tab='products';render()">PRODUITS</button>
    <button class="${tab==='prices'?'active':''}" onclick="tab='prices';render()">PRIX</button>
  </div>`;
}

function listPage(){
  if(tab === "products") return productsPage();
  if(tab === "prices") return pricesPage();
  const l = current();
  const items = l.items.filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));
  return `<main class="container">
    <div class="search"><input placeholder="Rechercher..." value="${esc(search)}" oninput="search=this.value;render()"><button class="btn secondary" onclick="search='';render()">×</button></div>
    ${items.length ? grouped(items) : `<div class="card empty">Cette liste est vide. Appuie sur + pour ajouter un produit.</div>`}
  </main>`;
}

function grouped(items){
  const l = current();
  const buckets = {};
  items.forEach(i => (buckets[i.rayon] ??= []).push(i));
  return l.order.filter(r => buckets[r]).map(r => `<div class="section">${ri(r)} ${r}</div><div class="card">${buckets[r].map(itemHtml).join("")}</div>`).join("");
}

function itemHtml(i){
  return `<div class="item ${i.checked?'checked':''}">
    <span class="emoji">${i.icon || "🛒"}</span>
    <input class="check" type="checkbox" ${i.checked?'checked':''} onchange="toggle('${i.id}')">
    <div class="label" onclick="toggle('${i.id}')">${esc(i.name)}<div class="small">${i.rayon} · ${euro(i.price)}</div></div>
    <button class="iconbtn" style="color:var(--primary)" onclick="fav('${i.id}')">${i.favorite?'♥':'♡'}</button>
  </div>`;
}

function productsPage(){
  return `<main class="container">
    <div class="notice">Catalogue rapide : appuie sur un produit pour l’ajouter à la liste actuelle.</div>
    <div class="grid">${CATALOG.map(p=>`<button class="tile" onclick="addCatalog('${esc(p[0])}')"><span class="emoji">${p[2]}</span><b>${esc(p[0])}</b><div class="small">${p[1]}</div></button>`).join("")}</div>
  </main>`;
}

function pricesPage(){
  const l = current();
  return `<main class="container">
    <div class="card pad"><b>Total estimé : ${euro(total(l))}</b></div>
    ${l.items.length ? `<div class="card">${l.items.map(i=>`<div class="item"><span class="emoji">${i.icon}</span><div class="label">${esc(i.name)}<div class="small">${i.rayon}</div></div><input style="max-width:115px" type="number" step="0.01" value="${Number(i.price)||0}" onchange="setPrice('${i.id}',this.value)"></div>`).join("")}</div>` : `<div class="card empty">Aucun prix : la liste est vide.</div>`}
  </main>`;
}

function backupPage(){
  return `<main class="container">
    <div class="card pad">
      <h2>Sauvegarde sur téléphone</h2>
      <p class="small">Sauvegarde automatique dans ce navigateur. Bouton manuel ajouté au cas où.</p>
      <button class="btn full" onclick="manualSave()">Sauvegarder sur ce téléphone</button>
      <p class="small">Dernière sauvegarde : ${new Date(data.savedAt).toLocaleString("fr-FR")}</p>
    </div>
    <div class="card pad">
      <h2>Export / Import</h2>
      <div class="row"><button class="btn" onclick="exportJson()">Exporter JSON</button><button class="btn secondary" onclick="document.getElementById('importFile').click()">Importer JSON</button></div>
    </div>
    <div class="card pad">
      <h2>Google Drive</h2>
      <p class="small">Connexion Google Drive : ${data.driveConnected ? "connectée à " + esc(data.driveEmail) : "non connectée"}</p>
      <button class="btn full" onclick="connectDrive()">Connexion Google</button><br><br>
      <button class="btn secondary full" onclick="driveBackup()">Sauvegarder vers Google Drive</button>
      <p class="small">Pour une vraie synchro automatique Google Drive, il faudra créer une clé OAuth Google Cloud. Ici je mets déjà l’écran et le flux prévu sans mentir à l’application.</p>
    </div>
  </main>`;
}

function cardsPage(){
  return `<main class="container">
    <div class="card pad"><input id="cardName" placeholder="Magasin"><br><br><input id="cardCode" placeholder="Numéro / code-barres"><br><br><button class="btn full" onclick="addCard()">Ajouter une carte</button></div>
    ${data.loyalty.length ? data.loyalty.map((c,i)=>`<div class="card pad"><h2>${esc(c.name)}</h2><div style="font-size:26px;letter-spacing:2px;text-align:center;padding:20px;border:1px dashed var(--line);border-radius:16px">${esc(c.code)}</div><br><button class="btn danger full" onclick="removeCard(${i})">Supprimer</button></div>`).join("") : `<div class="card empty">Aucune carte pour l’instant.</div>`}
  </main>`;
}

function settingsPage(){
  return `<main class="container">
    <div class="card pad"><h2>Apparence</h2><button class="btn secondary full" onclick="data.theme=data.theme==='dark'?'light':'dark';render()">Mode ${data.theme==='dark'?'clair':'sombre'}</button><br><br>
    <div class="row">${["#7CB342","#2196F3","#E53935","#FB8C00","#8E24AA"].map(c=>`<button class="color-dot" style="background:${c}" onclick="data.primary='${c}';render()"></button>`).join("")}</div></div>
    <div class="card pad"><h2>Réinitialisation</h2><button class="btn danger full" onclick="resetAll()">Tout effacer</button></div>
  </main>`;
}

function orderPage(){
  const l = current();
  return `<main class="container">${l.order.map((r,i)=>`<div class="card store"><div class="logo">${ri(r)}</div><div class="info"><div class="name">${r}</div></div><button class="btn secondary" onclick="moveRayon(${i},-1)">↑</button><button class="btn secondary" onclick="moveRayon(${i},1)">↓</button></div>`).join("")}</main>`;
}

function dialogs(){
  return `<dialog id="addDlg"><h2>Ajouter un produit</h2><input id="pName" placeholder="Nom du produit"><br><br><select id="pRayon">${RAYONS.map(r=>`<option>${r[0]}</option>`).join("")}</select><br><br><input id="pPrice" type="number" step="0.01" placeholder="Prix estimé"><br><br><div class="row"><button class="btn" onclick="addManual()">Ajouter</button><button class="btn secondary" onclick="document.getElementById('addDlg').close()">Annuler</button></div></dialog>`;
}

function openAdd(){ menuOpen=false; render(); setTimeout(()=>document.getElementById("addDlg").showModal(),0); }
function addManual(){
  const name = document.getElementById("pName").value.trim();
  if(!name) return alert("Nom obligatoire.");
  const rayon = document.getElementById("pRayon").value;
  const found = CATALOG.find(p=>p[0].toLowerCase()===name.toLowerCase());
  current().items.push({id:id(),name,rayon,icon:found?.[2]||ri(rayon),price:Number(document.getElementById("pPrice").value)||0,checked:false,favorite:false});
  document.getElementById("addDlg").close(); render();
}
function addCatalog(name){ const p=CATALOG.find(x=>x[0]===name); if(!p)return; current().items.push({id:id(),name:p[0],rayon:p[1],icon:p[2],price:p[3],checked:false,favorite:false}); render(); }
function toggle(itemId){ const i=current().items.find(x=>x.id===itemId); if(i){i.checked=!i.checked; render();} }
function fav(itemId){ const i=current().items.find(x=>x.id===itemId); if(i){i.favorite=!i.favorite; render();} }
function setPrice(itemId,v){ const i=current().items.find(x=>x.id===itemId); if(i){i.price=Number(v)||0; render();} }
function newList(){ const name=prompt("Nom de la liste ?"); if(!name)return; data.lists.push({id:id(),name,icon:"🛒",order:RAYONS.map(r=>r[0]),items:[]}); render(); }
function emptyCurrent(){ if(confirm("Vider cette liste ?")){current().items=[];menuOpen=false;render();} }
function clearChecked(){ if(confirm("Supprimer les produits cochés ?")){current().items=current().items.filter(i=>!i.checked);menuOpen=false;render();} }
function moveRayon(i,d){ const a=current().order; const j=i+d; if(j<0||j>=a.length)return; [a[i],a[j]]=[a[j],a[i]]; render(); }
function manualSave(){ save(); alert("Sauvegardé sur ce téléphone."); }
function exportJson(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="listeo-sauvegarde-v1-2.json"; a.click(); }
function connectDrive(){ const email=prompt("Adresse Gmail à associer pour préparer la sauvegarde Drive :"); if(!email)return; data.driveConnected=true; data.driveEmail=email; render(); alert("Connexion Google simulée pour cette version. La vraie synchro OAuth sera ajoutée quand on aura la clé Google Cloud."); }
function driveBackup(){ exportJson(); alert("Pour cette version, le fichier JSON est téléchargé. Tu peux le déposer dans Google Drive. La synchro directe arrive après configuration OAuth."); }
function shareList(){
  const l=current();
  const txt=`Liste ${l.name}\n\n`+l.order.map(r=>{const a=l.items.filter(i=>!i.checked&&i.rayon===r).map(i=>"☐ "+i.name);return a.length?`${r}\n${a.join("\n")}`:""}).filter(Boolean).join("\n\n");
  if(navigator.share) navigator.share({text:txt}); else navigator.clipboard?.writeText(txt).then(()=>alert("Liste copiée."));
}
function voiceAdd(){ alert("Reconnaissance vocale prévue. On l’activera proprement après stabilisation des listes."); }
function addCard(){ const n=document.getElementById("cardName").value.trim(), c=document.getElementById("cardCode").value.trim(); if(!n||!c)return alert("Nom et code obligatoires."); data.loyalty.push({name:n,code:c}); render(); }
function removeCard(i){ data.loyalty.splice(i,1); render(); }
function resetAll(){ if(confirm("Tout effacer ?")){ localStorage.removeItem(KEY); data=emptyStart(); currentId=data.lists[0].id; screen="home"; render(); } }

window.addEventListener("load",()=>{
  save();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
  document.getElementById("importFile").addEventListener("change",e=>{
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=()=>{try{data=JSON.parse(r.result); currentId=data.lists[0]?.id||"todo"; save(); render();}catch{alert("Fichier JSON invalide.");}};
    r.readAsText(f);
  });
  render();
});
