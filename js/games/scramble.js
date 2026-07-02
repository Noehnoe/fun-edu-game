/* Word Scramble — unscramble the letters using the hint */
Game.register({
  id: 'scramble',
  name: 'Word Scramble',
  emoji: '🔤',
  tagline: 'Unscramble the word',
  category: 'language',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const WORDS = [
      { w: 'PLANET',  h: 'A world that orbits a star' },
      { w: 'GARDEN',  h: 'Place where flowers grow' },
      { w: 'ROCKET',  h: 'It blasts into space' },
      { w: 'BRIDGE',  h: 'Crosses over a river' },
      { w: 'CASTLE',  h: 'A king might live here' },
      { w: 'JUNGLE',  h: 'Dense tropical forest' },
      { w: 'PUZZLE',  h: 'A brain-teasing challenge' },
      { w: 'WINTER',  h: 'The coldest season' },
      { w: 'GUITAR',  h: 'Instrument with six strings' },
      { w: 'DRAGON',  h: 'A fire-breathing beast' },
      { w: 'PENCIL',  h: 'You write and erase with it' },
      { w: 'TURTLE',  h: 'Slow reptile with a shell' }
    ];
    const ROUNDS = 5;
    let queue = api.shuffle(WORDS).slice(0, ROUNDS);
    let idx = 0, solved = 0, current = null, build = [];

    api.setHud([
      { id: 'word', label: 'Word', value: '1/' + ROUNDS },
      { id: 'solved', label: 'Solved', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const hint = document.createElement('div');
    hint.className = 'scramble-hint';
    const answer = document.createElement('div');
    answer.className = 'scramble-answer';
    const pool = document.createElement('div');
    pool.className = 'scramble-pool';
    const controls = document.createElement('div');
    controls.className = 'row';
    const clearBtn = mkBtn('⌫ Clear', 'btn-ghost', () => {
      build = [];
      if (current) current.letters.forEach(l => l.used = false);   // re-enable every tile
      render();
      api.sound.play('flip');
    });
    const skipBtn = mkBtn('⏭ Skip', 'btn-ghost', () => { api.sound.play('whoosh'); next(); });
    controls.append(clearBtn, skipBtn);
    wrap.append(hint, answer, pool, controls);
    stage.appendChild(wrap);

    function scramble(word) {
      let letters;
      do { letters = api.shuffle(word.split('')); }
      while (letters.join('') === word && word.length > 1);
      return letters;
    }

    function load() {
      current = queue[idx];
      current.letters = scramble(current.w).map((ch, i) => ({ ch, id: i, used: false }));
      build = [];
      hint.textContent = '💡 ' + current.h;
      api.updateHud('word', (idx + 1) + '/' + ROUNDS);
      render();
    }

    function render() {
      // answer slots
      answer.innerHTML = '';
      for (let i = 0; i < current.w.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot-cell';
        if (build[i] != null) {
          const lid = build[i];                 // capture this slot's letter id
          slot.textContent = current.letters[lid].ch;
          slot.classList.add('filled');
          slot.addEventListener('click', () => { // tap a placed letter to remove it
            const pos = build.indexOf(lid);
            if (pos === -1) return;             // already removed elsewhere
            current.letters[lid].used = false;
            build.splice(pos, 1);
            api.sound.play('flip');
            render();
          });
        }
        answer.appendChild(slot);
      }
      // pool tiles
      pool.innerHTML = '';
      current.letters.forEach(l => {
        const t = document.createElement('button');
        t.className = 'letter-tile' + (l.used ? ' used' : '');
        t.textContent = l.ch;
        t.disabled = l.used;
        t.addEventListener('click', () => {
          if (l.used || build.length >= current.w.length) return;
          const r = t.getBoundingClientRect();
          api.fx.burst(r.left + r.width / 2, r.top + r.height / 2, { count: 7, colors: ['#ffd43b', '#ffa94d'], shape: 'star', power: 4 });
          l.used = true; build.push(l.id);
          api.sound.play('pop');
          render();
          if (build.length === current.w.length) check();
        });
        pool.appendChild(t);
      });
    }

    function check() {
      const guess = build.map(i => current.letters[i].ch).join('');
      if (guess === current.w) {
        solved++; api.updateHud('solved', solved, true);
        api.sound.play('good');
        [...answer.children].forEach(c => c.classList.add('correct-cell'));
        const r = answer.getBoundingClientRect();
        api.fx.burst(r.left + r.width / 2, r.top + 20, { count: 16, shape: 'rect' });
        api.timeout(next, 700);
      } else {
        api.sound.play('bad');
        answer.classList.add('shake-x');
        api.timeout(() => {
          answer.classList.remove('shake-x');
          build = []; current.letters.forEach(l => l.used = false); render();
        }, 500);
      }
    }

    function next() {
      idx++;
      if (idx >= queue.length) return finish();
      load();
    }

    function finish() {
      const perfect = solved === ROUNDS;
      api.win({
        coins: 20 + solved * 14, xp: 25 + solved * 14,
        title: perfect ? 'Word Wizard! 🪄' : 'Nice words! 🔤',
        msg: `You unscrambled ${solved}/${ROUNDS} words.`,
        emoji: '🔤', best: solved, perfect,
        stats: [`📖 ${solved}/${ROUNDS} solved`]
      });
    }

    function mkBtn(text, cls, fn) {
      const b = document.createElement('button');
      b.className = 'btn ' + cls; b.textContent = text; b.addEventListener('click', fn);
      return b;
    }

    load();
  }
});
