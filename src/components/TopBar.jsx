import React from 'react';

const TopBar = ({ displayName, onLogout, model, setModel }) => {
  return (
    <div style={{
      height: '60px',
      background: '#eee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      borderBottom: '1px solid #ccc'
    }}>
      <div>
        👋 Welcome, <strong>{displayName}</strong>
      </div>
      <div>
        <select value={model} onChange={(e) => setModel(e.target.value)}>
          <option value="mistral">Mistral (Default)</option>
          <option value="gemma">Gemma</option>
        </select>
        <button onClick={onLogout} style={{ marginLeft: '10px' }}>Logout</button>
      </div>
    </div>
  );
};

export default TopBar;
