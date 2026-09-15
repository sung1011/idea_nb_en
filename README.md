# Star Words（星词岛）

给大约 5 岁孩子的 Vue 3 移动端 H5。每日主路径是 **动物岛**（Animals theme island）：先进入小岛大厅，再走完 **-at** 家族两关（读词钓鱼 / Word Fish → Echo Cave），收集星星。**字母工坊**、**单词图鉴**只是弱入口，不是每日作业。纯前端，无后端。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开终端里的本地地址（默认 `http://localhost:5173/idea_nb_en/`）。手机预览可用同一 Wi-Fi 下的局域网地址。

```bash
npm run build
```

产物在 `dist/`，可直接当静态页部署。`npm run preview` 可本地预览打包结果。

## 在线预览（GitHub Pages）

地址：https://sung1011.github.io/idea_nb_en/

推到 `main` 后，GitHub Actions 会自动构建并发布。仓库需在 **Settings → Pages → Source** 选一次 **GitHub Actions**（若还没选过）。

## 玩法一览（试玩全部玩法）

1. 打开首页，点「玩法一览」（在「去动物岛」下面）。首页弱入口还可进「单词图鉴」。
2. 列表里有 7 种玩法，点「试玩」进入该关。
3. 试玩带 `?demo=1`，完成后回一览，**不会**加当日星星或打卡。
4. 每日作业仍从「去动物岛」→「完整一日」走 读词钓鱼 → Echo Cave。

## MVP 覆盖

- **首页**：主按钮「去动物岛」；次入口「玩法一览」；弱入口「字母工坊 / 复习音族」「单词图鉴」
- **单词图鉴**：格子展示全部音族 target（含 `-ap` / `-an` 槽位）；已解锁显示 emoji + 英文，未解锁剪影问号；点已解锁词会 TTS 朗读。关卡里点对 / 翻对 / 点对地鼠 / 拖对 / 钓到 / 跟读通过即解锁，逛图鉴不加当日星星
- **动物岛大厅**：今日目标「帮小猫把 -at 朋友请来派对！」；进度 0/2；「完整一日」走原两关
- **玩法一览**：列出 7 种玩法，点进 demo 试玩，不加当日星星
- **读词钓鱼 / Word Fish**：池塘里游着当前音族单词鱼（如 cat / hat / mat）；读出单词即挂钩吊进网里，点鱼或点喇叭也能玩；试玩不加星
- **Echo Cave**：TTS 范读后跟读；有 `SpeechRecognition` 就听，没有或失败可点「我说好了」
- **Flash Flip 闪卡翻翻**：先翻卡看图+词并听读（约 30–40 秒热身），再听词从干扰项里点对，3 轮；试玩不加星，点对解锁图鉴
- **Whack Word 地鼠词**：地鼠弹出图词，听目标词点对的那只；点对 4 次过关，点错轻晃不倒计时卡死；试玩不加星，点对解锁图鉴
- **Drag Sort 拖一拖**：读 cat / hat / mat，把纯英文单词芯片拖到对应图片篮子（篮子无中文，芯片无图；英语 TTS 演示）
- **Sing Along 唱一唱**：两句 chant 高亮，点「我唱好了」（不测音高）
- **Find Scene 找一找**：派对场景用 Pixi 画布点出 cat / hat / mat（Vue 壳保留；试玩不加星）
- **Day Complete**：庆祝派对成功，展示星星与解锁物，回首页
- **字母工坊**：列出 -at 词，可复习重玩两关；不发首次通关奖励
- **本地存储**：星星、贴纸、按日期重置的当日进度；图鉴解锁词存在 `starWords.atlas.v1`
- **数据驱动**：`src/data/phonicsFamily.ts` 已预留 `-ap` / `-an`，改 `currentFamilyId` 即可切换

游戏内角色口语以英语为主；家长说明用中文。点对 / 通关表扬从英语词库随机抽，不总是 Yes / Great job。没有红叉、没有失败卡死、没有比分。

## 技术

Vue 3 + Vite + TypeScript + Vue Router。状态用 composable + `localStorage`。语音用 Web Speech API（`speechSynthesis` / `SpeechRecognition`）。动效用 GSAP，短提示音用 Howler，拖一拖用 `@vueuse/gesture` 磁吸落篮。找一找与读词钓鱼用 PixiJS 画布，其它关仍是 Vue。
