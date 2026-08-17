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
let active='all';

function card(g){
  const url=`games/${g.slug}/index.html`;
  const tags=g.tags.map(t=>`<span class="tag">${t}</span>`).join('');
  const imageStyle=g.image?` style="background-image:url('${g.image}')"`:'';
  return `<article class="card" data-tags="${g.tags.join(' ')}" data-title="${g.title.toLowerCase()}">
    <div class="visual ${g.image?'has-image':''}" data-mark="${g.mark}" style="--c1:${g.colors[0]};--c2:${g.colors[1]};${g.image?`background-image:url('${g.image}');`:''}"></div>
    <div class="card-body"><div class="meta">${tags}</div><h3>${g.title}</h3><p>${g.desc}</p>
      <div class="actions"><a class="play" href="${url}">▶ PLAY</a><a class="newtab" href="${url}" target="_blank" rel="noopener" title="Open in new tab">↗</a></div>
    </div></article>`;
}
function render(){
  const q=search.value.trim().toLowerCase();
  const filtered=games.filter(g => (active==='all' || g.tags.includes(active)) && (!q || g.title.toLowerCase().includes(q) || g.tags.some(t => t.includes(q)) || g.desc.toLowerCase().includes(q)));
  grid.innerHTML=filtered.map(card).join('');
  empty.style.display=filtered.length?'none':'block';
  document.getElementById('gameCount').textContent=games.length;
}
search.addEventListener('input',render);
document.getElementById('chips').addEventListener('click',e=>{if(!e.target.matches('.chip'))return;document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));e.target.classList.add('active');active=e.target.dataset.filter;render();});
document.getElementById('randomBtn').addEventListener('click',()=>{const g=games[Math.floor(Math.random()*games.length)];location.href=`games/${g.slug}/index.html`;});
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
