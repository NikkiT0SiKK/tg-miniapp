/* ============================================================
   SHARE + WS EVENTS
   ============================================================ */

let _shareData = null;

function openShareModal(data) {
    _shareData = data;
    document.getElementById('share-code').textContent = data.code;
    document.getElementById('share-modal').classList.add('show');
    if (typeof sfx === 'function') sfx('notification');
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('show');
}

document.getElementById('share-close')?.addEventListener('click', closeShareModal);

document.getElementById('share-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'share-modal') closeShareModal();
});

document.getElementById('share-telegram')?.addEventListener('click', () => {
    if (!_shareData) return;
    const link = _shareData.invite_link;
    const text = `🎮 Играем! Код: ${_shareData.code}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
    if (tg?.openTelegramLink) tg.openTelegramLink(shareUrl);
    else window.open(shareUrl, '_blank');
    closeShareModal();
});

document.getElementById('share-copy-link')?.addEventListener('click', () => {
    if (!_shareData) return;
    navigator.clipboard?.writeText(_shareData.invite_link);
    if (typeof toast === 'function') toast('🔗 Ссылка скопирована');
    closeShareModal();
});

document.getElementById('share-copy-code')?.addEventListener('click', () => {
    if (!_shareData) return;
    navigator.clipboard?.writeText(_shareData.code);
    if (typeof toast === 'function') toast('📋 Код скопирован');
});


/* ============================================================
   WS: игрок присоединился
   ============================================================ */
async function onPlayerJoined(data) {
    if (typeof sfx === 'function') sfx('notification');
    if (typeof toast === 'function')
        toast(`👤 ${data.player.name} присоединился`, 3000);

    if (currentScreen === 'poker' && typeof renderWaitPlayers === 'function') {
        renderWaitPlayers(data.players, data.max_players);
    }
    if (currentScreen === 'durak' && typeof renderDurakWaitPlayers === 'function') {
        renderDurakWaitPlayers(data.players, data.max_players);
    }
    if (currentScreen === 'mp-ttt' && typeof renderMpTTTPlayers === 'function') {
        renderMpTTTPlayers(data.players, data.max_players, 'mp-ttt-wait-players');
    }
}


/* ============================================================
   WS: игра началась
   ============================================================ */
async function onGameStarted(data) {
    console.log('[GAME STARTED]', data);

    if (data.auto) {
        if (typeof toast === 'function')
            toast('🎮 Все в сборе — игра началась!', 2500);
        if (typeof sfx === 'function') sfx('success');
        if (typeof haptic === 'function') haptic('medium');
    }

    // ВАЖНО: получаем code СВОЕЙ комнаты (приглашённый игрок = null)
    try {
        const myRoom = await api('/api/games/my_room');
        if (myRoom.has_room) {
            const code = myRoom.code;
            const game = myRoom.game;

            if (game === 'poker' && typeof pokerState !== 'undefined') {
                pokerState.code = code;
                pokerState.isHost = myRoom.host_id === tg?.initDataUnsafe?.user?.id;
                if (typeof showPokerGame === 'function') showPokerGame();
            }
            if (game === 'durak' && typeof durakState !== 'undefined') {
                durakState.code = code;
                durakState.isHost = myRoom.host_id === tg?.initDataUnsafe?.user?.id;
                if (typeof showDurakGame === 'function') showDurakGame();
            }
            if (game === 'ttt' && typeof mpTTT !== 'undefined') {
                mpTTT.code = code;
                mpTTT.isHost = myRoom.host_id === tg?.initDataUnsafe?.user?.id;
                if (typeof showMpTTTGame === 'function') showMpTTTGame();
            }
        }
    } catch (e) {
        console.warn('my_room failed:', e);
    }

    const routes = { poker: 'poker', durak: 'durak', ttt: 'mp-ttt' };
    const target = routes[data.game];
    if (target && typeof screens !== 'undefined' && screens[target]) {
        setTimeout(() => {
            go(target);
            if (data.game === 'poker' && typeof refreshGameState === 'function') refreshGameState();
            if (data.game === 'durak' && typeof refreshDurakState === 'function') refreshDurakState();
            if (data.game === 'ttt' && typeof refreshMpTTT === 'function') refreshMpTTT();
        }, 500);
    }
}


/* ============================================================
   WS: достижения
   ============================================================ */
function onAchievementUnlocked(data) {
    if (typeof sfx === 'function') sfx('notification');
    data.achievements.forEach(a => {
        if (typeof toast === 'function') toast(`${a.emoji} ${a.title}`, 4000);
    });
}


/* ============================================================
   РЕАКЦИИ
   ============================================================ */
function onReaction(data) {
    if (typeof sfx === 'function') sfx('notification');
    spawnFloatingReaction(data.emoji);
    showReactionBubble(data.from_id, data.emoji);
    if (data.from_name && typeof toast === 'function') {
        toast(`${data.from_name}: ${data.emoji}`, 1500);
    }
}

function spawnFloatingReaction(emoji) {
    const el = document.createElement('div');
    el.className = 'reaction-float';
    el.textContent = emoji;
    const x = 15 + Math.random() * 70;
    el.style.left = x + '%';
    el.style.bottom = '10%';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2100);
}

function showReactionBubble(fromId, emoji) {
    const selectors = [
        `.poker-player[data-uid="${fromId}"]`,
        `.durak-opponent[data-uid="${fromId}"]`,
        `.mp-player[data-uid="${fromId}"]`,
    ];
    let el = null;
    for (const sel of selectors) {
        el = document.querySelector(sel);
        if (el) break;
    }
    if (!el) return;
    el.querySelectorAll('.reaction-bubble').forEach(b => b.remove());
    el.style.position = 'relative';
    const bubble = document.createElement('div');
    bubble.className = 'reaction-bubble';
    bubble.textContent = emoji;
    el.appendChild(bubble);
    setTimeout(() => bubble.remove(), 2500);
}

function initReactions(suffix) {
    const toggle = document.getElementById(`reactions-toggle${suffix}`);
    const list = document.getElementById(`reactions-list${suffix}`);
    if (!toggle || !list) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        list.classList.toggle('hidden');
        if (typeof haptic === 'function') haptic('light');
    });

    list.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const emoji = btn.dataset.emoji;
            if (typeof haptic === 'function') haptic('medium');
            list.classList.add('hidden');
            try {
                await apiPost('/api/games/reaction', { emoji });
            } catch (err) {}
        });
    });
}

// Инициализируем для всех игр
document.addEventListener('DOMContentLoaded', () => {
    initReactions('');
    initReactions('-durak');
    initReactions('-ttt');
});


/* ============================================================
   FALLBACK POLLING (когда WS не работает)
   ============================================================ */
let _pollingTimer = null;
let _lastPollScreen = null;

function startPolling() {
    stopPolling();
    _pollingTimer = setInterval(() => {
        const cur = typeof currentScreen !== 'undefined' ? currentScreen : null;
        if (cur === 'poker' && typeof refreshGameState === 'function') refreshGameState();
        if (cur === 'durak' && typeof refreshDurakState === 'function') refreshDurakState();
        if (cur === 'mp-ttt' && typeof refreshMpTTT === 'function') refreshMpTTT();
    }, 1500);
}

function stopPolling() {
    if (_pollingTimer) {
        clearInterval(_pollingTimer);
        _pollingTimer = null;
    }
}

setInterval(() => {
    if (typeof currentScreen === 'undefined') return;
    const isGame = ['poker', 'durak', 'mp-ttt'].includes(currentScreen);
    if (isGame && _lastPollScreen !== currentScreen) {
        _lastPollScreen = currentScreen;
        startPolling();
    } else if (!isGame && _lastPollScreen !== null) {
        _lastPollScreen = null;
        stopPolling();
    }
}, 500);