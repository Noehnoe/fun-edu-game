/* Number Recall — memorize the number, type it back; it keeps growing */
Game.register({
  id: 'digits',
  name: 'Number Recall',
  emoji: '🧮',
  tagline: 'How many digits can you hold?',
  category: 'memory',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    let len = 3, target = '', typed = '', accepting = false, successes = 0;

    api.setHud([
      { id: 'digits', label: 'Digits', value: len },
      { id: 'streak', label: 'Recalled', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const msg = document.createElement('div');
    msg.className = 'game-sub';
    msg.textContent = 'Memorize the number!';
    const display = document.createElement('div');
    display.className = 'digit-display';
    const pad = document.createElement('div');
    pad.className = 'keypad';
    wrap.append(msg, display, pad);
    stage.appendChild(wrap);

    const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','✔'];
    keys.forEach(k => {
      const b = document.createElement('button');
      b.className = 'key';
      b.textContent = k;
      b.addEventListener('click', () => press(k));
      pad.appendChild(b);
    });

    function onKey(e) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('⌫');
      else if (e.key === 'Enter') press('✔');
    }
    window.addEventListener('keydown', onKey);
    api.onCleanup(() => window.removeEventListener('keydown', onKey));

    function newRound() {
      typed = '';
      accepting = false;
      target = '';
      target += api.randInt(1, 9);
      for (let i = 1; i < len; i++) target += api.randInt(0, 9);
      api.updateHud('digits', len, true);
      msg.textContent = 'Memorize the number!';
      display.textContent = target;
      display.style.color = 'var(--ink)';
      const showFor = 900 + len * 260;
      api.timeout(() => {
        display.textContent = '?'.repeat(len);
        display.style.color = 'var(--ink-soft)';
        msg.textContent = 'Now type it back!';
        accepting = true;
      }, showFor);
    }

    function press(k) {
      if (!accepting) return;
      api.sound.play('tick');
      if (k === '⌫') typed = typed.slice(0, -1);
      else if (k === '✔') { if (typed.length) check(); return; }
      else if (typed.length < len) typed += k;
      display.textContent = typed.padEnd(len, '·');
      display.style.color = 'var(--ink)';
      if (typed.length === len) check();
    }

    function check() {
      accepting = false;
      if (typed === target) {
        successes++;
        api.updateHud('streak', successes, true);
        api.sound.play('good');
        const r = display.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 12, shape: 'star', colors: ['#4dabf7', '#ffd43b'], power: 5 });
        len++;
        if (len > 10) return end(true);
        api.timeout(newRound, 700);
      } else {
        display.textContent = target;
        display.style.color = 'var(--bad)';
        msg.textContent = `It was ${target}!`;
        api.sound.play('bad');
        api.fx.shake(stage);
        api.timeout(() => end(false), 1100);
      }
    }

    function end(won) {
      const finish = won ? api.win : (successes >= 3 ? api.win : api.lose);
      finish({
        coins: 12 + successes * 12, xp: 15 + successes * 12,
        title: won ? 'Photographic memory! 📸' : `${successes} recalled! 🧮`,
        msg: won ? 'You memorized a 10-digit number!' : `You held ${len - 1} digits in your head!`,
        emoji: '🧮', best: successes > 0 ? len - 1 : 0, perfect: won,
        stats: [`🔢 ${len - 1} digits`, `✅ ${successes} recalled`]
      });
    }

    newRound();
  }
});
