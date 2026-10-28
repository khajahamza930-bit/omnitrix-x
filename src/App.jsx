
function App() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06110c',
      color: '#39ff88',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>OMNITRIX X</h1>
      <p>System Online</p>
      <button
        onClick={() => alert('Transformation activated!')}
        style={{
          padding: '14px 24px',
          background: '#39ff88',
          color: '#06110c',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        ACTIVATE TRANSFORMATION
      </button>
    </div>
  );
}

export default App;
