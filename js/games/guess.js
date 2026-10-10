/* ============================================================
   GUESS — Угадай число
   ============================================================ */

const GUESS_RANGES = {
    tiny:   { min: 1, max: 10,    label: '1-10' },
    small:  { min: 1, max: 100,   label: '1-100' },
    medium: { min: 1, max: 1000,  label: '1-1000' },
    huge:   { min: 1, max: 10000, label: '1-10000' },
};

let guessState = {
    range: 'small',
    secret: 0,
    attempts: 0,
    low: 0,
    high: 0,
    finished: false,
    history: [],
    started: 0,
};

function initGuess() {
    newGuessGame();
}

function newGuessGame() {
    const cfg = GUESS_RANGES[guessState.range];
    guessState.secret = Math.floor(Math.random() * (cfg.max - cfg.min + 1)) + cfg.min;
    guessState.attempts = 0;
    guessState.low = cfg.min;
    guessState.high = cfg.max;
    guessState.finished = false;
    guessState.history = [];
    guessState.started = Date.now();

    document.getElementById('guess-sub').textContent = `${cfg.label} · 🟡 Средний`;
    document.getElementById('guess-status').textContent = `Я загадал число ${cfg.label}`;
    document.getElementById('guess-hint').textContent = '';
    document.getElementById('guess-history').innerHTML = '';
    document.getElementById('guess-input').value = '';
    setTimeout(() => document.getElementById('guess-input')?.focus(), 100);
}

document.querySelectorAll('[data-guess-range]').forEach(chip => {
    chip.addEventListener('click', () => {
        guessState.range = chip.dataset.guessRange;
        document.querySelectorAll('[data-guess-range]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        newGuessGame();
        if (typeof haptic === 'function') haptic('light');
    });
});

document.getElementById('guess-send')?.addEventListener('click', sendGuess);
document.getElementById('guess-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendGuess();
});
document.getElementById('guess-new')?.addEventListener('click', () => {
    newGuessGame();
    if (typeof haptic === 'function') haptic('medium');
});

function sendGuess() {
    if (guessState.finished) return;
    const inp = document.getElementById('guess-input');
    const n = parseInt(inp.value);
    const cfg = GUESS_RANGES[guessState.range];
    if (!n || n < cfg.min || n > cfg.max) {
        toast('Введи число из диапазона');
        return;
    }
    inp.value = '';
    if (typeof haptic === 'function') haptic('light');
    guessState.attempts++;

    const s = guessState.secret;
    let hint, mark;

    if (n < s) {
        hint = '⬆️ Больше!';
        mark = '⬆️';
        guessState.low = Math.max(guessState.low, n + 1);
        if (typeof sfx === 'function') sfx('fail');
    } else if (n > s) {
        hint = '⬇️ Меньше!';
        mark = '⬇️';
        guessState.high = Math.min(guessState.high, n - 1);
        if (typeof sfx === 'function') sfx('fail');
    } else {
        hint = '🎯 Верно!';
        mark = '🎯';
        guessState.finished = true;
        if (typeof sfx === 'function') sfx('win');
    }

    guessState.history.push({ n, mark, hint });

    const statusEl = document.getElementById('guess-status');
    const hintEl = document.getElementById('guess-hint');
    const histEl = document.getElementById('guess-history');

    if (guessState.finished) {
        const dur = ((Date.now() - guessState.started) / 1000).toFixed(1);
        statusEl.innerHTML = `🎉 <b>Верно!</b> Это было число <b>${s}</b>`;
        hintEl.innerHTML = `Попыток: <b>${guessState.attempts}</b> · Время: <b>${dur}с</b>`;
        if (typeof haptic === 'function') haptic('heavy');
        saveGuessResult(true);
    } else {
        statusEl.textContent = `${hint} (попытка ${guessState.attempts})`;
        hintEl.innerHTML = `Возможный диапазон: <b>${guessState.low}–${guessState.high}</b>`;
    }

    histEl.innerHTML = guessState.history.slice(-10).reverse().map(h =>
        `<div class="attempt">
            <span class="num">${h.n}</span>
            <span class="hint">${h.hint}</span>
        </div>`
    ).join('');
}

async function saveGuessResult(win) {
    if (!API_URL) return;
    // В будущем — POST /api/game_result
}