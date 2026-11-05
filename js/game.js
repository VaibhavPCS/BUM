/* ============================================================
   game.js : the run — spawning, movement, collisions, scoring,
   power-ups, chains, camera, input, state machine
   States: menu | countdown | playing | paused | resuming | dying | over
   ============================================================ */
(function () {
  const { rand: R, pick: PK, clamp, lerp } = ND.util;
  const C = ND.CFG, TX = ND.TEXT;

  // F = full (change lane), L = low (jump), H = high (slide), . = free
  const PATTERNS = {
    easy: ['F..', '.F.', '..F', 'L..', '.L.', '..L', 'H..', '.H.', '..H'],
    mid: ['FF.', '.FF', 'F.F', 'LLL', 'HHH', 'FL.', '.LF', 'FH.', '.HF', 'LF.', 'HF.', 'L.F', 'H.F', 'F.L', 'F.H', 'LLF', 'FLL', 'HHF', 'FHH', 'LHL', 'HLH', 'L.H', 'H.L'],
    hard: ['F.F', 'FF.', '.FF', 'LLL', 'HHH', 'FLF', 'FHF', 'LFL', 'HFH', 'FLH', 'HLF', 'LHL', 'FFL', 'LFF', 'FFH', 'HFF', 'LLH', 'HHL', 'LHH', 'HLL']
  };

  ND.Game = class Game {
    constructor(ui) {
      this.ui = ui;
      ND.shadows = !ND.isMobile && !ND.store.get('nd_noshadow', false);
      this.canvas = document.getElementById('game-canvas');
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
      this.pixelRatio = Math.min(window.devicePixelRatio || 1, ND.isMobile ? 1.5 : C.MAX_PIXEL_RATIO);
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.08;
      if (ND.shadows) { this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(C.FOG.color, C.FOG.near, C.FOG.far);
      this.scene.background = new THREE.Color(C.FOG.color);
      this.camera = new THREE.PerspectiveCamera(C.FOV.base, 1, 0.1, 700);
      this.world = new ND.World(this.scene);
      this.particles = new ND.Particles(this.scene, 900);
      this.floatText = new ND.FloatText(this.scene);
      this.streaks = new ND.Streaks(this.scene, 16);
      this.player = new ND.Player(this.scene);
      this.player.camera = this.camera;
      this.player.onLand = () => this.onLand();
      this.world.fireworks.onBurst = (x, y, z) => { if (this.state !== 'paused') ND.audio.sfx.boom(z < -140); };
      this.obstacles = []; this.pickups = [];
      this.state = 'menu'; this.t = 0; this.timeScale = 1; this.camX = 0; this.shake = 0; this.camDip = 0; this.fovKick = 0; this.bank = 0;
      this.best = ND.store.get('nd_best', 0);
      this.runs = ND.store.get('nd_runs', 0);
      this.placement = 'runner'; this.photoCanvas = null; this.photoTex = null;
      this.world.fireworks.autoRate = [1.2, 3];
      this.frameAcc = 0; this.frameN = 0; this.qualityT = 0;
      this._v = new THREE.Vector3();
      this.resetRun();
      this.bindInput();
      window.addEventListener('resize', () => this.onResize());
      document.addEventListener('visibilitychange', () => { if (document.hidden && (this.state === 'playing' || this.state === 'countdown' || this.state === 'resuming')) this.pause(); });
      this.onResize();
      this.loadModel();
      this.last = performance.now();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    loadModel() {
      if (!ND.models) return;
      ND.models.loadRunner('models/runner.glb').then((gltf) => {
        if (gltf) { this.player.setModel(gltf); this.ui.toast('Custom runner load ho gaya!', 'dim'); }
      }).catch((e) => console.warn('runner model skipped:', e));
    }

    resetRun() {
      this.speed = C.SPEED_START; this.dist = 0; this.score = 0; this.samosas = 0; this.streak = 0;
      this.chain = 0; this.chainT = 0; this.chainTier = 0;
      this.powers = { chai: 0, jalebi: 0, mithai: 0 };
      this.nextRowAt = 40; this.prevRowAt = 0; this.nextMilestone = C.MILESTONE_EVERY;
      this.nearCool = 0; this.smashCool = 0; this.timeScale = 1; this.dyingT = 0; this.hitStop = 0; this.cause = null;
      this.buffered = null; this.hinted = {};
      for (const o of this.obstacles) ND.Obs.release(o); this.obstacles.length = 0;
      for (const p of this.pickups) ND.Pick.release(p); this.pickups.length = 0;
      this.player.reset();
      ND.audio.music.setTempo(1);
    }

    /* ---------- state changes ---------- */
    start() {
      this.resetRun();
      this.runs++; ND.store.set('nd_runs', this.runs);
      this.state = 'countdown'; this.countT = 0; this.countStep = -1; this.last = performance.now();
      this.world.fireworks.autoRate = [3, 7];
      ND.audio.unlock(); ND.audio.sfx.start();
      if (!this.welcomed) { this.welcomed = true; ND.voice.say(PK(TX.welcome), { force: true }); }
      this.ui.onStateChange('countdown');
    }
    beginRun() {
      this.state = 'playing';
      ND.audio.music.start();
      this.ui.onStateChange('playing');
      const go = PK(TX.go);
      this.ui.countdown(go, true);
      ND.voice.say(go, { force: true });
    }
    pause() {
      if (this.state !== 'playing' && this.state !== 'countdown' && this.state !== 'resuming') return;
      if (this.state === 'countdown') { this.toMenu(); return; }
      this.state = 'paused'; ND.audio.music.duck(true);
      const line = PK(TX.pause);
      this.ui.onStateChange('paused', line);
      ND.voice.say(line);
    }
    resume() {
      if (this.state !== 'paused') return;
      this.state = 'resuming'; this.resumeT = 0; this.resumeStep = -1; this.last = performance.now();
      this.ui.onStateChange('resuming');
    }
    toMenu() {
      this.resetRun(); this.state = 'menu'; ND.audio.music.stop(); ND.voice.cancel();
      this.world.fireworks.autoRate = [1.2, 3];
      this.ui.onStateChange('menu');
    }

    /* ---------- main loop ---------- */
    loop(now) {
      requestAnimationFrame(this.loop);
      const raw = clamp((now - this.last) / 1000, 0, 0.05); this.last = now;
      if (this.state === 'paused') return;
      this.adaptQuality(raw);
      const dt = raw * this.timeScale;
      this.t += dt;
      switch (this.state) {
        case 'menu': this.updateMenu(dt); break;
        case 'countdown': this.updateCountdown(dt); break;
        case 'resuming': this.updateResuming(raw); break;
        case 'playing': this.updatePlay(dt); break;
        case 'dying': this.updateDying(dt, raw); break;
        case 'over': this.updateOver(dt); break;
      }
      this.particles.update(dt, this.speed);
      this.floatText.update(dt, this.speed);
      this.streaks.update(dt, this.state === 'playing' ? this.speed : 0);
      this.world.keyLight.intensity = 1.2 + 0.1 * Math.sin(this.t * 17) + 0.07 * Math.sin(this.t * 31);
      this.renderer.render(this.scene, this.camera);
    }

    // drop resolution (then shadows) if the device can't keep up
    adaptQuality(raw) {
      if (this.state !== 'playing') return;
      this.frameAcc += raw; this.frameN++; this.qualityT += raw;
      if (this.qualityT < 3) return;
      const avg = this.frameAcc / Math.max(1, this.frameN);
      this.frameAcc = 0; this.frameN = 0; this.qualityT = 0;
      if (avg > 1 / 38) {
        if (this.pixelRatio > 1) { this.pixelRatio = Math.max(1, this.pixelRatio - 0.25); this.renderer.setPixelRatio(this.pixelRatio); }
        else if (ND.shadows) { ND.shadows = false; this.renderer.shadowMap.enabled = false; this.world.moon.castShadow = false; ND.store.set('nd_noshadow', true); }
      }
    }

    updateMenu(dt) {
      this.speed = C.MENU_SPEED;
      this.world.update(dt, this.speed);
      this.player.update(dt, this.t, this.speed, false);
      const t = this.t;
      this.camera.position.set(Math.sin(t * 0.25) * 1.6, 4.9 + Math.sin(t * 0.4) * 0.2, 9.6);
      this.camera.lookAt(Math.sin(t * 0.25) * 0.5, 1.9, -12);
      this.setFov(C.FOV.base);
    }

    // 3-2-1 with the camera swinging from the runner's face to behind the shoulder
    updateCountdown(dt) {
      this.countT += dt;
      const u = clamp(this.countT / C.COUNTDOWN, 0, 1), e = u * u * (3 - 2 * u);
      this.speed = lerp(C.MENU_SPEED, C.SPEED_START, e);
      this.world.update(dt, this.speed);
      this.player.update(dt, this.t, this.speed, true);
      const step = Math.min(2, Math.floor(this.countT / (C.COUNTDOWN / 3)));
      if (step !== this.countStep) { this.countStep = step; this.ui.countdown(String(3 - step), false); ND.audio.sfx.count(3 - step); }
      const a = Math.PI * (1 - e);                  // front (pi) -> behind (0)
      const rad = lerp(5.5, 8.2, e), h = lerp(2.0, 4.3, e);
      this.camera.position.set(Math.sin(a) * rad * 0.6 + Math.sin(a) * 1.5, h, Math.cos(a) * rad);
      this.camera.lookAt(0, lerp(1.9, 1.8, e), lerp(0, -12, e));
      this.setFov(C.FOV.base);
      if (this.countT >= C.COUNTDOWN) { ND.audio.sfx.count(0); this.beginRun(); }
    }

    updateResuming(raw) {
      this.resumeT += raw;
      const step = Math.min(2, Math.floor(this.resumeT / 0.5));
      if (step !== this.resumeStep) { this.resumeStep = step; this.ui.countdown(String(3 - step), false); ND.audio.sfx.count(3 - step); }
      if (this.resumeT >= 1.5) { this.state = 'playing'; ND.audio.music.duck(false); this.ui.onStateChange('playing'); this.ui.countdown('', false); }
    }

    updatePlay(dt) {
      this.speed = C.SPEED_START + C.SPEED_GAIN * (1 - Math.exp(-this.dist / C.SPEED_RAMP));
      this.dist += this.speed * dt;
      this.score += this.speed * dt * C.POINTS.perMetre * this.mult();
      this.world.update(dt, this.speed);
      this.spawn();
      this.moveEntities(dt);
      this.player.update(dt, this.t, this.speed, true);
      this.checkObstacles();
      if (this.state !== 'playing') return;
      this.checkPickups();
      this.updatePowers(dt);
      this.updateChain(dt);
      if (this.dist >= this.nextMilestone) this.milestone();
      this.nearCool = Math.max(0, this.nearCool - dt);
      this.smashCool = Math.max(0, this.smashCool - dt);
      if (this.buffered && (this.t - this.buffered.t) > 0.4) this.buffered = null;
      ND.audio.music.setTempo(1 + ((this.speed - C.SPEED_START) / C.SPEED_GAIN) * 0.22);
      ND.audio.music.setIntensity(this.dist > 1500 ? 3 : this.dist > 600 ? 2 : 1);
      this.updateDiyaLights();
      this.updateCamera(dt);
      this.ui.updateHud(this);
    }

    updateDying(dt, raw) {
      this.dyingT += raw;
      if (this.hitStop > 0) { this.hitStop -= raw; this.timeScale = 0; }
      else this.timeScale = this.dyingT < 0.85 ? 0.25 : lerp(this.timeScale, 1, raw * 4);
      this.speed = Math.max(0, this.speed - raw * 16);
      this.world.update(dt, this.speed);
      for (const o of this.obstacles) o.position.z += this.speed * dt;
      for (const p of this.pickups) p.position.z += this.speed * dt;
      this.player.update(dt, this.t, this.speed, false);
      this.updateCamera(dt);
      if (this.dyingT > 1.7) this.gameOver();
    }

    updateOver(dt) {
      this.speed = Math.max(0, this.speed - dt * 10);
      this.world.update(dt, 1.5);
      this.player.update(dt, this.t, 0, false);
      this.updateCamera(dt);
    }

    mult() { return (this.powers.mithai > 0 ? 2 : 1) * (1 + this.chainTier); }
    anyPowerActive() { return this.powers.chai > 0 || this.powers.jalebi > 0 || this.powers.mithai > 0; }

    /* ---------- spawning ---------- */
    spawn() {
      while (this.dist >= this.nextRowAt) {
        const diff = clamp(this.dist / C.DIFF_DIST, 0, 1);
        const gap = Math.max(C.ROW_GAP_MIN, this.speed * lerp(C.ROW_TIME, C.ROW_TIME_MIN, diff));
        this.spawnRow(diff, this.nextRowAt - this.prevRowAt);
        this.prevRowAt = this.nextRowAt;
        this.nextRowAt += gap;
      }
    }
    choosePattern(diff) {
      const d = this.dist;
      if (d < 130) return PK(['F..', '.F.', '..F', 'L..', '.L.', '..L']);
      if (d < 260) return PK(PATTERNS.easy);
      const r = Math.random();
      const pHard = d > 900 ? diff * 0.55 : 0;
      const pMid = 0.25 + diff * 0.45;
      if (r < pHard) return PK(PATTERNS.hard);
      if (r < pHard + pMid) return PK(PATTERNS.mid);
      return PK(PATTERNS.easy);
    }
    spawnRow(diff, gapBefore) {
      const pattern = this.choosePattern(diff);
      for (let lane = 0; lane < 3; lane++) {
        const ch = pattern[lane];
        if (ch === '.') continue;
        const kind = ch === 'F' ? 'full' : ch === 'L' ? 'low' : 'high';
        const o = ND.Obs.get(PK(ND.Obs.byKind[kind]));
        o.position.set(C.LANES[lane], 0, C.SPAWN_Z);
        this.scene.add(o); this.obstacles.push(o);
      }
      this.spawnTrail(pattern, gapBefore);
    }
    addPickup(type, x, z, y) {
      const p = ND.Pick.get(type);
      p.userData.baseY = y != null ? y : (type === 'samosa' || type === 'golden' ? 0.75 : 1.0);
      p.position.set(x, p.userData.baseY, z);
      this.scene.add(p); this.pickups.push(p);
    }
    spawnTrail(pattern, gapBefore) {
      if (Math.random() < 0.1) return;
      const lanes = [0, 1, 2].filter((l) => pattern[l] !== 'F');
      const empties = lanes.filter((l) => pattern[l] === '.');
      const lane = (empties.length && Math.random() < 0.7) ? PK(empties) : PK(lanes);
      const z0 = C.SPAWN_Z + gapBefore * 0.82, z1 = C.SPAWN_Z + gapBefore * 0.2;
      const n = clamp(Math.floor((z0 - z1) / 1.7), 3, 9);
      const powerSlot = (Math.random() < 0.11 && this.dist > 150 && !this.anyPowerActive() && n >= 4) ? Math.floor(n / 2) : -1;
      const goldenSlot = (powerSlot < 0 && Math.random() < 0.09) ? n - 1 : -1;
      for (let i = 0; i < n; i++) {
        let type = 'samosa';
        if (i === powerSlot) type = PK(['chai', 'jalebi', 'mithai']);
        else if (i === goldenSlot) type = 'golden';
        this.addPickup(type, C.LANES[lane], z0 - i * 1.7, null);
      }
      if (pattern[lane] === 'L') {
        [[1.7, 1.5], [0, 2.1], [-1.7, 1.5]].forEach(([dz, y]) => this.addPickup('samosa', C.LANES[lane], C.SPAWN_Z + dz, y));
      }
      if (lanes.length > 1 && Math.random() < 0.3) {
        const other = PK(lanes.filter((l) => l !== lane));
        for (let i = 0; i < Math.min(n, 5); i++) this.addPickup('samosa', C.LANES[other], z0 - i * 1.7, null);
      }
    }

    /* ---------- movement ---------- */
    moveEntities(dt) {
      const dz = this.speed * dt, P = this.player;
      const hintZ = -this.speed * 2.3, showHints = this.runs <= 2;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const o = this.obstacles[i], u = o.userData;
        u.prevZ = o.position.z; o.position.z += dz;
        ND.Obs.animate(o, dt, this.t, this.speed, this.particles);
        if (showHints && !u.hinted && o.position.z > hintZ) {
          u.hinted = true;
          if (!this.hinted[u.kind]) { this.hinted[u.kind] = true; this.ui.hint(u.kind); ND.voice.say(TX.hints[u.kind]); }
        }
        if (o.position.z > C.KILL_Z) { ND.Obs.release(o); this.obstacles.splice(i, 1); }
      }
      const magnet = this.powers.jalebi > 0, r2 = C.MAGNET_RADIUS * C.MAGNET_RADIUS;
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i], u = p.userData;
        p.position.z += dz;
        ND.Pick.animate(p, dt, this.t);
        if (magnet && (u.type === 'samosa' || u.type === 'golden')) {
          const ddx = P.x - p.position.x, ddz = -p.position.z;
          if (ddx * ddx + ddz * ddz < r2) {
            const k = Math.min(1, dt * 9);
            p.position.x += ddx * k; p.position.z += ddz * k; u.baseY = lerp(u.baseY, P.y + 1.0, k);
          }
        }
        if (p.position.z > C.KILL_Z) { ND.Pick.release(p); this.pickups.splice(i, 1); }
      }
    }

    // park the two pooled point lights on the nearest diya-type obstacles
    updateDiyaLights() {
      const lights = this.world.diyaLights; let k = 0;
      for (const o of this.obstacles) {
        if (k >= lights.length) break;
        if (!o.userData.parts.light || o.position.z < -40 || o.position.z > 8) continue;
        const l = lights[k++];
        l.position.set(o.position.x, 0.9, o.position.z);
        l.intensity = 0.9 + 0.25 * Math.sin(this.t * 19 + o.position.x * 3) + 0.15 * Math.sin(this.t * 37);
      }
      for (; k < lights.length; k++) { lights[k].intensity = 0; lights[k].position.y = -50; }
    }

    /* ---------- collisions ---------- */
    checkObstacles() {
      const B = this.player.bounds();
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const o = this.obstacles[i], u = o.userData;
        const zr = u.hd + B.hd, z = o.position.z;
        const crossed = u.prevZ !== null && u.prevZ < -zr && z > zr;
        const inZ = Math.abs(z) < zr || crossed;
        const dx = Math.abs(o.position.x - B.x);
        if (inZ && dx < u.hw + B.hw - 0.1) {
          if (B.bottom < u.yMax - 0.04 && B.top > u.yMin + 0.04) {
            if (this.powers.chai > 0) { this.smash(o, i); continue; }
            this.die(o); return;
          }
        }
        if (!u.passed && z > zr) {
          u.passed = true;
          if (dx < u.hw + B.hw + 0.4) this.nearMiss(o);
        }
      }
    }
    nearMiss(o) {
      const pts = C.POINTS.nearMiss * this.mult();
      this.score += pts;
      const y = o.userData.kind === 'high' ? 1.4 : o.userData.yMax;
      this.floatText.show('+' + pts, o.position.x, y + 0.6, o.position.z, '#9fffd0');
      if (this.nearCool <= 0) {
        this.nearCool = 2.2; ND.audio.sfx.nearMiss();
        if (Math.random() < 0.4) { const line = PK(TX.nearMiss); this.ui.toast(line); ND.voice.say(line); }
      }
    }
    smash(o, i) {
      ND.Obs.release(o); this.obstacles.splice(i, 1);
      const pts = C.POINTS.smash * this.mult(); this.score += pts;
      this.particles.burst(o.position.x, 1.2, o.position.z, 0xffd27a, 60, 7, 0.8, -10);
      this.floatText.show('+' + pts, o.position.x, 2.4, o.position.z, '#ffe08a');
      ND.audio.sfx.shieldHit(); this.shake = 0.5; this.fovKick = 4;
      if (this.smashCool <= 0) { this.smashCool = 2.5; const line = PK(TX.shieldHit); this.ui.toast(line, 'gold'); ND.voice.say(line); }
    }
    die(o) {
      this.state = 'dying'; this.dyingT = 0; this.hitStop = 0.11; this.timeScale = 0; this.cause = o.userData.type;
      this.player.die(); this.player.setShield(false);
      ND.audio.sfx.hit(); ND.audio.music.stop(); ND.voice.cancel();
      this.shake = 1.3; this.ui.flash();
      this.particles.burst(this.player.x, 1.2, 0, 0xff6a3c, 50, 7, 0.9, -12);
      for (const l of this.world.diyaLights) l.intensity = 0;
      this.ui.onStateChange('dying');
    }
    gameOver() {
      this.state = 'over'; this.timeScale = 1;
      const score = Math.floor(this.score);
      const newBest = score > this.best;
      if (newBest) { this.best = score; ND.store.set('nd_best', score); }
      const stats = {
        score, samosas: this.samosas, dist: Math.floor(this.dist), best: this.best, newBest, cause: this.cause,
        banner: PK(TX.gameOver), rank: ND.util.tiered(TX.ranks, score), verdict: ND.util.tiered(TX.verdicts, score)
      };
      ND.audio.sfx.gameOver();
      if (newBest) this.world.fireworks.volley(6, true);
      this.ui.showGameOver(stats);
      if (newBest) ND.voice.say(TX.newBest, { force: true });
      ND.voice.say(stats.banner, { queue: true });
      ND.voice.say(stats.verdict, { queue: true });
    }

    /* ---------- pickups, powers, chain ---------- */
    checkPickups() {
      const B = this.player.bounds();
      for (let i = this.pickups.length - 1; i >= 0; i--) {
        const p = this.pickups[i], u = p.userData;
        const dx = Math.abs(p.position.x - B.x), dz = Math.abs(p.position.z);
        if (dx < u.r && dz < u.r && p.position.y > B.bottom - 0.5 && p.position.y < B.top + 0.5) {
          this.collect(p); ND.Pick.release(p); this.pickups.splice(i, 1);
        }
      }
    }
    collect(p) {
      const u = p.userData, pos = p.position;
      if (u.type === 'samosa' || u.type === 'golden') {
        const golden = u.type === 'golden';
        this.chain++; this.chainT = C.CHAIN_TIME;
        const tier = Math.min(3, Math.floor(this.chain / 10));
        if (tier > this.chainTier) { this.chainTier = tier; ND.audio.sfx.chain(tier); this.ui.toast(TX.chain[tier - 1], 'gold'); ND.voice.say(TX.chain[tier - 1]); this.fovKick = 3; }
        const pts = u.value * this.mult();
        this.score += pts; this.samosas++; this.streak++;
        this.floatText.show('+' + pts, pos.x, pos.y + 0.6, pos.z, golden ? '#ffe08a' : '#ffe6a8');
        this.particles.burst(pos.x, pos.y, pos.z, golden ? 0xffe08a : 0xffb347, golden ? 40 : 12, 4, 0.6, -6);
        this.ui.flySamosa(this.toScreen(pos));
        if (golden) { ND.audio.sfx.golden(); const line = PK(TX.golden); this.ui.toast(line, 'gold'); ND.voice.say(line); this.fovKick = 5; }
        else { ND.audio.sfx.pickup(this.streak); if (this.streak % 10 === 0) { const line = PK(TX.praise); this.ui.toast(line); ND.voice.say(line); } }
      } else {
        this.powers[u.type] = C.POWER_TIME[u.type];
        if (u.type === 'chai') this.player.setShield(true);
        this.player.aura.material.color.set(u.type === 'chai' ? 0xffd27a : u.type === 'jalebi' ? 0xff8c1a : 0xff5c8a);
        this.floatText.show(u.type === 'mithai' ? 'x2!' : u.type.toUpperCase() + '!', pos.x, pos.y + 0.8, pos.z, '#ffe08a');
        this.particles.burst(pos.x, pos.y, pos.z, 0xffe08a, 50, 6, 0.8, -4);
        ND.audio.sfx.power(); const line = PK(TX.power[u.type]); this.ui.toast(line, 'gold'); ND.voice.say(line, { force: true }); this.fovKick = 6;
      }
    }
    toScreen(pos) {
      const v = this._v.copy(pos).project(this.camera);
      return { x: (v.x + 1) / 2 * window.innerWidth, y: (1 - v.y) / 2 * window.innerHeight };
    }
    updateChain(dt) {
      if (this.chain <= 0) return;
      this.chainT -= dt;
      if (this.chainT <= 0) { this.chain = 0; this.chainTier = 0; this.chainT = 0; }
    }
    updatePowers(dt) {
      for (const k of ['chai', 'jalebi', 'mithai']) {
        if (this.powers[k] <= 0) continue;
        this.powers[k] -= dt;
        if (this.powers[k] <= 0) {
          this.powers[k] = 0;
          if (k === 'chai') this.player.setShield(false);
          ND.audio.sfx.powerEnd(); this.ui.toast(TX.powerEnd[k], 'dim');
        }
      }
      const any = this.anyPowerActive();
      const au = this.player.aura.material;
      au.opacity = lerp(au.opacity, any ? 0.4 + 0.1 * Math.sin(this.t * 8) : 0, 1 - Math.exp(-dt * 6));
    }
    milestone() {
      const m = this.nextMilestone; this.nextMilestone += C.MILESTONE_EVERY;
      const line = TX.milestones[m] || PK(TX.milestoneGeneric);
      this.ui.banner(line);
      this.ui.greet(PK(TX.greetings));
      ND.voice.say(line, { force: true });
      ND.audio.sfx.milestone(); this.world.fireworks.volley(3, true);
    }
    onLand() {
      if (this.state !== 'playing') return;
      ND.audio.sfx.land();
      this.particles.puff(this.player.x, 0.05, 0, 10, 0);
      this.camDip = 0.22;
      if (this.buffered && this.buffered.action === 'jump') { this.buffered = null; this.act('jump'); }
    }

    /* ---------- camera ---------- */
    updateCamera(dt) {
      const P = this.player, portrait = this.camera.aspect < 1;
      const tx = C.LANES[P.lane];
      this.camX = lerp(this.camX, P.x * (portrait ? 0.7 : 0.45), 1 - Math.exp(-dt * 4));
      this.bank = lerp(this.bank, (tx - P.x) * 0.05, 1 - Math.exp(-dt * 8));
      const sp = clamp((this.speed - C.SPEED_START) / C.SPEED_GAIN, 0, 1);
      this.fovKick = lerp(this.fovKick, 0, 1 - Math.exp(-dt * 5));
      this.camDip = lerp(this.camDip, 0, 1 - Math.exp(-dt * 7));
      this.setFov(C.FOV.base + (C.FOV.max - C.FOV.base) * sp + this.fovKick);
      let sx = 0, sy = 0;
      if (this.shake > 0) {
        this.shake = Math.max(0, this.shake - dt * 2.2);
        sx = (Math.random() - 0.5) * this.shake * 0.5; sy = (Math.random() - 0.5) * this.shake * 0.5;
      }
      const bob = this.state === 'playing' && !P.jumping && !P.sliding ? Math.sin(P.phase * 2) * 0.035 : 0;
      this.camera.position.set(this.camX + sx, 4.3 + bob + sy + P.y * 0.15 - this.camDip, 8.2);
      this.camera.lookAt(P.x * 0.7, 1.8 + P.y * 0.3, -12);
      this.camera.rotateZ(this.bank);
    }
    setFov(target) {
      const f = target * (this.camera.aspect < 1 ? C.FOV.portraitBoost : 1);
      if (Math.abs(this.camera.fov - f) > 0.05) { this.camera.fov = lerp(this.camera.fov, f, 0.1); this.camera.updateProjectionMatrix(); }
    }
    onResize() {
      const w = window.innerWidth, h = window.innerHeight;
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }

    /* ---------- photo ---------- */
    setPhoto(canvas, placement) {
      if (canvas) this.photoCanvas = canvas;
      if (placement) this.placement = placement;
      if (!this.photoCanvas) return;
      const T = ND.tex;
      if (this.placement === 'hurdle') {
        this.player.setFace(T.faceSprite(T.cartoonNawab(), { turban: false }));
        if (this.photoTex) this.photoTex.dispose();
        this.photoTex = T.photoTexture(this.photoCanvas);
        ND.Obs.setPhoto(this.photoTex);
      } else {
        this.player.setFace(T.faceSprite(this.photoCanvas, { turban: false }));
        ND.Obs.setPhoto(null);
      }
    }

    /* ---------- input ---------- */
    act(a) {
      if (this.state !== 'playing') return;
      const P = this.player;
      if (a === 'left' || a === 'right') {
        if (P.moveLane(a === 'left' ? -1 : 1)) { ND.audio.sfx.whoosh(); if (!P.jumping) this.particles.puff(P.x, 0.05, 0, 5, a === 'left' ? 1 : -1); }
      } else if (a === 'jump') {
        if (P.jump()) ND.audio.sfx.jump();
        else if (P.jumping && P.vy < 0) this.buffered = { action: 'jump', t: this.t };
      } else if (a === 'slide') {
        if (P.slide()) { ND.audio.sfx.slide(); if (!P.jumping) { ND.audio.sfx.roll(); this.particles.puff(P.x, 0.05, 0.3, 6, 0); } }
      }
    }
    bindInput() {
      window.addEventListener('keydown', (e) => {
        const k = e.key;
        if (k === 'Escape' || k === 'p' || k === 'P') {
          if (this.state === 'playing') this.pause(); else if (this.state === 'paused') this.resume();
          return;
        }
        if (this.state !== 'playing') return;
        if (k === 'ArrowLeft' || k === 'a' || k === 'A') this.act('left');
        else if (k === 'ArrowRight' || k === 'd' || k === 'D') this.act('right');
        else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { e.preventDefault(); this.act('jump'); }
        else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); this.act('slide'); }
      });
      const el = this.canvas;
      let sx = 0, sy = 0, active = false, acted = false;
      const swipe = (dx, dy) => {
        if (Math.abs(dx) > Math.abs(dy)) this.act(dx > 0 ? 'right' : 'left');
        else this.act(dy < 0 ? 'jump' : 'slide');
      };
      el.addEventListener('pointerdown', (e) => {
        if (this.state !== 'playing') return;
        active = true; acted = false; sx = e.clientX; sy = e.clientY;
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      el.addEventListener('pointermove', (e) => {
        if (!active || acted) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) > 28) { acted = true; swipe(dx, dy); }
      });
      el.addEventListener('pointerup', (e) => {
        if (!active) return;
        active = false;
        if (acted) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) this.act('jump'); else swipe(dx, dy);
      });
      el.addEventListener('pointercancel', () => { active = false; });
    }
  };
})();
