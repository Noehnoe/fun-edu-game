/* Pattern Memory — memorize the lit cells, then reproduce them */
Game.register({
  id: 'pattern',
  name: 'Flash Memory',
  emoji: '✨',
  tagline: 'Remember the glowing tiles',
  category: 'memory',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const N = 4;
    let round = 0, pattern = new Set(), picked = new Set(), accepting = false;

    api.setHud([
      { id: 'round', label: 'Round', value: 0 },
      { id: 'tiles', label: 'Tiles', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const status = document.createElement('div');
    status.className = 'game-msg';
    status.textContent = 'Get ready…';
    const board = document.createElement('div');
    board.className = 'pat-grid';
    const cells = [];
    for (let i = 0; i < N * N; i++) {
      const c = document.createElement('button');
      c.className = 'pat-cell';
      c.addEventListener('click', () => choose(i, c));
      board.appendChild(c);
      cells.push(c);
    }
    wrap.append(status, board);
    stage.appendChild(wrap);

    function nextRound() {
      round++;
      api.updateHud('round', round, true);
      const count = Math.min(N * N - 2, 3 + round);
      api.updateHud('tiles', count);
      pattern = new Set();
      while (pattern.size < count) pattern.add(api.randInt(0, N * N - 1));
      picked = new Set();
      accepting = false;
      status.textContent = 'Memorize!';
      cells.forEach(c => { c.classList.remove('lit', 'good', 'bad'); });
      // flash
      pattern.forEach(i => cells[i].classList.add('lit'));
      api.sound.play('whoosh');
      const showTime = Math.max(700, 1600 - round * 80);
      const to = setTimeout(() => {
        pattern.forEach(i => cells[i].classList.remove('lit'));
        accepting = true;
        status.textContent = `Tap the ${count} tiles you saw`;
      }, showTime);
      api.onCleanup(() => clearTimeout(to));
    }

    function choose(i, cell) {
      if (!accepting || picked.has(i)) return;
      picked.add(i);
      if (pattern.has(i)) {
        cell.classList.add('good');
        api.sound.play('pop');
        const r = cell.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 6, colors: ['#51cf66'], power: 3 });
        const hits = [...picked].filter(p => pattern.has(p)).length;
        if (hits === pattern.size) {
          accepting = false;
          api.sound.play('good');
          status.textContent = 'Perfect! ✨';
          api.timeout(nextRound, 700);
        }
      } else {
        cell.classList.add('bad');
        accepting = false;
        api.sound.play('lose');
        api.fx.shake(stage);
        pattern.forEach(p => { if (!picked.has(p)) cells[p].classList.add('lit'); });
        fail();
      }
    }

    function fail() {
      const reached = round - 1;
      if (reached >= 6) api.flag('mastermind');
      api.lose({
        coins: 12 + reached * 9, xp: 15 + reached * 9,
        title: `Round ${reached} ✨`, msg: `You recalled ${reached} patterns!`,
        emoji: '✨', best: reached,
        stats: [`🔢 reached round ${reached}`]
      });
    }

    api.timeout(nextRound, 700);
  }
});
