import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function AskPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [responseText, setResponseText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [smartPrompts, setSmartPrompts] = useState([]);
  const [outlineText, setOutlineText] = useState("");
  const [showOutlineModal, setShowOutlineModal] = useState(false);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!pdfFile) return setUploadStatus("❌ Please select a PDF file first.");
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      setUploadStatus("⏳ Upload in progress...");
      const res = await axios.post("http://localhost:7860/upload-pdf", formData);
      setUploadStatus(res.data.message || "✅ Upload successful.");
    } catch (err) {
      console.error("❌ Upload failed:", err);
      setUploadStatus("❌ Upload failed.");
    }
  };

  const handleAsk = async () => {
    if (!chatInput.trim()) return;
    try {
      const res = await axios.post("http://localhost:7860/ask-pdf", { message: chatInput });
      const answer = res.data.response;
      setResponseText(answer);
      await fetchPrompts(answer);
    } catch (err) {
      console.error("❌ Error asking PDF:", err);
      setResponseText("❌ Failed to get response.");
    }
  };

  const fetchPrompts = async (response) => {
    try {
      console.log("📤 Sending to /generate-prompts:", { text: response });
      const res = await axios.post("http://localhost:7860/generate-prompts", { text: response });
      console.log("📥 Received from /generate-prompts:", res.data);
      setSmartPrompts(res.data.prompts || []);
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
    if (responseText) {
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      speechSynthesis.speak(utterance);
    }
  };

  const handleStopReading = () => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  const handleReadEntirePDF = () => {
    if (!pdfFile) return alert("❌ Please upload a PDF first.");
    const reader = new FileReader();
    reader.onload = function () {
      const text = reader.result;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      speechSynthesis.speak(utterance);
    };
    reader.onerror = function (e) {
      console.error("❌ FileReader error:", e);
      alert("❌ Error reading file.");
    };
    reader.readAsText(pdfFile);
  };

  const generateOutline = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:7860/generate-outline",
        { text: responseText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setOutlineText(res.data.outline);
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
            "Content-Type": "application/json",
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
            "Content-Type": "application/json",
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


  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Ask PDF</h2>

      <div className="mb-4 flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={handleUpload}>
          Upload PDF
        </button>
        <button onClick={handleReadEntirePDF} className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600">
          📖 Read Entire PDF
        </button>
        <button onClick={handleStopReading} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
          ⛔ Stop
        </button>
        <span className="ml-2 text-sm text-gray-600">{uploadStatus}</span>
      </div>

      <div className="mb-4 flex items-center">
      <input
        type="text"
        ref={inputRef}
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
        className="flex-grow px-3 py-2 border rounded"
        placeholder="Ask a question about the uploaded PDF..."
      />
        <button
          onClick={handleAsk}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Send
        </button>
        <button
          onClick={handleMicInput}
          className="ml-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Speak"
        >
          🎤
        </button>
      </div>

      {responseText && (
        <div className="bg-gray-100 p-4 rounded shadow mb-2">
          <div className="text-gray-800 whitespace-pre-wrap">{responseText}</div>
          <div className="mt-2 flex gap-2">
            <button onClick={handleReadResponse} className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600" disabled={isSpeaking}>
              🔊 Read Response
            </button>
            <button onClick={handleStopReading} className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600">
              ✋ Stop
            </button>
            <button onClick={generateOutline} className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700">
              🧾 Generate Outline
            </button>
          </div>
        </div>
      )}

      {showOutlineModal && (
        <div
          style={{
            position: "absolute",
            top: "100px",
            left: "50px",
            right: "50px",
            backgroundColor: "white",
            border: "1px solid gray",
            padding: "20px",
            zIndex: 100
          }}
        >
          <h3>🧾 Presentation Outline</h3>
          <pre>{outlineText}</pre>
          <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
            <button onClick={() => navigator.clipboard.writeText(outlineText)}>📋 Copy</button>
            <button onClick={exportToPPT}>📊 Export to PPT</button>
            <button onClick={exportToPDF}>📄 Export to PDF</button>
            <button onClick={() => setShowOutlineModal(false)}>❌ Close</button>
          </div>
        </div>
      )}



      <div className="mt-4">
        <div className="text-sm text-gray-600 mb-2 font-medium">Suggestions:</div>
        <div className="flex flex-wrap gap-2">
          {smartPrompts.length > 0 ? (
            smartPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => setChatInput(prompt)}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm border border-gray-300"
              >
                {prompt}
              </button>
            ))
          ) : (
            <span className="text-sm text-gray-400">No suggestions available.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AskPDF;
