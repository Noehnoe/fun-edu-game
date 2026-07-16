/* Math Sprint — timed arithmetic with multiple choice */
Game.register({
  id: 'math',
  name: 'Math Sprint',
  emoji: '➗',
  tagline: 'Solve before time runs out',
  category: 'math',
  reward: { coins: 40, xp: 50 },
  mount(stage, api) {
    let timeLeft = 45, score = 0, combo = 0, answered = 0, correct = 0;
    let q = null, locked = false, timer = null;

    api.setHud([
      { id: 'time', label: 'Time', value: '45s' },
      { id: 'score', label: 'Score', value: 0 },
      { id: 'combo', label: 'Combo', value: 'x1' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const qBox = document.createElement('div');
    qBox.className = 'math-question';
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    wrap.append(qBox, grid);
    stage.appendChild(wrap);

    function level() { return Math.min(4, 1 + Math.floor(answered / 4)); }

    function makeQuestion() {
      const lv = level();
      const ops = lv >= 4 ? ['+', '-', '×', '÷'] : lv >= 2 ? ['+', '-', '×'] : ['+', '-'];
      const op = api.choice(ops);
      let a, b, ans, text;
      const max = 5 + lv * 6;
      if (op === '+') { a = api.randInt(2, max); b = api.randInt(2, max); ans = a + b; }
      else if (op === '-') { a = api.randInt(2, max); b = api.randInt(1, a); ans = a - b; }
      else if (op === '×') { a = api.randInt(2, 3 + lv * 2); b = api.randInt(2, 3 + lv * 2); ans = a * b; }
      else { b = api.randInt(2, 6); ans = api.randInt(2, 9); a = b * ans; }
      text = `${a} ${op} ${b}`;
      const opts = new Set([ans]);
      while (opts.size < 4) {
        const d = ans + api.randInt(-6, 6);
        if (d !== ans && d >= 0) opts.add(d);
      }
      return { text, ans, opts: api.shuffle([...opts]) };
    }

    function render() {
      q = makeQuestion();
      locked = false;
      qBox.textContent = q.text + ' = ?';
      qBox.classList.remove('flash'); void qBox.offsetWidth; qBox.classList.add('flash');
      grid.innerHTML = '';
      q.opts.forEach(o => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = o;
        b.addEventListener('click', () => pick(b, o));
        grid.appendChild(b);
      });
    }

    function pick(btn, val) {
      if (locked) return;
      locked = true;
      answered++;
      if (val === q.ans) {
        correct++; combo++;
        const gain = 10 + combo * 2;
        score += gain;
        btn.classList.add('correct');
        api.sound.play('good');
        api.updateHud('score', score, true);
        api.updateHud('combo', 'x' + combo);
        if (combo > 0 && combo % 5 === 0) { api.sound.play('sparkle'); api.fx.starShower({ count: 24 }); }
        const r = btn.getBoundingClientRect();
        api.fx.floatText(r.left + r.width / 2, r.top, '+' + gain, '#2fbf71');
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2,
          { count: 9 + combo, shape: 'star', colors: ['#51cf66', '#ffd43b', '#fff'], power: 5 });
      } else {
        combo = 0;
        timeLeft = Math.max(0, timeLeft - 3);
        btn.classList.add('wrong');
        api.sound.play('bad');
        api.updateHud('combo', 'x1');
        [...grid.children].forEach(c => { if (+c.textContent === q.ans) c.classList.add('correct'); });
      }
      api.timeout(() => { if (timeLeft > 0) render(); }, 520);
    }

    timer = api.interval(() => {
      timeLeft--;
      api.updateHud('time', timeLeft + 's', timeLeft <= 5);
      if (timeLeft <= 5 && timeLeft > 0) api.sound.play('tick');
      if (timeLeft <= 0) end();
    }, 1000);

    function end() {
      api.clearTimer(timer);
      locked = true;
      const acc = answered ? Math.round((correct / answered) * 100) : 0;
      const perfect = answered >= 8 && correct === answered;
      api.win({
        coins: 20 + score, xp: 25 + Math.round(score * 0.8),
        title: 'Time! 🧮', msg: `${correct} correct • ${acc}% accuracy`,
        emoji: '➗', best: score, perfect,
        stats: [`✅ ${correct} right`, `🎯 ${acc}%`]
      });
    }

    render();
  }
});
