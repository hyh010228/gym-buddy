// 训练计划列表
import React from 'react';

export default function PlanList({ plans, onSelect, onCreate, onEdit, onDelete }) {
  if (!plans || plans.length === 0) {
    return (
      <div className="empty-state">
        <p>还没有训练计划</p>
        <button className="btn-primary" onClick={onCreate}>创建第一个计划</button>
      </div>
    );
  }

  return (
    <div className="plan-list">
      {plans.map(p => (
        <div key={p.id} className="plan-card">
          <div className="plan-card-header">
            <h3>{p.name}</h3>
            <div className="plan-card-actions">
              <button className="btn-mini" onClick={() => onEdit(p)}>编辑</button>
              <button className="btn-mini-danger" onClick={() => { if (window.confirm('删除此计划？')) onDelete(p.id); }}>删除</button>
            </div>
          </div>
          <div className="plan-card-exercises">
            {p.exercises.map((ex, i) => (
              <div key={i} className="plan-exercise-row">
                <span className="plan-ex-name">{ex.name}</span>
                <span className="plan-ex-detail">
                  {ex.sets}组 × {ex.workSec}s / 休息 {ex.restSec}s
                </span>
              </div>
            ))}
          </div>
          <button className="btn-primary btn-start-plan" onClick={() => onSelect(p)}>
            ▶ 开始训练
          </button>
        </div>
      ))}
      <button className="btn-add-plan" onClick={onCreate}>+ 新建计划</button>
    </div>
  );
}