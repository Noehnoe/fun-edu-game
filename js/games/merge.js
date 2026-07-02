/* Number Merge — 2048-style sliding tiles */
Game.register({
  id: 'merge',
  name: 'Number Merge',
  emoji: '🔢',
  tagline: 'Combine tiles to 512',
  category: 'logic',
  reward: { coins: 50, xp: 60 },
  mount(stage, api) {
    const N = 4, TARGET = 512;
    let grid, score, best, over, reached;
    const COLORS = {
      2:'#fff4d6',4:'#ffe8b3',8:'#ffd08a',16:'#ffb074',32:'#ff8f6b',
      64:'#ff6b6b',128:'#ffd43b',256:'#a9e34b',512:'#51cf66',
      1024:'#4dabf7',2048:'#cc5de8'
    };

    api.setHud([
      { id: 'score', label: 'Score', value: 0 },
      { id: 'top', label: 'Best Tile', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Arrow keys / WASD or swipe. Same numbers merge!';
    const board = document.createElement('div');
    board.className = 'merge-board';
    const pad = document.createElement('div');
    pad.className = 'arrow-pad';
    pad.innerHTML = `
      <button data-d="up">▲</button>
      <div class="arrow-mid">
        <button data-d="left">◀</button>
        <button data-d="down">▼</button>
        <button data-d="right">▶</button>
      </div>`;
    wrap.append(help, board, pad);
    stage.appendChild(wrap);

    pad.querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () => move(b.dataset.d)));

    function reset() {
      grid = Array.from({ length: N }, () => Array(N).fill(0));
      score = 0; best = 0; over = false; reached = false;
      addTile(); addTile(); render();
    }
    function empties() {
      const e = [];
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) e.push([r, c]);
      return e;
    }
    function addTile() {
      const e = empties(); if (!e.length) return;
      const [r, c] = e[api.randInt(0, e.length - 1)];
      grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }

    function slide(row) {
      let arr = row.filter(v => v);
      let gained = 0;
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) { arr[i] *= 2; gained += arr[i]; arr.splice(i + 1, 1); }
      }
      while (arr.length < N) arr.push(0);
      return { arr, gained };
    }

    function lineCoords(dir) {
      const lines = [];
      for (let i = 0; i < N; i++) {
        const coords = [];
        for (let j = 0; j < N; j++) {
          if (dir === 'left') coords.push([i, j]);
          else if (dir === 'right') coords.push([i, N - 1 - j]);
          else if (dir === 'up') coords.push([j, i]);
          else coords.push([N - 1 - j, i]); // down
        }
        lines.push(coords);
      }
      return lines;
    }

    function move(dir) {
      if (over) return;
      const before = JSON.stringify(grid);
      let gained = 0;
      lineCoords(dir).forEach(coords => {
        const vals = coords.map(([r, c]) => grid[r][c]);
        const { arr, gained: g } = slide(vals);
        gained += g;
        coords.forEach(([r, c], k) => { grid[r][c] = arr[k]; });
      });

      if (JSON.stringify(grid) === before) return;     // nothing moved
      score += gained;
      addTile();
      render();
      if (gained) { api.sound.play('merge'); api.updateHud('score', score, true); }
      else api.sound.play('swipe');

      const top = Math.max(...grid.flat());
      api.updateHud('top', top);
      if (top >= TARGET && !reached) { reached = true; win(top); return; }
      if (!canMove()) end(top);
    }

    function canMove() {
      if (empties().length) return true;
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        if (c < N - 1 && grid[r][c] === grid[r][c + 1]) return true;
        if (r < N - 1 && grid[r][c] === grid[r + 1][c]) return true;
      }
      return false;
    }

    function render() {
      board.innerHTML = '';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = 'merge-cell';
        const v = grid[r][c];
        if (v) {
          cell.textContent = v;
          cell.style.background = COLORS[v] || '#7c5cff';
          cell.style.color = v <= 4 ? '#7a6a3a' : '#fff';
          cell.style.fontSize = v >= 1000 ? '1.4rem' : v >= 100 ? '1.7rem' : '2rem';
          cell.classList.add('pop-tile');
        } else cell.classList.add('empty');
        board.appendChild(cell);
      }
    }

    function win(top) {
      api.win({
        coins: 60 + Math.round(score / 8), xp: 70 + Math.round(score / 8),
        title: 'You hit 512! 🏅', msg: `Final score ${score} — amazing merging!`,
        emoji: '🔢', best: score, perfect: top >= 2048,
        stats: [`🏆 best tile ${top}`, `⭐ ${score} pts`]
      });
    }
    function end(top) {
      over = true;
      api.lose({
        coins: 10 + Math.round(score / 10), xp: 12 + Math.round(score / 10),
        title: 'Board full!', msg: `Score ${score}. Highest tile ${top}.`,
        emoji: '🔢', best: score,
        stats: [`🏆 best tile ${top}`, `⭐ ${score} pts`]
      });
    }

    function onKey(e) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                    w: 'up', s: 'down', a: 'left', d: 'right', W:'up',S:'down',A:'left',D:'right' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    }
    window.addEventListener('keydown', onKey);
    api.onCleanup(() => window.removeEventListener('keydown', onKey));

    // swipe
    let sx = 0, sy = 0;
    board.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    board.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });

    reset();
  }
});
