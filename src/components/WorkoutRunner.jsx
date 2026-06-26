// 全屏训练计时主界面
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTimer } from '../hooks/useTimer';
import { unlockAudio, startKeepAlive, stopKeepAlive, playAlertSound, playCountdownSound, isAudioSupported } from '../utils/audio';
import { vibrateAlert, vibrateShort, isVibrateSupported } from '../utils/vibrate';
import { sendNotification, isNotificationSupported } from '../utils/notification';
import { requestWakeLock, releaseWakeLock, isWakeLockSupported } from '../utils/wakeLock';
import { notifyStart, notifyEnd } from '../utils/broadcast';
import { addHistoryEntry } from '../utils/storage';
import TimerRing from './TimerRing';

// 阶段枚举
const PHASE_WORK = 'work';     // 训练中
const PHASE_REST = 'rest';     // 组间休息
const PHASE_DONE = 'done';     // 全部完成

export default function WorkoutRunner({ plan, onFinish, onSkip, onQuit }) {
  const timer = useTimer();
  const planRef = useRef(plan);

  const [phase, setPhase] = useState(PHASE_WORK);
  const [exIdx, setExIdx] = useState(0);    // 当前动作索引
  const [setIdx, setSetIdx] = useState(0);   // 当前组号（从 0 开始）
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(isNotificationSupported());
  const [vibrateEnabled, setVibrateEnabled] = useState(isVibrateSupported());

  const ex = plan.exercises[exIdx];
  const currentDuration = phase === PHASE_WORK ? ex?.workSec : ex?.restSec;

  // 开始
  function doStart() {
    unlockAudio();
    startKeepAlive();
    notifyStart();
    if (isWakeLockSupported()) requestWakeLock();
    setStarted(true);
    timer.start(currentDuration);
  }

  // 计时完成回调
  const handleDone = useCallback(() => {
    if (!muted && isAudioSupported()) playAlertSound();
    if (!muted && vibrateEnabled && isVibrateSupported()) vibrateAlert();
    if (notifyEnabled) sendNotification('⏰ 计时结束', { body: phase === PHASE_WORK ? '该休息了 💨' : '准备下一组 💪' });

    if (phase === PHASE_WORK) {
      // 训练组完成 → 记记录
      addHistoryEntry({
        planId: planRef.current.id,
        planName: planRef.current.name,
        exercise: ex.name,
        setNumber: setIdx + 1,
        duration: ex.workSec,
        completed: true,
      });
      // 进入休息
      setPhase(PHASE_REST);
      timer.resetDone();
    } else {
      // 休息结束 → 下一组
      if (setIdx + 1 < ex.sets) {
        setSetIdx(s => s + 1);
        setPhase(PHASE_WORK);
        timer.resetDone();
      } else if (exIdx + 1 < planRef.current.exercises.length) {
        // 下一个动作
        setExIdx(i => i + 1);
        setSetIdx(0);
        setPhase(PHASE_WORK);
        timer.resetDone();
      } else {
        // 全部完成
        setPhase(PHASE_DONE);
      }
    }
  }, [phase, ex, setIdx, exIdx, timer, muted, vibrateEnabled, notifyEnabled]);

  // 上一次 state 变化检测 done
  const prevState = useRef('idle');
  useEffect(() => {
    if (prevState.current !== 'done' && timer.state === 'done') {
      handleDone();
    }
    prevState.current = timer.state;
  }, [timer.state, handleDone]);

  // 自动开始下一段（handleDone 会 resetDone，这里重新启动）
  useEffect(() => {
    if (timer.state === 'idle' && started && phase !== PHASE_DONE) {
      const dur = phase === PHASE_WORK ? plan.exercises[exIdx]?.workSec : plan.exercises[exIdx]?.restSec;
      if (dur > 0) {
        timer.start(dur);
      }
    }
  }, [timer.state, started, phase, exIdx]);

  // 跳过当前组 → 直接记"跳过"
  function handleSkip() {
    if (phase === PHASE_WORK) {
      addHistoryEntry({
        planId: planRef.current.id,
        planName: planRef.current.name,
        exercise: ex.name,
        setNumber: setIdx + 1,
        duration: ex.workSec,
        completed: false,
      });
    }
    timer.stop();
    // 推进到下一段
    if (setIdx + 1 < ex.sets) {
      setSetIdx(s => s + 1);
      setPhase(PHASE_WORK);
    } else if (exIdx + 1 < plan.exercises.length) {
      setExIdx(i => i + 1);
      setSetIdx(0);
      setPhase(PHASE_WORK);
    } else {
      setPhase(PHASE_DONE);
    }
    onSkip?.();
  }

  // 结束训练
  function handleQuit() {
    timer.stop();
    stopKeepAlive();
    releaseWakeLock();
    notifyEnd();
    onQuit?.();
  }

  // 背景色
  let bgClass = 'bg-work';
  if (phase === PHASE_REST) bgClass = 'bg-rest';
  if (timer.state === 'done') bgClass = 'bg-alert';

  // 全部完成界面
  if (phase === PHASE_DONE) {
    return (
      <div className="workout-runner bg-done">
        <div className="done-screen">
          <h1>🎉 训练完成！</h1>
          <p>所有动作已完成，干得漂亮 💪</p>
          <button className="btn-primary btn-big" onClick={() => { stopKeepAlive(); releaseWakeLock(); notifyEnd(); onFinish?.(); }}>
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`workout-runner ${bgClass}`}>
      {/* 顶部信息 */}
      <div className="workout-header">
        <h3>{plan.name}</h3>
        <div className="workout-progress">
          {ex?.name} · 第{setIdx + 1}/{ex?.sets}组 · {phase === PHASE_WORK ? '💪 训练' : '😮‍💨 休息'}
        </div>
      </div>

      {/* 倒计时环 */}
      {started ? (
        <TimerRing
          progress={timer.progress}
          remaining={timer.remaining}
          state={timer.state}
          label={phase === PHASE_WORK ? '训练中' : '休息中'}
          subLabel={`${ex?.name} ${setIdx + 1}/${ex?.sets}`}
        />
      ) : (
        <div className="timer-ready">
          <h2>{formatSec(currentDuration)}</h2>
          <p>{ex?.name} · 第{setIdx + 1}/{ex?.sets}组</p>
          <p className="phase-hint">{phase === PHASE_WORK ? '准备好就开始' : '休息时间'}</p>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="workout-controls">
        {!started ? (
          <button className="btn-primary btn-big" onClick={doStart}>▶ 开始</button>
        ) : timer.state === 'running' ? (
          <button className="btn-secondary btn-big" onClick={timer.pause}>⏸ 暂停</button>
        ) : timer.state === 'paused' ? (
          <>
            <button className="btn-primary btn-big" onClick={timer.resume}>▶ 继续</button>
            <button className="btn-danger btn-big" onClick={handleSkip}>⏭ 跳过</button>
          </>
        ) : null}
        <button className="btn-quit" onClick={handleQuit}>结束训练</button>
      </div>

      {/* 小开关栏 */}
      <div className="runner-toggles">
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