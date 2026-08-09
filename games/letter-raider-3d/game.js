import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

const $ = (selector) => document.querySelector(selector);

const ui = {
  hud: $("#hud"),
  start: $("#start-screen"),
  pause: $("#pause-screen"),
  spell: $("#spell-screen"),
  win: $("#win-screen"),
  startBtn: $("#start-btn"),
  resetBtn: $("#reset-btn"),
  resumeBtn: $("#resume-btn"),
  playAgainBtn: $("#play-again-btn"),
  objective: $("#objective"),
  count: $("#letter-count"),
  letterBar: $("#letter-bar"),
  alphabet: $("#alphabet"),
  interaction: $("#interaction"),
  mining: $("#mining"),
  miningBar: $("#mining-bar"),
  miningTitle: $("#mining-title"),
  toast: $("#toast"),
  radar: $("#radar"),
  challengeLetter: $("#challenge-letter"),
  challengeClue: $("#challenge-clue"),
  challengeHint: $("#challenge-hint"),
  spellForm: $("#spell-form"),
  spellInput: $("#spell-input"),
  spellFeedback: $("#spell-feedback"),
  finalTime: $("#final-time"),
  finalErrors: $("#final-errors"),
  finalAccuracy: $("#final-accuracy"),
  finalGrade: $("#final-grade"),
  finalGradeMessage: $("#final-grade-message"),
  finalName: $("#final-name"),
  playerHud: $("#player-hud"),
  playerNameInput: $("#player-name-input"),
  nameFeedback: $("#name-feedback"),
  missionTitle: $("#mission-title"),
  missionHud: $("#mission-hud"),
  missionSelectStart: $("#mission-select-start"),
  missionSelectPause: $("#mission-select-pause"),
  applyMissionBtn: $("#apply-mission-btn"),
  pauseTitle: $("#pause-title"),
  battleHud: $("#battle-hud"),
  enemyCount: $("#enemy-count"),
  healthText: $("#health-text"),
  healthBar: $("#health-bar"),
  battleInstruction: $("#battle-instruction")
};

const WORDS = {
  A: ["adventure", "A daring journey into the unknown."],
  B: ["bridge", "A structure used to cross a river or gap."],
  C: ["cavern", "A large chamber inside a cave."],
  D: ["dagger", "A short, pointed blade."],
  E: ["explorer", "A person who travels to discover new places."],
  F: ["fossil", "Ancient remains preserved in rock."],
  G: ["guardian", "A protector who watches over something."],
  H: ["hidden", "Kept out of sight."],
  I: ["island", "Land surrounded by water."],
  J: ["jungle", "A dense tropical forest."],
  K: ["kingdom", "A land ruled by a king or queen."],
  L: ["lantern", "A portable light with a protective case."],
  M: ["mountain", "A very high natural rise of land."],
  N: ["navigate", "To find and follow a route."],
  O: ["obstacle", "Something that blocks your path."],
  P: ["pyramid", "A monument with triangular sides."],
  Q: ["quarry", "A place where stone is cut from the ground."],
  R: ["relic", "An old object surviving from the past."],
  S: ["shelter", "A place that gives protection."],
  T: ["temple", "A building used for worship."],
  U: ["underground", "Below the surface of the earth."],
  V: ["valley", "Low land between hills or mountains."],
  W: ["waterfall", "Water dropping over a steep edge."],
  X: ["xylophone", "A musical instrument with wooden bars."],
  Y: ["yellow", "The color of sunlight and ripe lemons."],
  Z: ["zipper", "A fastener with two rows of teeth."]
};

const ALPHABET = Object.keys(WORDS);

const MISSION_TITLES = Object.fromEntries(
  ALPHABET.map((letter) => [
    letter,
    `Mission ${letter}: ${WORDS[letter][0][0].toUpperCase()}${WORDS[letter][0].slice(1)} Crystal`
  ])
);

const SAVE_KEY = "letter-raider-save-v4";
const LEGACY_SAVE_KEYS = ["letter-raider-save-v3"];
const WORLD_SIZE = 250;
const PLAYER_HEIGHT = 2.9;
const PLAYER_RADIUS = 0.62;
const WALK_SPEED = 7;
const SPRINT_SPEED = 11.8;
const JUMP_SPEED = 8.2;
const GRAVITY = 20;
const MINE_TIME = 1.55;
const CAVE_Y = -78;
const CAVE_LIMIT = 17;
const SOLDIER_COUNT = 4;
const SHOT_COOLDOWN = 0.24;

let scene, camera, renderer, clock;
let player, playerModel, pickaxe;
let rig = {};
let crystals = [];
let colliders = [];
let caveColliders = [];
let dust;
let caveRoot, portal, portalCore, portalLight, caveLetter;
let soldiers = [];
let raycaster = new THREE.Raycaster();
let keys = {};
let yaw = 0;
let pitch = -0.18;
let verticalSpeed = 0;
let grounded = true;
let running = false;
let spelling = false;
let won = false;
let miningTarget = null;
let miningAmount = 0;
let challengeCrystal = null;
let mistakes = 0;
let playerName = "";
let currentMission = "A";
let area = "world";
let battleActive = false;
let portalOpen = false;
let portalEntering = false;
let playerHealth = 100;
let lastShotAt = -10;
let caveStartedAt = 0;
let worldReturnPosition = new THREE.Vector3(0, 0, 8);
let startTime = 0;
let toastTimeout = 0;

const collected = new Set();
const radarCtx = ui.radar.getContext("2d");
const move = new THREE.Vector3();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const wanted = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const camWanted = new THREE.Vector3();

function terrainHeight(x, z) {
  const hills =
    Math.sin(x * 0.035) * 1.15 +
    Math.cos(z * 0.03) * 0.95 +
    Math.sin((x + z) * 0.018) * 0.75;
  const flatten = THREE.MathUtils.smoothstep(Math.hypot(x, z), 18, 42);
  return hills * flatten;
}

function seededRandom(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x889689);
  scene.fog = new THREE.FogExp2(0x829083, 0.0115);

  camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 550);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  $("#game").appendChild(renderer.domElement);

  clock = new THREE.Clock();

  addLighting();
  addTerrain();
  addTemple();
  addRuins();
  addPlants();
  addPlayer();
  addCrystals();
  addCaveArena();
  addDust();
  buildAlphabet();
  loadSave();
  buildMissionSelectors();
  setMission(currentMission, false);

  camera.position.set(0, 5, 9);
  animate();
}

function addLighting() {
  scene.add(new THREE.HemisphereLight(0xd6e1d8, 0x34352c, 2.3));

  const sun = new THREE.DirectionalLight(0xffe5bb, 4.2);
  sun.position.set(-55, 72, 38);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -92;
  sun.shadow.camera.right = 92;
  sun.shadow.camera.top = 92;
  sun.shadow.camera.bottom = -92;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 190;
  sun.shadow.bias = -0.0003;
  scene.add(sun);

  const templeGlow = new THREE.PointLight(0xff9148, 30, 48, 2);
  templeGlow.position.set(0, 9, -14);
  scene.add(templeGlow);
}

function addTerrain() {
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 120, 120);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    pos.setY(i, terrainHeight(x, z));
  }
  geo.computeVertexNormals();

  const ground = new THREE.Mesh(
    geo,
    new THREE.MeshStandardMaterial({ color: 0x506247, roughness: 1 })
  );
  ground.receiveShadow = true;
  scene.add(ground);

  const pathMat = new THREE.MeshStandardMaterial({ color: 0x716650, roughness: 1 });
  for (let i = 0; i < 52; i++) {
    const angle = i * 0.31;
    const radius = 3 + i * 1.82;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.15, 1.55), pathMat);
    slab.position.set(x, terrainHeight(x, z) + 0.035, z);
    slab.rotation.y = -angle + Math.PI / 2 + Math.sin(i * 1.7) * 0.18;
    slab.receiveShadow = true;
    scene.add(slab);
  }
}

function addTemple() {
  const stone = new THREE.MeshStandardMaterial({ color: 0x777267, roughness: 0.95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a4d47, roughness: 1 });

  const platform = new THREE.Mesh(new THREE.BoxGeometry(23, 1.15, 18), dark);
  platform.position.set(0, 0.18, -15);
  platform.castShadow = true;
  platform.receiveShadow = true;
  scene.add(platform);
  addBoxCollider(0, 0.75, -15, 11.5, 0.58, 9);

  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(11 + i * 3.1, 0.44, 2.1), stone);
    step.position.set(0, 0.34 + i * 0.27, -5 - i * 1.55);
    step.castShadow = true;
    step.receiveShadow = true;
    scene.add(step);
  }

  const columnGeo = new THREE.CylinderGeometry(0.7, 0.96, 8, 8);
  for (const x of [-7.5, -3.8, 3.8, 7.5]) {
    for (const z of [-12.2, -20]) {
      const column = new THREE.Mesh(columnGeo, stone);
      column.position.set(x, 4.75, z);
      column.castShadow = true;
      column.receiveShadow = true;
      scene.add(column);
      addBoxCollider(x, 4.75, z, 0.82, 4, 0.82);
    }
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(19.5, 1, 11.2), stone);
  roof.position.set(0, 9, -16.1);
  roof.castShadow = true;
  roof.receiveShadow = true;
  scene.add(roof);

  const rear = new THREE.Mesh(new THREE.BoxGeometry(18, 7.7, 1.25), dark);
  rear.position.set(0, 4.15, -22.3);
  rear.castShadow = true;
  scene.add(rear);
  addBoxCollider(0, 4.15, -22.3, 9, 3.85, 0.63);

  for (const x of [-5, 5]) {
    const brazier = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.62, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x29241e, metalness: 0.5, roughness: 0.6 })
    );
    brazier.position.set(x, 1.3, -8.8);
    brazier.castShadow = true;
    scene.add(brazier);

    const flame = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.36, 1),
      new THREE.MeshBasicMaterial({ color: 0xff9f4b })
    );
    flame.position.set(x, 2, -8.8);
    scene.add(flame);

    const light = new THREE.PointLight(0xff8540, 22, 18, 2);
    light.position.set(x, 2.4, -8.8);
    scene.add(light);
  }
}

function addRuins() {
  const rand = seededRandom(84721);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x67675d, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x7a7365, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x555a52, roughness: 1 })
  ];

  for (let i = 0; i < 82; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 28 + rand() * 90;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) < 16 && z > -28 && z < 5) continue;

    const sx = 1.4 + rand() * 4.8;
    const sy = 1.1 + rand() * 6.3;
    const sz = 1.1 + rand() * 3.9;
    const ruin = new THREE.Mesh(
      new THREE.BoxGeometry(sx, sy, sz),
      mats[Math.floor(rand() * mats.length)]
    );
    ruin.position.set(x, terrainHeight(x, z) + sy / 2 - 0.1, z);
    ruin.rotation.y = rand() * Math.PI;
    ruin.rotation.z = (rand() - 0.5) * 0.15;
    ruin.castShadow = true;
    ruin.receiveShadow = true;
    scene.add(ruin);

    addBoxCollider(x, ruin.position.y, z, sx / 2, sy / 2, sz / 2);
  }

  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 45 + (i % 3) * 13;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = terrainHeight(x, z);

    const arch = new THREE.Group();
    for (const px of [-2.4, 2.4]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(1.4, 6, 1.6), mats[i % mats.length]);
      post.position.set(px, 3, 0);
      post.castShadow = true;
      post.receiveShadow = true;
      arch.add(post);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(6.3, 1.25, 1.8), mats[(i + 1) % mats.length]);
    lintel.position.set(0, 6.2, 0);
    lintel.castShadow = true;
    arch.add(lintel);

    arch.position.set(x, y, z);
    arch.rotation.y = -angle + Math.PI / 2;
    scene.add(arch);
    addBoxCollider(x, y + 3, z, 0.9, 3, 1.1);
  }
}

function addPlants() {
  const rand = seededRandom(13991);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d3327, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x253b27, roughness: 1 });

  for (let i = 0; i < 155; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 20 + rand() * 105;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Math.abs(x) < 18 && z > -30 && z < 8) continue;

    const h = 2.5 + rand() * 4.8;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.29, h, 6), trunkMat);
    trunk.position.set(x, terrainHeight(x, z) + h / 2, z);
    trunk.rotation.z = (rand() - 0.5) * 0.18;
    trunk.castShadow = true;
    scene.add(trunk);

    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05 + rand() * 1.45, 1), leafMat);
    crown.position.set(x, terrainHeight(x, z) + h + 0.5, z);
    crown.scale.y = 1.2 + rand() * 0.75;
    crown.castShadow = true;
    scene.add(crown);
  }
}

function addPlayer() {
  player = new THREE.Group();
  player.position.set(0, terrainHeight(0, 8) + PLAYER_HEIGHT / 2, 8);

  const shirt = new THREE.MeshStandardMaterial({
    color: 0x176a69,
    roughness: 0.68
  });
  const trousers = new THREE.MeshStandardMaterial({
    color: 0x171b28,
    roughness: 0.8
  });
  const leather = new THREE.MeshStandardMaterial({
    color: 0x593a22,
    roughness: 0.72
  });
  const darkLeather = new THREE.MeshStandardMaterial({
    color: 0x241b16,
    roughness: 0.8
  });
  const skin = new THREE.MeshStandardMaterial({
    color: 0xb97e5d,
    roughness: 0.83
  });
  const hair = new THREE.MeshStandardMaterial({
    color: 0x24130e,
    roughness: 0.84
  });
  const hairHighlight = new THREE.MeshStandardMaterial({
    color: 0x6b3422,
    roughness: 0.78
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xd0a447,
    metalness: 0.56,
    roughness: 0.34
  });
  const scarfMaterial = new THREE.MeshStandardMaterial({
    color: 0x8f2846,
    roughness: 0.7
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0x78827f,
    metalness: 0.78,
    roughness: 0.29
  });
  const steelEdge = new THREE.MeshStandardMaterial({
    color: 0xaeb9b5,
    metalness: 0.9,
    roughness: 0.2
  });
  const eyeWhite = new THREE.MeshStandardMaterial({
    color: 0xe9e4d8,
    roughness: 0.75
  });
  const eyeDark = new THREE.MeshStandardMaterial({
    color: 0x261b15,
    roughness: 0.7
  });

  const shadowMesh = (mesh) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const capsule = (radius, length, material, segments = 10) =>
    shadowMesh(new THREE.Mesh(
      new THREE.CapsuleGeometry(radius, length, 6, segments),
      material
    ));

  playerModel = new THREE.Group();
  rig = { ponytailSegments: [] };

  // Hips and belt
  const hips = shadowMesh(new THREE.Mesh(
    new THREE.CapsuleGeometry(0.32, 0.22, 5, 10),
    trousers
  ));
  hips.rotation.z = Math.PI / 2;
  hips.position.y = -0.28;
  playerModel.add(hips);

  const belt = shadowMesh(new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.045, 8, 24),
    leather
  ));
  belt.rotation.x = Math.PI / 2;
  belt.position.y = -0.17;
  belt.scale.z = 0.68;
  playerModel.add(belt);

  const buckle = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.1, 0.055),
    accent
  ));
  buckle.position.set(0, -0.17, 0.34);
  playerModel.add(buckle);

  // Torso with shoulder shape and climbing straps
  rig.torso = new THREE.Group();
  const torso = capsule(0.36, 0.58, shirt, 14);
  torso.position.y = 0.28;
  torso.scale.set(1, 1, 0.76);
  rig.torso.add(torso);

  const chestPanel = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.48, 0.12),
    shirt
  ));
  chestPanel.position.set(0, 0.25, 0.3);
  chestPanel.rotation.x = -0.08;
  rig.torso.add(chestPanel);

  for (const x of [-0.2, 0.2]) {
    const strap = shadowMesh(new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.95, 0.05),
      leather
    ));
    strap.position.set(x, 0.3, 0.33);
    strap.rotation.z = x > 0 ? -0.08 : 0.08;
    rig.torso.add(strap);
  }

  const scarf = shadowMesh(new THREE.Mesh(
    new THREE.TorusGeometry(0.235, 0.055, 10, 28),
    scarfMaterial
  ));
  scarf.rotation.x = Math.PI / 2;
  scarf.position.set(0, 0.72, 0.01);
  scarf.scale.z = 0.82;
  rig.torso.add(scarf);

  const scarfTail = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.46, 0.055),
    scarfMaterial
  ));
  scarfTail.position.set(-0.16, 0.47, -0.32);
  scarfTail.rotation.z = 0.2;
  rig.torso.add(scarfTail);

  for (const x of [-0.22, 0.22]) {
    const lapel = shadowMesh(new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.55, 0.045),
      accent
    ));
    lapel.position.set(x, 0.34, 0.355);
    lapel.rotation.z = x > 0 ? 0.3 : -0.3;
    rig.torso.add(lapel);
  }

  const waistSash = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.13, 0.09),
    scarfMaterial
  ));
  waistSash.position.set(0, -0.08, 0.15);
  waistSash.rotation.z = -0.08;
  rig.torso.add(waistSash);

  const backpack = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.72, 0.28),
    leather
  ));
  backpack.position.set(0, 0.24, -0.42);
  rig.torso.add(backpack);

  const packRoll = shadowMesh(new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.6, 12),
    darkLeather
  ));
  packRoll.rotation.z = Math.PI / 2;
  packRoll.position.set(0, 0.63, -0.5);
  rig.torso.add(packRoll);

  playerModel.add(rig.torso);

  // Head, face, layered hair, and ponytail
  rig.head = new THREE.Group();
  rig.head.position.y = 1.12;

  const neck = capsule(0.105, 0.08, skin, 10);
  neck.position.y = -0.3;
  rig.head.add(neck);

  const face = shadowMesh(new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 24, 18),
    skin
  ));
  face.scale.set(0.92, 1.06, 0.94);
  rig.head.add(face);

  const hairCap = shadowMesh(new THREE.Mesh(
    new THREE.SphereGeometry(0.325, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.62),
    hair
  ));
  hairCap.position.set(0, 0.07, -0.035);
  hairCap.scale.set(1.02, 1.0, 1.04);
  rig.head.add(hairCap);

  const sideHairGeometry = new THREE.CapsuleGeometry(0.065, 0.25, 5, 9);
  for (const x of [-0.275, 0.275]) {
    const sideHair = shadowMesh(new THREE.Mesh(sideHairGeometry, hair));
    sideHair.position.set(x, -0.035, -0.03);
    sideHair.rotation.z = x > 0 ? -0.13 : 0.13;
    rig.head.add(sideHair);
  }

  const bangGeometry = new THREE.SphereGeometry(0.105, 14, 10);
  for (const [x, y, scale] of [
    [-0.15, 0.18, 1.0],
    [-0.02, 0.215, 1.14],
    [0.13, 0.18, 0.96]
  ]) {
    const bang = shadowMesh(new THREE.Mesh(bangGeometry, hair));
    bang.position.set(x, y, 0.25);
    bang.scale.set(0.9, scale, 0.42);
    rig.head.add(bang);
  }

  for (const x of [-0.105, 0.105]) {
    const eye = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 8),
      eyeWhite
    ));
    eye.position.set(x, 0.025, 0.288);
    eye.scale.set(1.15, 0.72, 0.45);
    rig.head.add(eye);

    const pupil = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 10, 8),
      eyeDark
    ));
    pupil.position.set(x, 0.023, 0.321);
    pupil.scale.z = 0.45;
    rig.head.add(pupil);
  }

  const nose = shadowMesh(new THREE.Mesh(
    new THREE.ConeGeometry(0.045, 0.14, 10),
    skin
  ));
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.035, 0.335);
  rig.head.add(nose);

  for (const x of [-0.16, 0.12]) {
    const highlight = shadowMesh(new THREE.Mesh(
      new THREE.CapsuleGeometry(0.025, 0.24, 5, 8),
      hairHighlight
    ));
    highlight.position.set(x, 0.08, 0.28);
    highlight.rotation.z = x > 0 ? -0.14 : 0.14;
    rig.head.add(highlight);
  }

  for (const x of [-0.31, 0.31]) {
    const earring = shadowMesh(new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.012, 7, 14),
      accent
    ));
    earring.position.set(x, -0.09, 0.02);
    earring.rotation.y = Math.PI / 2;
    rig.head.add(earring);
  }

  const hairTie = shadowMesh(new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.025, 8, 18),
    scarfMaterial
  ));
  hairTie.rotation.x = Math.PI / 2;
  hairTie.position.set(0, 0.02, -0.32);
  rig.head.add(hairTie);

  rig.ponytail = new THREE.Group();
  rig.ponytail.position.set(0, 0.01, -0.33);
  const ponyPositions = [
    [0, -0.05, -0.08, 1.0],
    [0, -0.18, -0.18, 0.92],
    [0, -0.33, -0.24, 0.78],
    [0, -0.48, -0.26, 0.6]
  ];
  for (const [x, y, z, scale] of ponyPositions) {
    const segment = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 14, 10),
      hair
    ));
    segment.position.set(x, y, z);
    segment.scale.set(0.82 * scale, 1.35 * scale, 0.88 * scale);
    rig.ponytail.add(segment);
    rig.ponytailSegments.push(segment);
  }
  rig.head.add(rig.ponytail);
  playerModel.add(rig.head);

  function createLeg(x) {
    const hip = new THREE.Group();
    hip.position.set(x, -0.38, 0);

    const upper = capsule(0.145, 0.37, trousers, 11);
    upper.position.y = -0.31;
    hip.add(upper);

    const knee = new THREE.Group();
    knee.position.y = -0.64;

    const kneePad = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 12, 9),
      darkLeather
    ));
    kneePad.position.set(0, 0, 0.105);
    kneePad.scale.set(1, 0.82, 0.52);
    knee.add(kneePad);

    const lower = capsule(0.125, 0.34, trousers, 11);
    lower.position.y = -0.31;
    knee.add(lower);

    const thighStrap = shadowMesh(new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.026, 7, 18),
      leather
    ));
    thighStrap.rotation.x = Math.PI / 2;
    thighStrap.position.y = 0.21;
    hip.add(thighStrap);

    const bootCuff = shadowMesh(new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.15, 0.15, 12),
      leather
    ));
    bootCuff.position.y = -0.53;
    knee.add(bootCuff);

    const boot = shadowMesh(new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.27, 0.48),
      darkLeather
    ));
    boot.position.set(0, -0.67, 0.09);
    boot.geometry.translate(0, 0, 0.04);
    knee.add(boot);

    hip.add(knee);
    playerModel.add(hip);
    return { hip, knee };
  }

  rig.leftLeg = createLeg(-0.21);
  rig.rightLeg = createLeg(0.21);

  function createArm(x, isRight) {
    const shoulder = new THREE.Group();
    shoulder.position.set(x, 0.66, 0);

    const shoulderCap = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 14, 10),
      shirt
    ));
    shoulder.add(shoulderCap);

    const upper = capsule(0.115, 0.34, skin, 10);
    upper.position.y = -0.29;
    shoulder.add(upper);

    const sleeve = shadowMesh(new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.125, 0.25, 12),
      shirt
    ));
    sleeve.position.y = -0.13;
    shoulder.add(sleeve);

    const elbow = new THREE.Group();
    elbow.position.y = -0.59;

    const forearm = capsule(0.105, 0.3, skin, 10);
    forearm.position.y = -0.27;
    elbow.add(forearm);

    const wristCuff = shadowMesh(new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.115, 0.14, 12),
      scarfMaterial
    ));
    wristCuff.position.y = -0.43;
    elbow.add(wristCuff);

    const glove = shadowMesh(new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 12, 9),
      darkLeather
    ));
    glove.position.y = -0.53;
    glove.scale.set(0.9, 1.05, 0.9);
    elbow.add(glove);

    shoulder.add(elbow);
    playerModel.add(shoulder);

    return { shoulder, elbow, glove, isRight };
  }

  rig.leftArm = createArm(-0.48, false);
  rig.rightArm = createArm(0.48, true);

  // Detailed pickaxe with wood grain bands and a curved steel head
  pickaxe = new THREE.Group();

  const handle = shadowMesh(new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.062, 1.35, 12),
    leather
  ));
  handle.position.y = 0.1;
  pickaxe.add(handle);

  for (const y of [-0.42, -0.05, 0.32]) {
    const gripBand = shadowMesh(new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.012, 7, 14),
      darkLeather
    ));
    gripBand.rotation.x = Math.PI / 2;
    gripBand.position.y = y;
    pickaxe.add(gripBand);
  }

  const headCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.58, -0.02, 0),
    new THREE.Vector3(-0.3, 0.1, 0),
    new THREE.Vector3(0, 0.14, 0),
    new THREE.Vector3(0.31, 0.1, 0),
    new THREE.Vector3(0.58, -0.02, 0)
  ]);
  const curvedHead = shadowMesh(new THREE.Mesh(
    new THREE.TubeGeometry(headCurve, 22, 0.065, 9, false),
    metal
  ));
  curvedHead.position.y = 0.78;
  pickaxe.add(curvedHead);

  const leftTip = shadowMesh(new THREE.Mesh(
    new THREE.ConeGeometry(0.095, 0.34, 12),
    steelEdge
  ));
  leftTip.rotation.z = -Math.PI / 2;
  leftTip.position.set(-0.72, 0.75, 0);
  pickaxe.add(leftTip);

  const rightTip = shadowMesh(new THREE.Mesh(
    new THREE.ConeGeometry(0.1, 0.38, 12),
    steelEdge
  ));
  rightTip.rotation.z = Math.PI / 2;
  rightTip.position.set(0.75, 0.75, 0);
  pickaxe.add(rightTip);

  const eyeCollar = shadowMesh(new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.115, 0.22, 12),
    metal
  ));
  eyeCollar.position.y = 0.74;
  pickaxe.add(eyeCollar);

  pickaxe.position.set(0.02, -0.46, 0.02);
  pickaxe.rotation.set(0.1, 0, -0.22);
  rig.rightArm.elbow.add(pickaxe);

  // Cave-trial sidearm. It is only visible inside battle missions.
  rig.gun = new THREE.Group();
  const gunBody = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.18, 0.48),
    metal
  ));
  gunBody.position.z = 0.16;
  rig.gun.add(gunBody);

  const gunSlide = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.09, 0.58),
    steelEdge
  ));
  gunSlide.position.set(0, 0.09, 0.18);
  rig.gun.add(gunSlide);

  const gunBarrel = shadowMesh(new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.035, 0.35, 12),
    darkLeather
  ));
  gunBarrel.rotation.x = Math.PI / 2;
  gunBarrel.position.set(0, 0.03, 0.55);
  rig.gun.add(gunBarrel);

  const gunGrip = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.34, 0.16),
    darkLeather
  ));
  gunGrip.position.set(0, -0.2, 0.04);
  gunGrip.rotation.x = -0.24;
  rig.gun.add(gunGrip);

  rig.gun.position.set(0, -0.52, 0.04);
  rig.gun.rotation.x = -Math.PI / 2;
  rig.gun.visible = false;
  rig.rightArm.elbow.add(rig.gun);

  // Hip equipment
  const rope = shadowMesh(new THREE.Mesh(
    new THREE.TorusGeometry(0.18, 0.035, 7, 24),
    leather
  ));
  rope.position.set(-0.38, -0.25, -0.1);
  rope.rotation.y = Math.PI / 2;
  playerModel.add(rope);

  const pouch = shadowMesh(new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.3, 0.14),
    leather
  ));
  pouch.position.set(0.38, -0.3, -0.05);
  playerModel.add(pouch);

  player.add(playerModel);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.78, 28),
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -PLAYER_HEIGHT / 2 + 0.025;
  player.add(shadow);

  scene.add(player);
}

function animateCharacter(dt, elapsed, moving, sprinting, mining) {
  const blend = Math.min(1, dt * 11);
  const strideRate = sprinting ? 14.5 : 10.5;
  const stride = Math.sin(elapsed * strideRate);
  const secondary = Math.sin(elapsed * strideRate + Math.PI / 2);
  const runStrength = moving && grounded ? (sprinting ? 1 : 0.74) : 0;

  const leftHipTarget = stride * 0.72 * runStrength;
  const rightHipTarget = -stride * 0.72 * runStrength;
  const leftKneeTarget = Math.max(0, -stride) * 0.78 * runStrength;
  const rightKneeTarget = Math.max(0, stride) * 0.78 * runStrength;

  rig.leftLeg.hip.rotation.x = THREE.MathUtils.lerp(
    rig.leftLeg.hip.rotation.x,
    leftHipTarget,
    blend
  );
  rig.rightLeg.hip.rotation.x = THREE.MathUtils.lerp(
    rig.rightLeg.hip.rotation.x,
    rightHipTarget,
    blend
  );
  rig.leftLeg.knee.rotation.x = THREE.MathUtils.lerp(
    rig.leftLeg.knee.rotation.x,
    leftKneeTarget,
    blend
  );
  rig.rightLeg.knee.rotation.x = THREE.MathUtils.lerp(
    rig.rightLeg.knee.rotation.x,
    rightKneeTarget,
    blend
  );

  const leftArmTarget = -stride * 0.55 * runStrength;
  const rightArmTarget = stride * 0.42 * runStrength;

  rig.leftArm.shoulder.rotation.x = THREE.MathUtils.lerp(
    rig.leftArm.shoulder.rotation.x,
    leftArmTarget,
    blend
  );
  rig.rightArm.shoulder.rotation.x = THREE.MathUtils.lerp(
    rig.rightArm.shoulder.rotation.x,
    rightArmTarget,
    blend
  );
  rig.leftArm.elbow.rotation.x = THREE.MathUtils.lerp(
    rig.leftArm.elbow.rotation.x,
    -0.18 - Math.max(0, stride) * 0.28 * runStrength,
    blend
  );
  rig.rightArm.elbow.rotation.x = THREE.MathUtils.lerp(
    rig.rightArm.elbow.rotation.x,
    -0.25 - Math.max(0, -stride) * 0.22 * runStrength,
    blend
  );

  rig.torso.rotation.z = THREE.MathUtils.lerp(
    rig.torso.rotation.z,
    moving ? secondary * 0.045 : 0,
    blend
  );
  rig.torso.rotation.x = THREE.MathUtils.lerp(
    rig.torso.rotation.x,
    sprinting && moving ? 0.1 : 0,
    blend
  );
  rig.head.rotation.z = THREE.MathUtils.lerp(
    rig.head.rotation.z,
    moving ? -secondary * 0.025 : 0,
    blend
  );

  const breathing = moving ? 0 : Math.sin(elapsed * 2.2) * 0.012;
  rig.torso.scale.y = 1 + breathing;

  rig.ponytail.rotation.x = THREE.MathUtils.lerp(
    rig.ponytail.rotation.x,
    moving ? 0.28 + Math.abs(stride) * 0.22 : 0.12 + Math.sin(elapsed * 1.7) * 0.04,
    Math.min(1, dt * 8)
  );
  rig.ponytail.rotation.z = THREE.MathUtils.lerp(
    rig.ponytail.rotation.z,
    moving ? -secondary * 0.18 : Math.sin(elapsed * 1.2) * 0.035,
    Math.min(1, dt * 7)
  );

  rig.ponytailSegments.forEach((segment, index) => {
    segment.rotation.z =
      Math.sin(elapsed * (moving ? 8 : 2) - index * 0.55) *
      (moving ? 0.12 : 0.035);
  });

  if (mining) {
    const strike = (Math.sin(elapsed * 10.5) + 1) / 2;
    rig.rightArm.shoulder.rotation.x = THREE.MathUtils.lerp(
      rig.rightArm.shoulder.rotation.x,
      -0.65 - strike * 1.45,
      Math.min(1, dt * 16)
    );
    rig.rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(
      rig.rightArm.shoulder.rotation.z,
      -0.38,
      Math.min(1, dt * 13)
    );
    rig.rightArm.elbow.rotation.x = THREE.MathUtils.lerp(
      rig.rightArm.elbow.rotation.x,
      -0.65,
      Math.min(1, dt * 15)
    );
    rig.leftArm.shoulder.rotation.x = THREE.MathUtils.lerp(
      rig.leftArm.shoulder.rotation.x,
      -0.35,
      Math.min(1, dt * 12)
    );
    rig.leftArm.shoulder.rotation.z = THREE.MathUtils.lerp(
      rig.leftArm.shoulder.rotation.z,
      0.22,
      Math.min(1, dt * 12)
    );
    rig.torso.rotation.x = THREE.MathUtils.lerp(
      rig.torso.rotation.x,
      0.17,
      Math.min(1, dt * 12)
    );
    pickaxe.rotation.z = -0.12 - strike * 0.18;
  } else {
    rig.rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(
      rig.rightArm.shoulder.rotation.z,
      0,
      blend
    );
    rig.leftArm.shoulder.rotation.z = THREE.MathUtils.lerp(
      rig.leftArm.shoulder.rotation.z,
      0,
      blend
    );
    pickaxe.rotation.z = THREE.MathUtils.lerp(pickaxe.rotation.z, -0.22, blend);
  }
}

function addCrystals() {
  const rand = seededRandom(61947);
  const crystalBaseMat = new THREE.MeshStandardMaterial({ color: 0x363d35, roughness: 0.95 });

  crystals = ALPHABET.map((letter, index) => {
    const angle = index * 2.399963 + 0.55;
    const radius = 21 + index * 3.05 + (rand() - 0.5) * 7;
    const x = THREE.MathUtils.clamp(Math.cos(angle) * radius, -112, 112);
    const z = THREE.MathUtils.clamp(Math.sin(angle) * radius, -112, 112);
    const y = terrainHeight(x, z);

    const group = new THREE.Group();

    const base = new THREE.Mesh(new THREE.DodecahedronGeometry(1.08, 0), crystalBaseMat);
    base.scale.set(1.3, 0.6, 1.15);
    base.position.y = 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffd071,
      emissive: 0xb36813,
      emissiveIntensity: 2.2,
      roughness: 0.24,
      metalness: 0.14
    });

    const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.8, 0), crystalMat);
    crystal.scale.y = 1.75;
    crystal.position.y = 1.8;
    crystal.castShadow = true;
    group.add(crystal);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.25, 0.045, 8, 40),
      new THREE.MeshBasicMaterial({ color: 0xffdc8d, transparent: true, opacity: 0.52 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 1.65;
    group.add(ring);

    const light = new THREE.PointLight(0xffa640, 9, 13, 2);
    light.position.y = 2;
    group.add(light);

    const label = makeLetterSprite(letter);
    label.position.set(0, 2.25, 0);
    group.add(label);

    group.position.set(x, y, z);
    group.userData = {
      letter,
      crystal,
      ring,
      light,
      label,
      phase: rand() * Math.PI * 2,
      collected: false
    };

    scene.add(group);
    return group;
  });
}

function makeLetterSprite(letter) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(255,226,151,.16)";
  ctx.beginPath();
  ctx.arc(128, 128, 98, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(255,238,190,.76)";
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.fillStyle = "#fff1c7";
  ctx.font = "bold 138px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, 128, 139);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.45, 1.45, 1);
  return sprite;
}


function addCaveArena() {
  caveRoot = new THREE.Group();
  caveRoot.visible = false;
  scene.add(caveRoot);

  const rock = new THREE.MeshStandardMaterial({
    color: 0x202a31,
    roughness: 0.96
  });
  const rockDark = new THREE.MeshStandardMaterial({
    color: 0x111820,
    roughness: 1
  });
  const crystalBlue = new THREE.MeshStandardMaterial({
    color: 0x65d7ff,
    emissive: 0x176a8a,
    emissiveIntensity: 2.6,
    roughness: 0.23
  });

  const floor = new THREE.Mesh(new THREE.CylinderGeometry(19, 19, 0.8, 48), rockDark);
  floor.position.y = CAVE_Y - 0.42;
  floor.receiveShadow = true;
  caveRoot.add(floor);

  const ceiling = new THREE.Mesh(new THREE.CylinderGeometry(18.5, 19, 0.8, 48), rockDark);
  ceiling.position.y = CAVE_Y + 8.2;
  ceiling.receiveShadow = true;
  caveRoot.add(ceiling);

  const rand = seededRandom(41107);
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2;
    const radius = 18 + rand() * 1.1;
    const width = 2.1 + rand() * 2.3;
    const height = 5 + rand() * 4;
    const depth = 2 + rand() * 2.2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const wall = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rock);
    wall.scale.set(width, height, depth);
    wall.position.set(x, CAVE_Y + height * 0.55, z);
    wall.rotation.set(rand() * 0.3, -angle, rand() * 0.25);
    wall.castShadow = true;
    wall.receiveShadow = true;
    caveRoot.add(wall);
  }

  for (let i = 0; i < 18; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = 4 + rand() * 12;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.25 + rand() * 0.32), crystalBlue);
    shard.scale.y = 1.4 + rand() * 2.4;
    shard.position.set(x, CAVE_Y + 0.35 + shard.scale.y * 0.18, z);
    shard.rotation.y = rand() * Math.PI;
    shard.castShadow = true;
    caveRoot.add(shard);
  }

  const caveAmbient = new THREE.HemisphereLight(0x76ccff, 0x07101a, 1.15);
  caveRoot.add(caveAmbient);

  for (const [x, z] of [[-10,-8],[10,-8],[-10,8],[10,8]]) {
    const light = new THREE.PointLight(0x52c7ff, 24, 18, 2);
    light.position.set(x, CAVE_Y + 3, z);
    caveRoot.add(light);
  }

  portal = new THREE.Group();
  portal.position.set(0, CAVE_Y + 2.25, -14);
  portal.visible = false;

  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.22, 16, 64),
    new THREE.MeshStandardMaterial({
      color: 0x87efff,
      emissive: 0x2487b0,
      emissiveIntensity: 3.2,
      metalness: 0.28,
      roughness: 0.22
    })
  );
  portal.add(outer);

  portalCore = new THREE.Mesh(
    new THREE.CircleGeometry(1.76, 48),
    new THREE.MeshBasicMaterial({
      color: 0x6bdcff,
      transparent: true,
      opacity: 0.38,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  portalCore.position.z = -0.03;
  portal.add(portalCore);

  portalLight = new THREE.PointLight(0x75e6ff, 38, 20, 2);
  portalLight.position.z = 1;
  portal.add(portalLight);

  caveLetter = makeLetterSprite('A');
  caveLetter.position.set(0, 0.05, 0.1);
  caveLetter.scale.set(1.05, 1.05, 1);
  portal.add(caveLetter);
  caveRoot.add(portal);

  addCaveBoxCollider(-18.2, CAVE_Y + 3, 0, 1.2, 5, 19);
  addCaveBoxCollider(18.2, CAVE_Y + 3, 0, 1.2, 5, 19);
  addCaveBoxCollider(0, CAVE_Y + 3, 18.2, 19, 5, 1.2);
  addCaveBoxCollider(-10, CAVE_Y + 3, -18.2, 8, 5, 1.2);
  addCaveBoxCollider(10, CAVE_Y + 3, -18.2, 8, 5, 1.2);
}

function addCaveBoxCollider(x, y, z, hx, hy, hz) {
  caveColliders.push({
    center: new THREE.Vector3(x, y, z),
    half: new THREE.Vector3(hx, hy, hz)
  });
}

function createStoneSoldier(index, position) {
  const group = new THREE.Group();
  group.position.set(position[0], CAVE_Y, position[1]);
  group.userData = {
    isSoldier: true,
    alive: true,
    health: 2,
    index,
    lastAttack: -10,
    speed: 1.45 + index * 0.08
  };

  const armor = new THREE.MeshStandardMaterial({
    color: 0x46525c,
    metalness: 0.5,
    roughness: 0.48
  });
  const armorDark = new THREE.MeshStandardMaterial({
    color: 0x202b34,
    metalness: 0.35,
    roughness: 0.62
  });
  const glow = new THREE.MeshStandardMaterial({
    color: 0xff705f,
    emissive: 0x8d1d17,
    emissiveIntensity: 2.8,
    roughness: 0.35
  });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.34, 0.52, 5, 10), armor);
  body.position.y = 1.05;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.24), armorDark);
  chest.position.set(0, 1.08, 0.25);
  chest.castShadow = true;
  group.add(chest);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), armorDark);
  head.position.y = 1.82;
  head.castShadow = true;
  group.add(head);

  const helmet = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.27, 0.28, 10), armor);
  helmet.position.y = 1.98;
  helmet.castShadow = true;
  group.add(helmet);

  for (const x of [-0.11, 0.11]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), glow);
    eye.position.set(x, 1.84, 0.245);
    group.add(eye);
  }

  group.userData.leftLeg = new THREE.Group();
  group.userData.rightLeg = new THREE.Group();
  for (const [x, leg] of [[-0.19, group.userData.leftLeg], [0.19, group.userData.rightLeg]]) {
    leg.position.set(x, 0.65, 0);
    const limb = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.43, 4, 8), armorDark);
    limb.position.y = -0.32;
    limb.castShadow = true;
    leg.add(limb);
    group.add(leg);
  }

  for (const x of [-0.43, 0.43]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), armor);
    arm.position.set(x, 1.05, 0);
    arm.rotation.z = x > 0 ? -0.2 : 0.2;
    arm.castShadow = true;
    group.add(arm);
  }

  const hitbox = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.48, 1.15, 5, 10),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitbox.position.y = 1.05;
  group.add(hitbox);

  group.traverse((child) => {
    child.userData.soldierRoot = group;
  });

  caveRoot.add(group);
  return group;
}

function clearSoldiers() {
  for (const soldier of soldiers) {
    caveRoot.remove(soldier);
    soldier.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material && !Array.isArray(child.material)) child.material.dispose();
    });
  }
  soldiers = [];
}

function spawnSoldiers() {
  clearSoldiers();
  const positions = [[-8,-7],[8,-7],[-7,5],[7,5]];
  soldiers = positions.map((position, index) => createStoneSoldier(index, position));
  updateBattleHud();
}

function startCaveTrial(crystal) {
  challengeCrystal = crystal;
  currentMission = crystal.userData.letter;
  worldReturnPosition.copy(player.position);
  keys = {};
  miningAmount = 0;
  miningTarget = null;
  area = 'cave';
  battleActive = true;
  portalOpen = false;
  portalEntering = false;
  playerHealth = 100;
  caveStartedAt = clock.elapsedTime;

  caveRoot.visible = true;
  portal.visible = false;
  if (caveLetter) {
    caveLetter.material.map.dispose();
    portal.remove(caveLetter);
    caveLetter = makeLetterSprite(currentMission);
    caveLetter.position.set(0, 0.05, 0.1);
    caveLetter.scale.set(1.05, 1.05, 1);
    portal.add(caveLetter);
  }

  player.position.set(0, CAVE_Y + PLAYER_HEIGHT / 2, 12);
  playerModel.rotation.y = Math.PI;
  yaw = 0;
  pitch = -0.14;
  verticalSpeed = 0;
  grounded = true;

  pickaxe.visible = false;
  rig.gun.visible = true;
  scene.background.set(0x080d14);
  scene.fog.color.set(0x0a1119);
  scene.fog.density = 0.027;
  document.body.classList.add('cave-mode');

  ui.interaction.classList.remove('visible');
  ui.mining.classList.remove('visible');
  ui.battleHud.classList.remove('hidden');
  ui.objective.textContent = 'Cave trial: defeat all four stone soldiers.';
  ui.missionHud.textContent = `Trial for letter ${currentMission} · Left-click to shoot`;
  spawnSoldiers();
  showToast(`Letter ${currentMission} cave trial started!`);
}

function updateBattleHud() {
  const alive = soldiers.filter((soldier) => soldier.userData.alive).length;
  ui.enemyCount.textContent = String(alive);
  ui.healthText.textContent = String(Math.max(0, Math.round(playerHealth)));
  ui.healthBar.style.width = `${Math.max(0, playerHealth)}%`;

  if (battleActive) {
    ui.battleInstruction.textContent = 'Left-click to shoot. Each soldier takes two hits.';
  } else if (portalOpen) {
    ui.battleInstruction.textContent = 'Trial complete. Walk through the glowing portal.';
  }
}

function updateSoldiers(dt, elapsed) {
  if (area !== 'cave') return;

  for (const soldier of soldiers) {
    if (!soldier.userData.alive) continue;

    const dx = player.position.x - soldier.position.x;
    const dz = player.position.z - soldier.position.z;
    const distance = Math.hypot(dx, dz);
    const angle = Math.atan2(dx, dz);
    soldier.rotation.y = lerpAngle(soldier.rotation.y, angle, Math.min(1, dt * 7));

    if (battleActive && distance > 2.15) {
      soldier.position.x += (dx / distance) * soldier.userData.speed * dt;
      soldier.position.z += (dz / distance) * soldier.userData.speed * dt;
      soldier.position.x = THREE.MathUtils.clamp(soldier.position.x, -15.5, 15.5);
      soldier.position.z = THREE.MathUtils.clamp(soldier.position.z, -15.5, 15.5);
    }

    const stride = Math.sin(elapsed * 8 + soldier.userData.index);
    soldier.userData.leftLeg.rotation.x = stride * 0.38;
    soldier.userData.rightLeg.rotation.x = -stride * 0.38;

    if (
      battleActive &&
      distance < 2.25 &&
      elapsed - soldier.userData.lastAttack > 1.15
    ) {
      soldier.userData.lastAttack = elapsed;
      playerHealth = Math.max(0, playerHealth - 12);
      updateBattleHud();
      showToast('A stone soldier hit you!');

      if (playerHealth <= 0) {
        restartCaveTrial();
        return;
      }
    }
  }

  if (portalOpen && portal) {
    portal.rotation.z += dt * 0.7;
    portalCore.material.opacity = 0.3 + Math.sin(elapsed * 4) * 0.12;
    portalLight.intensity = 32 + Math.sin(elapsed * 5) * 8;

    const portalDistance = player.position.distanceTo(portal.position);
    if (portalDistance < 2.05 && !portalEntering) {
      portalEntering = true;
      beginSpelling(challengeCrystal);
    }
  }
}

function restartCaveTrial() {
  playerHealth = 100;
  player.position.set(0, CAVE_Y + PLAYER_HEIGHT / 2, 12);
  verticalSpeed = 0;
  battleActive = true;
  portalOpen = false;
  portal.visible = false;
  spawnSoldiers();
  ui.objective.textContent = 'The trial restarted. Defeat all four stone soldiers.';
  showToast('Trial restarted—health restored.');
}

function shoot() {
  if (
    area !== 'cave' ||
    !battleActive ||
    spelling ||
    document.pointerLockElement !== renderer.domElement
  ) return;

  const now = clock.elapsedTime;
  if (now - lastShotAt < SHOT_COOLDOWN) return;
  lastShotAt = now;

  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const activeSoldiers = soldiers.filter((soldier) => soldier.userData.alive);
  const hits = raycaster.intersectObjects(activeSoldiers, true);

  const origin = new THREE.Vector3();
  rig.gun.getWorldPosition(origin);
  const destination = hits[0]?.point || raycaster.ray.at(45, new THREE.Vector3());
  createShotTracer(origin, destination);

  if (!hits.length) {
    showToast('Shot missed.');
    return;
  }

  const soldier = hits[0].object.userData.soldierRoot;
  if (!soldier || !soldier.userData.alive) return;

  soldier.userData.health -= 1;
  soldier.scale.set(1.12, 0.9, 1.12);
  setTimeout(() => {
    if (soldier.userData.alive) soldier.scale.set(1, 1, 1);
  }, 100);

  if (soldier.userData.health <= 0) {
    soldier.userData.alive = false;
    soldier.rotation.z = Math.PI / 2;
    soldier.position.y = CAVE_Y + 0.45;
    showToast('Stone soldier defeated!');
  } else {
    showToast('Hit! One more shot.');
  }

  const alive = soldiers.filter((item) => item.userData.alive).length;
  if (alive === 0) openPortal();
  updateBattleHud();
}

function createShotTracer(origin, destination) {
  const geometry = new THREE.BufferGeometry().setFromPoints([origin, destination]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color: 0xa7efff, transparent: true, opacity: 0.9 })
  );
  scene.add(line);
  setTimeout(() => {
    scene.remove(line);
    geometry.dispose();
    line.material.dispose();
  }, 70);
}

function openPortal() {
  battleActive = false;
  portalOpen = true;
  portal.visible = true;
  ui.objective.textContent = `Portal open: walk through it to claim letter ${currentMission}.`;
  ui.missionHud.textContent = `Mission ${currentMission} · Enter the portal`;
  showToast('All four soldiers defeated. Portal opened!');
  updateBattleHud();
}

function returnToWorld() {
  clearSoldiers();
  area = 'world';
  battleActive = false;
  portalOpen = false;
  portalEntering = false;
  caveRoot.visible = false;
  portal.visible = false;
  pickaxe.visible = true;
  rig.gun.visible = false;
  document.body.classList.remove('cave-mode');
  scene.background.set(0x889689);
  scene.fog.color.set(0x829083);
  scene.fog.density = 0.0115;
  ui.battleHud.classList.add('hidden');

  player.position.copy(worldReturnPosition);
  player.position.y = terrainHeight(player.position.x, player.position.z) + PLAYER_HEIGHT / 2;
  verticalSpeed = 0;
  grounded = true;
}

function addDust() {
  const count = 1000;
  const rand = seededRandom(9501);
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (rand() - 0.5) * WORLD_SIZE;
    positions[i * 3 + 1] = 0.5 + rand() * 22;
    positions[i * 3 + 2] = (rand() - 0.5) * WORLD_SIZE;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  dust = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xe7cf9c,
      size: 0.055,
      transparent: true,
      opacity: 0.42,
      depthWrite: false
    })
  );
  scene.add(dust);
}

function addBoxCollider(x, y, z, hx, hy, hz) {
  colliders.push({
    center: new THREE.Vector3(x, y, z),
    half: new THREE.Vector3(hx, hy, hz)
  });
}

function buildAlphabet() {
  ui.alphabet.innerHTML = "";
  for (const letter of ALPHABET) {
    const span = document.createElement("span");
    span.textContent = letter;
    span.dataset.letter = letter;
    ui.alphabet.appendChild(span);
  }
}

function applyCollectedState(letter) {
  const crystal = crystals.find((item) => item.userData.letter === letter);
  if (!crystal) return;
  crystal.userData.collected = true;
  crystal.visible = false;
}


function availableMissions() {
  return ALPHABET.filter((letter) => !collected.has(letter));
}

function buildMissionSelectors() {
  const options = ALPHABET.map((letter) => {
    const completed = collected.has(letter);
    return `<option value="${letter}" ${completed ? 'disabled' : ''}>${MISSION_TITLES[letter]}${completed ? ' — COMPLETE' : ''}</option>`;
  }).join('');

  ui.missionSelectStart.innerHTML = options;
  ui.missionSelectPause.innerHTML = options;
  ui.missionSelectStart.value = currentMission;
  ui.missionSelectPause.value = currentMission;
}

function setMission(letter, announce = true) {
  const available = availableMissions();
  if (!available.length) return;

  const selected = available.includes(letter) ? letter : available[0];
  currentMission = selected;
  ui.missionSelectStart.value = selected;
  ui.missionSelectPause.value = selected;
  ui.missionTitle.textContent = MISSION_TITLES[selected];
  ui.missionHud.textContent = `Selected letter ${selected} · Press M for the next mission`;

  for (const crystal of crystals) {
    const selectedCrystal = crystal.userData.letter === selected;
    crystal.userData.crystal.material.emissiveIntensity = selectedCrystal ? 4.1 : 1.1;
    crystal.userData.light.intensity = selectedCrystal ? 17 : 4;
    crystal.userData.label.material.opacity = selectedCrystal ? 1 : 0.35;
    crystal.scale.setScalar(selectedCrystal ? 1.12 : 0.94);
  }

  if (area === 'world') {
    ui.objective.textContent = `Follow the radar to letter ${selected}, then hold E to mine it.`;
  }
  saveGame();
  if (announce) showToast(`${MISSION_TITLES[selected]} selected.`);
}

function cycleMission(direction = 1) {
  if (area !== 'world' || spelling || won) return;
  const available = availableMissions();
  if (available.length < 2) return;
  const index = Math.max(0, available.indexOf(currentMission));
  setMission(available[(index + direction + available.length) % available.length]);
}

function loadSave() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_SAVE_KEYS) {
        raw = localStorage.getItem(legacyKey);
        if (raw) break;
      }
    }
    const save = JSON.parse(raw || "{}");

    for (const letter of save.letters || []) {
      if (ALPHABET.includes(letter)) {
        collected.add(letter);
        applyCollectedState(letter);
      }
    }

    mistakes = Number.isFinite(save.mistakes) ? save.mistakes : 0;
    playerName = typeof save.playerName === "string" ? save.playerName.trim() : "";
    currentMission = ALPHABET.includes(save.currentMission)
      ? save.currentMission
      : (availableMissions()[0] || 'A');

    if (playerName) {
      ui.playerNameInput.value = playerName;
      ui.playerHud.textContent = `Explorer: ${playerName}`;
    }
  } catch {
    localStorage.removeItem(SAVE_KEY);
  }

  refreshProgress();
}

function saveGame() {
  localStorage.setItem(
    SAVE_KEY,
    JSON.stringify({
      letters: [...collected],
      mistakes,
      playerName,
      currentMission
    })
  );
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}

function refreshProgress() {
  ui.count.textContent = `${collected.size} / 26`;
  ui.letterBar.style.width = `${(collected.size / 26) * 100}%`;

  for (const node of ui.alphabet.children) {
    node.classList.toggle("found", collected.has(node.dataset.letter));
  }

  if (collected.size === 26) {
    ui.objective.textContent = 'All letters recovered.';
  } else if (area === 'world') {
    ui.objective.textContent = `Follow the radar to letter ${currentMission}, then hold E to mine it.`;
  }
}
function startGame() {
  const enteredName = ui.playerNameInput.value.trim();

  if (!enteredName) {
    ui.nameFeedback.textContent = "Enter the child's name before beginning.";
    ui.playerNameInput.focus();
    return;
  }

  playerName = enteredName.slice(0, 24);
  setMission(ui.missionSelectStart.value || currentMission, false);
  ui.playerNameInput.value = playerName;
  ui.playerHud.textContent = `Explorer: ${playerName}`;
  ui.nameFeedback.textContent = "";
  saveGame();

  running = true;
  won = false;
  ui.start.classList.remove("visible");
  ui.pause.classList.remove("visible");
  ui.hud.classList.remove("hidden");

  if (!startTime) startTime = performance.now();
  renderer.domElement.requestPointerLock();
}

function showPause() {
  if (!running || spelling || won) return;
  ui.pauseTitle.textContent = area === 'cave' ? 'Return to the cave trial?' : 'Return to the mission?';
  ui.missionSelectPause.disabled = area === 'cave';
  ui.applyMissionBtn.disabled = area === 'cave';
  ui.pause.classList.add("visible");
}

function updatePlayer(dt, elapsed) {
  if (!running || spelling || won || document.pointerLockElement !== renderer.domElement) return;

  forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  move.set(0, 0, 0);

  if (keys.KeyW) move.add(forward);
  if (keys.KeyS) move.sub(forward);
  if (keys.KeyD) move.add(right);
  if (keys.KeyA) move.sub(right);

  const isMoving = move.lengthSq() > 0;
  const sprinting = Boolean(keys.ShiftLeft || keys.ShiftRight);
  const movementLimit = area === 'cave' ? CAVE_LIMIT : WORLD_SIZE / 2 - 2;

  if (isMoving) {
    move.normalize();
    const speed = sprinting ? SPRINT_SPEED : WALK_SPEED;
    wanted.copy(player.position).addScaledVector(move, speed * dt);
    wanted.x = THREE.MathUtils.clamp(wanted.x, -movementLimit, movementLimit);
    wanted.z = THREE.MathUtils.clamp(wanted.z, -movementLimit, movementLimit);

    if (!wouldCollide(wanted)) {
      player.position.x = wanted.x;
      player.position.z = wanted.z;
    } else {
      wanted.copy(player.position);
      wanted.x += move.x * speed * dt;
      if (!wouldCollide(wanted)) player.position.x = wanted.x;

      wanted.copy(player.position);
      wanted.z += move.z * speed * dt;
      if (!wouldCollide(wanted)) player.position.z = wanted.z;
    }

    const targetAngle = Math.atan2(move.x, move.z);
    playerModel.rotation.y = lerpAngle(
      playerModel.rotation.y,
      targetAngle,
      Math.min(1, dt * 11)
    );

    const bobRate = sprinting ? 14.5 : 10.5;
    playerModel.position.y = Math.abs(Math.sin(elapsed * bobRate)) * 0.055;
  } else {
    playerModel.position.y = THREE.MathUtils.lerp(playerModel.position.y, 0, Math.min(1, dt * 9));
  }

  if (keys.Space && grounded) {
    verticalSpeed = JUMP_SPEED;
    grounded = false;
  }

  verticalSpeed -= GRAVITY * dt;
  player.position.y += verticalSpeed * dt;

  const floorY = (
    area === 'cave'
      ? CAVE_Y
      : terrainHeight(player.position.x, player.position.z)
  ) + PLAYER_HEIGHT / 2;

  if (player.position.y <= floorY) {
    player.position.y = floorY;
    verticalSpeed = 0;
    grounded = true;
  }

  const isMining = area === 'world' && Boolean(keys.KeyE && miningTarget);
  animateCharacter(dt, elapsed, isMoving, sprinting, isMining);

  if (area === 'cave') {
    playerModel.rotation.y = lerpAngle(
      playerModel.rotation.y,
      Math.PI + yaw,
      Math.min(1, dt * 10)
    );
    rig.rightArm.shoulder.rotation.x = THREE.MathUtils.lerp(
      rig.rightArm.shoulder.rotation.x,
      -1.2,
      Math.min(1, dt * 9)
    );
    rig.rightArm.elbow.rotation.x = THREE.MathUtils.lerp(
      rig.rightArm.elbow.rotation.x,
      -0.25,
      Math.min(1, dt * 9)
    );
  }

  if (isMining) {
    miningAmount = Math.min(1, miningAmount + dt / MINE_TIME);
    ui.mining.classList.add("visible");
    ui.interaction.classList.remove("visible");
    ui.miningBar.style.width = `${miningAmount * 100}%`;
    ui.miningTitle.textContent = `Opening trial for letter ${miningTarget.userData.letter}...`;

    if (miningAmount >= 1) startCaveTrial(miningTarget);
  } else {
    miningAmount = Math.max(0, miningAmount - dt * 2.5);
    ui.mining.classList.remove("visible");
    ui.miningBar.style.width = "0%";
  }
}
function wouldCollide(position) {
  const py = position.y - PLAYER_HEIGHT / 2 + 1.0;
  const activeColliders = area === 'cave' ? caveColliders : colliders;
  for (const box of activeColliders) {
    if (
      Math.abs(position.x - box.center.x) < box.half.x + PLAYER_RADIUS &&
      Math.abs(py - box.center.y) < box.half.y + 0.85 &&
      Math.abs(position.z - box.center.z) < box.half.z + PLAYER_RADIUS
    ) return true;
  }
  return false;
}
function updateCamera(dt) {
  if (!player) return;

  camTarget.copy(player.position);
  camTarget.y += 0.52;

  const distance = 5.65;
  const horizontal = Math.cos(pitch) * distance;

  camWanted.set(
    camTarget.x + Math.sin(yaw) * horizontal,
    camTarget.y + 1.85 + Math.sin(-pitch) * distance,
    camTarget.z + Math.cos(yaw) * horizontal
  );

  camera.position.lerp(camWanted, 1 - Math.pow(0.001, dt));
  camera.lookAt(camTarget);
}

function updateCrystals(elapsed) {
  for (const item of crystals) {
    if (item.userData.collected) continue;
    const { crystal, ring, phase } = item.userData;
    crystal.rotation.y = elapsed * 0.85 + phase;
    crystal.position.y = 1.8 + Math.sin(elapsed * 1.8 + phase) * 0.14;
    ring.rotation.z = elapsed * 0.5 + phase;
  }

  if (area !== 'world') {
    miningTarget = null;
    ui.interaction.classList.remove('visible');
    return;
  }

  const selected = crystals.find(
    (item) => item.userData.letter === currentMission && !item.userData.collected
  );
  const distance = selected ? selected.position.distanceTo(player.position) : Infinity;
  miningTarget = distance < 4.0 ? selected : null;

  if (!keys.KeyE && !spelling) {
    ui.interaction.classList.toggle('visible', Boolean(miningTarget));
    if (miningTarget) {
      ui.interaction.querySelector('span').textContent = `Hold to begin letter ${currentMission} trial`;
    }
  }
}
function beginSpelling(crystal) {
  keys.KeyE = false;
  miningAmount = 0;
  miningTarget = null;
  challengeCrystal = crystal;
  spelling = true;
  keys = {};
  document.exitPointerLock();

  const letter = crystal.userData.letter;
  const [example] = WORDS[letter];

  ui.challengeLetter.textContent = letter;
  ui.challengeClue.textContent =
    `The portal is ready. Type any word that begins with the letter ${letter}.`;
  ui.challengeHint.innerHTML =
    `Example: <strong>${example}</strong> · Correct spelling claims the crystal`;
  ui.spellFeedback.textContent = "";
  ui.spellFeedback.className = "";
  ui.spellInput.value = "";
  ui.spellInput.placeholder = `${letter} word`;
  ui.spell.classList.add("visible");

  setTimeout(() => ui.spellInput.focus(), 60);
}

function submitSpelling(event) {
  event.preventDefault();
  if (!challengeCrystal) return;

  const letter = challengeCrystal.userData.letter;
  const answer = ui.spellInput.value.trim().toLowerCase();
  const requiredStart = letter.toLowerCase();
  const usesLettersOnly = /^[a-z]+$/i.test(answer);
  const startsCorrectly = answer.startsWith(requiredStart);

  if (answer && usesLettersOnly && startsCorrectly) {
    ui.spellFeedback.textContent =
      `${answer} works! Letter ${letter} restored.`;
    ui.spellFeedback.className = "good";

    collected.add(letter);
    challengeCrystal.userData.collected = true;
    challengeCrystal.visible = false;
    refreshProgress();

    const remaining = availableMissions();
    if (remaining.length) currentMission = remaining[0];
    saveGame();
    buildMissionSelectors();

    setTimeout(() => {
      ui.spell.classList.remove("visible");
      spelling = false;
      challengeCrystal = null;
      returnToWorld();

      if (collected.size === 26) {
        finishGame();
      } else {
        setMission(currentMission, false);
        showToast(`Letter ${letter} recovered with “${answer}”!`);
        renderer.domElement.requestPointerLock();
      }
    }, 700);
  } else {
    mistakes += 1;
    saveGame();

    if (!answer) {
      ui.spellFeedback.textContent = "Type a word before unlocking the letter.";
    } else if (!usesLettersOnly) {
      ui.spellFeedback.textContent =
        "Use one word containing letters only—no spaces, numbers, or symbols.";
    } else {
      ui.spellFeedback.textContent =
        `That word must begin with the letter ${letter}.`;
    }

    ui.spellFeedback.className = "bad";
    ui.spellInput.select();
  }
}


function calculateGrade(wrongAttempts) {
  const correctTrials = 26;
  const totalAttempts = correctTrials + wrongAttempts;
  const accuracy =
    totalAttempts > 0 ? Math.round((correctTrials / totalAttempts) * 100) : 100;

  let letter = "F";
  let message = "Keep practicing and try the expedition again.";

  if (accuracy === 100) {
    letter = "A+";
    message = "Perfect expedition—no wrong attempts!";
  } else if (accuracy >= 93) {
    letter = "A";
    message = "Excellent spelling accuracy!";
  } else if (accuracy >= 90) {
    letter = "A-";
    message = "Great work with only a few mistakes.";
  } else if (accuracy >= 87) {
    letter = "B+";
    message = "Very good work—keep sharpening those words.";
  } else if (accuracy >= 83) {
    letter = "B";
    message = "Good spelling performance.";
  } else if (accuracy >= 80) {
    letter = "B-";
    message = "Good effort with room to improve.";
  } else if (accuracy >= 77) {
    letter = "C+";
    message = "Solid completion—more practice will raise the score.";
  } else if (accuracy >= 73) {
    letter = "C";
    message = "The expedition was completed successfully.";
  } else if (accuracy >= 70) {
    letter = "C-";
    message = "Completed, but several letters need more practice.";
  } else if (accuracy >= 67) {
    letter = "D+";
    message = "More spelling practice is recommended.";
  } else if (accuracy >= 63) {
    letter = "D";
    message = "Review the difficult letters and try again.";
  } else if (accuracy >= 60) {
    letter = "D-";
    message = "A second expedition should improve this grade.";
  }

  return { letter, accuracy, message };
}

function finishGame() {
  won = true;
  running = false;
  document.exitPointerLock();

  const seconds = Math.max(
    0,
    Math.floor((performance.now() - startTime) / 1000)
  );
  const result = calculateGrade(mistakes);

  ui.finalTime.textContent = formatTime(seconds);
  ui.finalErrors.textContent = mistakes;
  ui.finalAccuracy.textContent = `${result.accuracy}%`;
  ui.finalGrade.textContent = result.letter;
  ui.finalGradeMessage.textContent = result.message;
  ui.finalName.textContent = playerName || "Explorer";
  ui.win.classList.add("visible");
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function showToast(message) {
  clearTimeout(toastTimeout);
  ui.toast.textContent = message;
  ui.toast.classList.add("visible");
  toastTimeout = setTimeout(() => ui.toast.classList.remove("visible"), 1800);
}

function drawRadar() {
  const ctx = radarCtx;
  const w = ui.radar.width;
  const h = ui.radar.height;
  const cx = w / 2;
  const cy = h / 2;
  const scale = area === 'cave' ? 3.8 : 0.62;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = area === 'cave' ? 'rgba(5,12,18,.94)' : 'rgba(8,15,10,.92)';
  ctx.beginPath();
  ctx.arc(cx, cy, cx - 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = area === 'cave' ? 'rgba(103,221,255,.2)' : 'rgba(220,192,128,.18)';
  ctx.lineWidth = 1;
  for (const r of [28, 55, 82]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, cx - 5, 0, Math.PI * 2);
  ctx.clip();

  if (area === 'world') {
    const target = crystals.find(
      (crystal) => crystal.userData.letter === currentMission && !crystal.userData.collected
    );
    if (target) {
      const dx = (target.position.x - player.position.x) * scale;
      const dz = (target.position.z - player.position.z) * scale;
      const length = Math.hypot(dx, dz);
      const factor = length > 78 ? 78 / length : 1;
      ctx.fillStyle = '#ffd57b';
      ctx.beginPath();
      ctx.arc(cx + dx * factor, cy + dz * factor, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff1c7';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(currentMission, cx + dx * factor, cy + dz * factor + 4);
    }
  } else {
    for (const soldier of soldiers) {
      if (!soldier.userData.alive) continue;
      const dx = (soldier.position.x - player.position.x) * scale;
      const dz = (soldier.position.z - player.position.z) * scale;
      ctx.fillStyle = '#ff675e';
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dz, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    if (portalOpen) {
      const dx = (portal.position.x - player.position.x) * scale;
      const dz = (portal.position.z - player.position.z) * scale;
      ctx.strokeStyle = '#7be8ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dz, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-yaw);
  ctx.fillStyle = '#eaf6ec';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(6, 7);
  ctx.lineTo(0, 4);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = 'rgba(255,255,255,.72)';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(area === 'cave' ? 'TRIAL RADAR' : `MISSION ${currentMission}`, cx, 16);
}
function lerpAngle(a, b, t) {
  const delta = Math.atan2(Math.sin(b - a), Math.cos(b - a));
  return a + delta * t;
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  updatePlayer(dt, elapsed);
  updateCamera(dt);
  updateCrystals(elapsed);
  updateSoldiers(dt, elapsed);
  drawRadar();

  if (dust) dust.rotation.y = elapsed * 0.006;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function isTextEntryTarget(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target?.isContentEditable
  );
}

window.addEventListener("keydown", (event) => {
  if (isTextEntryTarget(event.target)) {
    return;
  }

  if (event.code === 'KeyM') {
    event.preventDefault();
    cycleMission(1);
    return;
  }

  keys[event.code] = true;

  if (
    ["Space", "KeyW", "KeyA", "KeyS", "KeyD", "KeyE", "KeyM"].includes(event.code)
  ) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  if (isTextEntryTarget(event.target)) {
    return;
  }

  keys[event.code] = false;
});

window.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement !== renderer.domElement || spelling || won) return;
  yaw -= event.movementX * 0.0024;
  pitch -= event.movementY * 0.0019;
  pitch = THREE.MathUtils.clamp(pitch, -0.52, 0.34);
});

window.addEventListener('mousedown', (event) => {
  if (event.button === 0) shoot();
});

document.addEventListener("pointerlockchange", () => {
  if (
    running &&
    !spelling &&
    !won &&
    document.pointerLockElement !== renderer.domElement
  ) {
    showPause();
  } else {
    ui.pause.classList.remove("visible");
  }
});

renderer?.domElement?.addEventListener?.("click", () => {
  if (running && !spelling && !won && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
  }
});

ui.startBtn.addEventListener("click", startGame);
ui.playerNameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    startGame();
  }
});
ui.resumeBtn.addEventListener("click", () => renderer.domElement.requestPointerLock());
ui.missionSelectStart.addEventListener('change', () => {
  if (!running) setMission(ui.missionSelectStart.value, false);
});
ui.applyMissionBtn.addEventListener('click', () => {
  if (area !== 'world') return;
  setMission(ui.missionSelectPause.value);
  renderer.domElement.requestPointerLock();
});
ui.resetBtn.addEventListener("click", resetGame);
ui.playAgainBtn.addEventListener("click", resetGame);
ui.spellForm.addEventListener("submit", submitSpelling);

init();

renderer.domElement.addEventListener("click", () => {
  if (running && !spelling && !won && document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
  }
});
