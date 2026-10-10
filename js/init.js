/* ============================================================
   INIT — инициализация приложения
   ============================================================ */

function initTelegram() {
    if (!tg) return;
    tg.ready();
    tg.expand();
    tg.setHeaderColor?.('secondary_bg_color');
    tg.setBackgroundColor?.('bg_color');
    tg.enableClosingConfirmation?.();

    const user = tg.initDataUnsafe?.user;
    if (user) {
        const name = user.first_name || 'друг';
        document.getElementById('hero-greet').textContent = `Привет, ${name}!`;
        document.getElementById('prof-name').textContent =
            `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Игрок';
        document.getElementById('prof-username').textContent =
            user.username ? `@${user.username}` : `id${user.id}`;
        const av = document.getElementById('prof-avatar');
        if (av && user.photo_url) {
            av.innerHTML = `<img src="${user.photo_url}" alt="">`;
        } else if (av) {
            av.textContent = (user.first_name?.[0] || '?').toUpperCase();
        }
    }
}

async function loadBalance() {
    const el = document.getElementById('balance');
    if (!el) return;
    if (!API_URL) { el.textContent = '1 000'; return; }
    try {
        const data = await api('/api/me');
        animateNumber(el, data.balance);
    } catch (e) {
        el.textContent = '—';
    }
}

function animateNumber(el, target) {
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 20));
    const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        el.textContent = cur.toLocaleString('ru-RU');
        if (cur >= target) clearInterval(t);
    }, 30);
}

function updateBalanceDisplay(v) {
    const el = document.getElementById('balance');
    if (el) el.textContent = Number(v).toLocaleString('ru-RU');
}

/* ---------- BOOT ---------- */
window.addEventListener('load', () => {
    initTelegram();
    loadBalance();
    initWS();

    // Разбудить аудио при первом тапе
    const unlockAudio = () => {
        if (typeof initAudio === 'function') initAudio();
        document.removeEventListener('touchstart', unlockAudio);
        document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('touchstart', unlockAudio, { passive: true });
    document.addEventListener('click', unlockAudio);

    // Инициализация панелей реакций (все игры)
    if (typeof initReactions === 'function') {
        initReactions('');
        initReactions('-durak');
        initReactions('-ttt');
    }

    setTimeout(() => {
        const el = document.getElementById('balance');
        if (el && el.textContent === '—') el.textContent = '1 000';
    }, 500);
});