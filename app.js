/* ===== Festival Fortune — Engine ===== */

// --- Festival registry: loaded from festivals/<key>/ ---
const FESTIVALS = [
  { key: 'halloween',      name: 'Halloween',       emoji: '🎃', startMonth: 10, startDay: 25, endMonth: 10, endDay: 31, region: 'Worldwide' },
  { key: 'christmas',      name: 'Christmas',       emoji: '🎄', startMonth: 12, startDay: 20, endMonth: 12, endDay: 25, region: 'Worldwide' },
  { key: 'diwali',         name: 'Diwali',          emoji: '🪔', startMonth: 10, startDay: 20, endMonth: 11, endDay: 5,  region: 'South Asia' },
  { key: 'eid',            name: 'Eid',             emoji: '🌙', startMonth: 4,  startDay: 1,  endMonth: 5,  endDay: 5,  region: 'Muslim-majority regions' },
  { key: 'lunar-new-year', name: 'Lunar New Year',  emoji: '🐉', startMonth: 1,  startDay: 20, endMonth: 2,  endDay: 10, region: 'East Asia' },
  { key: 'valentine',      name: "Valentine's Day", emoji: '💕', startMonth: 2,  startDay: 10, endMonth: 2,  endDay: 15, region: 'Worldwide' },
  { key: 'birthday',       name: 'Birthday',        emoji: '🎂', startMonth: 1,  startDay: 1,  endMonth: 12, endDay: 31, region: 'Everywhere' },
];

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Readable date window: "Oct 25 – 31" (same month), "Oct 25 – Nov 5" (crossing), or all-year for birthday.
function dateLabel(f) {
  if (f.key === 'birthday') return 'Any day — it\'s yours';
  const start = `${MONTH_SHORT[f.startMonth - 1]} ${f.startDay}`;
  const end = f.startMonth === f.endMonth
    ? `${f.endDay}`
    : `${MONTH_SHORT[f.endMonth - 1]} ${f.endDay}`;
  return `${start} – ${end}`;
}

// --- State ---
let state = loadState();

function loadState() {
  try { return JSON.parse(localStorage.getItem('ff_state')) || defaultState(); }
  catch { return defaultState(); }
}

function defaultState() {
  return { birthYear: null, journal: [], streaks: {}, currentFestival: null, currentFortune: null };
}

function saveState() { localStorage.setItem('ff_state', JSON.stringify(state)); }

// --- Utility ---
function today() { return new Date(); }
function dateKey(d) { return d.toISOString().slice(0,10); }
function ageFromBirthYear(y) { return y ? today().getFullYear() - y : null; }
function isToday(d) { return dateKey(d) === dateKey(today()); }
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._timer); t._timer = setTimeout(() => t.classList.add('hidden'), 2500);
}

// --- Festival window logic ---
function isFestivalActive(f) {
  const now = today(), m = now.getMonth()+1, d = now.getDate();
  if (f.startMonth === f.endMonth) return m === f.startMonth && d >= f.startDay && d <= f.endDay;
  if (m === f.startMonth) return d >= f.startDay;
  if (m === f.endMonth) return d <= f.endDay;
  return false;
}

function hasCrackedToday(key) {
  const s = state.streaks[key];
  return s && s.lastOpened === dateKey(today());
}

// --- Festival data loader ---
const _festivalCache = {};
async function loadFestivalData(key) {
  if (_festivalCache[key]) return _festivalCache[key];
  const resp = await fetch(`festivals/${key}/fortunes.json`);
  const data = await resp.json();
  _festivalCache[key] = data;
  return data;
}

// --- Rarity roll ---
function rollRarity(tiers) {
  // tiers: { common: 60, uncommon: 25, rare: 12, legendary: 3 }
  const total = Object.values(tiers).reduce((a,b) => a+b, 0);
  let roll = Math.random() * total;
  for (const [tier, weight] of Object.entries(tiers)) {
    roll -= weight;
    if (roll <= 0) return tier;
  }
  return 'common';
}

// --- Fortune selection ---
function pickFortune(fortunes, rarity, festivalKey) {
  // Filter by rarity
  let pool = fortunes.filter(f => f.rarity === rarity);
  // If empty, fall back to common
  if (!pool.length) pool = fortunes.filter(f => f.rarity === 'common');
  if (!pool.length) pool = fortunes;

  // Birthday: filter by age band
  if (festivalKey === 'birthday') {
    const age = ageFromBirthYear(state.birthYear);
    if (age != null) {
      const agePool = pool.filter(f => {
        const band = f.ageBand;
        if (!band) return true;
        return age >= band[0] && age <= band[1];
      });
      if (agePool.length) pool = agePool;
    }
  }

  // Exclude already-seen fortunes this festival window (avoid repeats)
  const seenIds = new Set(
    state.journal
      .filter(j => j.festival === festivalKey && j.date >= dateKey(new Date(today().getFullYear(), today().getMonth(), today().getDate() - 7)))
      .map(j => j.fortuneId)
  );
  const unseen = pool.filter(f => !seenIds.has(f.id));
  if (unseen.length) pool = unseen;

  return pool[Math.floor(Math.random() * pool.length)];
}

// --- View switching ---
function showView(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${viewId}`).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.view === viewId));
}

// --- Theme toggle ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme || 'dark');
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem('ff_theme', next); } catch {}
}

function initTheme() {
  let theme = 'dark';
  try { theme = localStorage.getItem('ff_theme') || 'dark'; } catch {}
  applyTheme(theme);
}

// --- Render festival grid ---
function renderFestivalGrid() {
  const grid = document.getElementById('festival-grid');
  grid.innerHTML = '';
  FESTIVALS.forEach(f => {
    const active = isFestivalActive(f);
    const cracked = hasCrackedToday(f.key);
    const card = document.createElement('div');
    card.className = `festival-card${f.key === 'birthday' ? ' today' : ''}${!active && f.key !== 'birthday' ? ' upcoming' : ''}`;
    card.dataset.festival = f.key;

    let statusHtml;
    if (cracked) statusHtml = `<span class="festival-status cracked">✓ Cracked today</span>`;
    else if (active) statusHtml = `<span class="festival-status available">Ready to crack</span>`;
    else statusHtml = `<span class="festival-status upcoming">Upcoming</span>`;

    card.innerHTML = `
      <div class="festival-emoji">${f.emoji}</div>
      <div class="festival-name">${f.name}</div>
      <div class="festival-date">${dateLabel(f)}</div>
      <div class="festival-region">${f.region}</div>
      ${statusHtml}
    `;
    card.addEventListener('click', () => {
      if (f.key === 'birthday' || active) openCrackStage(f.key);
      else showToast(`${f.name} hasn't started yet`);
    });
    grid.appendChild(card);
  });
}

// --- Open crack stage ---
async function openCrackStage(key) {
  state.currentFestival = key;
  const data = await loadFestivalData(key);
  state._currentData = data;

  if (hasCrackedToday(key)) {
    // Show existing fortune
    const prev = state.journal.filter(j => j.festival === key).pop();
    if (prev) { showReveal(data.fortunes.find(f => f.id === prev.fortuneId)); return; }
  }

  showView('home');
  document.getElementById('festival-grid').classList.add('hidden');
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('reveal-stage').classList.add('hidden');
  document.getElementById('crack-stage').classList.remove('hidden');

  document.getElementById('crack-festival-name').textContent = data.name || FESTIVALS.find(f=>f.key===key).name;
  document.getElementById('vessel-svg').innerHTML = data.vesselSvg || '';
  document.getElementById('hold-fill').style.width = '0%';
}

// --- Back buttons ---
document.getElementById('back-from-crack').addEventListener('click', () => {
  document.getElementById('crack-stage').classList.add('hidden');
  document.getElementById('festival-grid').classList.remove('hidden');
  document.querySelector('.hero').classList.remove('hidden');
});

document.getElementById('back-from-reveal').addEventListener('click', () => {
  document.getElementById('reveal-stage').classList.add('hidden');
  document.getElementById('festival-grid').classList.remove('hidden');
  document.querySelector('.hero').classList.remove('hidden');
});

document.getElementById('btn-again').addEventListener('click', () => {
  document.getElementById('reveal-stage').classList.add('hidden');
  if (state.currentFestival) openCrackStage(state.currentFestival);
});

// --- Hold-to-crack ---
const vessel = document.getElementById('vessel');
const holdFill = document.getElementById('hold-fill');
let holdTimer = null, holdStart = 0;
const HOLD_DURATION = 2000;

function startHold(e) {
  e.preventDefault();
  vessel.classList.add('holding');
  holdStart = Date.now();
  holdTimer = setInterval(() => {
    const pct = Math.min((Date.now() - holdStart) / HOLD_DURATION * 100, 100);
    holdFill.style.width = pct + '%';
    if (pct >= 100) { clearInterval(holdTimer); crackVessel(); }
  }, 30);
}

function endHold() {
  if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
  vessel.classList.remove('holding');
  holdFill.style.width = '0%';
}

vessel.addEventListener('pointerdown', startHold);
vessel.addEventListener('pointerup', endHold);
vessel.addEventListener('pointerleave', endHold);
vessel.addEventListener('pointercancel', endHold);

// --- Crack vessel ---
function crackVessel() {
  vessel.classList.add('cracked');
  spawnParticles();
  setTimeout(() => {
    const key = state.currentFestival;
    const data = state._currentData;
    const rarity = rollRarity(data.rarityTiers);
    const fortune = pickFortune(data.fortunes, rarity, key);

    // Record
    if (!hasCrackedToday(key)) {
      const s = state.streaks[key] || { count: 0 };
      s.lastOpened = dateKey(today());
      s.count = (s.lastOpened === dateKey(today()) ? s.count : 0) + 1;
      state.streaks[key] = s;
      state.journal.push({ date: dateKey(today()), festival: key, fortuneId: fortune.id, rarity: fortune.rarity });
      saveState();
    }

    showReveal(fortune);
    vessel.classList.remove('cracked');
    renderFestivalGrid();
  }, 600);
}

// --- Show reveal ---
function showReveal(fortune) {
  if (!fortune) return;
  const key = state.currentFestival;
  const data = state._currentData;
  const fMeta = FESTIVALS.find(f => f.key === key);

  document.getElementById('crack-stage').classList.add('hidden');
  document.getElementById('festival-grid').classList.add('hidden');
  document.querySelector('.hero').classList.add('hidden');
  document.getElementById('reveal-stage').classList.remove('hidden');

  const card = document.getElementById('fortune-card');
  const accent = document.getElementById('card-accent');
  const badge = document.getElementById('card-festival-badge');
  const rarityEl = document.getElementById('card-rarity');
  const textEl = document.getElementById('card-fortune-text');
  const dateEl = document.getElementById('card-date');

  const palette = data.palette || {};
  card.style.background = palette.bg || 'var(--surface)';
  card.style.color = palette.text || 'var(--text)';
  accent.style.background = palette.accent || 'var(--accent)';
  badge.textContent = fMeta ? fMeta.name : key;
  badge.style.color = palette.muted || 'var(--muted)';
  rarityEl.textContent = (data.rarityLabels?.[fortune.rarity]) || fortune.rarity;
  rarityEl.className = `card-rarity ${fortune.rarity}`;
  textEl.textContent = fortune.text;
  dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  dateEl.style.color = palette.muted || 'var(--muted)';

  // Store for share
  state.currentFortune = fortune;
  document.getElementById('btn-save').textContent = 'Saved ✓';
  setTimeout(() => document.getElementById('btn-save').textContent = 'Save to Journal', 1500);
}

// --- Particle canvas ---
function spawnParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const particles = [];
  const cx = canvas.width / 2, cy = canvas.height / 2;

  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x: cx, y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      r: 2 + Math.random() * 4,
      life: 1,
      decay: 0.01 + Math.random() * 0.02,
      color: ['#d4a574','#ffd93d','#ff6b35','#fff'][Math.floor(Math.random()*4)]
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    particles.forEach(p => {
      if (p.life <= 0) return;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= p.decay;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) requestAnimationFrame(animate);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  animate();
}

// --- Journal rendering ---
function renderJournal() {
  const list = document.getElementById('journal-list');
  const count = document.getElementById('journal-count');
  count.textContent = `${state.journal.length} fortune${state.journal.length !== 1 ? 's' : ''} collected`;

  // Build filter buttons
  const filters = document.getElementById('journal-filters');
  const festKeys = [...new Set(state.journal.map(j => j.festival))];
  filters.innerHTML = '<button class="filter-btn active" data-filter="all">All</button>' +
    festKeys.map(k => {
      const f = FESTIVALS.find(ff => ff.key === k);
      return `<button class="filter-btn" data-filter="${k}">${f ? f.name : k}</button>`;
    }).join('');

  filters.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filters.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderJournalList(btn.dataset.filter);
    });
  });

  renderJournalList('all');
}

function renderJournalList(filter) {
  const list = document.getElementById('journal-list');
  const entries = filter === 'all' ? state.journal : state.journal.filter(j => j.festival === filter);

  if (!entries.length) {
    list.innerHTML = '<div class="journal-empty">No fortunes yet. Go crack a cookie!</div>';
    return;
  }

  list.innerHTML = entries.slice().reverse().map(j => {
    const f = FESTIVALS.find(ff => ff.key === j.festival);
    return `<div class="journal-entry">
      <div class="journal-entry-header">
        <span class="journal-entry-festival">${f ? f.emoji+' '+f.name : j.festival}</span>
        <span class="card-rarity ${j.rarity}">${j.rarity}</span>
      </div>
      <div class="journal-entry-text">${j.text || '(fortunes loaded from data)'}</div>
    </div>`;
  }).join('');

  // Backfill text from cache
  entries.slice().reverse().forEach((j, i) => {
    const data = _festivalCache[j.festival];
    if (!data) {
      loadFestivalData(j.festival).then(d => {
        const fortune = d.fortunes.find(f => f.id === j.fortuneId);
        if (fortune) list.children[i].querySelector('.journal-entry-text').textContent = fortune.text;
      });
    } else {
      const fortune = data.fortunes.find(f => f.id === j.fortuneId);
      if (fortune) list.children[i].querySelector('.journal-entry-text').textContent = fortune.text;
    }
  });
}

// --- Nav tabs ---
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const view = tab.dataset.view;
    showView(view);
    if (view === 'journal') renderJournal();
    if (view === 'settings') document.getElementById('birth-year').value = state.birthYear || '';
  });
});

// --- Settings ---
document.getElementById('birth-year').addEventListener('change', e => {
  state.birthYear = parseInt(e.target.value) || null;
  saveState();
  showToast('Birth year saved');
});

function clearJournal() {
  if (!confirm('Clear all fortunes from your journal?')) return;
  state.journal = []; state.streaks = {};
  saveState();
  showToast('Journal cleared');
  renderFestivalGrid();
  const list = document.getElementById('journal-list');
  if (list) renderJournalList('all');
}

document.getElementById('btn-clear-journal').addEventListener('click', clearJournal);
const btnClearJournalView = document.getElementById('btn-clear-journal-view');
if (btnClearJournalView) btnClearJournalView.addEventListener('click', clearJournal);

// --- Share button ---
document.getElementById('btn-share').addEventListener('click', () => {
  if (typeof renderShareCard === 'function') renderShareCard();
});

// --- OG meta tag updater ---
function updateOgTags(fortune, festivalName) {
  const baseUrl = 'https://festivalfortunecookie.vercel.app';
  const ogImage = `${baseUrl}/og-images/${fortune.id}.png`;
  const ogTitle = `My ${festivalName} Fortune`;
  const ogDesc = fortune.text.length > 200 ? fortune.text.slice(0,197) + '…' : fortune.text;

  const setMeta = (prop, content) => {
    let el = document.querySelector(`meta[property="${prop}"]`) || document.querySelector(`meta[name="${prop}"]`);
    if (el) el.setAttribute('content', content);
  };
  setMeta('og:title', ogTitle);
  setMeta('og:description', ogDesc);
  setMeta('og:image', ogImage);
  setMeta('og:url', `${baseUrl}/api/fortune?key=${encodeURIComponent(state.currentFestival)}&id=${encodeURIComponent(fortune.id)}`);
  setMeta('twitter:title', ogTitle);
  setMeta('twitter:description', ogDesc);
  setMeta('twitter:image', ogImage);
  document.title = `${ogTitle} — Festival Fortune`;
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  renderFestivalGrid();

  // Check URL hash for shared fortune
  if (location.hash.startsWith('#f=')) {
    try {
      const payload = JSON.parse(atob(location.hash.slice(3)));
      state.currentFestival = payload.key;
      loadFestivalData(payload.key).then(data => {
        state._currentData = data;
        const fortune = data.fortunes.find(f => f.id === payload.id);
        if (fortune) {
          showReveal(fortune);
          const fMeta = FESTIVALS.find(f => f.key === payload.key);
          updateOgTags(fortune, fMeta ? fMeta.name : 'Festival');
        }
      });
    } catch {}
  }
});
