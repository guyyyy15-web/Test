import { MODES } from './engine/game.js'
import { useGame } from './ui/GameProvider.jsx'
import BattleScreen from './ui/screens/BattleScreen.jsx'
import DungeonScreen from './ui/screens/DungeonScreen.jsx'
import EndingScreen from './ui/screens/EndingScreen.jsx'
import GameOverScreen from './ui/screens/GameOverScreen.jsx'
import PartyCreationScreen from './ui/screens/PartyCreationScreen.jsx'
import PartyMenuScreen from './ui/screens/PartyMenuScreen.jsx'
import TitleScreen from './ui/screens/TitleScreen.jsx'
import TownScreen from './ui/screens/TownScreen.jsx'
import WorldMapScreen from './ui/screens/WorldMapScreen.jsx'

/**
 * Root shell. One screen is mounted at a time, chosen by `state.mode`.
 * Screens are added here as each phase lands.
 */
const SCREENS = {
  [MODES.TITLE]: TitleScreen,
  [MODES.PARTY_CREATION]: PartyCreationScreen,
  [MODES.MENU]: PartyMenuScreen,
  [MODES.BATTLE]: BattleScreen,
  [MODES.GAME_OVER]: GameOverScreen,
  [MODES.DUNGEON]: DungeonScreen,
  [MODES.WORLD]: WorldMapScreen,
  [MODES.TOWN]: TownScreen,
  [MODES.ENDING]: EndingScreen,
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
