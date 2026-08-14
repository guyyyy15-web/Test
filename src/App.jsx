import { MODES } from './engine/game.js'
import { useGame } from './ui/GameProvider.jsx'
import PartyCreationScreen from './ui/screens/PartyCreationScreen.jsx'
import PartyMenuScreen from './ui/screens/PartyMenuScreen.jsx'
import TitleScreen from './ui/screens/TitleScreen.jsx'

/**
 * Root shell. One screen is mounted at a time, chosen by `state.mode`.
 * Screens are added here as each phase lands.
 */
const SCREENS = {
  [MODES.TITLE]: TitleScreen,
  [MODES.PARTY_CREATION]: PartyCreationScreen,
  [MODES.MENU]: PartyMenuScreen,
}

function Placeholder({ mode }) {
  return (
    <div className="screen screen--center">
      <p className="u-dim u-center">{mode} screen is not built yet.</p>
    </div>
  )
}

export function App() {
  const { state } = useGame()
  const Screen = SCREENS[state.mode]

  return (
    <div className="app-shell">{Screen ? <Screen /> : <Placeholder mode={state.mode} />}</div>
  )
}

export default App
