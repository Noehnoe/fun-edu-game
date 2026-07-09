/* Simon — repeat the growing color/sound sequence */
Game.register({
  id: 'simon',
  name: 'Echo Pads',
  emoji: '🎵',
  tagline: 'Repeat the sequence',
  category: 'memory',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const PADS = [
      { color: '#51cf66', freq: 392 },
      { color: '#ff6b6b', freq: 523 },
      { color: '#4dabf7', freq: 330 },
      { color: '#ffd43b', freq: 659 }
    ];
    let seq = [], step = 0, round = 0, playing = false;

    api.setHud([{ id: 'round', label: 'Round', value: 0 }]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const status = document.createElement('div');
    status.className = 'game-msg';
    status.textContent = 'Watch carefully…';
    const board = document.createElement('div');
    board.className = 'simon-board';
    const pads = PADS.map((p, i) => {
      const pad = document.createElement('button');
      pad.className = 'simon-pad';
      pad.style.background = p.color;
      pad.disabled = true;
      pad.addEventListener('click', () => press(i));
      board.appendChild(pad);
      return pad;
    });
    wrap.append(status, board);
    stage.appendChild(wrap);

    function light(i, dur = 360) {
      pads[i].classList.add('lit');
      api.sound.tone(PADS[i].freq, dur / 1000, 'sine', 0.2);
      setTimeout(() => pads[i].classList.remove('lit'), dur);
    }

    function nextRound() {
      round++;
      api.updateHud('round', round, true);
      seq.push(api.randInt(0, 3));
      step = 0;
      playSequence();
    }

    function playSequence() {
      playing = true;
      status.textContent = 'Watch carefully…';
      pads.forEach(p => p.disabled = true);
      let i = 0;
      const speed = Math.max(280, 620 - round * 25);
      const t = setInterval(() => {
        light(seq[i], speed * 0.6);
        i++;
        if (i >= seq.length) {
          clearInterval(t);
          api.timeout(() => {
            playing = false;
            status.textContent = 'Your turn! 🎯';
            pads.forEach(p => p.disabled = false);
          }, speed);
        }
      }, speed);
      api.onCleanup(() => clearInterval(t));
    }

    function press(i) {
      if (playing) return;
      light(i, 220);
      if (i === seq[step]) {
        step++;
        if (step >= seq.length) {
          pads.forEach(p => p.disabled = true);
          api.sound.play('good');
          if (round >= 8) api.flag('mastermind');
          api.timeout(nextRound, 650);
        }
      } else {
        fail();
      }
    }

    function fail() {
      playing = true;
      pads.forEach(p => p.disabled = true);
      api.sound.play('lose');
      status.textContent = 'Oops!';
      const reached = round - 1;
      api.lose({
        coins: 12 + reached * 8, xp: 15 + reached * 8,
        title: `Round ${reached} 🎵`, msg: `You echoed ${reached} sequences!`,
        emoji: '🎵', best: reached,
        stats: [`🔢 reached round ${reached}`]
      });
    }

    api.timeout(nextRound, 700);
  }
});
