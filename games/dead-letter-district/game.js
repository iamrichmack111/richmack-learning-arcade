import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const gameRoot = document.getElementById("game");
const startScreen = document.getElementById("startScreen");
const pauseScreen = document.getElementById("pauseScreen");
const spellingScreen = document.getElementById("spellingScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const startButton = document.getElementById("startButton");
const resumeButton = document.getElementById("resumeButton");
const pauseSpellButton = document.getElementById("pauseSpellButton");
const restartButton = document.getElementById("restartButton");
const spellingForm = document.getElementById("spellingForm");
const spellingInput = document.getElementById("spellingInput");
const spellingFeedback = document.getElementById("spellingFeedback");
const closeSpellingButton = document.getElementById("closeSpellingButton");
const wordPrompt = document.getElementById("wordPrompt");
const difficultyBadge = document.getElementById("difficultyBadge");
const ammoText = document.getElementById("ammoText");
const healthText = document.getElementById("healthText");
const healthBar = document.getElementById("healthBar");
const correctText = document.getElementById("correctText");
const gunText = document.getElementById("gunText");
const waveText = document.getElementById("waveText");
const scoreText = document.getElementById("scoreText");
const message = document.getElementById("message");
const damageFlash = document.getElementById("damageFlash");
const finalScore = document.getElementById("finalScore");
const finalCorrect = document.getElementById("finalCorrect");
const finalWave = document.getElementById("finalWave");

const WORDS = [
  { word: "apple", tier: "basic", bullets: 10 },
  { word: "bridge", tier: "basic", bullets: 10 },
  { word: "camera", tier: "basic", bullets: 10 },
  { word: "danger", tier: "basic", bullets: 10 },
  { word: "forest", tier: "basic", bullets: 10 },
  { word: "helmet", tier: "basic", bullets: 10 },
  { word: "market", tier: "basic", bullets: 10 },
  { word: "pocket", tier: "basic", bullets: 10 },
  { word: "shelter", tier: "basic", bullets: 10 },
  { word: "window", tier: "basic", bullets: 10 },

  { word: "adventure", tier: "advanced", bullets: 15 },
  { word: "barricade", tier: "advanced", bullets: 15 },
  { word: "defensive", tier: "advanced", bullets: 15 },
  { word: "emergency", tier: "advanced", bullets: 15 },
  { word: "equipment", tier: "advanced", bullets: 15 },
  { word: "hospital", tier: "advanced", bullets: 15 },
  { word: "mechanical", tier: "advanced", bullets: 15 },
  { word: "neighborhood", tier: "advanced", bullets: 15 },
  { word: "protective", tier: "advanced", bullets: 15 },
  { word: "survival", tier: "advanced", bullets: 15 },

  { word: "acquiescence", tier: "expert", bullets: 25 },
  { word: "conscientious", tier: "expert", bullets: 25 },
  { word: "entrepreneurial", tier: "expert", bullets: 25 },
  { word: "indistinguishable", tier: "expert", bullets: 25 },
  { word: "miscommunication", tier: "expert", bullets: 25 },
  { word: "pharmaceutical", tier: "expert", bullets: 25 },
  { word: "reconnaissance", tier: "expert", bullets: 25 },
  { word: "resourcefulness", tier: "expert", bullets: 25 },
  { word: "simultaneously", tier: "expert", bullets: 25 },
  { word: "uncharacteristically", tier: "expert", bullets: 25 }
];

const GUNS = [
  { name: "Pistol", damage: 1, delay: 330, spread: 0.0005, pellets: 1 },
  { name: "Heavy Pistol", damage: 2, delay: 260, spread: 0.0005, pellets: 1 },
  { name: "Submachine Gun", damage: 1, delay: 105, spread: 0.002, pellets: 1 },
  { name: "Assault Rifle", damage: 3, delay: 150, spread: 0.001, pellets: 1 },
  { name: "Combat Shotgun", damage: 2, delay: 410, spread: 0.014, pellets: 5 },
  { name: "Plasma Carbine", damage: 5, delay: 115, spread: 0.0008, pellets: 1 }
];

const state = {
  started: false,
  paused: true,
  spelling: false,
  gameOver: false,
  health: 100,
  ammo: 20,
  correct: 0,
  score: 0,
  kills: 0,
  wave: 1,
  gunLevel: 0,
  currentWord: null,
  lastWord: "",
  lastShotAt: 0,
  spawnTimer: 0,
  damageCooldown: 0,
  damageBoost: 0
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d130f);
scene.fog = new THREE.FogExp2(0x101610, 0.025);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 230);
camera.position.set(0, 1.72, 16);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
gameRoot.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, document.body);
scene.add(controls.object);

const hemiLight = new THREE.HemisphereLight(0x8faea0, 0x19150d, 1.35);
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0xc7e4d2, 2.3);
moonLight.position.set(-18, 28, 12);
moonLight.castShadow = true;
moonLight.shadow.mapSize.set(1024, 1024);
moonLight.shadow.camera.left = -45;
moonLight.shadow.camera.right = 45;
moonLight.shadow.camera.top = 45;
moonLight.shadow.camera.bottom = -45;
scene.add(moonLight);

const greenLight = new THREE.PointLight(0x91ff63, 18, 34, 2);
greenLight.position.set(0, 7, -12);
scene.add(greenLight);

const world = new THREE.Group();
scene.add(world);

const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x232723,
  roughness: 0.96,
  metalness: 0.04
});
const ground = new THREE.Mesh(new THREE.PlaneGeometry(150, 150), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const streetMaterial = new THREE.MeshStandardMaterial({ color: 0x171918, roughness: 1 });
const street = new THREE.Mesh(new THREE.PlaneGeometry(22, 150), streetMaterial);
street.rotation.x = -Math.PI / 2;
street.position.y = 0.012;
street.receiveShadow = true;
world.add(street);

const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x777451 });
for (let z = -65; z < 70; z += 9) {
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 4.2), stripeMaterial);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, 0.022, z);
  world.add(stripe);
}

function addBuilding(x, z, width, depth, height, color) {
  const group = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.87 })
  );
  shell.position.y = height / 2;
  shell.castShadow = true;
  shell.receiveShadow = true;
  group.add(shell);

  const windowMaterial = new THREE.MeshBasicMaterial({ color: 0xb8c86d });
  const rows = Math.max(1, Math.floor(height / 4));
  for (let row = 0; row < rows; row++) {
    for (const side of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.55), windowMaterial);
      win.position.set(side * (width / 2 + 0.006), 2.1 + row * 3.2, 0);
      win.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      group.add(win);
    }
  }

  group.position.set(x, 0, z);
  world.add(group);
}

for (let z = -60; z <= 60; z += 15) {
  addBuilding(-17 - Math.random() * 5, z + Math.random() * 3, 8 + Math.random() * 5, 10, 8 + Math.random() * 13, 0x283128);
  addBuilding(17 + Math.random() * 5, z + Math.random() * 3, 8 + Math.random() * 5, 10, 8 + Math.random() * 13, 0x302c2a);
}

function addStreetLight(x, z) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 5.8, 8),
    new THREE.MeshStandardMaterial({ color: 0x303630, metalness: 0.45, roughness: 0.5 })
  );
  pole.position.set(x, 2.9, z);
  pole.castShadow = true;
  world.add(pole);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.28),
    new THREE.MeshBasicMaterial({ color: 0xc9ff8c })
  );
  lamp.position.set(x, 5.7, z);
  world.add(lamp);
}

for (let z = -55; z <= 55; z += 13) {
  addStreetLight(-8.7, z);
  addStreetLight(8.7, z + 5.5);
}

const debrisMaterial = new THREE.MeshStandardMaterial({ color: 0x4f3b2e, roughness: 1 });
for (let i = 0; i < 34; i++) {
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.3 + Math.random() * 0.8, 0.25 + Math.random() * 0.5, 0.3 + Math.random() * 0.8),
    debrisMaterial
  );
  box.position.set((Math.random() - 0.5) * 22, box.geometry.parameters.height / 2, (Math.random() - 0.5) * 130);
  box.rotation.y = Math.random() * Math.PI;
  box.castShadow = true;
  world.add(box);
}

const weapon = new THREE.Group();
camera.add(weapon);

const weaponBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.18, 0.2, 0.75),
  new THREE.MeshStandardMaterial({ color: 0x252b28, metalness: 0.55, roughness: 0.38 })
);
weaponBody.position.set(0.34, -0.32, -0.65);
weaponBody.rotation.x = -0.08;
weapon.add(weaponBody);

const weaponAccent = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.08, 0.34),
  new THREE.MeshBasicMaterial({ color: 0xccff4d })
);
weaponAccent.position.set(0.34, -0.25, -0.64);
weapon.add(weaponAccent);

const muzzleFlash = new THREE.PointLight(0xffee88, 0, 7, 2);
muzzleFlash.position.set(0.34, -0.26, -1.12);
camera.add(muzzleFlash);

const zombies = [];
const zombieHitMeshes = [];
const zombieMaterials = {
  skin: new THREE.MeshStandardMaterial({ color: 0x65794b, roughness: 0.9 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x5b2f2f, roughness: 1 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x222b31, roughness: 1 }),
  eyes: new THREE.MeshBasicMaterial({ color: 0xeaff6a })
};

function createZombie() {
  const zombie = new THREE.Group();
  zombie.userData.isZombie = true;
  zombie.userData.health = 1 + Math.ceil(state.wave * 0.55);
  zombie.userData.maxHealth = zombie.userData.health;
  zombie.userData.speed = 1.2 + Math.random() * 0.55 + state.wave * 0.05;
  zombie.userData.wobble = Math.random() * Math.PI * 2;
  zombie.userData.attackOffset = Math.random() * 0.35;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.05, 0.42), zombieMaterials.shirt.clone());
  torso.position.y = 1.55;
  torso.castShadow = true;
  zombie.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.58, 0.58), zombieMaterials.skin.clone());
  head.position.set(0, 2.35, -0.03);
  head.castShadow = true;
  zombie.add(head);

  const eyeGeometry = new THREE.BoxGeometry(0.07, 0.06, 0.025);
  for (const x of [-0.14, 0.14]) {
    const eye = new THREE.Mesh(eyeGeometry, zombieMaterials.eyes);
    eye.position.set(x, 2.43, -0.323);
    zombie.add(eye);
  }

  const armGeometry = new THREE.BoxGeometry(0.2, 0.9, 0.22);
  for (const x of [-0.55, 0.55]) {
    const arm = new THREE.Mesh(armGeometry, zombieMaterials.skin.clone());
    arm.position.set(x, 1.72, -0.25);
    arm.rotation.x = -1.1;
    arm.castShadow = true;
    zombie.add(arm);
  }

  const legGeometry = new THREE.BoxGeometry(0.25, 0.9, 0.3);
  for (const x of [-0.2, 0.2]) {
    const leg = new THREE.Mesh(legGeometry, zombieMaterials.pants.clone());
    leg.position.set(x, 0.55, 0);
    leg.castShadow = true;
    zombie.add(leg);
  }

  const angle = Math.random() * Math.PI * 2;
  const distance = 25 + Math.random() * 24;
  zombie.position.set(
    camera.position.x + Math.cos(angle) * distance,
    0,
    camera.position.z + Math.sin(angle) * distance
  );

  zombie.traverse((child) => {
    if (child.isMesh) {
      child.userData.zombieRoot = zombie;
      zombieHitMeshes.push(child);
    }
  });

  scene.add(zombie);
  zombies.push(zombie);
}

function removeZombie(zombie) {
  const zombieIndex = zombies.indexOf(zombie);
  if (zombieIndex >= 0) zombies.splice(zombieIndex, 1);

  zombie.traverse((child) => {
    if (child.isMesh) {
      const hitIndex = zombieHitMeshes.indexOf(child);
      if (hitIndex >= 0) zombieHitMeshes.splice(hitIndex, 1);
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });

  scene.remove(zombie);
}

for (let i = 0; i < 4; i++) createZombie();

const keys = {};
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);
let messageTimeout = null;
let damageFlashTimeout = null;

function showMessage(text, duration = 1700) {
  message.textContent = text;
  message.classList.add("show");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => message.classList.remove("show"), duration);
}

function updateHUD() {
  ammoText.textContent = state.ammo;
  healthText.textContent = Math.max(0, Math.ceil(state.health));
  healthBar.style.width = `${Math.max(0, state.health)}%`;
  healthBar.style.background =
    state.health > 55
      ? "linear-gradient(90deg, #75ff73, #ccff4d)"
      : state.health > 25
        ? "linear-gradient(90deg, #ffc857, #ff9b42)"
        : "linear-gradient(90deg, #ff5b50, #ff2f24)";
  correctText.textContent = state.correct;
  gunText.textContent = GUNS[state.gunLevel].name;
  waveText.textContent = state.wave;
  scoreText.textContent = state.score;
}

function applyGunLook() {
  const level = state.gunLevel;
  weapon.scale.setScalar(1 + level * 0.055);
  weaponBody.material.color.setHSL(0.33 + level * 0.045, 0.12 + level * 0.04, 0.15 + level * 0.02);
  weaponAccent.material.color.set(level >= 4 ? 0xff694f : 0xccff4d);
}

function resetGame() {
  for (const zombie of [...zombies]) removeZombie(zombie);

  state.started = true;
  state.paused = false;
  state.spelling = false;
  state.gameOver = false;
  state.health = 100;
  state.ammo = 20;
  state.correct = 0;
  state.score = 0;
  state.kills = 0;
  state.wave = 1;
  state.gunLevel = 0;
  state.currentWord = null;
  state.lastWord = "";
  state.lastShotAt = 0;
  state.spawnTimer = 0;
  state.damageCooldown = 0;
  state.damageBoost = 0;

  camera.position.set(0, 1.72, 16);
  camera.rotation.set(0, 0, 0);
  velocity.set(0, 0, 0);
  applyGunLook();

  for (let i = 0; i < 4; i++) createZombie();

  gameOverScreen.classList.remove("visible");
  startScreen.classList.remove("visible");
  pauseScreen.classList.remove("visible");
  spellingScreen.classList.remove("visible");
  updateHUD();
  controls.lock();
}

function chooseWord() {
  let tierRoll = Math.random();
  let tier;

  if (state.correct < 4) {
    tier = "basic";
  } else if (state.correct < 10) {
    tier = tierRoll < 0.7 ? "basic" : "advanced";
  } else if (state.correct < 20) {
    tier = tierRoll < 0.35 ? "basic" : tierRoll < 0.84 ? "advanced" : "expert";
  } else {
    tier = tierRoll < 0.2 ? "basic" : tierRoll < 0.66 ? "advanced" : "expert";
  }

  const pool = WORDS.filter((entry) => entry.tier === tier && entry.word !== state.lastWord);
  return pool[Math.floor(Math.random() * pool.length)];
}

function openSpelling() {
  if (!state.started || state.gameOver) return;

  state.spelling = true;
  state.paused = true;
  state.currentWord = chooseWord();
  state.lastWord = state.currentWord.word;

  wordPrompt.textContent = state.currentWord.word;
  difficultyBadge.className = `difficulty ${state.currentWord.tier}`;
  difficultyBadge.textContent =
    `${state.currentWord.tier.toUpperCase()} · +${state.currentWord.bullets} BULLETS`;
  spellingFeedback.textContent = "";
  spellingInput.value = "";

  pauseScreen.classList.remove("visible");
  spellingScreen.classList.add("visible");
  controls.unlock();

  window.setTimeout(() => spellingInput.focus(), 80);
}

function closeSpelling() {
  state.spelling = false;
  state.paused = false;
  spellingScreen.classList.remove("visible");
  spellingFeedback.textContent = "";
  controls.lock();
}

function handleCorrectWord() {
  const bullets = state.currentWord.bullets;
  state.ammo += bullets;
  state.correct += 1;
  state.score += bullets * 5;

  let rewardMessage = `CORRECT — +${bullets} BULLETS`;

  if (state.correct % 10 === 0) {
    if (state.gunLevel < GUNS.length - 1) {
      state.gunLevel += 1;
      applyGunLook();
      rewardMessage += ` · UPGRADE: ${GUNS[state.gunLevel].name}`;
    } else {
      state.damageBoost += 1;
      rewardMessage += " · MAX GUN: +1 DAMAGE";
    }
  }

  updateHUD();

  // The form submission is a user gesture, so relock the mouse immediately.
  state.spelling = false;
  state.paused = false;
  spellingScreen.classList.remove("visible");
  spellingFeedback.textContent = "";
  controls.lock();
  showMessage(rewardMessage, 2600);
}

function handleWrongWord() {
  spellingFeedback.textContent = `Not quite. Try "${state.currentWord.word}" again.`;
  spellingFeedback.style.color = "#ff8178";
  spellingInput.select();
}

spellingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.currentWord) return;

  const answer = spellingInput.value.trim().toLowerCase();
  if (answer === state.currentWord.word.toLowerCase()) {
    handleCorrectWord();
  } else {
    handleWrongWord();
  }
});

function shoot() {
  if (!controls.isLocked || state.paused || state.gameOver) return;

  const gun = GUNS[state.gunLevel];
  const now = performance.now();
  if (now - state.lastShotAt < gun.delay) return;

  if (state.ammo <= 0) {
    state.lastShotAt = now;
    showMessage("OUT OF AMMO — PRESS F TO SPELL");
    return;
  }

  state.lastShotAt = now;
  state.ammo -= 1;
  updateHUD();

  weapon.position.z = 0.07;
  muzzleFlash.intensity = 12;
  window.setTimeout(() => {
    muzzleFlash.intensity = 0;
    weapon.position.z = 0;
  }, 45);

  let hitAnything = false;

  for (let pellet = 0; pellet < gun.pellets; pellet++) {
    const spread = gun.spread;
    const shotPoint = new THREE.Vector2(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread
    );

    raycaster.setFromCamera(shotPoint, camera);
    raycaster.far = 75;
    const intersections = raycaster.intersectObjects(zombieHitMeshes, false);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const zombie = hit.object.userData.zombieRoot;
      if (!zombie || zombie.userData.dead) continue;

      hitAnything = true;
      zombie.userData.health -= gun.damage + state.damageBoost;

      const originalColor = hit.object.material.color?.clone();
      if (originalColor) {
        hit.object.material.color.set(0xffd36a);
        window.setTimeout(() => {
          if (hit.object?.material?.color) hit.object.material.color.copy(originalColor);
        }, 80);
      }

      if (zombie.userData.health <= 0) {
        zombie.userData.dead = true;
        state.kills += 1;
        state.score += 100 + state.wave * 15;
        removeZombie(zombie);

        const nextWave = 1 + Math.floor(state.kills / 8);
        if (nextWave > state.wave) {
          state.wave = nextWave;
          showMessage(`WAVE ${state.wave} — MORE INFECTED INCOMING`, 2300);
        }
      }
    }
  }

  if (!hitAnything && state.ammo === 0) {
    showMessage("EMPTY — PRESS F TO SPELL");
  }

  updateHUD();
}

function takeDamage(amount) {
  if (state.damageCooldown > 0 || state.gameOver) return;

  state.damageCooldown = 0.35;
  state.health -= amount;
  updateHUD();

  damageFlash.classList.add("active");
  clearTimeout(damageFlashTimeout);
  damageFlashTimeout = setTimeout(() => damageFlash.classList.remove("active"), 120);

  if (state.health <= 0) endGame();
}

function endGame() {
  state.gameOver = true;
  state.paused = true;
  controls.unlock();

  finalScore.textContent = state.score;
  finalCorrect.textContent = state.correct;
  finalWave.textContent = state.wave;
  gameOverScreen.classList.add("visible");
  pauseScreen.classList.remove("visible");
  spellingScreen.classList.remove("visible");
  document.body.classList.remove("playing");
}

function updatePlayer(delta) {
  if (!controls.isLocked) return;

  velocity.x -= velocity.x * 10 * delta;
  velocity.z -= velocity.z * 10 * delta;

  direction.z = Number(keys.KeyW) - Number(keys.KeyS);
  direction.x = Number(keys.KeyD) - Number(keys.KeyA);
  direction.normalize();

  const acceleration = keys.ShiftLeft || keys.ShiftRight ? 82 : 56;

  if (keys.KeyW || keys.KeyS) velocity.z -= direction.z * acceleration * delta;
  if (keys.KeyA || keys.KeyD) velocity.x -= direction.x * acceleration * delta;

  controls.moveRight(-velocity.x * delta);
  controls.moveForward(-velocity.z * delta);

  camera.position.x = THREE.MathUtils.clamp(camera.position.x, -10, 10);
  camera.position.z = THREE.MathUtils.clamp(camera.position.z, -66, 66);
  camera.position.y = 1.72;

  const movementAmount = Math.min(1, Math.abs(velocity.x) + Math.abs(velocity.z));
  weapon.position.y = Math.sin(performance.now() * 0.01) * 0.008 * movementAmount;
}

function updateZombies(delta) {
  const playerFlat = new THREE.Vector3(camera.position.x, 0, camera.position.z);

  for (const zombie of zombies) {
    const toPlayer = playerFlat.clone().sub(zombie.position);
    const distance = toPlayer.length();

    if (distance > 0.001) {
      toPlayer.normalize();
      zombie.position.addScaledVector(toPlayer, zombie.userData.speed * delta);
      zombie.lookAt(camera.position.x, 1.25, camera.position.z);
    }

    zombie.userData.wobble += delta * (5 + zombie.userData.speed);
    zombie.rotation.z = Math.sin(zombie.userData.wobble) * 0.035;

    if (distance < 1.55 + zombie.userData.attackOffset) {
      takeDamage(7 + state.wave * 0.45);
    }
  }
}

function updateSpawning(delta) {
  state.spawnTimer -= delta;
  const maxZombies = Math.min(22, 5 + state.wave * 2);

  if (state.spawnTimer <= 0 && zombies.length < maxZombies) {
    createZombie();
    state.spawnTimer = Math.max(0.55, 2.25 - state.wave * 0.08) + Math.random() * 0.8;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  if (state.started && !state.paused && !state.gameOver && controls.isLocked) {
    state.damageCooldown = Math.max(0, state.damageCooldown - delta);
    updatePlayer(delta);
    updateZombies(delta);
    updateSpawning(delta);
  }

  renderer.render(scene, camera);
}

startButton.addEventListener("click", () => {
  if (!state.started) resetGame();
  else controls.lock();
});

resumeButton.addEventListener("click", () => {
  state.paused = false;
  pauseScreen.classList.remove("visible");
  controls.lock();
});

pauseSpellButton.addEventListener("click", openSpelling);
restartButton.addEventListener("click", resetGame);
closeSpellingButton.addEventListener("click", closeSpelling);

controls.addEventListener("lock", () => {
  if (state.gameOver || state.spelling) return;
  state.paused = false;
  pauseScreen.classList.remove("visible");
  startScreen.classList.remove("visible");
  document.body.classList.add("playing");
});

controls.addEventListener("unlock", () => {
  document.body.classList.remove("playing");
  if (!state.started || state.spelling || state.gameOver) return;
  state.paused = true;
  pauseScreen.classList.add("visible");
});

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;

  if (event.code === "KeyF" && !event.repeat && state.started && !state.gameOver) {
    event.preventDefault();
    if (!state.spelling) openSpelling();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

window.addEventListener("mousedown", (event) => {
  if (event.button === 0) shoot();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener("blur", () => {
  Object.keys(keys).forEach((key) => {
    keys[key] = false;
  });
});

updateHUD();
applyGunLook();
animate();
