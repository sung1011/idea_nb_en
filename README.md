# Star Words（星词岛）

给大约 5 岁孩子的 Vue 3 移动端 H5。每日主路径是 **动物岛**（Animals theme island）：先进入小岛大厅，再走完 **-at** 家族两关（Sound Fish → Echo Cave），收集星星。**字母工坊**只是弱复习入口，不是每日作业。纯前端，无后端。

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

## 玩法一览（试玩全部玩法）

1. 打开首页，点「玩法一览」（在「去动物岛」下面）。
2. 列表里有 6 种玩法，点「试玩」进入该关。
3. 试玩带 `?demo=1`，完成后回一览，**不会**加当日星星或打卡。
4. 每日作业仍从「去动物岛」→「完整一日」走 Sound Fish → Echo Cave。

## MVP 覆盖

- **首页**：主按钮「去动物岛」；次入口「玩法一览」；弱入口「字母工坊 / 复习音族」
- **动物岛大厅**：今日目标「帮小猫把 -at 朋友请来派对！」；进度 0/2；「完整一日」走原两关
- **玩法一览**：列出 6 种玩法，点进 demo 试玩，不加当日星星
- **Sound Fish**：听音素，在 Pixi 池塘里点字母泡泡；点错轻晃并重播；两次未中会一起过关；试玩不加星
- **Echo Cave**：TTS 范读后跟读；有 `SpeechRecognition` 就听，没有或失败可点「我说好了」
- **Tap Target 点一点**：听 “Where is the cat?”，在 3–4 个图里点对
- **Drag Sort 拖一拖**：读 cat / hat / mat，把纯英文单词芯片拖到对应图片篮子（篮子无中文，芯片无图；英语 TTS 演示）
- **Sing Along 唱一唱**：两句 chant 高亮，点「我唱好了」（不测音高）
- **Find Scene 找一找**：派对场景用 Pixi 画布点出 cat / hat / mat（Vue 壳保留；试玩不加星）
- **Day Complete**：庆祝派对成功，展示星星与解锁物，回首页
- **字母工坊**：列出 -at 词，可复习重玩两关；不发首次通关奖励
- **本地存储**：星星、贴纸、按日期重置的当日进度
- **数据驱动**：`src/data/phonicsFamily.ts` 已预留 `-ap` / `-an`，改 `currentFamilyId` 即可切换

游戏内角色口语以英语为主；家长说明用中文。没有红叉、没有失败卡死、没有比分。

## 技术

Vue 3 + Vite + TypeScript + Vue Router。状态用 composable + `localStorage`。语音用 Web Speech API（`speechSynthesis` / `SpeechRecognition`）。动效用 GSAP，短提示音用 Howler，拖一拖用 `@vueuse/gesture` 磁吸落篮。找一找与声音钓鱼用 PixiJS 画布，其它关仍是 Vue。
