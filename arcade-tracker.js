(() => {
  const parts=location.pathname.split('/').filter(Boolean);
  const gi=parts.indexOf('games');
  if(gi<0 || !parts[gi+1]) return;
  const slug=parts[gi+1];
  const key='richmackPlayTimeV1';
  const sessionStart=Date.now();
  let last=Date.now();
  function player(){return localStorage.getItem('richmackActiveStudent')||'Student'}
  function load(){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
  function save(delta){
    if(delta<=0 || delta>120000) return;
    const data=load(), who=player();
    data[who] ||= {}; data[who][slug] ||= {milliseconds:0,sessions:0,lastPlayed:null};
    data[who][slug].milliseconds += delta;
    data[who][slug].lastPlayed = new Date().toISOString();
    localStorage.setItem(key,JSON.stringify(data));
  }
  function tick(){const now=Date.now(); if(!document.hidden) save(now-last); last=now}
  const data=load(), who=player(); data[who] ||= {}; data[who][slug] ||= {milliseconds:0,sessions:0,lastPlayed:null};
  data[who][slug].sessions=(data[who][slug].sessions||0)+1; data[who][slug].lastPlayed=new Date().toISOString(); localStorage.setItem(key,JSON.stringify(data));
  setInterval(tick,15000); document.addEventListener('visibilitychange',tick); window.addEventListener('pagehide',tick);
  window.RichmackArcade={slug, player, reportGrade(record){
    const rows=JSON.parse(localStorage.getItem('richmackUnifiedGradesV1')||'[]');
    rows.unshift({...record,game:slug,student:record.student||player(),date:record.date||new Date().toISOString()});
    localStorage.setItem('richmackUnifiedGradesV1',JSON.stringify(rows.slice(0,500)));
  }};
})();
