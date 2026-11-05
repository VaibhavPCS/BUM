/* ============================================================
   textures.js : every texture is drawn on a canvas at runtime
   (no image assets needed, works offline, tiny download)
   ============================================================ */
ND.tex = (function () {
  const T = {};
  const cache = {};
  const { rand: R, randInt: RI, pick: PK } = ND.util;
  const DISPLAY = '"Cinzel Decorative", "Cinzel", Georgia, serif';
  const BODY = '"Baloo 2", "Segoe UI", Roboto, sans-serif';

  function mk(w, h) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    return [c, c.getContext('2d')];
  }
  function toTex(c, opt) {
    opt = opt || {};
    const t = new THREE.CanvasTexture(c);
    t.encoding = opt.linear ? THREE.LinearEncoding : THREE.sRGBEncoding;
    if (opt.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(opt.repeat[0], opt.repeat[1]); }
    t.anisotropy = opt.aniso || 4;
    t.needsUpdate = true;
    return t;
  }
  function roundRect(x, px, py, w, h, r) {
    x.beginPath();
    x.moveTo(px + r, py); x.lineTo(px + w - r, py); x.quadraticCurveTo(px + w, py, px + w, py + r);
    x.lineTo(px + w, py + h - r); x.quadraticCurveTo(px + w, py + h, px + w - r, py + h);
    x.lineTo(px + r, py + h); x.quadraticCurveTo(px, py + h, px, py + h - r);
    x.lineTo(px, py + r); x.quadraticCurveTo(px, py, px + r, py); x.closePath();
  }
  function diamond(x, cx, cy, s, col) {
    x.fillStyle = col; x.beginPath();
    x.moveTo(cx, cy - s); x.lineTo(cx + s, cy); x.lineTo(cx, cy + s); x.lineTo(cx - s, cy); x.closePath(); x.fill();
  }
  function bulb(x, bx, by, r, col) {
    const g = x.createRadialGradient(bx, by, 0, bx, by, r * 3);
    g.addColorStop(0, col); g.addColorStop(0.35, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.beginPath(); x.arc(bx, by, r * 3, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#fff'; x.beginPath(); x.arc(bx, by, r * 0.45, 0, Math.PI * 2); x.fill();
  }
  // Awadhi pointed / cusped arch window
  function archPath(x, wx, wy, ww, wh) {
    const cx = wx + ww / 2, archH = ww * 0.55;
    x.beginPath();
    x.moveTo(wx, wy + wh); x.lineTo(wx, wy + archH);
    x.quadraticCurveTo(wx, wy + archH * 0.25, wx + ww * 0.25, wy + archH * 0.2);
    x.quadraticCurveTo(cx - ww * 0.08, wy + archH * 0.1, cx, wy);
    x.quadraticCurveTo(cx + ww * 0.08, wy + archH * 0.1, wx + ww * 0.75, wy + archH * 0.2);
    x.quadraticCurveTo(wx + ww, wy + archH * 0.25, wx + ww, wy + archH);
    x.lineTo(wx + ww, wy + wh); x.closePath();
  }
  function diyaIcon(x, cx, cy, s) {
    // bowl
    x.fillStyle = '#c0582c'; x.beginPath();
    x.moveTo(cx - s, cy); x.quadraticCurveTo(cx, cy + s * 1.1, cx + s, cy); x.closePath(); x.fill();
    x.fillStyle = '#e8743f'; x.beginPath(); x.ellipse(cx, cy, s, s * 0.28, 0, 0, Math.PI * 2); x.fill();
    // flame
    const g = x.createRadialGradient(cx, cy - s * 0.55, 1, cx, cy - s * 0.55, s * 0.9);
    g.addColorStop(0, '#fff6c2'); g.addColorStop(0.4, '#ffb347'); g.addColorStop(1, 'rgba(255,120,30,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(cx, cy - s * 0.55, s * 0.5, s * 0.85, 0, 0, Math.PI * 2); x.fill();
  }

  /* ---------- ground: 40 x 80 world units ---------- */
  T.ground = function () {
    if (cache.ground) return cache.ground;
    const W = 1024, H = 2048, ppu = W / 40, cx = W / 2;
    const [c, x] = mk(W, H);
    x.fillStyle = '#2b1e2c'; x.fillRect(0, 0, W, H);
    const tile = ppu * 2;
    for (let i = 0; i < 700; i++) {
      x.fillStyle = `rgba(${RI(0, 60)},${RI(0, 25)},${RI(0, 45)},${R(0.05, 0.22)})`;
      x.fillRect(RI(0, 19) * tile, RI(0, 39) * tile, tile, tile);
    }
    x.strokeStyle = 'rgba(0,0,0,0.4)'; x.lineWidth = 2;
    for (let yy = 0; yy <= H; yy += tile) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
    for (let xx = 0; xx <= W; xx += tile) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H); x.stroke(); }
    // road
    const rw = 9 * ppu;
    x.fillStyle = '#16131d'; x.fillRect(cx - rw / 2, 0, rw, H);
    for (let i = 0; i < 9000; i++) {
      x.fillStyle = `rgba(255,255,255,${R(0.02, 0.08)})`;
      x.fillRect(cx - rw / 2 + R(0, rw), R(0, H), 2, 2);
    }
    // worn wheel tracks
    x.fillStyle = 'rgba(0,0,0,0.25)';
    for (const lx of [-2.7, 0, 2.7]) {
      x.fillRect(cx + (lx - 0.9) * ppu, 0, ppu * 0.5, H);
      x.fillRect(cx + (lx + 0.4) * ppu, 0, ppu * 0.5, H);
    }
    // kerbs
    const kw = ppu * 0.38;
    x.fillStyle = '#6e5330';
    x.fillRect(cx - rw / 2 - kw, 0, kw, H); x.fillRect(cx + rw / 2, 0, kw, H);
    x.fillStyle = '#a57d3e';
    x.fillRect(cx - rw / 2 - kw, 0, 5, H); x.fillRect(cx + rw / 2 + kw - 5, 0, 5, H);
    // dashed lane dividers
    x.strokeStyle = 'rgba(242,193,78,0.38)'; x.lineWidth = 3; x.setLineDash([ppu * 1.4, ppu * 1.2]);
    for (const lx of [-1.35, 1.35]) { x.beginPath(); x.moveTo(cx + lx * ppu, 0); x.lineTo(cx + lx * ppu, H); x.stroke(); }
    x.setLineDash([]);
    // rangoli dots border on both pavements
    const cols = ['#ff7a1a', '#f2c14e', '#e63946', '#2bb673', '#ffffff'];
    let k = 0;
    for (let yy = ppu; yy < H; yy += ppu * 2, k++) {
      for (const sx of [cx - rw / 2 - ppu * 1.35, cx + rw / 2 + ppu * 1.35]) {
        diamond(x, sx, yy, ppu * 0.42, cols[k % cols.length]);
        x.fillStyle = 'rgba(255,255,255,0.7)'; x.beginPath(); x.arc(sx, yy, ppu * 0.1, 0, Math.PI * 2); x.fill();
      }
    }
    cache.ground = toTex(c, { repeat: [1, 300 / 80], aniso: 8 });
    return cache.ground;
  };

  /* ---------- rangoli mandalas ---------- */
  T.rangolis = function () {
    if (cache.rangolis) return cache.rangolis;
    const pals = [
      ['#ff6a00', '#ffd23f', '#e8336d', '#2bb673', '#ffffff'],
      ['#d7263d', '#f9c80e', '#f86624', '#43bccd', '#ffffff'],
      ['#8e44ad', '#f1c40f', '#e74c3c', '#1abc9c', '#ffffff'],
      ['#ff3f8e', '#ffb703', '#8ecae6', '#06d6a0', '#ffffff']
    ];
    cache.rangolis = pals.map((pal) => {
      const S = 256, [c, x] = mk(S, S);
      x.translate(S / 2, S / 2);
      for (let ring = 5; ring >= 0; ring--) {
        const r = 18 + ring * 17;
        const petals = 8 + ring * 2;
        x.fillStyle = pal[ring % pal.length];
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 + ring * 0.2;
          x.beginPath(); x.ellipse(Math.cos(a) * r, Math.sin(a) * r, 8 + ring * 1.6, 4.5 + ring * 0.9, a, 0, Math.PI * 2); x.fill();
        }
        x.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < petals; i++) {
          const a = (i / petals) * Math.PI * 2 + ring * 0.2 + Math.PI / petals;
          x.beginPath(); x.arc(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8), 2.2, 0, Math.PI * 2); x.fill();
        }
      }
      x.fillStyle = pal[1]; x.beginPath(); x.arc(0, 0, 16, 0, Math.PI * 2); x.fill();
      x.fillStyle = pal[0]; x.beginPath(); x.arc(0, 0, 8, 0, Math.PI * 2); x.fill();
      return toTex(c);
    });
    return cache.rangolis;
  };

  /* ---------- building facades (map + emissive) ---------- */
  T.facades = function () {
    if (cache.facades) return cache.facades;
    const bases = ['#cdb68c', '#b98c8e', '#8fa9a0', '#c5b15b', '#a8899c', '#9d7f6a'];
    cache.facades = bases.map((base) => {
      const W = 512, H = 1024, [c, x] = mk(W, H), [e, ex] = mk(W, H);
      x.fillStyle = base; x.fillRect(0, 0, W, H);
      x.fillStyle = 'rgba(12,6,30,0.5)'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(0,0,0,${R(0.03, 0.12)})`; x.fillRect(R(0, W), R(0, H), R(4, 40), R(2, 6)); }
      ex.fillStyle = '#000'; ex.fillRect(0, 0, W, H);
      const floors = 4, cols = 3, fh = H / floors, cw = W / cols;
      for (let f = 0; f < floors; f++) {
        for (let k = 0; k < cols; k++) {
          const wx = k * cw + cw * 0.24, wy = f * fh + fh * 0.22, ww = cw * 0.52, wh = fh * 0.52;
          const lit = Math.random() < 0.72;
          const col = lit ? PK(['#ffd27a', '#ffb347', '#ffe9b3', '#ff9a5c', '#ffcf5e']) : '#1b1426';
          archPath(x, wx, wy, ww, wh); x.fillStyle = col; x.fill();
          x.lineWidth = 7; x.strokeStyle = 'rgba(55,30,20,0.95)'; x.stroke();
          if (lit) {
            archPath(ex, wx, wy, ww, wh); ex.fillStyle = col; ex.fill();
            x.strokeStyle = 'rgba(60,35,20,0.7)'; x.lineWidth = 3; x.beginPath();
            x.moveTo(wx + ww / 2, wy + ww * 0.3); x.lineTo(wx + ww / 2, wy + wh);
            x.moveTo(wx, wy + wh * 0.58); x.lineTo(wx + ww, wy + wh * 0.58); x.stroke();
            ex.strokeStyle = 'rgba(0,0,0,0.6)'; ex.lineWidth = 3; ex.beginPath();
            ex.moveTo(wx + ww / 2, wy + ww * 0.3); ex.lineTo(wx + ww / 2, wy + wh);
            ex.moveTo(wx, wy + wh * 0.58); ex.lineTo(wx + ww, wy + wh * 0.58); ex.stroke();
          }
          // balcony ledge
          x.fillStyle = 'rgba(35,20,30,0.85)'; x.fillRect(wx - 12, wy + wh + 4, ww + 24, 9);
          x.fillStyle = 'rgba(255,230,180,0.12)'; x.fillRect(wx - 12, wy + wh + 2, ww + 24, 2);
        }
        // cornice
        x.fillStyle = 'rgba(255,230,180,0.16)'; x.fillRect(0, f * fh - 5, W, 10);
        x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, f * fh + 5, W, 4);
        // string lights
        const yy = f * fh + 16;
        x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, yy - 7); x.lineTo(W, yy - 7); x.stroke();
        for (let bx = 14; bx < W; bx += 30) {
          const col = PK(['#ff3b3b', '#ffd23f', '#3bff7a', '#3bc9ff', '#ff7ad9', '#ffffff', '#ff8c1a']);
          bulb(x, bx, yy, 4.5, col); bulb(ex, bx, yy, 4.5, col);
        }
      }
      return { map: toTex(c, { repeat: [1, 1] }), emissive: toTex(e, { repeat: [1, 1] }) };
    });
    return cache.facades;
  };

  /* ---------- samosa skin ---------- */
  T.samosa = function (golden) {
    const key = golden ? 'samosaG' : 'samosa';
    if (cache[key]) return cache[key];
    const [c, x] = mk(256, 256);
    const g = x.createRadialGradient(105, 95, 10, 128, 128, 175);
    if (golden) { g.addColorStop(0, '#fff4c2'); g.addColorStop(0.5, '#f2c14e'); g.addColorStop(1, '#a8740f'); }
    else { g.addColorStop(0, '#ecb257'); g.addColorStop(0.55, '#cd842c'); g.addColorStop(1, '#7e4210'); }
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 220; i++) {
      x.fillStyle = golden ? `rgba(255,240,160,${R(0.15, 0.45)})` : `rgba(110,55,15,${R(0.15, 0.45)})`;
      x.beginPath(); x.arc(R(0, 256), R(0, 256), R(2, 7), 0, Math.PI * 2); x.fill();
    }
    for (let i = 0; i < 70; i++) {
      x.fillStyle = `rgba(255,235,180,${R(0.1, 0.3)})`;
      x.beginPath(); x.arc(R(0, 256), R(0, 256), R(1, 4), 0, Math.PI * 2); x.fill();
    }
    cache[key] = toTex(c);
    return cache[key];
  };

  /* ---------- banner cloth ---------- */
  T.banner = function (text) {
    const key = 'banner:' + text;
    if (cache[key]) return cache[key];
    const W = 1024, H = 256, [c, x] = mk(W, H);
    const g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8f1f36'); g.addColorStop(0.5, '#6d1327'); g.addColorStop(1, '#8f1f36');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,0.05)';
    for (let i = 0; i < W; i += 24) for (let j = 0; j < H; j += 24) if ((i + j) % 48 === 0) diamond(x, i, j, 7, 'rgba(255,210,120,0.12)');
    x.strokeStyle = '#f2c14e'; x.lineWidth = 12; x.strokeRect(16, 16, W - 32, H - 32);
    x.lineWidth = 3; x.strokeRect(36, 36, W - 72, H - 72);
    x.fillStyle = '#ffe6a8'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 10;
    let size = 104; x.font = `900 ${size}px ${DISPLAY}`;
    while (x.measureText(text).width > W - 300 && size > 40) { size -= 6; x.font = `900 ${size}px ${DISPLAY}`; }
    x.fillText(text, W / 2, H / 2 + 6);
    x.shadowBlur = 0;
    diyaIcon(x, 100, 128, 34); diyaIcon(x, W - 100, 128, 34);
    cache[key] = toTex(c);
    return cache[key];
  };

  /* ---------- Nawabi turban + circular photo sprite ---------- */
  function turbanBack(x, cx, cy, r) {
    const top = cy - r;
    const grad = x.createLinearGradient(cx - r, top, cx + r, top + r * 0.6);
    grad.addColorStop(0, '#5a1222'); grad.addColorStop(0.5, '#9a2540'); grad.addColorStop(1, '#5a1222');
    x.fillStyle = grad;
    x.beginPath(); x.ellipse(cx, top + r * 0.3, r * 1.16, r * 0.6, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(cx - r * 0.6, top + r * 0.5, r * 0.55, r * 0.32, -0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(cx + r * 0.6, top + r * 0.5, r * 0.55, r * 0.32, 0.4, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(cx, top + r * 0.02, r * 0.6, r * 0.36, 0, 0, Math.PI * 2); x.fill();
    // fold lines
    x.strokeStyle = 'rgba(255,200,140,0.18)'; x.lineWidth = r * 0.035;
    for (let i = -2; i <= 2; i++) { x.beginPath(); x.ellipse(cx, top + r * 0.3 + i * r * 0.08, r * (1.05 - Math.abs(i) * 0.08), r * 0.32, 0, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
  }
  function turbanFront(x, cx, cy, r) {
    const top = cy - r;
    // cap covering the top of the head circle
    const chordY = top + r * 0.42;
    const half = Math.sqrt(Math.max(0, r * r - (chordY - cy) * (chordY - cy)));
    const grad = x.createLinearGradient(cx - r, top, cx + r, chordY);
    grad.addColorStop(0, '#6a1628'); grad.addColorStop(0.5, '#a52a48'); grad.addColorStop(1, '#6a1628');
    x.fillStyle = grad;
    x.beginPath();
    x.moveTo(cx - half - r * 0.12, chordY);
    x.quadraticCurveTo(cx, chordY + r * 0.16, cx + half + r * 0.12, chordY);
    x.quadraticCurveTo(cx + r * 1.0, top + r * 0.05, cx, top - r * 0.08);
    x.quadraticCurveTo(cx - r * 1.0, top + r * 0.05, cx - half - r * 0.12, chordY);
    x.closePath(); x.fill();
    // gold band
    x.strokeStyle = '#f2c14e'; x.lineWidth = r * 0.1;
    x.beginPath(); x.moveTo(cx - half - r * 0.1, chordY - r * 0.02);
    x.quadraticCurveTo(cx, chordY + r * 0.12, cx + half + r * 0.1, chordY - r * 0.02); x.stroke();
    x.strokeStyle = '#ffe6a8'; x.lineWidth = r * 0.025;
    x.beginPath(); x.moveTo(cx - half - r * 0.1, chordY - r * 0.07);
    x.quadraticCurveTo(cx, chordY + r * 0.07, cx + half + r * 0.1, chordY - r * 0.07); x.stroke();
    // kalgi: jewel + plume
    x.strokeStyle = '#ffe6a8'; x.lineWidth = r * 0.045; x.lineCap = 'round';
    x.beginPath(); x.moveTo(cx + r * 0.05, top - r * 0.02);
    x.quadraticCurveTo(cx + r * 0.3, top - r * 0.35, cx + r * 0.12, top - r * 0.62); x.stroke();
    x.fillStyle = '#f2c14e'; x.beginPath(); x.arc(cx + r * 0.05, top + r * 0.02, r * 0.13, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#17a77a'; x.beginPath(); x.arc(cx + r * 0.05, top + r * 0.02, r * 0.07, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.arc(cx + r * 0.02, top - r * 0.01, r * 0.025, 0, Math.PI * 2); x.fill();
  }

  // src: square canvas/image. Returns a sprite texture (circle photo, gold ring, turban)
  T.faceSprite = function (src, opts) {
    opts = opts || {};
    const S = 512, [c, x] = mk(S, S);
    const cx = S / 2, cy = S / 2 + 46, r = 178;
    x.clearRect(0, 0, S, S);
    if (opts.turban !== false) turbanBack(x, cx, cy, r);
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.closePath(); x.clip();
    x.fillStyle = '#3a1a24'; x.fillRect(cx - r, cy - r, 2 * r, 2 * r);
    try { x.drawImage(src, cx - r, cy - r, 2 * r, 2 * r); } catch (e) { /* tainted/invalid */ }
    x.restore();
    x.lineWidth = 14; x.strokeStyle = '#6a1628'; x.beginPath(); x.arc(cx, cy, r + 5, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 9; x.strokeStyle = '#f2c14e'; x.beginPath(); x.arc(cx, cy, r + 15, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 2; x.strokeStyle = '#ffe6a8'; x.beginPath(); x.arc(cx, cy, r + 21, 0, Math.PI * 2); x.stroke();
    if (opts.turban !== false) turbanFront(x, cx, cy, r);
    return toTex(c);
  };

  /* ---------- default founder placeholder (monogram) ---------- */
  T.monogram = function (initials, name, sub) {
    initials = initials || 'PCS'; name = name || 'Prakash Chand Srivastava'; sub = sub || 'Founder · Team PCS';
    const S = 512, [c, x] = mk(S, S);
    const g = x.createRadialGradient(256, 190, 20, 256, 256, 380);
    g.addColorStop(0, '#a12b45'); g.addColorStop(0.6, '#5c1226'); g.addColorStop(1, '#2d0810');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) for (let j = 0; j < 40; j++) if ((i + j) % 2 === 0) diamond(x, i * 13 + 6, j * 13 + 6, 3, 'rgba(255,210,120,0.07)');
    x.strokeStyle = '#f2c14e'; x.lineWidth = 10; roundRect(x, 24, 24, 464, 464, 44); x.stroke();
    x.lineWidth = 3; roundRect(x, 44, 44, 424, 424, 34); x.stroke();
    [[44, 44], [468, 44], [44, 468], [468, 468]].forEach(([px, py]) => diamond(x, px, py, 16, '#f2c14e'));
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(0,0,0,0.55)'; x.shadowBlur = 14;
    x.fillStyle = '#ffe6a8'; x.font = `900 ${initials.length > 3 ? 110 : 150}px ${DISPLAY}`;
    x.fillText(initials, 256, 205);
    x.shadowBlur = 0;
    x.fillStyle = '#f2c14e'; x.font = `800 34px ${BODY}`;
    let size = 34; while (x.measureText(name).width > 400 && size > 20) { size -= 2; x.font = `800 ${size}px ${BODY}`; }
    x.fillText(name, 256, 330);
    x.fillStyle = '#ffd9a8'; x.font = `600 26px ${BODY}`; x.fillText(sub, 256, 372);
    diyaIcon(x, 256, 432, 26);
    return c;
  };

  /* ---------- cartoon Nawab face (runner when the photo is on hurdles) ---------- */
  T.cartoonNawab = function () {
    if (cache.nawab) return cache.nawab;
    const S = 512, [c, x] = mk(S, S);
    const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#f7d9a8'); g.addColorStop(1, '#e0ab6a');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.fillStyle = '#e9b97f'; x.beginPath(); x.ellipse(256, 270, 190, 215, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#d9a46a'; x.beginPath(); x.ellipse(70, 270, 34, 50, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(442, 270, 34, 50, 0, 0, Math.PI * 2); x.fill();
    // eyes
    [[180, 240], [332, 240]].forEach(([ex, ey]) => {
      x.fillStyle = '#fff'; x.beginPath(); x.ellipse(ex, ey, 44, 30, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#2a1a1a'; x.beginPath(); x.arc(ex + 6, ey + 2, 17, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 12, ey - 6, 6, 0, Math.PI * 2); x.fill();
      x.strokeStyle = '#3a2416'; x.lineWidth = 12; x.lineCap = 'round';
      x.beginPath(); x.moveTo(ex - 46, ey - 52); x.quadraticCurveTo(ex, ey - 78, ex + 46, ey - 54); x.stroke();
    });
    // nose
    x.strokeStyle = '#b8814e'; x.lineWidth = 8; x.beginPath(); x.moveTo(256, 262); x.quadraticCurveTo(238, 320, 266, 322); x.stroke();
    // mustache
    x.fillStyle = '#2b1a12';
    x.beginPath(); x.moveTo(256, 350);
    x.bezierCurveTo(200, 320, 150, 330, 120, 300);
    x.bezierCurveTo(130, 350, 190, 372, 256, 368); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(256, 350);
    x.bezierCurveTo(312, 320, 362, 330, 392, 300);
    x.bezierCurveTo(382, 350, 322, 372, 256, 368); x.closePath(); x.fill();
    // smile
    x.strokeStyle = '#8a3b2b'; x.lineWidth = 9; x.beginPath(); x.moveTo(200, 392); x.quadraticCurveTo(256, 440, 312, 392); x.stroke();
    cache.nawab = c;
    return c;
  };

  /* ---------- sprites: glow, flame, star, shadow ---------- */
  function radial(size, stops) {
    const [c, x] = mk(size, size);
    const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    return c;
  }
  T.glow = () => cache.glow || (cache.glow = toTex(radial(128, [[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,0.55)'], [0.6, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']])));
  T.star = () => cache.star || (cache.star = toTex(radial(32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.6)'], [1, 'rgba(255,255,255,0)']])));
  T.shadow = () => cache.shadow || (cache.shadow = toTex(radial(128, [[0, 'rgba(0,0,0,0.6)'], [0.5, 'rgba(0,0,0,0.35)'], [1, 'rgba(0,0,0,0)']])));
  T.flame = function () {
    if (cache.flame) return cache.flame;
    const [c, x] = mk(128, 128);
    const g = x.createRadialGradient(64, 88, 2, 64, 72, 46);
    g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.3, 'rgba(255,214,110,1)');
    g.addColorStop(0.6, 'rgba(255,130,40,0.75)'); g.addColorStop(1, 'rgba(255,80,20,0)');
    x.fillStyle = g;
    x.beginPath(); x.moveTo(64, 4); x.bezierCurveTo(96, 50, 98, 100, 64, 124); x.bezierCurveTo(30, 100, 32, 50, 64, 4); x.closePath(); x.fill();
    cache.flame = toTex(c);
    return cache.flame;
  };

  /* ---------- floating text ---------- */
  T.text = function (str, color) {
    const key = 'txt:' + str + color;
    if (cache[key]) return cache[key];
    const [c, x] = mk(256, 128);
    x.font = `800 60px ${BODY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.lineWidth = 10; x.strokeStyle = 'rgba(20,5,20,0.9)'; x.lineJoin = 'round';
    x.strokeText(str, 128, 64); x.fillStyle = color || '#ffe6a8'; x.fillText(str, 128, 64);
    cache[key] = toTex(c);
    return cache[key];
  };
  T.label = function (str, color, bg) {
    const key = 'lbl:' + str + color + bg;
    if (cache[key]) return cache[key];
    const [c, x] = mk(256, 96);
    roundRect(x, 8, 12, 240, 72, 36); x.fillStyle = bg || 'rgba(60,10,30,0.85)'; x.fill();
    x.lineWidth = 4; x.strokeStyle = color || '#f2c14e'; x.stroke();
    let size = 44; x.font = `800 ${size}px ${BODY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    while (x.measureText(str).width > 216 && size > 20) { size -= 2; x.font = `800 ${size}px ${BODY}`; }
    x.fillStyle = color || '#f2c14e'; x.fillText(str, 128, 50);
    cache[key] = toTex(c);
    return cache[key];
  };

  /* ---------- sherwani cloth with a PCS jersey back ---------- */
  T.sherwani = function () {
    if (cache.sherwani) return cache.sherwani;
    const [c, x] = mk(256, 256);
    const g = x.createLinearGradient(0, 0, 256, 256); g.addColorStop(0, '#8f1f36'); g.addColorStop(1, '#5e1224');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) if ((i + j) % 2 === 0) diamond(x, i * 16 + 8, j * 16 + 8, 5, 'rgba(255,210,120,0.13)');
    x.fillStyle = '#f2c14e'; x.fillRect(0, 0, 256, 18); x.fillRect(0, 238, 256, 18);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#f2c14e'; x.font = `900 72px ${DISPLAY}`; x.fillText('PCS', 128, 128);
    x.fillStyle = '#ffe6a8'; x.font = `700 22px ${BODY}`; x.fillText('NAWABI DASH', 128, 186);
    cache.sherwani = toTex(c);
    return cache.sherwani;
  };

  /* ---------- paper lantern (kandil) ---------- */
  T.lantern = function () {
    if (cache.lantern) return cache.lantern;
    const [c, x] = mk(128, 192);
    const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#c2301f'); g.addColorStop(0.5, '#ff7a1a'); g.addColorStop(1, '#c2301f');
    x.fillStyle = g; x.fillRect(0, 0, 128, 192);
    x.strokeStyle = 'rgba(255,220,120,0.9)'; x.lineWidth = 3;
    for (let i = -192; i < 320; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 128, 192); x.stroke(); x.beginPath(); x.moveTo(i + 128, 0); x.lineTo(i, 192); x.stroke(); }
    x.fillStyle = '#f2c14e'; x.fillRect(0, 0, 128, 14); x.fillRect(0, 178, 128, 14);
    cache.lantern = toTex(c, { repeat: [1, 1] });
    return cache.lantern;
  };

  /* ---------- stripes (poles, umbrella) ---------- */
  T.stripes = function (c1, c2, horizontal) {
    const key = 'stripes' + c1 + c2 + horizontal;
    if (cache[key]) return cache[key];
    const [c, x] = mk(128, 128);
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? c1 : c2;
      if (horizontal) x.fillRect(0, i * 16, 128, 16); else x.fillRect(i * 16, 0, 16, 128);
    }
    cache[key] = toTex(c, { repeat: [1, 1] });
    return cache[key];
  };

  /* ---------- sweets tray (thela top) ---------- */
  T.sweets = function () {
    if (cache.sweets) return cache.sweets;
    const [c, x] = mk(256, 192);
    x.fillStyle = '#c9c0a8'; x.fillRect(0, 0, 256, 192);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const px = i * 64, py = j * 64;
      x.fillStyle = '#8c8878'; x.fillRect(px + 2, py + 2, 60, 60);
      x.fillStyle = '#e9e2cd'; x.fillRect(px + 5, py + 5, 54, 54);
      const kind = (i + j) % 3;
      for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
        const sx = px + 14 + a * 18, sy = py + 14 + b * 18;
        if (kind === 0) { x.fillStyle = '#f29a2e'; x.beginPath(); x.arc(sx, sy, 8, 0, Math.PI * 2); x.fill(); x.fillStyle = '#c86f1a'; x.beginPath(); x.arc(sx + 2, sy + 2, 2, 0, Math.PI * 2); x.fill(); }
        else if (kind === 1) { x.fillStyle = (a + b) % 2 ? '#f5e9d6' : '#f4a5b7'; x.fillRect(sx - 8, sy - 8, 16, 16); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(sx - 8, sy - 8, 16, 3); }
        else { x.strokeStyle = '#ff8c1a'; x.lineWidth = 3; x.beginPath(); for (let t = 0; t < Math.PI * 4; t += 0.3) x.lineTo(sx + Math.cos(t) * t * 0.7, sy + Math.sin(t) * t * 0.7); x.stroke(); }
      }
    }
    cache.sweets = toTex(c);
    return cache.sweets;
  };

  /* ---------- auto rickshaw body ---------- */
  T.autoBody = function () {
    if (cache.auto) return cache.auto;
    const [c, x] = mk(256, 256);
    x.fillStyle = '#1f8a4c'; x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#f4c430'; x.fillRect(0, 0, 256, 120);
    x.fillStyle = '#132029'; x.fillRect(16, 26, 224, 70);
    x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(24, 32, 90, 24);
    x.fillStyle = '#111'; x.fillRect(0, 116, 256, 10);
    x.fillStyle = '#f2f2f2'; x.fillRect(64, 176, 128, 44);
    x.fillStyle = '#111'; x.font = `800 28px ${BODY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('UP 32 PCS', 128, 198);
    x.fillStyle = '#ffe6a8'; x.font = `800 20px ${BODY}`; x.fillText('LUCKNOW', 128, 150);
    cache.auto = toTex(c);
    return cache.auto;
  };

  /* ---------- patakha (firecracker) box label ---------- */
  T.crackerLabel = function () {
    if (cache.cracker) return cache.cracker;
    const [c, x] = mk(256, 128);
    x.fillStyle = '#c62828'; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = '#f2c14e'; x.lineWidth = 8; x.strokeRect(8, 8, 240, 112);
    for (let i = 0; i < 6; i++) { x.fillStyle = '#ffd23f'; x.beginPath(); const sx = 30 + i * 40, sy = i % 2 ? 26 : 102; for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5, rr = k % 2 ? 4 : 10; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.closePath(); x.fill(); }
    x.fillStyle = '#ffe6a8'; x.font = `900 40px ${BODY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('PATAKHA', 128, 64);
    cache.cracker = toTex(c);
    return cache.cracker;
  };

  /* ---------- mithai box lid ---------- */
  T.mithaiLid = function () {
    if (cache.mithai) return cache.mithai;
    const [c, x] = mk(256, 256);
    x.fillStyle = '#b8172f'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) diamond(x, i * 32 + 16, j * 32 + 16, 10, 'rgba(242,193,78,0.35)');
    x.strokeStyle = '#f2c14e'; x.lineWidth = 12; x.strokeRect(12, 12, 232, 232);
    x.fillStyle = '#f2c14e'; roundRect(x, 48, 96, 160, 64, 20); x.fill();
    x.fillStyle = '#7a1b2e'; x.font = `900 36px ${BODY}`; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('MITHAI', 128, 128);
    cache.mithai = toTex(c);
    return cache.mithai;
  };

  /* ---------- wood planks ---------- */
  T.wood = function () {
    if (cache.wood) return cache.wood;
    const [c, x] = mk(128, 128);
    x.fillStyle = '#6b3a1e'; x.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 60; i++) { x.strokeStyle = `rgba(0,0,0,${R(0.1, 0.3)})`; x.lineWidth = R(1, 3); x.beginPath(); x.moveTo(R(0, 128), 0); x.lineTo(R(0, 128), 128); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 0; i < 128; i += 32) x.fillRect(i, 0, 3, 128);
    cache.wood = toTex(c, { repeat: [1, 1] });
    return cache.wood;
  };

  /* ---------- marigold garland ---------- */
  T.marigold = function () {
    if (cache.marigold) return cache.marigold;
    const [c, x] = mk(128, 64);
    x.fillStyle = '#ff8c1a'; x.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 90; i++) { x.fillStyle = PK(['#ffb347', '#ff6a00', '#ffd23f', '#e65c00']); x.beginPath(); x.arc(R(0, 128), R(0, 64), R(3, 7), 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(80,20,0,0.35)'; x.beginPath(); x.arc(R(0, 128), R(0, 64), R(1, 3), 0, Math.PI * 2); x.fill(); }
    cache.marigold = toTex(c, { repeat: [24, 1] });
    return cache.marigold;
  };

  /* ---------- sky dome gradient ---------- */
  T.sky = function () {
    if (cache.sky) return cache.sky;
    const [c, x] = mk(64, 1024);
    const g = x.createLinearGradient(0, 0, 0, 1024);
    g.addColorStop(0.0, '#05021a');
    g.addColorStop(0.25, '#120a36');
    g.addColorStop(0.42, '#2a1048');
    g.addColorStop(0.47, '#4a1a46');
    g.addColorStop(0.495, '#6a2a3c');
    g.addColorStop(0.51, '#241030');
    g.addColorStop(1.0, '#241030');
    x.fillStyle = g; x.fillRect(0, 0, 64, 1024);
    cache.sky = toTex(c);
    return cache.sky;
  };

  /* ---------- distant Lucknow skyline (domes, minarets, Rumi Darwaza arch) ---------- */
  T.skyline = function () {
    if (cache.skyline) return cache.skyline;
    const W = 2048, H = 512, [c, x] = mk(W, H);
    x.clearRect(0, 0, W, H);
    const base = H - 40;
    const dark = '#2b1140', lit = '#f2c14e';
    function dome(cx, w, h) {
      x.fillStyle = dark; x.beginPath(); x.moveTo(cx - w / 2, base); x.lineTo(cx - w / 2, base - h);
      x.bezierCurveTo(cx - w / 2, base - h - w * 0.7, cx + w / 2, base - h - w * 0.7, cx + w / 2, base - h);
      x.lineTo(cx + w / 2, base); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(242,193,78,0.55)'; x.lineWidth = 3; x.beginPath();
      x.moveTo(cx - w / 2, base - h); x.bezierCurveTo(cx - w / 2, base - h - w * 0.7, cx + w / 2, base - h - w * 0.7, cx + w / 2, base - h); x.stroke();
      x.fillStyle = lit; x.beginPath(); x.arc(cx, base - h - w * 0.52 - 8, 4, 0, Math.PI * 2); x.fill();
      x.fillRect(cx - 1.5, base - h - w * 0.52 - 26, 3, 20);
    }
    function minaret(cx, h) {
      x.fillStyle = dark; x.fillRect(cx - 9, base - h, 18, h);
      x.beginPath(); x.moveTo(cx - 13, base - h); x.lineTo(cx + 13, base - h); x.lineTo(cx, base - h - 34); x.closePath(); x.fill();
      for (let y = base - 30; y > base - h + 20; y -= 36) { x.fillStyle = Math.random() < 0.6 ? lit : 'rgba(242,193,78,0.3)'; x.fillRect(cx - 3, y, 6, 8); }
    }
    function block(cx, w, h) {
      x.fillStyle = dark; x.fillRect(cx - w / 2, base - h, w, h);
      for (let yy = base - 18; yy > base - h + 10; yy -= 22) for (let xx = cx - w / 2 + 10; xx < cx + w / 2 - 8; xx += 20) {
        x.fillStyle = Math.random() < 0.55 ? `rgba(255,${RI(170, 230)},${RI(60, 140)},${R(0.5, 1)})` : 'rgba(0,0,0,0)';
        x.fillRect(xx, yy, 8, 10);
      }
    }
    for (let i = 0; i < 26; i++) block(R(0, W), R(60, 160), R(40, 150));
    // big arch (Rumi Darwaza style) in the centre
    const ax = W / 2;
    x.fillStyle = dark; x.fillRect(ax - 200, base - 160, 400, 160);
    x.beginPath(); x.moveTo(ax - 120, base); x.lineTo(ax - 120, base - 150);
    x.quadraticCurveTo(ax - 120, base - 290, ax, base - 310);
    x.quadraticCurveTo(ax + 120, base - 290, ax + 120, base - 150); x.lineTo(ax + 120, base); x.closePath(); x.fill();
    x.strokeStyle = 'rgba(242,193,78,0.6)'; x.lineWidth = 4; x.beginPath();
    x.moveTo(ax - 90, base); x.lineTo(ax - 90, base - 140); x.quadraticCurveTo(ax - 90, base - 240, ax, base - 255);
    x.quadraticCurveTo(ax + 90, base - 240, ax + 90, base - 140); x.lineTo(ax + 90, base); x.stroke();
    x.fillStyle = 'rgba(255,170,80,0.35)'; x.beginPath();
    x.moveTo(ax - 80, base); x.lineTo(ax - 80, base - 135); x.quadraticCurveTo(ax - 80, base - 225, ax, base - 240);
    x.quadraticCurveTo(ax + 80, base - 225, ax + 80, base - 135); x.lineTo(ax + 80, base); x.closePath(); x.fill();
    dome(ax, 150, 180); dome(ax - 260, 110, 120); dome(ax + 260, 110, 120);
    dome(300, 90, 100); dome(W - 300, 90, 100); dome(700, 70, 80); dome(W - 650, 80, 110);
    minaret(ax - 330, 260); minaret(ax + 330, 260); minaret(180, 200); minaret(W - 180, 220); minaret(900, 170); minaret(W - 850, 190);
    // haze at the bottom
    const hz = x.createLinearGradient(0, base - 60, 0, H); hz.addColorStop(0, 'rgba(36,16,48,0)'); hz.addColorStop(1, 'rgba(36,16,48,1)');
    x.fillStyle = hz; x.fillRect(0, base - 60, W, 100);
    cache.skyline = toTex(c);
    return cache.skyline;
  };

  /* ---------- square-crop any image/canvas to a canvas ---------- */
  T.squareCrop = function (img, size) {
    size = size || 512;
    const [c, x] = mk(size, size);
    const w = img.naturalWidth || img.videoWidth || img.width, h = img.naturalHeight || img.videoHeight || img.height;
    const s = Math.min(w, h);
    x.fillStyle = '#3a1a24'; x.fillRect(0, 0, size, size);
    x.drawImage(img, (w - s) / 2, (h - s) / 2 * 0.8, s, s, 0, 0, size, size);
    return c;
  };
  T.isTainted = function (canvas) {
    try { canvas.getContext('2d').getImageData(0, 0, 1, 1); return false; } catch (e) { return true; }
  };
  T.photoTexture = function (canvas) { return toTex(canvas); };

  return T;
})();
