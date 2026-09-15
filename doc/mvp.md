# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 动效 / 音效 / 拖拽：GSAP、Howler、`@vueuse/gesture`
- 找一找 / 读词钓鱼：PixiJS 画布嵌在 Vue 壳里（不整站换引擎，不用 Phaser）
- 无后端；进度在 `localStorage` 键 `starWords.v1`；单词图鉴解锁在 `starWords.atlas.v1`
- 静态托管：Vite `base` 为 `/idea_nb_en/`，hash 路由；`main` 推送后由 GitHub Actions 发到 GitHub Pages
- TTS：`speechSynthesis`；读词钓鱼 / 回音洞：`SpeechRecognition`（不可用则点按通过）
- 点对 / 通关英语表扬从 `src/data/praisePhrases.ts` 随机抽（点对一步 / 通关 / 轻提示三套），尽量不连说同一句；中文外壳不动
- 无插画资源：emoji + CSS 形状

## 信息架构

每日主路径 = **主题岛**（第一座：动物岛）。每座岛复用同一套受保护的自然拼读两关。

首页 → 动物岛大厅 → 读词钓鱼（Word Fish） → Echo Cave → Day Complete → 回首页

**字母工坊**是弱复习入口，不是每日作业。工坊可重玩 `-at` 两关，但带 `?review=1`，不写入首次通关星星 / 贴纸 / 打卡。

**单词图鉴**也是弱入口（首页，挨着字母工坊 / 玩法一览），不走每日强制路径。格子里放出 `phonicsFamily` 全部家族 `targets`（当前 `-at` 的 cat / hat / mat，以及配置里已有的 `-ap` / `-an`）。已解锁：emoji + 英文单词；未解锁：剪影 + 问号。点已解锁词会用现有 TTS 朗读，并有 Howler pop / GSAP pulse；卡片上不写中文。任意关卡里该词首次成功使用即解锁并写入本地：闪卡翻翻点对、地鼠词点对、拖一拖拖对、钓鱼钓到、回音洞跟读通过；找一找点中也算成功使用。逛图鉴、解锁本身都不发当日星星。

**玩法一览**列出 7 种玩法（原两关 + 闪卡翻翻 / 地鼠词 / 拖一拖 / 唱一唱 / 找一找）。一览试玩带 `?demo=1`，只庆祝、不加当日星星。动物岛主按钮「完整一日」仍只走原两关。点一点已移除。

**Flash Flip（闪卡翻翻）**是约 30–40 秒的词汇热身：三张家族词卡（cat / hat / mat）先翻开出图+英文并 TTS 读词，再听词在干扰项里点对，共 3 轮。点错轻晃再问，没有红叉。试玩走 `?demo=1`，不加当日星星；点对解锁单词图鉴。

**Whack Word（地鼠词）**是约 45–60 秒的点选关：草地点洞弹出带图单词地鼠，系统读目标词，孩子点对的那只。每波 3 只（目标 + 干扰），点对 4 次过关；点错轻晃再读，没有倒计时卡死。试玩走 `?demo=1`，不加当日星星；点对解锁单词图鉴。

**Drag Sort（拖一拖）**是认词关，不是分类关：篮子只放图片（emoji / CSS 篮子），芯片只放英文单词（cat / hat / mat）。孩子读出单词后拖到对应图片。开场只用英语 TTS（例如读 “cat” 并短暂脉冲猫篮子），没有中文操作说明。拖拽用 `@vueuse/gesture`，靠近篮子会磁吸，松手吸附进篮；拖错轻晃并再读单词、点亮正确篮子，不出现红叉。试玩仍走 `?demo=1`。

**Find Scene（找一找）**在 Vue 壳里嵌 Pixi 画布：派对场景点出 cat / hat / mat。目标会轻轻浮动；点对发光加星标并读词，点到树/气球/礼物或空地轻轻提醒。试玩走 `?demo=1`，不加当日星星。不把整站改成 Pixi。

**读词钓鱼（Word Fish）**同样用 Pixi 池塘画布：当前音族 `targets`（如 cat / hat / mat）各是一条带英文单词的鱼，鱼身不写中文。孩子读出某个还在池里的词，就挂钩吊进网里；全部钓完过关。有 `SpeechRecognition` 时宽松匹配剩余单词（与回音洞同一套 loose 规则）；没麦克风或没听清可点鱼钓上来，也可点鱼上的喇叭先听 TTS。读错只轻晃再提示，没有红叉、不扣分。每日路径首次通关 +1 星；`?demo=1` / `?review=1` 不加星。路由仍为 `/sound-fish`。

当日两关进度按本地日期重置。每日路径里重复玩同一关不再加星。

## 音族配置

`src/data/phonicsFamily.ts` 为数据源。动物岛默认使用 `-at`：

```ts
{
  family: "-at",
  targets: ["cat", "hat", "mat"],
  distractors: ["s", "b", "p", "t", "d", "r"],
  warmupPhonemes: [
    { ipa: "/k/", letter: "K", speak: "k" },
    { ipa: "/h/", letter: "H", speak: "h" },
    { ipa: "/m/", letter: "M", speak: "m" }
  ]
}
```

叙事：小猫是派对主人；hat / mat 是派对道具，不是动物。

同文件已写好 `-ap` / `-an`。切换：改 `currentFamilyId`。读词钓鱼只用 `targets`；`warmupPhonemes` 仍留在配置里，本关不再走音素试次。

## 两关奖励

| 关卡 | 行为要点 | 奖励 |
| --- | --- | --- |
| 读词钓鱼 / Word Fish | 读出或点中池里全部单词鱼；挂钩吊进网 | +1 星，贴纸「派对耳朵」 |
| Echo Cave | 听后跟读；识别宽松成功；永远可点「我说好了」 | +1 星，当日目标完成，打卡天数 +1 |

奖励 id 仍为 `ear`，避免旧存档失效。旧存档里的 `rug` 不再展示。无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置
src/data/praisePhrases.ts      英语表扬词库（点对 / 通关 / 轻提示）
src/composables/useProgress.ts 星星 / 贴纸 / 当日进度
src/composables/useWordAtlas.ts 单词图鉴解锁（localStorage）
src/composables/usePlayMode.ts 每日路径 / 工坊复习模式
src/composables/useSpeech.ts   TTS
src/composables/useSfx.ts      Howler 点按 / 成功 / 轻晃
src/composables/useMotion.ts   GSAP shake / pulse / celebrate
src/composables/useDragSnap.ts 拖一拖磁吸落篮
src/composables/useRecognition.ts 跟读识别
src/data/playGallery.ts        玩法一览条目
src/views/homeView.vue         首页（去动物岛 + 玩法一览 + 弱工坊 / 图鉴）
src/views/animalIslandView.vue 动物岛大厅（完整一日）
src/views/letterWorkshopView.vue 字母工坊复习页
src/views/wordAtlasView.vue    单词图鉴
src/views/playGalleryView.vue  玩法一览
src/views/flashFlipView.vue    闪卡翻翻
src/views/whackWordView.vue    地鼠词
src/components/findSceneStage.vue 找一找 Pixi 场景
src/components/soundFishStage.vue 读词钓鱼 Pixi 池塘
src/views/*.vue                七种玩法 + Day Complete
```

## 未做（按规格）

- 第二座主题岛
- 完整工坊体验
- 真唱音高打分
- 拼读前的独立热身路径（闪卡翻翻已作为一览热身关）
- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
