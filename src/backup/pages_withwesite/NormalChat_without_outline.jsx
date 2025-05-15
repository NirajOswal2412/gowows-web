import React, { useState, useRef, useEffect } from 'react';

const NormalChat = ({ model = 'mistral' }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [smartPrompts, setSmartPrompts] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const handleClear = () => {
      setMessages([]);
      setSmartPrompts([]);
    };

    document.addEventListener('clear-chat', handleClear);
    return () => {
      document.removeEventListener('clear-chat', handleClear);
    };
  }, []);

  const sendMessage = async () => {
    const msg = input.trim();
    if (!msg) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Session expired. Please log in again.");
      window.location.href = "/react_login.html";
      return;
    }

    const userMessage = {
      from: 'You',
      text: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const thinkingMessage = { from: 'Saathi', text: '💭 Thinking...', time: '', typing: true };

    setMessages(prev => [...prev, userMessage, thinkingMessage]);
    setInput('');
    setLoading(true);

    const port = model === 'gemma' ? 7861 : 7860;

    try {
      const res = await fetch(`http://localhost:${port}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });

      const data = await res.json();
      const botText = (data && data.response) ? data.response.trim() : '⚠️ No valid reply received.';
      const botMessage = {
        from: 'Saathi',
        text: botText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev.filter(m => !m.typing), botMessage]);
      fetchPrompts(botText, port);
    } catch (err) {
      console.error("Chat error:", err);
      const errMsg = {
        from: 'Saathi',
        text: '⚠️ Error contacting server.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev.filter(m => !m.typing), errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrompts = async (text, port) => {
    try {
      const res = await fetch(`http://localhost:${port}/generate-prompts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (data && Array.isArray(data.prompts)) {
        setSmartPrompts(data.prompts);
      }
    } catch (err) {
      console.error('Prompt error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const stopMessage = async () => {
    const port = model === 'gemma' ? 7861 : 7860;
    await fetch(`http://localhost:${port}/stop`, { method: 'POST' });
    alert("⛔ Request stopped.");
  };

  const speakReply = (text) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    speechSynthesis.speak(utterance);
  };

  const startMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInput(prev => `${prev} ${speechResult}`.trim());
    };

    recognition.onerror = (event) => {
      console.error("Mic error:", event.error);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div style={{ background: '#fffaf0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble-${msg.from === 'You' ? 'user' : 'bot'}`}
            style={{
              alignSelf: msg.from === 'You' ? 'flex-end' : 'flex-start',
              border: '1px solid black',
              borderRadius: '10px',
              padding: '10px 16px',
              margin: '8px 0',
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {msg.time && (
              <div style={{
                position: 'absolute',
                top: '4px',
                right: '10px',
                fontSize: '0.75rem',
                color: 'black'
              }}>
                {msg.time}
              </div>
            )}
            <div style={{ marginTop: '14px' }}>
              <strong>{msg.from}:</strong> {msg.text}
            </div>
            {msg.from === 'Saathi' && msg.text !== '💭 Thinking...' && (
              <div style={{ marginTop: '4px' }}>
                <button
                  onClick={() => speakReply(msg.text)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    border: '1px solid #888',
                    borderRadius: '4px',
                    background: '#f0f0f0',
                    cursor: 'pointer'
                  }}
                >
                  🔈 Read
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Smart Prompts */}
      {smartPrompts.length > 0 && (
        <div style={{ padding: '10px 20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Suggestions:</div>
          {smartPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              className="smart-prompt"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                margin: '4px 0',
                padding: '6px 10px',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {`${idx + 1}. ${prompt}`}
            </button>
          ))}
        </div>
      )}

      {/* Input + Actions */}
      <div style={{
        display: 'flex',
        gap: '10px',
        padding: '10px 20px',
        borderTop: '1px solid #ccc',
        background: '#fff',
        position: 'sticky',
        bottom: 0
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button onClick={sendMessage} style={{ border: '1px solid black', padding: '8px 12px' }}>Send</button>
        <button onClick={startMic} style={{ border: '1px solid black', padding: '8px 12px' }}>🎤 Mic</button>
        <button onClick={stopMessage} style={{ border: '1px solid black', padding: '8px 12px' }}>⛔ Stop</button>
      </div>
    </div>
  );
};

export default NormalChat;
