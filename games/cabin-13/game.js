(() => {
"use strict";
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const $=id=>document.getElementById(id);
const ui={hud:$("hud"),start:$("startScreen"),modal:$("mathModal"),day:$("dayScreen"),end:$("endScreen"),
food:$("foodVal"),wood:$("woodVal"),ammo:$("ammoVal"),med:$("medVal"),cash:$("cashVal"),threat:$("threatVal"),
health:$("healthBar"),fire:$("fireBar"),night:$("nightLabel"),clock:$("clockLabel"),objective:$("objective"),
interaction:$("interaction"),message:$("message"),name:$("playerName"),startBtn:$("startBtn"),challenge:$("challengeType"),
mathTitle:$("mathTitle"),question:$("mathQuestion"),answers:$("answerChoices"),feedback:$("mathFeedback"),hint:$("mathHint"),
dayTitle:$("dayTitle"),daySummary:$("daySummary"),continueBtn:$("continueBtn"),endTitle:$("endTitle"),final:$("finalStats"),
restartBtn:$("restartBtn"),exportBtn:$("exportBtn"),damage:$("damageFlash")};

let W=innerWidth,H=innerHeight,DPR=Math.min(devicePixelRatio||1,2);
function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();

const WORLD=3000,FOV=Math.PI/2.65,MAXVIEW=1050;
const cabin={x:1500,y:1500,w:210,d:180};
const keys={}; let mouseDown=false,audioCtx=null,state=null;

const DIFF={
 normal:{enemy:1,spawn:1,loss:1,fire:1},
 hard:{enemy:1.12,spawn:1.25,loss:1.25,fire:1.16},
 nightmare:{enemy:1.28,spawn:1.55,loss:1.55,fire:1.34}
};

function fresh(){
 return{running:false,paused:false,transition:false,over:false,name:"Survivor",difficulty:"normal",night:1,time:0,nightDuration:110,
 health:100,fire:82,threat:5,food:8,wood:7,ammo:15,med:2,cash:30,
 p:{x:1500,y:1605,a:-Math.PI/2,r:15,speed:185,shot:0,hit:0,stamina:100},
 trees:[],nodes:[],enemies:[],bullets:[],sparks:[],used:new Set(),lastSpawn:0,msgTime:0,lastTime:performance.now(),
 questions:0,correct:0,streak:0,best:0,kills:0,shots:0,byType:{fraction:[0,0],ratio:[0,0],percent:[0,0],budget:[0,0]},gradeSaved:false};
}
const rng=(a,b)=>Math.random()*(b-a)+a,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),pick=a=>a[Math.floor(Math.random()*a.length)];
const distance=(x1,y1,x2,y2)=>Math.hypot(x1-x2,y1-y2);
function angleDiff(a,b){let d=a-b;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}

function setupWorld(){
 state.trees=[];
 for(let i=0;i<520;i++){
   let x,y,r;
   do{x=rng(50,WORLD-50);y=rng(50,WORLD-50);r=rng(12,30)}
   while(distance(x,y,cabin.x,cabin.y)<310 || state.trees.some(t=>distance(x,y,t.x,t.y)<t.r+r+8));
   state.trees.push({x,y,r,h:rng(120,230),tone:rng(0.75,1.18),lean:rng(-.08,.08)});
 }
 state.nodes=[
  {id:"wood",x:980,y:1180,kind:"wood",label:"Abandoned Woodpile",icon:"🪵"},
  {id:"food",x:2060,y:1080,kind:"food",label:"Ranger Pantry",icon:"🥫"},
  {id:"ammo",x:2160,y:1940,kind:"ammo",label:"Hunter Cache",icon:"🔫"},
  {id:"med",x:900,y:2010,kind:"med",label:"First-Aid Locker",icon:"🩹"},
  {id:"trade",x:1500,y:650,kind:"trade",label:"Supply Kiosk",icon:"💵"}];
}

function setupAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)()}
function tone(f=200,d=.08,type="sine",v=.03){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+d);o.stop(audioCtx.currentTime+d)}
const goodSound=()=>{tone(500,.08,"sine",.04);setTimeout(()=>tone(720,.11,"sine",.03),70)};
const badSound=()=>tone(115,.16,"square",.04);
const shotSound=()=>{tone(86,.07,"square",.06);setTimeout(()=>tone(52,.1,"sawtooth",.03),20)};
const hitSound=()=>tone(58,.13,"sawtooth",.06);

document.querySelectorAll(".difficulty").forEach(b=>b.onclick=()=>{document.querySelectorAll(".difficulty").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")});
ui.startBtn.onclick=startGame;ui.continueBtn.onclick=nextNight;ui.restartBtn.onclick=()=>{ui.end.classList.add("hidden");ui.start.classList.remove("hidden");ui.hud.classList.add("hidden")};ui.exportBtn.onclick=exportGrades;

addEventListener("keydown",e=>{
 keys[e.key.toLowerCase()]=true;
 if(!state||!state.running||state.paused||state.transition)return;
 const k=e.key.toLowerCase();
 if(k==="e")interact(); if(k==="f")feedFire(); if(k==="h")medicine();
});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener("click",()=>{if(state?.running&&!state.paused&&!state.transition){canvas.requestPointerLock?.();shoot()}});
addEventListener("mousemove",e=>{if(document.pointerLockElement===canvas&&state?.running&&!state.paused&&!state.transition)state.p.a+=e.movementX*.00245});
addEventListener("mousedown",()=>mouseDown=true);addEventListener("mouseup",()=>mouseDown=false);

function startGame(){
 setupAudio();state=fresh();state.name=ui.name.value.trim()||"Survivor";state.difficulty=document.querySelector(".difficulty.selected").dataset.diff;
 if(state.difficulty==="hard"){state.food=7;state.wood=6;state.ammo=12}
 if(state.difficulty==="nightmare"){state.food=6;state.wood=5;state.ammo=10;state.med=1}
 setupWorld();ui.start.classList.add("hidden");ui.end.classList.add("hidden");ui.day.classList.add("hidden");ui.hud.classList.remove("hidden");
 state.running=true;state.lastTime=performance.now();showMessage("Night 1. The tree line is already moving.");canvas.requestPointerLock?.();requestAnimationFrame(loop)
}
function loop(now){if(!state||!state.running)return;const dt=Math.min((now-state.lastTime)/1000,.034);state.lastTime=now;if(!state.paused&&!state.transition&&!state.over)update(dt);render();requestAnimationFrame(loop)}

function collides(nx,ny){
 if(nx<30||ny<30||nx>WORLD-30||ny>WORLD-30)return true;
 for(const t of state.trees)if(distance(nx,ny,t.x,t.y)<t.r+state.p.r+2)return true;
 const cx=cabin.x,cy=cabin.y;
 if(nx>cx-cabin.w/2-state.p.r&&nx<cx+cabin.w/2+state.p.r&&ny>cy-cabin.d/2-state.p.r&&ny<cy+cabin.d/2+state.p.r){
   // leave doorway opening on south wall
   if(!(ny>cy+cabin.d/2-22 && Math.abs(nx-cx)<38))return true;
 }
 return false;
}
function update(dt){
 const p=state.p,d=DIFF[state.difficulty];
 let f=(keys["w"]?1:0)-(keys["s"]?1:0),s=(keys["d"]?1:0)-(keys["a"]?1:0);
 let moving=f||s,sprint=keys["shift"]&&moving&&p.stamina>2;
 let sp=p.speed*(sprint?1.58:1);if(sprint)p.stamina=Math.max(0,p.stamina-dt*23);else p.stamina=Math.min(100,p.stamina+dt*12);
 if(moving){let m=Math.hypot(f,s);f/=m;s/=m;let dx=(Math.cos(p.a)*f+Math.cos(p.a+Math.PI/2)*s)*sp*dt,dy=(Math.sin(p.a)*f+Math.sin(p.a+Math.PI/2)*s)*sp*dt;if(!collides(p.x+dx,p.y))p.x+=dx;if(!collides(p.x,p.y+dy))p.y+=dy}
 p.shot=Math.max(0,p.shot-dt);p.hit=Math.max(0,p.hit-dt);
 if(mouseDown&&document.pointerLockElement===canvas&&p.shot<=0)shoot();

 state.time+=dt;state.fire-=dt*(.36+state.night*.035)*d.fire;
 if(state.fire<=0){state.fire=0;state.threat+=dt*2.1}else state.threat-=dt*.04;
 state.threat=clamp(state.threat,0,100);
 state.msgTime=Math.max(0,state.msgTime-dt);if(!state.msgTime)ui.message.textContent="";

 state.lastSpawn+=dt;const spawnEvery=Math.max(2.8,7.5-state.night*.55)/d.spawn;
 if(state.lastSpawn>spawnEvery&&state.time>8){state.lastSpawn=0;spawnEnemy(false)}
 if(state.threat>65&&Math.random()<dt*.11)spawnEnemy(true);

 for(const e of state.enemies){
  if(e.dead)continue;let dx=p.x-e.x,dy=p.y-e.y,dm=Math.hypot(dx,dy)||1;
  let fireSafe=distance(p.x,p.y,cabin.x,cabin.y)<230&&state.fire>35?.5:1;
  e.x+=dx/dm*e.speed*d.enemy*fireSafe*dt;e.y+=dy/dm*e.speed*d.enemy*fireSafe*dt;
  e.phase+=dt*4;
  if(dm<32&&p.hit<=0){p.hit=1.05;let dmg=rng(8,15)+(state.night-1)*1.4;state.health-=dmg;state.threat=clamp(state.threat+8,0,100);hitSound();flashDamage();showMessage("Something hit you. -"+Math.round(dmg)+" health.");if(state.health<=0)endGame(false,"You were taken by the woods.")}
 }
 state.enemies=state.enemies.filter(e=>!e.dead&&distance(e.x,e.y,p.x,p.y)<1400);
 for(const b of state.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt}
 for(const b of state.bullets){if(b.dead)continue;for(const e of state.enemies){if(e.dead)continue;if(distance(b.x,b.y,e.x,e.y)<e.r+6){b.dead=true;e.hp--;if(e.hp<=0){e.dead=true;state.kills++;state.threat=clamp(state.threat-2,0,100);spark(e.x,e.y)}break}}}
 state.bullets=state.bullets.filter(b=>!b.dead&&b.life>0);
 state.sparks.forEach(q=>{q.life-=dt;q.y-=dt*8});state.sparks=state.sparks.filter(q=>q.life>0);
 updateInteraction();if(state.time>=state.nightDuration)finishNight();if(state.food<=0)state.health-=dt*2.4;if(state.health<=0)endGame(false,"You did not survive the night.");updateHUD()
}
function spawnEnemy(near){if(state.enemies.length>18)return;const p=state.p,a=rng(0,Math.PI*2),dd=near?rng(330,500):rng(520,780);state.enemies.push({x:clamp(p.x+Math.cos(a)*dd,40,WORLD-40),y:clamp(p.y+Math.sin(a)*dd,40,WORLD-40),r:rng(13,18),h:rng(72,102),speed:rng(48,74)+state.night*4,hp:state.night>=4&&Math.random()<.27?2:1,phase:rng(0,10),dead:false})}
function shoot(){const p=state.p;if(p.shot>0)return;if(state.ammo<=0){showMessage("CLICK. No ammunition.");tone(45,.04,"square",.03);p.shot=.3;return}state.ammo--;state.shots++;p.shot=.28;const a=p.a+rng(-.014,.014),sp=820;state.bullets.push({x:p.x+Math.cos(a)*20,y:p.y+Math.sin(a)*20,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1.05,dead:false});shotSound()}
function feedFire(){if(distance(state.p.x,state.p.y,cabin.x,cabin.y)>240){showMessage("Get closer to the cabin fire.");return}if(state.wood<=0){showMessage("No wood left.");return}state.wood--;state.fire=clamp(state.fire+29,0,100);state.threat=clamp(state.threat-5,0,100);showMessage("You feed the fire. The woods pull back.");tone(160,.12,"triangle",.03)}
function medicine(){if(state.med<=0){showMessage("No medicine left.");return}if(state.health>=98){showMessage("You're healthy. Save it.");return}state.med--;state.health=clamp(state.health+34,0,100);showMessage("Bandaged. +34 health.");goodSound()}

function nearbyNode(){let best=null,bd=999;for(const n of state.nodes){let d=distance(state.p.x,state.p.y,n.x,n.y);if(d<bd){bd=d;best=n}}return bd<90?best:null}
function updateInteraction(){let n=nearbyNode();if(n)ui.interaction.textContent=state.used.has(n.id)?`${n.icon} ${n.label} — searched tonight`:`[E] ${n.icon} Search ${n.label}`;else if(distance(state.p.x,state.p.y,cabin.x,cabin.y)<240)ui.interaction.textContent="[F] Feed fire   [H] Use medicine";else ui.interaction.textContent=""}
function interact(){let n=nearbyNode();if(!n){showMessage("Nothing useful here.");return}if(state.used.has(n.id)){showMessage("Already searched tonight.");return}openMath(n)}

function resourceWord(k){return{wood:"logs",food:"food packs",ammo:"rounds",med:"bandages",trade:"dollars"}[k]}
function shuffled(ans,fmt=x=>String(x)){let vals=new Set([ans]);[-2,-1,1,2,3].forEach(d=>{if(vals.size<4)vals.add(Math.max(0,ans+d))});let arr=[...vals].slice(0,4).map(v=>({value:v,display:fmt(v)}));while(arr.length<4){let v=ans+arr.length+1;arr.push({value:v,display:fmt(v)})}return arr.sort(()=>Math.random()-.5)}
function generateQuestion(kind){
 let types=kind==="trade"?["budget","percent","ratio"]:kind==="ammo"?["ratio","percent","fraction"]:kind==="wood"?["fraction","ratio","percent"]:kind==="food"?["fraction","percent","budget"]:["percent","fraction","budget"];
 let t=pick(types),lvl=state.night+(state.difficulty==="hard"?1:state.difficulty==="nightmare"?2:0);return t==="fraction"?fractionQ(kind,lvl):t==="ratio"?ratioQ(kind,lvl):t==="percent"?percentQ(kind,lvl):budgetQ(kind,lvl)
}
function fractionQ(k,l){let den=pick(l>=4?[5,6,8,10,12]:[4,5,6,8]),num=pick(Array.from({length:den-1},(_,i)=>i+1)),mult=pick(l>=4?[2,3,4,5,6]:[2,3,4]),total=den*mult,ans=num*mult,r=Math.max(2,Math.ceil(ans/2));return{type:"fraction",label:"FRACTION SURVIVAL",text:`A crate holds <b>${total} ${resourceWord(k)}</b>. You can safely carry <b>${num}/${den}</b> of it. How many do you take?`,answer:ans,answerDisplay:String(ans),choices:shuffled(ans),reward:r,penalty:1,rewardText:`you secure ${r} useful supplies.`,penaltyText:"You lose time and supplies in the dark.",hint:"Fraction × total = amount taken."}}
function ratioQ(k,l){let a=pick([2,3,4]),b=pick([3,4,5,6]),sets=pick(l>=4?[3,4,5,6]:[2,3,4]),given=a*sets,ans=b*sets,r=Math.max(2,Math.round(ans/3));return{type:"ratio",label:"RATIO CHECK",text:`The survival ratio is <b>${a}:${b}</b>. For every ${a} supply bundles, you need ${b} ${resourceWord(k)}. If you have <b>${given}</b> first-units, how many ${resourceWord(k)} are needed?`,answer:ans,answerDisplay:String(ans),choices:shuffled(ans),reward:r,penalty:2,rewardText:`the ratio works; +${r} ${resourceWord(k)}.`,penaltyText:"The bad mix wastes stock.",hint:"Scale both sides by the same factor."}}
function percentQ(k,l){let pct=pick(l>=4?[15,20,25,30,40,50,60,75]:[20,25,40,50,75]),bases=[20,24,40,50,60,80,100].filter(x=>Number.isInteger(x*pct/100)),base=pick(bases),ans=base*pct/100,r=Math.max(2,Math.round(ans/4));return{type:"percent",label:"PERCENTAGE CHECK",text:`Only <b>${pct}%</b> of a ${base}-${resourceWord(k)} shipment is still usable. How many remain?`,answer:ans,answerDisplay:String(ans),choices:shuffled(ans),reward:r,penalty:2,rewardText:`you salvage +${r} ${resourceWord(k)}.`,penaltyText:"You misjudge the usable stock.",hint:"Percent as decimal × total."}}
function budgetQ(k,l){let price=pick([2,3,4,5,6]),budget=price*pick(l>=4?[6,7,8,9]:[4,5,6,7])+pick([0,1]),reserve=pick([4,5,6,8]),spend=Math.max(0,budget-reserve),ans=Math.floor(spend/price),r=k==="trade"?Math.max(4,ans*2):Math.max(2,ans);return{type:"budget",label:"BUDGETING CHECK",text:`You have <b>$${budget}</b>, but must keep <b>$${reserve}</b> for emergencies. ${resourceWord(k)} cost <b>$${price} each</b>. What is the most you can buy?`,answer:ans,answerDisplay:String(ans),choices:shuffled(ans),reward:r,penalty:2,rewardText:k==="trade"?`smart budgeting saves $${r}.`:`you obtain +${r} ${resourceWord(k)}.`,penaltyText:"The mistake costs valuable resources.",hint:"Subtract the reserve before dividing."}}

function openMath(node){state.paused=true;document.exitPointerLock?.();let q=generateQuestion(node.kind);state.current={...q,node};ui.feedback.textContent="";ui.feedback.className="feedback";ui.challenge.textContent=q.label;ui.mathTitle.textContent=`${node.icon} ${node.label}`;ui.question.innerHTML=q.text;ui.hint.textContent=q.hint;ui.answers.innerHTML="";q.choices.forEach(c=>{let b=document.createElement("button");b.textContent=c.display;b.onclick=()=>answerMath(c.value);ui.answers.appendChild(b)});ui.modal.classList.remove("hidden")}
function answerMath(v){let q=state.current;if(!q)return;[...ui.answers.children].forEach(b=>b.disabled=true);let ok=Number(v)===Number(q.answer);state.questions++;state.byType[q.type][1]++;if(ok){state.correct++;state.byType[q.type][0]++;state.streak++;state.best=Math.max(state.best,state.streak);reward(q.node.kind,q.reward);ui.feedback.textContent="CORRECT — "+q.rewardText;ui.feedback.className="feedback good";goodSound()}else{state.streak=0;penalty(q.node.kind,q.penalty);ui.feedback.textContent=`WRONG — answer: ${q.answerDisplay}. ${q.penaltyText}`;ui.feedback.className="feedback bad";badSound()}state.used.add(q.node.id);state.current=null;setTimeout(()=>{ui.modal.classList.add("hidden");state.paused=false;canvas.requestPointerLock?.();updateHUD()},900)}
function reward(k,a){if(k==="wood")state.wood+=a;else if(k==="food")state.food+=a;else if(k==="ammo")state.ammo+=a;else if(k==="med")state.med+=a;else state.cash+=a;state.threat=clamp(state.threat-3,0,100)}
function penalty(k,a){a=Math.max(1,Math.round(a*DIFF[state.difficulty].loss));if(k==="wood")state.wood=Math.max(0,state.wood-a);else if(k==="food")state.food=Math.max(0,state.food-a);else if(k==="ammo")state.ammo=Math.max(0,state.ammo-a);else if(k==="med")state.health=Math.max(1,state.health-a*4);else state.cash=Math.max(0,state.cash-a*2);state.threat=clamp(state.threat+9,0,100);for(let i=0;i<Math.min(2,state.night);i++)spawnEnemy(true)}

function finishNight(){if(state.transition||state.over)return;state.transition=true;document.exitPointerLock?.();let need=2+Math.floor((state.night-1)/2),sum=[];if(state.food>=need){state.food-=need;sum.push(`🥫 Ate ${need} food.`)}else{let m=need-state.food;state.food=0;state.health-=m*15;sum.push(`⚠ Food shortage: -${m*15} health.`)}if(state.wood>=1){state.wood--;sum.push("🪵 Used 1 wood to hold the cabin through dawn.")}else{state.threat=clamp(state.threat+15,0,100);sum.push("⚠ No reserve wood. Threat increased.")}let acc=state.questions?Math.round(state.correct/state.questions*100):0;if(state.health<=0){endGame(false,"You survived the creatures, but not the shortages.");return}if(state.night>=5){endGame(true,"You made it to the fifth dawn.");return}ui.dayTitle.textContent=`Night ${state.night} survived.`;ui.daySummary.innerHTML=`<div class="stat-grid"><div class="stat-card"><b>MATH ACCURACY</b><span>${acc}%</span></div><div class="stat-card"><b>BEST STREAK</b><span>${state.best}</span></div><div class="stat-card"><b>ENEMIES STOPPED</b><span>${state.kills}</span></div><div class="stat-card"><b>THREAT</b><span>${Math.round(state.threat)}%</span></div></div><p>${sum.join("<br>")}</p><p>The next night is colder, darker, and more crowded.</p>`;ui.day.classList.remove("hidden")}
function nextNight(){ui.day.classList.add("hidden");state.night++;state.time=0;state.transition=false;state.used=new Set();state.enemies=[];state.bullets=[];state.fire=clamp(state.fire+12,0,100);state.threat=clamp(state.threat+4,0,100);state.p.x=1500;state.p.y=1605;state.p.a=-Math.PI/2;showMessage(`Night ${state.night}. Something is pacing beyond the trees.`);canvas.requestPointerLock?.();updateHUD()}
function gradeLetter(a){return a>=93?"A":a>=85?"B":a>=75?"C":a>=65?"D":"F"}
function saveGrade(s){if(state.gradeSaved)return;let a=state.questions?Math.round(state.correct/state.questions*100):0,r={date:new Date().toISOString(),name:state.name,difficulty:state.difficulty,survived:s?"Yes":"No",night:state.night,questions:state.questions,correct:state.correct,accuracy:a,grade:gradeLetter(a),bestStreak:state.best,kills:state.kills};let arr=JSON.parse(localStorage.getItem("cabin13_grades")||"[]");arr.push(r);localStorage.setItem("cabin13_grades",JSON.stringify(arr));state.gradeSaved=true}
function fmt(t){let[c,n]=state.byType[t];return n?`${Math.round(c/n*100)}%`:"—"}
function endGame(s,reason){if(!state||state.over)return;state.over=true;state.running=false;document.exitPointerLock?.();saveGrade(s);ui.hud.classList.add("hidden");ui.day.classList.add("hidden");ui.modal.classList.add("hidden");ui.end.classList.remove("hidden");let a=state.questions?Math.round(state.correct/state.questions*100):0;ui.endTitle.textContent=s?`${state.name} survived Cabin 13.`:`${state.name} was lost in Cabin 13.`;ui.final.innerHTML=`<p>${reason}</p><div class="grade">${gradeLetter(a)}</div><div class="stat-grid"><div class="stat-card"><b>MATH ACCURACY</b><span>${a}%</span></div><div class="stat-card"><b>QUESTIONS</b><span>${state.correct}/${state.questions}</span></div><div class="stat-card"><b>BEST STREAK</b><span>${state.best}</span></div><div class="stat-card"><b>CREATURES STOPPED</b><span>${state.kills}</span></div><div class="stat-card"><b>FOOD LEFT</b><span>${state.food}</span></div><div class="stat-card"><b>WOOD LEFT</b><span>${state.wood}</span></div><div class="stat-card"><b>AMMO LEFT</b><span>${state.ammo}</span></div><div class="stat-card"><b>CASH LEFT</b><span>$${state.cash}</span></div></div><p>Fractions: ${fmt("fraction")} · Ratios: ${fmt("ratio")} · Percentages: ${fmt("percent")} · Budgeting: ${fmt("budget")}</p>`}
function exportGrades(){let rows=JSON.parse(localStorage.getItem("cabin13_grades")||"[]");if(!rows.length)return;let cols=["date","name","difficulty","survived","night","questions","correct","accuracy","grade","bestStreak","kills"],esc=v=>`"${String(v).replaceAll('"','""')}"`,csv=[cols.join(","),...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n"),blob=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="cabin13-grades.csv";a.click();URL.revokeObjectURL(a.href)}

function updateHUD(){ui.food.textContent=state.food;ui.wood.textContent=state.wood;ui.ammo.textContent=state.ammo;ui.med.textContent=state.med;ui.cash.textContent="$"+state.cash;ui.threat.textContent=Math.round(state.threat)+"%";ui.health.style.width=clamp(state.health,0,100)+"%";ui.fire.style.width=clamp(state.fire,0,100)+"%";ui.night.textContent=`Night ${state.night} / 5`;let t=state.time/state.nightDuration,mins=Math.floor(t*9*60),total=20*60+mins,hr=Math.floor(total/60)%24,mm=total%60;ui.clock.textContent=`${((hr+11)%12)+1}:${String(mm).padStart(2,"0")} ${hr>=12?"PM":"AM"}`;ui.objective.innerHTML=state.fire<25?"⚠ Fire low. Return to the cabin and press <b>F</b>.":state.ammo<3?"⚠ Ammo critical. Find the hunter cache.":"Walk deeper into the woods. Search glowing supply sites."}
function showMessage(m){ui.message.textContent=m;state.msgTime=3}
function flashDamage(){ui.damage.style.background="rgba(150,0,0,.38)";setTimeout(()=>ui.damage.style.background="rgba(150,0,0,0)",120)}
function spark(x,y){for(let i=0;i<8;i++)state.sparks.push({x:x+rng(-8,8),y:y+rng(-8,8),life:rng(.2,.6)})}

/* ---------- FIRST-PERSON RENDERER ---------- */
function project(wx,wy,height=80){
 const p=state.p,dx=wx-p.x,dy=wy-p.y,dist=Math.hypot(dx,dy),ang=angleDiff(Math.atan2(dy,dx),p.a);
 if(Math.abs(ang)>FOV*.65||dist<4||dist>MAXVIEW)return null;
 const focal=W/(2*Math.tan(FOV/2)),sx=W/2+Math.tan(ang)*focal,scale=focal/dist;
 return{sx,dist,scale,base:H*.56+scale*10,top:H*.56-height*scale,ang}
}
function drawSkyGround(){
 let g=ctx.createLinearGradient(0,0,0,H*.56);g.addColorStop(0,"#03070a");g.addColorStop(1,"#11160f");ctx.fillStyle=g;ctx.fillRect(0,0,W,H*.56);
 let gr=ctx.createLinearGradient(0,H*.56,0,H);gr.addColorStop(0,"#13180f");gr.addColorStop(.55,"#080b07");gr.addColorStop(1,"#030403");ctx.fillStyle=gr;ctx.fillRect(0,H*.56,W,H*.44);
 // perspective ground streaks
 ctx.strokeStyle="rgba(78,88,62,.10)";ctx.lineWidth=1;
 for(let i=0;i<22;i++){let y=H*.56+(i/22)**1.8*H*.44;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
 // stars
 ctx.fillStyle="rgba(210,220,195,.18)";for(let i=0;i<45;i++){let x=(i*173)%W,y=(i*79)%Math.max(1,H*.42);ctx.fillRect(x,y,1,1)}
}
function drawTree(t,pr){
 const trunkW=Math.max(2,t.r*pr.scale*.7),trunkH=Math.max(10,t.h*pr.scale),x=pr.sx,base=H*.57;
 ctx.save();ctx.translate(x,base);
 // tree shadow
 ctx.fillStyle=`rgba(0,0,0,${clamp(.45+pr.dist/1800,0,0.82)})`;ctx.beginPath();ctx.ellipse(0,4,trunkW*1.8,Math.max(2,trunkW*.35),0,0,Math.PI*2);ctx.fill();
 // trunk
 ctx.fillStyle=`rgba(${Math.floor(45*t.tone)},${Math.floor(34*t.tone)},${Math.floor(24*t.tone)},1)`;
 ctx.beginPath();ctx.moveTo(-trunkW*.32,0);ctx.lineTo(-trunkW*.12,-trunkH*.72);ctx.lineTo(trunkW*.15,-trunkH*.72);ctx.lineTo(trunkW*.34,0);ctx.closePath();ctx.fill();
 // branches/crown
 let crownY=-trunkH*.7,crownW=Math.max(8,t.r*pr.scale*4.3),crownH=Math.max(18,trunkH*.52);
 ctx.fillStyle=`rgba(${Math.floor(10*t.tone)},${Math.floor(25*t.tone)},${Math.floor(12*t.tone)},.98)`;
 for(let j=0;j<3;j++){let yy=crownY-j*crownH*.28,ww=crownW*(1-j*.16);ctx.beginPath();ctx.moveTo(0,yy-crownH*.65);ctx.lineTo(-ww*.55,yy+crownH*.3);ctx.lineTo(ww*.55,yy+crownH*.3);ctx.closePath();ctx.fill()}
 ctx.restore()
}
function drawCabin3D(){
 let pr=project(cabin.x,cabin.y,150);if(!pr)return;let w=Math.max(14,cabin.w*pr.scale),h=Math.max(12,150*pr.scale),x=pr.sx,y=H*.56;
 ctx.fillStyle="#241b13";ctx.fillRect(x-w/2,y-h,w,h);
 ctx.strokeStyle="rgba(90,66,42,.7)";ctx.lineWidth=Math.max(1,pr.scale*2);for(let j=0;j<7;j++){let yy=y-h+j*h/7;ctx.beginPath();ctx.moveTo(x-w/2,yy);ctx.lineTo(x+w/2,yy);ctx.stroke()}
 ctx.fillStyle="#070605";ctx.fillRect(x-w*.11,y-h*.48,w*.22,h*.48);
 ctx.fillStyle="#3b2a15";ctx.beginPath();ctx.moveTo(x-w*.58,y-h);ctx.lineTo(x,y-h*1.42);ctx.lineTo(x+w*.58,y-h);ctx.closePath();ctx.fill();
 let fire=state.fire/100;ctx.fillStyle=`rgba(243,130,45,${.25+.5*fire})`;ctx.beginPath();ctx.arc(x,y-h*.08,Math.max(3,30*pr.scale+fire*12),0,Math.PI*2);ctx.fill()
}
function drawNode(n,pr){
 let x=pr.sx,base=H*.56,h=Math.max(26,70*pr.scale),used=state.used.has(n.id);
 ctx.fillStyle=used?"rgba(100,110,95,.30)":"rgba(187,208,90,.20)";ctx.beginPath();ctx.ellipse(x,base-h*.45,Math.max(10,26*pr.scale),Math.max(18,55*pr.scale),0,0,Math.PI*2);ctx.fill();
 ctx.font=`${Math.max(16,36*pr.scale)}px sans-serif`;ctx.textAlign="center";ctx.fillStyle=used?"#8b9286":"#e3e9d8";ctx.fillText(n.icon,x,base-h*.2);
 if(pr.dist<220){ctx.font="11px monospace";ctx.fillStyle="#dce4d7";ctx.fillText(n.label,x,base+18)}
}
function drawEnemy(e,pr){
 let x=pr.sx,base=H*.56,h=Math.max(25,e.h*pr.scale),w=Math.max(12,e.r*pr.scale*2.4),pulse=Math.sin(e.phase)*2;
 ctx.fillStyle="rgba(2,3,2,.98)";ctx.beginPath();ctx.ellipse(x,base-h*.45,w*.8,h*.55,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle="rgba(215,55,38,.95)";let eye=Math.max(1.5,2.5*pr.scale);ctx.beginPath();ctx.arc(x-w*.22,base-h*.57,eye,0,Math.PI*2);ctx.arc(x+w*.22,base-h*.57,eye,0,Math.PI*2);ctx.fill();
}
function drawBullet(b,pr){ctx.fillStyle="#f6e4a2";ctx.beginPath();ctx.arc(pr.sx,H*.53,Math.max(1.5,3*pr.scale),0,Math.PI*2);ctx.fill()}
function drawFlashlight(){
 let grd=ctx.createRadialGradient(W/2,H*.53,10,W/2,H*.53,Math.min(W,H)*.58);grd.addColorStop(0,"rgba(245,236,190,.17)");grd.addColorStop(.38,"rgba(225,221,178,.08)");grd.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 // darkness mask leaving flashlight center
 let dark=ctx.createRadialGradient(W/2,H*.53,50,W/2,H*.53,Math.min(W,H)*.63);dark.addColorStop(0,"rgba(0,0,0,.06)");dark.addColorStop(.35,"rgba(0,0,0,.28)");dark.addColorStop(1,"rgba(0,0,0,.82)");ctx.fillStyle=dark;ctx.fillRect(0,0,W,H)
}
function render(){
 if(!state){ctx.fillStyle="#020302";ctx.fillRect(0,0,W,H);return}
 drawSkyGround();
 let drawables=[];
 for(const t of state.trees){let pr=project(t.x,t.y,t.h);if(pr)drawables.push({type:"tree",obj:t,pr})}
 for(const n of state.nodes){let pr=project(n.x,n.y,80);if(pr)drawables.push({type:"node",obj:n,pr})}
 for(const e of state.enemies){if(!e.dead){let pr=project(e.x,e.y,e.h);if(pr)drawables.push({type:"enemy",obj:e,pr})}}
 for(const b of state.bullets){let pr=project(b.x,b.y,8);if(pr)drawables.push({type:"bullet",obj:b,pr})}
 let cpr=project(cabin.x,cabin.y,150);if(cpr)drawables.push({type:"cabin",obj:cabin,pr:cpr});
 drawables.sort((a,b)=>b.pr.dist-a.pr.dist);
 for(const d of drawables){if(d.type==="tree")drawTree(d.obj,d.pr);else if(d.type==="node")drawNode(d.obj,d.pr);else if(d.type==="enemy")drawEnemy(d.obj,d.pr);else if(d.type==="bullet")drawBullet(d.obj,d.pr);else drawCabin3D()}
 drawFlashlight();
 if(state.threat>60){ctx.strokeStyle=`rgba(130,20,18,${(state.threat-60)/220})`;ctx.lineWidth=10;ctx.strokeRect(6,6,W-12,H-12)}
 // weapon silhouette
 ctx.fillStyle="rgba(5,6,5,.92)";ctx.beginPath();ctx.moveTo(W*.58,H);ctx.lineTo(W*.54,H*.78);ctx.lineTo(W*.60,H*.74);ctx.lineTo(W*.68,H);ctx.closePath();ctx.fill();ctx.fillRect(W*.535,H*.735,W*.13,12)
}
})();