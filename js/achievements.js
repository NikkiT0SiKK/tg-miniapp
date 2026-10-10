/* ============================================================
   ACHIEVEMENTS — Достижения
   ============================================================ */

async function loadAchievements() {
    const grid = document.getElementById('ach-grid');
    if (!grid) return;

    if (!API_URL) {
        grid.innerHTML = '<div class="center muted" style="grid-column:1/-1;padding:40px">API не настроен</div>';
        return;
    }

    try {
        const data = await api('/api/achievements');
        document.getElementById('ach-count').textContent = `${data.unlocked}/${data.total}`;
        document.getElementById('ach-points').textContent = data.points;
        document.getElementById('ach-rank').textContent = data.rank.split(' ')[0] || '—';

        grid.innerHTML = data.items.map((a, i) => `
            <div class="ach-card ${a.unlocked ? 'unlocked' : 'locked'}"
                 style="animation-delay:${Math.min(i * 0.02, 0.5)}s">
                <div class="ach-emoji">${a.emoji}</div>
                <div class="ach-title">${a.title}</div>
                <div class="ach-desc">${a.desc}</div>
            </div>
        `).join('');
    } catch (e) {
        grid.innerHTML = '<div class="center muted" style="grid-column:1/-1;padding:40px">Ошибка загрузки</div>';
    }
}

function onAchievementUnlocked(data) {
    if (typeof sfx === 'function') sfx('notification');
    data.achievements.forEach(a => {
        toast(`${a.emoji} ${a.title}`, 4000);
    });
}