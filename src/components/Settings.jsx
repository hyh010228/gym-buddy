// 设置页面
import React, { useState, useEffect } from 'react';
import { getAllSettings, setSetting, exportData, importData } from '../utils/storage';

export default function Settings() {
  const [muted, setMuted] = useState(false);
  const [noVibrate, setNoVibrate] = useState(false);
  const [wakelock, setWakelock] = useState(true);
  // 用当前 body class 判断初始值，不从 IndexedDB 异步读，避免闪烁
  const isLight = document.body.classList.contains('light-mode');
  const [darkMode, setDarkMode] = useState(!isLight);

  useEffect(() => {
    (async () => {
      const s = await getAllSettings();
      if (s.muted !== undefined) setMuted(s.muted);
      if (s.noVibrate !== undefined) setNoVibrate(s.noVibrate);
      if (s.wakelock !== undefined) setWakelock(s.wakelock);
    })();
  }, []);

  async function update(key, value) {
    switch (key) {
      case 'muted': setMuted(value); break;
      case 'noVibrate': setNoVibrate(value); break;
      case 'wakelock': setWakelock(value); break;
      case 'darkMode':
        setDarkMode(value);
        if (value) document.body.classList.remove('light-mode');
        else document.body.classList.add('light-mode');
        break;
    }
    await setSetting(key, value);
  }

  async function handleExport() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gym-buddy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await importData(data);
        alert('导入成功！刷新页面以查看最新数据。');
      } catch {
        alert('导入失败：文件格式不正确');
      }
    };
    input.click();
  }

  return (
    <div className="settings-page">
      <h2>⚙ 设置</h2>

      <div className="settings-group">
        <label className="setting-row">
          <span>音效</span>
          <input type="checkbox" checked={!muted} onChange={e => update('muted', !e.target.checked)} />
        </label>
        <label className="setting-row">
          <span>震动</span>
          <input type="checkbox" checked={!noVibrate} onChange={e => update('noVibrate', !e.target.checked)} />
        </label>
        <label className="setting-row">
          <span>屏幕常亮</span>
          <input type="checkbox" checked={wakelock} onChange={e => update('wakelock', e.target.checked)} />
        </label>
      </div>

      <div className="settings-group">
        <h3>主题</h3>
        <div className="setting-row toggle-row" onClick={() => update('darkMode', !darkMode)}>
          <span>暗色模式</span>
          <div className={`toggle-switch ${darkMode ? 'on' : 'off'}`}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h3>数据管理</h3>
        <button className="btn-primary" onClick={handleExport}>导出数据 (JSON)</button>
        <button className="btn-secondary" onClick={handleImport}>导入数据 (JSON)</button>
      </div>

      <div className="settings-group">
        <h3>关于</h3>
        <p>健身伴侣 v3.1.0</p>
      </div>
    </div>
  );
}