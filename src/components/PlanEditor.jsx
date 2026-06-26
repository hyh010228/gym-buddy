// 创建/编辑训练计划
import React, { useState, useEffect } from 'react';

export default function PlanEditor({ plan, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (plan) {
      setName(plan.name || '');
      setExercises(plan.exercises || []);
    }
  }, [plan]);

  function addExercise() {
    setExercises([...exercises, { name: '', sets: 3, workSec: 45, restSec: 60 }]);
  }

  function updateExercise(idx, field, value) {
    const exs = [...exercises];
    exs[idx] = { ...exs[idx], [field]: value };
    setExercises(exs);
  }

  function removeExercise(idx) {
    setExercises(exercises.filter((_, i) => i !== idx));
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: plan?.id, name: name.trim(), exercises });
  }

  return (
    <div className="plan-editor">
      <input
        className="plan-name-input"
        type="text"
        placeholder="训练计划名称（如：推胸日）"
        value={name}
        onChange={e => setName(e.target.value)}
      />

      <div className="exercise-list">
        {exercises.map((ex, i) => (
          <div key={i} className="exercise-edit-card">
            <div className="exercise-edit-header">
              <input
                type="text"
                placeholder="动作名称"
                value={ex.name}
                onChange={e => updateExercise(i, 'name', e.target.value)}
              />
              <button className="btn-danger-sm" onClick={() => removeExercise(i)}>删除</button>
            </div>
            <div className="exercise-edit-fields">
              <label>组数 <input type="number" min={1} value={ex.sets} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 1)} /></label>
              <label>每组时长(秒) <input type="number" min={1} value={ex.workSec} onChange={e => updateExercise(i, 'workSec', parseInt(e.target.value) || 30)} /></label>
              <label>组间休息(秒) <input type="number" min={1} value={ex.restSec} onChange={e => updateExercise(i, 'restSec', parseInt(e.target.value) || 60)} /></label>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-add-exercise" onClick={addExercise}>+ 添加动作</button>

      <div className="plan-editor-actions">
        <button className="btn-primary" onClick={handleSave}>保存计划</button>
        <button className="btn-secondary" onClick={onCancel}>取消</button>
      </div>
    </div>
  );
}