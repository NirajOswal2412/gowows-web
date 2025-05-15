// Place this at the top with your imports
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaStar } from 'react-icons/fa'; // add star icon for rating

const AskKB = () => {
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [faqList, setFaqList] = useState([]);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const fetchRootFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7860/list-kb-folders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFolderTree(response.data);
    } catch (error) {
      console.error('Error fetching root folders:', error);
    }
  };

  useEffect(() => {
    fetchRootFolders();
  }, []);

  const handleFolderClick = async (folderPath) => {
    const isExpanded = expandedFolders[folderPath];
    if (isExpanded) {
      setExpandedFolders(prev => ({ ...prev, [folderPath]: false }));
    } else {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:7860/list-kb-folder?folder=${encodeURIComponent(folderPath)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExpandedFolders(prev => ({
          ...prev,
          [folderPath]: response.data
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
      const response = await axios.post(
        'http://localhost:7860/ask-kb',
        {
          path: selectedPdf,
          message: newMessage.text
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const reply = response.data.response;
      const botMsg = {
        type: 'bot',
        text: reply,
        question: newMessage.text, // 🟡 Keep reference to the question
        time: new Date().toLocaleTimeString(),
        rating: 0
      };
      setChatHistory((prev) => [...prev, botMsg]);
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
            <div onClick={() => setSelectedPdf(fullPath)}>
              📄 {name}
            </div>
          )}
          {isFolder && isExpanded && Array.isArray(expandedFolders[fullPath]) && (
            <div>{renderTree(expandedFolders[fullPath], level + 1, fullPath)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h3>📁 KB Folders</h3>
        {renderTree(folderTree)}
      </div>

      <div style={{ width: '70%', padding: '20px', position: 'relative' }}>
        <h2>Ask Knowledge Base</h2>
        <p><strong>Selected PDF:</strong> {selectedPdf || 'None'}</p>

        <div className="chat-box" style={{ height: '60%', overflowY: 'auto', border: '1px solid #eee', padding: '10px', marginBottom: '10px' }}>
          {chatHistory.map((item, index) => (
            <div key={index} style={{ marginBottom: '10px', backgroundColor: item.type === 'user' ? '#e0f7fa' : '#f1f8e9', padding: '8px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: 'gray' }}>{item.time}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{item.text}</div>
              {item.type === 'bot' && (
                <div style={{ marginTop: '5px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      style={{ cursor: 'pointer', color: item.rating >= star ? 'gold' : '#ccc' }}
                      onClick={() => submitRating(item.question, star)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && <div>💭 Saathi is thinking...</div>}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            id="chatInput"
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
            placeholder="Ask a question about this PDF..."
          />
          <button onClick={handleSend} disabled={!chatInput.trim() || !selectedPdf}>Send</button>
          <button onClick={fetchFaqs} disabled={!selectedPdf}>📋 FAQs</button>
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
      </div>
    </div>
  );
};

export default AskKB;
