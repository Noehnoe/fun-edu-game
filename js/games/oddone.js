/* Odd One Out — spot the one different emoji in a growing grid */
Game.register({
  id: 'oddone',
  name: 'Odd One Out',
  emoji: '🕵️',
  tagline: 'Spot the different one',
  category: 'logic',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const PAIRS = [
      ['😺', '😸'], ['🍩', '🍪'], ['🌝', '🌚'], ['🐤', '🐥'], ['🟠', '🟡'],
      ['🐶', '🐺'], ['🌷', '🌹'], ['🍀', '☘️'], ['⚽', '🏐'], ['😀', '😃'],
      ['🦁', '🐯'], ['🧁', '🍰'], ['🐢', '🐊'], ['⭐', '🌟'], ['🍎', '🍅']
    ];
    const ROUNDS = 8;
    let round = 0, score = 0, timeLeft = 40, mistakes = 0, locked = false;

    api.setHud([
      { id: 'time', label: 'Time', value: '40s' },
      { id: 'round', label: 'Round', value: '0/' + ROUNDS },
      { id: 'score', label: 'Score', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const msg = document.createElement('div');
    msg.className = 'game-sub';
    msg.textContent = 'One of these is not like the others…';
    const grid = document.createElement('div');
    grid.className = 'odd-grid';
    wrap.append(msg, grid);
    stage.appendChild(wrap);

    api.interval(() => {
      timeLeft--;
      api.updateHud('time', timeLeft + 's', timeLeft <= 5);
      if (timeLeft <= 5 && timeLeft > 0) api.sound.play('tick');
      if (timeLeft <= 0) end();
    }, 1000);

    function next() {
      round++;
      if (round > ROUNDS) return end();
      locked = false;
      api.updateHud('round', round + '/' + ROUNDS);
      const n = Math.min(6, 2 + Math.ceil(round / 2));      // 3x3 up to 6x6
      const [a, b] = api.choice(PAIRS);
      const [base, odd] = Math.random() < 0.5 ? [a, b] : [b, a];
      const oddAt = api.randInt(0, n * n - 1);
      grid.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
      grid.innerHTML = '';
      for (let i = 0; i < n * n; i++) {
        const c = document.createElement('button');
        c.className = 'odd-cell';
        c.textContent = i === oddAt ? odd : base;
        c.addEventListener('click', () => pick(i === oddAt, c));
        grid.appendChild(c);
      }
    }

    function pick(isOdd, cell) {
      if (locked) return;
      if (isOdd) {
        locked = true;
        score += 10 + Math.max(0, timeLeft);
        api.updateHud('score', score, true);
        api.sound.play('good');
        const r = cell.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 12, shape: 'star', colors: ['#ffd43b', '#51cf66'], power: 5 });
        cell.classList.add('found');
        api.timeout(next, 450);
      } else {
        mistakes++;
        timeLeft = Math.max(0, timeLeft - 4);
        api.updateHud('time', timeLeft + 's', true);
        api.sound.play('bad');
        api.fx.shake(stage);
      }
    }

    function end() {
      const cleared = round - 1 + (locked ? 1 : 0);
      const perfect = cleared >= ROUNDS && mistakes === 0;
      api.win({
        coins: 15 + Math.round(score / 6), xp: 18 + Math.round(score / 6),
        title: perfect ? 'Eagle eyes! 🦅' : 'Sharp spotting! 🕵️',
        msg: `You found ${cleared} odd ones out.`,
        emoji: '🕵️', best: score, perfect,
        stats: [`🔎 ${cleared} found`, `⭐ ${score} pts`]
      });
    }

    next();
  }
});
