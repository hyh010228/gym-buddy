// 训练历史记录
import React, { useState, useEffect, useCallback } from 'react';
import { getHistoryByDate, getAllHistoryDates } from '../utils/storage';
import Calendar from './Calendar';

export default function History() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [dateMap, setDateMap] = useState({});
  const [loading, setLoading] = useState(false);

  // 加载所有有数据的日期（给日历标点）
  const loadDateMap = useCallback(async () => {
    const dates = await getAllHistoryDates();
    const map = {};
    for (const d of dates) map[d] = true;
    setDateMap(map);
  }, []);

  // 加载选中日期的记录
  const loadEntries = useCallback(async (date) => {
    setLoading(true);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    const data = await getHistoryByDate(key);
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadDateMap(); }, [loadDateMap]);
  useEffect(() => { loadEntries(selectedDate); }, [selectedDate, loadEntries]);

  // 按计划名分组
  const grouped = {};
  for (const e of entries) {
    const key = e.planName || '未命名计划';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  return (
    <div className="history-page">
      <h2>📋 训练历史</h2>
      <Calendar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        hasDataMap={dateMap}
      />
      <div className="history-entries">
        <h3>
          {selectedDate.getFullYear()}-{String(selectedDate.getMonth() + 1).padStart(2, '0')}-{String(selectedDate.getDate()).padStart(2, '0')}
        </h3>
        {loading ? (
          <p className="empty-state">加载中...</p>
        ) : entries.length === 0 ? (
          <p className="empty-state">当天无训练记录</p>
        ) : (
          Object.entries(grouped).map(([plan, records]) => (
            <div key={plan} className="history-group">
              <h4>{plan}</h4>
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