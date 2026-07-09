/* ===================================================================
   FX — particles, confetti, sound, animated background
   Exposes a global `FX` object.
   =================================================================== */
(function () {
  'use strict';

  const PALETTE = ['#ff6b6b', '#ffa94d', '#ffd43b', '#51cf66', '#20c997',
                   '#4dabf7', '#7c5cff', '#f06595', '#cc5de8'];

  /* ---------------- Animated background ---------------- */
  const bg = document.getElementById('bg-canvas');
  const bgx = bg.getContext('2d');
  let blobs = [];

  function sizeCanvas(c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = window.innerWidth * dpr;
    c.height = window.innerHeight * dpr;
    c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buildBlobs() {
    blobs = [];
    const n = Math.max(8, Math.round(window.innerWidth / 130));
    for (let i = 0; i < n; i++) {
      blobs.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 30 + Math.random() * 70,
        s: 0.15 + Math.random() * 0.4,
        drift: (Math.random() - 0.5) * 0.3,
        hue: PALETTE[(Math.random() * PALETTE.length) | 0],
        emoji: null
      });
    }
    // a few floating shape emojis for extra cartoon vibe
    const emojis = ['⭐', '🔷', '🟡', '🎈', '✨', '🟣', '🔶'];
    for (let i = 0; i < 6; i++) {
      blobs.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: 18 + Math.random() * 14,
        s: 0.1 + Math.random() * 0.25,
        drift: (Math.random() - 0.5) * 0.25,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.01,
        emoji: emojis[(Math.random() * emojis.length) | 0]
      });
    }
  }

  function drawBg() {
    const w = window.innerWidth, h = window.innerHeight;
    bgx.clearRect(0, 0, w, h);
    for (const b of blobs) {
      b.y -= b.s;
      b.x += b.drift;
      if (b.y + b.r < 0) { b.y = h + b.r; b.x = Math.random() * w; }
      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.emoji) {
        b.rot += b.vr;
        bgx.save();
        bgx.globalAlpha = 0.55;
        bgx.translate(b.x, b.y);
        bgx.rotate(b.rot);
        bgx.font = (b.r * 1.6) + 'px serif';
        bgx.textAlign = 'center';
        bgx.textBaseline = 'middle';
        bgx.fillText(b.emoji, 0, 0);
        bgx.restore();
      } else {
        bgx.globalAlpha = 0.22;
        bgx.fillStyle = b.hue;
        bgx.beginPath();
        bgx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        bgx.fill();
      }
    }
    bgx.globalAlpha = 1;
    requestAnimationFrame(drawBg);
  }

  /* ---------------- Particle overlay ---------------- */
  const fxc = document.getElementById('fx-canvas');
  const fx = fxc.getContext('2d');
  let particles = [];

  function tickParticles() {
    fx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.life -= 1;
      p.rot += p.vr;
      const alpha = Math.max(0, Math.min(1, p.life / p.maxLife));
      fx.save();
      fx.globalAlpha = alpha;
      fx.translate(p.x, p.y);
      fx.rotate(p.rot);
      if (p.shape === 'rect') {
        fx.fillStyle = p.color;
        fx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else if (p.shape === 'star') {
        fx.fillStyle = p.color;
        if (p.glow) { fx.shadowColor = p.color; fx.shadowBlur = 10; }
        drawStar(fx, p.size * 1.4);
      } else if (p.shape === 'emoji') {
        fx.font = p.size * 2 + 'px serif';
        fx.textAlign = 'center';
        fx.textBaseline = 'middle';
        fx.fillText(p.emoji, 0, 0);
      } else {
        fx.fillStyle = p.color;
        fx.beginPath();
        fx.arc(0, 0, p.size, 0, Math.PI * 2);
        fx.fill();
      }
      fx.restore();
      if (p.life <= 0 || p.y > window.innerHeight + 60) particles.splice(i, 1);
    }
    requestAnimationFrame(tickParticles);
  }

  function spawn(opts) { particles.push(opts); }

  function drawStar(c, r) {
    c.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      const a2 = a + Math.PI / 5;
      c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      c.lineTo(Math.cos(a2) * r * 0.45, Math.sin(a2) * r * 0.45);
    }
    c.closePath();
    c.fill();
  }

  function burst(x, y, opts = {}) {
    const count = opts.count || 24;
    const colors = opts.colors || PALETTE;
    const power = opts.power || 7;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = power * (0.4 + Math.random() * 0.8);
      spawn({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        g: 0.15,
        size: 3 + Math.random() * 5,
        color: colors[(Math.random() * colors.length) | 0],
        shape: opts.shape || 'circle',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        life: 40 + Math.random() * 30,
        maxLife: 70
      });
    }
  }

  function confetti(opts = {}) {
    const w = window.innerWidth;
    const n = opts.count || 120;
    const originY = opts.y != null ? opts.y : -10;
    for (let i = 0; i < n; i++) {
      spawn({
        x: opts.x != null ? opts.x : Math.random() * w,
        y: originY + Math.random() * 40,
        vx: (Math.random() - 0.5) * 6,
        vy: 2 + Math.random() * 4,
        g: 0.12,
        size: 5 + Math.random() * 6,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        shape: 'rect',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.5,
        life: 120 + Math.random() * 80,
        maxLife: 200
      });
    }
  }

  function emojiBurst(x, y, emoji, count = 12) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 5 * (0.4 + Math.random());
      spawn({
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 2,
        g: 0.18,
        size: 8 + Math.random() * 6,
        emoji,
        shape: 'emoji',
        rot: 0, vr: (Math.random() - 0.5) * 0.3,
        life: 50 + Math.random() * 30, maxLife: 80
      });
    }
  }

  function starShower(opts = {}) {
    const w = window.innerWidth;
    const n = opts.count || 70;
    const colors = opts.colors || ['#ffd43b', '#ffec99', '#ffa94d', '#fff'];
    for (let i = 0; i < n; i++) {
      spawn({
        x: Math.random() * w, y: -10 + Math.random() * 40,
        vx: (Math.random() - 0.5) * 4, vy: 2 + Math.random() * 4, g: 0.1,
        size: 5 + Math.random() * 7, color: colors[(Math.random() * colors.length) | 0],
        shape: 'star', glow: true, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
        life: 110 + Math.random() * 80, maxLife: 190
      });
    }
  }

  function fireworks(n = 6) {
    const w = window.innerWidth, h = window.innerHeight;
    for (let i = 0; i < n; i++) {
      setTimeout(() => {
        const x = w * (0.15 + Math.random() * 0.7);
        const y = h * (0.15 + Math.random() * 0.4);
        const color = PALETTE[(Math.random() * PALETTE.length) | 0];
        burst(x, y, { count: 34, power: 9, shape: Math.random() < 0.5 ? 'star' : 'circle', colors: [color, '#fff'] });
        Sound.tone(700 + Math.random() * 400, 0.18, 'triangle', 0.07);
      }, i * 230);
    }
  }

  /* expanding ring at screen coords (tactile click feedback) */
  function ripple(x, y, color) {
    const d = document.createElement('div');
    d.className = 'fx-ripple';
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    if (color) d.style.borderColor = color;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 620);
  }

  /* quick full-screen color flash */
  function flash(color, dur) {
    const d = document.createElement('div');
    d.className = 'fx-flash';
    d.style.background = color || 'rgba(255,255,255,0.55)';
    document.body.appendChild(d);
    requestAnimationFrame(() => { d.style.opacity = '0'; });
    setTimeout(() => d.remove(), dur || 420);
  }

  /* float a "+N" text at screen coords */
  function floatText(x, y, text, color) {
    const el = document.createElement('div');
    el.className = 'float-pts';
    el.textContent = text;
    if (color) el.style.color = color;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  /* ---------------- Sound (WebAudio, synthesized) ---------------- */
  const Sound = (function () {
    let ctx = null;
    let enabled = true;
    let master = 1;       // user SFX volume 0..1

    function ac() {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { ctx = null; }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function tone(freq, dur, type = 'sine', vol = 0.18, when = 0) {
      if (!enabled || master <= 0) return;
      const c = ac(); if (!c) return;
      const t = c.currentTime + when;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * master), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    function slide(f1, f2, dur, type = 'sine', vol = 0.18) {
      if (!enabled || master <= 0) return;
      const c = ac(); if (!c) return;
      const t = c.currentTime;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.exponentialRampToValueAtTime(f2, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * master), t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(c.destination);
      osc.start(t); osc.stop(t + dur + 0.02);
    }

    const library = {
      click:   () => tone(440, 0.08, 'triangle', 0.12),
      pop:     () => tone(660, 0.09, 'sine', 0.16),
      select:  () => tone(520, 0.07, 'square', 0.08),
      good:    () => { tone(660, 0.1, 'sine', 0.15); tone(880, 0.12, 'sine', 0.13, 0.08); },
      bad:     () => { tone(200, 0.18, 'sawtooth', 0.12); tone(150, 0.2, 'sawtooth', 0.1, 0.05); },
      coin:    () => { tone(988, 0.06, 'square', 0.1); tone(1319, 0.12, 'square', 0.1, 0.06); },
      win:     () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.16, i * 0.1)); },
      lose:    () => { slide(400, 120, 0.5, 'sawtooth', 0.12); },
      whoosh:  () => slide(300, 700, 0.18, 'sine', 0.08),
      swipe:   () => slide(520, 260, 0.12, 'sine', 0.07),
      level:   () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.12, i * 0.08)); },
      tick:    () => tone(800, 0.04, 'square', 0.06),
      flip:    () => tone(380, 0.06, 'triangle', 0.1),
      merge:   () => { tone(440, 0.07, 'sine', 0.12); tone(660, 0.1, 'triangle', 0.12, 0.05); },
      sparkle: () => { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.08, 'sine', 0.09, i * 0.05)); },
      star:    () => { tone(1175, 0.05, 'sine', 0.08); tone(1568, 0.08, 'sine', 0.08, 0.04); },
      gold:    () => { [784, 988, 1319].forEach((f, i) => tone(f, 0.1, 'square', 0.1, i * 0.05)); },
      bomb:    () => { slide(220, 60, 0.35, 'sawtooth', 0.16); tone(90, 0.25, 'square', 0.12, 0.02); },
      unlock:  () => { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.14, 'triangle', 0.13, i * 0.07)); },
      badge:   () => { [659, 880, 1175].forEach((f, i) => tone(f, 0.16, 'sine', 0.14, i * 0.09)); },
      start:   () => { tone(523, 0.1, 'triangle', 0.12); tone(784, 0.16, 'triangle', 0.12, 0.08); }
    };

    return {
      play(name) { if (library[name]) library[name](); },
      tone, slide,
      setVolume(v) { master = Math.max(0, Math.min(1, v)); },
      get volume() { return master; },
      get enabled() { return enabled; },
      set enabled(v) { enabled = v; if (v) ac(); },
      unlock() { ac(); }
    };
  })();

  /* ---------------- background music ---------------- */
  const Music = (function () {
    let audio = null, enabled = true, wantPlaying = false;
    let targetVol = 0.35;   // user music volume 0..1
    let fadeT = null;

    function ensure() {
      if (!audio) {
        audio = new Audio(encodeURI('menu music.mp3'));
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        // keep it "always playing": if it stops unexpectedly, nudge it back
        audio.addEventListener('pause', () => {
          if (enabled && wantPlaying && !document.hidden) audio.play().catch(() => {});
        });
      }
      return audio;
    }

    function fade(to, ms) {
      const a = ensure();
      clearInterval(fadeT);                       // cancel a competing fade
      const steps = 24, dt = Math.max(16, ms / steps), from = a.volume;
      let i = 0;
      fadeT = setInterval(() => {
        i++;
        a.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
        if (i >= steps) clearInterval(fadeT);
      }, dt);
    }

    // called from the first user gesture (satisfies autoplay policy)
    function start() {
      if (!enabled) return;
      const a = ensure();
      wantPlaying = true;
      const p = a.play();
      if (p && p.then) p.then(() => fade(targetVol, 900)).catch(() => {});
    }

    // light config at boot — set state, never force play pre-gesture
    function configure(v) {
      enabled = v;
      if (!v) { wantPlaying = false; if (audio) audio.pause(); }
    }

    // mute/unmute from the sound button (already past a gesture)
    function setEnabled(v) {
      enabled = v;
      const a = ensure();
      if (v) { wantPlaying = true; a.play().then(() => fade(targetVol, 400)).catch(() => {}); }
      else { wantPlaying = false; a.volume = 0; a.pause(); }
    }

    // live volume control from the settings sliders
    function setVolume(v) {
      targetVol = Math.max(0, Math.min(1, v));
      if (audio && wantPlaying && enabled) fade(targetVol, 120);
    }

    return {
      start, configure, setEnabled, setVolume, ensure,
      get enabled() { return enabled; },
      get volume() { return targetVol; }
    };
  })();

  /* ---------------- screen shake ---------------- */
  function shake(el) {
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 420);
  }

  /* ---------------- init ---------------- */
  function init() {
    [bg, fxc].forEach(sizeCanvas);
    buildBlobs();
    drawBg();
    tickParticles();
    window.addEventListener('resize', () => {
      [bg, fxc].forEach(sizeCanvas);
      buildBlobs();
    });
    // unlock audio + kick off music on first interaction (autoplay policy)
    const unlock = () => { Sound.unlock(); Music.start(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    // keep music alive when returning to the tab
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && Music.enabled) Music.ensure().play().catch(() => {});
    });
    // global tactile ripple on every tap/click
    window.addEventListener('pointerdown', (e) => {
      if (e.clientX || e.clientY) ripple(e.clientX, e.clientY);
    });
  }

  window.FX = {
    init, burst, confetti, emojiBurst, floatText, shake,
    starShower, fireworks, ripple, flash,
    sound: Sound, music: Music, PALETTE
  };
})();
