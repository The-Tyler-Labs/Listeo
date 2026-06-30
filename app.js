const KEY="listeo_data_v1";
const defaultProducts=[
["🥬","Fruits & légumes","Poire",1.8],["🍌","Fruits & légumes","Banane",1.6],["🍅","Fruits & légumes","Tomate",2.4],
["🥬","Fruits & légumes","Endives",2.2],["🧅","Fruits & légumes","Oignon",1.2],["🫑","Fruits & légumes","Poivron",2.9],
["🥩","Boucherie","Merguez",4.5],["🥪","Traiteur","Croque monsieur",2.5],["🌭","Traiteur","Hot-dog",2.2],
["🐟","Poissonnerie","Saumon fumé",5.8],["🧀","Frais","Emmental",2.4],["🧀","Frais","Fromage fondu",1.9],
["🥯","Boulangerie","Bagels",2.1],["🥛","Frais","Lait poudre",5.2],["🍕","Traiteur","Pizza",3.6],["🧴","Entretien","Lessive",7.9]
];
const stores=[
["lidl","Lidl","🟡"],["carrefour","Carrefour","🔵"],["aldi","Aldi","🔷"],["leclerc","E.Leclerc","🛒"],
["auchan","Auchan","🔴"],["inter","Intermarché","🔴"],["action","Action","🛍️"],["marche","Marché","🧺"],["todo","À acheter","📝"]
];
const rayons=["Fruits & légumes","Boucherie","Traiteur","Poissonnerie","Frais","Salé","Sucré","Boulangerie","Boissons","Surgelés","Bio","Enfants","Beauté/Soin","Parapharmacie","Entretien","Maison","Animalerie","Textile","Sport","Culture/Loisirs","Multimédia","Électroménager","Bricolage/Jardin","Automobile","Autres"];
let state=load(); let view="home", current=state.lists[0]?.id, menu=false;

function fresh(){
 const lists=stores.map((s,i)=>({id:s[0],name:s[1],icon:s[2],color:"#8BC34A",items: defaultProducts.slice(0, i===0?7:Math.max(0,3+i%5)).map((p,j)=>({id:crypto.randomUUID(),icon:p[0],rayon:p[1],name:p[2],price:p[3],checked:false,fav:j%4===0,uses:j%3}))}));
 return {theme:"light",primary:"#8BC34A",lists,loyalty:[],savedAt:new Date().toISOString()};
}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||fresh()}catch(e){return fresh()}}
function save(){state.savedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));document.body.className=state.theme==="dark"?"dark":"";document.documentElement.style.setProperty("--primary",state.primary)}
function q(s){return document.querySelector(s)} function byId(id){return state.lists.find(l=>l.id===id)||state.lists[0]}
function money(n){return (Math.round(n*100)/100).toFixed(2).replace(".",",")+" €"}
function init(){save(); if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js"); render()}
function header(title, back=false){return `<div class="header"><button onclick="${back?'view=`home`;render()':'menu=true;render()'}">${back?'‹':'☰'}</button><h1>${title}</h1><button onclick="menu=!menu;render()">⋮</button></div>`}
function bottom(active){return `<div class="bottom">
<button class="${active==='home'?'active':''}" onclick="view='home';render()">🏠<br>Listes</button>
<button class="${active==='fav'?'active':''}" onclick="view='fav';render()">💚<br>Favoris</button>
<button class="${active==='cards'?'active':''}" onclick="view='cards';render()">💳<br>Cartes</button>
<button class="${active==='settings'?'active':''}" onclick="view='settings';render()">⚙️<br>Réglages</button></div>`}
function popMenu(){ if(!menu) return ""; return `<div class="menu">
<button onclick="shareList()">Partager</button><button onclick="voiceAdd()">Reconnaissance vocale</button><button onclick="emptyList()">Vider toute ma liste</button><button onclick="view='order';menu=false;render()">Ordre des rayons</button><button onclick="view='settings';menu=false;render()">Sauvegarde</button></div>`}

function render(){
 save();
 let html="";
 if(view==="home") html=header("Listeo")+home()+bottom("home");
 if(view==="list") html=header(byId(current).name,true)+tabs("list")+listView()+bottom("home")+`<button class="fab" onclick="openAdd()">+</button>`;
 if(view==="products") html=header(byId(current).name,true)+tabs("products")+productsView()+bottom("home");
 if(view==="fav") html=header("Favoris")+favView()+bottom("fav");
 if(view==="cards") html=header("Cartes de fidélité")+cardsView()+bottom("cards");
 if(view==="settings") html=header("Paramètres")+settingsView()+bottom("settings");
 if(view==="order") html=header("Ordre des rayons",true)+orderView()+bottom("home");
 q("#app").innerHTML=html+popMenu()+dialogs();
}
function tabs(a){return `<div class="tabs"><button class="${a==='list'?'active':''}" onclick="view='list';render()">LISTE <span class="badge">${byId(current).items.filter(i=>!i.checked).length}</span></button><button class="${a==='products'?'active':''}" onclick="view='products';render()">PRODUITS</button><button onclick="view='fav';render()">FAVORIS</button></div>`}
function home(){return `<div class="container"><button class="btn" onclick="newList()">+ Créer une nouvelle liste</button><br><br>${state.lists.map(l=>`<div class="card store-row" onclick="current='${l.id}';view='list';render()"><div class="store-icon">${l.icon}</div><div class="info"><div class="big">${l.name}</div><div class="small">${l.items.filter(i=>!i.checked).length} produits à acheter</div></div><div class="share" onclick="event.stopPropagation();current='${l.id}';shareList()">👥</div></div>`).join("")}</div>`}
function grouped(items){let order=byId(current).order||rayons; let gs={}; items.forEach(i=>(gs[i.rayon]??=[]).push(i)); return order.filter(r=>gs[r]).map(r=>`<div class="section-title">${r}</div>${gs[r].map(itemHtml).join("")}`).join("")}
function itemHtml(i){return `<div class="item ${i.checked?'checked':''}"><span style="font-size:28px">${i.icon||"🛒"}</span><div class="name" onclick="toggle('${i.id}')">${i.name}<div class="price">${money(i.price||0)}</div></div><input type="checkbox" ${i.checked?'checked':''} onchange="toggle('${i.id}')"></div>`}
function listView(){let l=byId(current), total=l.items.filter(i=>!i.checked).reduce((s,i)=>s+(+i.price||0),0); return `<div class="container"><div class="card card-pad"><div class="total">Total estimé : ${money(total)}</div><div class="small">Données sauvegardées sur ce téléphone.</div></div>${grouped(l.items)}</div>`}
function productsView(){return `<div class="container"><div class="grid">${rayons.map(r=>`<div class="tile" onclick="quickRayon('${r}')"><div class="logo">${iconFor(r)}</div><b>${r}</b></div>`).join("")}</div></div>`}
function favView(){let items=state.lists.flatMap(l=>l.items).filter(i=>i.fav||i.uses>1);return `<div class="container">${items.length?grouped(items):'<div class="card card-pad">Aucun favori pour l’instant.</div>'}</div>`}
function cardsView(){return `<div class="container"><div class="card card-pad"><input id="cardName" placeholder="Magasin"><br><br><input id="cardCode" placeholder="Numéro ou code-barres"><br><br><button class="btn" onclick="addCard()">Ajouter une carte</button></div>${state.loyalty.map(c=>`<div class="card card-pad"><div class="big">${c.name}</div><div style="font-size:28px;letter-spacing:2px">${c.code}</div></div>`).join("")}</div>`}
function settingsView(){return `<div class="container">
<div class="card card-pad"><h2>Sauvegarde téléphone</h2><p class="small">Les données sont gardées automatiquement sur ce téléphone/navigateur. Export JSON conseillé de temps en temps, parce qu’un navigateur qui fait le ménage peut être un peu trop zélé.</p><button class="btn" onclick="manualSave()">Sauvegarder maintenant</button> <button class="btn secondary" onclick="exportJson()">Exporter JSON</button><br><br><button class="btn secondary" onclick="q('#importFile').click()">Importer JSON</button></div>
<div class="card card-pad"><h2>Apparence</h2><button class="btn secondary" onclick="state.theme=state.theme==='dark'?'light':'dark';render()">Mode ${state.theme==='dark'?'clair':'sombre'}</button><br><br><div class="row">${["#8BC34A","#2196F3","#F44336","#FF9800","#9C27B0"].map(c=>`<button class="color-dot" style="background:${c}" onclick="state.primary='${c}';render()"></button>`).join("")}</div></div>
<div class="card card-pad"><button class="btn danger" onclick="resetApp()">Réinitialiser Listeo</button></div></div>`}
function orderView(){let l=byId(current); l.order=l.order||[...rayons]; return `<div class="container">${l.order.map((r,i)=>`<div class="card store-row"><div class="info"><b>${r}</b></div><button class="btn secondary" onclick="moveRayon(${i},-1)">↑</button><button class="btn secondary" onclick="moveRayon(${i},1)">↓</button></div>`).join("")}</div>`}
function dialogs(){return `<dialog id="addDlg"><h2>Ajouter un produit</h2><input id="pName" placeholder="Nom du produit"><br><br><select id="pRayon">${rayons.map(r=>`<option>${r}</option>`)}</select><br><br><input id="pPrice" type="number" step="0.01" placeholder="Prix estimé"><br><br><input id="pCode" placeholder="Code-barres manuel"><br><br><button class="btn" onclick="addProduct()">Ajouter</button> <button class="btn secondary" onclick="q('#addDlg').close()">Annuler</button></dialog>`}
function openAdd(){q("#addDlg").showModal()} function addProduct(){let l=byId(current);l.items.push({id:crypto.randomUUID(),icon:"🛒",rayon:q("#pRayon").value,name:q("#pName").value||"Produit",price:+q("#pPrice").value||0,checked:false,fav:false,uses:0});q("#addDlg").close();render()}
function toggle(id){let l=byId(current), it=l.items.find(i=>i.id===id); if(it){it.checked=!it.checked; if(it.checked) it.uses=(it.uses||0)+1} render()}
function iconFor(r){return {"Fruits & légumes":"🥕","Boucherie":"🥩","Traiteur":"🍽️","Poissonnerie":"🐟","Frais":"🥛","Boulangerie":"🥖","Boissons":"🥤","Surgelés":"❄️","Entretien":"🧽","Maison":"🏠","Animalerie":"🐱","Sport":"🏋️","Automobile":"🚗"}[r]||"🛒"}
function quickRayon(r){q("#addDlg").showModal(); setTimeout(()=>q("#pRayon").value=r)}
function addCard(){state.loyalty.push({name:q("#cardName").value||"Carte",code:q("#cardCode").value||"—"});render()}
function shareList(){let l=byId(current);let txt=`Liste ${l.name}\n\n`+rayons.map(r=>{let a=l.items.filter(i=>!i.checked&&i.rayon===r).map(i=>"☐ "+i.name);return a.length?`${r}\n${a.join("\n")}`:""}).filter(Boolean).join("\n\n"); if(navigator.share) navigator.share({text:txt}); else {navigator.clipboard?.writeText(txt); alert("Liste copiée.")}}
function emptyList(){if(confirm("Vider toute la liste ?")){byId(current).items=[];menu=false;render()}}
function voiceAdd(){menu=false; let SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR){alert("Reconnaissance vocale non disponible sur ce navigateur.");return} let r=new SR();r.lang="fr-FR";r.onresult=e=>{let words=e.results[0][0].transcript.split(/,| et | puis /i).map(x=>x.trim()).filter(Boolean);let l=byId(current);words.forEach(w=>l.items.push({id:crypto.randomUUID(),icon:"🛒",rayon:"Autres",name:w,price:0,checked:false}));render()};r.start()}
function manualSave(){save();alert("Sauvegardé sur ce téléphone.")}
function exportJson(){let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="listeo-sauvegarde.json";a.click()}
q("#importFile").addEventListener("change",e=>{let f=e.target.files[0]; if(!f)return; let rd=new FileReader();rd.onload=()=>{try{state=JSON.parse(rd.result);save();render()}catch(err){alert("Fichier invalide")}};rd.readAsText(f)})
function resetApp(){if(confirm("Tout effacer ?")){localStorage.removeItem(KEY);state=fresh();render()}}
function newList(){let name=prompt("Nom du magasin ou de la liste ?"); if(!name)return; state.lists.push({id:crypto.randomUUID(),name,icon:"🛒",color:state.primary,items:[]});render()}
function moveRayon(i,d){let l=byId(current), a=l.order; let j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];render()}
init();
