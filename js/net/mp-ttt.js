/* ============================================================
   MULTIPLAYER TTT — Крестики PvP
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
    mpTTT._finishedShown = false;
    showMpTTTLobby();
    go('mp-ttt');
    checkMpTTTRoom();
    loadPublicRooms('ttt');
}

function showMpTTTLobby() {
    document.getElementById('mp-ttt-lobby').classList.remove('hidden');
    document.getElementById('mp-ttt-wait').classList.add('hidden');
    document.getElementById('mp-ttt-game').classList.add('hidden');
    document.getElementById('mp-ttt-sub').textContent = 'Игра с другом';
    document.getElementById('mp-ttt-join-block')?.classList.add('hidden');
}

function showMpTTTWait(code, inviteLink) {
    document.getElementById('mp-ttt-lobby').classList.add('hidden');
    document.getElementById('mp-ttt-wait').classList.remove('hidden');
    document.getElementById('mp-ttt-game').classList.add('hidden');
    document.getElementById('mp-ttt-wait-code').textContent = code;
    if (inviteLink) mpTTT.inviteLink = inviteLink;
}

function showMpTTTGame() {
    document.getElementById('mp-ttt-lobby').classList.add('hidden');
    document.getElementById('mp-ttt-wait').classList.add('hidden');
    document.getElementById('mp-ttt-game').classList.remove('hidden');
    document.getElementById('mp-ttt-sub').textContent = 'Игра';
}

async function checkMpTTTRoom() {
    if (!API_URL) return;
    try {
        const data = await api('/api/games/my_room');
        if (data.has_room && data.game === 'ttt') {
            mpTTT.code = data.code;
            mpTTT.isHost = data.host_id === getUserId();
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

/* ---- Создать ---- */
document.getElementById('mp-ttt-create')?.addEventListener('click', async () => {
    try {
        const data = await apiPost('/api/games/create', {
            game: 'ttt',
            max_players: 2,
            public: mpTTT.isPublic,
            settings: { size: mpTTT.size },
        });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        mpTTT.code = data.code;
        mpTTT.isHost = true;
        mpTTT.inviteLink = data.invite_link;
        showMpTTTWait(data.code, data.invite_link);
        renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
        if (typeof sfx === 'function') sfx('success');
        haptic('medium');

        setTimeout(() => openShareModal({...data, game: 'ttt'}), 400);
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Share в wait ---- */
document.getElementById('mp-ttt-share')?.addEventListener('click', () => {
    if (!mpTTT.inviteLink) return;
    openShareModal({
        code: mpTTT.code,
        invite_link: mpTTT.inviteLink,
        game: 'ttt',
    });
});

/* ---- Public/Private ---- */
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

/* ---- Quick share ---- */
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
    document.getElementById('mp-ttt-create').click();
});

/* ---- Quick code ---- */
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
    const code = document.getElementById('mp-ttt-join-code').value.trim().toUpperCase();
    if (!code) return;
    try {
        const data = await apiPost('/api/games/join', { code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        mpTTT.code = data.code;
        showMpTTTWait(data.code);
        renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
        if (typeof sfx === 'function') sfx('success');
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Leave ---- */
async function leaveMpTTT() {
    try { await apiPost('/api/games/leave', {}); } catch (e) {}
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
    if (!mpTTT.code) return;
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
    } catch (e) {}
}

function renderMpTTTGame(s) {
    if (currentScreen !== 'mp-ttt') return;
    showMpTTTGame();

    const myId = getUserId();
    const isMyTurn = s.to_act === myId;

    const bar = document.getElementById('mp-ttt-players-bar');
    bar.innerHTML = (s.players_order || []).map((uid, idx) => {
        const isMe = uid === myId;
        const symbol = idx === 0 ? '❌' : '⭕';
        const isActive = !s.finished && s.to_act === uid;
        return `
            <div class="mp-player ${isActive ? 'active' : ''}" data-uid="${uid}">
                <div class="mp-player-symbol">${symbol}</div>
                <div class="mp-player-name">${isMe ? 'Ты' : 'Соперник'}</div>
                <div class="mp-player-badge">${isActive ? 'Ходит' : ''}</div>
            </div>
        `;
    }).join('');

    let status = '';
    if (s.finished) {
        if (s.winner === myId) {
            status = '🎉 Ты победил!';
            if (!mpTTT._finishedShown) { mpTTT._finishedShown = true; sfx('win'); }
        } else if (s.winner === null) {
            status = '🤝 Ничья';
            if (!mpTTT._finishedShown) { mpTTT._finishedShown = true; }
        } else {
            status = '😢 Ты проиграл';
            if (!mpTTT._finishedShown) { mpTTT._finishedShown = true; sfx('lose'); }
        }
    } else if (isMyTurn) {
        status = '🎯 Твой ход';
    } else {
        status = '⏳ Ход соперника';
    }
    document.getElementById('mp-ttt-status').textContent = status;

    const board = document.getElementById('mp-ttt-board');
    board.style.gridTemplateColumns = `repeat(${s.size}, 1fr)`;
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

    const footer = document.getElementById('mp-ttt-footer-text');
    if (s.finished) {
        footer.textContent = 'Нажми «Покинуть» или создай новую игру';
    } else if (isMyTurn) {
        footer.textContent = '👆 Тапни по свободной клетке';
    } else {
        footer.textContent = 'Ждём хода соперника…';
    }
}

async function moveMpTTT(idx) {
    if (!mpTTT.code) return;
    if (typeof sfx === 'function') sfx('click');
    haptic('light');
    try {
        const data = await apiPost('/api/games/action', {
            code: mpTTT.code, action: 'move', idx,
        });
        if (!data.ok) toast('❌ ' + (data.error || 'Ошибка'));
        setTimeout(refreshMpTTT, 150);
    } catch (e) {}
}