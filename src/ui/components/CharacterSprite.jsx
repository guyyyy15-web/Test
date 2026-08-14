import { getClass } from '../../data/classes.js'
import { isKO } from '../../engine/character.js'

/**
 * Placeholder "sprite": a coloured badge carrying the class's three-letter
 * tag, the way FF1 labelled its heroes. Real artwork can replace the inside
 * of this component without anything else in the game noticing.
 */
export function CharacterSprite({ character, classId, size = 'md', dimmed = false }) {
  const definition = getClass(classId ?? character.classId)
  const down = character ? isKO(character) : false

  return (
    <span
      className={[
        'sprite',
        `sprite--${size}`,
        down || dimmed ? 'sprite--down' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--sprite-color': definition.color }}
      title={definition.name}
    >
      {definition.tag}
    </span>
  )
}

export default CharacterSprite
