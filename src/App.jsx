// 主 App
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAllPlans, savePlan, deletePlan, getSetting } from './utils/storage';
import { initBroadcast, onOtherTabEvent, closeBroadcast } from './utils/broadcast';
import { unlockAudio, startKeepAlive, stopKeepAlive, playAlertSound, isAudioSupported } from './utils/audio';
import { vibrateAlert, isVibrateSupported } from './utils/vibrate';
import { sendNotification, isNotificationSupported } from './utils/notification';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported } from './utils/wakeLock';
import { notifyStart, notifyEnd } from './utils/broadcast';
import { addHistoryEntry } from './utils/storage';
import { useTimer } from './hooks/useTimer';
import TimerRing from './components/TimerRing';
import PresetBar from './components/PresetBar';
import TimePicker from './components/TimePicker';
import WorkoutPage from './components/WorkoutPage';
import PlanEditor from './components/PlanEditor';
import WorkoutRunner from './components/WorkoutRunner';
import Settings from './components/Settings';
import './App.css';

const PRESETS_KEY = 'timer-presets';
const DEFAULT_PRESETS = [30, 60, 90, 120, 180];

// ==================== 计时器页面 ====================
function TimerPage({ onStartWorkout }) {
  const timer = useTimer();
  const [presets, setPresets] = useState(DEFAULT_PRESETS);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vibrateEnabled, setVibrateEnabled] = useState(isVibrateSupported());
  const [notifyEnabled, setNotifyEnabled] = useState(isNotificationSupported());
  const [duration, setDuration] = useState(90);

  // 加载自定义预设
  useEffect(() => {
    getSetting(PRESETS_KEY).then(v => {
      if (v) setPresets(v);
    });
  }, []);

    function handleTimeChange(seconds) {
    if (timer.state === 'running') return;
    setDuration(seconds);
    setStarted(false);
    timer.resetDone();
  }

  function handleSelectPreset(seconds) {
    handleTimeChange(seconds);
  }

  function handleAddPreset(seconds) {
    const newPresets = [...presets, seconds].sort((a, b) => a - b);
    setPresets(newPresets);
    import('./utils/storage').then(m => m.setSetting(PRESETS_KEY, newPresets));
  }

  function handleDeletePreset(seconds) {
    const newPresets = presets.filter(s => s !== seconds);
    setPresets(newPresets);
    import('./utils/storage').then(m => m.setSetting(PRESETS_KEY, newPresets));
  }

  function handleStart() {
    unlockAudio();
    startKeepAlive();
    if (isWakeLockSupported()) requestWakeLock();
    setStarted(true);
    timer.start(duration);
  }

  // 计时完成
  const prevState = useRef(null);
  const stateRef = useRef(timer.state);
  stateRef.current = timer.state;

  useEffect(() => {
    if (prevState.current === 'running' && timer.state === 'done') {
      if (!muted) playAlertSound();
      if (vibrateEnabled) vibrateAlert();
      if (notifyEnabled) sendNotification('⏰ 计时结束', { body: '时间到了 💪' });
    }
    prevState.current = timer.state;
  }, [timer.state, muted, vibrateEnabled, notifyEnabled]);

  function handleReset() {
    timer.stop();
    setStarted(false);
    stopKeepAlive();
    releaseWakeLock();
  }

  return (
    <div className="timer-page">
      <PresetBar
        presets={presets}
        onSelect={handleSelectPreset}
        onAdd={handleAddPreset}
        onDelete={handleDeletePreset}
        disabled={timer.state === 'running'}
      />
      {started ? (
        <TimerRing
          progress={timer.progress}
          remaining={timer.remaining}
          state={timer.state}
          label={timer.state === 'done' ? '时间到' : timer.state === 'paused' ? '已暂停' : '计时中'}
        />
      ) : (
        <>
          <TimePicker onChange={handleTimeChange} initialSeconds={duration} disabled={timer.state === 'running'} />
          <div className="timer-ready">
            <h2>{formatSec(duration)}</h2>
          </div>
        </>
      )}
      <div className="timer-page-controls">
        {!started ? (
          <button className="btn-primary btn-big" onClick={handleStart}>▶ 开始</button>
        ) : timer.state === 'running' ? (
          <div className="timer-run-btns">
            <button className="btn-secondary btn-big" onClick={timer.pause}>⏸ 暂停</button>
            <button className="btn-quit" onClick={handleReset}>↺ 复位</button>
          </div>
        ) : timer.state === 'paused' ? (
          <div className="timer-run-btns">
            <button className="btn-primary btn-big" onClick={timer.resume}>▶ 继续</button>
            <button className="btn-secondary btn-big" onClick={handleReset}>↺ 复位</button>
          </div>
        ) : timer.state === 'done' ? (
          <button className="btn-primary btn-big" onClick={handleReset}>↺ 再来一次</button>
        ) : null}
      </div>
      <div className="runner-toggles timer-toggles">
        {isAudioSupported() && (
          <label><input type="checkbox" checked={!muted} onChange={e => setMuted(!e.target.checked)} /> 声音</label>
        )}
        {isVibrateSupported() && (
          <label><input type="checkbox" checked={vibrateEnabled} onChange={e => setVibrateEnabled(e.target.checked)} /> 震动</label>
        )}
        {isNotificationSupported() && (
          <label><input type="checkbox" checked={notifyEnabled} onChange={e => setNotifyEnabled(e.target.checked)} /> 通知</label>
        )}
      </div>
    </div>
  );
}

function formatSec(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ==================== App ====================
export default function App() {
  const [page, setPage] = useState('timer');
  const [plans, setPlans] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [runningPlan, setRunningPlan] = useState(null);
  const [otherTabActive, setOtherTabActive] = useState(false);
  const [error, setError] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      setPlans(await getAllPlans());
    } catch (e) {
      setError(e.message || '加载失败');
      setPlans([]);
    }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  // 暗色模式
  useEffect(() => {
    getSetting('darkMode').then(v => {
      if (v === false) document.body.classList.add('light-mode');
    });
  }, []);

  // Broadcast
  useEffect(() => {
    initBroadcast();
    onOtherTabEvent(d => {
      if (d.type === 'workout-start') setOtherTabActive(true);
      else if (d.type === 'workout-end') setOtherTabActive(false);
    });
    return closeBroadcast;
  }, []);

  async function handleSavePlan(plan) {
    try {
      await savePlan(plan);
      setEditingPlan(null);
      loadPlans();
    } catch (e) {
      alert('保存失败: ' + e.message);
    }
  }

  async function handleDeletePlan(id) {
    await deletePlan(id);
    loadPlans();
  }

  function handleStartPlan(plan) {
    if (otherTabActive) {
      alert('另一个标签页正在训练中');
      return;
    }
    setRunningPlan(plan);
  }

  let content;
  if (runningPlan) {
    content = <WorkoutRunner plan={runningPlan} onFinish={() => { setRunningPlan(null); loadPlans(); }} onQuit={() => setRunningPlan(null)} />;
  } else if (editingPlan) {
    content = <PlanEditor plan={editingPlan} onSave={handleSavePlan} onCancel={() => setEditingPlan(null)} />;
  } else if (plans === null) {
    content = <div className="empty-state"><p>加载中...</p></div>;
  } else if (error) {
    content = <div className="empty-state"><p style={{ color: '#f87171' }}>⚠ {error}</p><button className="btn-primary" onClick={() => { setError(null); setPlans(null); loadPlans(); }}>重试</button></div>;
  } else switch (page) {
    case 'workout':
      content = <WorkoutPage plans={plans} onStartPlan={handleStartPlan} onCreatePlan={() => setEditingPlan({})} onEditPlan={setEditingPlan} onDeletePlan={handleDeletePlan} />;
      break;
    case 'settings':
      content = <Settings />;
      break;
    default:
      content = <TimerPage />;
  }

  const showNav = !runningPlan && !editingPlan;

  return (
    <div className="app">
      {otherTabActive && !runningPlan && <div className="other-tab-warning">⚠ 另一个标签页正在训练中</div>}
      <main className="app-main">{content}</main>
      {showNav && (
        <nav className="bottom-nav">
          <button className={`nav-btn ${page === 'timer' ? 'active' : ''}`} onClick={() => setPage('timer')}>⏱ 计时</button>
          <button className={`nav-btn ${page === 'workout' ? 'active' : ''}`} onClick={() => setPage('workout')}>💪 训练</button>
          <button className={`nav-btn ${page === 'settings' ? 'active' : ''}`} onClick={() => setPage('settings')}>⚙ 设置</button>
        </nav>
      )}
    </div>
  );
}