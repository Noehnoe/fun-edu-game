/* Reaction Dash — tap the instant it turns green */
Game.register({
  id: 'reaction',
  name: 'Reaction Dash',
  emoji: '⚡',
  tagline: 'Tap the moment it flips',
  category: 'reflex',
  reward: { coins: 40, xp: 50 },
  lowerBest: true,
  mount(stage, api) {
    const ROUNDS = 5;
    let round = 0, times = [], state = 'idle', greenAt = 0, waitT = null;

    api.setHud([
      { id: 'round', label: 'Round', value: '0/' + ROUNDS },
      { id: 'last', label: 'Last', value: '—' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const pad = document.createElement('button');
    pad.className = 'react-pad idle';
    pad.innerHTML = `<div class="react-big">Tap to start</div><div class="react-sub">5 rounds • measure your reflexes</div>`;
    wrap.appendChild(pad);
    stage.appendChild(wrap);

    pad.addEventListener('click', onTap);

    function setPad(cls, big, sub) {
      pad.className = 'react-pad ' + cls;
      pad.querySelector('.react-big').textContent = big;
      pad.querySelector('.react-sub').textContent = sub;
    }

    function arm() {
      state = 'waiting';
      setPad('waiting', 'Wait for green…', `Round ${round + 1} of ${ROUNDS}`);
      const delay = api.randInt(1100, 3000);
      waitT = setTimeout(() => {
        state = 'ready';
        greenAt = performance.now();
        setPad('ready', 'TAP!', 'Now!');
        api.sound.play('good');
      }, delay);
      api.onCleanup(() => clearTimeout(waitT));
    }

    function onTap() {
      if (state === 'idle') { round = 0; times = []; arm(); return; }
      if (state === 'waiting') {
        clearTimeout(waitT);
        api.sound.play('bad');
        setPad('early', 'Too early! 😅', 'Tap to try this round again');
        state = 'idle-round';
        return;
      }
      if (state === 'idle-round') { arm(); return; }
      if (state === 'ready') {
        const ms = Math.round(performance.now() - greenAt);
        times.push(ms);
        round++;
        api.sound.play('pop');
        api.updateHud('round', round + '/' + ROUNDS);
        api.updateHud('last', ms + 'ms', true);
        const r = pad.getBoundingClientRect();
        api.fx.floatText(r.left + r.width / 2, r.top + r.height / 2, ms + 'ms', '#4dabf7');
        if (ms < 300) api.flag('flash');
        if (round >= ROUNDS) return end();
        state = 'between';
        setPad('idle', ms + ' ms', 'Tap for next round');
        state = 'idle-round';
      }
    }

    function end() {
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const best = Math.min(...times);
      setPad('done', avg + ' ms avg', 'Great reflexes!');
      const score = Math.max(20, 700 - avg);
      api.win({
        coins: 20 + Math.round(score / 6), xp: 25 + Math.round(score / 6),
        title: '⚡ ' + avg + 'ms avg', msg: `Best reaction: ${best}ms`,
        emoji: '⚡', best: avg,
        stats: [`🏃 best ${best}ms`, `📊 avg ${avg}ms`]
      });
    }
  }
});
