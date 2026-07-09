/* Sliding Puzzle — order the numbered tiles */
Game.register({
  id: 'slider',
  name: 'Slide Puzzle',
  emoji: '🧩',
  tagline: 'Slide tiles into order',
  category: 'logic',
  reward: { coins: 50, xp: 60 },
  lowerBest: true,
  mount(stage, api) {
    const N = 4, BLANK = N * N - 1;
    let tiles, moves;
    const GRAD = ['#7c5cff','#4dabf7','#20c997','#51cf66','#ffd43b','#ffa94d','#ff6b6b','#f06595','#cc5de8'];

    api.setHud([{ id: 'moves', label: 'Moves', value: 0 }]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Tap a tile next to the gap to slide it. Order 1→15.';
    const board = document.createElement('div');
    board.className = 'slide-board';
    const controls = document.createElement('div');
    controls.className = 'row';
    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-ghost'; newBtn.textContent = '🎲 Shuffle';
    newBtn.addEventListener('click', () => { api.sound.play('whoosh'); shuffleBoard(); });
    controls.appendChild(newBtn);
    wrap.append(help, board, controls);
    stage.appendChild(wrap);

    function solvedState() { return Array.from({ length: N * N }, (_, i) => i); }

    function shuffleBoard() {
      tiles = solvedState();
      let blank = BLANK;
      // many random legal moves => always solvable
      let prev = -1;
      for (let i = 0; i < 250; i++) {
        const nb = neighbors(blank).filter(n => n !== prev);
        const pick = nb[api.randInt(0, nb.length - 1)];
        [tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]];
        prev = blank; blank = pick;
      }
      moves = 0;
      api.updateHud('moves', 0);
      render();
    }

    function neighbors(idx) {
      const r = Math.floor(idx / N), c = idx % N, res = [];
      if (r > 0) res.push(idx - N);
      if (r < N - 1) res.push(idx + N);
      if (c > 0) res.push(idx - 1);
      if (c < N - 1) res.push(idx + 1);
      return res;
    }

    function tap(idx) {
      const blank = tiles.indexOf(BLANK);
      if (!neighbors(idx).includes(blank)) return;
      [tiles[idx], tiles[blank]] = [tiles[blank], tiles[idx]];
      moves++;
      api.sound.play('flip');
      api.updateHud('moves', moves);
      render();
      if (isSolved()) win();
    }

    function isSolved() { return tiles.every((v, i) => v === i); }

    function render() {
      board.innerHTML = '';
      tiles.forEach((val, idx) => {
        const cell = document.createElement('button');
        cell.className = 'slide-tile';
        if (val === BLANK) { cell.classList.add('blank'); }
        else {
          cell.textContent = val + 1;
          cell.style.background = GRAD[val % GRAD.length];
          cell.addEventListener('click', () => tap(idx));
        }
        board.appendChild(cell);
      });
    }

    function win() {
      api.fx.confetti({ count: 80 });
      const perfect = moves <= 80;
      api.win({
        coins: 50 + Math.max(0, 120 - moves), xp: 60 + Math.max(0, 120 - moves),
        title: 'Solved! 🧩', msg: `Ordered in ${moves} moves.`,
        emoji: '🧩', best: moves, perfect,
        stats: [`🔁 ${moves} moves`]
      });
    }

    shuffleBoard();
  }
});
