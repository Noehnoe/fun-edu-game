/* Missing Letter — fill the blank using the emoji clue */
Game.register({
  id: 'missing',
  name: 'Missing Letter',
  emoji: '✏️',
  tagline: 'Fill in the blank',
  category: 'language',
  reward: { coins: 40, xp: 50 },
  mount(stage, api) {
    const BANK = [
      ['ELEPHANT', '🐘'], ['GIRAFFE', '🦒'], ['PENGUIN', '🐧'], ['DOLPHIN', '🐬'],
      ['BANANA', '🍌'], ['ORANGE', '🍊'], ['GUITAR', '🎸'], ['ROCKET', '🚀'],
      ['CASTLE', '🏰'], ['DRAGON', '🐉'], ['FLOWER', '🌸'], ['MONKEY', '🐵'],
      ['RABBIT', '🐰'], ['SPIDER', '🕷️'], ['WINTER', '☃️'], ['SCHOOL', '🏫'],
      ['PLANET', '🪐'], ['COOKIE', '🍪']
    ];
    const ROUNDS = 10;
    const queue = api.shuffle(BANK).slice(0, ROUNDS);
    let idx = 0, correct = 0, locked = false;

    api.setHud([
      { id: 'word', label: 'Word', value: '1/' + ROUNDS },
      { id: 'score', label: 'Correct', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const hint = document.createElement('div');
    hint.className = 'ml-hint';
    const wordEl = document.createElement('div');
    wordEl.className = 'ml-word';
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    wrap.append(hint, wordEl, grid);
    stage.appendChild(wrap);

    function render() {
      locked = false;
      const [word, emoji] = queue[idx];
      const gapAt = api.randInt(0, word.length - 1);
      const answer = word[gapAt];
      api.updateHud('word', (idx + 1) + '/' + ROUNDS);
      hint.textContent = emoji;
      wordEl.innerHTML = '';
      [...word].forEach((ch, i) => {
        const c = document.createElement('div');
        c.className = 'ml-cell' + (i === gapAt ? ' gap' : '');
        c.textContent = i === gapAt ? '?' : ch;
        wordEl.appendChild(c);
      });
      const opts = new Set([answer]);
      const AZ = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      while (opts.size < 4) opts.add(AZ[api.randInt(0, 25)]);
      grid.innerHTML = '';
      api.shuffle([...opts]).forEach(letter => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.textContent = letter;
        b.addEventListener('click', () => pick(b, letter, answer, gapAt));
        grid.appendChild(b);
      });
    }

    function pick(btn, letter, answer, gapAt) {
      if (locked) return;
      locked = true;
      const gapCell = wordEl.children[gapAt];
      if (letter === answer) {
        correct++;
        api.updateHud('score', correct, true);
        btn.classList.add('correct');
        gapCell.textContent = letter;
        gapCell.classList.remove('gap');
        api.sound.play('good');
        const r = gapCell.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 8, shape: 'star', colors: ['#ffa94d', '#ffd43b'], power: 4 });
      } else {
        btn.classList.add('wrong');
        gapCell.textContent = answer;
        api.sound.play('bad');
        [...grid.children].forEach(c => { if (c.textContent === answer) c.classList.add('correct'); });
      }
      api.timeout(() => { idx++; idx >= queue.length ? end() : render(); }, 800);
    }

    function end() {
      const perfect = correct === ROUNDS;
      api.win({
        coins: 15 + correct * 8, xp: 18 + correct * 8,
        title: perfect ? 'Spelling star! ✨' : 'Well spelled! ✏️',
        msg: `You fixed ${correct}/${ROUNDS} words.`,
        emoji: '✏️', best: correct, perfect,
        stats: [`✅ ${correct}/${ROUNDS}`]
      });
    }

    render();
  }
});
