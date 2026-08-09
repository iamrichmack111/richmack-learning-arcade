(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", { alpha: false });
const miniMap = document.getElementById("miniMap");
const mctx = miniMap.getContext("2d");

const startScreen = document.getElementById("startScreen");
const quizModal = document.getElementById("quizModal");
const gradesScreen = document.getElementById("gradesScreen");
const resultScreen = document.getElementById("resultScreen");
const hud = document.getElementById("hud");
const playerNameInput = document.getElementById("playerName");
const startBtn = document.getElementById("startBtn");
const gradesBtn = document.getElementById("gradesBtn");
const closeGrades = document.getElementById("closeGrades");
const exportGrades = document.getElementById("exportGrades");
const clearGrades = document.getElementById("clearGrades");
const gradesBody = document.getElementById("gradesBody");
const hudName = document.getElementById("hudName");
const hudDoors = document.getElementById("hudDoors");
const hudAccuracy = document.getElementById("hudAccuracy");
const hudThreat = document.getElementById("hudThreat");
const interactionPrompt = document.getElementById("interactionPrompt");
const objective = document.getElementById("objective");
const miniMapWrap = document.getElementById("miniMapWrap");
const toast = document.getElementById("toast");

const quizSubject = document.getElementById("quizSubject");
const quizTitle = document.getElementById("quizTitle");
const quizProgress = document.getElementById("quizProgress");
const quizQuestion = document.getElementById("quizQuestion");
const quizAnswers = document.getElementById("quizAnswers");
const quizFeedback = document.getElementById("quizFeedback");

const resultTitle = document.getElementById("resultTitle");
const bigGrade = document.getElementById("bigGrade");
const resultStats = document.getElementById("resultStats");
const playAgain = document.getElementById("playAgain");
const resultGrades = document.getElementById("resultGrades");

const W = 17, H = 17;
let map = [];
let doors = [];
let running = false;
let quizOpen = false;
let lastTime = performance.now();
let monsterPathTimer = 0;
let monsterPath = [];
let toastTimer = 0;
let mapVisible = true;
let flicker = 1;

let player = { x: 8.5, y: 8.5, a: -Math.PI/2, speed: 2.7, sprint: 4.0 };
let monster = { x: 2.5, y: 8.5, speed: 0.72, targetIndex: 0, activeDelay: 5 };
let state = {
  name: "", correct: 0, wrong: 0, doorsUnlocked: 0, startedAt: 0, finished: false, resultSaved: false
};

const subjectData = {
  Math: {
    color: "#cdbf52",
    questions: [
      { q:"What is 3/4 + 1/8?", a:["7/8","4/12","5/8","1"], c:0 },
      { q:"Solve: 5x + 7 = 32", a:["x = 3","x = 5","x = 7","x = 8"], c:1 },
      { q:"A $60 item is 25% off. What is the sale price?", a:["$15","$35","$45","$50"], c:2 },
      { q:"What is 2.5 × 1.2?", a:["2.7","3","3.2","30"], c:1 },
      { q:"Which ratio is equivalent to 3:5?", a:["6:10","6:8","9:10","12:15"], c:0 },
      { q:"What is the area of a rectangle 7 units by 4 units?", a:["11","22","28","32"], c:2 },
      { q:"Evaluate: 18 ÷ 3 + 4 × 2", a:["20","14","16","10"], c:1 },
      { q:"A number increased by 9 equals 23. What is the number?", a:["12","13","14","15"], c:2 }
    ]
  },
  Reading: {
    color: "#5b9bd5",
    questions: [
      { q:"Passage: “The hallway was silent, but Maya noticed a warm light under the library door.”\nWhat detail builds suspense?", a:["Maya is in a hallway","The light under a closed door","The library has books","The floor is clean"], c:1 },
      { q:"Which sentence contains a metaphor?", a:["The moon was a silver coin.","The moon looked bright.","The moon rose slowly.","I saw the moon."], c:0 },
      { q:"What is the main idea of a paragraph?", a:["Its most important point","Its longest sentence","The first word","Every small detail"], c:0 },
      { q:"Which word best means “reluctant”?", a:["eager","unwilling","noisy","careless"], c:1 },
      { q:"If a narrator uses “I” and “my,” what point of view is most likely?", a:["First person","Second person","Third-person limited","Third-person omniscient"], c:0 },
      { q:"What is an inference?", a:["A random guess","A conclusion based on evidence","A direct quotation","A chapter title"], c:1 },
      { q:"Which is the strongest evidence for a claim?", a:["A relevant fact from the text","A personal feeling","An unrelated example","A repeated opinion"], c:0 },
      { q:"What does context help you determine?", a:["The page number","The meaning of an unfamiliar word","The author's age","The font size"], c:1 }
    ]
  },
  Science: {
    color: "#58b878",
    questions: [
      { q:"What organelle is often called the powerhouse of the cell?", a:["Nucleus","Mitochondrion","Ribosome","Cell wall"], c:1 },
      { q:"Which change is chemical?", a:["Ice melting","Paper tearing","Iron rusting","Water boiling"], c:2 },
      { q:"What force pulls objects toward Earth?", a:["Magnetism","Friction","Gravity","Electricity"], c:2 },
      { q:"Which gas do plants take in during photosynthesis?", a:["Oxygen","Carbon dioxide","Nitrogen","Hydrogen"], c:1 },
      { q:"What is the smallest unit of an element?", a:["Cell","Molecule","Atom","Tissue"], c:2 },
      { q:"Which body system carries oxygen and nutrients through the body?", a:["Circulatory","Digestive","Skeletal","Endocrine"], c:0 },
      { q:"In a food chain, plants are usually what?", a:["Consumers","Producers","Decomposers","Predators"], c:1 },
      { q:"What happens to particles when matter is heated?", a:["They usually move faster","They stop moving","They disappear","They become heavier"], c:0 }
    ]
  },
  History: {
    color: "#b47b55",
    questions: [
      { q:"What is a primary source?", a:["A source created during the time being studied","A modern textbook summary","Any website","A fictional story"], c:0 },
      { q:"Which branch of the U.S. government interprets laws?", a:["Legislative","Executive","Judicial","Local"], c:2 },
      { q:"What document begins with “We the People”?", a:["Declaration of Independence","U.S. Constitution","Bill of Rights only","Articles of Confederation"], c:1 },
      { q:"Why do historians compare multiple sources?", a:["To check perspective and evidence","To make stories longer","To avoid dates","To remove facts"], c:0 },
      { q:"What was one major purpose of the Silk Road?", a:["Trade across regions","Building pyramids","Electing presidents","Creating railroads"], c:0 },
      { q:"What is chronology?", a:["The study of maps","Events arranged by time","A type of government","A trade route"], c:1 },
      { q:"Which is a civic responsibility in the United States?", a:["Obeying laws","Choosing a king","Ignoring jury summons","Writing every law"], c:0 },
      { q:"What does “cause and effect” help explain in history?", a:["How one event can lead to another","Only where events happened","How to spell names","The color of artifacts"], c:0 }
    ]
  }
};

function buildMap() {
  map = Array.from({length:H}, (_, y) =>
    Array.from({length:W}, (_, x) => (x===0 || y===0 || x===W-1 || y===H-1) ? 1 : 0)
  );

  // Central school layout: four classroom blocks around a cross-shaped hallway.
  for (let y=1;y<H-1;y++) {
    if (y !== 8) { map[y][7] = 1; map[y][9] = 1; }
  }
  for (let x=1;x<W-1;x++) {
    if (x !== 8) { map[7][x] = 1; map[9][x] = 1; }
  }
  map[8][7] = 0; map[8][9] = 0;
  map[7][8] = 0; map[9][8] = 0;

  doors = [
    { x:7, y:4, subject:"Math", unlocked:false, correct:0, asked:[], current:null },
    { x:9, y:4, subject:"Reading", unlocked:false, correct:0, asked:[], current:null },
    { x:7, y:12, subject:"Science", unlocked:false, correct:0, asked:[], current:null },
    { x:9, y:12, subject:"History", unlocked:false, correct:0, asked:[], current:null }
  ];
  for (const d of doors) map[d.y][d.x] = 2;

  // Some harmless furniture columns for depth inside classrooms.
  const props = [[3,3],[5,5],[12,3],[14,5],[3,12],[5,14],[12,12],[14,14]];
  for (const [x,y] of props) map[y][x] = 3;
}

function resetGame(name) {
  buildMap();
  state = { name, correct:0, wrong:0, doorsUnlocked:0, startedAt:Date.now(), finished:false, resultSaved:false };
  player = { x:8.5, y:8.5, a:-Math.PI/2, speed:2.7, sprint:4.0 };
  monster = { x:2.5, y:8.5, speed:0.72, activeDelay:5 };
  monsterPath = [];
  monsterPathTimer = 0;
  running = true;
  quizOpen = false;
  hudName.textContent = name;
  updateHUD();
  objective.textContent = "Unlock all four classrooms, then reach the north exit.";
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  gradesScreen.classList.add("hidden");
  quizModal.classList.add("hidden");
  hud.classList.remove("hidden");
  canvas.requestPointerLock?.();
  showToast("The school is awake. Find the classrooms.");
}

function tileAt(x,y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  if (ix<0 || iy<0 || ix>=W || iy>=H) return 1;
  return map[iy][ix];
}
function solidAt(x,y) {
  return tileAt(x,y) !== 0;
}
function tryMove(obj, nx, ny, radius=.22) {
  if (!solidAt(nx-radius, obj.y) && !solidAt(nx+radius, obj.y)) obj.x = nx;
  if (!solidAt(obj.x, ny-radius) && !solidAt(obj.x, ny+radius)) obj.y = ny;
}

const keys = {};
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.toLowerCase()==="e" && running && !quizOpen) interact();
  if (e.key.toLowerCase()==="m" && running) {
    mapVisible = !mapVisible;
    miniMapWrap.classList.toggle("hidden", !mapVisible);
  }
});
addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener("click", () => {
  if (running && !quizOpen) canvas.requestPointerLock?.();
});
document.addEventListener("mousemove", e => {
  if (document.pointerLockElement===canvas && running && !quizOpen) {
    player.a += e.movementX * 0.0025;
  }
});

function nearestDoor() {
  let best = null, bestDist = 999;
  for (const d of doors) {
    if (d.unlocked) continue;
    const dx = (d.x+.5)-player.x, dy=(d.y+.5)-player.y;
    const dist = Math.hypot(dx,dy);
    const ang = Math.atan2(dy,dx);
    const diff = Math.abs(angleDiff(player.a,ang));
    if (dist < 1.55 && diff < 0.85 && dist < bestDist) { best=d; bestDist=dist; }
  }
  return best;
}
function angleDiff(a,b) {
  let d = b-a;
  while (d > Math.PI) d -= Math.PI*2;
  while (d < -Math.PI) d += Math.PI*2;
  return d;
}
function interact() {
  const d = nearestDoor();
  if (d) openQuiz(d);
}

function questionFor(door) {
  const bank = subjectData[door.subject].questions;
  if (door.current != null) return bank[door.current];
  let choices = bank.map((_,i)=>i).filter(i => !door.asked.includes(i));
  if (!choices.length) { door.asked=[]; choices=bank.map((_,i)=>i); }
  door.current = choices[Math.floor(Math.random()*choices.length)];
  return bank[door.current];
}

function openQuiz(door) {
  quizOpen = true;
  document.exitPointerLock?.();
  quizModal.classList.remove("hidden");
  quizSubject.textContent = door.subject.toUpperCase();
  quizSubject.style.color = subjectData[door.subject].color;
  quizFeedback.textContent = "";
  quizFeedback.className = "feedback";
  renderQuestion(door);
}
function renderQuestion(door) {
  const q = questionFor(door);
  quizTitle.textContent = `${door.subject} Classroom Lock`;
  quizProgress.textContent = `Correct in this classroom: ${door.correct} / 3`;
  quizQuestion.textContent = q.q;
  quizAnswers.innerHTML = "";
  q.a.forEach((ans, i) => {
    const b = document.createElement("button");
    b.textContent = `${String.fromCharCode(65+i)}. ${ans}`;
    b.onclick = () => answerQuestion(door, i);
    quizAnswers.appendChild(b);
  });
}
function answerQuestion(door, chosen) {
  const q = questionFor(door);
  if (chosen === q.c) {
    state.correct++;
    door.correct++;
    door.asked.push(door.current);
    door.current = null;
    quizFeedback.textContent = "Correct.";
    quizFeedback.className = "feedback good";
    updateHUD();

    if (door.correct >= 3) {
      door.unlocked = true;
      map[door.y][door.x] = 0;
      state.doorsUnlocked++;
      updateHUD();
      setTimeout(() => {
        quizModal.classList.add("hidden");
        quizOpen = false;
        if (state.doorsUnlocked===4) {
          objective.textContent = "All classrooms unlocked. Reach the NORTH EXIT at the top of the main hallway.";
          showToast("All classroom locks released. The north exit is open.");
        } else {
          showToast(`${door.subject} classroom unlocked.`);
        }
        if (running) canvas.requestPointerLock?.();
      }, 430);
    } else {
      setTimeout(() => renderQuestion(door), 360);
    }
  } else {
    state.wrong++;
    monster.speed = Math.min(2.2, monster.speed + 0.16);
    quizFeedback.textContent = "Wrong — you hear faster footsteps in the hall.";
    quizFeedback.className = "feedback bad";
    updateHUD();
    flashDanger();
  }
}

function updateHUD() {
  hudDoors.textContent = `${state.doorsUnlocked} / 4`;
  const total = state.correct + state.wrong;
  const acc = total ? Math.round(state.correct/total*100) : 100;
  hudAccuracy.textContent = `${acc}%`;

  let label="CALM", color="#9cf9a6";
  if (monster.speed>0.9) {label="ALERT";color="#e8e16e";}
  if (monster.speed>1.25){label="FAST";color="#ffad62";}
  if (monster.speed>1.7){label="DANGER";color="#ff6262";}
  hudThreat.textContent=label;
  hudThreat.style.color=color;
}

function flashDanger() {
  document.body.animate(
    [{filter:"none"},{filter:"sepia(.5) saturate(2.3) hue-rotate(315deg)"},{filter:"none"}],
    {duration:380}
  );
}

function showToast(text, danger=false) {
  toast.textContent = text;
  toast.className = "toast" + (danger ? " danger" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>toast.classList.add("hidden"), 2300);
}

function resize() {
  const scale = Math.min(devicePixelRatio || 1, 1.35);
  canvas.width = Math.floor(innerWidth*scale);
  canvas.height = Math.floor(innerHeight*scale);
}
addEventListener("resize", resize);
resize();

function render3D() {
  const cw=canvas.width, ch=canvas.height;
  ctx.fillStyle="#090c10"; ctx.fillRect(0,0,cw,ch/2);
  ctx.fillStyle="#111315"; ctx.fillRect(0,ch/2,cw,ch/2);

  // floor perspective strips
  for (let y=ch/2; y<ch; y+=Math.max(4,Math.floor(ch/80))) {
    const t=(y-ch/2)/(ch/2);
    const v=Math.floor(16 + 18*t);
    ctx.fillStyle=`rgb(${v},${v},${v+1})`;
    ctx.fillRect(0,y,cw,2);
  }

  const fov=Math.PI/3;
  const maxDepth=18;
  const rayStep = canvas.width > 1500 ? 2 : 1;
  const zBuffer = new Float32Array(Math.ceil(cw/rayStep));

  for (let sx=0, zi=0; sx<cw; sx+=rayStep, zi++) {
    const rayA = player.a - fov/2 + (sx/cw)*fov;
    const dirX=Math.cos(rayA), dirY=Math.sin(rayA);
    let dist=0, hit=0, side=0, hx=0, hy=0;
    const step=.025;
    while (dist<maxDepth) {
      dist += step;
      hx = player.x + dirX*dist;
      hy = player.y + dirY*dist;
      hit = tileAt(hx,hy);
      if (hit!==0) {
        const fx=hx-Math.floor(hx), fy=hy-Math.floor(hy);
        side = (fx<.035 || fx>.965) ? 1 : 0;
        break;
      }
    }
    const corrected = Math.max(.001, dist*Math.cos(rayA-player.a));
    zBuffer[zi]=corrected;
    const wallH = Math.min(ch*1.35, ch/corrected);
    const top = ch/2 - wallH/2;
    let base;
    if (hit===2) base=[88,69,49];
    else if (hit===3) base=[58,64,66];
    else base=[64,72,76];

    let shade = Math.max(.12, 1-corrected/maxDepth);
    shade *= (side ? .76 : 1);
    shade *= flicker;
    const r=Math.floor(base[0]*shade), g=Math.floor(base[1]*shade), b=Math.floor(base[2]*shade);
    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(sx,top,rayStep+1,wallH);

    // subtle horizontal aging / tile lines
    if (wallH>80 && (sx % 8===0)) {
      ctx.fillStyle=`rgba(0,0,0,${Math.min(.32,corrected/45)})`;
      ctx.fillRect(sx,top+wallH*.66,rayStep+1,1);
    }
  }

  renderMonster(fov, zBuffer, rayStep);
  renderExit(fov, zBuffer, rayStep);

  // flashlight beam impression
  const grad=ctx.createRadialGradient(cw*.5,ch*.53,10,cw*.5,ch*.53,Math.min(cw,ch)*.5);
  grad.addColorStop(0,"rgba(255,250,220,.06)");
  grad.addColorStop(.45,"rgba(255,250,220,.015)");
  grad.addColorStop(1,"rgba(0,0,0,.36)");
  ctx.fillStyle=grad; ctx.fillRect(0,0,cw,ch);
}

function renderMonster(fov,zBuffer,rayStep) {
  const dx=monster.x-player.x, dy=monster.y-player.y;
  const dist=Math.hypot(dx,dy);
  let ang=angleDiff(player.a, Math.atan2(dy,dx));
  if (Math.abs(ang)>fov*.7 || dist<.1) return;
  const screenX=(.5 + ang/fov)*canvas.width;
  const size=Math.min(canvas.height*1.1, canvas.height/(dist*.82));
  const zIndex=Math.max(0,Math.min(zBuffer.length-1,Math.floor(screenX/rayStep)));
  if (dist>zBuffer[zIndex]+.15) return;

  const x=screenX-size/2, y=canvas.height/2-size*.54;
  ctx.save();
  const alpha=Math.max(.2,1-dist/18);
  ctx.globalAlpha=alpha;
  // shadow body
  ctx.fillStyle="#07090a";
  ctx.beginPath();
  ctx.ellipse(screenX,y+size*.63,size*.20,size*.46,0,0,Math.PI*2);
  ctx.fill();
  // head
  ctx.fillStyle="#0b0d0e";
  ctx.beginPath(); ctx.ellipse(screenX,y+size*.20,size*.16,size*.18,0,0,Math.PI*2); ctx.fill();
  // arms
  ctx.strokeStyle="#090b0c"; ctx.lineWidth=Math.max(3,size*.055);
  ctx.beginPath(); ctx.moveTo(screenX-size*.10,y+size*.42); ctx.lineTo(screenX-size*.28,y+size*.67); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(screenX+size*.10,y+size*.42); ctx.lineTo(screenX+size*.28,y+size*.67); ctx.stroke();
  // eyes
  const glow=ctx.createRadialGradient(screenX-size*.055,y+size*.18,1,screenX-size*.055,y+size*.18,size*.045);
  glow.addColorStop(0,"rgba(255,80,80,1)"); glow.addColorStop(1,"rgba(255,30,30,0)");
  ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(screenX-size*.055,y+size*.18,size*.05,0,Math.PI*2); ctx.fill();
  const glow2=ctx.createRadialGradient(screenX+size*.055,y+size*.18,1,screenX+size*.055,y+size*.18,size*.045);
  glow2.addColorStop(0,"rgba(255,80,80,1)"); glow2.addColorStop(1,"rgba(255,30,30,0)");
  ctx.fillStyle=glow2; ctx.beginPath(); ctx.arc(screenX+size*.055,y+size*.18,size*.05,0,Math.PI*2); ctx.fill();
  ctx.restore();
}

function renderExit(fov,zBuffer,rayStep) {
  if (state.doorsUnlocked<4) return;
  const ex=8.5, ey=1.15;
  const dx=ex-player.x, dy=ey-player.y, dist=Math.hypot(dx,dy);
  const ang=angleDiff(player.a,Math.atan2(dy,dx));
  if (Math.abs(ang)>fov*.65) return;
  const sx=(.5+ang/fov)*canvas.width;
  const zi=Math.max(0,Math.min(zBuffer.length-1,Math.floor(sx/rayStep)));
  if (dist>zBuffer[zi]+.4) return;
  const h=Math.min(canvas.height,canvas.height/(dist*.8));
  const g=ctx.createRadialGradient(sx,canvas.height/2,0,sx,canvas.height/2,h*.55);
  g.addColorStop(0,"rgba(210,235,170,.35)"); g.addColorStop(1,"rgba(210,235,170,0)");
  ctx.fillStyle=g; ctx.fillRect(sx-h*.5,canvas.height/2-h*.55,h,h*1.1);
}

function drawMap() {
  const s = miniMap.width/W;
  mctx.fillStyle="#090c0e"; mctx.fillRect(0,0,miniMap.width,miniMap.height);
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const t=map[y][x];
    if (t===1) mctx.fillStyle="#4f5960";
    else if (t===2) mctx.fillStyle="#8e6744";
    else if (t===3) mctx.fillStyle="#30373b";
    else mctx.fillStyle="#12171a";
    mctx.fillRect(x*s,y*s,s+1,s+1);
  }
  // North exit
  mctx.fillStyle = state.doorsUnlocked===4 ? "#b8e884" : "#552b2b";
  mctx.fillRect(8*s,0,s,s*.5+2);

  mctx.fillStyle="#fff";
  mctx.beginPath(); mctx.arc(player.x*s,player.y*s,3.5,0,Math.PI*2); mctx.fill();
  mctx.strokeStyle="#fff"; mctx.beginPath(); mctx.moveTo(player.x*s,player.y*s);
  mctx.lineTo((player.x+Math.cos(player.a)*.8)*s,(player.y+Math.sin(player.a)*.8)*s); mctx.stroke();

  mctx.fillStyle="#e34f4f"; mctx.beginPath(); mctx.arc(monster.x*s,monster.y*s,3.2,0,Math.PI*2); mctx.fill();

  for (const d of doors) {
    if (d.unlocked) continue;
    mctx.fillStyle=subjectData[d.subject].color;
    mctx.fillRect((d.x+.25)*s,(d.y+.25)*s,s*.5,s*.5);
  }
}

function bfsPath(sx,sy,tx,ty) {
  sx=Math.floor(sx); sy=Math.floor(sy); tx=Math.floor(tx); ty=Math.floor(ty);
  const q=[[sx,sy]], seen=new Set([`${sx},${sy}`]), prev=new Map();
  const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  let found=false;
  while(q.length) {
    const [x,y]=q.shift();
    if (x===tx && y===ty){found=true;break;}
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k)||map[ny][nx]!==0) continue;
      seen.add(k); prev.set(k,[x,y]); q.push([nx,ny]);
    }
  }
  if(!found) return [];
  const path=[]; let cur=[tx,ty];
  while(!(cur[0]===sx&&cur[1]===sy)){
    path.push(cur); cur=prev.get(`${cur[0]},${cur[1]}`); if(!cur) return [];
  }
  path.reverse(); return path;
}

function updateMonster(dt) {
  if (monster.activeDelay>0) { monster.activeDelay-=dt; return; }
  monsterPathTimer -= dt;
  if(monsterPathTimer<=0){
    monsterPath=bfsPath(monster.x,monster.y,player.x,player.y);
    monsterPathTimer=.30;
  }
  if(monsterPath.length){
    const [tx,ty]=monsterPath[0];
    const cx=tx+.5, cy=ty+.5;
    const dx=cx-monster.x,dy=cy-monster.y,d=Math.hypot(dx,dy);
    if(d<.08) monsterPath.shift();
    else {
      const step=Math.min(d,monster.speed*dt);
      monster.x += dx/d*step; monster.y += dy/d*step;
    }
  }
  const dToPlayer=Math.hypot(monster.x-player.x,monster.y-player.y);
  if(dToPlayer<.52) finishGame(false);
}

function update(dt) {
  if(!running || quizOpen) return;

  let forward=0, strafe=0, turn=0;
  if(keys["w"]||keys["arrowup"]) forward+=1;
  if(keys["s"]||keys["arrowdown"]) forward-=1;
  if(keys["a"]) strafe-=1;
  if(keys["d"]) strafe+=1;
  if(keys["arrowleft"]) turn-=1;
  if(keys["arrowright"]) turn+=1;
  player.a += turn*dt*1.9;

  let mag=Math.hypot(forward,strafe);
  if(mag>0){
    forward/=mag; strafe/=mag;
    const speed=keys["shift"] ? player.sprint : player.speed;
    const dx=(Math.cos(player.a)*forward + Math.cos(player.a+Math.PI/2)*strafe)*speed*dt;
    const dy=(Math.sin(player.a)*forward + Math.sin(player.a+Math.PI/2)*strafe)*speed*dt;
    tryMove(player,player.x+dx,player.y+dy,.20);
  }

  updateMonster(dt);

  const d=nearestDoor();
  if(d){
    interactionPrompt.textContent=`Press E — ${d.subject} classroom (${d.correct}/3 correct)`;
    interactionPrompt.classList.remove("hidden");
  } else interactionPrompt.classList.add("hidden");

  if(state.doorsUnlocked===4 && player.y<1.45 && player.x>7.7 && player.x<9.3){
    finishGame(true);
  }
}

function finishGame(escaped) {
  if(state.finished) return;
  state.finished=true; running=false;
  document.exitPointerLock?.();
  hud.classList.add("hidden");
  quizModal.classList.add("hidden");
  quizOpen=false;

  const total=state.correct+state.wrong;
  const score=total ? Math.round(state.correct/total*100) : 0;
  const grade=letterGrade(score);
  const elapsed=Math.max(1,Math.round((Date.now()-state.startedAt)/1000));
  saveGrade({
    name:state.name, grade, score, wrong:state.wrong,
    correct:state.correct, result:escaped?"Escaped":"Caught",
    seconds:elapsed, date:new Date().toLocaleString()
  });
  state.resultSaved=true;

  resultTitle.textContent=escaped ? "You Escaped the School" : "The Creature Caught You";
  bigGrade.textContent=grade;
  resultStats.innerHTML =
    `<b>${state.name}</b><br>`+
    `Score: <b>${score}%</b> &nbsp; • &nbsp; Correct: <b>${state.correct}</b> &nbsp; • &nbsp; Wrong: <b>${state.wrong}</b><br>`+
    `Classrooms unlocked: <b>${state.doorsUnlocked}/4</b> &nbsp; • &nbsp; Time: <b>${formatTime(elapsed)}</b><br>`+
    `${escaped ? "All four subjects completed and the north exit reached." : "Your current academic score was still saved."}`;
  resultScreen.classList.remove("hidden");
}
function letterGrade(score){
  if(score>=90) return "A";
  if(score>=80) return "B";
  if(score>=70) return "C";
  if(score>=60) return "D";
  return "F";
}
function formatTime(sec){
  const m=Math.floor(sec/60), s=sec%60;
  return `${m}:${String(s).padStart(2,"0")}`;
}

const GRADE_KEY="abandonedSchoolGrades_v1";
function getGrades(){
  try{return JSON.parse(localStorage.getItem(GRADE_KEY)||"[]");}catch{return []}
}
function saveGrade(row){
  const rows=getGrades(); rows.unshift(row);
  localStorage.setItem(GRADE_KEY,JSON.stringify(rows.slice(0,100)));
}
function renderGrades(){
  const rows=getGrades();
  gradesBody.innerHTML="";
  if(!rows.length){
    gradesBody.innerHTML=`<tr><td colspan="6" style="color:#89969f">No grades saved yet.</td></tr>`;
    return;
  }
  for(const r of rows){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${esc(r.name)}</td><td><strong>${esc(r.grade)}</strong></td><td>${r.score}%</td><td>${r.wrong}</td><td>${esc(r.result)}</td><td>${esc(r.date)}</td>`;
    gradesBody.appendChild(tr);
  }
}
function esc(v){
  return String(v).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function showGrades(){
  renderGrades();
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  gradesScreen.classList.remove("hidden");
}
function downloadGrades(){
  const rows=getGrades();
  const headers=["Name","Grade","Score","Correct","Wrong","Result","TimeSeconds","Date"];
  const csv=[headers.join(",")].concat(rows.map(r=>[
    r.name,r.grade,r.score,r.correct,r.wrong,r.result,r.seconds,r.date
  ].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download="abandoned-school-grades.csv"; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

startBtn.onclick=()=>{
  const name=playerNameInput.value.trim();
  if(!name){ playerNameInput.focus(); showToast("Enter a student name first.",true); return; }
  resetGame(name);
};
gradesBtn.onclick=showGrades;
closeGrades.onclick=()=>{gradesScreen.classList.add("hidden");startScreen.classList.remove("hidden");};
exportGrades.onclick=downloadGrades;
clearGrades.onclick=()=>{
  if(confirm("Clear every saved grade from this browser?")){
    localStorage.removeItem(GRADE_KEY); renderGrades();
  }
};
playAgain.onclick=()=>{
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  playerNameInput.value=state.name;
};
resultGrades.onclick=showGrades;

function loop(now) {
  const dt=Math.min(.05,(now-lastTime)/1000); lastTime=now;
  // fluorescent flicker
  if(Math.random()<.018) flicker=.72+Math.random()*.18; else flicker += (1-flicker)*.12;
  update(dt);
  render3D();
  if(running && mapVisible) drawMap();
  requestAnimationFrame(loop);
}
buildMap();
render3D();
requestAnimationFrame(loop);

})();
