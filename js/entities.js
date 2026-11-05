/* ============================================================
   entities.js : player rig, obstacles, pickups, particles,
   floating text, speed streaks
   ============================================================ */
(function () {
  const { rand: R, pick: PK, clamp, lerp } = ND.util;
  const C = ND.CFG;
  let M = null, G = null;
  const LABELS = { chai: 'CHAI SHIELD', jalebi: 'JALEBI MAGNET', mithai: 'MITHAI 2x' };
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // a crispy samosa: puffed tetrahedron with flat (pinched) facets
  function samosaGeometry() {
    const geo = new THREE.TetrahedronGeometry(0.46, 2);
    const p = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const n = v.clone().normalize().multiplyScalar(0.46);
      v.lerp(n, 0.45);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    geo.scale(1, 1.08, 0.82); geo.rotateX(0.55); geo.rotateY(0.3);
    geo.computeVertexNormals();
    return geo;
  }

  function shared() {
    if (M) return;
    const T = ND.tex;
    const std = (o) => new THREE.MeshStandardMaterial(o);
    const sprite = (map, color, opacity, blend) => new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: blend || THREE.AdditiveBlending });
    const umbrellaTex = T.stripes('#e63946', '#f2c14e', false); umbrellaTex.repeat.set(2, 1);
    M = {
      wood: std({ map: T.wood(), roughness: 0.9 }),
      terracotta: std({ color: 0xb5552a, roughness: 0.9 }),
      gold: std({ color: 0xf2c14e, roughness: 0.3, metalness: 0.75, emissive: 0x6a4a10, emissiveIntensity: 0.35 }),
      iron: std({ color: 0x2a2630, roughness: 0.6, metalness: 0.6 }),
      red: std({ color: 0xc62828, roughness: 0.7 }),
      black: std({ color: 0x14121a, roughness: 0.8 }),
      white: std({ color: 0xf4efe6, roughness: 0.6 }),
      tyre: std({ color: 0x1a1a1a, roughness: 0.95 }),
      cracker: std({ map: T.crackerLabel(), roughness: 0.8 }),
      mithai: std({ map: T.mithaiLid(), roughness: 0.55, metalness: 0.15 }),
      lantern: std({ map: T.lantern(), emissive: 0xffffff, emissiveMap: T.lantern(), emissiveIntensity: 0.9 }),
      stripePole: std({ map: T.stripes('#e63946', '#ffffff', true), roughness: 0.6 }),
      umbrella: std({ map: umbrellaTex, side: THREE.DoubleSide, roughness: 0.85, emissive: 0x331010, emissiveIntensity: 0.3 }),
      sweets: std({ map: T.sweets(), roughness: 0.8 }),
      autoBody: std({ map: T.autoBody(), roughness: 0.5, metalness: 0.2 }),
      autoYellow: std({ color: 0xf4c430, roughness: 0.5, metalness: 0.2 }),
      glass: std({ color: 0x9fd3ff, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.4 }),
      headlight: std({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 }),
      sack: std({ color: 0xc9a66b, roughness: 1 }),
      flag: std({ map: T.banner('Diwali'), side: THREE.DoubleSide, emissive: 0x331018, emissiveIntensity: 0.4 }),
      sign: std({ map: T.banner('Mithai'), emissive: 0x442020, emissiveIntensity: 0.4 }),
      marigold: std({ color: 0xff8c1a, roughness: 0.9, emissive: 0xff6a00, emissiveIntensity: 0.25 }),
      samosa: std({ map: T.samosa(false), roughness: 0.55, emissive: 0x3a1a00, emissiveIntensity: 0.7 }),
      samosaGold: std({ map: T.samosa(true), roughness: 0.25, metalness: 0.7, emissive: 0x8a5a10, emissiveIntensity: 0.7 }),
      jalebi: std({ color: 0xff8c1a, roughness: 0.3, metalness: 0.1, emissive: 0x7a3000, emissiveIntensity: 0.55 }),
      tea: std({ color: 0x6b3a1e, roughness: 0.3 }),
      screen: std({ map: T.deadline(), emissive: 0xffffff, emissiveMap: T.deadline(), emissiveIntensity: 0.7 }),
      laptop: std({ color: 0x2b2b33, roughness: 0.5, metalness: 0.4 }),
      ringGold: new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
      shadow: new THREE.MeshBasicMaterial({ map: T.shadow(), transparent: true, depthWrite: false }),
      flame: sprite(T.flame(), 0xffd9a0, 1),
      glowOrange: sprite(T.glow(), 0xff9a3c, 0.45),
      glowWhite: sprite(T.glow(), 0xfff4d6, 0.6),
      glowWarm: sprite(T.glow(), 0xffc877, 0.5),
      haloWarm: sprite(T.glow(), 0xffb347, 0.35),
      haloGold: sprite(T.glow(), 0xffe08a, 0.5),
      steam: sprite(T.glow(), 0xffffff, 0.4, THREE.NormalBlending)
    };
    G = {
      bowlBig: new THREE.CylinderGeometry(0.24, 0.14, 0.16, 10),
      bowlSmall: new THREE.CylinderGeometry(0.14, 0.09, 0.1, 8),
      stick: new THREE.CylinderGeometry(0.025, 0.025, 0.7, 5),
      obsPole: new THREE.CylinderGeometry(0.06, 0.07, 3.5, 8),
      poleFoot: new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8),
      strand: new THREE.CylinderGeometry(0.06, 0.06, 0.26, 6),
      string: new THREE.CylinderGeometry(0.012, 0.012, 0.9, 4),
      lanternBody: new THREE.CylinderGeometry(0.3, 0.22, 0.7, 6),
      wheel: new THREE.CylinderGeometry(0.4, 0.4, 0.14, 16).rotateZ(Math.PI / 2),
      wheelS: new THREE.CylinderGeometry(0.32, 0.32, 0.18, 14).rotateZ(Math.PI / 2),
      hub: new THREE.CylinderGeometry(0.12, 0.12, 0.16, 10).rotateZ(Math.PI / 2),
      handle: new THREE.CylinderGeometry(0.04, 0.04, 0.8, 6),
      deskLeg: new THREE.CylinderGeometry(0.035, 0.035, 0.72, 6),
      samosa: samosaGeometry(),
      ring: new THREE.TorusGeometry(0.62, 0.05, 8, 40),
      jalebi: new THREE.TorusKnotGeometry(0.28, 0.1, 64, 8, 2, 3)
    };
  }
  ND.sharedAssets = shared;

  function setShadows(obj) {
    obj.traverse((o) => { if (o.isMesh) { o.castShadow = !!ND.shadows; o.receiveShadow = !!ND.shadows; } });
  }

  /* ====================== PLAYER ====================== */
  ND.Player = class Player {
    constructor(scene) {
      shared();
      this.scene = scene;
      this.group = new THREE.Group(); scene.add(this.group);          // lane x, jump y, lean/bank
      this.pivot = new THREE.Group(); this.pivot.position.y = 0.9; this.group.add(this.pivot);   // roll / tumble pivot
      this.body = new THREE.Group(); this.body.position.y = -0.9; this.pivot.add(this.body);     // feet origin, squash/stretch
      this.rig = new THREE.Group(); this.body.add(this.rig);           // procedural meshes (hidden when a GLB model is used)
      this.onLand = null; this.model = null; this.mixer = null; this.headBone = null;
      this._v = new THREE.Vector3(); this._v2 = new THREE.Vector3();
      this.build();
      this.buildRibbon();
      this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: ND.tex.shadow(), transparent: true, depthWrite: false, opacity: ND.shadows ? 0.45 : 1 }));
      this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.02; scene.add(this.shadow);
      this.reset();
    }

    build() {
      const T = ND.tex, Rg = this.rig;
      const std = (o) => new THREE.MeshStandardMaterial(o);
      const sherwani = std({ map: T.sherwani(), roughness: 0.75 });
      const sleeve = std({ color: 0x8f1f36, roughness: 0.75 });
      const churidar = std({ color: 0xf1e4c8, roughness: 0.85 });
      const skin = std({ color: 0xd9a066, roughness: 0.7 });
      const mojari = std({ color: 0xf2c14e, roughness: 0.4, metalness: 0.5 });
      const mesh = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; (parent || Rg).add(o); return o; };
      const box = (w, h, d, m, x, y, z, parent) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
      const pivotAt = (x, y, z, parent) => { const p = new THREE.Group(); p.position.set(x, y, z); (parent || Rg).add(p); return p; };

      this.pelvis = box(0.62, 0.26, 0.38, churidar, 0, 0.98, 0);
      this.torso = box(0.8, 0.74, 0.46, sherwani, 0, 1.47, 0);
      box(0.68, 0.1, 0.42, M.gold, 0, 1.12, 0);
      this.neck = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.16, 10), skin, 0, 1.9, 0);
      this.legs = [-1, 1].map((s) => {
        const hip = pivotAt(s * 0.17, 0.95, 0);
        box(0.24, 0.5, 0.26, churidar, 0, -0.25, 0, hip);
        const knee = pivotAt(0, -0.5, 0, hip);
        box(0.2, 0.42, 0.22, churidar, 0, -0.21, 0, knee);
        box(0.22, 0.1, 0.36, mojari, 0, -0.45, 0.06, knee);
        return { hip, knee };
      });
      this.arms = [-1, 1].map((s) => {
        const sh = pivotAt(s * 0.5, 1.75, 0);
        box(0.2, 0.38, 0.2, sleeve, 0, -0.19, 0, sh);
        box(0.22, 0.08, 0.22, M.gold, 0, -0.36, 0, sh);
        const el = pivotAt(0, -0.38, 0, sh);
        box(0.17, 0.34, 0.17, sleeve, 0, -0.17, 0, el);
        box(0.16, 0.14, 0.16, skin, 0, -0.4, 0, el);
        sh.rotation.z = -s * 0.12;
        return { sh, el };
      });
      // the face: a billboard sprite (photo + Nawabi turban)
      this.head = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.faceSprite(T.monogram()), transparent: true }));
      this.head.scale.set(1.3, 1.3, 1); this.head.position.set(0, 2.36, 0); this.body.add(this.head);
      this.headY = 2.36;
      // effects live on the group so they don't roll with the body
      this.shield = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      this.shield.position.y = 1.2; this.shield.visible = false; this.group.add(this.shield);
      this.shieldRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      this.shieldRing.rotation.x = Math.PI / 2; this.shieldRing.position.y = 0.12; this.shieldRing.visible = false; this.group.add(this.shieldRing);
      this.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color: 0xffb347, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.aura.scale.set(2.8, 2.8, 1); this.aura.position.y = 1.0; this.group.add(this.aura);
    }

    buildRibbon() {
      const N = 8; this.ribN = N; this.ribPts = [];
      for (let i = 0; i < N; i++) this.ribPts.push(new THREE.Vector3(-0.42 - i * 0.06, 1.82, 0.2 + i * 0.16));
      this.ribAnchor = new THREE.Object3D(); this.ribAnchor.position.set(-0.46, 1.84, 0.12); this.rig.add(this.ribAnchor);
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 6), uv = new Float32Array(N * 4), nor = new Float32Array(N * 6), idx = [];
      for (let i = 0; i < N; i++) {
        uv[i * 4] = 0; uv[i * 4 + 1] = i / (N - 1); uv[i * 4 + 2] = 1; uv[i * 4 + 3] = i / (N - 1);
        nor[i * 6 + 1] = 1; nor[i * 6 + 4] = 1;
        if (i < N - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setIndex(idx);
      this.ribbon = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: ND.tex.dupatta(), side: THREE.DoubleSide, roughness: 0.8, emissive: 0x3a1a00, emissiveIntensity: 0.35 }));
      this.ribbon.frustumCulled = false; this.scene.add(this.ribbon);
    }

    updateRibbon(dt, speed, t) {
      const pts = this.ribPts, N = this.ribN;
      (this.model ? this.neck : this.ribAnchor).getWorldPosition(pts[0]);
      if (this.model) { pts[0].x -= 0.4; pts[0].z += 0.1; }
      const wind = clamp(speed / 30, 0.25, 1);
      for (let i = 1; i < N; i++) {
        const prev = pts[i - 1], p = pts[i];
        const tx = prev.x - 0.07 + Math.sin(t * 9 + i * 0.9) * 0.05 * wind;
        const ty = prev.y - 0.04 - (1 - wind) * 0.1 + Math.sin(t * 11 + i * 1.3) * 0.045 * wind + (i < 3 ? 0.03 : 0);
        const tz = prev.z + 0.16;
        const k = 1 - Math.exp(-dt * (17 - i * 1.2));
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k; p.z += (tz - p.z) * k;
      }
      const pos = this.ribbon.geometry.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const w = 0.2 * (1 - i / N) + 0.06, p = pts[i];
        pos[i * 6] = p.x - w / 2; pos[i * 6 + 1] = p.y; pos[i * 6 + 2] = p.z;
        pos[i * 6 + 3] = p.x + w / 2; pos[i * 6 + 4] = p.y; pos[i * 6 + 5] = p.z;
      }
      this.ribbon.geometry.attributes.position.needsUpdate = true;
    }

    /* optional rigged GLB character (e.g. Mixamo) */
    setModel(gltf) {
      const scene = gltf.scene;
      scene.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
      const box = new THREE.Box3().setFromObject(scene);
      const h = Math.max(0.01, box.max.y - box.min.y);
      scene.scale.setScalar(1.9 / h);
      box.setFromObject(scene);
      scene.position.y -= box.min.y;
      scene.position.x -= (box.min.x + box.max.x) / 2;
      scene.position.z -= (box.min.z + box.max.z) / 2;
      scene.rotation.y = Math.PI;
      this.model = scene; this.body.add(scene); this.rig.visible = false;
      this.mixer = new THREE.AnimationMixer(scene);
      const find = (re) => gltf.animations.find((c) => re.test(c.name));
      const clips = {
        run: find(/run|jog|sprint/i) || find(/walk/i) || gltf.animations[0],
        jump: find(/jump|leap/i), slide: find(/slide|roll|crouch|duck/i), death: find(/death|die|stumble|fall|hit/i)
      };
      this.actions = {};
      for (const k of Object.keys(clips)) {
        if (!clips[k]) continue;
        const a = this.mixer.clipAction(clips[k]); this.actions[k] = a;
        if (k !== 'run') { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      }
      this.current = null;
      let head = null;
      scene.traverse((o) => { if (!head && o.isBone && /head/i.test(o.name)) head = o; });
      this.headBone = head;
      this.headY = box.max.y - (head ? 0 : 0) + 0.45;
      this.play('run');
    }
    play(name, reset) {
      const a = this.actions && (this.actions[name] || this.actions.run);
      if (!a) return;
      if (this.current === a && !reset) return;
      if (this.current && this.current !== a) this.current.fadeOut(0.12);
      a.reset().setEffectiveWeight(1).fadeIn(0.1).play();
      this.current = a;
    }
    updateModel(dt, speed) {
      if (!this.mixer) return;
      if (this.actions.run) this.actions.run.timeScale = 0.75 + speed / 32;
      this.mixer.update(dt);
      if (this.headBone) {
        this.headBone.getWorldPosition(this._v); this.body.worldToLocal(this._v);
        this.head.position.set(this._v.x, this._v.y + 0.35, this._v.z);
      } else this.head.position.set(0, this.headY, 0);
    }

    setFace(tex) {
      const old = this.head.material.map;
      this.head.material.map = tex; this.head.material.needsUpdate = true;
      if (old && old !== tex) old.dispose();
    }
    reset() {
      this.lane = 1; this.x = 0; this.y = 0; this.vy = 0;
      this.jumping = false; this.sliding = false; this.rolling = false; this.slideT = 0; this.wantSlide = false;
      this.dead = false; this.deadT = 0; this.phase = 0; this.t = 0; this.airT = 0;
      this.group.rotation.set(0, 0, 0); this.group.position.set(0, 0, 0);
      this.pivot.rotation.set(0, 0, 0); this.pivot.position.y = 0.9; this.body.scale.set(1, 1, 1);
      this.head.position.y = this.headY;
      this.shield.visible = false; this.shieldRing.visible = false; this.aura.material.opacity = 0;
      if (this.model) this.play('run', true);
    }
    setShield(on) { this.shield.visible = on; this.shieldRing.visible = on; }
    moveLane(dir) {
      const n = clamp(this.lane + dir, 0, 2);
      if (n === this.lane || this.dead) return false;
      this.lane = n; return true;
    }
    jump() {
      if (this.jumping || this.dead) return false;
      this.jumping = true; this.vy = C.JUMP_V; this.airT = 0;
      this.sliding = false; this.rolling = false; this.pivot.rotation.x = 0; this.pivot.position.y = 0.9;
      this.body.scale.set(0.9, 1.14, 0.9);
      if (this.model) this.play('jump', true);
      return true;
    }
    slide() {
      if (this.dead) return false;
      if (this.jumping) { this.vy = Math.min(this.vy, C.SLAM_V); this.wantSlide = true; return true; }
      if (this.sliding && this.slideT > C.SLIDE_TIME * 0.4) return false;
      this.sliding = true; this.slideT = C.SLIDE_TIME;
      if (this.model) this.play('slide', true);
      return true;
    }
    die() {
      this.dead = true; this.vy = 6.5; this.jumping = true; this.sliding = false; this.rolling = false;
      if (this.model) this.play('death', true);
    }
    bounds() {
      const P = C.PLAYER;
      return { x: this.x, bottom: this.y, top: this.y + (this.sliding ? P.slideHeight : P.height), hw: P.halfW, hd: P.halfD };
    }

    update(dt, t, speed, running) {
      this.t = t;
      const g = this.group, k = 1 - Math.exp(-dt * 16);
      if (this.model) this.updateModel(dt, speed);
      if (this.dead) {
        this.deadT += dt;
        this.y += this.vy * dt; this.vy += C.GRAVITY * dt;
        if (this.y < 0) { this.y = 0; this.vy = 0; }
        if (!this.model) {
          this.pivot.rotation.x = Math.max(-1.75, this.pivot.rotation.x - dt * 5.5);
          this.pivot.position.y = lerp(this.pivot.position.y, 0.5, 1 - Math.exp(-dt * 4));
          this.pose(dt, speed, false);
        }
        g.rotation.z = lerp(g.rotation.z, 0.35, 1 - Math.exp(-dt * 3));
        g.position.set(this.x, this.y, Math.min(1.6, this.deadT * 2.4));
        this.shadow.position.set(this.x, 0.02, g.position.z);
        this.updateRibbon(dt, speed * 0.3, t);
        return;
      }
      this.phase += dt * (9 + speed * 0.35);
      if (this.jumping) {
        this.airT += dt;
        this.y += this.vy * dt; this.vy += C.GRAVITY * dt;
        if (this.y <= 0) {
          this.y = 0; this.jumping = false;
          this.body.scale.set(1.16, 0.84, 1.16);
          if (this.onLand) this.onLand();
          if (this.wantSlide) { this.wantSlide = false; this.sliding = true; this.slideT = C.SLIDE_TIME; if (this.model) this.play('slide', true); }
          else if (this.model) this.play('run');
        }
      }
      if (this.sliding) {
        this.slideT -= dt;
        const u = 1 - this.slideT / C.SLIDE_TIME, rollFrac = 0.74;
        if (!this.model) {
          if (u < rollFrac) {
            const e = easeInOut(u / rollFrac);
            this.rolling = true;
            this.pivot.rotation.x = -Math.PI * 2 * e;
            this.pivot.position.y = lerp(0.9, 0.62, Math.sin(e * Math.PI));
            this.head.position.y = lerp(this.head.position.y, 1.35, k);
          } else { this.rolling = false; this.pivot.rotation.x = 0; this.pivot.position.y = 0.9; }
        }
        if (this.slideT <= 0) { this.sliding = false; this.rolling = false; this.pivot.rotation.x = 0; this.pivot.position.y = 0.9; if (this.model) this.play('run'); }
      }
      if (!this.rolling && !this.model) this.head.position.y = lerp(this.head.position.y, this.headY, k);
      // squash / stretch recovery
      this.body.scale.x = lerp(this.body.scale.x, 1, k); this.body.scale.y = lerp(this.body.scale.y, 1, k); this.body.scale.z = lerp(this.body.scale.z, 1, k);
      // lanes
      const tx = C.LANES[this.lane];
      this.x += (tx - this.x) * Math.min(1, dt * C.LANE_LERP);
      if (!this.model) this.pose(dt, speed, running);
      const lean = this.rolling ? 0 : (this.jumping ? -0.04 : (running ? -0.11 : -0.04));
      g.rotation.x = lerp(g.rotation.x, lean, 1 - Math.exp(-dt * 10));
      g.rotation.z = lerp(g.rotation.z, -(tx - this.x) * 0.3, 1 - Math.exp(-dt * 12));
      g.rotation.y = lerp(g.rotation.y, (tx - this.x) * 0.2, 1 - Math.exp(-dt * 12));
      const bob = (!this.jumping && !this.sliding) ? 0.05 * (0.5 + 0.5 * Math.cos(this.phase * 2)) * (running ? 1 : 0.5) : 0;
      g.position.set(this.x, this.y + bob, 0);
      const sh = clamp(1 - this.y * 0.28, 0.25, 1);
      this.shadow.position.set(this.x, 0.02, 0); this.shadow.scale.set(sh * 1.6, sh * 1.6, 1);
      this.shadow.material.opacity = sh * (ND.shadows ? 0.45 : 1);
      if (this.shield.visible) {
        this.shield.material.opacity = 0.16 + 0.08 * Math.sin(t * 9);
        this.shield.scale.setScalar(1 + 0.04 * Math.sin(t * 6));
        this.shieldRing.rotation.z += dt * 2;
      }
      this.updateRibbon(dt, speed, t);
    }

    // procedural pose: run cycle, jump tuck/extend, roll tuck, tumble flail
    pose(dt, speed, running) {
      const k = 1 - Math.exp(-dt * 18), L = this.legs, A = this.arms;
      const leg = (i, hip, knee) => { L[i].hip.rotation.x = lerp(L[i].hip.rotation.x, hip, k); L[i].knee.rotation.x = lerp(L[i].knee.rotation.x, knee, k); };
      const arm = (i, sh, el) => { A[i].sh.rotation.x = lerp(A[i].sh.rotation.x, sh, k); A[i].el.rotation.x = lerp(A[i].el.rotation.x, el, k); };
      if (this.dead) { leg(0, 0.9, -1.2); leg(1, -0.6, -0.4); arm(0, 2.3, 0.5); arm(1, -1.5, 0.9); return; }
      if (this.rolling) { leg(0, 1.7, -2.1); leg(1, 1.6, -2.2); arm(0, 1.4, 1.9); arm(1, 1.4, 1.9); this.torso.rotation.y = 0; return; }
      if (this.jumping) {
        if (this.vy > 1.5) { leg(0, 1.0, -1.5); leg(1, -0.35, -0.9); arm(0, 2.5, 0.4); arm(1, 2.3, 0.5); }
        else { leg(0, 0.6, -0.4); leg(1, 0.35, -0.5); arm(0, 1.0, 0.9); arm(1, 0.9, 0.9); }
        return;
      }
      const a = running ? 1 : 0.55;
      for (let i = 0; i < 2; i++) {
        const p = this.phase + i * Math.PI;
        leg(i, 0.8 * Math.sin(p) * a, -(0.22 + 1.2 * Math.max(0, Math.cos(p))) * a);
        arm(i, -0.95 * Math.sin(p) * a, 1.15 + 0.3 * Math.sin(p) * a);
      }
      this.torso.rotation.y = -0.12 * Math.sin(this.phase) * a;
      this.pelvis.rotation.y = 0.1 * Math.sin(this.phase) * a;
    }
  };

  /* ====================== PARTICLES ====================== */
  ND.Particles = class Particles {
    constructor(scene, n) {
      this.n = n || 900;
      const N = this.n;
      this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3);
      this.col = new Float32Array(N * 3); this.base = new Float32Array(N * 3);
      this.life = new Float32Array(N); this.maxLife = new Float32Array(N); this.grav = new Float32Array(N);
      for (let i = 0; i < N; i++) this.pos[i * 3 + 1] = -1000;
      this.geo = new THREE.BufferGeometry();
      this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
      this.points = new THREE.Points(this.geo, new THREE.PointsMaterial({ size: 0.42, map: ND.tex.star(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      this.points.frustumCulled = false; scene.add(this.points);
      this.cursor = 0; this.tmp = new THREE.Color();
    }
    emit(x, y, z, vx, vy, vz, color, life, gravity) {
      const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
      this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
      this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
      const c = this.tmp.set(color), v = 0.8 + Math.random() * 0.3;
      this.base[i * 3] = c.r * v; this.base[i * 3 + 1] = c.g * v; this.base[i * 3 + 2] = c.b * v;
      this.life[i] = this.maxLife[i] = life; this.grav[i] = gravity;
    }
    burst(x, y, z, color, count, speed, life, gravity) {
      for (let k = 0; k < count; k++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), sp = speed * (0.3 + Math.random() * 0.7);
        this.emit(x, y, z, Math.sin(ph) * Math.cos(th) * sp, Math.cos(ph) * sp, Math.sin(ph) * Math.sin(th) * sp, color, life * (0.6 + Math.random() * 0.6), gravity);
      }
    }
    puff(x, y, z, count, dirX) {
      for (let k = 0; k < count; k++) this.emit(x + R(-0.3, 0.3), y + R(0, 0.1), z + R(-0.3, 0.3), R(-1.2, 1.2) + (dirX || 0) * 2.5, R(0.6, 2.2), R(0.5, 2.5), 0xc9a97a, R(0.3, 0.55), -1.5);
    }
    update(dt, drift) {
      const { pos, vel, col, base, life, maxLife, grav, n } = this;
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        vel[i * 3 + 1] += grav[i] * dt;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt + drift * dt;
        if (life[i] <= 0) { pos[i * 3 + 1] = -1000; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
        const f = life[i] / maxLife[i];
        col[i * 3] = base[i * 3] * f; col[i * 3 + 1] = base[i * 3 + 1] * f; col[i * 3 + 2] = base[i * 3 + 2] * f;
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
    }
  };

  /* ====================== FLOATING TEXT ====================== */
  ND.FloatText = class FloatText {
    constructor(scene) {
      this.items = [];
      for (let i = 0; i < 10; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ND.tex.text('+10', '#ffe6a8'), transparent: true, depthWrite: false, depthTest: false }));
        s.scale.set(1.7, 0.85, 1); s.visible = false; s.renderOrder = 5; scene.add(s);
        this.items.push({ s, life: 0 });
      }
      this.cursor = 0;
    }
    show(str, x, y, z, color) {
      const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.items.length;
      it.s.material.map = ND.tex.text(str, color || '#ffe6a8'); it.s.material.needsUpdate = true;
      it.s.position.set(x, y, z); it.s.visible = true; it.life = 0.9; it.s.material.opacity = 1;
    }
    update(dt, drift) {
      for (const it of this.items) {
        if (it.life <= 0) continue;
        it.life -= dt;
        it.s.position.y += 1.8 * dt; it.s.position.z += drift * dt * 0.3;
        it.s.material.opacity = clamp(it.life / 0.9, 0, 1);
        if (it.life <= 0) it.s.visible = false;
      }
    }
  };

  /* ====================== SPEED STREAKS ====================== */
  ND.Streaks = class Streaks {
    constructor(scene, n) {
      this.mat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const geo = new THREE.PlaneGeometry(0.04, 3.4); geo.rotateX(Math.PI / 2);
      this.items = [];
      for (let i = 0; i < (n || 16); i++) {
        const m = new THREE.Mesh(geo, this.mat); m.visible = false; scene.add(m);
        this.items.push({ m, f: R(1.6, 2.6) }); this.resetItem(this.items[i], true);
      }
    }
    resetItem(it, anywhere) {
      it.m.position.set((Math.random() < 0.5 ? -1 : 1) * R(3.2, 9), R(0.4, 7), anywhere ? R(-45, 8) : R(-50, -20));
      it.f = R(1.6, 2.8);
    }
    update(dt, speed) {
      const f = clamp((speed - 19) / 16, 0, 1);
      this.mat.opacity = 0.32 * f;
      for (const it of this.items) {
        it.m.visible = f > 0;
        if (f <= 0) continue;
        it.m.position.z += speed * it.f * dt;
        if (it.m.position.z > 12) this.resetItem(it, false);
      }
    }
  };

  /* ====================== OBSTACLES ====================== */
  ND.Obs = {
    kinds: { diyaRow: 'low', anaar: 'low', crackerBox: 'low', desk: 'low', toran: 'high', kandil: 'high', thela: 'full', auto: 'full' },
    byKind: { low: ['diyaRow', 'crackerBox', 'anaar', 'desk', 'diyaRow', 'crackerBox', 'desk'], high: ['toran', 'kandil'], full: ['thela', 'auto'] },
    pools: {}, all: [], photoTex: null,
    get(type) {
      const pool = this.pools[type] || (this.pools[type] = []);
      let o = pool.pop();
      if (!o) { o = this.make(type); this.all.push(o); }
      o.visible = true; o.userData.prevZ = null; o.userData.passed = false; o.userData.hinted = false;
      return o;
    },
    release(o) { o.visible = false; if (o.parent) o.parent.remove(o); this.pools[o.userData.type].push(o); },
    setPhoto(tex) { this.photoTex = tex; for (const o of this.all) this.applyPhoto(o); },
    applyPhoto(o) {
      const u = o.userData; if (!u.photoPlane) return;
      u.photoPlane.visible = !!this.photoTex;
      if (this.photoTex) { u.photoMesh.material.map = this.photoTex; u.photoMesh.material.needsUpdate = true; }
    },
    make(type) {
      shared();
      const g = new THREE.Group();
      const u = { type, kind: this.kinds[type], parts: {} };
      g.userData = u;
      this['make_' + type](g, u);
      setShadows(g);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(u.hw * 2 + 0.5, u.hd * 2 + 0.8), M.shadow);
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.018; sh.receiveShadow = false; g.add(sh);
      if (ND.shadows) sh.material = new THREE.MeshBasicMaterial({ map: ND.tex.shadow(), transparent: true, depthWrite: false, opacity: 0.4 });
      this.applyPhoto(g);
      return g;
    },
    addPhotoPlane(g, u, size, y, z) {
      const grp = new THREE.Group();
      const frame = new THREE.Mesh(new THREE.PlaneGeometry(size + 0.14, size + 0.14), M.gold); frame.position.set(0, y, z); grp.add(frame);
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ color: 0xffffff })); pl.position.set(0, y, z + 0.006); grp.add(pl);
      grp.visible = false; g.add(grp); u.photoPlane = grp; u.photoMesh = pl;
    },
    make_diyaRow(g, u) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 0.75), M.wood); plank.position.y = 0.1; g.add(plank);
      u.parts.flames = [];
      for (const x of [-0.7, 0, 0.7]) {
        const bowl = new THREE.Mesh(G.bowlBig, M.terracotta); bowl.position.set(x, 0.26, 0); g.add(bowl);
        const fl = new THREE.Sprite(M.flame); fl.scale.set(0.5, 0.78, 1); fl.position.set(x, 0.64, 0); g.add(fl); u.parts.flames.push(fl);
        const gl = new THREE.Sprite(M.glowOrange); gl.scale.set(1.4, 1.4, 1); gl.position.set(x, 0.5, 0); g.add(gl);
      }
      u.parts.light = true;
      u.hw = 1.05; u.hd = 0.38; u.yMin = 0; u.yMax = 0.85;
    },
    make_anaar(g, u) {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.55, 10), M.terracotta); pot.position.y = 0.28; g.add(pot);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.08, 10), M.gold); band.position.y = 0.42; g.add(band);
      const gl = new THREE.Sprite(M.glowWhite); gl.scale.set(1.1, 1.1, 1); gl.position.y = 0.66; g.add(gl);
      u.parts.sparks = true; u.parts.light = true;
      u.hw = 0.5; u.hd = 0.5; u.yMin = 0; u.yMax = 0.75;
    },
    make_crackerBox(g, u) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.55, 0.95), M.cracker); b1.position.y = 0.275; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.45, 0.7), M.cracker); b2.position.set(0.1, 0.78, 0); b2.rotation.y = 0.25; g.add(b2);
      for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(G.stick, M.red); st.position.set(-0.5 + i * 0.16, 1.15, 0.1); st.rotation.z = 0.18 * i - 0.18; g.add(st); }
      u.hw = 0.7; u.hd = 0.5; u.yMin = 0; u.yMax = 1.0;
      this.addPhotoPlane(g, u, 0.42, 0.28, 0.48);
    },
    make_desk(g, u) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.85), M.wood); top.position.y = 0.76; g.add(top);
      for (const [x, z] of [[-0.78, -0.35], [0.78, -0.35], [-0.78, 0.35], [0.78, 0.35]]) { const l = new THREE.Mesh(G.deskLeg, M.iron); l.position.set(x, 0.36, z); g.add(l); }
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.36), M.laptop); base.position.set(-0.3, 0.815, 0.05); g.add(base);
      const lid = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.34, 0.02), M.laptop); lid.position.set(-0.3, 0.98, -0.13); lid.rotation.x = -0.25; g.add(lid);
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.28), M.screen); screen.position.set(-0.3, 0.98, -0.118); screen.rotation.x = -0.25; g.add(screen);
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.13, 10), M.white); mug.position.set(0.3, 0.865, 0.12); g.add(mug);
      const papers = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), M.white); papers.rotation.x = -Math.PI / 2; papers.rotation.z = 0.2; papers.position.set(0.12, 0.805, -0.12); g.add(papers);
      const bowl = new THREE.Mesh(G.bowlSmall, M.terracotta); bowl.position.set(0.55, 0.85, -0.2); g.add(bowl);
      const fl = new THREE.Sprite(M.flame); fl.scale.set(0.32, 0.5, 1); fl.position.set(0.55, 1.08, -0.2); g.add(fl);
      const gl = new THREE.Sprite(M.glowOrange); gl.scale.set(1.0, 1.0, 1); gl.position.set(0.55, 1.0, -0.2); g.add(gl);
      u.parts.flames = [fl];
      u.hw = 0.85; u.hd = 0.45; u.yMin = 0; u.yMax = 1.0;
      this.addPhotoPlane(g, u, 0.36, 0.5, 0.43);
    },
    poles(g, u) {
      for (const x of [-1.15, 1.15]) {
        const p = new THREE.Mesh(G.obsPole, M.stripePole); p.position.set(x, 1.75, 0); g.add(p);
        const f = new THREE.Mesh(G.poleFoot, M.iron); f.position.set(x, 0.1, 0); g.add(f);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.08), M.gold); bar.position.y = 3.45; g.add(bar);
    },
    make_toran(g, u) {
      this.poles(g, u);
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.15), new THREE.MeshStandardMaterial({ map: ND.tex.banner(PK(ND.TEXT.bannerTexts)), side: THREE.DoubleSide, roughness: 0.9, emissive: 0x331018, emissiveIntensity: 0.5 }));
      banner.position.y = 2.37; g.add(banner);
      for (const x of [-0.95, -0.48, 0, 0.48, 0.95]) { const s = new THREE.Mesh(G.strand, M.marigold); s.position.set(x, 1.68, 0.03); g.add(s); }
      u.hw = 1.15; u.hd = 0.35; u.yMin = 1.55; u.yMax = 3.6;
    },
    make_kandil(g, u) {
      this.poles(g, u);
      u.parts.lanterns = [];
      for (const x of [-0.8, 0, 0.8]) {
        const grp = new THREE.Group(); grp.position.set(x, 3.45, 0);
        const str = new THREE.Mesh(G.string, M.iron); str.position.y = -0.45; grp.add(str);
        const body = new THREE.Mesh(G.lanternBody, M.lantern); body.position.y = -1.2; grp.add(body);
        const gl = new THREE.Sprite(M.glowOrange); gl.scale.set(1.6, 1.6, 1); gl.position.y = -1.2; grp.add(gl);
        grp.userData.phase = Math.random() * 6; g.add(grp); u.parts.lanterns.push(grp);
      }
      u.hw = 1.15; u.hd = 0.4; u.yMin = 1.6; u.yMax = 3.6;
    },
    make_thela(g, u) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 1.5), M.wood); body.position.y = 0.85; g.add(body);
      const tray = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.4), M.sweets); tray.rotation.x = -Math.PI / 2; tray.position.y = 1.305; g.add(tray);
      u.parts.wheels = [];
      for (const x of [-1.08, 1.08]) {
        const w = new THREE.Mesh(G.wheel, M.tyre); w.position.set(x, 0.4, 0.1); g.add(w); u.parts.wheels.push(w);
        const hub = new THREE.Mesh(G.hub, M.gold); hub.position.set(x + Math.sign(x) * 0.02, 0.4, 0.1); g.add(hub);
      }
      for (const x of [-0.7, 0.7]) { const h = new THREE.Mesh(G.handle, M.wood); h.position.set(x, 0.72, 1.1); h.rotation.x = Math.PI / 2 + 0.25; g.add(h); }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.3, 6), M.iron); pole.position.set(0, 2.4, -0.2); g.add(pole);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.55, 12, 1, true), M.umbrella); cone.position.set(0, 3.3, -0.2); g.add(cone);
      const fin = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), M.gold); fin.position.set(0, 3.6, -0.2); g.add(fin);
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.42), M.sign); sign.position.set(0, 1.0, 0.76); g.add(sign);
      const bulb = new THREE.Sprite(M.glowWarm); bulb.scale.set(2.4, 2.4, 1); bulb.position.set(0, 2.55, 0); g.add(bulb);
      u.hw = 1.0; u.hd = 0.8; u.yMin = 0; u.yMax = 3.6;
      this.addPhotoPlane(g, u, 0.85, 2.0, 0.25);
    },
    make_auto(g, u) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.15, 2.1), M.autoBody); body.position.set(0, 1.08, 0); g.add(body);
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.5), M.autoYellow); hood.position.set(0, 0.78, 1.2); g.add(hood);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.1, 2.3), M.black); roof.position.set(0, 1.7, 0); g.add(roof);
      const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.55), M.glass); ws.position.set(0, 1.38, 1.06); g.add(ws);
      u.parts.wheels = [];
      [[0, 1.0], [-0.74, -0.7], [0.74, -0.7]].forEach(([x, z]) => { const w = new THREE.Mesh(G.wheelS, M.tyre); w.position.set(x, 0.32, z); g.add(w); u.parts.wheels.push(w); });
      for (const x of [-0.42, 0.42]) {
        const hl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.headlight); hl.position.set(x, 1.0, 1.07); g.add(hl);
        const gl = new THREE.Sprite(M.glowWhite); gl.scale.set(1.7, 1.7, 1); gl.position.set(x, 1.0, 1.14); g.add(gl);
      }
      const sack = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M.sack); sack.scale.set(1.3, 0.8, 1); sack.position.set(-0.3, 2.0, -0.3); g.add(sack);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7), M.mithai); b1.position.set(0.45, 2.0, 0.3); b1.rotation.y = 0.3; g.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.6), M.cracker); b2.position.set(-0.2, 2.5, 0.1); b2.rotation.y = -0.4; g.add(b2);
      const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 4), M.iron); fp.position.set(0.6, 2.9, -0.8); g.add(fp);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.35), M.flag); flag.position.set(0.3, 3.3, -0.8); g.add(flag);
      u.hw = 0.8; u.hd = 1.1; u.yMin = 0; u.yMax = 3.2;
      this.addPhotoPlane(g, u, 0.6, 1.38, 1.075);
    },
    animate(o, dt, t, speed, particles) {
      const u = o.userData, p = u.parts;
      if (p.wheels) for (const w of p.wheels) w.rotation.x += speed * dt * 2.5;
      if (p.lanterns) for (const l of p.lanterns) l.rotation.z = Math.sin(t * 2.2 + l.userData.phase) * 0.22;
      if (p.flames) p.flames.forEach((f, i) => { f.scale.y = f.scale.x * 1.5 * (1 + 0.18 * Math.sin(t * 15 + i * 2.1)); });
      if (p.sparks && particles && o.position.z > -80 && o.position.z < 6) {
        for (let i = 0; i < 2; i++) particles.emit(o.position.x + R(-0.08, 0.08), 0.6, o.position.z, R(-1.6, 1.6), R(4, 8), R(-1.6, 1.6), Math.random() < 0.3 ? 0xffffff : 0xffc24a, R(0.35, 0.7), -12);
      }
    }
  };

  /* ====================== PICKUPS ====================== */
  ND.Pick = {
    pools: {},
    get(type) {
      const pool = this.pools[type] || (this.pools[type] = []);
      const p = pool.pop() || this.make(type);
      p.visible = true; p.userData.collected = false; p.scale.setScalar(1);
      return p;
    },
    release(p) { p.visible = false; if (p.parent) p.parent.remove(p); this.pools[p.userData.type].push(p); },
    make(type) {
      shared();
      const g = new THREE.Group();
      const u = { type, phase: Math.random() * 6, baseY: 0.75, value: 0, r: 0.95 };
      g.userData = u;
      if (type === 'samosa' || type === 'golden') {
        const golden = type === 'golden';
        const m = new THREE.Mesh(G.samosa, golden ? M.samosaGold : M.samosa);
        m.scale.setScalar(golden ? 1.45 : 1); m.castShadow = !!ND.shadows; u.mesh = m; g.add(m);
        const halo = new THREE.Sprite(golden ? M.haloGold : M.haloWarm);
        halo.scale.set(golden ? 2.3 : 1.5, golden ? 2.3 : 1.5, 1); g.add(halo);
        u.value = golden ? C.POINTS.golden : C.POINTS.samosa; u.r = golden ? 1.1 : 0.95;
      } else {
        const ring = new THREE.Mesh(G.ring, M.ringGold); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.92; g.add(ring); u.ring = ring;
        const halo = new THREE.Sprite(M.haloGold); halo.scale.set(2.4, 2.4, 1); g.add(halo);
        let item;
        if (type === 'chai') {
          item = new THREE.Group();
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.46, 12), M.terracotta); item.add(cup);
          const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.04, 12), M.tea); tea.position.y = 0.22; item.add(tea);
          const steam = new THREE.Sprite(M.steam); steam.scale.set(0.7, 1.0, 1); steam.position.y = 0.75; item.add(steam); u.steam = steam;
        } else if (type === 'jalebi') {
          item = new THREE.Mesh(G.jalebi, M.jalebi);
        } else {
          item = new THREE.Group();
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.42, 0.75), M.mithai); item.add(box);
          const lid = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.8), M.mithai); lid.position.y = 0.26; lid.rotation.z = 0.15; item.add(lid);
          const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.2), M.gold); ribbon.position.y = 0.3; item.add(ribbon);
        }
        u.mesh = item; g.add(item);
        const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: ND.tex.label(LABELS[type], '#f2c14e'), transparent: true, depthWrite: false }));
        label.scale.set(1.9, 0.72, 1); label.position.y = 1.05; g.add(label);
        u.baseY = 1.0; u.r = 1.15;
      }
      return g;
    },
    animate(p, dt, t) {
      const u = p.userData;
      u.mesh.rotation.y += dt * (u.type === 'jalebi' ? 2.2 : 3);
      p.position.y = u.baseY + Math.sin(t * 3 + u.phase) * 0.12;
      if (u.steam) { const f = (t * 0.6 + u.phase) % 1; u.steam.position.y = 0.6 + f * 0.5; u.steam.material.opacity = 0.45 * (1 - f); }
      if (u.ring) u.ring.rotation.z += dt;
    }
  };
})();
