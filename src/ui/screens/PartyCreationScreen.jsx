import { useState } from 'react'
import { STARTING_CLASS_IDS, STAT_LABELS, getClass } from '../../data/classes.js'
import { DEFAULT_NAMES, PARTY_SIZE, STARTING_EQUIPMENT } from '../../data/progression.js'
import { createCharacter } from '../../engine/character.js'
import { deriveStats } from '../../engine/stats.js'
import { useGame } from '../GameProvider.jsx'
import { useInput } from '../input/InputContext.jsx'
import CharacterSprite from '../components/CharacterSprite.jsx'
import MenuList from '../components/MenuList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * FF1-style party creation: four blank heroes, name and class each.
 *
 * Three steps on one screen -- roster, class, name -- so the whole flow fits
 * a phone without navigation chrome.
 */

const PREVIEW_STATS = ['maxHp', 'maxMp', 'attack', 'defense', 'magicAttack', 'magicDefense']

const PREVIEW_LABELS = {
  maxHp: 'HP',
  maxMp: 'MP',
  attack: 'Attack',
  defense: 'Defense',
  magicAttack: 'M.Atk',
  magicDefense: 'M.Def',
}

function previewCharacter(classId) {
  return createCharacter({
    id: 'preview',
    name: 'Preview',
    classId,
    equipment: STARTING_EQUIPMENT[classId] ?? {},
  })
}

function ClassDetail({ classId }) {
  const classDef = getClass(classId)
  const stats = deriveStats(previewCharacter(classId))

  return (
    <Window title={classDef.name}>
      <p className="class-blurb">{classDef.description}</p>

      <div className="stat-grid">
        {PREVIEW_STATS.map((key) => (
          <div key={key} className="stat-grid__row">
            <span className="stat-grid__label">{PREVIEW_LABELS[key]}</span>
            <span>{stats[key]}</span>
          </div>
        ))}
        {['str', 'agi', 'vit', 'int', 'luk'].map((key) => (
          <div key={key} className="stat-grid__row">
            <span className="stat-grid__label">{STAT_LABELS[key]}</span>
            <span>{stats[key]}</span>
          </div>
        ))}
      </div>

      <p className="class-blurb" style={{ marginTop: 'var(--space-2)' }}>
        {classDef.school
          ? `Casts ${classDef.school === 'both' ? 'white and black' : classDef.school} magic.`
          : 'No magic.'}
      </p>
    </Window>
  )
}

export function PartyCreationScreen() {
  const { dispatch } = useGame()
  const [heroes, setHeroes] = useState(() => Array(PARTY_SIZE).fill(null))
  const [step, setStep] = useState('roster')
  const [slot, setSlot] = useState(0)
  const [classIndex, setClassIndex] = useState(0)
  const [name, setName] = useState('')

  const previewClassId = STARTING_CLASS_IDS[classIndex]
  const complete = heroes.every(Boolean)

  const rosterItems = [
    ...heroes.map((hero, index) => ({
      key: `slot-${index}`,
      label: hero ? `${index + 1}.  ${hero.name}` : `${index + 1}.  - empty -`,
      detail: hero ? getClass(hero.classId).name : 'choose',
    })),
    {
      key: 'begin',
      label: 'Begin the journey',
      disabled: !complete,
      detail: complete ? undefined : `${heroes.filter(Boolean).length}/${PARTY_SIZE}`,
    },
  ]

  const classItems = STARTING_CLASS_IDS.map((classId) => ({
    key: classId,
    label: getClass(classId).name,
    detail: getClass(classId).tag,
  }))

  function suggestName(classId) {
    const pool = DEFAULT_NAMES[classId] ?? ['Hero']
    const taken = new Set(heroes.filter(Boolean).map((hero) => hero.name))
    return pool.find((candidate) => !taken.has(candidate)) ?? pool[0]
  }

  function chooseSlot(item, index) {
    if (item.key === 'begin') {
      dispatch({ type: 'createParty', heroes })
      return
    }
    setSlot(index)
    const existing = heroes[index]
    const existingIndex = existing
      ? STARTING_CLASS_IDS.indexOf(existing.classId)
      : 0
    setClassIndex(existingIndex === -1 ? 0 : existingIndex)
    setStep('class')
  }

  function chooseClass(item) {
    setName(heroes[slot]?.name ?? suggestName(item.key))
    setStep('name')
  }

  function confirmName() {
    const trimmed = name.trim().slice(0, 8)
    if (!trimmed) return
    setHeroes((current) => {
      const next = current.slice()
      next[slot] = { name: trimmed, classId: previewClassId }
      return next
    })
    setStep('roster')
  }

  // The name step owns a real text input, so the abstract stream stays off.
  useInput((action) => {
    if (action === 'cancel' && step === 'class') setStep('roster')
  }, step === 'class')

  if (step === 'name') {
    return (
      <div className="screen">
        <div className="creation__header">
          <h1 className="creation__title">Name your hero</h1>
          <span className="creation__step">Slot {slot + 1}</span>
        </div>

        <Window>
          <div className="name-entry">
            <div className="u-row">
              <CharacterSprite classId={previewClassId} size="lg" />
              <div>
                <div>{getClass(previewClassId).name}</div>
                <div className="u-dim" style={{ fontSize: 'var(--fs-xs)' }}>
                  Up to 8 characters.
                </div>
              </div>
            </div>

            <div className="name-entry__row">
              <input
                type="text"
                value={name}
                maxLength={8}
                autoFocus
                aria-label="Hero name"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') confirmName()
                  if (event.key === 'Escape') setStep('class')
                }}
              />
              <button type="button" className="button" onClick={confirmName} disabled={!name.trim()}>
                OK
              </button>
            </div>

            <button type="button" className="button" onClick={() => setStep('class')}>
              Back
            </button>
          </div>
        </Window>

        <div className="u-spacer" />
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="creation__header">
        <h1 className="creation__title">
          {step === 'roster' ? 'Your party' : 'Choose a class'}
        </h1>
        <span className="creation__step">
          {step === 'roster' ? `${heroes.filter(Boolean).length}/${PARTY_SIZE}` : `Slot ${slot + 1}`}
        </span>
      </div>

      {step === 'roster' ? (
        <div className="panes">
          <div className="pane">
            <Window title="Party">
              <MenuList items={rosterItems} onSelect={chooseSlot} ariaLabel="Party roster" />
            </Window>
          </div>
          <div className="pane u-scroll">
            <Window title="How this works">
              <p className="class-blurb">
                Pick four heroes. A Warrior up front, someone to heal, and someone
                to deal with a room full of enemies is the safe opening -- but the
                party is yours, and the game will not stop you making it strange.
              </p>
              <p className="class-blurb">
                Classes are permanent until the promotion partway through the story.
              </p>
            </Window>
          </div>
        </div>
      ) : (
        <div className="panes">
          <div className="pane">
            <Window title="Classes">
              <MenuList
                items={classItems}
                index={classIndex}
                onIndexChange={setClassIndex}
                onSelect={chooseClass}
                onCancel={() => setStep('roster')}
                ariaLabel="Class list"
              />
            </Window>
          </div>
          <div className="pane u-scroll">
            <ClassDetail classId={previewClassId} />
          </div>
        </div>
      )}

      <p className="hint-line">
        {step === 'roster'
          ? 'Select a slot to fill it.'
          : 'Confirm to name this hero, cancel to go back.'}
      </p>
      <VirtualDPad />
    </div>
  )
}

export default PartyCreationScreen
