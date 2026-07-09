/* Maze Dash — guide the mouse to the cheese through a procedural maze */
Game.register({
  id: 'maze',
  name: 'Maze Dash',
  emoji: '🐭',
  tagline: 'Find the cheese!',
  category: 'logic',
  reward: { coins: 50, xp: 60 },
  lowerBest: true,
  mount(stage, api) {
    const COLS = 11, ROWS = 11, CS = 30;
    const W = COLS * CS, H = ROWS * CS;
    let steps = 0, done = false;

    // cells with walls [top, right, bottom, left]
    const cells = [];
    for (let y = 0; y < ROWS; y++)
      for (let x = 0; x < COLS; x++)
        cells.push({ x, y, walls: [true, true, true, true], seen: false });
    const at = (x, y) => cells[y * COLS + x];

    // recursive backtracker
    (function carve() {
      const stack = [at(0, 0)];
      at(0, 0).seen = true;
      while (stack.length) {
        const c = stack[stack.length - 1];
        const nbs = [];
        if (c.y > 0 && !at(c.x, c.y - 1).seen) nbs.push([at(c.x, c.y - 1), 0, 2]);
        if (c.x < COLS - 1 && !at(c.x + 1, c.y).seen) nbs.push([at(c.x + 1, c.y), 1, 3]);
        if (c.y < ROWS - 1 && !at(c.x, c.y + 1).seen) nbs.push([at(c.x, c.y + 1), 2, 0]);
        if (c.x > 0 && !at(c.x - 1, c.y).seen) nbs.push([at(c.x - 1, c.y), 3, 1]);
        if (!nbs.length) { stack.pop(); continue; }
        const [n, wall, opp] = nbs[api.randInt(0, nbs.length - 1)];
        c.walls[wall] = false;
        n.walls[opp] = false;
        n.seen = true;
        stack.push(n);
      }
    })();

    const player = { x: 0, y: 0 };
    const goal = { x: COLS - 1, y: ROWS - 1 };

    api.setHud([{ id: 'steps', label: 'Steps', value: 0 }]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Arrow keys / WASD, swipe, or the buttons below.';
    const canvas = document.createElement('canvas');
    canvas.className = 'maze-canvas';
    canvas.width = W + 8; canvas.height = H + 8;
    const ctx = canvas.getContext('2d');
    const pad = document.createElement('div');
    pad.className = 'arrow-pad';
    pad.innerHTML = `
      <button data-d="up">▲</button>
      <div class="arrow-mid">
        <button data-d="left">◀</button>
        <button data-d="down">▼</button>
        <button data-d="right">▶</button>
      </div>`;
    wrap.append(help, canvas, pad);
    stage.appendChild(wrap);

    const DIRS = { up: [0, -1, 0], down: [0, 1, 2], left: [-1, 0, 3], right: [1, 0, 1] };
    pad.querySelectorAll('button').forEach(b => b.addEventListener('click', () => move(b.dataset.d)));

    function move(d) {
      if (done) return;
      const [dx, dy, wall] = DIRS[d];
      const c = at(player.x, player.y);
      if (c.walls[wall]) { api.sound.play('flip'); return; }
      player.x += dx; player.y += dy;
      steps++;
      api.updateHud('steps', steps);
      api.sound.play('tick');
      draw();
      if (player.x === goal.x && player.y === goal.y) finish();
    }

    function draw() {
      ctx.fillStyle = '#fffdf4';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(4, 4);
      // trail-free simple draw
      ctx.strokeStyle = '#2b2150';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      cells.forEach(c => {
        const px = c.x * CS, py = c.y * CS;
        ctx.beginPath();
        if (c.walls[0]) { ctx.moveTo(px, py); ctx.lineTo(px + CS, py); }
        if (c.walls[1]) { ctx.moveTo(px + CS, py); ctx.lineTo(px + CS, py + CS); }
        if (c.walls[2]) { ctx.moveTo(px, py + CS); ctx.lineTo(px + CS, py + CS); }
        if (c.walls[3]) { ctx.moveTo(px, py); ctx.lineTo(px, py + CS); }
        ctx.stroke();
      });
      ctx.font = (CS - 8) + 'px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🧀', (goal.x + 0.5) * CS, (goal.y + 0.55) * CS);
      ctx.fillText('🐭', (player.x + 0.5) * CS, (player.y + 0.55) * CS);
      ctx.restore();
    }

    function finish() {
      done = true;
      const par = COLS * ROWS * 0.7;
      const bonus = Math.max(0, Math.round((par - steps) * 2));
      const r = canvas.getBoundingClientRect();
      api.fx.emojiBurst(r.left + r.width - 30, r.top + r.height - 30, '🧀', 10);
      api.win({
        coins: 45 + bonus, xp: 55 + bonus,
        title: 'Cheese! 🧀', msg: `Found in ${steps} steps.`,
        emoji: '🐭', best: steps,
        stats: [`👣 ${steps} steps`]
      });
    }

    function onKey(e) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                    w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    }
    window.addEventListener('keydown', onKey);
    api.onCleanup(() => window.removeEventListener('keydown', onKey));

    let sx = 0, sy = 0;
    canvas.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });

    draw();
  }
});
