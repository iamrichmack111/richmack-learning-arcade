(() => {
"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d", {alpha:false});
const miniMap = document.getElementById("miniMap");
const mctx = miniMap.getContext("2d");

const startScreen = document.getElementById("startScreen");
const quizModal = document.getElementById("quizModal");
const transitionScreen = document.getElementById("transitionScreen");
const gradesScreen = document.getElementById("gradesScreen");
const resultScreen = document.getElementById("resultScreen");
const hud = document.getElementById("hud");
const studentName = document.getElementById("studentName");

const hudName = document.getElementById("hudName");
const hudLevel = document.getElementById("hudLevel");
const hudSolved = document.getElementById("hudSolved");
const hudAccuracy = document.getElementById("hudAccuracy");
const hudThreat = document.getElementById("hudThreat");
const objective = document.getElementById("objective");
const promptBox = document.getElementById("prompt");
const mapWrap = document.getElementById("mapWrap");
const toast = document.getElementById("toast");

const levelTag = document.getElementById("levelTag");
const quizHeading = document.getElementById("quizHeading");
const quizProgress = document.getElementById("quizProgress");
const quizQuestion = document.getElementById("quizQuestion");
const answers = document.getElementById("answers");
const feedback = document.getElementById("feedback");

const transitionLevel = document.getElementById("transitionLevel");
const transitionTitle = document.getElementById("transitionTitle");
const transitionText = document.getElementById("transitionText");
const nextLevelBtn = document.getElementById("nextLevelBtn");

const resultTitle = document.getElementById("resultTitle");
const bigGrade = document.getElementById("bigGrade");
const resultStats = document.getElementById("resultStats");
const gradesBody = document.getElementById("gradesBody");

const W=25,H=25;
const MAX_LEVEL=5;
let map=[];
let terminals=[];
let supplyDoors=[];
let exitCell=null;
let levelSolved=0;
let currentTerminal=null;
let running=false;
let quizOpen=false;
let mapVisible=true;
let lastTime=performance.now();
let flicker=1;
let toastTimer=0;
let entityPathTimer=0;
let entityPath=[];
let state={};
let player={};
let entity={};
let screenShake=0;
let blackout=0;
let heartbeat=0;

const levels = [
  {
    name:"LEVEL 0 — FRACTIONS", short:"Fractions",
    description:"The carpet is damp. The walls repeat forever. The first terminals speak only in fractions.",
    bank:[
      {q:"What is 1/2 + 1/4?",a:["2/6","3/4","1/8","1"],c:1},
      {q:"What is 3/5 - 1/5?",a:["2/5","2/10","4/5","1/5"],c:0},
      {q:"Simplify 8/12.",a:["4/8","2/3","3/4","1/2"],c:1},
      {q:"What is 2/3 × 3/4?",a:["1/2","5/7","6/7","2/4 + 1"],c:0},
      {q:"What is 5/6 ÷ 1/3?",a:["5/18","5/2","2/5","5/9"],c:1},
      {q:"Which fraction is greatest?",a:["2/5","3/8","5/6","4/7"],c:2},
      {q:"Convert 0.75 to a fraction in simplest form.",a:["3/4","75/10","7/5","1/3"],c:0},
      {q:"A pizza has 8 slices. You eat 3. What fraction remains?",a:["3/8","5/8","5/3","1/8"],c:1}
    ]
  },
  {
    name:"LEVEL 1 — EQUATIONS", short:"Equations",
    description:"The rooms narrow. Numbers are scratched into the wallpaper. Something is following your footsteps.",
    bank:[
      {q:"Solve: x + 9 = 21",a:["x=10","x=12","x=30","x=11"],c:1},
      {q:"Solve: 4x = 28",a:["x=6","x=7","x=8","x=24"],c:1},
      {q:"Solve: 3x + 5 = 20",a:["x=3","x=4","x=5","x=6"],c:2},
      {q:"Solve: 2(x + 4) = 18",a:["x=5","x=7","x=9","x=13"],c:0},
      {q:"Solve: 7x - 14 = 35",a:["x=3","x=5","x=7","x=9"],c:2},
      {q:"Solve: x/4 = 6",a:["x=10","x=18","x=24","x=2"],c:2},
      {q:"Solve: 5x + 2 = 2x + 20",a:["x=4","x=6","x=8","x=10"],c:1},
      {q:"If y = 2x + 3 and x = 4, what is y?",a:["8","10","11","14"],c:2}
    ]
  },
  {
    name:"LEVEL 2 — PERCENTAGES", short:"Percentages",
    description:"Fluorescent lights flicker above empty office partitions. The entity is louder here.",
    bank:[
      {q:"What is 25% of 80?",a:["15","20","25","40"],c:1},
      {q:"A $50 item is 20% off. What is the sale price?",a:["$10","$30","$40","$45"],c:2},
      {q:"15 is what percent of 60?",a:["15%","20%","25%","40%"],c:2},
      {q:"Increase 120 by 10%.",a:["122","130","132","140"],c:2},
      {q:"A score rises from 40 to 50. What is the percent increase?",a:["10%","20%","25%","40%"],c:2},
      {q:"What is 7.5% of 200?",a:["7.5","15","20","25"],c:1},
      {q:"A restaurant bill is $64. What is a 25% tip?",a:["$8","$12","$16","$20"],c:2},
      {q:"0.42 equals what percent?",a:["4.2%","42%","420%","0.42%"],c:1}
    ]
  },
  {
    name:"LEVEL 3 — GEOMETRY", short:"Geometry",
    description:"The geometry level has impossible corners. Hallways seem to fold back into themselves.",
    bank:[
      {q:"A rectangle is 9 units by 4 units. What is its area?",a:["13","26","36","45"],c:2},
      {q:"A square has side length 6. What is its perimeter?",a:["12","18","24","36"],c:2},
      {q:"A triangle has base 10 and height 7. What is its area?",a:["17","35","70","140"],c:1},
      {q:"What is the sum of the interior angles of a triangle?",a:["90°","180°","270°","360°"],c:1},
      {q:"A right triangle has legs 3 and 4. What is its hypotenuse?",a:["5","6","7","8"],c:0},
      {q:"A circle has radius 5. Which expression gives its area?",a:["5π","10π","25π","50π"],c:2},
      {q:"How many degrees are in a right angle?",a:["45°","60°","90°","180°"],c:2},
      {q:"A cube has side length 3. What is its volume?",a:["9","18","27","36"],c:2}
    ]
  },
  {
    name:"LEVEL 4 — RATIOS & RATES", short:"Ratios",
    description:"The wallpaper hums. The exit signs are gone. Ratios and unit rates are the only directions left.",
    bank:[
      {q:"Simplify the ratio 12:18.",a:["2:3","3:4","6:12","4:9"],c:0},
      {q:"A car travels 180 miles in 3 hours. What is its unit rate?",a:["30 mph","45 mph","60 mph","90 mph"],c:2},
      {q:"If 4 notebooks cost $12, how much does one notebook cost?",a:["$2","$3","$4","$8"],c:1},
      {q:"Which ratio is equivalent to 5:8?",a:["10:16","15:20","20:24","25:32"],c:0},
      {q:"A recipe uses 2 cups flour for 3 cups water. How much flour for 9 cups water?",a:["4 cups","6 cups","8 cups","12 cups"],c:1},
      {q:"A map scale is 1 inch = 20 miles. How many miles does 4 inches represent?",a:["24","60","80","100"],c:2},
      {q:"If 6 tickets cost $42, what is the cost per ticket?",a:["$6","$7","$8","$9"],c:1},
      {q:"A runner covers 5 miles in 40 minutes. What is the average time per mile?",a:["5 min","8 min","10 min","20 min"],c:1}
    ]
  },
  {
    name:"LEVEL 5 — MIXED MATH", short:"Final",
    description:"This level should not exist. Every kind of problem returns. The walls are closer. So is the entity.",
    bank:[
      {q:"What is 3/8 + 1/4?",a:["4/12","5/8","1/2","7/8"],c:1},
      {q:"Solve: 6x - 4 = 32",a:["x=4","x=5","x=6","x=8"],c:2},
      {q:"What is 30% of 150?",a:["35","40","45","50"],c:2},
      {q:"A rectangle has area 48 and width 6. What is its length?",a:["7","8","9","12"],c:1},
      {q:"A train travels 210 miles in 3.5 hours. What is its average speed?",a:["50 mph","55 mph","60 mph","70 mph"],c:2},
      {q:"What is 2.4 × 1.5?",a:["2.9","3.6","4.1","36"],c:1},
      {q:"Solve: 2x + 9 = x + 17",a:["x=6","x=7","x=8","x=26"],c:2},
      {q:"A circle has diameter 12. What is its radius?",a:["3","6","12","24"],c:1},
      {q:"Simplify 18/24.",a:["2/3","3/4","4/5","9/10"],c:1},
      {q:"A $90 item is discounted 15%. How much is the discount?",a:["$9","$13.50","$15","$75"],c:1}
    ]
  }
];

const simpleDoorQuestions = [
  {q:"What is 2 + 3?",a:["4","5","6","7"],c:1},
  {q:"What is 10 - 4?",a:["4","5","6","7"],c:2},
  {q:"What is 3 × 4?",a:["7","10","12","14"],c:2},
  {q:"What is 12 ÷ 3?",a:["3","4","5","6"],c:1},
  {q:"What is half of 10?",a:["2","4","5","8"],c:2},
  {q:"What is 25 + 25?",a:["40","45","50","55"],c:2},
  {q:"What is 9 - 3?",a:["5","6","7","8"],c:1},
  {q:"What is 5 × 2?",a:["7","8","10","12"],c:2},
  {q:"What is 18 ÷ 2?",a:["7","8","9","10"],c:2},
  {q:"Which is larger?",a:["7","3","2","1"],c:0},
  {q:"What is 1/2 of 8?",a:["2","3","4","6"],c:2},
  {q:"What is 20% of 10?",a:["1","2","5","10"],c:1}
];

const survivalItems = [
  {name:"Energy Drink", icon:"⚡", desc:"Sprint boost for this level.", apply(){player.sprintBonus=1.4;}},
  {name:"Flashlight Battery", icon:"🔋", desc:"Brighter vision for this level.", apply(){player.lightBoost=.20;}},
  {name:"Noise Decoy", icon:"📻", desc:"Pushes the entity away.", apply(){pushEntityAway();}},
  {name:"Protective Charm", icon:"🧿", desc:"Blocks one capture.", apply(){player.shield=(player.shield||0)+1;}},
  {name:"Adrenaline Shot", icon:"💉", desc:"Permanent walking-speed boost for this level.", apply(){player.speedBonus=.45;}},
  {name:"Entity Repellent", icon:"🧯", desc:"Slows the entity down.", apply(){entity.speed=Math.max(.48,entity.speed-.32);}}
];

function seededRandom(seed){
  let s=seed>>>0;
  return ()=>{
    s+=0x6D2B79F5;
    let t=s;
    t=Math.imul(t^t>>>15,t|1);
    t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}

function buildMaze(levelIndex){
  const rnd=seededRandom((Date.now()+levelIndex*7919)>>>0);
  map=Array.from({length:H},()=>Array(W).fill(1));

  const start=[12,12];
  map[start[1]][start[0]]=0;
  const stack=[start];
  const visited=new Set([`${start[0]},${start[1]}`]);
  const dirs=[[2,0],[-2,0],[0,2],[0,-2]];
  while(stack.length){
    const [x,y]=stack[stack.length-1];
    const opts=[];
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;
      if(nx>0&&ny>0&&nx<W-1&&ny<H-1&&!visited.has(`${nx},${ny}`))opts.push([dx,dy]);
    }
    if(!opts.length){stack.pop();continue}
    const [dx,dy]=opts[Math.floor(rnd()*opts.length)];
    const nx=x+dx,ny=y+dy;
    map[y+dy/2][x+dx/2]=0;
    map[ny][nx]=0;
    visited.add(`${nx},${ny}`);
    stack.push([nx,ny]);
  }

  // Larger open rooms and broken-up walls for more dimensional hallways.
  for(let i=0;i<58;i++){
    const x=2+Math.floor(rnd()*(W-4));
    const y=2+Math.floor(rnd()*(H-4));
    if(Math.hypot(x-12,y-12)<3)continue;
    if(rnd()<.76)map[y][x]=0;
  }

  for(let y=11;y<=13;y++)for(let x=11;x<=13;x++)map[y][x]=0;

  // Columns / room dividers.
  for(let i=0;i<24;i++){
    const x=2+Math.floor(rnd()*(W-4));
    const y=2+Math.floor(rnd()*(H-4));
    if(Math.hypot(x-12,y-12)>4&&map[y][x]===0&&rnd()<.45)map[y][x]=3;
  }

  const reachable=flood(12,12);
  const floorCandidates=reachable.filter(([x,y])=>Math.hypot(x-12,y-12)>5&&map[y][x]===0);
  shuffle(floorCandidates,rnd);

  terminals=[];
  for(let i=0;i<4&&i<floorCandidates.length;i++){
    const [x,y]=floorCandidates[i];
    terminals.push({x,y,solved:false,asked:[],current:null});
    map[y][x]=2;
  }

  const exitCandidates=reachable.filter(([x,y])=>Math.hypot(x-12,y-12)>10&&map[y][x]===0);
  const e=exitCandidates[Math.floor(rnd()*exitCandidates.length)]||floorCandidates[6]||[2,2];
  exitCell={x:e[0],y:e[1],revealed:false};

  // Supply doors are actual wall tiles bordering traversable floor.
  supplyDoors=[];
  const wallCandidates=[];
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    if(map[y][x]!==1)continue;
    const adj=[];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if(map[y+dy][x+dx]===0)adj.push([x+dx,y+dy]);
    }
    if(adj.length===1 && Math.hypot(x-12,y-12)>3) wallCandidates.push([x,y,adj[0]]);
  }
  shuffle(wallCandidates,rnd);
  for(let i=0;i<Math.min(8,wallCandidates.length);i++){
    const [x,y,stand]=wallCandidates[i];
    map[y][x]=5;
    supplyDoors.push({
      x,y,standX:stand[0],standY:stand[1],opened:false,
      question:simpleDoorQuestions[(i+levelIndex*3)%simpleDoorQuestions.length],
      item:survivalItems[(i+levelIndex)%survivalItems.length]
    });
  }

  levelSolved=0;
}

function flood(sx,sy){
  const q=[[sx,sy]],out=[],seen=new Set([`${sx},${sy}`]);
  while(q.length){
    const [x,y]=q.shift();out.push([x,y]);
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k))continue;
      if(map[ny][nx]===1||map[ny][nx]===3||map[ny][nx]===5)continue;
      seen.add(k);q.push([nx,ny]);
    }
  }
  return out;
}
function shuffle(a,rnd){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
}

function resetRun(name){
  state={name,level:0,correct:0,wrong:0,totalSolved:0,doorsOpened:0,startedAt:Date.now(),finished:false};
  startLevel(0);
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  gradesScreen.classList.add("hidden");
  hud.classList.remove("hidden");
}

function startLevel(index){
  state.level=index;
  buildMaze(index);
  player={
    x:12.5,y:12.5,a:-Math.PI/2,
    speed:2.8,sprint:4.2,speedBonus:0,sprintBonus:0,lightBoost:0,shield:0
  };
  entity={
    x:1.5,y:1.5,
    speed:.62+index*.11+state.wrong*.07,
    activeDelay:5.5,
    pulse:0
  };
  const reachable=flood(12,12).filter(([x,y])=>Math.hypot(x-12,y-12)>9&&map[y][x]===0);
  if(reachable.length){
    const p=reachable[Math.floor(Math.random()*reachable.length)];
    entity.x=p[0]+.5;entity.y=p[1]+.5;
  }
  entityPath=[];entityPathTimer=0;screenShake=0;blackout=0;
  running=true;quizOpen=false;
  hudName.textContent=state.name;
  updateHUD();
  objective.textContent=`Find 4 ${levels[index].short.toLowerCase()} terminals. Supply doors can contain survival gear.`;
  transitionScreen.classList.add("hidden");
  quizModal.classList.add("hidden");
  showToast(levels[index].name);
  canvas.requestPointerLock?.();
}

function tileAt(x,y){
  const ix=Math.floor(x),iy=Math.floor(y);
  if(ix<0||iy<0||ix>=W||iy>=H)return 1;
  return map[iy][ix];
}
function solidAt(x,y){
  const t=tileAt(x,y);
  return t===1||t===2||t===3||t===5||t===6;
}
function tryMove(obj,nx,ny,r=.20){
  if(!solidAt(nx-r,obj.y)&&!solidAt(nx+r,obj.y))obj.x=nx;
  if(!solidAt(obj.x,ny-r)&&!solidAt(obj.x,ny+r))obj.y=ny;
}
function angleDiff(a,b){
  let d=b-a;
  while(d>Math.PI)d-=Math.PI*2;
  while(d<-Math.PI)d+=Math.PI*2;
  return d;
}

const keys={};
addEventListener("keydown",e=>{
  keys[e.key.toLowerCase()]=true;
  if(e.key.toLowerCase()==="e"&&running&&!quizOpen)interact();
  if(e.key.toLowerCase()==="m"&&running){
    mapVisible=!mapVisible;mapWrap.classList.toggle("hidden",!mapVisible);
  }
});
addEventListener("keyup",e=>keys[e.key.toLowerCase()]=false);
canvas.addEventListener("click",()=>{if(running&&!quizOpen)canvas.requestPointerLock?.()});
document.addEventListener("mousemove",e=>{
  if(document.pointerLockElement===canvas&&running&&!quizOpen)player.a+=e.movementX*.0025;
});

function nearestInteractable(){
  let best=null,bestDist=999;
  for(const t of terminals){
    if(t.solved)continue;
    const dx=t.x+.5-player.x,dy=t.y+.5-player.y,d=Math.hypot(dx,dy);
    const diff=Math.abs(angleDiff(player.a,Math.atan2(dy,dx)));
    if(d<1.55&&diff<.95&&d<bestDist){best={kind:"terminal",obj:t};bestDist=d}
  }
  for(const d of supplyDoors){
    if(d.opened)continue;
    const dx=d.x+.5-player.x,dy=d.y+.5-player.y,dist=Math.hypot(dx,dy);
    const diff=Math.abs(angleDiff(player.a,Math.atan2(dy,dx)));
    if(dist<1.55&&diff<1.0&&dist<bestDist){best={kind:"door",obj:d};bestDist=dist}
  }
  if(exitCell?.revealed){
    const dx=exitCell.x+.5-player.x,dy=exitCell.y+.5-player.y,d=Math.hypot(dx,dy);
    const diff=Math.abs(angleDiff(player.a,Math.atan2(dy,dx)));
    if(d<1.6&&diff<1.0&&d<bestDist)best={kind:"exit",obj:exitCell};
  }
  return best;
}

function interact(){
  const n=nearestInteractable();
  if(!n)return;
  if(n.kind==="terminal")openQuiz(n.obj,false);
  else if(n.kind==="door")openQuiz(n.obj,true);
  else useExit();
}

function getQuestion(obj,isDoor){
  if(isDoor)return obj.question;
  const bank=levels[state.level].bank;
  if(obj.current!=null)return bank[obj.current];
  let options=bank.map((_,i)=>i).filter(i=>!obj.asked.includes(i));
  if(!options.length){obj.asked=[];options=bank.map((_,i)=>i)}
  obj.current=options[Math.floor(Math.random()*options.length)];
  return bank[obj.current];
}

function openQuiz(obj,isDoor){
  currentTerminal={obj,isDoor};quizOpen=true;
  document.exitPointerLock?.();
  quizModal.classList.remove("hidden");
  feedback.textContent="";feedback.className="feedback";

  if(isDoor){
    levelTag.textContent="SUPPLY DOOR";
    quizHeading.textContent=`Locked Door — ${obj.item.icon} Possible Supply`;
    quizProgress.textContent="Answer one simple question to unlock this door.";
    quizQuestion.textContent=obj.question.q;
    renderAnswers(obj,true);
  }else{
    levelTag.textContent=levels[state.level].name;
    quizHeading.textContent=`${levels[state.level].short} Terminal`;
    renderQuestion(obj);
  }
}

function renderQuestion(term){
  const q=getQuestion(term,false);
  quizProgress.textContent=`Terminals solved: ${levelSolved} / 4`;
  quizQuestion.textContent=q.q;
  renderAnswers(term,false);
}
function renderAnswers(obj,isDoor){
  const q=getQuestion(obj,isDoor);
  answers.innerHTML="";
  q.a.forEach((ans,i)=>{
    const b=document.createElement("button");
    b.textContent=`${String.fromCharCode(65+i)}. ${ans}`;
    b.onclick=()=>answerQuestion(obj,isDoor,i);
    answers.appendChild(b);
  });
}

function answerQuestion(obj,isDoor,choice){
  const q=getQuestion(obj,isDoor);
  if(choice===q.c){
    state.correct++;
    if(isDoor){
      obj.opened=true;
      map[obj.y][obj.x]=6;
      state.doorsOpened++;
      obj.item.apply();
      feedback.textContent=`Correct. Door opened — found ${obj.item.icon} ${obj.item.name}: ${obj.item.desc}`;
      feedback.className="feedback good";
      updateHUD();
      setTimeout(()=>{
        quizModal.classList.add("hidden");quizOpen=false;
        showToast(`${obj.item.icon} ${obj.item.name}: ${obj.item.desc}`);
        if(running)canvas.requestPointerLock?.();
      },850);
    }else{
      state.totalSolved++;levelSolved++;
      obj.solved=true;
      obj.asked.push(obj.current);obj.current=null;
      map[obj.y][obj.x]=0;
      feedback.textContent="Correct. The terminal powers down.";
      feedback.className="feedback good";
      updateHUD();
      if(levelSolved===4){
        exitCell.revealed=true;
        map[exitCell.y][exitCell.x]=4;
        objective.textContent="EXIT REVEALED — find the green exit. Supply doors can still help you survive.";
      }
      setTimeout(()=>{
        quizModal.classList.add("hidden");quizOpen=false;
        if(levelSolved===4)showToast("An EXIT has appeared somewhere in the level.");
        else showToast(`Terminal solved. ${4-levelSolved} remain.`);
        if(running)canvas.requestPointerLock?.();
      },420);
    }
  }else{
    state.wrong++;
    entity.speed=Math.min(2.8,entity.speed+(isDoor?.13:.20));
    entity.activeDelay=Math.max(0,entity.activeDelay-(isDoor?.8:1.5));
    feedback.textContent=isDoor
      ?"Wrong. The door stays locked. Something heard the keypad."
      :"Wrong. The buzzing cuts out... and heavy footsteps answer.";
    feedback.className="feedback bad";
    updateHUD();flashDanger();
  }
}

function pushEntityAway(){
  const dx=entity.x-player.x,dy=entity.y-player.y,d=Math.hypot(dx,dy)||1;
  let nx=entity.x+dx/d*5,ny=entity.y+dy/d*5;
  nx=Math.max(1.5,Math.min(W-1.5,nx));
  ny=Math.max(1.5,Math.min(H-1.5,ny));
  const cell=findNearestOpen(Math.floor(nx),Math.floor(ny));
  entity.x=cell[0]+.5;entity.y=cell[1]+.5;
}
function findNearestOpen(x,y){
  const q=[[x,y]],seen=new Set([`${x},${y}`]);
  while(q.length){
    const [cx,cy]=q.shift();
    if(cx>=0&&cy>=0&&cx<W&&cy<H&&map[cy][cx]===0)return[cx,cy];
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=cx+dx,ny=cy+dy,k=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k))continue;
      seen.add(k);q.push([nx,ny]);
    }
  }
  return [12,12];
}

function useExit(){
  if(state.level<MAX_LEVEL){
    running=false;
    document.exitPointerLock?.();
    hud.classList.add("hidden");
    transitionLevel.textContent=`LEVEL ${state.level} COMPLETE`;
    transitionTitle.textContent="You found an exit.";
    transitionText.textContent=
      `${levels[state.level].description} You squeeze through the opening. The next room is still yellow. `+
      `The next math zone is ${levels[state.level+1].short}.`;
    nextLevelBtn.textContent=`Enter ${levels[state.level+1].name}`;
    transitionScreen.classList.remove("hidden");
  }else finishRun(true);
}
nextLevelBtn.onclick=()=>{
  transitionScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  startLevel(state.level+1);
};

function updateHUD(){
  hudLevel.textContent=String(state.level);
  hudSolved.textContent=`${levelSolved} / 4`;
  const total=state.correct+state.wrong;
  hudAccuracy.textContent=`${total?Math.round(state.correct/total*100):100}%`;
  let label="QUIET",color="#b7ffad";
  if(entity.speed>.85){label="NEAR";color="#e8df72"}
  if(entity.speed>1.2){label="HUNTING";color="#ffb15e"}
  if(entity.speed>1.65){label="DANGER";color="#ff6868"}
  if(entity.speed>2.15){label="RUN";color="#ff4545"}
  hudThreat.textContent=label;hudThreat.style.color=color;
}
function flashDanger(){
  screenShake=Math.max(screenShake,7);
  blackout=Math.max(blackout,.18);
  document.body.animate(
    [{filter:"none"},{filter:"sepia(.6) saturate(2.3) hue-rotate(315deg)"},{filter:"none"}],
    {duration:420}
  );
}
function showToast(text,danger=false){
  toast.textContent=text;toast.className="toast"+(danger?" danger":"");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.add("hidden"),2600);
}

function resize(){
  const scale=Math.min(devicePixelRatio||1,1.35);
  canvas.width=Math.floor(innerWidth*scale);
  canvas.height=Math.floor(innerHeight*scale);
}
addEventListener("resize",resize);resize();

function render3D(){
  const cw=canvas.width,ch=canvas.height;
  ctx.save();
  if(screenShake>0){
    ctx.translate((Math.random()-.5)*screenShake,(Math.random()-.5)*screenShake);
    screenShake*=.90;
  }

  // More dimensional ceiling/floor.
  const ceilGrad=ctx.createLinearGradient(0,0,0,ch/2);
  ceilGrad.addColorStop(0,"#bbb47a");
  ceilGrad.addColorStop(1,"#8f895b");
  ctx.fillStyle=ceilGrad;ctx.fillRect(-20,-20,cw+40,ch/2+20);

  const floorGrad=ctx.createLinearGradient(0,ch/2,0,ch);
  floorGrad.addColorStop(0,"#6c6348");
  floorGrad.addColorStop(1,"#3c382b");
  ctx.fillStyle=floorGrad;ctx.fillRect(-20,ch/2,cw+40,ch/2+20);

  // Perspective ceiling light bands.
  for(let i=0;i<9;i++){
    const y=(i/9)*(ch/2);
    const alpha=.018+i*.004;
    ctx.fillStyle=`rgba(255,250,196,${alpha})`;
    ctx.fillRect(0,y,cw,Math.max(2,ch/240));
  }
  // Carpet lines receding toward horizon.
  for(let y=ch/2;y<ch;y+=Math.max(4,Math.floor(ch/80))){
    const t=(y-ch/2)/(ch/2);
    ctx.fillStyle=`rgba(30,26,18,${.05+.17*t})`;
    ctx.fillRect(0,y,cw,1+Math.floor(t*2));
  }

  const fov=Math.PI/3,maxDepth=28,rayStep=canvas.width>1500?2:1;
  const zBuffer=new Float32Array(Math.ceil(cw/rayStep));

  for(let sx=0,zi=0;sx<cw;sx+=rayStep,zi++){
    const rayA=player.a-fov/2+(sx/cw)*fov;
    const dx=Math.cos(rayA),dy=Math.sin(rayA);
    let dist=0,hit=0,hx=0,hy=0,side=0;
    while(dist<maxDepth){
      dist+=.022;hx=player.x+dx*dist;hy=player.y+dy*dist;hit=tileAt(hx,hy);
      if(hit!==0){
        const fx=hx-Math.floor(hx),fy=hy-Math.floor(hy);
        side=(fx<.03||fx>.97)?1:0;break;
      }
    }
    const corrected=Math.max(.001,dist*Math.cos(rayA-player.a));
    zBuffer[zi]=corrected;
    const wallH=Math.min(ch*1.65,ch/corrected);
    const top=ch/2-wallH/2;
    let base=[193,184,112];
    if(hit===2)base=[68,72,53];
    if(hit===3)base=[133,126,81];
    if(hit===4)base=[60,142,70];
    if(hit===5)base=[83,69,48];
    if(hit===6)base=[38,31,24];

    let shade=Math.max(.10,1-corrected/maxDepth);
    shade*=side?.76:1;
    shade*=flicker;
    const lightBoost=player.lightBoost||0;
    shade=Math.min(1,shade+lightBoost/(1+corrected*.3));
    const r=Math.floor(base[0]*shade),g=Math.floor(base[1]*shade),b=Math.floor(base[2]*shade);

    ctx.fillStyle=`rgb(${r},${g},${b})`;
    ctx.fillRect(sx,top,rayStep+1,wallH);

    // Baseboard and ceiling trim make halls look more architectural.
    if(hit===1||hit===5||hit===6){
      const trimShade=Math.max(.1,shade*.65);
      ctx.fillStyle=`rgba(${Math.floor(75*trimShade)},${Math.floor(67*trimShade)},${Math.floor(39*trimShade)},.95)`;
      ctx.fillRect(sx,top+wallH*.90,rayStep+1,Math.max(1,wallH*.04));
      ctx.fillStyle=`rgba(255,246,176,${Math.min(.15,shade*.2)})`;
      ctx.fillRect(sx,top+wallH*.06,rayStep+1,Math.max(1,wallH*.015));
    }

    // Wallpaper seams and dirty vertical streaks.
    if(hit===1 && wallH>60){
      const u=(hx*1.7+hy*1.2)%1;
      if(u<.028){
        ctx.fillStyle="rgba(77,65,31,.18)";
        ctx.fillRect(sx,top,rayStep+1,wallH);
      }
      if((Math.floor(hx*7+hy*5)%17)===0){
        ctx.fillStyle="rgba(65,52,25,.08)";
        ctx.fillRect(sx,top+wallH*.25,rayStep+1,wallH*.5);
      }
    }

    // Supply door paneling.
    if(hit===5||hit===6){
      ctx.fillStyle=hit===5?"rgba(28,22,17,.45)":"rgba(0,0,0,.68)";
      ctx.fillRect(sx,top+wallH*.10,rayStep+1,wallH*.80);
      if((sx%18)<rayStep+1){
        ctx.fillStyle="rgba(210,190,120,.18)";
        ctx.fillRect(sx,top+wallH*.18,rayStep+1,wallH*.52);
      }
      // glowing keypad
      if(hit===5 && (sx%13)<rayStep+1){
        ctx.fillStyle="rgba(255,230,115,.38)";
        ctx.fillRect(sx,top+wallH*.48,rayStep+2,Math.max(2,wallH*.05));
      }
    }
    if(hit===4){
      ctx.fillStyle="rgba(110,255,125,.24)";
      ctx.fillRect(sx,top,rayStep+1,wallH);
    }
  }

  renderEntity(fov,zBuffer,rayStep);
  renderTerminalGlow(fov,zBuffer,rayStep);
  renderDoorIcons(fov,zBuffer,rayStep);

  const grad=ctx.createRadialGradient(cw*.5,ch*.38,10,cw*.5,ch*.43,Math.min(cw,ch)*(.60+(player.lightBoost||0)));
  grad.addColorStop(0,`rgba(255,251,204,${.10+(player.lightBoost||0)})`);
  grad.addColorStop(.38,"rgba(255,245,185,.025)");
  grad.addColorStop(1,"rgba(0,0,0,.48)");
  ctx.fillStyle=grad;ctx.fillRect(-20,-20,cw+40,ch+40);

  if(blackout>0){
    ctx.fillStyle=`rgba(0,0,0,${blackout})`;
    ctx.fillRect(-20,-20,cw+40,ch+40);
    blackout*=.88;
  }
  ctx.restore();
}

function renderEntity(fov,zBuffer,rayStep){
  const dx=entity.x-player.x,dy=entity.y-player.y,dist=Math.hypot(dx,dy);
  const ang=angleDiff(player.a,Math.atan2(dy,dx));
  if(Math.abs(ang)>fov*.76||dist<.08)return;
  const sx=(.5+ang/fov)*canvas.width;
  const zi=Math.max(0,Math.min(zBuffer.length-1,Math.floor(sx/rayStep)));
  if(dist>zBuffer[zi]+.12)return;

  const size=Math.min(canvas.height*1.9,canvas.height/(dist*.60));
  const y=canvas.height/2-size*.56;
  const close=Math.max(0,1-dist/5);
  if(close>.15){
    screenShake=Math.max(screenShake,close*4.5);
    blackout=Math.max(blackout,close*.055);
  }

  ctx.save();
  ctx.globalAlpha=Math.max(.30,1-dist/25);

  // Aura / distortion.
  const aura=ctx.createRadialGradient(sx,y+size*.43,size*.08,sx,y+size*.43,size*.50);
  aura.addColorStop(0,"rgba(25,0,0,.20)");
  aura.addColorStop(.55,"rgba(0,0,0,.16)");
  aura.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=aura;ctx.fillRect(sx-size*.55,y-size*.05,size*1.1,size*1.1);

  // Extremely long legs.
  ctx.strokeStyle="#070605";
  ctx.lineCap="round";
  ctx.lineWidth=Math.max(4,size*.055);
  ctx.beginPath();ctx.moveTo(sx-size*.055,y+size*.59);ctx.lineTo(sx-size*.13,y+size*.98);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx+size*.055,y+size*.59);ctx.lineTo(sx+size*.14,y+size*.98);ctx.stroke();

  // Torso: bent and too thin.
  ctx.fillStyle="#090807";
  ctx.beginPath();
  ctx.moveTo(sx-size*.12,y+size*.31);
  ctx.quadraticCurveTo(sx-size*.18,y+size*.55,sx-size*.07,y+size*.68);
  ctx.lineTo(sx+size*.09,y+size*.68);
  ctx.quadraticCurveTo(sx+size*.17,y+size*.50,sx+size*.10,y+size*.31);
  ctx.closePath();ctx.fill();

  // Arms reach too low.
  ctx.strokeStyle="#080706";
  ctx.lineWidth=Math.max(4,size*.045);
  ctx.beginPath();ctx.moveTo(sx-size*.09,y+size*.34);ctx.lineTo(sx-size*.34,y+size*.76);ctx.lineTo(sx-size*.31,y+size*.92);ctx.stroke();
  ctx.beginPath();ctx.moveTo(sx+size*.09,y+size*.34);ctx.lineTo(sx+size*.35,y+size*.73);ctx.lineTo(sx+size*.37,y+size*.90);ctx.stroke();

  // Head with stretched jaw.
  ctx.fillStyle="#0b0908";
  ctx.beginPath();
  ctx.ellipse(sx,y+size*.22,size*.135,size*.19,0,0,Math.PI*2);ctx.fill();

  // Sick pale mask.
  ctx.fillStyle="rgba(200,195,155,.19)";
  ctx.beginPath();
  ctx.ellipse(sx,y+size*.205,size*.102,size*.135,0,0,Math.PI*2);ctx.fill();

  // Black eye sockets + pulsing red pupils.
  const pulse=.75+.25*Math.sin(performance.now()/65);
  for(const off of [-.048,.048]){
    ctx.fillStyle="rgba(0,0,0,.86)";
    ctx.beginPath();ctx.ellipse(sx+size*off,y+size*.19,size*.038,size*.052,0,0,Math.PI*2);ctx.fill();
    const g=ctx.createRadialGradient(sx+size*off,y+size*.19,0,sx+size*off,y+size*.19,size*.048);
    g.addColorStop(0,`rgba(255,45,30,${pulse})`);
    g.addColorStop(.35,"rgba(180,0,0,.7)");
    g.addColorStop(1,"rgba(255,0,0,0)");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx+size*off,y+size*.19,size*.052,0,Math.PI*2);ctx.fill();
  }

  // Huge vertical mouth with teeth.
  ctx.fillStyle="rgba(0,0,0,.94)";
  ctx.beginPath();
  ctx.ellipse(sx,y+size*.285,size*.055,size*.095,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="rgba(235,226,185,.78)";
  for(let i=-2;i<=2;i++){
    const tx=sx+i*size*.018;
    ctx.beginPath();
    ctx.moveTo(tx-size*.008,y+size*.242);
    ctx.lineTo(tx+size*.008,y+size*.242);
    ctx.lineTo(tx,y+size*.272);
    ctx.closePath();ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx-size*.008,y+size*.328);
    ctx.lineTo(tx+size*.008,y+size*.328);
    ctx.lineTo(tx,y+size*.300);
    ctx.closePath();ctx.fill();
  }

  // Jitter ghost echoes at close range.
  if(close>.35){
    ctx.globalAlpha=close*.17;
    ctx.fillStyle="#ff2727";
    for(let i=0;i<3;i++){
      const ox=(Math.random()-.5)*size*.12,oy=(Math.random()-.5)*size*.08;
      ctx.beginPath();ctx.ellipse(sx+ox,y+size*.22+oy,size*.15,size*.20,0,0,Math.PI*2);ctx.fill();
    }
  }

  ctx.restore();
}

function renderTerminalGlow(fov,zBuffer,rayStep){
  const items=terminals.filter(t=>!t.solved).map(t=>({x:t.x+.5,y:t.y+.5,color:"rgba(220,220,110,.20)"}));
  if(exitCell?.revealed)items.push({x:exitCell.x+.5,y:exitCell.y+.5,color:"rgba(95,255,120,.30)"});
  for(const it of items){
    const dx=it.x-player.x,dy=it.y-player.y,dist=Math.hypot(dx,dy),ang=angleDiff(player.a,Math.atan2(dy,dx));
    if(Math.abs(ang)>fov*.7)continue;
    const sx=(.5+ang/fov)*canvas.width;
    const zi=Math.max(0,Math.min(zBuffer.length-1,Math.floor(sx/rayStep)));
    if(dist>zBuffer[zi]+.5)continue;
    const radius=Math.min(canvas.height*.5,canvas.height/(dist*2));
    const g=ctx.createRadialGradient(sx,canvas.height*.5,0,sx,canvas.height*.5,radius);
    g.addColorStop(0,it.color);g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=g;ctx.fillRect(sx-radius,canvas.height*.5-radius,radius*2,radius*2);
  }
}

function renderDoorIcons(fov,zBuffer,rayStep){
  for(const d of supplyDoors){
    if(d.opened)continue;
    const dx=d.x+.5-player.x,dy=d.y+.5-player.y,dist=Math.hypot(dx,dy),ang=angleDiff(player.a,Math.atan2(dy,dx));
    if(dist>5||Math.abs(ang)>fov*.65)continue;
    const sx=(.5+ang/fov)*canvas.width;
    const zi=Math.max(0,Math.min(zBuffer.length-1,Math.floor(sx/rayStep)));
    if(dist>zBuffer[zi]+.6)continue;
    const s=Math.max(16,canvas.height/(dist*18));
    ctx.save();
    ctx.font=`${s}px sans-serif`;
    ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle="rgba(255,236,135,.92)";
    ctx.shadowColor="rgba(255,220,90,.65)";ctx.shadowBlur=12;
    ctx.fillText("?",sx,canvas.height*.49);
    ctx.restore();
  }
}

function drawMap(){
  const s=miniMap.width/W;
  mctx.fillStyle="#111009";mctx.fillRect(0,0,miniMap.width,miniMap.height);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const t=map[y][x];
    if(t===1)mctx.fillStyle="#8f8755";
    else if(t===2)mctx.fillStyle="#d5cd79";
    else if(t===3)mctx.fillStyle="#5d5738";
    else if(t===4)mctx.fillStyle="#61c56b";
    else if(t===5)mctx.fillStyle="#705233";
    else if(t===6)mctx.fillStyle="#2f241a";
    else mctx.fillStyle="#252316";
    mctx.fillRect(x*s,y*s,s+1,s+1);
  }
  mctx.fillStyle="#fff";mctx.beginPath();mctx.arc(player.x*s,player.y*s,3.4,0,Math.PI*2);mctx.fill();
  mctx.strokeStyle="#fff";mctx.beginPath();mctx.moveTo(player.x*s,player.y*s);
  mctx.lineTo((player.x+Math.cos(player.a)*.8)*s,(player.y+Math.sin(player.a)*.8)*s);mctx.stroke();
  mctx.fillStyle="#e34d4d";mctx.beginPath();mctx.arc(entity.x*s,entity.y*s,3.2,0,Math.PI*2);mctx.fill();
  mctx.fillStyle="#e1b95f";
  for(const d of supplyDoors)if(!d.opened)mctx.fillRect(d.x*s+2,d.y*s+2,Math.max(2,s-4),Math.max(2,s-4));
}

function bfsPath(sx,sy,tx,ty){
  sx=Math.floor(sx);sy=Math.floor(sy);tx=Math.floor(tx);ty=Math.floor(ty);
  const q=[[sx,sy]],seen=new Set([`${sx},${sy}`]),prev=new Map();
  let found=false;
  while(q.length){
    const [x,y]=q.shift();
    if(x===tx&&y===ty){found=true;break}
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=`${nx},${ny}`;
      if(nx<0||ny<0||nx>=W||ny>=H||seen.has(k))continue;
      const t=map[ny][nx];
      if(t===1||t===2||t===3||t===5||t===6)continue;
      seen.add(k);prev.set(k,[x,y]);q.push([nx,ny]);
    }
  }
  if(!found)return [];
  const path=[];let cur=[tx,ty];
  while(!(cur[0]===sx&&cur[1]===sy)){
    path.push(cur);cur=prev.get(`${cur[0]},${cur[1]}`);if(!cur)return [];
  }
  path.reverse();return path;
}

function updateEntity(dt){
  if(entity.activeDelay>0){entity.activeDelay-=dt;return}
  entityPathTimer-=dt;
  if(entityPathTimer<=0){
    entityPath=bfsPath(entity.x,entity.y,player.x,player.y);
    entityPathTimer=.22;
  }
  if(entityPath.length){
    const [tx,ty]=entityPath[0],cx=tx+.5,cy=ty+.5;
    const dx=cx-entity.x,dy=cy-entity.y,d=Math.hypot(dx,dy);
    if(d<.07)entityPath.shift();
    else{
      const step=Math.min(d,entity.speed*dt);
      entity.x+=dx/d*step;entity.y+=dy/d*step;
    }
  }
  const d=Math.hypot(entity.x-player.x,entity.y-player.y);
  heartbeat=Math.max(0,1-d/6);

  if(d<.52){
    if((player.shield||0)>0){
      player.shield--;
      pushEntityAway();
      screenShake=12;blackout=.6;
      showToast("🧿 The protective charm shattered and saved you!",true);
    }else finishRun(false);
  }
}

function update(dt){
  if(!running||quizOpen)return;
  let forward=0,strafe=0,turn=0;
  if(keys["w"]||keys["arrowup"])forward++;
  if(keys["s"]||keys["arrowdown"])forward--;
  if(keys["a"])strafe--;
  if(keys["d"])strafe++;
  if(keys["arrowleft"])turn--;
  if(keys["arrowright"])turn++;
  player.a+=turn*dt*1.9;

  const mag=Math.hypot(forward,strafe);
  if(mag){
    forward/=mag;strafe/=mag;
    const sp=keys["shift"]?(player.sprint+(player.sprintBonus||0)):(player.speed+(player.speedBonus||0));
    const dx=(Math.cos(player.a)*forward+Math.cos(player.a+Math.PI/2)*strafe)*sp*dt;
    const dy=(Math.sin(player.a)*forward+Math.sin(player.a+Math.PI/2)*strafe)*sp*dt;
    tryMove(player,player.x+dx,player.y+dy,.20);
  }
  updateEntity(dt);

  const n=nearestInteractable();
  if(n){
    if(n.kind==="terminal")promptBox.textContent="Press E — solve math terminal";
    else if(n.kind==="door")promptBox.textContent=`Press E — answer a simple question to open supply door ${n.obj.item.icon}`;
    else promptBox.textContent="Press E — enter the EXIT";
    promptBox.classList.remove("hidden");
  }else promptBox.classList.add("hidden");
}

function finishRun(escaped){
  if(state.finished)return;
  state.finished=true;running=false;document.exitPointerLock?.();
  hud.classList.add("hidden");quizModal.classList.add("hidden");
  const total=state.correct+state.wrong;
  const score=total?Math.round(state.correct/total*100):0;
  const grade=letterGrade(score);
  const elapsed=Math.max(1,Math.round((Date.now()-state.startedAt)/1000));
  saveGrade({
    name:state.name,grade,score,correct:state.correct,wrong:state.wrong,
    level:state.level,doors:state.doorsOpened,result:escaped?"Escaped all levels":"Caught",
    seconds:elapsed,date:new Date().toLocaleString()
  });
  resultTitle.textContent=escaped?"You Escaped the Backrooms":"The Entity Found You";
  bigGrade.textContent=grade;
  resultStats.innerHTML=
    `<b>${esc(state.name)}</b><br>`+
    `Score: <b>${score}%</b> &nbsp; • &nbsp; Correct: <b>${state.correct}</b> &nbsp; • &nbsp; Wrong: <b>${state.wrong}</b><br>`+
    `Supply doors opened: <b>${state.doorsOpened}</b> &nbsp; • &nbsp; Highest level: <b>${state.level}</b><br>`+
    `Time: <b>${formatTime(elapsed)}</b>`;
  resultScreen.classList.remove("hidden");
}
function letterGrade(s){return s>=90?"A":s>=80?"B":s>=70?"C":s>=60?"D":"F"}
function formatTime(sec){return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`}

const GRADE_KEY="backroomsMathLevelsGrades_v2";
function getGrades(){try{return JSON.parse(localStorage.getItem(GRADE_KEY)||"[]")}catch{return []}}
function saveGrade(row){
  const rows=getGrades();rows.unshift(row);localStorage.setItem(GRADE_KEY,JSON.stringify(rows.slice(0,100)));
}
function esc(v){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function renderGrades(){
  const rows=getGrades();gradesBody.innerHTML="";
  if(!rows.length){
    gradesBody.innerHTML='<tr><td colspan="7" style="color:#918d78">No saved runs yet.</td></tr>';return;
  }
  for(const r of rows){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${esc(r.name)}</td><td><strong>${esc(r.grade)}</strong></td><td>${r.score}%</td><td>${r.level}</td><td>${r.wrong}</td><td>${esc(r.result)}</td><td>${esc(r.date)}</td>`;
    gradesBody.appendChild(tr);
  }
}
function showGrades(){
  renderGrades();startScreen.classList.add("hidden");resultScreen.classList.add("hidden");gradesScreen.classList.remove("hidden");
}
function exportCSV(){
  const rows=getGrades(),headers=["Name","Grade","Score","Correct","Wrong","HighestLevel","SupplyDoors","Result","Seconds","Date"];
  const csv=[headers.join(",")].concat(rows.map(r=>[
    r.name,r.grade,r.score,r.correct,r.wrong,r.level,r.doors||0,r.result,r.seconds,r.date
  ].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))).join("\n");
  const blob=new Blob([csv],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="backrooms-math-levels-grades.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

document.getElementById("startBtn").onclick=()=>{
  const name=studentName.value.trim();
  if(!name){studentName.focus();showToast("Enter a student name first.",true);return}
  resetRun(name);
};
document.getElementById("gradesBtn").onclick=showGrades;
document.getElementById("closeGrades").onclick=()=>{gradesScreen.classList.add("hidden");startScreen.classList.remove("hidden")};
document.getElementById("exportGrades").onclick=exportCSV;
document.getElementById("clearGrades").onclick=()=>{
  if(confirm("Clear all saved grades from this browser?")){localStorage.removeItem(GRADE_KEY);renderGrades()}
};
document.getElementById("playAgain").onclick=()=>{
  resultScreen.classList.add("hidden");startScreen.classList.remove("hidden");studentName.value=state.name||"";
};
document.getElementById("resultGrades").onclick=showGrades;

function loop(now){
  const dt=Math.min(.05,(now-lastTime)/1000);lastTime=now;
  if(Math.random()<.024)flicker=.62+Math.random()*.30;else flicker+=(1-flicker)*.14;
  if(heartbeat>.1&&Math.random()<heartbeat*.018){screenShake=Math.max(screenShake,heartbeat*2.5)}
  update(dt);render3D();if(running&&mapVisible)drawMap();
  requestAnimationFrame(loop);
}

buildMaze(0);
player={x:12.5,y:12.5,a:0,speed:2.8,sprint:4.2,speedBonus:0,sprintBonus:0,lightBoost:0,shield:0};
entity={x:3.5,y:3.5,speed:.65,activeDelay:999};
render3D();
requestAnimationFrame(loop);

})();
