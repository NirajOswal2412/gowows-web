import React, { useState } from "react";
import axios from "axios";

function AskPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [smartPrompts, setSmartPrompts] = useState([]);

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!pdfFile) {
      setUploadStatus("❌ Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      setUploadStatus("⏳ Upload in progress...");
      const res = await axios.post("http://localhost:7860/upload-pdf", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadStatus(res.data.message || "✅ Upload successful.");
    } catch (err) {
      setUploadStatus("❌ Upload failed.");
      console.error("Upload failed:", err);
    }
  };

  const handleAsk = async () => {
    if (!chatInput.trim()) return;

    try {
      const res = await axios.post("http://localhost:7860/ask-pdf", { message: chatInput });
      setResponse(res.data.response);
      fetchPrompts(chatInput, res.data.response);
    } catch (err) {
      console.error("Error asking PDF:", err);
      setResponse("❌ Failed to get response.");
    }
  };

  const fetchPrompts = async (query, resp) => {
    try {
      console.log("📤 Sending to /generate-prompts:", { query, response: resp });
      const res = await axios.post("http://localhost:7860/generate-prompts", {
        query,
        response: resp,
      });
      console.log("📥 Received from /generate-prompts:", res.data);
      setSmartPrompts(res.data.prompts || []);
    } catch (err) {
      console.error("❌ Error fetching prompts:", err);
      setSmartPrompts([]);
    }
  };

  const handleReadResponse = () => {
    if (response) {
      const utterance = new SpeechSynthesisUtterance(response);
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

    reader.readAsText(pdfFile);  // ✅ This works like HTML-based read logic
  };

  const handleMicInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      setChatInput(event.results[0][0].transcript);
    };
    recognition.start();
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Ask PDF</h2>

      <div className="mb-4 flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="px-4 py-1 bg-blue-600 text-white rounded" onClick={handleUpload}>
          Upload PDF
        </button>
        <button
          onClick={handleReadEntirePDF}
          className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          📖 Read Entire PDF
        </button>
        <button
          onClick={handleStopReading}
          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          ⛔ Stop
        </button>
        <span className="ml-2 text-sm text-gray-600">{uploadStatus}</span>
      </div>

      <div className="mb-4 flex items-center">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-grow px-3 py-2 border rounded"
          placeholder="Ask a question about the uploaded PDF..."
        />
        <button
          onClick={handleMicInput}
          className="ml-2 px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          title="Speak"
        >
          🎤
        </button>
        <button
          onClick={handleAsk}
          className="ml-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Send
        </button>
      </div>

      {response && (
        <div className="bg-gray-100 p-4 rounded shadow mb-2">
          <div className="text-gray-800 whitespace-pre-wrap">{response}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleReadResponse}
              className="px-3 py-1 bg-indigo-500 text-white rounded hover:bg-indigo-600"
              disabled={isSpeaking}
            >
              🔊 Read Response
            </button>
            <button
              onClick={handleStopReading}
              className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              ✋ Stop
            </button>
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
