import React, { useState, useRef, useEffect } from 'react';
import { useSecureFetch } from '../utils/useSecureFetch'; // ✅ using the React Router version

const NormalChat = ({ model = 'mistral' }) => {
  const secureFetch = useSecureFetch(); // ✅ hook instance

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [smartPrompts, setSmartPrompts] = useState([]);
  const [outlineText, setOutlineText] = useState('');
  const [showOutlineModal, setShowOutlineModal] = useState(false);
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
      const res = await secureFetch(`http://localhost:${port}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: msg })
      });

      if (!res) return;
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

  const generateOutline = async (text) => {
    try {
      const res = await secureFetch("http://localhost:7860/generate-outline", {
        method: "POST",
        body: JSON.stringify({ text })
      });
      if (!res) return;
      const data = await res.json();
      setOutlineText(data.outline || '');
      setShowOutlineModal(true);
    } catch (err) {
      console.error("❌ Error generating outline:", err);
    }
  };

  const exportToPPT = async () => {
    try {
      const res = await secureFetch("http://localhost:7860/export-outline-ppt", {
        method: "POST",
        body: JSON.stringify({ outline: outlineText }),
      });
      if (!res) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "outline.pptx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Error exporting to PPT:", err);
    }
  };

  const exportToPDF = async () => {
    try {
      const res = await secureFetch("http://localhost:7860/export-outline-pdf", {
        method: "POST",
        body: JSON.stringify({ outline: outlineText }),
      });
      if (!res) return;
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "outline.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Error exporting to PDF:", err);
    }
  };

  const fetchPrompts = async (text, port) => {
    try {
      const res = await secureFetch(`http://localhost:${port}/generate-prompts`, {
        method: 'POST',
        body: JSON.stringify({ text })
      });
      if (!res) return;
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
    await secureFetch(`http://localhost:${port}/stop`, { method: 'POST' });
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
    <div className="chat-page-container">
      <h2 className="section-title">🧠 Normal Chat</h2>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-bubble-${msg.from === 'You' ? 'user' : 'bot'}`}
            style={{ alignSelf: msg.from === 'You' ? 'flex-end' : 'flex-start' }}         
          >
            {msg.time && (
              <div className="chat-time">{msg.time}</div>
            )}
            <div style={{ marginTop: '14px' }}>
              <strong>{msg.from}:</strong> {msg.text}
            </div>
            {msg.from === 'Saathi' && msg.text !== '💭 Thinking...' && (
              <div style={{ marginTop: '4px', display: 'flex', gap: '6px' }}>
                <button onClick={() => speakReply(msg.text)} style={buttonStyle}>🔈 Read</button>
                <button onClick={() => generateOutline(msg.text)} style={buttonStyle}>🧾 Generate Outline</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {showOutlineModal && (
        <div style={modalStyle}>
          <h3>🧾 Presentation Outline</h3>
          <div style={{ marginTop: "1px", display: "flex", gap: "10px" }}>
            <button onClick={() => navigator.clipboard.writeText(outlineText)}>📋 Copy</button>
            <button onClick={exportToPPT}>📊 Export to PPT</button>
            <button onClick={exportToPDF}>📄 Export to PDF</button>
            <button onClick={() => setShowOutlineModal(false)}>❌ Close</button>
          </div>
          <pre style={preStyle}>{outlineText}</pre>
        </div>
      )}

      {smartPrompts.length > 0 && (
        <div style={{ padding: '10px 20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Suggestions:</div>
          {smartPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setInput(prompt)}
              style={promptStyle}
            >
              {`${idx + 1}. ${prompt}`}
            </button>
          ))}
        </div>
      )}

      <div style={inputContainerStyle}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          style={inputStyle}
        />
        <button onClick={sendMessage} style={actionButtonStyle}>Send</button>
        <button onClick={startMic} style={actionButtonStyle}>🎤 Mic</button>
        <button onClick={stopMessage} style={actionButtonStyle}>⛔ Stop</button>
      </div>
    </div>
  );
};

const buttonStyle = { padding: '2px 6px', fontSize: '0.75rem', border: '1px solid #888', borderRadius: '4px', background: '#f0f0f0' };
const modalStyle = { position: "fixed", top: "100px", left: "50px", right: "50px", backgroundColor: "white", border: "1px solid gray", padding: "20px", zIndex: 100 };
const preStyle = { maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", backgroundColor: "#f9f9f9", whiteSpace: "pre-wrap" };
const promptStyle = { display: 'block', width: '100%', textAlign: 'left', margin: '4px 0', padding: '10px 12px', backgroundColor: '#fff3cd', border: '1px solid #f0ad4e', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' };
const inputContainerStyle = { display: 'flex', gap: '10px', padding: '10px 20px', borderTop: '1px solid #ccc', background: '#fff', position: 'sticky', bottom: 0 };
const inputStyle = { flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' };
const actionButtonStyle = { border: '1px solid black', padding: '8px 12px' };

export default NormalChat;
