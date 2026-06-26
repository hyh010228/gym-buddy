import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { savePlan, getAllPlans, deletePlan, setSetting, getSetting, getAllSettings, addHistoryEntry, getHistoryByDate, getAllHistoryDates, exportData, importData } from './src/utils/storage.js';

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); console.log(`OK ${name}`); passed++; }
  catch (e) { console.error(`FAIL ${name}:`, e.message); failed++; }
}

async function main() {
  await test('保存新计划', async () => {
    const p = await savePlan({ name: '推胸测试', exercises: [{ name: '卧推', sets: 3, workSec: 45, restSec: 60 }] });
    if (!p.id) throw new Error('id missing');
    console.log('   id:', p.id);
  });
  await test('读取计划', async () => {
    const all = await getAllPlans();
    if (all.length !== 1) throw new Error('count mismatch: ' + all.length);
  });
  await test('更新计划', async () => {
    const all = await getAllPlans();
    await savePlan({ ...all[0], name: '推胸修改' });
    const all2 = await getAllPlans();
    if (all2[0].name !== '推胸修改') throw new Error('name not updated');
  });
  await test('第二个计划', async () => {
    await savePlan({ name: '拉背日', exercises: [{ name: '引体向上', sets: 4, workSec: 30, restSec: 90 }] });
    if ((await getAllPlans()).length !== 2) throw new Error('count');
  });
  await test('删除计划', async () => {
    const all = await getAllPlans();
    await deletePlan(all[0].id);
    if ((await getAllPlans()).length !== 1) throw new Error('delete failed');
  });
  await test('设置读写', async () => {
    await setSetting('darkMode', false);
    if (await getSetting('darkMode') !== false) throw new Error('value mismatch');
  });
  await test('多设置', async () => {
    await setSetting('muted', true);
    const s = await getAllSettings();
    if (s.darkMode !== false) throw new Error('darkMode');
    if (s.muted !== true) throw new Error('muted');
  });
  await test('训练记录', async () => {
    const plans = await getAllPlans();
    const e = await addHistoryEntry({ planId: plans[0].id, planName: plans[0].name, exercise: '引体向上', setNumber: 1, duration: 30, completed: true });
    if (!e.id) throw new Error('id missing');
    console.log('   entry id:', e.id, 'date:', e.date);
  });
  await test('按日期查询', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const entries = await getHistoryByDate(today);
    if (entries.length < 1) throw new Error('no entries for today');
  });
  await test('日期列表', async () => {
    const dates = await getAllHistoryDates();
    if (dates.length === 0) throw new Error('empty dates');
    console.log('   dates:', dates.join(', '));
  });
  await test('导出导入', async () => {
    const data = await exportData();
    await importData(data);
    console.log('   plans:', data.plans.length, 'history:', data.history.length);
  });

  console.log('\n=== ' + passed + ' passed, ' + failed + ' failed ===');
  process.exit(failed > 0 ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(1); });
