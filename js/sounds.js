/* ============================================================
   SOUNDS (Web Audio API, синтез)
   ============================================================ */

let audioCtx = null;
let audioReady = false;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioReady = true;
    } catch (e) {
        console.warn('Audio не поддерживается', e);
    }
}

function playTone(freq, duration = 0.08, type = 'sine', volume = 0.08) {
    if (!audioCtx) return;
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { /* ignore */ }
}

const sounds = {
    click: () => playTone(700, 0.04, 'sine', 0.06),
    success: () => {
        playTone(523, 0.08, 'sine', 0.08);
        setTimeout(() => playTone(659, 0.08, 'sine', 0.08), 70);
        setTimeout(() => playTone(784, 0.12, 'sine', 0.08), 140);
    },
    fail: () => {
        playTone(280, 0.12, 'sawtooth', 0.06);
        setTimeout(() => playTone(180, 0.18, 'sawtooth', 0.06), 100);
    },
    win: () => {
        playTone(523, 0.1, 'sine', 0.1);
        setTimeout(() => playTone(659, 0.1, 'sine', 0.1), 90);
        setTimeout(() => playTone(784, 0.1, 'sine', 0.1), 180);
        setTimeout(() => playTone(1047, 0.25, 'sine', 0.1), 280);
    },
    lose: () => {
        playTone(400, 0.15, 'sawtooth', 0.08);
        setTimeout(() => playTone(320, 0.15, 'sawtooth', 0.08), 130);
        setTimeout(() => playTone(220, 0.3, 'sawtooth', 0.08), 260);
    },
    card: () => playTone(900, 0.025, 'triangle', 0.05),
    chip: () => playTone(1100, 0.04, 'square', 0.06),
    notification: () => {
        playTone(880, 0.07, 'sine', 0.07);
        setTimeout(() => playTone(1174, 0.1, 'sine', 0.07), 90);
    },
};

function sfx(type) {
    if (!audioReady) return;
    (sounds[type] || sounds.click)();
}