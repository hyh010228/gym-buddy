// Vibration wrapper — degrades silently

export function vibrate(pattern) {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate(pattern);
}

export function vibrateShort() {
  vibrate(200);
}

export function vibrateAlert() {
  // 3 short pulses
  vibrate([150, 100, 150, 100, 150]);
}

export function isVibrateSupported() {
  return 'vibrate' in navigator;
}