import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useAuthGuard } from '../hooks/useAuthGuard';

const secureFetch = async (url, options = {}, navigate) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return null;
    }

    return response;
  } catch (error) {
    console.error("Secure fetch error:", error);
    localStorage.removeItem("token");
    navigate("/login");
    return null;
  }
};

const ChatLayout = ({ children }) => {
    useAuthGuard(); // ✅ Redirect if token is missing/expired
  const [model, setModel] = useState('mistral');
  const [isDark, setIsDark] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');       // ✅ Ensures zustand session key becomes invalid
    sessionStorage.clear();                    // ✅ Clears persisted zustand state
    document.dispatchEvent(new Event('clear-chat')); // ✅ Clears messages in-memory too
    navigate('/login');
  };
  

  const handleClear = () => {
    const clearEvent = new CustomEvent('clear-chat');
    document.dispatchEvent(clearEvent);
  };

  const toggleTheme = () => {
    const updatedDark = !isDark;
    setIsDark(updatedDark);
    document.body.classList.toggle('dark', updatedDark);
  };

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* Sidebar */}
      {isSidebarOpen && (
        <div style={{
          width: '220px',
          background: '#f0f0f0',
          padding: '16px 12px',
          borderRight: '1px solid #ccc',
          boxSizing: 'border-box',
          transition: 'width 0.3s ease'
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '20px' }}>Saathi</div>
          <button className={`sidebar-btn ${isActive('/chat')}`} onClick={() => navigate('/chat')}>Normal Chat</button>
          <button className={`sidebar-btn ${isActive('/ask-kb')}`} onClick={() => navigate('/ask-kb')}>Ask KB</button>
          <button className={`sidebar-btn ${isActive('/ask-pdf')}`} onClick={() => navigate('/ask-pdf')}>Ask PDF</button>
          <button className={`sidebar-btn ${isActive('/ask-db')}`} onClick={() => navigate('/ask-db')}>Ask DB</button>
          <button className={`sidebar-btn ${isActive('/ask-web-lite')}`} onClick={() => navigate('/ask-web-lite')}>Ask Web (Lite)</button>
          <button className={`sidebar-btn ${isActive('/curated-insights')}`} onClick={() => navigate('/curated-insights')}>Curated Insights</button>
        </div>
      )}

      {/* Right Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#eee',
          padding: '8px 16px',
          borderBottom: '1px solid #ccc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              style={{
                fontSize: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginRight: '10px'
              }}
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarOpen ? '⏴' : '☰'}
            </button>

            <img src={logo} alt="Logo" style={{ height: 32 }} />
            <strong>Saathi</strong>
            <span>Welcome Admin</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select value={model} onChange={(e) => setModel(e.target.value)} style={{ padding: '4px' }}>
              <option value="mistral">Mistral (Default)</option>
              <option value="gemma">Gemma</option>
            </select>
            <button onClick={handleLogout} style={topButtonStyle} title="Logout">Logout</button>
            <button onClick={handleClear} style={topButtonStyle} title="Clear Chat">🧹</button>
            <button onClick={toggleTheme} style={topButtonStyle} title="Toggle Theme">{isDark ? '🌞' : '🌙'}</button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {React.isValidElement(children)
            ? React.cloneElement(children, { model, secureFetch, navigate })
            : null}
        </div>
      </div>
    </div>
  );
};

const topButtonStyle = {
  border: '1px solid #ccc',
  padding: '4px 8px',
  borderRadius: '4px',
  background: '#fff',
  cursor: 'pointer'
};

export default ChatLayout;
