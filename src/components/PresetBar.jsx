// 自定义计时预设按钮栏 —— 添加/点按/长按删除
import React, { useState } from 'react';

const DEFAULT_PRESETS = [30, 60, 90, 120, 180];

export default function PresetBar({ presets, onSelect, onAdd, onDelete, disabled }) {
  const [adding, setAdding] = useState(false);
  const [customMin, setCustomMin] = useState(1);
  const [customSec, setCustomSec] = useState(30);
  const [deleteMode, setDeleteMode] = useState(false);

  function handleClick(seconds) {
    if (disabled) return;
    if (deleteMode) {
      if (window.confirm(`删除预设 ${seconds}秒？`)) {
        onDelete(seconds);
      }
      setDeleteMode(false);
    } else {
      onSelect(seconds);
    }
  }

  function handleAdd() {
    const total = customMin * 60 + customSec;
    if (total < 3) return;
    onAdd(total);
    setAdding(false);
    setCustomMin(1);
    setCustomSec(30);
  }

  const list = presets || DEFAULT_PRESETS;

  return (
    <div className="preset-bar">
      <div className="preset-buttons">
        {list.map(s => {
          const m = Math.floor(s / 60);
          const sec = s % 60;
          const label = m > 0 ? `${m}′${sec > 0 ? sec + '″' : ''}` : `${sec}″`;
          return (
            <button
              key={s}
              className={`preset-btn ${deleteMode ? 'preset-delete-mode' : ''}`}
              onClick={() => handleClick(s)}
              disabled={disabled}
            >
              {deleteMode ? `✕ ${label}` : label}
            </button>
          );
        })}
        {!adding && !deleteMode && (
          <button className="preset-btn preset-add" onClick={() => setAdding(true)} disabled={disabled}>
            + 自定义
          </button>
        )}
        {!adding && (
          <button
            className={`preset-btn preset-edit ${deleteMode ? 'preset-edit-active' : ''}`}
            onClick={() => setDeleteMode(!deleteMode)}
            disabled={disabled}
          >
            {deleteMode ? '✓ 完成' : '✏ 编辑'}
          </button>
        )}
      </div>
      {adding && (
        <div className="preset-add-row">
          <input type="number" value={customMin} min={0} onChange={e => setCustomMin(parseInt(e.target.value) || 0)} /> 分
          <input type="number" value={customSec} min={0} max={59} onChange={e => setCustomSec(parseInt(e.target.value) || 0)} /> 秒
          <button onClick={handleAdd}>✓</button>
          <button onClick={() => setAdding(false)}>✕</button>
        </div>
      )}
    </div>
  );
}