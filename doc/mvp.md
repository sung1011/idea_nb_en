# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 无后端；进度在 `localStorage` 键 `starWords.v1`
- TTS：`speechSynthesis`；回音洞：`SpeechRecognition`（不可用则点按通过）
- 无插画资源：emoji + CSS 形状

## 每日闭环

小岛首页 → Sound Fish → Word Morph → Echo Cave → Day Complete → 回小岛

当日三关进度按本地日期重置。重复玩同一关不再加星。

## 音族配置

`src/data/phonicsFamily.ts` 为数据源。MVP 使用 `-at`：

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

同文件已写好 `-ap` / `-an`。切换：改 `currentFamilyId`。

## 三关奖励

| 关卡 | 行为要点 | 奖励 |
| --- | --- | --- |
| Sound Fish | 3 次音素试次；演示高亮一次；错 2 次自动带过 | +1 星，贴纸「耳朵」 |
| Word Morph | CVC 砖，`a`/`t` 锁定；cat→hat→mat→cat | +1 星，装饰「小地毯」 |
| Echo Cave | 听后跟读；识别宽松成功；永远可点「我说好了」 | +1 星，当日目标完成，打卡天数 +1 |

无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置
src/composables/useProgress.ts 星星 / 装饰 / 当日进度
src/composables/useSpeech.ts   TTS + 轻提示音
src/composables/useRecognition.ts 跟读识别
src/views/*.vue                五个屏幕
```

## 未做（按规格）

- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
