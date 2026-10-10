/* ============================================================
   CORE — глобальные переменные, Telegram SDK
   ============================================================ */

const tg = window.Telegram?.WebApp;
const INIT_DATA = tg?.initData || '';
const BOT_USERNAME = 'games_all_bot';
const API_URL = 'https://2b447e0f97d440.lhr.life';  // ← вставь cloudflared URL, если есть

// Утилита: текущий user id
const getUserId = () => tg?.initDataUnsafe?.user?.id;

// Утилита: имя пользователя
const getUserName = () => {
    const u = tg?.initDataUnsafe?.user;
    if (!u) return 'Гость';
    return u.username ? `@${u.username}` :
           `${u.first_name || ''} ${u.last_name || ''}`.trim() || `id${u.id}`;
};