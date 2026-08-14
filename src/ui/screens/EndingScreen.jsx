import { STONE_QUESTS } from '../../data/world.js'
import { formatPlaytime } from '../../engine/game.js'
import { getClass } from '../../data/classes.js'
import { useGame } from '../GameProvider.jsx'
import MenuList from '../components/MenuList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

const CLOSING = [
  'The crown comes apart in your hands, the way it was always meant to.',
  'Four stones, four roads, four places nobody sensible would go. Someone will put them back one day.',
  'That is a problem for whoever comes next. You have a long walk down.',
]

export function EndingScreen() {
  const { state, dispatch } = useGame()

  return (
    <div className="screen screen--center">
      <h1 className="title-screen__logo">THE EMBER GOES OUT</h1>

      <Window className="title-screen__menu" style={{ width: 'min(560px, 92vw)' }}>
        {CLOSING.map((line) => (
          <p key={line} className="class-blurb">
            {line}
          </p>
        ))}

        <div className="stat-grid">
          <div className="stat-grid__row">
            <span className="stat-grid__label">Playtime</span>
            <span>{formatPlaytime(state.playtimeMs)}</span>
          </div>
          <div className="stat-grid__row">
            <span className="stat-grid__label">Stones</span>
            <span>
              {STONE_QUESTS.filter((quest) => state.flags[quest.flag]).length}/
              {STONE_QUESTS.length}
            </span>
          </div>
          {state.party.map((member) => (
            <div key={member.id} className="stat-grid__row">
              <span className="stat-grid__label">{member.name}</span>
              <span>
                {getClass(member.classId).name} Lv {member.level}
              </span>
            </div>
          ))}
        </div>

        <MenuList
          items={[{ key: 'title', label: 'The End' }]}
          onSelect={() => dispatch({ type: 'returnToTitle' })}
          ariaLabel="Ending"
        />
      </Window>

      <div className="u-spacer" />
      <VirtualDPad />
    </div>
  )
}

export default EndingScreen
