// 简易日历组件 —— 选择日期查看历史
import React, { useState } from 'react';

function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export default function Calendar({ selectedDate, onSelectDate, hasDataMap }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const days = getMonthDays(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const cells = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  function isSelected(d) {
    if (!selectedDate) return false;
    const s = selectedDate;
    return s.getFullYear() === viewYear && s.getMonth() === viewMonth && s.getDate() === d;
  }

  function isToday(d) {
    return now.getFullYear() === viewYear && now.getMonth() === viewMonth && now.getDate() === d;
  }

  function dateKey(d) {
    return `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function goToday() {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  return (
    <div className="calendar">
      <div className="calendar-nav">
        <button onClick={prevMonth}>◀</button>
        <span>{viewYear}年 {viewMonth + 1}月</span>
        <button onClick={nextMonth}>▶</button>
        <button className="btn-today" onClick={goToday}>今天</button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
        {cells.map((d, i) => (
          <div
            key={i}
            className={`calendar-cell ${d ? 'clickable' : 'empty'} ${isSelected(d) ? 'selected' : ''} ${isToday(d) ? 'today' : ''} ${d && hasDataMap?.[dateKey(d)] ? 'has-data' : ''}`}
            onClick={() => d && onSelectDate(new Date(viewYear, viewMonth, d))}
          >
            {d || ''}
          </div>
        ))}
      </div>
    </div>
  );
}