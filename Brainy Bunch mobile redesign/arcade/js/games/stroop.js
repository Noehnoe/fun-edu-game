/* Color Clash — does the word's meaning match its ink color? (Stroop test) */
Game.register({
  id: 'stroop',
  name: 'Color Clash',
  emoji: '🎨',
  tagline: 'Word vs. ink — do they match?',
  category: 'reflex',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const COLORS = [
      { name: 'RED',    c: '#ff6b6b' },
      { name: 'BLUE',   c: '#4dabf7' },
      { name: 'GREEN',  c: '#51cf66' },
      { name: 'YELLOW', c: '#ffd43b' },
      { name: 'PURPLE', c: '#cc5de8' }
    ];
    let timeLeft = 30, score = 0, combo = 0, answered = 0, wrong = 0;
    let cur = null, locked = false;

    api.setHud([
      { id: 'time', label: 'Time', value: '30s' },
      { id: 'score', label: 'Score', value: 0 },
      { id: 'combo', label: 'Combo', value: 'x0' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Does the WORD mean the same as its ink color?';
    const word = document.createElement('div');
    word.className = 'stroop-word';
    const row = document.createElement('div');
    row.className = 'stroop-row';
    const yes = document.createElement('button');
    yes.className = 'btn btn-good stroop-btn';
    yes.textContent = '✔ Match';
    const no = document.createElement('button');
    no.className = 'btn btn-primary stroop-btn';
    no.textContent = '✘ Different';
    row.append(yes, no);
    wrap.append(help, word, row);
    stage.appendChild(wrap);

    yes.addEventListener('click', () => answer(true));
    no.addEventListener('click', () => answer(false));

    function next() {
      locked = false;
      const meaning = api.choice(COLORS);
      const match = Math.random() < 0.5;
      const ink = match ? meaning : api.choice(COLORS.filter(c => c !== meaning));
      cur = { match: meaning === ink, meaning, ink };
      word.textContent = meaning.name;
      word.style.color = ink.c;
      word.classList.remove('flash'); void word.offsetWidth; word.classList.add('flash');
    }

    function answer(saidMatch) {
      if (locked) return;
      locked = true;
      answered++;
      if (saidMatch === cur.match) {
        combo++;
        const gain = 5 + combo;
        score += gain;
        api.sound.play('good');
        api.updateHud('score', score, true);
        api.updateHud('combo', 'x' + combo);
        const r = word.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 8, colors: [cur.ink.c], power: 4 });
        if (combo % 8 === 0) { api.sound.play('sparkle'); api.fx.starShower({ count: 20 }); }
      } else {
        wrong++;
        combo = 0;
        timeLeft = Math.max(0, timeLeft - 3);
        api.updateHud('combo', 'x0');
        api.updateHud('time', timeLeft + 's', true);
        api.sound.play('bad');
        api.fx.shake(stage);
      }
      api.timeout(next, 120);
    }

    api.interval(() => {
      timeLeft--;
      api.updateHud('time', timeLeft + 's', timeLeft <= 5);
      if (timeLeft <= 5 && timeLeft > 0) api.sound.play('tick');
      if (timeLeft <= 0) end();
    }, 1000);

    function end() {
      locked = true;
      const perfect = answered >= 12 && wrong === 0;
      api.win({
        coins: 15 + Math.round(score / 2), xp: 18 + Math.round(score / 2),
        title: 'Brain unscrambled! 🎨', msg: `${answered - wrong} right out of ${answered}.`,
        emoji: '🎨', best: score, perfect,
        stats: [`⭐ ${score} pts`, `✅ ${answered - wrong}/${answered}`]
      });
    }

    next();
  }
});
