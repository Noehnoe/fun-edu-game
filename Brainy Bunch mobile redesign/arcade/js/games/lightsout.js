/* Lights Out — turn off every light */
Game.register({
  id: 'lightsout',
  name: 'Lights Out',
  emoji: '💡',
  tagline: 'Switch off all the lights',
  category: 'logic',
  reward: { coins: 50, xp: 60 },
  lowerBest: true,
  mount(stage, api) {
    const N = 5;
    let grid, moves;

    api.setHud([
      { id: 'moves', label: 'Moves', value: 0 },
      { id: 'on', label: 'Lit', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Tapping a tile flips it and its neighbors. Turn them all off!';
    const board = document.createElement('div');
    board.className = 'lights-grid';
    const controls = document.createElement('div');
    controls.className = 'row';
    const newBtn = document.createElement('button');
    newBtn.className = 'btn btn-ghost'; newBtn.textContent = '🎲 New';
    newBtn.addEventListener('click', () => { api.sound.play('whoosh'); newBoard(); });
    controls.appendChild(newBtn);
    wrap.append(help, board, controls);
    stage.appendChild(wrap);

    const cells = [];
    for (let i = 0; i < N * N; i++) {
      const c = document.createElement('button');
      c.className = 'light';
      c.addEventListener('click', () => tap(Math.floor(i / N), i % N));
      board.appendChild(c);
      cells.push(c);
    }

    function flip(r, c) {
      if (r < 0 || c < 0 || r >= N || c >= N) return;
      grid[r][c] ^= 1;
    }
    function press(r, c) { flip(r, c); flip(r - 1, c); flip(r + 1, c); flip(r, c - 1); flip(r, c + 1); }

    function newBoard() {
      grid = Array.from({ length: N }, () => Array(N).fill(0));
      // create a solvable board by random presses from off-state
      const k = api.randInt(6, 12);
      for (let i = 0; i < k; i++) press(api.randInt(0, N - 1), api.randInt(0, N - 1));
      if (countOn() === 0) press(api.randInt(0, N - 1), api.randInt(0, N - 1));
      moves = 0;
      api.updateHud('moves', 0);
      render();
    }

    function countOn() { return grid.flat().filter(v => v).length; }

    function tap(r, c) {
      press(r, c);
      moves++;
      api.sound.play('flip');
      api.updateHud('moves', moves);
      render();
      const r0 = cells[r * N + c].getBoundingClientRect();
      api.fx.burst(r0.left + r0.width / 2, r0.top + r0.height / 2, { count: 6, colors: ['#ffd43b'], power: 3 });
      if (countOn() === 0) win();
    }

    function render() {
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        cells[r * N + c].classList.toggle('on', !!grid[r][c]);
      }
      api.updateHud('on', countOn());
    }

    function win() {
      const perfect = moves <= 10;
      const bonus = Math.max(0, 40 - moves * 2);
      api.win({
        coins: 45 + bonus, xp: 55 + bonus,
        title: 'Lights out! 💡', msg: `Cleared in ${moves} moves.`,
        emoji: '💡', best: moves, perfect,
        stats: [`🔁 ${moves} moves`]
      });
    }

    newBoard();
  }
});
