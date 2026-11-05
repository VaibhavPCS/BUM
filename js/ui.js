/* ============================================================
   ui.js : screens, HUD, toasts, photo upload, leaderboard, share
   ============================================================ */
(function () {
  const { pick: PK, fmt, clamp } = ND.util;
  const TX = ND.TEXT;
  const $ = (s) => document.querySelector(s);
  const DEFAULT_NAME = 'PCS Sir';

  const ui = {
    game: null,
    els: {},
    toasts: [],
    lastHud: {},

    init() {
      const ids = ['hud', 'hud-score', 'hud-samosa', 'hud-dist', 'hud-best', 'hud-mult', 'powers', 'btn-pause', 'btn-mute',
        'toasts', 'greet', 'flash', 'vignette', 'screen-start', 'screen-pause', 'screen-over', 'screen-board',
        'tagline', 'avatar-img', 'photo-input', 'btn-photo-reset', 'photo-name', 'name-input', 'btn-start', 'btn-board', 'start-best',
        'btn-resume', 'btn-restart', 'btn-pause-menu', 'pause-line',
        'over-title', 'over-sub', 'over-score', 'over-samosa', 'over-dist', 'over-best', 'over-rank', 'over-verdict', 'over-newbest', 'over-avatar',
        'btn-retry', 'btn-share', 'btn-menu', 'board-list', 'btn-board-close', 'btn-board-clear', 'controls-hint', 'share-text',
        'countdown', 'fly-layer', 'chain', 'chain-n', 'chain-bar', 'banner', 'banner-text', 'btn-voice', 'voice-hint'];
      ids.forEach((id) => { this.els[id] = document.getElementById(id); });
      const E = this.els;

      this.game = new ND.Game(this);
      window.ND.game = this.game;

      // name
      E['name-input'].value = ND.store.get('nd_name', '');
      E['name-input'].addEventListener('change', () => ND.store.set('nd_name', E['name-input'].value.trim().slice(0, 24)));

      // photo
      E['photo-input'].addEventListener('change', (e) => { const f = e.target.files && e.target.files[0]; if (f) this.handleFile(f); e.target.value = ''; });
      E['btn-photo-reset'].addEventListener('click', () => { ND.store.del('nd_photo'); this.loadDefaultPhoto(); ND.audio.sfx.click(); });
      document.querySelectorAll('input[name="placement"]').forEach((r) => r.addEventListener('change', () => {
        const v = document.querySelector('input[name="placement"]:checked').value;
        ND.store.set('nd_placement', v); this.game.setPhoto(null, v); ND.audio.sfx.click();
      }));
      const savedPlacement = ND.store.get('nd_placement', 'runner');
      const radio = document.querySelector(`input[name="placement"][value="${savedPlacement}"]`);
      if (radio) radio.checked = true;
      this.game.placement = savedPlacement;

      // buttons
      E['btn-start'].addEventListener('click', () => { ND.audio.unlock(); this.game.start(); });
      E['btn-board'].addEventListener('click', () => { ND.audio.sfx.click(); this.showBoard(); });
      E['btn-board-close'].addEventListener('click', () => { ND.audio.sfx.click(); this.showScreen(this.game.state === 'over' ? 'over' : 'start'); });
      E['btn-board-clear'].addEventListener('click', () => { ND.store.del('nd_board'); this.renderBoard(); });
      E['btn-pause'].addEventListener('click', () => { if (this.game.state === 'playing' || this.game.state === 'resuming') this.game.pause(); });
      E['btn-resume'].addEventListener('click', () => this.game.resume());
      E['btn-restart'].addEventListener('click', () => { this.game.start(); });
      E['btn-pause-menu'].addEventListener('click', () => this.game.toMenu());
      E['btn-retry'].addEventListener('click', () => this.game.start());
      E['btn-menu'].addEventListener('click', () => this.game.toMenu());
      E['btn-share'].addEventListener('click', () => this.share());
      E['btn-mute'].addEventListener('click', () => { ND.audio.unlock(); const m = ND.audio.toggle(); this.renderMute(m); if (m) ND.voice.cancel(); });
      this.renderMute(ND.audio.isMuted());
      if (ND.voice.available()) {
        E['btn-voice'].addEventListener('click', () => { const on = ND.voice.toggle(); this.renderVoice(on); if (on) ND.voice.say('Irshad, irshad!', { force: true }); });
        this.renderVoice(ND.voice.isEnabled());
        E['voice-hint'].hidden = false;
      } else { E['btn-voice'].hidden = true; }
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (this.game.state === 'menu' && !E['screen-board'].classList.contains('show') && document.activeElement !== E['name-input']) this.game.start();
          else if (this.game.state === 'over') this.game.start();
        }
      });

      // taglines
      let ti = 0;
      const rotate = () => { E['tagline'].classList.remove('in'); setTimeout(() => { E['tagline'].textContent = TX.taglines[ti++ % TX.taglines.length]; E['tagline'].classList.add('in'); }, 350); };
      E['tagline'].textContent = TX.taglines[ti++]; E['tagline'].classList.add('in');
      setInterval(rotate, 4200);

      E['controls-hint'].innerHTML = ND.isMobile
        ? 'Swipe <b>&larr; &rarr;</b> lane &middot; <b>&uarr;</b> jump &middot; <b>&darr;</b> slide &middot; tap = jump'
        : '<b>&larr; &rarr;</b> lanes &middot; <b>&uarr;</b> / <b>Space</b> jump &middot; <b>&darr;</b> slide &middot; <b>P</b> pause';
      E['start-best'].textContent = fmt(this.game.best);

      // photo: saved → file → monogram
      const saved = ND.store.get('nd_photo', null);
      if (saved) this.loadImage(saved).then((img) => this.applyPhoto(ND.tex.squareCrop(img, 512), 'Aapki photo', false)).catch(() => this.loadDefaultPhoto());
      else this.loadDefaultPhoto();

      this.showScreen('start');
    },

    /* ---------- photo pipeline ---------- */
    loadImage(src) {
      return new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src; });
    },
    loadDefaultPhoto() {
      const tryNext = (list) => {
        if (!list.length) { this.applyPhoto(ND.tex.monogram(), DEFAULT_NAME, true); return; }
        this.loadImage(list[0]).then((img) => {
          const c = ND.tex.squareCrop(img, 512);
          if (ND.tex.isTainted(c)) tryNext(list.slice(1)); else this.applyPhoto(c, DEFAULT_NAME, true);
        }).catch(() => tryNext(list.slice(1)));
      };
      tryNext(['assets/founder.jpg', 'assets/founder.png']);
    },
    handleFile(file) {
      if (!file.type || !file.type.startsWith('image/')) { this.toast('Yeh photo nahi lag rahi, janaab.', 'dim'); return; }
      const reader = new FileReader();
      reader.onload = () => this.loadImage(reader.result).then((img) => {
        const c = ND.tex.squareCrop(img, 512);
        let data = null;
        try { data = c.toDataURL('image/jpeg', 0.86); } catch (e) { data = null; }
        if (data && !ND.store.set('nd_photo', data)) this.toast('Photo save nahi ho payi, par is baar chalegi.', 'dim');
        this.applyPhoto(c, 'Aapki photo', false);
        this.toast('Wah! Chehra laga diya, janaab.', 'gold');
        ND.audio.sfx.power();
      }).catch(() => this.toast('Photo load nahi hui. Doosri try kijiye.', 'dim'));
      reader.onerror = () => this.toast('Photo padh nahi paaye.', 'dim');
      reader.readAsDataURL(file);
    },
    applyPhoto(canvas, label, isDefault) {
      this.photoCanvas = canvas;
      const url = (() => { try { return canvas.toDataURL('image/jpeg', 0.85); } catch (e) { return ''; } })();
      this.els['avatar-img'].src = url; this.els['over-avatar'].src = url;
      this.els['photo-name'].textContent = label;
      this.els['btn-photo-reset'].hidden = isDefault;
      this.game.setPhoto(canvas, null);
    },

    /* ---------- screens ---------- */
    showScreen(name) {
      ['screen-start', 'screen-pause', 'screen-over', 'screen-board'].forEach((id) => {
        const el = this.els[id], on = id === 'screen-' + name;
        el.classList.toggle('show', on); el.hidden = !on;
      });
      document.body.dataset.screen = name || 'none';
    },
    onStateChange(state, extra) {
      const E = this.els;
      if (state === 'playing') {
        this.showScreen(null); E['hud'].hidden = false; E['hud'].classList.add('show');
        E['vignette'].classList.add('on');
      } else if (state === 'countdown') {
        this.showScreen(null); E['hud'].hidden = false; E['hud'].classList.add('show');
        this.lastHud = {}; this.updateHud(this.game);
      } else if (state === 'resuming') {
        this.showScreen(null);
      } else if (state === 'paused') {
        E['pause-line'].textContent = extra || PK(TX.pause); this.showScreen('pause');
      } else if (state === 'menu') {
        E['hud'].hidden = true; E['vignette'].classList.remove('on');
        E['start-best'].textContent = fmt(this.game.best);
        this.showScreen('start');
      } else if (state === 'dying') {
        E['vignette'].classList.remove('on');
      }
    },
    showGameOver(s) {
      const E = this.els;
      const name = (E['name-input'].value || '').trim();
      E['over-title'].textContent = s.banner || PK(TX.gameOver);
      E['over-sub'].textContent = TX.causes[s.cause] || '';
      E['over-verdict'].textContent = s.verdict;
      this.countUp(E['over-score'], s.score, 900);
      this.countUp(E['over-samosa'], s.samosas, 700);
      this.countUp(E['over-dist'], s.dist, 800, ' m');
      E['over-best'].textContent = fmt(s.best);
      E['over-rank'].textContent = (name ? name + ' · ' : '') + s.rank;
      E['over-newbest'].hidden = !s.newBest;
      E['hud'].hidden = true;
      this.lastStats = s;
      this.addToBoard(name || 'Nawab', s);
      E['share-text'].value = this.shareText(s, name);
      this.showScreen('over');
    },

    countUp(el, to, ms, suffix) {
      const t0 = performance.now();
      const tick = (now) => {
        const u = clamp((now - t0) / ms, 0, 1), e = 1 - Math.pow(1 - u, 3);
        el.textContent = fmt(Math.round(to * e)) + (suffix || '');
        if (u < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },
    countdown(text, go) {
      const el = this.els['countdown'];
      el.textContent = text; el.hidden = !text;
      el.classList.toggle('go', !!go);
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      if (go) { clearTimeout(this.countT); this.countT = setTimeout(() => { el.hidden = true; }, 900); }
    },
    hint(kind) {
      const text = TX.hints[kind]; if (!text) return;
      this.toast(text, 'hint', 1700);
    },
    flySamosa(pt) {
      const layer = this.els['fly-layer'];
      if (!layer || layer.children.length > 12) { this.bumpSamosa(); return; }
      const target = this.els['hud-samosa'].parentElement.getBoundingClientRect();
      const el = document.createElement('div'); el.className = 'fly';
      el.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 L29 27 Q16 31 3 27 Z" fill="#e6a23c" stroke="#5a2c0a" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      el.style.transform = `translate(${pt.x - 14}px, ${pt.y - 14}px) scale(1.3)`;
      layer.appendChild(el);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transform = `translate(${target.left + target.width / 2 - 14}px, ${target.top + target.height / 2 - 14}px) scale(0.55)`;
        el.style.opacity = '0.85';
      }));
      setTimeout(() => { el.remove(); this.bumpSamosa(); }, 480);
    },

    /* ---------- HUD ---------- */
    updateHud(g) {
      const E = this.els, L = this.lastHud;
      const score = Math.floor(g.score), dist = Math.floor(g.dist);
      if (L.score !== score) { E['hud-score'].textContent = fmt(score); L.score = score; }
      if (L.samosas !== g.samosas) { E['hud-samosa'].textContent = fmt(g.samosas); L.samosas = g.samosas; }
      if (L.dist !== dist) { E['hud-dist'].textContent = fmt(dist); L.dist = dist; }
      if (L.best !== g.best) { E['hud-best'].textContent = fmt(g.best); L.best = g.best; }
      const mult = g.powers.mithai > 0;
      if (L.mult !== mult) { E['hud-mult'].hidden = !mult; L.mult = mult; }
      const chainOn = g.chain >= 3;
      if (L.chainOn !== chainOn) { E['chain'].hidden = !chainOn; L.chainOn = chainOn; }
      if (chainOn) {
        if (L.chain !== g.chain || L.tier !== g.chainTier) { E['chain-n'].textContent = window.innerWidth < 520 ? `${g.chain} · x${1 + g.chainTier}` : `${g.chain} chain · x${1 + g.chainTier}`; L.chain = g.chain; L.tier = g.chainTier; E['chain'].classList.toggle('hot', g.chainTier > 0); }
        E['chain-bar'].style.transform = `scaleX(${clamp(g.chainT / ND.CFG.CHAIN_TIME, 0, 1)})`;
      }
      for (const k of ['chai', 'jalebi', 'mithai']) {
        const v = g.powers[k], pill = this.pill(k);
        const on = v > 0;
        if (pill.on !== on) { pill.el.hidden = !on; pill.on = on; }
        if (on) pill.bar.style.transform = `scaleX(${clamp(v / ND.CFG.POWER_TIME[k], 0, 1)})`;
      }
    },
    pill(k) {
      if (!this.pills) this.pills = {};
      if (!this.pills[k]) {
        const el = document.createElement('div'); el.className = 'power ' + k; el.hidden = true;
        el.innerHTML = `<span class="power-ico"></span><span class="power-name">${{ chai: 'Chai shield', jalebi: 'Jalebi magnet', mithai: 'Mithai 2x' }[k]}</span><span class="power-bar"><i></i></span>`;
        this.els['powers'].appendChild(el);
        this.pills[k] = { el, bar: el.querySelector('i'), on: false };
      }
      return this.pills[k];
    },
    bumpSamosa() {
      const el = this.els['hud-samosa'].parentElement;
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    },
    renderMute(m) { this.els['btn-mute'].textContent = m ? '🔇' : '🔊'; this.els['btn-mute'].setAttribute('aria-label', m ? 'Sound off' : 'Sound on'); },
    renderVoice(on) {
      const b = this.els['btn-voice']; b.textContent = on ? '🗣️' : '🙊'; b.classList.toggle('off', !on);
      b.setAttribute('aria-label', on ? 'Awaaz on' : 'Awaaz off'); b.title = on ? 'Lucknowi awaaz: on' : 'Lucknowi awaaz: off';
    },
    banner(text) {
      const el = this.els['banner']; this.els['banner-text'].textContent = text;
      el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      this.els['toasts'].classList.add('pushed');
      clearTimeout(this.bannerT);
      this.bannerT = setTimeout(() => { el.hidden = true; this.els['toasts'].classList.remove('pushed'); }, 2700);
    },

    /* ---------- toasts ---------- */
    toast(text, kind, ms) {
      const box = this.els['toasts'];
      const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.textContent = text;
      box.appendChild(el);
      while (box.children.length > 3) box.removeChild(box.firstChild);
      requestAnimationFrame(() => el.classList.add('in'));
      setTimeout(() => { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 400); }, ms || 2300);
    },
    greet(text) {
      const el = this.els['greet']; el.textContent = text; el.hidden = false;
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      clearTimeout(this.greetT); this.greetT = setTimeout(() => { el.classList.remove('in'); setTimeout(() => { el.hidden = true; }, 500); }, 3000);
    },
    flash() { const el = this.els['flash']; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); },

    /* ---------- leaderboard (this browser) ---------- */
    addToBoard(name, s) {
      const board = ND.store.get('nd_board', []);
      board.push({ name: name.slice(0, 24), score: s.score, samosas: s.samosas, dist: s.dist, rank: s.rank, date: Date.now() });
      board.sort((a, b) => b.score - a.score);
      ND.store.set('nd_board', board.slice(0, 10));
    },
    showBoard() { this.renderBoard(); this.showScreen('board'); },
    renderBoard() {
      const board = ND.store.get('nd_board', []);
      const list = this.els['board-list'];
      list.innerHTML = '';
      if (!board.length) { list.innerHTML = '<li class="empty">Abhi tak koi daud nahi. Pehle aap!</li>'; return; }
      board.forEach((b, i) => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="pos">${i + 1}</span><span class="who"><b></b><small></small></span><span class="pts"></span>`;
        li.querySelector('b').textContent = b.name; li.querySelector('small').textContent = `${b.rank} · ${fmt(b.samosas)} samose · ${fmt(b.dist)} m`;
        li.querySelector('.pts').textContent = fmt(b.score);
        list.appendChild(li);
      });
    },

    /* ---------- share ---------- */
    shareText(s, name) {
      const who = name ? `${name} ne` : 'Maine';
      return `🪔 Nawabi Dash — Diwali Samosa Run\n${who} ${fmt(s.score)} points banaye, ${fmt(s.samosas)} samose khaye aur ${fmt(s.dist)} m daude! 🥟\nRank: ${s.rank}\nAap bhi khelo: ${location.href.split('#')[0]}`;
    },
    share() {
      const text = this.els['share-text'].value;
      const done = () => this.toast('Copy ho gaya! WhatsApp pe bhejiye.', 'gold');
      const fallback = () => { const ta = this.els['share-text']; ta.hidden = false; ta.focus(); ta.select(); this.toast('Text select hai — copy kar lijiye.', 'dim'); };
      if (navigator.share) {
        navigator.share({ text }).then(() => this.toast('Share ho gaya, janaab!', 'gold')).catch(() => {
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback); else fallback();
        });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
      else fallback();
    }
  };

  ND.ui = ui;

  function boot() {
    try { ui.init(); }
    catch (e) {
      console.error(e);
      const el = document.getElementById('fatal'); if (el) { el.hidden = false; el.querySelector('p').textContent = String(e && e.message || e); }
    }
  }
  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const timeout = new Promise((res) => setTimeout(res, 1800));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Promise.race([fontsReady, timeout]).then(boot));
  else Promise.race([fontsReady, timeout]).then(boot);
})();
