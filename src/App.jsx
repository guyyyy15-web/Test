import { useState } from 'react'

function App() {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')

  function addTask(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    setTasks([...tasks, { id: Date.now(), text, done: false }])
    setInput('')
  }

  function toggleTask(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function removeTask(id) {
    setTasks(tasks.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <h1>Task Tracker</h1>
      <form onSubmit={addTask} className="add-form">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add a new task..."
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>

      {tasks.length === 0 ? (
        <p className="empty">No tasks yet. Add one above!</p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <li key={task.id} className={task.done ? 'done' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                />
                <span>{task.text}</span>
              </label>
              <button onClick={() => removeTask(task.id)} aria-label="Remove task">
                &times;
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="count">{tasks.filter(t => !t.done).length} tasks remaining</p>
    </div>
  )
}

export default App
