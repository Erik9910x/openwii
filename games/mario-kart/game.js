import * as THREE from "three";
import { EffectComposer } from "/vendor/three-examples/postprocessing/EffectComposer.js";
import { RenderPass } from "/vendor/three-examples/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "/vendor/three-examples/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "/vendor/three-examples/postprocessing/OutputPass.js";
import { RoomEnvironment } from "/vendor/three-examples/environments/RoomEnvironment.js";
import { mergeGeometries } from "/vendor/three-examples/utils/BufferGeometryUtils.js";
import { GameLink } from "../../core/net.js";
import {
  Race,
  CHARACTERS,
  ITEMS,
  ordinal,
  formatTime,
  seeded,
} from "./logic.js";
import {
  trackAt,
  surfaceAt,
  TRACK_LENGTH as L,
  TRACK_SAMPLES,
  SECTIONS,
  clamp,
  angle,
  wrap,
} from "./track.js";
import { WheelInput } from "./input.js";
import { KartAudio } from "./audio.js";
import {
  proceduralKart,
  loadKartPack,
  makeGlider,
  rigWheels,
  disposeModel,
} from "./models.js";
import { buildWorld, canvasTexture } from "./world.js";
import { ITEM_ICONS, portrait } from "./icons.js";
const $ = (id) => document.getElementById(id),
  canvas = $("game"),
  V = THREE.Vector3;
window.addEventListener("error", (e) => {
  $("error").hidden = false;
  $("error").textContent = "The race could not load: " + e.message;
});
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color("#101e3d");
scene.fog = new THREE.FogExp2("#243453", 0.00175);
const camera = new THREE.PerspectiveCamera(
  59,
  innerWidth / innerHeight,
  0.2,
  1100,
);
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.04).texture;
scene.environmentIntensity = 0.5;
room.dispose();
pmrem.dispose();
scene.add(new THREE.HemisphereLight("#a8d8ff", "#788e66", 1.15));
const key = new THREE.DirectionalLight("#fff2d9", 2.1);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, {
  left: -32,
  right: 32,
  top: 32,
  bottom: -32,
  near: 1,
  far: 150,
});
key.shadow.bias = -0.00035;
key.shadow.normalBias = 0.025;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight("#77baff", 0.75);
fill.position.set(-80, 70, 20);
scene.add(fill);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(innerWidth, innerHeight),
  0.18,
  0.4,
  1.65,
);
composer.addPass(bloom);
composer.addPass(new OutputPass());
const world = buildWorld(scene);
// Consolidate static scenery by material. No dynamic light/firework meshes are
// included; source object transforms are baked, preserving exact geometry.
const twoSidedBoards = [];
world.world.traverse((o) => {
  if (
    o.isMesh &&
    o.geometry.type === "PlaneGeometry" &&
    o.material.map &&
    o.material.side === THREE.DoubleSide
  )
    twoSidedBoards.push(o);
});
for (const front of twoSidedBoards) {
  front.material.side = THREE.FrontSide;
  const back = front.clone();
  back.rotateY(Math.PI);
  back.translateZ(0.025);
  front.parent.add(back);
}
world.world.updateMatrixWorld(true);
const staticGroups = new Map(),
  remove = [];
world.world.traverse((o) => {
  if (
    !o.isMesh ||
    o.isInstancedMesh ||
    world.lights.includes(o) ||
    Array.isArray(o.material)
  )
    return;
  const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
  g.applyMatrix4(o.matrixWorld);
  // Generated primitives differ in uv presence; normalize the merge contract.
  if (!g.getAttribute("uv"))
    g.setAttribute(
      "uv",
      new THREE.Float32BufferAttribute(
        new Float32Array(g.getAttribute("position").count * 2),
        2,
      ),
    );
  const id = o.material.uuid;
  if (!staticGroups.has(id))
    staticGroups.set(id, { mat: o.material, geos: [] });
  staticGroups.get(id).geos.push(g);
  remove.push(o);
});
for (const o of remove) o.removeFromParent();
for (const { mat, geos } of staticGroups.values()) {
  const g = mergeGeometries(geos);
  if (!g) continue;
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  scene.add(m);
  geos.forEach((x) => x.dispose());
}
let selected = "mario",
  paused = false,
  race,
  noticeUntil = 0,
  hitUntil = 0,
  renderCount = 0,
  lastFrame = performance.now(),
  itemIconKey = "",
  resultsShown = false;
const audio = new KartAudio(),
  wheel = new WheelInput({
    invert: localStorage.getItem("openwii.chargeInvert2") === "1",
  }),
  keys = new Set();
let captureUntil = performance.now() + 3000,
  usingPhone = false,
  phoneHadGas = false,
  lastRemoteItem = false,
  itemPulse = false;
const karts = [];
const shadowTexture = canvasTexture(64, 64, (ctx, w, h) => {
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, "#0009");
  g.addColorStop(1, "#0000");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});
function constructRace() {
  race = new Race({
    character: selected,
    seed: Math.floor(performance.now()) % 100000,
    onEvent: onEvent,
  });
  resultsShown = false;
  for (const k of karts) {
    k.disposed = true;
    scene.remove(k.root, k.shadow);
    disposeModel(k.root);
    k.shadow.geometry.dispose();
    k.shadow.material.dispose();
  }
  karts.length = 0;
  for (const r of race.racers) {
    const root = new THREE.Group(),
      model = proceduralKart(r.character.id),
      glider = makeGlider(r.character.color);
    root.add(model, glider);
    scene.add(root);
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 4.4),
      new THREE.MeshBasicMaterial({
        map: shadowTexture,
        transparent: true,
        depthWrite: false,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(shadow);
    karts.push({
      id: r.character.id,
      root,
      model,
      glider,
      shadow,
      wheels: rigWheels(model),
      source: "procedural",
    });
  }
  const set = karts.slice();
  loadKartPack(set).then((status) => {
    if (set[0] === karts[0]) debug.assets = status;
  });
  $("results").hidden = true;
  $("pause").hidden = true;
  paused = false;
}
const link = new GameLink({
  onOrientation: (sample, slot) => {
    if (slot !== 0) return;
    usingPhone = true;
    wheel.sample(sample, performance.now(), {
      canCapture:
        race?.state === "ready" ||
        race?.state === "countdown" ||
        performance.now() < captureUntil,
    });
  },
  onCommand: (cmd, slot) => {
    if (slot !== 0) return;
    const now = performance.now();
    wheel.command(cmd, now);
    if (cmd.type === "home") {
      location.href = "/";
      return;
    }
    if (cmd.type === "recentre" || cmd.type === "calibrate") {
      wheel.reset();
      captureUntil = now + 10000;
      if (race?.state === "racing")
        pause("Level the wheel for a moment, then press A or Enter.");
    }
    if (cmd.type === "button" && cmd.button === "A" && cmd.pressed !== false) {
      audio.unlock();
      confirm();
    }
    if (cmd.type === "button" && cmd.button === "up" && cmd.pressed !== false)
      itemPulse = true;
  },
  onPresence: (p) => {
    $("connection").textContent = p.controller
      ? "PHONE CONNECTED · P1"
      : "KEYBOARD READY";
    if (!p.controller) {
      wheel.release();
      if (usingPhone && race?.state === "racing")
        pause("Phone disconnected. Reconnect or continue with the keyboard.");
      usingPhone = false;
    }
    sendProfile();
  },
});
function sendProfile() {
  link.feedback({ type: "controller-profile", profile: "wheel", slot: 0 });
}
const profileTimer = setInterval(sendProfile, 850);
function onEvent(e) {
  if (e.racer !== 0) return;
  audio.event(e);
  const labels = {
    rocket: "ROCKET START!",
    burnout: "TOO EARLY!",
    turbo: ["", "MINI-TURBO!", "SUPER MINI-TURBO!", "ULTRA MINI-TURBO!"][
      e.tier
    ],
    finalLap: "FINAL LAP",
    lap: "LAP 2",
    finish: "FINISH!",
    glider: "TAKE FLIGHT!",
    antigrav: "ANTI-GRAVITY",
    hit: "SPIN OUT!",
    bump: "SPIN BOOST!",
  };
  if (labels[e.type]) {
    $("notice").textContent = labels[e.type];
    noticeUntil = race?.time + 1.5;
  }
  if (e.type === "hit") {
    hitUntil = (race?.time || 0) + 1;
    burst(race.player, 36, "#ffd755");
    link.feedback({ type: "rumble", pattern: [80, 40, 80], slot: 0 });
  }
  if (["coin", "box"].includes(e.type))
    burst(race.player, 10, e.type === "coin" ? "#ffdf46" : "#6bdbff");
}
function begin() {
  audio.unlock();
  wheel.reset();
  captureUntil = performance.now() + 3000;
  race.start();
  $("intro").hidden = true;
  $("track-label").hidden = true;
  $("hud").hidden = false;
  $("results").hidden = true;
  noticeUntil = 0;
}
function confirm() {
  if (paused) {
    resume();
    return;
  }
  if (race.state === "ready") begin();
  else if (race.state === "results") {
    constructRace();
    begin();
  }
}
$("start").onclick = confirm;
$("again").onclick = confirm;
$("resume").onclick = resume;
$("mute").onclick = () => {
  audio.engine.enabled = !audio.engine.enabled;
  audio.engine.master?.gain.setValueAtTime(
    audio.engine.enabled ? 0.55 : 0,
    audio.engine.ctx.currentTime,
  );
  $("mute").textContent = audio.engine.enabled ? "♪ SOUND ON" : "♪ SOUND OFF";
};
for (const c of CHARACTERS) {
  const b = document.createElement("button");
  b.className = "character" + (c.id === selected ? " selected" : "");
  b.setAttribute("aria-label", c.name);
  b.innerHTML = `<img src="${portrait(c)}" alt="${c.name}">`;
  b.onclick = () => {
    if (race.state !== "ready") return;
    selected = c.id;
    document
      .querySelectorAll(".character")
      .forEach((x) => x.classList.remove("selected"));
    b.classList.add("selected");
    $("chosen").textContent = c.name.toUpperCase();
    constructRace();
  };
  $("characters").append(b);
}
function pause(reason = "Take a breath. The race will wait.") {
  if (["ready", "results"].includes(race.state)) return;
  paused = true;
  keys.clear();
  wheel.release();
  $("pause-reason").textContent = reason;
  $("pause").hidden = false;
  audio.engine.ctx?.suspend();
}
function resume() {
  paused = false;
  $("pause").hidden = true;
  lastFrame = performance.now();
  audio.unlock();
}
window.addEventListener("keydown", (e) => {
  const handled = [
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "KeyZ",
    "KeyX",
    "ShiftLeft",
    "ShiftRight",
    "Space",
    "Enter",
    "Escape",
    "KeyR",
    "KeyI",
  ];
  if (handled.includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  keys.add(e.code);
  if (e.code === "Enter") confirm();
  if (e.code === "Space") itemPulse = true;
  if (e.code === "Escape") paused ? resume() : pause();
  if (e.code === "KeyR") {
    wheel.reset();
    captureUntil = performance.now() + 10000;
    if (usingPhone && race.state === "racing")
      pause("Level the wheel for a moment, then press A or Enter.");
  }
  if (e.code === "KeyI") {
    wheel.invert = !wheel.invert;
    localStorage.setItem("openwii.chargeInvert2", wheel.invert ? "1" : "0");
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  if (race?.state === "racing")
    pause("Window lost focus. Press Enter to resume.");
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) pause("The race paused while this tab was hidden.");
  else if (paused) queueMicrotask(() => audio.engine.ctx?.suspend());
});
window.addEventListener("pagehide", () => {
  clearInterval(profileTimer);
  link.feedback({ type: "controller-profile", profile: "default", slot: 0 });
  audio.stop();
});
// Pickups: shared geometries, predictable pools, no allocation as racers lap.
const pickupRoot = new THREE.Group();
scene.add(pickupRoot);
const coinGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.14, 20),
  coinMat = new THREE.MeshStandardMaterial({
    color: "#ffd637",
    metalness: 0.68,
    roughness: 0.25,
    emissive: "#b98a12",
    emissiveIntensity: 0.22,
  });
const boxGeo = new THREE.BoxGeometry(1.7, 1.7, 1.7),
  boxMat = new THREE.MeshStandardMaterial({
    color: "#a4deff",
    roughness: 0.16,
    metalness: 0.25,
    transparent: true,
    opacity: 0.6,
    emissive: "#2a80c9",
    emissiveIntensity: 0.4,
  });
const qTex = canvasTexture(128, 128, (c) => {
  c.fillStyle = "#265aa8";
  c.fillRect(0, 0, 128, 128);
  c.strokeStyle = "#c3fdff";
  c.lineWidth = 7;
  c.strokeRect(4, 4, 120, 120);
  c.font = "italic 900 95px Arial";
  c.textAlign = "center";
  c.fillStyle = "white";
  c.fillText("?", 64, 98);
});
const qMat = new THREE.MeshStandardMaterial({
  map: qTex,
  color: "#fff",
  emissive: "#8199d1",
  emissiveMap: qTex,
  emissiveIntensity: 0.5,
  roughness: 0.2,
});
let coinMeshes = [],
  boxMeshes = [];
function syncPickupPools() {
  pickupRoot.clear();
  coinMeshes = race.coins.map((c) => {
    const m = new THREE.Mesh(coinGeo, coinMat),
      p = surfaceAt(c.s, c.lateral);
    m.position.set(p.x, p.y + 1.35, p.z);
    m.rotation.x = Math.PI / 2;
    pickupRoot.add(m);
    return m;
  });
  boxMeshes = race.boxes.map((b) => {
    const g = new THREE.Group(),
      p = surfaceAt(b.s, b.lateral);
    g.position.set(p.x, p.y + 1.8, p.z);
    const m = new THREE.Mesh(boxGeo, [qMat, qMat, boxMat, boxMat, qMat, qMat]);
    g.add(m);
    pickupRoot.add(g);
    return g;
  });
}
// Sparks and impact stars are recycled. Particles are cosmetic; every hit and
// charge comes from logic.js, which never references these pools.
const maxParticles = 450,
  particleGeo = new THREE.BufferGeometry(),
  particlePos = new Float32Array(maxParticles * 3),
  particleColor = new Float32Array(maxParticles * 3);
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColor, 3));
const particleTex = canvasTexture(32, 32, (c) => {
  const g = c.createRadialGradient(16, 16, 1, 16, 16, 16);
  g.addColorStop(0, "white");
  g.addColorStop(0.3, "#fff9");
  g.addColorStop(1, "#fff0");
  c.fillStyle = g;
  c.fillRect(0, 0, 32, 32);
});
const points = new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({
    map: particleTex,
    size: 0.24,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
);
points.frustumCulled = false;
scene.add(points);
const particles = Array.from({ length: maxParticles }, () => ({
  life: 0,
  x: 0,
  y: -500,
  z: 0,
  vx: 0,
  vy: 0,
  vz: 0,
}));
let pi = 0;
const visualRng = seeded(76);
function particle(x, y, z, vx, vy, vz, color, life = 0.45) {
  const i = pi++ % maxParticles,
    p = particles[i];
  Object.assign(p, { x, y, z, vx, vy, vz, life });
  new THREE.Color(color).toArray(particleColor, i * 3);
}
function burst(r, n, color) {
  for (let i = 0; i < n; i++)
    particle(
      r.x,
      r.y + 1.4,
      r.z,
      (visualRng() - 0.5) * 12,
      visualRng() * 8,
      (visualRng() - 0.5) * 12,
      color,
      0.7,
    );
}
const objectMeshes = new Map();
function makeItemMesh(type) {
  const g = new THREE.Group();
  if (type === "banana") {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(0.38, 1.3, 6),
        new THREE.MeshStandardMaterial({ color: "#ffdf31" }),
      );
      m.rotation.z = 0.9;
      m.rotation.y = (i * Math.PI * 2) / 3;
      m.position.set(Math.sin(i * 2.1) * 0.32, 0.4, Math.cos(i * 2.1) * 0.32);
      g.add(m);
    }
  } else {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.7),
      new THREE.MeshStandardMaterial({
        color:
          type === "green" ? "#43cd67" : type === "red" ? "#f24851" : "#399cff",
        emissive: type === "blue" ? "#1e59df" : "#102819",
        emissiveIntensity: 0.45,
      }),
    );
    g.add(m);
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.7, 0.14, 8, 20),
      new THREE.MeshStandardMaterial({ color: "#fff4d1" }),
    );
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
  }
  return g;
}
const camTarget = new V(),
  cameraAim = new V();
let initializedCamera = false;
function draw(dt, now) {
  const p = race.player,
    time = race.time;
  world.update(
    now / 1000,
    race.state === "countdown" ? race.count : race.state === "ready" ? 3 : 0,
  );
  for (const [i, r] of race.racers.entries()) {
    const k = karts[i],
      path = trackAt(r.s),
      bank = r.gliding ? 0 : path.bank;
    const hop = r.hop > 0 ? Math.sin((r.hop / 0.36) * Math.PI) * 0.7 : 0;
    k.root.position.set(r.x, r.y + hop + 0.1, r.z);
    k.root.rotation.set(0, -r.heading, bank, "YXZ");
    k.model.rotation.y = r.spin > 0 ? time * 15 : r.drift ? -r.drift * 0.25 : 0;
    k.model.rotation.z = r.gliding ? -r.steer * 0.15 : -r.steer * 0.07;
    if (r.star > 0) {
      k.model.traverse((o) => {
        if (o.isMesh && !Array.isArray(o.material) && o.material.emissive) {
          if (!o.userData.starMat) {
            o.material = o.material.clone();
            o.userData.starMat = true;
          }
          o.material.emissive.setHSL((time * 0.65 + i * 0.1) % 1, 1, 0.3);
        }
      });
    } else
      k.model.traverse((o) => {
        if (o.userData.starMat) o.material.emissive.set(0);
      });
    for (const [wi, w] of k.wheels.entries()) {
      if (!w) continue;
      if (w.userData.glow) w.userData.glow.visible = r.anti;
      if (w.userData.rolling && !paused)
        w.userData.rolling.rotation.x -= (r.speed * dt) / 0.39;
      w.rotation.z = r.anti ? ((wi % 2 ? 1 : -1) * Math.PI) / 2 : 0;
      w.rotation.y = wi < 2 ? -r.steer * 0.32 : 0;
    }
    k.glider.visible = r.gliding;
    k.glider.rotation.z = -r.steer * 0.13;
    k.shadow.position.set(r.x, path.y + 0.09, r.z);
    k.shadow.material.opacity = r.gliding ? 0.2 : 0.7;
    k.shadow.rotation.z = r.heading;
    if (((r.drift && r.speed > 10) || r.boost > 0) && !paused) {
      const color =
        r.boost > 0
          ? "#ffac33"
          : ["#fff2bb", "#32cfff", "#ff9d2e", "#d785ff"][r.tier];
      for (const side of [-1, 1])
        for (let j = 0; j < Math.min(3, Math.ceil(dt * 120)); j++) {
          const x =
            r.x + Math.sin(r.heading) * -1.1 + Math.cos(r.heading) * side;
          const z =
            r.z - Math.cos(r.heading) * -1.1 + Math.sin(r.heading) * side;
          particle(
            x,
            r.y + 0.45,
            z,
            -Math.sin(r.heading) * 6 + (visualRng() - 0.5) * 3,
            visualRng() * 3,
            Math.cos(r.heading) * 6 + (visualRng() - 0.5) * 3,
            color,
          );
        }
    }
  }
  for (const [i, m] of coinMeshes.entries()) {
    m.visible = race.coins[i].respawn === 0;
    m.rotation.z = now * 0.003;
  }
  for (const [i, g] of boxMeshes.entries()) {
    g.visible = race.boxes[i].respawn === 0;
    g.rotation.y = now * 0.001;
    g.rotation.z = Math.sin(now * 0.001 + i) * 0.2;
  }
  const alive = new Set();
  for (const o of race.objects) {
    alive.add(o.id);
    if (!objectMeshes.has(o.id)) {
      const m = makeItemMesh(o.type);
      objectMeshes.set(o.id, m);
      scene.add(m);
    }
    const m = objectMeshes.get(o.id),
      p = surfaceAt(o.s, o.lateral);
    m.position.set(p.x, p.y + (o.type === "blue" ? 4 : 1), p.z);
    m.rotation.y = now * 0.006;
  }
  for (const [id, m] of objectMeshes)
    if (!alive.has(id)) {
      scene.remove(m);
      m.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) o.material.dispose();
      });
      objectMeshes.delete(id);
    }
  particles.forEach((p, i) => {
    p.life -= paused ? 0 : dt;
    if (p.life > 0) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= 8 * dt;
      particlePos.set([p.x, p.y, p.z], i * 3);
    } else particlePos[i * 3 + 1] = -500;
  });
  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;
  // Chase target follows physical heading with a short, dt-correct spring. Road
  // banking rolls the kart; the horizon rolls only slightly to retain landmarks.
  const look = trackAt(p.s + 10),
    heading = p.heading,
    back = race.state === "ready" ? 12 : 10.5;
  if (race.state === "ready") {
    const t = now * 0.00006;
    camTarget.set(p.x + Math.cos(t) * 10, p.y + 5.4, p.z + Math.sin(t) * 10);
    cameraAim.set(p.x, p.y + 1.25, p.z);
  } else {
    camTarget.set(
      p.x - Math.sin(heading) * back,
      p.y + (p.gliding ? 5.5 : 4.6),
      p.z + Math.cos(heading) * back,
    );
    cameraAim.set(
      p.x + Math.sin(heading) * 10,
      p.y + 1.4,
      p.z - Math.cos(heading) * 10,
    );
  }
  if (!initializedCamera || debug.snapCamera) {
    camera.position.copy(camTarget);
    initializedCamera = true;
    debug.snapCamera = false;
  } else camera.position.lerp(camTarget, 1 - Math.exp(-dt * 9));
  camera.up.set(0, 1, 0);
  camera.lookAt(cameraAim);
  camera.rotateZ(-trackAt(p.s).bank * 0.12);
  camera.fov +=
    (59 + (p.boost > 0 ? 8 : 0) + (p.gliding ? 3 : 0) - camera.fov) *
    (1 - Math.exp(-dt * 6));
  camera.updateProjectionMatrix();
  key.position.set(p.x - 30, p.y + 60, p.z + 25);
  key.target.position.set(p.x, p.y, p.z);
  key.target.updateMatrixWorld();
  renderer.info.reset();
  renderer.info.autoReset = false;
  composer.render();
  renderCount++;
  updateHUD();
}
function updateHUD() {
  const p = race.player,
    position = race.position(p);
  $("coins").textContent = String(p.coins).padStart(2, "0");
  $("lap").innerHTML = `${p.lap} <small>/ 3</small>`;
  $("position").innerHTML =
    `${position}<sup>${ordinal(position).replace(String(position), "")}</sup>`;
  $("speed-number").textContent = Math.round(Math.abs(p.speed) * 3.6);
  $("speed-bar").style.width =
    Math.min(100, (Math.abs(p.speed) / 55) * 100) + "%";
  const item =
    p.roulette > 0
      ? ITEMS[Math.floor(race.time * 13) % ITEMS.length]
      : p.item || "empty";
  if (item !== itemIconKey) {
    $("item-icon").innerHTML = ITEM_ICONS[item];
    itemIconKey = item;
  }
  $("item-caption").textContent =
    p.roulette > 0
      ? "ROULETTE"
      : p.item
        ? { green: "GREEN SHELL", red: "RED SHELL", blue: "BLUE SHELL" }[
            p.item
          ] || p.item.toUpperCase()
        : "ITEM";
  $("drift-meter").style.opacity = p.drift ? 1 : 0;
  $("drift-fill").style.width = Math.min(100, (p.charge / 3.4) * 100) + "%";
  $("drift-fill").style.background = [
    "#eef6ff",
    "#43d5ff",
    "#ffaa31",
    "#d986ff",
  ][p.tier];
  $("drift-label").textContent = [
    "HOLD THE DRIFT",
    "MINI-TURBO",
    "SUPER MINI-TURBO",
    "ULTRA MINI-TURBO",
  ][p.tier];
  $("speed-lines").style.opacity = p.boost > 0 ? 0.45 : p.gliding ? 0.13 : 0;
  $("hit-flash").style.opacity = race.time < hitUntil ? 0.6 : 0;
  $("notice").hidden = race.time > noticeUntil || race.state === "countdown";
  $("countdown").hidden = !(
    race.state === "countdown" ||
    (race.state === "racing" && race.time < 3.65)
  );
  $("count-number").textContent =
    usingPhone && race.state === "countdown" && !wheel.armed
      ? "LEVEL"
      : race.count || "GO!";
  $("lamps").classList.toggle("go", race.count === 0);
  $("lamps")
    .querySelectorAll("i")
    .forEach((el, i) => el.classList.toggle("on", i < 4 - race.count));
  drawMap();
  if (race.state === "results" && !resultsShown) {
    resultsShown = true;
    $("results").hidden = false;
    $("hud").hidden = true;
    $("result-summary").textContent =
      `${p.character.name} · ${ordinal(position)} place · ${formatTime(p.finishTime)}`;
    $("standings").innerHTML = race.standings
      .map(
        (r, i) =>
          `<div class="standing ${r.id === 0 ? "me" : ""}"><b>${i + 1}</b><img src="${portrait(r.character)}" alt=""><span>${r.character.name}${r.id === 0 ? " · YOU" : ""}</span><span class="time">${formatTime(r.finishTime)}</span></div>`,
      )
      .join("");
  }
}
const mapCtx = $("minimap").getContext("2d");
function drawMap() {
  const c = mapCtx,
    w = 250,
    h = 220,
    to = (x, z) => [
      22 + ((x + 220) / 450) * (w - 44),
      14 + ((z + 240) / 470) * (h - 28),
    ];
  c.clearRect(0, 0, w, h);
  c.lineJoin = "round";
  for (const [width, color] of [
    [9, "#193350b0"],
    [4, "#f1f7ffd0"],
  ]) {
    c.beginPath();
    TRACK_SAMPLES.forEach((p, i) => {
      const q = to(p.x, p.z);
      i ? c.lineTo(...q) : c.moveTo(...q);
    });
    c.closePath();
    c.strokeStyle = color;
    c.lineWidth = width;
    c.stroke();
  }
  const start = trackAt(0),
    q = to(start.x, start.z);
  c.fillStyle = "#ffe879";
  c.fillRect(q[0] - 3, q[1] - 4, 6, 8);
  for (const r of [...race.racers].reverse()) {
    const q = to(r.x, r.z);
    c.beginPath();
    c.arc(...q, r.id ? 4 : 6, 0, Math.PI * 2);
    c.fillStyle = r.character.color;
    c.fill();
    c.strokeStyle = r.id ? "#eef5ff" : "#fff8a1";
    c.lineWidth = r.id ? 1.3 : 3;
    c.stroke();
  }
}
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (!debug.freeze && !paused) {
    const remote = wheel.read(now),
      keyboard =
        keys.has("KeyZ") ||
        keys.has("KeyX") ||
        keys.has("ArrowLeft") ||
        keys.has("ArrowRight");
    if (
      usingPhone &&
      !remote.live &&
      phoneHadGas &&
      race.state === "racing" &&
      !keyboard
    ) {
      pause("Wheel signal lost. Hold the phone flat, then press A or Enter.");
      phoneHadGas = false;
    }
    phoneHadGas = remote.live && remote.gas;
    const input = {
      gas: keys.has("KeyZ") || remote.gas,
      brake: keys.has("KeyX") || remote.brake,
      drift: keys.has("ShiftLeft") || keys.has("ShiftRight") || remote.drift,
      steer: keyboard
        ? (keys.has("ArrowRight") ? 1 : 0) - (keys.has("ArrowLeft") ? 1 : 0)
        : remote.steer,
      item: itemPulse || (remote.item && !lastRemoteItem),
    };
    lastRemoteItem = remote.item;
    itemPulse = false;
    if (!(usingPhone && race.state === "countdown" && !wheel.armed))
      race.update(dt, input);
    audio.update(race);
    $("wheel-status").textContent = usingPhone
      ? remote.status + (wheel.invert ? " · inverted" : "")
      : "Z gas · X brake · Shift drift · Space item";
  }
  draw(dt || 1 / 60, now);
}
// Explicit developer harness, enabled only by ?evidence=1. Scenario captures
// stage states and are labeled as such in the evidence report; normal keyboard
// and full-race checks are separate. No hidden gameplay shortcuts are shipped.
const debug = {
  get race() {
    return race;
  },
  wheel,
  karts,
  assets: null,
  freeze: false,
  snapCamera: false,
  get audioState() {
    return {
      gain: audio.engine.master?.gain.value,
      frequency: audio.motor?.osc.frequency.value,
      state: audio.engine.ctx?.state,
      enabled: audio.engine.enabled,
      overrides: [...audio.engine.overrides]
        .filter(([, buffer]) => buffer)
        .map(([name]) => name),
    };
  },
  get paused() {
    return paused;
  },
  get renderCount() {
    return renderCount;
  },
  get stats() {
    return {
      calls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
    };
  },
};
if (new URLSearchParams(location.search).get("evidence") === "1") {
  window.__kart = debug;
  debug.place = (s, { lateral = 0, speed = 30, lap = 1 } = {}) => {
    const p = surfaceAt(s, lateral),
      r = race.player;
    Object.assign(r, {
      s: wrap(s, L),
      progress: s + (lap - 1) * L,
      x: p.x,
      y: p.y,
      z: p.z,
      lateral,
      heading: p.heading,
      speed,
      lap,
      nextCheckpoint: (Math.floor((s + (lap - 1) * L) / (L / 8)) + 1) * (L / 8),
      checkpoints: Math.floor((s + (lap - 1) * L) / (L / 8)),
      anti: p.anti,
    });
    debug.snapCamera = true;
  };
  debug.stage = (name) => {
    constructRace();
    syncPickupPools();
    race.start();
    race.state = "racing";
    race.time = 10;
    $("intro").hidden = true;
    $("track-label").hidden = true;
    $("hud").hidden = false;
    debug.freeze = true;
    const r = race.player;
    if (name === "start") {
      race.state = "countdown";
      race.count = 3;
      race.time = 0.5;
      r.speed = 0;
    }
    if (name === "drift") {
      debug.place(controlDistancesFor("drift"));
      r.drift = 1;
      r.charge = 3.5;
      r.tier = 3;
      r.steer = 0.6;
      noticeUntil = 0;
    }
    if (name === "antigrav") {
      debug.place(SECTIONS.antiStart + 330);
      r.anti = true;
    }
    if (name === "glider") {
      debug.place(SECTIONS.glideStart + 35);
      r.gliding = true;
      r.y = 30;
      r.flightY = 30;
      r.flight = 1;
      r.anti = false;
    }
    if (name === "hit") {
      debug.place(170);
      race.hit(r, "red");
    }
    if (name === "results") {
      // Run the real CPU planner and finish-line logic for all eight racers.
      race = new Race({ character: selected, seed: 42, onEvent: () => {} });
      race.start();
      for (let i = 0; i < 30000 && race.state !== "results"; i++)
        race.update(1 / 120, race.cpuInput(race.player));
      debug.snapCamera = true;
    }
    debug.snapCamera = true;
    draw(1 / 60, performance.now());
  };
  debug.step = (seconds, input) => {
    for (let i = 0; i < seconds * 120; i++)
      race.update(
        1 / 120,
        typeof input === "string" && input === "cpu"
          ? race.cpuInput(race.player)
          : input,
      );
    draw(1 / 60, performance.now());
  };
  debug.resume = resume;
}
function controlDistancesFor() {
  return 310;
}
constructRace();
syncPickupPools();
requestAnimationFrame(frame);
window.addEventListener("resize", () => {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
