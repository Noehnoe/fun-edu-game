/* Memory Match — flip cards to find pairs */
Game.register({
  id: 'memory',
  name: 'Memory Match',
  emoji: '🃏',
  tagline: 'Find the matching pairs',
  category: 'memory',
  reward: { coins: 40, xp: 50 },
  lowerBest: true,
  mount(stage, api) {
    const POOL = ['🍎','🍓','🍇','🦊','🐼','🐸','🐙','🦄'];
    let first = null, lock = false, moves = 0, matched = 0;

    const deck = api.shuffle([...POOL, ...POOL]);
    api.setHud([
      { id: 'moves', label: 'Moves', value: 0 },
      { id: 'pairs', label: 'Pairs', value: '0/8' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const grid = document.createElement('div');
    grid.className = 'mem-grid';
    wrap.appendChild(grid);
    stage.appendChild(wrap);

    deck.forEach((face, i) => {
      const card = document.createElement('button');
      card.className = 'mem-card';
      card.dataset.face = face;
      card.innerHTML = `
        <div class="mem-inner">
          <div class="mem-front">❓</div>
          <div class="mem-back">${face}</div>
        </div>`;
      card.addEventListener('click', () => flip(card));
      grid.appendChild(card);
    });

    function flip(card) {
      if (lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      card.classList.add('flipped');
      api.sound.play('flip');
      if (!first) { first = card; return; }
      moves++; api.updateHud('moves', moves);
      if (first.dataset.face === card.dataset.face) {
        first.classList.add('matched'); card.classList.add('matched');
        matched++; api.updateHud('pairs', matched + '/8', true);
        api.sound.play('good');
        const r = card.getBoundingClientRect();
        api.fx.emojiBurst(r.left + r.width / 2, r.top + r.height / 2, card.dataset.face, 6);
        first = null;
        if (matched === POOL.length) setTimeout(win, 450);
      } else {
        lock = true;
        const a = first, b = card; first = null;
        api.sound.play('bad');
        setTimeout(() => { a.classList.remove('flipped'); b.classList.remove('flipped'); lock = false; }, 750);
      }
    }

    function win() {
      const perfect = moves <= POOL.length; // 8 pairs in 8 moves = perfect memory
      const bonus = Math.max(0, 30 - (moves - POOL.length)) * 2;
      api.win({
        coins: 40 + bonus, xp: 50 + bonus,
        title: 'All matched! 🧠', msg: `Cleared in ${moves} moves.`,
        emoji: '🃏', best: moves, perfect,
        stats: [`🔁 ${moves} moves`]
      });
    }
  }
});
