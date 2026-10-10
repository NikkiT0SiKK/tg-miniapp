/* ============================================================
   2048
   ============================================================ */

let g2048 = {
    board: [],
    score: 0,
    best: 0,
    gameOver: false,
    won: false,
};

function init2048() {
    g2048.best = parseInt(localStorage.getItem('g2048_best') || '0');
    document.getElementById('g2048-best').textContent = g2048.best;
    reset2048();
}

function reset2048() {
    g2048.board = Array.from({ length: 4 }, () => Array(4).fill(0));
    g2048.score = 0;
    g2048.gameOver = false;
    g2048.won = false;
    document.getElementById('g2048-score').textContent = '0';
    document.getElementById('g2048-sub').textContent = 'Достигни плитки 2048';
    addRandom2048();
    addRandom2048();
    render2048();
}

function addRandom2048() {
    const empty = [];
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++)
            if (!g2048.board[r][c]) empty.push({ r, c });
    if (!empty.length) return;
    const cell = empty[Math.floor(Math.random() * empty.length)];
    g2048.board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
}

function render2048() {
    const el = document.getElementById('g2048-board');
    if (!el) return;
    el.innerHTML = '';
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const v = g2048.board[r][c];
            const tile = document.createElement('div');
            tile.className = 'g2048-tile' + (v ? ' pop' : '');
            if (v) {
                tile.textContent = v;
                tile.dataset.v = v;
            }
            el.appendChild(tile);
        }
    }
    document.getElementById('g2048-score').textContent = g2048.score;
}

function move2048(dir) {
    if (g2048.gameOver) return;

    const before = JSON.stringify(g2048.board);
    const b = g2048.board;

    const slide = (row) => {
        let arr = row.filter(x => x);
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                g2048.score += arr[i];
                if (arr[i] === 2048 && !g2048.won) {
                    g2048.won = true;
                    if (typeof sfx === 'function') sfx('win');
                    toast('🏆 2048! Победа!', 4000);
                }
                arr.splice(i + 1, 1);
            }
        }
        while (arr.length < 4) arr.push(0);
        return arr;
    };

    const rotate = (matrix) => {
        const n = matrix.length;
        const out = Array.from({ length: n }, () => Array(n).fill(0));
        for (let r = 0; r < n; r++)
            for (let c = 0; c < n; c++)
                out[c][n - 1 - r] = matrix[r][c];
        return out;
    };

    const rotations = { left: 0, up: 1, right: 2, down: 3 };
    const n = rotations[dir];

    for (let i = 0; i < n; i++) g2048.board = rotate(g2048.board);
    g2048.board = g2048.board.map(slide);
    for (let i = 0; i < (4 - n) % 4; i++) g2048.board = rotate(g2048.board);

    if (JSON.stringify(g2048.board) !== before) {
        if (typeof sfx === 'function') sfx('click');
        addRandom2048();
        render2048();

        if (check2048GameOver()) {
            g2048.gameOver = true;
            if (typeof sfx === 'function') sfx('lose');
            toast('💀 Ходов нет', 3000);
        }

        if (g2048.score > g2048.best) {
            g2048.best = g2048.score;
            localStorage.setItem('g2048_best', g2048.best);
            document.getElementById('g2048-best').textContent = g2048.best;
        }
    }
}

function check2048GameOver() {
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 4; c++) {
            if (!g2048.board[r][c]) return false;
            const v = g2048.board[r][c];
            if (c < 3 && g2048.board[r][c + 1] === v) return false;
            if (r < 3 && g2048.board[r + 1][c] === v) return false;
        }
    return true;
}

let t2048 = null;
const board2048 = document.getElementById('g2048-board');

board2048?.addEventListener('touchstart', e => {
    const t = e.touches[0];
    t2048 = { x: t.clientX, y: t.clientY };
}, { passive: true });

board2048?.addEventListener('touchmove', e => {
    if (!t2048) return;
    const t = e.touches[0];
    const dx = t.clientX - t2048.x;
    const dy = t.clientY - t2048.y;
    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        move2048(dx > 0 ? 'right' : 'left');
    } else {
        move2048(dy > 0 ? 'down' : 'up');
    }
    t2048 = null;
}, { passive: true });

document.addEventListener('keydown', e => {
    if (currentScreen !== 'g2048') return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) {
        e.preventDefault();
        move2048(map[e.key]);
    }
});

document.getElementById('g2048-restart')?.addEventListener('click', () => {
    reset2048();
    if (typeof haptic === 'function') haptic('medium');
});