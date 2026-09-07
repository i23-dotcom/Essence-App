const API=(localStorage.getItem("essence_api")||"http://localhost:8080/api").replace(/\/$/,"");
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
let token=localStorage.getItem("essence_token")||"";
let state={live:null,articles:[],programmes:[],schedule:[],audit:[],media:[]};

function flash(msg){const e=$("#flash");e.textContent=msg;e.className="flash";setTimeout(()=>e.className="",2600)}
async function api(path,opts={}){opts.headers={...(opts.headers||{}), "Content-Type":"application/json"};if(token)opts.headers.Authorization="Bearer "+token;const r=await fetch(API+path,opts);if(!r.ok)throw new Error(await r.text());return r.status===204?null:r.json()}
function fmtDate(x){return x?new Date(x).toLocaleString():"—"}
function go(view){$$(".view").forEach(x=>x.classList.remove("active"));$("#"+view).classList.add("active");$$("nav button").forEach(x=>x.classList.toggle("active",x.dataset.view===view));const labels={overview:"Master Control",editorial:"Editorial Desk",production:"Production",epg:"TV Guide / EPG",live:"Live Control",router:"Stream Router",media:"Media Library",website:"Website Control",users:"Users & Roles",audit:"Audit Log"};$("#title").textContent=labels[view]||"Master Control";load(view)}
$$("nav button").forEach(b=>b.onclick=()=>go(b.dataset.view));$$("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));$("#menu").onclick=()=>$(".sidebar").classList.toggle("open");
$("#logout").onclick=()=>{localStorage.removeItem("essence_token");location.reload()};

async function load(view="overview"){
 try{
  if(view==="overview"||view==="live"){state.live=await api("/live");renderLive()}
  if(view==="overview"||view==="editorial"){state.articles=await api("/articles");renderArticles()}
  if(view==="overview"||view==="production"){state.programmes=await api("/programmes");renderProgrammes()}
  if(view==="overview"||view==="epg"){state.schedule=await api("/schedule");renderSchedule()}
  if(view==="overview"||view==="audit"){state.audit=await api("/audit");renderAudit()}
  if(view==="overview"||view==="router"){try{await loadRouter()}catch(e){}}\n  if(view==="overview"||view==="media"){try{state.media=await api("/media")}catch(e){state.media=[]}renderMedia()}
  renderStats()
 }catch(e){flash("API unavailable: "+(e.message||"check server"))}
}
function renderStats(){$("#sLive").textContent=state.live?.state?.replace("_"," ").toUpperCase()||"—";$("#sLiveSub").textContent=state.live?.programme||"—";$("#sStories").textContent=state.articles.length;$("#sEpg").textContent=state.schedule.length;$("#sMedia").textContent=state.media.length}
function renderLive(){if(!state.live)return;$("#liveState").value=state.live.state||"on_air";$("#liveProgram").value=state.live.programme||"";$("#liveMessage").value=state.live.message||"";$("#primaryStream").value=state.live.primary_stream||"";$("#backupStream").value=state.live.backup_stream||"";$("#onairProgram").textContent=state.live.programme||"No programme set";$("#onairLabel").textContent=(state.live.state||"on_air").replace("_"," ").toUpperCase();$("#liveBadge").textContent="● "+(state.live.state||"on_air").replace("_"," ").toUpperCase()}
function renderArticles(){$("#stories").innerHTML=state.articles.map(a=>`<tr><td>${esc(a.title)}</td><td>${esc(a.category||"General")}</td><td><span class="tag ${a.status==="published"?"green":""}">${esc(a.status||"draft")}</span></td><td>${fmtDate(a.updated_at||a.created_at)}</td></tr>`).join("")||empty("No stories yet")}
function renderProgrammes(){$("#programmes").innerHTML=state.programmes.map(p=>`<tr><td>${esc(p.title)}</td><td>${esc(p.genre||"—")}</td><td>${p.duration_minutes||"—"} min</td><td><span class="tag green">ACTIVE</span></td></tr>`).join("")||empty("No programmes yet")}
function renderSchedule(){$("#schedule").innerHTML=state.schedule.map(s=>`<tr><td>${fmtDate(s.start_time)}</td><td>${esc(s.programme_title||s.title||"—")}</td><td>${s.duration_minutes||"—"} min</td><td><span class="tag">SCHEDULED</span></td></tr>`).join("")||empty("No schedule entries")}
function renderAudit(){$("#auditRows").innerHTML=state.audit.map(a=>`<tr><td>${fmtDate(a.created_at)}</td><td>${esc(a.user_email||"system")}</td><td>${esc(a.action)}</td><td>${esc(a.area||"—")}</td></tr>`).join("")||empty("No audit events")}
function renderMedia(){$("#mediaRows").innerHTML=state.media.map(m=>`<tr><td>${esc(m.name)}</td><td>${esc(m.type||"—")}</td><td>${esc(m.storage_url||"—")}</td><td><span class="tag">${esc(m.status||"READY")}</span></td></tr>`).join("")||empty("No media assets")}
function empty(t){return `<tr><td colspan="4">${t}</td></tr>`}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}

function modal(title,body,submit){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=body+`<div class="form-actions"><button class="primary" id="modalSave">Save</button><button class="action" id="modalCancel">Cancel</button></div>`;$("#modal").classList.add("show");$("#modalCancel").onclick=closeModal;$("#modalSave").onclick=submit}
function closeModal(){$("#modal").classList.remove("show")}$("#close").onclick=closeModal;

$("#newStory").onclick=()=>modal("New story",`<label>Headline<input id="mTitle"></label><label>Category<input id="mCat" value="Uganda"></label><label>Status<select id="mStatus"><option value="draft">Draft</option><option value="published">Published</option></select></label><label>Body<textarea id="mBody"></textarea></label>`,async()=>{try{await api("/articles",{method:"POST",body:JSON.stringify({title:$("#mTitle").value,category:$("#mCat").value,status:$("#mStatus").value,body:$("#mBody").value})});closeModal();flash("Story saved");load("editorial")}catch(e){flash(e.message)}});

$("#newProgramme").onclick=()=>modal("New programme",`<label>Title<input id="mTitle"></label><label>Genre<input id="mGenre" value="Entertainment"></label><label>Duration (minutes)<input id="mDur" type="number" value="60"></label><label>Description<textarea id="mDesc"></textarea></label>`,async()=>{try{await api("/programmes",{method:"POST",body:JSON.stringify({title:$("#mTitle").value,genre:$("#mGenre").value,duration_minutes:+$("#mDur").value,description:$("#mDesc").value})});closeModal();flash("Programme created");load("production")}catch(e){flash(e.message)}});

$("#newSchedule").onclick=()=>modal("New schedule entry",`<label>Programme title<input id="mTitle"></label><label>Start time<input id="mStart" type="datetime-local"></label><label>Duration (minutes)<input id="mDur" type="number" value="60"></label>`,async()=>{try{await api("/schedule",{method:"POST",body:JSON.stringify({programme_title:$("#mTitle").value,start_time:new Date($("#mStart").value).toISOString(),duration_minutes:+$("#mDur").value})});closeModal();flash("Schedule saved");load("epg")}catch(e){flash(e.message)}});

$("#newMedia").onclick=()=>modal("Register media asset",`<label>Name<input id="mName"></label><label>Type<select id="mType"><option>video</option><option>audio</option><option>image</option><option>graphic</option></select></label><label>Storage URL<input id="mUrl"></label>`,async()=>{try{await api("/media",{method:"POST",body:JSON.stringify({name:$("#mName").value,type:$("#mType").value,storage_url:$("#mUrl").value,status:"READY"})});closeModal();flash("Media registered");load("media")}catch(e){flash(e.message)}});

async function saveLive(extra={}){try{await api("/live",{method:"PUT",body:JSON.stringify({state:$("#liveState").value,programme:$("#liveProgram").value,message:$("#liveMessage").value,primary_stream:$("#primaryStream").value,backup_stream:$("#backupStream").value,...extra})});flash("Live control updated");load("live")}catch(e){flash(e.message)}}
$("#saveLive").onclick=()=>saveLive();
$("#emergency").onclick=()=>{if(confirm("Activate EMERGENCY state?")){$("#liveState").value="emergency";saveLive()}};
$("#nosignal").onclick=()=>{$("#liveState").value="no_signal";saveLive()};
$("#onair").onclick=()=>{$("#liveState").value="on_air";saveLive()};

$("#saveWebsite").onclick=()=>{localStorage.setItem("essence_site_headline",$("#siteHeadline").value);localStorage.setItem("essence_announcement",$("#announcement").value);localStorage.setItem("essence_breaking",$("#breaking").value);flash("Website settings saved locally. Connect to CMS settings API for shared production publishing.")};

function tick(){$("#clock").textContent=new Date().toLocaleString();}setInterval(tick,1000);tick();load();

async function loadRouter(){
 const r=await api("/stream-router");
 $("#routeState").textContent=(r.route||"primary").replace("_"," ").toUpperCase();
 $$(".route").forEach(b=>b.classList.toggle("selected",b.dataset.route===r.route));
 $("#sources").innerHTML=[
 ["PRIMARY",r.primary_stream],["BACKUP",r.backup_stream],
 ["EMERGENCY",r.emergency_stream],["NO SIGNAL",r.no_signal_stream]
 ].map(x=>`<div class="source"><b>${x[0]}</b><span>${esc(x[1]||"Not configured")}</span></div>`).join("");
}
document.addEventListener("click",e=>{
 const b=e.target.closest(".route"); if(!b)return;
 api("/stream-router",{method:"PUT",body:JSON.stringify({route:b.dataset.route})})
 .then(()=>{flash("Route switched to "+b.dataset.route.replace("_"," ").toUpperCase());loadRouter();load("live")})
 .catch(err=>flash(err.message));
});
