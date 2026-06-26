// 圆形倒计时进度环
import React from 'react';

function formatTime(ms) {
  const s = Math.ceil(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function TimerRing({ progress, remaining, state, label, subLabel }) {
  // SVG circle params
  const r = 120;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - progress);

  // color by state
  let strokeColor = '#4ade80'; // running
  if (state === 'done') strokeColor = '#f87171';
  else if (state === 'paused') strokeColor = '#fbbf24';
  else if (state === 'idle') strokeColor = '#333';

  let pulseClass = '';
  if (state === 'done') pulseClass = 'ring-pulse-red';
  else if (remaining < 4000 && state === 'running') pulseClass = 'ring-pulse-warn';

  return (
    <div className="timer-ring-container">
      <svg viewBox="0 0 300 300" className="timer-ring-svg">
        {/* bg track */}
        <circle cx="150" cy="150" r={r} fill="none" stroke="#1e1e1e" strokeWidth="12" />
        {/* progress arc */}
        <circle
          cx="150" cy="150" r={r} fill="none"
          stroke={strokeColor} strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={pulseClass}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '150px 150px', transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
        />
        {/* center text */}
        <text x="150" y="140" textAnchor="middle" fill="#fff" fontSize="48" fontWeight="700" fontFamily="-apple-system, sans-serif">
          {formatTime(remaining)}
        </text>
        {label && (
          <text x="150" y="175" textAnchor="middle" fill="#888" fontSize="16" fontWeight="500" fontFamily="-apple-system, sans-serif">
            {label}
          </text>
        )}
        {subLabel && (
          <text x="150" y="200" textAnchor="middle" fill="#555" fontSize="13" fontFamily="-apple-system, sans-serif">
            {subLabel}
          </text>
        )}
      </svg>
    </div>
  );
}