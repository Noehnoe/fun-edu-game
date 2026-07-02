/* ===================================================================
   Engine — state, progression, navigation, badges, per-game API
   Exposes global `Game`.
   =================================================================== */
(function () {
  'use strict';

  const SAVE_KEY = 'brainy-bunch-save-v1';
  const CATS = {
    logic:    { label: 'Logic',    grad: 'linear-gradient(160deg,#7c5cff,#cc5de8)' },
    memory:   { label: 'Memory',   grad: 'linear-gradient(160deg,#4dabf7,#7c5cff)' },
    math:     { label: 'Math',     grad: 'linear-gradient(160deg,#20c997,#4dabf7)' },
    language: { label: 'Language', grad: 'linear-gradient(160deg,#f06595,#ffa94d)' },
    reflex:   { label: 'Reflex',   grad: 'linear-gradient(160deg,#ff6b6b,#ffa94d)' }
  };

  const games = [];        // registered game defs (in order)
  const gameById = {};

  /* ---------------- state ---------------- */
  const defaultState = {
    coins: 0,
    earned: 0,          // lifetime coins earned (for badges)
    xp: 0,
    plays: 0,
    played: [],         // unique game ids played
    best: {},           // gameId -> best stat (higher is better unless def.lowerBest)
    flags: {},          // custom achievement flags
    badges: [],         // earned badge ids
    soundOn: true,
    musicVol: 0.35,     // 0..1
    sfxVol: 1           // 0..1
  };
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return clone(defaultState);
      return Object.assign(clone(defaultState), JSON.parse(raw));
    } catch (e) { return clone(defaultState); }
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) {} }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------------- progression ---------------- */
  function levelInfo(totalXp) {
    let lvl = 1, used = 0, need = 100;
    while (totalXp - used >= need) { used += need; lvl++; need = 100 + (lvl - 1) * 45; }
    return { level: lvl, into: totalXp - used, need };
  }

  function unlockThreshold(def, index) {
    // unlocks staggered by coin total; first few are free
    if (def.unlockAt != null) return def.unlockAt;
    const steps = [0, 0, 0, 40, 80, 140, 220, 320, 440, 600, 800, 1050, 1350];
    return steps[index] != null ? steps[index] : 0;
  }
  function isUnlocked(def) { return state.coins >= def._unlock; }

  /* ---------------- badges ---------------- */
  const BADGES = [
    { id: 'first',     icon: '🌱', name: 'First Steps',    desc: 'Play your first game',  rule: s => s.plays >= 1 },
    { id: 'explorer',  icon: '🧭', name: 'Explorer',       desc: 'Play 5 different games', rule: s => s.played.length >= 5 },
    { id: 'complete',  icon: '🏆', name: 'Completionist',  desc: 'Try every game',         rule: s => s.played.length >= games.length },
    { id: 'saver',     icon: '🪙', name: 'Coin Saver',     desc: 'Earn 300 coins',         rule: s => s.earned >= 300 },
    { id: 'tycoon',    icon: '💎', name: 'Brain Tycoon',   desc: 'Earn 1500 coins',        rule: s => s.earned >= 1500 },
    { id: 'star',      icon: '⭐', name: 'Rising Star',     desc: 'Reach level 5',          rule: s => levelInfo(s.xp).level >= 5 },
    { id: 'super',     icon: '🌟', name: 'Superstar',      desc: 'Reach level 10',         rule: s => levelInfo(s.xp).level >= 10 },
    { id: 'mastermind',icon: '🧠', name: 'Mastermind',     desc: 'Reach round 8 in Simon', rule: s => !!s.flags.mastermind },
    { id: 'flash',     icon: '⚡', name: 'Lightning',      desc: 'React in under 300 ms',  rule: s => !!s.flags.flash },
    { id: 'perfect',   icon: '💯', name: 'Flawless',       desc: 'Get a perfect score',    rule: s => !!s.flags.perfect },
    { id: 'polyglot',  icon: '🔤', name: 'Polyglot',       desc: 'Play both word games',   rule: s => s.played.includes('scramble') && s.played.includes('translate') },
    { id: 'streak10',  icon: '🔥', name: 'On Fire',        desc: 'Play 10 rounds total',   rule: s => s.plays >= 10 }
  ];

  function checkBadges() {
    const newly = [];
    for (const b of BADGES) {
      if (!state.badges.includes(b.id) && b.rule(state)) {
        state.badges.push(b.id);
        newly.push(b);
      }
    }
    if (newly.length) {
      save();
      newly.forEach((b, i) => {
        setTimeout(() => {
          toast(`${b.icon} Badge unlocked: ${b.name}!`);
          FX.sound.play('badge');
          FX.starShower({ count: 36 });
          FX.confetti({ count: 40 });
        }, 700 + i * 900);
      });
      renderBadges();
    }
  }

  /* ---------------- DOM refs ---------------- */
  const el = {};
  function cacheDom() {
    ['coin-count','xp-fill','xp-text','level-badge','completion-pct','completion-ring',
     'games-played-stat','badges-stat','best-streak-stat','game-grid','badge-grid',
     'home-screen','play-screen','play-emoji','play-name','play-desc','play-hud','stage',
     'toast','sound-btn','reset-btn','back-btn','logo-btn','filter-tabs',
     'modal-backdrop','modal','modal-emoji','modal-title','modal-msg','modal-rewards',
     'modal-menu','modal-again',
     'settings-btn','settings-backdrop','settings-close',
     'music-slider','music-val','sfx-slider','sfx-val'].forEach(id => {
      el[id] = document.getElementById(id);
    });
  }

  /* ---------------- HUD / UI rendering ---------------- */
  function renderHud() {
    const li = levelInfo(state.xp);
    el['coin-count'].textContent = state.coins;
    el['level-badge'].textContent = li.level;
    el['xp-fill'].style.width = Math.round((li.into / li.need) * 100) + '%';
    el['xp-text'].textContent = `${li.into} / ${li.need} XP`;

    const completion = Math.round((state.played.length / Math.max(1, games.length)) * 100);
    el['completion-pct'].textContent = completion + '%';
    el['completion-ring'].style.setProperty('--pct', completion);
    el['games-played-stat'].textContent = state.plays;
    el['badges-stat'].textContent = state.badges.length;
    el['best-streak-stat'].textContent = li.level;
  }

  let activeFilter = 'all';
  function renderGrid() {
    const grid = el['game-grid'];
    grid.innerHTML = '';
    games.forEach((def) => {
      if (activeFilter !== 'all' && def.category !== activeFilter) return;
      const unlocked = isUnlocked(def);
      const card = document.createElement('button');
      card.className = 'game-card' + (unlocked ? '' : ' locked');
      card.style.background = CATS[def.category].grad;
      const best = state.best[def.id];
      card.innerHTML = `
        <div>
          <div class="gc-emoji">${def.emoji}</div>
          <div class="gc-name">${def.name}</div>
          <div class="gc-tag">${def.tagline}</div>
        </div>
        <div class="gc-meta">
          <span class="gc-cat">${CATS[def.category].label}</span>
          ${best != null ? `<span class="gc-best">★ ${best}</span>` : ''}
        </div>
        ${unlocked ? '' : `<div class="lock-overlay"><span><span class="lock-icon">🔒</span>${def._unlock} 🪙 to unlock</span></div>`}
      `;
      card.addEventListener('click', () => {
        if (!unlocked) {
          FX.sound.play('bad');
          toast(`Earn ${def._unlock - state.coins} more coins to unlock!`);
          return;
        }
        FX.sound.play('whoosh');
        openGame(def.id);
      });
      grid.appendChild(card);
    });
    if (!grid.children.length) {
      grid.innerHTML = `<p style="color:var(--ink-soft);font-weight:600">No games in this category yet.</p>`;
    }
  }

  function renderBadges() {
    const grid = el['badge-grid'];
    grid.innerHTML = '';
    BADGES.forEach(b => {
      const earned = state.badges.includes(b.id);
      const d = document.createElement('div');
      d.className = 'badge ' + (earned ? 'earned' : 'locked');
      d.innerHTML = `
        <div class="badge-icon">${earned ? b.icon : '🔒'}</div>
        <div class="badge-name">${b.name}</div>
        <div class="badge-desc">${b.desc}</div>`;
      grid.appendChild(d);
    });
  }

  function renderAll() { renderHud(); renderGrid(); renderBadges(); }

  /* ---------------- toast ---------------- */
  let toastTimer = null;
  function toast(msg) {
    el['toast'].textContent = msg;
    el['toast'].classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el['toast'].classList.remove('show'), 2400);
  }

  /* ---------------- navigation + session ---------------- */
  let session = null;   // { def, cleanups:[], finished:false }

  function runCleanups() {
    if (session && session.cleanups) {
      session.cleanups.forEach(fn => { try { fn(); } catch (e) {} });
    }
  }

  function goHome() {
    runCleanups();
    session = null;
    el['play-screen'].classList.add('hidden');
    el['home-screen'].classList.remove('hidden');
    closeModal();
    renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openGame(id) {
    const def = gameById[id];
    if (!def) return;
    runCleanups();
    closeModal();

    el['home-screen'].classList.add('hidden');
    el['play-screen'].classList.remove('hidden');
    el['play-emoji'].textContent = def.emoji;
    el['play-name'].textContent = def.name;
    el['play-desc'].textContent = def.tagline;
    el['play-hud'].innerHTML = '';
    window.scrollTo({ top: 0 });

    mountGame(def);
  }

  function mountGame(def) {
    runCleanups();
    session = { def, cleanups: [], finished: false };
    el['stage'].innerHTML = '';
    el['stage'].classList.remove('shake');
    const api = makeApi(def, session);
    try {
      def.mount(el['stage'], api);
    } catch (e) {
      console.error('Game crashed:', e);
      el['stage'].innerHTML = `<div class="game-msg">Oops! This game hit a snag.</div>`;
    }
  }

  /* ---------------- per-game API ---------------- */
  function makeApi(def, sess) {
    const stage = el['stage'];

    function setHud(items) {
      el['play-hud'].innerHTML = items.map(it =>
        `<div class="stat-pill" data-stat="${it.id}">
           <div class="sp-label">${it.label}</div>
           <div class="sp-value" id="sp-${it.id}">${it.value}</div>
         </div>`).join('');
    }
    function updateHud(id, value, flash) {
      const v = document.getElementById('sp-' + id);
      if (!v) return;
      v.textContent = value;
      if (flash) {
        const pill = v.closest('.stat-pill');
        pill.classList.remove('flash'); void pill.offsetWidth; pill.classList.add('flash');
      }
    }

    function recordPlay() {
      if (sess._counted) return;
      sess._counted = true;
      state.plays++;
      if (!state.played.includes(def.id)) state.played.push(def.id);
    }

    function recordBest(value) {
      if (value == null) return;
      const cur = state.best[def.id];
      const better = def.lowerBest ? (cur == null || value < cur) : (cur == null || value > cur);
      if (better) state.best[def.id] = value;
    }

    function applyRewards(coins, xp) {
      const before = levelInfo(state.xp).level;
      state.coins += coins;
      state.earned += coins;
      state.xp += xp;
      const after = levelInfo(state.xp).level;
      if (after > before) {
        setTimeout(() => {
          toast(`🎉 Level ${after}! New games may have unlocked.`);
          FX.sound.play('level');
          FX.starShower({ count: 90 });
          FX.flash('rgba(124,92,255,0.25)', 450);
        }, 500);
      }
    }

    function flyCoins(n) {
      const target = document.getElementById('coins-chip').getBoundingClientRect();
      FX.floatText(target.left + 10, target.top + 40, '+' + n + ' 🪙', '#ffa94d');
    }

    function finish(kind, opts) {
      if (sess.finished) return;
      sess.finished = true;
      recordPlay();

      const base = def.reward || { coins: 20, xp: 25 };
      let coins = opts.coins != null ? opts.coins : (kind === 'win' ? base.coins : Math.round(base.coins * 0.25));
      let xp = opts.xp != null ? opts.xp : (kind === 'win' ? base.xp : Math.round(base.xp * 0.3));
      coins = Math.max(0, Math.round(coins));
      xp = Math.max(0, Math.round(xp));

      if (opts.best != null) recordBest(opts.best);
      if (opts.flags) opts.flags.forEach(f => state.flags[f] = true);
      if (opts.perfect) state.flags.perfect = true;

      applyRewards(coins, xp);
      save();
      checkBadges();

      if (kind === 'win') {
        FX.sound.play('win');
        FX.confetti({ count: 120 });
        FX.fireworks(5);
        FX.flash('rgba(255,255,255,0.4)', 360);
        stage.classList.remove('celebrate'); void stage.offsetWidth; stage.classList.add('celebrate');
        flyCoins(coins);
      } else {
        FX.sound.play('lose');
        FX.shake(stage);
      }

      showModal(kind, def, { coins, xp }, opts);
      renderHud();
    }

    return {
      stage,
      rng: Math,
      setHud, updateHud,
      toast,
      sound: FX.sound,
      fx: FX,
      onCleanup(fn) { sess.cleanups.push(fn); },
      flag(name) { state.flags[name] = true; save(); checkBadges(); },
      best: state.best[def.id],
      win(opts) { finish('win', opts || {}); },
      lose(opts) { finish('lose', opts || {}); },
      exit: goHome,
      shuffle, randInt, choice,
      // burst confetti at element center
      celebrate(elem) {
        const r = (elem || stage).getBoundingClientRect();
        FX.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 30, shape: 'rect' });
      }
    };
  }

  /* ---------------- modal ---------------- */
  function showModal(kind, def, rewards, opts) {
    el['modal-emoji'].textContent = opts.emoji || (kind === 'win' ? '🎉' : '😅');
    el['modal-title'].textContent = opts.title || (kind === 'win' ? 'Awesome!' : 'Good try!');
    el['modal-msg'].textContent = opts.msg || (kind === 'win' ? 'You crushed it.' : 'Give it another go!');
    let rewardHtml = `
      <div class="reward-pill coins">🪙 +${rewards.coins}</div>
      <div class="reward-pill xp">✨ +${rewards.xp} XP</div>`;
    if (opts.stats) {
      opts.stats.forEach(s => { rewardHtml += `<div class="reward-pill">${s}</div>`; });
    }
    el['modal-rewards'].innerHTML = rewardHtml;
    el['modal-backdrop'].classList.remove('hidden');
  }
  function closeModal() { el['modal-backdrop'].classList.add('hidden'); }

  /* ---------------- helpers ---------------- */
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------------- settings ---------------- */
  function toggleSound() {
    state.soundOn = !state.soundOn;
    FX.sound.enabled = state.soundOn;
    FX.music.setEnabled(state.soundOn);
    el['sound-btn'].textContent = state.soundOn ? '🔊' : '🔇';
    el['sound-btn'].classList.toggle('muted', !state.soundOn);
    if (state.soundOn) FX.sound.play('click');
    save();
  }

  /* ---------------- settings menu ---------------- */
  function paintSlider(input, valEl, v) {
    const pct = Math.round(v * 100);
    input.value = pct;
    valEl.textContent = pct + '%';
    input.style.background = `linear-gradient(90deg, var(--p-indigo) ${pct}%, #e9e4ff ${pct}%)`;
  }

  function openSettings() {
    paintSlider(el['music-slider'], el['music-val'], state.musicVol);
    paintSlider(el['sfx-slider'], el['sfx-val'], state.sfxVol);
    el['settings-backdrop'].classList.remove('hidden');
    FX.sound.play('click');
  }

  function closeSettings() {
    el['settings-backdrop'].classList.add('hidden');
    save();
  }

  let sfxPreviewT = null;
  function wireSettings() {
    el['settings-btn'].addEventListener('click', openSettings);
    el['settings-close'].addEventListener('click', () => { FX.sound.play('pop'); closeSettings(); });
    el['settings-backdrop'].addEventListener('click', (e) => {
      if (e.target === el['settings-backdrop']) closeSettings();
    });
    el['music-slider'].addEventListener('input', () => {
      state.musicVol = el['music-slider'].value / 100;
      FX.music.setVolume(state.musicVol);
      paintSlider(el['music-slider'], el['music-val'], state.musicVol);
      save();
    });
    el['sfx-slider'].addEventListener('input', () => {
      state.sfxVol = el['sfx-slider'].value / 100;
      FX.sound.setVolume(state.sfxVol);
      paintSlider(el['sfx-slider'], el['sfx-val'], state.sfxVol);
      save();
      clearTimeout(sfxPreviewT);                       // preview the level without spamming
      sfxPreviewT = setTimeout(() => FX.sound.play('pop'), 90);
    });
  }

  function resetProgress() {
    if (!confirm('Reset all progress, coins, levels and badges?')) return;
    const audio = { soundOn: state.soundOn, musicVol: state.musicVol, sfxVol: state.sfxVol };
    state = Object.assign(clone(defaultState), audio);   // keep sound settings
    save();
    FX.sound.play('pop');
    toast('Progress reset — fresh start!');
    goHome();
  }

  /* ---------------- public registration ---------------- */
  function register(def) {
    games.push(def);
    gameById[def.id] = def;
  }

  function init() {
    cacheDom();
    games.forEach((def, i) => { def._unlock = unlockThreshold(def, i); });

    FX.init();
    FX.sound.enabled = state.soundOn;
    FX.sound.setVolume(state.sfxVol);
    FX.music.configure(state.soundOn);
    FX.music.setVolume(state.musicVol);
    el['sound-btn'].textContent = state.soundOn ? '🔊' : '🔇';
    el['sound-btn'].classList.toggle('muted', !state.soundOn);
    wireSettings();

    el['back-btn'].addEventListener('click', () => { FX.sound.play('whoosh'); goHome(); });
    el['logo-btn'].addEventListener('click', () => { FX.sound.play('click'); goHome(); });
    el['sound-btn'].addEventListener('click', toggleSound);
    el['reset-btn'].addEventListener('click', resetProgress);
    el['modal-menu'].addEventListener('click', () => { FX.sound.play('click'); goHome(); });
    el['modal-again'].addEventListener('click', () => {
      FX.sound.play('whoosh');
      closeModal();
      if (session) mountGame(session.def);
    });

    el['filter-tabs'].querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el['filter-tabs'].querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeFilter = tab.dataset.cat;
        FX.sound.play('click');
        renderGrid();
      });
    });

    renderAll();
  }

  window.Game = { register, init, get state() { return state; } };
})();
