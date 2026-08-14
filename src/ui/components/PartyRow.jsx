import { getClass } from '../../data/classes.js'
import { isKO } from '../../engine/character.js'
import { deriveStats } from '../../engine/stats.js'
import Bar from './Bar.jsx'
import CharacterSprite from './CharacterSprite.jsx'

/** One party member with sprite, name, level and HP/MP meters. */
export function PartyRow({ character, showMp = true }) {
  const stats = deriveStats(character)
  const down = isKO(character)
  const classDef = getClass(character.classId)

  return (
    <span className="party-row">
      <CharacterSprite character={character} />
      <span className="party-row__body">
        <span className="party-row__name">
          <strong>{character.name}</strong>
          <span className="party-row__class">
            {classDef.name} &middot; Lv {character.level}
          </span>
          {down ? <span className="u-danger">KO</span> : null}
          {character.statuses?.filter((s) => s !== 'ko').map((status) => (
            <span key={status} className="u-dim">
              {status}
            </span>
          ))}
        </span>

        <span className="party-row__vitals">
          <span className="party-row__vital">
            <span className="party-row__vital-label">HP</span>
            <Bar value={character.hp} max={stats.maxHp} kind="hp" />
            <span className="party-row__vital-value">
              {character.hp}/{stats.maxHp}
            </span>
          </span>
          {showMp && stats.maxMp > 0 ? (
            <span className="party-row__vital">
              <span className="party-row__vital-label">MP</span>
              <Bar value={character.mp} max={stats.maxMp} kind="mp" warnLow={false} />
              <span className="party-row__vital-value">
                {character.mp}/{stats.maxMp}
              </span>
            </span>
          ) : null}
        </span>
      </span>
    </span>
  )
}

export default PartyRow
