// Audio abstraction — all sound goes through here
// iOS requires AudioContext resume on user gesture

let ctx = null;
let unlocked = false;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function unlockAudio() {
  if (unlocked) return;
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
  // 播放一个无声的短脉冲来完全解锁
  try { playSilent(0.01); } catch (_) {}
  unlocked = true;
}

function playSilent(duration) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start();
}

// ---- 不可听见的循环，防止锁屏冻结计时 ----
let keepAliveNode = null;

export function startKeepAlive() {
  if (keepAliveNode) return;
  const c = getCtx();
  // 创建 1 秒静音循环
  const buf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  keepAliveNode = c.createBufferSource();
  keepAliveNode.buffer = buf;
  keepAliveNode.loop = true;
  keepAliveNode.connect(c.destination);
  keepAliveNode.start();
}

export function stopKeepAlive() {
  if (keepAliveNode) {
    try { keepAliveNode.stop(); } catch (_) {}
    keepAliveNode = null;
  }
}

// ---- 提示音 ----
export function playBeep(freq = 880, duration = 0.15, type = 'square') {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  } catch (_) {}
}

export function playAlertSound() {
  playBeep(880, 0.12);
  setTimeout(() => playBeep(880, 0.12), 150);
  setTimeout(() => playBeep(880, 0.12), 300);
}

export function playCountdownSound() {
  playBeep(440, 0.08, 'sine');
}

export function isAudioSupported() {
  return !!(window.AudioContext || window.webkitAudioContext);
}