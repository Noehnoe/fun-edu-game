/* Number Merge — 2048-style sliding tiles, unlocked to merge forever */
Game.register({
  id: 'merge',
  name: 'Number Merge',
  emoji: '🔢',
  tagline: 'Combine tiles to infinity',
  category: 'logic',
  reward: { coins: 50, xp: 60 },
  mount(stage, api) {
    const N = 4;
    let grid, score, over, milestone;
    // Cycles every 11 tiers (2 -> 2048) so huge tiles still get a distinct color band.
    const COLOR_RAMP = [
      '#fff4d6','#ffe8b3','#ffd08a','#ffb074','#ff8f6b',
      '#ff6b6b','#ffd43b','#a9e34b','#51cf66','#4dabf7','#cc5de8'
    ];
    function tileColor(v) {
      const tier = Math.round(Math.log2(v));           // 2->1, 4->2, 8->3, ...
      return COLOR_RAMP[(tier - 1 + COLOR_RAMP.length * 100) % COLOR_RAMP.length];
    }
    function formatTile(v) {
      if (v < 1000) return String(v);
      if (v < 1_000_000) return (v / 1000).toFixed(v % 1000 ? 1 : 0) + 'K';
      if (v < 1_000_000_000) return (v / 1_000_000).toFixed(v % 1_000_000 ? 1 : 0) + 'M';
      return (v / 1_000_000_000).toFixed(1) + 'B';
    }
    // Milestones keep rewarding the player as they blow past the old 512 cap — no upper limit.
    const MILESTONES = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072];

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
      score = 0; over = false; milestone = 0;
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
      api.updateHud('top', formatTile(top));

      // Celebrate each milestone in passing, but never stop the run — merge to infinity.
      if (milestone < MILESTONES.length && top >= MILESTONES[milestone]) {
        milestone++;
        api.sound.play('unlock');
        api.toast(`🎉 ${formatTile(top)} tile!`);
      }
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
          const label = formatTile(v);
          cell.textContent = label;
          cell.style.background = tileColor(v);
          cell.style.color = v <= 4 ? '#7a6a3a' : '#fff';
          cell.style.fontSize = label.length >= 5 ? '1.15rem' : label.length >= 4 ? '1.4rem' : v >= 100 ? '1.7rem' : '2rem';
          cell.classList.add('pop-tile');
        } else cell.classList.add('empty');
        board.appendChild(cell);
      }
    }

    function end(top) {
      over = true;
      const cleared = top >= 512;   // reached (at least) the old cap — treat as a win, not a loss
      const label = formatTile(top);
      if (cleared) {
        api.win({
          coins: 60 + Math.round(score / 8), xp: 70 + Math.round(score / 8),
          title: 'Board full — great run! 🏅', msg: `Final score ${score}. Best tile: ${label}.`,
          emoji: '🔢', best: score, perfect: top >= 2048,
          stats: [`🏆 best tile ${label}`, `⭐ ${score} pts`]
        });
      } else {
        api.lose({
          coins: 10 + Math.round(score / 10), xp: 12 + Math.round(score / 10),
          title: 'Board full!', msg: `Score ${score}. Highest tile ${label}.`,
          emoji: '🔢', best: score,
          stats: [`🏆 best tile ${label}`, `⭐ ${score} pts`]
        });
      }
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
