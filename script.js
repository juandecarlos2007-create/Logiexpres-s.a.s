const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const COP = value => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(value);
const serviceLabels = {transporte:"Transporte",almacenamiento:"Almacenamiento",refrigerado:"Transporte refrigerado","frio-completo":"Almacenamiento + transporte refrigerado"};
const rates = {transporte:1850,almacenamiento:950,refrigerado:2950,"frio-completo":3750};
const readStore = (key,fallback=[]) => {try{return JSON.parse(localStorage.getItem(key)) ?? fallback}catch{return fallback}};
const writeStore = (key,value) => localStorage.setItem(key,JSON.stringify(value));
let quotes = readStore("le_quotes",[]);
let settlements = readStore("le_settlements",[]);
let activeUser = readStore("le_demo_user",null);

$("#year").textContent = new Date().getFullYear();
$("#todayDate").textContent = new Date().toLocaleDateString("es-CO",{day:"2-digit",month:"long",year:"numeric"});

$("#mobileMenu").addEventListener("click",()=>$("#nav").classList.toggle("open"));
$$('#nav a').forEach(link=>link.addEventListener("click",()=>$("#nav").classList.remove("open")));

function openLogin(){ $("#loginOverlay").hidden=false; document.body.classList.add("no-scroll"); $("#nav").classList.remove("open"); }
function closeLogin(){ $("#loginOverlay").hidden=true; document.body.classList.remove("no-scroll"); }
$("#openLogin").addEventListener("click",openLogin);
$("#footerLogin").addEventListener("click",openLogin);
$("#closeLogin").addEventListener("click",closeLogin);
$("#loginOverlay").addEventListener("click",e=>{if(e.target.id==="loginOverlay")closeLogin();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeLogin();$("#botWindow").hidden=true;}});

$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const form=new FormData(e.currentTarget);
  activeUser={name:String(form.get("userName")).trim(),email:String(form.get("email")).trim(),company:"LogiExpres S.A.S.",role:"Usuario de demostración",loggedAt:new Date().toISOString()};
  writeStore("le_demo_user",activeUser);
  closeLogin();
  showWorkspace();
});
function initials(name=""){return name.trim().split(/\s+/).slice(0,2).map(part=>part[0]?.toUpperCase()||"").join("")||"LE";}
function showWorkspace(){
  if(!activeUser)return;
  $("#workspace").hidden=false;$("#botLauncher").hidden=true;
  $("#sidebarUser").textContent=activeUser.name;$("#sidebarEmail").textContent=activeUser.email;
  $("#topbarUser").textContent=activeUser.name;$("#userInitials").textContent=initials(activeUser.name);
  const first=activeUser.name.split(" ")[0];
  $("#workspaceTitle").textContent=`Bienvenido, ${first}.`;
  renderWorkspace("overview");
}
function logout(){activeUser=null;localStorage.removeItem("le_demo_user");$("#workspace").hidden=true;$("#botLauncher").hidden=false;}
$("#logoutButton").addEventListener("click",logout);

function renderWorkspace(view){
  const names={overview:"Resumen general",quotes:"Cotizaciones",operations:"Operaciones",rates:"Tarifas",documents:"Documentos"};
  $("#currentViewName").textContent=names[view];
  $$(".side-link").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  const root=$("#workspaceView");
  if(view==="overview"){
    const total=[...quotes,...settlements].reduce((sum,item)=>sum+Number(item.total||0),0);
    root.innerHTML=`<div class="workspace-cards">
      <div class="workspace-card"><span>Cotizaciones registradas</span><strong>${quotes.length}</strong><small>Solicitudes recibidas en este navegador</small></div>
      <div class="workspace-card"><span>Liquidaciones</span><strong>${settlements.length}</strong><small>Operaciones de demostración</small></div>
      <div class="workspace-card"><span>Valor registrado</span><strong>${COP(total)}</strong><small>Total de registros locales</small></div>
      <div class="workspace-card"><span>Servicios activos</span><strong>03</strong><small>Almacenamiento, transporte y frío</small></div>
    </div><section class="workspace-panel"><h3>Actividad reciente</h3>${recentTable()}</section><section class="workspace-panel"><h3>Sesión actual</h3><table class="workspace-table"><tbody><tr><td>Empresa</td><td><b>LogiExpres S.A.S.</b></td></tr><tr><td>Persona</td><td>${escapeHtml(activeUser.name)}</td></tr><tr><td>Correo</td><td>${escapeHtml(activeUser.email)}</td></tr><tr><td>Tipo de acceso</td><td>Usuario de demostración</td></tr><tr><td>Inicio de sesión</td><td>${new Date(activeUser.loggedAt).toLocaleString("es-CO")}</td></tr></tbody></table></section>`;
  }else if(view==="quotes"){
    root.innerHTML=`<section class="workspace-panel"><div class="workspace-toolbar"><h3>Solicitudes de cotización</h3><button class="workspace-action" onclick="window.location.hash='cotizar';document.getElementById('workspace').hidden=true;document.getElementById('botLauncher').hidden=false;">Ir al cotizador ↗</button></div>${quotes.length?tableFor(quotes,"Cotización"):'<p class="empty-state">Todavía no hay cotizaciones registradas.</p>'}</section>`;
  }else if(view==="operations"){
    root.innerHTML=`<section class="workspace-panel"><div class="workspace-toolbar"><h3>Liquidaciones y operaciones</h3><button class="workspace-action" id="newSettlement">+ Nueva liquidación</button></div><div id="settlementForm"></div>${settlements.length?tableFor(settlements,"Liquidación"):'<p class="empty-state">No hay liquidaciones registradas.</p>'}</section>`;
    $("#newSettlement").addEventListener("click",showSettlementForm);
  }else if(view==="rates"){
    root.innerHTML=`<section class="workspace-panel"><h3>Tarifas de referencia</h3><div class="workspace-rate-grid">${Object.entries(serviceLabels).map(([key,label])=>`<div class="workspace-rate">${label}<b>${COP(rates[key])} / kg</b></div>`).join("")}</div><p class="workspace-notice">Tarifas ilustrativas de demostración. La tarifa comercial debe ser definida y aprobada por LogiExpres antes de ofrecer cotizaciones reales.</p></section>`;
  }else{
    const all=[...quotes,...settlements];
    root.innerHTML=`<section class="workspace-panel"><h3>Documentos y consolidados</h3><p class="workspace-notice">Genera una vista imprimible de un registro o descarga un consolidado CSV. Estos formatos son demostrativos y no equivalen a factura electrónica DIAN.</p>${all.length?tableFor(all,"Documento"):'<p class="empty-state">No hay registros para generar documentos.</p>'}<button class="workspace-action" id="downloadConsolidated">Descargar consolidado CSV</button></section>`;
    $("#downloadConsolidated")?.addEventListener("click",downloadCSV);
  }
  $$("[data-print-record]",root).forEach(btn=>btn.addEventListener("click",()=>printRecord(JSON.parse(decodeURIComponent(btn.dataset.printRecord)))));
}
function recentTable(){
 const all=[...quotes,...settlements].sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).slice(0,5);
 return all.length?tableFor(all,"Actividad"):'<p class="empty-state">Cuando registres cotizaciones o liquidaciones, aparecerán aquí.</p>';
}
function tableFor(items,kind){
 return `<div style="overflow:auto"><table class="workspace-table"><thead><tr><th>FECHA / REFERENCIA</th><th>CLIENTE</th><th>SERVICIO</th><th>VALOR ESTIMADO</th><th>ACCIÓN</th></tr></thead><tbody>${items.map(item=>`<tr><td>${new Date(item.createdAt).toLocaleDateString("es-CO")}<br>${escapeHtml(item.id)}</td><td>${escapeHtml(item.name)}</td><td>${serviceLabels[item.service]||escapeHtml(item.service)}</td><td>${COP(item.total)}</td><td><button class="workspace-action" data-print-record="${encodeURIComponent(JSON.stringify(item))}">Ver / imprimir</button></td></tr>`).join("")}</tbody></table></div>`;
}
function showSettlementForm(){
 const host=$("#settlementForm");
 host.innerHTML=`<form id="settlementEntry" class="settlement-entry"><div class="form-row"><label>Cliente<input name="name" required placeholder="Nombre del cliente"></label><label>Servicio<select name="service">${Object.entries(serviceLabels).map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></label></div><div class="form-row"><label>Valor liquidado (COP)<input name="total" type="number" min="1" required></label><label>Referencia<input name="id" placeholder="Se genera automáticamente"></label></div><button class="workspace-action">Guardar liquidación</button></form>`;
 $("#settlementEntry").addEventListener("submit",e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);
   settlements.unshift({id:f.get("id")||"LIQ-"+Date.now().toString().slice(-6),name:f.get("name"),service:f.get("service"),total:Number(f.get("total")),createdAt:new Date().toISOString(),origin:"",destination:""});
   writeStore("le_settlements",settlements);renderWorkspace("operations");
 });
}
function escapeHtml(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function printRecord(item){
 const w=window.open("","_blank");if(!w)return;
 w.document.write(`<html><head><title>${escapeHtml(item.id)} - LogiExpres</title><style>body{font:14px Arial;padding:45px;color:#172235}h1{color:#071b3b}hr{border:0;border-top:3px solid #20c52a;margin:24px 0}.amount{font-size:25px;font-weight:bold;text-align:right;margin-top:45px}.note{margin-top:70px;color:#87919d;font-size:10px}</style></head><body><h1>LOGIEXPRES S.A.S.</h1><p>Tu mercancía en buenas manos. Tu negocio en movimiento.</p><hr><h2>${item.service==="transporte"?"COMPROBANTE DE OPERACIÓN":"RESUMEN DE SERVICIO"}</h2><p><b>Referencia:</b> ${escapeHtml(item.id)}</p><p><b>Fecha:</b> ${new Date(item.createdAt).toLocaleDateString("es-CO")}</p><p><b>Cliente:</b> ${escapeHtml(item.name)}</p><p><b>Servicio:</b> ${serviceLabels[item.service]||escapeHtml(item.service)}</p><p><b>Origen:</b> ${escapeHtml(item.origin||"No indicado")}</p><p><b>Destino:</b> ${escapeHtml(item.destination||"No indicado")}</p><div class="amount">Valor: ${COP(item.total)}</div><p class="note">Formato de demostración. No constituye factura electrónica ni documento tributario válido.</p><script>window.print()<\/script></body></html>`);
 w.document.close();
}
function downloadCSV(){
 const all=[...quotes,...settlements];
 const rows=[["Fecha","Referencia","Cliente","Servicio","Valor COP"],...all.map(x=>[new Date(x.createdAt).toLocaleDateString("es-CO"),x.id,x.name,serviceLabels[x.service]||x.service,x.total])];
 const csv=rows.map(row=>row.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(";")).join("\n");
 const link=document.createElement("a");link.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));link.download="consolidado-logiexpres.csv";link.click();URL.revokeObjectURL(link.href);
}
$$(".side-link").forEach(button=>button.addEventListener("click",()=>renderWorkspace(button.dataset.view)));

$("#quoteForm").addEventListener("submit",e=>{
 e.preventDefault();const f=new FormData(e.currentTarget);const service=f.get("service");const weight=Number(f.get("weight"));const days=Number(f.get("days")||0);
 const transport=service==="almacenamiento"?0:rates[service]*weight;
 const storage=(service==="almacenamiento"||service==="frio-completo"||days>0)?rates.almacenamiento*weight*days:0;
 const total=Math.max(transport+storage,service==="almacenamiento"?12000:18000);
 const item={id:"COT-"+Date.now().toString().slice(-7),name:f.get("name"),phone:f.get("phone"),email:f.get("email"),service,origin:f.get("origin"),destination:f.get("destination"),weight,days,details:f.get("details"),total,createdAt:new Date().toISOString()};
 quotes.unshift(item);writeStore("le_quotes",quotes);
 const result=$("#quoteResult");result.hidden=false;
 result.innerHTML=`<b>Estimación inicial de tu operación</b><strong>${COP(total)}</strong><span>Referencia ${item.id}. El equipo debe validar ruta, volumen y condiciones antes de confirmar el valor.</span><br><a target="_blank" rel="noopener" href="https://wa.me/573044837341?text=${encodeURIComponent(`Hola, soy ${item.name}. Quiero validar la cotización ${item.id}. Servicio: ${serviceLabels[service]}. Origen: ${item.origin}. Destino: ${item.destination}. Peso: ${weight} kg. Estimado: ${COP(total)}.`)}">Enviar solicitud a LogiExpres por WhatsApp ↗</a>`;
 result.scrollIntoView({behavior:"smooth",block:"nearest"});
 if(activeUser)renderWorkspace("overview");
});

$("#botLauncher").addEventListener("click",()=>$("#botWindow").hidden=!$("#botWindow").hidden);
$("#botClose").addEventListener("click",()=>$("#botWindow").hidden=true);
function botAnswer(question){
 const q=question.toLowerCase();
 if(q.includes("cotiz")||q.includes("envío")||q.includes("envio"))return "Para cotizar, entra a “Cotizar”, completa tus datos, elige el servicio, indica origen, destino y peso, y selecciona “Calcular estimación”. El resultado es orientativo. Puedes enviarlo a nuestro equipo por WhatsApp para validarlo.";
 if(q.includes("servicio")||q.includes("almacen")||q.includes("frío")||q.includes("frio"))return "En LogiExpres trabajamos con almacenamiento, transporte de mercancías y almacenamiento/transporte refrigerado para cargas que necesitan cadena de frío.";
 if(q.includes("contact")||q.includes("teléfono")||q.includes("telefono")||q.includes("whatsapp"))return "Puedes comunicarte con nosotros al 304 483 3741 o escribirnos por WhatsApp desde el botón de contacto.";
 return "Puedo orientarte sobre cotizaciones, almacenamiento, transporte y cadena de frío. Si necesitas atención personalizada, llámanos al 304 483 3741.";
}
function sendBotMessage(text){
 if(!text.trim())return;const messages=$("#botMessages");
 const user=document.createElement("div");user.className="user-bubble";user.textContent=text;messages.append(user);
 const answer=document.createElement("div");answer.className="bot-bubble";answer.textContent=botAnswer(text);messages.append(answer);messages.scrollTop=messages.scrollHeight;
}
$("#botForm").addEventListener("submit",e=>{e.preventDefault();sendBotMessage($("#botInput").value);$("#botInput").value="";});
$$(".bot-shortcuts button").forEach(button=>button.addEventListener("click",()=>sendBotMessage(button.dataset.prompt)));

if(activeUser)showWorkspace();
