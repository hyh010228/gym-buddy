// BroadcastChannel for multi-tab workout guard

const CHANNEL_NAME = 'gym-buddy-workout';
let channel = null;

export function initBroadcast() {
  if (!('BroadcastChannel' in window)) return null;
  channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

// 通知其他标签页：这边开始训练了
export function notifyStart() {
  if (channel) channel.postMessage({ type: 'workout-start' });
}

// 通知其他标签页：这边训练结束了
export function notifyEnd() {
  if (channel) channel.postMessage({ type: 'workout-end' });
}

// 监听其他标签页的训练状态
export function onOtherTabEvent(handler) {
  if (!channel) return;
  channel.onmessage = (e) => handler(e.data);
}

export function closeBroadcast() {
  if (channel) { channel.close(); channel = null; }
}