/* ============================================================
   SNAKE — Змейка
   ============================================================ */

let snake = {
    canvas: null,
    ctx: null,
    size: 15,
    cell: 0,
    snake: [],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: null,
    score: 0,
    best: 0,
    running: false,
    timer: null,
    speed: 150,
    gameOver: false,
};

function initSnake() {
    snake.canvas = document.getElementById('snake-canvas');
    if (!snake.canvas) return;
    snake.ctx = snake.canvas.getContext('2d');
    const rect = snake.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    snake.canvas.width = rect.width * dpr;
    snake.canvas.height = rect.height * dpr;
    snake.ctx.scale(dpr, dpr);
    snake.cell = rect.width / snake.size;

    snake.best = parseInt(localStorage.getItem('snake_best') || '0');
    document.getElementById('snake-best').textContent = snake.best;

    resetSnake();
    drawSnake();
}

function resetSnake() {
    snake.snake = [{ x: 7, y: 7 }, { x: 6, y: 7 }, { x: 5, y: 7 }];
    snake.dir = { x: 1, y: 0 };
    snake.nextDir = { x: 1, y: 0 };
    snake.score = 0;
    snake.gameOver = false;
    snake.running = false;
    spawnSnakeFood();
    document.getElementById('snake-score').textContent = '0';
    document.getElementById('snake-sub').textContent = 'Нажми стрелку или свайп';
    if (snake.timer) clearInterval(snake.timer);
}

function spawnSnakeFood() {
    const occupied = new Set(snake.snake.map(s => `${s.x},${s.y}`));
    const free = [];
    for (let x = 0; x < snake.size; x++) {
        for (let y = 0; y < snake.size; y++) {
            if (!occupied.has(`${x},${y}`)) free.push({ x, y });
        }
    }
    if (free.length === 0) { endSnake(true); return; }
    snake.food = free[Math.floor(Math.random() * free.length)];
}

function drawSnake() {
    const ctx = snake.ctx;
    const cell = snake.cell;
    const size = snake.size;

    ctx.clearRect(0, 0, snake.canvas.width, snake.canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
        ctx.beginPath();
        ctx.moveTo(i * cell, 0);
        ctx.lineTo(i * cell, size * cell);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * cell);
        ctx.lineTo(size * cell, i * cell);
        ctx.stroke();
    }

    if (snake.food) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(
            snake.food.x * cell + cell / 2,
            snake.food.y * cell + cell / 2,
            cell * 0.4, 0, Math.PI * 2
        );
        ctx.fill();
    }

    snake.snake.forEach((s, i) => {
        const isHead = i === 0;
        ctx.fillStyle = isHead ? '#22c55e' : `hsl(140, 70%, ${45 + i * 2}%)`;
        const padding = isHead ? 1 : 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(s.x * cell + padding, s.y * cell + padding,
                          cell - padding * 2, cell - padding * 2, cell * 0.25);
        } else {
            ctx.rect(s.x * cell + padding, s.y * cell + padding,
                     cell - padding * 2, cell - padding * 2);
        }
        ctx.fill();
    });

    if (snake.gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, snake.canvas.width, snake.canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 28px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💀 Игра окончена', snake.canvas.width / 2, snake.canvas.height / 2);
    }
}

function tickSnake() {
    snake.dir = snake.nextDir;

    const head = snake.snake[0];
    const newHead = { x: head.x + snake.dir.x, y: head.y + snake.dir.y };

    if (newHead.x < 0 || newHead.x >= snake.size ||
        newHead.y < 0 || newHead.y >= snake.size) {
        endSnake(false); return;
    }
    if (snake.snake.slice(1).some(s => s.x === newHead.x && s.y === newHead.y)) {
        endSnake(false); return;
    }

    snake.snake.unshift(newHead);

    if (snake.food && newHead.x === snake.food.x && newHead.y === snake.food.y) {
        snake.score += 10;
        if (typeof sfx === 'function') sfx('chip');
        document.getElementById('snake-score').textContent = snake.score;
        spawnSnakeFood();
        if (snake.speed > 70) {
            snake.speed -= 3;
            clearInterval(snake.timer);
            snake.timer = setInterval(tickSnake, snake.speed);
        }
    } else {
        snake.snake.pop();
    }

    drawSnake();
}

function endSnake(win) {
    snake.running = false;
    snake.gameOver = true;
    if (snake.timer) clearInterval(snake.timer);
    if (win) {
        if (typeof sfx === 'function') sfx('win');
        toast('🏆 Победа!', 3000);
    } else {
        if (typeof sfx === 'function') sfx('lose');
        toast('💀 Игра окончена', 3000);
    }
    if (snake.score > snake.best) {
        snake.best = snake.score;
        localStorage.setItem('snake_best', snake.best);
        document.getElementById('snake-best').textContent = snake.best;
        toast('🏆 Новый рекорд!', 3500);
    }
    drawSnake();
}

function setSnakeDir(dir) {
    const map = {
        up:    { x: 0, y: -1 },
        down:  { x: 0, y: 1 },
        left:  { x: -1, y: 0 },
        right: { x: 1, y: 0 },
    };
    const d = map[dir];
    if (!d) return;
    if (snake.dir.x === -d.x && snake.dir.y === -d.y) return;
    snake.nextDir = d;

    if (!snake.running && !snake.gameOver) {
        snake.running = true;
        document.getElementById('snake-sub').textContent = 'Играем! 🐍';
        snake.timer = setInterval(tickSnake, snake.speed);
    }
}

document.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
        setSnakeDir(btn.dataset.dir);
        if (typeof haptic === 'function') haptic('light');
    });
});

let snakeTouchStart = null;
document.getElementById('snake-canvas')?.addEventListener('touchstart', e => {
    const t = e.touches[0];
    snakeTouchStart = { x: t.clientX, y: t.clientY };
});

document.getElementById('snake-canvas')?.addEventListener('touchmove', e => {
    if (!snakeTouchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - snakeTouchStart.x;
    const dy = t.clientY - snakeTouchStart.y;
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) {
        setSnakeDir(dx > 0 ? 'right' : 'left');
    } else {
        setSnakeDir(dy > 0 ? 'down' : 'up');
    }
    snakeTouchStart = null;
});

document.addEventListener('keydown', e => {
    if (currentScreen !== 'snake') return;
    const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
    if (map[e.key]) {
        e.preventDefault();
        setSnakeDir(map[e.key]);
    }
});

document.getElementById('snake-restart')?.addEventListener('click', () => {
    resetSnake();
    drawSnake();
    if (typeof haptic === 'function') haptic('medium');
});