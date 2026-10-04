const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const KEY="tradevault_v1";
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 trades:[],
 psych:[],
 rules:[
  {title:"Risk first",text:"Never risk more than my predefined amount on one idea."},
  {title:"Wait for confirmation",text:"No entry without a setup, trigger and invalidation."},
  {title:"No revenge trades",text:"After a loss, pause and review instead of trying to win it back."}
 ],
 theme:"light"
};

const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
document.documentElement.dataset.theme=state.theme==="dark"?"dark":"light";

function money(n){return `${n<0?"-":""}₹${Math.abs(n).toLocaleString("en-IN",{maximumFractionDigits:2})}`}
function calc(){
 const t=state.trades, wins=t.filter(x=>x.pnl>0), losses=t.filter(x=>x.pnl<0);
 const pnl=t.reduce((a,x)=>a+x.pnl,0), gp=wins.reduce((a,x)=>a+x.pnl,0), gl=Math.abs(losses.reduce((a,x)=>a+x.pnl,0));
 return {pnl,wins,losses,winRate:t.length?wins.length/t.length*100:0,pf:gl?gp/gl:0,exp:t.length?pnl/t.length:0,gp,gl};
}
function nav(view){
 $$(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===view));
 $$(".view").forEach(x=>x.classList.toggle("active",x.id===view));
 const titles={dashboard:["Trading Dashboard","Review your process. Improve your edge."],trades:["Trade Journal","Capture the trade, the reason, and the lesson."],analytics:["Analytics","Turn your trading history into measurable feedback."],psychology:["Psychology","Your mindset is part of your trading system."],playbook:["Trading Playbook","Define the rules you want to follow consistently."]};
 $("#pageTitle").textContent=titles[view][0]; $("#pageSubtitle").textContent=titles[view][1];
 if(innerWidth<760) $("#sidebar").classList.remove("open");
 if(view==="dashboard") renderDashboard();
 if(view==="trades") renderTable();
 if(view==="analytics") renderAnalytics();
 if(view==="psychology") renderPsych();
 if(view==="playbook") renderRules();
}
$$(".nav-item[data-view]").forEach(b=>b.onclick=()=>nav(b.dataset.view));
$$("[data-view-link]").forEach(b=>b.onclick=()=>nav(b.dataset.viewLink));
$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=state.theme==="dark"?"dark":"light";save();renderCharts()};

function renderDashboard(){
 const c=calc();
 $("#totalPnl").textContent=money(c.pnl); $("#totalPnl").className=c.pnl>=0?"positive":"negative";
 $("#winRate").textContent=c.winRate.toFixed(1)+"%"; $("#profitFactor").textContent=c.pf.toFixed(2); $("#expectancy").textContent=money(c.exp);
 $("#pnlTrend").textContent=state.trades.length?`${state.trades.length} journaled trade${state.trades.length>1?"s":""}`:"No trades yet";
 const discipline=state.trades.length?Math.round(state.trades.reduce((a,t)=>a+(t.plan==="Yes"?1:0),0)/state.trades.length*100):0;
 $("#disciplineScore").textContent=discipline+"%"; $("#dashDiscipline").textContent=discipline+"%";
 const fomo=state.trades.length?Math.round(state.trades.reduce((a,t)=>a+(t.emotion==="FOMO"?0:1),0)/state.trades.length*100):0;
 const plan=discipline;
 $("#dashFomo").textContent=fomo+"%"; $("#dashPlan").textContent=plan+"%";
 renderRecent(); renderSetups(); renderCharts();
}
function renderRecent(){
 const box=$("#recentTrades"); const arr=[...state.trades].reverse().slice(0,6);
 box.innerHTML=arr.length?arr.map(t=>`<div class="trade-row"><div class="trade-main"><b>${t.symbol} · ${t.direction}</b><span>${t.setup||"No setup"} · ${t.date}</span></div><b class="pnl ${t.pnl>=0?"positive":"negative"}">${money(t.pnl)}</b></div>`).join(""):`<div class="empty">No trades yet. Add your first trade.</div>`;
}
function renderSetups(){
 const groups={}; state.trades.forEach(t=>{const k=t.setup||"Unspecified";groups[k]=(groups[k]||[]);groups[k].push(t.pnl)});
 const vals=Object.entries(groups).map(([k,v])=>({k,p:v.reduce((a,b)=>a+b,0)})).sort((a,b)=>b.p-a.p).slice(0,6);
 const max=Math.max(...vals.map(x=>Math.abs(x.p)),1);
 $("#setupPerformance").innerHTML=vals.length?vals.map(x=>`<div class="setup-row"><div class="setup-label"><span>${x.k}</span><b class="${x.p>=0?"positive":"negative"}">${money(x.p)}</b></div><div class="bar"><i style="width:${Math.max(5,Math.abs(x.p)/max*100)}%"></i></div></div>`).join(""):`<div class="empty">Setup performance will appear after you journal trades.</div>`;
}
function renderTable(){
 const q=$("#searchTrades").value.toLowerCase(), rf=$("#resultFilter").value, df=$("#directionFilter").value;
 const rows=state.trades.filter(t=>(!q||JSON.stringify(t).toLowerCase().includes(q))&&(rf==="all"||(rf==="win"&&t.pnl>0)||(rf==="loss"&&t.pnl<0))&&(df==="all"||t.direction===df)).reverse();
 $("#tradeTable").innerHTML=rows.length?rows.map(t=>`<tr><td>${t.date}</td><td><b>${t.symbol}</b></td><td>${t.direction}</td><td>${t.setup||"—"}</td><td>${t.entry}</td><td>${t.exit}</td><td class="${t.pnl>=0?"positive":"negative"}"><b>${money(t.pnl)}</b></td><td>${t.r.toFixed(2)}R</td><td>${t.emotion}</td><td><button class="delete-btn" onclick="deleteTrade('${t.id}')">×</button></td></tr>`).join(""):`<tr><td colspan="10" class="empty">No matching trades.</td></tr>`;
}
function deleteTrade(id){if(confirm("Delete this journal entry?")){state.trades=state.trades.filter(t=>t.id!==id);save();renderTable();renderDashboard();renderAnalytics()}}
["searchTrades","resultFilter","directionFilter"].forEach(id=>$( "#"+id).addEventListener("input",renderTable));

function openModal(){ $("#tradeModal").classList.add("show"); $("#fDate").value=new Date().toISOString().slice(0,10)}
function closeModal(){$("#tradeModal").classList.remove("show")}
$("#newTradeBtn").onclick=openModal;$("#newTradeBtn2").onclick=openModal;$("#closeModal").onclick=closeModal;$("#cancelModal").onclick=closeModal;
$("#tradeForm").onsubmit=e=>{
 e.preventDefault();
 const entry=+$("#fEntry").value, exit=+$("#fExit").value, qty=+$("#fQty").value||1, risk=+$("#fRisk").value||1;
 let pnl=$("#fPnl").value===""?($("#fDirection").value==="Long"?(exit-entry):(entry-exit))*qty:+$("#fPnl").value;
 const t={id:crypto.randomUUID(),date:$("#fDate").value,symbol:$("#fSymbol").value.toUpperCase(),direction:$("#fDirection").value,setup:$("#fSetup").value.trim(),entry,exit,qty,risk,pnl,emotion:$("#fEmotion").value,plan:$("#fPlan").value,confidence:+$("#fConfidence").value,notes:$("#fNotes").value.trim(),r:pnl/risk};
 state.trades.push(t);save();e.target.reset();closeModal();renderDashboard();nav("trades");
};

function renderAnalytics(){
 const c=calc(), t=state.trades;
 $("#bestTrade").textContent=money(t.length?Math.max(...t.map(x=>x.pnl)):0);
 $("#worstTrade").textContent=money(t.length?Math.min(...t.map(x=>x.pnl)):0);
 $("#avgWin").textContent=money(c.wins.length?c.gp/c.wins.length:0);
 $("#avgLoss").textContent=money(c.losses.length?-c.gl/c.losses.length:0);
 const days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"], d=days.map(x=>({day:x,p:0,n:0}));
 t.forEach(x=>{const i=new Date(x.date+"T12:00:00").getDay();d[i].p+=x.pnl;d[i].n++});
 const max=Math.max(...d.map(x=>Math.abs(x.p)),1);
 $("#dayPerformance").innerHTML=d.map(x=>`<div class="day-row"><div class="day-label"><span>${x.day} <small>(${x.n})</small></span><b class="${x.p>=0?"positive":"negative"}">${money(x.p)}</b></div><div class="bar"><i style="width:${Math.max(3,Math.abs(x.p)/max*100)}%"></i></div></div>`).join("");
 renderCharts();
}
function renderCharts(){
 drawEquity();drawResults();
}
function setupCanvas(id){
 const c=$("#"+id),ctx=c.getContext("2d"),d=devicePixelRatio||1,w=c.clientWidth,h=c.clientHeight||250;c.width=w*d;c.height=h*d;ctx.scale(d,d);return [ctx,w,h]
}
function drawEquity(){
 const [ctx,w,h]=setupCanvas("equityChart"), t=state.trades;ctx.clearRect(0,0,w,h);
 ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue("--line");ctx.lineWidth=1;
 for(let i=1;i<5;i++){let y=i*h/5;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}
 if(!t.length){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--muted");ctx.fillText("Journal trades to see your equity curve.",20,h/2);return}
 let vals=[0],sum=0;t.forEach(x=>{sum+=x.pnl;vals.push(sum)});let min=Math.min(...vals),max=Math.max(...vals);if(min===max){min-=1;max+=1}
 ctx.strokeStyle="#635bff";ctx.lineWidth=3;ctx.beginPath();vals.forEach((v,i)=>{const x=i/(vals.length-1)*w,y=h-((v-min)/(max-min))*h*.82-h*.04;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();
}
function drawResults(){
 const [ctx,w,h]=setupCanvas("resultChart"),c=calc();ctx.clearRect(0,0,w,h);
 const total=Math.max(c.wins.length+c.losses.length,1),a=c.wins.length/total,barW=Math.min(140,w/3);
 ctx.fillStyle="#635bff";ctx.fillRect(w/2-barW-10,h-40,barW,-(h-80)*a);
 ctx.fillStyle="#d92d20";ctx.fillRect(w/2+10,h-40,barW,-(h-80)*(c.losses.length/total));
 ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--text");ctx.font="600 13px Inter";ctx.textAlign="center";ctx.fillText(`Winners ${c.wins.length}`,w/2-barW/2-10,h-15);ctx.fillText(`Losers ${c.losses.length}`,w/2+barW/2+10,h-15);
}
function renderPsych(){
 $("#psychLog").innerHTML=state.psych.length?[...state.psych].reverse().slice(0,10).map(x=>`<div class="log-item"><b>${x.score}% checklist</b><br><span>${x.date} · ${x.note}</span></div>`).join(""):`<div class="empty">No psychology check-ins yet.</div>`;
}
$("#savePsych").onclick=()=>{const checks=[...$(".psy-check")],score=Math.round(checks.filter(x=>x.checked).length/checks.length*100);state.psych.push({date:new Date().toISOString().slice(0,10),score,note:score===100?"Full plan readiness":"Review the unchecked items before trading"});save();renderPsych()};
function openPsychModal(){ $("#psychModal").classList.add("show"); $("#pDate").value=new Date().toISOString().slice(0,10) }
function closePsychModal(){ $("#psychModal").classList.remove("show") }
$("#addPsychBtn").onclick=openPsychModal; $("#closePsychModal").onclick=closePsychModal; $("#cancelPsychModal").onclick=closePsychModal;
$("#psychForm").onsubmit=e=>{e.preventDefault();const mood=$("#pMood").value,confidence=+$("#pConfidence").value,discipline=+$("#pDiscipline").value,note=$("#pNote").value.trim()||"No note added";state.psych.push({date:$("#pDate").value,score:Math.round(discipline*10),mood,confidence,discipline,note});save();e.target.reset();closePsychModal();renderPsych()};
function renderRules(){
 $("#rulesGrid").innerHTML=state.rules.map((r,i)=>`<article class="rule-card"><button onclick="deleteRule(${i})">×</button><h3>${r.title}</h3><p>${r.text}</p></article>`).join("");
}
function deleteRule(i){state.rules.splice(i,1);save();renderRules()}
$("#addRuleBtn").onclick=()=>{const title=prompt("Rule title:");if(!title)return;const text=prompt("Rule description:")||"";state.rules.push({title,text});save();renderRules()};

$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="tradevault-journal.json";a.click();URL.revokeObjectURL(a.href)};
$("#importBtn").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();location.reload()}catch{alert("Invalid journal file.")}};r.readAsText(f)};

window.addEventListener("resize",()=>{if($("#dashboard").classList.contains("active")||$("#analytics").classList.contains("active"))renderCharts()});
$("#fDate").value=new Date().toISOString().slice(0,10);
renderDashboard();
