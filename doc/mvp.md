# Star Words（星词岛）MVP

本文件与仓库实现保持同步。原始产品说明见任务附件；下列为落地后的结构与行为。

## 技术

- Vue 3 + Vite + TypeScript + Vue Router（hash 路由，静态托管更稳）
- 动效 / 音效 / 拖拽：GSAP、Howler、`@vueuse/gesture`
- 找一找 / 读词钓鱼：PixiJS 画布嵌在 Vue 壳里（不整站换引擎，不用 Phaser）
- 无后端；进度统一在 `localStorage` 键 `starWords.v2`（星星 / 贴纸 / 图鉴解锁 / 章·课·关卡 / 动物岛日格 / 当日文案）。启动时从 `starWords.v1` + `starWords.atlas.v1` 迁入。persist `version: 6` 起按 RISE 课表的「章 → 课 → 关」。v5 及更早的 `chN-x` 关卡进度会重置，终身星星、贴纸、图鉴词保留。之后只读写 v2
- 章节目标条：首页顶部展示当前课的「第N章·第M课 x/y」（y = 该课 `levels.length`）+ 下一关名 + 可选焦点词 + **过关星星条**（格数跟当前课）+ CTA（走无参 `getNextLevel()`）。没有关卡内容的课显示「即将开放」。缺省仍写入 `mainTaskId=animalsCh1`，并从已配置的课词表轮换 `focusWord`（只作文案，不锁关）。动物岛大厅先列章，点开再列课，再进关卡
- 静态托管：Vite `base` 为 `/idea_nb_en/`，hash 路由；`main` 推送后由 GitHub Actions 发到 GitHub Pages
- 可安装 PWA：`vite-plugin-pwa`，`registerType: autoUpdate`，后台静默更新，没有更新弹窗。manifest 名「星词岛」，`display: standalone`，`orientation: portrait`，`theme_color` / `background_color` 为天空蓝 `#7ec8e3`。`start_url` 与 `scope` 都是 `/idea_nb_en/`。图标在 `public/`（192 / 512 any、512 maskable、180 apple-touch、64 favicon、1024 主图）。Workbox 预缓存构建出的 JS / CSS / HTML，以及 `public/` 里的词卡 webp、图标和音频（仓库里没有音频文件，音效是内存生成的 wav）
- TTS：`speechSynthesis`（系统语音，不进预缓存）；读词钓鱼 / 回音洞：`SpeechRecognition`。离线或没有麦克风时识别不可用，钓鱼改为点鱼，回音洞点「我说好了」
- 点对 / 通关英语表扬从 `src/data/praisePhrases.ts` 随机抽（点对一步 / 通关 / 轻提示三套），尽量不连说同一句；中文外壳不动
- 动物岛 15 词使用 Style-5 描边软陶词卡（`public/word-cards/{word}.webp`，512px 长边，路径走 Vite `base`）；无图或加载失败时回退 emoji / 文字

## 信息架构

每日主路径 = **主题岛**（第一座：动物岛），内容按学校 **RISE Mart P1** 课表，从 **L49** 起。配置在 `src/data/chapters.ts`：两节学校课 = 一课（L49-50 是第 1 课，L143-144 是第 48 课），每 4 课 = 一章，共 **12 章**。课的 `type` 为 `letterSight` / `story` / `wordFamily` / `math` / `review`。关卡数读该课的 `levels.length`，不要写死。

解锁：课内关卡严格按顺序；上一课全通才开下一课；一章 4 课都通才开下一章。**不用等日历日**。上海 `dateKey` 只用于文案 / 分析。没有 `levels` 的课显示「即将开放」，点了不会进游戏、也不会被当成已通关。当前只有第 1 章四课有内容（字母 O/V/L/K，每课 5 关：闪卡、地鼠、听音拼一拼、小书点读、小小回顾）。第 4 课的回顾关带章节徽章。数学课只标记 `type: 'math'`，这一期不做数字关。

首页 → 动物岛（12 章）→ 点开一章看 4 课（小字课表范围，如 L49-50）→ 点开一课看关卡。进度文案是「第1章·第2课 3/5」。

找一找 / 唱一唱只在玩法一览，不进主线。未开的章轻提示「先通关上一章吧」。课内未开关轻提示「先过上一关吧」。已过关写「再玩一次」，不加首次通关星星。产品 UI 不再挂「练一练」。

**字母工坊**是弱复习入口，不是每日作业。工坊可重玩 `-at` 两关，但带 `?review=1`，不写入首次通关星星 / 贴纸 / 打卡。

**单词图鉴**也是弱入口（首页，挨着字母工坊 / 玩法一览），不走每日强制路径。格子里放出 `phonicsFamily` 全部家族 `targets`（旧 `-at` 15 词 + `-ap` / `-og` / `-ck` / `-an` + 第 1 章 `rise-1` 词）。已解锁：词卡图（或 emoji 回退）+ 英文单词；未解锁：剪影 + 问号。点已解锁词会用现有 TTS 朗读，并有 Howler pop / GSAP pulse；卡片上不写中文。任意关卡里该词首次成功使用即 `unlockWord` / `markWordSeen` 写入 `lifetime.unlockedWords`（只记已知音族词，刷新仍在，设置「初始化」清空）：闪卡翻翻点对、地鼠词点对、拖一拖拖对、听音拼一拼拼对、钓鱼读对或点鱼钓到、回音洞跟读通过或点「我说好了」、找一找点中、唱一唱点「我唱好了」。点错、只听 TTS、逛图鉴本身不解锁，也不发当日星星。第 1 章 16 个词已有 Style-5 词卡（lip / leg 不再进课，旧图仍留在 `public/word-cards/`）；其余还没有 webp 的词用 emoji。

**贴纸相册**是收集入口（首页暖色按钮、动物岛大厅关卡列表下、完成页「回家」下），不走每日强制路径，也不交换 / 花费贴纸。格子读 `lifetime.stickers`：已拥有亮色 emoji + 中文名，未拥有剪影 + 问号。一张都没有时提示「还没有贴纸，先去动物岛玩一章吧」。设置「初始化」后相册清空。

**玩法一览**列出主线玩法 + 唱一唱 / 找一找（听音拼一拼 / 小书点读已是正式关）。一览试玩带 `?demo=1`，只庆祝、不加首次通关星星、不推进章节关卡。主路径不链到 `/play-gallery?chapter=` 按章画廊；该路由可留着但不从首页 / 大厅 / 完成页 / 关卡列表广告。已过关重玩走列表或结束层的「再玩一次」，不加星、不重复徽章，也不挡下一章。动物岛大厅主按钮与首页 CTA 走无参 `getNextLevel()`（跨章）。点一点已移除。

**Flash Flip（闪卡翻翻）**是词汇热身：有 `?level=`（或主线回落到该玩法关卡）时用该关 `focusWord` / `appearWords` / `words`（如 ch1-1 的 cap + map/nap，ch2-1 的 frog + log/fog，ch3-1 的 duck + rock）；试玩 / 复习且没有关卡 id 时仍从 15 词库抽 4 个。学习阶段一次只出一张卡（词卡图 + 英文 + 英文下方的中文释义 `WordArt.zh`，没有释义就不占位；TTS 只读英文），进度按本关实际词数显示 `1/3`、`2/3`、`3/3`（一词则 `1/1`）。孩子用「下一张」/「上一张」自己翻，没有全局「我看完了」，也不能跳过没看的卡。翻到最后一张点「开始找一找」后，才进入听词点对图卡。点错轻晃再问，没有红叉。副文案可轻提章节主题（「-ap 派对」/「听声找伙伴」/「石头袜子」）。通关调用 `completeLevel`，立刻解锁并跳下一关。试玩走 `?demo=1`，不加首次通关星星、不推进章节；点对解锁单词图鉴。

**Whack Word（地鼠词）**是约 45–60 秒的点选关：有关卡 id 时用地鼠关词表（ch1-2 cap/map/nap，ch2-2 frog/log/fog，ch3-2 duck/rock/sock），干扰词也只从该表抽；试玩 / 复习且没有关卡 id 时仍从 15 词库抽 5 个。草地点洞弹出带词卡图的单词地鼠，系统读目标词，孩子点对的那只。每波最多 3 只（目标 + 同表干扰），点对 4 次过关；点错轻晃再读，没有倒计时卡死。通关后立刻解锁并跳到拖一拖。试玩走 `?demo=1`，不加首次通关星星、不推进章节；点对解锁单词图鉴。

**Drag Sort（拖一拖）**是认词关，不是分类关：有关卡 id 时用该关词表（ch1-3 三词，ch2-3 frog/log/jog，ch3-3 rock/sock/lock）；试玩 / 复习且没有关卡 id 时仍从 15 词库抽 3 个。篮子只放词卡图（无图时回退 emoji / CSS 篮子），芯片只放英文单词。孩子读出单词后拖到对应图片。开场只用英语 TTS，没有中文操作说明。拖拽用 `@vueuse/gesture`，靠近篮子会磁吸，松手吸附进篮；拖错轻晃并再读单词、点亮正确篮子，不出现红叉。通关后立刻解锁并跳到读词钓鱼。试玩仍走 `?demo=1`。拖对解锁单词图鉴。

**听音拼一拼（Sound Spell）**是听音拼 CVC 关（`/sound-spell`，`chN-7`）：系统 TTS 读目标词，格子旁有喇叭可随时再听。字母块 = 目标词字母 + 1–2 个相近 CVC 干扰字母（优先同类词首字母，如 cap 配 m/n）。孩子按顺序点字母，或把字母拖进 C-V-C 格子；点错 / 拖错只轻晃并再读单词，没有红叉、不整盘清空。词表走该关 `focusWord` / `appearWords` / `words`（`sampleGateWords`），不是写死 cap/map。一局把词表里的词轮流拼完。中文短指令，点对 / 通关抽 `praisePhrases`。通关 `unlockWord` + `completeLevel`，立刻开章节回顾。`?level=` 与其它关相同；试玩 `?demo=1` 无 id 时从 15 词库抽一小撮。

**小书点读（Story Book）**是正式关（`/story-book`，`chN-6`）。先封面：章节主题 emoji + 书名（章标题如「-ap 派对」），点书名听封面。再 3–5 页内容（词数读该关 `focusWord` / `appearWords` / `words`，最多 5 页）：每页一句短句（`shortSentences`，如 “A cap on a map.”）+ 焦点词图 / emoji。第一次露出句子前，先轻轻高亮焦点 CVC，中文鼓励「试着拼一拼」，不是测验、不挡下一页。点句子或喇叭听整句，点焦点词（或词卡 / 字母）只听单词。中文正向提示。`?level=` 与其它关相同；试玩 `?demo=1` 无 id 时从 15 词库抽一小撮。最后一页庆祝后 `completeLevel`，立刻开听音拼一拼。

**Find Scene（找一找）**在 Vue 壳里嵌 Pixi 画布：派对场景点出本局抽出的 3 个词（目标用词卡图）。目标会轻轻浮动；点对发光加星标并读词，点到树/气球/礼物或空地轻轻提醒。试玩走 `?demo=1`，不加当日星星。点中目标解锁单词图鉴。不把整站改成 Pixi。

**读词钓鱼（Word Fish）**同样用 Pixi 池塘画布：有关卡 id 时用该关词表（ch1-4 cap/map/nap，ch2-4 frog/log/jog，ch3-4 duck/rock/lock）；试玩 / 复习且没有关卡 id 时仍从 15 词库抽 3 条。鱼身贴词卡图、不写中文。孩子读出某个还在池里的词，就挂钩吊进网里；全部钓完过关。有 `SpeechRecognition` 时宽松匹配剩余单词（与回音洞同一套 loose 规则）；没麦克风或没听清可点鱼钓上来，也可点鱼上的喇叭先听 TTS。读错只轻晃再提示，没有红叉、不扣分。读对或点鱼钓到解锁图鉴；只点喇叭听 TTS 不解锁。副文案按章轻提主题（小猫请客 / 听声找伙伴 / 石头袜子）。第一章钓鱼关：`completeLevel` 首次 +1 星，并额外发「派对耳朵」；立刻跳到回声跟读。`?demo=1` / `?review=1` 不加星、不推进章节。路由仍为 `/sound-fish`。

**回声跟读（Echo）**听后跟读：有关卡 id 时用该关词表（ch1-5 三词，ch2-5 走完 frog→hog 五词，ch3-5 duck/rock/sock）；试玩 / 复习且没有关卡 id 时仍从 15 词库抽 3 个。每轮先听单词再听一句短句（`shortSentences`，如 “A cap on a map.”），孩子跟读句子或单词；永远可点「我说好了」。标题按章轻提（听句子说一说 / 听声喊伙伴 / 石头和袜子）。

**小小回顾（Finale）**读 `?level=` 的词表。课内回顾不发徽章；一章最后一课的回顾关带 `chapterStickerId`（第 1 章是 `rise1`）。词卡没有图时回退 emoji。

章节关卡进度跨日保留，跨午夜不会把孩子锁回「等明天」。同一关首次通关才加星；重玩、`?practice=1`、`?demo=1`、`?review=1`、找一找 / 唱一唱不加星。找一找 / 唱一唱仍只从玩法一览进入。

## 音族配置

`src/data/phonicsFamily.ts` 为数据源。试玩无 `?level=` 时仍用 id `-at` 的 15 词抽样。主线第 1 章词在家族 `rise-1`（每课 4 个：hop / pot / top / mop，van / vet / vest / vat，log / lid / lamp / lock，kid / kit / keg / kick），词卡在 `public/word-cards/{word}.webp`。`log` 也在更早的 `-og` 里，`lock` 也在 `-ck` 里，先命中的家族同样带上 `wordArt.image`。lip / leg 已从 `rise-1` 去掉。旧 `-at` / `-ap` / `-og` / `-ck` / `-an` 仍留在图鉴。短句在 `src/data/shortSentences.ts`；小书若关卡写了 `storyPages`，优先用那几句。回音按词轮流读这些短句。

主线 / 已过关重玩带 `?level=` 时，闪卡 / 地鼠 / 拖一拖 / 听音拼一拼 / 钓鱼 / 回音 / 章节回顾从 `src/data/chapters.ts` 该关词表出词（`src/data/gateWords.ts` 的 `sampleGateWords`：`focusWord` + `appearWords` + `words`，去重；焦点词固定排第一）。词表有几只就用几只，不再从 15 词 `-at` 库补位。试玩 / 复习 / 一览且没有关卡 id 时，仍用 `sampleWords` 从 15 词库抽一小撮：钓鱼 / 回音 / 拖一拖 / 听音拼一拼 / 唱一唱 / 找一找各 3 个；闪卡翻翻 4 个；地鼠词 5 个。不要一次塞进全部 15 个。图鉴格子展示全部音族 `targets`。已有卡的 `wordArt.image` 指向 `/idea_nb_en/word-cards/{word}.webp`（`import.meta.env.BASE_URL`）。`sampleWords` / `pickOtherWords` / 关卡词表会预加载本局词卡。

叙事：第 1 章是字母 O / V / L / K 和对应的 sight word（I / my / good / three）。每课正好 4 个词，闪卡、地鼠（干扰词只从这 4 个里抽）、听音拼一拼、小书、回顾都不串其他课的词。四课句式各不相同：I can … / My … is in the van. / It is a good … / Here are three …。听音拼一拼第 1 课 hop pot top，第 2 课 van vet vat，第 3 课 log lid lamp（lamp 四字母），第 4 课 kid kit keg。关卡里的干扰字母只从该课 4 个词来。

同文件已写好 `-ap` / `-og` / `-ck` / `-an`。试玩抽样切换：改 `currentFamilyId`。`warmupPhonemes` 仍留在配置里，本关不再走音素试次。

## 主线奖励

| 关卡 | 行为要点 | 奖励 |
| --- | --- | --- |
| ch1-1 闪卡翻翻 | cap 焦点，map/nap 出场；先手动翻完学习卡再点对过关 | 首次 +1 星，立刻解锁 ch1-2 |
| ch1-2 地鼠词 | cap/map/nap | 首次 +1 星，立刻解锁 ch1-3 |
| ch1-3 拖一拖 | 三词拖进对应词卡篮 | 首次 +1 星，立刻解锁 ch1-4 |
| ch1-4 读词钓鱼 | 读出或点中池里单词鱼 | 首次 +1 星，额外贴纸「派对耳朵」，立刻解锁 ch1-5 |
| ch1-5 回声跟读 | 听后跟读；永远可点「我说好了」 | 首次 +1 星，立刻解锁 ch1-6 |
| ch1-6 小书点读 | 封面 + 3–5 页短句点读，先高亮焦点 CVC 再听整句 | 首次 +1 星，立刻解锁 ch1-7 |
| ch1-7 听音拼一拼 | 听 CVC，点/拖字母块拼出来；点错轻晃再听 | 首次 +1 星，立刻解锁 ch1-8 |
| ch1-8 章节回顾 | 短混合回顾（stub）；首次通关发章节徽章 | 首次 +1 星 + 贴纸 `atParty`（-ap 派对徽章）；解锁 ch2 |
| ch2-1…ch2-7 | 与第一章相同玩法骨架；词表 frog / log / fog / jog / hog | 首次各 +1 星；章内顺序解锁 |
| ch2-8 章节回顾 | 五词回顾；首次通关发爪印徽章 | 首次 +1 星 + 贴纸 `pawPrint`；解锁 ch3 |
| ch3-1…ch3-7 | 相同骨架；词表 duck / rock / sock / lock / pack | 首次各 +1 星；章内顺序解锁 |
| ch3-8 章节回顾 | -ck 混合 + cap 复习 | 首次 +1 星 + 贴纸 `littleStar` |
| 完成页 | 庆祝章节结束 | `claimDayCompleteRewards` 展示章节徽章；岛日 +1 仅作展示 / 分析（同日一次，封顶 7），**不锁下一关** |

奖励 id 仍为 `ear`，避免旧存档失效。旧存档里的 `rug` 不再展示。无惩罚 UI：不出现红叉、不计分对比、不因失败阻断。触控热区偏大，面向约 5 岁儿童。

## 目录

```
src/data/phonicsFamily.ts      音族配置（旧 -at 15 词 + -ap / -og / -ck / -an + sampleWords + 词卡 image）
src/data/gateWords.ts          关卡词表解析（`?level=` / 主线用 chapters 词表；试玩无 id 回落 sampleWords）
src/data/praisePhrases.ts      英语表扬词库（点对 / 通关 / 轻提示）
src/data/shortSentences.ts     短句词库（回声 / 小书每页一句）
src/data/spellTiles.ts         听音拼一拼字母块（目标字母 + 相近 CVC 干扰）
public/word-cards/{word}.webp  Style-5 描边软陶词卡（15 词，512px WebP）
src/components/wordPic.vue     词卡图（加载失败回退 emoji）
src/composables/useWordSprite.ts Pixi 词卡贴图
src/data/chapters.ts           RISE 12 章 × 48 课（课类型、课表范围、关卡；目前只有第 1 章有关卡）
src/data/stickers.ts           贴纸目录（5 个日奖占位 + 旧三枚岛徽章 + `rise1`…`rise12` 章徽章）
src/data/todayTasks.ts         章节目标文案（进度 / 下一关 / 焦点词）
src/composables/progressStore.ts 进度数据模型 + 章节关卡 + localStorage 迁移 + 初始化清档 + 完全化打满
src/composables/useProgress.ts 星星 / 贴纸 / 图鉴 / 章节关卡 / 岛日 / 当日文案
src/composables/useStickerAlbum.ts 贴纸相册只读视图（写入走 progressStore）
src/components/settingsButton.vue 首页 / 大厅齿轮入口
src/components/settingsDialog.vue 设置弹窗（初始化清空 / 完全化打满，都需确认）
src/components/todayGoalBar.vue 章节目标条（首页：当前下一关所在章 x/N + 下一关 + CTA 走无参 getNextLevel；大厅不挂）
src/components/todayStarBar.vue 过关星星条（空/实星，主线关卡顶栏 + 完成页；格数跟 starsGoal / levels.length）
src/components/chapterLevelLights.vue 关卡亮格（章内列表 + 首页岛卡 + 完成页；格数 = levelTotal）
src/components/chapterLevelList.vue 某一章关卡列表（未开 / 可玩 / 已过「再玩一次」+ 该章下一关/下一章 CTA）
src/components/islandDayCells.vue 旧 7 日亮格（主线已不用；岛日仍只作展示 / 分析）
src/components/gateTopBar.vue 主线关卡顶栏（回岛 + 过关星星条；试玩/复习改显示总星星）
src/composables/useWordAtlas.ts 单词图鉴只读视图（写入走 progressStore）
src/composables/usePlayMode.ts 试玩 / 复习模式（通关后不推进章节）
src/composables/useChapterLevel.ts 关卡页读 `?level=`、按关取词（`takeRunWords`）、调用 `completeLevel`、首次跳下一关、重玩弹出选择层
src/composables/useSpeech.ts   TTS
src/composables/useSfx.ts      Howler 点按 / 成功 / 轻晃
src/composables/useMotion.ts   GSAP shake / pulse / celebrate
src/composables/useDragSnap.ts 拖一拖磁吸落篮
src/composables/useRecognition.ts 跟读识别
src/data/playGallery.ts        玩法一览条目（按章画廊路由仍在，主路径不链）
src/components/levelClearSheet.vue 重玩通关后的选择层（回岛主按钮 / 再玩一次次按钮 / 可选去下一关）
src/views/homeView.vue         首页（跨章目标条 + 当前章亮格 + 去动物岛 + 玩法一览 + 贴纸相册 + 弱工坊 / 图鉴 + 设置）
src/views/animalIslandView.vue 动物岛大厅（三章入口；点开后该章关卡列表 + 已过关「再玩一次」）
src/views/soundSpellView.vue   听音拼一拼（听词、点/拖字母、软失败、喇叭重听）
src/views/storyBookView.vue    小书点读（封面听书名 + 3–5 页短句点读，先高亮 CVC 再听整句）
src/views/chapterFinaleView.vue 章节回顾 stub（读 `?level=` 的章标题 / 词表；ch1-8 / ch2-8 / ch3-8）
src/views/letterWorkshopView.vue 字母工坊复习页
src/views/wordAtlasView.vue    单词图鉴
src/views/stickerAlbumView.vue 贴纸相册
src/views/playGalleryView.vue  玩法一览
src/views/flashFlipView.vue    闪卡翻翻
src/views/whackWordView.vue    地鼠词
src/components/findSceneStage.vue 找一找 Pixi 场景
src/components/soundFishStage.vue 读词钓鱼 Pixi 池塘
src/views/*.vue                主线玩法 + 唱一唱 / 找一找 + Day Complete
```

## 进度 store

`useProgress()` / `progressStore` 提供关卡条 / 完成页 / 图鉴册 / 章节进度要用的薄 API。目标条与星星条已接 `today`（星星数与章节首次通关对齐）。

- `dateKey`：Asia/Shanghai 日历日 `YYYY-MM-DD`，只作文案 / 分析（焦点词轮换、岛日展示）。**跨日不重置章节关卡，不锁下一关**
- `chapter`：`{ currentChapterId, highestUnlocked, levels: Record<id, locked|unlocked|cleared>, firstClearStars, chapterStickers, firstClearAt, celebrated, celebratedChapters }`。`celebratedChapters` 记已经看过完成页的章；旧存档 `celebrated: true` 会迁成 `['ch1']`
- 章节 API：`isLevelUnlocked(id)`、`isLevelCleared(id)`、`completeLevel(id)`、`getChapterProgress(chId?)`、`getNextLevel(chId?)`、`isChapterUnlocked(chId)`。通关立刻把下一关标成 `unlocked`；终章通关后解锁下一章第 1 关，但本次跳转仍去完成页
- `getNextLevel()` 无参时沿主线跨章：ch1 全通 → `ch2-1`，ch2 全通 → `ch3-1`。传入 `chapterId` 时只在该章内找。`isChapterUnlocked('ch1')` 恒真；`ch2` 需 ch1 全清（或该章已有进度 grandfather）；`ch3` 同理。首页目标条与大厅主按钮读无参 `getNextLevel()`；章内列表读 `getNextLevel(chapterId)`
- `completeLevel(id)`：未解锁的关拒绝（方案 A 顺序）。首次通关写 `cleared`、发配置里的 `firstClearStars`、终章首次发对应徽章（ch1-8 `atParty` / ch2-8 `pawPrint` / ch3-8 `littleStar`）。重玩或该 id 已在 `firstClearStars` 里则 `starsAwarded=0`
- `today`：兼容旧 UI。`starsGoal` = 第一章 `levels.length`；`starsEarned` 与章节已通关数同步；`completed` = 第一章全过。`chainStep` 由下一关反推，仅兼容旧页
- `lifetime`：`{ totalStars, stickers, unlockedWords, animalsIslandDays }`（岛日 0–7，展示用，不锁关）
- helpers：`addStar(n)`、`completeLevel(id)`（关卡页主路径）、`completeGate(gateId)`（旧日链入口，按玩法映射到第一章对应关再调 `completeLevel`）、`locationForLevel` / `locationAfterClear` / `locationForNextMainline()` / `locationForDayComplete(chId)`（带 `?level=` / `?chapter=`）、`listClearedChapterIds()`、`routeAfterGate(gateId)` / `routeForNextMainline()`（兼容旧字符串路径）、`unlockWord(word)` / `markWordSeen(word)`、`grantSticker(id)`、`completeDailyIfReady()`（现为第一章全通）、`advanceIslandDayOncePerDate()`、`claimDayCompleteRewards(chapterId?)`、`ensureTodayTask()`、`pickRotatingFocusWord()`、`resetAllProgress()`、`maxOutProgressFromConfig()`
- `resetAllProgress()`：删掉 `starWords.v2` 以及仍在的 `starWords.v1` / `starWords.atlas.v1` / 其它 `starWords.*` 键，并把内存态写回空白存档（含章节关卡）。不删词卡图片
- `maxOutProgressFromConfig()`：设置「完全化」用。遍历现有配置打满进度，**不写死章节 id / 关卡数**：`CHAPTERS` 全部关标 `cleared` 并发首次通关星、章徽章写入 `chapterStickers` + `celebratedChapters`；`ALBUM_STICKERS` 以及各章 / 终章列出的贴纸 id 全部发放；`phonicsFamily` 全部家族词 + 各章词表解锁图鉴；`animalsIslandDays` 拉到展示上限。之后只加配置、不用改这个 GM 函数
- **旧存档迁移**：persist `version` 小于 6（含旧 `chN-1`…`chN-8` 和没有 `chapter` 的日链）会把关卡进度重置到第 1 章第 1 课，避免旧 id 对不上新课。终身星星、贴纸、图鉴词保留。坏掉的 JSON 不会把应用打崩，按空档重新开始。v6 自己的课 id（`chN-kM-x`）会按顺序修好锁关
- 图鉴解锁走 `unlockWord`（底层 `markWordSeen`）：主线点对 / 拖对 / 钓到 / 跟读通过，以及一览找一找点中、唱一唱「我唱好了」；只记已知音族词，不加星
- 贴纸只存 id。日奖占位：`ear` / `paw` / `leaf` / `shell` / `sun`（`ear` 仍是钓鱼「派对耳朵」）。章节徽章：`atParty` / `pawPrint` / `littleStar`，只在对应章终章首次通关发，不进每日轮换池。相册读 `ALBUM_STICKERS`
- `claimDayCompleteRewards(chapterId?)`：需该章全清（`clearedCount === levelTotal`）。首次庆祝展示该章徽章（ch1 `atParty` / ch2 `pawPrint` / ch3 `littleStar`），不把别的章徽章混进来；岛日 +1 仅分析 / 展示，不锁关。`locationAfterClear` 终章跳 `/day-complete?chapter=chN`
- 旧页仍可读兼容字段：`state.stars`（= `lifetime.totalStars`）、`state.dayStars`（= 岛日）、`state.daily.gates`（由章节通关回填）
- 关卡页（闪卡 / 地鼠 / 拖一拖 / 听音拼一拼 / 钓鱼 / 回音 / 小书点读 / 章节回顾）各自知道 `levelId`：大厅与通关跳转带 `?level=ch1-x`，页内用 `useChapterLevel` 解析；缺省时按玩法回落到第一章对应关。赢了调用 `completeLevel`，**不再只靠旧日链 `completeGate` 结算**
- 通关后立刻去 **下一关未通关**（`getNextLevel()` + `?level=`）。ch1-8 / ch2-8 / ch3-8 首次进入 `/day-complete?chapter=chN` 该章奖励页。重玩已过关：轻表扬，不加星、不重复发章节徽章，结束后弹出选择层
- `completeGate(gateId)`：闪卡/地鼠/拖一拖/钓鱼/回音按玩法对应第一章该玩法关（钓鱼现 ch1-4，回音现 ch1-5），内部仍转 `completeLevel`。找一找 / 唱一唱不调用。`?demo=1` / `?review=1` 关卡页不调用 `completeLevel`，因此不加星、不推进章节。`?practice=1` 会调用 `completeLevel`，但重玩不加星、不重复徽章
- 回声通关后进入小书点读，小书后再听音拼一拼，不再把主线标成「今天做完了」

## 章节目标条

`todayGoalBar` 挂在**首页**（标题下、动物岛卡片上）。主文案读**当前课**的进度，不再写「今天做完了」或按天锁关。动物岛大厅先列章，不再挂这条。

- 主行「第N章·第M课 x/y」（y = 该课关卡数）。没有内容时写「即将开放」。全部可玩内容都过完才写「通关啦」
- CTA 走无参 `getNextLevel()` / `locationForNextMainline()`：未通关写「去第N章第M课 · 玩法名」。下一课即将开放时按钮也写「即将开放」，并回到该章的课列表。整章通关后的回顾关才去完成页
- 有 `focusWord` 时多一行「多听一听 cat」；只是提示，不按 `dateKey` 锁关
- 下方是 **过关星星条**：按 `today.starsGoal`（第一章 `levels.length`）画空星/实星；关卡首次通关亮一颗并轻量弹跳
- 首页岛卡、大厅、完成页都用配置格数亮格（旧 7 日太阳格不再出现在主线）
- 主线关顶栏（`gateTopBar`）同样挂过关星星条
- 完成页再展示一次大号星星条（此时通常全清），不再加星
- `ensureTodayTask()`：若缺主任务或焦点词，写入 `animalsCh1`，并用日期哈希轮换 `focusWord`。不再把主线倒回「今日热身」

## 动物岛章节亮格

`chapterLevelLights` 挂在**章内关卡列表**（小岛场景下、关卡列表上），首页岛卡（嵌入、不重复标题，跟当前下一关所在章）和完成页（读 `?chapter=` 的那一章）也会再展示一次。不是第二座岛入口。

- 读 `getChapterProgress(chapterId)` 的 `clearedCount` / `levelTotal`（格数跟配置走，不写死 6）
- 文案「第N章 n/N 关」；已过关画星星并高亮，未过关淡色虚线圆里写关号
- 通关后回该章列表会亮多一格；设置「初始化」后回到 0/N
- 全清时整条变暖色，旁注「第N章通关啦」
- 旧 `islandDayCells`（7 日太阳格）主线不再使用；`animalsIslandDays` 仍只作展示 / 分析，不锁关

## 动物岛多章大厅

大厅默认列出 12 章（儿童向中文标题 + 课表范围，如 L49-56）：

- 第 1 章「字母朋友」：永远解锁
- 后一章：上一章 4 课都通后解锁
- 未开章：软锁 + 轻晃 + 「先通关上一章吧」
- 已开章：点进 `/animal-island?chapter=chN`，先看 4 课。有内容的课再进 `/animal-island?chapter=chN&lesson=chN-kM` 看关卡。没有关卡的课写「即将开放」，点了只提示，不跳进游戏

章内列表 UX 与原先第一章相同（`locked` / `unlocked` / `cleared`）：

- 可玩（`unlocked` 或已过）：点进该关路由，并带 `?level=chN-x`
- 已过关右侧写「再玩一次」，随时可点，不会挡住
- 未开：轻晃 + 中文提示「先过上一关吧」
- 该章 `getNextLevel(chapterId)` 那一行暖色高亮，标「现在玩」；若该章已全清，底部 CTA 改走跨章下一关
- 进度标题是「第N章 x/N 关」
- 该章全清后旁注「第N章通关啦」。主按钮仍是下一关 / 下一章。已过关右侧写「再玩一次」，不另开练一练入口

## 设置

首页与动物岛大厅右上角齿轮打开设置弹窗（关卡里没有，避免玩到一半误点）。

- 「设置当前课」：家长选一课。这一课之前的课标成已过，按配置补首次通关星星和已完整章的徽章（跟「完全化」同一套账，已发过的不重复加）。选中的课从第 1 关打开，后面的课重新锁上。终身星星不会变少
- 「初始化」：先问「真的清空吗？」；确认后 `resetAllProgress()` 清掉进度键并回首页。不删 `public/word-cards`
- 「完全化」：确认后 `maxOutProgressFromConfig()`，按当前 `CHAPTERS` / 课 / 关卡 / 贴纸目录 / 音族词打满。空关卡的课也会记成已过，这样以后只加配置就能被打满。不写死章 id 或课数

## 关卡通关跳转

主线各关赢了都走同一条：`useChapterLevel` → `completeLevel(levelId)` → 首次通关 `locationAfterClear`（下一关带 `?level=`，或 `/day-complete`）。

- 首次通关：+1 星；第一章钓鱼关额外「派对耳朵」；终章额外该章徽章（ch1-8 `atParty` / ch2-8 `pawPrint` / ch3-8 `littleStar`）；立刻进下一关，**不用等日历日**
- 重玩已过关：英语轻表扬 + 中文「再玩一遍也可以…」，不加星、不重复发章节徽章；结束后弹出选择层（回岛主按钮 / 再玩一次次按钮 / 可选去下一关），不把孩子卡死；首次通关仍自动进下一关
- `?practice=1`：旧按章画廊重玩参数仍可识别，奖励规则与「再玩一次」相同；主路径不再链到这条
- `?demo=1` 回玩法一览；`?review=1` 回字母工坊（或带着 `review=1` 进下一关复习），都不写章节进度

## 完成庆祝页

`/day-complete?chapter=chN` 在该章全清后庆祝（ch1-8 / ch2-8 / ch3-8 通关后跳来）。进入页时调用 `claimDayCompleteRewards(chapterId)`：

- 未通关该章：不发徽章，文案提醒先玩完「章名」
- 首次庆祝：展示该章终章徽章（「-ap 派对徽章」/「爪印徽章」/「小星星徽章」）；岛日 +1 只作后台展示 / 分析（同日一次，封顶 7），完成页改画该章亮格
- 再进：展示已领的该章徽章，不重复发放，也不说「明天再来」；文案改成「第N章通关啦」
- 中文儿童向文案写明是第几章、哪枚徽章；完成页再展示大号过关星星条，本身不加星
- 完成页可回家或「看贴纸相册」；想再玩回该章点已过关「再玩一次」

## 贴纸相册

`/sticker-album` 展示目录格（`ear` / `paw` / `leaf` / `shell` / `sun` + 章节徽章 `atParty`「-ap 派对徽章」/ `pawPrint`「爪印徽章」/ `littleStar`「小星星徽章」）。入口：首页暖色「贴纸相册」、动物岛大厅、完成页。

- 读 `lifetime.stickers`（与 `hasSticker` 同一份）；拥有的格子亮色 + 中文名，未拥有剪影 + `?`
- 目录外的已领 id 仍用中文「章节徽章」补一格，避免空白
- 一张都没有：文案「还没有贴纸，先去动物岛玩一章吧」，并给「去动物岛」
- 设置「初始化」后 `lifetime.stickers` 清空，相册回到空态
- 只看、不装饰小岛、不交换、不花费

## 未做（按规格）

- 第二座主题岛
- 完整工坊体验
- 小书点读的更厚绘本动画 / 人手绘页（关卡玩法已落地：封面 + 短句点读 + 试拼读高亮）
- 真唱音高打分
- 拼读前的独立热身路径（闪卡翻翻已作为一览热身关）
- 真人手绘角色
- 家长后台（首页仅一行状态）
- 登录、i18n 框架、埋点
- 默认不启用 `-ap` / `-an`（配置已就绪）
