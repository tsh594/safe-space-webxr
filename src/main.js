import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import './style.css';

/* =========================================================
   Safe Space — a seated, hands-first place to practice being human.
   Everything runs on-device: no accounts, no servers, no recordings.
   ========================================================= */

const canvas = document.querySelector('#scene');
const startScreen = document.querySelector('#start-screen');
const enterVR = document.querySelector('#enter-vr');
const enterDesktop = document.querySelector('#enter-desktop');
const toast = document.querySelector('#toast');
const returningNote = document.querySelector('#returning');

/* ---------- persistence (on-device only) ---------- */
const SAVE_KEY = 'safespace.v1';
const defaultSave = { sessions: 0, insights: [], flowers: 0, mission: null, trust: { maya: 0, leo: 0 } };
function loadSave() {
  try { return { ...defaultSave, ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; }
  catch { return { ...defaultSave }; }
}
function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* private mode */ } }
const save = loadSave();
if (save.sessions > 0 && returningNote) {
  returningNote.textContent = `Welcome back. Session ${save.sessions + 1} · ${save.insights.length} insights · ${save.flowers} flowers in your garden`;
}

/* ---------- renderer / scene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const skyColor = new THREE.Color(0xdde8f5);
scene.background = skyColor;
scene.fog = new THREE.Fog(0xdde8f5, 6, 18);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 60);
camera.position.set(0, 1.2, 0);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xfff4dd, 0x6f7898, 2.2);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff8e8, 2.0);
sun.position.set(2, 5, 3);
scene.add(sun);

/* ---------- helpers ---------- */
const mat = (color, rough = 0.85) => new THREE.MeshStandardMaterial({ color, roughness: rough });
function box(w, h, d, color, x, y, z, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.position.set(x, y, z); parent.add(m); return m;
}

/* ---------- environments ---------- */
const office = new THREE.Group();
const park = new THREE.Group();
const calm = new THREE.Group();
scene.add(office, park, calm);

// Office
{
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 64), mat(0xbca58f, 0.9));
  floor.rotation.x = -Math.PI / 2; office.add(floor);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), mat(0x9b7f9c, 1));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.005, -1.4); office.add(rug);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), mat(0xf2dfcf, 0.95));
  wall.position.set(0, 3, -4); office.add(wall);
  const sideL = wall.clone(); sideL.rotation.y = Math.PI / 2; sideL.position.set(-4.5, 3, 0); office.add(sideL);
  const sideR = wall.clone(); sideR.rotation.y = -Math.PI / 2; sideR.position.set(4.5, 3, 0); office.add(sideR);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.6), new THREE.MeshBasicMaterial({ color: 0xcfe6f7 }));
  win.position.set(1.6, 2.1, -3.98); office.add(win);
  box(2.8, 0.1, 0.1, 0xfff4e8, 1.6, 1.25, -3.95, office);
  box(2.8, 0.1, 0.1, 0xfff4e8, 1.6, 2.95, -3.95, office);
  // therapist chair
  box(0.9, 0.45, 0.8, 0x7d5764, -1.9, 0.22, -2.9, office);
  box(0.9, 0.8, 0.18, 0x7d5764, -1.9, 0.75, -3.28, office);
  // bookshelf
  box(1.2, 2.0, 0.35, 0x8a6a52, -3.2, 1.0, -3.7, office);
  const bookColors = [0x5b65c7, 0xd1784f, 0x3f8f73, 0xe0b84f, 0x8f5fa8];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) {
    box(0.12, 0.3, 0.25, bookColors[(r + i) % 5], -3.65 + i * 0.17, 0.35 + r * 0.45, -3.6, office);
  }
  // plant
  box(0.35, 0.4, 0.35, 0xc7774f, 3.2, 0.2, -3.2, office);
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), mat(0x4f8f5a));
  leaves.position.set(3.2, 0.85, -3.2); office.add(leaves);
}

// Garden of insights (grows on the office windowsill / floor)
const garden = new THREE.Group();
garden.position.set(1.6, 0, -3.6);
office.add(garden);
box(2.6, 0.25, 0.4, 0x8a6a52, 0, 0.12, 0, garden);
const flowerColors = [0xf28fad, 0xf7c548, 0x9b8cf2, 0x6fc3df, 0xf29e6b, 0xffffff];
function addFlowerMesh(i) {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.35), mat(0x3f8f4f));
  stem.position.y = 0.175; g.add(stem);
  const c = flowerColors[i % flowerColors.length];
  for (let p = 0; p < 5; p++) {
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mat(c, 0.6));
    const a = (p / 5) * Math.PI * 2;
    petal.position.set(Math.cos(a) * 0.05, 0.36, Math.sin(a) * 0.05); g.add(petal);
  }
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mat(0xffd34d, 0.5));
  center.position.y = 0.37; g.add(center);
  g.position.set(-1.15 + (i % 12) * 0.2, 0.25, (Math.floor(i / 12) % 2) * 0.12 - 0.06);
  g.scale.setScalar(0.001);
  g.userData.grow = 0;
  garden.add(g);
  return g;
}
for (let i = 0; i < save.flowers; i++) { const f = addFlowerMesh(i); f.scale.setScalar(1); f.userData.grow = 1; }

// Park
{
  const grass = new THREE.Mesh(new THREE.CircleGeometry(25, 64), mat(0x86b36b, 1));
  grass.rotation.x = -Math.PI / 2; park.add(grass);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 30), mat(0xd8c7a3, 1));
  path.rotation.x = -Math.PI / 2; path.position.set(0, 0.004, -6); park.add(path);
  // bench the user sits on with the characters
  box(2.4, 0.08, 0.5, 0x8a5a3b, 1.2, 0.45, -1.6, park);
  box(2.4, 0.4, 0.06, 0x8a5a3b, 1.2, 0.75, -1.85, park);
  for (const x of [0.15, 2.25]) box(0.08, 0.45, 0.45, 0x3d3d45, x, 0.22, -1.6, park);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2, r = 8 + (i % 3) * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.6), mat(0x7a5638));
    trunk.position.set(Math.cos(a) * r, 0.8, Math.sin(a) * r); park.add(trunk);
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 1), mat(i % 2 ? 0x4f8f5a : 0x5fa36a));
    top.position.set(Math.cos(a) * r, 2.3, Math.sin(a) * r); park.add(top);
  }
}

// Calm Corner — sky, water, nothing else
{
  const water = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x7fa8c9, roughness: 0.25, metalness: 0.1 }));
  water.rotation.x = -Math.PI / 2; calm.add(water);
  for (let i = 0; i < 40; i++) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const a = Math.random() * Math.PI * 2, e = 0.3 + Math.random() * 0.9;
    star.position.set(Math.cos(a) * 20 * Math.cos(e), 20 * Math.sin(e), Math.sin(a) * 20 * Math.cos(e));
    calm.add(star);
  }
}

// Breathing orb (used in breathing coach + calm corner)
const breathOrb = new THREE.Mesh(
  new THREE.SphereGeometry(0.16, 32, 24),
  new THREE.MeshStandardMaterial({ color: 0x9fc6ff, emissive: 0x4a6fb0, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 })
);
breathOrb.visible = false;
scene.add(breathOrb);

// Emotion weather — gentle rain when anxious
const rainCount = 600;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(rainCount * 3);
for (let i = 0; i < rainCount; i++) {
  rainPos[i * 3] = (Math.random() - 0.5) * 16;
  rainPos[i * 3 + 1] = Math.random() * 6;
  rainPos[i * 3 + 2] = (Math.random() - 0.5) * 16;
}
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xaac4e6, size: 0.03, transparent: true, opacity: 0.7 }));
rain.visible = false;
scene.add(rain);

const weatherTargets = {
  calm: { sky: 0xcfe8ff, sun: 2.4, rain: false },
  nervous: { sky: 0xb8c2cf, sun: 1.0, rain: true },
  unsure: { sky: 0xd8dde8, sun: 1.6, rain: false },
  calmcorner: { sky: 0x1d2a4a, sun: 0.4, rain: false }
};
let weather = 'calm';
function setWeather(name) { weather = name; rain.visible = weatherTargets[name].rain; }

/* ---------- characters ---------- */
function makeFigure({ skin, shirt, pants = 0x3b3f55, hair, hairStyle = 'short', seated = true }) {
  const g = new THREE.Group();
  const skinM = mat(skin, 0.7), shirtM = mat(shirt), pantsM = mat(pants), hairM = mat(hair, 0.9);
  const hipY = seated ? 0.5 : 0.95;
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.38, 6, 16), shirtM);
  torso.position.y = hipY + 0.32; g.add(torso);
  const head = new THREE.Group(); head.position.y = hipY + 0.82; g.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16), skinM);
  skull.scale.set(0.92, 1.08, 0.95); head.add(skull);
  const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.138, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM);
  hairMesh.position.y = 0.02; hairMesh.rotation.x = -0.25; head.add(hairMesh);
  if (hairStyle === 'long') {
    const back = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.22, 4, 12), hairM);
    back.position.set(0, -0.1, -0.06); head.add(back);
  }
  const eyeM = mat(0x22252e, 0.4);
  for (const x of [-0.045, 0.045]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), eyeM);
    eye.position.set(x, 0.015, 0.118); head.add(eye);
  }
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.008, 0.01), mat(0x7a3b3b));
  mouth.position.set(0, -0.05, 0.12); head.add(mouth);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.42, 4, 10), shirtM);
    arm.position.set(s * 0.25, hipY + 0.3, 0.06); arm.rotation.x = -0.5; arm.rotation.z = s * 0.12; g.add(arm);
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.36, 4, 10), pantsM);
    if (seated) { thigh.rotation.x = Math.PI / 2; thigh.position.set(s * 0.1, hipY, 0.2); }
    else { thigh.position.set(s * 0.1, hipY - 0.45, 0); thigh.scale.y = 2; }
    g.add(thigh);
    if (seated) {
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.36, 4, 10), pantsM);
      shin.position.set(s * 0.1, 0.25, 0.4); g.add(shin);
    }
  }
  g.userData = { head, mouth, talking: 0, mood: 0 };
  return g;
}

const maya = makeFigure({ skin: 0xe2b49a, shirt: 0xe58fa8, hair: 0x6b3b2a, hairStyle: 'long' });
maya.position.set(1.7, 0, -1.6); maya.rotation.y = -0.9;
park.add(maya);
const leo = makeFigure({ skin: 0x8d5a3f, shirt: 0x3e5c7a, pants: 0x2b2b2b, hair: 0x1b1b1b, seated: false });
leo.position.set(1.3, 0, -2.6); leo.rotation.y = -0.46; leo.visible = false;
park.add(leo);

// Therapist — Meshy-generated scan, finished in Blender (rig pose + hair) and exported as GLB
const therapist = new THREE.Group();
therapist.position.set(-1.3, 0, -2.25);
therapist.rotation.y = 0.46;
office.add(therapist);
const therapistFallback = makeFigure({ skin: 0xaa7057, shirt: 0x59669c, hair: 0x2a1d18, seated: true });
therapistFallback.position.z = -0.1;
therapist.add(therapistFallback);
new GLTFLoader().load(`${import.meta.env.BASE_URL}therapist.glb`, gltf => {
  const model = gltf.scene;
  const bbox = new THREE.Box3().setFromObject(model);
  const height = bbox.max.y - bbox.min.y;
  model.scale.setScalar(1.78 / height);
  model.position.y = -bbox.min.y * (1.78 / height);
  model.traverse(o => {
    if (o.isMesh && o.material) {
      o.material.transparent = false;
      o.material.alphaTest = 0;
      o.material.depthWrite = true;
    }
  });
  therapist.remove(therapistFallback);
  therapist.position.z = -2.6;
  therapist.userData.model = model;
  therapist.add(model);
}, undefined, () => { /* fallback figure stays */ });

// Trunk of identities + mirror ("you")
const trunk = new THREE.Group();
box(0.9, 0.45, 0.5, 0x6b4a32, 0, 0.22, 0, trunk);
box(0.92, 0.06, 0.52, 0xc9a24a, 0, 0.46, 0, trunk);
trunk.position.set(0.9, 0, -1.7); trunk.rotation.y = -0.4; trunk.visible = false;
office.add(trunk);
const mirrorYou = makeFigure({ skin: 0xc99a7c, shirt: 0x8aa0b8, hair: 0x3a2a20, seated: false });
mirrorYou.position.set(2.1, 0, -2.6); mirrorYou.rotation.y = -0.6; mirrorYou.visible = false;
office.add(mirrorYou);
const mirrorFrame = box(0.9, 2.0, 0.05, 0xd7c2a4, 2.1, 1.0, -2.75, office);
mirrorFrame.rotation.y = -0.6; mirrorFrame.visible = false;
const outfits = {
  jacket: { color: 0x2f3550, label: 'Professional jacket' },
  hoodie: { color: 0xe08a3c, label: 'Cozy hoodie' },
  own: { color: 0x8aa0b8, label: 'Your own look' }
};
let outfit = 'own';
function wearOutfit(name) {
  outfit = name;
  mirrorYou.traverse(o => { if (o.isMesh && o.material.color && o.position.y > 0.6 && o.geometry.type === 'CapsuleGeometry') o.material.color.setHex(outfits[name].color); });
}

/* ---------- voice (on-device speech synthesis) ---------- */
let voiceOn = true;
const voices = { therapist: { pitch: 0.9, rate: 0.92 }, maya: { pitch: 1.35, rate: 1.12 }, leo: { pitch: 0.75, rate: 1.05 }, guide: { pitch: 1.0, rate: 0.9 } };
let speakingChar = null;
function speak(text, who = 'therapist') {
  speakingChar = who;
  if (!voiceOn || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[—–]/g, ', '));
    Object.assign(u, voices[who] || voices.therapist);
    u.onend = () => { speakingChar = null; };
    speechSynthesis.speak(u);
  } catch { /* speech not available */ }
}

/* ---------- UI: panel + buttons (ray pinch, poke, mouse) ---------- */
const ui = new THREE.Group();
ui.position.set(0, 1.2, 0);
scene.add(ui);

function wrap(ctx, text, maxWidth) {
  const words = text.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

const SPEAKER_STYLE = {
  therapist: { name: 'Your guide', color: '#5b65c7' },
  guide: { name: 'Guide · hint', color: '#2f856a' },
  maya: { name: 'Maya', color: '#c75b85' },
  leo: { name: 'Leo', color: '#3e5c7a' },
  system: { name: 'Safe Space', color: '#41499e' },
  insight: { name: '✦ Insight unlocked', color: '#2f856a' }
};

const panelCanvas = document.createElement('canvas');
panelCanvas.width = 1024; panelCanvas.height = 520;
const panelTex = new THREE.CanvasTexture(panelCanvas);
panelTex.colorSpace = THREE.SRGBColorSpace;
const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.457), new THREE.MeshBasicMaterial({ map: panelTex, transparent: true }));
panel.position.set(0, 0.0, -1.05);
panel.rotation.x = -0.12;
ui.add(panel);

let battery = 1;
function drawPanel(speaker, text) {
  const c = panelCanvas.getContext('2d');
  const st = SPEAKER_STYLE[speaker] || SPEAKER_STYLE.system;
  c.clearRect(0, 0, 1024, 520);
  c.fillStyle = 'rgba(255,250,241,0.96)';
  c.beginPath(); c.roundRect(4, 4, 1016, 512, 36); c.fill();
  c.fillStyle = st.color;
  c.beginPath(); c.roundRect(4, 4, 1016, 76, [36, 36, 0, 0]); c.fill();
  c.fillStyle = '#fff'; c.font = '700 40px system-ui, sans-serif'; c.textAlign = 'left';
  c.fillText(st.name, 40, 56);
  // social battery
  c.textAlign = 'right'; c.font = '28px system-ui, sans-serif';
  c.fillText('social battery', 830, 52);
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.strokeRect(850, 30, 130, 30);
  c.fillStyle = battery > 0.35 ? '#9be3b8' : '#f7c548';
  c.fillRect(854, 34, 122 * battery, 22);
  c.fillStyle = '#253044'; c.textAlign = 'left'; c.font = '44px system-ui, sans-serif';
  const lines = wrap(c, text, 940).slice(0, 7);
  lines.forEach((l, i) => c.fillText(l, 42, 150 + i * 56));
  panelTex.needsUpdate = true;
}

const buttons = [];
const BTN_W = 0.43, BTN_H = 0.085;
function makeButtonTexture(label, color, hover) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 100;
  const x = c.getContext('2d');
  x.fillStyle = hover ? '#f3c86b' : color;
  x.beginPath(); x.roundRect(2, 2, 508, 96, 28); x.fill();
  x.fillStyle = hover ? '#253044' : '#fff'; x.font = '600 30px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  const lines = wrap(x, label, 470).slice(0, 2);
  lines.forEach((l, i) => x.fillText(l, 256, 50 + (i - (lines.length - 1) / 2) * 34));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function clearButtons() {
  for (const b of buttons) { if (b.userData.util) continue; ui.remove(b); b.userData.baseTex?.dispose(); b.userData.hoverTex?.dispose(); }
  buttons.length = 0;
  buttons.push(calmBtn, voiceBtn);
}
function setChoices(choices) {
  clearButtons();
  choices.forEach((ch, i) => {
    const color = ch.color || '#5b65c7';
    const m = new THREE.Mesh(new THREE.PlaneGeometry(BTN_W, BTN_H), new THREE.MeshBasicMaterial({ map: makeButtonTexture(ch.label, color, false), side: THREE.DoubleSide }));
    m.userData = { action: ch.action, baseTex: m.material.map, hoverTex: makeButtonTexture(ch.label, color, true) };
    const col = choices.length === 1 ? 0 : (i % 2 ? 1 : -1);
    const row = Math.floor(i / 2);
    m.position.set(col * 0.23, -0.3 - row * 0.105, -0.95);
    m.rotation.x = -0.3;
    ui.add(m); buttons.push(m);
  });
}

// Always-available utility buttons (left side)
function utilButton(label, y, action) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.07), new THREE.MeshBasicMaterial({ map: makeButtonTexture(label, '#7b819c', false), side: THREE.DoubleSide }));
  m.userData = { action, baseTex: m.material.map, hoverTex: makeButtonTexture(label, '#7b819c', true), util: true };
  m.position.set(-0.62, y, -0.85); m.rotation.y = 0.55;
  ui.add(m); return m;
}
const calmBtn = utilButton('☁ Calm Corner', 0.05, () => enterCalmCorner());
const voiceBtn = utilButton('🔊 Voice: on', -0.05, () => {
  voiceOn = !voiceOn;
  if (!voiceOn) try { speechSynthesis.cancel(); } catch { /* */ }
  voiceBtn.userData.baseTex = makeButtonTexture(voiceOn ? '🔊 Voice: on' : '🔇 Voice: off', '#7b819c', false);
  voiceBtn.material.map = voiceBtn.userData.baseTex;
});

let pressLock = 0;
function press(btn) {
  const now = performance.now();
  if (!btn || now < pressLock) return;
  pressLock = now + 450;
  btn.scale.set(0.94, 0.94, 0.94);
  setTimeout(() => btn.scale.set(1, 1, 1), 140);
  click();
  btn.userData.action?.();
}

// tiny on-device click sound
let audioCtx;
function click() {
  try {
    audioCtx = audioCtx || new AudioContext();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 660; g.gain.setValueAtTime(0.06, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
    o.connect(g).connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + 0.13);
  } catch { /* */ }
}
function chime() {
  try {
    audioCtx = audioCtx || new AudioContext();
    [523, 659, 784].forEach((f, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain(), t = audioCtx.currentTime + i * 0.12;
      o.frequency.value = f; g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + 0.5);
    });
  } catch { /* */ }
}

function showToast(text) {
  toast.textContent = text; toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2600);
}

/* ---------- dialogue engine ---------- */
function say(speaker, text, choices) {
  drawPanel(speaker, text);
  speak(text, speaker === 'insight' || speaker === 'system' ? 'guide' : speaker);
  setChoices(choices);
}
function drain(amount) { battery = Math.max(0.1, battery - amount); }

function unlockInsight(id, text, next) {
  if (!save.insights.includes(id)) save.insights.push(id);
  save.flowers += 1; writeSave();
  addFlowerMesh(save.flowers - 1);
  chime();
  showToast('✦ Insight unlocked · a flower grows in your garden');
  say('insight', text, [{ label: 'Continue', action: next, color: '#2f856a' }]);
}

let sceneName = 'office';
function goTo(name) {
  sceneName = name;
  office.visible = name === 'office';
  park.visible = name === 'park';
  calm.visible = name === 'calm';
}

/* ---------- story beats ---------- */
const MISSIONS = [
  'Say hello to one person tomorrow.',
  'Ask someone one follow-up question about their day.',
  'Give one genuine compliment.',
  'When you feel rushed, take one slow breath before you answer.'
];

function begin() {
  goTo('office');
  save.sessions += 1; writeSave();
  if (save.mission) {
    say('therapist', `Welcome back. Last time your real-world mission was: "${save.mission}" How did it go?`, [
      { label: 'I did it!', action: () => { save.flowers += 0; chime(); say('therapist', 'That is wonderful. Small steps are how big changes happen.', [{ label: 'Continue', action: checkIn }]); } },
      { label: 'Not yet', action: () => say('therapist', 'That is okay. There is no deadline on growth. It is still there for you.', [{ label: 'Continue', action: checkIn }]) }
    ]);
  } else {
    say('therapist', 'Welcome. This is your space. We will go at your pace. Point and pinch, or simply touch a button with your finger.', [
      { label: 'Okay', action: checkIn }
    ]);
  }
}

function checkIn() {
  say('therapist', 'Before we start — how are you arriving today?', [
    { label: "I'm nervous", action: () => { setWeather('nervous'); say('therapist', 'Thank you for telling me. Most people are. Let us take three slow breaths together first.', [{ label: 'Breathe with me', action: () => breathing(3, intro) }, { label: 'Skip for now', action: intro }]); } },
    { label: 'I feel calm', action: () => { setWeather('calm'); say('therapist', 'That is a good place to begin. Notice the sun in the room? The world here reflects how you feel.', [{ label: 'Continue', action: intro }]); } },
    { label: "I'm not sure", action: () => { setWeather('unsure'); say('therapist', 'That is okay. You do not have to know yet. Want to take a few slow breaths?', [{ label: 'Breathe with me', action: () => breathing(3, intro) }, { label: 'Let us start', action: intro }]); } }
  ]);
}

let breath = null;
function breathing(cycles, done) {
  breathOrb.visible = true;
  breath = { start: performance.now(), cycles, done };
  clearButtons();
  setChoices([{ label: 'Finish early', action: endBreathing }]);
  drawPanel('therapist', 'Breathe in as the light grows… and out as it shrinks. (4 seconds in, 4 seconds out)');
  speak('Breathe in as the light grows, and out as it shrinks.');
}
function endBreathing() {
  if (!breath) return;
  const done = breath.done; breath = null; breathOrb.visible = false;
  battery = Math.min(1, battery + 0.3);
  if (weather === 'nervous') setWeather('unsure');
  done?.();
}

function intro() {
  say('therapist', 'Let us start small. I am going to take you to a park. Someone there is about to say hello. Notice how they speak — not just what they say.', [
    { label: 'Take me there', action: mayaScene }
  ]);
}

/* Maya — the anxious rambler */
function mayaScene() {
  goTo('park'); maya.visible = true; leo.visible = false;
  drain(0.15);
  say('maya', "Oh! Hi. Sorry, I didn't see you there. I'm Maya. I was just — sorry, I'm rambling. How are you?", [
    { label: "Hi Maya, I'm good. You?", action: mayaRamble }
  ]);
}
function mayaRamble() {
  say('maya', "Good! Sorry. I mean, I'm fine, it's just this park is nice and I come here a lot and — sorry — I just talk a lot when — anyway. Sorry. Do you like parks?", [
    { label: 'Change the subject', action: () => say('maya', "Oh totally, yeah, sorry — so anyway, like I said, the park, sorry, I'm doing it again…", [{ label: 'Try something else', action: mayaRamble }]) },
    { label: 'Wait quietly', action: () => say('maya', "…Sorry. I'm being weird, aren't I?", [{ label: 'Ask for a hint', action: mayaHint }, { label: 'Keep listening', action: mayaRamble }]) },
    { label: '💡 Ask for a hint', action: mayaHint, color: '#2f856a' }
  ]);
}
function mayaHint() {
  say('guide', "She's apologized three times in one minute and hasn't paused for breath. What might she be feeling?", [
    { label: "She's bored of me", action: () => say('guide', 'That is one possible read. But bored people rarely apologize. Look again.', [{ label: 'Try again', action: mayaHint }]) },
    { label: "She's nervous about how she's coming across", action: () => { save.trust.maya += 1; unlockInsight('maya-anxious', 'Maya is anxious. She rambles when she is nervous. A gentle redirect might help her feel more comfortable.', mayaRespond); }, color: '#2f856a' },
    { label: "She's annoyed with me", action: () => say('guide', 'Annoyance tends to sound short and sharp. Maya sounds rushed and apologetic. Try again.', [{ label: 'Try again', action: mayaHint }]) }
  ]);
}
function mayaRespond() {
  say('therapist', 'Now, how would you like to respond to Maya?', [
    { label: '"You seem a bit nervous. Want to slow down?"', action: () => { maya.userData.mood = 1; save.trust.maya += 1; writeSave(); say('maya', 'Yeah. Yeah, actually. Sorry — I mean… thank you.', [{ label: 'Continue', action: mayaDebrief }]); } },
    { label: '"Can you stop apologizing?"', action: () => { maya.userData.mood = -1; say('maya', 'Oh. Sorry — I mean… okay.', [{ label: 'Hmm…', action: () => say('therapist', 'That was honest, but it may have landed hard. She already feels self-conscious. Want to try a softer way?', [{ label: 'Try again', action: () => { maya.userData.mood = 0; mayaRespond(); } }]) }]); } },
    { label: '"So… what do you do?"', action: () => say('maya', 'Oh! I — I study design. Sorry. Yeah.', [{ label: 'Hmm…', action: () => say('therapist', 'That kept things moving, but she is still on edge. Naming the feeling gently can help her relax.', [{ label: 'Try again', action: mayaRespond }]) }]) }
  ]);
}
function mayaDebrief() {
  drain(0.1);
  say('therapist', 'That was good. You redirected her gently. How did that feel?', [
    { label: 'Good', action: () => say('therapist', 'Hold onto that feeling. You helped someone feel safe.', [{ label: 'Continue', action: disguiseScene }]) },
    { label: 'Awkward', action: () => say('therapist', 'Awkward is normal. Awkward means you are trying something new.', [{ label: 'Continue', action: disguiseScene }]) },
    { label: 'Hard', action: () => say('therapist', 'It is hard. And you did it anyway. That counts.', [{ label: 'Continue', action: disguiseScene }]) }
  ]);
}

/* The Disguise — presentation is a variable */
function disguiseScene() {
  goTo('office'); trunk.visible = true; mirrorYou.visible = true; mirrorFrame.visible = true;
  say('therapist', 'Want to see how the world treats you differently? This trunk holds clothes — whole identities. Try one on. The mirror shows you.', [
    { label: '👔 Professional jacket', action: () => { wearOutfit('jacket'); afterOutfit(); } },
    { label: '🧡 Cozy hoodie', action: () => { wearOutfit('hoodie'); afterOutfit(); } },
    { label: 'Keep my own look', action: () => { wearOutfit('own'); afterOutfit(); } }
  ]);
}
function afterOutfit() {
  say('therapist', `${outfits[outfit].label}. Good choice. Now, let us meet Leo. He is blunt, and he usually interrupts. Let us see how he responds to you.`, [
    { label: 'Meet Leo', action: leoScene }
  ]);
}

/* Leo — the blunt pragmatist (conflict practice) */
function leoScene() {
  goTo('park'); maya.visible = false; leo.visible = true; trunk.visible = false;
  drain(0.2);
  const open = {
    jacket: "You look like you mean business. Fine. I'll hear you out.",
    hoodie: "Make it quick. I've got places to be.",
    own: "Yeah? What is it? I don't have all day."
  }[outfit];
  say('leo', open, [
    { label: '"Hi Leo — I wanted to ask you something."', action: leoPush }
  ]);
}
function leoPush() {
  say('leo', 'Look — get to the point. What do you want?', [
    { label: 'Calm & clear: "Two minutes, then I\'ll let you go."', action: () => { save.trust.leo += 1; leo.userData.mood = 1; say('leo', '…Fair. Two minutes. Go.', [{ label: 'Continue', action: () => unlockInsight('leo-direct', 'Leo respects directness. Calm and clear beats loud. Holding your ground does not require raising your voice.', leoDebrief) }]); } },
    { label: 'Apologize and leave', action: () => say('therapist', 'Walking away is always allowed. But you did nothing wrong. Want to try holding your ground — gently?', [{ label: 'Try again', action: leoPush }]) },
    { label: 'Snap back: "Don\'t talk to me like that!"', action: () => { leo.userData.mood = -1; say('leo', "Whoa. Okay. Forget it then.", [{ label: 'Hmm…', action: () => say('therapist', 'Matching his energy escalated things. When someone pushes, slowing down gives you control.', [{ label: 'Try again', action: () => { leo.userData.mood = 0; leoPush(); } }]) }]); } }
  ]);
}
function leoDebrief() {
  say('therapist', 'You learned something: presentation is a variable, and calm is a strength. You can experiment. The world responds.', [
    { label: 'Back to the office', action: journal }
  ]);
}

/* The Return — journal, garden, mission */
function journal() {
  goTo('office'); mirrorYou.visible = false; mirrorFrame.visible = false; trunk.visible = false;
  setWeather('calm');
  const mission = MISSIONS[(save.sessions - 1) % MISSIONS.length];
  save.mission = mission; writeSave();
  say('therapist', `Session journal — you practiced reading anxiety and holding your ground. Insights: ${save.insights.length}. Garden: ${save.flowers} flowers (look by the window). Maya trusts you more. Leo respects you. Your real-world mission: "${mission}"`, [
    { label: 'Accept mission', action: finale, color: '#2f856a' },
    { label: 'Calm Corner first', action: enterCalmCorner }
  ]);
}
function finale() {
  say('therapist', 'I will ask about it next time. You did real work today. Would you like to come back tomorrow?', [
    { label: 'Yes — see you tomorrow', action: () => say('system', 'Session saved on this device only. Take off the headset whenever you are ready — or start again.', [{ label: 'Start a new session', action: begin }]) },
    { label: 'Practice again now', action: () => { battery = 1; mayaScene(); } }
  ]);
}

/* Calm Corner — pause anything, anytime */
let resumeFrom = null;
function enterCalmCorner() {
  if (sceneName === 'calm') return;
  resumeFrom = { scene: sceneName, weather, panel: panelCanvas.toDataURL() };
  goTo('calm'); setWeather('calmcorner');
  breathOrb.visible = true; breath = { start: performance.now(), cycles: Infinity, done: null };
  say('system', 'Calm Corner. No characters. No pressure. Just you and the sky. Breathe with the light. Return whenever you are ready.', [
    { label: 'Return', action: leaveCalmCorner, color: '#2f856a' }
  ]);
}
function leaveCalmCorner() {
  breath = null; breathOrb.visible = false;
  battery = 1;
  goTo(resumeFrom?.scene || 'office'); setWeather(resumeFrom?.weather === 'calmcorner' ? 'calm' : (resumeFrom?.weather || 'calm'));
  if (resumeFrom?.scene === 'park' && leo.visible) leoPush();
  else if (resumeFrom?.scene === 'park') mayaRamble();
  else journalOrStart();
}
function journalOrStart() {
  say('therapist', 'Welcome back. Your social battery is full again. Where would you like to go?', [
    { label: 'Practice with Maya', action: mayaScene },
    { label: 'Practice with Leo', action: disguiseScene },
    { label: 'Session journal', action: journal }
  ]);
}

/* ---------- input: hands (pinch ray + poke), controllers, mouse ---------- */
const raycaster = new THREE.Raycaster();
const controllerModels = new XRControllerModelFactory();
const handModels = new XRHandModelFactory();
const pointers = [];
const hands = [];
const tmp = new THREE.Vector3();

for (let i = 0; i < 2; i++) {
  const controller = renderer.xr.getController(i);
  scene.add(controller);
  const grip = renderer.xr.getControllerGrip(i);
  grip.add(controllerModels.createControllerModel(grip));
  scene.add(grip);
  const hand = renderer.xr.getHand(i);
  hand.add(handModels.createHandModel(hand, 'mesh'));
  scene.add(hand);
  hands.push(hand);

  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
  );
  line.scale.z = 1.5; line.visible = false;
  controller.add(line);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  dot.visible = false; scene.add(dot);

  controller.addEventListener('connected', e => { line.visible = !!e.data && e.data.targetRayMode === 'tracked-pointer'; });
  controller.addEventListener('disconnected', () => { line.visible = false; dot.visible = false; });
  controller.addEventListener('select', () => {
    raycaster.setFromXRController(controller);
    const hit = raycaster.intersectObjects(buttons, false)[0];
    if (hit) press(hit.object);
  });
  pointers.push({ controller, line, dot });
}

// Desktop / emulator: mouse
const mouse = new THREE.Vector2(9, 9);
canvas.addEventListener('pointermove', e => {
  const r = canvas.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
});
canvas.addEventListener('pointerdown', () => {
  raycaster.setFromCamera(mouse, camera);
  const hit = raycaster.intersectObjects(buttons, false)[0];
  if (hit) press(hit.object);
});
// Desktop look-around (drag) for previews
let yaw = 0, pitch = -0.28, dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', e => {
  if (!dragging || renderer.xr.isPresenting) return;
  yaw -= (e.clientX - lastX) * 0.003; pitch -= (e.clientY - lastY) * 0.003;
  pitch = Math.max(-0.8, Math.min(0.8, pitch)); lastX = e.clientX; lastY = e.clientY;
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
});
// Keyboard accessibility on desktop: number keys pick choices
window.addEventListener('keydown', e => {
  const n = parseInt(e.key, 10);
  const choices = buttons.filter(b => !b.userData.util);
  if (n >= 1 && n <= choices.length) press(choices[n - 1]);
  if (e.key === 'c') enterCalmCorner();
});

function updateHover() {
  const hovered = new Set();
  if (renderer.xr.isPresenting) {
    for (const p of pointers) {
      if (!p.line.visible) { p.dot.visible = false; continue; }
      raycaster.setFromXRController(p.controller);
      const hit = raycaster.intersectObjects(buttons, false)[0];
      if (hit) { hovered.add(hit.object); p.dot.position.copy(hit.point); p.dot.visible = true; p.line.scale.z = hit.distance; }
      else { p.dot.visible = false; p.line.scale.z = 1.5; }
    }
    // Poke: touch a button with an index fingertip
    for (const hand of hands) {
      const tip = hand.joints && hand.joints['index-finger-tip'];
      if (!tip || !tip.visible) continue;
      tip.getWorldPosition(tmp);
      let touching = null;
      for (const b of buttons) {
        const local = b.worldToLocal(tmp.clone());
        const w = b.geometry.parameters.width / 2, h = b.geometry.parameters.height / 2;
        if (Math.abs(local.x) < w && Math.abs(local.y) < h && local.z < 0.03 && local.z > -0.05) touching = b;
        else if (Math.abs(local.x) < w && Math.abs(local.y) < h && local.z < 0.1 && local.z > 0) hovered.add(b);
      }
      // poke must leave all buttons before it can press again (no accidental double-press)
      if (touching) { hovered.add(touching); if (hand.userData.pokeArmed !== false) { hand.userData.pokeArmed = false; press(touching); } }
      else hand.userData.pokeArmed = true;
    }
  } else {
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(buttons, false)[0];
    if (hit) hovered.add(hit.object);
    canvas.style.cursor = hit ? 'pointer' : 'grab';
  }
  for (const b of buttons) {
    const want = hovered.has(b) ? b.userData.hoverTex : b.userData.baseTex;
    if (b.material.map !== want) { b.material.map = want; b.material.needsUpdate = true; }
  }
}

/* ---------- start / session ---------- */
let started = false;
function startExperience() {
  if (started) return;
  started = true;
  begin();
}

enterVR.addEventListener('click', async () => {
  if (!navigator.xr || !(await navigator.xr.isSessionSupported('immersive-vr').catch(() => false))) {
    showToast('WebXR VR not available here. Open this page in Meta Quest Browser — or use desktop preview.');
    return;
  }
  try {
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
    await renderer.xr.setSession(session);
    startScreen.classList.add('hidden');
    placeUiNextFrame = true;
    startExperience();
    session.addEventListener('end', () => { startScreen.classList.remove('hidden'); try { speechSynthesis.cancel(); } catch { /* */ } });
    // clean pause/resume: when the system menu opens, pause speech
    session.addEventListener('visibilitychange', () => {
      try { if (session.visibilityState !== 'visible') speechSynthesis.pause(); else speechSynthesis.resume(); } catch { /* */ }
    });
  } catch (err) {
    showToast(`Unable to start VR: ${err.message}`);
  }
});
enterDesktop.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  startExperience();
});

let placeUiNextFrame = false;
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ---------- loop ---------- */
const clock = new THREE.Clock();
const targetSky = new THREE.Color();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  if (placeUiNextFrame && renderer.xr.isPresenting) {
    const cam = renderer.xr.getCamera();
    cam.getWorldPosition(tmp);
    if (tmp.y > 0.3) {
      // Seated comfort: anchor UI to the user's actual head height
      ui.position.set(tmp.x, Math.min(1.8, Math.max(0.9, tmp.y - 0.05)), tmp.z);
      placeUiNextFrame = false;
    }
  }

  // weather blend
  const w = weatherTargets[weather];
  targetSky.setHex(w.sky);
  skyColor.lerp(targetSky, dt * 1.5);
  scene.fog.color.copy(skyColor);
  sun.intensity += (w.sun - sun.intensity) * dt * 1.5;
  if (rain.visible) {
    const p = rain.geometry.attributes.position;
    for (let i = 0; i < rainCount; i++) {
      let y = p.getY(i) - dt * 4; if (y < 0) y = 6; p.setY(i, y);
    }
    p.needsUpdate = true;
  }

  // breathing orb: 4s in, 4s out
  if (breath) {
    const e = (performance.now() - breath.start) / 1000;
    const phase = (Math.sin((e / 8) * Math.PI * 2 - Math.PI / 2) + 1) / 2;
    breathOrb.scale.setScalar(0.6 + phase * 1.2);
    breathOrb.position.set(ui.position.x, ui.position.y + 0.38, ui.position.z - 1.2);
    if (e > breath.cycles * 8) endBreathing();
  }

  // characters: idle breathing + talking nod + mood posture
  for (const [ch, id] of [[maya, 'maya'], [leo, 'leo']]) {
    if (!ch.visible) continue;
    const d = ch.userData;
    const talking = speakingChar === id || (!voiceOn && false);
    d.head.rotation.x = Math.sin(t * (talking ? 9 : 1.2)) * (talking ? 0.05 : 0.02) + (d.mood < 0 ? 0.25 : d.mood > 0 ? -0.05 : 0);
    d.mouth.scale.y = talking ? 1 + Math.abs(Math.sin(t * 14)) * 3 : 1;
    ch.position.y = Math.sin(t * 1.4) * 0.004;
  }
  if (therapist.userData.model) therapist.userData.model.position.x = Math.sin(t * 0.6) * 0.004;

  // grow new flowers
  garden.children.forEach(f => {
    if (f.userData.grow !== undefined && f.userData.grow < 1) {
      f.userData.grow = Math.min(1, f.userData.grow + dt * 0.7);
      f.scale.setScalar(Math.max(0.001, f.userData.grow));
    }
  });

  updateHover();
  renderer.render(scene, camera);
});

goTo('office');
camera.rotation.set(pitch, yaw, 0, 'YXZ');
drawPanel('system', 'Welcome to Safe Space.');
