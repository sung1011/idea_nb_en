# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 动效 / 音效 / 拖拽：GSAP、Howler、`@vueuse/gesture`
- 找一找 / 读词钓鱼：PixiJS 画布嵌在 Vue 壳里（不整站换引擎，不用 Phaser）
- 无后端；进度统一在 `localStorage` 键 `starWords.v2`（星星 / 贴纸 / 图鉴解锁 / 章节关卡 / 动物岛日格 / 当日文案）。启动时从 `starWords.v1` + `starWords.atlas.v1` 迁入，v2 日链存档再升到章节模型（persist `version: 3`），之后只读写 v2，避免两套互相覆盖
- 章节目标条：首页顶部展示「第1章 x/6 关」+ 下一关名（如「下一关：拖一拖」）+ 可选焦点词 + **过关星星条**（第一章 6 颗空/实星）+ CTA（走 `getNextLevel()`）。缺省仍写入 `mainTaskId=animalsCh1`，并从 15 词库轮换 `focusWord`（只作文案，不锁关）。动物岛大厅改用「第1章 x/6 关」列表，不再挂这条
- 静态托管：Vite `base` 为 `/idea_nb_en/`，hash 路由；`main` 推送后由 GitHub Actions 发到 GitHub Pages
- TTS：`speechSynthesis`；读词钓鱼 / 回音洞：`SpeechRecognition`（不可用则点按通过）
- 点对 / 通关英语表扬从 `src/data/praisePhrases.ts` 随机抽（点对一步 / 通关 / 轻提示三套），尽量不连说同一句；中文外壳不动
- 动物岛 15 词使用 Style-5 描边软陶词卡（`public/word-cards/{word}.webp`，512px 长边，路径走 Vite `base`）；无图或加载失败时回退 emoji / 文字

## 信息架构

每日主路径 = **主题岛**（第一座：动物岛）。主线已改为 **章节 + 关卡**（方案 A：章内按顺序解锁）。动物岛三章配置在 `src/data/chapters.ts`：`ch1`「-at 派对」、`ch2`「听声找伙伴」、`ch3`「点心与天空」，每章 6 关（闪卡 → 地鼠 → 拖一拖 → 钓鱼 → 回声 → 回顾）。章内通关立刻开下一关；**下一章只在上一章 6/6 后解锁**（`isChapterUnlocked`）。**不用等日历日**。上海 `dateKey` 只用于文案 / 分析，不再软锁主线。大厅 UI 本阶段仍只画第一章；跨章继续靠 `getNextLevel()`。

首页 → 动物岛大厅 → ch1-1 闪卡翻翻 → ch1-2 地鼠词 → ch1-3 拖一拖 → ch1-4 读词钓鱼 → ch1-5 回声跟读 → ch1-6 章节回顾 → 完成页 →（第一章全通后）`getNextLevel()` 指向 ch2-1 → 同骨架走到 ch3-6

找一找 / 唱一唱只在玩法一览，不进主线。动物岛大厅用章节关卡列表（ch1-1…ch1-6）：未开 / 可玩 / 已过；可玩点进该关路由，已过关写「再玩一次」，未开轻提示「先过上一关吧」。主按钮高亮 `getNextLevel()`。进度文案是「第1章 x/6 关」，不再按日历锁关。旧 7 日亮格换成 6 关亮格（跟已通关数走）。第一章 6/6 后出现「练一练」。

**字母工坊**是弱复习入口，不是每日作业。工坊可重玩 `-at` 两关，但带 `?review=1`，不写入首次通关星星 / 贴纸 / 打卡。

**单词图鉴**也是弱入口（首页，挨着字母工坊 / 玩法一览），不走每日强制路径。格子里放出 `phonicsFamily` 全部家族 `targets`（当前动物岛 15 词，以及配置里已有的 `-ap` / `-an`）。已解锁：词卡图（或 emoji 回退）+ 英文单词；未解锁：剪影 + 问号。点已解锁词会用现有 TTS 朗读，并有 Howler pop / GSAP pulse；卡片上不写中文。任意关卡里该词首次成功使用即 `unlockWord` / `markWordSeen` 写入 `lifetime.unlockedWords`（只记已知音族词，刷新仍在，设置「初始化」清空）：闪卡翻翻点对、地鼠词点对、拖一拖拖对、钓鱼读对或点鱼钓到、回音洞跟读通过或点「我说好了」、找一找点中、唱一唱点「我唱好了」。点错、只听 TTS、逛图鉴本身不解锁，也不发当日星星。

**贴纸相册**是收集入口（首页暖色按钮、动物岛大厅关卡列表下、完成页「回家」下），不走每日强制路径，也不交换 / 花费贴纸。格子读 `lifetime.stickers`：已拥有亮色 emoji + 中文名，未拥有剪影 + 问号。一张都没有时提示「还没有贴纸，先去动物岛玩派对吧」。设置「初始化」后相册清空。

**玩法一览**列出 7 种玩法（主线玩法 + 唱一唱 / 找一找）。一览试玩带 `?demo=1`，只庆祝、不加首次通关星星、不推进章节关卡。第一章 6/6 后的「练一练」走 `/play-gallery?chapter=ch1`，只列出已过的 ch1 六关，点进去带 `?practice=1` 重玩，不加星、不重复发章节徽章。第二章 / 第三章已有配置与解锁闸门，大厅多章 UI 下一阶段再接。动物岛主按钮仍按当前章 `getNextLevel(ch1)` 高亮；无参 `getNextLevel()` 会在前一章全通后跨到 ch2 / ch3。点一点已移除。

**Flash Flip（闪卡翻翻）**是约 30–40 秒的词汇热身：从 15 词库抽出 4 个，先翻开词卡图+英文并 TTS 读词，再听词点对图卡。点错轻晃再问，没有红叉。第一章 `ch1-1`（配置：cat focus，hat/mat 出场）。关卡页读 `?level=ch1-1`（或按玩法回落），通关调用 `completeLevel('ch1-1')`，立刻解锁并跳到 `ch1-2`。试玩走 `?demo=1`，不加首次通关星星、不推进章节；点对解锁单词图鉴。

**Whack Word（地鼠词）**是约 45–60 秒的点选关：从词库抽出 5 个。草地点洞弹出带词卡图的单词地鼠，系统读目标词，孩子点对的那只。每波 3 只（目标 + 干扰），点对 4 次过关；点错轻晃再读，没有倒计时卡死。第一章 `ch1-2`（cat/hat/mat）。通关 `completeLevel('ch1-2')` 后立刻解锁并跳到拖一拖。试玩走 `?demo=1`，不加首次通关星星、不推进章节；点对解锁单词图鉴。

**Drag Sort（拖一拖）**是认词关，不是分类关：每局从 15 词抽出 3 个。篮子只放词卡图（无图时回退 emoji / CSS 篮子），芯片只放英文单词。孩子读出单词后拖到对应图片。开场只用英语 TTS，没有中文操作说明。拖拽用 `@vueuse/gesture`，靠近篮子会磁吸，松手吸附进篮；拖错轻晃并再读单词、点亮正确篮子，不出现红叉。第一章 `ch1-3`。通关 `completeLevel('ch1-3')` 后立刻解锁并跳到钓鱼。试玩仍走 `?demo=1`。拖对解锁单词图鉴。

**Find Scene（找一找）**在 Vue 壳里嵌 Pixi 画布：派对场景点出本局抽出的 3 个词（目标用词卡图）。目标会轻轻浮动；点对发光加星标并读词，点到树/气球/礼物或空地轻轻提醒。试玩走 `?demo=1`，不加当日星星。点中目标解锁单词图鉴。不把整站改成 Pixi。

**读词钓鱼（Word Fish）**同样用 Pixi 池塘画布：每局从 15 词抽出 3 条带英文单词的鱼，鱼身贴词卡图、不写中文。孩子读出某个还在池里的词，就挂钩吊进网里；全部钓完过关。有 `SpeechRecognition` 时宽松匹配剩余单词（与回音洞同一套 loose 规则）；没麦克风或没听清可点鱼钓上来，也可点鱼上的喇叭先听 TTS。读错只轻晃再提示，没有红叉、不扣分。读对或点鱼钓到解锁图鉴；只点喇叭听 TTS 不解锁。第一章 `ch1-4`：`completeLevel` 首次 +1 星，并额外发「派对耳朵」；立刻跳到回声跟读。`?demo=1` / `?review=1` 不加星、不推进章节。路由仍为 `/sound-fish`。

章节关卡进度跨日保留，跨午夜不会把孩子锁回「等明天」。同一关首次通关才加星；重玩、`?practice=1`、`?demo=1`、`?review=1`、找一找 / 唱一唱不加星。找一找 / 唱一唱仍只从玩法一览进入。

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
| ch1-1 闪卡翻翻 | cat 焦点，hat/mat 出场；点对过关 | 首次 +1 星，立刻解锁 ch1-2 |
| ch1-2 地鼠词 | cat/hat/mat | 首次 +1 星，立刻解锁 ch1-3 |
| ch1-3 拖一拖 | 三词拖进对应词卡篮 | 首次 +1 星，立刻解锁 ch1-4 |
| ch1-4 读词钓鱼 | 读出或点中池里单词鱼 | 首次 +1 星，额外贴纸「派对耳朵」，立刻解锁 ch1-5 |
| ch1-5 回声跟读 | 听后跟读；永远可点「我说好了」 | 首次 +1 星，立刻解锁 ch1-6 |
| ch1-6 章节回顾 | 短混合回顾（stub）；首次通关发章节徽章 | 首次 +1 星 + 贴纸 `atParty`（-at 派对徽章）；解锁 ch2 |
| ch2-1…ch2-5 | 与第一章相同玩法骨架；词表 dog / pig / duck / bird / fish | 首次各 +1 星；章内顺序解锁 |
| ch2-6 章节回顾 | 五词回顾；首次通关发爪印徽章 | 首次 +1 星 + 贴纸 `pawPrint`；解锁 ch3 |
| ch3-1…ch3-5 | 相同骨架；词表 cup / cake / ball / sun / star | 首次各 +1 星；章内顺序解锁 |
| ch3-6 章节回顾 | 点心天空混合 + cat / hat 复习 | 首次 +1 星 + 贴纸 `littleStar` |
| 完成页 | 庆祝章节结束 | `claimDayCompleteRewards` 展示章节徽章；岛日 +1 仅作展示 / 分析（同日一次，封顶 7），**不锁下一关** |

奖励 id 仍为 `ear`，避免旧存档失效。旧存档里的 `rug` 不再展示。无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置（动物岛 15 词 + sampleWords + 词卡 image）
src/data/praisePhrases.ts      英语表扬词库（点对 / 通关 / 轻提示）
public/word-cards/{word}.webp  Style-5 描边软陶词卡（15 词，512px WebP）
src/components/wordPic.vue     词卡图（加载失败回退 emoji）
src/composables/useWordSprite.ts Pixi 词卡贴图
src/data/chapters.ts           动物岛三章 6 关配置（play / 词注 / 路由 / 章节徽章 / 解锁顺序）
src/data/stickers.ts           贴纸目录（5 个日奖占位 + 章节徽章 `atParty` / `pawPrint` / `littleStar`；相册按格展示）
src/data/todayTasks.ts         章节目标文案（进度 / 下一关 / 焦点词）
src/composables/progressStore.ts 进度数据模型 + 章节关卡 + localStorage 迁移 + 初始化清档
src/composables/useProgress.ts 星星 / 贴纸 / 图鉴 / 章节关卡 / 岛日 / 当日文案
src/composables/useStickerAlbum.ts 贴纸相册只读视图（写入走 progressStore）
src/components/settingsButton.vue 首页 / 大厅齿轮入口
src/components/settingsDialog.vue 设置弹窗（初始化需二次确认）
src/components/todayGoalBar.vue 章节目标条（首页：第1章 x/6 关 + 下一关 + CTA 走 getNextLevel；大厅不挂）
src/components/todayStarBar.vue 过关星星条（空/实星，主线关卡顶栏 + 完成页）
src/components/chapterLevelLights.vue 6 关亮格（大厅 + 首页岛卡 + 完成页；读章节已通关数）
src/components/islandDayCells.vue 旧 7 日亮格（主线已不用；岛日仍只作展示 / 分析）
src/components/gateTopBar.vue 主线关卡顶栏（回岛 + 过关星星条；试玩/复习改显示总星星）
src/composables/useWordAtlas.ts 单词图鉴只读视图（写入走 progressStore）
src/composables/usePlayMode.ts 试玩 / 复习模式（通关后不推进章节）
src/composables/useChapterLevel.ts 关卡页读 `?level=`、调用 `completeLevel`、首次跳下一关、重玩弹出选择层
src/composables/useSpeech.ts   TTS
src/composables/useSfx.ts      Howler 点按 / 成功 / 轻晃
src/composables/useMotion.ts   GSAP shake / pulse / celebrate
src/composables/useDragSnap.ts 拖一拖磁吸落篮
src/composables/useRecognition.ts 跟读识别
src/data/playGallery.ts        玩法一览条目 + 第一章练一练关卡列表
src/components/levelClearSheet.vue 重玩通关后的选择层（再玩一次 / 回岛 / 6/6 后练一练）
src/views/homeView.vue         首页（章节目标条 + 6 关亮格 + 去动物岛 + 6/6 后练一练 + 玩法一览 + 贴纸相册 + 弱工坊 / 图鉴 + 设置）
src/views/animalIslandView.vue 动物岛大厅（6 关亮格 + ch1-1…ch1-6 关卡列表 + 已过关「再玩一次」+ 6/6 后练一练）
src/views/chapterFinaleView.vue 章节回顾 stub（读 `?level=` 的章标题 / 词表；ch1-6 / ch2-6 / ch3-6）
src/views/letterWorkshopView.vue 字母工坊复习页
src/views/wordAtlasView.vue    单词图鉴
src/views/stickerAlbumView.vue 贴纸相册
src/views/playGalleryView.vue  玩法一览
src/views/flashFlipView.vue    闪卡翻翻
src/views/whackWordView.vue    地鼠词
src/components/findSceneStage.vue 找一找 Pixi 场景
src/components/soundFishStage.vue 读词钓鱼 Pixi 池塘
src/views/*.vue                七种玩法 + Day Complete
```

## 进度 store

`useProgress()` / `progressStore` 提供关卡条 / 完成页 / 图鉴册 / 章节进度要用的薄 API。目标条与星星条已接 `today`（星星数与章节首次通关对齐）。

- `dateKey`：Asia/Shanghai 日历日 `YYYY-MM-DD`，只作文案 / 分析（焦点词轮换、岛日展示）。**跨日不重置章节关卡，不锁下一关**
- `chapter`：`{ currentChapterId, highestUnlocked, levels: Record<id, locked|unlocked|cleared>, firstClearStars, chapterStickers, firstClearAt, celebrated }`
- 章节 API：`isLevelUnlocked(id)`、`isLevelCleared(id)`、`completeLevel(id)`、`getChapterProgress(chId?)`、`getNextLevel(chId?)`、`isChapterUnlocked(chId)`。通关立刻把下一关标成 `unlocked`；终章通关后解锁下一章第 1 关，但本次跳转仍去完成页
- `getNextLevel()` 无参时沿主线跨章：ch1 全通 → `ch2-1`，ch2 全通 → `ch3-1`。传入 `chapterId` 时只在该章内找。`isChapterUnlocked('ch1')` 恒真；`ch2` 需 ch1 六关全清；`ch3` 需 ch2 六关全清。大厅 / 目标条本阶段仍读 `getChapterProgress('ch1')`
- `completeLevel(id)`：未解锁的关拒绝（方案 A 顺序）。首次通关写 `cleared`、发配置里的 `firstClearStars`、终章首次发对应徽章（ch1-6 `atParty` / ch2-6 `pawPrint` / ch3-6 `littleStar`）。重玩 `starsAwarded=0`
- `today`：兼容旧 UI。`starsGoal` 现为 6；`starsEarned` 与章节已通关数同步；`completed` = 第一章 6 关都过。`chainStep` 由下一关反推，仅兼容旧页
- `lifetime`：`{ totalStars, stickers, unlockedWords, animalsIslandDays }`（岛日 0–7，展示用，不锁关）
- helpers：`addStar(n)`、`completeLevel(id)`（关卡页主路径）、`completeGate(gateId)`（旧日链入口，映射到 ch1-1…ch1-5 再调 `completeLevel`）、`locationForLevel` / `locationAfterClear` / `locationForNextMainline()`（带 `?level=`）、`routeAfterGate(gateId)` / `routeForNextMainline()`（兼容旧字符串路径）、`unlockWord(word)` / `markWordSeen(word)`、`grantSticker(id)`、`completeDailyIfReady()`（现为章节全通）、`advanceIslandDayOncePerDate()`、`claimDayCompleteRewards()`、`ensureTodayTask()`、`pickRotatingFocusWord()`、`resetAllProgress()`
- `resetAllProgress()`：删掉 `starWords.v2` 以及仍在的 `starWords.v1` / `starWords.atlas.v1` / 其它 `starWords.*` 键，并把内存态写回空白存档（含章节关卡）。不删词卡图片
- **旧存档迁移**：没有 `chapter` 字段时，把日链映射进第一章。已打卡（`animalsIslandDays>0` / `lastIslandDate` / `today.completed`）→ ch1-1…ch1-5 已通、ch1-6 解锁，不发章节徽章。仅有当日 `gates` 时按关映射（旧热身 XOR 会给 ch1-1 记一笔，避免卡在第一关）。图鉴词、已有贴纸、终身星星保留
- 图鉴解锁走 `unlockWord`（底层 `markWordSeen`）：主线点对 / 拖对 / 钓到 / 跟读通过，以及一览找一找点中、唱一唱「我唱好了」；只记已知音族词，不加星
- 贴纸只存 id。日奖占位：`ear` / `paw` / `leaf` / `shell` / `sun`（`ear` 仍是钓鱼「派对耳朵」）。章节徽章：`atParty` / `pawPrint` / `littleStar`，只在对应章终章首次通关发，不进每日轮换池。相册读 `ALBUM_STICKERS`
- `claimDayCompleteRewards()`：需第一章全通。首次庆祝展示章节徽章；岛日 +1 仅分析 / 展示，不锁关
- 旧页仍可读兼容字段：`state.stars`（= `lifetime.totalStars`）、`state.dayStars`（= 岛日）、`state.daily.gates`（由章节通关回填）
- 关卡页（闪卡 / 地鼠 / 拖一拖 / 钓鱼 / 回音 / 章节回顾）各自知道 `levelId`：大厅与通关跳转带 `?level=ch1-x`，页内用 `useChapterLevel` 解析；缺省时按玩法回落到第一章对应关。赢了调用 `completeLevel`，**不再只靠旧日链 `completeGate` 结算**
- 通关后立刻去 **下一关未通关**（`getNextLevel()` + `?level=`）。ch1-6 首次进入 `/day-complete` 章节奖励页。重玩已过关：轻表扬，不加星、不重复发章节徽章，结束后弹出选择层
- `completeGate(gateId)`：闪卡/地鼠/拖一拖/钓鱼/回音分别对应 ch1-1…ch1-5，内部仍转 `completeLevel`。找一找 / 唱一唱不调用。`?demo=1` / `?review=1` 关卡页不调用 `completeLevel`，因此不加星、不推进章节。`?practice=1` 会调用 `completeLevel`，但重玩不加星、不重复徽章
- 回声通关后进入 ch1-6，不再把主线标成「今天做完了」

## 章节目标条

`todayGoalBar` 挂在**首页**（标题下、动物岛卡片上）。主文案读章节进度，不再写「今天做完了」或按天锁关。动物岛大厅已改成章节关卡列表，不再挂这条。

- 主行「第1章 x/6 关」，下一行「下一关：拖一拖」（全通时改成「第一章通关啦，下面可以随便练」）
- CTA 走 `getNextLevel()` / `locationForNextMainline()`：未通关写「去第N关 · 玩法名」，全通写「看章节奖励」，并多一个「练一练」入口（不挡第二章）
- 有 `focusWord` 时多一行「多听一听 cat」；只是提示，不按 `dateKey` 锁关
- 下方是 **过关星星条**：按 `today.starsGoal`（第一章 6）画空星/实星；关卡首次通关亮一颗并轻量弹跳
- 首页岛卡、大厅、完成页都用 6 关亮格（旧 7 日太阳格不再出现在主线）
- 主线关顶栏（`gateTopBar`）同样挂过关星星条
- 完成页再展示一次大号星星条（此时通常 6/6），不再加星
- `ensureTodayTask()`：若缺主任务或焦点词，写入 `animalsCh1`，并用日期哈希轮换 `focusWord`。不再把主线倒回「今日热身」

## 动物岛章节 6 关亮格

`chapterLevelLights` 挂在**动物岛大厅**（小岛场景下、6 关列表上），首页岛卡（嵌入、不重复标题）和完成页也会再展示一次。只展示第一章已通关数，不是第二座岛入口。

- 读 `getChapterProgress()` 的 `clearedCount` / `levelTotal`（第一章 6 关）
- 文案「第1章 n/6 关」；已过关画星星并高亮，未过关淡色虚线圆里写关号
- 通关后回大厅会亮多一格；设置「初始化」后回到 0/6
- 6/6 时整条变暖色，旁注「第一章通关啦，下面可以随便练」
- 旧 `islandDayCells`（7 日太阳格）主线不再使用；`animalsIslandDays` 仍只作展示 / 分析，不锁关

## 动物岛大厅关卡列表

大厅卡片列出 ch1-1…ch1-6，状态来自章节模型（`locked` / `unlocked` / `cleared`）：

- 可玩（`unlocked` 或已过）：点进该关路由，并带 `?level=ch1-x`，让关卡页知道自己的 `levelId`
- 已过关右侧写「再玩一次」，随时可点，不会挡住
- 未开：轻晃 + 中文提示「先过上一关吧」，不是硬错误
- `getNextLevel()` 那一行暖色高亮，标「现在玩」；底部主按钮文案「去第N关 · 玩法名」
- 进度标题同样是「第1章 x/6 关」，不再写「今日主线」或按天锁关
- 有已过关时旁注「想再玩就点已过的关」；6/6 时旁注「第一章通关啦，下面可以随便练」，并出现「练一练」入口（进 ch1 玩法画廊，不解锁第二章）

## 设置

首页与动物岛大厅右上角齿轮打开设置弹窗（关卡里没有，避免玩到一半误点）。「初始化」会先问「真的清空吗？」；确认后 `resetAllProgress()` 清掉进度键（含章节关卡）并回首页。不删 `public/word-cards`。

## 关卡通关跳转

主线六关赢了都走同一条：`useChapterLevel` → `completeLevel(levelId)` → 首次通关 `locationAfterClear`（下一关带 `?level=`，或 `/day-complete`）。

- 首次通关：+1 星；ch1-4 额外「派对耳朵」；ch1-6 额外章节徽章 `atParty`；立刻进下一关，**不用等日历日**
- 重玩已过关：英语轻表扬 + 中文「再玩一遍也可以…」，不加星、不重复发章节徽章；结束后弹出选择层（再玩一次 / 回岛；6/6 还有练一练），不把孩子卡死
- `?practice=1`：第一章练一练重玩，奖励规则与重玩相同，结束后回 `/play-gallery?chapter=ch1`
- `?demo=1` 回玩法一览；`?review=1` 回字母工坊（或带着 `review=1` 进下一关复习），都不写章节进度

## 完成庆祝页

`/day-complete` 在第一章 6 关走完后庆祝（ch1-6 通关后跳来）。进入页时调用 `claimDayCompleteRewards()`：

- 未通关 ch1-6：不发徽章，文案提醒先玩完第一章
- 首次庆祝：展示 ch1-6 发的 `-at 派对徽章`；岛日 +1 只作后台展示 / 分析（同日一次，封顶 7），完成页改画 6 关亮格
- 再进：展示已领徽章，不重复发放，也不说「明天再来」；文案改成「第一章通关啦，下面可以随便练」
- 中文儿童向文案展示贴纸名；完成页再展示大号过关星星条，本身不加星
- 完成页可点「练一练」（进 ch1 已过关画廊）或「看贴纸相册」；大厅 / 首页 / 完成页 6 关亮格只展示已通关数，不解锁第二座岛，也不锁主线

## 贴纸相册

`/sticker-album` 展示目录格（`ear` / `paw` / `leaf` / `shell` / `sun` + 章节徽章 `atParty` / `pawPrint` / `littleStar`）。入口：首页暖色「贴纸相册」、动物岛大厅、完成页。

- 读 `lifetime.stickers`（与 `hasSticker` 同一份）；拥有的格子亮色，未拥有剪影 + `?`
- 一张都没有：文案「还没有贴纸，先去动物岛玩派对吧」，并给「去动物岛」
- 设置「初始化」后 `lifetime.stickers` 清空，相册回到空态
- 只看、不装饰小岛、不交换、不花费

## 未做（按规格）

- 第二座主题岛
- 完整工坊体验
- 真唱音高打分
- 拼读前的独立热身路径（闪卡翻翻已作为一览热身关）
- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
