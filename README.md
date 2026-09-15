# Star Words（星词岛）

给大约 5 岁孩子的 Vue 3 移动端 H5：每天走完 **-at** 家族三关（Sound Fish → Word Morph → Echo Cave），收集星星，装点小岛。纯前端，无后端。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端里的本地地址（默认 `http://localhost:5173`）。手机预览可用同一 Wi-Fi 下的局域网地址。

```bash
npm run build
```

产物在 `dist/`，可直接当静态页部署。`npm run preview` 可本地预览打包结果。

## MVP 覆盖

- **小岛首页**：标题、今日目标、星星、三关进度、开始/继续
- **Sound Fish**：听音素，点字母泡泡；点错轻晃并重播；两次未中会一起过关
- **Word Morph**：锁住 `a` `t`，只换首字母：cat → hat → mat → cat
- **Echo Cave**：TTS 范读后跟读；有 `SpeechRecognition` 就听，没有或失败可点「我说好了」
- **Day Complete**：庆祝、展示星星与解锁物，回小岛
- **本地存储**：星星、装饰/贴纸、按日期重置的当日进度
- **数据驱动**：`src/data/phonicsFamily.ts` 已预留 `-ap` / `-an`，改 `currentFamilyId` 即可切换

游戏内角色口语以英语为主；家长说明用中文。没有红叉、没有失败卡死、没有比分。

## 技术

Vue 3 + Vite + TypeScript + Vue Router。状态用 composable + `localStorage`。语音用 Web Speech API（`speechSynthesis` / `SpeechRecognition`）。
