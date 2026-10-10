/* ============================================================
   TOPS — Таблицы лидеров
   ============================================================ */

async function loadTops(tab = 'bankroll') {
    const container = document.getElementById('leaderboard');
    if (!container) return;

    container.innerHTML = `
        <div class="loading">
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
        </div>`;

    if (!API_URL) {
        container.innerHTML = '<div class="center muted" style="padding:40px">API не настроен</div>';
        return;
    }

    try {
        const url = tab === 'bankroll' ? '/api/tops?tab=bankroll' : `/api/tops?tab=${tab}`;
        const data = await api(url);
        if (!data.items.length) {
            container.innerHTML = '<div class="center muted" style="padding:40px">Пока пусто 🤷</div>';
            return;
        }
        container.innerHTML = data.items.map((it, i) => {
            const rankCls = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
            const initial = (it.name[0] || '?').toUpperCase();
            return `
                <div class="leader-item" style="animation-delay:${i * 0.04}s">
                    <div class="leader-rank ${rankCls}">${i + 1}</div>
                    <div class="leader-avatar">${initial}</div>
                    <div class="leader-info">
                        <div class="leader-name">${it.name}</div>
                        <div class="leader-meta">${it.meta || ''}</div>
                    </div>
                    <div class="leader-value">${(it.value || 0).toLocaleString('ru-RU')}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = '<div class="center muted" style="padding:40px">Ошибка загрузки</div>';
    }
}

document.querySelectorAll('[data-top-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('[data-top-tab]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        haptic('light');
        loadTops(tab.dataset.topTab);
    });
});