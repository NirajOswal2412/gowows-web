import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useSecureFetch } from "../utils/useSecureFetch";
import usePDFChatStore from '../store/usePDFChatStore';
usePDFChatStore.getState().clearChat();

function AskPDF() {
  useAuthGuard(); // ✅ Redirect to login if token is missing/expired
  const secureFetch = useSecureFetch(); // ✅ Use shared secure fetch

  const [pdfFile, setPdfFile] = useState(null);
  const {
    messages,
    chatInput,
    setChatInput,
    setMessages,
    addMessage,
    clearChat
  } = usePDFChatStore(); 
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [smartPrompts, setSmartPrompts] = useState([]);
  const [outlineText, setOutlineText] = useState("");
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const chatBottomRef = useRef(null);

  const handleFileChange = (e) => setPdfFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!pdfFile) return setUploadStatus("❌ Please select a PDF file first.");
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      setUploadStatus("⏳ Upload in progress...");
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:7860/upload-pdf", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUploadStatus(res.data.message || "✅ Upload successful.");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setUploadStatus("❌ Upload failed.");
    }
  };

  const handleAsk = async () => {
    if (!chatInput.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    addMessage({ type: "user", text: chatInput, time: timestamp });
    addMessage({ type: "bot", text: "Saathi is thinking...", time: timestamp });    
    setChatInput("");

    try {
      const res = await secureFetch("http://localhost:7860/ask-pdf", {
        method: "POST",
        body: JSON.stringify({ message: chatInput }),
      });
      if (!res) return;
      const data = await res.json();
      const filtered = messages.filter((m, i) => i !== messages.length - 1);
setMessages([...filtered, {
  type: "bot",
  text: data.response,
  time: timestamp
}]);
      await fetchPrompts(data.response);
    } catch (err) {
      console.error("❌ Error asking PDF:", err);
    }
  };

  const fetchPrompts = async (response) => {
    try {
      const res = await secureFetch("http://localhost:7860/generate-prompts", {
        method: "POST",
        body: JSON.stringify({ text: response }),
      });
      if (!res) return;
      const data = await res.json();
      setSmartPrompts(data.prompts || []);
    } catch (err) {
      console.error("❌ Error fetching prompts:", err);
      setSmartPrompts([]);
    }
  };

  const handleMicInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      setChatInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  const handleReadResponse = () => {
    const latest = messages.filter(msg => msg.type === "bot").slice(-1)[0];
    if (latest?.text) {
      const utterance = new SpeechSynthesisUtterance(latest.text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      speechSynthesis.speak(utterance);
    }
  };

  const handleStopReading = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const generateOutline = async () => {
    try {
      const lastBotMsg = messages.filter(msg => msg.type === "bot").slice(-1)[0];
      const res = await secureFetch("http://localhost:7860/generate-outline", {
        method: "POST",
        body: JSON.stringify({ text: lastBotMsg?.text || "" }),
      });
      if (!res) return;
      const data = await res.json();
      setOutlineText(data.outline);
      setShowOutlineModal(true);
    } catch (err) {
      console.error("❌ Error generating outline:", err);
    }
  };

  const exportToPPT = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:7860/export-outline-ppt",
        { outline: outlineText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(response.data);
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
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:7860/export-outline-pdf",
        { outline: outlineText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "outline.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Error exporting to PDF:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleAsk();
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-page-container">
      <h2 className="section-title">📄 Ask PDF</h2>

      <div className="mb-4 flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={handleUpload}>Upload PDF</button>
        <span className="ml-2 text-sm text-gray-600">{uploadStatus}</span>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`chat-bubble ${msg.type}`}>
            <div className="chat-time">
              {msg.type === "user" ? "You" : "Saathi"} • {msg.time}
            </div>
            <div className="chat-text">{msg.text}</div>
            {msg.type === "bot" && index === messages.length - 1 && (
              <div className="button-group">
                <button className="export-btn" onClick={handleReadResponse}>🔊 Read</button>
                <button className="export-btn" onClick={handleStopReading}>⛔ Stop</button>
                <button className="export-btn" onClick={generateOutline}>🧾 Outline</button>
              </div>
            )}
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      <div className="suggestion-bar">
        {smartPrompts.map((prompt, idx) => (
          <button key={idx} onClick={() => setChatInput(prompt)} className="smart-prompt">
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask something about the uploaded PDF..."
        />
        <button onClick={handleAsk} className="send-button">Send</button>
        <button onClick={handleMicInput} className="mic-button">🎤</button>
        <button onClick={handleStopReading} className="stop-button">⛔</button>
      </div>

      {showOutlineModal && (
        <div className="modal-outline">
          <h3>🧾 Presentation Outline</h3>
          <pre>{outlineText}</pre>
          <div className="button-group">
            <button onClick={() => navigator.clipboard.writeText(outlineText)}>📋 Copy</button>
            <button onClick={exportToPPT}>📊 Export to PPT</button>
            <button onClick={exportToPDF}>📄 Export to PDF</button>
            <button onClick={() => setShowOutlineModal(false)}>❌ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AskPDF;
