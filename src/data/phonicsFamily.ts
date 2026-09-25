export type WarmupPhoneme = {
  ipa: string
  letter: string
  speak: string
}

export type WordArt = {
  emoji: string
  label: string
  /** Kid-facing Chinese gloss. Flash cards show it; speech does not. */
  zh?: string
  image?: string
}

export function wordCardSrc(word: string): string {
  return `${import.meta.env.BASE_URL}word-cards/${word.toLowerCase()}.webp`
}

function clayArt(word: string, emoji: string, zh?: string): WordArt {
  return {
    emoji,
    label: word,
    zh,
    image: wordCardSrc(word),
  }
}

export type PhonicsFamily = {
  id: string
  family: string
  targets: string[]
  distractors: string[]
  warmupPhonemes: WarmupPhoneme[]
  wordArt: Record<string, WordArt>
  rewards: {
    soundFishSticker: { id: string; label: string }
  }
}

export const families: Record<string, PhonicsFamily> = {
  '-at': {
    id: '-at',
    family: '-at',
    targets: [
      'cat',
      'hat',
      'mat',
      'bat',
      'rat',
      'cup',
      'dog',
      'pig',
      'duck',
      'bird',
      'fish',
      'cake',
      'ball',
      'sun',
      'star',
    ],
    distractors: ['s', 'b', 'p', 't', 'd', 'r'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'K', speak: 'k' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
    ],
    // Animals island word bank: cat hosts; others are party friends / props.
    wordArt: {
      cat: clayArt('cat', '🐱', '猫'),
      hat: clayArt('hat', '🎩', '帽子'),
      mat: clayArt('mat', '🧶', '垫子'),
      bat: clayArt('bat', '🏏', '球棒'),
      rat: clayArt('rat', '🐀', '老鼠'),
      cup: clayArt('cup', '🥤', '杯子'),
      dog: clayArt('dog', '🐶', '狗'),
      pig: clayArt('pig', '🐷', '猪'),
      duck: clayArt('duck', '🦆', '鸭子'),
      bird: clayArt('bird', '🐦', '鸟'),
      fish: clayArt('fish', '🐟', '鱼'),
      cake: clayArt('cake', '🎂', '蛋糕'),
      ball: clayArt('ball', '⚽', '球'),
      sun: clayArt('sun', '☀️', '太阳'),
      star: clayArt('star', '⭐', '星星'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '派对耳朵' },
    },
  },
  '-ap': {
    id: '-ap',
    family: '-ap',
    targets: ['cap', 'map', 'nap', 'tap', 'lap'],
    distractors: ['s', 'b', 't', 'd', 'r', 'h'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
    ],
    wordArt: {
      cap: clayArt('cap', '🧢', '帽子'),
      map: { emoji: '🗺️', label: 'map', zh: '地图' },
      nap: clayArt('nap', '😴', '小睡'),
      tap: clayArt('tap', '🚰', '水龙头'),
      lap: { emoji: '🦵', label: 'lap', zh: '腿' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-og': {
    id: '-og',
    family: '-og',
    targets: ['frog', 'log', 'fog', 'jog', 'hog'],
    distractors: ['d', 'b', 'p', 't', 's', 'h'],
    warmupPhonemes: [
      { ipa: '/f/', letter: 'F', speak: 'f' },
      { ipa: '/l/', letter: 'L', speak: 'l' },
      { ipa: '/j/', letter: 'J', speak: 'j' },
    ],
    wordArt: {
      frog: clayArt('frog', '🐸', '青蛙'),
      log: clayArt('log', '🪵', '木头'),
      fog: clayArt('fog', '🌫️', '雾'),
      jog: clayArt('jog', '🏃', '慢跑'),
      hog: { emoji: '🐖', label: 'hog', zh: '猪' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-ck': {
    id: '-ck',
    family: '-ck',
    targets: ['duck', 'rock', 'sock', 'lock', 'pack'],
    distractors: ['s', 't', 'b', 'p', 'h', 'r'],
    warmupPhonemes: [
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/r/', letter: 'R', speak: 'r' },
      { ipa: '/s/', letter: 'S', speak: 's' },
    ],
    wordArt: {
      duck: clayArt('duck', '🦆', '鸭子'),
      rock: clayArt('rock', '🪨', '石头'),
      sock: clayArt('sock', '🧦', '袜子'),
      lock: clayArt('lock', '🔒', '锁'),
      pack: { emoji: '📦', label: 'pack', zh: '包' },
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-1': {
    id: 'rise-1',
    family: 'rise-1',
    targets: [
      'hop',
      'pot',
      'top',
      'mop',
      'van',
      'vet',
      'vest',
      'vat',
      'log',
      'lid',
      'lamp',
      'lock',
      'kid',
      'kit',
      'keg',
      'kick',
    ],
    distractors: ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 't', 'f'],
    warmupPhonemes: [
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/v/', letter: 'V', speak: 'v' },
      { ipa: '/l/', letter: 'L', speak: 'l' },
      { ipa: '/k/', letter: 'K', speak: 'k' },
    ],
    wordArt: {
      hop: clayArt('hop', '🐇', '跳'),
      pot: clayArt('pot', '🍲', '锅'),
      top: clayArt('top', '🪀', '陀螺'),
      mop: clayArt('mop', '🧹', '拖把'),
      van: clayArt('van', '🚐', '面包车'),
      vet: clayArt('vet', '🩺', '兽医'),
      vest: clayArt('vest', '🦺', '背心'),
      vat: clayArt('vat', '🪣', '大桶'),
      log: clayArt('log', '🪵', '木头'),
      lid: clayArt('lid', '🫙', '盖子'),
      lamp: clayArt('lamp', '💡', '台灯'),
      lock: clayArt('lock', '🔒', '锁'),
      kid: clayArt('kid', '🧒', '小孩'),
      kit: clayArt('kit', '🧰', '工具包'),
      keg: clayArt('keg', '🛢️', '小木桶'),
      kick: clayArt('kick', '👟', '踢'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-2': {
    id: 'rise-2',
    family: 'rise-2',
    targets: [
      'cub',
      'spot',
      'den',
      'nap',
      'box',
      'bag',
      'tin',
      'tub',
      'bug',
      'mug',
      'rug',
      'hug',
      'ham',
      'bun',
      'egg',
      'fish',
    ],
    distractors: ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 't', 'f'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/b/', letter: 'B', speak: 'b' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
    ],
    wordArt: {
      cub: clayArt('cub', '🐆', '幼崽'),
      spot: clayArt('spot', '🔘', '斑点'),
      den: clayArt('den', '🕳️', '洞穴'),
      nap: clayArt('nap', '😴', '小睡'),
      box: clayArt('box', '📦', '盒子'),
      bag: clayArt('bag', '👜', '袋子'),
      tin: clayArt('tin', '🥫', '铁罐'),
      tub: clayArt('tub', '🛁', '塑料盒'),
      bug: clayArt('bug', '🐛', '小虫子'),
      mug: clayArt('mug', '☕', '马克杯'),
      rug: clayArt('rug', '🧶', '小地毯'),
      hug: clayArt('hug', '🤗', '拥抱'),
      ham: clayArt('ham', '🍖', '火腿'),
      bun: clayArt('bun', '🍞', '小面包'),
      egg: clayArt('egg', '🥚', '鸡蛋'),
      fish: clayArt('fish', '🐟', '鱼'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-3': {
    id: 'rise-3',
    family: 'rise-3',
    targets: [
      'pig',
      'fig',
      'twig',
      'wig',
      'cat',
      'cab',
      'cot',
      'cup',
      'pup',
      'pen',
      'pin',
      'pad',
      'dot',
      'hat',
      'sock',
      'rock',
    ],
    distractors: ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 't', 'f'],
    warmupPhonemes: [
      { ipa: '/p/', letter: 'P', speak: 'p' },
      { ipa: '/f/', letter: 'F', speak: 'f' },
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/d/', letter: 'D', speak: 'd' },
    ],
    wordArt: {
      pig: clayArt('pig', '🐷', '猪'),
      fig: clayArt('fig', '🍈', '无花果'),
      twig: clayArt('twig', '🌿', '小树枝'),
      wig: clayArt('wig', '💇', '假发'),
      cat: clayArt('cat', '🐱', '猫'),
      cab: clayArt('cab', '🚕', '出租车'),
      cot: clayArt('cot', '🛏️', '小床'),
      cup: clayArt('cup', '🥤', '杯子'),
      pup: clayArt('pup', '🐶', '小狗'),
      pen: clayArt('pen', '🖊️', '钢笔'),
      pin: clayArt('pin', '📌', '图钉'),
      pad: clayArt('pad', '📝', '便签本'),
      dot: clayArt('dot', '🔴', '圆点'),
      hat: clayArt('hat', '🎩', '帽子'),
      sock: clayArt('sock', '🧦', '袜子'),
      rock: clayArt('rock', '🪨', '石头'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-4': {
    id: 'rise-4',
    family: 'rise-4',
    targets: [
      'hen',
      'bed',
      'pet',
      'leg',
      'gum',
      'tag',
      'gift',
      'rag',
      'hit',
      'bat',
      'mitt',
      'win',
      'dad',
      'mom',
      'sis',
      'tug',
    ],
    distractors: ['b', 'p', 's', 'm', 'h', 'n', 'r', 'd', 't', 'g'],
    warmupPhonemes: [
      { ipa: '/h/', letter: 'H', speak: 'h' },
      { ipa: '/g/', letter: 'G', speak: 'g' },
      { ipa: '/b/', letter: 'B', speak: 'b' },
      { ipa: '/d/', letter: 'D', speak: 'd' },
    ],
    wordArt: {
      hen: clayArt('hen', '🐔', '母鸡'),
      bed: clayArt('bed', '🛏️', '床'),
      pet: clayArt('pet', '🐾', '宠物'),
      leg: clayArt('leg', '🦵', '腿'),
      gum: clayArt('gum', '🍬', '口香糖'),
      tag: clayArt('tag', '🏷️', '名牌'),
      gift: clayArt('gift', '🎁', '礼物'),
      rag: clayArt('rag', '🧽', '抹布'),
      hit: clayArt('hit', '👊', '击打'),
      bat: clayArt('bat', '🏏', '球棒'),
      mitt: clayArt('mitt', '🧤', '棒球手套'),
      win: clayArt('win', '🏆', '赢'),
      dad: clayArt('dad', '👨', '爸爸'),
      mom: clayArt('mom', '👩', '妈妈'),
      sis: clayArt('sis', '👧', '姐妹'),
      tug: clayArt('tug', '🪢', '拔河'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-5': {
    id: 'rise-5',
    family: 'rise-5',
    targets: [
      'desk',
      'tent',
      'deck',
      'well',
      'hut',
      'fox',
      'rat',
      'ant',
      'web',
      'wok',
      'wag',
      'wink',
    ],
    distractors: ['d', 't', 'w', 'h', 'f', 'r', 'a', 'n'],
    warmupPhonemes: [
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/t/', letter: 'T', speak: 't' },
      { ipa: '/w/', letter: 'W', speak: 'w' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
    ],
    wordArt: {
      desk: clayArt('desk', '🪑', '书桌'),
      tent: clayArt('tent', '⛺', '帐篷'),
      deck: clayArt('deck', '🪵', '木平台'),
      well: clayArt('well', '🪣', '水井'),
      hut: clayArt('hut', '🛖', '小屋'),
      fox: clayArt('fox', '🦊', '狐狸'),
      rat: clayArt('rat', '🐀', '老鼠'),
      ant: clayArt('ant', '🐜', '蚂蚁'),
      web: clayArt('web', '🕸️', '蜘蛛网'),
      wok: clayArt('wok', '🍳', '炒锅'),
      wag: clayArt('wag', '🐕', '摇尾巴'),
      wink: clayArt('wink', '😉', '眨眼'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-6': {
    id: 'rise-6',
    family: 'rise-6',
    targets: [
      'dip',
      'sip',
      'tip',
      'rip',
      'cap',
      'tap',
      'trap',
      'clap',
      'jam',
      'jet',
      'jug',
      'jog',
      'sad',
      'glad',
      'hot',
      'wet',
    ],
    distractors: ['d', 's', 't', 'r', 'c', 'j', 'h', 'w'],
    warmupPhonemes: [
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/s/', letter: 'S', speak: 's' },
      { ipa: '/j/', letter: 'J', speak: 'j' },
      { ipa: '/h/', letter: 'H', speak: 'h' },
    ],
    wordArt: {
      dip: clayArt('dip', '🥄', '蘸'),
      sip: clayArt('sip', '🥤', '小口喝'),
      tip: clayArt('tip', '🫗', '倒出'),
      rip: clayArt('rip', '📄', '撕'),
      cap: clayArt('cap', '🧢', '帽子'),
      tap: clayArt('tap', '🚰', '水龙头'),
      trap: clayArt('trap', '🪤', '陷阱'),
      clap: clayArt('clap', '👏', '拍手'),
      jam: clayArt('jam', '🍓', '果酱'),
      jet: clayArt('jet', '✈️', '喷气式飞机'),
      jug: clayArt('jug', '🫖', '水壶'),
      jog: clayArt('jog', '🏃', '慢跑'),
      sad: clayArt('sad', '😢', '难过'),
      glad: clayArt('glad', '😊', '高兴'),
      hot: clayArt('hot', '🌡️', '热'),
      wet: clayArt('wet', '💧', '湿'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  '-an': {
    id: '-an',
    family: '-an',
    targets: ['can', 'man', 'pan'],
    distractors: ['s', 'b', 't', 'd', 'r', 'h'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'C', speak: 'k' },
      { ipa: '/m/', letter: 'M', speak: 'm' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
    ],
    wordArt: {
      can: { emoji: '🥫', label: 'can', zh: '罐子' },
      man: { emoji: '👨', label: 'man', zh: '人' },
      pan: clayArt('pan', '🍳', '平底锅'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-7': {
    id: 'rise-7',
    family: 'rise-7',
    targets: [
      'yak',
      'yam',
      'yo-yo',
      'yes',
      'doll',
      'bell',
      'belt',
      'drum',
      'net',
      'nut',
      'pan',
      'fan',
    ],
    distractors: ['y', 'd', 'b', 'n', 'p', 'f', 'm', 'l'],
    warmupPhonemes: [
      { ipa: '/y/', letter: 'Y', speak: 'y' },
      { ipa: '/d/', letter: 'D', speak: 'd' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
      { ipa: '/f/', letter: 'F', speak: 'f' },
    ],
    wordArt: {
      yak: clayArt('yak', '🦬', '牦牛'),
      yam: clayArt('yam', '🍠', '红薯'),
      'yo-yo': clayArt('yo-yo', '🪀', '悠悠球'),
      yes: clayArt('yes', '✅', '是的'),
      doll: clayArt('doll', '🪆', '娃娃'),
      bell: clayArt('bell', '🔔', '铃铛'),
      belt: clayArt('belt', '👔', '腰带'),
      drum: clayArt('drum', '🥁', '鼓'),
      net: clayArt('net', '🥅', '网兜'),
      nut: clayArt('nut', '🥜', '坚果'),
      pan: clayArt('pan', '🍳', '平底锅'),
      fan: clayArt('fan', '🪭', '风扇'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-8': {
    id: 'rise-8',
    family: 'rise-8',
    targets: [
      'fin',
      'fog',
      'flag',
      'frog',
      'mat',
      'sack',
      'hill',
      'bus',
      'zip',
      'zap',
      'buzz',
      'zigzag',
    ],
    distractors: ['f', 's', 'h', 'b', 'z', 'm', 'l', 'p'],
    warmupPhonemes: [
      { ipa: '/f/', letter: 'F', speak: 'f' },
      { ipa: '/s/', letter: 'S', speak: 's' },
      { ipa: '/z/', letter: 'Z', speak: 'z' },
    ],
    wordArt: {
      fin: clayArt('fin', '🐟', '鱼鳍'),
      fog: clayArt('fog', '🌫️', '雾'),
      flag: clayArt('flag', '🚩', '旗子'),
      frog: clayArt('frog', '🐸', '青蛙'),
      mat: clayArt('mat', '🧶', '垫子'),
      sack: clayArt('sack', '🛍️', '麻袋'),
      hill: clayArt('hill', '⛰️', '小山'),
      bus: clayArt('bus', '🚌', '公交车'),
      zip: clayArt('zip', '🤐', '拉拉链'),
      zap: clayArt('zap', '⚡', '嗖地一闪'),
      buzz: clayArt('buzz', '🐝', '嗡嗡叫'),
      zigzag: clayArt('zigzag', '〰️', '之字形跑'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
  'rise-9': {
    id: 'rise-9',
    family: 'rise-9',
    targets: [
      'king',
      'ring',
      'wing',
      'swing',
      'pond',
      'stump',
      'moss',
      'elk',
      'quack',
      'quick',
      'quiz',
      'quilt',
      'nip',
      'sting',
      'bump',
      'pinch',
    ],
    distractors: ['k', 'r', 'w', 's', 'p', 'm', 'q', 'n'],
    warmupPhonemes: [
      { ipa: '/k/', letter: 'K', speak: 'k' },
      { ipa: '/p/', letter: 'P', speak: 'p' },
      { ipa: '/kw/', letter: 'Q', speak: 'qu' },
      { ipa: '/n/', letter: 'N', speak: 'n' },
    ],
    wordArt: {
      king: clayArt('king', '👑', '国王'),
      ring: clayArt('ring', '💍', '戒指'),
      wing: clayArt('wing', '🪽', '翅膀'),
      swing: clayArt('swing', '🎠', '秋千'),
      pond: clayArt('pond', '🏞️', '池塘'),
      stump: clayArt('stump', '🪵', '树桩'),
      moss: clayArt('moss', '🌿', '苔藓'),
      elk: clayArt('elk', '🦌', '麋鹿'),
      quack: clayArt('quack', '🦆', '嘎嘎叫'),
      quick: clayArt('quick', '⚡', '快'),
      quiz: clayArt('quiz', '📝', '小测验'),
      quilt: clayArt('quilt', '🛏️', '被子'),
      nip: clayArt('nip', '🦷', '轻咬'),
      sting: clayArt('sting', '🐝', '蜇'),
      bump: clayArt('bump', '💥', '撞'),
      pinch: clayArt('pinch', '🤏', '捏/夹'),
    },
    rewards: {
      soundFishSticker: { id: 'ear', label: '耳朵' },
    },
  },
}

/** Swap this id to ship -ap / -an later. */
export const currentFamilyId = '-at'

export function getCurrentFamily(): PhonicsFamily {
  return families[currentFamilyId] ?? families['-at']
}

export function familyForWord(word: string): PhonicsFamily {
  const key = word.trim().toLowerCase()
  if (!key) return getCurrentFamily()
  for (const family of Object.values(families)) {
    if (family.wordArt[key] || family.targets.includes(key)) return family
  }
  return getCurrentFamily()
}

export function wordEmoji(word: string, family = familyForWord(word)): string {
  return family.wordArt[word.trim().toLowerCase()]?.emoji ?? '✨'
}

export function wordImage(word: string, family = familyForWord(word)): string | undefined {
  return family.wordArt[word.trim().toLowerCase()]?.image
}

/** First non-empty gloss. Later families can fill a word the earlier entry left blank. */
export function wordZh(word: string): string | undefined {
  const key = word.trim().toLowerCase()
  if (!key) return undefined
  for (const family of Object.values(families)) {
    const zh = family.wordArt[key]?.zh?.trim()
    if (zh) return zh
  }
  return undefined
}

/** Warm the browser cache for a small sampled set (gates / atlas extras). */
export function preloadWordCards(words: string[], family = getCurrentFamily()): void {
  if (typeof Image === 'undefined') return
  for (const word of words) {
    const src = wordImage(word, family)
    if (!src) continue
    const img = new Image()
    img.decoding = 'async'
    img.src = src
  }
}

function shuffledCopy<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

function uniqueWords(list: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const word = raw.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

/** Shuffle a custom pool (chapter / level lists) and take a short subset. */
export function sampleFromPool(pool: string[], count: number, family = getCurrentFamily()): string[] {
  const unique = uniqueWords(pool)
  const picked = shuffledCopy(unique).slice(0, Math.min(Math.max(0, count), unique.length))
  preloadWordCards(picked, family)
  return picked
}

export function pickOtherFromPool(
  pool: string[],
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  const blocked = new Set(exclude.map((word) => word.toLowerCase()))
  const candidates = uniqueWords(pool).filter((word) => !blocked.has(word))
  const picked = shuffledCopy(candidates).slice(0, Math.max(0, count))
  preloadWordCards(picked, family)
  return picked
}

/** One-run subset so a session stays short. */
export function sampleWords(count: number, family = getCurrentFamily()): string[] {
  return sampleFromPool(family.targets, count, family)
}

export function pickOtherWords(
  exclude: string[],
  count = 1,
  family = getCurrentFamily(),
): string[] {
  return pickOtherFromPool(family.targets, exclude, count, family)
}

export type AtlasWord = {
  word: string
  emoji: string
  image?: string
  familyId: string
  family: string
}

/** Every phonics-family target is a Word Atlas slot, including unused families. */
export function listAllFamilyWords(): AtlasWord[] {
  const seen = new Set<string>()
  const words: AtlasWord[] = []
  for (const family of Object.values(families)) {
    for (const word of family.targets) {
      const key = word.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      words.push({
        word,
        emoji: wordEmoji(word, family),
        image: family.wordArt[word]?.image,
        familyId: family.id,
        family: family.family,
      })
    }
  }
  return words
}
