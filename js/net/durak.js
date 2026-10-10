/* ============================================================
   DURAK — Подкидной дурак в Mini App
   ============================================================ */

let durakState = {
    code: null,
    maxPlayers: 3,
    isPublic: false,
    isHost: false,
    inviteLink: null,
    state: null,
    selectionMode: null,
    _finishedShown: false,
};

function openDurak() {
    durakState._finishedShown = false;
    showDurakLobby();
    go('durak');
    checkMyDurakRoom();
}

function showDurakLobby() {
    document.getElementById('durak-lobby').classList.remove('hidden');
    document.getElementById('durak-wait').classList.add('hidden');
    document.getElementById('durak-game').classList.add('hidden');
    document.getElementById('durak-sub').textContent = 'Лобби';
    document.getElementById('durak-join-block')?.classList.add('hidden');
}

function showDurakWait(code, inviteLink) {
    document.getElementById('durak-lobby').classList.add('hidden');
    document.getElementById('durak-wait').classList.remove('hidden');
    document.getElementById('durak-game').classList.add('hidden');
    document.getElementById('durak-wait-code').textContent = code;
    if (inviteLink) durakState.inviteLink = inviteLink;
}

function showDurakGame() {
    document.getElementById('durak-lobby').classList.add('hidden');
    document.getElementById('durak-wait').classList.add('hidden');
    document.getElementById('durak-game').classList.remove('hidden');
    document.getElementById('durak-sub').textContent = 'Игра';
}

async function checkMyDurakRoom() {
    if (!API_URL) return;
    try {
        const data = await api('/api/games/my_room');
        if (data.has_room && data.game === 'durak') {
            durakState.code = data.code;
            durakState.isHost = data.host_id === getUserId();
            if (data.started) {
                showDurakGame();
                refreshDurakState();
            } else {
                showDurakWait(data.code);
                renderDurakWaitPlayers(data.players, data.max_players);
            }
        }
    } catch (e) {}
}

function renderDurakWaitPlayers(players, max) {
    const el = document.getElementById('durak-wait-players');
    if (!el) return;
    el.innerHTML = players.map((p, i) => `
        <div class="wait-player" style="animation-delay:${i * 0.08}s">
            <div class="wait-player-avatar">${(p.name[0] || '?').toUpperCase()}</div>
            <div class="wait-player-name">${p.name}</div>
            ${i === 0 ? '<div class="wait-player-badge">HOST</div>' : ''}
        </div>
    `).join('') +
    `<div class="center muted mt-16">${players.length}/${max}</div>`;
}

/* ---- Создать ---- */
document.getElementById('durak-create')?.addEventListener('click', async () => {
    if (!API_URL) { toast('API не настроен'); return; }
    try {
        const data = await apiPost('/api/games/create', {
            game: 'durak',
            max_players: durakState.maxPlayers,
            public: durakState.isPublic,
        });
        if (!data.ok) {
            toast('❌ ' + (data.error || 'Ошибка'));
            return;
        }
        durakState.code = data.code;
        durakState.isHost = true;
        durakState.inviteLink = data.invite_link;
        showDurakWait(data.code, data.invite_link);
        renderDurakWaitPlayers(data.players, data.max_players);
        if (typeof sfx === 'function') sfx('success');
        haptic('medium');
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Выбор игроков ---- */
document.querySelectorAll('[data-dmax]').forEach(chip => {
    chip.addEventListener('click', () => {
        durakState.maxPlayers = parseInt(chip.dataset.dmax);
        document.querySelectorAll('[data-dmax]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Public/Private ---- */
document.querySelectorAll('[data-dpublic]').forEach(chip => {
    chip.addEventListener('click', () => {
        durakState.isPublic = chip.dataset.dpublic === 'public';
        document.querySelectorAll('[data-dpublic]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});

/* ---- Quick share ---- */
document.getElementById('durak-quick-share')?.addEventListener('click', () => {
    if (durakState.code && durakState.inviteLink) {
        openShareModal({
            code: durakState.code,
            invite_link: durakState.inviteLink,
            game: 'durak',
        });
        return;
    }
    document.getElementById('durak-create').click();
});

document.getElementById('durak-share')?.addEventListener('click', () => {
    if (!durakState.inviteLink) return;
    openShareModal({
        code: durakState.code,
        invite_link: durakState.inviteLink,
        game: 'durak',
    });
});

/* ---- Quick code ---- */
document.getElementById('durak-quick-code')?.addEventListener('click', () => {
    document.getElementById('durak-join-block')?.classList.toggle('hidden');
    document.getElementById('durak-join-code')?.focus();
});

/* ---- Join ---- */
document.getElementById('durak-join-btn')?.addEventListener('click', joinDurak);
document.getElementById('durak-join-code')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') joinDurak();
});

async function joinDurak() {
    const code = document.getElementById('durak-join-code').value.trim().toUpperCase();
    if (!code) return;
    try {
        const data = await apiPost('/api/games/join', { code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        durakState.code = data.code;
        showDurakWait(data.code);
        renderDurakWaitPlayers(data.players, data.max_players);
    } catch (e) { toast('❌ ' + e.message); }
}

/* ---- Start ---- */
document.getElementById('durak-start')?.addEventListener('click', async () => {
    if (!durakState.code) return;
    try {
        const data = await apiPost('/api/games/start', { code: durakState.code });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
    } catch (e) { toast('❌ ' + e.message); }
});

/* ---- Leave ---- */
async function leaveDurak() {
    try { await apiPost('/api/games/leave', {}); } catch (e) {}
    durakState.code = null;
    durakState.inviteLink = null;
    durakState._finishedShown = false;
    showDurakLobby();
    go('home');
}
document.getElementById('durak-leave')?.addEventListener('click', leaveDurak);
document.getElementById('durak-leave-2')?.addEventListener('click', leaveDurak);

document.querySelectorAll('[data-durak-back]').forEach(btn => {
    btn.addEventListener('click', () => go('home'));
});

/* ---- Refresh ---- */
async function refreshDurakState() {
    if (!durakState.code) return;
    try {
        const data = await api('/api/games/state', { code: durakState.code });
        if (!data.ok) return;
        if (data.started === false) {
            showDurakWait(data.code);
            renderDurakWaitPlayers(data.players, data.max_players);
            return;
        }
        if (data.game !== 'durak') return;
        durakState.state = data;
        renderDurakGame(data);
    } catch (e) {}
}

function renderDurakGame(s) {
    if (currentScreen !== 'durak') return;
    showDurakGame();

    document.getElementById('durak-trump').textContent = s.trump_suit || '—';
    document.getElementById('durak-deck-count').textContent = s.deck_count || 0;

    const oppsEl = document.getElementById('durak-opponents');
    oppsEl.innerHTML = (s.opponents || []).map(o => {
        const cls = ['durak-opponent'];
        if (o.is_attacker) cls.push('attacker');
        if (o.is_defender) cls.push('defender');
        const role = o.is_attacker ? '🎯 атакует'
                    : o.is_defender ? '🛡 защищается'
                    : '🪑 наблюдает';
        return `
            <div class="${cls.join(' ')}" data-uid="${o.id}">
                <div class="durak-opponent-name">${o.name}</div>
                <div class="durak-opponent-cards">🃏 ${o.count}</div>
                <div class="durak-opponent-role">${role}</div>
            </div>
        `;
    }).join('');

    const tableEl = document.getElementById('durak-table-inner');
    if (!s.table || s.table.length === 0) {
        tableEl.innerHTML = '<div class="center muted">Стол пуст</div>';
    } else {
        tableEl.innerHTML = s.table.map(pair => {
            const unbeaten = !pair.defense;
            return `
                <div class="durak-pair ${unbeaten ? 'unbeaten' : ''}">
                    <img class="card-img" src="${pair.attack.url}" alt="${pair.attack.str}">
                    ${pair.defense ? `
                        <img class="card-img durak-defense"
                             src="${pair.defense.url}"
                             alt="${pair.defense.str}">
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    const handEl = document.getElementById('durak-my-hand');
    const available = s.available || {};
    const mode = durakState.selectionMode;

    let selectableCodes = new Set();
    if (mode === 'attack') {
        selectableCodes = new Set(available.attack || []);
    } else if (mode === 'defend') {
        selectableCodes = new Set(available.defend || []);
    } else if (mode === 'transfer') {
        selectableCodes = new Set(available.transfer || []);
    }

    handEl.innerHTML = (s.hand || []).map(c => {
        const isSelectable = mode && selectableCodes.has(c.code);
        const isDisabled = mode && !isSelectable;
        const cls = ['durak-card'];
        if (c.is_trump) cls.push('trump');
        if (isSelectable) cls.push('selectable');
        if (isDisabled) cls.push('disabled');
        return `
            <div class="${cls.join(' ')}" data-card="${c.code}">
                <img class="card-img" src="${c.url}" alt="${c.str}">
            </div>
        `;
    }).join('');

    handEl.querySelectorAll('.durak-card.selectable').forEach(el => {
        el.addEventListener('click', () => doDurakActionCard(el.dataset.card));
    });

    document.getElementById('durak-hint').textContent = s.hint || '';
    renderDurakActions(s);

    if (s.finished && !durakState._finishedShown) {
        durakState._finishedShown = true;
        if (s.winner === getUserId()) {
            toast('🏆 Ты победил!', 4000);
            if (typeof sfx === 'function') sfx('win');
        } else if (s.loser === getUserId()) {
            toast('💀 Ты дурак…', 4000);
            if (typeof sfx === 'function') sfx('lose');
        }
    }
}

function renderDurakActions(s) {
    const el = document.getElementById('durak-actions');
    el.innerHTML = '';

    if (s.finished) {
        el.innerHTML = `<button class="btn succ full" onclick="refreshDurakState()">🔄 Обновить</button>`;
        return;
    }

    const avail = s.available || {};
    const mode = durakState.selectionMode;

    if (mode) {
        el.innerHTML = `<button class="btn cancel full" onclick="cancelDurakSelection()">❌ Отмена выбора</button>`;
        return;
    }

    if (avail.attack && avail.attack.length > 0 && s.is_attacker) {
        el.innerHTML += `<button class="btn attack" onclick="startDurakSelection('attack')">🎯 Атака / Подкинуть</button>`;
    }

    if (avail.defend && avail.defend.length > 0 && s.is_defender) {
        el.innerHTML += `<button class="btn defend" onclick="startDurakSelection('defend')">🛡 Отбить</button>`;
    }

    if (avail.transfer && avail.transfer.length > 0 && s.is_defender) {
        el.innerHTML += `<button class="btn transfer" onclick="startDurakSelection('transfer')">🔄 Перевести</button>`;
    }

    if (avail.can_take) {
        el.innerHTML += `<button class="btn take" onclick="doDurakAction('take')">📥 Взять</button>`;
    }

    if (avail.can_pass) {
        el.innerHTML += `<button class="btn pass full" onclick="doDurakAction('pass')">✅ Бито</button>`;
    }

    if (el.innerHTML === '') {
        el.innerHTML = `<div class="center muted" style="grid-column:span 2; padding:12px">⏳ Ждём хода соперника</div>`;
    }
}

function startDurakSelection(mode) {
    durakState.selectionMode = mode;
    renderDurakGame(durakState.state);
    haptic('light');
}

function cancelDurakSelection() {
    durakState.selectionMode = null;
    renderDurakGame(durakState.state);
    haptic('light');
}

async function doDurakActionCard(cardCode) {
    const mode = durakState.selectionMode;
    if (!mode) return;
    const action = mode === 'attack' ? 'attack'
                 : mode === 'defend' ? 'defend'
                 : mode === 'transfer' ? 'transfer' : null;
    if (!action) return;

    durakState.selectionMode = null;
    haptic('medium');
    if (typeof sfx === 'function') sfx('card');

    try {
        const data = await apiPost('/api/games/action', {
            code: durakState.code, action, card: cardCode,
        });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        setTimeout(refreshDurakState, 200);
    } catch (e) { toast('❌ ' + e.message); }
}

async function doDurakAction(action, extra = {}) {
    durakState.selectionMode = null;
    haptic('medium');
    if (typeof sfx === 'function') sfx('chip');

    try {
        const data = await apiPost('/api/games/action', {
            code: durakState.code, action, ...extra,
        });
        if (!data.ok) { toast('❌ ' + (data.error || 'Ошибка')); return; }
        setTimeout(refreshDurakState, 200);
    } catch (e) { toast('❌ ' + e.message); }
}