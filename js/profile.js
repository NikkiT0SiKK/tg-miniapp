/* ============================================================
   PROFILE + STATS + HISTORY
   ============================================================ */

const GAME_NAMES_MAP = {
    guess:   { emoji: '🎯', name: 'Угадай число' },
    ttt:     { emoji: '❌', name: 'Крестики-нолики' },
    hangman: { emoji: '💀', name: 'Виселица' },
    poker:   { emoji: '♠️', name: 'Покер' },
    durak:   { emoji: '🃏', name: 'Дурак' },
};

const MATCH_ICONS = {
    guess: '🎯', ttt: '❌', hangman: '💀',
    poker: '♠️', durak: '🃏',
};

const RESULT_META = {
    win:  { emoji: '🏆', color: '#34d399', label: 'Победа' },
    loss: { emoji: '💀', color: '#f87171', label: 'Поражение' },
    draw: { emoji: '🤝', color: '#fbbf24', label: 'Ничья' },
};

/* ---------- ПРОФИЛЬ ---------- */
async function loadProfile() {
    if (!API_URL) {
        document.getElementById('prof-games-list').innerHTML =
            '<div class="center muted" style="padding:20px">API не настроен</div>';
        return;
    }
    try {
        const data = await api('/api/me');
        document.getElementById('prof-games').textContent = data.stats.total_games;
        document.getElementById('prof-wins').textContent = data.stats.total_wins;
        document.getElementById('prof-wr').textContent = data.stats.winrate + '%';

        const list = document.getElementById('prof-games-list');
        if (!data.stats.games.length) {
            list.innerHTML = '<div class="center muted" style="padding:20px">Сыграй первую игру!</div>';
            return;
        }
        list.innerHTML = data.stats.games.map((g, i) => {
            const info = GAME_NAMES_MAP[g.game] || { emoji: '🎮', name: g.game };
            const wr = g.played ? Math.round(g.wins / g.played * 100) : 0;
            return `
                <div class="game-stat" style="animation-delay:${i * 0.05}s">
                    <div class="game-stat-emoji">${info.emoji}</div>
                    <div class="game-stat-info">
                        <div class="game-stat-title">${info.name}</div>
                        <div class="game-stat-meta">${g.played} игр · ${g.wins} побед</div>
                    </div>
                    <div class="game-stat-wr">${wr}%</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        document.getElementById('prof-games-list').innerHTML =
            '<div class="center muted" style="padding:20px">Ошибка загрузки</div>';
    }
}

/* ---------- СТАТИСТИКА ---------- */
async function loadStats() {
    if (!API_URL) {
        document.getElementById('stats-per-game').innerHTML =
            '<div class="center muted" style="padding:20px">API не настроен</div>';
        return;
    }
    try {
        const [me, poker] = await Promise.all([
            api('/api/me'),
            api('/api/poker/stats').catch(() => null),
        ]);

        const s = me.stats;
        document.getElementById('stats-wins').textContent = s.total_wins;
        document.getElementById('stats-losses').textContent = s.total_losses;
        document.getElementById('stats-draws').textContent = s.total_draws;

        const wr = s.winrate || 0;
        document.getElementById('stats-wr-value').textContent = wr.toFixed(1);
        setTimeout(() => {
            document.getElementById('stats-wr-fill').style.width = Math.min(100, wr) + '%';
        }, 100);

        const a = me.achievements;
        document.getElementById('stats-ach-count').textContent = `${a.count}/${a.total}`;
        setTimeout(() => {
            document.getElementById('stats-ach-fill').style.width = (a.completion || 0) + '%';
        }, 200);
        document.getElementById('stats-points').textContent = a.points;
        document.getElementById('stats-rank').textContent =
            (a.rank || '').replace(/[^\p{L}\s]/gu, '').trim() || a.rank;

        const perGame = document.getElementById('stats-per-game');
        if (!s.games.length) {
            perGame.innerHTML = '<div class="center muted" style="padding:20px">Сыграй первую игру!</div>';
        } else {
            perGame.innerHTML = s.games
                .slice()
                .sort((a, b) => b.played - a.played)
                .map((g, i) => {
                    const info = GAME_NAMES_MAP[g.game] || { emoji: '🎮', name: g.game };
                    const w = g.played ? (g.wins / g.played * 100).toFixed(0) : 0;
                    let extras = [];
                    if (g.best_score !== null && g.best_score !== undefined) {
                        extras.push(`🥇 ${g.best_score}`);
                    }
                    if (g.max_streak >= 3) extras.push(`🔥 ${g.max_streak}`);
                    const extrasStr = extras.length ? ' · ' + extras.join(' · ') : '';
                    return `
                        <div class="stats-game-row" style="animation-delay:${i * 0.04}s">
                            <div class="stats-game-emoji">${info.emoji}</div>
                            <div class="stats-game-info">
                                <div class="stats-game-name">${info.name}</div>
                                <div class="stats-game-detail">
                                    ${g.played} игр · 🏆 ${g.wins} · 💀 ${g.losses}
                                    ${g.draws ? `· 🤝 ${g.draws}` : ''}
                                    ${extrasStr}
                                </div>
                            </div>
                            <div class="stats-game-wr">${w}%</div>
                        </div>
                    `;
                }).join('');
        }

        const pp = document.getElementById('stats-poker-panel');
        if (!poker || !poker.hands_played) {
            pp.innerHTML = '<div class="center muted">Ещё не играл в покер</div>';
        } else {
            const cell = (label, value) => `
                <div>
                    <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.5px">${label}</div>
                    <div style="font-size:20px;font-weight:700;margin-top:2px">${value}</div>
                </div>
            `;
            pp.innerHTML = `
                <div class="center mb-16" style="font-size:14px">
                    🃏 Раздач: <b>${poker.hands_played}</b>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
                    ${cell('VPIP', poker.vpip + '%')}
                    ${cell('PFR', poker.pfr + '%')}
                    ${cell('3-bet', poker.three_bet + '%')}
                    ${cell('AF', poker.aggression_factor)}
                </div>
                <div class="center mt-16" style="font-size:15px">
                    ${poker.style_emoji || '🎯'} <b>${poker.style || '—'}</b>
                </div>
            `;
        }

        loadAnalytics();
    } catch (e) {
        console.error('stats error:', e);
        document.getElementById('stats-per-game').innerHTML =
            '<div class="center muted" style="padding:20px">Ошибка загрузки</div>';
    }
}

/* ---------- ИСТОРИЯ ---------- */
async function loadHistory() {
    const listEl = document.getElementById('history-list');
    const statsEl = document.getElementById('history-stats');
    if (!listEl) return;

    if (!API_URL) {
        listEl.innerHTML = '<div class="center muted" style="padding:20px">API не настроен</div>';
        return;
    }

    try {
        const [historyData, statsData] = await Promise.all([
            api('/api/history', { limit: 20 }),
            api('/api/history/stats', { days: 7 }),
        ]);

        if (statsEl) {
            if (statsData.total === 0) {
                statsEl.innerHTML = '';
            } else {
                const wr = statsData.winrate || 0;
                const net = statsData.net || 0;
                const netColor = net > 0 ? '#34d399' : net < 0 ? '#f87171' : '#fbbf24';
                const netText = (net > 0 ? '+' : '') + net.toLocaleString('ru-RU');

                statsEl.innerHTML = `
                    <div class="section-title">📊 За последние 7 дней</div>
                    <div class="stats-row">
                        <div class="stat-box">
                            <div class="stat-value">${statsData.total}</div>
                            <div class="stat-label">Партий</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value">${wr.toFixed(0)}%</div>
                            <div class="stat-label">Winrate</div>
                        </div>
                        <div class="stat-box">
                            <div class="stat-value" style="color:${netColor};-webkit-text-fill-color:${netColor}">${netText}</div>
                            <div class="stat-label">Профит</div>
                        </div>
                    </div>
                `;
            }
        }

        if (!historyData.items || historyData.items.length === 0) {
            listEl.innerHTML = `
                <div class="center muted" style="padding:30px 20px">
                    <div style="font-size:42px;margin-bottom:10px">🎮</div>
                    Ещё не сыграл ни одной партии
                </div>`;
            return;
        }

        listEl.innerHTML = historyData.items.map((m, i) => {
            const game = GAME_NAMES_MAP[m.game] || { emoji: '🎮', name: m.game };
            const result = RESULT_META[m.result] || RESULT_META.draw;
            const delta = m.chips_delta || 0;
            const deltaStr = delta !== 0
                ? `${delta > 0 ? '+' : ''}${delta.toLocaleString('ru-RU')}`
                : '';
            const deltaColor = delta > 0 ? '#34d399' : delta < 0 ? '#f87171' : 'var(--hint)';
            const ago = timeAgo(m.created_at);

            return `
                <div class="match-row" style="animation-delay:${i * 0.03}s">
                    <div class="match-emoji">${game.emoji}</div>
                    <div class="match-info">
                        <div class="match-name">${game.name}</div>
                        <div class="match-meta">
                            <span style="color:${result.color}">${result.emoji} ${result.label}</span>
                            ${m.opponent ? ` · vs ${m.opponent}` : ''}
                            ${m.duration_sec ? ` · ${m.duration_sec}с` : ''}
                        </div>
                    </div>
                    <div class="match-side">
                        ${deltaStr ? `<div class="match-delta" style="color:${deltaColor}">${deltaStr}</div>` : ''}
                        <div class="match-ago">${ago}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('history error:', e);
        listEl.innerHTML = '<div class="center muted" style="padding:20px">Ошибка загрузки</div>';
    }
}

/* ---------- АНАЛИТИКА ---------- */
async function loadAnalytics() {
    if (!API_URL) return;
    try {
        const data = await api('/api/analytics');

        const bankrollCanvas = document.getElementById('chart-bankroll');
        const bankrollEmpty = document.getElementById('chart-bankroll-empty');
        if (bankrollCanvas && data.bankroll && data.bankroll.length >= 2) {
            bankrollCanvas.style.display = 'block';
            if (bankrollEmpty) bankrollEmpty.style.display = 'none';
            drawLineChart(bankrollCanvas,
                data.bankroll.map(p => p.chips),
                '#a78bfa', '#7c5cff');
        } else if (bankrollEmpty) {
            bankrollCanvas.style.display = 'none';
            bankrollEmpty.style.display = 'block';
        }

        const actCanvas = document.getElementById('chart-activity');
        const actEmpty = document.getElementById('chart-activity-empty');
        if (actCanvas && data.days && data.days.length > 0) {
            actCanvas.style.display = 'block';
            if (actEmpty) actEmpty.style.display = 'none';
            drawBarChart(actCanvas,
                data.days.map(d => d.total || 0),
                data.days.map(d => (d.day || '').slice(5)));
        } else if (actEmpty) {
            actCanvas.style.display = 'none';
            actEmpty.style.display = 'block';
        }

        const best = data.best_day;
        const worst = data.worst_day;
        const fav = data.favorite_game;
        const fmtNum = n => (n > 0 ? '+' : '') + Number(n).toLocaleString('ru-RU');

        const bestEl = document.getElementById('stats-best-day');
        const worstEl = document.getElementById('stats-worst-day');
        const favEl = document.getElementById('stats-fav-game');

        if (best && bestEl) {
            bestEl.textContent = fmtNum(best.net);
            bestEl.style.color = '#34d399';
            bestEl.style.fontSize = '16px';
        } else if (bestEl) { bestEl.textContent = '—'; }

        if (worst && worstEl) {
            worstEl.textContent = fmtNum(worst.net);
            worstEl.style.color = '#f87171';
            worstEl.style.fontSize = '16px';
        } else if (worstEl) { worstEl.textContent = '—'; }

        if (fav && favEl) {
            const icons = { guess: '🎯', ttt: '❌', hangman: '💀', poker: '♠️', durak: '🃏' };
            favEl.textContent = icons[fav.game] || '🎮';
            favEl.style.fontSize = '22px';
        } else if (favEl) { favEl.textContent = '—'; }
    } catch (e) {
        console.warn('analytics failed:', e);
    }
}

/* ---------- CANVAS CHARTS ---------- */
function drawLineChart(canvas, values, colorStroke, colorFill) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const W = rect.width, H = rect.height;
    const pad = { l: 4, r: 4, t: 12, b: 8 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = (max - min) || 1;

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = pad.t + (H - pad.t - pad.b) * i / 3;
        ctx.beginPath();
        ctx.moveTo(pad.l, y);
        ctx.lineTo(W - pad.r, y);
        ctx.stroke();
    }

    const points = values.map((v, i) => ({
        x: pad.l + (W - pad.l - pad.r) * i / Math.max(1, values.length - 1),
        y: pad.t + (H - pad.t - pad.b) * (1 - (v - min) / range),
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colorFill + 'aa');
    grad.addColorStop(1, colorFill + '00');
    ctx.beginPath();
    ctx.moveTo(points[0].x, H - pad.b);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, H - pad.b);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = colorStroke;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = colorStroke;
    ctx.fill();
}

function drawBarChart(canvas, values, labels) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const W = rect.width, H = rect.height;
    const pad = { t: 8, b: 22, l: 4, r: 4 };
    const max = Math.max(...values, 1);
    const n = values.length;
    const gap = 4;
    const barW = (W - pad.l - pad.r - gap * (n + 1)) / n;

    values.forEach((v, i) => {
        const h = (H - pad.t - pad.b) * (v / max);
        const x = pad.l + gap + (barW + gap) * i;
        const y = H - pad.b - h;

        const grad = ctx.createLinearGradient(0, y, 0, H - pad.b);
        grad.addColorStop(0, '#a78bfa');
        grad.addColorStop(1, '#7c5cff');
        ctx.fillStyle = grad;

        ctx.beginPath();
        const r = Math.min(4, barW / 2, h / 2);
        ctx.moveTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.lineTo(x + barW - r, y);
        ctx.arcTo(x + barW, y, x + barW, y + r, r);
        ctx.lineTo(x + barW, H - pad.b);
        ctx.lineTo(x, H - pad.b);
        ctx.closePath();
        ctx.fill();

        const step = Math.max(1, Math.ceil(n / 6));
        if (labels && labels[i] && i % step === 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.font = '10px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW / 2, H - 6);
        }
    });
}

/* ---- Кнопка обновления истории ---- */
document.getElementById('history-refresh')?.addEventListener('click', () => {
    loadHistory();
    haptic('light');
});