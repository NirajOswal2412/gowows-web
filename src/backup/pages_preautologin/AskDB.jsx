import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function AskDB() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    const thinkingMsg = { type: "bot", text: "🗄️ Saathi is thinking..." };

    setMessages((prev) => [...prev, userMsg, thinkingMsg]);
    setLoading(true);
    setInput("");

    try {
      const response = await axios.post("http://localhost:7860/ask-db", {
        message: input,
      });

      const data = response.data;

      const resultText = data.summary || "✅ Query Executed.";

      const resultMsg = {
        type: "bot",
        text: resultText,
        tableData: data.rows || null,
      };

      setMessages((prev) => [...prev.slice(0, -1), resultMsg]);

      if (data.rows) setTableData(data.rows);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Something went wrong.";
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { type: "bot", text: `❌ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!tableData) return;
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "AskDB_Results.xlsx");
  };

  const handleExportPDF = () => {
    const input = document.getElementById("tableContainer");
    if (!input) return;
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, width - 20, height);
      pdf.save("AskDB_Results.pdf");
    });
  };

  const stopMessage = async () => {
    await fetch("http://localhost:7860/stop", { method: "POST" });
    alert("⛔ Request stopped.");
  };

  const startMic = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInput((prev) => `${prev} ${speechResult}`.trim());
    };

    recognition.onerror = (event) => {
      console.error("Mic error:", event.error);
    };

    recognition.start();
  };

  const renderBubble = (msg, idx) => {
    return (
      <div key={idx} className={`chat-bubble ${msg.type}`}>
        <div className="chat-time">
          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="chat-text">
          <strong>{msg.type === "user" ? "You" : "Saathi"}:</strong> {msg.text}
          {msg.tableData && (
            <>
              <div className="flex gap-2 my-2">
                <button onClick={handleExportPDF} className="export-btn">
                  📄 Export to PDF
                </button>
                <button onClick={handleExportExcel} className="export-btn">
                  📊 Export to Excel
                </button>
              </div>
              <div id="tableContainer" className="overflow-x-auto border rounded shadow">
                <table className="min-w-full border-collapse table-auto">
                  <thead>
                    <tr className="bg-gray-200">
                      {Object.keys(msg.tableData[0]).map((h) => (
                        <th key={h} className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.tableData.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        {Object.keys(row).map((col) => (
                          <td key={col} className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-page-container">
      <h2 className="text-lg font-bold mb-2">🗄️ Ask DB</h2>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => renderBubble(msg, idx))}
      </div>

      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask your database..."
          style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <button onClick={handleSend} className="send-btn">Send</button>
        <button onClick={startMic} className="send-btn">🎤 Mic</button>
        <button onClick={stopMessage} className="send-btn">⛔ Stop</button>
      </div>
    </div>
  );
}

export default AskDB;
