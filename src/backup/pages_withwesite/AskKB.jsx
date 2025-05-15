// 📄 AskKB.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { useSecureFetch } from '../utils/useSecureFetch';


const AskKB = () => {
  useAuthGuard();
  const secureFetch = useSecureFetch();
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [faqList, setFaqList] = useState([]);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [smartPrompts, setSmartPrompts] = useState([]);
  const [outlineText, setOutlineText] = useState('');
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const recognitionRef = useRef(null);


  const fetchRootFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch('http://localhost:7860/list-kb-folders');
      if (!res) return;
      const data = await res.json();
      setFolderTree(data);
    } catch (error) {
      console.error('Error fetching root folders:', error);
    }
  };

  useEffect(() => {
    fetchRootFolders();
    const handleClear = () => {
      setChatHistory([]);
      setSmartPrompts([]);
    };
    document.addEventListener('clear-chat', handleClear);
    return () => {
      document.removeEventListener('clear-chat', handleClear);
    };
  }, []);

  const handleFolderClick = async (folderPath) => {
    const isExpanded = expandedFolders[folderPath];
    if (isExpanded) {
      setExpandedFolders(prev => ({ ...prev, [folderPath]: false }));
    } else {
      try {
        const token = localStorage.getItem('token');
        const res = await secureFetch(`http://localhost:7860/list-kb-folder?folder=${encodeURIComponent(folderPath)}`);
if (!res) return;
const data = await res.json();
setExpandedFolders(prev => ({
  ...prev,
  [folderPath]: data
}));
      } catch (error) {
        console.error(`Error expanding folder ${folderPath}:`, error);
      }
    }
  };

  const fetchFaqs = async () => {
    try {
      const token = localStorage.getItem('token');
      const pdfPath = selectedPdf;
      const faqRes = await axios.get(`http://localhost:7860/list-kb-faq?pdf_path=${encodeURIComponent(pdfPath)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const ratedFaqs = await Promise.all(faqRes.data.questions.map(async (faq) => {
        try {
          const ratingRes = await axios.get(`http://localhost:7860/response-rating?pdf_path=${encodeURIComponent(pdfPath)}&query=${encodeURIComponent(faq.query)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return {
            ...faq,
            avg_rating: ratingRes.data.avg_rating,
            total_ratings: ratingRes.data.total_ratings
          };
        } catch (err) {
          return { ...faq, avg_rating: 0, total_ratings: 0 };
        }
      }));

      setFaqList(ratedFaqs);
      setShowFaqModal(true);
    } catch (error) {
      console.error('❌ Error fetching FAQs:', error);
    }
  };

  const handleFaqSelect = (query) => {
    setChatInput(query);
    document.getElementById('chatInput').focus();
    setShowFaqModal(false);
  };

  const handleSend = async () => {
    if (!selectedPdf || !chatInput.trim()) return;

    const newMessage = { type: 'user', text: chatInput, time: new Date().toLocaleTimeString() };
    setChatHistory((prev) => [...prev, newMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await secureFetch('http://localhost:7860/ask-kb', {
        method: 'POST',
        body: JSON.stringify({ path: selectedPdf, message: newMessage.text }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res) return;
      const data = await res.json();
      const reply = data.response;
      
      const botMsg = {
        type: 'bot',
        text: reply,
        question: newMessage.text,
        time: new Date().toLocaleTimeString(),
        rating: 0
      };
      setChatHistory((prev) => [...prev, botMsg]);

      const promptsRes = await secureFetch('http://localhost:7860/generate-prompts', {
        method: 'POST',
        body: JSON.stringify({ text: reply }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!promptsRes) return;
      const promptsData = await promptsRes.json();
      if (Array.isArray(promptsData.prompts)) {
        setSmartPrompts(promptsData.prompts);
      }
      
    } catch (err) {
      console.error("❌ Error fetching KB response:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async (question, rating) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:7860/rate-response', {
        pdf_path: selectedPdf,
        query: question,
        rating: rating
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setChatHistory((prev) =>
        prev.map((msg) =>
          msg.question === question ? { ...msg, rating } : msg
        )
      );
    } catch (err) {
      console.error('⚠️ Error submitting rating:', err);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.start();
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    window.speechSynthesis.speak(utterance);
  };

  const generateOutline = async (answer) => {
    try {
      const token = localStorage.getItem('token'); // ✅ get token
      const res = await secureFetch('http://localhost:7860/generate-outline', {
        method: 'POST',
        body: JSON.stringify({ text: answer }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res) return;
      const data = await res.json();
      setOutlineText(data.outline);   
      setShowOutlineModal(true);
    } catch (err) {
      console.error('❌ Error generating outline:', err);
    }
  };
  

  const renderTree = (nodes, level = 0, basePath = '') => {
    if (!Array.isArray(nodes)) return null;
    return nodes.map((node) => {
      const name = node.folder || node.name;
      const fullPath = basePath ? `${basePath}/${name}` : name;
      const isFolder = node.type === 'folder' || !!node.subfolders;
      const isExpanded = !!expandedFolders[fullPath];

      return (
        <div key={fullPath} style={{ paddingLeft: `${level * 20}px`, cursor: isFolder ? 'pointer' : 'default' }}>
          {isFolder ? (
            <div onClick={() => handleFolderClick(fullPath)}>
              {isExpanded ? '🔽' : '▶️'} {name}{node.pdf_count !== undefined ? ` (${node.pdf_count} PDFs)` : ''}
            </div>
          ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span onClick={() => setSelectedPdf(fullPath)} style={{ cursor: 'pointer' }}>
                  📄 {name}
                </span>
                <span
                  title="Open PDF"
                  onClick={() => window.open(`http://localhost:7860/preview/${fullPath}`, '_blank')}
                  style={{ cursor: 'pointer', marginLeft: '8px' }}
                >
                  👁️
                </span>
              </div>
          )}
          {isFolder && isExpanded && Array.isArray(expandedFolders[fullPath]) && (
            <div>{renderTree(expandedFolders[fullPath], level + 1, fullPath)}</div>
          )}
        </div>
      );
    });
  };




// ✅ Please use the file already pasted above, it includes all your current logic.
// The only part we now need to replace is the TODO buttons with working Export to PPT and PDF handlers.

const exportToPPT = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:7860/export-outline-ppt',
      { outline: outlineText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'outline.pptx');
    document.body.appendChild(link);
    link.click();
  } catch (err) {
    console.error('❌ Error exporting to PPT:', err);
  }
};

const exportToPDF = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:7860/export-outline-pdf',
      { outline: outlineText },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    );
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'outline.pdf');
    document.body.appendChild(link);
    link.click();
  } catch (err) {
    console.error('❌ Error exporting to PDF:', err);
  }
};


  return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h3>📁 KB Folders</h3>
        {renderTree(folderTree)}
      </div>

      <div style={{ width: '70%', padding: '20px', position: 'relative' }}>
      <h2 className="section-title">📚 Ask KB</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
  <p><strong>📄 Selected PDF:</strong> {selectedPdf || 'None'}</p>
  <button 
    onClick={fetchFaqs} 
    disabled={!selectedPdf} 
    style={{
      padding: '6px 12px',
      border: '1px solid #ccc',
      backgroundColor: selectedPdf ? '#f0f0f0' : '#ddd',
      borderRadius: '4px',
      cursor: selectedPdf ? 'pointer' : 'not-allowed'
    }}
  >
    📋 FAQs
  </button>
</div>
        <div className="chat-box" style={{ height: '60%', overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
          {chatHistory.map((item, index) => (
            <div key={index} className={item.type === 'user' ? 'user-bubble' : 'bot-bubble'}>
              <div style={{ fontSize: '12px', color: 'gray' }}>{item.time}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>
              {item.type === 'bot' && (
                <>
                  <div style={{ marginTop: '5px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        style={{ cursor: 'pointer', color: item.rating >= star ? 'gold' : '#ccc' }}
                        onClick={() => submitRating(item.question, star)}
                      />
                    ))}
                  </div>
                  <div style={{ marginTop: '5px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => speakText(item.text)}>🔊 Read</button>
                    <button onClick={() => generateOutline(item.text)}>🧾 Generate Outline</button>
                  </div>
                </>
              )}
            </div>
          ))}
          {isLoading && <div>💭 Saathi is thinking...</div>}
        </div>

        {smartPrompts.length > 0 && (
  <div style={{ padding: '10px 20px' }}>
    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Suggestions:</div>
    {smartPrompts.map((prompt, idx) => (
      <button
        key={idx}
        onClick={() => setInput(prompt)}
        className="smart-prompt"
      >
        {`${idx + 1}. ${prompt}`}
      </button>
    ))}
  </div>
)}
<div style={{
  display: 'flex',
  gap: '10px',
  padding: '10px 20px',
  borderTop: '1px solid #ccc',
  background: '#fffaf0',
  position: 'sticky',
  bottom: 0
}}>
  <input
    id="chatInput"
    type="text"
    value={chatInput}
    onChange={e => setChatInput(e.target.value)}
    placeholder="Type your question..."
    style={{ flex: 1, padding: '10px', fontSize: '14px', border: '1px solid #ccc', borderRadius: '4px' }}
  />
  <button onClick={handleSend} disabled={!chatInput.trim() || !selectedPdf}>Send</button>
  <button onClick={handleVoiceInput}>🎤 Mic</button>
  <button onClick={() => window.speechSynthesis.cancel()}>⛔ Stop</button>
</div>


        {showFaqModal && (
          <div style={{ position: 'absolute', top: '100px', left: '50px', right: '50px', backgroundColor: 'white', border: '1px solid gray', padding: '20px', zIndex: 100 }}>
            <h3>FAQs for Selected PDF</h3>
            <ul>
              {faqList.map((faq, index) => (
                <li key={index} style={{ marginBottom: '10px', cursor: 'pointer' }} onClick={() => handleFaqSelect(faq.query)}>
                  <strong>{faq.query}</strong>{' '}
                  <span style={{ color: 'gray' }}>🔢 {faq.hit_count}</span>{' '}
                  <span>⭐ {faq.avg_rating?.toFixed(1)}</span>{' '}
                  <span>👤 {faq.total_ratings}</span>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowFaqModal(false)}>Close</button>
          </div>
        )}

        {showOutlineModal && (
          <div style={{ position: 'absolute', top: '100px', left: '50px', right: '50px', backgroundColor: 'white', border: '1px solid gray', padding: '20px', zIndex: 100 }}>
            <h3>🧾 Presentation Outline</h3>
            <pre>{outlineText}</pre>
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
              <button onClick={() => navigator.clipboard.writeText(outlineText)}>📋 Copy</button>
              <button onClick={exportToPPT}>📊 Export to PPT</button>
              <button onClick={exportToPDF}>📄 Export to PDF</button>
              <button onClick={() => setShowOutlineModal(false)}>❌ Close</button>
            </div>
          </div>
        )}
      </div>
      </div> 
     );
};

export default AskKB;
