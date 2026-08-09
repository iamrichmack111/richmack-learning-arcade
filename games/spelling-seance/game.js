(() => {
"use strict";

const canvas = document.getElementById("room");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const gameUI = document.getElementById("gameUI");
const chapterScreen = document.getElementById("chapterScreen");
const resultScreen = document.getElementById("resultScreen");
const gradesScreen = document.getElementById("gradesScreen");
const hud = document.getElementById("hud");
const jumpscare = document.getElementById("jumpscare");
const studentName = document.getElementById("studentName");

const hudName = document.getElementById("hudName");
const hudChapter = document.getElementById("hudChapter");
const hudAccuracy = document.getElementById("hudAccuracy");
const hudHaunting = document.getElementById("hudHaunting");

const chapterLabel = document.getElementById("chapterLabel");
const chapterTitle = document.getElementById("chapterTitle");
const chapterIntro = document.getElementById("chapterIntro");
const wrongWord = document.getElementById("wrongWord");
const wordHint = document.getElementById("wordHint");
const answerForm = document.getElementById("answerForm");
const answerInput = document.getElementById("answerInput");
const feedback = document.getElementById("feedback");
const progressBar = document.getElementById("progressBar");
const wordProgress = document.getElementById("wordProgress");
const recoveredMessage = document.getElementById("recoveredMessage");

const chapterCompleteTitle = document.getElementById("chapterCompleteTitle");
const chapterClue = document.getElementById("chapterClue");
const chapterNarrative = document.getElementById("chapterNarrative");
const nextChapterBtn = document.getElementById("nextChapterBtn");

const resultTitle = document.getElementById("resultTitle");
const bigGrade = document.getElementById("bigGrade");
const finalMystery = document.getElementById("finalMystery");
const resultStats = document.getElementById("resultStats");
const gradesBody = document.getElementById("gradesBody");
const toast = document.getElementById("toast");

let state = {};
let animationTime = 0;
let toastTimer = null;

const chapters = [
  {
    numeral:"CHAPTER I",
    title:"The Empty Chair",
    intro:"The candles ignite by themselves. Chalk scratches across the slate. The first words are simple, but none are spelled correctly.",
    clue:"I SAT HERE EVERY NIGHT.",
    narrative:"The spirit remembers this room. Someone used to meet it here after sunset, always sitting across the table.",
    words:[
      {wrong:"nite",correct:"night",hint:"Opposite of day"},
      {wrong:"frend",correct:"friend",hint:"A person you trust"},
      {wrong:"secrit",correct:"secret",hint:"Something hidden from others"},
      {wrong:"chairr",correct:"chair",hint:"Something you sit on"},
      {wrong:"waited",correct:"waited",hint:"Stayed until someone arrived"}
    ]
  },
  {
    numeral:"CHAPTER II",
    title:"The Locked Hall",
    intro:"The room darkens. A second voice appears beneath the first, written backward in the dust.",
    clue:"THE DOOR WAS LOCKED FROM OUTSIDE.",
    narrative:"The ghost was not alone when the final night began. Someone deliberately trapped it inside the old hall.",
    words:[
      {wrong:"dor",correct:"door",hint:"You open this to enter a room"},
      {wrong:"lockt",correct:"locked",hint:"Closed with a key"},
      {wrong:"outsied",correct:"outside",hint:"Not inside"},
      {wrong:"hallwey",correct:"hallway",hint:"A passage between rooms"},
      {wrong:"trapt",correct:"trapped",hint:"Unable to escape"}
    ]
  },
  {
    numeral:"CHAPTER III",
    title:"The Missing Photograph",
    intro:"A photograph slides from beneath the table. Every face has been scratched away except one.",
    clue:"THE PHOTOGRAPH SHOWED THREE CHILDREN.",
    narrative:"The ghost was one of three children. The other two survived, but somebody tried to erase proof that they were all together.",
    words:[
      {wrong:"foto",correct:"photo",hint:"Short for photograph"},
      {wrong:"childern",correct:"children",hint:"More than one child"},
      {wrong:"togeather",correct:"together",hint:"With one another"},
      {wrong:"pictrue",correct:"picture",hint:"An image"},
      {wrong:"remmember",correct:"remember",hint:"Keep something in your memory"}
    ]
  },
  {
    numeral:"CHAPTER IV",
    title:"The Basement Tape",
    intro:"A cassette recorder on the shelf clicks on. Beneath the static, a child whispers a sentence over and over.",
    clue:"WE HEARD SOMEONE WALKING BELOW US.",
    narrative:"There was another person in the building. The footsteps came from the basement, even though the basement was supposed to be empty.",
    words:[
      {wrong:"basment",correct:"basement",hint:"A room below a building"},
      {wrong:"footstpes",correct:"footsteps",hint:"Sounds made while walking"},
      {wrong:"belowe",correct:"below",hint:"Underneath"},
      {wrong:"heerd",correct:"heard",hint:"Past tense of hear"},
      {wrong:"somone",correct:"someone",hint:"An unknown person"}
    ]
  },
  {
    numeral:"CHAPTER V",
    title:"The Last Warning",
    intro:"The candles turn blue. The ghost is no longer pointing at the slate. It is pointing behind you.",
    clue:"OUR FRIEND TOLD US NEVER TO OPEN THE RED DOOR.",
    narrative:"The children had been warned. One of them ignored the warning and opened a sealed red door in the basement.",
    words:[
      {wrong:"warnning",correct:"warning",hint:"A message about danger"},
      {wrong:"openn",correct:"open",hint:"Not closed"},
      {wrong:"reded",correct:"red",hint:"A color"},
      {wrong:"nevver",correct:"never",hint:"Not at any time"},
      {wrong:"dangerus",correct:"dangerous",hint:"Likely to cause harm"}
    ]
  },
  {
    numeral:"CHAPTER VI",
    title:"What Was Behind the Door",
    intro:"The table begins to shake. One final message appears, letter by letter, while something scratches from inside the walls.",
    clue:"I DID NOT DIE HERE. I WAS TAKEN THROUGH THE DOOR.",
    narrative:"The mystery changes completely. The ghost says this room was not where it died. The red basement door was a passage, and something on the other side took it.",
    words:[
      {wrong:"throu",correct:"through",hint:"From one side to another"},
      {wrong:"diedd",correct:"died",hint:"Stopped living"},
      {wrong:"taken",correct:"taken",hint:"Carried away"},
      {wrong:"anothar",correct:"another",hint:"One more or different"},
      {wrong:"becaus",correct:"because",hint:"For the reason that"},
      {wrong:"disapeared",correct:"disappeared",hint:"Vanished"},
      {wrong:"mistery",correct:"mystery",hint:"Something unexplained"}
    ]
  }
];

function resetGame(name){
  state={
    name,chapter:0,word:0,correct:0,wrong:0,
    startedAt:Date.now(),finished:false,recovered:[]
  };
  startScreen.classList.add("hidden");
  gradesScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  chapterScreen.classList.add("hidden");
  gameUI.classList.remove("hidden");
  hud.classList.remove("hidden");
  hudName.textContent=name;
  loadChapter();
}

function loadChapter(){
  const ch=chapters[state.chapter];
  state.word=0;
  state.recovered=[];
  chapterLabel.textContent=ch.numeral;
  chapterTitle.textContent=ch.title;
  chapterIntro.textContent=ch.intro;
  hudChapter.textContent=`${state.chapter+1} / ${chapters.length}`;
  recoveredMessage.textContent="_ ".repeat(ch.words.length).trim();
  updateWord();
  updateHUD();
  answerInput.focus();
}

function updateWord(){
  const ch=chapters[state.chapter];
  const item=ch.words[state.word];
  wrongWord.textContent=item.wrong;
  wordHint.textContent=`Hint: ${item.hint}`;
  answerInput.value="";
  feedback.textContent="";
  feedback.className="feedback";
  wordProgress.textContent=`Word ${state.word+1} of ${ch.words.length}`;
  progressBar.style.width=`${(state.word/ch.words.length)*100}%`;

  const shown=ch.words.map((w,i)=> i<state.word ? w.correct : "_____");
  recoveredMessage.textContent=shown.join(" ");
}

answerForm.addEventListener("submit",e=>{
  e.preventDefault();
  submitAnswer();
});

function normalize(s){
  return s.trim().toLowerCase().replace(/\s+/g," ");
}

function submitAnswer(){
  const ch=chapters[state.chapter];
  const item=ch.words[state.word];
  const value=normalize(answerInput.value);
  if(!value){answerInput.focus();return}

  if(value===normalize(item.correct)){
    state.correct++;
    feedback.textContent="Correct. The ghost writes another word.";
    feedback.className="feedback good";
    state.word++;
    updateHUD();

    if(state.word>=ch.words.length){
      progressBar.style.width="100%";
      recoveredMessage.textContent=ch.words.map(w=>w.correct).join(" ");
      setTimeout(()=>completeChapter(),500);
    }else{
      setTimeout(()=>{
        updateWord();
        answerInput.focus();
      },300);
    }
  }else{
    state.wrong++;
    feedback.textContent="Wrong. The candles dim. Something moves closer.";
    feedback.className="feedback bad";
    updateHUD();
    triggerHaunt();
    answerInput.select();
  }
}

function updateHUD(){
  const total=state.correct+state.wrong;
  const acc=total?Math.round(state.correct/total*100):100;
  hudAccuracy.textContent=`${acc}%`;

  const w=state.wrong;
  let label="CALM",cls="safe";
  if(w>=2){label="WATCHING";cls=""}
  if(w>=4){label="NEAR";cls=""}
  if(w>=7){label="ANGRY";cls=""}
  if(w>=10){label="DANGER";cls=""}
  if(w>=14){label="DON'T LOOK";cls=""}
  hudHaunting.textContent=label;
  hudHaunting.className="hud-value "+cls;
  hudHaunting.style.color = w>=10 ? "#ff6262" : w>=4 ? "#e0a36d" : w>=2 ? "#d3c47d" : "#abffb4";

  const level=Math.min(6,Math.floor(w/2)+1);
  document.body.className=document.body.className.replace(/\bhaunt-\d\b/g,"").trim();
  if(w>0)document.body.classList.add(`haunt-${level}`);
}

function triggerHaunt(){
  const w=state.wrong;
  if(w>0 && w%3===0){
    document.body.animate(
      [{filter:"none"},{filter:"contrast(1.8) invert(.08) hue-rotate(25deg)"},{filter:"none"}],
      {duration:260}
    );
  }
  if(w===6||w===11||w===15){
    briefJumpscare();
  }
}

function briefJumpscare(){
  jumpscare.classList.remove("hidden");
  setTimeout(()=>jumpscare.classList.add("hidden"),220);
}

function completeChapter(){
  const ch=chapters[state.chapter];
  gameUI.classList.add("hidden");
  hud.classList.add("hidden");
  chapterCompleteTitle.textContent=ch.title;
  chapterClue.textContent=ch.clue;
  chapterNarrative.textContent=ch.narrative;
  chapterScreen.classList.remove("hidden");

  if(state.chapter===chapters.length-1){
    nextChapterBtn.textContent="Reveal the Truth";
  }else{
    nextChapterBtn.textContent="Continue to Next Chapter";
  }
}

nextChapterBtn.onclick=()=>{
  chapterScreen.classList.add("hidden");
  if(state.chapter>=chapters.length-1){
    finishGame();
  }else{
    state.chapter++;
    gameUI.classList.remove("hidden");
    hud.classList.remove("hidden");
    loadChapter();
  }
};

function finishGame(){
  if(state.finished)return;
  state.finished=true;
  const total=state.correct+state.wrong;
  const score=total?Math.round(state.correct/total*100):0;
  const grade=letterGrade(score);
  const elapsed=Math.max(1,Math.round((Date.now()-state.startedAt)/1000));

  saveGrade({
    name:state.name,grade,score,correct:state.correct,wrong:state.wrong,
    chapter:state.chapter+1,result:"Mystery solved",seconds:elapsed,date:new Date().toLocaleString()
  });

  bigGrade.textContent=grade;
  finalMystery.textContent=
    "The spirit was one of three children who met in the old building. Someone locked them in, and a forbidden red basement door was opened. The ghost says it did not die in the séance room — it was taken somewhere through that door. The final clue suggests the haunting is not asking for revenge. It is asking you to find where the door leads.";
  resultStats.innerHTML=
    `<b>${esc(state.name)}</b><br>`+
    `Score: <b>${score}%</b> &nbsp; • &nbsp; Correct: <b>${state.correct}</b> &nbsp; • &nbsp; Wrong: <b>${state.wrong}</b><br>`+
    `Chapters completed: <b>${chapters.length}/${chapters.length}</b> &nbsp; • &nbsp; Time: <b>${formatTime(elapsed)}</b>`;
  resultScreen.classList.remove("hidden");
}

function letterGrade(s){return s>=90?"A":s>=80?"B":s>=70?"C":s>=60?"D":"F"}
function formatTime(sec){return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`}

const GRADE_KEY="spellingSeanceGrades_v1";
function getGrades(){
  try{return JSON.parse(localStorage.getItem(GRADE_KEY)||"[]")}catch{return []}
}
function saveGrade(row){
  const rows=getGrades();rows.unshift(row);
  localStorage.setItem(GRADE_KEY,JSON.stringify(rows.slice(0,100)));
}
function esc(v){
  return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function renderGrades(){
  const rows=getGrades();gradesBody.innerHTML="";
  if(!rows.length){
    gradesBody.innerHTML='<tr><td colspan="7" style="color:#918997">No saved séances yet.</td></tr>';return;
  }
  for(const r of rows){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${esc(r.name)}</td><td><strong>${esc(r.grade)}</strong></td><td>${r.score}%</td><td>${r.wrong}</td><td>${r.chapter}</td><td>${esc(r.result)}</td><td>${esc(r.date)}</td>`;
    gradesBody.appendChild(tr);
  }
}
function showGrades(){
  renderGrades();
  startScreen.classList.add("hidden");
  resultScreen.classList.add("hidden");
  gradesScreen.classList.remove("hidden");
}
function exportCSV(){
  const rows=getGrades();
  const headers=["Name","Grade","Score","Correct","Wrong","Chapter","Result","Seconds","Date"];
  const csv=[headers.join(",")].concat(rows.map(r=>[
    r.name,r.grade,r.score,r.correct,r.wrong,r.chapter,r.result,r.seconds,r.date
  ].map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(","))).join("\n");
  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="spelling-seance-grades.csv";a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

document.getElementById("startBtn").onclick=()=>{
  const name=studentName.value.trim();
  if(!name){showToast("Enter a student name first.",true);studentName.focus();return}
  resetGame(name);
};
document.getElementById("gradesBtn").onclick=showGrades;
document.getElementById("closeGrades").onclick=()=>{
  gradesScreen.classList.add("hidden");startScreen.classList.remove("hidden");
};
document.getElementById("exportGrades").onclick=exportCSV;
document.getElementById("clearGrades").onclick=()=>{
  if(confirm("Clear every saved grade from this browser?")){
    localStorage.removeItem(GRADE_KEY);renderGrades();
  }
};
document.getElementById("playAgain").onclick=()=>{
  resultScreen.classList.add("hidden");
  startScreen.classList.remove("hidden");
  studentName.value=state.name||"";
  document.body.className="";
};
document.getElementById("resultGrades").onclick=showGrades;

function showToast(text,danger=false){
  toast.textContent=text;toast.className="toast"+(danger?" danger":"");
  clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>toast.classList.add("hidden"),2200);
}

function resize(){
  const dpr=Math.min(devicePixelRatio||1,1.4);
  canvas.width=Math.floor(innerWidth*dpr);
  canvas.height=Math.floor(innerHeight*dpr);
}
addEventListener("resize",resize);resize();

function drawRoom(t){
  animationTime=t||0;
  const w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);

  // wall
  const wall=ctx.createLinearGradient(0,0,0,h);
  wall.addColorStop(0,"#15101a");
  wall.addColorStop(.62,"#0d0a11");
  wall.addColorStop(1,"#08070a");
  ctx.fillStyle=wall;ctx.fillRect(0,0,w,h);

  // wallpaper vertical panels
  for(let x=0;x<w;x+=Math.max(55,w/18)){
    ctx.fillStyle="rgba(105,85,116,.035)";
    ctx.fillRect(x,0,2,h*.66);
  }

  // old wood floor
  const floorY=h*.63;
  const floor=ctx.createLinearGradient(0,floorY,0,h);
  floor.addColorStop(0,"#171018");floor.addColorStop(1,"#080609");
  ctx.fillStyle=floor;ctx.fillRect(0,floorY,w,h-floorY);
  for(let y=floorY;y<h;y+=Math.max(10,h/50)){
    ctx.fillStyle="rgba(120,85,78,.045)";ctx.fillRect(0,y,w,2);
  }
  const cx=w/2;
  for(let x=-w;x<w*2;x+=Math.max(70,w/15)){
    ctx.strokeStyle="rgba(115,80,74,.05)";
    ctx.beginPath();ctx.moveTo(cx+(x-cx)*.22,floorY);ctx.lineTo(x,h);ctx.stroke();
  }

  // back wall frame / mirror
  ctx.strokeStyle="rgba(126,100,137,.20)";
  ctx.lineWidth=Math.max(2,w/450);
  ctx.strokeRect(w*.37,h*.14,w*.26,h*.28);
  const mg=ctx.createRadialGradient(cx,h*.27,10,cx,h*.27,w*.18);
  mg.addColorStop(0,"rgba(116,88,134,.08)");
  mg.addColorStop(1,"rgba(0,0,0,.02)");
  ctx.fillStyle=mg;ctx.fillRect(w*.37,h*.14,w*.26,h*.28);

  // round séance table
  ctx.fillStyle="#140d13";
  ctx.beginPath();
  ctx.ellipse(cx,h*.76,w*.27,h*.095,0,0,Math.PI*2);
  ctx.fill();
  ctx.strokeStyle="rgba(144,102,129,.12)";
  ctx.lineWidth=3;
  ctx.stroke();

  // occult chalk circle
  ctx.strokeStyle="rgba(183,156,197,.07)";
  ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(cx,h*.76,w*.17,h*.055,0,0,Math.PI*2);ctx.stroke();
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    const x1=cx+Math.cos(a)*w*.17,y1=h*.76+Math.sin(a)*h*.055;
    const x2=cx+Math.cos(a+Math.PI*2/3)*w*.17,y2=h*.76+Math.sin(a+Math.PI*2/3)*h*.055;
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }

  // subtle pulse with wrong answers
  const wrong=state.wrong||0;
  if(wrong){
    const p=(Math.sin(animationTime/220)+1)/2;
    ctx.fillStyle=`rgba(85,0,55,${Math.min(.12,wrong*.006)*p})`;
    ctx.fillRect(0,0,w,h);
  }

  requestAnimationFrame(drawRoom);
}
requestAnimationFrame(drawRoom);

})();
