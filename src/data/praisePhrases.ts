export type PraiseKind = 'step' | 'finish' | 'soft'

/** Short cheers after a correct tap / sort / catch. */
export const stepPhrases = [
  'Yes!',
  "That's right!",
  'Correct!',
  'You got it!',
  'Spot on!',
  'Nice!',
  'Cool!',
  'Great!',
  'Super!',
  'Awesome!',
  'Amazing!',
  'Perfect!',
  'Lovely!',
  'Wonderful!',
  'Beautiful!',
  'Clever!',
  'Smart!',
  'Good job!',
  'Nice work!',
  'Well done!',
  'You rock!',
  'Brilliant!',
  'Fantastic!',
  'Excellent!',
  'Terrific!',
  'High five!',
  'Way to go!',
  'Hooray!',
  'Yay!',
  'Good listening!',
  "That's it!",
  'Wow!',
  'Yippee!',
  'Bravo!',
  'Good catch!',
  'You found it!',
  'Yes you did!',
  'Right on!',
  'Good looking!',
  'Sweet!',
] as const

/** Bigger cheer when a gate or day finishes. */
export const finishPhrases = [
  'Great job!',
  'Awesome job!',
  'You did it!',
  'Fantastic!',
  'Excellent work!',
  "You're a star!",
  'What a star!',
  'Outstanding!',
  'Marvelous!',
  'Wonderful job!',
  'Super star!',
  'Amazing work!',
  'You rock!',
  'High five!',
  'Way to go!',
  'Hooray!',
  'Brilliant work!',
  'Terrific job!',
  'All done!',
  'Nice work!',
  'Well done!',
  'Beautiful job!',
  'You finished it!',
  'Great playing!',
  'Yay!',
  'Awesome!',
] as const

/** Soft miss lines only — never a fail or red-X tone. */
export const softPhrases = [
  'Nice try!',
  'Keep going!',
  'Try again!',
  'You can do it!',
  'Have another go!',
  'Almost!',
  'Keep looking!',
  'Listen again!',
  'One more try!',
  "That's okay!",
  'Try once more!',
  'You got this!',
] as const

const banks: Record<PraiseKind, readonly string[]> = {
  step: stepPhrases,
  finish: finishPhrases,
  soft: softPhrases,
}

let lastPhrase = ''

export function pickPraise(kind: PraiseKind): string {
  const bank = banks[kind]
  const pool = bank.filter((line) => line !== lastPhrase)
  const next = pool[Math.floor(Math.random() * pool.length)] ?? bank[0]
  lastPhrase = next
  return next
}
