/* Emoji Riddle — two emojis hide a compound word */
Game.register({
  id: 'emojiriddle',
  name: 'Emoji Riddle',
  emoji: '🤔',
  tagline: 'Two emojis, one word',
  category: 'language',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const RIDDLES = [
      ['⭐', '🐟', 'Starfish'], ['❄️', '👨', 'Snowman'], ['🐮', '👦', 'Cowboy'],
      ['📖', '🐛', 'Bookworm'], ['☀️', '🌻', 'Sunflower'], ['🌧️', '🎀', 'Rainbow'],
      ['💥', '🌽', 'Popcorn'], ['🧈', '🪰', 'Butterfly'], ['🍯', '🐝', 'Honeybee'],
      ['🌙', '💡', 'Moonlight'], ['🍳', '🎂', 'Pancake'], ['🦶', '🏈', 'Football'],
      ['🔥', '🧯', 'Firefighter'], ['🧊', '🧢', 'Icecap'], ['🌊', '🏇', 'Seahorse']
    ];
    const ROUNDS = 8;
    const allAnswers = RIDDLES.map(r => r[2]);
    const queue = api.shuffle(RIDDLES).slice(0, ROUNDS);
    let idx = 0, correct = 0, locked = false;

    api.setHud([
      { id: 'q', label: 'Riddle', value: '1/' + ROUNDS },
      { id: 'score', label: 'Solved', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const riddle = document.createElement('div');
    riddle.className = 'riddle-emojis';
    const prompt = document.createElement('p');
    prompt.className = 'game-sub';
    prompt.textContent = 'Mash the two emojis into one word!';
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    wrap.append(riddle, prompt, grid);
    stage.appendChild(wrap);

    function render() {
      locked = false;
      const [a, b, answer] = queue[idx];
      api.updateHud('q', (idx + 1) + '/' + ROUNDS);
      riddle.textContent = `${a} + ${b}`;
      riddle.classList.remove('flash'); void riddle.offsetWidth; riddle.classList.add('flash');
      const opts = new Set([answer]);
      while (opts.size < 4) opts.add(api.choice(allAnswers));
      grid.innerHTML = '';
      api.shuffle([...opts]).forEach(o => {
        const btn = document.createElement('button');
        btn.className = 'choice travel-choice';
        btn.textContent = o;
        btn.addEventListener('click', () => pick(btn, o, answer));
        grid.appendChild(btn);
      });
    }

    function pick(btn, val, answer) {
      if (locked) return;
      locked = true;
      if (val === answer) {
        correct++;
        api.updateHud('score', correct, true);
        btn.classList.add('correct');
        api.sound.play('good');
        const r = riddle.getBoundingClientRect();
        api.fx.emojiBurst(r.left + r.width / 2, r.top + r.height / 2, '💡', 8);
      } else {
        btn.classList.add('wrong');
        api.sound.play('bad');
        [...grid.children].forEach(c => { if (c.textContent === answer) c.classList.add('correct'); });
      }
      api.timeout(() => { idx++; idx >= queue.length ? end() : render(); }, 850);
    }

    function end() {
      const perfect = correct === ROUNDS;
      api.win({
        coins: 15 + correct * 10, xp: 18 + correct * 10,
        title: perfect ? 'Riddle wizard! 🧙' : 'Clever! 🤔',
        msg: `You cracked ${correct}/${ROUNDS} riddles.`,
        emoji: '🤔', best: correct, perfect,
        stats: [`💡 ${correct}/${ROUNDS}`]
      });
    }

    render();
  }
});
