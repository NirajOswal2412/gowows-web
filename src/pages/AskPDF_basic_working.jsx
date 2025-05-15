import React, { useState } from "react";
import axios from "axios";

function AskPDF() {
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

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
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
      const res = await axios.post("http://localhost:7860/ask-pdf", {
        message: chatInput,
      });
      setResponse(res.data.response);
    } catch (err) {
      console.error("Error asking PDF:", err);
      setResponse("❌ Failed to get response.");
    }
  };

  const handleReadPDF = () => {
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

      <div className="mb-4">
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button className="ml-2 px-4 py-1 bg-blue-600 text-white rounded" onClick={handleUpload}>
          Upload PDF
        </button>
        <span className="ml-4 text-sm text-gray-600">{uploadStatus}</span>
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
        <div className="bg-gray-100 p-4 rounded shadow">
          <div className="text-gray-800 whitespace-pre-wrap">{response}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleReadPDF}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={isSpeaking}
            >
              🔊 Read Response
            </button>
            <button
              onClick={handleStopReading}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ✋ Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AskPDF;
