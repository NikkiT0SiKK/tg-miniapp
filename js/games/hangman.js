/* ============================================================
   HANGMAN — Виселица
   ============================================================ */

const HM_WORDS = {
    animals: {
        label: '🐾 Животные',
        easy: ['кот', 'пёс', 'лев', 'тигр', 'слон'],
        medium: ['пингвин', 'медведь', 'жираф', 'дельфин'],
        hard: ['гиппопотам', 'орангутан'],
    },
    cities: {
        label: '🏙 Города',
        easy: ['москва', 'париж', 'рим'],
        medium: ['токио', 'лондон', 'берлин', 'пекин'],
        hard: ['екатеринбург', 'новосибирск'],
    },
    it: {
        label: '💻 IT',
        easy: ['байт', 'файл', 'код', 'сервер'],
        medium: ['ноутбук', 'алгоритм', 'программа'],
        hard: ['программист', 'компилятор'],
    },
    space: {
        label: '🚀 Космос',
        easy: ['луна', 'марс', 'звезда'],
        medium: ['планета', 'галактика', 'телескоп'],
        hard: ['вселенная', 'гравитация'],
    },
    food: {
        label: '🍕 Еда',
        easy: ['суп', 'хлеб', 'сыр', 'борщ'],
        medium: ['пицца', 'пельмени', 'шоколад'],
        hard: ['шарлотка', 'круассан'],
    },
    sport: {
        label: '⚽ Спорт',
        easy: ['бег', 'мяч', 'гол', 'бокс'],
        medium: ['футбол', 'хоккей', 'теннис'],
        hard: ['баскетбол', 'фехтование'],
    },
};

const HM_ALPHABET = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const HM_MAX_MISTAKES = 6;

const HM_STAGES = [
`  +---+
  |   |
      |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
      |
      |
      |
=========`,
`  +---+
  |   |
  O   |
  |   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|   |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
      |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 /    |
      |
=========`,
`  +---+
  |   |
  O   |
 /|\\  |
 / \\  |
      |
=========`,
];

let hmState = {
    category: 'random',
    word: '',
    guessed: new Set(),
    mistakes: 0,
    finished: false,
    won: false,
};

function initHangman() {
    newHangman();
}

function newHangman() {
    let cat = hmState.category;
    if (cat === 'random') {
        const keys = Object.keys(HM_WORDS);
        cat = keys[Math.floor(Math.random() * keys.length)];
    }
    const pool = HM_WORDS[cat].medium;
    hmState.word = pool[Math.floor(Math.random() * pool.length)].toLowerCase();
    hmState.guessed = new Set();
    hmState.mistakes = 0;
    hmState.finished = false;
    hmState.won = false;

    document.getElementById('hangman-sub').textContent = `Категория: ${HM_WORDS[cat].label}`;
    renderHangman();
}

function renderHangman() {
    const fig = document.getElementById('hangman-figure');
    fig.textContent = HM_STAGES[Math.min(hmState.mistakes, HM_STAGES.length - 1)];

    const wordEl = document.getElementById('hangman-word');
    wordEl.innerHTML = hmState.word.split('').map(ch =>
        hmState.guessed.has(ch) ? ch.toUpperCase() : '_'
    ).join(' ');

    const lives = HM_MAX_MISTAKES - hmState.mistakes;
    const hearts = '❤️'.repeat(lives) + '🖤'.repeat(HM_MAX_MISTAKES - lives);
    document.getElementById('hangman-lives').textContent = hearts;

    const letters = document.getElementById('hangman-letters');
    letters.innerHTML = '';
    for (const ch of HM_ALPHABET) {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = ch;
        if (hmState.guessed.has(ch)) {
            btn.disabled = true;
            if (hmState.word.includes(ch)) btn.classList.add('correct');
            else btn.classList.add('wrong');
        }
        btn.addEventListener('click', () => hmGuess(ch, btn));
        letters.appendChild(btn);
    }

    if (hmState.finished) {
        if (hmState.won) toast('🎉 Победа!', 3000);
        else toast(`💀 Проигрыш. Слово: ${hmState.word.toUpperCase()}`, 4000);
    }
}

function hmGuess(ch, btn) {
    if (hmState.finished || hmState.guessed.has(ch)) return;
    if (typeof haptic === 'function') haptic('light');
    hmState.guessed.add(ch);
    if (!hmState.word.includes(ch)) {
        hmState.mistakes++;
        if (typeof sfx === 'function') sfx('fail');
    } else {
        if (typeof sfx === 'function') sfx('click');
    }

    const won = hmState.word.split('').every(c => hmState.guessed.has(c));
    if (won) {
        hmState.finished = true;
        hmState.won = true;
        if (typeof sfx === 'function') sfx('win');
        if (typeof haptic === 'function') haptic('heavy');
    } else if (hmState.mistakes >= HM_MAX_MISTAKES) {
        hmState.finished = true;
        hmState.won = false;
        if (typeof sfx === 'function') sfx('lose');
        if (typeof haptic === 'function') haptic('heavy');
    }
    renderHangman();
}

document.querySelectorAll('[data-hm-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
        hmState.category = chip.dataset.hmCat;
        document.querySelectorAll('[data-hm-cat]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        newHangman();
        if (typeof haptic === 'function') haptic('light');
    });
});

document.getElementById('hangman-new')?.addEventListener('click', () => {
    newHangman();
    if (typeof haptic === 'function') haptic('medium');
});