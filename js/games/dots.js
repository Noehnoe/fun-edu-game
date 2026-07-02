/* Dot Count — the dots flash, then you guess how many there were */
Game.register({
  id: 'dots',
  name: 'Dot Count',
  emoji: '🔵',
  tagline: 'How many did you see?',
  category: 'math',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const ROUNDS = 8;
    const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#cc5de8', '#20c997', '#ffa94d'];
    let round = 0, correct = 0, locked = true;

    api.setHud([
      { id: 'round', label: 'Round', value: '0/' + ROUNDS },
      { id: 'score', label: 'Correct', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const msg = document.createElement('div');
    msg.className = 'game-msg';
    const box = document.createElement('div');
    box.className = 'dot-box';
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    wrap.append(msg, box, grid);
    stage.appendChild(wrap);

    function next() {
      round++;
      if (round > ROUNDS) return end();
      api.updateHud('round', round + '/' + ROUNDS);
      locked = true;
      grid.innerHTML = '';
      msg.textContent = 'Watch closely… 👀';
      const count = 4 + round + api.randInt(0, 3);
      box.innerHTML = '';
      for (let i = 0; i < count; i++) {
        const d = document.createElement('div');
        d.className = 'dot';
        const s = api.randInt(14, 24);
        d.style.width = d.style.height = s + 'px';
        d.style.left = api.randInt(4, 88) + '%';
        d.style.top = api.randInt(6, 82) + '%';
        d.style.background = api.choice(COLORS);
        box.appendChild(d);
      }
      const showFor = Math.max(800, 2100 - round * 160);
      api.timeout(() => {
        box.innerHTML = '';
        msg.textContent = 'How many dots were there?';
        ask(count);
      }, showFor);
    }

    function ask(count) {
      locked = false;
      const opts = new Set([count]);
      while (opts.size < 4) {
        const d = count + api.randInt(-3, 3);
        if (d > 0 && d !== count) opts.add(d);
      }
      grid.innerHTML = '';
      api.shuffle([...opts]).forEach(o => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = o;
        b.addEventListener('click', () => pick(b, o, count));
        grid.appendChild(b);
      });
    }

    function pick(btn, val, count) {
      if (locked) return;
      locked = true;
      if (val === count) {
        correct++;
        api.updateHud('score', correct, true);
        btn.classList.add('correct');
        api.sound.play('good');
        api.celebrate(btn);
      } else {
        btn.classList.add('wrong');
        api.sound.play('bad');
        [...grid.children].forEach(c => { if (+c.textContent === count) c.classList.add('correct'); });
      }
      api.timeout(next, 800);
    }

    function end() {
      const perfect = correct === ROUNDS;
      api.win({
        coins: 15 + correct * 10, xp: 18 + correct * 10,
        title: perfect ? 'Laser vision! 👁️' : 'Nice counting! 🔵',
        msg: `You got ${correct}/${ROUNDS} right.`,
        emoji: '🔵', best: correct, perfect,
        stats: [`✅ ${correct}/${ROUNDS}`]
      });
    }

    next();
  }
});
