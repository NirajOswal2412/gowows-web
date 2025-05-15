import React, { useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useSecureFetch } from "../utils/useSecureFetch";
import useDBChatStore from "../store/useDBChatStore";
useDBChatStore.getState().clearChat();
import { BASE_URL } from "../config";

function AskDB() {
  useAuthGuard(); // 🔐 redirect on token expiration
  const secureFetch = useSecureFetch();

  const {
    input,
    setInput,
    messages,
    setMessages,
    addMessage,
    clearChat
  } = useDBChatStore(); 
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { type: "user", text: input };
    const thinkingMsg = { type: "bot", text: "🗄️ Saathi is thinking..." };

    addMessage(userMsg);
    addMessage(thinkingMsg);
    setLoading(true);
    setInput("");

    try {
      const res = await secureFetch(`${BASE_URL}/ask-db`, {
        method: "POST",
        body: JSON.stringify({ message: input }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { type: "bot", text: `❌ Token expired or request failed.` },
        ]);
        return;
      }

      const data = await res.json();

      const resultMsg = {
        type: "bot",
        text: data.summary || "✅ Query Executed.",
        tableData: data.rows || null,
      };

      const filtered = messages.slice(0, -1);
      setMessages([...filtered, resultMsg]);


      if (data.rows) setTableData(data.rows);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Something went wrong.";
      const filtered = messages.slice(0, -1);
      setMessages([...filtered, { type: "bot", text: `❌ ${errMsg}` }]);      
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (!tableData || tableData.length === 0) return;
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Results");
  
    // Add header row
    worksheet.columns = Object.keys(tableData[0]).map((key) => ({
      header: key,
      key: key,
      width: 20,
    }));
  
    // Add data rows
    tableData.forEach((row) => {
      worksheet.addRow(row);
    });
  
    // Generate Excel file in browser
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "AskDB_Results.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    try {
      await secureFetch(`${BASE_URL}/stop`, { method: "POST" });
      alert("⛔ Request stopped.");
    } catch (err) {
      console.error("Error stopping request:", err);
    }
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
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
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
              <div
                id="tableContainer"
                className="overflow-x-auto border rounded shadow"
              >
                <table className="min-w-full border-collapse table-auto">
                  <thead>
                    <tr className="bg-gray-200">
                      {Object.keys(msg.tableData[0]).map((h) => (
                        <th
                          key={h}
                          className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-800"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {msg.tableData.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={
                          rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        {Object.keys(row).map((col) => (
                          <td
                            key={col}
                            className="border border-gray-300 px-4 py-2 text-sm text-gray-700"
                          >
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
          style={{
            flex: 1,
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button onClick={handleSend} className="send-btn">
          Send
        </button>
        <button onClick={startMic} className="send-btn">
          🎤 Mic
        </button>
        <button onClick={stopMessage} className="send-btn">
          ⛔ Stop
        </button>
      </div>
    </div>
  );
}

export default AskDB;
