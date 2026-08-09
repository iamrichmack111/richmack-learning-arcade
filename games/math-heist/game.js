(() => {
  const $ = (id) => document.getElementById(id);
  const screens = {
    start: $("startScreen"),
    game: $("gameScreen"),
    end: $("endScreen"),
  };
  const canvas = $("game");
  const ctx = canvas.getContext("2d");

  const W = canvas.width, H = canvas.height;
  const keys = {};
  const TOTAL_CHALLENGES = 15;

  let playerName = "Agent";
  let state = "start";
  let missionIndex = 0;
  let activePuzzle = null;
  let correct = 0;
  let attempts = 0;
  let solved = 0;
  let loot = 0;
  let streak = 0;
  let bestStreak = 0;
  let lastTime = 0;
  let toastTimer = null;
  let bannerTimer = null;
  let detection = 0;
  let questionLog = [];

  const player = { x: 70, y: 445, r: 14, speed: 220 };

  const missions = [
    {
      name: "Metro Bank",
      banner: "🏦 BANK BREAK-IN",
      floor: "#131b2a",
      wall: "#26354b",
      accent: "#34d399",
      objective: "Crack the lobby terminal, disable the laser grid, then open the cash safe.",
      items: [
        {x:160,y:400,w:46,h:46,type:"terminal",label:"Lobby Terminal",difficulty:1,done:false},
        {x:430,y:280,w:50,h:50,type:"terminal",label:"Laser Controls",difficulty:1,done:false},
        {x:360,y:130,w:46,h:46,type:"terminal",label:"Manager Keypad",difficulty:1,done:false},
        {x:600,y:440,w:48,h:48,type:"terminal",label:"Security Gate",difficulty:2,done:false},
        {x:760,y:120,w:70,h:70,type:"safe",label:"Cash Safe",difficulty:2,done:false},
        {x:875,y:50,w:50,h:60,type:"exit",label:"Escape",done:false},
      ],
      walls: [
        {x:0,y:0,w:960,h:24},{x:0,y:516,w:960,h:24},{x:0,y:0,w:24,h:540},{x:936,y:0,w:24,h:540},
        {x:270,y:90,w:25,h:330},{x:520,y:0,w:25,h:310},{x:520,y:390,w:25,h:150},
        {x:690,y:180,w:246,h:25}
      ],
      lasers: [
        {x1:320,y1:355,x2:505,y2:355,phase:0},
        {x1:565,y1:340,x2:895,y2:340,phase:1.7}
      ]
    },
    {
      name: "City Museum",
      banner: "🏛️ MUSEUM JOB",
      floor: "#171725",
      wall: "#3a304e",
      accent: "#d8b4fe",
      objective: "Bypass the exhibit alarms, open the artifact case, and steal the diamond.",
      items: [
        {x:135,y:100,w:46,h:46,type:"terminal",label:"Alarm Panel",difficulty:2,done:false},
        {x:420,y:420,w:54,h:54,type:"terminal",label:"Exhibit Lock",difficulty:2,done:false},
        {x:330,y:160,w:48,h:48,type:"terminal",label:"Camera Grid",difficulty:2,done:false},
        {x:585,y:80,w:48,h:48,type:"terminal",label:"Gallery Sensor",difficulty:2,done:false},
        {x:735,y:280,w:72,h:72,type:"safe",label:"Diamond Case",difficulty:3,done:false},
        {x:875,y:50,w:50,h:60,type:"exit",label:"Escape",done:false},
      ],
      walls: [
        {x:0,y:0,w:960,h:24},{x:0,y:516,w:960,h:24},{x:0,y:0,w:24,h:540},{x:936,y:0,w:24,h:540},
        {x:230,y:0,w:26,h:210},{x:230,y:300,w:26,h:240},
        {x:510,y:100,w:26,h:330},{x:700,y:0,w:26,h:205},{x:700,y:360,w:26,h:180}
      ],
      lasers: [
        {x1:270,y1:250,x2:495,y2:250,phase:.8},
        {x1:550,y1:330,x2:680,y2:330,phase:2.1},
        {x1:745,y1:215,x2:915,y2:215,phase:3.4}
      ]
    },
    {
      name: "Federal Reserve Vault",
      banner: "🔐 MASTER VAULT",
      floor: "#121a1d",
      wall: "#2a4548",
      accent: "#67e8f9",
      objective: "Defeat the final security network and crack the master vault. Escape with the gold.",
      items: [
        {x:160,y:430,w:48,h:48,type:"terminal",label:"Power Relay",difficulty:3,done:false},
        {x:430,y:100,w:50,h:50,type:"terminal",label:"Biometric Override",difficulty:3,done:false},
        {x:650,y:400,w:52,h:52,type:"terminal",label:"Vault Cipher",difficulty:3,done:false},
        {x:350,y:300,w:50,h:50,type:"terminal",label:"Pressure Lock",difficulty:3,done:false},
        {x:805,y:185,w:88,h:88,type:"safe",label:"Master Vault",difficulty:3,done:false},
        {x:875,y:50,w:50,h:60,type:"exit",label:"Escape",done:false},
      ],
      walls: [
        {x:0,y:0,w:960,h:24},{x:0,y:516,w:960,h:24},{x:0,y:0,w:24,h:540},{x:936,y:0,w:24,h:540},
        {x:260,y:85,w:26,h:370},{x:500,y:0,w:26,h:240},{x:500,y:330,w:26,h:210},
        {x:715,y:80,w:26,h:320}
      ],
      lasers: [
        {x1:305,y1:270,x2:480,y2:270,phase:.4},
        {x1:545,y1:285,x2:690,y2:285,phase:2.4},
        {x1:755,y1:330,x2:920,y2:330,phase:4.2}
      ]
    }
  ];

  function setScreen(name){
    Object.values(screens).forEach(s=>s.classList.remove("active"));
    screens[name].classList.add("active");
    state = name;
  }

  function resetMissions(){
    missions.forEach(m => m.items.forEach(i => i.done = false));
  }

  function startGame(){
    playerName = $("playerName").value.trim() || "Agent";
    correct = attempts = solved = loot = streak = bestStreak = detection = 0;
    questionLog = [];
    missionIndex = 0;
    resetMissions();
    player.x = 70; player.y = 445;
    $("hudName").textContent = playerName;
    updateHUD();
    setScreen("game");
    showBanner(missions[0].banner);
    requestAnimationFrame(loop);
  }

  function currentMission(){ return missions[missionIndex]; }

  function objectiveStatus(){
    const m = currentMission();
    const pending = m.items.filter(i => i.type !== "exit" && !i.done);
    if (pending.length) return `Find and solve: ${pending[0].label}. Press E when you are close.`;
    return "All security is defeated. Reach the green EXIT and press E.";
  }

  function updateHUD(){
    $("hudLocation").textContent = currentMission()?.name || "Complete";
    $("hudLoot").textContent = "$" + loot.toLocaleString();
    $("hudSolved").textContent = solved;
    const accuracy = attempts ? Math.round(correct / attempts * 100) : 100;
    $("hudAccuracy").textContent = accuracy + "%";
    $("objectiveText").textContent = currentMission() ? objectiveStatus() : "Heist complete.";
    const p = Math.min(100, Math.round(solved / TOTAL_CHALLENGES * 100));
    $("progressText").textContent = p + "%";
    $("progressFill").style.width = p + "%";
  }

  function showToast(text){
    clearTimeout(toastTimer);
    const el = $("toast");
    el.textContent = text;
    el.classList.add("show");
    toastTimer = setTimeout(()=>el.classList.remove("show"), 1700);
  }

  function showBanner(text){
    clearTimeout(bannerTimer);
    const el = $("missionBanner");
    el.textContent = text;
    el.classList.add("show");
    bannerTimer = setTimeout(()=>el.classList.remove("show"), 1500);
  }

  function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
  function rectCircleCollision(rx,ry,rw,rh,cx,cy,cr){
    const nx = clamp(cx,rx,rx+rw), ny = clamp(cy,ry,ry+rh);
    const dx = cx-nx, dy = cy-ny;
    return dx*dx+dy*dy < cr*cr;
  }
  function dist(a,b,c,d){ return Math.hypot(a-c,b-d); }

  function canMove(nx,ny){
    const m = currentMission();
    if (!m) return false;
    return !m.walls.some(w => rectCircleCollision(w.x,w.y,w.w,w.h,nx,ny,player.r));
  }

  function movePlayer(dt){
    let dx=0,dy=0;
    if(keys["w"]||keys["arrowup"]) dy--;
    if(keys["s"]||keys["arrowdown"]) dy++;
    if(keys["a"]||keys["arrowleft"]) dx--;
    if(keys["d"]||keys["arrowright"]) dx++;
    if(dx||dy){
      const mag = Math.hypot(dx,dy); dx/=mag; dy/=mag;
      const nx = player.x + dx*player.speed*dt;
      const ny = player.y + dy*player.speed*dt;
      if(canMove(nx,player.y)) player.x = nx;
      if(canMove(player.x,ny)) player.y = ny;
    }
  }

  function laserY(l, t){
    return 16 * Math.sin(t*2 + l.phase);
  }

  function checkLasers(t){
    const m = currentMission();
    if(!m) return;
    for(const l of m.lasers){
      const y = l.y1 + laserY(l,t);
      if(player.x >= Math.min(l.x1,l.x2)-8 && player.x <= Math.max(l.x1,l.x2)+8 && Math.abs(player.y-y)<13){
        detection += .5;
        if(detection > 18){
          detection = 0;
          loot = Math.max(0, loot - 250);
          player.x = 70; player.y = 445;
          showToast("🚨 Laser tripped! -$250 and reset to entry.");
          updateHUD();
        }
      }
    }
  }

  function interact(){
    if(state !== "game" || activePuzzle) return;
    const m = currentMission();
    let nearest=null, nd=999;
    for(const item of m.items){
      const d = dist(player.x,player.y,item.x+item.w/2,item.y+item.h/2);
      if(d<nd){nd=d;nearest=item;}
    }
    if(!nearest || nd>70){ showToast("Move closer to a terminal, safe, or exit."); return; }

    if(nearest.type==="exit"){
      const unfinished = m.items.some(i=>i.type!=="exit"&&!i.done);
      if(unfinished){ showToast("🔒 Finish the security challenges first."); return; }
      missionIndex++;
      if(missionIndex >= missions.length){ finishGame(); return; }
      player.x=70;player.y=445;detection=0;
      showBanner(missions[missionIndex].banner);
      updateHUD();
      return;
    }
    if(nearest.done){ showToast("✅ Already unlocked."); return; }
    openPuzzle(nearest);
  }

  function generateProblem(level){
    let a,b,op,answer,label;
    if(level===1){
      op = Math.random()<.5?"+":"−";
      a = rand(5,35); b = rand(2,20);
      if(op==="−" && b>a) [a,b]=[b,a];
      answer = op==="+"?a+b:a-b;
      label = "LEVEL 1 • BASIC";
    } else if(level===2){
      if(Math.random()<.65){
        op="×"; a=rand(3,12); b=rand(3,12); answer=a*b;
      } else {
        b=rand(2,12); answer=rand(2,12); a=b*answer; op="÷";
      }
      label = "LEVEL 2 • ADVANCED";
    } else {
      const type = rand(0,2);
      if(type===0){
        const x=rand(2,12), y=rand(2,12), z=rand(2,20);
        a=`(${x} × ${y}) + ${z}`; answer=x*y+z; op="";
      } else if(type===1){
        const x=rand(4,15), y=rand(2,8), z=rand(2,12);
        a=`(${x} + ${z}) × ${y}`; answer=(x+z)*y; op="";
      } else {
        const y=rand(2,10), q=rand(3,12), z=rand(2,15);
        const x=y*q; a=`${x} ÷ ${y} + ${z}`; answer=q+z; op="";
      }
      label = "LEVEL 3 • ELITE";
      return {text:`${a} = ?`, answer, label};
    }
    return {text:`${a} ${op} ${b} = ?`, answer, label};
  }

  function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }

  function openPuzzle(item){
    activePuzzle = {item, problem:generateProblem(item.difficulty), misses:0};
    $("quizTitle").textContent = item.label;
    $("quizDifficulty").textContent = activePuzzle.problem.label;
    $("quizPrompt").textContent = item.type==="safe" ? "Crack the safe by solving the code." : "Solve the problem to bypass security.";
    $("equation").textContent = activePuzzle.problem.text;
    $("answerInput").value="";
    $("quizFeedback").textContent="";
    $("quizModal").classList.remove("hidden");
    setTimeout(()=>$("answerInput").focus(),20);
  }

  function submitPuzzle(){
    if(!activePuzzle) return;
    const raw = $("answerInput").value.trim();
    if(raw==="") return;
    const value = Number(raw);
    attempts++;
    const p = activePuzzle.problem;
    if(value === p.answer){
      correct++; solved++; streak++; bestStreak=Math.max(bestStreak,streak);
      const base = activePuzzle.item.difficulty===1?500:activePuzzle.item.difficulty===2?1000:2000;
      const streakBonus = Math.min(5,streak)*100;
      const reward = base + streakBonus;
      loot += reward;
      activePuzzle.item.done = true;
      questionLog.push({question:p.text, answer:value, correct:true, reward});
      $("quizFeedback").textContent = `✅ Correct! +$${reward.toLocaleString()}`;
      $("quizFeedback").style.color = "#49e18b";
      setTimeout(()=>{
        $("quizModal").classList.add("hidden");
        activePuzzle=null;
        updateHUD();
        showToast(`Security defeated. Loot +$${reward.toLocaleString()}`);
      },650);
    }else{
      streak=0;
      activePuzzle.misses++;
      questionLog.push({question:p.text, answer:value, correct:false, correctAnswer:p.answer});
      $("quizFeedback").textContent = "❌ Incorrect. Try again.";
      $("quizFeedback").style.color = "#ff4d6d";
      $("answerInput").select();
      updateHUD();
    }
  }

  function gradeFromAccuracy(acc){
    if(acc>=93) return "A";
    if(acc>=85) return "B";
    if(acc>=75) return "C";
    if(acc>=65) return "D";
    return "F";
  }

  function finishGame(){
    const accuracy = attempts ? Math.round(correct/attempts*100) : 0;
    const grade = gradeFromAccuracy(accuracy);
    $("resultTitle").textContent = `${playerName}'s Mission Report`;
    $("gradeBadge").textContent = grade;
    $("resultCorrect").textContent = `${correct} correct`;
    $("resultAccuracy").textContent = `${accuracy}%`;
    $("resultLoot").textContent = "$"+loot.toLocaleString();
    $("resultStreak").textContent = bestStreak;
    $("resultMessage").textContent =
      grade==="A" ? "Mastermind status. You beat the security systems with elite accuracy." :
      grade==="B" ? "Excellent heist. A little more practice and you will be impossible to stop." :
      grade==="C" ? "Mission accomplished. Review the missed problems and try for a bigger score." :
      "You escaped, but the security system slowed you down. Replay the heist and raise your accuracy.";
    setScreen("end");
  }

  function downloadReport(){
    const accuracy = attempts ? Math.round(correct/attempts*100) : 0;
    const grade = gradeFromAccuracy(accuracy);
    const lines = [
      "MATH HEIST - GRADE REPORT",
      "========================",
      `Agent: ${playerName}`,
      `Date: ${new Date().toLocaleString()}`,
      `Grade: ${grade}`,
      `Correct answers: ${correct}`,
      `Total attempts: ${attempts}`,
      `Accuracy: ${accuracy}%`,
      `Loot earned: $${loot.toLocaleString()}`,
      `Best streak: ${bestStreak}`,
      "",
      "QUESTION LOG",
      ...questionLog.map((q,i)=>`${i+1}. ${q.question} | Answer: ${q.answer} | ${q.correct?"Correct":"Incorrect (Correct: "+q.correctAnswer+")"}`)
    ];
    const blob = new Blob([lines.join("\n")],{type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url;
    a.download=`math-heist-${playerName.replace(/[^a-z0-9]+/gi,"-").toLowerCase()}-grade.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function drawRoundedRect(x,y,w,h,r,fill,stroke){
    ctx.beginPath();
    ctx.roundRect(x,y,w,h,r);
    if(fill){ctx.fillStyle=fill;ctx.fill();}
    if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}
  }

  function drawWorld(t){
    const m = currentMission();
    if(!m) return;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle=m.floor;ctx.fillRect(0,0,W,H);

    // tiled floor
    ctx.strokeStyle="rgba(255,255,255,.035)";
    ctx.lineWidth=1;
    for(let x=0;x<W;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // decorative room blocks
    for(let i=0;i<7;i++){
      const x=80+i*125, y=(i%2?70:390);
      ctx.fillStyle="rgba(255,255,255,.025)";
      ctx.fillRect(x,y,70,48);
    }

    // walls
    m.walls.forEach(w=>{
      ctx.fillStyle=m.wall;ctx.fillRect(w.x,w.y,w.w,w.h);
      ctx.fillStyle="rgba(255,255,255,.06)";ctx.fillRect(w.x,w.y,w.w,4);
    });

    // lasers
    m.lasers.forEach(l=>{
      const y=l.y1+laserY(l,t);
      ctx.save();
      ctx.shadowColor="#ff315a";ctx.shadowBlur=16;
      ctx.strokeStyle="rgba(255,49,90,.9)";ctx.lineWidth=3;
      ctx.beginPath();ctx.moveTo(l.x1,y);ctx.lineTo(l.x2,y);ctx.stroke();
      ctx.restore();
    });

    // items
    m.items.forEach(item=>{
      if(item.type==="exit"){
        const ready = !m.items.some(i=>i.type!=="exit"&&!i.done);
        ctx.save();ctx.shadowColor=ready?"#49e18b":"transparent";ctx.shadowBlur=18;
        drawRoundedRect(item.x,item.y,item.w,item.h,8,ready?"#163f31":"#1a2736",ready?"#49e18b":"#526174");
        ctx.fillStyle=ready?"#49e18b":"#7a8799";ctx.font="900 12px system-ui";ctx.textAlign="center";
        ctx.fillText("EXIT",item.x+item.w/2,item.y+36);ctx.restore();
        return;
      }
      const col = item.done ? "#163a2b" : item.type==="safe" ? "#4a3b12" : "#123746";
      const border = item.done ? "#49e18b" : item.type==="safe" ? "#ffd166" : "#2de2e6";
      ctx.save();ctx.shadowColor=border;ctx.shadowBlur=item.done?5:13;
      drawRoundedRect(item.x,item.y,item.w,item.h,9,col,border);
      ctx.fillStyle=border;ctx.font=`900 ${item.type==="safe"?25:18}px system-ui`;ctx.textAlign="center";
      ctx.fillText(item.done?"✓":item.type==="safe"?"$":"Σ",item.x+item.w/2,item.y+item.h/2+8);
      ctx.restore();
      if(dist(player.x,player.y,item.x+item.w/2,item.y+item.h/2)<78){
        ctx.fillStyle="rgba(3,8,15,.9)";ctx.strokeStyle="#3a506f";
        drawRoundedRect(item.x-15,item.y-34,item.w+30,25,8,"rgba(3,8,15,.9)","#3a506f");
        ctx.fillStyle="#fff";ctx.font="700 11px system-ui";ctx.fillText(item.done?"Unlocked":"Press E",item.x+item.w/2,item.y-17);
      }
    });

    // player
    ctx.save();
    ctx.shadowColor="#4d7cff";ctx.shadowBlur=18;
    ctx.beginPath();ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
    ctx.fillStyle="#4d7cff";ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle="#b9d1ff";ctx.beginPath();ctx.arc(player.x-4,player.y-4,4,0,Math.PI*2);ctx.fill();
    ctx.restore();

    // label
    ctx.fillStyle="rgba(255,255,255,.7)";ctx.font="700 11px system-ui";ctx.textAlign="center";
    ctx.fillText(playerName,player.x,player.y-23);
  }

  function loop(ts){
    if(state!=="game") return;
    const t=ts/1000;
    const dt=Math.min(.035,(ts-lastTime)/1000||0);
    lastTime=ts;
    if(!activePuzzle){
      movePlayer(dt);
      checkLasers(t);
    }
    drawWorld(t);
    requestAnimationFrame(loop);
  }

  document.addEventListener("keydown",(e)=>{
    keys[e.key.toLowerCase()]=true;
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    if(e.key.toLowerCase()==="e") interact();
    if(e.key==="Enter" && !$("quizModal").classList.contains("hidden")) submitPuzzle();
  });
  document.addEventListener("keyup",(e)=>keys[e.key.toLowerCase()]=false);

  $("startBtn").addEventListener("click",startGame);
  $("playerName").addEventListener("keydown",e=>{if(e.key==="Enter") startGame();});
  $("submitAnswer").addEventListener("click",submitPuzzle);
  $("playAgain").addEventListener("click",()=>setScreen("start"));
  $("downloadReport").addEventListener("click",downloadReport);

  updateHUD();
})();
