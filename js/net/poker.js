/* ============================================================
   POKER — Texas Hold'em в Mini App
   ============================================================ */

let pokerState = {
    code: null,
    stack: 1000,
    maxPlayers: 4,
    isPublic: false,
    isHost: false,
    inviteLink: null,
    state: null,
    _finishedShown: false,
};

function openPoker() {
    pokerState._finishedShown = false;
    showPokerLobby();
    go('poker');
    checkMyRoom();
    loadPublicRooms('poker');
}

function showPokerLobby() {
    document.getElementById('poker-lobby').classList.remove('hidden');
    document.getElementById('poker-wait').classList.add('hidden');
    document.getElementById('poker-game').classList.add('hidden');
    document.getElementById('poker-sub').textContent = 'Лобби';
    document.getElementById('poker-join-block')?.classList.add('hidden');
}

function showPokerWait(code, inviteLink) {
    document.getElementById('poker-lobby').classList.add('hidden');
    document.getElementById('poker-wait').classList.remove('hidden');
    document.getElementById('poker-game').classList.add('hidden');
    document.getElementById('poker-wait-code').textContent = code;
    if (inviteLink) pokerState.inviteLink = inviteLink;
}

function showPokerGame() {
    document.getElementById('poker-lobby').classList.add('hidden');
    document.getElementById('poker-wait').classList.add('hidden');
    document.getElementById('poker-game').classList.remove('hidden');
    document.getElementById('poker-sub').textContent = 'Игра';
}

async function checkMyRoom() {
    if (!API_URL) return;
    try {
        const data = await api('/api/games/my_room');
        if (data.has_room && data.game === 'poker') {
            pokerState.code = data.code;
            pokerState.isHost = data.host_id === getUserId();
            if (data.started) {
                showPokerGame();
                refreshGameState();
            } else {
                showPokerWait(data.code);
                renderWaitPlayers(data.players, data.max_players);
            }
        }
    } catch (e) {}
}

function renderWaitPlayers(players, max) {
    const el = document.getElementById('poker-wait-players');
    if (!el) return;
    el.innerHTML = players.map((p, i) => `
        <div class="wait-player" style="animation-delay:${i * 0.08}s">
            <div class="wait-player-avatar">${(p.name[0] || '?').toUpperCase()}</div>
            <div class="wait-player-name">${p.name}</div>
            ${i === 0 ? '<div class="wait-player-badge">HOST</div>' : ''}
        </div>
    `).join('') +
    `<div class="center muted mt-16">
        ${players.length}/${max} · ${players.length === max ? 'Старт!' : `Ждём ещё ${max - players.length}`}
    </div>`;
}

/* ---- Создать ---- */
document.getElementById('poker-create')?.addEventListener('click', async () => {
    if (!API_URL) { toast('API не настроен'); return; }
    try {
        const data = await apiPost('/api/games/create', {
            game: 'poker',
            max_players: pokerState.maxPlayers,
            public: pokerState.isPublic,
            settings: {
                stack: pokerState.stack,
                sb: Math.max(10, Math.floor(pokerState.stack / 100)),
                bb: Math.max(20, Math.floor(pokerState.stack / 50)),
                timer: 60,
            },
        });
        if (!data.ok) {
            toast(data.error === 'low_chips'
                ? '💰 Мало фишек, забери /daily'
                : '❌ ' + (data.error || 'Ошибка'));
            return;
        }
        pokerState.code = data.code;
        pokerState.isHost = true;
        pokerState.inviteLink = data.invite_link;
        showPokerWait(data.code, data.invite_link);
        renderWaitPlayers(data.players, data.max_players);
        if (typeof sfx === 'function') sfx('success');
        haptic('medium');

        if (pokerState.maxPlayers === 2) {
            setTimeout(() => openShareModal({...data, game: 'poker'}), 400);
        }
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Выбор стека ---- */
document.querySelectorAll('[data-stack]').forEach(chip => {
    chip.addEventListener('click', () => {
        pokerState.stack = parseInt(chip.dataset.stack);
        document.querySelectorAll('[data-stack]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Выбор игроков ---- */
document.querySelectorAll('[data-max]').forEach(chip => {
    chip.addEventListener('click', () => {
        pokerState.maxPlayers = parseInt(chip.dataset.max);
        document.querySelectorAll('[data-max]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Public/Private ---- */
document.querySelectorAll('[data-public]').forEach(chip => {
    chip.addEventListener('click', () => {
        pokerState.isPublic = chip.dataset.public === 'public';
        document.querySelectorAll('[data-public]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Quick share ---- */
document.getElementById('poker-quick-share')?.addEventListener('click', () => {
    if (pokerState.code && pokerState.inviteLink) {
        openShareModal({
            code: pokerState.code,
            invite_link: pokerState.inviteLink,
            game: 'poker',
        });
        return;
    }
    pokerState.maxPlayers = 2;
    document.querySelectorAll('[data-max]').forEach(c => {
        c.classList.toggle('active', c.dataset.max === '2');
    });
    document.getElementById('poker-create').click();
});

/* ---- Share в wait ---- */
document.getElementById('poker-share')?.addEventListener('click', () => {
    if (!pokerState.inviteLink) return;
    openShareModal({
        code: pokerState.code,
        invite_link: pokerState.inviteLink,
        game: 'poker',
    });
});

/* ---- Quick code ---- */
document.getElementById('poker-quick-code')?.addEventListener('click', () => {
    document.getElementById('poker-join-block')?.classList.toggle('hidden');
    document.getElementById('poker-join-code')?.focus();
});

/* ---- Join ---- */
document.getElementById('poker-join-btn')?.addEventListener('click', joinPoker);
document.getElementById('poker-join-code')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinPoker();
});

async function joinPoker() {
    const code = document.getElementById('poker-join-code').value.trim().toUpperCase();
    if (!code) return;
    try {
        const data = await apiPost('/api/games/join', { code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        pokerState.code = data.code;
        showPokerWait(data.code);
        renderWaitPlayers(data.players, data.max_players);
        if (typeof sfx === 'function') sfx('success');
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Start ---- */
document.getElementById('poker-start')?.addEventListener('click', async () => {
    if (!pokerState.code) return;
    try {
        const data = await apiPost('/api/games/start', { code: pokerState.code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        if (typeof sfx === 'function') sfx('success');
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Leave ---- */
async function leavePoker() {
    try { await apiPost('/api/games/leave', {}); } catch (e) {}
    pokerState.code = null;
    pokerState.inviteLink = null;
    pokerState._finishedShown = false;
    showPokerLobby();
    go('home');
}
document.getElementById('poker-leave')?.addEventListener('click', leavePoker);
document.getElementById('poker-leave-2')?.addEventListener('click', leavePoker);

document.querySelectorAll('[data-poker-back]').forEach(btn => {
    btn.addEventListener('click', () => go('home'));
});

/* ---- Публичные комнаты ---- */
async function loadPublicRooms(gameFilter) {
    const titleEl = document.getElementById('poker-public-title');
    const listEl = document.getElementById('poker-public-list');
    if (!titleEl || !listEl || !API_URL) return;
    try {
        const data = await api('/api/games/public', { game: gameFilter || '' });
        if (!data.rooms || data.rooms.length === 0) {
            titleEl.style.display = 'none';
            listEl.innerHTML = '';
            return;
        }
        titleEl.style.display = 'block';
        listEl.innerHTML = data.rooms.map(r => {
            const icons = { poker: '♠️', durak: '🃏', ttt: '❌', guess: '🎯' };
            return `
                <div class="leader-item">
                    <div class="leader-avatar">${icons[r.game] || '🎮'}</div>
                    <div class="leader-info">
                        <div class="leader-name">${r.host}</div>
                        <div class="leader-meta">${r.players}/${r.max_players} · ${r.code}</div>
                    </div>
                    <button class="btn" style="padding:8px 14px;font-size:13px"
                            onclick="quickJoin('${r.code}')">→</button>
                </div>
            `;
        }).join('');
    } catch (e) {
        titleEl.style.display = 'none';
    }
}

async function quickJoin(code) {
    try {
        const data = await apiPost('/api/games/join', { code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        pokerState.code = data.code;
        showPokerWait(data.code);
        renderWaitPlayers(data.players, data.max_players);
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Refresh ---- */
async function refreshGameState() {
    if (!pokerState.code) return;
    try {
        const data = await api('/api/games/state', { code: pokerState.code });
        if (!data.ok) return;
        if (data.started === false) {
            showPokerWait(data.code);
            renderWaitPlayers(data.players, data.max_players);
            return;
        }
        if (data.game !== 'poker') return;
        pokerState.state = data;
        renderPokerGame(data);
    } catch (e) {}
}

function renderPokerGame(s) {
    if (currentScreen !== 'poker') return;
    showPokerGame();

    document.getElementById('poker-pot').textContent = fmt(s.pot);

    const stageNames = {
        preflop: '🎴 Префлоп', flop: '🟢 Флоп',
        turn: '🟡 Тёрн', river: '🔴 Ривер', showdown: '🏁 Вскрытие',
    };
    document.getElementById('poker-stage').textContent = stageNames[s.stage] || s.stage;

    const board = document.getElementById('poker-board');
    board.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const c = s.board[i];
        const img = document.createElement('img');
        img.className = 'card-img' + (c ? '' : ' empty');
        if (c) img.src = c.url;
        board.appendChild(img);
    }

    const players = document.getElementById('poker-players');
    players.innerHTML = s.players.map(p => {
        const cls = ['poker-player'];
        if (p.is_you) cls.push('you');
        if (p.folded) cls.push('folded');
        if (s.to_act === p.id && !s.finished) cls.push('active');

        let cardsHtml = '';
        if (p.cards && p.cards.length) {
            cardsHtml = p.cards.map(c => c.hidden
                ? `<img src="https://deckofcardsapi.com/static/img/back.png" class="card-img">`
                : `<img src="${c.url}" class="card-img">`
            ).join('');
        }

        return `
            <div class="${cls.join(' ')}" data-uid="${p.id}">
                <div class="poker-player-info">
                    <div class="poker-player-name">${p.name}</div>
                    <div>
                        <span class="poker-player-stack">${fmt(p.stack)}</span>
                        ${p.position ? `<span class="poker-player-pos">${p.position}</span>` : ''}
                    </div>
                    ${p.bet ? `<div class="muted" style="font-size:11px">ставка ${p.bet}</div>` : ''}
                </div>
                <div class="poker-player-cards">${cardsHtml}</div>
            </div>
        `;
    }).join('');

    const myHand = document.getElementById('poker-my-hand');
    myHand.innerHTML = '';
    if (s.me && s.me.cards) {
        s.me.cards.forEach(c => {
            const img = document.createElement('img');
            img.className = 'card-img';
            img.src = c.url;
            myHand.appendChild(img);
        });
    }

    const info = document.getElementById('poker-my-info');
    if (s.me) {
        info.innerHTML = `💰 Стек: <b>${fmt(s.me.stack)}</b>` +
            (s.to_act === s.me.id ? ' · <b style="color:#fbbf24">Твой ход</b>' : '');
    }

    // Turn info
    const turnInfo = document.getElementById('poker-turn-info');
    if (turnInfo) {
        if (!s.finished && s.to_act !== getUserId()) {
            const other = s.players.find(p => p.id === s.to_act);
            const name = other ? other.name : 'Соперник';
            const remaining = s.time_left || 0;
            turnInfo.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;
                            background:linear-gradient(135deg,rgba(251,191,36,.15),rgba(251,191,36,.05));
                            border-radius:14px;border:1px solid rgba(251,191,36,.3)">
                    <span style="font-size:20px">⏳</span>
                    <span style="font-weight:700">${name} ходит</span>
                    ${remaining > 0 ? `<span style="font-weight:800;color:#fbbf24">${remaining}с</span>` : ''}
                </div>
            `;
            turnInfo.style.display = 'block';
        } else {
            turnInfo.style.display = 'none';
        }
    }

    renderPokerActions(s);

    const log = document.getElementById('poker-log');
    log.innerHTML = (s.log || []).map(line => `<div>${line}</div>`).join('');

    if (s.finished && !pokerState._finishedShown) {
        pokerState._finishedShown = true;
        if (s.winner === (s.me?.id)) {
            toast('🏆 Ты победил!', 4000);
            if (typeof sfx === 'function') sfx('win');
        } else if (s.winner) {
            if (typeof sfx === 'function') sfx('lose');
        }
    }
}

function renderPokerActions(s) {
    const el = document.getElementById('poker-actions');
    el.innerHTML = '';

    if (s.finished) {
        el.innerHTML = `<button class="btn succ full" onclick="refreshGameState()">🔄 Обновить</button>`;
        return;
    }

    const allowed = s.actions_allowed || [];
    if (allowed.length === 0) {
        el.innerHTML = `<div class="center muted" style="grid-column:span 2; padding:12px">⏳ Ждём хода соперника</div>`;
        return;
    }

    if (allowed.includes('check')) el.innerHTML += `<button class="btn check" data-action="check">✋ Чек</button>`;
    if (allowed.includes('call')) {
        const need = s.current_bet - (s.me?.bet || 0);
        el.innerHTML += `<button class="btn call" data-action="call">✅ Колл ${need}</button>`;
    }
    if (allowed.includes('raise')) el.innerHTML += `<button class="btn raise" data-action="raise">⬆️ Рейз</button>`;
    if (allowed.includes('allin')) el.innerHTML += `<button class="btn allin" data-action="allin">🔥 Олл-ин</button>`;
    if (allowed.includes('fold'))  el.innerHTML += `<button class="btn fold" data-action="fold">❌ Фолд</button>`;

    el.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => doPokerAction(btn.dataset.action));
    });
}

async function doPokerAction(action, amount = 0) {
    if (!pokerState.code) return;
    if (typeof sfx === 'function') sfx('chip');
    haptic('medium');

    const actionsEl = document.getElementById('poker-actions');
    if (actionsEl) {
        actionsEl.querySelectorAll('button').forEach(b => {
            b.disabled = true;
            b.style.opacity = '0.5';
        });
    }

    try {
        const data = await apiPost('/api/games/action', {
            code: pokerState.code, action, amount,
        });
        if (!data.ok) {
            toast('❌ ' + (data.error || 'Ошибка'));
            setTimeout(refreshGameState, 150);
            return;
        }
        setTimeout(refreshGameState, 150);
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Raise prompt ---- */
document.addEventListener('click', async (e) => {
    if (e.target.closest('[data-action="raise"]')) {
        const s = pokerState.state;
        if (!s) return;
        const min = s.current_bet + s.min_raise;
        const max = (s.me?.stack || 0) + (s.me?.bet || 0);
        const amount = prompt(`Рейз до (${min} – ${max}):`, String(min));
        if (amount) {
            const n = parseInt(amount);
            if (n >= min && n <= max) await doPokerAction('raise', n);
            else toast('Некорректная сумма');
        }
    }
});