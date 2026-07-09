/* Star Catcher — move the basket, catch stars, dodge bombs */
Game.register({
  id: 'catch',
  name: 'Star Catcher',
  emoji: '🧺',
  tagline: 'Catch the falling stars',
  category: 'reflex',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const W = 360, H = 400;
    let bx = W / 2, score = 0, lives = 3, timeLeft = 45;
    let items = [], keys = { l: false, r: false }, alive = true, raf = 0;
    let last = performance.now(), sinceSpawn = 0;

    api.setHud([
      { id: 'score', label: 'Score', value: 0 },
      { id: 'lives', label: 'Lives', value: '❤️❤️❤️' },
      { id: 'time', label: 'Time', value: '45s' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = '⭐ +1 · 🌟 +3 · 💣 costs a life! Arrows/A-D, drag, or buttons.';
    const canvas = document.createElement('canvas');
    canvas.className = 'catch-canvas';
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const pad = document.createElement('div');
    pad.className = 'arrow-pad';
    pad.innerHTML = `<div class="arrow-mid"><button data-d="l">◀</button><button data-d="r">▶</button></div>`;
    wrap.append(help, canvas, pad);
    stage.appendChild(wrap);

    pad.querySelectorAll('button').forEach(b => {
      const set = v => { keys[b.dataset.d] = v; };
      b.addEventListener('pointerdown', () => set(true));
      b.addEventListener('pointerup', () => set(false));
      b.addEventListener('pointerleave', () => set(false));
    });

    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      bx = (e.clientX - r.left) * (W / r.width);
    });
    canvas.addEventListener('touchmove', e => {
      const r = canvas.getBoundingClientRect();
      bx = (e.touches[0].clientX - r.left) * (W / r.width);
    }, { passive: true });

    function onKey(e, down) {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.l = down; e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.r = down; e.preventDefault(); }
    }
    const kd = e => onKey(e, true), ku = e => onKey(e, false);
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    api.onCleanup(() => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); alive = false; cancelAnimationFrame(raf); });

    api.interval(() => {
      timeLeft--;
      api.updateHud('time', timeLeft + 's', timeLeft <= 5);
      if (timeLeft <= 5 && timeLeft > 0) api.sound.play('tick');
      if (timeLeft <= 0) end(true);
    }, 1000);

    function spawn() {
      const roll = Math.random();
      const type = roll < 0.16 ? 'bomb' : roll < 0.28 ? 'gold' : 'star';
      items.push({
        x: 20 + Math.random() * (W - 40), y: -20,
        v: 2 + (45 - timeLeft) * 0.045 + Math.random() * 1.4,
        type, emoji: type === 'bomb' ? '💣' : type === 'gold' ? '🌟' : '⭐'
      });
    }

    function screenXY(x, y) {
      const r = canvas.getBoundingClientRect();
      return [r.left + x * (r.width / W), r.top + y * (r.height / H)];
    }

    function loop(t) {
      const dt = Math.min(3, (t - last) / 16.6);
      last = t;
      if (keys.l) bx -= 6.5 * dt;
      if (keys.r) bx += 6.5 * dt;
      bx = Math.max(24, Math.min(W - 24, bx));

      sinceSpawn += dt * 16.6;
      const gap = Math.max(300, 720 - (45 - timeLeft) * 9);
      if (sinceSpawn >= gap) { sinceSpawn = 0; spawn(); }

      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.y += it.v * dt;
        if (it.y > H - 46 && it.y < H - 10 && Math.abs(it.x - bx) < 34) {
          items.splice(i, 1);
          const [cx, cy] = screenXY(it.x, it.y);
          if (it.type === 'bomb') {
            lives--;
            api.updateHud('lives', '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives)), true);
            api.sound.play('bomb');
            api.fx.emojiBurst(cx, cy, '💥', 10);
            api.fx.flash('rgba(255,80,80,0.25)', 220);
            api.fx.shake(stage);
            if (lives <= 0) return end(false);
          } else {
            const pts = it.type === 'gold' ? 3 : 1;
            score += pts;
            api.updateHud('score', score, true);
            api.sound.play(it.type === 'gold' ? 'gold' : 'pop');
            api.fx.burst(cx, cy, { count: 8, shape: 'star', colors: ['#ffd43b', '#fff'], power: 4 });
            api.fx.floatText(cx, cy - 10, '+' + pts, '#ffa94d');
          }
        } else if (it.y > H + 24) {
          items.splice(i, 1);
        }
      }

      // draw
      ctx.fillStyle = '#eaf6ff';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      items.forEach(it => ctx.fillText(it.emoji, it.x, it.y));
      ctx.font = '44px serif';
      ctx.fillText('🧺', bx, H - 26);

      if (alive) raf = requestAnimationFrame(loop);
    }

    function end(timeUp) {
      if (!alive) return;
      alive = false;
      cancelAnimationFrame(raf);
      const finish = timeUp ? api.win : (score >= 15 ? api.win : api.lose);
      finish({
        coins: 12 + score * 3, xp: 15 + score * 3,
        title: timeUp ? 'Time! 🧺' : 'Boom! 💥',
        msg: `You caught ${score} stars.`,
        emoji: '🧺', best: score,
        stats: [`⭐ ${score} caught`]
      });
    }

    raf = requestAnimationFrame(loop);
  }
});
