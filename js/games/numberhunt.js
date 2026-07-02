/* Number Hunt — tap 1 → 20 in order as fast as you can */
Game.register({
  id: 'numberhunt',
  name: 'Number Hunt',
  emoji: '🔍',
  tagline: 'Tap 1 to 20 in order',
  category: 'math',
  reward: { coins: 40, xp: 50 },
  lowerBest: true,
  mount(stage, api) {
    const N = 20;
    let next = 1, start = null, penalty = 0, done = false;

    api.setHud([
      { id: 'next', label: 'Find', value: 1 },
      { id: 'time', label: 'Time', value: '0.0s' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Wrong taps add +2s. Ready, set, hunt!';
    const grid = document.createElement('div');
    grid.className = 'hunt-grid';
    wrap.append(help, grid);
    stage.appendChild(wrap);

    const nums = api.shuffle(Array.from({ length: N }, (_, i) => i + 1));
    nums.forEach(v => {
      const c = document.createElement('button');
      c.className = 'hunt-cell';
      c.textContent = v;
      c.addEventListener('click', () => tap(v, c));
      grid.appendChild(c);
    });

    api.interval(() => {
      if (start == null || done) return;
      api.updateHud('time', elapsed().toFixed(1) + 's');
    }, 100);

    function elapsed() { return (performance.now() - start) / 1000 + penalty; }

    function tap(v, cell) {
      if (done) return;
      if (start == null) {
        if (v !== 1) { api.sound.play('bad'); api.fx.shake(stage); return; }
        start = performance.now();
      }
      if (v === next) {
        cell.classList.add('found');
        api.sound.play('pop');
        const r = cell.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 6, colors: ['#51cf66'], power: 3 });
        next++;
        api.updateHud('next', next <= N ? next : '✓', true);
        if (next > N) finish();
      } else {
        penalty += 2;
        api.sound.play('bad');
        api.fx.shake(stage);
        api.fx.floatText(cell.getBoundingClientRect().left + 20, cell.getBoundingClientRect().top, '+2s', '#ff5d6c');
      }
    }

    function finish() {
      done = true;
      const t = Math.round(elapsed() * 10) / 10;
      const perfect = penalty === 0 && t <= 25;
      api.win({
        coins: 20 + Math.max(0, Math.round((60 - t) * 1.6)),
        xp: 25 + Math.max(0, Math.round((60 - t) * 1.6)),
        title: t + 's! 🔍', msg: perfect ? 'Flawless hunting!' : 'All 20 found!',
        emoji: '🔍', best: t, perfect,
        stats: [`⏱ ${t}s`, penalty ? `⚠️ +${penalty}s penalties` : '✨ no mistakes']
      });
    }
  }
});
