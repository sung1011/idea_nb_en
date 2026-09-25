import { MATH_LESSONS, type MathItem } from './mathLessons'
import { RISE_CHAPTER_STICKERS } from './stickers'

export type PlayKind =
  | 'flashFlip'
  | 'whackWord'
  | 'dragSort'
  | 'soundSpell'
  | 'wordFish'
  | 'echo'
  | 'storyBook'
  | 'chapterFinale'
  | 'numberFlash'
  | 'numberTap'
  | 'numberCount'

/** Pre-8-level path (v3 saves). Kept so older readers still compile; v6 resets level ids. */
export const LEGACY_SIX_PLAY_ORDER: PlayKind[] = [
  'flashFlip',
  'whackWord',
  'dragSort',
  'wordFish',
  'echo',
  'chapterFinale',
]

/** Persist v4 8-level path. v6 does not remap these ids onto lessons. */
export const V4_EIGHT_PLAY_ORDER: PlayKind[] = [
  'flashFlip',
  'whackWord',
  'dragSort',
  'soundSpell',
  'wordFish',
  'echo',
  'storyBook',
  'chapterFinale',
]

export const INSERTED_PLAY_KINDS: PlayKind[] = ['soundSpell', 'storyBook']

export type LevelStatus = 'locked' | 'unlocked' | 'cleared'

/**
 * Syllabus lesson kinds.
 * letterSight = letter + sight word, story = reader,
 * wordFamily = word builder / word family, math = number lesson, review = review or test.
 */
export type LessonType = 'letterSight' | 'story' | 'wordFamily' | 'math' | 'review'

export const CHAPTER_1_ID = 'ch1'
export const CHAPTER_2_ID = 'ch2'
export const CHAPTER_3_ID = 'ch3'
export const ANIMALS_CHAPTER_ID = CHAPTER_1_ID
export const DEFAULT_CHAPTER_ID = CHAPTER_1_ID
export const DEFAULT_LESSON_ID = 'ch1-k1'

export const PLAY_ROUTES: Record<PlayKind, string> = {
  flashFlip: '/flash-flip',
  whackWord: '/whack-word',
  dragSort: '/drag-sort',
  soundSpell: '/sound-spell',
  wordFish: '/sound-fish',
  echo: '/echo-cave',
  storyBook: '/story-book',
  chapterFinale: '/chapter-finale',
  numberFlash: '/number-flash',
  numberTap: '/number-tap',
  numberCount: '/number-count',
}

const PLAY_META: Record<PlayKind, { titleEn: string; titleZh: string }> = {
  flashFlip: { titleEn: 'Flash Flip', titleZh: '闪卡翻翻' },
  whackWord: { titleEn: 'Whack Word', titleZh: '地鼠词' },
  dragSort: { titleEn: 'Drag Sort', titleZh: '拖一拖' },
  soundSpell: { titleEn: 'Sound Spell', titleZh: '听音拼一拼' },
  wordFish: { titleEn: 'Word Fish', titleZh: '读词钓鱼' },
  echo: { titleEn: 'Echo', titleZh: '回声跟读' },
  storyBook: { titleEn: 'Story Book', titleZh: '小书点读' },
  chapterFinale: { titleEn: 'Review', titleZh: '小小回顾' },
  numberFlash: { titleEn: 'Number Cards', titleZh: '数字闪卡' },
  numberTap: { titleEn: 'Tap the Number', titleZh: '听音点数字' },
  numberCount: { titleEn: 'Count', titleZh: '数一数' },
}

export type StoryBeat = {
  word: string
  line: string
}

export type LevelDef = {
  id: string
  chapterId: string
  lessonId: string
  order: number
  play: PlayKind
  titleEn: string
  titleZh: string
  notes: string
  route: string
  focusWord?: string
  words?: string[]
  appearWords?: string[]
  storyPages?: StoryBeat[]
  /** Set on math lessons. Word lessons leave this empty. */
  numbers?: MathItem[]
  firstClearStars: number
  chapterStickerId?: string
}

export type LessonDef = {
  id: string
  chapterId: string
  /** 1–4 inside the chapter. */
  order: number
  /** 1–48 across the syllabus. L49-50 is 1. */
  index: number
  titleZh: string
  titleEn: string
  syllabusRange: string
  type: LessonType
  letter?: string
  sightWords: string[]
  sentence?: string
  words: string[]
  /** Empty until that课 has playable levels. */
  levels: LevelDef[]
}

export type ChapterDef = {
  id: string
  islandId: 'animals'
  titleEn: string
  titleZh: string
  kidTitle: string
  theme: string
  emoji: string
  stickerId: string
  syllabusRange: string
  words: string[]
  lessons: LessonDef[]
}

export type LessonLevelSpec = {
  play: PlayKind
  notes: string
  focusWord?: string
  words?: string[]
  appearWords?: string[]
  storyPages?: StoryBeat[]
  numbers?: MathItem[]
  titleZh?: string
  chapterStickerId?: string
}

function uniqueWords(list: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of list) {
    const word = raw?.trim().toLowerCase()
    if (!word || seen.has(word)) continue
    seen.add(word)
    out.push(word)
  }
  return out
}

export function buildLessonLevels(
  chapterId: string,
  lessonId: string,
  specs: LessonLevelSpec[],
): LevelDef[] {
  return specs.map((spec, index) => {
    const meta = PLAY_META[spec.play]
    const order = index + 1
    return {
      id: `${lessonId}-${order}`,
      chapterId,
      lessonId,
      order,
      play: spec.play,
      titleEn: meta.titleEn,
      titleZh: spec.titleZh ?? meta.titleZh,
      notes: spec.notes,
      route: PLAY_ROUTES[spec.play],
      focusWord: spec.focusWord,
      words: spec.words,
      appearWords: spec.appearWords,
      storyPages: spec.storyPages,
      numbers: spec.numbers,
      firstClearStars: 1,
      chapterStickerId: spec.chapterStickerId,
    }
  })
}

/** Math课: number cards, tap, count, whack, short review. Only these four numbers appear. */
export function buildMathLevels(
  chapterId: string,
  lessonId: string,
  items: MathItem[],
  chapterStickerId?: string,
): LevelDef[] {
  const numbers = items.map((item) => ({
    value: item.value,
    word: item.word.trim().toLowerCase(),
    zh: item.zh,
    sentence: item.sentence,
  }))
  const words = numbers.map((item) => item.word)
  return buildLessonLevels(chapterId, lessonId, [
    {
      play: 'numberFlash',
      notes: 'number flash cards',
      focusWord: words[0],
      words,
      numbers,
    },
    {
      play: 'numberTap',
      notes: 'hear and tap the numeral',
      words,
      numbers,
    },
    {
      play: 'numberCount',
      notes: 'count objects or tens',
      words,
      numbers,
    },
    {
      play: 'whackWord',
      notes: 'whack the numeral',
      titleZh: '打地鼠数字',
      words,
      numbers,
    },
    {
      play: 'chapterFinale',
      notes: chapterStickerId ? 'number review + lesson badge' : 'number review',
      titleZh: '小小回顾',
      words,
      numbers,
      chapterStickerId,
    },
  ])
}

/** Letter + sight word: flash, whack, spell, story, short review. */
export function buildLetterSightLevels(
  chapterId: string,
  lessonId: string,
  input: {
    flash: string[]
    whack: string[]
    spell: string[]
    story: StoryBeat[]
    review: string[]
    chapterStickerId?: string
  },
): LevelDef[] {
  const flash = uniqueWords(input.flash)
  const story = input.story.filter((page) => page.word && page.line)
  return buildLessonLevels(chapterId, lessonId, [
    {
      play: 'flashFlip',
      notes: 'letter CVC flash',
      focusWord: flash[0],
      appearWords: flash.slice(1),
      words: flash,
    },
    {
      play: 'whackWord',
      notes: 'hear and tap',
      words: uniqueWords(input.whack),
    },
    {
      play: 'soundSpell',
      notes: 'hear and spell',
      focusWord: input.spell[0],
      words: uniqueWords(input.spell),
    },
    {
      play: 'storyBook',
      notes: 'short decodable book',
      focusWord: story[0]?.word,
      words: uniqueWords(story.map((page) => page.word)),
      storyPages: story,
    },
    {
      play: 'chapterFinale',
      notes: input.chapterStickerId ? 'lesson review + chapter badge' : 'short mixed review',
      words: uniqueWords(input.review),
      chapterStickerId: input.chapterStickerId,
    },
  ])
}

/** Story课: book, fish, echo, spell, review. */
export function buildStoryLevels(
  chapterId: string,
  lessonId: string,
  input: {
    story: StoryBeat[]
    fish: string[]
    echo: string[]
    spell: string[]
    review: string[]
    chapterStickerId?: string
  },
): LevelDef[] {
  const story = input.story.filter((page) => page.word && page.line)
  return buildLessonLevels(chapterId, lessonId, [
    {
      play: 'storyBook',
      notes: 'story book first',
      focusWord: story[0]?.word,
      words: uniqueWords(story.map((page) => page.word)),
      storyPages: story,
    },
    { play: 'wordFish', notes: 'story words', words: uniqueWords(input.fish) },
    { play: 'echo', notes: 'story sentences', words: uniqueWords(input.echo) },
    {
      play: 'soundSpell',
      notes: 'spell story words',
      focusWord: input.spell[0],
      words: uniqueWords(input.spell),
    },
    {
      play: 'chapterFinale',
      notes: 'story review',
      words: uniqueWords(input.review),
      chapterStickerId: input.chapterStickerId,
    },
  ])
}

/** Word builder / family: sort, spell, fish, review. */
export function buildWordFamilyLevels(
  chapterId: string,
  lessonId: string,
  input: {
    sort: string[]
    spell: string[]
    fish: string[]
    review: string[]
    chapterStickerId?: string
  },
): LevelDef[] {
  return buildLessonLevels(chapterId, lessonId, [
    { play: 'dragSort', notes: 'sort by family', words: uniqueWords(input.sort) },
    {
      play: 'soundSpell',
      notes: 'spell family words',
      focusWord: input.spell[0],
      words: uniqueWords(input.spell),
    },
    { play: 'wordFish', notes: 'fish family words', words: uniqueWords(input.fish) },
    {
      play: 'chapterFinale',
      notes: 'family review',
      words: uniqueWords(input.review),
      chapterStickerId: input.chapterStickerId,
    },
  ])
}

/** Review / test: mixed flash, whack, review. */
export function buildReviewLevels(
  chapterId: string,
  lessonId: string,
  input: {
    flash: string[]
    whack: string[]
    review: string[]
    chapterStickerId?: string
  },
): LevelDef[] {
  const flash = uniqueWords(input.flash)
  return buildLessonLevels(chapterId, lessonId, [
    {
      play: 'flashFlip',
      notes: 'mixed flash',
      focusWord: flash[0],
      appearWords: flash.slice(1),
      words: flash,
    },
    { play: 'whackWord', notes: 'mixed listen', words: uniqueWords(input.whack) },
    {
      play: 'chapterFinale',
      notes: 'mixed review',
      words: uniqueWords(input.review),
      chapterStickerId: input.chapterStickerId,
    },
  ])
}

type SyllabusSeed = {
  titleZh: string
  titleEn: string
  type: LessonType
  letter?: string
  sightWords?: string[]
  sentence?: string
}

type ChapterSeed = {
  kidTitle: string
  titleEn: string
  emoji: string
  lessons: SyllabusSeed[]
}

/**
 * RISE Mart P1 from L49. Each cell is one 课 (two school lessons).
 * Ranges are computed: lesson 1 = L49-50 … lesson 48 = L143-144.
 * Second line of a letter cell is the sight word.
 */
const SYLLABUS: ChapterSeed[] = [
  {
    kidTitle: '字母朋友',
    titleEn: 'Letters O V L K',
    emoji: '🔤',
    lessons: [
      { titleZh: '字母 O · I', titleEn: 'Letter O · I', type: 'letterSight', letter: 'O', sightWords: ['I'], sentence: 'I can hop.' },
      { titleZh: '字母 V · my', titleEn: 'Letter V · my', type: 'letterSight', letter: 'V', sightWords: ['my'], sentence: 'My vet is in the van.' },
      { titleZh: '字母 L · good', titleEn: 'Letter L · good', type: 'letterSight', letter: 'L', sightWords: ['good'], sentence: 'It is a good log.' },
      { titleZh: '字母 K · three', titleEn: 'Letter K · three', type: 'letterSight', letter: 'K', sightWords: ['three'], sentence: 'Here are three kids.' },
    ],
  },
  {
    kidTitle: '小豹来了',
    titleEn: 'Leopard and Recycle',
    emoji: '🐆',
    lessons: [
      { titleZh: '小豹子', titleEn: 'Leopard', type: 'story', sentence: 'Leopard has a cub.' },
      { titleZh: '回收小书', titleEn: 'Recycle it', type: 'story', sentence: 'Recycle the box.' },
      { titleZh: '词块工坊 · we', titleEn: 'Word builder · we', type: 'wordFamily', sightWords: ['we'], sentence: 'We have a bug.' },
      { titleZh: '我想吃', titleEn: 'I like to eat · for', type: 'story', sightWords: ['for'], sentence: 'I like to eat ham.' },
    ],
  },
  {
    kidTitle: '词族和字母',
    titleEn: 'Word Family, C and P',
    emoji: '🖼️',
    lessons: [
      { titleZh: '词族肖像', titleEn: 'Word Family portrait', type: 'wordFamily', sentence: 'Is it a pig?' },
      { titleZh: '字母 C · find', titleEn: 'Letter C · find', type: 'letterSight', letter: 'C', sightWords: ['find'], sentence: 'Find the cat.' },
      { titleZh: '字母 P · all out', titleEn: 'Letter P · all out', type: 'letterSight', letter: 'P', sightWords: ['all', 'out'], sentence: 'The pup is out.' },
      { titleZh: '好多好多', titleEn: 'A lot, A lot', type: 'story', sentence: 'A lot of dots!' },
    ],
  },
  {
    kidTitle: '六只母鸡',
    titleEn: 'Six Hens',
    emoji: '🐔',
    lessons: [
      { titleZh: '六只母鸡会跳', titleEn: 'Six Hens Can hop · one two', type: 'story', sightWords: ['one', 'two'], sentence: 'One hen, two hens.' },
      { titleZh: '字母 G', titleEn: 'Letter G', type: 'letterSight', letter: 'G', sentence: 'A dog with gum.' },
      { titleZh: '大力一击', titleEn: 'A Big Hit', type: 'story', sentence: 'A big hit!' },
      { titleZh: '大胡萝卜', titleEn: 'The big carrot · help', type: 'story', sightWords: ['help'], sentence: 'Dad can help.' },
    ],
  },
  {
    kidTitle: '小屋和数字',
    titleEn: 'Numbers and the Hut',
    emoji: '🏡',
    lessons: [
      { titleZh: '数字 50–100', titleEn: 'Number 50-100', type: 'math', sentence: 'Count to fifty.' },
      { titleZh: '字母 E · at', titleEn: 'Letter E · at', type: 'letterSight', letter: 'E', sightWords: ['at'], sentence: 'Ben is at the desk.' },
      { titleZh: '谁住在小屋', titleEn: 'Who lives in the hut', type: 'story', sentence: 'Who lives in the hut?' },
      { titleZh: '字母 W · look', titleEn: 'Letter W · look', type: 'letterSight', letter: 'W', sightWords: ['look'], sentence: 'Look at the web.' },
    ],
  },
  {
    kidTitle: '丹和卡姆',
    titleEn: 'Dan and Cam',
    emoji: '👦',
    lessons: [
      { titleZh: '词块工坊', titleEn: 'Word Builder', type: 'wordFamily', sentence: 'Can you dip it?' },
      { titleZh: '词族肖像', titleEn: 'Word Family Portrait', type: 'wordFamily', sentence: 'Where is the cap?' },
      { titleZh: '字母 J · red', titleEn: 'Letter Jj · red', type: 'letterSight', letter: 'J', sightWords: ['red'], sentence: 'The jam is red.' },
      { titleZh: '丹和卡姆', titleEn: 'Dan and Cam · yellow', type: 'story', sightWords: ['yellow'], sentence: 'Dan and Cam are sad.' },
    ],
  },
  {
    kidTitle: '院子义卖',
    titleEn: 'The Yard Sale',
    emoji: '🏷️',
    lessons: [
      { titleZh: '字母 Y · get', titleEn: 'Letter Yy · get', type: 'letterSight', letter: 'Y', sightWords: ['get'], sentence: 'Get the yak.' },
      { titleZh: '多一个', titleEn: 'One more than', type: 'math', sentence: 'Five and one more is six.' },
      { titleZh: '院子义卖', titleEn: 'The Yard Sale', type: 'story', sentence: 'I got a doll.' },
      { titleZh: '字母 N · play', titleEn: 'Letter N · play', type: 'letterSight', letter: 'N', sightWords: ['play'], sentence: 'We play with a net.' },
    ],
  },
  {
    kidTitle: '卡姆和帕特',
    titleEn: 'Cam and Pat',
    emoji: '👫',
    lessons: [
      { titleZh: '少一个', titleEn: 'One fewer than', type: 'math', sentence: 'One fewer than one is zero.' },
      { titleZh: '字母 F · see blue', titleEn: 'Letter F · see blue', type: 'letterSight', letter: 'F', sightWords: ['see', 'blue'], sentence: 'I see a blue fin.' },
      { titleZh: '卡姆和帕特', titleEn: 'Cam and Pat', type: 'story', sentence: 'Pat sat on the mat.' },
      { titleZh: '字母 Z · jump', titleEn: 'Letter z · jump run up', type: 'letterSight', letter: 'Z', sightWords: ['jump', 'run', 'up'], sentence: 'Jump up and zip!' },
    ],
  },
  {
    kidTitle: '走进森林',
    titleEn: 'In the Forest',
    emoji: '🌲',
    lessons: [
      { titleZh: '词块和词族', titleEn: 'Word Builder/Family', type: 'wordFamily', sentence: 'What a king!' },
      { titleZh: '在森林里', titleEn: 'In the Forest', type: 'story', sentence: 'Run to the pond.' },
      { titleZh: '字母 Q · she say', titleEn: 'Letter Q · she say', type: 'letterSight', letter: 'Q', sightWords: ['she', 'say'], sentence: 'She says, "Quack!"' },
      { titleZh: '停下，小虫', titleEn: 'Quit it, Bug', type: 'story', sentence: 'Do not nip me, Bug!' },
    ],
  },
  {
    kidTitle: '爸爸做饭',
    titleEn: 'Dad Cooks',
    emoji: '🍳',
    lessons: [
      { titleZh: '字母 X', titleEn: 'Letter X', type: 'letterSight', letter: 'X' },
      { titleZh: '爸爸爱做饭', titleEn: 'Dad Likes to cook', type: 'story' },
      { titleZh: 'CVC 复习', titleEn: 'CVC Review', type: 'review' },
      { titleZh: '五个五个数', titleEn: 'Skip counting by 5s', type: 'math' },
    ],
  },
  {
    kidTitle: '霍普的地图',
    titleEn: "Hope's Map",
    emoji: '🗺️',
    lessons: [
      { titleZh: '我是 E', titleEn: 'I am E', type: 'story' },
      { titleZh: '找出带 e 的词', titleEn: 'Find e words', type: 'review' },
      { titleZh: '霍普的地图', titleEn: "Hope's Map", type: 'story' },
      { titleZh: '小测验', titleEn: 'Test', type: 'review' },
    ],
  },
  {
    kidTitle: '毕业小复习',
    titleEn: 'Graduation',
    emoji: '🎓',
    lessons: [
      { titleZh: '两个两个数', titleEn: 'Skip counting by 2s', type: 'math' },
      { titleZh: '煎饼', titleEn: 'Pancakes', type: 'story' },
      { titleZh: '毕业啦', titleEn: 'Graduation', type: 'story' },
      { titleZh: '总复习', titleEn: 'Review', type: 'review' },
    ],
  },
]

type LessonWordPack = {
  words: string[]
  spell: string[]
  pages: StoryBeat[]
}

/**
 * Playable 课 content. Later chapters add a key here; empty chapters stay 即将开放.
 * Each pack is exactly four words. Spell is a subset. The last 课 of a chapter gets the badge.
 */
const PLAYABLE_LESSONS: Record<string, Array<LessonWordPack | null>> = {
  ch1: [
    {
      words: ['hop', 'pot', 'top', 'mop'],
      spell: ['hop', 'pot', 'top'],
      pages: [
        { word: 'hop', line: 'I can hop.' },
        { word: 'mop', line: 'I can mop.' },
        { word: 'top', line: 'I can spin the top.' },
        { word: 'pot', line: 'I can mop the pot.' },
      ],
    },
    {
      words: ['van', 'vet', 'vest', 'vat'],
      spell: ['van', 'vet', 'vat'],
      pages: [
        { word: 'vet', line: 'My vet is in the van.' },
        { word: 'vest', line: 'My vest is in the van.' },
        { word: 'vat', line: 'My vat is in the van.' },
        { word: 'van', line: 'My van is big.' },
      ],
    },
    {
      words: ['log', 'lid', 'lamp', 'lock'],
      spell: ['log', 'lid', 'lamp'],
      pages: [
        { word: 'log', line: 'It is a good log.' },
        { word: 'lid', line: 'It is a good lid.' },
        { word: 'lamp', line: 'It is a good lamp.' },
        { word: 'lock', line: 'It is a good lock.' },
      ],
    },
    {
      words: ['kid', 'kit', 'keg', 'kick'],
      spell: ['kid', 'kit', 'keg'],
      pages: [
        { word: 'kid', line: 'Here are three kids.' },
        { word: 'kit', line: 'Here are three kits.' },
        { word: 'keg', line: 'Here are three kegs.' },
        { word: 'kick', line: 'Kick it, kid!' },
      ],
    },
  ],
  ch2: [
    {
      words: ['cub', 'spot', 'den', 'nap'],
      spell: ['cub', 'den', 'nap'],
      pages: [
        { word: 'cub', line: 'Leopard has a cub.' },
        { word: 'spot', line: 'Leopard has a spot.' },
        { word: 'den', line: 'Leopard has a den.' },
        { word: 'nap', line: 'Leopard has a nap.' },
      ],
    },
    {
      words: ['box', 'bag', 'tin', 'tub'],
      spell: ['box', 'bag', 'tin'],
      pages: [
        { word: 'box', line: 'Recycle the box.' },
        { word: 'bag', line: 'Recycle the bag.' },
        { word: 'tin', line: 'Recycle the tin.' },
        { word: 'tub', line: 'Recycle the tub.' },
      ],
    },
    {
      words: ['bug', 'mug', 'rug', 'hug'],
      spell: ['bug', 'mug', 'rug'],
      pages: [
        { word: 'bug', line: 'We have a bug.' },
        { word: 'mug', line: 'We have a mug.' },
        { word: 'rug', line: 'We have a rug.' },
        { word: 'hug', line: 'We have a big hug!' },
      ],
    },
    {
      words: ['ham', 'bun', 'egg', 'fish'],
      spell: ['ham', 'bun', 'egg'],
      pages: [
        { word: 'ham', line: 'I like to eat ham.' },
        { word: 'bun', line: 'I like to eat a bun.' },
        { word: 'egg', line: 'I like to eat an egg.' },
        { word: 'fish', line: 'I like to eat fish.' },
      ],
    },
  ],
  ch3: [
    {
      words: ['pig', 'fig', 'twig', 'wig'],
      spell: ['pig', 'fig', 'twig'],
      pages: [
        { word: 'pig', line: 'Is it a pig?' },
        { word: 'fig', line: 'Is it a fig?' },
        { word: 'twig', line: 'Is it a twig?' },
        { word: 'wig', line: 'Is it a wig?' },
      ],
    },
    {
      words: ['cat', 'cab', 'cot', 'cup'],
      spell: ['cat', 'cab', 'cot'],
      pages: [
        { word: 'cat', line: 'Find the cat.' },
        { word: 'cab', line: 'Find the cab.' },
        { word: 'cot', line: 'Find the cot.' },
        { word: 'cup', line: 'Find the cup.' },
      ],
    },
    {
      words: ['pup', 'pen', 'pin', 'pad'],
      spell: ['pup', 'pen', 'pin'],
      pages: [
        { word: 'pup', line: 'The pup is out.' },
        { word: 'pen', line: 'The pen is out.' },
        { word: 'pin', line: 'The pin is out.' },
        { word: 'pad', line: 'All the pads are out.' },
      ],
    },
    {
      words: ['dot', 'hat', 'sock', 'rock'],
      spell: ['dot', 'hat', 'sock'],
      pages: [
        { word: 'dot', line: 'A lot of dots!' },
        { word: 'hat', line: 'A lot of hats!' },
        { word: 'sock', line: 'A lot of socks!' },
        { word: 'rock', line: 'A lot of rocks!' },
      ],
    },
  ],
  ch4: [
    {
      words: ['hen', 'bed', 'pet', 'leg'],
      spell: ['hen', 'bed', 'pet'],
      pages: [
        { word: 'hen', line: 'One hen, two hens.' },
        { word: 'bed', line: 'One bed, two beds.' },
        { word: 'pet', line: 'One pet, two pets.' },
        { word: 'leg', line: 'One leg, two legs.' },
      ],
    },
    {
      words: ['gum', 'tag', 'gift', 'rag'],
      spell: ['gum', 'tag', 'gift'],
      pages: [
        { word: 'gum', line: 'A dog with gum.' },
        { word: 'tag', line: 'A dog with a tag.' },
        { word: 'gift', line: 'A dog with a gift.' },
        { word: 'rag', line: 'A dog with a rag.' },
      ],
    },
    {
      words: ['hit', 'bat', 'mitt', 'win'],
      spell: ['hit', 'bat', 'mitt'],
      pages: [
        { word: 'hit', line: 'A big hit!' },
        { word: 'bat', line: 'A big bat!' },
        { word: 'mitt', line: 'A big mitt!' },
        { word: 'win', line: 'A big win!' },
      ],
    },
    {
      words: ['dad', 'mom', 'sis', 'tug'],
      spell: ['dad', 'mom', 'sis'],
      pages: [
        { word: 'dad', line: 'Dad can help.' },
        { word: 'mom', line: 'Mom can help.' },
        { word: 'sis', line: 'Sis can help.' },
        { word: 'tug', line: 'We tug and tug!' },
      ],
    },
  ],
  ch5: [
    null,
    {
      words: ['desk', 'tent', 'deck', 'well'],
      spell: ['desk', 'tent', 'deck'],
      pages: [
        { word: 'desk', line: 'Ben is at the desk.' },
        { word: 'tent', line: 'Ben is at the tent.' },
        { word: 'deck', line: 'Ben is at the deck.' },
        { word: 'well', line: 'Ben is at the well.' },
      ],
    },
    {
      words: ['hut', 'fox', 'rat', 'ant'],
      spell: ['hut', 'fox', 'rat'],
      pages: [
        { word: 'hut', line: 'Who lives in the hut?' },
        { word: 'fox', line: 'A fox lives in the hut.' },
        { word: 'rat', line: 'A rat lives in the hut.' },
        { word: 'ant', line: 'An ant lives in the hut.' },
      ],
    },
    {
      words: ['web', 'wok', 'wag', 'wink'],
      spell: ['web', 'wok', 'wag'],
      pages: [
        { word: 'web', line: 'Look at the web.' },
        { word: 'wok', line: 'Look at the wok.' },
        { word: 'wag', line: 'Look at the dog wag.' },
        { word: 'wink', line: 'Look at me wink!' },
      ],
    },
  ],
  ch6: [
    {
      words: ['dip', 'sip', 'tip', 'rip'],
      spell: ['dip', 'sip', 'tip'],
      pages: [
        { word: 'dip', line: 'Can you dip it?' },
        { word: 'sip', line: 'Can you sip it?' },
        { word: 'tip', line: 'Can you tip it?' },
        { word: 'rip', line: 'Can you rip it?' },
      ],
    },
    {
      words: ['cap', 'tap', 'trap', 'clap'],
      spell: ['cap', 'tap', 'trap'],
      pages: [
        { word: 'cap', line: 'Where is the cap?' },
        { word: 'tap', line: 'Where is the tap?' },
        { word: 'trap', line: 'Where is the trap?' },
        { word: 'clap', line: 'Clap, clap! Here it is!' },
      ],
    },
    {
      words: ['jam', 'jet', 'jug', 'jog'],
      spell: ['jam', 'jet', 'jug'],
      pages: [
        { word: 'jam', line: 'The jam is red.' },
        { word: 'jet', line: 'The jet is red.' },
        { word: 'jug', line: 'The jug is red.' },
        { word: 'jog', line: 'Jog, jog, jog!' },
      ],
    },
    {
      words: ['sad', 'glad', 'hot', 'wet'],
      spell: ['sad', 'glad', 'hot'],
      pages: [
        { word: 'sad', line: 'Dan and Cam are sad.' },
        { word: 'glad', line: 'Dan and Cam are glad.' },
        { word: 'hot', line: 'Dan and Cam are hot in the yellow sun.' },
        { word: 'wet', line: 'Dan and Cam are wet.' },
      ],
    },
  ],
  ch7: [
    {
      words: ['yak', 'yam', 'yo-yo', 'yes'],
      spell: ['yak', 'yam', 'yo-yo'],
      pages: [
        { word: 'yak', line: 'Get the yak.' },
        { word: 'yam', line: 'Get the yam.' },
        { word: 'yo-yo', line: 'Get the yo-yo.' },
        { word: 'yes', line: 'Yes! I get it!' },
      ],
    },
    null,
    {
      words: ['doll', 'bell', 'belt', 'drum'],
      spell: ['doll', 'bell', 'belt'],
      pages: [
        { word: 'doll', line: 'I got a doll.' },
        { word: 'bell', line: 'I got a bell.' },
        { word: 'belt', line: 'I got a belt.' },
        { word: 'drum', line: 'I got a drum.' },
      ],
    },
    {
      words: ['net', 'nut', 'pan', 'fan'],
      spell: ['net', 'nut', 'pan'],
      pages: [
        { word: 'net', line: 'We play with a net.' },
        { word: 'nut', line: 'We play with a nut.' },
        { word: 'pan', line: 'We play with a pan.' },
        { word: 'fan', line: 'We play with a fan.' },
      ],
    },
  ],
  ch8: [
    null,
    {
      words: ['fin', 'fog', 'flag', 'frog'],
      spell: ['fin', 'fog', 'flag'],
      pages: [
        { word: 'fin', line: 'I see a blue fin.' },
        { word: 'fog', line: 'I see blue fog.' },
        { word: 'flag', line: 'I see a blue flag.' },
        { word: 'frog', line: 'I see a blue frog.' },
      ],
    },
    {
      words: ['mat', 'sack', 'hill', 'bus'],
      spell: ['mat', 'sack', 'hill'],
      pages: [
        { word: 'mat', line: 'Pat sat on the mat.' },
        { word: 'sack', line: 'Pat sat on the sack.' },
        { word: 'hill', line: 'Pat sat on the hill.' },
        { word: 'bus', line: 'Cam sat on the bus.' },
      ],
    },
    {
      words: ['zip', 'zap', 'buzz', 'zigzag'],
      spell: ['zip', 'zap', 'buzz'],
      pages: [
        { word: 'zip', line: 'Jump up and zip!' },
        { word: 'zap', line: 'Jump up and zap!' },
        { word: 'buzz', line: 'Jump up and buzz!' },
        { word: 'zigzag', line: 'Run up and zigzag!' },
      ],
    },
  ],
  ch9: [
    {
      words: ['king', 'ring', 'wing', 'swing'],
      spell: ['king', 'ring', 'wing'],
      pages: [
        { word: 'king', line: 'What a king!' },
        { word: 'ring', line: 'What a ring!' },
        { word: 'wing', line: 'What a wing!' },
        { word: 'swing', line: 'What a swing!' },
      ],
    },
    {
      words: ['pond', 'stump', 'moss', 'elk'],
      spell: ['pond', 'stump', 'moss'],
      pages: [
        { word: 'pond', line: 'Run to the pond.' },
        { word: 'stump', line: 'Run to the stump.' },
        { word: 'moss', line: 'Run to the moss.' },
        { word: 'elk', line: 'Run to the elk.' },
      ],
    },
    {
      words: ['quack', 'quick', 'quiz', 'quilt'],
      spell: ['quack', 'quick', 'quiz'],
      pages: [
        { word: 'quack', line: 'She says, "Quack!"' },
        { word: 'quick', line: 'She says, "Quick!"' },
        { word: 'quiz', line: 'She says, "A quiz!"' },
        { word: 'quilt', line: 'She says, "My quilt!"' },
      ],
    },
    {
      words: ['nip', 'sting', 'bump', 'pinch'],
      spell: ['nip', 'sting', 'bump'],
      pages: [
        { word: 'nip', line: 'Do not nip me, Bug!' },
        { word: 'sting', line: 'Do not sting me, Bug!' },
        { word: 'bump', line: 'Do not bump me, Bug!' },
        { word: 'pinch', line: 'Do not pinch me, Bug! Quit it!' },
      ],
    },
  ],
}

function playableLevels(chapterId: string, lessonId: string, lessonOrder: number): LevelDef[] {
  const chapterIndex = Number(chapterId.slice(2)) - 1
  const lessonBadge =
    chapterId === 'ch4' ||
    chapterId === 'ch5' ||
    chapterId === 'ch6' ||
    chapterId === 'ch7' ||
    chapterId === 'ch8' ||
    chapterId === 'ch9'
      ? `rise${chapterIndex * 4 + lessonOrder}`
      : undefined
  const stickerId = lessonBadge ?? (lessonOrder === 4 ? RISE_CHAPTER_STICKERS[chapterIndex]?.id : undefined)
  const math = MATH_LESSONS[lessonId]
  if (math) return buildMathLevels(chapterId, lessonId, math, stickerId)
  const pack = PLAYABLE_LESSONS[chapterId]?.[lessonOrder - 1]
  if (!pack) return []
  return buildLetterSightLevels(chapterId, lessonId, {
    flash: pack.words,
    whack: pack.words,
    spell: pack.spell,
    story: pack.pages,
    review: pack.words,
    chapterStickerId: stickerId,
  })
}

function lessonWords(levels: LevelDef[], sightWords: string[]): string[] {
  return uniqueWords([
    ...sightWords,
    ...levels.flatMap((level) => [level.focusWord, ...(level.appearWords ?? []), ...(level.words ?? [])]),
  ])
}

function buildChapters(): ChapterDef[] {
  let index = 0
  return SYLLABUS.map((seed, chapterIndex) => {
    const chapterNumber = chapterIndex + 1
    const chapterId = `ch${chapterNumber}`
    const stickerId = RISE_CHAPTER_STICKERS[chapterIndex]?.id ?? `rise${chapterNumber}`
    const lessons = seed.lessons.map((raw, lessonIndex) => {
      index += 1
      const order = lessonIndex + 1
      const id = `${chapterId}-k${order}`
      const rangeStart = 49 + (index - 1) * 2
      const levels = playableLevels(chapterId, id, order)
      const sightWords = raw.sightWords ?? []
      return {
        id,
        chapterId,
        order,
        index,
        titleZh: raw.titleZh,
        titleEn: raw.titleEn,
        syllabusRange: `L${rangeStart}-${rangeStart + 1}`,
        type: raw.type,
        letter: raw.letter,
        sightWords,
        sentence: raw.sentence,
        words: lessonWords(levels, []),
        levels,
      }
    })
    const first = lessons[0]
    const last = lessons[lessons.length - 1]
    const rangeStart = first ? 49 + (first.index - 1) * 2 : 0
    const rangeEnd = last ? 49 + (last.index - 1) * 2 + 1 : 0
    return {
      id: chapterId,
      islandId: 'animals' as const,
      titleEn: seed.titleEn,
      titleZh: `「${seed.kidTitle}」`,
      kidTitle: seed.kidTitle,
      theme: `rise${chapterNumber}`,
      emoji: seed.emoji,
      stickerId,
      syllabusRange: first && last ? `L${rangeStart}-${rangeEnd}` : '',
      words: uniqueWords(lessons.flatMap((lesson) => lesson.words)),
      lessons,
    }
  })
}

export const CHAPTERS: ChapterDef[] = buildChapters()

const chapterById = new Map(CHAPTERS.map((chapter) => [chapter.id, chapter]))
const lessonById = new Map(CHAPTERS.flatMap((chapter) => chapter.lessons.map((lesson) => [lesson.id, lesson])))
const levelById = new Map(
  CHAPTERS.flatMap((chapter) => chapter.lessons.flatMap((lesson) => lesson.levels.map((level) => [level.id, level]))),
)

export const CHAPTER_1 = CHAPTERS[0]
export const CHAPTER_2 = CHAPTERS[1]
export const CHAPTER_3 = CHAPTERS[2]

export function listChapters(): ChapterDef[] {
  return CHAPTERS
}

export function listLessons(): LessonDef[] {
  return CHAPTERS.flatMap((chapter) => chapter.lessons)
}

export function listChapterLessons(chapterId: string = DEFAULT_CHAPTER_ID): LessonDef[] {
  return getChapter(chapterId)?.lessons ?? []
}

export function getChapter(id: string = DEFAULT_CHAPTER_ID): ChapterDef | undefined {
  return chapterById.get(id)
}

export function getChapterOrDefault(id?: string): ChapterDef {
  return getChapter(id) ?? CHAPTER_1
}

export function getLesson(id?: string | null): LessonDef | undefined {
  if (!id) return undefined
  return lessonById.get(id)
}

export function getFirstLesson(chapterId: string = DEFAULT_CHAPTER_ID): LessonDef {
  return listChapterLessons(chapterId)[0] ?? listLessons()[0]
}

export function isKnownLessonId(id: string): boolean {
  return lessonById.has(id)
}

export function listChapterLevels(chapterId: string = DEFAULT_CHAPTER_ID): LevelDef[] {
  return listChapterLessons(chapterId).flatMap((lesson) => lesson.levels)
}

export function listLessonLevels(lessonId: string): LevelDef[] {
  return getLesson(lessonId)?.levels ?? []
}

/** Config-driven count. Empty chapters return 0 so callers can show 即将开放. */
export function chapterLevelTotal(chapterId: string = DEFAULT_CHAPTER_ID): number {
  return listChapterLevels(chapterId).length
}

export function lessonLevelTotal(lessonId: string): number {
  return listLessonLevels(lessonId).length
}

export function levelIdForPlay(play: PlayKind, scopeId: string = DEFAULT_CHAPTER_ID): string | undefined {
  const lesson = getLesson(scopeId)
  if (lesson) return lesson.levels.find((item) => item.play === play)?.id
  return listChapterLevels(scopeId).find((item) => item.play === play)?.id
}

export function listAllLevels(): LevelDef[] {
  return listLessons().flatMap((lesson) => lesson.levels)
}

export function getLevel(id: string): LevelDef | undefined {
  return levelById.get(id)
}

export function isKnownLevelId(id: string): boolean {
  return levelById.has(id)
}

export function getFirstLevel(chapterId: string = DEFAULT_CHAPTER_ID): LevelDef {
  return listChapterLevels(chapterId)[0] ?? listAllLevels()[0]
}

export function getChapterIndex(chapterId: string): number {
  return CHAPTERS.findIndex((chapter) => chapter.id === chapterId)
}

export function getChapterNumber(chapterId: string): number {
  const index = getChapterIndex(chapterId)
  return index >= 0 ? index + 1 : 1
}

export function chapterKidTitle(chapterId: string): string {
  return getChapter(chapterId)?.kidTitle ?? ''
}

export function lessonKidTitle(lessonId?: string | null): string {
  return getLesson(lessonId)?.titleZh ?? ''
}

export function isAnimalsChapterId(id: string): boolean {
  return chapterById.has(id)
}

export const CHAPTER_LOBBY_EMOJI: Record<string, string> = Object.fromEntries(
  CHAPTERS.map((chapter) => [chapter.id, chapter.emoji]),
)

export function getPriorChapter(chapterId: string): ChapterDef | null {
  const index = getChapterIndex(chapterId)
  return index > 0 ? CHAPTERS[index - 1] : null
}

export function getNextChapter(chapterId: string): ChapterDef | null {
  const index = getChapterIndex(chapterId)
  return index >= 0 && index < CHAPTERS.length - 1 ? CHAPTERS[index + 1] : null
}

export function getPriorLesson(lessonId: string): LessonDef | null {
  const lesson = getLesson(lessonId)
  if (!lesson || lesson.index <= 1) return null
  return listLessons()[lesson.index - 2] ?? null
}

export function getNextLesson(lessonId: string): LessonDef | null {
  const lesson = getLesson(lessonId)
  if (!lesson) return null
  return listLessons()[lesson.index] ?? null
}

/** Prior chapter id that must be fully cleared, or null for the first chapter. */
export function chapterUnlocksAfter(chapterId: string): string | null {
  return getPriorChapter(chapterId)?.id ?? null
}

export function getNextLevelDef(levelId: string): LevelDef | null {
  const current = getLevel(levelId)
  if (!current) return null
  const levels = listLessonLevels(current.lessonId)
  return levels.find((item) => item.order === current.order + 1) ?? null
}

/** Next level in this课, or the first level of the following课 that has content. */
export function getNextMainlineLevelDef(levelId: string): LevelDef | null {
  const intra = getNextLevelDef(levelId)
  if (intra) return intra
  const current = getLevel(levelId)
  if (!current) return null
  let cursor: LessonDef | null = getNextLesson(current.lessonId)
  while (cursor) {
    if (cursor.levels.length) return cursor.levels[0]
    cursor = getNextLesson(cursor.id)
  }
  return null
}

export function playKindToGate(play: PlayKind): string | null {
  if (play === 'flashFlip') return 'flashFlip'
  if (play === 'whackWord') return 'whackWord'
  if (play === 'dragSort') return 'dragSort'
  if (play === 'wordFish') return 'soundFish'
  if (play === 'echo') return 'echoCave'
  return null
}

export function defaultLevelIdForPlay(play: PlayKind): string {
  return listAllLevels().find((item) => item.play === play)?.id ?? getFirstLevel().id
}

/**
 * Query `?level=` wins when it matches this play.
 * A known level of another play remaps inside that same课.
 */
export function resolveLevelId(play: PlayKind, raw?: string | null): string {
  if (raw) {
    const def = getLevel(raw)
    if (def && def.play === play) return def.id
    if (def) {
      const remapped = levelIdForPlay(play, def.lessonId)
      if (remapped) return remapped
    }
  }
  return defaultLevelIdForPlay(play)
}

export function lessonHasContent(lessonId: string): boolean {
  return listLessonLevels(lessonId).length > 0
}
