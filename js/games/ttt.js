/* ============================================================
   TIC-TAC-TOE — Крестики-нолики
   ============================================================ */

let tttState = {
    size: 3,
    difficulty: 'hard',
    board: [],
    finished: false,
    winner: null,
    winLine: [],
    toMove: 'X',
};

function initTTT() {
    newTTT();
}

function newTTT() {
    tttState.board = new Array(tttState.size * tttState.size).fill('');
    tttState.finished = false;
    tttState.winner = null;
    tttState.winLine = [];
    tttState.toMove = 'X';
    renderTTT();
    document.getElementById('ttt-status').textContent = 'Твой ход';
}

function renderTTT() {
    const board = document.getElementById('ttt-board');
    const n = tttState.size;
    board.style.gridTemplateColumns = `repeat(${n}, 1fr)`;

    const ICON = { X: '❌', O: '⭕', '': '' };
    board.innerHTML = '';

    for (let i = 0; i < tttState.board.length; i++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        const v = tttState.board[i];
        if (v) {
            cell.classList.add('played');
            cell.textContent = ICON[v];
        }
        if (tttState.winLine.includes(i)) {
            cell.classList.add(tttState.winner === 'X' ? 'win-line' : 'lose-line');
        }
        cell.addEventListener('click', () => tttMove(i));
        board.appendChild(cell);
    }
}

function tttMove(idx) {
    if (tttState.finished || tttState.board[idx] || tttState.toMove !== 'X') return;
    if (typeof haptic === 'function') haptic('light');
    tttState.board[idx] = 'X';
    if (typeof sfx === 'function') sfx('click');

    const win = tttCheck('X');
    if (win) {
        tttState.finished = true;
        tttState.winner = 'X';
        tttState.winLine = win;
        document.getElementById('ttt-status').innerHTML = '🎉 <b>Ты победил!</b>';
        renderTTT();
        if (typeof sfx === 'function') sfx('win');
        if (typeof haptic === 'function') haptic('heavy');
        return;
    }
    if (!tttState.board.includes('')) {
        tttState.finished = true;
        tttState.winner = 'draw';
        document.getElementById('ttt-status').textContent = '🤝 Ничья';
        renderTTT();
        return;
    }

    tttState.toMove = 'O';
    renderTTT();
    document.getElementById('ttt-status').textContent = '🤔 Бот думает...';

    setTimeout(() => {
        const move = tttBestMove();
        if (move === null) return;
        tttState.board[move] = 'O';

        const winB = tttCheck('O');
        if (winB) {
            tttState.finished = true;
            tttState.winner = 'O';
            tttState.winLine = winB;
            document.getElementById('ttt-status').innerHTML = '😢 <b>Бот победил</b>';
            if (typeof sfx === 'function') sfx('lose');
            if (typeof haptic === 'function') haptic('heavy');
        } else if (!tttState.board.includes('')) {
            tttState.finished = true;
            tttState.winner = 'draw';
            document.getElementById('ttt-status').textContent = '🤝 Ничья';
        } else {
            tttState.toMove = 'X';
            document.getElementById('ttt-status').textContent = '🎯 Твой ход';
        }
        renderTTT();
    }, 250);
}

function tttCheck(symbol) {
    const n = tttState.size;
    const w = n === 3 ? 3 : 4;
    const b = tttState.board;

    for (let r = 0; r < n; r++) {
        for (let c = 0; c <= n - w; c++) {
            let ok = true;
            for (let k = 0; k < w; k++) if (b[r * n + c + k] !== symbol) ok = false;
            if (ok) return Array.from({ length: w }, (_, k) => r * n + c + k);
        }
    }
    for (let c = 0; c < n; c++) {
        for (let r = 0; r <= n - w; r++) {
            let ok = true;
            for (let k = 0; k < w; k++) if (b[(r + k) * n + c] !== symbol) ok = false;
            if (ok) return Array.from({ length: w }, (_, k) => (r + k) * n + c);
        }
    }
    for (let r = 0; r <= n - w; r++) {
        for (let c = 0; c <= n - w; c++) {
            let ok = true;
            for (let k = 0; k < w; k++) if (b[(r + k) * n + c + k] !== symbol) ok = false;
            if (ok) return Array.from({ length: w }, (_, k) => (r + k) * n + c + k);
        }
    }
    for (let r = 0; r <= n - w; r++) {
        for (let c = w - 1; c < n; c++) {
            let ok = true;
            for (let k = 0; k < w; k++) if (b[(r + k) * n + c - k] !== symbol) ok = false;
            if (ok) return Array.from({ length: w }, (_, k) => (r + k) * n + c - k);
        }
    }
    return null;
}

function tttBestMove() {
    const b = tttState.board;
    const empty = [];
    for (let i = 0; i < b.length; i++) if (!b[i]) empty.push(i);
    if (!empty.length) return null;

    const diff = tttState.difficulty;

    if (diff === 'easy' && Math.random() < 0.7) {
        return empty[Math.floor(Math.random() * empty.length)];
    }
    if (diff === 'medium' && Math.random() < 0.3) {
        return empty[Math.floor(Math.random() * empty.length)];
    }

    // Победить
    for (const i of empty) {
        b[i] = 'O';
        if (tttCheck('O')) { b[i] = ''; return i; }
        b[i] = '';
    }
    // Заблокировать
    for (const i of empty) {
        b[i] = 'X';
        if (tttCheck('X')) { b[i] = ''; return i; }
        b[i] = '';
    }
    if (tttState.size === 3) {
        if (!b[4]) return 4;
        const corners = [0, 2, 6, 8].filter(i => !b[i]);
        if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
        return empty[Math.floor(Math.random() * empty.length)];
    }
    const center = Math.floor(b.length / 2);
    if (!b[center]) return center;
    return empty[Math.floor(Math.random() * empty.length)];
}

document.querySelectorAll('[data-ttt-size]').forEach(chip => {
    chip.addEventListener('click', () => {
        tttState.size = parseInt(chip.dataset.tttSize);
        document.querySelectorAll('[data-ttt-size]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        newTTT();
        if (typeof haptic === 'function') haptic('light');
    });
});

document.querySelectorAll('[data-ttt-diff]').forEach(chip => {
    chip.addEventListener('click', () => {
        tttState.difficulty = chip.dataset.tttDiff;
        document.querySelectorAll('[data-ttt-diff]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (typeof haptic === 'function') haptic('light');
    });
});

document.getElementById('ttt-new')?.addEventListener('click', () => {
    newTTT();
    if (typeof haptic === 'function') haptic('medium');
});