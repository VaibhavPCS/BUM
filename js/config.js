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
  welcome: ['Aadaab! Nawabi Dash mein aapka swagat hai.', 'Aadaab arz hai! Lucknow ki galiyan aapka intezaar kar rahi hain.'],
  newBest: 'Naya record, janaab!',
  bannerTexts: ['Shubh Deepawali', 'Happy Diwali', 'Team PCS', 'Nawabi Dash', 'Diwali Mubarak']
};

/* Devanagari versions of the spoken lines (used when a Hindi voice is available) */
ND.TEXT.hi = {
  'Bhaagiye janaab!': 'भागिए जनाब!',
  'Chaliye, shuru karte hain!': 'चलिए, शुरू करते हैं!',
  'Bismillah, daud shuru!': 'बिस्मिल्लाह, दौड़ शुरू!',
  'Aadaab! Nawabi Dash mein aapka swagat hai.': 'आदाब! नवाबी डैश में आपका स्वागत है।',
  'Aadaab arz hai! Lucknow ki galiyan aapka intezaar kar rahi hain.': 'आदाब अर्ज़ है! लखनऊ की गलियाँ आपका इंतज़ार कर रही हैं।',
  'Wah janaab, kya baat hai!': 'वाह जनाब, क्या बात है!',
  'Irshad, irshad!': 'इरशाद, इरशाद!',
  'Nawabi andaaz!': 'नवाबी अंदाज़!',
  'Garma garam, kya nafaasat!': 'गरमा गरम, क्या नफ़ासत!',
  'Hazratganj wali raftaar!': 'हज़रतगंज वाली रफ़्तार!',
  'Samose pe samosa, wah!': 'समोसे पे समोसा, वाह!',
  'Kya kehne, hazrat!': 'क्या कहने, हज़रत!',
  'Tehzeeb bhi hai, raftaar bhi!': 'तहज़ीब भी है, रफ़्तार भी!',
  'Chowk ke asli shaukeen!': 'चौक के असली शौक़ीन!',
  'Arre tehzeeb se, janaab!': 'अरे तहज़ीब से, जनाब!',
  'Bach gaye, hazrat!': 'बच गए, हज़रत!',
  'Uff, nazaakat!': 'उफ़्फ़, नज़ाकत!',
  'Zara dekh ke, janaab!': 'ज़रा देख के, जनाब!',
  'Sone ka samosa! Nawabi kismat!': 'सोने का समोसा! नवाबी किस्मत!',
  'Golden samosa — shahi daawat!': 'गोल्डन समोसा, शाही दावत!',
  'Zardozi wala samosa, wah!': 'ज़रदोज़ी वाला समोसा, वाह!',
  'Chai ki chuski, mushkil ki khiski!': 'चाय की चुस्की, मुश्किल की खिसकी!',
  'Sharma ji wali chai — ab koi na rok paaye!': 'शर्मा जी वाली चाय, अब कोई न रोक पाए!',
  'Jalebi magnet on — samose seedhe jholi mein!': 'जलेबी मैग्नेट ऑन, समोसे सीधे झोली में!',
  'Jalebi ki tarah seedhe samose aapki taraf!': 'जलेबी की तरह सीधे समोसे आपकी तरफ़!',
  'Mithai ka dabba — double meetha, double points!': 'मिठाई का डब्बा, डबल मीठा, डबल पॉइंट्स!',
  'Shahi mithai — 2x nafaasat!': 'शाही मिठाई, डबल नफ़ासत!',
  'Chai ki garmi se thela bhi hata!': 'चाय की गर्मी से ठेला भी हटा!',
  'Kulhad wali taaqat!': 'कुल्हड़ वाली ताक़त!',
  'Nawab ko kaun rokega?': 'नवाब को कौन रोकेगा?',
  'Hazratganj paar, janaab!': 'हज़रतगंज पार, जनाब!',
  'Rumi Darwaza paar ho gaya!': 'रूमी दरवाज़ा पार हो गया!',
  'Bhool Bhulaiya se bhi nikal aaye!': 'भूल भुलैया से भी निकल आए!',
  'Gomti ke kinare kinare...': 'गोमती के किनारे किनारे...',
  'Aminabad ki bheed mein bhi nahi ruke!': 'अमीनाबाद की भीड़ में भी नहीं रुके!',
  'Chowk ki galiyon ke Nawab!': 'चौक की गलियों के नवाब!',
  'Tunday ke kabab se bhi zyada mashhoor!': 'टुंडे के कबाब से भी ज़्यादा मशहूर!',
  'Imambara ki shaan, aapka naam!': 'इमामबाड़े की शान, आपका नाम!',
  'Lucknow ke asli Nawab aap hi hain!': 'लखनऊ के असली नवाब आप ही हैं!',
  'Shubh Deepawali, janaab!': 'शुभ दीपावली, जनाब!',
  'Roshni hi roshni!': 'रोशनी ही रोशनी!',
  'Lucknow aapko salaam karta hai!': 'लखनऊ आपको सलाम करता है!',
  'Nawabi daud jaari hai!': 'नवाबी दौड़ जारी है!',
  'Chain x2 — wah!': 'चेन डबल, वाह!',
  'Chain x3 — nawabi!': 'चेन ट्रिपल, नवाबी!',
  'Chain x4 — shahi raftaar!': 'चेन चार गुना, शाही रफ़्तार!',
  'Pehle aap, pehle aap... aur samosa nikal gaya!': 'पहले आप, पहले आप... और समोसा निकल गया!',
  'Thele se takra gaye, janaab!': 'ठेले से टकरा गए, जनाब!',
  'Hazrat, zara dekh ke!': 'हज़रत, ज़रा देख के!',
  'Bhool Bhulaiya mein kho gaye?': 'भूल भुलैया में खो गए?',
  'Kabab mein haddi aa gayi!': 'कबाब में हड्डी आ गई!',
  'Patakha phata, score ruka!': 'पटाखा फटा, स्कोर रुका!',
  'Aaram se janaab, Lucknow mein jaldi kisko hai?': 'आराम से जनाब, लखनऊ में जल्दी किसको है?',
  'Deadline se pehle aap hi out ho gaye!': 'डेडलाइन से पहले आप ही आउट हो गए!',
  'Boss ki nazar pad gayi!': 'बॉस की नज़र पड़ गई!',
  'Nazaakat zyada ho gayi, janaab!': 'नज़ाकत ज़्यादा हो गई, जनाब!',
  'Tehzeeb bhool gaye, takkar kha gaye!': 'तहज़ीब भूल गए, टक्कर खा गए!',
  'Koi baat nahi janaab, pehli baar Lucknow aaye hain?': 'कोई बात नहीं जनाब, पहली बार लखनऊ आए हैं?',
  'Theek hai, par Nawab banne mein abhi waqt hai.': 'ठीक है, पर नवाब बनने में अभी वक़्त है।',
  'Wah! Tehzeeb bhi hai aur raftaar bhi.': 'वाह! तहज़ीब भी है और रफ़्तार भी।',
  'Kya baat hai hazrat, Hazratganj aapka hai!': 'क्या बात है हज़रत, हज़रतगंज आपका है!',
  'Aap toh Lucknow ke asli Nawab nikle!': 'आप तो लखनऊ के असली नवाब निकले!',
  'Thehriye janaab, chai pee lijiye.': 'ठहरिए जनाब, चाय पी लीजिए।',
  'Aaram farmaiye, samose kahin nahi jaa rahe.': 'आराम फ़रमाइए, समोसे कहीं नहीं जा रहे।',
  'Ek minute, paan laga lein?': 'एक मिनट, पान लगा लें?',
  'Naya record, janaab!': 'नया रिकॉर्ड, जनाब!',
  '\u2191 Kood jaiye!': 'कूद जाइए!',
  '\u2193 Slide kijiye!': 'स्लाइड कीजिए!',
  '\u2190 \u2192 Lane badliye!': 'लेन बदलिए!'
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
