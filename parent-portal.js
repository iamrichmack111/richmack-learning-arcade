if(sessionStorage.getItem('richmackParentAuth')!=='1') location.replace('parent-login.html');
const GAME_NAMES={
'backrooms-math-levels':'The Backrooms: Math Levels','dead-letter-district':'Dead Letter District','equation-outbreak':'Equation Outbreak: Road Scholar','cabin-13':'Cabin 13','fraction-food-truck':'Fraction Food Truck','snow-calendar-rider':'Snow Calendar Rider 3D','laundry-night':'Laundry Night','scary-elevator':'Scary Elevator 3D','lights-out':'Lights Out','abandoned-school':'The Abandoned School 3D','math-heist':'Math Heist','color-current':'Color Current 3D','clownword-desert':'Clownword Desert'};
const $=s=>document.querySelector(s), esc=s=>String(s??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k,f){try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}}
function fmt(ms){const m=Math.round(ms/60000); if(m<60)return `${m}m`; return `${Math.floor(m/60)}h ${m%60}m`}
function students(){let s=read('richmackStudents',[]);const a=read('richmackStudentAccountsV1',[]);if(!Array.isArray(s))s=[];if(Array.isArray(a))a.forEach(x=>{if(x&&x.displayName&&!s.includes(x.displayName))s.push(x.displayName)});return s}
function saveStudents(s){localStorage.setItem('richmackStudents',JSON.stringify([...new Set(s.filter(Boolean))]));render()}
function normalizedGrades(){
 const out=[]; const push=(game,r)=>out.push({student:r.student||r.name||'Student',game,grade:r.grade??(r.accuracy!=null?`${r.accuracy}%`:'—'),score:r.score??r.accuracy??r.correct??'—',date:r.date||r.lastPlayed||''});
 read('richmackUnifiedGradesV1',[]).forEach(r=>push(r.game||'Game',r));
 read('scary_elevator_3d_grades',[]).forEach(r=>push('scary-elevator',r));
 read('cabin13_grades',[]).forEach(r=>push('cabin-13',r));
 read('abandonedSchoolGrades_v1',[]).forEach(r=>push('abandoned-school',r));
 read('backroomsMathLevelsGrades_v2',[]).forEach(r=>push('backrooms-math-levels',r));
 const fft=read('fft-best',null); if(fft&&fft.grade&&fft.grade!=='—') push('fraction-food-truck',{name:'Student',grade:fft.grade,accuracy:fft.acc,score:fft.score,date:''});
 const seen=new Set(); return out.filter(r=>{const k=JSON.stringify(r);if(seen.has(k))return false;seen.add(k);return true}).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function render(){
 const t=read('richmackPlayTimeV1',{}), rows=[]; let total=0,sessions=0; const names=new Set(students());
 for(const [student,games] of Object.entries(t)){names.add(student);for(const [slug,v] of Object.entries(games)){total+=v.milliseconds||0;sessions+=v.sessions||0;rows.push({student,slug,...v})}}
 const grades=normalizedGrades();grades.forEach(g=>names.add(g.student));
 $('#totalTime').textContent=fmt(total);$('#sessions').textContent=sessions;$('#gradeCount').textContent=grades.length;$('#studentCount').textContent=names.size;
 $('#timeRows').innerHTML=rows.sort((a,b)=>String(b.lastPlayed).localeCompare(String(a.lastPlayed))).map(r=>`<tr><td>${esc(r.student)}</td><td>${esc(GAME_NAMES[r.slug]||r.slug)}</td><td>${fmt(r.milliseconds||0)}</td><td>${r.sessions||0}</td><td>${r.lastPlayed?new Date(r.lastPlayed).toLocaleString():'—'}</td></tr>`).join('')||'<tr><td colspan="5">No play time recorded yet.</td></tr>';
 $('#gradeRows').innerHTML=grades.map(r=>`<tr><td>${esc(r.student)}</td><td>${esc(GAME_NAMES[r.game]||r.game)}</td><td>${esc(r.grade)}</td><td>${esc(r.score)}</td><td>${r.date?new Date(r.date).toLocaleString():'—'}</td></tr>`).join('')||'<tr><td colspan="5">No grade records yet.</td></tr>';
 const ss=[...names];$('#studentList').innerHTML=ss.map(n=>`<button class="ghost student-pill" data-name="${esc(n)}">${esc(n)} ×</button>`).join(' ')||'<span class="portal-muted">No named students yet.</span>';localStorage.setItem('richmackStudents',JSON.stringify(ss));
}
$('#studentForm').onsubmit=e=>{e.preventDefault();const n=$('#studentName').value.trim();if(n){saveStudents([...students(),n]);$('#studentName').value=''}};
$('#studentList').onclick=e=>{const b=e.target.closest('[data-name]');if(!b)return;saveStudents(students().filter(n=>n!==b.dataset.name))};
$('#pinForm').onsubmit=e=>{e.preventDefault();const p=$('#newPin').value;if(!/^\d{4,}$/.test(p)){ $('#pinMsg').textContent='Use at least 4 digits.';return }localStorage.setItem('richmackParentPin',p);$('#newPin').value='';$('#pinMsg').textContent='PIN changed for this browser.'};
$('#logout').onclick=()=>{sessionStorage.removeItem('richmackParentAuth');location.href='parent-login.html'};render();
