/* Language Quiz — match the foreign word to its meaning */
Game.register({
  id: 'translate',
  name: 'Word Traveler',
  emoji: '🌍',
  tagline: 'Learn words from around the world',
  category: 'language',
  reward: { coins: 45, xp: 55 },
  mount(stage, api) {
    const LANGS = {
      '🇪🇸 Spanish': [
        ['perro','dog'],['gato','cat'],['casa','house'],['agua','water'],['sol','sun'],
        ['luna','moon'],['libro','book'],['rojo','red'],['verde','green'],['feliz','happy'],
        ['amigo','friend'],['leche','milk'],['manzana','apple'],['gracias','thank you']
      ],
      '🇫🇷 French': [
        ['chien','dog'],['chat','cat'],['maison','house'],['eau','water'],['soleil','sun'],
        ['lune','moon'],['livre','book'],['rouge','red'],['vert','green'],['heureux','happy'],
        ['ami','friend'],['lait','milk'],['pomme','apple'],['merci','thank you']
      ],
      '🇩🇪 German': [
        ['hund','dog'],['katze','cat'],['haus','house'],['wasser','water'],['sonne','sun'],
        ['mond','moon'],['buch','book'],['rot','red'],['grün','green'],['glücklich','happy'],
        ['freund','friend'],['milch','milk'],['apfel','apple'],['danke','thank you']
      ]
    };
    const langName = api.choice(Object.keys(LANGS));
    const data = LANGS[langName];
    const allEnglish = [...new Set(data.map(d => d[1]))];
    const ROUNDS = 8;
    const queue = api.shuffle(data).slice(0, ROUNDS);
    let idx = 0, correct = 0, locked = false;

    api.setHud([
      { id: 'q', label: langName, value: '1/' + ROUNDS },
      { id: 'score', label: 'Correct', value: 0 }
    ]);

    stage.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'center-col';
    const word = document.createElement('div');
    word.className = 'travel-word';
    const prompt = document.createElement('p');
    prompt.className = 'game-sub';
    prompt.textContent = 'What does this word mean?';
    const grid = document.createElement('div');
    grid.className = 'choice-grid';
    wrap.append(word, prompt, grid);
    stage.appendChild(wrap);

    function render() {
      locked = false;
      const [foreign, eng] = queue[idx];
      api.updateHud('q', (idx + 1) + '/' + ROUNDS);
      word.textContent = foreign;
      word.classList.remove('flash'); void word.offsetWidth; word.classList.add('flash');
      const opts = new Set([eng]);
      while (opts.size < 4) opts.add(api.choice(allEnglish));
      grid.innerHTML = '';
      api.shuffle([...opts]).forEach(o => {
        const b = document.createElement('button');
        b.className = 'choice travel-choice';
        b.textContent = o;
        b.addEventListener('click', () => pick(b, o, eng));
        grid.appendChild(b);
      });
    }

    function pick(btn, val, eng) {
      if (locked) return;
      locked = true;
      if (val === eng) {
        correct++; api.updateHud('score', correct, true);
        btn.classList.add('correct'); api.sound.play('good');
        api.celebrate(btn);
      } else {
        btn.classList.add('wrong'); api.sound.play('bad');
        [...grid.children].forEach(c => { if (c.textContent === eng) c.classList.add('correct'); });
        api.toast(`"${queue[idx][0]}" means "${eng}"`);
      }
      setTimeout(() => { idx++; idx >= queue.length ? end() : render(); }, 850);
    }

    function end() {
      const perfect = correct === ROUNDS;
      api.win({
        coins: 18 + correct * 9, xp: 22 + correct * 9,
        title: perfect ? 'Fluent! 🌟' : 'Bien hecho! 🌍',
        msg: `You knew ${correct}/${ROUNDS} ${langName.split(' ')[1]} words.`,
        emoji: '🌍', best: correct, perfect,
        stats: [`✅ ${correct}/${ROUNDS}`]
      });
    }

    render();
  }
});
