# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 无后端；进度在 `localStorage` 键 `starWords.v1`
- TTS：`speechSynthesis`；回音洞：`SpeechRecognition`（不可用则点按通过）
- 无插画资源：emoji + CSS 形状

## 信息架构

每日主路径 = **主题岛**（第一座：动物岛）。每座岛复用同一套受保护的自然拼读三关。

首页 → 动物岛大厅 → Sound Fish → Word Morph → Echo Cave → Day Complete → 回首页

**字母工坊**是弱复习入口，不是每日作业。工坊可重玩 `-at` 三关，但带 `?review=1`，不写入首次通关星星 / 贴纸 / 打卡。

**玩法一览**列出全部玩法（原三关 + 点一点 / 拖一拖 / 积木拼读 / 找尾巴 / 唱一唱 / 找一找）。一览试玩带 `?demo=1`，只庆祝、不加当日星星。动物岛主按钮「完整一日」仍只走原三关。

拖一拖（Drag Sort）是认词：篮子只有图片（cat / hat / mat），下方芯片只有英文词。开场英语 TTS 读 `cat` 并闪猫图。点错篮子轻晃并再读该词，不加中文说明、没有红叉。

当日三关进度按本地日期重置。每日路径里重复玩同一关不再加星。

## 音族配置

`src/data/phonicsFamily.ts` 为数据源。动物岛默认使用 `-at`：

```ts
{
  family: "-at",
  targets: ["cat", "hat", "mat"],
  onsetPool: ["c", "h", "m"],
  distractors: ["s", "b", "p", "t", "d", "r"],
  warmupPhonemes: [
    { ipa: "/k/", letter: "K", speak: "k" },
    { ipa: "/h/", letter: "H", speak: "h" },
    { ipa: "/m/", letter: "M", speak: "m" }
  ]
}
```

叙事：小猫是派对主人；hat / mat 是派对道具，不是动物。

同文件已写好 `-ap` / `-an`。切换：改 `currentFamilyId`。

## 三关奖励

| 关卡 | 行为要点 | 奖励 |
| --- | --- | --- |
| Sound Fish | 3 次音素试次；演示高亮一次；错 2 次自动带过 | +1 星，贴纸「派对耳朵」 |
| Word Morph | CVC 砖，`a`/`t` 锁定；cat→hat→mat→cat | +1 星，装饰「派对垫」 |
| Echo Cave | 听后跟读；识别宽松成功；永远可点「我说好了」 | +1 星，当日目标完成，打卡天数 +1 |

奖励 id 仍为 `ear` / `rug`，避免旧存档失效。无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置
src/composables/useProgress.ts 星星 / 装饰 / 当日进度
src/composables/usePlayMode.ts 每日路径 / 工坊复习模式
src/composables/useSpeech.ts   TTS + 轻提示音
src/composables/useRecognition.ts 跟读识别
src/data/playGallery.ts        玩法一览条目
src/views/homeView.vue         首页（去动物岛 + 玩法一览 + 弱工坊）
src/views/animalIslandView.vue 动物岛大厅（完整一日）
src/views/letterWorkshopView.vue 字母工坊复习页
src/views/playGalleryView.vue  玩法一览
src/views/*.vue                九种玩法 + Day Complete
```

## 未做（按规格）

- 第二座主题岛
- 完整工坊体验
- 真唱音高打分
- 拼读前的词汇热身关
- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
