/* ============================================================
   SHARE + REACTIONS + WS-события
   ============================================================ */

/* ---------- SHARE ---------- */
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
    toast('🔗 Ссылка скопирована');
    closeShareModal();
});

document.getElementById('share-copy-code')?.addEventListener('click', () => {
    if (!_shareData) return;
    navigator.clipboard?.writeText(_shareData.code);
    toast('📋 Код скопирован');
});

/* ---------- WS: PLAYER JOINED ---------- */
function onPlayerJoined(data) {
    if (typeof sfx === 'function') sfx('notification');
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

/* ---------- WS: GAME STARTED ---------- */
function onGameStarted(data) {
    if (data.auto) {
        toast('🎮 Все в сборе — игра началась!', 2500);
        if (typeof sfx === 'function') sfx('success');
        haptic('medium');
    }
    const routes = { poker: 'poker', durak: 'durak', ttt: 'mp-ttt' };
    const target = routes[data.game];
    if (target && screens[target]) {
        setTimeout(() => {
            go(target);
            if (data.game === 'poker' && typeof refreshGameState === 'function') refreshGameState();
            if (data.game === 'durak' && typeof refreshDurakState === 'function') refreshDurakState();
            if (data.game === 'ttt' && typeof refreshMpTTT === 'function') refreshMpTTT();
        }, 500);
    }
}

/* ---------- REACTIONS ---------- */
function onReaction(data) {
    if (typeof sfx === 'function') sfx('notification');
    spawnFloatingReaction(data.emoji);
    showReactionBubble(data.from_id, data.emoji);
    if (data.from_name) {
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

/* ---------- REACTIONS: панель ---------- */
function initReactions(suffix) {
    const toggle = document.getElementById(`reactions-toggle${suffix}`);
    const list = document.getElementById(`reactions-list${suffix}`);
    if (!toggle || !list) return;

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        list.classList.toggle('hidden');
        if (typeof haptic === 'function') haptic('light');
    });

    document.addEventListener('click', (e) => {
        const panel = document.getElementById(`reactions-panel${suffix}`);
        if (panel && !e.target.closest(`#reactions-panel${suffix}`)) {
            list.classList.add('hidden');
        }
    });

    list.querySelectorAll('.reaction-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const emoji = btn.dataset.emoji;
            if (typeof haptic === 'function') haptic('medium');
            list.classList.add('hidden');
            try {
                await apiPost('/api/games/reaction', { emoji });
            } catch (err) {
                console.warn('reaction failed:', err);
            }
        });
    });
}