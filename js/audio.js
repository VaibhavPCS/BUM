/* ============================================================
   audio.js : WebAudio synthesised SFX + festive background loop
   No audio files — everything is generated at runtime.
   ============================================================ */
ND.audio = (function () {
  const A = {};
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
  let muted = !!ND.store.get('nd_muted', false);
  const music = { on: false, timer: null, next: 0, step: 0, tempo: 1, drone: [] };

  const BPM = 124, STEPS = 32;
  // C major pentatonic, two octaves (G4 below as the "drop" note)
  const NOTE = { G4: 392.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, D6: 1174.66, E6: 1318.51 };
  // 32 steps (16th notes) over two bars. null = rest
  const MELODY = [
    'C5', null, 'E5', null, 'G5', null, 'E5', null, 'A5', null, 'G5', null, 'E5', null, 'D5', null,
    'C5', null, 'D5', null, 'E5', null, 'G5', null, 'A5', null, 'C6', null, 'A5', null, 'G5', 'E5'
  ];
  const MELODY_B = [
    'E5', null, 'G5', null, 'A5', null, 'C6', null, 'A5', null, 'G5', null, 'E5', null, 'D5', 'C5',
    'G4', null, 'C5', null, 'D5', null, 'E5', null, 'G5', null, 'E5', null, 'D5', null, 'C5', null
  ];
  const DHOL = [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1];
  const TAK  = [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.4; musicBus.connect(master);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function env(g, t0, a, peak, d) {
    g.gain.cancelScheduledValues(t0);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
  }

  // o = { f, f2, type, g, a, d, when, dest, t0 }
  function tone(o) {
    if (!ensure()) return;
    const t0 = o.t0 !== undefined ? o.t0 : ctx.currentTime + (o.when || 0);
    const a = o.a || 0.005, d = o.d || 0.2;
    const osc = ctx.createOscillator();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + a + d);
    const g = ctx.createGain(); env(g, t0, a, o.g || 0.3, d);
    osc.connect(g); g.connect(o.dest || sfxBus);
    osc.start(t0); osc.stop(t0 + a + d + 0.05);
  }

  // o = { f, f2, q, type(filter), g, a, d, when, dest, t0 }
  function noise(o) {
    if (!ensure()) return;
    const t0 = o.t0 !== undefined ? o.t0 : ctx.currentTime + (o.when || 0);
    const a = o.a || 0.005, d = o.d || 0.2;
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    src.playbackRate.value = o.rate || 1;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1500, t0);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + a + d);
    f.Q.value = o.q || 0.8;
    const g = ctx.createGain(); env(g, t0, a, o.g || 0.2, d);
    src.connect(f); f.connect(g); g.connect(o.dest || sfxBus);
    src.start(t0, Math.random() * 0.5); src.stop(t0 + a + d + 0.05);
  }

  function pluck(freq, t0, gain) {
    const o1 = ctx.createOscillator(); o1.type = 'triangle'; o1.frequency.value = freq;
    const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = freq * 1.004;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3200, t0);
    lp.frequency.exponentialRampToValueAtTime(700, t0 + 0.3);
    const g1 = ctx.createGain(), g2 = ctx.createGain();
    env(g1, t0, 0.004, gain, 0.32); env(g2, t0, 0.004, gain * 0.25, 0.22);
    o1.connect(g1); o2.connect(g2); g1.connect(lp); g2.connect(lp); lp.connect(musicBus);
    o1.start(t0); o2.start(t0); o1.stop(t0 + 0.4); o2.stop(t0 + 0.3);
  }

  /* ---------------- SFX ---------------- */
  const PICK = [NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.D6, NOTE.E6];
  A.sfx = {
    pickup(n) {
      const f = PICK[(n || 0) % PICK.length];
      tone({ f, type: 'triangle', d: 0.14, g: 0.22 });
      tone({ f: f * 2, type: 'sine', d: 0.1, g: 0.06, when: 0.02 });
    },
    golden() {
      [NOTE.G5, NOTE.C6, NOTE.E6, 1568].forEach((f, i) => tone({ f, type: 'triangle', d: 0.25, g: 0.2, when: i * 0.07 }));
      noise({ f: 6000, q: 1.5, d: 0.35, g: 0.08, when: 0.1 });
    },
    jump() {
      noise({ f: 500, f2: 1900, d: 0.22, g: 0.14 });
      tone({ f: 280, f2: 620, type: 'sine', d: 0.18, g: 0.07 });
    },
    land() { tone({ f: 110, f2: 70, type: 'sine', d: 0.09, g: 0.12 }); },
    slide() { noise({ f: 1100, f2: 300, type: 'lowpass', d: 0.32, g: 0.16 }); },
    hit() {
      tone({ f: 95, f2: 32, type: 'sine', d: 0.4, g: 0.7 });
      noise({ f: 700, f2: 120, type: 'lowpass', d: 0.32, g: 0.4 });
      tone({ f: 210, type: 'square', d: 0.08, g: 0.08 });
    },
    power() {
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach((f, i) => {
        tone({ f, type: 'square', d: 0.16, g: 0.07, when: i * 0.06 });
        tone({ f: f * 2, type: 'sine', d: 0.2, g: 0.05, when: i * 0.06 });
      });
    },
    powerEnd() { tone({ f: NOTE.E5, f2: NOTE.C5, type: 'triangle', d: 0.25, g: 0.1 }); },
    shieldHit() {
      tone({ f: 1400, f2: 300, type: 'sawtooth', d: 0.22, g: 0.14 });
      noise({ f: 2500, f2: 400, d: 0.25, g: 0.2 });
    },
    nearMiss() { noise({ f: 2600, f2: 900, type: 'highpass', d: 0.12, g: 0.1 }); },
    whoosh() { noise({ f: 900, f2: 2600, d: 0.16, g: 0.1 }); },
    whistle(dur) { tone({ f: 500, f2: 1900, type: 'sine', d: dur || 0.9, g: 0.035 }); },
    boom(far) {
      const g = far ? 0.22 : 0.45;
      noise({ f: 320, f2: 70, type: 'lowpass', d: 0.65, g });
      tone({ f: 75, f2: 28, type: 'sine', d: 0.5, g: g * 0.8 });
      for (let i = 0; i < 6; i++) noise({ f: 3000 + Math.random() * 3000, q: 2, d: 0.05, g: g * 0.18, when: 0.1 + Math.random() * 0.6 });
    },
    firework(delay) {
      const w = delay || 0;
      tone({ f: 500, f2: 1900, type: 'sine', d: 0.5, g: 0.04, when: w });
      noise({ f: 320, f2: 70, type: 'lowpass', d: 0.65, g: 0.45, when: w + 0.55 });
      tone({ f: 75, f2: 28, type: 'sine', d: 0.5, g: 0.35, when: w + 0.55 });
      for (let i = 0; i < 7; i++) noise({ f: 3000 + Math.random() * 3000, q: 2, d: 0.05, g: 0.08, when: w + 0.65 + Math.random() * 0.6 });
    },
    milestone() {
      [NOTE.C6, NOTE.E6, 1568, 2093].forEach((f, i) => tone({ f, type: 'sine', d: 0.5, g: 0.16, when: i * 0.11 }));
    },
    click() { tone({ f: 900, type: 'square', d: 0.04, g: 0.04 }); },
    start() { [NOTE.C5, NOTE.G5, NOTE.C6].forEach((f, i) => tone({ f, type: 'triangle', d: 0.22, g: 0.16, when: i * 0.09 })); },
    gameOver() {
      [NOTE.G5, NOTE.E5, NOTE.C5, NOTE.G4].forEach((f, i) => tone({ f, type: 'triangle', d: 0.4, g: 0.16, when: 0.2 + i * 0.19 }));
    }
  };

  /* ---------------- music ---------------- */
  function playStep(step, t0) {
    const bar = Math.floor(music.step / STEPS) % 2;
    const mel = bar === 0 ? MELODY : MELODY_B;
    const n = mel[step];
    if (n) pluck(NOTE[n], t0, 0.16);
    if (DHOL[step]) {
      tone({ f: 165, f2: 46, type: 'sine', a: 0.003, d: 0.24, g: 0.8, t0, dest: musicBus });
      noise({ f: 260, type: 'lowpass', d: 0.08, g: 0.25, t0, dest: musicBus });
    }
    if (TAK[step]) {
      noise({ f: 3400, q: 2.5, d: 0.05, g: 0.22, t0, dest: musicBus });
      tone({ f: 1900, f2: 900, type: 'sine', d: 0.035, g: 0.05, t0, dest: musicBus });
    }
  }

  function schedule() {
    if (!music.on || !ctx) return;
    const stepDur = (60 / BPM / 4) / music.tempo;
    while (music.next < ctx.currentTime + 0.14) {
      playStep(music.step % STEPS, music.next);
      music.next += stepDur;
      music.step++;
    }
  }

  function startDrone() {
    stopDrone();
    [[130.81, 'triangle', 0.05], [196.0, 'triangle', 0.035], [261.63, 'sine', 0.02]].forEach(([f, type, g]) => {
      const o = ctx.createOscillator(); o.type = type; o.frequency.value = f;
      const o2 = ctx.createOscillator(); o2.type = type; o2.frequency.value = f * 1.0035;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650;
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(g, ctx.currentTime + 2.5);
      o.connect(lp); o2.connect(lp); lp.connect(gain); gain.connect(musicBus);
      o.start(); o2.start();
      music.drone.push({ o, o2, gain });
    });
  }
  function stopDrone() {
    music.drone.forEach(({ o, o2, gain }) => {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        o.stop(ctx.currentTime + 0.7); o2.stop(ctx.currentTime + 0.7);
      } catch (e) { /* already stopped */ }
    });
    music.drone = [];
  }

  A.music = {
    start() {
      if (!ensure()) return;
      if (music.on) return;
      music.on = true; music.step = 0; music.next = ctx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(0.4, ctx.currentTime);
      startDrone();
      music.timer = setInterval(schedule, 30);
    },
    stop() {
      if (!music.on) return;
      music.on = false;
      clearInterval(music.timer); music.timer = null;
      stopDrone();
    },
    setTempo(t) { music.tempo = t; },
    duck(on) {
      if (!ctx) return;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(on ? 0.12 : 0.4, ctx.currentTime + 0.3);
    },
    get running() { return music.on; }
  };

  A.unlock = function () { ensure(); };
  A.setMuted = function (m) {
    muted = !!m; ND.store.set('nd_muted', muted);
    if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  };
  A.toggle = function () { A.setMuted(!muted); return muted; };
  A.isMuted = () => muted;
  return A;
})();
