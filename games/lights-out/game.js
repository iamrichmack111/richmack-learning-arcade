const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const startScreen = document.getElementById('startScreen');
const endScreen = document.getElementById('endScreen');
const gameUI = document.getElementById('gameUI');
const modal = document.getElementById('questionModal');
const questionText = document.getElementById('questionText');
const answers = document.getElementById('answers');
const msg = document.getElementById('message');
const batteryBar = document.getElementById('batteryBar');
const batteryText = document.getElementById('batteryText');
const modeText = document.getElementById('modeText');
const scoreText = document.getElementById('scoreText');
const correctText = document.getElementById('correctText');
const wrongText = document.getElementById('wrongText');
const nameLabel = document.getElementById('nameLabel');

let running=false, muted=false, questionOpen=false, last=0;
let audioCtx=null;
let player, battery, score, correct, wrong, difficulty, playerName;
let currentTerminal=null;
const keys={};

const walls=[
  {x:0,y:0,w:960,h:30},{x:0,y:570,w:960,h:30},{x:0,y:0,w:30,h:600},{x:930,y:0,w:30,h:600},
  {x:180,y:30,w:30,h:240},{x:180,y:360,w:30,h:210},
  {x:360,y:150,w:30,h:300},{x:540,y:30,w:30,h:250},{x:540,y:370,w:30,h:200},
  {x:720,y:150,w:30,h:300},
  {x:30,y:270,w:180,h:30},{x:360,y:270,w:210,h:30},{x:720,y:270,w:210,h:30},
  {x:180,y:450,w:210,h:30},{x:540,y:450,w:210,h:30}
];

const terminals=[
  {x:115,y:110,used:false},{x:285,y:90,used:false},{x:455,y:360,used:false},
  {x:645,y:95,used:false},{x:845,y:125,used:false},{x:290,y:525,used:false},
  {x:655,y:525,used:false},{x:845,y:520,used:false}
];
const exit={x:880,y:345,w:35,h:70};

function resetGame(){
  player={x:75,y:520,r:11,speed:170}; battery=100; score=0; correct=0; wrong=0;
  terminals.forEach(t=>t.used=false); updateHud();
}

function rnd(a,b){return Math.floor(Math.random()*(b-a+1))+a}
function shuffle(a){return a.sort(()=>Math.random()-.5)}
function makeQuestion(){
  let a,b,op,ans,prompt;
  if(difficulty==='easy'){
    a=rnd(1,12); b=rnd(1,12); op=Math.random()<.5?'+':'-'; if(op==='-'&&b>a)[a,b]=[b,a];
    ans=op==='+'?a+b:a-b; prompt=`What is ${a} ${op} ${b}?`;
  } else if(difficulty==='medium'){
    a=rnd(2,15); b=rnd(2,12); op=Math.random()<.5?'×':'+'; ans=op==='×'?a*b:a+b; prompt=`What is ${a} ${op} ${b}?`;
  } else {
    const type=rnd(0,2);
    if(type===0){a=rnd(6,18);b=rnd(3,12);ans=a*b;prompt=`What is ${a} × ${b}?`}
    else if(type===1){b=rnd(3,12);ans=rnd(4,15);a=b*ans;prompt=`What is ${a} ÷ ${b}?`}
    else {a=rnd(20,70);b=rnd(10,40);ans=a+b;prompt=`What is ${a} + ${b}?`}
  }
  const opts=new Set([ans]);
  while(opts.size<4){let d=rnd(-12,12); if(d===0)d=3; opts.add(Math.max(0,ans+d));}
  return {prompt,ans,opts:shuffle([...opts])};
}

function updateHud(){
  battery=Math.max(0,Math.min(100,battery));
  batteryBar.style.width=battery+'%';
  batteryText.textContent=Math.round(battery)+'%';
  batteryBar.parentElement.classList.toggle('low',battery<=25);
  modeText.textContent=battery>0?'FLASHLIGHT ONLINE':'DARK MODE — FOLLOW THE SOUND';
  scoreText.textContent=score; correctText.textContent=correct; wrongText.textContent=wrong;
}

function showMessage(text,ms=1600){msg.textContent=text;msg.style.opacity=1;clearTimeout(showMessage.t);showMessage.t=setTimeout(()=>msg.style.opacity=0,ms)}
function tone(freq=440,dur=.12,vol=.04){
  if(muted)return; if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;g.gain.value=vol;o.connect(g).connect(audioCtx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.stop(audioCtx.currentTime+dur);
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function nearestTarget(){
  const unused=terminals.filter(t=>!t.used); if(!unused.length)return exit;
  return unused.reduce((p,c)=>distance(player,c)<distance(player,p)?c:p);
}
function soundGuide(now){
  if(battery>0||muted)return;
  if(!soundGuide.last||now-soundGuide.last>550){
    const t=nearestTarget(); const d=Math.max(1,distance(player,t)); const f=240+Math.max(0,500-d*.45); const v=Math.min(.12,.025+1/d*8); tone(f,.16,v); soundGuide.last=now;
  }
}

function circleRectCollision(nx,ny,r,rect){const cx=Math.max(rect.x,Math.min(nx,rect.x+rect.w));const cy=Math.max(rect.y,Math.min(ny,rect.y+rect.h));return Math.hypot(nx-cx,ny-cy)<r}
function move(dx,dy,dt){
  const len=Math.hypot(dx,dy)||1; dx/=len;dy/=len;
  let nx=player.x+dx*player.speed*dt, ny=player.y;
  if(!walls.some(w=>circleRectCollision(nx,ny,player.r,w)))player.x=nx;
  nx=player.x; ny=player.y+dy*player.speed*dt;
  if(!walls.some(w=>circleRectCollision(nx,ny,player.r,w)))player.y=ny;
}

function openQuestion(t){
  if(t.used)return; currentTerminal=t; questionOpen=true; modal.classList.remove('hidden');
  const q=makeQuestion(); questionText.textContent=q.prompt; answers.innerHTML='';
  q.opts.forEach(opt=>{const b=document.createElement('button');b.textContent=opt;b.onclick=()=>answerQuestion(opt===q.ans);answers.appendChild(b)})
}
function answerQuestion(ok){
  if(ok){battery+=difficulty==='hard'?28:35;score+=100;correct++;tone(760,.18,.06);showMessage('Correct! Battery recharged.'); if(currentTerminal)currentTerminal.used=true;}
  else{battery-=difficulty==='hard'?28:22;score=Math.max(0,score-25);wrong++;tone(120,.35,.06);showMessage('Wrong answer. The dark gets closer.');}
  updateHud(); closeQuestion();
}
function closeQuestion(){questionOpen=false;modal.classList.add('hidden');currentTerminal=null}

function interact(){
  if(questionOpen)return;
  const near=terminals.find(t=>!t.used&&distance(player,t)<42);
  if(near)openQuestion(near); else showMessage('No active power terminal nearby.');
}

function drawScene(){
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0a0d10';ctx.fillRect(0,0,W,H);
  // floor grid
  ctx.strokeStyle='rgba(80,95,110,.12)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
  for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  walls.forEach(w=>{ctx.fillStyle='#232a31';ctx.fillRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#11161b';ctx.fillRect(w.x+4,w.y+4,w.w-8,w.h-8)});
  terminals.forEach(t=>{
    ctx.beginPath();ctx.arc(t.x,t.y,10,0,Math.PI*2);ctx.fillStyle=t.used?'#26303a':'#9dd9ff';ctx.fill();
    if(!t.used){ctx.strokeStyle='rgba(157,217,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(t.x,t.y,16,0,Math.PI*2);ctx.stroke();}
  });
  ctx.fillStyle='#7cffae';ctx.fillRect(exit.x,exit.y,exit.w,exit.h);
  ctx.fillStyle='#05120a';ctx.font='bold 11px sans-serif';ctx.fillText('EXIT',exit.x+3,exit.y+40);
  ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);ctx.fillStyle='#f0f5f8';ctx.fill();

  // darkness + flashlight cone
  ctx.save();ctx.fillStyle='rgba(0,0,0,.92)';ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='destination-out';
  if(battery>0){
    const grad=ctx.createRadialGradient(player.x,player.y,12,player.x,player.y,170+80*(battery/100));
    grad.addColorStop(0,'rgba(0,0,0,1)');grad.addColorStop(.5,'rgba(0,0,0,.8)');grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.beginPath();ctx.arc(player.x,player.y,250,0,Math.PI*2);ctx.fill();
  } else {
    // tiny body awareness only
    const grad=ctx.createRadialGradient(player.x,player.y,0,player.x,player.y,28);grad.addColorStop(0,'rgba(0,0,0,.85)');grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(player.x,player.y,30,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
}

function update(dt,now){
  if(questionOpen)return;
  let dx=0,dy=0;if(keys['w']||keys['arrowup'])dy--;if(keys['s']||keys['arrowdown'])dy++;if(keys['a']||keys['arrowleft'])dx--;if(keys['d']||keys['arrowright'])dx++;
  if(dx||dy){move(dx,dy,dt);if(battery>0){battery-=dt*(difficulty==='hard'?3.5:2.4);updateHud();}}
  soundGuide(now);
  const near=terminals.find(t=>!t.used&&distance(player,t)<42); if(near)showMessage('Press E to answer the terminal.',500);
  if(circleRectCollision(player.x,player.y,player.r,exit))finish();
}
function loop(ts){if(!running)return;const dt=Math.min(.033,(ts-last)/1000||0);last=ts;update(dt,ts);drawScene();requestAnimationFrame(loop)}
function finish(){running=false;gameUI.classList.add('hidden');endScreen.classList.remove('hidden');const grade=correct+wrong?Math.round(correct/(correct+wrong)*100):100;document.getElementById('finalStats').textContent=`${playerName}: Score ${score} · ${correct} correct · ${wrong} wrong · Grade ${grade}%`;}

window.addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key.toLowerCase()==='e')interact();if(e.key.toLowerCase()==='m'){muted=!muted;showMessage(muted?'Sound muted':'Sound on')}});
window.addEventListener('keyup',e=>keys[e.key.toLowerCase()]=false);
document.getElementById('startBtn').onclick=()=>{playerName=document.getElementById('playerName').value.trim()||'Player';difficulty=document.getElementById('difficulty').value;nameLabel.textContent=playerName;startScreen.classList.add('hidden');gameUI.classList.remove('hidden');resetGame();running=true;last=performance.now();requestAnimationFrame(loop);showMessage('Find the glowing terminals. Press E nearby.');};
document.getElementById('restartBtn').onclick=()=>{endScreen.classList.add('hidden');startScreen.classList.remove('hidden')};
document.getElementById('closeQuestion').onclick=closeQuestion;
