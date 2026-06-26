const express = require('express');
const path = require('path');
const { initDb, query, run } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==================== API ====================

// 获取所有预设动作
app.get('/api/exercises', (req, res) => {
  const exercises = query('SELECT * FROM exercises ORDER BY name');
  res.json(exercises);
});

// 添加新动作
app.post('/api/exercises', (req, res) => {
  const { name, category } = req.body;
  if (!name) return res.status(400).json({ error: '名称不能为空' });
  run('INSERT INTO exercises (name, category) VALUES (?, ?)', [name, category || '']);
  const rows = query('SELECT * FROM exercises WHERE name = ? ORDER BY id DESC LIMIT 1', [name]);
  res.json(rows[0]);
});

// 删除动作
app.delete('/api/exercises/:id', (req, res) => {
  run('DELETE FROM exercises WHERE id = ?', [req.params.id]);
  run('DELETE FROM workouts WHERE exercise_id = ?', [req.params.id]);
  res.json({ ok: true });
});

// 添加训练记录
app.post('/api/workouts', (req, res) => {
  const { exercise_id, weight, reps, note } = req.body;
  if (!exercise_id) return res.status(400).json({ error: '缺少动作ID' });
  run('INSERT INTO workouts (exercise_id, weight, reps, note) VALUES (?, ?, ?, ?)',
    [exercise_id, weight || 0, reps || 0, note || '']);
  const rows = query('SELECT * FROM workouts ORDER BY id DESC LIMIT 1');
  res.json(rows[0]);
});

// 获取某个动作的训练历史
app.get('/api/workouts/:exerciseId', (req, res) => {
  const workouts = query(
    'SELECT * FROM workouts WHERE exercise_id = ? ORDER BY created_at DESC',
    [req.params.exerciseId]
  );
  res.json(workouts);
});

// 最近训练记录
app.get('/api/recent', (req, res) => {
  const recent = query(`
    SELECT w.*, e.name as exercise_name
    FROM workouts w
    JOIN exercises e ON w.exercise_id = e.id
    ORDER BY w.created_at DESC
    LIMIT 20
  `);
  res.json(recent);
});

// ==================== 启动 ====================
async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🏋️ 健身伴侣已启动`);
    console.log(`   本机: http://localhost:${PORT}`);
  });
}

start();