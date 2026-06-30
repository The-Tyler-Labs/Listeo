const VERSION = "1.1";
const KEY = "listeo_data_v1";
const importInput = () => document.getElementById("importFile");

const STORE_PRESETS = [
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
  ["Poire","Fruits & légumes","🍐",1.80],["Banane","Fruits & légumes","🍌",1.60],["Tomate","Fruits & légumes","🍅",2.40],
  ["Endives","Fruits & légumes","🥬",2.20],["Oignon","Fruits & légumes","🧅",1.20],["Poivron","Fruits & légumes","🫑",2.90],
  ["Concombre","Fruits & légumes","🥒",1.10],["Courgette","Fruits & légumes","🥒",1.70],["Pommes de terre","Fruits & légumes","🥔",2.60],
  ["Merguez","Boucherie","🌭",4.50],["Steak haché","Boucherie","🥩",5.20],["Poulet","Boucherie","🍗",6.40],
  ["Croque monsieur","Traiteur","🥪",2.50],["Hot-dog","Traiteur","🌭",2.20],["Pizza","Traiteur","🍕",3.60],["Knacki","Traiteur","🌭",2.10],
  ["Saumon fumé","Poissonnerie","🐟",5.80],["Colin","Poissonnerie","🐟",4.30],
  ["Emmental","Frais","🧀",2.40],["Fromage fondu","Frais","🧀",1.90],["Lait","Frais","🥛",1.20],["Lait poudre","Frais","🥛",5.20],
  ["Kiri","Frais","🧀",2.10],["Beurre","Frais","🧈",2.70],["Yaourt","Frais","🥣",2.20],
  ["Bagels","Boulangerie","🥯",2.10],["Pain","Boulangerie","🥖",1.20],
  ["Coca-Cola","Boissons","🥤",2.00],["Eau gazeuse","Boissons","💧",0.90],
  ["Lessive","Entretien","🧴",7.90],["Papier toilette","Maison","🧻",4.80]
];

let data = loadData();
let screen = "home";
let currentListId = data.lists[0]?.id;
let tab = "list";
let showMenu = false;
let searchText = "";

function uuid(){ return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()); }
function starter(){
  const lists = STORE_PRESETS.slice(0,9).map((s, index) => ({
    id:s[0], name:s[1], icon:s[2], color:"#7CB342", order:RAYONS.map(r=>r[0]),
    items: CATALOG.slice(0, index === 0 ? 12 : 3 + (index % 6)).map((p,i)=>({
      id:uuid(), name:p[0], rayon:p[1], icon:p[2], price:p[3], checked:false, favorite:i%4===0, uses:i%3
    }))
  }));
  return {version:VERSION, theme:"light", primary:"#7CB342", lists, loyalty:[], savedAt:new Date().toISOString()};
}
function loadData(){
  try { return JSON.parse(localStorage.getItem(KEY)) || starter(); }
  catch { return starter(); }
}
function saveData(){
  data.version = VERSION;
  data.savedAt = new Date().toISOString();
  localStorage.setItem(KEY, JSON.stringify(data));
  document.body.className = data.theme === "dark" ? "dark" : "";
  document.documentElement.style.setProperty("--primary", data.primary || "#7CB342");
}
function list(){ return data.lists.find(l => l.id === currentListId) || data.lists[0]; }
function euro(v){ return (Math.round((Number(v)||0)*100)/100).toFixed(2).replace(".",",") + " €"; }
function rayonIcon(name){ return (RAYONS.find(r=>r[0]===name)||["","🛒"])[1]; }
function activeItems(l=list()){ return l.items.filter(i=>!i.checked); }
function total(l=list()){ return activeItems(l).reduce((s,i)=>s+(Number(i.price)||0),0); }

function appbar(title, back=false, sub=""){
  return `<header class="appbar">
    <div class="appbar-row">
      <button class="iconbtn" onclick="${back ? "screen='home';render()" : "showMenu=true;render()"}">${back ? "‹" : "☰"}</button>
      <h1>${title}</h1>
      <button class="iconbtn" onclick="showMenu=!showMenu;render()">⋮</button>
    </div>${sub ? `<div class="subtitle">${sub}</div>` : ""}
  </header>`;
}
function bottom(active){
  return `<nav class="bottom">
    <button class="${active==="home"?"active":""}" onclick="screen='home';render()"><span>🏠</span>Listes</button>
    <button class="${active==="fav"?"active":""}" onclick="screen='favorites';render()"><span>💚</span>Favoris</button>
    <button class="${active==="cards"?"active":""}" onclick="screen='cards';render()"><span>💳</span>Cartes</button>
    <button class="${active==="settings"?"active":""}" onclick="screen='settings';render()"><span>⚙️</span>Réglages</button>
  </nav>`;
}
function menuHtml(){
  if(!showMenu) return "";
  return `<div class="menu">
    <button onclick="shareCurrent()">Partager la liste</button>
    <button onclick="voiceAdd()">Reconnaissance vocale</button>
    <button onclick="openAddDialog()">Ajouter un produit</button>
    <button onclick="screen='order';showMenu=false;render()">Ordre des rayons</button>
    <button onclick="clearChecked()">Supprimer les cochés</button>
    <button onclick="emptyList()">Vider toute la liste</button>
    <button onclick="screen='settings';showMenu=false;render()">Sauvegarde / paramètres</button>
  </div>`;
}
function tabs(){
  const l = list();
  return `<div class="tabs">
    <button class="${tab==="list"?"active":""}" onclick="tab='list';screen='list';render()">LISTE ${activeItems(l).length}</button>
    <button class="${tab==="products"?"active":""}" onclick="tab='products';screen='list';render()">PRODUITS</button>
    <button class="${tab==="prices"?"active":""}" onclick="tab='prices';screen='list';render()">PRIX</button>
  </div>`;
}
function render(){
  saveData();
  const root = document.getElementById("app");
  let html = "";
  if(screen==="home") html = appbar("Listeo", false, `v${VERSION} · sauvegarde locale téléphone`) + home() + bottom("home");
  if(screen==="list") html = appbar(list().name, true, `${activeItems().length} produits · ${euro(total())}`) + tabs() + listScreen() + bottom("home") + `<button class="fab" onclick="openAddDialog()">+</button>`;
  if(screen==="favorites") html = appbar("Favoris") + favorites() + bottom("fav");
  if(screen==="cards") html = appbar("Cartes de fidélité") + cards() + bottom("cards");
  if(screen==="settings") html = appbar("Paramètres") + settings() + bottom("settings");
  if(screen==="order") html = appbar("Ordre des rayons", true, list().name) + orderScreen() + bottom("home");
  root.innerHTML = html + menuHtml() + dialogs();
}
function home(){
  const allActive = data.lists.reduce((s,l)=>s+activeItems(l).length,0);
  const allTotal = data.lists.reduce((s,l)=>s+total(l),0);
  return `<main class="container">
    <section class="card pad hero">
      <div class="hero-icon">🛒</div>
      <div style="flex:1"><b style="font-size:22px">Mes listes de courses</b><div class="small">Tout reste sur ce téléphone. Export JSON conseillé.</div></div>
    </section>
    <section class="kpi">
      <div><b>${allActive}</b><span class="small">produits à acheter</span></div>
      <div><b>${euro(allTotal)}</b><span class="small">total estimé</span></div>
    </section><br>
    <button class="btn full" onclick="newList()">+ Nouvelle liste</button><br><br>
    <div class="layout">${data.lists.map(l => `<article class="card store" onclick="currentListId='${l.id}';screen='list';tab='list';render()">
      <div class="logo">${l.icon}</div>
      <div class="info"><div class="name">${escapeHtml(l.name)}</div><div class="meta">${activeItems(l).length} produits · ${euro(total(l))}</div></div>
      <div class="actions"><button class="btn ghost" onclick="event.stopPropagation();currentListId='${l.id}';shareCurrent()">↗</button></div>
    </article>`).join("")}</div>
  </main>`;
}
function listScreen(){
  if(tab==="products") return productsScreen();
  if(tab==="prices") return pricesScreen();
  const l = list();
  const items = l.items.filter(i=> !searchText || i.name.toLowerCase().includes(searchText.toLowerCase()));
  const groups = groupByRayon(items, l.order);
  return `<main class="container">
    <div class="search"><input placeholder="Rechercher dans la liste..." value="${escapeAttr(searchText)}" oninput="searchText=this.value;render()"><button class="btn secondary" onclick="searchText='';render()">×</button></div>
    <div class="notice">💾 Sauvegarde automatique sur ce téléphone. L’appli fonctionne aussi hors connexion après ouverture.</div>
    ${groups || `<div class="card empty">Liste vide. Appuie sur + pour ajouter un produit.</div>`}
  </main>`;
}
function groupByRayon(items, order){
  const buckets = {};
  items.forEach(i => (buckets[i.rayon] ??= []).push(i));
  return order.filter(r => buckets[r]?.length).map(r => `<section>
    <div class="section-head">${rayonIcon(r)} ${r} <span class="count">${buckets[r].filter(i=>!i.checked).length}</span></div>
    <div class="card">${buckets[r].map(itemHtml).join("")}</div>
  </section>`).join("");
}
function itemHtml(i){
  return `<div class="item ${i.checked?'checked':''}">
    <span class="emoji">${i.icon || "🛒"}</span>
    <input class="check" type="checkbox" ${i.checked?"checked":""} onchange="toggleItem('${i.id}')">
    <div class="item-name" onclick="toggleItem('${i.id}')">${escapeHtml(i.name)}<div class="price">${i.rayon} · ${euro(i.price)}</div></div>
    <button class="iconbtn" style="color:var(--primary)" onclick="toggleFav('${i.id}')">${i.favorite?"♥":"♡"}</button>
  </div>`;
}
function productsScreen(){
  return `<main class="container">
    <div class="search"><input placeholder="Chercher dans le catalogue..." oninput="filterCatalog(this.value)"><button class="btn" onclick="openAddDialog()">Produit libre</button></div>
    <div id="catalogArea">${catalogHtml(CATALOG)}</div>
  </main>`;
}
function catalogHtml(items){
  const buckets = {};
  items.forEach(p => (buckets[p[1]] ??= []).push(p));
  return Object.keys(buckets).map(r => `<div class="section-head">${rayonIcon(r)} ${r}</div><div class="grid">${buckets[r].map(p=>`<button class="tile" onclick="addCatalog('${escapeAttr(p[0])}')"><span class="emoji">${p[2]}</span><b>${p[0]}</b><span class="small">${euro(p[3])}</span></button>`).join("")}</div>`).join("");
}
function pricesScreen(){
  const l = list();
  return `<main class="container"><div class="card pad"><b>Total non coché : ${euro(total(l))}</b><div class="small">Les prix sont modifiables produit par produit.</div></div>
    <div class="card">${l.items.map(i=>`<div class="item"><span class="emoji">${i.icon}</span><div class="item-name">${escapeHtml(i.name)}<div class="price">${i.rayon}</div></div><input style="max-width:110px" type="number" step="0.01" value="${Number(i.price)||0}" onchange="setPrice('${i.id}',this.value)"></div>`).join("")}</div>
  </main>`;
}
function favorites(){
  const favs = [];
  data.lists.forEach(l => l.items.forEach(i => { if(i.favorite || i.uses > 1) favs.push({...i, source:l.name}); }));
  return `<main class="container">
    <div class="notice">Les favoris remontent automatiquement quand tu coches souvent un produit. Oui, c’est le petit côté “liste qui apprend”, sans devenir Skynet.</div>
    <br>${favs.length ? `<div class="card">${favs.map(i=>`<div class="item"><span class="emoji">${i.icon}</span><div class="item-name">${escapeHtml(i.name)}<div class="price">${i.rayon} · ${escapeHtml(i.source)}</div></div><button class="btn secondary" onclick="addFavoriteToCurrent('${escapeAttr(i.name)}')">Ajouter</button></div>`).join("")}</div>` : `<div class="card empty">Aucun favori pour l’instant.</div>`}
  </main>`;
}
function cards(){
  return `<main class="container">
    <div class="card pad">
      <h2>Ajouter une carte</h2>
      <input id="cardName" placeholder="Magasin"><br><br>
      <input id="cardCode" placeholder="Numéro ou code-barres"><br><br>
      <button class="btn full" onclick="addCard()">Ajouter</button>
    </div>
    ${data.loyalty.length ? data.loyalty.map((c,i)=>`<div class="card pad"><div class="store"><div class="logo">💳</div><div class="info"><div class="name">${escapeHtml(c.name)}</div><div class="meta">Carte de fidélité</div></div></div><div style="font-size:28px;letter-spacing:2px;text-align:center;padding:20px;border:1px dashed var(--line);border-radius:16px">${escapeHtml(c.code)}</div><br><button class="btn danger full" onclick="removeCard(${i})">Supprimer</button></div>`).join("") : `<div class="card empty">Aucune carte pour l’instant.</div>`}
  </main>`;
}
function settings(){
  return `<main class="container">
    <div class="card pad">
      <h2>Sauvegarde téléphone</h2>
      <p class="small">Listeo sauvegarde automatiquement les données dans le navigateur du téléphone. Pour éviter la mauvaise surprise du siècle, fais aussi un export JSON de temps en temps.</p>
      <div class="row"><button class="btn" onclick="manualSave()">Sauvegarder maintenant</button><button class="btn secondary" onclick="exportJson()">Exporter JSON</button></div><br>
      <button class="btn secondary full" onclick="importInput().click()">Importer JSON</button>
      <p class="small">Dernière sauvegarde : ${new Date(data.savedAt).toLocaleString("fr-FR")}</p>
    </div>
    <div class="card pad">
      <h2>Apparence</h2>
      <button class="btn secondary full" onclick="data.theme=data.theme==='dark'?'light':'dark';render()">Passer en mode ${data.theme==="dark"?"clair":"sombre"}</button><br><br>
      <div class="row">${["#7CB342","#2196F3","#E53935","#FB8C00","#8E24AA"].map(c=>`<button class="color-dot" style="background:${c}" onclick="data.primary='${c}';render()"></button>`).join("")}</div>
    </div>
    <div class="card pad">
      <h2>Maintenance</h2>
      <button class="btn danger full" onclick="resetAll()">Réinitialiser Listeo</button>
    </div>
  </main>`;
}
function orderScreen(){
  const l = list();
  return `<main class="container"><div class="notice">Place les rayons dans l’ordre de ton magasin. C’est le genre de détail qui évite de traverser Lidl trois fois comme un PNJ perdu.</div><br>
    ${l.order.map((r,i)=>`<div class="card store"><div class="logo">${rayonIcon(r)}</div><div class="info"><div class="name">${r}</div></div><button class="btn secondary" onclick="moveRayon(${i},-1)">↑</button><button class="btn secondary" onclick="moveRayon(${i},1)">↓</button></div>`).join("")}
  </main>`;
}
function dialogs(){
  return `<dialog id="addDialog">
    <h2>Ajouter un produit</h2>
    <input id="pName" placeholder="Nom du produit"><br><br>
    <select id="pRayon">${RAYONS.map(r=>`<option>${r[0]}</option>`).join("")}</select><br><br>
    <input id="pPrice" type="number" step="0.01" placeholder="Prix estimé"><br><br>
    <input id="pBarcode" placeholder="Code-barres manuel, optionnel"><br><br>
    <div class="dialog-actions"><button class="btn" onclick="addManual()">Ajouter</button><button class="btn secondary" onclick="document.getElementById('addDialog').close()">Annuler</button></div>
  </dialog>`;
}

function openAddDialog(rayon=""){ showMenu=false; render(); setTimeout(()=>{ const d=document.getElementById("addDialog"); d.showModal(); if(rayon) document.getElementById("pRayon").value=rayon; },0); }
function addManual(){
  const l = list();
  const name = document.getElementById("pName").value.trim();
  if(!name) return alert("Il faut un nom de produit.");
  const rayon = document.getElementById("pRayon").value;
  const price = Number(document.getElementById("pPrice").value)||0;
  const found = CATALOG.find(p=>p[0].toLowerCase()===name.toLowerCase());
  l.items.push({id:uuid(), name, rayon, icon:found?.[2] || rayonIcon(rayon), price, checked:false, favorite:false, uses:0, barcode:document.getElementById("pBarcode").value.trim()});
  document.getElementById("addDialog").close(); render();
}
function addCatalog(name){
  const p = CATALOG.find(x=>x[0]===name); if(!p) return;
  list().items.push({id:uuid(), name:p[0], rayon:p[1], icon:p[2], price:p[3], checked:false, favorite:false, uses:0});
  render();
}
function addFavoriteToCurrent(name){ const p = CATALOG.find(x=>x[0]===name) || [name,"Autres","🛒",0]; list().items.push({id:uuid(), name:p[0], rayon:p[1], icon:p[2], price:p[3], checked:false, favorite:true, uses:0}); render(); }
function toggleItem(id){ const i=list().items.find(x=>x.id===id); if(!i) return; i.checked=!i.checked; if(i.checked) i.uses=(i.uses||0)+1; render(); }
function toggleFav(id){ const i=list().items.find(x=>x.id===id); if(!i) return; i.favorite=!i.favorite; render(); }
function setPrice(id,v){ const i=list().items.find(x=>x.id===id); if(i) {i.price=Number(v)||0; saveData(); render();} }
function filterCatalog(v){ const items = CATALOG.filter(p=>p[0].toLowerCase().includes(v.toLowerCase()) || p[1].toLowerCase().includes(v.toLowerCase())); document.getElementById("catalogArea").innerHTML = catalogHtml(items); }
function newList(){ const name=prompt("Nom de la nouvelle liste / enseigne ?"); if(!name) return; data.lists.push({id:uuid(), name, icon:"🛒", color:data.primary, order:RAYONS.map(r=>r[0]), items:[]}); render(); }
function shareCurrent(){
  showMenu=false;
  const l = list();
  const text = `Liste ${l.name}\nTotal estimé : ${euro(total(l))}\n\n` + l.order.map(r=>{
    const items = l.items.filter(i=>!i.checked && i.rayon===r).map(i=>`☐ ${i.name}${i.price?` (${euro(i.price)})`:""}`);
    return items.length ? `${r}\n${items.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
  if(navigator.share) navigator.share({title:`Liste ${l.name}`, text});
  else navigator.clipboard?.writeText(text).then(()=>alert("Liste copiée dans le presse-papiers."));
}
function voiceAdd(){
  showMenu=false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR) return alert("Reconnaissance vocale non disponible sur ce navigateur.");
  const r = new SR(); r.lang="fr-FR";
  r.onresult = e => {
    const phrase = e.results[0][0].transcript;
    phrase.split(/,| et | puis /i).map(x=>x.trim()).filter(Boolean).forEach(name=>{
      const p = CATALOG.find(c=>c[0].toLowerCase()===name.toLowerCase()) || [name,"Autres","🛒",0];
      list().items.push({id:uuid(), name:p[0], rayon:p[1], icon:p[2], price:p[3], checked:false, favorite:false, uses:0});
    });
    render();
  };
  r.start();
}
function clearChecked(){ if(confirm("Supprimer les produits cochés ?")){ list().items = list().items.filter(i=>!i.checked); showMenu=false; render(); } }
function emptyList(){ if(confirm("Vider toute cette liste ?")){ list().items=[]; showMenu=false; render(); } }
function moveRayon(i,d){ const a=list().order; const j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; render(); }
function addCard(){ const name=document.getElementById("cardName").value.trim(); const code=document.getElementById("cardCode").value.trim(); if(!name||!code) return alert("Nom et numéro obligatoires."); data.loyalty.push({name,code}); render(); }
function removeCard(i){ data.loyalty.splice(i,1); render(); }
function manualSave(){ saveData(); alert("Sauvegardé sur ce téléphone."); }
function exportJson(){ const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="listeo-sauvegarde-v1-1.json"; a.click(); }
function resetAll(){ if(confirm("Tout effacer et repartir à zéro ?")){ localStorage.removeItem(KEY); data=starter(); currentListId=data.lists[0].id; screen="home"; render(); } }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }
function escapeAttr(s){ return escapeHtml(s).replace(/`/g,"&#096;"); }

window.addEventListener("load", () => {
  saveData();
  if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
  importInput().addEventListener("change", e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ try{ data=JSON.parse(reader.result); currentListId=data.lists[0]?.id; saveData(); render(); } catch { alert("Fichier JSON invalide."); } };
    reader.readAsText(file);
  });
  render();
});
