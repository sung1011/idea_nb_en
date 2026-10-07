export type ChapterStoryPage = {
  en: string
  zh: string
  sceneHint: string
}

export type ChapterStory = {
  id: string
  titleEn: string
  titleZh: string
  pages: ChapterStoryPage[]
}

export const CHAPTER_STORIES: ChapterStory[] = [
  // 舍弃：keg、kit｜新加：gold、thief、trap、brave｜宝物：金色的锅｜反派：Thief Fox
  {
    id: "ch1",
    titleEn: "Who Took the Gold Pot?",
    titleZh: "字母朋友",
    pages: [
      { en: "Three kids hop on a log.", zh: "三个小朋友在木头上跳。", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Look! A gold pot!", zh: "快看！一口金色的锅！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The gold pot is for the vet.", zh: "这口金锅是送给兽医的。", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Oh no! A thief!", zh: "不好！来了个小偷！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The thief has the gold pot!", zh: "小偷抢走了金锅！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The thief runs to the van.", zh: "小偷跑向小货车。", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Help! Stop the van!", zh: "快帮忙！拦住货车！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Kick the lock!", zh: "踢开车锁！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Trap the thief with a mop!", zh: "用拖把困住小偷！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The lid is a trap, too!", zh: "锅盖也是陷阱！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "My vest is on the thief.", zh: "我把背心套在小偷头上。", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The lamp is on. Find the pot!", zh: "灯亮了。找到金锅！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "Yes! The gold pot is in the van.", zh: "太好了！金锅在车里。", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "We are brave kids!", zh: "我们是勇敢的小朋友！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
      { en: "The vet has the gold pot. Hop, hop, hop!", zh: "兽医拿到了金锅。大家开心跳起来！", sceneHint: "宝物：金色的锅｜反派：Thief Fox" },
    ],
  },
  // 舍弃：spot、tub｜新加：crown、sneaky、mine、share｜宝物：火腿王冠｜反派：Sneaky Fly
  {
    id: "ch2",
    titleEn: "The Ham Crown",
    titleZh: "小豹来了",
    pages: [
      { en: "The cub naps in the den.", zh: "小豹子在洞穴里打盹。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "We have a ham crown!", zh: "我们有一顶火腿王冠！", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "The crown is for the cub.", zh: "这顶王冠要送给小豹子。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "Look! A sneaky fly!", zh: "快看！一只鬼鬼祟祟的苍蝇！", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "The sneaky fly took the crown!", zh: "馋嘴苍蝇抢走了王冠！", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "Who has the ham? Look in the bag!", zh: "火腿在谁那儿？看看袋子！", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "No crown in the bag.", zh: "袋子里没有。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "Look in the box. Look in the tin.", zh: "看看箱子，再看看铁罐。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "No! The fly is on the rug.", zh: "不对！苍蝇在毯子上。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "The fly says, \"Mine! Mine!\"", zh: "苍蝇喊：「是我的！是我的！」", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "No, fly! We can share.", zh: "不行，苍蝇！我们可以一起分享。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "The cub hugs the mug.", zh: "小豹子抱紧杯子当盾牌。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "Trap the fly in the tin!", zh: "把苍蝇关进铁罐！", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "Yum! The cub has the ham crown.", zh: "真香！小豹子戴上了火腿王冠。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
      { en: "We hug the cub. We share the bun and the egg.", zh: "抱抱小豹子，再一起分面包和鸡蛋。", sceneHint: "宝物：火腿王冠｜反派：Sneaky Fly" },
    ],
  },
  // 舍弃：cot、pad｜新加：map、pirate、hide、open｜宝物：点点藏宝图｜反派：Pirate Wig
  {
    id: "ch3",
    titleEn: "The Dot Map",
    titleZh: "词族和字母",
    pages: [
      { en: "Is it a pig? Yes!", zh: "那是小猪吗？是的！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The pig has a map.", zh: "小猪拿到一张图。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "A lot of dots on the map!", zh: "藏宝图上好多点点！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Find the gold rock.", zh: "去找金色的石头。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Oh no! A pirate wig!", zh: "不好！来了一顶海盗假发！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The pirate wig took the map!", zh: "海盗假发抢走了藏宝图！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Where is the map?", zh: "藏宝图在哪？", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The wig is on the twig.", zh: "假发挂在树枝上。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Stop, wig! The pup is out!", zh: "站住，假发！小狗冲出来了！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The cat is in the cab. Hide!", zh: "猫在出租车里。快躲！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The map is in the cup.", zh: "藏宝图在杯子里。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Open the sock. Open the hat.", zh: "打开袜子，打开帽子。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "Wow! A gold fig!", zh: "哇！一颗金色的无花果！", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The pirate wig can share the fig.", zh: "海盗假发也可以分一颗无花果。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
      { en: "The pig, the pup, and the cat hug.", zh: "小猪、小狗和猫抱在一起。", sceneHint: "宝物：点点藏宝图｜反派：Pirate Wig" },
    ],
  },
  // 舍弃：rag、mitt｜新加：carrot、steal、team、cheer｜宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）
  {
    id: "ch4",
    titleEn: "The Gift Carrot",
    titleZh: "六只母鸡",
    pages: [
      { en: "One hen, two hens.", zh: "一只母鸡，两只母鸡。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Six hens hop on the bed.", zh: "六只母鸡在床上跳。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Dad has a big carrot.", zh: "爸爸有一根大胡萝卜。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "The carrot is a gift!", zh: "胡萝卜是一份礼物！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Oh no! Greedy Gum!", zh: "不好！贪婪口香糖来了！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Greedy Gum can steal.", zh: "它要偷走胡萝卜。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "A dog with gum!", zh: "一只狗身上粘着口香糖！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Help! Dad can help.", zh: "快帮忙！爸爸能帮忙。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Hit the gum with a bat!", zh: "用球棒打飞口香糖！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "A big hit!", zh: "大力一击！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "The gum is on a tag.", zh: "口香糖粘到标签上了。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Six hens tug the carrot.", zh: "六只母鸡一起拉胡萝卜。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Mom and sis help, too.", zh: "妈妈和姐姐也来帮忙。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "We are a team!", zh: "我们是一队的！", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
      { en: "Cheer! The hens have the gift carrot.", zh: "欢呼吧！母鸡们保住了礼物胡萝卜。", sceneHint: "宝物：神奇大胡萝卜｜反派：Greedy Gum（会滚的口香糖球）" },
    ],
  },
  // 舍弃：wink、deck｜新加：key、fifty、secret、knock｜宝物：五十颗星钥匙｜反派：Sly Fox
  {
    id: "ch5",
    titleEn: "Who Lives in the Treasure Hut?",
    titleZh: "小屋和数字",
    pages: [
      { en: "Look at the hut.", zh: "看那座小屋。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Who lives in the hut?", zh: "谁住在小屋里？", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Ben is at the desk.", zh: "本坐在书桌前。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Ben has a secret map.", zh: "本有一张秘密地图。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Count to fifty!", zh: "数到五十！", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "A key is in the well.", zh: "钥匙在水井里。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Oh no! Sly Fox!", zh: "不好！狡猾的狐狸来了！", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Sly Fox runs to the tent.", zh: "狐狸跑进帐篷。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Look at the web.", zh: "看看蜘蛛网。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "The key is in the web!", zh: "钥匙粘在网上！", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "An ant and a rat help.", zh: "蚂蚁和老鼠来帮忙。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Knock, knock on the hut.", zh: "敲敲小屋的门。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Open the wok. Find the key!", zh: "打开锅。找到钥匙！", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "Wag, wag! The fox can share.", zh: "摇摇尾巴！狐狸也可以分享。", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
      { en: "We unlock the hut. Fifty stars!", zh: "打开小屋。五十颗星星！", sceneHint: "宝物：五十颗星钥匙｜反派：Sly Fox" },
    ],
  },
  // 舍弃：rip、jog｜新加：jar、thief、chase、friend｜宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）
  {
    id: "ch6",
    titleEn: "The Red Jam Jar",
    titleZh: "丹和卡姆",
    pages: [
      { en: "Dan and Cam are sad.", zh: "丹和卡姆很伤心。", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Where is the red jam?", zh: "红色果酱去哪了？", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "The jam is red.", zh: "果酱是红色的。", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Look! A cap thief!", zh: "快看！帽子小偷！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "The thief has the jam jar!", zh: "小偷抢走了果酱罐！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Can you dip it?", zh: "你能蘸一下吗？（诱饵）", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Sip, sip. Tip the jug!", zh: "啜一口。把罐子倾斜！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Where is the cap?", zh: "帽子在哪？", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Trap the thief! Clap, clap!", zh: "困住小偷！拍手拍手！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Chase the jet!", zh: "去追那架小喷射机！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Hot and wet. Dan is sad.", zh: "又热又湿。丹很伤心。", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Cam is glad. Look in the trap!", zh: "卡姆开心了。看看陷阱里！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "The jam jar is back!", zh: "果酱罐回来了！", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "Dan and Cam are friends.", zh: "丹和卡姆是好朋友。", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
      { en: "We clap. We share the jam.", zh: "我们拍手，一起分果酱。", sceneHint: "宝物：红色果酱罐｜反派：Cap Thief（专偷帽子的影子）" },
    ],
  },
  // 舍弃：yam、belt｜新加：sale、coin、sneak、fair｜宝物：义卖金铃铛｜反派：Sneak Yak
  {
    id: "ch7",
    titleEn: "The Lost Yard Bell",
    titleZh: "院子义卖",
    pages: [
      { en: "We play in the yard.", zh: "我们在院子里玩。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "It is a yard sale!", zh: "今天有院子义卖！", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Get the yak.", zh: "去把牦牛带来。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Oh no! Sneak Yak!", zh: "不好！鬼鬼祟祟的牦牛！", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Sneak Yak took the bell!", zh: "它偷走了金铃铛！", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "I got a doll. Where is the bell?", zh: "我买到了娃娃。铃铛呢？", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Look in the drum.", zh: "看看鼓里。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "No bell. Get the yo-yo!", zh: "没有铃铛。拿出悠悠球！", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Trap the yak with a net!", zh: "用网困住牦牛！", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Yes! The yak is in the net.", zh: "太好了！牦牛进网了。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Five and one more is six.", zh: "五再加一是六。（六个硬币）", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "A fair coin for the bell.", zh: "一枚公平的硬币换回铃铛。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "We play with a net.", zh: "我们用网来玩。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "A nut, a pan, a fan for the sale.", zh: "坚果、锅、扇子都拿去义卖。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
      { en: "Cheer! The yard sale is fun.", zh: "欢呼吧！院子义卖真好玩。", sceneHint: "宝物：义卖金铃铛｜反派：Sneak Yak" },
    ],
  },
  // 舍弃：fog、sack｜新加：flag、thief、race、win｜宝物：蓝色鳍旗｜反派：Zigzag Bug
  {
    id: "ch8",
    titleEn: "The Blue Fin Flag",
    titleZh: "卡姆和帕特",
    pages: [
      { en: "Pat sat on the mat.", zh: "帕特坐在垫子上。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "I see a blue fin.", zh: "我看见蓝色的鳍。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "The blue fin is on a flag!", zh: "蓝鳍画在一面旗上！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Oh no! Zigzag Bug!", zh: "不好！锯齿虫来了！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "The bug took the flag!", zh: "虫子抢走了旗！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Jump up and zip!", zh: "跳起来，拉上拉链冲出去！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Cam and Pat run up the hill.", zh: "卡姆和帕特跑上小山。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Race to the bus!", zh: "赛跑去追公交车！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Zap! The bug is on the frog.", zh: "啪！虫子跳到青蛙身上。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "The frog says, \"No, bug!\"", zh: "青蛙说：「不行，虫子！」", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Trap the bug in the zip!", zh: "用拉链口袋困住虫子！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Buzz, buzz. One fewer bug!", zh: "嗡嗡嗡。少了一只捣蛋虫！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "One fewer than one is zero.", zh: "一减一等于零。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "We win the blue fin flag!", zh: "我们赢回了蓝鳍旗！", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
      { en: "Cam and Pat hug on the mat.", zh: "卡姆和帕特在垫子上拥抱。", sceneHint: "宝物：蓝色鳍旗｜反派：Zigzag Bug" },
    ],
  },
  // 舍弃：moss、pinch｜新加：forest、steal、brave、return｜宝物：森林王者之戒｜反派：Nip Bug
  {
    id: "ch9",
    titleEn: "The King Ring",
    titleZh: "走进森林",
    pages: [
      { en: "Run to the pond.", zh: "跑向池塘。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "What a king!", zh: "好一位国王！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "The king has a gold ring.", zh: "国王有一枚金戒指。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Oh no! Nip Bug!", zh: "不好！咬人小虫来了！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Do not nip me, Bug!", zh: "别咬我，小虫！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "The bug can steal the ring!", zh: "小虫要偷走戒指！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "She says, \"Quack!\"", zh: "她说：「嘎！」", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Quick! To the stump!", zh: "快！去树桩那儿！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "An elk is by the swing.", zh: "麋鹿在秋千旁边。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "The ring is under the wing.", zh: "戒指藏在翅膀下。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Quiz time. Where is the ring?", zh: "问答时间。戒指在哪？", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Look in the quilt!", zh: "看看被子里！", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "Brave kids return the ring.", zh: "勇敢的小朋友把戒指还回去。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "The king has the ring.", zh: "国王拿回了戒指。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
      { en: "No sting. We hug by the pond.", zh: "没有刺痛。我们在池塘边拥抱。", sceneHint: "宝物：森林王者之戒｜反派：Nip Bug" },
    ],
  },
  // 舍弃：wax、mash｜新加：secret、hungry、steal、feast｜宝物：爸爸的秘密调料盒｜反派：Hungry Ox
  {
    id: "ch10",
    titleEn: "Dad's Secret Box",
    titleZh: "爸爸做饭",
    pages: [
      { en: "Dad likes to chop.", zh: "爸爸喜欢切菜。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Oh, an ox!", zh: "哦，一头牛！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "The ox is hungry.", zh: "这头牛肚子饿了。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Dad has a secret box.", zh: "爸爸有一个秘密盒子。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Mix and stir in the box.", zh: "在盒子里搅拌调料。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Oh no! The ox can steal!", zh: "不好！牛要偷盒子！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Cut and chop. Stop the ox!", zh: "切切切。拦住那头牛！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Who has the cat?", zh: "谁带着猫？", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "The hen, the pig, and the cub help.", zh: "母鸡、小猪和小豹子来帮忙。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Clap for five!", zh: "为五拍手！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Five claps. Trap the ox!", zh: "拍五下。困住那头牛！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "The secret box is back.", zh: "秘密盒子回来了。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "Dad can fix the mix.", zh: "爸爸把调料修好了。", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "A big feast for all!", zh: "大家一起享用大餐！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
      { en: "The ox can share. Yum!", zh: "牛也可以分享。真香！", sceneHint: "宝物：爸爸的秘密调料盒｜反派：Hungry Ox" },
    ],
  },
  // 舍弃：shed、pit｜新加：hope、steal、cave、true｜宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）
  {
    id: "ch11",
    titleEn: "Hope's Gold Map",
    titleZh: "霍普的地图",
    pages: [
      { en: "Hope has a map.", zh: "霍普有一张地图。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "E is in nest.", zh: "E 在鸟巢里。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Tap the e in bed.", zh: "点一点 bed 里的 e。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "The map leads to a cave.", zh: "地图通向一个洞穴。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Oh no! Melt Rat!", zh: "不好！融化鼠来了！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Melt Rat can steal the map!", zh: "它要偷走地图！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "To the sled! To the sand!", zh: "去雪橇！去沙滩！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "The rat melts the tent!", zh: "老鼠融化了帐篷！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Show me the yak.", zh: "指给我看那只牦牛。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "The yak and the frog help.", zh: "牦牛和青蛙来帮忙。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "The king and the ox help, too.", zh: "国王和牛也来帮忙。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Trap the rat on the raft!", zh: "把老鼠困在木筏上！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "The true map is safe.", zh: "真正的地图安全了。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Hope opens the cave.", zh: "霍普打开洞穴。", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
      { en: "Gold sand! We did it!", zh: "金色的沙子！我们做到了！", sceneHint: "宝物：霍普的金色地图｜反派：Melt Rat（爱化东西的老鼠）" },
    ],
  },
  // 舍弃：lick、pat｜新加：graduate、medal、sneaky、proud｜宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）
  {
    id: "ch12",
    titleEn: "The Graduation Grin",
    titleZh: "毕业小复习",
    pages: [
      { en: "Skip to four!", zh: "两个两个数，数到四！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Flip the pancake!", zh: "翻一下煎饼！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Give me a grin!", zh: "给我一个笑脸！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "We graduate today!", zh: "我们今天毕业啦！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Look! A gold medal grin!", zh: "快看！金色笑脸勋章！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Oh no! Sneaky Fox!", zh: "不好！鬼鬼祟祟的狐狸！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "The fox took the medal!", zh: "狐狸抢走了勋章！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Grab the stack! Chase the van!", zh: "抓起那叠煎饼！去追货车！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "The pup and the bus help.", zh: "小狗和公交车来帮忙。", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Bye-bye, van! Stop the fox!", zh: "再见，货车！拦住狐狸！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Kiss the medal. It is back!", zh: "亲亲勋章。它回来了！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Hand in hand we grin.", zh: "手拉手，我们笑。", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "We are proud kids.", zh: "我们是自豪的小朋友。", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Flip, stack, grab, grin!", zh: "翻、叠、抓、笑！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
      { en: "Graduation hug for all!", zh: "大家一起毕业拥抱！", sceneHint: "宝物：毕业笑脸勋章｜反派：Sneaky Fox（前几章狐狸的表弟）" },
    ],
  },
]

export function getChapterStory(chapterId: string): ChapterStory | undefined {
  return CHAPTER_STORIES.find((item) => item.id === chapterId)
}

export function storyAudioFile(chapterNo: number, pageNo: number, lang: 'en' | 'zh'): string {
  return `audio/story-ch${chapterNo}-p${pageNo}-${lang}.mp3`
}

/** Cream story panels that currently exist under `public/story/`. Missing chapters stay on the emoji placeholder. */
const STORY_IMAGE_PAGES: Readonly<Record<number, readonly number[]>> = {
  1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  2: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  7: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  8: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  11: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
}

export function storyImageFile(chapterNo: number, pageNo: number): string | undefined {
  const pages = STORY_IMAGE_PAGES[chapterNo]
  if (!pages?.includes(pageNo)) return undefined
  const page = String(pageNo).padStart(2, '0')
  return `${import.meta.env.BASE_URL}story/ch${chapterNo}/p${page}.webp`
}
