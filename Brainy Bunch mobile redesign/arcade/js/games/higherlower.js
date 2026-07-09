/* Higher or Lower — guess where the next card lands, build a streak */
Game.register({
  id: 'higherlower',
  name: 'Higher or Lower',
  emoji: '🎴',
  tagline: 'Trust your gut, ride the streak',
  category: 'math',
  reward: { coins: 40, xp: 50 },
  mount(stage, api) {
    let current = api.randInt(1, 100);
    let streak = 0, bestStreak = 0, lives = 3, locked = false;

    api.setHud([
      { id: 'streak', label: 'Streak', value: 0 },
      { id: 'best', label: 'Best', value: 0 },
      { id: 'lives', label: 'Lives', value: '❤️❤️❤️' }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const help = document.createElement('p');
    help.className = 'game-sub';
    help.textContent = 'Will the next card (1–100) be higher or lower? Ties count as a win!';
    const card = document.createElement('div');
    card.className = 'hl-card';
    card.textContent = current;
    const row = document.createElement('div');
    row.className = 'row';
    const hi = document.createElement('button');
    hi.className = 'btn btn-good';
    hi.textContent = '⬆ Higher';
    const lo = document.createElement('button');
    lo.className = 'btn btn-primary';
    lo.textContent = '⬇ Lower';
    row.append(hi, lo);
    wrap.append(help, card, row);
    stage.appendChild(wrap);

    hi.addEventListener('click', () => guess(true));
    lo.addEventListener('click', () => guess(false));

    function guess(saidHigher) {
      if (locked) return;
      locked = true;
      let next;
      do { next = api.randInt(1, 100); } while (next === current && Math.random() < 0.5);
      const win = next === current || (saidHigher ? next > current : next < current);
      card.textContent = next;
      card.classList.remove('flip'); void card.offsetWidth; card.classList.add('flip');
      const r = card.getBoundingClientRect();
      if (win) {
        streak++;
        bestStreak = Math.max(bestStreak, streak);
        api.updateHud('streak', streak, true);
        api.updateHud('best', bestStreak);
        api.sound.play('good');
        api.fx.burst(r.left + r.width / 2, r.top + 20, { count: 8 + streak, shape: 'star', colors: ['#ffd43b', '#51cf66'], power: 5 });
        if (streak > 0 && streak % 5 === 0) { api.sound.play('sparkle'); api.fx.starShower({ count: 24 }); }
      } else {
        streak = 0;
        lives--;
        api.updateHud('streak', 0);
        api.updateHud('lives', '❤️'.repeat(lives) + '🖤'.repeat(3 - lives), true);
        api.sound.play('bad');
        api.fx.shake(stage);
        if (lives <= 0) { current = next; return end(); }
      }
      current = next;
      api.timeout(() => { locked = false; }, 250);
    }

    function end() {
      const won = bestStreak >= 8;
      const finish = won ? api.win : api.lose;
      finish({
        coins: 12 + bestStreak * 7, xp: 15 + bestStreak * 7,
        title: won ? `Streak master! 🎴` : `Streak ${bestStreak}!`,
        msg: won ? `An amazing best streak of ${bestStreak}!` : `Best streak: ${bestStreak}. Reach 8 for a big win!`,
        emoji: '🎴', best: bestStreak,
        stats: [`🔥 best streak ${bestStreak}`]
      });
    }
  }
});
