/* Snake — classic grow-and-survive on canvas */
Game.register({
  id: 'snake',
  name: 'Snake Snack',
  emoji: '🐍',
  tagline: 'Eat, grow, survive',
  category: 'reflex',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const CELLS = 17, SIZE = 22, PX = CELLS * SIZE;
    let snake, dir, nextDir, food, score, alive, loop, speed, acc, last;

    api.setHud([{ id: 'score', label: 'Score', value: 0 }]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Arrow keys / WASD or swipe to steer.';
    const canvas = document.createElement('canvas');
    canvas.className = 'snake-canvas';
    canvas.width = PX; canvas.height = PX;
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

    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    pad.querySelectorAll('button').forEach(b => b.addEventListener('click', () => turn(b.dataset.d)));

    function reset() {
      snake = [{ x: 8, y: 8 }, { x: 7, y: 8 }, { x: 6, y: 8 }];
      dir = 'right'; nextDir = 'right'; score = 0; alive = true;
      speed = 150; acc = 0; last = performance.now();
      placeFood();
      api.updateHud('score', 0);
      loop = requestAnimationFrame(step);
    }

    function placeFood() {
      do { food = { x: api.randInt(0, CELLS - 1), y: api.randInt(0, CELLS - 1) }; }
      while (snake.some(s => s.x === food.x && s.y === food.y));
    }

    function turn(d) {
      const [dx, dy] = DIRS[d], [cx, cy] = DIRS[dir];
      if (dx === -cx && dy === -cy) return; // no 180
      nextDir = d;
    }

    function step(t) {
      const dt = t - last; last = t; acc += dt;
      if (acc >= speed) {
        acc = 0; tick();
      }
      draw();
      if (alive) loop = requestAnimationFrame(step);
    }

    function tick() {
      dir = nextDir;
      const [dx, dy] = DIRS[dir];
      const head = { x: snake[0].x + dx, y: snake[0].y + dy };
      if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS ||
          snake.some(s => s.x === head.x && s.y === head.y)) {
        return die();
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++; api.updateHud('score', score, true);
        api.sound.play('coin');
        const rect = canvas.getBoundingClientRect();
        api.fx.emojiBurst(rect.left + (food.x + 0.5) * SIZE, rect.top + (food.y + 0.5) * SIZE, '🍎', 6);
        placeFood();
        speed = Math.max(70, speed - 4);
      } else {
        snake.pop();
      }
    }

    function rr(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.fill();
    }

    function draw() {
      // checker board
      for (let y = 0; y < CELLS; y++) for (let x = 0; x < CELLS; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#e9fbe9' : '#dff5df';
        ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
      }
      // food
      ctx.font = (SIZE - 2) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🍎', (food.x + 0.5) * SIZE, (food.y + 0.55) * SIZE);
      // snake
      snake.forEach((s, i) => {
        const head = i === 0;
        ctx.fillStyle = head ? '#2f9e44' : (i % 2 ? '#51cf66' : '#40c057');
        rr(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2, 7);
        if (head) {
          ctx.fillStyle = '#fff';
          const [dx, dy] = DIRS[dir];
          const ex = (s.x + 0.5) * SIZE, ey = (s.y + 0.5) * SIZE;
          ctx.beginPath(); ctx.arc(ex - 4 + dx * 3, ey - 3 + dy * 3, 3, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(ex + 4 + dx * 3, ey - 3 + dy * 3, 3, 0, 7); ctx.fill();
          ctx.fillStyle = '#222';
          ctx.beginPath(); ctx.arc(ex - 4 + dx * 4, ey - 3 + dy * 4, 1.4, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.arc(ex + 4 + dx * 4, ey - 3 + dy * 4, 1.4, 0, 7); ctx.fill();
        }
      });
    }

    function die() {
      alive = false;
      cancelAnimationFrame(loop);
      api.sound.play('lose');
      api.fx.shake(stage);
      api.lose({
        coins: 12 + score * 4, xp: 15 + score * 4,
        title: 'Chomp! 🐍', msg: `You ate ${score} apples.`,
        emoji: '🍎', best: score,
        stats: [`🍎 ${score} eaten`]
      });
    }

    function onKey(e) {
      const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
                    w: 'up', s: 'down', a: 'left', d: 'right', W:'up',S:'down',A:'left',D:'right' };
      if (map[e.key]) { e.preventDefault(); turn(map[e.key]); }
    }
    window.addEventListener('keydown', onKey);

    let sx = 0, sy = 0;
    canvas.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    canvas.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
    }, { passive: true });

    api.onCleanup(() => { cancelAnimationFrame(loop); window.removeEventListener('keydown', onKey); alive = false; });

    reset();
  }
});
