import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎉 Opportunity Dashboard Test</h1>
      <p>If you can see this, React is working!</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Count: {count}
      </button>
      <div style={{ marginTop: '20px' }}>
        <h3>✅ System Status:</h3>
        <ul>
          <li>✅ React is loading</li>
          <li>✅ State management working</li>
          <li>✅ Event handlers working</li>
        </ul>
      </div>
    </div>
  )
}

export default App 