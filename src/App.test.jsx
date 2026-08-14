import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'
import { GameProvider } from './ui/GameProvider.jsx'
import { InputProvider } from './ui/input/InputContext.jsx'

function renderGame() {
  return render(
    <InputProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </InputProvider>,
  )
}

describe('App shell', () => {
  it('opens on the title screen', () => {
    renderGame()
    expect(screen.getByText('EMBER CROWN')).toBeInTheDocument()
    expect(screen.getByText('New Game')).toBeInTheDocument()
  })

  it('disables Continue when there is no save data', () => {
    renderGame()
    expect(screen.getByText('Continue').closest('button')).toBeDisabled()
  })

  it('leaves the title screen when a new game starts', () => {
    renderGame()
    fireEvent.click(screen.getByText('New Game'))
    expect(screen.queryByText('EMBER CROWN')).not.toBeInTheDocument()
  })

  it('drives the cursor with the keyboard', () => {
    renderGame()
    const newGame = screen.getByText('New Game').closest('button')
    expect(newGame).toHaveAttribute('aria-current', 'true')

    fireEvent.keyDown(window, { code: 'ArrowDown' })
    expect(screen.getByText('Continue').closest('button')).toHaveAttribute(
      'aria-current',
      'true',
    )
  })

  it('starts a new game from the keyboard confirm key', () => {
    renderGame()
    fireEvent.keyDown(window, { code: 'Enter' })
    expect(screen.queryByText('EMBER CROWN')).not.toBeInTheDocument()
  })
})
