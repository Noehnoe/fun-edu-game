/* Whack-a-Mole — tap moles, dodge bombs */
Game.register({
  id: 'whack',
  name: 'Mole Mash',
  emoji: '🔨',
  tagline: 'Bonk the critters, dodge bombs',
  category: 'reflex',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const HOLES = 9;
    let score = 0, timeLeft = 30, spawnT = null, tickT = null;
    const active = new Map(); // holeIndex -> {type, timeout}

    api.setHud([
      { id: 'score', label: 'Score', value: 0 },
      { id: 'time', label: 'Time', value: '30s' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const grid = document.createElement('div');
    grid.className = 'whack-grid';
    const holes = [];
    for (let i = 0; i < HOLES; i++) {
      const hole = document.createElement('button');
      hole.className = 'hole';
      hole.innerHTML = `<div class="mound"></div><div class="critter"></div>`;
      hole.addEventListener('click', () => bonk(i, hole));
      grid.appendChild(hole);
      holes.push(hole);
    }
    wrap.appendChild(grid);
    stage.appendChild(wrap);

    function spawn() {
      const free = holes.map((_, i) => i).filter(i => !active.has(i));
      if (free.length) {
        const i = free[api.randInt(0, free.length - 1)];
        const isBomb = Math.random() < 0.18;
        const isGold = !isBomb && Math.random() < 0.12;
        const type = isBomb ? 'bomb' : isGold ? 'gold' : 'mole';
        const hole = holes[i];
        const crit = hole.querySelector('.critter');
        crit.textContent = isBomb ? '💣' : isGold ? '⭐' : '🐹';
        hole.classList.add('up'); hole.dataset.type = type;
        const life = isBomb ? 1100 : api.randInt(700, 1300);
        const to = api.timeout(() => { hole.classList.remove('up'); active.delete(i); }, life);
        active.set(i, { type, to });
      }
      const gap = Math.max(380, 820 - score * 6);
      spawnT = api.timeout(spawn, gap);
    }

    function bonk(i, hole) {
      if (!active.has(i) || !hole.classList.contains('up')) return;
      const a = active.get(i);
      api.clearTimer(a.to); active.delete(i);
      hole.classList.remove('up');
      const r = hole.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (a.type === 'bomb') {
        score = Math.max(0, score - 5);
        api.sound.play('bomb');
        api.fx.emojiBurst(cx, cy, '💥', 10);
        api.fx.flash('rgba(255,80,80,0.3)', 250);
        api.fx.shake(stage);
        api.fx.floatText(cx, cy, '-5', '#ff5d6c');
      } else {
        const pts = a.type === 'gold' ? 5 : 1;
        score += pts;
        api.sound.play(a.type === 'gold' ? 'gold' : 'pop');
        api.fx.emojiBurst(cx, cy, a.type === 'gold' ? '⭐' : '✨', 8);
        if (a.type === 'gold') api.fx.burst(cx, cy, { count: 14, shape: 'star', colors: ['#ffd43b', '#fff'], power: 6 });
        api.fx.floatText(cx, cy, '+' + pts, a.type === 'gold' ? '#ffd43b' : '#2fbf71');
      }
      api.updateHud('score', score, true);
    }

    tickT = api.interval(() => {
      timeLeft--;
      api.updateHud('time', timeLeft + 's', timeLeft <= 5);
      if (timeLeft <= 5 && timeLeft > 0) api.sound.play('tick');
      if (timeLeft <= 0) end();
    }, 1000);

    api.onCleanup(() => { api.clearTimer(spawnT); api.clearTimer(tickT); active.forEach(a => api.clearTimer(a.to)); });

    function end() {
      api.clearTimer(spawnT); api.clearTimer(tickT);
      active.forEach(a => api.clearTimer(a.to)); active.clear();
      api.win({
        coins: 15 + score * 3, xp: 18 + score * 3,
        title: 'Time! 🔨', msg: `You bonked your way to ${score} points!`,
        emoji: '🐹', best: score,
        stats: [`⭐ ${score} points`]
      });
    }

    spawn();
  }
});
