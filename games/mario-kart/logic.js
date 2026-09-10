/** Mario Kart rules. No browser or renderer dependencies. Fixed-step, seeded. */
import {
  TRACK_LENGTH as L,
  ROAD_HALF,
  WALL_HALF,
  trackAt,
  surfaceAt,
  project,
  wrap,
  clamp,
  angle,
  BOOST_PADS,
  ITEM_ROWS,
  COIN_SPOTS,
  SECTIONS,
} from "./track.js";
export { TRACK_LENGTH } from "./track.js";
export const CHARACTERS = [
  { id: "mario", name: "Mario", color: "#ed303b", skill: 0.96 },
  { id: "luigi", name: "Luigi", color: "#31bf5a", skill: 0.94 },
  { id: "peach", name: "Peach", color: "#ff8abe", skill: 0.93 },
  { id: "yoshi", name: "Yoshi", color: "#83dc38", skill: 0.99 },
  { id: "toad", name: "Toad", color: "#428cfa", skill: 0.92 },
  { id: "bowser", name: "Bowser", color: "#ffae26", skill: 1.01 },
  { id: "donkey-kong", name: "Donkey Kong", color: "#a86335", skill: 0.97 },
  { id: "koopa", name: "Koopa", color: "#f0d449", skill: 0.91 },
];
export const ITEMS = ["banana", "green", "red", "mushroom", "star", "blue"];
export const FIXED_DT = 1 / 120;
export const EVENT_TYPES = [
  "countdown",
  "go",
  "rocket",
  "burnout",
  "hop",
  "drift",
  "turbo",
  "boost",
  "coin",
  "box",
  "itemReady",
  "useItem",
  "hit",
  "wall",
  "antigrav",
  "glider",
  "land",
  "lap",
  "finalLap",
  "finish",
  "results",
  "bump",
];
export function seeded(seed = 381) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function topSpeed(coins = 0) {
  return 36 + clamp(coins, 0, 10) * 0.55;
}
export function turboTier(charge) {
  return charge >= 3.4 ? 3 : charge >= 2 ? 2 : charge >= 0.8 ? 1 : 0;
}
export function rollItem(position, rng = Math.random) {
  const rear = clamp((position - 1) / 7, 0, 1);
  const weights = [
    0.42 * (1 - rear) + 0.04,
    0.36 * (1 - rear) + 0.07,
    0.16,
    0.04 + 0.29 * rear,
    0.01 + 0.26 * rear,
    0.01 + 0.16 * rear,
  ];
  let n = clamp(rng(), 0, 0.999999) * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    n -= weights[i];
    if (n < 0) return ITEMS[i];
  }
  return "mushroom";
}
function makeRacer(character, i) {
  const grid = i === 0 ? 7 : i - 1,
    progress = -8 - Math.floor(grid / 2) * 6 - (grid % 2) * 0.5,
    p = surfaceAt(progress, grid % 2 ? 3 : -3);
  return {
    id: i,
    character,
    skill: character.skill,
    progress,
    s: wrap(progress, L),
    x: p.x,
    z: p.z,
    y: p.y,
    heading: p.heading,
    lateral: grid % 2 ? 3 : -3,
    speed: 0,
    steer: 0,
    coins: 0,
    lap: 1,
    nextCheckpoint: L / 8,
    checkpoints: 0,
    finishTime: null,
    drift: 0,
    charge: 0,
    tier: 0,
    hop: 0,
    boost: 0,
    star: 0,
    spin: 0,
    invulnerable: 0,
    gliding: false,
    flight: 0,
    flightY: 0,
    flightV: 0,
    anti: false,
    item: null,
    roulette: 0,
    gasDownAt: null,
    lastInput: {},
    itemDelay: 3 + i * 0.37,
    wallCooldown: 0,
    bumpCooldown: 0,
  };
}
export class Race {
  constructor({ seed = 381, character = "mario", onEvent = () => {} } = {}) {
    this.seed = seed;
    this.rng = seeded(seed);
    this.onEvent = onEvent;
    this.state = "ready";
    this.time = 0;
    this.raceTime = 0;
    this.accumulator = 0;
    const chosen = CHARACTERS.find((c) => c.id === character) || CHARACTERS[0];
    const order = [chosen, ...CHARACTERS.filter((c) => c.id !== chosen.id)];
    this.racers = order.slice(0, 8).map(makeRacer);
    this.player = this.racers[0];
    this.objects = [];
    this.nextId = 1;
    this.finishOrder = [];
    this.boxes = ITEM_ROWS.map((p, id) => ({ ...p, id, respawn: 0 }));
    this.coins = COIN_SPOTS.map((p, id) => ({ ...p, id, respawn: 0 }));
    this.count = 3;
    this.resultsAt = Infinity;
    this.pendingItem = false;
  }
  emit(type, racer = this.player, extra = {}) {
    this.onEvent({ type, racer: racer.id, time: this.time, ...extra });
  }
  start() {
    if (this.state !== "ready") return;
    this.state = "countdown";
    this.time = 0;
    this.emit("countdown", this.player, { count: 3 });
  }
  get standings() {
    return [...this.racers].sort((a, b) =>
      a.finishTime !== null
        ? b.finishTime !== null
          ? a.finishTime - b.finishTime
          : -1
        : b.finishTime !== null
          ? 1
          : b.progress - a.progress,
    );
  }
  position(r) {
    return this.standings.indexOf(r) + 1;
  }
  update(dt, input = {}) {
    if (
      !Number.isFinite(dt) ||
      dt <= 0 ||
      this.state === "ready" ||
      this.state === "results"
    )
      return;
    // A long background stall pauses instead of running a race without the driver.
    this.accumulator += Math.min(dt, 0.25);
    if (input.item) this.pendingItem = true;
    while (this.accumulator + 1e-10 >= FIXED_DT) {
      this.step(FIXED_DT, { ...input, item: this.pendingItem });
      this.pendingItem = false;
      this.accumulator -= FIXED_DT;
    }
  }
  step(dt, input) {
    this.time += dt;
    if (this.state === "countdown") {
      if (input.gas && !this.player.lastInput.gas)
        this.player.gasDownAt = this.time;
      if (!input.gas) this.player.gasDownAt = null;
      this.player.lastInput = { ...input };
      const n = Math.max(0, 3 - Math.floor(this.time));
      if (n !== this.count) {
        this.count = n;
        if (n) this.emit("countdown", this.player, { count: n });
      }
      if (this.time + 1e-9 < 3) return;
      this.state = "racing";
      this.emit("go");
      const held =
        this.player.gasDownAt === null ? 0 : 3 - this.player.gasDownAt;
      if (held >= 0.7 && held <= 1.5) {
        this.player.boost = 1.8;
        this.player.speed = 24;
        this.emit("rocket");
      } else if (held > 1.8) {
        this.player.spin = 1.05;
        this.emit("burnout");
      }
    }
    this.raceTime += dt;
    for (const p of [...this.boxes, ...this.coins])
      p.respawn = Math.max(0, p.respawn - dt);
    const oldProgress = new Map(this.racers.map((r) => [r.id, r.progress]));
    for (const r of this.racers) {
      const auto = r.id !== 0 || r.finishTime !== null;
      this.move(r, auto ? this.cpuInput(r) : input, dt, auto);
    }
    this.collisions(dt, oldProgress);
    this.updateObjects(dt, oldProgress);
    // Resolve same-step finishes by interpolated line crossing time, not array order.
    this.finishOrder = this.racers
      .filter((r) => r.finishTime !== null)
      .sort((a, b) => a.finishTime - b.finishTime)
      .map((r) => r.id);
    if (this.player.finishTime !== null && this.state === "racing") {
      this.state = "finishing";
      this.resultsAt = this.time + 3;
      this.emit("finish");
    }
    if (
      this.state === "finishing" &&
      this.time >= this.resultsAt &&
      this.finishOrder.length === 8
    ) {
      this.state = "results";
      this.emit("results");
    }
  }
  cpuInput(r) {
    // Pure pursuit: steering derived from a point ahead in world coordinates.
    const lead = clamp(9 + Math.abs(r.speed) * 0.32, 9, 23),
      lane = Math.sin(this.raceTime * 0.19 + r.id * 2.1) * 3.5;
    const p = surfaceAt(r.s + lead, lane),
      desired = Math.atan2(p.x - r.x, -(p.z - r.z));
    const error = angle(desired - r.heading),
      steer = clamp(error * 2.8, -1, 1);
    r.itemDelay -= FIXED_DT;
    return {
      gas: true,
      steer,
      drift: Math.abs(steer) > 0.22 && r.speed > 22 && !r.gliding,
      item: !!r.item && r.itemDelay < 0,
    };
  }
  move(r, raw, dt, auto = false) {
    const input = {
      gas: !!raw.gas,
      brake: !!raw.brake,
      drift: !!raw.drift,
      item: !!raw.item,
      steer: Number.isFinite(raw.steer) ? clamp(raw.steer, -1, 1) : 0,
    };
    for (const k of [
      "hop",
      "boost",
      "star",
      "spin",
      "invulnerable",
      "wallCooldown",
      "bumpCooldown",
    ])
      r[k] = Math.max(0, r[k] - dt);
    if (r.roulette > 0) {
      r.roulette -= dt;
      if (r.roulette <= 0) {
        r.item = rollItem(this.position(r), this.rng);
        this.emit("itemReady", r, { item: r.item });
      }
    }
    if (input.item && !r.lastInput.item) this.useItem(r);
    const spinning = r.spin > 0;
    const steer = spinning ? 0 : input.steer;
    r.steer += (steer - r.steer) * (1 - Math.exp(-dt * 20));
    if (
      input.drift &&
      !r.lastInput.drift &&
      r.speed > 8 &&
      !r.gliding &&
      !spinning
    ) {
      r.hop = 0.36;
      this.emit("hop", r);
    }
    if (
      input.drift &&
      !r.drift &&
      Math.abs(steer) > 0.14 &&
      r.speed > 12 &&
      !r.gliding &&
      !spinning
    ) {
      r.drift = Math.sign(steer);
      r.charge = 0;
    }
    if (r.drift && (!input.drift || r.speed < 8 || spinning || r.gliding)) {
      const tier = turboTier(r.charge);
      if (tier && !spinning) {
        r.boost = Math.max(r.boost, [0, 0.65, 1.35, 2.15][tier]);
        this.emit("turbo", r, { tier });
      }
      r.drift = 0;
      r.charge = 0;
      r.tier = 0;
    }
    if (r.drift) {
      r.charge += dt * (0.7 + 0.7 * Math.abs(steer));
      const tier = turboTier(r.charge);
      if (tier > r.tier) {
        r.tier = tier;
        this.emit("drift", r, { tier });
      }
    }
    const offroad = Math.abs(r.lateral) > ROAD_HALF + 0.2 && !r.gliding;
    let max = topSpeed(r.coins);
    if (auto) {
      const gap = this.player.progress - r.progress;
      max *= r.skill * clamp(1 + gap / 1400, 0.93, 1.09);
    }
    if (r.boost > 0) max = 55;
    if (r.star > 0) max = 53;
    if (offroad && r.boost <= 0 && r.star <= 0) max *= 0.43;
    if (spinning) r.speed *= Math.exp(-5 * dt);
    else if (input.brake) {
      r.speed = Math.max(-10, r.speed - 28 * dt);
    } else if (input.gas) {
      r.speed += (r.boost > 0 || r.star > 0 ? 35 : 15) * dt;
      r.speed = Math.min(r.speed, max);
    } else {
      r.speed = Math.sign(r.speed) * Math.max(0, Math.abs(r.speed) - 5.5 * dt);
    }
    if (r.speed > max) r.speed = Math.max(max, r.speed - 36 * dt);
    // No sensor angular integration, yaw momentum or centrifugal term: zero wheel
    // means exactly straight in world space. Turn rate is bounded at every speed.
    const turn = (r.drift ? r.drift * 0.12 + r.steer * 0.92 : r.steer) * 1.48;
    r.heading = angle(
      r.heading +
        turn * clamp(r.speed / 20, -0.5, 1) * dt * (r.gliding ? 0.52 : 1),
    );
    const previousS = r.s,
      previousProgress = r.progress;
    r.x += Math.sin(r.heading) * r.speed * dt;
    r.z -= Math.cos(r.heading) * r.speed * dt;
    const near = project(r.x, r.z, r.s);
    r.s = near.s;
    r.lateral = near.lateral;
    if (Math.abs(r.lateral) > WALL_HALF) {
      const p = surfaceAt(r.s, Math.sign(r.lateral) * WALL_HALF);
      r.x = p.x;
      r.z = p.z;
      r.lateral = Math.sign(r.lateral) * WALL_HALF;
      // Wall glancing is a slide, never a forced 180-degree bounce.
      const tangent = trackAt(r.s).heading,
        error = angle(r.heading - tangent);
      if (Math.sign(error) === Math.sign(r.lateral)) {
        r.heading = angle(tangent + error * 0.6);
        r.speed *= 0.86;
      }
      if (r.wallCooldown <= 0) {
        this.emit("wall", r);
        r.wallCooldown = 0.5;
      }
    }
    let advance = wrap(r.s - previousS + L / 2, L) - L / 2;
    advance = clamp(
      advance,
      -Math.abs(r.speed) * dt * 2 - 1,
      Math.abs(r.speed) * dt * 2 + 1,
    );
    r.progress += advance;
    // Sequential eighth-lap gates prevent line oscillation, reversal or a crossing
    // between overlaid roads from awarding a lap. No teleport API in normal play.
    while (
      r.finishTime === null &&
      r.progress >= r.nextCheckpoint &&
      previousProgress < r.nextCheckpoint
    ) {
      r.checkpoints++;
      r.nextCheckpoint += L / 8;
      if (r.checkpoints % 8 === 0) {
        if (r.checkpoints === 24 && r.finishTime === null) {
          const f = clamp(
            (3 * L - previousProgress) /
              Math.max(1e-9, r.progress - previousProgress),
            0,
            1,
          );
          r.finishTime = this.raceTime - dt + f * dt;
        } else if (r.checkpoints < 24) {
          r.lap = r.checkpoints / 8 + 1;
          this.emit(r.lap === 3 ? "finalLap" : "lap", r);
        }
      }
    }
    const p = trackAt(r.s),
      wasAnti = r.anti;
    r.anti = p.anti && !r.gliding;
    if (r.anti && !wasAnti) this.emit("antigrav", r);
    if (
      !r.gliding &&
      previousS < SECTIONS.glideStart &&
      r.s >= SECTIONS.glideStart &&
      advance > 0 &&
      r.speed > 0
    ) {
      r.speed = Math.max(r.speed, 26);
      r.boost = Math.max(r.boost, 0.5);
      r.gliding = true;
      r.flight = 0;
      r.flightY = surfaceAt(SECTIONS.glideStart, r.lateral).y + 1;
      r.flightV = 6;
      r.anti = false;
      this.emit("glider", r);
    }
    if (r.gliding) {
      r.flight += dt;
      r.flightV -= 9 * dt;
      r.flightY += r.flightV * dt;
      r.y = r.flightY;
      const beyond = r.s >= SECTIONS.glideEnd || r.s < SECTIONS.antiStart;
      if ((beyond && r.flightY <= p.y + 1) || r.flight > 6) {
        r.gliding = false;
        r.y = p.y;
        r.boost = Math.max(r.boost, 0.3);
        this.emit("land", r);
      }
    } else r.y = surfaceAt(r.s, r.lateral).y;
    for (const pad of BOOST_PADS)
      if (
        Math.abs(wrap(r.s - pad.s + L / 2, L) - L / 2) < pad.length / 2 &&
        Math.abs(r.lateral - pad.lateral) < pad.width / 2 &&
        !r.gliding
      ) {
        if (r.boost < 0.2) this.emit("boost", r);
        r.boost = Math.max(r.boost, 0.65);
      }
    if (r.finishTime === null && !spinning) {
      for (const c of this.coins)
        if (!c.respawn && this.touches(r, c, 2.1)) {
          r.coins = Math.min(10, r.coins + 1);
          c.respawn = 5;
          this.emit("coin", r);
        }
      for (const b of this.boxes)
        if (
          !b.respawn &&
          !r.item &&
          r.roulette <= 0 &&
          this.touches(r, b, 2.5)
        ) {
          b.respawn = 3;
          r.roulette = 1.65;
          this.emit("box", r);
        }
    }
    r.lastInput = input;
  }
  touches(r, p, radius) {
    return (
      Math.abs(wrap(r.s - p.s + L / 2, L) - L / 2) < radius &&
      Math.abs(r.lateral - p.lateral) < radius
    );
  }
  useItem(r = this.player) {
    if (!r.item || r.roulette > 0 || r.finishTime !== null || r.spin > 0)
      return false;
    const type = r.item;
    r.item = null;
    r.itemDelay = 2 + this.rng() * 3;
    this.emit("useItem", r, { item: type });
    if (type === "mushroom") r.boost = Math.max(r.boost, 2.3);
    else if (type === "star") {
      r.star = 7;
      r.spin = 0;
    } else {
      const ordered = this.standings.filter(
        (k) => k.id !== r.id && k.finishTime === null,
      );
      const target =
        type === "blue"
          ? ordered[0]
          : ordered.filter((k) => k.progress > r.progress).at(-1);
      const direction = type === "banana" ? -1 : 1;
      this.objects.push({
        id: this.nextId++,
        type,
        owner: r.id,
        s: wrap(r.s + direction * 3.5, L),
        lateral: r.lateral,
        speed:
          type === "banana"
            ? 0
            : type === "blue"
              ? 77
              : type === "red"
                ? 62
                : 58,
        age: 0,
        life: type === "banana" ? 40 : 12,
        target: target?.id,
        lateralVelocity:
          type === "green"
            ? Math.sin(angle(r.heading - trackAt(r.s).heading)) * 30
            : 0,
      });
    }
    return true;
  }
  hit(r, cause = "shell") {
    if (r.star > 0 || r.invulnerable > 0 || r.finishTime !== null) return false;
    r.spin = cause === "blue" ? 1.65 : 1.1;
    r.invulnerable = 2.3;
    r.speed *= 0.35;
    r.coins = Math.max(0, r.coins - 3);
    r.drift = 0;
    r.charge = 0;
    r.tier = 0;
    r.boost = 0;
    this.emit("hit", r, { cause });
    return true;
  }
  collisions(dt) {
    for (let i = 0; i < 8; i++)
      for (let j = i + 1; j < 8; j++) {
        const a = this.racers[i],
          b = this.racers[j],
          dx = b.x - a.x,
          dz = b.z - a.z,
          d = Math.hypot(dx, dz);
        if (
          d >= 2.2 ||
          Math.abs(a.y - b.y) > 2 ||
          a.finishTime !== null ||
          b.finishTime !== null
        )
          continue;
        const nx = d > 0.01 ? dx / d : 1,
          nz = d > 0.01 ? dz / d : 0,
          push = (2.2 - d) * 0.5;
        a.x -= nx * push;
        a.z -= nz * push;
        b.x += nx * push;
        b.z += nz * push;
        if (a.star > 0) this.hit(b, "star");
        if (b.star > 0) this.hit(a, "star");
        if (a.anti && b.anti && a.bumpCooldown <= 0 && b.bumpCooldown <= 0) {
          a.boost = Math.max(a.boost, 0.65);
          b.boost = Math.max(b.boost, 0.65);
          a.bumpCooldown = b.bumpCooldown = 1;
          this.emit("bump", a);
          this.emit("bump", b);
        }
      }
  }
  updateObjects(dt, oldProgress) {
    for (const o of this.objects) {
      o.age += dt;
      o.life -= dt;
      const oldS = o.s;
      const target = this.racers.find(
        (r) => r.id === o.target && r.finishTime === null,
      );
      if (target && ["red", "blue"].includes(o.type)) {
        o.lateral += (target.lateral - o.lateral) * (1 - Math.exp(-dt * 7));
      }
      o.s = wrap(o.s + o.speed * dt, L);
      o.lateral += o.lateralVelocity * dt;
      if (Math.abs(o.lateral) > WALL_HALF - 1) {
        o.lateral = clamp(o.lateral, -WALL_HALF + 1, WALL_HALF - 1);
        o.lateralVelocity *= -1;
      }
      for (const r of this.racers) {
        if ((r.id === o.owner && o.age < 0.75) || r.finishTime !== null)
          continue;
        if (o.type === "blue" && r.id !== o.target) continue;
        // Swept relative segment, independently tested with coarse/high-speed hits.
        const a =
          wrap(oldS - wrap(oldProgress.get(r.id), L) + L / 2, L) - L / 2;
        const b = a + o.speed * dt - (r.progress - oldProgress.get(r.id));
        const along = Math.min(Math.abs(a), Math.abs(b)) < 2 || a * b <= 0;
        if (
          along &&
          Math.abs(o.lateral - r.lateral) < 2.3 &&
          (!r.gliding || o.type === "blue")
        ) {
          if (o.type === "blue") {
            for (const k of this.racers)
              if (Math.abs(k.progress - r.progress) < 7) this.hit(k, "blue");
          } else this.hit(r, o.type);
          o.life = 0;
          break;
        }
      }
    }
    this.objects = this.objects.filter((o) => o.life > 0);
  }
}
export function ordinal(n) {
  return `${n}${n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th"}`;
}
export function formatTime(s) {
  return Number.isFinite(s)
    ? `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, "0")}`
    : "—";
}
