'use strict';

/* ============================================================
   PIXEL ART ENGINE
   Renders characters as CSS box-shadow pixel grids.
   Each "pixel" is a colored shadow offset from a 1px div.
============================================================ */
const PX = 5; // CSS pixels per "dot"

// Convert 2D color-array grid to box-shadow CSS string
// 0 or null = transparent
function gridToShadow(grid, palette) {
  const shadows = [];
  grid.forEach((row, y) => {
    row.forEach((idx, x) => {
      if (idx && palette[idx]) {
        shadows.push(`${x * PX}px ${y * PX}px 0 0 ${palette[idx]}`);
      }
    });
  });
  return shadows.length ? shadows.join(',') : 'none';
}

// Returns { w, h } in CSS pixels
function spriteSize(grid) {
  return { w: (grid[0]?.length || 0) * PX, h: grid.length * PX };
}

/* ============================================================
   CHARACTER PALETTES
============================================================ */
// Palette index map  (0 = transparent)
const PAL_AK = {
  1: '#CC3399', // hair (hot pink)
  2: '#FFDBA4', // skin
  3: '#1A0800', // eye
  4: '#FFB0C0', // cheek
  5: '#FF7BAF', // shirt (rose)
  6: '#2C4A7C', // pants (navy)
  7: '#1A1A2E', // shoes (black)
  8: '#F5F5FF', // pajama white
  9: '#C8B0FF', // pajama purple
  G: '#A8B0C0', // gray (tired skin)
  g: '#707880', // gray dark (tired hair/eye)
};

const PAL_DI = {
  1: '#6B3A1F', // hair (dark brown)
  2: '#FFDBA4',
  3: '#1A0800',
  4: '#FFB0C0',
  5: '#3A85CC', // shirt (blue)
  6: '#2C4A7C',
  7: '#1A1A2E',
  8: '#F5F5FF',
  9: '#A0D0FF', // pajama light blue
  G: '#A8B0C0',
  g: '#707880',
};

const PAL_RYO = {
  1: '#CC5500', // hair (orange)
  2: '#FFDBA4', // skin
  3: '#1A0800', // eye
  5: '#FF8030', // onesie (orange)
};

/* ============================================================
   SPRITE FRAME DEFINITIONS
   Grid is 8 cols × 12 rows for AK/DI (walking)
   Grid is 10 cols × 8 rows for RYO (crawling)
============================================================ */

// Shared head rows for AK/DI (rows 0-6)
const HEAD = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [0,1,2,2,2,2,1,0],
  [0,1,2,3,2,3,1,0],
  [0,1,2,2,2,2,1,0],
  [0,1,2,4,2,4,1,0],
  [0,0,1,1,1,1,0,0],
];
const HEAD_TIRED = [
  [0,0,1,1,1,1,0,0],
  [0,1,1,1,1,1,1,0],
  [0,1,'G','G','G','G',1,0],
  [0,1,'G',3,'G',3,1,0],
  [0,1,'G','G','G','G',1,0],
  [0,1,'G','G','G','G',1,0],
  [0,0,1,1,1,1,0,0],
];

// Body rows for normal shirt (rows 7-10)
const BODY = (shirt) => [
  [0,0,shirt,shirt,shirt,shirt,0,0],
  [0,shirt,shirt,shirt,shirt,shirt,shirt,0],
  [0,shirt,shirt,shirt,shirt,shirt,shirt,0],
  [0,shirt,shirt,shirt,shirt,shirt,shirt,0],
];

// Belly body (after dinner - bulge row added)
const BODY_BELLY = (shirt) => [
  [0,0,shirt,shirt,shirt,shirt,0,0],
  [0,shirt,shirt,shirt,shirt,shirt,shirt,0],
  [shirt,shirt,shirt,shirt,shirt,shirt,shirt,shirt],  // wide belly
  [0,shirt,shirt,shirt,shirt,shirt,shirt,0],
];

// Pajama body
const BODY_PAJAMA = [
  [0,0,8,8,8,8,0,0],
  [0,8,8,8,8,8,8,0],
  [0,8,8,9,9,8,8,0],
  [0,8,8,8,8,8,8,0],
];

// Pajama + belly
const BODY_PAJAMA_BELLY = [
  [0,0,8,8,8,8,0,0],
  [0,8,8,8,8,8,8,0],
  [8,8,8,9,9,8,8,8],
  [0,8,8,8,8,8,8,0],
];

// Pants row (row 11, shared)
const PANTS = [[0,6,6,0,0,6,6,0]];

// Leg frames
const LEGS_W1 = [[7,7,0,0,0,6,6,0]]; // left foot forward
const LEGS_W2 = [[6,6,0,0,0,7,7,0]]; // right foot forward
const LEGS_TIRED_W1 = [[0,7,7,0,0,6,0,0]]; // shuffling
const LEGS_TIRED_W2 = [[0,6,0,0,0,7,7,0]];

// Sleeping pose (lying down, 12 wide × 4 tall)
const SLEEPING_GRID = [
  [0,0,1,1,1,1,0,0,0,0,0,0],
  [0,1,2,2,2,2,1,0,0,0,0,0],
  [0,1,2,3,2,2,1,5,5,5,5,0],  // head + body horizontal
  [0,0,1,1,1,1,0,6,6,6,7,7],  // chin + legs + shoes
];

// Assemble a full grid from parts
function makeGrid(headRows, bodyRows, pantsRow, legsRow) {
  return [...headRows, ...bodyRows, ...pantsRow, ...legsRow];
}

function getCharGrid(state, frame) {
  const shirt = 5; // palette index for shirt (overridden by palette)
  switch (state) {
    case 'pajama':
      return makeGrid(HEAD, BODY_PAJAMA, PANTS, frame === 0 ? LEGS_W1 : LEGS_W2);
    case 'belly':
      return makeGrid(HEAD, BODY_BELLY(shirt), PANTS, frame === 0 ? LEGS_W1 : LEGS_W2);
    case 'pajama_belly':
      return makeGrid(HEAD, BODY_PAJAMA_BELLY, PANTS, frame === 0 ? LEGS_W1 : LEGS_W2);
    case 'tired':
    case 'tired_pajama':
    case 'tired_belly':
    case 'tired_pajama_belly':
      return makeGrid(HEAD_TIRED,
        state.includes('pajama') ? BODY_PAJAMA : (state.includes('belly') ? BODY_BELLY(shirt) : BODY(shirt)),
        PANTS,
        frame === 0 ? LEGS_TIRED_W1 : LEGS_TIRED_W2);
    case 'sleeping':
      return SLEEPING_GRID;
    default: // normal
      return makeGrid(HEAD, BODY(shirt), PANTS, frame === 0 ? LEGS_W1 : LEGS_W2);
  }
}

/* RYO crawling frames (10 cols × 8 rows) */
const RYO_CRAWL1 = [
  [0,0,1,1,1,0,0,0,0,0],
  [0,1,2,2,2,1,0,0,0,0],
  [0,1,2,3,2,1,0,0,0,0],
  [0,0,1,1,1,0,0,0,0,0],
  [0,5,5,5,5,5,0,0,0,0], // body
  [2,5,5,5,5,5,5,2,0,0], // arms out + end of body
  [0,2,0,0,0,0,2,0,0,0], // hands/knees
  [0,0,0,0,0,5,5,0,0,0], // back feet
];
const RYO_CRAWL2 = [
  [0,0,1,1,1,0,0,0,0,0],
  [0,1,2,2,2,1,0,0,0,0],
  [0,1,2,3,2,1,0,0,0,0],
  [0,0,1,1,1,0,0,0,0,0],
  [0,5,5,5,5,5,0,0,0,0],
  [0,2,5,5,5,5,2,0,0,0], // arms slightly different
  [2,0,0,0,0,0,0,2,0,0],
  [0,5,5,0,0,0,0,0,0,0],
];

/* ============================================================
   STATE & PERSISTENCE
============================================================ */
let STAGE_START_MINS = 16 * 60 + 30; // 16:30
let STAGE_END_MINS   = 21 * 60 + 30; // 21:30
let BEDTIME_MINS     = 21 * 60;       // 21:00 = tired starts

const TASK_TYPES = {
  bath:    { emoji: '🛁', label: 'お風呂' },
  dinner:  { emoji: '🍽️', label: 'ご飯' },
  toilet:  { emoji: '🚽', label: 'トイレ' },
  study:   { emoji: '📚', label: '勉強' },
  exercise:{ emoji: '🥊', label: '運動' },
  cleanup: { emoji: '🧹', label: 'お片付け' },
  other:   { emoji: '⭐', label: 'その他' },
};

const DEFAULT_TASKS = [
  { name: 'トイレ',      type: 'toilet'   },
  { name: 'お風呂',      type: 'bath'     },
  { name: 'ごはん',      type: 'dinner'   },
  { name: '明日の準備',  type: 'other'    },
  { name: '歯みがき',    type: 'other'    },
  { name: 'ミッション1', type: 'study'    },
  { name: 'ミッション2', type: 'exercise' },
];

let targetTimeStr = localStorage.getItem('targetTime') || '21:00';
let name1 = localStorage.getItem('name1') || 'AK';
let name2 = localStorage.getItem('name2') || 'DI';
let tasks = JSON.parse(localStorage.getItem('tasks2') || 'null') || DEFAULT_TASKS.slice();

// Daily reset
const todayStr = new Date().toDateString();
if (localStorage.getItem('lastDate') !== todayStr) {
  localStorage.removeItem('checks');
  localStorage.removeItem('gnChecks');
  localStorage.removeItem('droppedIcons');
  localStorage.setItem('lastDate', todayStr);
}
let checks   = JSON.parse(localStorage.getItem('checks')   || '{}');
let gnChecks = JSON.parse(localStorage.getItem('gnChecks') || '{}');

let droppedIcons = JSON.parse(localStorage.getItem('droppedIcons') || '[]');

function updateStageTimes() {
  if (!targetTimeStr) targetTimeStr = '21:00';
  const parts = targetTimeStr.split(':');
  const th = parseInt(parts[0], 10) || 21;
  const tm = parseInt(parts[1], 10) || 0;
  
  BEDTIME_MINS = th * 60 + tm;
  STAGE_END_MINS = BEDTIME_MINS + 30;
  STAGE_START_MINS = BEDTIME_MINS - (4 * 60 + 30);

  const endH = Math.floor(STAGE_END_MINS / 60);
  const endM = STAGE_END_MINS % 60;
  const timebarEndEl = document.getElementById('timebar-end');
  if (timebarEndEl) {
    timebarEndEl.textContent = `${endH}:${endM.toString().padStart(2,'0')}まで`;
  }
}
updateStageTimes();

/* ============================================================
   CHARACTER STATE MACHINE
   Per player (0 = AK, 1 = DI): tracks bath/dinner/toilet/gn
============================================================ */
const playerState = [
  { bath: false, belly: false, sleeping: false, tired: false },
  { bath: false, belly: false, sleeping: false, tired: false },
];

function getVisualState(p) {
  const s = playerState[p];
  if (s.sleeping) return 'sleeping';
  const pj = s.bath;
  const bl = s.belly;
  if (pj && bl) return s.tired ? 'tired_pajama_belly' : 'pajama_belly';
  if (pj)       return s.tired ? 'tired_pajama' : 'pajama';
  if (bl)       return s.tired ? 'tired_belly' : 'belly';
  return s.tired ? 'tired' : 'normal';
}

/* ============================================================
   ANIMATION FRAME TICKER
============================================================ */
let walkFrame = 0;
let lastFrameFlip = 0;
const WALK_INTERVAL = 350; // ms per frame

function tick(ts) {
  if (ts - lastFrameFlip > WALK_INTERVAL) {
    walkFrame = 1 - walkFrame;
    lastFrameFlip = ts;
    redrawSprites();
  }
  requestAnimationFrame(tick);
}

/* ============================================================
   DOM REFERENCES
============================================================ */
let charEls = {}; // { ak: el, di: el, ryo: el }

function buildCharacter(id, label, palette, isRyo) {
  const el = document.createElement('div');
  el.className = 'character';
  el.id = 'char-' + id;

  const lbl = document.createElement('div');
  lbl.className = 'char-label';
  lbl.textContent = label;

  const body = document.createElement('div');
  body.className = 'char-body ' + (isRyo ? 'crawl' : 'walk');

  const sprite = document.createElement('div');
  sprite.className = 'pixel-sprite';
  sprite.id = 'sprite-' + id;

  body.appendChild(sprite);
  el.appendChild(lbl);
  el.appendChild(body);

  // Store palette on element for redraw
  el._palette = palette;
  el._isRyo = isRyo;

  return el;
}

function redrawSprites() {
  // NOTE: pixel-sprite element stays at PX×PX (5×5px).
  // box-shadow paints each pixel as a PX-sized block offset from that tiny base.
  // We set the CHARACTER div width (not sprite width) for correct centering.

  // AK
  const akEl = document.getElementById('sprite-ak');
  if (akEl) {
    const state = getVisualState(0);
    const grid = getCharGrid(state, walkFrame);
    akEl.style.boxShadow = gridToShadow(grid, PAL_AK);
    // Set character div width so translateX(-50%) centers correctly
    const charEl = document.getElementById('char-ak');
    if (charEl) charEl.style.width = spriteSize(grid).w + 'px';
    const body = akEl.parentElement;
    body.className = 'char-body ' + (state === 'sleeping' ? 'sleeping' : state.startsWith('tired') ? 'walk-slow' : 'walk');
  }

  // DI
  const diEl = document.getElementById('sprite-di');
  if (diEl) {
    const state = getVisualState(1);
    const grid = getCharGrid(state, walkFrame);
    diEl.style.boxShadow = gridToShadow(grid, PAL_DI);
    const charEl = document.getElementById('char-di');
    if (charEl) charEl.style.width = spriteSize(grid).w + 'px';
    const body = diEl.parentElement;
    body.className = 'char-body ' + (state === 'sleeping' ? 'sleeping' : state.startsWith('tired') ? 'walk-slow' : 'walk');
  }

  // RYO
  const ryoEl = document.getElementById('sprite-ryo');
  if (ryoEl) {
    const grid = walkFrame === 0 ? RYO_CRAWL1 : RYO_CRAWL2;
    ryoEl.style.boxShadow = gridToShadow(grid, PAL_RYO);
    const charEl = document.getElementById('char-ryo');
    if (charEl) charEl.style.width = spriteSize(grid).w + 'px';
  }
}

/* ============================================================
   STAGE POSITION
============================================================ */
function nowMins() {
  const n = new Date();
  return n.getHours() * 60 + n.getMinutes();
}

function timeProgress() {
  const total = STAGE_END_MINS - STAGE_START_MINS; // 300
  const elapsed = Math.max(0, Math.min(total, nowMins() - STAGE_START_MINS));
  return elapsed / total;
}

function updatePositions() {
  const track = document.getElementById('track');
  if (!track) return;
  const trackW = track.offsetWidth;
  const prog = timeProgress();

  // AK is at full progress, DI slightly behind, RYO further behind
  const akX  = prog * trackW;
  const diX  = Math.max(0, akX - 30);
  const ryoX = Math.max(0, akX - 65);

  const akEl  = document.getElementById('char-ak');
  const diEl  = document.getElementById('char-di');
  const ryoEl = document.getElementById('char-ryo');

  if (akEl)  akEl.style.left  = akX  + 'px';
  if (diEl)  diEl.style.left  = diX  + 'px';
  if (ryoEl) ryoEl.style.left = ryoX + 'px';

  // Progress line
  const pline = document.getElementById('progress-line');
  if (pline) pline.style.width = (akX) + 'px';

  updateTimebar();
  updateDayNight();
  updateTiredState();
}

function updateTimebar() {
  const now = new Date();
  const [th, tm] = targetTimeStr.split(':').map(Number);
  const target = new Date();
  target.setHours(th, tm, 0, 0);
  if (target < now) target.setDate(target.getDate() + 1);

  const diffMins = Math.max(0, Math.floor((target - now) / 60000));
  const valEl = document.getElementById('time-remaining-value');
  if (!valEl) return;

  if (diffMins <= 0) {
    valEl.textContent = '0:00';
  } else {
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    valEl.textContent = h > 0 ? `${h}時間${m.toString().padStart(2,'0')}分` : `${m}分`;
  }
}

function updateDayNight() {
  const mins = nowMins();
  const sky  = document.getElementById('stage-sky');
  const stars = document.getElementById('stars');
  const moon  = document.getElementById('moon');
  if (!sky) return;

  // Day → Dusk → Night color transitions
  if (mins < 17 * 60) {
    sky.style.background = 'linear-gradient(180deg, #87CEEB 0%, #B8E4F9 100%)';
  } else if (mins < 18 * 60) {
    sky.style.background = 'linear-gradient(180deg, #F4A460 0%, #FFD080 100%)';
    stars.classList.remove('visible'); moon.classList.remove('visible');
  } else if (mins < 19 * 60) {
    sky.style.background = 'linear-gradient(180deg, #CC7744 0%, #FF9966 100%)';
  } else if (mins < 20 * 60) {
    sky.style.background = 'linear-gradient(180deg, #4A3A6A 0%, #8B5E9A 100%)';
    stars.classList.add('visible'); moon.classList.add('visible');
  } else {
    sky.style.background = 'linear-gradient(180deg, #1A1035 0%, #2D1B55 100%)';
    stars.classList.add('visible'); moon.classList.add('visible');
  }
}

function updateTiredState() {
  const mins = nowMins();
  const overlay = document.getElementById('tired-overlay');
  if (!overlay) return;
  if (mins >= BEDTIME_MINS) {
    overlay.classList.add('active');
    playerState[0].tired = !playerState[0].sleeping;
    playerState[1].tired = !playerState[1].sleeping;
  }
}

/* ============================================================
   STAGE BUILD
============================================================ */
function buildStage() {
  const track = document.getElementById('track');
  track.innerHTML = '';

  // Progress line
  const pline = document.createElement('div');
  pline.className = 'progress-line';
  pline.id = 'progress-line';
  track.appendChild(pline);

  // Bed marker at 21:00 (= 270/300 = 90% of 5h range)
  const bedPct = ((BEDTIME_MINS - STAGE_START_MINS) / (STAGE_END_MINS - STAGE_START_MINS)) * 100;
  const bedMarker = document.createElement('div');
  bedMarker.className = 'bed-marker';
  bedMarker.style.left = bedPct + '%';
  bedMarker.textContent = '🛏️';
  track.appendChild(bedMarker);

  // Goal line at 21:00
  const goalLine = document.createElement('div');
  goalLine.className = 'goal-line';
  goalLine.style.left = bedPct + '%';
  track.appendChild(goalLine);

  // Task markers
  tasks.forEach((task, i) => {
    const typeInfo = TASK_TYPES[task.type] || TASK_TYPES.other;
    // Evenly space special task type markers
    const pct = 10 + i * (70 / Math.max(tasks.length - 1, 1));
    const marker = document.createElement('div');
    marker.className = 'task-marker';
    marker.style.left = pct + '%';
    marker.title = task.name;
    marker.textContent = typeInfo.emoji;
    track.appendChild(marker);
  });

  // Stars in sky
  const starsEl = document.getElementById('stars');
  starsEl.innerHTML = '';
  for (let i = 0; i < 20; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top  = Math.random() * 80 + '%';
    star.style.animationDelay = Math.random() * 2 + 's';
    starsEl.appendChild(star);
  }

  // Build characters
  const akEl  = buildCharacter('ak',  name1, PAL_AK,  false);
  const diEl  = buildCharacter('di',  name2, PAL_DI,  false);
  const ryoEl = buildCharacter('ryo', 'RYO', PAL_RYO, true);

  track.appendChild(ryoEl);
  track.appendChild(diEl);
  track.appendChild(akEl);

  redrawSprites();
  updatePositions();

  // Render any persistent event icons
  droppedIcons.forEach(renderDroppedIcon);
}

/* ============================================================
   TASK EVENT ANIMATIONS
============================================================ */
const TASK_EVENTS = {
  bath: async (player) => {
    showEventPopup('🛁', 'お風呂はいった！', player);
    await delay(600);
    showCoins();
    await delay(1500);
    playerState[player].bath = true;
    redrawSprites();
    showEventPopup('🧴', 'パジャマに着替えた！', player);
    await delay(1200);
  },
  dinner: async (player) => {
    showEventPopup('🍽️', 'むしゃむしゃ〜！', player);
    await delay(600);
    showCoins();
    await delay(1500);
    playerState[player].belly = true;
    redrawSprites();
    showEventPopup('🤰', 'おなかぱんぱん！', player);
    await delay(1200);
  },
  toilet: async (player) => {
    showEventPopup('🚽', 'トイレ完了！', player);
    await delay(600);
    showCoins();
    await delay(1500);
    playerState[player].belly = false; // belly tucks in
    redrawSprites();
    await delay(800);
  },
  study: async (player) => {
    showEventPopup('📚', 'べんきょうした！', player);
    await delay(600);
    showCoins();
    await delay(1200);
  },
  exercise: async (player) => {
    showEventPopup('🥊', 'うりゃー！', player);
    await delay(400);
    showEventPopup('💪', 'きたえた！', player);
    await delay(600);
    showCoins();
    await delay(1000);
  },
  cleanup: async (player) => {
    showEventPopup('🧹', 'きれいにした！', player);
    await delay(600);
    showCoins();
    await delay(1200);
  },
  other: async (player) => {
    showEventPopup('⭐', 'やったね！', player);
    await delay(500);
    showCoins();
    await delay(1000);
  },
};

const GOODNIGHT_EVENT = async (player) => {
  showEventPopup('🛏️', 'おやすみ〜！');
  await delay(600);
  playerState[player].sleeping = true;
  playerState[player].tired = false;
  redrawSprites();
  await delay(1000);
  const early = nowMins() < BEDTIME_MINS;
  if (early) showEventMsg('⭐ はやね！えらい！');
  await delay(1500);
};

let animQueue = Promise.resolve();
function queueAnimation(fn) {
  animQueue = animQueue.then(fn).catch(() => {});
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function showEventPopup(emoji, msg, player) {
  const layer = document.getElementById('event-layer');
  layer.innerHTML = '';
  const popup = document.createElement('div');
  popup.className = 'event-popup';
  popup.textContent = emoji;
  const msgEl = document.createElement('div');
  msgEl.className = 'event-msg';
  msgEl.textContent = msg;

  if (player !== undefined) {
    const charId = player === 0 ? 'char-ak' : 'char-di';
    const charEl = document.getElementById(charId);
    if (charEl) {
      const rect = charEl.getBoundingClientRect();
      const layerRect = layer.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - layerRect.left;
      const y = rect.top - layerRect.top;
      
      popup.style.left = x + 'px';
      popup.style.bottom = 'auto';
      popup.style.top = (y - 50) + 'px';
      
      msgEl.style.left = x + 'px';
      msgEl.style.bottom = 'auto';
      msgEl.style.top = (y - 90) + 'px';

      if (['🛁', '🍽️', '🚽', '🥊', '🧹'].includes(emoji)) {
        dropEventIcon(emoji, player);
      }
    }
  }

  layer.appendChild(popup);
  layer.appendChild(msgEl);
  setTimeout(() => {
    popup.style.transition = 'opacity 0.5s';
    popup.style.opacity = '0';
    msgEl.style.transition = 'opacity 0.5s';
    msgEl.style.opacity = '0';
    setTimeout(() => layer.innerHTML = '', 600);
  }, 1800);
}

function showEventMsg(msg) {
  const layer = document.getElementById('event-layer');
  const msgEl = document.createElement('div');
  msgEl.className = 'event-msg';
  msgEl.textContent = msg;
  layer.appendChild(msgEl);
  setTimeout(() => {
    msgEl.style.transition = 'opacity 0.5s';
    msgEl.style.opacity = '0';
    setTimeout(() => msgEl.remove(), 600);
  }, 2000);
}

function showCoins() {
  const layer = document.getElementById('event-layer');
  for (let i = 0; i < 5; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = '🪙';
    coin.style.left  = (30 + Math.random() * 40) + '%';
    coin.style.bottom = '40%';
    coin.style.animationDelay = (i * 0.1) + 's';
    layer.appendChild(coin);
    setTimeout(() => coin.remove(), 1500);
  }
}

function dropEventIcon(emoji, player) {
  const prog = timeProgress();
  const iconData = { emoji, player, percent: prog * 100 };
  
  const isDuplicate = droppedIcons.some(d => d.emoji === emoji && d.player === player && Math.abs(d.percent - iconData.percent) < 1);
  if (!isDuplicate) {
    droppedIcons.push(iconData);
    localStorage.setItem('droppedIcons', JSON.stringify(droppedIcons));
    renderDroppedIcon(iconData);
  }
}

function renderDroppedIcon(iconData) {
  const track = document.getElementById('track');
  if (!track) return;
  const icon = document.createElement('div');
  icon.textContent = iconData.emoji;
  icon.style.position = 'absolute';
  icon.style.bottom = iconData.player === 0 ? '10px' : '30px'; 
  icon.style.left = iconData.percent + '%';
  icon.style.fontSize = '1.3rem';
  icon.style.zIndex = '5';
  icon.style.transform = 'translateX(-50%)';
  icon.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))';
  track.appendChild(icon);
}

/* ============================================================
   TASK LIST RENDERER
============================================================ */
function getCheckKey(taskIdx, player) { return `t${taskIdx}_p${player}`; }

function renderTaskList() {
  const body = document.getElementById('task-list-body');
  body.innerHTML = tasks.map((task, i) => {
    const c0 = checks[getCheckKey(i, 0)];
    const c1 = checks[getCheckKey(i, 1)];
    const allDone = c0 && c1;
    const typeInfo = TASK_TYPES[task.type] || TASK_TYPES.other;
    return `
    <div class="task-row${allDone ? ' all-done' : ''}" data-row="${i}">
      <span class="task-label">
        <span class="task-type-badge">${typeInfo.emoji}</span>${escHtml(task.name)}
      </span>
      <div class="check-col">
        <div class="checkbox-wrapper${c0 ? ' checked' : ''}" data-task="${i}" data-player="0">
          <div class="checkbox"></div>
        </div>
      </div>
      <div class="check-col">
        <div class="checkbox-wrapper${c1 ? ' checked' : ''}" data-task="${i}" data-player="1">
          <div class="checkbox"></div>
        </div>
      </div>
    </div>`;
  }).join('');

  attachCheckboxListeners();
  updateGoodnightChecks();
  updateCompletionNotice();
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function attachCheckboxListeners() {
  document.querySelectorAll('#task-list-body .checkbox-wrapper').forEach(el => {
    el.addEventListener('click', (e) => {
      createRipple(e, el);
      const ti = parseInt(el.dataset.task);
      const pi = parseInt(el.dataset.player);
      const key = getCheckKey(ti, pi);
      const wasChecked = !!checks[key];
      checks[key] = !wasChecked;
      if (!checks[key]) delete checks[key];
      localStorage.setItem('checks', JSON.stringify(checks));

      el.classList.toggle('checked', !!checks[key]);
      const row = document.querySelector(`.task-row[data-row="${ti}"]`);
      const allDone = !!checks[getCheckKey(ti,0)] && !!checks[getCheckKey(ti,1)];
      row.classList.toggle('all-done', allDone);
      row.querySelector('.task-label').style.textDecoration = allDone ? 'line-through' : '';
      row.querySelector('.task-label').style.color = allDone ? '#B0C4C0' : '';

      // Trigger animation only when newly checked
      if (!wasChecked) {
        const taskType = (tasks[ti] || {}).type || 'other';
        const animFn = TASK_EVENTS[taskType] || TASK_EVENTS.other;
        queueAnimation(() => animFn(pi));
      }

      updateCompletionNotice();
    });
  });
}

// Goodnight checkboxes
function updateGoodnightChecks() {
  document.querySelectorAll('[data-task="goodnight"]').forEach(el => {
    const pi = parseInt(el.dataset.player);
    const checked = !!gnChecks[pi];
    el.classList.toggle('checked', checked);
  });
}

document.querySelectorAll('[data-task="goodnight"]').forEach(el => {
  el.addEventListener('click', (e) => {
    createRipple(e, el);
    const pi = parseInt(el.dataset.player);
    const was = !!gnChecks[pi];
    gnChecks[pi] = !was;
    if (!gnChecks[pi]) delete gnChecks[pi];
    localStorage.setItem('gnChecks', JSON.stringify(gnChecks));
    el.classList.toggle('checked', !!gnChecks[pi]);
    if (!was) {
      queueAnimation(() => GOODNIGHT_EVENT(pi));
    }
    updateCompletionNotice();
  });
});

function updateCompletionNotice() {
  const totalChecks = tasks.length * 2 + 2; // tasks × 2 players + 2 goodnight
  const taskDone  = Object.values(checks).filter(Boolean).length;
  const gnDone    = Object.values(gnChecks).filter(Boolean).length;
  const done = taskDone + gnDone;
  const notice = document.getElementById('completion-notice');
  if (done >= totalChecks && totalChecks > 0) {
    notice.classList.remove('hidden');
    fireConfetti();
  } else {
    notice.classList.add('hidden');
  }
}

function createRipple(event, el) {
  const old = el.querySelector('.ripple');
  if (old) old.remove();
  const circle = document.createElement('span');
  const d = Math.max(el.clientWidth, el.clientHeight);
  const r = el.getBoundingClientRect();
  circle.style.cssText = `width:${d}px;height:${d}px;left:${event.clientX-r.left-d/2}px;top:${event.clientY-r.top-d/2}px`;
  circle.classList.add('ripple');
  el.appendChild(circle);
}

/* ============================================================
   NAME DISPLAY
============================================================ */
function updateNameDisplay() {
  document.getElementById('name1-display').textContent = name1;
  document.getElementById('name2-display').textContent = name2;
  const lbl = document.getElementById('sprite-ak')?.closest('.character')?.querySelector('.char-label');
  if (lbl) lbl.textContent = name1;
  const lbl2 = document.getElementById('sprite-di')?.closest('.character')?.querySelector('.char-label');
  if (lbl2) lbl2.textContent = name2;
}

/* ============================================================
   SETTINGS MODAL
============================================================ */
document.getElementById('settings-btn').addEventListener('click', () => {
  document.getElementById('target-time-input').value = targetTimeStr;
  document.getElementById('name1-input').value = name1;
  document.getElementById('name2-input').value = name2;
  document.getElementById('settings-modal').classList.remove('hidden');
});
document.getElementById('close-settings').addEventListener('click', () => {
  document.getElementById('settings-modal').classList.add('hidden');
});
document.getElementById('settings-modal').addEventListener('click', (e) => {
  if (e.target.id === 'settings-modal') document.getElementById('settings-modal').classList.add('hidden');
});
document.getElementById('save-settings').addEventListener('click', () => {
  targetTimeStr = document.getElementById('target-time-input').value || '21:00';
  name1 = document.getElementById('name1-input').value.trim() || 'AK';
  name2 = document.getElementById('name2-input').value.trim() || 'DI';
  localStorage.setItem('targetTime', targetTimeStr);
  localStorage.setItem('name1', name1);
  localStorage.setItem('name2', name2);
  updateNameDisplay();
  updateStageTimes();
  buildStage();
  document.getElementById('settings-modal').classList.add('hidden');
});

/* ============================================================
   EDIT TASKS MODAL
============================================================ */
let editingTasks = [];

function openEditModal() {
  editingTasks = tasks.map(t => ({ ...t }));
  renderEditList();
  document.getElementById('edit-modal').classList.remove('hidden');
}

function renderEditList() {
  const container = document.getElementById('edit-task-list');
  const typeOptions = Object.entries(TASK_TYPES)
    .map(([k, v]) => `<option value="${k}">${v.emoji} ${v.label}</option>`)
    .join('');

  container.innerHTML = editingTasks.map((t, i) => `
    <div class="edit-task-item" data-idx="${i}">
      <span class="drag-handle" title="並び替え">⠿</span>
      <select class="edit-type-select" data-idx="${i}">
        ${Object.entries(TASK_TYPES).map(([k,v]) =>
          `<option value="${k}"${t.type===k?' selected':''}>${v.emoji}</option>`
        ).join('')}
      </select>
      <input class="edit-task-input" type="text"
             value="${escHtml(t.name)}"
             placeholder="タスク名"
             data-idx="${i}" />
      <button class="delete-task-btn" data-idx="${i}" title="削除">✕</button>
    </div>
  `).join('');

  container.querySelectorAll('.edit-type-select').forEach(sel => {
    sel.addEventListener('change', () => {
      editingTasks[parseInt(sel.dataset.idx)].type = sel.value;
    });
  });
  container.querySelectorAll('.edit-task-input').forEach(inp => {
    inp.addEventListener('input', () => {
      editingTasks[parseInt(inp.dataset.idx)].name = inp.value;
    });
  });
  container.querySelectorAll('.delete-task-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      editingTasks.splice(parseInt(btn.dataset.idx), 1);
      renderEditList();
    });
  });
  addDragAndDrop(container);
}

function addDragAndDrop(container) {
  let dragSrc = null;
  container.querySelectorAll('.edit-task-item').forEach(item => {
    item.draggable = true;
    item.addEventListener('dragstart', (e) => {
      dragSrc = item; item.style.opacity = '0.45';
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.style.opacity = '';
      container.querySelectorAll('.edit-task-item').forEach(i => i.style.background = '');
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (item !== dragSrc) item.style.background = '#E8E0FF';
    });
    item.addEventListener('dragleave', () => item.style.background = '');
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSrc && dragSrc !== item) {
        const all = [...container.querySelectorAll('.edit-task-item')];
        const si = all.indexOf(dragSrc), di = all.indexOf(item);
        const moved = editingTasks.splice(si, 1)[0];
        editingTasks.splice(di, 0, moved);
        renderEditList();
      }
    });
  });
}

document.getElementById('edit-btn').addEventListener('click', openEditModal);
document.getElementById('close-edit').addEventListener('click', () => {
  document.getElementById('edit-modal').classList.add('hidden');
});
document.getElementById('edit-modal').addEventListener('click', (e) => {
  if (e.target.id === 'edit-modal') document.getElementById('edit-modal').classList.add('hidden');
});
document.getElementById('add-task-btn').addEventListener('click', () => {
  editingTasks.push({ name: '新しいタスク', type: 'other' });
  renderEditList();
  const inputs = document.querySelectorAll('.edit-task-input');
  if (inputs.length) { const last = inputs[inputs.length-1]; last.focus(); last.select(); }
});
document.getElementById('save-edit').addEventListener('click', () => {
  document.querySelectorAll('.edit-task-input').forEach(inp => {
    const i = parseInt(inp.dataset.idx);
    if (editingTasks[i]) editingTasks[i].name = inp.value.trim() || inp.value;
  });
  tasks = editingTasks.filter(t => t.name.trim().length > 0);
  localStorage.setItem('tasks2', JSON.stringify(tasks));
  checks = {};
  localStorage.setItem('checks', JSON.stringify(checks));
  renderTaskList();
  buildStage();
  document.getElementById('edit-modal').classList.add('hidden');
});

/* ============================================================
   CONFETTI
============================================================ */
let confettiActive = false;
function fireConfetti() {
  if (confettiActive) return;
  confettiActive = true;
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#ff7eb3','#a78bfa','#7ec8e3','#ffe066','#52c78a','#ffa040'];
  const pieces = Array.from({length:150}, () => ({
    x: canvas.width / 2, y: canvas.height / 2,
    vx: (Math.random()-0.5)*22, vy: (Math.random()-1.2)*18-4,
    size: Math.random()*9+4,
    color: colors[Math.floor(Math.random()*colors.length)],
    rotation: Math.random()*360, rotSpeed: (Math.random()-0.5)*12,
  }));
  function animate() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    let alive = false;
    for (const p of pieces) {
      p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.rotation += p.rotSpeed;
      if (p.y < canvas.height+20) alive = true;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation*Math.PI/180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size/2,-p.size/4,p.size,p.size/2);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(animate);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); confettiActive = false; }
  }
  animate();
}

/* ============================================================
   RESTORE STATE FROM CHECKS
============================================================ */
function restorePlayerStates() {
  // Process tasks in order to rebuild belly state correctly
  tasks.forEach((task, i) => {
    [0, 1].forEach(p => {
      if (checks[getCheckKey(i, p)]) {
        const type = task.type;
        if (type === 'bath')   playerState[p].bath  = true;
        if (type === 'dinner') playerState[p].belly = true;
        if (type === 'toilet') playerState[p].belly = false;
      }
    });
  });
  [0, 1].forEach(p => {
    if (gnChecks[p]) playerState[p].sleeping = true;
  });
  if (nowMins() >= BEDTIME_MINS) {
    playerState.forEach(s => { if (!s.sleeping) s.tired = true; });
  }
}

/* ============================================================
   INIT
============================================================ */
restorePlayerStates();
buildStage();
renderTaskList();
updateNameDisplay();

// Initial position: disable CSS transition so characters snap to correct spot immediately
requestAnimationFrame(() => {
  document.querySelectorAll('.character').forEach(el => {
    el.style.transition = 'none';
  });
  updatePositions();
  // Re-enable smooth transition after next frame
  requestAnimationFrame(() => {
    document.querySelectorAll('.character').forEach(el => {
      el.style.transition = '';
    });
  });
});

// Position update loop (every minute)
setInterval(updatePositions, 60000);

// Sprite walk animation loop
requestAnimationFrame(tick);
