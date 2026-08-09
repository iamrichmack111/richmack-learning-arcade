(() => {
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const names = ["Maya","Jordan","Avery","Noah","Sofia","Malik","Zoe","Eli","Liam","Nia","Cam","Ari"];
const avatars = ["🧑🏽‍🦱","👩🏻‍🦰","👨🏿‍🦱","👩🏽","🧔🏻","👩🏿‍🦱","👦🏽","👩🏼","🧑🏾","👨🏻‍🦱"];
const foods = ["🍕","🥛","🌮","🥞","🍓","🍪","🥪","🍲","🧁","🍋"];

let difficulty = "easy";
let state = {
  player:"Chef", money:0, score:0, streak:0, bestStreak:0, level:1, xp:0,
  correct:0, orders:0, completed:0, question:null, selected:null, timer:null, patience:100,
  upgrades: new Set(), startTime:0
};

const shop = [
  {id:"paint-red", name:"Red Paint", cost:25, emoji:"🔴", desc:"Give your truck a bold red finish.", className:"truck-red"},
  {id:"paint-green", name:"Fresh Green Paint", cost:40, emoji:"🟢", desc:"A bright farmers-market look.", className:"truck-green"},
  {id:"paint-gold", name:"Golden Truck", cost:100, emoji:"✨", desc:"Show everyone you are a fraction master.", className:"truck-gold"},
  {id:"fast-service", name:"Faster Kitchen", cost:60, emoji:"⚡", desc:"+25% customer patience time.", bonus:"patience"},
  {id:"tip-jar", name:"Super Tip Jar", cost:75, emoji:"🫙", desc:"+$2 tip on every correct order.", bonus:"tips"},
  {id:"double-xp", name:"Math Booster", cost:90, emoji:"🧠", desc:"+50% XP from correct answers.", bonus:"xp"}
];

function gcd(a,b){ while(b){[a,b]=[b,a%b]} return a; }
function simplify(n,d){ const g=gcd(n,d); return [n/g,d/g]; }
function rand(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function frac(n,d){ return `${n}/${d}`; }
function money(n){ return `$${Math.max(0,Math.round(n))}`; }

function saveBest(){
  const acc = state.orders ? Math.round(state.correct/state.orders*100) : 0;
  const grade = gradeFrom(acc);
  const prev = JSON.parse(localStorage.getItem("fft-best") || '{"money":0,"score":0,"grade":"—","acc":0}');
  const next = {
    money: Math.max(prev.money||0,state.money),
    score: Math.max(prev.score||0,state.score),
    acc: Math.max(prev.acc||0,acc),
    grade: (acc >= (prev.acc||0)) ? grade : (prev.grade||"—")
  };
  localStorage.setItem("fft-best", JSON.stringify(next));
  renderBest();
}
function renderBest(){
  const b = JSON.parse(localStorage.getItem("fft-best") || '{"money":0,"score":0,"grade":"—"}');
  $("#bestMoney").textContent = money(b.money||0);
  $("#bestScore").textContent = b.score||0;
  $("#bestGrade").textContent = b.grade||"—";
}
function gradeFrom(a){ return a>=90?"A":a>=80?"B":a>=70?"C":a>=60?"D":"F"; }

function setScreen(id){
  $$(".screen").forEach(s=>s.classList.remove("active"));
  $(id).classList.add("active");
}
function updateHUD(){
  $("#money").textContent=money(state.money);
  $("#score").textContent=state.score;
  $("#streak").textContent=state.streak;
  $("#level").textContent=state.level;
  $("#xpText").textContent=`${state.xp} / 100`;
  $("#xpBar").style.width=`${state.xp}%`;
}
function randomWrongFractions(correctN,correctD){
  const values = new Set([frac(correctN,correctD)]);
  let guard=0;
  while(values.size<4 && guard++<100){
    let d=Math.max(2, correctD + rand(-2,3));
    let n=Math.max(1, Math.min(d-1, correctN + rand(-2,3)));
    const s=simplify(n,d);
    values.add(frac(s[0],s[1]));
  }
  return [...values].sort(()=>Math.random()-.5);
}
function makeFractionQuestion(){
  const d = pick(difficulty==="easy"?[2,3,4,5,6,8]:[3,4,5,6,8,10,12]);
  const n = rand(1,d-1);
  const food = pick(["🍕","🥞","🥪","🧁"]);
  const item = {"🍕":"pizza","🥞":"stack of pancakes","🥪":"sandwich tray","🧁":"batch of cupcakes"}[food];
  const [sn,sd] = simplify(n,d);
  return {
    kind:"fraction", type:"FRACTION ORDER", icon:food,
    text:`${pick(names)} wants ${n}/${d} of a ${item}. Which fraction represents the amount to serve?`,
    answer:frac(sn,sd), options:randomWrongFractions(sn,sd),
    visual:{n,d}
  };
}
function makeEquivalentQuestion(){
  const baseD=pick([2,3,4,5,6]);
  const baseN=rand(1,baseD-1);
  const mult=pick([2,3,4]);
  const n=baseN*mult,d=baseD*mult;
  const [sn,sd]=simplify(n,d);
  let opts=new Set([frac(sn,sd)]);
  while(opts.size<4){
    const dd=pick([2,3,4,5,6,8,10,12]);
    const nn=rand(1,Math.max(1,dd-1));
    const s=simplify(nn,dd); opts.add(frac(s[0],s[1]));
  }
  return {kind:"fraction",type:"SIMPLIFY IT",icon:"🍪",
    text:`A cookie tray recipe uses ${n}/${d} of a bag of flour. What is that fraction in simplest form?`,
    answer:frac(sn,sd),options:[...opts].sort(()=>Math.random()-.5),visual:{n,d}
  };
}
function makeRatioQuestion(){
  const a=rand(1,5), b=rand(1,6), multiplier=rand(2,5);
  const askA=Math.random()<.5;
  const known=askA?b*multiplier:a*multiplier;
  const ans=askA?a*multiplier:b*multiplier;
  const ingredientA=pick(["scoops of rice","spoons of salsa","cups of flour","slices of cheese"]);
  const ingredientB=pick(["scoops of beans","spoons of guacamole","cups of milk","tomato slices"]);
  const text=askA
    ? `The recipe ratio is ${a}:${b} for ${ingredientA} to ${ingredientB}. If you use ${known} ${ingredientB}, how many ${ingredientA} do you need?`
    : `The recipe ratio is ${a}:${b} for ${ingredientA} to ${ingredientB}. If you use ${known} ${ingredientA}, how many ${ingredientB} do you need?`;
  let opts=new Set([ans]);
  while(opts.size<4) opts.add(Math.max(1,ans+rand(-5,5)));
  return {kind:"number",type:"RATIO RECIPE",icon:"🌮",text,answer:String(ans),options:[...opts].map(String).sort(()=>Math.random()-.5),visual:{a,b,ingredientA,ingredientB}};
}
function makeMeasureQuestion(){
  const d=pick([2,4,8]);
  const n=rand(1,d-1);
  const mult=pick([2,3,4]);
  const totalN=n*mult;
  const [sn,sd]=simplify(totalN,d);
  const whole=Math.floor(sn/sd), rem=sn%sd;
  const ans= rem===0 ? String(whole) : (whole?`${whole} ${rem}/${sd}`:`${rem}/${sd}`);
  const choices=new Set([ans]);
  while(choices.size<4){
    const wn=Math.max(0,whole+rand(-1,1));
    const rn=rand(0,sd-1);
    const v=rn===0?String(wn):(wn?`${wn} ${rn}/${sd}`:`${rn}/${sd}`);
    choices.add(v);
  }
  return {kind:"mixed",type:"MEASURE & SCALE",icon:"🥛",
    text:`One smoothie uses ${n}/${d} cup of milk. How many cups are needed for ${mult} smoothies?`,
    answer:ans,options:[...choices].sort(()=>Math.random()-.5),visual:{n,d,mult}
  };
}
function makeHardScaleQuestion(){
  const serves=pick([2,3,4]);
  const target=serves*pick([2,3]);
  const d=pick([2,3,4]);
  const n=rand(1,d);
  const scaledN=n*(target/serves);
  const [sn,sd]=simplify(scaledN,d);
  const whole=Math.floor(sn/sd), rem=sn%sd;
  const ans=rem===0?String(whole):(whole?`${whole} ${rem}/${sd}`:`${rem}/${sd}`);
  let choices=new Set([ans]);
  while(choices.size<4){
    const wrongNum=Math.max(1,scaledN+rand(-3,3));
    const s=simplify(wrongNum,d),w=Math.floor(s[0]/s[1]),r=s[0]%s[1];
    choices.add(r===0?String(w):(w?`${w} ${r}/${s[1]}`:`${r}/${s[1]}`));
  }
  return {kind:"mixed",type:"RECIPE SCALING",icon:"🍲",
    text:`A soup recipe serves ${serves} and uses ${n}/${d} cup of broth concentrate. You need ${target} servings. How many cups do you use?`,
    answer:ans,options:[...choices].sort(()=>Math.random()-.5),visual:{n,d,mult:target/serves}
  };
}
function newQuestion(){
  if(state.completed >= 15){ endShift(); return; }
  state.selected=null;
  state.orders = state.completed + 1;
  const pool = difficulty==="easy"
    ? [makeFractionQuestion,makeEquivalentQuestion]
    : difficulty==="medium"
      ? [makeFractionQuestion,makeEquivalentQuestion,makeRatioQuestion,makeMeasureQuestion]
      : [makeEquivalentQuestion,makeRatioQuestion,makeMeasureQuestion,makeHardScaleQuestion];
  state.question=pick(pool)();
  $("#orderNumber").textContent=`${state.orders} / 15`;
  $("#questionType").textContent=state.question.type;
  $("#foodIcon").textContent=state.question.icon;
  $("#orderText").textContent=state.question.text;
  $("#feedback").textContent=""; $("#feedback").className="feedback";
  renderVisual(); renderAnswers();
  $("#customerName").textContent=pick(names);
  $("#customerAvatar").textContent=pick(avatars);
  startPatience();
}
function renderVisual(){
  const q=state.question,v=q.visual,el=$("#visualModel");
  if(q.type==="RATIO RECIPE"){
    el.innerHTML=`<div class="ratio-chip">${v.a}<em>part A</em></div><div style="font-size:30px">:</div><div class="ratio-chip">${v.b}<em>part B</em></div>`;
  } else if(q.type==="MEASURE & SCALE"||q.type==="RECIPE SCALING"){
    const cups=Math.min(4,v.mult);
    el.innerHTML=`<div class="measure-row">${Array.from({length:cups},(_,i)=>`<div><div class="cup"><div class="cup-fill" style="height:${Math.min(100,(v.n/v.d)*100)}%"></div></div><div class="cup-label">${v.n}/${v.d}</div></div>`).join("")}</div><div class="ratio-chip">× ${v.mult}<em>recipe scale</em></div>`;
  } else {
    const pct=Math.round(v.n/v.d*100);
    el.innerHTML=`<div class="fraction-circle" style="--fill:${pct}%" data-label="${v.n}/${v.d}"></div><div class="ratio-chip">${v.n}<em>parts used</em></div><div class="ratio-chip">${v.d}<em>equal parts</em></div>`;
  }
}
function renderAnswers(){
  const el=$("#answerArea");
  el.innerHTML=`<div class="answers-grid">${state.question.options.map(o=>`<button class="answer-btn" data-answer="${o}">${o}</button>`).join("")}</div>`;
  $$(".answer-btn").forEach(b=>b.onclick=()=>{
    $$(".answer-btn").forEach(x=>x.classList.remove("selected"));
    b.classList.add("selected"); state.selected=b.dataset.answer;
  });
}
function patienceDuration(){
  const base=difficulty==="easy"?26:difficulty==="medium"?31:36;
  return state.upgrades.has("fast-service")?base*1.25:base;
}
function startPatience(){
  clearInterval(state.timer); state.patience=100; updatePatience();
  const duration=patienceDuration(), tick=250, step=100/(duration*1000/tick);
  state.timer=setInterval(()=>{
    state.patience=Math.max(0,state.patience-step); updatePatience();
    if(state.patience<=0){ clearInterval(state.timer); timeoutOrder(); }
  },tick);
}
function updatePatience(){
  $("#patienceBar").style.width=`${state.patience}%`;
  $("#patienceText").textContent=`${Math.ceil(state.patience)}%`;
  const tip=Math.max(0,Math.ceil(state.patience/25)+(state.upgrades.has("tip-jar")?2:0));
  $("#tipValue").textContent=money(tip);
}
function timeoutOrder(){
  state.completed++;
  state.streak=0; state.selected=null;
  $("#feedback").textContent=`Customer left! Correct answer: ${state.question.answer}`;
  $("#feedback").className="feedback bad";
  updateHUD();
  setTimeout(()=> state.completed >= 15 ? endShift() : newQuestion(),1200);
}
function addXP(amount){
  if(state.upgrades.has("double-xp")) amount=Math.round(amount*1.5);
  state.xp+=amount;
  while(state.xp>=100){ state.xp-=100; state.level++; state.money+=10; }
}
function submit(){
  if(!state.selected){
    $("#feedback").textContent="Choose an answer first.";
    $("#feedback").className="feedback bad"; return;
  }
  clearInterval(state.timer);
  const correct=state.selected===state.question.answer;
  state.completed++;
  if(correct){
    state.correct++; state.streak++; state.bestStreak=Math.max(state.bestStreak,state.streak);
    const base=difficulty==="easy"?5:difficulty==="medium"?7:10;
    const tip=Math.max(0,Math.ceil(state.patience/25)+(state.upgrades.has("tip-jar")?2:0));
    const streakBonus=Math.min(5,Math.floor(state.streak/3));
    const earned=base+tip+streakBonus;
    state.money+=earned; state.score+=100+state.streak*10; addXP(18);
    $("#feedback").textContent=`Correct! +${money(earned)} • +${100+state.streak*10} points`;
    $("#feedback").className="feedback good";
    $("#money").parentElement.classList.add("pop"); setTimeout(()=>$("#money").parentElement.classList.remove("pop"),350);
  }else{
    state.streak=0; state.score=Math.max(0,state.score-25);
    $("#feedback").textContent=`Not quite. Correct answer: ${state.question.answer}`;
    $("#feedback").className="feedback bad";
    $(".order-card").classList.add("shake"); setTimeout(()=>$(".order-card").classList.remove("shake"),350);
  }
  updateHUD();
  setTimeout(()=> state.completed >= 15 ? endShift() : newQuestion(),1100);
}
function openShop(){
  clearInterval(state.timer);
  renderShop(); $("#shopModal").classList.remove("hidden");
}
function closeShop(){
  $("#shopModal").classList.add("hidden");
  if($("#gameScreen").classList.contains("active")) startPatience();
}
function renderShop(){
  $("#shopItems").innerHTML=shop.map(item=>{
    const owned=state.upgrades.has(item.id);
    const can=state.money>=item.cost;
    return `<div class="shop-item"><div class="emoji">${item.emoji}</div><h3>${item.name}</h3><p>${item.desc}</p><button data-buy="${item.id}" ${owned||!can?"disabled":""}>${owned?"Owned":money(item.cost)}</button></div>`;
  }).join("");
  $$("[data-buy]").forEach(b=>b.onclick=()=>buy(b.dataset.buy));
}
function buy(id){
  const item=shop.find(x=>x.id===id);
  if(!item||state.upgrades.has(id)||state.money<item.cost)return;
  state.money-=item.cost; state.upgrades.add(id);
  if(item.className){
    ["truck-blue","truck-red","truck-green","truck-gold"].forEach(c=>{$("#truckGame").classList.remove(c);$("#truckStart").classList.remove(c)});
    $("#truckGame").classList.add(item.className); $("#truckStart").classList.add(item.className);
  }
  updateHUD(); renderShop();
}
function start(){
  const name=$("#playerName").value.trim()||"Chef";
  state={player:name,money:0,score:0,streak:0,bestStreak:0,level:1,xp:0,correct:0,orders:0,completed:0,question:null,selected:null,timer:null,patience:100,upgrades:new Set(),startTime:Date.now()};
  ["truck-red","truck-green","truck-gold"].forEach(c=>{$("#truckGame").classList.remove(c);$("#truckStart").classList.remove(c)});
  $("#truckGame").classList.add("truck-blue");$("#truckStart").classList.add("truck-blue");
  setScreen("#gameScreen"); updateHUD(); newQuestion();
}
function endShift(){
  clearInterval(state.timer);
  const orders=Math.max(1,state.completed);
  const acc=Math.round(state.correct/orders*100);
  const grade=gradeFrom(acc);
  $("#gradeBadge").textContent=grade;
  $("#resultTitle").textContent=`${grade==="A"?"Outstanding":grade==="B"?"Great job":grade==="C"?"Good shift":grade==="D"?"Keep practicing":"Practice makes progress"}, ${state.player}!`;
  $("#resultSummary").textContent=`You completed a Fraction Food Truck shift on ${difficulty} difficulty.`;
  $("#rCorrect").textContent=state.correct;
  $("#rOrders").textContent=orders;
  $("#rAccuracy").textContent=`${acc}%`;
  $("#rMoney").textContent=money(state.money);
  $("#rStreak").textContent=state.bestStreak;
  $("#rLevel").textContent=state.level;
  saveBest(); setScreen("#resultsScreen");
}
function exportGrade(){
  const orders=Math.max(1,state.completed);
  const acc=Math.round(state.correct/orders*100),grade=gradeFrom(acc);
  const now=new Date();
  const text=[
    "FRACTION FOOD TRUCK — GRADE REPORT",
    "==================================",
    `Student: ${state.player}`,
    `Date: ${now.toLocaleString()}`,
    `Difficulty: ${difficulty}`,
    "",
    `Grade: ${grade}`,
    `Correct Answers: ${state.correct}`,
    `Orders Attempted: ${orders}`,
    `Accuracy: ${acc}%`,
    `Score: ${state.score}`,
    `Money Earned: ${money(state.money)}`,
    `Best Streak: ${state.bestStreak}`,
    `Truck Level: ${state.level}`,
    "",
    "Skills practiced:",
    "- Fractions and equivalent fractions",
    "- Simplifying fractions",
    "- Ratios and proportional reasoning",
    "- Measurement and recipe scaling"
  ].join("\n");
  const blob=new Blob([text],{type:"text/plain"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`fraction-food-truck-${state.player.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-grade.txt`;
  a.click(); URL.revokeObjectURL(a.href);
}

$$(".difficulty").forEach(b=>b.onclick=()=>{
  $$(".difficulty").forEach(x=>x.classList.remove("selected")); b.classList.add("selected"); difficulty=b.dataset.difficulty;
});
$("#startBtn").onclick=start;
$("#submitBtn").onclick=submit;
$("#endBtn").onclick=endShift;
$("#shopBtn").onclick=openShop;
$("#closeShop").onclick=closeShop;
$("#playAgainBtn").onclick=()=>setScreen("#startScreen");
$("#exportBtn").onclick=exportGrade;
$("#shopModal").onclick=e=>{if(e.target.id==="shopModal")closeShop()};
document.addEventListener("keydown",e=>{
  if(e.key==="Enter" && $("#gameScreen").classList.contains("active") && $("#shopModal").classList.contains("hidden")) submit();
  if(["1","2","3","4"].includes(e.key) && $("#gameScreen").classList.contains("active")){
    const b=$$(".answer-btn")[+e.key-1]; if(b)b.click();
  }
});
renderBest();
})();