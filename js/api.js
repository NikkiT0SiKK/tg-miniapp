/* ============================================================
   API CLIENT + WEBSOCKET
   ============================================================ */

async function api(path, params = {}) {
    if (!API_URL) throw new Error('API не настроен');
    const url = new URL(API_URL + path);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), {
        headers: { 'X-Init-Data': INIT_DATA },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}

async function apiPost(path, body = {}) {
    const res = await fetch(API_URL + path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Init-Data': INIT_DATA,
        },
        body: JSON.stringify(body),
    });
    return res.json();
}

/* ============================================================
   WEBSOCKET с heartbeat + автопереподключением
   ============================================================ */
let ws = null;
let wsReconnectTimer = null;
let wsHeartbeatTimer = null;
let wsReconnectAttempts = 0;
let wsStatus = 'disconnected';

function updateWSStatus(status) {
    wsStatus = status;
    const ind = document.getElementById('ws-indicator');
    if (!ind) return;
    const colors = {
        online: '#34d399',
        connecting: '#fbbf24',
        disconnected: '#f87171',
    };
    ind.style.background = colors[status] || colors.disconnected;
}

function initWS() {
    if (!API_URL || !INIT_DATA) return;
    updateWSStatus('connecting');

    const url = API_URL.replace('https://', 'wss://')
                       .replace('http://', 'ws://')
                       + '/ws?init_data=' + encodeURIComponent(INIT_DATA);

    try {
        ws = new WebSocket(url);
    } catch (e) {
        updateWSStatus('disconnected');
        return;
    }

    ws.onopen = () => {
        console.log('[WS] connected');
        wsReconnectAttempts = 0;
        updateWSStatus('online');
        try { ws.send(JSON.stringify({ type: 'subscribe' })); } catch (e) {}

        clearInterval(wsHeartbeatTimer);
        wsHeartbeatTimer = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                try { ws.send(JSON.stringify({ type: 'ping' })); } catch (e) {}
            }
        }, 20000);
    };

    ws.onmessage = (e) => {
        try {
            const data = JSON.parse(e.data);
            if (data.type === 'pong') return;
            handleWSEvent(data);
        } catch (err) {}
    };

    ws.onclose = () => {
        updateWSStatus('disconnected');
        clearInterval(wsHeartbeatTimer);
        wsReconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(1.5, wsReconnectAttempts - 1), 10000);
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = setTimeout(initWS, delay);
    };

    ws.onerror = () => updateWSStatus('disconnected');
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wsStatus !== 'online') {
        wsReconnectAttempts = 0;
        initWS();
    }
});

/* ============================================================
   РОУТЕР WS-СОБЫТИЙ
   ============================================================ */
function handleWSEvent(data) {
    if (data.type === 'balance' && typeof updateBalanceDisplay === 'function') {
        updateBalanceDisplay(data.value);
    }
    if (data.type === 'achievement_unlocked' && typeof onAchievementUnlocked === 'function') {
        onAchievementUnlocked(data);
    }
    if (data.type === 'player_joined' && typeof onPlayerJoined === 'function') {
        onPlayerJoined(data);
    }
    if (data.type === 'game_started' && typeof onGameStarted === 'function') {
        onGameStarted(data);
    }
    if (data.type === 'reaction' && typeof onReaction === 'function') {
        onReaction(data);
    }
    if (data.type === 'game_update') {
        if (currentScreen === 'poker' && typeof refreshGameState === 'function') refreshGameState();
        if (currentScreen === 'durak' && typeof refreshDurakState === 'function') refreshDurakState();
        if (currentScreen === 'mp-ttt' && typeof refreshMpTTT === 'function') refreshMpTTT();
    }
    if (data.type === 'room_closed') {
        toast('Комната закрыта', 3000);
        if (['poker', 'durak', 'mp-ttt'].includes(currentScreen)) go('home');
    }
    if (data.type === 'room_update') {
        if (currentScreen === 'poker' && typeof refreshGameState === 'function') refreshGameState();
        if (currentScreen === 'durak' && typeof refreshDurakState === 'function') refreshDurakState();
        if (currentScreen === 'mp-ttt' && typeof refreshMpTTT === 'function') refreshMpTTT();
    }
}