/* ===================================================================
   Brainy Bunch — cloud accounts, sync & leaderboard (frontend)
   Talks to the Pages Functions API under /api/*.
   Falls back to pure-localStorage "guest" mode when offline / not signed in.
   =================================================================== */
(function () {
  'use strict';

  const API = '/api';
  const LS_TOKEN = 'bb-token';
  const LS_MODE  = 'bb-mode';     // 'account' | 'guest'
  const LS_NAME  = 'bb-username';

  let token = localStorage.getItem(LS_TOKEN) || null;
  let mode  = localStorage.getItem(LS_MODE)  || null;
  let username = localStorage.getItem(LS_NAME) || null;

  /* ---------------- API helper ---------------- */
  async function api(path, { method = 'GET', body, auth = false, keepalive = false } = {}) {
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (auth && token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(API + path, {
        method, headers,
        body: body ? JSON.stringify(body) : undefined,
        keepalive
      });
    } catch (e) {
      throw new Error('Network error — check your connection.');
    }
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw new Error(data.error || ('Error ' + res.status));
    return data;
  }

  /* ---------------- sync (debounced) ---------------- */
  let syncTimer = null, syncing = false, pending = false;
  function scheduleSync() {
    if (mode !== 'account' || !token) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(flushSync, 1500);
  }
  async function flushSync(keepalive) {
    if (mode !== 'account' || !token) return;
    if (syncing) { pending = true; return; }
    syncing = true;
    const s = Game.state;
    const sum = Game.getSummary();
    try {
      await api('/sync', { method: 'POST', auth: true, keepalive: !!keepalive,
        body: { save: s, coins: sum.coins, level: sum.level } });
      setSyncBadge('saved');
    } catch (e) {
      setSyncBadge('offline');
    } finally {
      syncing = false;
      if (pending) { pending = false; scheduleSync(); }
    }
  }
  // Best-effort save when leaving the page
  window.addEventListener('pagehide', () => { flushSync(true); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSync(true);
  });

  /* ---------------- account button + sync badge in topbar ---------------- */
  function injectTopbar() {
    const hud = document.querySelector('.topbar .hud');
    if (!hud || document.getElementById('account-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'icon-btn';
    btn.id = 'account-btn';
    btn.title = 'Account';
    btn.textContent = '👤';
    // place it before the settings button
    const settings = document.getElementById('settings-btn');
    hud.insertBefore(btn, settings);
    btn.addEventListener('click', openAccountSheet);
  }
  function setSyncBadge(kind) {
    const btn = document.getElementById('account-btn');
    if (!btn) return;
    btn.classList.remove('sync-saved', 'sync-offline');
    if (kind === 'saved')   { btn.classList.add('sync-saved'); }
    if (kind === 'offline') { btn.classList.add('sync-offline'); }
  }

  /* ===================================================================
     Auth gate overlay (register / login / guest)
     =================================================================== */
  function buildAuthOverlay() {
    if (document.getElementById('auth-overlay')) return;
    const wrap = document.createElement('div');
    wrap.id = 'auth-overlay';
    wrap.className = 'auth-overlay';
    wrap.innerHTML = `
      <div class="auth-card">
        <div class="auth-logo"><span class="logo-mark">🧠</span></div>
        <h2 class="auth-title">Welcome to Brainy Bunch!</h2>
        <p class="auth-sub">Create an account to save your progress everywhere and climb the leaderboard.</p>

        <div class="auth-tabs">
          <button class="auth-tab active" data-form="login">Log in</button>
          <button class="auth-tab" data-form="register">Sign up</button>
        </div>

        <form class="auth-form" id="auth-form" autocomplete="on">
          <label class="auth-field">
            <span>Username</span>
            <input type="text" id="auth-user" autocomplete="username" maxlength="20"
                   placeholder="3–20 letters, numbers, _" />
          </label>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" id="auth-pass" autocomplete="current-password"
                   placeholder="At least 6 characters" />
          </label>
          <label class="auth-field" id="phrase-field">
            <span id="phrase-label">Security phrase <em>(optional)</em></span>
            <input type="password" id="auth-phrase" autocomplete="off"
                   placeholder="An extra secret — optional" />
            <small class="auth-hint" id="phrase-hint">A 2nd password for extra safety. If you set one, you'll need it to log in.</small>
          </label>

          <div class="auth-error" id="auth-error"></div>
          <button type="submit" class="btn btn-primary auth-submit" id="auth-submit">Log in</button>
        </form>

        <div class="auth-divider"><span>or</span></div>
        <button class="btn btn-ghost auth-guest" id="auth-guest">Play as guest</button>
        <p class="auth-guest-note">Guests save only on this device and can't join the leaderboard.</p>
      </div>`;
    document.body.appendChild(wrap);

    let formMode = 'login';
    const $ = id => wrap.querySelector(id);
    const errBox = $('#auth-error');

    function setForm(m) {
      formMode = m;
      wrap.querySelectorAll('.auth-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.form === m));
      $('#phrase-field').style.display = m === 'register' ? '' : '';
      $('#phrase-label').innerHTML = m === 'register'
        ? 'Security phrase <em>(optional)</em>'
        : 'Security phrase <em>(if you set one)</em>';
      $('#phrase-hint').style.display = m === 'register' ? '' : 'none';
      $('#auth-pass').autocomplete = m === 'register' ? 'new-password' : 'current-password';
      $('#auth-submit').textContent = m === 'register' ? 'Create account' : 'Log in';
      errBox.classList.remove('show');
    }
    wrap.querySelectorAll('.auth-tab').forEach(t =>
      t.addEventListener('click', () => setForm(t.dataset.form)));

    function showErr(msg) { errBox.textContent = msg; errBox.classList.add('show'); }

    $('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#auth-submit');
      const u = $('#auth-user').value.trim();
      const p = $('#auth-pass').value;
      const phrase = $('#auth-phrase').value;
      if (!u || !p) { showErr('Please fill in username and password.'); return; }
      btn.disabled = true; btn.textContent = '…';
      try {
        let data;
        if (formMode === 'register') {
          // carry the current (guest/local) progress into the new account
          const sum = Game.getSummary();
          data = await api('/register', { method: 'POST', body: {
            username: u, password: p, phrase: phrase || undefined,
            save: Game.state, coins: sum.coins, level: sum.level
          }});
        } else {
          data = await api('/login', { method: 'POST', body: {
            username: u, password: p, phrase: phrase || undefined
          }});
        }
        onSignedIn(data, formMode === 'register');
      } catch (err) {
        showErr(err.message);
        btn.disabled = false;
        btn.textContent = formMode === 'register' ? 'Create account' : 'Log in';
      }
    });

    $('#auth-guest').addEventListener('click', () => {
      mode = 'guest';
      localStorage.setItem(LS_MODE, 'guest');
      hideAuthOverlay();
      if (window.FX) FX.sound.play('click');
    });

    setForm('login');
  }

  function showAuthOverlay() {
    buildAuthOverlay();
    document.getElementById('auth-overlay').classList.add('show');
  }
  function hideAuthOverlay() {
    const o = document.getElementById('auth-overlay');
    if (o) o.classList.remove('show');
  }

  function onSignedIn(data, isNew) {
    token = data.token; mode = 'account'; username = data.user.username;
    localStorage.setItem(LS_TOKEN, token);
    localStorage.setItem(LS_MODE, 'account');
    localStorage.setItem(LS_NAME, username);
    // For a brand-new account we keep local progress; for login we load the server save.
    if (!isNew && data.save) Game.loadRemoteState(data.save, false);
    if (isNew) flushSync();          // push carried-over progress up
    hideAuthOverlay();
    injectTopbar();
    if (window.FX) { FX.sound.play('unlock'); FX.confetti({ count: 60 }); }
    Game.state && setSyncBadge('saved');
  }

  /* ===================================================================
     Account sheet (when signed in / as guest)
     =================================================================== */
  function openAccountSheet() {
    let sheet = document.getElementById('account-backdrop');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'account-backdrop';
      sheet.className = 'modal-backdrop';
      sheet.innerHTML = `
        <div class="modal account-modal">
          <div class="sheet-grabber" aria-hidden="true"></div>
          <div class="modal-emoji">👤</div>
          <h2 id="account-title">Account</h2>
          <p id="account-msg"></p>
          <div class="modal-actions modal-actions-col" id="account-actions"></div>
        </div>`;
      document.body.appendChild(sheet);
      sheet.addEventListener('click', e => { if (e.target === sheet) sheet.classList.add('hidden'); });
    }
    const actions = sheet.querySelector('#account-actions');
    const title = sheet.querySelector('#account-title');
    const msg = sheet.querySelector('#account-msg');
    actions.innerHTML = '';

    if (mode === 'account') {
      title.textContent = '👋 ' + (username || 'Player');
      msg.textContent = 'Your progress is saved to the cloud.';
      const save = document.createElement('button');
      save.className = 'btn btn-primary';
      save.textContent = '☁️ Save now';
      save.addEventListener('click', () => { flushSync(); toastMsg('Progress saved!'); });
      const out = document.createElement('button');
      out.className = 'btn btn-ghost';
      out.textContent = '🚪 Log out';
      out.addEventListener('click', doLogout);
      actions.append(save, out);
    } else {
      title.textContent = '👤 Guest';
      msg.textContent = 'Sign up to save across devices and join the leaderboard.';
      const acct = document.createElement('button');
      acct.className = 'btn btn-primary';
      acct.textContent = '✨ Create an account';
      acct.addEventListener('click', () => { sheet.classList.add('hidden'); showAuthOverlay(); });
      actions.append(acct);
    }
    const close = document.createElement('button');
    close.className = 'btn btn-ghost';
    close.textContent = 'Close';
    close.addEventListener('click', () => sheet.classList.add('hidden'));
    actions.append(close);

    sheet.classList.remove('hidden');
    if (window.FX) FX.sound.play('click');
  }

  async function doLogout() {
    try { await api('/logout', { method: 'POST', auth: true }); } catch (e) {}
    token = null; mode = null; username = null;
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_MODE);
    localStorage.removeItem(LS_NAME);
    const sheet = document.getElementById('account-backdrop');
    if (sheet) sheet.classList.add('hidden');
    Game.freshState();          // clear local progress so accounts don't bleed together
    showAuthOverlay();
  }

  function toastMsg(m) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  /* ===================================================================
     Leaderboard
     =================================================================== */
  let lastMe = null;   // remembers the signed-in player's rank for the Share button

  async function loadLeaderboard() {
    const panel = document.getElementById('leaders-list');
    if (!panel) return;
    panel.innerHTML = `<div class="lb-loading">Loading…</div>`;
    try {
      const data = await api('/leaderboard?limit=50', { auth: mode === 'account' });
      renderLeaderboard(data);
    } catch (e) {
      panel.innerHTML = `<div class="lb-loading">Couldn't load the leaderboard.<br><small>${e.message}</small></div>`;
    }
  }
  function renderLeaderboard(data) {
    const panel = document.getElementById('leaders-list');
    lastMe = data.me || null;
    const top = data.top || [];
    if (!top.length) {
      panel.innerHTML = `<div class="lb-loading">No players yet — be the first! 🏆</div>`;
    } else {
      const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1));
      const mine = data.me && data.me.name;
      panel.innerHTML = top.map((r, i) => `
        <div class="lb-row${r.name === mine ? ' lb-me' : ''}">
          <span class="lb-rank">${medal(i)}</span>
          <span class="lb-name">${escapeHtml(r.name)}</span>
          <span class="lb-lvl">Lv ${r.level}</span>
          <span class="lb-coins">🪙 ${r.coins.toLocaleString()}</span>
        </div>`).join('');
    }
    const meBox = document.getElementById('leaders-me');
    if (meBox) {
      if (data.me) {
        meBox.classList.remove('hidden');
        meBox.innerHTML = `
          <div class="lb-row lb-me">
            <span class="lb-rank">#${data.me.rank}</span>
            <span class="lb-name">${escapeHtml(data.me.name)} (you)</span>
            <span class="lb-lvl">Lv ${data.me.level}</span>
            <span class="lb-coins">🪙 ${data.me.coins.toLocaleString()}</span>
          </div>`;
      } else {
        meBox.classList.add('hidden');
        meBox.innerHTML = '';
      }
    }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ===================================================================
     Mini Records — a per-game leaderboard shown on the pause screen.
     Ranked by coins earned in that game; score + time shown when available.
     =================================================================== */
  function formatDuration(ms) {
    if (ms == null) return null;
    const s = ms / 1000;
    if (s < 60) return s.toFixed(1) + 's';
    const m = Math.floor(s / 60), rem = Math.round(s % 60);
    return `${m}m ${rem}s`;
  }

  async function loadMiniRecords(gameId) {
    const list = document.getElementById('mr-list');
    const meBox = document.getElementById('mr-me-box');
    if (!list) return;
    if (mode !== 'account') {
      list.innerHTML = `<div class="mr-loading">Sign up to appear on Mini Records!<br><small>Guests can still see the top players below.</small></div>`;
    }
    try {
      const data = await api(`/records?game=${encodeURIComponent(gameId)}&limit=10`, { auth: mode === 'account' });
      renderMiniRecords(data);
    } catch (e) {
      list.innerHTML = `<div class="mr-loading">Couldn't load records.<br><small>${escapeHtml(e.message)}</small></div>`;
    }
  }

  function renderMiniRecords(data) {
    const list = document.getElementById('mr-list');
    const meBox = document.getElementById('mr-me-box');
    const top = data.top || [];
    const row = (r, rankLabel, isMe) => {
      const parts = [`🪙 ${r.coins.toLocaleString()}`];
      if (r.score != null) parts.push(`⭐ ${r.score.toLocaleString()}`);
      const dur = formatDuration(r.timeMs);
      if (dur) parts.push(`⏱️ ${dur}`);
      return `
        <div class="mr-row${isMe ? ' mr-me' : ''}">
          <span class="mr-rank">${rankLabel}</span>
          <span class="mr-name">${escapeHtml(r.name)}${isMe ? ' (you)' : ''}</span>
          <span class="mr-stats">${parts.join(' · ')}</span>
        </div>`;
    };
    if (!top.length) {
      list.innerHTML = `<div class="mr-loading">No records yet — win this game to set the first one! 🏆</div>`;
    } else {
      const medal = i => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1));
      const mine = data.me && data.me.name;
      list.innerHTML = top.map((r, i) => row(r, medal(i), r.name === mine)).join('');
    }
    if (data.me) {
      meBox.classList.remove('hidden');
      meBox.innerHTML = row({ ...data.me }, '#' + data.me.rank, true);
    } else {
      meBox.classList.add('hidden');
      meBox.innerHTML = '';
    }
  }

  /* Submit a finished, coin-earning run — the engine only calls this when coins > 0,
     which is the anti-macro gate: a run that scores nothing never reaches the board. */
  async function submitMiniRecord(gameId, metrics) {
    if (mode !== 'account' || !token) return;   // guests aren't ranked, same rule as the main leaderboard
    try {
      await api('/record', { method: 'POST', auth: true, body: { gameId, ...metrics } });
    } catch (e) { /* best-effort; a failed record submit shouldn't interrupt play */ }
  }

  /* Share the player's rank via the native share sheet, or copy a link as a fallback */
  async function shareRank() {
    const url = 'https://noehnoe.com';
    let text;
    if (mode === 'account' && lastMe) {
      text = `I'm ranked #${lastMe.rank} with ${lastMe.coins.toLocaleString()} 🪙 on Brainy Bunch! Can you beat me?`;
    } else {
      text = `I'm playing Brainy Bunch — 23 free brain games. Come climb the leaderboard with me!`;
    }
    const shareData = { title: 'Brainy Bunch', text, url };
    try {
      if (navigator.share) { await navigator.share(shareData); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      toastMsg('📋 Link copied — paste it anywhere!');
    } catch (e) {
      toastMsg('Share link: ' + url);
    }
  }

  /* Wire the Leaderboard bottom-nav / tab so it loads on open */
  function wireLeaderboardTab() {
    document.querySelectorAll('[data-tab="leaders"]').forEach(btn => {
      btn.addEventListener('click', () => setTimeout(loadLeaderboard, 50));
    });
    const refresh = document.getElementById('leaders-refresh');
    if (refresh) refresh.addEventListener('click', loadLeaderboard);
    const share = document.getElementById('leaders-share');
    if (share) share.addEventListener('click', () => { if (window.FX) FX.sound.play('click'); shareRank(); });
  }

  /* ===================================================================
     Boot
     =================================================================== */
  function boot() {
    if (!window.Game) { setTimeout(boot, 50); return; }

    Game.setSaveHook(scheduleSync);
    Game.setRecordsHook(loadMiniRecords);
    Game.setRecordRunHook(submitMiniRecord);
    injectTopbar();
    wireLeaderboardTab();
    // Desktop stacks all panels (no nav click), so load once now; also refreshes mobile.
    setTimeout(loadLeaderboard, 400);

    if (mode === 'account' && token) {
      // Verify token + pull the latest cloud save
      api('/me', { auth: true })
        .then(data => {
          username = data.user.username;
          localStorage.setItem(LS_NAME, username);
          if (data.save) Game.loadRemoteState(data.save, false);
          setSyncBadge('saved');
        })
        .catch(() => {
          // token invalid/expired → send back to the gate
          localStorage.removeItem(LS_TOKEN);
          token = null; mode = null;
          showAuthOverlay();
        });
    } else if (mode === 'guest') {
      // stay in guest mode, nothing to do
    } else {
      showAuthOverlay();
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0));
  } else {
    setTimeout(boot, 0);
  }
})();
