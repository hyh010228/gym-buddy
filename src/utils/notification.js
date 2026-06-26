// Web Notification wrapper — degrades silently

export async function requestPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function sendNotification(title, options = {}) {
  if (!('Notification' in window)) return false;
  if (Notification.permission !== 'granted') return false;
  new Notification(title, {
    icon: '/icon-192.svg',
    tag: 'gym-timer',
    renotify: true,
    ...options,
  });
  return true;
}

export function isNotificationSupported() {
  return 'Notification' in window;
}