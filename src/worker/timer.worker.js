// Web Worker timer — Date.now() based, not setInterval
// Receives { type: 'start', duration, interval } from main thread
// Posts { type: 'tick', remaining, elapsed } every ~100ms

let timerId = null;
let startTime = 0;
let duration = 0;

function tick() {
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, duration - elapsed);
  self.postMessage({ type: 'tick', remaining, elapsed });

  if (remaining <= 0) {
    self.postMessage({ type: 'done', elapsed });
    stop();
    return;
  }

  timerId = setTimeout(tick, 100);
}

function stop() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

self.onmessage = (e) => {
  const { type, duration: dur } = e.data;
  switch (type) {
    case 'start':
      duration = dur * 1000;
      startTime = Date.now();
      stop();
      tick();
      break;
    case 'stop':
      stop();
      self.postMessage({ type: 'stopped', remaining: Math.max(0, duration - (Date.now() - startTime)) });
      break;
    case 'pause':
      stop();
      const remaining = Math.max(0, duration - (Date.now() - startTime));
      self.postMessage({ type: 'paused', remaining });
      break;
    case 'resume':
      duration = e.data.remaining;
      startTime = Date.now();
      tick();
      break;
  }
};