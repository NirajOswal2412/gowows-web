import React from 'react';

const Sidebar = ({ activePage, onSelect }) => {
  const buttons = [
    { id: 'normal', label: 'Normal Chat' },
    { id: 'askkb', label: 'Ask KB' },
    { id: 'askpdf', label: 'Ask PDF' },
    { id: 'askdb', label: 'Ask DB' },
  ];

  return (
    <div style={{
      width: '180px',
      background: '#f3f3f3',
      height: '100vh',
      padding: '20px 10px',
      boxSizing: 'border-box'
    }}>
      <h3>Saathi</h3>
      {buttons.map(btn => (
        <button
          key={btn.id}
          style={{
            display: 'block',
            width: '100%',
            margin: '8px 0',
            padding: '8px',
            background: activePage === btn.id ? '#ddd' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '6px'
          }}
          onClick={() => onSelect(btn.id)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;
