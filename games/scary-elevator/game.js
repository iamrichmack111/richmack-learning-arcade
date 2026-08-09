(() => {
"use strict";
const $=id=>document.getElementById(id);
const canvas=$("scene"),ctx=canvas.getContext("2d");
const ui={
 game:$("gameUI"),start:$("startScreen"),creepy:$("creepyScreen"),result:$("floorResultScreen"),end:$("endScreen"),
 floor:$("floorLabel"),qnum:$("questionNum"),correct:$("correctCount"),bar:$("progressBar"),need:$("needLabel"),
 subject:$("subjectBadge"),question:$("questionText"),sub:$("subText"),answer:$("answerArea"),feedback:$("feedback"),msg:$("elevatorMessage"),
 name:$("playerName"),startBtn:$("startBtn"),creepyNumber:$("creepyNumber"),creepyTitle:$("creepyTitle"),creepyText:$("creepyText"),returnBtn:$("returnBtn"),
 resultTitle:$("floorResultTitle"),resultStats:$("floorResultStats"),nextBtn:$("nextFloorBtn"),endTitle:$("endTitle"),final:$("finalStats"),
 restart:$("restartBtn"),export:$("exportBtn"),flash:$("flash")
};
let W=innerWidth,H=innerHeight,DPR=Math.min(devicePixelRatio||1,2),state=null,audioCtx=null;
let lookX=0,lookY=0,targetLookX=0,targetLookY=0;

function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(devicePixelRatio||1,2);canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+"px";canvas.style.height=H+"px";ctx.setTransform(DPR,0,0,DPR,0,0)}
addEventListener("resize",resize);resize();
addEventListener("mousemove",e=>{targetLookX=(e.clientX/W-.5)*24;targetLookY=(e.clientY/H-.5)*12});

const WORDS={
 easy:[
  ["ghost","A spooky spirit."],["cabin","A small house."],["night","The dark part of the day."],["light","Something that helps you see."],
  ["floor","A level in a building."],["door","You open this to enter."],["creepy","Strange and scary."],["shadow","A dark shape made by blocked light."],
  ["stairs","Steps between floors."],["alarm","A warning sound."],["monster","A scary creature."],["window","Glass opening in a wall."]
 ],
 medium:[
  ["elevator","A machine that moves between floors."],["hallway","A long passage inside a building."],["flickering","Turning on and off quickly."],
  ["basement","The lowest level of a building."],["whisper","To speak very quietly."],["corridor","Another word for hallway."],
  ["emergency","A dangerous situation needing quick action."],["abandoned","Left empty and unused."],["mysterious","Difficult to explain or understand."],
  ["maintenance","Work done to keep something working."],["generator","A machine that makes electricity."],["footsteps","The sounds made by walking."]
 ],
 hard:[
  ["claustrophobic","Uncomfortable or afraid in tight spaces."],["malfunction","A failure to work correctly."],["apparition","A ghostly figure."],
  ["intermittent","Stopping and starting at intervals."],["disoriented","Confused about where you are."],["uninhabited","Not lived in by people."],
  ["surveillance","Close observation or monitoring."],["disturbance","Something that interrupts peace or order."],["electrical","Related to electricity."],
  ["investigate","To examine carefully to discover facts."],["unsettling","Making someone feel uneasy."],["mechanism","A system of moving parts."]
 ]
};

const CREEPY=[
 {n:"0",scene:"parking",title:"The Parking Level",text:"A parking garage stretches into darkness. Every car is running. None of them have drivers."},
 {n:"13",scene:"hotel",title:"Floor 13",text:"A hotel hallway waits outside. Every door is numbered 13, and every peephole is dark."},
 {n:"B3",scene:"basement",title:"The Basement",text:"Water covers the floor. A red maintenance light swings over something moving behind the pipes."},
 {n:"6½",scene:"half",title:"The Half Floor",text:"The doors open onto a room only four feet high. Tiny furniture sits beneath a ceiling that should not exist."},
 {n:"-2",scene:"red",title:"Below the Basement",text:"The room is lit completely red. A chair faces the elevator. Someone was sitting in it a moment ago."},
 {n:"404",scene:"mirror",title:"Floor Not Found",text:"Another elevator is waiting across the room. A figure inside it is copying you a second too late."},
 {n:"∞",scene:"endless",title:"The Endless Hall",text:"The hallway has no visible end. The EXIT signs point in both directions."}
];

const pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const randInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;

function fresh(){return{
 running:false,name:"Player",mode:"mixed",difficulty:"easy",floor:1,maxFloor:10,qIndex:0,floorCorrect:0,totalCorrect:0,totalQuestions:0,
 wrong:0,creepyStops:0,bestFloorCorrect:0,current:null,pendingAdvance:false,
 doorOpen:0,doorTarget:0,doorSpeed:0.8,sceneMode:"normal",creepyScene:null,
 elevatorY:0,elevatorVel:0,shake:0,flicker:0,messageTimer:0,last:performance.now(),saved:false
}}

function setupAudio(){if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)()}
function tone(f=200,d=.08,type="sine",v=.03){if(!audioCtx)return;const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.value=f;g.gain.value=v;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+d);o.stop(audioCtx.currentTime+d)}
const goodSound=()=>{tone(520,.08,"sine",.04);setTimeout(()=>tone(720,.12,"sine",.025),60)};
const badSound=()=>{tone(110,.18,"square",.045);setTimeout(()=>tone(65,.2,"sawtooth",.02),55)};
const ding=()=>{tone(880,.14,"sine",.035);setTimeout(()=>tone(1320,.13,"sine",.02),80)};
const motor=()=>tone(54,.45,"sawtooth",.018);

document.querySelectorAll(".mode").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".mode").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));
document.querySelectorAll(".grade").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".grade").forEach(x=>x.classList.remove("selected"));b.classList.add("selected")}));
ui.startBtn.addEventListener("click",startGame);
ui.returnBtn.addEventListener("click",closeCreepy);
ui.nextBtn.addEventListener("click",continueFloor);
ui.restart.addEventListener("click",()=>{ui.end.classList.add("hidden");ui.start.classList.remove("hidden");ui.game.classList.add("hidden")});
ui.export.addEventListener("click",exportGrades);

function startGame(){
 setupAudio();state=fresh();state.name=ui.name.value.trim()||"Player";state.mode=document.querySelector(".mode.selected").dataset.mode;state.difficulty=document.querySelector(".grade.selected").dataset.grade;
 ui.start.classList.add("hidden");ui.end.classList.add("hidden");ui.game.classList.remove("hidden");
 state.running=true;state.last=performance.now();state.doorTarget=0;showMessage("The stainless-steel doors close.");nextQuestion();requestAnimationFrame(loop)
}
function loop(now){
 if(!state||!state.running)return;
 const dt=Math.min((now-state.last)/1000,.04);state.last=now;update(dt);render();requestAnimationFrame(loop)
}
function update(dt){
 lookX+=(targetLookX-lookX)*Math.min(1,dt*5);lookY+=(targetLookY-lookY)*Math.min(1,dt*5);
 state.doorOpen+=(state.doorTarget-state.doorOpen)*Math.min(1,dt*state.doorSpeed*5);
 state.elevatorY+=state.elevatorVel*dt;state.elevatorVel*=Math.pow(.14,dt);
 state.shake=Math.max(0,state.shake-dt*2.2);state.flicker=Math.max(0,state.flicker-dt);
 state.messageTimer=Math.max(0,state.messageTimer-dt);if(!state.messageTimer)ui.msg.textContent="";
}
function showMessage(m){ui.msg.textContent=m;state.messageTimer=2.5}
function required(){return state.difficulty==="easy"?3:4}

function nextQuestion(){
 if(state.qIndex>=5){finishFloor();return}
 state.qIndex++;
 const type=state.mode==="mixed"?(Math.random()<.5?"math":"spelling"):state.mode;
 state.current=type==="math"?makeMath():makeSpelling();
 renderQuestion(state.current);updateHUD()
}

function makeMath(){
 const diff=state.difficulty,f=state.floor;
 const kinds=diff==="easy"?["add","sub","mult"]:diff==="medium"?["add","sub","mult","div","fraction"]:["mult","div","fraction","percent","order"];
 const kind=pick(kinds);
 if(kind==="add"){let a=randInt(2,12+f*2),b=randInt(2,12+f*2);return mcq(`${a} + ${b} = ?`,a+b,"Addition")}
 if(kind==="sub"){let a=randInt(8,20+f*2),b=randInt(1,a-1);return mcq(`${a} - ${b} = ?`,a-b,"Subtraction")}
 if(kind==="mult"){let max=diff==="easy"?10:diff==="medium"?12:15,a=randInt(2,max),b=randInt(2,max);return mcq(`${a} × ${b} = ?`,a*b,"Multiplication")}
 if(kind==="div"){let b=randInt(2,12),ans=randInt(2,12);return mcq(`${b*ans} ÷ ${b} = ?`,ans,"Division")}
 if(kind==="fraction"){let den=pick([2,3,4,5,6,8]),num=randInt(1,den-1),mult=randInt(2,6),total=den*mult;return mcq(`What is ${num}/${den} of ${total}?`,num*mult,"Fractions")}
 if(kind==="percent"){let pct=pick([10,20,25,50,75]),base=pick([20,40,60,80,100]);return mcq(`What is ${pct}% of ${base}?`,base*pct/100,"Percentages")}
 let a=randInt(2,8),b=randInt(2,8),c=randInt(2,5);return mcq(`${a} + ${b} × ${c} = ?`,a+b*c,"Order of Operations")
}
function mcq(prompt,answer,sub){
 let vals=new Set([answer]);[-3,-2,-1,1,2,3,4].sort(()=>Math.random()-.5).forEach(d=>{if(vals.size<4)vals.add(Math.max(0,answer+d))});
 return{type:"math",kind:"choice",prompt,sub,answer,choices:[...vals].slice(0,4).sort(()=>Math.random()-.5)}
}

/* FIXED SPELLING:
   The answer is never shown in the prompt.
   Choice questions ask for the correctly spelled version.
   Typed questions give definition + first/last letters only. */
function makeSpelling(){
 const [word,definition]=pick(WORDS[state.difficulty]);
 if(Math.random()<.62){
   const wrongs=makeMisspellings(word);
   return{
     type:"spelling",kind:"choice",
     prompt:"Choose the correctly spelled word.",
     sub:definition,
     answer:word,
     choices:[word,...wrongs].slice(0,4).sort(()=>Math.random()-.5)
   }
 }
 const clue=word.length<=4?`${word[0]} _ _ ${word[word.length-1]}`:`${word[0]}${"_".repeat(Math.min(8,word.length-2))}${word[word.length-1]}`;
 return{
   type:"spelling",kind:"type",
   prompt:`Spell the word that matches this clue: ${clue}`,
   sub:definition,
   answer:word
 }
}
function makeMisspellings(word){
 const set=new Set(),letters="abcdefghijklmnopqrstuvwxyz";
 const chars=word.split("");
 if(word.length>3){
   let i=Math.max(1,randInt(1,word.length-2)),a=chars.slice();[a[i-1],a[i]]=[a[i],a[i-1]];set.add(a.join(""));
   let b=chars.slice();b.splice(i,1);set.add(b.join(""));
   let c=chars.slice();c[i]=letters[randInt(0,25)];set.add(c.join(""));
   let d=chars.slice();d.splice(i,0,d[i]);set.add(d.join(""));
 }
 while(set.size<3){
   let a=chars.slice(),i=randInt(0,a.length-1);a[i]=letters[randInt(0,25)];let s=a.join("");if(s!==word)set.add(s)
 }
 return[...set].filter(x=>x!==word).slice(0,3)
}

function renderQuestion(q){
 ui.subject.textContent=q.type==="math"?"MATH":"SPELLING";ui.question.textContent=q.prompt;ui.sub.textContent=q.sub||"";
 ui.feedback.textContent="";ui.feedback.className="feedback";ui.answer.innerHTML="";
 if(q.kind==="choice"){
   const wrap=document.createElement("div");wrap.className="choices";
   q.choices.forEach(c=>{const b=document.createElement("button");b.textContent=c;b.addEventListener("click",()=>answer(c));wrap.appendChild(b)});
   ui.answer.appendChild(wrap)
 }else{
   const wrap=document.createElement("div");wrap.className="type-answer",inp=document.createElement("input"),btn=document.createElement("button");
   inp.placeholder="Type the spelling";btn.textContent="SUBMIT";btn.className="primary";
   btn.addEventListener("click",()=>answer(inp.value.trim()));inp.addEventListener("keydown",e=>{if(e.key==="Enter")answer(inp.value.trim())});
   wrap.append(inp,btn);ui.answer.appendChild(wrap);setTimeout(()=>inp.focus(),50)
 }
}
function answer(v){
 const q=state.current;if(!q)return;
 const ok=String(v).trim().toLowerCase()===String(q.answer).toLowerCase();
 state.current=null;state.totalQuestions++;[...ui.answer.querySelectorAll("button,input")].forEach(el=>el.disabled=true);
 if(ok){
   state.floorCorrect++;state.totalCorrect++;goodSound();ui.feedback.textContent="CORRECT — the elevator continues upward.";ui.feedback.className="feedback good";
   showMessage("The floor indicator climbs.");simulateMove();updateHUD();setTimeout(nextQuestion,700)
 }else{
   state.wrong++;badSound();state.shake=.9;state.flicker=.55;flashRed();
   ui.feedback.textContent=`WRONG — answer: ${q.answer}`;ui.feedback.className="feedback bad";
   showMessage("The elevator brakes hard.");updateHUD();setTimeout(openCreepy,700)
 }
}

function simulateMove(){state.elevatorVel=-18;motor();setTimeout(()=>{if(state)state.elevatorVel=11},240)}
function openCreepy(){
 state.creepyStops++;const c=pick(CREEPY);state.creepyScene=c;state.sceneMode="creepy";state.doorTarget=1;state.doorSpeed=.48;ding();
 ui.creepyNumber.textContent="FLOOR "+c.n;ui.creepyTitle.textContent=c.title;ui.creepyText.textContent=c.text;
 ui.creepy.classList.remove("hidden");
}
function closeCreepy(){
 state.doorTarget=0;state.doorSpeed=.85;state.sceneMode="normal";ui.creepy.classList.add("hidden");showMessage("The doors slam shut.");
 setTimeout(nextQuestion,550)
}

function finishFloor(){
 state.bestFloorCorrect=Math.max(state.bestFloorCorrect,state.floorCorrect);const need=required(),passed=state.floorCorrect>=need,pct=Math.round(state.floorCorrect/5*100);
 state.pendingAdvance=passed;state.doorTarget=0;
 ui.resultTitle.textContent=passed?`Floor ${state.floor} cleared.`:`Floor ${state.floor} failed.`;
 ui.resultStats.innerHTML=`<div class="stat-grid">
 <div class="stat-card"><b>CORRECT</b><span>${state.floorCorrect}/5</span></div>
 <div class="stat-card"><b>FLOOR SCORE</b><span>${pct}%</span></div>
 <div class="stat-card"><b>CREEPY STOPS</b><span>${state.creepyStops}</span></div>
 <div class="stat-card"><b>NEEDED</b><span>${need}/5</span></div>
 </div><p>${passed?"The elevator accepts your score and unlocks the next floor.":"The elevator refuses to climb. Repeat the floor."}</p>`;
 ui.nextBtn.textContent=passed?"GO UP":"RETRY FLOOR";ui.result.classList.remove("hidden")
}
function continueFloor(){
 ui.result.classList.add("hidden");
 if(state.pendingAdvance){
   if(state.floor>=state.maxFloor){endGame();return}
   state.floor++;ding();simulateMove()
 }
 state.qIndex=0;state.floorCorrect=0;state.pendingAdvance=false;showMessage(`Floor ${state.floor}. Five questions.`);nextQuestion();updateHUD()
}
function updateHUD(){
 ui.floor.textContent=state.floor;ui.qnum.textContent=Math.min(state.qIndex,5);ui.correct.textContent=`${state.floorCorrect} / 5`;ui.bar.style.width=(state.floorCorrect/5*100)+"%";ui.need.textContent=`Need ${required()} correct to go up.`
}
function flashRed(){ui.flash.style.background="rgba(160,0,0,.38)";setTimeout(()=>ui.flash.style.background="rgba(160,0,0,0)",130)}

function letter(a){return a>=93?"A":a>=85?"B":a>=75?"C":a>=65?"D":"F"}
function saveGrade(){
 if(state.saved)return;const acc=state.totalQuestions?Math.round(state.totalCorrect/state.totalQuestions*100):0;
 const row={date:new Date().toISOString(),name:state.name,mode:state.mode,difficulty:state.difficulty,floor:state.floor,questions:state.totalQuestions,correct:state.totalCorrect,accuracy:acc,grade:letter(acc),creepyStops:state.creepyStops};
 const rows=JSON.parse(localStorage.getItem("scary_elevator_3d_grades")||"[]");rows.push(row);localStorage.setItem("scary_elevator_3d_grades",JSON.stringify(rows));state.saved=true
}
function endGame(){
 saveGrade();ui.game.classList.add("hidden");ui.end.classList.remove("hidden");const acc=state.totalQuestions?Math.round(state.totalCorrect/state.totalQuestions*100):0;
 ui.endTitle.textContent=`${state.name} escaped the elevator.`;
 ui.final.innerHTML=`<div class="grade-letter">${letter(acc)}</div><div class="stat-grid">
 <div class="stat-card"><b>FINAL ACCURACY</b><span>${acc}%</span></div>
 <div class="stat-card"><b>CORRECT</b><span>${state.totalCorrect}/${state.totalQuestions}</span></div>
 <div class="stat-card"><b>CREEPY STOPS</b><span>${state.creepyStops}</span></div>
 <div class="stat-card"><b>BEST FLOOR</b><span>${state.bestFloorCorrect}/5</span></div>
 </div><p>The doors finally open to daylight.</p>`
}
function exportGrades(){
 const rows=JSON.parse(localStorage.getItem("scary_elevator_3d_grades")||"[]");if(!rows.length)return;
 const cols=["date","name","mode","difficulty","floor","questions","correct","accuracy","grade","creepyStops"],esc=v=>`"${String(v).replaceAll('"','""')}"`;
 const csv=[cols.join(","),...rows.map(r=>cols.map(c=>esc(r[c])).join(","))].join("\n");
 const blob=new Blob([csv],{type:"text/csv"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="scary-elevator-3d-grades.csv";a.click();URL.revokeObjectURL(a.href)
}

/* ---------------- 3D-STYLE CANVAS RENDERER ---------------- */

function poly(points,fill,stroke=null,lw=1){
 ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();
 if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}
}
function lerp(a,b,t){return a+(b-a)*t}
function cabGeometry(){
 const cx=W/2+lookX,cy=H*.49+lookY+state.elevatorY;
 const frontW=Math.min(W*.82,980),frontH=Math.min(H*.83,720),left=cx-frontW/2,right=cx+frontW/2,top=cy-frontH*.48,bottom=cy+frontH*.52;
 const insetX=frontW*.17,insetY=frontH*.13;
 return{cx,cy,left,right,top,bottom,il:left+insetX,ir:right-insetX,it:top+insetY,ib:bottom-insetY,frontW,frontH}
}
function drawBackgroundRoom(g){
 const scene=state.sceneMode==="creepy"&&state.creepyScene?state.creepyScene.scene:"normal";
 const x1=g.il,x2=g.ir,y1=g.it,y2=g.ib,cx=g.cx,vy=lerp(y1,y2,.46);
 ctx.save();
 ctx.beginPath();ctx.rect(x1,y1,x2-x1,y2-y1);ctx.clip();
 if(scene==="normal"){
   const grad=ctx.createLinearGradient(0,y1,0,y2);grad.addColorStop(0,"#090909");grad.addColorStop(1,"#030303");ctx.fillStyle=grad;ctx.fillRect(x1,y1,x2-x1,y2-y1)
 } else {
   // Back wall / hallway vanishing point
   let baseColor="#0b0b0b",lightColor="rgba(120,25,20,.12)";
   if(scene==="parking"){baseColor="#0b0e10";lightColor="rgba(165,175,150,.08)"}
   if(scene==="hotel"){baseColor="#120c0a";lightColor="rgba(120,45,25,.12)"}
   if(scene==="basement"){baseColor="#081012";lightColor="rgba(160,30,20,.16)"}
   if(scene==="half"){baseColor="#15100b";lightColor="rgba(185,160,95,.10)"}
   if(scene==="red"){baseColor="#240403";lightColor="rgba(255,0,0,.20)"}
   if(scene==="mirror"){baseColor="#0c0c0c";lightColor="rgba(180,180,180,.09)"}
   if(scene==="endless"){baseColor="#090909";lightColor="rgba(120,120,100,.07)"}
   ctx.fillStyle=baseColor;ctx.fillRect(x1,y1,x2-x1,y2-y1);
   const glow=ctx.createRadialGradient(cx,vy,10,cx,vy,(x2-x1)*.7);glow.addColorStop(0,lightColor);glow.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=glow;ctx.fillRect(x1,y1,x2-x1,y2-y1);

   // floor and ceiling perspective
   poly([[x1,y1],[x2,y1],[cx+(x2-cx)*.35,vy],[cx+(x1-cx)*.35,vy]],"rgba(0,0,0,.35)");
   poly([[x1,y2],[x2,y2],[cx+(x2-cx)*.32,vy],[cx+(x1-cx)*.32,vy]],"rgba(0,0,0,.28)");
   ctx.strokeStyle="rgba(255,255,255,.055)";
   for(let i=0;i<8;i++){
     const t=i/8,x=lerp(x1,x2,t);ctx.beginPath();ctx.moveTo(x,y2);ctx.lineTo(cx+(x-cx)*.30,vy);ctx.stroke()
   }
   for(let i=1;i<7;i++){
     const t=i/7,y=lerp(vy,y2,t*t);ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke()
   }

   if(scene==="parking") drawParking(g,vy);
   else if(scene==="hotel") drawHotel(g,vy);
   else if(scene==="basement") drawBasement(g,vy);
   else if(scene==="half") drawHalfRoom(g,vy);
   else if(scene==="red") drawRedRoom(g,vy);
   else if(scene==="mirror") drawMirrorRoom(g,vy);
   else if(scene==="endless") drawEndless(g,vy);
 }
 ctx.restore()
}
function drawParking(g,vy){
 const floorY=g.ib;
 for(let i=0;i<4;i++){
   const t=(i+1)/5,x=lerp(g.il,g.ir,t),w=(g.ir-g.il)*.13,h=(g.ib-g.it)*.12;
   ctx.fillStyle="#060708";ctx.fillRect(x-w/2,floorY-h,w,h);
   ctx.fillStyle="rgba(245,230,170,.55)";ctx.fillRect(x-w*.35,floorY-h*.68,w*.14,h*.08);ctx.fillRect(x+w*.21,floorY-h*.68,w*.14,h*.08)
 }
 ctx.fillStyle="rgba(220,225,190,.18)";for(let i=0;i<3;i++)ctx.fillRect(lerp(g.il,g.ir,(i+1)/4)-18,g.it+18,36,4)
}
function drawHotel(g,vy){
 for(let side of [-1,1]){
   for(let i=0;i<4;i++){
     const d=(i+1)/5,yy=lerp(g.ib,vy,d),doorH=70*(1-d*.65),doorW=35*(1-d*.65),xx=g.cx+side*lerp((g.ir-g.il)*.42,60,d);
     ctx.fillStyle="#1b0e0b";ctx.fillRect(xx-doorW/2,yy-doorH,doorW,doorH);ctx.fillStyle="#b88c54";ctx.beginPath();ctx.arc(xx+side*doorW*.25,yy-doorH*.45,2,0,Math.PI*2);ctx.fill()
   }
 }
}
function drawBasement(g,vy){
 ctx.strokeStyle="rgba(120,140,135,.38)";ctx.lineWidth=8;
 for(let i=0;i<3;i++){let x=lerp(g.il,g.ir,(i+1)/4);ctx.beginPath();ctx.moveTo(x,g.it);ctx.lineTo(x,g.ib);ctx.stroke()}
 ctx.fillStyle="rgba(150,20,15,.55)";ctx.beginPath();ctx.arc(g.cx,g.it+45,10,0,Math.PI*2);ctx.fill()
}
function drawHalfRoom(g,vy){
 const halfY=lerp(g.it,g.ib,.47);ctx.fillStyle="#292117";ctx.fillRect(g.il,g.it,g.ir-g.il,halfY-g.it);
 ctx.fillStyle="#0a0806";ctx.fillRect(g.il,halfY,g.ir-g.il,g.ib-halfY);
 ctx.fillStyle="#2e271c";ctx.fillRect(g.cx-60,g.ib-55,120,40);ctx.fillRect(g.cx-12,g.ib-105,24,50)
}
function drawRedRoom(g,vy){
 ctx.fillStyle="rgba(165,0,0,.16)";ctx.fillRect(g.il,g.it,g.ir-g.il,g.ib-g.it);
 ctx.fillStyle="#080303";ctx.fillRect(g.cx-38,g.ib-95,76,65);ctx.fillRect(g.cx-24,g.ib-128,48,34)
}
function drawMirrorRoom(g,vy){
 ctx.strokeStyle="rgba(180,185,180,.28)";ctx.lineWidth=3;ctx.strokeRect(g.cx-105,vy-65,210,150);
 ctx.fillStyle="rgba(210,215,210,.045)";ctx.fillRect(g.cx-105,vy-65,210,150);
 const lag=Math.sin(performance.now()/430)*9;ctx.fillStyle="#020202";ctx.beginPath();ctx.arc(g.cx+lag,vy+15,20,0,Math.PI*2);ctx.fill();ctx.fillRect(g.cx-13+lag,vy+32,26,58)
}
function drawEndless(g,vy){
 ctx.strokeStyle="rgba(200,200,185,.10)";ctx.lineWidth=2;
 for(let i=0;i<10;i++){let d=i/10,yy=lerp(g.ib,vy,d),ww=lerp((g.ir-g.il)*.48,28,d);ctx.strokeRect(g.cx-ww,yy-95*(1-d*.7),ww*2,95*(1-d*.7))}
 ctx.fillStyle="rgba(170,30,25,.5)";ctx.fillRect(g.cx-35,vy-34,70,18);ctx.fillStyle="#ddd";ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText("EXIT",g.cx,vy-21)
}
function drawCab(){
 const g=cabGeometry(),metal=ctx.createLinearGradient(g.left,0,g.right,0);metal.addColorStop(0,"#17191a");metal.addColorStop(.22,"#2b2e2f");metal.addColorStop(.5,"#1b1d1e");metal.addColorStop(.78,"#2b2e2f");metal.addColorStop(1,"#141617");
 ctx.fillStyle="#050505";ctx.fillRect(0,0,W,H);
 // outer cab
 ctx.fillStyle=metal;ctx.fillRect(g.left,g.top,g.right-g.left,g.bottom-g.top);

 // realistic perspective walls
 poly([[g.left,g.top],[g.il,g.it],[g.il,g.ib],[g.left,g.bottom]],"#202324","rgba(255,255,255,.05)");
 poly([[g.right,g.top],[g.ir,g.it],[g.ir,g.ib],[g.right,g.bottom]],"#181b1c","rgba(255,255,255,.05)");
 poly([[g.left,g.top],[g.right,g.top],[g.ir,g.it],[g.il,g.it]],"#242728","rgba(255,255,255,.05)");
 poly([[g.left,g.bottom],[g.right,g.bottom],[g.ir,g.ib],[g.il,g.ib]],"#0f1112","rgba(255,255,255,.04)");

 // room behind doors
 drawBackgroundRoom(g);

 // control panel left wall
 const px=lerp(g.left,g.il,.48),py=lerp(g.it,g.ib,.44),pw=Math.max(62,(g.il-g.left)*.46),ph=Math.max(220,(g.ib-g.it)*.43);
 ctx.fillStyle="#101212";ctx.fillRect(px-pw/2,py-ph/2,pw,ph);ctx.strokeStyle="rgba(255,255,255,.13)";ctx.strokeRect(px-pw/2,py-ph/2,pw,ph);
 for(let i=0;i<8;i++){const bx=px+(i%2?15:-15),by=py-ph*.31+Math.floor(i/2)*35;ctx.fillStyle=(i+1)===state.floor%8?"#8f3a34":"#303435";ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();ctx.strokeStyle="rgba(255,255,255,.18)";ctx.stroke()}

 // top floor display
 ctx.fillStyle="#050505";ctx.fillRect(g.cx-72,g.top+28,144,55);ctx.strokeStyle="rgba(255,255,255,.14)";ctx.strokeRect(g.cx-72,g.top+28,144,55);
 ctx.fillStyle="#dd4f43";ctx.font="bold 30px monospace";ctx.textAlign="center";ctx.fillText(String(state.sceneMode==="creepy"&&state.creepyScene?state.creepyScene.n:state.floor),g.cx,g.top+65);

 // fluorescent light and reflection
 let lightAlpha=state.flicker>0&&Math.random()<.38?.05:.18;
 ctx.fillStyle=`rgba(245,242,215,${lightAlpha})`;ctx.fillRect(g.cx-120,g.top+10,240,12);
 const glow=ctx.createRadialGradient(g.cx,g.top+35,10,g.cx,g.top+35,Math.min(W,H)*.55);glow.addColorStop(0,`rgba(230,225,190,${lightAlpha*.5})`);glow.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

 // doors slide horizontally from center
 const opening=(g.ir-g.il)*state.doorOpen;
 const halfDoor=(g.ir-g.il)/2;
 const leftDoorRight=g.cx-opening/2,rightDoorLeft=g.cx+opening/2;
 let doorGrad=ctx.createLinearGradient(g.il,0,g.ir,0);doorGrad.addColorStop(0,"#25292a");doorGrad.addColorStop(.5,"#3a3e3f");doorGrad.addColorStop(1,"#202324");
 ctx.fillStyle=doorGrad;
 ctx.fillRect(g.il,g.it,Math.max(0,leftDoorRight-g.il),g.ib-g.it);
 ctx.fillRect(rightDoorLeft,g.it,Math.max(0,g.ir-rightDoorLeft),g.ib-g.it);

 // door vertical brushed-metal seams
 ctx.strokeStyle="rgba(255,255,255,.045)";
 for(let x=g.il;x<leftDoorRight;x+=22){ctx.beginPath();ctx.moveTo(x,g.it);ctx.lineTo(x,g.ib);ctx.stroke()}
 for(let x=rightDoorLeft;x<g.ir;x+=22){ctx.beginPath();ctx.moveTo(x,g.it);ctx.lineTo(x,g.ib);ctx.stroke()}
 ctx.strokeStyle="rgba(0,0,0,.75)";ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(leftDoorRight,g.it);ctx.lineTo(leftDoorRight,g.ib);ctx.moveTo(rightDoorLeft,g.it);ctx.lineTo(rightDoorLeft,g.ib);ctx.stroke();

 // door frame
 ctx.strokeStyle="rgba(180,190,188,.30)";ctx.lineWidth=8;ctx.strokeRect(g.il-4,g.it-4,g.ir-g.il+8,g.ib-g.it+8);

 // floor reflection
 const rg=ctx.createLinearGradient(0,g.ib,0,g.bottom);rg.addColorStop(0,"rgba(160,170,165,.08)");rg.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=rg;ctx.fillRect(g.left,g.ib,g.right-g.left,g.bottom-g.ib);

 // foreground darkness / vignette
 const v=ctx.createRadialGradient(g.cx,g.cy,Math.min(W,H)*.24,g.cx,g.cy,Math.min(W,H)*.75);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(0,0,0,.58)");ctx.fillStyle=v;ctx.fillRect(0,0,W,H)
}
function render(){
 if(!state){ctx.fillStyle="#030303";ctx.fillRect(0,0,W,H);return}
 ctx.save();
 const sx=state.shake?Math.sin(performance.now()*.09)*state.shake*7:0,sy=state.shake?Math.cos(performance.now()*.07)*state.shake*3:0;
 ctx.translate(sx,sy);drawCab();ctx.restore()
}
ctx.fillStyle="#030303";ctx.fillRect(0,0,W,H);
})();