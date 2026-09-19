# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 动效 / 音效 / 拖拽：GSAP、Howler、`@vueuse/gesture`
- 找一找 / 读词钓鱼：PixiJS 画布嵌在 Vue 壳里（不整站换引擎，不用 Phaser）
- 无后端；进度统一在 `localStorage` 键 `starWords.v2`（星星 / 贴纸 / 图鉴解锁 / 动物岛日格 / 当日任务）。启动时从 `starWords.v1` + `starWords.atlas.v1` 迁移，之后只读写 v2，避免两套互相覆盖
- 今日目标条：首页与动物岛大厅顶部展示一条主任务 + 可选焦点词 + **今日星星条**（4 颗空/实星）；缺省时按上海日历日写入 `mainTaskId=dailyChain`，并从 15 词库轮换 `focusWord`
- 静态托管：Vite `base` 为 `/idea_nb_en/`，hash 路由；`main` 推送后由 GitHub Actions 发到 GitHub Pages
- TTS：`speechSynthesis`；读词钓鱼 / 回音洞：`SpeechRecognition`（不可用则点按通过）
- 点对 / 通关英语表扬从 `src/data/praisePhrases.ts` 随机抽（点对一步 / 通关 / 轻提示三套），尽量不连说同一句；中文外壳不动
- 动物岛 15 词使用 Style-5 描边软陶词卡（`public/word-cards/{word}.webp`，512px 长边，路径走 Vite `base`）；无图或加载失败时回退 emoji / 文字

## 信息架构

每日主路径 = **主题岛**（第一座：动物岛）。动物岛「今日主线」走一条短链，进度写在 `today.chainStep`（`warmup | drag | fish | echo | complete`）。

首页 → 动物岛大厅 → 热身（闪卡翻翻 **或** 地鼠词，按上海日历日 `dateKey` 奇偶交替） → 拖一拖 → 读词钓鱼（Word Fish） → 回声跟读（Echo） → Day Complete → 回首页

当日偶数日热身走 `/flash-flip`，奇数日走 `/whack-word`。找一找 / 唱一唱只在玩法一览，不进主线。

**字母工坊**是弱复习入口，不是每日作业。工坊可重玩 `-at` 两关，但带 `?review=1`，不写入首次通关星星 / 贴纸 / 打卡。

**单词图鉴**也是弱入口（首页，挨着字母工坊 / 玩法一览），不走每日强制路径。格子里放出 `phonicsFamily` 全部家族 `targets`（当前动物岛 15 词，以及配置里已有的 `-ap` / `-an`）。已解锁：词卡图（或 emoji 回退）+ 英文单词；未解锁：剪影 + 问号。点已解锁词会用现有 TTS 朗读，并有 Howler pop / GSAP pulse；卡片上不写中文。任意关卡里该词首次成功使用即 `unlockWord` / `markWordSeen` 写入 `lifetime.unlockedWords`（只记已知音族词，刷新仍在，设置「初始化」清空）：闪卡翻翻点对、地鼠词点对、拖一拖拖对、钓鱼读对或点鱼钓到、回音洞跟读通过或点「我说好了」、找一找点中、唱一唱点「我唱好了」。点错、只听 TTS、逛图鉴本身不解锁，也不发当日星星。

**玩法一览**列出 7 种玩法（主线四关 + 唱一唱 / 找一找）。一览试玩带 `?demo=1`，只庆祝、不加当日星星、不推进 `chainStep`。动物岛主按钮「今日主线」走完整四关链。点一点已移除。

**Flash Flip（闪卡翻翻）**是约 30–40 秒的词汇热身：从 15 词库抽出 4 个，先翻开词卡图+英文并 TTS 读词，再听词点对图卡。点错轻晃再问，没有红叉。偶数日作为主线第一关，通关后 `completeGate('flashFlip')`，`chainStep` 进到 `drag`，再去拖一拖。试玩走 `?demo=1`，不加当日星星、不推进主线；点对解锁单词图鉴。

**Whack Word（地鼠词）**是约 45–60 秒的点选关：从词库抽出 5 个。草地点洞弹出带词卡图的单词地鼠，系统读目标词，孩子点对的那只。每波 3 只（目标 + 干扰），点对 4 次过关；点错轻晃再读，没有倒计时卡死。奇数日作为主线第一关，通关后 `completeGate('whackWord')`，同样进入拖一拖。试玩走 `?demo=1`，不加当日星星、不推进主线；点对解锁单词图鉴。

**Drag Sort（拖一拖）**是认词关，不是分类关：每局从 15 词抽出 3 个。篮子只放词卡图（无图时回退 emoji / CSS 篮子），芯片只放英文单词。孩子读出单词后拖到对应图片。开场只用英语 TTS，没有中文操作说明。拖拽用 `@vueuse/gesture`，靠近篮子会磁吸，松手吸附进篮；拖错轻晃并再读单词、点亮正确篮子，不出现红叉。主线通关后 `completeGate('dragSort')`，`chainStep` 进到 `fish`。试玩仍走 `?demo=1`。拖对解锁单词图鉴。

**Find Scene（找一找）**在 Vue 壳里嵌 Pixi 画布：派对场景点出本局抽出的 3 个词（目标用词卡图）。目标会轻轻浮动；点对发光加星标并读词，点到树/气球/礼物或空地轻轻提醒。试玩走 `?demo=1`，不加当日星星。点中目标解锁单词图鉴。不把整站改成 Pixi。

**读词钓鱼（Word Fish）**同样用 Pixi 池塘画布：每局从 15 词抽出 3 条带英文单词的鱼，鱼身贴词卡图、不写中文。孩子读出某个还在池里的词，就挂钩吊进网里；全部钓完过关。有 `SpeechRecognition` 时宽松匹配剩余单词（与回音洞同一套 loose 规则）；没麦克风或没听清可点鱼钓上来，也可点鱼上的喇叭先听 TTS。读错只轻晃再提示，没有红叉、不扣分。读对或点鱼钓到解锁图鉴；只点喇叭听 TTS 不解锁。每日路径首次通关 +1 星；`?demo=1` / `?review=1` 不加星。路由仍为 `/sound-fish`。

当日主线进度按上海日历日重置。每日路径里重复玩同一关不再加星。找一找 / 唱一唱仍只从玩法一览进入。

## 音族配置

`src/data/phonicsFamily.ts` 为数据源。动物岛默认仍用 id `-at`，词库扩为 15 个适合 5 岁的英语词（`sat` 换成更好画的 `cup` 🥤）：

```ts
targets: [
  "cat", "hat", "mat", "bat", "rat",
  "cup", "dog", "pig", "duck", "bird",
  "fish", "cake", "ball", "sun", "star"
]
```

每局用 `sampleWords` 抽一小撮：钓鱼 / 回音 / 拖一拖 / 唱一唱 / 找一找各 3 个；闪卡翻翻 4 个；地鼠词 5 个。不要一次塞进全部 15 个。图鉴格子展示全部 15 个（外加 `-ap` / `-an` 槽位）。15 词的 `wordArt.image` 指向 `/idea_nb_en/word-cards/{word}.webp`（`import.meta.env.BASE_URL`）。`sampleWords` / `pickOtherWords` 会预加载本局抽到的词卡。

叙事：小猫是派对主人；hat / mat 等仍是派对道具或朋友。

同文件已写好 `-ap` / `-an`。切换：改 `currentFamilyId`。`warmupPhonemes` 仍留在配置里，本关不再走音素试次。

## 主线奖励

| 关卡 | 行为要点 | 奖励 |
| --- | --- | --- |
| 闪卡翻翻 **或** 地鼠词 | 当日二选一热身；点对过关 | +1 星，`chainStep` → `drag` |
| 拖一拖 / Drag Sort | 把英文芯片拖进对应词卡篮 | +1 星，`chainStep` → `fish` |
| 读词钓鱼 / Word Fish | 读出或点中池里全部单词鱼；挂钩吊进网 | +1 星，贴纸「派对耳朵」，`chainStep` → `echo` |
| 回声跟读 / Echo | 听后跟读；识别宽松成功；永远可点「我说好了」 | +1 星，当日目标完成，打卡天数 +1，`chainStep` → `complete` |
| Day Complete | 庆祝页；首次通关发 1 张贴纸并展示 | 当日首次进入：`claimDayCompleteRewards` 发目录下一张未拥有贴纸，岛日 +1（同日一次，封顶 7）；再进只展示已领状态 |

奖励 id 仍为 `ear`，避免旧存档失效。旧存档里的 `rug` 不再展示。无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置（动物岛 15 词 + sampleWords + 词卡 image）
src/data/praisePhrases.ts      英语表扬词库（点对 / 通关 / 轻提示）
public/word-cards/{word}.webp  Style-5 描边软陶词卡（15 词，512px WebP）
src/components/wordPic.vue     词卡图（加载失败回退 emoji）
src/composables/useWordSprite.ts Pixi 词卡贴图
src/data/stickers.ts           贴纸目录（5 个占位 id；完成页按日发一张）
src/data/todayTasks.ts         当日主任务文案（一条，不是清单）
src/composables/progressStore.ts 进度数据模型 + localStorage 迁移 + 初始化清档
src/composables/useProgress.ts 星星 / 贴纸 / 图鉴 / 岛日 / 当日任务
src/components/settingsButton.vue 首页 / 大厅齿轮入口
src/components/settingsDialog.vue 设置弹窗（初始化需二次确认）
src/components/todayGoalBar.vue 今日目标条（大厅 / 首页，内嵌今日星星条）
src/components/todayStarBar.vue 今日星星条（空/实星，主线关卡顶栏 + 完成页）
src/components/islandDayCells.vue 动物岛大厅 7 日亮格（读 `animalsIslandDays`，只展示）
src/components/gateTopBar.vue 主线关卡顶栏（回岛 + 今日星星条；试玩/复习改显示总星星）
src/composables/useWordAtlas.ts 单词图鉴只读视图（写入走 progressStore）
src/composables/usePlayMode.ts 每日路径 / 工坊复习模式
src/composables/useSpeech.ts   TTS
src/composables/useSfx.ts      Howler 点按 / 成功 / 轻晃
src/composables/useMotion.ts   GSAP shake / pulse / celebrate
src/composables/useDragSnap.ts 拖一拖磁吸落篮
src/composables/useRecognition.ts 跟读识别
src/data/playGallery.ts        玩法一览条目
src/views/homeView.vue         首页（今日目标条 + 去动物岛 + 玩法一览 + 弱工坊 / 图鉴 + 设置）
src/views/animalIslandView.vue 动物岛大厅（今日目标条 + 7 日亮格 + 今日主线四关 + 设置）
src/views/letterWorkshopView.vue 字母工坊复习页
src/views/wordAtlasView.vue    单词图鉴
src/views/playGalleryView.vue  玩法一览
src/views/flashFlipView.vue    闪卡翻翻
src/views/whackWordView.vue    地鼠词
src/components/findSceneStage.vue 找一找 Pixi 场景
src/components/soundFishStage.vue 读词钓鱼 Pixi 池塘
src/views/*.vue                七种玩法 + Day Complete
```

## 进度 store

`useProgress()` / `progressStore` 提供关卡条 / 完成页 / 图鉴册 / 岛 7 格要用的薄 API。今日目标条与今日星星条已接 `today`。

- `dateKey`：Asia/Shanghai 日历日 `YYYY-MM-DD`；跨日或音族切换会重置 `today`，终身数据保留
- `today`：`{ starsEarned, starsGoal?, mainTaskId, mainTaskDone, focusWord?, focusHits, chainStep, completed, rewardSticker? }`。主路径按 `chainStep`：`warmup`（闪卡/地鼠，由 `warmupKindForDate` 按 `dateKey` 奇偶选一）→ `drag` → `fish` → `echo` → `complete`。大厅「今日主线」进入当前步；关卡成功调用 `completeGate` 并 `routeAfterGate` 去下一步
- `lifetime`：`{ totalStars, stickers, unlockedWords, animalsIslandDays }`（岛日 0–7）
- helpers：`addStar(n)`、`completeGate(gateId)`、`routeAfterGate(gateId)`、`routeForChainStep(step)`、`warmupKindForDate()`、`unlockWord(word)` / `markWordSeen(word)`、`grantSticker(id)`、`completeDailyIfReady()`、`advanceIslandDayOncePerDate()`、`claimDayCompleteRewards()`、`ensureTodayTask()`、`pickRotatingFocusWord()`、`resetAllProgress()`
- `resetAllProgress()`：删掉 `starWords.v2` 以及仍在的 `starWords.v1` / `starWords.atlas.v1` / 其它 `starWords.*` 键，并把内存态写回当天空白存档（不删词卡图片）。首页与动物岛大厅齿轮 → 设置弹窗 →「初始化」→「真的清空吗？」后调用，然后回首页
- 同一上海日历日完成当日链最多 +1 岛日，封顶 7。图鉴解锁走 `unlockWord`（底层 `markWordSeen`）：主线点对 / 拖对 / 钓到 / 跟读通过，以及一览找一找点中、唱一唱「我唱好了」；只记已知音族词，不加星
- 贴纸只存 id。占位：`ear` / `paw` / `leaf` / `shell` / `sun`（`ear` 仍是钓鱼「派对耳朵」）。完成页再发一张：优先目录里还未拥有的 id，当天写入 `today.rewardSticker`，同日再进不重复发
- `claimDayCompleteRewards()`：需已通关回声（或 `today.completed`）。首次：标记完成、岛日 +1、发贴纸；同日再调只返回已领贴纸，不加岛日
- 旧页仍可读兼容字段：`state.stars`（= `lifetime.totalStars`）、`state.dayStars`（= 岛日）、`state.daily.gates`（含 `flashFlip` / `whackWord` / `dragSort` / `soundFish` / `echoCave`）
- `completeGate(gateId)`：仅已知每日关（闪卡/地鼠/拖一拖/钓鱼/回音）首次通关 +1 星；重玩同一关 `starsAwarded=0`。找一找 / 唱一唱不调用。`?demo=1` / `?review=1` 关卡页不调用，因此不加当日星、不推进 `chainStep`
- 回声跟读通关即 `completeDailyIfReady`（最后一关，软通过：前面关卡漏了也不卡死孩子；完成页本身不再加星）

## 今日目标条

`todayGoalBar` 挂在**首页**（标题下、动物岛卡片上）和**动物岛大厅**（岛名下、小岛场景上）。只显示一条主任务，不是关卡清单。

## 动物岛 7 日亮格

`islandDayCells` 挂在**动物岛大厅**（小岛场景下、今日主线四关卡上）。只展示终身岛日，不是第二座岛入口。

- 读 `lifetime.animalsIslandDays`（0–7，与兼容字段 `state.dayStars` 同一值）
- 文案「小岛亮了 n/7 天」；已亮格画太阳并高亮，未亮格淡色虚线圆里写天数
- 当日首次通关推进岛日后回大厅会亮多一格；设置「初始化」后回到 0/7
- 7/7 时整条变暖色，旁注「小岛天天都亮啦，明天还来玩」，不解锁下一座岛

- 主任务文案来自 `mainTaskId` 小表（`src/data/todayTasks.ts`）。默认 id `dailyChain`，文案「今天走完派对四关」（旧存档 `fishEcho` / `animalsIsland` 读同一句）
- `mainTaskDone` / `completed` 时打勾并浅绿高亮，旁注「做好啦」
- 有 `focusWord` 时多一行「多听一听 cat」
- 下方是 **今日星星条**：按 `today.starsGoal`（默认 4）画空星/实星，数字 `已得/目标`；主线关首次通关亮一颗并轻量弹跳（复用 GSAP celebrate/pulse + 已有成功音）。试玩/复习顶栏不换这条
- 主线四关顶栏（`gateTopBar`）同样挂今日星星条；点对飞星优先飞向空星位。动物岛关卡清单旁也有空/实星，方便对应「一关一星」
- Day Complete 再展示一次大号今日星星条（此时通常 4/4），不再加星
- `ensureTodayTask()`：上海日历日若缺主任务或焦点词，写入 `dailyChain`，并用日期哈希从当前 15 词库轮换 `focusWord`（同日稳定）。未完成的旧两关日会把空的 `chainStep=fish` 抬到 `warmup`

## 设置

首页与动物岛大厅右上角齿轮打开设置弹窗（关卡里没有，避免玩到一半误点）。「初始化」会先问「真的清空吗？」；确认后 `resetAllProgress()` 清掉进度键并回首页。不删 `public/word-cards`。

## 完成庆祝页

`/day-complete` 在每日链走完后庆祝。进入页时调用 `claimDayCompleteRewards()`：

- 未通关回声：不发贴纸、不加岛日，文案提醒先玩完主线
- 当日首次通关：发 1 张贴纸（`nextStickerId`：未拥有的 `ear` / `paw` / `leaf` / `shell` / `sun`），`animalsIslandDays` +1（上海日历日一次，封顶 7），并标记 `today.completed`
- 同日再进：展示已领贴纸与当前岛日，不重复发放
- 中文儿童向文案展示贴纸名；完成页再展示大号今日星星条，本身不加星
- 不在本阶段做贴纸图鉴整页；岛 7 格只在大厅展示亮/空，不解锁第二座岛

## 未做（按规格）

- 贴纸图鉴页（后续串行阶段）
- 第二座主题岛
- 完整工坊体验
- 真唱音高打分
- 拼读前的独立热身路径（闪卡翻翻已作为一览热身关）
- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
