export type PlayItem = {
  id: string
  emoji: string
  name: string
  zh: string
  path: string
}

export const playItems: PlayItem[] = [
  { id: 'soundFish', emoji: '🐠', name: 'Sound Fish', zh: '听音点泡', path: '/sound-fish' },
  { id: 'wordMorph', emoji: '🎩', name: 'Word Morph', zh: '换首字母', path: '/word-morph' },
  { id: 'echoCave', emoji: '🎤', name: 'Echo Cave', zh: '跟读回音', path: '/echo-cave' },
  { id: 'tapTarget', emoji: '👆', name: 'Tap Target', zh: '点一点', path: '/tap-target' },
  { id: 'dragSort', emoji: '🧺', name: 'Drag Sort', zh: '拖一拖', path: '/drag-sort' },
  { id: 'onsetHunt', emoji: '🔎', name: 'Onset Hunt', zh: '找尾巴', path: '/onset-hunt' },
  { id: 'singAlong', emoji: '🎵', name: 'Sing Along', zh: '唱一唱', path: '/sing-along' },
  { id: 'findScene', emoji: '🏝️', name: 'Find Scene', zh: '找一找', path: '/find-scene' },
]

export function shuffle<T>(list: T[]): T[] {
  const next = [...list]
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}
