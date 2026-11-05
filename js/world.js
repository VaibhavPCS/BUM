/* ============================================================
   world.js : Diwali-night Lucknow street — sky, buildings,
   diyas, lamp posts, torans, rangolis, fireworks
   ============================================================ */
(function () {
  const { rand: R, randInt: RI, pick: PK } = ND.util;
  const C = ND.CFG;
  const FESTIVE = [0xffd23f, 0xff3b3b, 0x3bff7a, 0x3bc9ff, 0xff7ad9, 0xffffff, 0xff8c1a];

  /* ---------------- fireworks ---------------- */
  ND.Fireworks = class Fireworks {
    constructor(scene, n) {
      this.n = n || 2400; this.scene = scene;
      const N = this.n;
      this.pos = new Float32Array(N * 3); this.vel = new Float32Array(N * 3);
      this.col = new Float32Array(N * 3); this.base = new Float32Array(N * 3);
      this.life = new Float32Array(N); this.maxLife = new Float32Array(N);
      for (let i = 0; i < N; i++) this.pos[i * 3 + 1] = -1000;
      this.geo = new THREE.BufferGeometry();
      this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
      this.mat = new THREE.PointsMaterial({ size: 1.4, map: ND.tex.star(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false;
      scene.add(this.points);
      this.cursor = 0;
      // rockets
      this.rockets = []; this.pending = [];
      this.rpos = new Float32Array(24 * 3);
      for (let i = 0; i < 24; i++) this.rpos[i * 3 + 1] = -1000;
      this.rgeo = new THREE.BufferGeometry(); this.rgeo.setAttribute('position', new THREE.BufferAttribute(this.rpos, 3));
      this.rmat = new THREE.PointsMaterial({ size: 1.6, map: ND.tex.star(), color: 0xffe6a8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
      this.rpoints = new THREE.Points(this.rgeo, this.rmat); this.rpoints.frustumCulled = false;
      scene.add(this.rpoints);
      this.autoTimer = 1.5; this.autoRate = [2.2, 5];
      this.onBurst = null;
    }
    burst(x, y, z, color, count, speed) {
      count = count || 150; const c = new THREE.Color(color);
      const sp0 = speed || 13;
      for (let k = 0; k < count; k++) {
        const i = this.cursor; this.cursor = (this.cursor + 1) % this.n;
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        const sp = sp0 * (0.3 + Math.random() * 0.7);
        this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
        this.vel[i * 3] = Math.sin(ph) * Math.cos(th) * sp;
        this.vel[i * 3 + 1] = Math.cos(ph) * sp;
        this.vel[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * sp;
        const white = Math.random() < 0.18, v = 0.75 + Math.random() * 0.35;
        this.base[i * 3] = white ? 1 : c.r * v; this.base[i * 3 + 1] = white ? 1 : c.g * v; this.base[i * 3 + 2] = white ? 1 : c.b * v;
        this.life[i] = this.maxLife[i] = 1.2 + Math.random() * 1.2;
      }
      if (this.onBurst) this.onBurst(x, y, z);
    }
    launch(x, z, color, apex) {
      this.rockets.push({ x, y: 1, z, vy: R(34, 44), color, t: 0, dur: apex || R(1.0, 1.4) });
    }
    volley(n, near) {
      for (let i = 0; i < n; i++) {
        this.pending.push({
          t: i * 0.35,
          x: near ? R(-30, 30) : R(-90, 90),
          z: near ? R(-110, -70) : R(-240, -160),
          color: PK(FESTIVE), apex: near ? R(0.85, 1.1) : undefined
        });
      }
    }
    update(dt, drift) {
      const { pos, vel, col, base, life, maxLife, n } = this;
      for (let k = this.pending.length - 1; k >= 0; k--) {
        const p = this.pending[k]; p.t -= dt;
        if (p.t <= 0) { this.launch(p.x, p.z, p.color, p.apex); this.pending.splice(k, 1); }
      }
      for (let k = this.rockets.length - 1; k >= 0; k--) {
        const r = this.rockets[k];
        r.t += dt; r.y += r.vy * dt; r.vy -= 14 * dt; r.z += drift * dt * 0.15;
        if (r.t >= r.dur) { this.burst(r.x, r.y, r.z, r.color); this.rockets.splice(k, 1); }
      }
      for (let i = 0; i < 24; i++) {
        const r = this.rockets[i];
        if (r) { this.rpos[i * 3] = r.x; this.rpos[i * 3 + 1] = r.y; this.rpos[i * 3 + 2] = r.z; }
        else this.rpos[i * 3 + 1] = -1000;
      }
      this.rgeo.attributes.position.needsUpdate = true;
      const drag = Math.max(0, 1 - 1.15 * dt);
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) continue;
        life[i] -= dt;
        vel[i * 3 + 1] -= 6.5 * dt;
        vel[i * 3] *= drag; vel[i * 3 + 1] *= drag; vel[i * 3 + 2] *= drag;
        pos[i * 3] += vel[i * 3] * dt; pos[i * 3 + 1] += vel[i * 3 + 1] * dt; pos[i * 3 + 2] += vel[i * 3 + 2] * dt + drift * dt * 0.15;
        if (life[i] <= 0) { pos[i * 3 + 1] = -1000; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = 0; continue; }
        const f = life[i] / maxLife[i];
        const tw = f * (0.7 + 0.3 * Math.sin(i * 7.1 + life[i] * 45));
        col[i * 3] = base[i * 3] * tw; col[i * 3 + 1] = base[i * 3 + 1] * tw; col[i * 3 + 2] = base[i * 3 + 2] * tw;
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.color.needsUpdate = true;
      this.autoTimer -= dt;
      if (this.autoTimer <= 0) {
        this.launch(R(-100, 100), R(-250, -170), PK(FESTIVE));
        this.autoTimer = R(this.autoRate[0], this.autoRate[1]);
      }
    }
  };

  /* ---------------- world ---------------- */
  ND.World = class World {
    constructor(scene) {
      this.scene = scene; this.t = 0;
      const T = ND.tex;
      this.T = T;
      this.mats = {
        terracotta: new THREE.MeshStandardMaterial({ color: 0xb5552a, roughness: 0.9 }),
        iron: new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.6, metalness: 0.6 }),
        lamp: new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffd48a, emissiveIntensity: 1.2 }),
        lantern: new THREE.MeshStandardMaterial({ map: T.lantern(), emissive: 0xffffff, emissiveMap: T.lantern(), emissiveIntensity: 0.85, roughness: 0.8 }),
        dome: new THREE.MeshStandardMaterial({ color: 0xe9dcc4, roughness: 0.5, emissive: 0xffa54a, emissiveIntensity: 0.12 }),
        domeGold: new THREE.MeshStandardMaterial({ color: 0xf2c14e, roughness: 0.3, metalness: 0.7, emissive: 0x8a5a10, emissiveIntensity: 0.3 }),
        roof: new THREE.MeshStandardMaterial({ color: 0x1a1020, roughness: 1 }),
        marigold: new THREE.MeshStandardMaterial({ map: T.marigold(), roughness: 0.95, emissive: 0xff6a00, emissiveIntensity: 0.22 }),
        facades: T.facades().map((f) => new THREE.MeshStandardMaterial({ map: f.map, emissive: 0xffffff, emissiveMap: f.emissive, emissiveIntensity: 0.95, roughness: 0.9 }))
      };
      this.geos = {
        bowl: new THREE.CylinderGeometry(0.2, 0.12, 0.13, 8),
        dome: new THREE.SphereGeometry(1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        finial: new THREE.ConeGeometry(0.18, 0.7, 6),
        minaret: new THREE.CylinderGeometry(0.42, 0.5, 1, 8),
        minaretTop: new THREE.SphereGeometry(0.6, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
        pole: new THREE.CylinderGeometry(0.07, 0.1, 4.9, 8),
        poleBase: new THREE.CylinderGeometry(0.22, 0.3, 0.3, 8),
        lamp: new THREE.SphereGeometry(0.22, 10, 8),
        lanternBody: new THREE.CylinderGeometry(0.26, 0.2, 0.62, 6),
        toranPole: new THREE.CylinderGeometry(0.06, 0.09, 5.5, 8),
        rangoli: new THREE.PlaneGeometry(2.6, 2.6)
      };
      this.buildLights();
      this.buildSky();
      this.buildGround();
      this.fireworks = new ND.Fireworks(scene, 2400);
      this.segments = [];
      for (let i = 0; i < C.SEG_COUNT; i++) this.segments.push(this.makeSegment(i));
    }

    buildLights() {
      const s = this.scene;
      s.add(new THREE.HemisphereLight(0xffd9b3, 0x2a1230, 0.6));
      const moon = new THREE.DirectionalLight(0x9fb4ff, 0.55); moon.position.set(-10, 24, -14); s.add(moon);
      this.moon = moon;
      if (ND.shadows) {
        moon.castShadow = true;
        moon.shadow.mapSize.set(2048, 2048);
        const sc = moon.shadow.camera;
        sc.left = -11; sc.right = 11; sc.top = 26; sc.bottom = -16; sc.near = 0.5; sc.far = 90;
        moon.shadow.bias = -0.0012; moon.shadow.normalBias = 0.03;
        moon.target.position.set(0, 0, -8); s.add(moon.target);
      }
      // two pooled flickering diya lights that the game parks on the nearest diya obstacles
      this.diyaLights = [0, 1].map(() => { const l = new THREE.PointLight(0xff9a3c, 0, 7, 2); l.position.set(0, -50, 0); s.add(l); return l; });
      const key = new THREE.PointLight(0xffb067, 1.25, 26, 2); key.position.set(0, 4.2, 3.5); s.add(key);
      const ahead = new THREE.PointLight(0xff8a3c, 0.9, 40, 2); ahead.position.set(0, 2.5, -28); s.add(ahead);
      const far = new THREE.PointLight(0xffa860, 0.6, 60, 2); far.position.set(0, 3, -70); s.add(far);
      this.keyLight = key;
    }

    buildSky() {
      const T = this.T, s = this.scene;
      const sky = new THREE.Mesh(new THREE.SphereGeometry(430, 32, 16), new THREE.MeshBasicMaterial({ map: T.sky(), side: THREE.BackSide, fog: false, depthWrite: false }));
      sky.renderOrder = -10; s.add(sky);
      // stars
      const N = 1500, p = new Float32Array(N * 3), c = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 0.92 + 0.05);
        const r = 400;
        p[i * 3] = Math.sin(ph) * Math.cos(th) * r; p[i * 3 + 1] = Math.cos(ph) * r + 10; p[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r;
        const b = R(0.5, 1), warm = Math.random() < 0.3;
        c[i * 3] = b; c[i * 3 + 1] = b * (warm ? 0.9 : 0.95); c[i * 3 + 2] = b * (warm ? 0.7 : 1);
      }
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3)); sg.setAttribute('color', new THREE.BufferAttribute(c, 3));
      this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.4, sizeAttenuation: false, map: T.star(), vertexColors: true, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
      s.add(this.stars);
      // moon
      const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color: 0xfff0c8, transparent: true, opacity: 0.55, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
      moonGlow.scale.set(90, 90, 1); moonGlow.position.set(-120, 150, -330); s.add(moonGlow);
      const moonCore = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.glow(), color: 0xfff6dc, transparent: true, opacity: 1, fog: false, depthWrite: false }));
      moonCore.scale.set(30, 30, 1); moonCore.position.copy(moonGlow.position); s.add(moonCore);
      // distant skyline
      const sl = new THREE.Mesh(new THREE.PlaneGeometry(560, 140), new THREE.MeshBasicMaterial({ map: T.skyline(), transparent: true, fog: false, depthWrite: false }));
      sl.position.set(0, 52, -305); s.add(sl);
    }

    buildGround() {
      const g = new THREE.Mesh(new THREE.PlaneGeometry(40, 300), new THREE.MeshStandardMaterial({ map: this.T.ground(), roughness: 0.95, metalness: 0.02 }));
      g.rotation.x = -Math.PI / 2; g.position.set(0, 0, -120);
      g.receiveShadow = !!ND.shadows;
      this.ground = g; this.scene.add(g);
    }

    /* ---------- segments ---------- */
    makeSegment(i) {
      const seg = new THREE.Group();
      seg.position.z = 20 - i * C.SEG_LEN;
      seg.userData = { phase: Math.random() * 10, buildings: [], lights: null, rangolis: [], toran: null, lanterns: [], wires: [] };
      this.addDiyas(seg);
      this.addLampPosts(seg);
      this.addToran(seg);
      this.addRangolis(seg);
      this.populate(seg);
      this.scene.add(seg);
      return seg;
    }

    addDiyas(seg) {
      const n = 13, per = n * 2;
      const bowls = new THREE.InstancedMesh(this.geos.bowl, this.mats.terracotta, per);
      const fp = new Float32Array(per * 3), gp = new Float32Array(per * 3);
      const m = new THREE.Matrix4(); let k = 0;
      for (let j = 0; j < n; j++) {
        const z = -1.5 - j * 3;
        for (const x of [-5.15, 5.15]) {
          m.makeTranslation(x, 0.065, z); bowls.setMatrixAt(k, m);
          fp[k * 3] = x; fp[k * 3 + 1] = 0.3; fp[k * 3 + 2] = z;
          gp[k * 3] = x; gp[k * 3 + 1] = 0.22; gp[k * 3 + 2] = z;
          k++;
        }
      }
      bowls.instanceMatrix.needsUpdate = true; seg.add(bowls);
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
      const flames = new THREE.Points(fg, new THREE.PointsMaterial({ size: 0.6, map: this.T.flame(), color: 0xffd9a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.BufferAttribute(gp, 3));
      const glows = new THREE.Points(gg, new THREE.PointsMaterial({ size: 1.7, map: this.T.glow(), color: 0xff9a3c, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending }));
      seg.add(flames); seg.add(glows);
      seg.userData.flames = flames;
    }

    addLampPosts(seg) {
      const z = -C.SEG_LEN / 2;
      for (const side of [-1, 1]) {
        const g = new THREE.Group(); g.position.set(side * 6.4, 0, z);
        const pole = new THREE.Mesh(this.geos.pole, this.mats.iron); pole.position.y = 2.45; g.add(pole);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.08), this.mats.iron); arm.position.set(-side * 0.5, 4.85, 0); g.add(arm);
        const lamp = new THREE.Mesh(this.geos.lamp, this.mats.lamp); lamp.position.set(0, 5.05, 0); g.add(lamp);
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.T.glow(), color: 0xffd48a, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.scale.set(2.6, 2.6, 1); glow.position.set(0, 5.05, 0); g.add(glow);
        // hanging kandil
        const lan = new THREE.Group(); lan.position.set(-side * 1.0, 4.85, 0);
        const body = new THREE.Mesh(this.geos.lanternBody, this.mats.lantern); body.position.y = -0.8; lan.add(body);
        const lglow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.T.glow(), color: 0xff8c3c, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
        lglow.scale.set(1.4, 1.4, 1); lglow.position.y = -0.8; lan.add(lglow);
        lan.userData.phase = Math.random() * 6;
        g.add(lan); seg.userData.lanterns.push(lan);
        seg.add(g);
      }
      // wires with bulbs: kerb wires run to the next lamp post, one wire crosses the road
      const wire = (a, b, n, sag) => {
        const p = [], c = [];
        for (let i = 0; i <= n; i++) {
          const t = i / n, y = a.y + (b.y - a.y) * t - sag * Math.sin(t * Math.PI);
          p.push(a.x + (b.x - a.x) * t, y, a.z + (b.z - a.z) * t);
          const col = new THREE.Color(PK(FESTIVE)); c.push(col.r, col.g, col.b);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(p), 3));
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(c), 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.36, map: this.T.glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        pts.frustumCulled = false; seg.add(pts); seg.userData.wires.push(pts);
      };
      wire(new THREE.Vector3(-6.4, 4.9, z), new THREE.Vector3(-6.4, 4.9, z - C.SEG_LEN), 26, 0.9);
      wire(new THREE.Vector3(6.4, 4.9, z), new THREE.Vector3(6.4, 4.9, z - C.SEG_LEN), 26, 0.9);
      wire(new THREE.Vector3(-6.4, 4.9, z), new THREE.Vector3(6.4, 4.9, z), 18, 0.6);
    }

    addToran(seg) {
      const g = new THREE.Group();
      for (const side of [-1, 1]) {
        const p = new THREE.Mesh(this.geos.toranPole, this.mats.iron); p.position.set(side * 5.95, 2.75, 0); g.add(p);
      }
      const pts = [new THREE.Vector3(-5.95, 5.4, 0), new THREE.Vector3(-3, 4.85, 0), new THREE.Vector3(0, 4.6, 0), new THREE.Vector3(3, 4.85, 0), new THREE.Vector3(5.95, 5.4, 0)];
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.12, 7, false), this.mats.marigold); g.add(tube);
      const lp = new Float32Array(7 * 3), lc = new Float32Array(7 * 3);
      for (let i = 0; i < 7; i++) {
        const t = 0.1 + i * 0.8 / 6, v = curve.getPoint(t);
        lp[i * 3] = v.x; lp[i * 3 + 1] = v.y - 0.5; lp[i * 3 + 2] = 0;
        const col = new THREE.Color(PK(FESTIVE)); lc[i * 3] = col.r; lc[i * 3 + 1] = col.g; lc[i * 3 + 2] = col.b;
      }
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(lp, 3)); lg.setAttribute('color', new THREE.BufferAttribute(lc, 3));
      g.add(new THREE.Points(lg, new THREE.PointsMaterial({ size: 0.9, map: this.T.glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
      seg.add(g); seg.userData.toran = g;
    }

    addRangolis(seg) {
      const tex = this.T.rangolis();
      for (let i = 0; i < 2; i++) {
        const m = new THREE.Mesh(this.geos.rangoli, new THREE.MeshBasicMaterial({ map: tex[i], transparent: true, depthWrite: false }));
        m.rotation.x = -Math.PI / 2; m.position.y = 0.025;
        seg.add(m); seg.userData.rangolis.push(m);
      }
    }

    // (re)randomise the parts that change on each recycle
    populate(seg) {
      const u = seg.userData, tex = this.T.rangolis();
      u.toran.visible = Math.random() < 0.55;
      u.toran.position.z = -R(4, C.SEG_LEN - 4);
      u.rangolis.forEach((m, i) => {
        m.visible = Math.random() < 0.7;
        m.material.map = PK(tex); m.material.needsUpdate = true;
        m.position.set((i === 0 ? -1 : 1) * R(6.6, 7.2), 0.025, -R(2, C.SEG_LEN - 2));
        m.rotation.z = Math.random() * Math.PI;
      });
      // buildings
      u.buildings.forEach((b) => { seg.remove(b); b.traverse((o) => { if (o.geometry && o.userData.own) o.geometry.dispose(); }); });
      u.buildings = [];
      if (u.lights) { seg.remove(u.lights); u.lights.geometry.dispose(); u.lights = null; }
      const lp = [], lc = [];
      for (const side of [-1, 1]) {
        let z = -R(0, 1.5);
        while (z > -C.SEG_LEN + 5) {
          const w = ND.isMobile ? R(10, 17) : R(7, 13), d = R(5, 9), h = R(7, 19);
          if (z - w < -C.SEG_LEN - 1) break;
          const b = this.makeBuilding(w, h, d, side, z - w / 2, lp, lc);
          seg.add(b); u.buildings.push(b);
          z -= w + R(0.6, 2.4);
        }
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
      lg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lc), 3));
      u.lights = new THREE.Points(lg, new THREE.PointsMaterial({ size: 0.42, map: this.T.glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      seg.add(u.lights);
    }

    // BoxGeometry draws one call per face material; regroup the index so the four
    // walls share one group (facade) and top/bottom another (roof): 2 calls, not 6.
    wallBox(w, h, d) {
      const g = new THREE.BoxGeometry(w, h, d);
      const idx = g.index.array, out = new idx.constructor(36);
      let k = 0;
      for (const f of [0, 1, 4, 5, 2, 3]) for (let i = 0; i < 6; i++) out[k++] = idx[f * 6 + i];
      g.setIndex(new THREE.BufferAttribute(out, 1));
      g.clearGroups(); g.addGroup(0, 24, 0); g.addGroup(24, 12, 1);
      return g;
    }

    makeBuilding(w, h, d, side, zc, lp, lc) {
      const g = new THREE.Group();
      const x = side * (8.7 + d / 2);
      const geo = this.wallBox(d, h, w);
      // scale UVs so the facade tiles instead of stretching (faces: +x,-x,+y,-y,+z,-z)
      const uv = geo.attributes.uv;
      for (let f = 0; f < 6; f++) {
        if (f === 2 || f === 3) continue;
        const fw = f < 2 ? w : d, su = fw / 8, sv = h / 16;
        for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * su, uv.getY(k) * sv); }
      }
      uv.needsUpdate = true;
      const fm = PK(this.mats.facades);
      const body = new THREE.Mesh(geo, [fm, this.mats.roof]);
      body.position.set(x, h / 2, zc); body.userData.own = true; g.add(body);
      if (Math.random() < 0.55) {
        const r = Math.min(w, d) * R(0.25, 0.4);
        const dome = new THREE.Mesh(this.geos.dome, Math.random() < 0.3 ? this.mats.domeGold : this.mats.dome);
        dome.scale.setScalar(r); dome.position.set(x, h + 0.3, zc); g.add(dome);
        const fin = new THREE.Mesh(this.geos.finial, this.mats.domeGold); fin.position.set(x, h + 0.3 + r + 0.3, zc); g.add(fin);
      }
      if (Math.random() < (ND.isMobile ? 0.15 : 0.3)) {
        for (const dz of [-w / 2 + 0.6, w / 2 - 0.6]) {
          const mh = R(2.5, 4.5);
          const mn = new THREE.Mesh(this.geos.minaret, this.mats.dome); mn.scale.set(1, mh, 1); mn.position.set(x - side * (d / 2 - 0.6), h + mh / 2, zc + dz); g.add(mn);
          const mt = new THREE.Mesh(this.geos.minaretTop, this.mats.domeGold); mt.position.set(x - side * (d / 2 - 0.6), h + mh, zc + dz); g.add(mt);
        }
      }
      // string lights: road-facing top edge + the two vertical edges
      const fx = x - side * (d / 2 + 0.06);
      const push = (px, py, pz) => { lp.push(px, py, pz); const col = new THREE.Color(PK(FESTIVE)); lc.push(col.r, col.g, col.b); };
      for (let z = zc - w / 2; z <= zc + w / 2; z += 0.6) push(fx, h + 0.15 + Math.sin(z * 2) * 0.12, z);
      for (let y = 0.8; y < h; y += 0.6) { push(fx, y, zc - w / 2 + 0.05); push(fx, y, zc + w / 2 - 0.05); }
      return g;
    }

    recycle(seg) {
      seg.position.z -= C.SEG_LEN * C.SEG_COUNT;
      this.populate(seg);
    }

    update(dt, speed) {
      this.t += dt;
      const t = this.t;
      const map = this.ground.material.map;
      map.offset.y = (map.offset.y + speed * dt / 80) % 1;
      for (const seg of this.segments) {
        seg.position.z += speed * dt;
        if (seg.position.z - C.SEG_LEN > 16) this.recycle(seg);
        const u = seg.userData;
        u.flames.material.size = 0.6 + 0.1 * Math.sin(t * 13 + u.phase) + 0.05 * Math.sin(t * 29 + u.phase * 3);
        if (u.lights) u.lights.material.opacity = 0.78 + 0.22 * Math.sin(t * 4.5 + u.phase);
        for (let w = 0; w < u.wires.length; w++) u.wires[w].material.opacity = 0.7 + 0.3 * Math.sin(t * 5 + u.phase + w * 2);
        for (const lan of u.lanterns) lan.rotation.z = Math.sin(t * 1.4 + lan.userData.phase) * 0.13;
      }
      this.stars.material.opacity = 0.8 + 0.15 * Math.sin(t * 0.7);
      this.fireworks.update(dt, speed);
    }
  };
})();
