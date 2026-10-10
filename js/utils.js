/* ============================================================
   UTILS — тосты, вибрация, вспомогательные функции
   ============================================================ */

/* ---------- HAPTIC ---------- */
function haptic(type = 'light') {
    try { tg?.HapticFeedback?.impactOccurred(type); } catch(e) {}
    if (typeof sfx === 'function') {
        if (type === 'heavy') sfx('success');
        else sfx('click');
    }
}

/* ---------- TOAST ---------- */
let toastTimer;
function toast(text, duration = 2000) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}

/* ---------- ESCAPE MD ---------- */
function esc_md(text) {
    return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}

/* ---------- FORMAT ---------- */
function fmt(n) {
    try {
        return Number(n).toLocaleString('ru-RU');
    } catch (e) {
        return String(n);
    }
}

function timeAgo(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T'));
        const diff = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} дн назад`;
        return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    } catch (e) {
        return '';
    }
}

/* ---------- MODAL ---------- */
function openShareModal(data) {
    if (typeof _openShareModalInternal === 'function') {
        _openShareModalInternal(data);
    }
}