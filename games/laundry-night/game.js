const LOADS = [
  { id:'darks', name:'Darks', icon:'🖤', subject:'Math', skill:'multiplication', desc:'Dark clothes, jeans, hoodies and black shirts.' },
  { id:'whites', name:'Whites', icon:'🤍', subject:'Spelling', skill:'spelling', desc:'White shirts, socks and light basics.' },
  { id:'towels', name:'Towels', icon:'🛁', subject:'Math', skill:'addition', desc:'Bath towels, washcloths and hand towels.' },
  { id:'bedding', name:'Bedding', icon:'🛏️', subject:'Math', skill:'fractions', desc:'Sheets, pillowcases and blankets.' },
  { id:'kids', name:"Kids' Clothes", icon:'🧒', subject:'Spelling', skill:'spelling', desc:'Everyday clothes from the kids’ baskets.' },
  { id:'parents', name:"Parents' Clothes", icon:'👕', subject:'Math', skill:'mixed', desc:'Adult shirts, pants and everyday clothing.' },
  { id:'kitchen', name:'Kitchen Towels', icon:'🍽️', subject:'Spelling', skill:'spelling', desc:'Dish towels, cloths and kitchen linens.' },
  { id:'delicates', name:'Delicates', icon:'🧺', subject:'Math', skill:'division', desc:'Gentle-cycle items and smaller loads.' }
];

const SPELLING = [
  ['because','Type the word: “We stayed inside ___ it was raining.”'],
  ['laundry','Type the word for clothes that need washing.'],
  ['basket','Type the word for a container that holds clothes.'],
  ['machine','Type the word: “washing ___”'],
  ['clean','Type the opposite of dirty.'],
  ['clothes','Type the word for shirts, pants, socks, and dresses.'],
  ['towel','Type the word used to dry yourself after a bath.'],
  ['blanket','Type the word used to keep warm in bed.'],
  ['family','Type the word for parents, children, and relatives.'],
  ['school','Type the place where students learn.'],
  ['night','Type the opposite of day.'],
  ['light','Type the word for something that makes a dark room visible.'],
  ['water','Type the liquid used in a washing machine.'],
  ['shirt','Type the clothing item worn on your upper body.'],
  ['socks','Type the clothing worn on your feet under shoes.'],
  ['quiet','Type the opposite of noisy.'],
  ['shadow','Type the dark shape made when light is blocked.'],
  ['window','Type the glass opening in a wall.'],
  ['floor','Type the surface you walk on indoors.'],
  ['door','Type what you open to enter a room.']
];

const $ = (s)=>document.querySelector(s);
const screens = [...document.querySelectorAll('.screen')];
let state = {
  player:'', daily:[], currentLoad:null, qIndex:0, correct:0, wrong:0,
  questions:[], danger:0, sound:true
};

function show(id){ screens.forEach(s=>s.classList.toggle('active', s.id===id)); }
function storageGet(k, fallback){ try{return JSON.parse(localStorage.getItem(k)) ?? fallback}catch{return fallback} }
function storageSet(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
function dateKey(d=new Date()){ return d.toISOString().slice(0,10); }
function prettyDate(s){ return new Date(s+'T12:00:00').toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }

function tickClock(){ $('#clock').textContent=new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); }
setInterval(tickClock,1000); tickClock();

function beep(type='good'){
  if(!state.sound) return;
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type= type==='bad'?'sawtooth':'sine'; o.frequency.value=type==='bad'?92:420;
    g.gain.setValueAtTime(.06,ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.18);
    o.start(); o.stop(ctx.currentTime+.19);
  }catch{}
}

function seededRandom(seed){
  let h=2166136261; for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}
  return ()=>{ h+=0x6D2B79F5; let t=h; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
}

function chooseDaily(force=false){
  const today=dateKey();
  const saved=storageGet('laundryNightDaily',null);
  if(saved && saved.date===today && !force){ state.daily=saved.loads; return; }

  const history=storageGet('laundryNightHistory',[]);
  const lastDone={}; history.forEach(h=>{ if(!lastDone[h.loadId] || h.date>lastDone[h.loadId]) lastDone[h.loadId]=h.date; });
  const rng=seededRandom(today+(force?String(Date.now()):''));
  const weighted=LOADS.map(load=>{
    const last=lastDone[load.id];
    const days=last?Math.max(1,Math.floor((new Date(today)-new Date(last))/86400000)):14;
    return {load, weight:Math.min(20,4+days)};
  });
  const picks=[];
  while(picks.length<2 && weighted.length){
    const total=weighted.reduce((a,b)=>a+b.weight,0); let r=rng()*total; let idx=0;
    for(;idx<weighted.length;idx++){ r-=weighted[idx].weight; if(r<=0) break; }
    picks.push(weighted[Math.min(idx,weighted.length-1)].load.id); weighted.splice(Math.min(idx,weighted.length-1),1);
  }
  state.daily=picks.map(id=>({id,done:false,score:null,grade:null}));
  storageSet('laundryNightDaily',{date:today,loads:state.daily});
}

function renderDaily(){
  const cards=$('#loadCards'); cards.innerHTML='';
  const today=dateKey();
  state.daily.forEach((entry,i)=>{
    const load=LOADS.find(l=>l.id===entry.id);
    const el=document.createElement('article'); el.className='load-card'+(entry.done?' done':'');
    el.innerHTML=`<div class="load-icon">${load.icon}</div><h3>${load.name}</h3><p>${load.desc}</p>
      <div class="load-meta"><span>${load.subject}</span><span>${entry.done?`Grade ${entry.grade}`:'10 questions'}</span></div>
      <button class="${entry.done?'ghost-btn':'primary-btn'}" data-load="${load.id}" ${entry.done?'disabled':''}>${entry.done?'✓ COMPLETE':'BEGIN CHALLENGE'}</button>`;
    cards.appendChild(el);
  });
  cards.querySelectorAll('[data-load]').forEach(btn=>btn.addEventListener('click',()=>startChallenge(btn.dataset.load)));
  const done=state.daily.filter(x=>x.done).length;
  $('#dailyTitle').textContent=done===2?'Tonight’s laundry is decided.':done===1?'One basket remains.':'Two baskets were chosen.';
  $('#dailySub').textContent=done===2?'Both loads are ready to be washed.':'Pass each challenge to lock in today’s laundry.';
  $('#todaySummary').innerHTML=`<strong>${done}/2 loads unlocked</strong><span>${prettyDate(today)}</span>`;
  updateDanger();
}

function makeMathQuestion(skill){
  let a,b,answer,text;
  if(skill==='multiplication'){a=rand(2,12);b=rand(2,12);answer=a*b;text=`${a} × ${b} = ?`;}
  else if(skill==='addition'){a=rand(20,199);b=rand(10,99);answer=a+b;text=`${a} + ${b} = ?`;}
  else if(skill==='division'){b=rand(2,12);answer=rand(2,12);a=b*answer;text=`${a} ÷ ${b} = ?`;}
  else if(skill==='fractions'){
    const den=[2,3,4,5,6,8][rand(0,5)], n1=rand(1,den-1), n2=rand(1,den-1);
    const sum=n1+n2; text=`${n1}/${den} + ${n2}/${den} = ?`; answer=reduceFraction(sum,den);
    return {text,answer,hint:'Answer as a fraction, like 3/4. Whole numbers are okay.'};
  } else {
    const skills=['multiplication','addition','division']; return makeMathQuestion(skills[rand(0,skills.length-1)]);
  }
  return {text,answer:String(answer),hint:'Type the number and press Submit.'};
}
function reduceFraction(n,d){ const g=gcd(n,d); n/=g; d/=g; return d===1?String(n):`${n}/${d}`; }
function gcd(a,b){while(b){[a,b]=[b,a%b]}return a}
function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min}
function makeSpellingQuestion(){ const [answer,text]=SPELLING[rand(0,SPELLING.length-1)]; return {text,answer,hint:'Spelling counts. Capitalization does not.'}; }
function buildQuestions(load){ return Array.from({length:10},()=>load.subject==='Spelling'?makeSpellingQuestion():makeMathQuestion(load.skill)); }

function startChallenge(id){
  const load=LOADS.find(l=>l.id===id); state.currentLoad=load; state.qIndex=0; state.correct=0; state.wrong=0; state.questions=buildQuestions(load);
  $('#basketLabel').textContent=load.name.toUpperCase(); $('#subjectTag').textContent=load.subject.toUpperCase();
  $('#answerInput').value=''; $('#feedback').textContent=''; $('#feedback').className='feedback';
  show('challenge'); renderQuestion(); setTimeout(()=>$('#answerInput').focus(),100);
}
function renderQuestion(){
  const q=state.questions[state.qIndex];
  $('#questionText').textContent=q.text; $('#questionHint').textContent=q.hint||'';
  $('#progressText').textContent=`Question ${state.qIndex+1} / ${state.questions.length}`;
  $('#progressFill').style.width=`${((state.qIndex+1)/state.questions.length)*100}%`;
  $('#correctStat').textContent=state.correct; $('#wrongStat').textContent=state.wrong; $('#gradeStat').textContent=letterGrade(state.correct,state.qIndex||1);
  $('#answerInput').value='';
}
function normalizeAnswer(s){return s.trim().toLowerCase().replace(/\s+/g,' ')}
function submitAnswer(e){
  e.preventDefault(); const input=$('#answerInput'); const raw=normalizeAnswer(input.value); if(!raw)return;
  const q=state.questions[state.qIndex]; const ok=raw===normalizeAnswer(String(q.answer));
  if(ok){state.correct++; $('#feedback').textContent='✓ Correct. The washer grows quiet.'; $('#feedback').className='feedback correct'; beep('good');}
  else {state.wrong++; state.danger=Math.min(100,state.danger+14); $('#feedback').textContent=`✗ Wrong. Correct answer: ${q.answer}`; $('#feedback').className='feedback wrong'; $('#basketVisual').classList.add('shake'); setTimeout(()=>$('#basketVisual').classList.remove('shake'),350); beep('bad'); updateCreature();}
  $('#correctStat').textContent=state.correct; $('#wrongStat').textContent=state.wrong; $('#gradeStat').textContent=letterGrade(state.correct,state.qIndex+1);
  input.disabled=true;
  setTimeout(()=>{input.disabled=false; state.qIndex++; if(state.qIndex>=state.questions.length)finishChallenge(); else{renderQuestion();input.focus();}},800);
}
function percent(correct,total){return total?Math.round(correct/total*100):0}
function letterGrade(c,t){const p=percent(c,t); return p>=90?'A':p>=80?'B':p>=70?'C':p>=60?'D':'F'}
function finishChallenge(){
  const grade=letterGrade(state.correct,state.questions.length), score=percent(state.correct,state.questions.length);
  const entry=state.daily.find(x=>x.id===state.currentLoad.id); entry.done=true; entry.score=score; entry.grade=grade;
  storageSet('laundryNightDaily',{date:dateKey(),loads:state.daily});
  const history=storageGet('laundryNightHistory',[]); history.unshift({date:dateKey(),player:state.player||'Player',loadId:state.currentLoad.id,loadName:state.currentLoad.name,score,grade}); storageSet('laundryNightHistory',history.slice(0,120));
  $('#resultTitle').textContent=`${state.currentLoad.name} are chosen.`; $('#gradeOrb').textContent=grade; $('#resultScore').textContent=`${state.correct} / 10 correct — ${score}%`;
  $('#resultMessage').textContent=score>=70?'The basket seals. Add this load to today’s laundry.':'The basket still seals... but something in the wall heard every mistake.';
  show('result');
}
function updateDanger(){
  $('#dangerFill').style.width=state.danger+'%';
  const label=state.danger<20?'Quiet':state.danger<45?'Watching':state.danger<70?'Close':'Behind You';
  $('#dangerText').textContent=label;
  $('#dangerHint').textContent=state.danger<45?'Wrong answers make the room less safe.':state.danger<70?'You can hear breathing behind the machines.':'Do not look behind the dryer.';
  $('#monster').classList.toggle('visible',state.danger>55);
}
function updateCreature(){ $('#shadowCreature').style.opacity=String(.08 + state.danger/115); }
function renderHistory(){
  const history=storageGet('laundryNightHistory',[]), box=$('#historyList'); box.innerHTML='';
  if(!history.length){box.innerHTML='<div class="empty-state">No laundry has been completed yet.</div>';return;}
  history.forEach(h=>{ const row=document.createElement('div'); row.className='history-item'; row.innerHTML=`<div><strong>${h.loadName}</strong><br><small>${h.player} • ${prettyDate(h.date)}</small></div><div><strong>${h.grade}</strong><br><small>${h.score}%</small></div>`; box.appendChild(row); });
}

$('#startBtn').addEventListener('click',()=>{state.player=$('#playerName').value.trim()||'Player'; storageSet('laundryNightPlayer',state.player); chooseDaily(); renderDaily(); show('daily');});
$('#historyBtn').addEventListener('click',()=>{renderHistory();show('history')});
$('#historyBackBtn').addEventListener('click',()=>show('intro'));
$('#backHomeBtn').addEventListener('click',()=>show('intro'));
$('#answerForm').addEventListener('submit',submitAnswer);
$('#continueBtn').addEventListener('click',()=>{renderDaily();show('daily')});
$('#reshuffleBtn').addEventListener('click',()=>{ if(confirm('Reshuffle today’s loads? Completed results for today will be replaced.')){chooseDaily(true);state.danger=0;renderDaily();}});
$('#clearHistoryBtn').addEventListener('click',()=>{if(confirm('Delete all saved laundry history?')){localStorage.removeItem('laundryNightHistory');localStorage.removeItem('laundryNightDaily');renderHistory();}});
$('#soundBtn').addEventListener('click',()=>{state.sound=!state.sound;$('#soundBtn').textContent=state.sound?'🔊 Sound':'🔇 Muted';$('#soundBtn').setAttribute('aria-pressed',String(state.sound));});

const oldPlayer=storageGet('laundryNightPlayer',''); if(oldPlayer) $('#playerName').value=oldPlayer;
updateDanger();
