import { useGame } from '../GameProvider.jsx'
import { randomSeed } from '../../engine/rng.js'
import MenuList from '../components/MenuList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

export function TitleScreen() {
  const { dispatch } = useGame()

  // Continue is wired up in Phase 5, when saves exist.
  const items = [
    { key: 'new', label: 'New Game' },
    { key: 'continue', label: 'Continue', detail: 'no data', disabled: true },
  ]

  function select(item) {
    if (item.key === 'new') dispatch({ type: 'newGame', seed: randomSeed() })
  }

  return (
    <div className="screen screen--center title-screen">
      <h1 className="title-screen__logo">EMBER CROWN</h1>
      <p className="title-screen__subtitle">A Tale of Four Heroes</p>

      <Window className="title-screen__menu">
        <MenuList items={items} onSelect={select} ariaLabel="Title menu" />
      </Window>

      <p className="title-screen__hint">
        Arrows / WASD to move &middot; Z or Enter to confirm &middot; X or Esc to cancel
      </p>

      <div className="u-spacer" />
      <VirtualDPad />
    </div>
  )
}

export default TitleScreen
