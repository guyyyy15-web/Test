import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { GameProvider } from './ui/GameProvider.jsx'
import { InputProvider } from './ui/input/InputContext.jsx'
import './styles/base.css'
import './styles/ui.css'
import './styles/screens.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <InputProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </InputProvider>
  </StrictMode>,
)
