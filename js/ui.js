/* ============================================================
   ROUTER — экраны, переходы, навигация
   ============================================================ */

let currentScreen = 'home';
const screens = {};

// Заполняем после DOMContentLoaded (defer гарантирует готовность DOM)
document.querySelectorAll('.screen').forEach(s => {
    const id = s.id.replace('s-', '');
    screens[id] = s;
});

function go(name) {
    if (!screens[name]) {
        console.warn('[go] unknown screen:', name);
        return;
    }
    Object.entries(screens).forEach(([k, el]) => {
        el.classList.toggle('active', k === name);
    });
    document.querySelectorAll('.nav-item').forEach(n => {
        n.classList.toggle('active', n.dataset.nav === name);
    });
    currentScreen = name;
    if (typeof haptic === 'function') haptic('light');

    // Ленивая загрузка данных экрана
    if (name === 'profile' && typeof loadProfile === 'function') loadProfile();
    if (name === 'stats' && typeof loadStats === 'function') loadStats();
    if (name === 'history' && typeof loadHistory === 'function') loadHistory();
    if (name === 'top' && typeof loadTops === 'function') loadTops();
    if (name === 'ach' && typeof loadAchievements === 'function') loadAchievements();
}

/* ---------- BOTTOM NAV ---------- */
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const target = item.dataset.nav;
        if (target === 'bot') {
            tg?.openTelegramLink?.(`https://t.me/${BOT_USERNAME}`);
            return;
        }
        go(target);
    });
});

/* ---------- BACK BUTTONS ---------- */
document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', () => go('home'));
});

/* ---------- GAME CARDS ---------- */
document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
        const g = card.dataset.go;
        if (typeof haptic === 'function') haptic('medium');

        if (g === 'guess' && typeof initGuess === 'function') {
            initGuess(); go('guess');
        } else if (g === 'ttt' && typeof initTTT === 'function') {
            initTTT(); go('ttt');
        } else if (g === 'hangman' && typeof initHangman === 'function') {
            initHangman(); go('hangman');
        } else if (g === 'snake' && typeof initSnake === 'function') {
            go('snake'); initSnake();
        } else if (g === 'g2048' && typeof init2048 === 'function') {
            go('g2048'); init2048();
        } else if (g === 'poker' && typeof openPoker === 'function') {
            openPoker();
        } else if (g === 'durak' && typeof openDurak === 'function') {
            openDurak();
        } else if (g === 'mp-ttt' && typeof openMpTTT === 'function') {
            openMpTTT();
        }
    });
});

/* ---------- HARDWARE BACK (Telegram) ---------- */
tg?.onEvent?.('backButtonClicked', () => go('home'));

/* ---------- ERROR HANDLERS ---------- */
window.addEventListener('error', (e) => {
    console.error('[GLOBAL ERROR]', e.error || e.message, e.filename, e.lineno);
    if (typeof toast === 'function') {
        toast('⚠️ Ошибка: ' + (e.message || 'что-то пошло не так').slice(0, 60));
    }
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('[UNHANDLED PROMISE]', e.reason);
    if (typeof toast === 'function') {
        toast('⚠️ Ошибка сети: ' + String(e.reason).slice(0, 60));
    }
});

/* ---------- FETCH WRAPPER ---------- */
const _originalFetch = window.fetch;
window.fetch = async function(...args) {
    try {
        return await _originalFetch.apply(this, args);
    } catch (e) {
        console.error('[FETCH ERROR]', args[0], e);
        throw e;
    }
};