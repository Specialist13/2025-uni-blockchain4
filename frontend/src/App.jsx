import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>C2C Marketplace</h1>
        <p>Welcome to the marketplace</p>
      </header>
    </div>
  )
}

export default App
