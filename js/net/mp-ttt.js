/* ============================================================
   MULTIPLAYER TTT
   ============================================================ */
let mpTTT = {
    code: null,
    size: 3,
    isPublic: false,
    isHost: false,
    inviteLink: null,
    state: null,
    _finishedShown: false,
};

function openMpTTT() {
    showMpTTTLobby();
    go('mp-ttt');
    checkMpTTTRoom();
    if (typeof loadPublicRooms === 'function') loadPublicRooms('ttt');
}

function showMpTTTLobby() {
    document.getElementById('mp-ttt-lobby')?.classList.remove('hidden');
    document.getElementById('mp-ttt-wait')?.classList.add('hidden');
    document.getElementById('mp-ttt-game')?.classList.add('hidden');
    const sub = document.getElementById('mp-ttt-sub');
    if (sub) sub.textContent = 'Игра с другом';
    document.getElementById('mp-ttt-join-block')?.classList.add('hidden');
}

function showMpTTTWait(code, inviteLink) {
    document.getElementById('mp-ttt-lobby')?.classList.add('hidden');
    document.getElementById('mp-ttt-wait')?.classList.remove('hidden');
    document.getElementById('mp-ttt-game')?.classList.add('hidden');
    const c = document.getElementById('mp-ttt-wait-code');
    if (c) c.textContent = code;
    if (inviteLink) mpTTT.inviteLink = inviteLink;
}

function showMpTTTGame() {
    document.getElementById('mp-ttt-lobby')?.classList.add('hidden');
    document.getElementById('mp-ttt-wait')?.classList.add('hidden');
    document.getElementById('mp-ttt-game')?.classList.remove('hidden');
    const sub = document.getElementById('mp-ttt-sub');
    if (sub) sub.textContent = 'Игра';
}

async function checkMpTTTRoom() {
    if (!API_URL) return;
    try {
        const data = await api('/api/games/my_room');
        if (data.has_room && data.game === 'ttt') {
            mpTTT.code = data.code;
            mpTTT.isHost = data.host_id === tg?.initDataUnsafe?.user?.id;
            if (data.started) {
                showMpTTTGame();
                refreshMpTTT();
            } else {
                showMpTTTWait(data.code);
                renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
            }
        }
    } catch (e) {}
}

function renderMpTTTPlayers(players, max, targetId) {
    const el = document.getElementById(targetId);
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

/* ---- Создать комнату ---- */
document.getElementById('mp-ttt-create')?.addEventListener('click', async () => {
    try {
        const r = await fetch(API_URL + '/api/games/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Init-Data': INIT_DATA },
            body: JSON.stringify({
                game: 'ttt',
                max_players: 2,
                public: mpTTT.isPublic,
                settings: { size: mpTTT.size },
            }),
        });
        const data = await r.json();
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        mpTTT.code = data.code;
        mpTTT.isHost = true;
        mpTTT.inviteLink = data.invite_link;
        showMpTTTWait(data.code, data.invite_link);
        renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
        if (typeof sfx === 'function') sfx('success');
        if (typeof haptic === 'function') haptic('medium');

        setTimeout(() => openShareModal({ ...data, game: 'ttt' }), 400);
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Пригласить ---- */
document.getElementById('mp-ttt-share')?.addEventListener('click', () => {
    if (!mpTTT.inviteLink) return;
    openShareModal({
        code: mpTTT.code,
        invite_link: mpTTT.inviteLink,
        game: 'ttt',
    });
});

/* ---- Приватная / Публичная ---- */
document.querySelectorAll('[data-mppublic]').forEach(chip => {
    chip.addEventListener('click', () => {
        mpTTT.isPublic = chip.dataset.mppublic === 'public';
        document.querySelectorAll('[data-mppublic]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Размер поля ---- */
document.querySelectorAll('[data-mpsize]').forEach(chip => {
    chip.addEventListener('click', () => {
        mpTTT.size = parseInt(chip.dataset.mpsize);
        document.querySelectorAll('[data-mpsize]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Quick-share ---- */
document.getElementById('mp-ttt-quick-share')?.addEventListener('click', () => {
    if (mpTTT.code && mpTTT.inviteLink) {
        openShareModal({
            code: mpTTT.code,
            invite_link: mpTTT.inviteLink,
            game: 'ttt',
        });
        return;
    }
    mpTTT.size = 3;
    document.getElementById('mp-ttt-create')?.click();
});

/* ---- Quick-code ---- */
document.getElementById('mp-ttt-quick-code')?.addEventListener('click', () => {
    document.getElementById('mp-ttt-join-block')?.classList.toggle('hidden');
    document.getElementById('mp-ttt-join-code')?.focus();
});

/* ---- Join ---- */
document.getElementById('mp-ttt-join-btn')?.addEventListener('click', joinMpTTT);
document.getElementById('mp-ttt-join-code')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinMpTTT();
});

async function joinMpTTT() {
    const codeEl = document.getElementById('mp-ttt-join-code');
    const code = codeEl?.value.trim().toUpperCase();
    if (!code) return;
    try {
        const r = await fetch(API_URL + '/api/games/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Init-Data': INIT_DATA },
            body: JSON.stringify({ code }),
        });
        const data = await r.json();
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        mpTTT.code = data.code;
        showMpTTTWait(data.code);
        renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
        if (typeof sfx === 'function') sfx('success');
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Leave ---- */
async function leaveMpTTT() {
    try {
        await fetch(API_URL + '/api/games/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Init-Data': INIT_DATA },
        });
    } catch (e) {}
    mpTTT.code = null;
    mpTTT.inviteLink = null;
    mpTTT._finishedShown = false;
    showMpTTTLobby();
    go('home');
}
document.getElementById('mp-ttt-leave')?.addEventListener('click', leaveMpTTT);
document.getElementById('mp-ttt-leave-2')?.addEventListener('click', leaveMpTTT);

/* ---- Refresh ---- */
async function refreshMpTTT() {
    if (!mpTTT.code) {
        // Если code нет — попробуем получить
        try {
            const room = await api('/api/games/my_room');
            if (room.has_room && room.game === 'ttt') {
                mpTTT.code = room.code;
                mpTTT.isHost = room.host_id === tg?.initDataUnsafe?.user?.id;
            } else {
                return;
            }
        } catch (e) { return; }
    }
    try {
        const data = await api('/api/games/state', { code: mpTTT.code });
        if (!data.ok) return;
        if (data.started === false) {
            showMpTTTWait(data.code);
            renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
            return;
        }
        if (data.game !== 'ttt') return;
        mpTTT.state = data;
        renderMpTTTGame(data);
    } catch (e) {
        console.warn('refreshMpTTT failed:', e);
    }
}

/* ---- Отрисовка ---- */
function renderMpTTTGame(s) {
    if (currentScreen !== 'mp-ttt') return;
    showMpTTTGame();

    const myId = tg?.initDataUnsafe?.user?.id;
    const isMyTurn = s.to_act === myId;

    // Панель игроков
    const bar = document.getElementById('mp-ttt-players-bar');
    if (bar) {
        const playersInfo = s.players_info || [];
        bar.innerHTML = playersInfo.map((p) => {
            const isActive = !s.finished && s.to_act === p.id;
            return `
                <div class="mp-player ${isActive ? 'active' : ''} ${p.is_you ? 'you' : ''}"
                     data-uid="${p.id}">
                    <div class="mp-player-symbol">${p.symbol === 'X' ? '❌' : '⭕'}</div>
                    <div class="mp-player-name">${p.is_you ? 'Ты' : (p.name || 'Игрок')}</div>
                    <div class="mp-player-badge">${isActive ? 'Ходит' : ''}</div>
                </div>
            `;
        }).join('');
    }

    // Статус
    let status = '';
    if (s.finished) {
        if (s.winner === myId) {
            status = '🎉 Ты победил!';
            if (!mpTTT._finishedShown) {
                mpTTT._finishedShown = true;
                if (typeof sfx === 'function') sfx('win');
            }
        } else if (s.winner === null) {
            status = '🤝 Ничья';
            if (!mpTTT._finishedShown) mpTTT._finishedShown = true;
        } else {
            status = '😢 Ты проиграл';
            if (!mpTTT._finishedShown) {
                mpTTT._finishedShown = true;
                if (typeof sfx === 'function') sfx('lose');
            }
        }
    } else if (isMyTurn) {
        status = '🎯 Твой ход';
    } else {
        status = '⏳ Ход соперника';
    }
    const statusEl = document.getElementById('mp-ttt-status');
    if (statusEl) statusEl.textContent = status;

    // Поле
    const board = document.getElementById('mp-ttt-board');
    if (!board) return;
    board.style.gridTemplateColumns = `repeat(${s.size || 3}, 1fr)`;
    board.innerHTML = '';
    const ICON = { 'X': '❌', 'O': '⭕', '': '' };

    (s.board || []).forEach((v, i) => {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        if (v) {
            cell.classList.add('played');
            cell.textContent = ICON[v] || v;
        } else if (isMyTurn && !s.finished) {
            cell.addEventListener('click', () => moveMpTTT(i));
        }
        board.appendChild(cell);
    });

    // Подсказка
    const footer = document.getElementById('mp-ttt-footer-text');
    if (footer) {
        if (s.finished) footer.textContent = 'Нажми «Покинуть» или создай новую игру';
        else if (isMyTurn) footer.textContent = '👆 Тапни по свободной клетке';
        else footer.textContent = 'Ждём хода соперника…';
    }
}

async function moveMpTTT(idx) {
    if (!mpTTT.code) return;
    if (typeof sfx === 'function') sfx('click');
    if (typeof haptic === 'function') haptic('light');
    try {
        const r = await fetch(API_URL + '/api/games/action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Init-Data': INIT_DATA },
            body: JSON.stringify({
                code: mpTTT.code,
                action: 'move',
                idx,
            }),
        });
        const data = await r.json();
        if (!data.ok) toast('❌ ' + (data.error || 'Ошибка'));
        setTimeout(refreshMpTTT, 150);
    } catch (e) {}
}