import { useGame } from '../GameProvider.jsx'
import MenuList from '../components/MenuList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

/**
 * Party wipe. Phase 5 adds "reload your last save" and the classic
 * walk-of-shame back to the last town; for now the only road is a new game.
 */
export function GameOverScreen() {
  const { dispatch } = useGame()

  return (
    <div className="screen screen--center">
      <h1 className="title-screen__logo" style={{ color: 'var(--c-danger)' }}>
        THE PARTY HAS FALLEN
      </h1>
      <p className="title-screen__subtitle">and the ember goes out</p>

      <Window className="title-screen__menu">
        <MenuList
          items={[{ key: 'title', label: 'Return to Title' }]}
          onSelect={() => dispatch({ type: 'returnToTitle' })}
          ariaLabel="Game over menu"
        />
      </Window>

      <div className="u-spacer" />
      <VirtualDPad />
    </div>
  )
}

export default GameOverScreen
