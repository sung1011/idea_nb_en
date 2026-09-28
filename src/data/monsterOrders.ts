function escapeReg(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasToken(line: string, word: string): boolean {
  return new RegExp(`(?:^|[^A-Za-z])${escapeReg(word)}(?![A-Za-z])`, 'i').test(line)
}

function nameWord(word: string): string {
  if (word === 'dad') return 'Dad'
  if (word === 'mom') return 'Mom'
  if (word === 'sis') return 'Sis'
  return word
}

/**
 * Turn a lesson sentence into a monster food order that still uses that pattern
 * and says the target word. Empty pattern falls back to "I want the …".
 */
export function monsterOrderLine(pattern: string, word: string): string {
  const line = pattern.replace(/\s+/g, ' ').trim()
  const raw = word.trim()
  const w = raw.toLowerCase()
  if (!w) return ''
  const token = escapeReg(w)

  if (!line) return `I want the ${w}.`

  const eat = line.match(/^I like to eat (.+?)[.!]?$/i)
  if (eat && hasToken(eat[1], w)) return `I want to eat ${eat[1].replace(/[.!]$/, '')}.`

  if (new RegExp(`^I can ${token}\\.$`, 'i').test(line)) return `I want to ${w}.`

  const canThe = line.match(/^I can (\w+) the (\w+)\.$/i)
  if (canThe && canThe[2].toLowerCase() === w) return `I want to ${canThe[1].toLowerCase()} the ${w}.`

  if (new RegExp(`^Can you ${token} it\\?$`, 'i').test(line)) return `I want to ${w} it.`
  if (new RegExp(`^Do not ${token} me\\b`, 'i').test(line)) return `I want to ${w}!`
  if (new RegExp(`^Dad likes to ${token}\\.$`, 'i').test(line)) return `I want to ${w}.`
  if (new RegExp(`^(?:Jump up|Run up) and ${token}!$`, 'i').test(line)) return `I want to ${w}!`
  if (new RegExp(`^${token}(?:, ${token})+!$`, 'i').test(line)) return `I want to ${w}!`
  if (w === 'tug' && /^We tug and tug!$/i.test(line)) return 'I want to tug!'
  if (w === 'wag' && /^Look at the dog wag\.$/i.test(line)) return 'I want the dog to wag.'
  if (w === 'wink' && /^Look at me wink!$/i.test(line)) return 'I want to wink!'
  if (w === 'yes' && /^Yes! I get it!$/i.test(line)) return 'Yes! I want it!'
  if (w === 'kick' && /^Kick it, kid!$/i.test(line)) return 'I want to kick!'
  if (w === 'clap' && /^Clap, clap!/i.test(line)) return 'I want to clap!'
  if (/^The ox will (\w+) it\.$/i.test(line) && hasToken(line, w) && w !== 'ox') return `I want to ${w} it.`
  if (/^She says, "Quack!"$/i.test(line) && w === 'quack') return 'I want to quack!'
  if (/^She says, "Quick!"$/i.test(line) && w === 'quick') return 'I want to be quick!'
  if (/^She says, "A quiz!"$/i.test(line) && w === 'quiz') return 'I want a quiz!'
  if (/^She says, "My quilt!"$/i.test(line) && w === 'quilt') return 'I want my quilt!'
  if (/^(?:Flip|Grab|Lick) the pancake!$/i.test(line)) return `I want to ${w}!`
  if (/^Stack the pancakes!$/i.test(line) && w === 'stack') return 'I want to stack!'

  if (new RegExp(`^Count to ${token}\\.$`, 'i').test(line)) return `I want to count to ${w}.`
  if (new RegExp(`^Clap for ${token}\\.$`, 'i').test(line)) return `I want to clap for ${w}.`
  if (new RegExp(`^Skip to ${token}!$`, 'i').test(line)) return `I want to skip to ${w}!`
  if (new RegExp(` is ${token}\\.$`, 'i').test(line)) return `I want ${w}.`

  if (new RegExp(`^It is a good ${token}\\.$`, 'i').test(line)) return `I want a good ${w}.`
  if (new RegExp(`^A big ${token}!$`, 'i').test(line)) return `I want a big ${w}!`
  if (new RegExp(`^What a ${token}!$`, 'i').test(line)) return `I want a ${w}!`
  if (new RegExp(`^We have a big ${token}!$`, 'i').test(line)) return `I want a big ${w}!`
  if (new RegExp(`^Is it an? ${token}\\?$`, 'i').test(line)) return `I want ${/^[aeiou]/i.test(w) ? 'an' : 'a'} ${w}.`
  if (new RegExp(`^A dog with (an? )?${token}\\.$`, 'i').test(line)) {
    const art = line.toLowerCase().includes(` an ${w}`) ? 'an ' : line.toLowerCase().includes(` a ${w}`) ? 'a ' : ''
    return `I want a dog with ${art}${w}.`
  }
  if (new RegExp(`^One ${token}, two `, 'i').test(line)) return `I want one ${w}.`
  if (/^(?:Dad|Mom|Sis) can help\.$/i.test(line)) return `I want ${nameWord(w)} to help.`
  if (new RegExp(`^Dan and Cam are ${token}\\b`, 'i').test(line)) return `I want Dan and Cam to be ${w}.`
  if (new RegExp(`^Oh, an ${token}!$`, 'i').test(line)) return `I want an ${w}!`
  if (new RegExp(`^I got (an?) ${token}\\.$`, 'i').test(line)) {
    const art = line.toLowerCase().startsWith('i got an ') ? 'an' : 'a'
    return `I want ${art} ${w}.`
  }
  const playWith = line.match(/^We play with (an?) (\w+)\.$/i)
  if (playWith && playWith[2].toLowerCase() === w) return `I want to play with ${playWith[1].toLowerCase()} ${w}.`
  const see = line.match(/^I see (an? )?(blue )?(.+)\.$/i)
  if (see && hasToken(see[3], w)) return `I want ${see[1] ?? ''}${see[2] ?? ''}${w}.`
  if (new RegExp(`^My ${token}\\b`, 'i').test(line)) return `I want my ${w}.`
  if (new RegExp(`^Give me (an?) ${token}!$`, 'i').test(line)) {
    const art = /^Give me an /i.test(line) ? 'an' : 'a'
    return `I want ${art} ${w}!`
  }
  if (new RegExp(`^Bye-bye, ${token}!$`, 'i').test(line)) return `I want the ${w}!`
  if (new RegExp(`(?:^|[^A-Za-z])an ${token}(?![A-Za-z])`, 'i').test(line)) return `I want an ${w}.`
  if (new RegExp(`(?:^|[^A-Za-z])a ${token}(?![A-Za-z])`, 'i').test(line)) return `I want a ${w}.`
  if (new RegExp(`(?:^|[^A-Za-z])the ${token}(?![A-Za-z])`, 'i').test(line)) return `I want the ${w}.`

  return `I want the ${w}.`
}
