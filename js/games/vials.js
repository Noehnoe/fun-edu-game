/* Color Vials — water-sort logic puzzle */
Game.register({
  id: 'vials',
  name: 'Color Vials',
  emoji: '🧪',
  tagline: 'Sort the liquids',
  category: 'logic',
  reward: { coins: 45, xp: 55 },
  lowerBest: true,
  mount(stage, api) {
    const CAP = 4;
    const COLORS = ['#ff6b6b', '#4dabf7', '#51cf66', '#ffd43b', '#cc5de8', '#20c997'];
    let tubes, selected, moves, history;

    function newPuzzle() {
      const k = 4;
      const pool = [];
      for (let c = 0; c < k; c++) for (let i = 0; i < CAP; i++) pool.push(c);
      const sh = api.shuffle(pool);
      tubes = [];
      for (let t = 0; t < k; t++) tubes.push(sh.slice(t * CAP, t * CAP + CAP));
      tubes.push([]); tubes.push([]);   // 2 empty tubes
      selected = null; moves = 0; history = [];
      render();
    }

    function topRun(tube) {
      if (!tube.length) return 0;
      let n = 1; const top = tube[tube.length - 1];
      for (let i = tube.length - 2; i >= 0 && tube[i] === top; i--) n++;
      return n;
    }
    function canPour(f, t) {
      if (f === t || !tubes[f].length || tubes[t].length >= CAP) return false;
      return tubes[t].length === 0 || tubes[t][tubes[t].length - 1] === tubes[f][tubes[f].length - 1];
    }
    function solved() {
      return tubes.every(t => t.length === 0 || (t.length === CAP && t.every(c => c === t[0])));
    }

    function pour(f, t) {
      const color = tubes[f][tubes[f].length - 1];
      let n = Math.min(topRun(tubes[f]), CAP - tubes[t].length);
      history.push(tubes.map(x => x.slice()));
      for (let i = 0; i < n; i++) { tubes[f].pop(); tubes[t].push(color); }
      moves++;
      api.updateHud('moves', moves, true);
      api.sound.play('pop');
      const r = container.children[t].getBoundingClientRect();
      api.fx.burst(r.left + r.width / 2, r.top + 20, { count: 8, colors: [COLORS[color]], power: 4 });
    }

    function onClick(i) {
      if (selected === null) {
        if (!tubes[i].length) return;
        selected = i; api.sound.play('select'); render(); return;
      }
      if (selected === i) { selected = null; render(); return; }
      if (canPour(selected, i)) {
        pour(selected, i);
        selected = null;
        render();
        if (solved()) finish();
      } else {
        api.sound.play('bad');
        selected = (tubes[i].length ? i : null);
        render();
      }
    }

    function finish() {
      const bonus = Math.max(0, 32 - moves) * 2;
      api.win({
        coins: 45 + bonus, xp: 55 + bonus,
        title: 'Sorted! 🌈', msg: `Solved in ${moves} moves.`,
        emoji: '🧪', best: moves,
        stats: [`🔁 ${moves} moves`]
      });
    }

    // ---- layout ----
    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Tap a tube to pick it up, then tap another to pour. Each tube should hold one color.';
    const container = document.createElement('div');
    container.className = 'vial-board';
    const controls = document.createElement('div');
    controls.className = 'row';
    const undoBtn = btn('↩ Undo', 'btn-ghost', () => {
      if (!history.length) return;
      tubes = history.pop(); moves = Math.max(0, moves - 1);
      selected = null; api.updateHud('moves', moves); render(); api.sound.play('flip');
    });
    const newBtn = btn('🎲 New', 'btn-ghost', () => { api.sound.play('whoosh'); newPuzzle(); });
    controls.append(undoBtn, newBtn);
    wrap.append(help, container, controls);
    stage.appendChild(wrap);

    api.setHud([{ id: 'moves', label: 'Moves', value: 0 }]);

    function render() {
      container.innerHTML = '';
      tubes.forEach((tube, i) => {
        const v = document.createElement('button');
        v.className = 'vial' + (selected === i ? ' sel' : '');
        for (let s = CAP - 1; s >= 0; s--) {
          const seg = document.createElement('div');
          seg.className = 'vial-seg';
          if (s < tube.length) seg.style.background = COLORS[tube[s]];
          else { seg.style.background = 'transparent'; }
          v.appendChild(seg);
        }
        v.addEventListener('click', () => onClick(i));
        container.appendChild(v);
      });
    }

    function btn(text, cls, fn) {
      const b = document.createElement('button');
      b.className = 'btn ' + cls; b.textContent = text;
      b.addEventListener('click', fn);
      return b;
    }

    newPuzzle();
  }
});
