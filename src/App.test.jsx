import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

describe('App', () => {
  it('renders the heading', () => {
    render(<App />)
    expect(screen.getByText('Task Tracker')).toBeInTheDocument()
  })

  it('shows empty state message', () => {
    render(<App />)
    expect(screen.getByText('No tasks yet. Add one above!')).toBeInTheDocument()
  })

  it('adds a new task', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('Add a new task...')
    const button = screen.getByText('Add')

    fireEvent.change(input, { target: { value: 'Buy groceries' } })
    fireEvent.click(button)

    expect(screen.getByText('Buy groceries')).toBeInTheDocument()
    expect(screen.getByText('1 tasks remaining')).toBeInTheDocument()
  })

  it('toggles a task as done', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('Add a new task...')
    const addBtn = screen.getByText('Add')

    fireEvent.change(input, { target: { value: 'Test task' } })
    fireEvent.click(addBtn)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(checkbox).toBeChecked()
    expect(screen.getByText('0 tasks remaining')).toBeInTheDocument()
  })

  it('removes a task', () => {
    render(<App />)
    const input = screen.getByPlaceholderText('Add a new task...')
    const addBtn = screen.getByText('Add')

    fireEvent.change(input, { target: { value: 'Delete me' } })
    fireEvent.click(addBtn)

    const removeBtn = screen.getByLabelText('Remove task')
    fireEvent.click(removeBtn)

    expect(screen.queryByText('Delete me')).not.toBeInTheDocument()
  })
})
