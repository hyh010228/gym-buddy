// 滚动轮盘时间选择器
import React, { useState, useRef, useCallback } from 'react';

const MIN_OPTIONS = [0, 1, 2, 3, 5, 10, 15, 20, 30];
const SEC_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

function closestIndex(options, value) {
  let idx = 0, diff = Infinity;
  for (let i = 0; i < options.length; i++) {
    const d = Math.abs(options[i] - value);
    if (d < diff) { diff = d; idx = i; }
  }
  return idx;
}

function Wheel({ options, selectedIdx, onSelect, disabled }) {
  const listRef = useRef(null);
  const [touchStartY, setTouchStartY] = useState(null);

  const handleWheel = useCallback((e) => {
    if (disabled) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1;
    let next = selectedIdx + dir;
    if (next < 0) next = 0;
    if (next >= options.length) next = options.length - 1;
    if (next !== selectedIdx) onSelect(next);
  }, [selectedIdx, options.length, onSelect, disabled]);

  const handleTouchStart = useCallback((e) => {
    if (disabled) return;
    setTouchStartY(e.touches[0].clientY);
  }, [disabled]);

  const handleTouchEnd = useCallback((e) => {
    if (disabled || touchStartY === null) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 20) {
      const dir = diff > 0 ? 1 : -1;
      let next = selectedIdx + dir;
      if (next < 0) next = 0;
      if (next >= options.length) next = options.length - 1;
      if (next !== selectedIdx) onSelect(next);
    }
    setTouchStartY(null);
  }, [disabled, touchStartY, selectedIdx, options.length, onSelect]);

  // 渲染：当前选中项在中间，前后各显示两项
  const visibleItems = [];
  for (let offset = -2; offset <= 2; offset++) {
    const idx = selectedIdx + offset;
    if (idx >= 0 && idx < options.length) {
      visibleItems.push({ idx, value: options[idx], offset });
    }
  }

  return (
    <div
      className="wheel"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="wheel-track">
        {visibleItems.map(({ idx, value, offset }) => (
          <div
            key={idx}
            className={`wheel-item ${offset === 0 ? 'wheel-selected' : ''} wheel-depth-${Math.abs(offset)}`}
            onClick={() => !disabled && onSelect(idx)}
          >
            {value}
          </div>
        ))}
      </div>
      <div className="wheel-highlight" />
    </div>
  );
}

export default function TimePicker({ onChange, initialSeconds = 90, disabled }) {
  const [minIdx, setMinIdx] = useState(() => closestIndex(MIN_OPTIONS, Math.floor(initialSeconds / 60)));
  const [secIdx, setSecIdx] = useState(() => closestIndex(SEC_OPTIONS, initialSeconds % 60));

  function handleMin(idx) {
    if (disabled) return;
    setMinIdx(idx);
    onChange(MIN_OPTIONS[idx] * 60 + SEC_OPTIONS[secIdx]);
  }

  function handleSec(idx) {
    if (disabled) return;
    setSecIdx(idx);
    onChange(MIN_OPTIONS[minIdx] * 60 + SEC_OPTIONS[idx]);
  }

  return (
    <div className="time-picker">
      <Wheel options={MIN_OPTIONS} selectedIdx={minIdx} onSelect={handleMin} disabled={disabled} />
      <div className="picker-colon">:</div>
      <Wheel options={SEC_OPTIONS} selectedIdx={secIdx} onSelect={handleSec} disabled={disabled} />
    </div>
  );
}