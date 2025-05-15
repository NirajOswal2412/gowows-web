import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function AskDB() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [summary, setSummary] = useState("");

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:7860/ask-db", {
        message: newMessage.text,
      });

      const data = response.data;
      const aiMessage = { type: "bot", text: "✅ Query Executed", data };
      setMessages((prev) => [...prev, aiMessage]);

      if (data.rows) setTableData(data.rows);
      if (data.chart) setChartData(data.chart);
      if (data.summary) setSummary(data.summary);
    } catch (err) {
      const errMsg = err.response?.data?.error || "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: `❌ ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, "AskDB_Results.xlsx");
  };
  
  const handleExportPDF = () => {
    const input = document.getElementById("tableContainer");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "pt", "a4");
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(imgData, "PNG", 10, 10, width - 20, height);
      pdf.save("AskDB_Results.pdf");
    });
  };


  const renderTable = () => {
    if (!tableData || tableData.length === 0) return null;
    const headers = Object.keys(tableData[0]);
  
    return (
      <div className="mt-4">
        {/* Export Buttons */}
        <div className="flex gap-3 mb-2">
          <button
            onClick={handleExportPDF}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            📄 Export to PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            📊 Export to Excel
          </button>
        </div>
  
        <div id="tableContainer" className="overflow-x-auto border rounded shadow">
          <table className="min-w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-200">
                {headers.map((h) => (
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
              {tableData.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {headers.map((h) => (
                    <td
                      key={h}
                      className="border border-gray-300 px-4 py-2 text-sm text-gray-700"
                    >
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  const renderChart = () => {
    if (!chartData) return null;

    return (
      <div className="mt-4 p-3 bg-gray-50 border rounded">
        <h3 className="font-bold mb-1">📊 Chart Type: {chartData.type}</h3>
        <p>X: {chartData.x_label}</p>
        <p>Y: {chartData.y_label}</p>
        <p className="mt-1 italic text-sm">{summary}</p>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">🧠 Ask DB</h2>

      <div className="flex items-center gap-2 mb-4">
        <input
          type="text"
          className="flex-1 border px-3 py-2 rounded"
          placeholder="Ask your database..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "⏳" : "Send"}
        </button>
      </div>

      <div className="space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.type === "user" ? "bg-blue-100" : "bg-green-50"
            }`}
          >
            <strong>{msg.type === "user" ? "You" : "DB"}:</strong> {msg.text}
          </div>
        ))}
      </div>

      {renderTable()}
      {renderChart()}
    </div>
  );
}

export default AskDB;
