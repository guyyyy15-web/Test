import { useState } from 'react'
import { useGame } from '../GameProvider.jsx'
import { randomSeed } from '../../engine/rng.js'
import { hasAnySave, readSlot } from '../save/slots.js'
import MenuList from '../components/MenuList.jsx'
import SaveSlotList from '../components/SaveSlotList.jsx'
import VirtualDPad from '../components/VirtualDPad.jsx'
import Window from '../components/Window.jsx'

export function TitleScreen() {
  const { dispatch } = useGame()
  const [panel, setPanel] = useState('root')
  const [notice, setNotice] = useState(null)

  // Read once on mount: the slot list cannot change while this screen is up.
  const [saveExists] = useState(() => hasAnySave())

  const items = [
    { key: 'new', label: 'New Game' },
    {
      key: 'continue',
      label: 'Continue',
      detail: saveExists ? undefined : 'no data',
      disabled: !saveExists,
    },
  ]

  if (panel === 'load') {
    return (
      <div className="screen screen--center title-screen">
        <h1 className="title-screen__logo">EMBER CROWN</h1>
        <div className="title-screen__menu">
          <SaveSlotList
            action="load"
            notice={notice}
            onCancel={() => setPanel('root')}
            onPick={(slot) => {
              const state = readSlot(slot)
              if (state) dispatch({ type: 'loadGame', state })
              else setNotice('That save could not be read.')
            }}
          />
        </div>
        <div className="u-spacer" />
        <VirtualDPad />
      </div>
    )
  }

  return (
    <div className="screen screen--center title-screen">
      <h1 className="title-screen__logo">EMBER CROWN</h1>
      <p className="title-screen__subtitle">A Tale of Four Heroes</p>

      <Window className="title-screen__menu">
        <MenuList
          items={items}
          ariaLabel="Title menu"
          onSelect={(item) => {
            if (item.key === 'new') dispatch({ type: 'newGame', seed: randomSeed() })
            else setPanel('load')
          }}
        />
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
