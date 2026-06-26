// Wake Lock (screen stay-on) wrapper

let wakeLockSentinel = null;

export async function requestWakeLock() {
  if (!('wakeLock' in navigator) || !navigator.wakeLock) return false;
  try {
    wakeLockSentinel = await navigator.wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => { wakeLockSentinel = null; });
    return true;
  } catch {
    return false;
  }
}

export async function releaseWakeLock() {
  if (wakeLockSentinel) {
    await wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}

export function isWakeLockSupported() {
  return 'wakeLock' in navigator && !!navigator.wakeLock;
}