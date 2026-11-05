/* ============================================================
   Nawabi Dash — Diwali Samosa Run (Lucknow Edition)
   config.js : tuning constants, Hinglish text banks, helpers
   ============================================================ */
window.ND = window.ND || {};

ND.VERSION = '1.0.0';

ND.CFG = {
  LANES: [-2.7, 0, 2.7],
  SPEED_START: 13,          // units (metres) per second at the start
  SPEED_GAIN: 23,           // asymptotic extra speed
  SPEED_RAMP: 1800,         // metres to reach ~63% of the gain
  MENU_SPEED: 7,
  GRAVITY: -40,
  JUMP_V: 14.2,
  SLAM_V: -24,
  SLIDE_TIME: 0.85,
  LANE_LERP: 15,
  COUNTDOWN: 2.4,
  CHAIN_TIME: 2.6,
  SPAWN_Z: -150,
  KILL_Z: 16,
  ROW_TIME: 1.05,           // seconds between obstacle rows at the start
  ROW_TIME_MIN: 0.72,       // ... and at full difficulty
  ROW_GAP_MIN: 15,
  DIFF_DIST: 3500,          // metres until full difficulty
  PLAYER: { halfW: 0.42, halfD: 0.38, height: 1.9, slideHeight: 0.9 },
  POINTS: { samosa: 10, golden: 50, nearMiss: 5, smash: 25, perMetre: 1 },
  POWER_TIME: { chai: 7, jalebi: 8, mithai: 10 },
  MAGNET_RADIUS: 7.5,
  FOV: { base: 62, max: 74, portraitBoost: 1.22 },
  FOG: { near: 26, far: 230, color: 0x241030 },
  MILESTONE_EVERY: 500,
  SEG_LEN: 40,
  SEG_COUNT: 7,
  MAX_PIXEL_RATIO: 2
};

/* ---------- Lucknowi Hinglish text banks ---------- */
ND.TEXT = {
  taglines: [
    'Pehle aap... pehle aap... arre janaab, ab bhaagiye!',
    'Muskuraiye, aap Lucknow mein hain.',
    'Nazaakat se bhaagiye, nafaasat se samosa uthaiye.',
    'Aadaab! Diwali ki daud mein tashreef laiye.',
    'Hazratganj se Aminabad tak, samose hi samose.',
    'Tehzeeb bhi, raftaar bhi.',
    'Is Diwali, Prakash hi Prakash.'
  ],
  go: ['Bhaagiye janaab!', 'Chaliye, shuru karte hain!', 'Bismillah, daud shuru!'],
  praise: [
    'Wah janaab, kya baat hai!',
    'Irshad, irshad!',
    'Nawabi andaaz!',
    'Garma garam, kya nafaasat!',
    'Hazratganj wali raftaar!',
    'Samose pe samosa, wah!',
    'Kya kehne, hazrat!',
    'Tehzeeb bhi hai, raftaar bhi!',
    'Chowk ke asli shaukeen!'
  ],
  nearMiss: ['Arre tehzeeb se, janaab!', 'Bach gaye, hazrat!', 'Uff, nazaakat!', 'Zara dekh ke, janaab!'],
  golden: ['Sone ka samosa! Nawabi kismat!', 'Golden samosa — shahi daawat!', 'Zardozi wala samosa, wah!'],
  power: {
    chai: ['Chai ki chuski, mushkil ki khiski!', 'Sharma ji wali chai — ab koi na rok paaye!'],
    jalebi: ['Jalebi magnet on — samose seedhe jholi mein!', 'Jalebi ki tarah seedhe samose aapki taraf!'],
    mithai: ['Mithai ka dabba — double meetha, double points!', 'Shahi mithai — 2x nafaasat!']
  },
  powerEnd: {
    chai: 'Chai khatam, hosh mein aaiye.',
    jalebi: 'Jalebi ka jaadu khatam.',
    mithai: 'Dabba khaali, points normal.'
  },
  shieldHit: ['Chai ki garmi se thela bhi hata!', 'Kulhad wali taaqat!', 'Nawab ko kaun rokega?'],
  milestones: {
    500: 'Hazratganj paar, janaab!',
    1000: 'Rumi Darwaza paar ho gaya!',
    1500: 'Bhool Bhulaiya se bhi nikal aaye!',
    2000: 'Gomti ke kinare kinare...',
    2500: 'Aminabad ki bheed mein bhi nahi ruke!',
    3000: 'Chowk ki galiyon ke Nawab!',
    3500: 'Tunday ke kabab se bhi zyada mashhoor!',
    4000: 'Imambara ki shaan, aapka naam!',
    5000: 'Lucknow ke asli Nawab aap hi hain!'
  },
  milestoneGeneric: ['Shubh Deepawali, janaab!', 'Roshni hi roshni!', 'Lucknow aapko salaam karta hai!', 'Nawabi daud jaari hai!'],
  greetings: [
    'Shubh Deepawali!',
    'Is Diwali, Prakash hi Prakash!',
    'Team PCS ki taraf se Diwali Mubarak!',
    'Roshni ka tyohaar, samose ki bahaar!',
    'Muskuraiye, aap Lucknow mein hain.'
  ],
  gameOver: [
    'Pehle aap, pehle aap... aur samosa nikal gaya!',
    'Thele se takra gaye, janaab!',
    'Hazrat, zara dekh ke!',
    'Bhool Bhulaiya mein kho gaye?',
    'Kabab mein haddi aa gayi!',
    'Patakha phata, score ruka!',
    'Aaram se janaab, Lucknow mein jaldi kisko hai?',
    'Deadline se pehle aap hi out ho gaye!',
    'Boss ki nazar pad gayi!',
    'Nazaakat zyada ho gayi, janaab!',
    'Tehzeeb bhool gaye, takkar kha gaye!'
  ],
  causes: {
    diyaRow: 'Diyon ki kataar se takra gaye.',
    anaar: 'Anaar ne jhulsa diya!',
    crackerBox: 'Patakhon ke dabbe se takkar!',
    toran: 'Toran mein uljh gaye.',
    kandil: 'Kandil se sar takra gaya.',
    thela: 'Mithai ke thele se takkar!',
    auto: 'UP 32 wale auto ne rok liya.',
    desk: 'Office ki desk se takra gaye, deadline bhi gayi!'
  },
  hints: {
    low: '\u2191 Kood jaiye!',
    high: '\u2193 Slide kijiye!',
    full: '\u2190 \u2192 Lane badliye!'
  },
  chain: ['Chain x2 \u2014 wah!', 'Chain x3 \u2014 nawabi!', 'Chain x4 \u2014 shahi raftaar!'],
  verdicts: [
    [200, 'Koi baat nahi janaab, pehli baar Lucknow aaye hain?'],
    [800, 'Theek hai, par Nawab banne mein abhi waqt hai.'],
    [2000, 'Wah! Tehzeeb bhi hai aur raftaar bhi.'],
    [5000, 'Kya baat hai hazrat, Hazratganj aapka hai!'],
    [Infinity, 'Aap toh Lucknow ke asli Nawab nikle!']
  ],
  ranks: [
    [300, 'Aminabad Rookie'],
    [1000, 'Samosa Shehzada'],
    [2500, 'Hazratganj ka Hero'],
    [5000, 'Chhote Nawab'],
    [Infinity, 'Nawab-e-Lucknow']
  ],
  pause: ['Thehriye janaab, chai pee lijiye.', 'Aaram farmaiye, samose kahin nahi jaa rahe.', 'Ek minute, paan laga lein?'],
  bannerTexts: ['Shubh Deepawali', 'Happy Diwali', 'Team PCS', 'Nawabi Dash', 'Diwali Mubarak']
};

/* ---------- helpers ---------- */
ND.util = {
  rand: (a, b) => a + Math.random() * (b - a),
  randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  lerp: (a, b, t) => a + (b - a) * t,
  fmt: (n) => Math.floor(n).toLocaleString('en-IN'),
  tiered: (table, value) => {
    for (const [limit, label] of table) if (value < limit) return label;
    return table[table.length - 1][1];
  }
};

/* localStorage wrapped: it can throw or be empty (private mode, blocked data) */
ND.store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
  },
  del(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
};

ND.isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100);
ND.reducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
