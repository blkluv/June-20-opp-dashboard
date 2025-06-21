import React from 'react'

function TestApp() {
  console.log('TestApp is rendering...')
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Test App</h1>
      <p>If you see this, React is working!</p>
      <div style={{ background: '#f0f8ff', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h3>Debug Info:</h3>
        <ul>
          <li>React: ✅ Working</li>
          <li>Rendering: ✅ Working</li>
          <li>Styles: ✅ Working</li>
        </ul>
      </div>
    </div>
  )
}

export default TestApp 