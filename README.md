# 健身伴侣 (Gym Buddy)

智能训练计时器 PWA · 组间歇倒计时 + 训练计划 + 历史记录

## 功能

- **训练计划**：创建/编辑动作、组数、每组时长、组间休息
- **全屏计时**：圆形倒计时环，训练(蓝)/休息(橙)/警告(红) 三态切换
- **自动流转**：计时结束自动记一组 → 自动进入休息 → 自动下一组
- **多标签防护**：同一时间只能一个训练进行
- **离线可用**：Service Worker + IndexedDB，首次访问后无网络也能用
- **日历历史**：按日期查看训练记录

## 技术栈

React + Vite + IndexedDB (idb) + Web Worker + Service Worker

## 开发

```bash
npm install
npm run dev       # http://localhost:3000
```

## 构建

```bash
npm run build     # 输出到 dist/
npm run preview   # 预览构建产物
```

## 部署

`dist/` 目录可以部署到任意静态托管：Railway、Vercel、Netlify、GitHub Pages。

## Capacitor 打包 (iOS / Android)

### 1. 初始化

```bash
npm run build
npx cap init "健身伴侣" "com.yourid.gymbuddy" --web-dir=dist
npx cap add android
npx cap add ios
```

### 2. 设备功能映射

| Web API | Capacitor 插件（可选替代） |
|---|---|
| `AudioContext` | 无需替代，Capacitor 原生支持 |
| `Notification` | `@capacitor/local-notifications` |
| `navigator.vibrate` | `@capacitor/haptics` |
| `navigator.wakeLock` | `@capacitor/screen-orientation` + `@capacitor/keep-awake` |

### 3. 同步并运行

```bash
npx cap sync
npx cap open android   # 或 ios
```

## 许可证

MIT