const games = [
  {title:'The Backrooms: Math Levels',slug:'backrooms-math-levels',mark:'🚪',tags:['horror','math'],desc:'Escape liminal levels by solving math problems.',colors:['#927532','#18160f'],image:'games/backrooms-math-levels/assets/backrooms-title-screen.png'},
  {title:'Dead Letter District',slug:'dead-letter-district',mark:'🧟',tags:['horror','spelling'],desc:'Zombie spelling survival in a dangerous district.',colors:['#4d6a43','#111811']},
  {title:'Equation Outbreak: Road Scholar',slug:'equation-outbreak',mark:'🚙',tags:['math','adventure'],desc:'Keep moving through an outbreak using math skills.',colors:['#c36b27','#1b1712']},
  {title:'Cabin 13',slug:'cabin-13',mark:'🌲',tags:['horror','math','adventure'],desc:'First-person survival horror in the woods.',colors:['#284b33','#090e0b']},
  {title:'Fraction Food Truck',slug:'fraction-food-truck',mark:'🍕',tags:['math'],desc:'Fill fraction-based orders and earn your grade.',colors:['#e79c45','#622d25']},
  {title:'Snow Calendar Rider 3D',slug:'snow-calendar-rider',mark:'🏂',tags:['adventure'],desc:'Ride through snow while collecting calendar words.',colors:['#63aada','#142637']},
  {title:'Laundry Night',slug:'laundry-night',mark:'🧺',tags:['horror','adventure'],desc:'A creepy late-night learning game in the laundry room.',colors:['#315371','#11161d'],image:'games/laundry-night/assets/laundry-night-gameplay.png'},
  {title:'Scary Elevator 3D',slug:'scary-elevator',mark:'🛗',tags:['horror','math','spelling'],desc:'Answer correctly to climb floors—and avoid the wrong stops.',colors:['#5c365d','#110d13'],image:'games/scary-elevator/screenshots/scary-elevator-3d-gameplay.png'},
  {title:'Lights Out',slug:'lights-out',mark:'🔦',tags:['horror','math'],desc:'Keep the darkness back with correct answers.',colors:['#35404e','#07090c']},
  {title:'The Abandoned School 3D',slug:'abandoned-school',mark:'🏫',tags:['horror','adventure'],desc:'Explore a deserted school and survive its lessons.',colors:['#59614d','#11130f'],image:'games/abandoned-school/assets/creature-hallway.png'},
  {title:'Math Heist',slug:'math-heist',mark:'💎',tags:['math','adventure'],desc:'Crack vaults, disable security and earn loot with math.',colors:['#735e2e','#17130b'],image:'games/math-heist/screenshots/math-heist-gameplay.png'},
  {title:'Color Current 3D',slug:'color-current',mark:'🐟',tags:['spelling','adventure'],desc:'Swim, collect fish and spell colors to grow.',colors:['#16778a','#071c24']},
  {title:'Clownword Desert',slug:'clownword-desert',mark:'🤡',tags:['spelling','adventure'],desc:'Cross the desert in a surreal word-learning challenge.',colors:['#ba6539','#291410']}
];

const grid=document.getElementById('gameGrid');
const search=document.getElementById('search');
const empty=document.getElementById('empty');
const resultsStatus=document.getElementById('resultsStatus');
let active='all';

const FAVORITES_KEY='richmack_arcade_favorites_v1';
const RECENT_KEY='richmack_arcade_recent_v1';

function readList(key){
  try{
    const value=JSON.parse(localStorage.getItem(key)||'[]');
    return Array.isArray(value)?value:[];
  }catch{
    return [];
  }
}

function writeList(key,value){
  try{
    localStorage.setItem(key,JSON.stringify(value));
  }catch{}
}

function favoriteIds(){
  return readList(FAVORITES_KEY);
}

function recentIds(){
  return readList(RECENT_KEY);
}

function toggleFavorite(slug){
  const current=favoriteIds();
  const next=current.includes(slug)
    ? current.filter(id=>id!==slug)
    : [slug,...current];

  writeList(FAVORITES_KEY,next);
  render();
}

function recordRecent(slug){
  const next=[slug,...recentIds().filter(id=>id!==slug)].slice(0,8);
  writeList(RECENT_KEY,next);
}

function card(g){
  const url=`games/${g.slug}/index.html`;
  const tags=g.tags.map(t=>`<span class="tag">${t}</span>`).join("");
  const isFavorite=favoriteIds().includes(g.slug);

  return `<article class="card" data-tags="${g.tags.join(" ")}" data-title="${g.title.toLowerCase()}">
    <div class="visual ${g.image?"has-image":""}" data-mark="${g.mark}" style="--c1:${g.colors[0]};--c2:${g.colors[1]};${g.image?`background-image:url('${g.image}');`:""}">
      <button class="favorite" type="button" data-favorite="${g.slug}" aria-pressed="${isFavorite}" aria-label="${isFavorite?"Remove":"Add"} ${g.title} ${isFavorite?"from":"to"} favorites" title="${isFavorite?"Remove from favorites":"Add to favorites"}">${isFavorite?"★":"☆"}</button>
    </div>
    <div class="card-body">
      <div class="meta">${tags}</div>
      <h3>${g.title}</h3>
      <p>${g.desc}</p>
      <div class="actions">
        <a class="play" data-play="${g.slug}" href="${url}">▶ PLAY</a>
        <a class="newtab" data-play="${g.slug}" href="${url}" target="_blank" rel="noopener" title="Open in new tab">↗</a>
      </div>
    </div>
  </article>`;
}
function render(){
  const q=search.value.trim().toLowerCase();
  const favorites=favoriteIds();
  const recent=recentIds();

  let filtered=games.filter(g=>{
    let matchesFilter=true;

    if(active==="favorites"){
      matchesFilter=favorites.includes(g.slug);
    }else if(active==="recent"){
      matchesFilter=recent.includes(g.slug);
    }else if(active!=="all"){
      matchesFilter=g.tags.includes(active);
    }

    const matchesSearch=
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.tags.some(t=>t.includes(q)) ||
      g.desc.toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  if(active==="recent"){
    const order=new Map(recent.map((slug,index)=>[slug,index]));
    filtered.sort(
      (a,b)=>(order.get(a.slug)??999)-(order.get(b.slug)??999)
    );
  }

  grid.innerHTML=filtered.map(card).join("");
  empty.style.display=filtered.length?"none":"block";
  document.getElementById("gameCount").textContent=games.length;

  if(resultsStatus){
    const filterText=
      active==="all" ? "all categories" :
      active==="favorites" ? "favorites" :
      active==="recent" ? "recently played" :
      active;

    const queryText=q?` matching "${search.value.trim()}"`:"";

    resultsStatus.textContent=
      `${filtered.length} ${filtered.length===1?"game":"games"} shown in ${filterText}${queryText}.`;
  }
}
search.addEventListener('input',render);
document.getElementById('chips').addEventListener('click',e=>{
  if(!e.target.matches('.chip')) return;

  document.querySelectorAll('.chip').forEach(chip=>{
    chip.classList.remove('active');
    chip.setAttribute('aria-pressed','false');
  });

  e.target.classList.add('active');
  e.target.setAttribute('aria-pressed','true');
  active=e.target.dataset.filter;
  render();
});
grid.addEventListener('click',e=>{
  const favorite=e.target.closest('[data-favorite]');

  if(favorite){
    e.preventDefault();
    toggleFavorite(favorite.dataset.favorite);
    return;
  }

  const play=e.target.closest('[data-play]');

  if(play){
    recordRecent(play.dataset.play);
  }
});

document.getElementById('randomBtn').addEventListener('click',()=>{
  const g=games[Math.floor(Math.random()*games.length)];
  recordRecent(g.slug);
  location.href=`games/${g.slug}/index.html`;
});
render();

// Authenticated student identity for time/grade aggregation.
const studentSelect=document.getElementById('studentSelect');
function loadActiveStudent(){
  const active=localStorage.getItem('richmackActiveStudent')||'Student';
  if(studentSelect){
    studentSelect.innerHTML=`<option value="${String(active).replaceAll('"','&quot;')}">${active}</option>`;
    studentSelect.disabled=true;
  }
}
loadActiveStudent();

document.getElementById('studentLogout')?.addEventListener('click',()=>{
  sessionStorage.removeItem('richmackStudentAuth');
  sessionStorage.removeItem('richmackStudentUsername');
  localStorage.removeItem('richmackActiveStudent');
  location.href='index.html';
});
