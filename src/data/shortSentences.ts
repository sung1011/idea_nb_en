const FALLBACK_PREFIX = 'I see a'

export const shortSentences: Record<string, string> = {
  cap: 'A cap on a map.',
  map: 'I see a map.',
  nap: 'I can nap.',
  tap: 'Tap the map.',
  lap: 'Sit on a lap.',
  frog: 'A frog on a log.',
  log: 'A frog on a log.',
  fog: 'Fog on a log.',
  jog: 'I can jog.',
  hog: 'A hog can jog.',
  duck: 'A duck on a rock.',
  rock: 'Sit on a rock.',
  sock: 'A sock on a rock.',
  lock: 'Lock the box.',
  pack: 'Pack a sock.',
  cat: 'A cat in a cap.',
  hat: 'A hat on a cat.',
  mat: 'A cat on a mat.',
  bat: 'A bat on a mat.',
  rat: 'A rat on a mat.',
  cup: 'A cup for me.',
  dog: 'A dog can jog.',
  pig: 'A pig can jog.',
  bird: 'A bird can hop.',
  fish: 'A fish can swim.',
  cake: 'I like cake.',
  ball: 'Kick the ball.',
  sun: 'The sun is up.',
  star: 'I see a star.',
  can: 'I can hop.',
  man: 'A man can jog.',
  pan: 'A pan is hot.',
}

export function sentenceForWord(word: string): string {
  const key = word.trim().toLowerCase()
  if (!key) return `${FALLBACK_PREFIX} word.`
  return shortSentences[key] ?? `${FALLBACK_PREFIX} ${key}.`
}
