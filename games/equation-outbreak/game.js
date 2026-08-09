import * as THREE from 'three';

const $ = (selector) => document.querySelector(selector);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;

const ui = {
  startScreen: $('#start-screen'),
  loadingScreen: $('#loading-screen'),
  startButton: $('#start-button'),
  playerName: $('#player-name'),
  schoolGrade: $('#school-grade'),
  hud: $('#hud'),
  hudName: $('#hud-name'),
  hudGrade: $('#hud-grade'),
  hudScore: $('#hud-score'),
  gasText: $('#gas-text'),
  gasMeter: $('#gas-meter'),
  healthText: $('#health-text'),
  healthMeter: $('#health-meter'),
  ammoText: $('#ammo-text'),
  missionTitle: $('#mission-title'),
  missionDetail: $('#mission-detail'),
  speedValue: $('#speed-value'),
  vehicleLevel: $('#vehicle-level'),
  weaponName: $('#weapon-name'),
  spellingProgress: $('#spelling-progress'),
  driveControls: $('#drive-controls'),
  combatControls: $('#combat-controls'),
  minimap: $('#minimap'),
  toast: $('#message-toast'),
  crosshair: $('#crosshair'),
  quizPanel: $('#quiz-panel'),
  quizType: $('#quiz-type'),
  quizTitle: $('#quiz-title'),
  quizPrompt: $('#quiz-prompt'),
  quizAnswer: $('#quiz-answer'),
  quizFeedback: $('#quiz-feedback'),
  quizReward: $('#quiz-reward'),
  submitAnswer: $('#submit-answer'),
  closeQuiz: $('#close-quiz'),
  pausePanel: $('#pause-panel'),
  resumeButton: $('#resume-button'),
  downloadReportButton: $('#download-report-button'),
  restartButton: $('#restart-button'),
  finishPanel: $('#finish-panel'),
  finishTitle: $('#finish-title'),
  finalGrade: $('#final-grade'),
  finishSummary: $('#finish-summary'),
  finishDownload: $('#finish-download'),
  finishRestart: $('#finish-restart'),
};

const WORLD_LIMIT = 250;
const ROAD_SPACING = 80;
const ROAD_WIDTH = 24;
const MISSIONS = [
  { name: 'Library Lockdown', detail: 'Clear the reading plaza.', x: -160, z: 0, zombies: 4, reward: 450 },
  { name: 'Science Center Siege', detail: 'Save the laboratory district.', x: 80, z: 160, zombies: 6, reward: 700 },
  { name: 'Math Mall Mayhem', detail: 'Defeat the final minion wave.', x: 160, z: -160, zombies: 9, reward: 1000 },
];

const CAR_NAMES = ['Starter Coupe', 'Street Sport GT', 'Solar Supercar', 'Road Scholar Hypercar'];
const GUN_NAMES = ['Rusty Blaster', 'Scholar SMG', 'Plasma Speller', 'Golden Grammar Cannon'];
const CAR_COLORS = [0x2f7fda, 0xed3f45, 0x24c99a, 0xffc934];
const TRAFFIC_COLORS = [0xf1f1f1, 0x222831, 0x3178c6, 0xe14d4d, 0xd8a934, 0x5b4bd9, 0x43a36a];

const WORD_BANKS = {
  1: ['cat', 'dog', 'sun', 'run', 'jump', 'blue', 'fish', 'tree', 'book', 'play'],
  2: ['school', 'friend', 'little', 'happy', 'yellow', 'window', 'rabbit', 'garden', 'pencil', 'water'],
  3: ['because', 'favorite', 'different', 'animal', 'country', 'important', 'sentence', 'weather', 'family', 'minute'],
  4: ['adventure', 'beautiful', 'calendar', 'dangerous', 'discover', 'electric', 'imagine', 'knowledge', 'traffic', 'vehicle'],
  5: ['community', 'environment', 'excellent', 'government', 'necessary', 'opportunity', 'temperature', 'mysterious', 'responsible', 'technology'],
  6: ['achievement', 'architecture', 'consequence', 'development', 'independent', 'maintenance', 'perspective', 'recommendation', 'significant', 'transportation'],
  7: ['acceleration', 'characteristic', 'circumstance', 'communication', 'extraordinary', 'investigation', 'mathematical', 'pronunciation', 'sophisticated', 'vocabulary'],
  8: ['accommodate', 'conscientious', 'entrepreneur', 'exhilarating', 'infrastructure', 'miscellaneous', 'perseverance', 'questionnaire', 'rhythmically', 'surveillance'],
};

const WORD_HINTS = {
  cat: 'a small pet that says meow', dog: 'a pet that barks', sun: 'the star in our sky', run: 'to move quickly', jump: 'to leap upward',
  school: 'a place for learning', friend: 'a person you trust', little: 'small in size', happy: 'feeling joy', yellow: 'the color of sunshine',
  because: 'a word used to give a reason', favorite: 'liked more than others', different: 'not the same', animal: 'a living creature', country: 'a nation',
  adventure: 'an exciting experience', beautiful: 'very pleasing to see', calendar: 'shows days and months', dangerous: 'likely to cause harm', discover: 'to find something new',
  community: 'people living or working together', environment: 'the surroundings where life exists', excellent: 'extremely good', government: 'a system that leads a country', necessary: 'needed',
  achievement: 'something accomplished through effort', architecture: 'the design of buildings', consequence: 'a result of an action', independent: 'able to act on your own', perspective: 'a point of view',
  acceleration: 'an increase in speed', characteristic: 'a feature or quality', circumstance: 'a condition affecting an event', extraordinary: 'very unusual or remarkable', investigation: 'a careful search for facts',
  accommodate: 'to provide room or adjust for someone', conscientious: 'careful and responsible', entrepreneur: 'a person who starts a business', infrastructure: 'basic systems that support a city', perseverance: 'continuing despite difficulty',
};

const state = {
  started: false,
  running: false,
  paused: false,
  finished: false,
  mode: 'drive',
  name: 'Driver',
  schoolGrade: 4,
  score: 0,
  gas: 72,
  health: 100,
  ammo: 20,
  carSpeed: 0,
  carLevel: 0,
  gunLevel: 0,
  mathCorrect: 0,
  mathAttempts: 0,
  spellCorrect: 0,
  spellAttempts: 0,
  spellingStreak: 0,
  bestSpellingStreak: 0,
  kills: 0,
  missionsCompleted: 0,
  missionIndex: 0,
  missionActive: false,
  missionCleared: false,
  quizOpen: false,
  quizType: null,
  quizExpected: null,
  currentWord: null,
  currentMathText: '',
  toastTimer: null,
  totalDistance: 0,
  elapsed: 0,
  collisionCooldown: 0,
  shotCooldown: 0,
};

let scene;
let camera;
let renderer;
let clock;
let car;
let player;
let missionMarker;
let markerBeam;
let worldGroup;
let trafficGroup;
let effectsGroup;
let zombieGroup;
let trafficLights = [];
let trafficCars = [];
let buildingColliders = [];
let zombies = [];
let keys = Object.create(null);
let combatYaw = 0;
let combatPitch = -0.18;
let raycaster = new THREE.Raycaster();
let audioContext;
let engineOscillator;
let engineGain;
let minimapContext = ui.minimap.getContext('2d');

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function showToast(message, duration = 1900) {
  ui.toast.textContent = message;
  ui.toast.classList.add('show');
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => ui.toast.classList.remove('show'), duration);
}

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    engineOscillator = audioContext.createOscillator();
    engineGain = audioContext.createGain();
    engineOscillator.type = 'sawtooth';
    engineOscillator.frequency.value = 56;
    engineGain.gain.value = 0.015;
    engineOscillator.connect(engineGain).connect(audioContext.destination);
    engineOscillator.start();
  } catch (error) {
    console.warn('Audio could not start:', error);
  }
}

function playTone(frequency = 440, duration = 0.08, type = 'sine', volume = 0.08) {
  if (!audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function createMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.15,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
  });
}

function makeMesh(geometry, material, cast = true, receive = true) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function createSky() {
  const skyGeometry = new THREE.SphereGeometry(650, 32, 16);
  const skyMaterial = new THREE.MeshBasicMaterial({ color: 0x8fb7d4, side: THREE.BackSide });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);

  const sun = makeMesh(
    new THREE.SphereGeometry(12, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff0b0 }),
    false,
    false,
  );
  sun.position.set(-180, 220, -260);
  scene.add(sun);

  for (let i = 0; i < 18; i += 1) {
    const cloud = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f7fa, roughness: 1 });
    for (let p = 0; p < 4; p += 1) {
      const puff = makeMesh(new THREE.SphereGeometry(randomRange(5, 10), 10, 8), cloudMaterial, false, false);
      puff.position.set(p * 7 + randomRange(-2, 2), randomRange(-2, 3), randomRange(-3, 3));
      cloud.add(puff);
    }
    cloud.position.set(randomRange(-300, 300), randomRange(70, 125), randomRange(-300, 300));
    cloud.userData.speed = randomRange(0.5, 1.2);
    cloud.userData.isCloud = true;
    scene.add(cloud);
  }
}

function createRoads() {
  const ground = makeMesh(
    new THREE.PlaneGeometry(620, 620),
    createMaterial(0x4e783f, { roughness: 1 }),
    false,
    true,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.08;
  worldGroup.add(ground);

  const roadMaterial = createMaterial(0x252a30, { roughness: 0.9, metalness: 0.02 });
  const curbMaterial = createMaterial(0xa8adb1, { roughness: 0.9 });
  const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xe9d85a });
  const edgeLineMaterial = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });

  for (let road = -240; road <= 240; road += ROAD_SPACING) {
    const horizontal = makeMesh(new THREE.PlaneGeometry(560, ROAD_WIDTH), roadMaterial, false, true);
    horizontal.rotation.x = -Math.PI / 2;
    horizontal.position.set(0, 0.01, road);
    worldGroup.add(horizontal);

    const vertical = makeMesh(new THREE.PlaneGeometry(ROAD_WIDTH, 560), roadMaterial, false, true);
    vertical.rotation.x = -Math.PI / 2;
    vertical.position.set(road, 0.015, 0);
    worldGroup.add(vertical);

    for (let t = -264; t <= 264; t += 12) {
      const dashH = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 0.28), lineMaterial);
      dashH.rotation.x = -Math.PI / 2;
      dashH.position.set(t, 0.035, road);
      worldGroup.add(dashH);

      const dashV = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 5.5), lineMaterial);
      dashV.rotation.x = -Math.PI / 2;
      dashV.position.set(road, 0.036, t);
      worldGroup.add(dashV);
    }

    for (const side of [-1, 1]) {
      const edgeH = new THREE.Mesh(new THREE.PlaneGeometry(560, 0.22), edgeLineMaterial);
      edgeH.rotation.x = -Math.PI / 2;
      edgeH.position.set(0, 0.034, road + side * (ROAD_WIDTH / 2 - 1.8));
      worldGroup.add(edgeH);

      const edgeV = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 560), edgeLineMaterial);
      edgeV.rotation.x = -Math.PI / 2;
      edgeV.position.set(road + side * (ROAD_WIDTH / 2 - 1.8), 0.035, 0);
      worldGroup.add(edgeV);

      const curbH = makeMesh(new THREE.BoxGeometry(560, 0.45, 0.7), curbMaterial, false, true);
      curbH.position.set(0, 0.22, road + side * (ROAD_WIDTH / 2 + 0.35));
      worldGroup.add(curbH);

      const curbV = makeMesh(new THREE.BoxGeometry(0.7, 0.45, 560), curbMaterial, false, true);
      curbV.position.set(road + side * (ROAD_WIDTH / 2 + 0.35), 0.22, 0);
      worldGroup.add(curbV);
    }
  }
}

function createBuilding(x, z, width, depth, height, color) {
  const group = new THREE.Group();
  const base = makeMesh(new THREE.BoxGeometry(width, height, depth), createMaterial(color, { roughness: 0.68 }));
  base.position.y = height / 2;
  group.add(base);

  const roof = makeMesh(
    new THREE.BoxGeometry(width + 0.7, 0.6, depth + 0.7),
    createMaterial(0x2f343a, { roughness: 0.8 }),
  );
  roof.position.y = height + 0.3;
  group.add(roof);

  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ed9ed,
    emissive: 0x214a5d,
    emissiveIntensity: 0.42,
    roughness: 0.2,
    metalness: 0.3,
  });
  const floors = Math.max(2, Math.floor(height / 6));
  const frontCount = Math.max(2, Math.floor(width / 5));
  for (let floor = 1; floor < floors; floor += 1) {
    for (let col = 0; col < frontCount; col += 1) {
      const wx = -width / 2 + 2.2 + (col * (width - 4.4)) / Math.max(1, frontCount - 1);
      const wy = 2.4 + floor * 5.2;
      const front = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), windowMaterial);
      front.position.set(wx, Math.min(wy, height - 2), -depth / 2 - 0.012);
      front.rotation.y = Math.PI;
      group.add(front);
      const back = front.clone();
      back.position.z = depth / 2 + 0.012;
      back.rotation.y = 0;
      group.add(back);
    }
  }

  const door = makeMesh(new THREE.BoxGeometry(2.2, 3.4, 0.25), createMaterial(0x35291e, { roughness: 0.8 }));
  door.position.set(0, 1.7, -depth / 2 - 0.12);
  group.add(door);

  group.position.set(x, 0, z);
  worldGroup.add(group);
  buildingColliders.push({
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
  });
}

function createTree(x, z) {
  const group = new THREE.Group();
  const trunk = makeMesh(new THREE.CylinderGeometry(0.45, 0.65, 4.5, 8), createMaterial(0x6a4728, { roughness: 1 }));
  trunk.position.y = 2.25;
  group.add(trunk);
  const leaves = makeMesh(new THREE.IcosahedronGeometry(2.7, 1), createMaterial(0x2e8b49, { roughness: 1 }));
  leaves.position.y = 5.6;
  group.add(leaves);
  group.position.set(x, 0, z);
  worldGroup.add(group);
}

function createStreetLight(x, z, rotation = 0) {
  const group = new THREE.Group();
  const poleMaterial = createMaterial(0x343a40, { roughness: 0.45, metalness: 0.7 });
  const pole = makeMesh(new THREE.CylinderGeometry(0.13, 0.18, 7.5, 8), poleMaterial);
  pole.position.y = 3.75;
  group.add(pole);
  const arm = makeMesh(new THREE.BoxGeometry(0.2, 0.2, 2), poleMaterial);
  arm.position.set(0, 7.25, -0.9);
  group.add(arm);
  const lamp = makeMesh(
    new THREE.BoxGeometry(0.75, 0.25, 1.05),
    createMaterial(0xfff2b0, { emissive: 0xffdf66, emissiveIntensity: 1.8 }),
  );
  lamp.position.set(0, 7.05, -1.72);
  group.add(lamp);
  group.position.set(x, 0, z);
  group.rotation.y = rotation;
  worldGroup.add(group);
}

function buildCityBlocks() {
  const buildingColors = [0x9a7d68, 0x6d7f8d, 0xa65d57, 0x697b62, 0x8e7ca5, 0xb38e55, 0x5d738d];
  const centers = [-200, -120, -40, 40, 120, 200];

  for (const x of centers) {
    for (const z of centers) {
      const pattern = Math.random();
      if (pattern < 0.3) {
        createBuilding(x - 14, z, 22, 43, randomRange(18, 48), pick(buildingColors));
        createBuilding(x + 15, z - 8, 20, 25, randomRange(14, 34), pick(buildingColors));
        createTree(x + 13, z + 15);
      } else if (pattern < 0.65) {
        createBuilding(x, z, 43, 43, randomRange(22, 58), pick(buildingColors));
      } else {
        createBuilding(x - 13, z - 13, 22, 22, randomRange(14, 36), pick(buildingColors));
        createBuilding(x + 14, z + 12, 21, 24, randomRange(14, 40), pick(buildingColors));
        createTree(x + 13, z - 15);
        createTree(x - 14, z + 15);
      }
    }
  }

  for (let road = -240; road <= 240; road += ROAD_SPACING) {
    for (let p = -220; p <= 220; p += 40) {
      if (Math.abs(p % ROAD_SPACING) < 15) continue;
      createStreetLight(p, road - ROAD_WIDTH / 2 - 1.4, 0);
      createStreetLight(road + ROAD_WIDTH / 2 + 1.4, p, Math.PI / 2);
    }
  }
}

function createTrafficSignal(x, z) {
  const signal = { x, z, bulbs: [] };
  const poleMaterial = createMaterial(0x292e34, { metalness: 0.7, roughness: 0.45 });
  const placements = [
    { px: x - 13.5, pz: z - 13.5, axis: 'ns', rot: 0 },
    { px: x + 13.5, pz: z + 13.5, axis: 'ns', rot: Math.PI },
    { px: x + 13.5, pz: z - 13.5, axis: 'ew', rot: Math.PI / 2 },
    { px: x - 13.5, pz: z + 13.5, axis: 'ew', rot: -Math.PI / 2 },
  ];

  for (const item of placements) {
    const group = new THREE.Group();
    const pole = makeMesh(new THREE.CylinderGeometry(0.12, 0.18, 5.6, 8), poleMaterial);
    pole.position.y = 2.8;
    group.add(pole);
    const box = makeMesh(new THREE.BoxGeometry(0.75, 1.8, 0.7), createMaterial(0x11161a, { roughness: 0.65 }));
    box.position.set(0, 5.2, -0.25);
    group.add(box);
    const red = makeMesh(new THREE.SphereGeometry(0.2, 10, 8), createMaterial(0x441010, { emissive: 0x220000, emissiveIntensity: 0.4 }));
    red.position.set(0, 5.65, -0.63);
    group.add(red);
    const green = makeMesh(new THREE.SphereGeometry(0.2, 10, 8), createMaterial(0x103c20, { emissive: 0x002a0c, emissiveIntensity: 0.4 }));
    green.position.set(0, 4.77, -0.63);
    group.add(green);
    group.position.set(item.px, 0, item.pz);
    group.rotation.y = item.rot;
    worldGroup.add(group);
    signal.bulbs.push({ axis: item.axis, red, green });
  }
  trafficLights.push(signal);
}

function createTrafficLights() {
  for (const x of [-80, 0, 80]) {
    for (const z of [-80, 0, 80]) createTrafficSignal(x, z);
  }
}

function createCarModel(level = 0, color = CAR_COLORS[level], traffic = false) {
  const group = new THREE.Group();
  const bodyMaterial = createMaterial(color, { roughness: 0.28, metalness: 0.62 });
  const darkMaterial = createMaterial(0x12171c, { roughness: 0.35, metalness: 0.55 });
  const glassMaterial = createMaterial(0x5d94ad, { roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.75 });
  const chromeMaterial = createMaterial(0xc4d0d7, { roughness: 0.15, metalness: 0.9 });

  const length = traffic ? randomRange(5.5, 6.7) : 6.4 + level * 0.22;
  const width = traffic ? randomRange(2.65, 3.05) : 3.0 + level * 0.06;
  const bodyHeight = 1.05;

  const chassis = makeMesh(new THREE.BoxGeometry(width, bodyHeight, length), bodyMaterial);
  chassis.position.y = 1.05;
  group.add(chassis);

  const hood = makeMesh(new THREE.BoxGeometry(width * 0.92, 0.48, length * 0.34), bodyMaterial);
  hood.position.set(0, 1.73, -length * 0.31);
  hood.rotation.x = -0.045;
  group.add(hood);

  const cabin = makeMesh(new THREE.BoxGeometry(width * 0.8, 1.05, length * 0.38), glassMaterial);
  cabin.position.set(0, 2.15, length * 0.02);
  group.add(cabin);

  const roof = makeMesh(new THREE.BoxGeometry(width * 0.73, 0.18, length * 0.29), bodyMaterial);
  roof.position.set(0, 2.77, length * 0.04);
  group.add(roof);

  const frontBumper = makeMesh(new THREE.BoxGeometry(width * 0.96, 0.32, 0.24), darkMaterial);
  frontBumper.position.set(0, 0.73, -length / 2 - 0.08);
  group.add(frontBumper);

  const rearBumper = frontBumper.clone();
  rearBumper.position.z = length / 2 + 0.08;
  group.add(rearBumper);

  const grille = makeMesh(new THREE.BoxGeometry(width * 0.5, 0.4, 0.08), darkMaterial);
  grille.position.set(0, 1.12, -length / 2 - 0.13);
  group.add(grille);

  const wheelMaterial = createMaterial(0x0a0b0d, { roughness: 0.82 });
  const rimMaterial = chromeMaterial;
  const wheelPositions = [
    [-width / 2 - 0.12, 0.68, -length * 0.31],
    [width / 2 + 0.12, 0.68, -length * 0.31],
    [-width / 2 - 0.12, 0.68, length * 0.31],
    [width / 2 + 0.12, 0.68, length * 0.31],
  ];
  const wheels = [];
  for (const [x, y, z] of wheelPositions) {
    const wheelGroup = new THREE.Group();
    const tire = makeMesh(new THREE.CylinderGeometry(0.72, 0.72, 0.42, 18), wheelMaterial);
    tire.rotation.z = Math.PI / 2;
    wheelGroup.add(tire);
    const rim = makeMesh(new THREE.CylinderGeometry(0.36, 0.36, 0.45, 12), rimMaterial);
    rim.rotation.z = Math.PI / 2;
    wheelGroup.add(rim);
    wheelGroup.position.set(x, y, z);
    wheelGroup.userData.wheel = true;
    group.add(wheelGroup);
    wheels.push(wheelGroup);
  }

  const headlightMaterial = createMaterial(0xeaf7ff, { emissive: 0xdff7ff, emissiveIntensity: 2.5 });
  const tailMaterial = createMaterial(0xff3047, { emissive: 0xff1028, emissiveIntensity: 2.0 });
  for (const x of [-width * 0.31, width * 0.31]) {
    const headlight = makeMesh(new THREE.BoxGeometry(0.62, 0.28, 0.12), headlightMaterial);
    headlight.position.set(x, 1.36, -length / 2 - 0.1);
    group.add(headlight);
    const tail = makeMesh(new THREE.BoxGeometry(0.58, 0.25, 0.12), tailMaterial);
    tail.position.set(x, 1.32, length / 2 + 0.1);
    group.add(tail);
  }

  if (!traffic && level >= 1) {
    const splitter = makeMesh(new THREE.BoxGeometry(width * 1.04, 0.12, 0.55), darkMaterial);
    splitter.position.set(0, 0.47, -length / 2 + 0.04);
    group.add(splitter);
  }
  if (!traffic && level >= 2) {
    const wing = makeMesh(new THREE.BoxGeometry(width * 0.92, 0.14, 0.42), darkMaterial);
    wing.position.set(0, 2.18, length / 2 - 0.2);
    group.add(wing);
    const supports = [-width * 0.28, width * 0.28];
    for (const x of supports) {
      const support = makeMesh(new THREE.BoxGeometry(0.1, 0.7, 0.12), darkMaterial);
      support.position.set(x, 1.82, length / 2 - 0.16);
      group.add(support);
    }
  }
  if (!traffic && level >= 3) {
    const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x151515 });
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.55, length * 0.78), stripeMaterial);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 2.99, 0.02);
    group.add(stripe);
    const neonMaterial = createMaterial(0x79ffff, { emissive: 0x19d9ff, emissiveIntensity: 2.3 });
    const neon = makeMesh(new THREE.BoxGeometry(width * 0.82, 0.05, length * 0.7), neonMaterial, false, false);
    neon.position.y = 0.36;
    group.add(neon);
  }

  group.userData.wheels = wheels;
  group.userData.length = length;
  group.userData.width = width;
  return group;
}

function createPlayerCar() {
  car = createCarModel(state.carLevel);
  car.position.set(0, 0, 210);
  car.rotation.y = 0;
  scene.add(car);
}

function upgradeCarAndGun() {
  let newLevel = 0;
  if (state.spellCorrect >= 18) newLevel = 3;
  else if (state.spellCorrect >= 10) newLevel = 2;
  else if (state.spellCorrect >= 4) newLevel = 1;

  if (newLevel <= state.carLevel) return;
  state.carLevel = newLevel;
  state.gunLevel = newLevel;

  const oldPosition = car.position.clone();
  const oldRotation = car.rotation.y;
  scene.remove(car);
  car = createCarModel(state.carLevel);
  car.position.copy(oldPosition);
  car.rotation.y = oldRotation;
  scene.add(car);

  if (player) updatePlayerGun();
  ui.vehicleLevel.textContent = CAR_NAMES[state.carLevel];
  ui.weaponName.textContent = GUN_NAMES[state.gunLevel];
  showToast(`UPGRADE! ${CAR_NAMES[state.carLevel]} + ${GUN_NAMES[state.gunLevel]}`, 3500);
  playTone(520, 0.13, 'triangle', 0.1);
  setTimeout(() => playTone(780, 0.18, 'triangle', 0.09), 100);
}

function createTraffic() {
  trafficGroup = new THREE.Group();
  scene.add(trafficGroup);
  const roads = [-240, -160, -80, 0, 80, 160, 240];

  for (let i = 0; i < 20; i += 1) {
    const axis = Math.random() > 0.5 ? 'x' : 'z';
    const road = pick(roads);
    const direction = Math.random() > 0.5 ? 1 : -1;
    const laneOffset = direction > 0 ? -4.7 : 4.7;
    const trafficCar = createCarModel(0, pick(TRAFFIC_COLORS), true);
    const coordinate = randomRange(-WORLD_LIMIT, WORLD_LIMIT);

    if (axis === 'x') {
      trafficCar.position.set(coordinate, 0, road + laneOffset);
      trafficCar.rotation.y = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
    } else {
      trafficCar.position.set(road - laneOffset, 0, coordinate);
      trafficCar.rotation.y = direction > 0 ? Math.PI : 0;
    }

    trafficCar.userData.axis = axis;
    trafficCar.userData.road = road;
    trafficCar.userData.direction = direction;
    trafficCar.userData.baseSpeed = randomRange(12, 21);
    trafficCar.userData.speed = trafficCar.userData.baseSpeed;
    trafficCar.userData.hitTimer = 0;
    trafficCars.push(trafficCar);
    trafficGroup.add(trafficCar);
  }
}

function createMissionMarker() {
  missionMarker = new THREE.Group();
  const ring = makeMesh(
    new THREE.TorusGeometry(8, 0.6, 12, 44),
    createMaterial(0xffd74c, { emissive: 0xffbd21, emissiveIntensity: 2.5 }),
    false,
    false,
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.7;
  missionMarker.add(ring);

  markerBeam = makeMesh(
    new THREE.CylinderGeometry(2.2, 6.5, 35, 22, 1, true),
    createMaterial(0xffd84f, { emissive: 0xffc02e, emissiveIntensity: 1.4, transparent: true, opacity: 0.18 }),
    false,
    false,
  );
  markerBeam.position.y = 17.5;
  missionMarker.add(markerBeam);
  scene.add(missionMarker);
  updateMissionMarker();
}

function updateMissionMarker() {
  if (!missionMarker) return;
  const mission = MISSIONS[state.missionIndex];
  if (!mission || state.mode !== 'drive' || state.missionActive) {
    missionMarker.visible = false;
    return;
  }
  missionMarker.visible = true;
  missionMarker.position.set(mission.x, 0, mission.z);
  ui.missionTitle.textContent = mission.name;
  ui.missionDetail.textContent = `${mission.detail} Drive to the yellow beacon and press E.`;
}

function createPlayerModel() {
  const group = new THREE.Group();
  const shirt = makeMesh(new THREE.CapsuleGeometry(0.55, 1.05, 6, 10), createMaterial(0x275fbb, { roughness: 0.72 }));
  shirt.position.y = 1.65;
  group.add(shirt);
  const head = makeMesh(new THREE.SphereGeometry(0.46, 16, 12), createMaterial(0xc8895c, { roughness: 0.86 }));
  head.position.y = 2.85;
  group.add(head);
  const legMaterial = createMaterial(0x1b2430, { roughness: 0.84 });
  for (const x of [-0.24, 0.24]) {
    const leg = makeMesh(new THREE.CapsuleGeometry(0.18, 0.75, 4, 8), legMaterial);
    leg.position.set(x, 0.65, 0);
    group.add(leg);
  }
  const armMaterial = createMaterial(0xc8895c, { roughness: 0.86 });
  const arm = makeMesh(new THREE.CapsuleGeometry(0.14, 0.8, 4, 8), armMaterial);
  arm.rotation.x = Math.PI / 2.7;
  arm.position.set(0.45, 1.9, -0.4);
  group.add(arm);
  const arm2 = arm.clone();
  arm2.position.x = -0.45;
  group.add(arm2);

  const gun = new THREE.Group();
  gun.name = 'player-gun';
  gun.position.set(0.28, 1.85, -0.78);
  group.add(gun);
  group.userData.gun = gun;
  updateGunMesh(group);
  return group;
}

function updateGunMesh(targetPlayer = player) {
  if (!targetPlayer) return;
  const gun = targetPlayer.userData.gun;
  while (gun.children.length) gun.remove(gun.children[0]);
  const level = state.gunLevel;
  const colors = [0x4a4f55, 0x1e6db5, 0x9a56da, 0xffca32];
  const gunMaterial = createMaterial(colors[level], { roughness: 0.25, metalness: 0.75, emissive: level >= 2 ? colors[level] : 0x000000, emissiveIntensity: level >= 2 ? 0.35 : 0 });
  const body = makeMesh(new THREE.BoxGeometry(0.42 + level * 0.08, 0.38, 1.35 + level * 0.18), gunMaterial);
  gun.add(body);
  const barrel = makeMesh(new THREE.CylinderGeometry(0.1 + level * 0.02, 0.12, 0.9 + level * 0.15, 10), createMaterial(0x171b20, { metalness: 0.8, roughness: 0.3 }));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.z = -0.95 - level * 0.15;
  gun.add(barrel);
  if (level >= 2) {
    const scope = makeMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.48, 10), gunMaterial);
    scope.rotation.z = Math.PI / 2;
    scope.position.y = 0.3;
    gun.add(scope);
  }
  const muzzle = makeMesh(
    new THREE.SphereGeometry(0.19 + level * 0.03, 10, 8),
    createMaterial(0xffe169, { emissive: 0xff7b16, emissiveIntensity: 5, transparent: true, opacity: 0 }),
    false,
    false,
  );
  muzzle.name = 'muzzle-flash';
  muzzle.position.z = -1.42 - level * 0.29;
  gun.add(muzzle);
}

function updatePlayerGun() {
  updateGunMesh(player);
}

function createZombie(position, difficulty = 1) {
  const group = new THREE.Group();
  const skinColor = pick([0x6ca34f, 0x7e9b51, 0x4e8f65, 0x8a9e57]);
  const skin = createMaterial(skinColor, { roughness: 0.94 });
  const shirt = createMaterial(pick([0x5a2e36, 0x403c6d, 0x58584c, 0x6d4b2e, 0x263c4a]), { roughness: 0.9 });
  const pants = createMaterial(0x24292d, { roughness: 0.94 });

  const body = makeMesh(new THREE.CapsuleGeometry(0.5, 0.9, 5, 9), shirt);
  body.position.y = 1.55;
  group.add(body);
  const head = makeMesh(new THREE.SphereGeometry(0.48, 14, 10), skin);
  head.position.y = 2.72;
  group.add(head);
  const jaw = makeMesh(new THREE.BoxGeometry(0.55, 0.25, 0.42), skin);
  jaw.position.set(0, 2.48, -0.22);
  group.add(jaw);
  for (const x of [-0.19, 0.19]) {
    const eye = makeMesh(new THREE.SphereGeometry(0.07, 8, 6), createMaterial(0xff243a, { emissive: 0xff001b, emissiveIntensity: 3 }));
    eye.position.set(x, 2.82, -0.43);
    group.add(eye);
  }
  const armL = makeMesh(new THREE.CapsuleGeometry(0.14, 0.9, 4, 8), skin);
  armL.position.set(-0.65, 1.72, -0.35);
  armL.rotation.x = Math.PI / 2.4;
  armL.rotation.z = -0.2;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.65;
  armR.rotation.z = 0.2;
  group.add(armR);
  for (const x of [-0.24, 0.24]) {
    const leg = makeMesh(new THREE.CapsuleGeometry(0.18, 0.75, 4, 8), pants);
    leg.position.set(x, 0.62, 0);
    group.add(leg);
  }

  group.position.copy(position);
  group.userData.isZombie = true;
  group.userData.health = 1.25 + difficulty * 0.55;
  group.userData.maxHealth = group.userData.health;
  group.userData.speed = randomRange(1.5, 2.25) + difficulty * 0.08;
  group.userData.attackCooldown = randomRange(0, 0.7);
  group.userData.walkPhase = Math.random() * Math.PI * 2;
  group.userData.arms = [armL, armR];
  group.traverse((child) => {
    if (child.isMesh) child.userData.zombieRoot = group;
  });
  zombieGroup.add(group);
  zombies.push(group);
}

function spawnMissionZombies() {
  clearZombies();
  const mission = MISSIONS[state.missionIndex];
  const center = new THREE.Vector3(mission.x, 0, mission.z);
  for (let i = 0; i < mission.zombies; i += 1) {
    const angle = (i / mission.zombies) * Math.PI * 2 + randomRange(-0.25, 0.25);
    const radius = randomRange(14, 27);
    createZombie(
      new THREE.Vector3(center.x + Math.cos(angle) * radius, 0, center.z + Math.sin(angle) * radius),
      state.missionIndex + 1,
    );
  }
}

function clearZombies() {
  for (const zombie of zombies) zombieGroup.remove(zombie);
  zombies = [];
}

function startMission() {
  const mission = MISSIONS[state.missionIndex];
  if (!mission || state.mode !== 'drive') return;
  const distance = car.position.distanceTo(new THREE.Vector3(mission.x, 0, mission.z));
  if (distance > 14) {
    showToast(`Mission beacon is ${Math.round(distance)} meters away.`);
    return;
  }

  state.mode = 'combat';
  state.missionActive = true;
  state.missionCleared = false;
  state.carSpeed = 0;
  missionMarker.visible = false;
  player = createPlayerModel();
  player.position.copy(car.position).add(new THREE.Vector3(4, 0, 1));
  player.rotation.y = car.rotation.y;
  combatYaw = car.rotation.y;
  scene.add(player);
  spawnMissionZombies();
  ui.driveControls.classList.add('hidden');
  ui.combatControls.classList.remove('hidden');
  ui.crosshair.classList.remove('hidden');
  ui.missionTitle.textContent = mission.name;
  ui.missionDetail.textContent = `Minions remaining: ${zombies.length}. Click the game to aim.`;
  showToast('MISSION START! Click the game to lock your aim.', 3200);
  playTone(170, 0.25, 'sawtooth', 0.08);
}

function returnToCar() {
  if (state.mode !== 'combat') return;
  if (!state.missionCleared) {
    showToast('Clear every minion before returning to the car.');
    return;
  }
  document.exitPointerLock?.();
  scene.remove(player);
  player = null;
  clearZombies();
  state.mode = 'drive';
  state.missionActive = false;
  state.missionCleared = false;
  state.health = Math.min(100, state.health + 20);
  ui.driveControls.classList.remove('hidden');
  ui.combatControls.classList.add('hidden');
  ui.crosshair.classList.add('hidden');
  updateMissionMarker();
  showToast('Back in the car. Follow the next beacon!');
}

function completeMission() {
  const mission = MISSIONS[state.missionIndex];
  state.score += mission.reward;
  state.missionsCompleted += 1;
  state.missionCleared = true;
  state.missionIndex += 1;
  playTone(440, 0.12, 'triangle', 0.1);
  setTimeout(() => playTone(660, 0.15, 'triangle', 0.1), 120);
  setTimeout(() => playTone(880, 0.2, 'triangle', 0.08), 240);

  if (state.missionIndex >= MISSIONS.length) {
    ui.missionTitle.textContent = 'All outbreak zones cleared!';
    ui.missionDetail.textContent = 'The city is safe.';
    setTimeout(finishGame, 1200);
  } else {
    ui.missionTitle.textContent = `${mission.name} complete!`;
    ui.missionDetail.textContent = 'Press E to return to your upgraded car.';
    showToast(`MISSION COMPLETE! +${mission.reward} points`, 3300);
  }
}

function createParticleBurst(position, color, count = 12, speed = 5) {
  for (let i = 0; i < count; i += 1) {
    const particle = makeMesh(
      new THREE.SphereGeometry(randomRange(0.05, 0.14), 5, 4),
      new THREE.MeshBasicMaterial({ color }),
      false,
      false,
    );
    particle.position.copy(position);
    particle.userData.velocity = new THREE.Vector3(randomRange(-1, 1), randomRange(0.2, 1.3), randomRange(-1, 1)).normalize().multiplyScalar(randomRange(speed * 0.45, speed));
    particle.userData.life = randomRange(0.35, 0.75);
    effectsGroup.add(particle);
  }
}

function shoot() {
  if (state.mode !== 'combat' || state.paused || state.quizOpen || state.finished) return;
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock?.();
    return;
  }
  if (state.shotCooldown > 0) return;
  if (state.ammo <= 0) {
    showToast('Out of ammo! Press P and spell a word.');
    playTone(110, 0.08, 'square', 0.04);
    return;
  }

  const fireRates = [0.42, 0.22, 0.15, 0.1];
  state.shotCooldown = fireRates[state.gunLevel];
  state.ammo -= 1;
  playTone(95 + state.gunLevel * 35, 0.07, 'square', 0.12);

  const muzzle = player?.getObjectByName('muzzle-flash');
  if (muzzle) {
    muzzle.material.opacity = 1;
    setTimeout(() => { if (muzzle.material) muzzle.material.opacity = 0; }, 45);
  }

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = raycaster.intersectObjects(zombies, true);
  if (hits.length > 0) {
    let root = hits[0].object.userData.zombieRoot;
    if (!root) {
      let node = hits[0].object;
      while (node && !node.userData.isZombie) node = node.parent;
      root = node;
    }
    if (root?.userData.isZombie) {
      const damage = [1, 1.35, 1.85, 2.7][state.gunLevel];
      root.userData.health -= damage;
      createParticleBurst(hits[0].point, 0x92c86e, 9, 4.5);
      state.score += 20;
      if (root.userData.health <= 0) killZombie(root);
    }
  } else {
    const missPoint = camera.position.clone().add(raycaster.ray.direction.clone().multiplyScalar(45));
    createParticleBurst(missPoint, 0xffdf75, 4, 1.8);
  }
}

function killZombie(zombie) {
  const deathPosition = zombie.position.clone().add(new THREE.Vector3(0, 1.5, 0));
  createParticleBurst(deathPosition, 0x6dad51, 24, 7);
  zombieGroup.remove(zombie);
  zombies = zombies.filter((item) => item !== zombie);
  state.kills += 1;
  state.score += 100 + state.gunLevel * 25;
  playTone(72, 0.18, 'sawtooth', 0.08);
  ui.missionDetail.textContent = `Minions remaining: ${zombies.length}.`;
  if (zombies.length === 0) completeMission();
}

function isOnRoad(position) {
  const nearestXRoad = Math.round(position.x / ROAD_SPACING) * ROAD_SPACING;
  const nearestZRoad = Math.round(position.z / ROAD_SPACING) * ROAD_SPACING;
  return Math.abs(position.x - nearestXRoad) < ROAD_WIDTH / 2 || Math.abs(position.z - nearestZRoad) < ROAD_WIDTH / 2;
}

function buildingCollision(position, radius = 2.2) {
  return buildingColliders.some((box) => (
    position.x > box.minX - radius && position.x < box.maxX + radius &&
    position.z > box.minZ - radius && position.z < box.maxZ + radius
  ));
}

function damagePlayer(amount, reason = '') {
  if (state.collisionCooldown > 0) return;
  state.collisionCooldown = 0.55;
  state.health = clamp(state.health - amount, 0, 100);
  if (reason) showToast(reason);
  playTone(130, 0.11, 'sawtooth', 0.08);
  if (state.health <= 0) handleKnockout();
}

function handleKnockout() {
  state.score = Math.max(0, state.score - 250);
  state.health = 60;
  state.carSpeed = 0;
  if (state.mode === 'combat') {
    document.exitPointerLock?.();
    clearZombies();
    scene.remove(player);
    player = null;
    state.mode = 'drive';
    state.missionActive = false;
    state.missionCleared = false;
    car.position.set(0, 0, 210);
    car.rotation.y = 0;
    ui.driveControls.classList.remove('hidden');
    ui.combatControls.classList.add('hidden');
    ui.crosshair.classList.add('hidden');
    updateMissionMarker();
  } else {
    car.position.set(0, 0, 210);
    car.rotation.y = 0;
  }
  showToast('You were rescued! -250 points. Try the mission again.', 3500);
}

function updateDriving(dt) {
  if (!car) return;
  const accelerating = keys.KeyW || keys.ArrowUp;
  const reversing = keys.KeyS || keys.ArrowDown;
  const left = keys.KeyA || keys.ArrowLeft;
  const right = keys.KeyD || keys.ArrowRight;
  const braking = keys.Space;
  const maxSpeed = [38, 44, 51, 58][state.carLevel];
  const acceleration = [18, 20, 23, 27][state.carLevel];
  const reverseMax = -14;

  if (accelerating && state.gas > 0) {
    state.carSpeed += acceleration * dt;
    state.gas = Math.max(0, state.gas - (0.45 + Math.abs(state.carSpeed) * 0.012) * dt);
  } else if (reversing && state.gas > 0) {
    state.carSpeed -= acceleration * 0.7 * dt;
    state.gas = Math.max(0, state.gas - 0.32 * dt);
  } else {
    state.carSpeed *= Math.pow(0.965, dt * 60);
  }

  if (braking) state.carSpeed *= Math.pow(0.85, dt * 60);
  state.carSpeed = clamp(state.carSpeed, reverseMax, maxSpeed);
  if (Math.abs(state.carSpeed) < 0.04) state.carSpeed = 0;

  const steeringInput = (left ? 1 : 0) - (right ? 1 : 0);
  if (steeringInput !== 0 && Math.abs(state.carSpeed) > 0.2) {
    const steeringStrength = lerp(1.35, 0.72, Math.min(1, Math.abs(state.carSpeed) / maxSpeed));
    car.rotation.y += steeringInput * steeringStrength * dt * Math.sign(state.carSpeed);
  }

  const previous = car.position.clone();
  const forward = new THREE.Vector3(-Math.sin(car.rotation.y), 0, -Math.cos(car.rotation.y));
  const movement = forward.multiplyScalar(state.carSpeed * dt);
  car.position.add(movement);
  state.totalDistance += movement.length();

  car.position.x = clamp(car.position.x, -WORLD_LIMIT - 12, WORLD_LIMIT + 12);
  car.position.z = clamp(car.position.z, -WORLD_LIMIT - 12, WORLD_LIMIT + 12);

  if (!isOnRoad(car.position)) {
    state.carSpeed *= Math.pow(0.975, dt * 60);
    car.position.y = 0.05 + Math.sin(state.elapsed * 22) * Math.min(0.04, Math.abs(state.carSpeed) * 0.002);
  } else {
    car.position.y = lerp(car.position.y, 0, Math.min(1, dt * 8));
  }

  if (buildingCollision(car.position)) {
    car.position.copy(previous);
    state.carSpeed *= -0.22;
    damagePlayer(6, 'Building collision! Watch the road.');
  }

  for (const trafficCar of trafficCars) {
    if (trafficCar.position.distanceTo(car.position) < 4.25) {
      car.position.copy(previous);
      state.carSpeed *= -0.28;
      damagePlayer(8, 'Traffic collision!');
      break;
    }
  }

  const wheelRotation = state.carSpeed * dt * 1.4;
  for (const wheel of car.userData.wheels || []) wheel.rotation.x -= wheelRotation;

  if (state.gas <= 0.01 && accelerating) {
    state.gas = 0;
    state.carSpeed *= 0.97;
    if (!state.quizOpen) showToast('Out of gas! Press M to solve a math problem.');
  }

  if (engineOscillator && engineGain && audioContext) {
    const now = audioContext.currentTime;
    engineOscillator.frequency.setTargetAtTime(52 + Math.abs(state.carSpeed) * 3.1, now, 0.06);
    engineGain.gain.setTargetAtTime(0.008 + Math.min(0.038, Math.abs(state.carSpeed) * 0.00075), now, 0.08);
  }
}

function signalCycle() {
  const phase = state.elapsed % 16;
  return {
    nsGreen: phase < 7,
    ewGreen: phase >= 8 && phase < 15,
    transition: (phase >= 7 && phase < 8) || phase >= 15,
  };
}

function shouldTrafficStop(trafficCar, cycle) {
  const axis = trafficCar.userData.axis;
  const direction = trafficCar.userData.direction;
  const coordinate = axis === 'x' ? trafficCar.position.x : trafficCar.position.z;
  let nextIntersection;
  if (direction > 0) nextIntersection = Math.ceil((coordinate + 0.1) / ROAD_SPACING) * ROAD_SPACING;
  else nextIntersection = Math.floor((coordinate - 0.1) / ROAD_SPACING) * ROAD_SPACING;
  const distance = Math.abs(nextIntersection - coordinate);
  const red = axis === 'x' ? !cycle.ewGreen : !cycle.nsGreen;
  if (red && distance < 11.5) return true;

  const playerPosition = state.mode === 'drive' ? car?.position : player?.position;
  if (playerPosition && trafficCar.position.distanceTo(playerPosition) < 8.5) return true;
  return false;
}

function updateTraffic(dt) {
  const cycle = signalCycle();
  for (const light of trafficLights) {
    for (const bulb of light.bulbs) {
      const green = bulb.axis === 'ns' ? cycle.nsGreen : cycle.ewGreen;
      bulb.green.material.emissiveIntensity = green ? 3.2 : 0.25;
      bulb.green.material.color.setHex(green ? 0x32e56f : 0x103c20);
      bulb.red.material.emissiveIntensity = green ? 0.25 : 3.0;
      bulb.red.material.color.setHex(green ? 0x441010 : 0xff2738);
    }
  }

  for (const trafficCar of trafficCars) {
    trafficCar.userData.hitTimer = Math.max(0, trafficCar.userData.hitTimer - dt);
    const stop = shouldTrafficStop(trafficCar, cycle);
    const targetSpeed = stop ? 0 : trafficCar.userData.baseSpeed;
    trafficCar.userData.speed = lerp(trafficCar.userData.speed, targetSpeed, Math.min(1, dt * (stop ? 4 : 1.1)));
    const amount = trafficCar.userData.speed * trafficCar.userData.direction * dt;
    if (trafficCar.userData.axis === 'x') trafficCar.position.x += amount;
    else trafficCar.position.z += amount;

    if (trafficCar.position.x > WORLD_LIMIT + 18) trafficCar.position.x = -WORLD_LIMIT - 18;
    if (trafficCar.position.x < -WORLD_LIMIT - 18) trafficCar.position.x = WORLD_LIMIT + 18;
    if (trafficCar.position.z > WORLD_LIMIT + 18) trafficCar.position.z = -WORLD_LIMIT - 18;
    if (trafficCar.position.z < -WORLD_LIMIT - 18) trafficCar.position.z = WORLD_LIMIT + 18;

    for (const wheel of trafficCar.userData.wheels || []) wheel.rotation.x -= trafficCar.userData.speed * dt * 1.2;
  }
}

function updateCombat(dt) {
  if (!player) return;
  const forwardInput = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const strafeInput = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const sprint = keys.ShiftLeft || keys.ShiftRight;
  const speed = sprint ? 8.2 : 5.2;
  const forward = new THREE.Vector3(-Math.sin(combatYaw), 0, -Math.cos(combatYaw));
  const right = new THREE.Vector3(Math.cos(combatYaw), 0, -Math.sin(combatYaw));
  const movement = forward.multiplyScalar(forwardInput).add(right.multiplyScalar(strafeInput));
  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(speed * dt);
    const previous = player.position.clone();
    player.position.add(movement);
    if (buildingCollision(player.position, 0.7)) player.position.copy(previous);
  }
  player.position.x = clamp(player.position.x, -WORLD_LIMIT, WORLD_LIMIT);
  player.position.z = clamp(player.position.z, -WORLD_LIMIT, WORLD_LIMIT);
  player.rotation.y = combatYaw;

  for (const zombie of zombies) {
    zombie.userData.attackCooldown -= dt;
    const toPlayer = player.position.clone().sub(zombie.position);
    const distance = toPlayer.length();
    if (distance > 1.55) {
      toPlayer.y = 0;
      toPlayer.normalize();
      zombie.position.addScaledVector(toPlayer, zombie.userData.speed * dt);
      zombie.rotation.y = Math.atan2(-toPlayer.x, -toPlayer.z);
      zombie.userData.walkPhase += dt * 7;
      zombie.position.y = Math.abs(Math.sin(zombie.userData.walkPhase)) * 0.05;
      const arms = zombie.userData.arms;
      if (arms) {
        arms[0].rotation.z = -0.2 + Math.sin(zombie.userData.walkPhase) * 0.25;
        arms[1].rotation.z = 0.2 - Math.sin(zombie.userData.walkPhase) * 0.25;
      }
    } else if (zombie.userData.attackCooldown <= 0) {
      zombie.userData.attackCooldown = 0.9;
      damagePlayer(6 + state.missionIndex * 1.5, 'A minion hit you!');
      createParticleBurst(player.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0xff5b6a, 8, 3);
    }
  }
}

function updateEffects(dt) {
  for (let i = effectsGroup.children.length - 1; i >= 0; i -= 1) {
    const particle = effectsGroup.children[i];
    particle.userData.life -= dt;
    particle.userData.velocity.y -= 8 * dt;
    particle.position.addScaledVector(particle.userData.velocity, dt);
    particle.scale.multiplyScalar(0.97);
    if (particle.userData.life <= 0) effectsGroup.remove(particle);
  }
}

function updateCamera(dt) {
  if (!car || !camera) return;
  if (state.mode === 'drive') {
    const offset = new THREE.Vector3(0, 6.2, 12.5 + Math.min(5, Math.abs(state.carSpeed) * 0.08));
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
    const targetPosition = car.position.clone().add(offset);
    camera.position.lerp(targetPosition, 1 - Math.pow(0.0015, dt));
    const lookTarget = car.position.clone().add(new THREE.Vector3(0, 1.4, 0));
    const ahead = new THREE.Vector3(-Math.sin(car.rotation.y), 0, -Math.cos(car.rotation.y)).multiplyScalar(5 + Math.abs(state.carSpeed) * 0.08);
    lookTarget.add(ahead);
    camera.lookAt(lookTarget);
  } else if (player) {
    const horizontalDistance = 7.2;
    const offset = new THREE.Vector3(
      Math.sin(combatYaw) * horizontalDistance * Math.cos(combatPitch),
      4.2 + Math.sin(-combatPitch) * 4,
      Math.cos(combatYaw) * horizontalDistance * Math.cos(combatPitch),
    );
    const targetPosition = player.position.clone().add(offset);
    camera.position.lerp(targetPosition, 1 - Math.pow(0.0005, dt));
    const aimPoint = player.position.clone().add(new THREE.Vector3(0, 1.8 + Math.sin(combatPitch) * 4, 0));
    aimPoint.add(new THREE.Vector3(-Math.sin(combatYaw), 0, -Math.cos(combatYaw)).multiplyScalar(12));
    camera.lookAt(aimPoint);
  }
}

function updateMissionProximity() {
  if (state.mode !== 'drive' || state.missionIndex >= MISSIONS.length) return;
  const mission = MISSIONS[state.missionIndex];
  const distance = car.position.distanceTo(new THREE.Vector3(mission.x, 0, mission.z));
  if (distance < 15) {
    ui.missionDetail.textContent = `${mission.detail} Press E to begin.`;
  } else {
    ui.missionDetail.textContent = `${mission.detail} Beacon: ${Math.round(distance)} m away.`;
  }
}

function updateMissionAnimation() {
  if (!missionMarker?.visible) return;
  missionMarker.rotation.y += 0.01;
  const pulse = 1 + Math.sin(state.elapsed * 3.6) * 0.08;
  missionMarker.scale.set(pulse, 1, pulse);
  markerBeam.material.opacity = 0.13 + (Math.sin(state.elapsed * 2.8) + 1) * 0.045;
}

function updateClouds(dt) {
  for (const object of scene.children) {
    if (!object.userData.isCloud) continue;
    object.position.x += object.userData.speed * dt;
    if (object.position.x > 330) object.position.x = -330;
  }
}

function calculateGrade() {
  const totalAttempts = state.mathAttempts + state.spellAttempts;
  const totalCorrect = state.mathCorrect + state.spellCorrect;
  const academicAccuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
  const missionScore = (state.missionsCompleted / MISSIONS.length) * 18;
  const survivalScore = (state.health / 100) * 7;
  const progressScore = Math.min(5, state.spellCorrect * 0.25);
  const percent = clamp(academicAccuracy * 0.7 + missionScore + survivalScore + progressScore, 0, 100);
  let letter = 'F';
  if (percent >= 90) letter = 'A';
  else if (percent >= 80) letter = 'B';
  else if (percent >= 70) letter = 'C';
  else if (percent >= 60) letter = 'D';
  return { percent: Math.round(percent), letter, academicAccuracy: Math.round(academicAccuracy) };
}

function updateHud() {
  const grade = calculateGrade();
  ui.hudName.textContent = state.name;
  ui.hudGrade.textContent = `${grade.letter} ${grade.percent}%`;
  ui.hudScore.textContent = Math.round(state.score).toLocaleString();
  ui.gasText.textContent = `${Math.round(state.gas)}%`;
  ui.gasMeter.style.width = `${state.gas}%`;
  ui.healthText.textContent = `${Math.round(state.health)}%`;
  ui.healthMeter.style.width = `${state.health}%`;
  ui.ammoText.textContent = state.ammo;
  ui.speedValue.textContent = Math.round(Math.abs(state.carSpeed) * 2.15);
  ui.vehicleLevel.textContent = CAR_NAMES[state.carLevel];
  ui.weaponName.textContent = GUN_NAMES[state.gunLevel];
  const nextThreshold = [4, 10, 18, null][state.carLevel];
  ui.spellingProgress.textContent = nextThreshold
    ? `${state.spellCorrect}/${nextThreshold} words to upgrade`
    : `${state.spellCorrect} correct words • MAX LEVEL`;
}

function drawMinimap() {
  const canvas = ui.minimap;
  const ctx = minimapContext;
  const width = canvas.width;
  const height = canvas.height;
  const scale = width / (WORLD_LIMIT * 2 + 40);
  const mapPoint = (x, z) => ({
    x: width / 2 + x * scale,
    y: height / 2 + z * scale,
  });

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#08131d';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#43505c';
  ctx.lineWidth = Math.max(4, ROAD_WIDTH * scale);
  for (let road = -240; road <= 240; road += ROAD_SPACING) {
    const a = mapPoint(-WORLD_LIMIT, road);
    const b = mapPoint(WORLD_LIMIT, road);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = mapPoint(road, -WORLD_LIMIT);
    const d = mapPoint(road, WORLD_LIMIT);
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }

  for (const trafficCar of trafficCars) {
    const p = mapPoint(trafficCar.position.x, trafficCar.position.z);
    ctx.fillStyle = '#9aa7b3';
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  }

  const mission = MISSIONS[state.missionIndex];
  if (mission && state.mode === 'drive') {
    const p = mapPoint(mission.x, mission.z);
    ctx.fillStyle = '#ffd84f';
    ctx.beginPath(); ctx.arc(p.x, p.y, 6 + Math.sin(state.elapsed * 4) * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  for (const zombie of zombies) {
    const p = mapPoint(zombie.position.x, zombie.position.z);
    ctx.fillStyle = '#ff5366';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }

  const subject = state.mode === 'drive' ? car : player;
  if (subject) {
    const p = mapPoint(subject.position.x, subject.position.z);
    ctx.fillStyle = '#65e9ff';
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);
}

function createMathProblem() {
  const grade = state.schoolGrade;
  let a;
  let b;
  let operator;
  let answer;

  if (grade <= 1) {
    operator = Math.random() > 0.35 ? '+' : '−';
    a = Math.floor(randomRange(3, 16));
    b = Math.floor(randomRange(1, Math.min(a, 10)));
    answer = operator === '+' ? a + b : a - b;
  } else if (grade === 2) {
    operator = Math.random() > 0.5 ? '+' : '−';
    a = Math.floor(randomRange(12, 90));
    b = Math.floor(randomRange(3, operator === '−' ? a : 60));
    answer = operator === '+' ? a + b : a - b;
  } else if (grade === 3) {
    operator = pick(['+', '−', '×']);
    if (operator === '×') {
      a = Math.floor(randomRange(2, 11)); b = Math.floor(randomRange(2, 11)); answer = a * b;
    } else {
      a = Math.floor(randomRange(20, 140)); b = Math.floor(randomRange(5, operator === '−' ? a : 90)); answer = operator === '+' ? a + b : a - b;
    }
  } else if (grade <= 5) {
    operator = pick(['+', '−', '×', '÷']);
    if (operator === '×') {
      a = Math.floor(randomRange(3, 16)); b = Math.floor(randomRange(3, 13)); answer = a * b;
    } else if (operator === '÷') {
      answer = Math.floor(randomRange(2, 13)); b = Math.floor(randomRange(2, 11)); a = answer * b;
    } else {
      a = Math.floor(randomRange(50, 500)); b = Math.floor(randomRange(12, operator === '−' ? a : 300)); answer = operator === '+' ? a + b : a - b;
    }
  } else {
    operator = pick(['+', '−', '×', '÷']);
    if (operator === '×') {
      a = Math.floor(randomRange(12, 36)); b = Math.floor(randomRange(4, 18)); answer = a * b;
    } else if (operator === '÷') {
      answer = Math.floor(randomRange(4, 31)); b = Math.floor(randomRange(3, 16)); a = answer * b;
    } else {
      a = Math.floor(randomRange(150, 1400)); b = Math.floor(randomRange(40, operator === '−' ? a : 900)); answer = operator === '+' ? a + b : a - b;
    }
  }
  return { text: `${a} ${operator} ${b} = ?`, answer: String(answer) };
}

function speakWord() {
  if (!state.currentWord || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(state.currentWord);
  utterance.rate = 0.72;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function openQuiz(type) {
  if (!state.started || state.paused || state.finished) return;
  state.quizOpen = true;
  state.quizType = type;
  document.exitPointerLock?.();
  ui.quizPanel.classList.remove('hidden');
  ui.quizFeedback.textContent = '';
  ui.quizFeedback.className = 'feedback';
  ui.quizAnswer.value = '';

  if (type === 'math') {
    const problem = createMathProblem();
    state.quizExpected = problem.answer;
    state.currentMathText = problem.text;
    ui.quizType.textContent = 'FUEL STATION';
    ui.quizTitle.textContent = 'Solve for gas';
    ui.quizPrompt.textContent = problem.text;
    ui.quizPrompt.onclick = null;
    ui.quizAnswer.inputMode = 'numeric';
    ui.quizAnswer.placeholder = 'Type the answer';
    ui.quizReward.textContent = 'Correct answer: +20% gas and +100 points.';
  } else {
    const words = WORD_BANKS[state.schoolGrade] || WORD_BANKS[4];
    state.currentWord = pick(words);
    state.quizExpected = state.currentWord.toLowerCase();
    const hint = WORD_HINTS[state.currentWord] || `starts with “${state.currentWord[0].toUpperCase()}” and has ${state.currentWord.length} letters`;
    ui.quizType.textContent = 'AMMO FACTORY';
    ui.quizTitle.textContent = 'Listen and spell';
    ui.quizPrompt.textContent = '🔊 Click to hear the word';
    ui.quizPrompt.onclick = speakWord;
    ui.quizAnswer.inputMode = 'text';
    ui.quizAnswer.placeholder = `Hint: ${hint}`;
    ui.quizReward.textContent = 'Correct answer: +8 ammo, +120 points, and progress toward car/gun upgrades.';
    setTimeout(speakWord, 180);
  }
  setTimeout(() => ui.quizAnswer.focus(), 80);
}

function closeQuiz() {
  state.quizOpen = false;
  state.quizType = null;
  ui.quizPanel.classList.add('hidden');
  ui.quizFeedback.textContent = '';
}

function submitQuizAnswer() {
  const answer = ui.quizAnswer.value.trim().toLowerCase();
  if (!answer) return;
  const correct = answer === String(state.quizExpected).toLowerCase();

  if (state.quizType === 'math') {
    state.mathAttempts += 1;
    if (correct) {
      state.mathCorrect += 1;
      state.gas = Math.min(100, state.gas + 20);
      state.score += 100;
      ui.quizFeedback.textContent = 'Correct! Fuel created.';
      ui.quizFeedback.className = 'feedback good';
      playTone(660, 0.12, 'sine', 0.1);
    } else {
      state.score = Math.max(0, state.score - 15);
      ui.quizFeedback.textContent = `Not quite. The answer was ${state.quizExpected}.`;
      ui.quizFeedback.className = 'feedback bad';
      playTone(160, 0.14, 'square', 0.06);
    }
  } else {
    state.spellAttempts += 1;
    if (correct) {
      state.spellCorrect += 1;
      state.spellingStreak += 1;
      state.bestSpellingStreak = Math.max(state.bestSpellingStreak, state.spellingStreak);
      state.ammo += 8 + state.gunLevel * 2;
      state.score += 120 + state.spellingStreak * 5;
      ui.quizFeedback.textContent = `Correct! +${8 + state.gunLevel * 2} ammo.`;
      ui.quizFeedback.className = 'feedback good';
      playTone(740, 0.12, 'triangle', 0.1);
      upgradeCarAndGun();
    } else {
      state.spellingStreak = 0;
      state.score = Math.max(0, state.score - 15);
      ui.quizFeedback.textContent = `The correct spelling was “${state.currentWord}.”`;
      ui.quizFeedback.className = 'feedback bad';
      playTone(150, 0.14, 'square', 0.06);
    }
  }
  updateHud();

  const quizType = state.quizType;
  setTimeout(() => {
    if (!state.quizOpen) return;
    closeQuiz();
    openQuiz(quizType);
  }, 800);
}

function togglePause(force) {
  if (!state.started || state.finished || state.quizOpen) return;
  const shouldPause = typeof force === 'boolean' ? force : !state.paused;
  state.paused = shouldPause;
  ui.pausePanel.classList.toggle('hidden', !shouldPause);
  if (shouldPause) document.exitPointerLock?.();
  if (!shouldPause && audioContext?.state === 'suspended') audioContext.resume();
}

function reportText() {
  const grade = calculateGrade();
  const mathAccuracy = state.mathAttempts ? Math.round((state.mathCorrect / state.mathAttempts) * 100) : 0;
  const spellingAccuracy = state.spellAttempts ? Math.round((state.spellCorrect / state.spellAttempts) * 100) : 0;
  const minutes = Math.floor(state.elapsed / 60);
  const seconds = Math.floor(state.elapsed % 60).toString().padStart(2, '0');
  return [
    'EQUATION OUTBREAK: ROAD SCHOLAR — GRADE REPORT',
    '================================================',
    `Driver: ${state.name}`,
    `School grade selected: ${state.schoolGrade}`,
    `Final game grade: ${grade.letter} (${grade.percent}%)`,
    `Academic accuracy: ${grade.academicAccuracy}%`,
    '',
    'MATH FOR GAS',
    `Correct: ${state.mathCorrect}`,
    `Attempts: ${state.mathAttempts}`,
    `Accuracy: ${mathAccuracy}%`,
    '',
    'SPELLING FOR AMMO',
    `Correct: ${state.spellCorrect}`,
    `Attempts: ${state.spellAttempts}`,
    `Accuracy: ${spellingAccuracy}%`,
    `Best spelling streak: ${state.bestSpellingStreak}`,
    '',
    'MISSIONS AND DRIVING',
    `Missions completed: ${state.missionsCompleted}/${MISSIONS.length}`,
    `Zombie minions defeated: ${state.kills}`,
    `Car earned: ${CAR_NAMES[state.carLevel]}`,
    `Weapon earned: ${GUN_NAMES[state.gunLevel]}`,
    `Distance driven: ${Math.round(state.totalDistance)} meters`,
    `Health remaining: ${Math.round(state.health)}%`,
    `Score: ${Math.round(state.score)}`,
    `Play time: ${minutes}:${seconds}`,
    '',
    'Teacher/Parent Note:',
    'The final grade rewards correct math, correct spelling, completed missions, and safe survival.',
  ].join('\n');
}

function downloadReport() {
  const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = state.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'driver';
  link.href = url;
  link.download = `${safeName}-road-scholar-grade-report.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function finishGame() {
  if (state.finished) return;
  state.finished = true;
  state.running = false;
  document.exitPointerLock?.();
  const grade = calculateGrade();
  ui.finalGrade.textContent = grade.letter;
  ui.finishTitle.textContent = `${state.name} saved the city!`;
  ui.finishSummary.textContent = `You scored ${Math.round(state.score).toLocaleString()} points, defeated ${state.kills} minion zombies, solved ${state.mathCorrect} math problems, spelled ${state.spellCorrect} words, and earned the ${CAR_NAMES[state.carLevel]}. Final grade: ${grade.letter} (${grade.percent}%).`;
  ui.finishPanel.classList.remove('hidden');
  playTone(520, 0.2, 'triangle', 0.1);
  setTimeout(() => playTone(660, 0.2, 'triangle', 0.1), 180);
  setTimeout(() => playTone(880, 0.35, 'triangle', 0.1), 360);
}

function updateScene(dt) {
  if (state.paused || state.quizOpen || state.finished) return;
  state.elapsed += dt;
  state.collisionCooldown = Math.max(0, state.collisionCooldown - dt);
  state.shotCooldown = Math.max(0, state.shotCooldown - dt);
  if (state.mode === 'drive') updateDriving(dt);
  else updateCombat(dt);
  updateTraffic(dt);
  updateEffects(dt);
  updateCamera(dt);
  updateMissionAnimation();
  updateMissionProximity();
  updateClouds(dt);
  updateHud();
  drawMinimap();
}

function animate() {
  const dt = Math.min(0.033, clock.getDelta());
  updateScene(dt);
  renderer.render(scene, camera);
}

function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x91b7cf);
  scene.fog = new THREE.Fog(0x91b7cf, 190, 530);

  camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 900);
  camera.position.set(0, 7, 225);

  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.tabIndex = 0;
  $('#game').appendChild(renderer.domElement);

  const hemisphere = new THREE.HemisphereLight(0xd8efff, 0x38502d, 2.25);
  scene.add(hemisphere);
  const sunlight = new THREE.DirectionalLight(0xfff1d3, 3.4);
  sunlight.position.set(-120, 190, -90);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -260;
  sunlight.shadow.camera.right = 260;
  sunlight.shadow.camera.top = 260;
  sunlight.shadow.camera.bottom = -260;
  sunlight.shadow.camera.near = 1;
  sunlight.shadow.camera.far = 520;
  sunlight.shadow.bias = -0.00018;
  scene.add(sunlight);

  worldGroup = new THREE.Group();
  effectsGroup = new THREE.Group();
  zombieGroup = new THREE.Group();
  scene.add(worldGroup, effectsGroup, zombieGroup);

  createSky();
  createRoads();
  buildCityBlocks();
  createTrafficLights();
  createPlayerCar();
  createTraffic();
  createMissionMarker();

  clock = new THREE.Clock();
  renderer.setAnimationLoop(animate);

  renderer.domElement.addEventListener('click', () => {
    if (state.mode === 'combat' && !state.quizOpen && !state.paused && !state.finished) {
      if (document.pointerLockElement !== renderer.domElement) renderer.domElement.requestPointerLock?.();
      else shoot();
    }
  });
}

function startGame() {
  state.name = ui.playerName.value.trim() || 'Road Scholar';
  state.schoolGrade = Number(ui.schoolGrade.value) || 4;
  state.started = true;
  ui.startScreen.classList.remove('active');
  ui.loadingScreen.classList.add('active');
  initAudio();
  setTimeout(() => {
    initThree();
    state.running = true;
    ui.loadingScreen.classList.remove('active');
    ui.hud.classList.remove('hidden');
    updateHud();
    showToast('Solve math with M. Spell for ammo with P. Follow the yellow beacon!', 4200);
  }, 120);
}

function handleKeyDown(event) {
  if (event.target.matches('input, select')) return;
  keys[event.code] = true;
  if (!state.started || state.finished) return;

  if (event.code === 'KeyM' && !event.repeat) openQuiz('math');
  if (event.code === 'KeyP' && !event.repeat) openQuiz('spelling');
  if (event.code === 'KeyE' && !event.repeat && !state.quizOpen && !state.paused) {
    if (state.mode === 'drive') startMission();
    else returnToCar();
  }
  if (event.code === 'Escape' && !state.quizOpen && !event.repeat) togglePause();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
}

function handleKeyUp(event) {
  keys[event.code] = false;
}

function handleMouseMove(event) {
  if (state.mode !== 'combat' || document.pointerLockElement !== renderer?.domElement || state.paused || state.quizOpen) return;
  combatYaw -= event.movementX * 0.0023;
  combatPitch = clamp(combatPitch - event.movementY * 0.0015, -0.5, 0.28);
}

function handleResize() {
  if (!renderer || !camera) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
}

ui.startButton.addEventListener('click', startGame);
ui.submitAnswer.addEventListener('click', submitQuizAnswer);
ui.quizAnswer.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') submitQuizAnswer();
});
ui.closeQuiz.addEventListener('click', closeQuiz);
ui.resumeButton.addEventListener('click', () => togglePause(false));
ui.downloadReportButton.addEventListener('click', downloadReport);
ui.finishDownload.addEventListener('click', downloadReport);
ui.restartButton.addEventListener('click', () => window.location.reload());
ui.finishRestart.addEventListener('click', () => window.location.reload());
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('resize', handleResize);
window.addEventListener('blur', () => {
  keys = Object.create(null);
  if (state.started && !state.finished && !state.quizOpen) togglePause(true);
});

document.addEventListener('pointerlockchange', () => {
  if (state.mode === 'combat' && document.pointerLockElement !== renderer?.domElement && !state.paused && !state.quizOpen && !state.finished) {
    showToast('Aim released. Click the game to aim again.');
  }
});
