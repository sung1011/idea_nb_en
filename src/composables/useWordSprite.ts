import { Assets, Sprite, Text } from 'pixi.js'
import { wordEmoji, wordImage } from '../data/phonicsFamily'

function emojiFont(size: number) {
  return {
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    fontSize: size,
  }
}

/** Pixi word art: Style-5 card when present, emoji if the image fails. */
export async function makeWordSprite(word: string, size: number): Promise<Sprite | Text> {
  const src = wordImage(word)
  if (src) {
    try {
      const texture = await Assets.load(src)
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      sprite.width = size
      sprite.height = size
      return sprite
    } catch {
      /* fall through to emoji */
    }
  }
  const label = new Text({
    text: wordEmoji(word),
    style: emojiFont(Math.round(size * 0.7)),
  })
  label.anchor.set(0.5)
  return label
}
