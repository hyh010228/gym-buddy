// 训练页面：计划 + 日历 + 历史记录
import React, { useState, useEffect, useCallback } from 'react';
import { getHistoryByDate, getAllHistoryDates } from '../utils/storage';
import Calendar from './Calendar';

export default function WorkoutPage({ plans, onStartPlan, onCreatePlan, onEditPlan, onDeletePlan }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [dateMap, setDateMap] = useState({});
  const [expandedDate, setExpandedDate] = useState(null); // 展开的日期 key

  const loadDateMap = useCallback(async () => {
    const dates = await getAllHistoryDates();
    const map = {};
    for (const d of dates) map[d] = true;
    setDateMap(map);
  }, []);

  const loadEntries = useCallback(async (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const data = await getHistoryByDate(key);
    setEntries(data);
    setExpandedDate(key);
  }, []);

  useEffect(() => { loadDateMap(); }, [loadDateMap]);
  useEffect(() => { loadEntries(selectedDate); }, [selectedDate, loadEntries]);

  function handleSelectDate(date) {
    setSelectedDate(date);
    // 不在每次选日期时立刻展开——由用户点击日期触发
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 分组
  const grouped = {};
  for (const e of entries) {
    const k = e.planName || '未命名';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(e);
  }

  return (
    <div className="workout-page">
      {/* 训练计划 */}
      <h2>💪 训练计划</h2>
      <div className="plan-section">
        {plans.length === 0 ? (
          <div className="empty-state">
            <p>还没有训练计划</p>
            <button className="btn-primary" onClick={onCreatePlan}>创建计划</button>
          </div>
        ) : (
          <>
            {plans.map(p => (
              <div key={p.id} className="plan-card">
                <div className="plan-card-header">
                  <h3>{p.name}</h3>
                  <div className="plan-card-actions">
                    <button className="btn-mini" onClick={() => onEditPlan(p)}>编辑</button>
                    <button className="btn-mini-danger" onClick={() => { if (window.confirm('删除？')) onDeletePlan(p.id); }}>删除</button>
                  </div>
                </div>
                <div className="plan-card-exercises">
                  {p.exercises.map((ex, i) => (
                    <div key={i} className="plan-exercise-row">
                      <span className="plan-ex-name">{ex.name}</span>
                      <span className="plan-ex-detail">{ex.sets}组 × {ex.workSec}s / 休息 {ex.restSec}s</span>
                    </div>
                  ))}
                </div>
                <button className="btn-primary btn-start-plan" onClick={() => onStartPlan(p)}>▶ 开始训练</button>
              </div>
            ))}
            <button className="btn-add-plan" onClick={onCreatePlan}>+ 新建计划</button>
          </>
        )}
      </div>

      {/* 日历 */}
      <h2>📅 训练日历</h2>
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        hasDataMap={dateMap}
      />

      {/* 当天记录 */}
      <div className="day-entries">
        <h3>{dateKey(selectedDate)}</h3>
        {entries.length === 0 ? (
          <p className="empty-state">当天无训练记录</p>
        ) : (
          Object.entries(grouped).map(([planName, records]) => (
            <div key={planName} className="history-group">
              <h4>{planName}</h4>
              {records.map(r => (
                <div key={r.id} className="history-row">
                  <span>{r.exercise} · 第{r.setNumber}组</span>
                  <span>{r.duration}s {r.completed ? '✅' : '⏭ 跳过'}</span>
                  <span className="history-time">
                    {new Date(r.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}