import React, { useEffect, useState } from "react";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { useSecureFetch } from "../utils/useSecureFetch";
import useCuratedInsightsStore from "../store/useCuratedInsightsStore";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";

function CuratedInsights() {
  useAuthGuard(); // 🔐 auto redirect on expired/missing token
  const secureFetch = useSecureFetch();
  const {
    insights,
    setInsights,
    clearInsights
  } = useCuratedInsightsStore();
  const [loading, setLoading] = useState(true);
  const [outlineText, setOutlineText] = useState("");

  const fetchInsights = async () => {
    try {
      const res = await secureFetch("http://localhost:7860/curated-insights");
      if (!res) return;
      const data = await res.json();
      setInsights(data);
      setOutlineText(generateOutlineFromInsights(data)); // generate summary outline
    } catch (err) {
      console.error("❌ Failed to fetch curated insights:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (insights.length === 0) {
      fetchInsights();
    } else {
      setLoading(false);
    }
  }, []);

  const generateOutlineFromInsights = (data) => {
    return data
      .map((insight) => {
        const rows = insight.rows
          .map((row) =>
            insight.columns.map((col) => `<strong>${col}:</strong> ${row[col]}`).join(", ")
          )
          .slice(0, 5)
          .join("<br>");

        return `
          <h3 style="margin-bottom:0">${insight.title}</h3>
          <p style="margin-top:0;color:#555;font-size:14px">${insight.description}</p>
          <p style="font-family:monospace;font-size:13px">${rows}</p>
          <hr>
        `;
      })
      .join("<br>");
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
          responseType: "blob"
        }
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "curated_insights.pdf");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Error exporting to PDF:", err);
    }
  };

  const exportToExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:7860/export-outline-excel", {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "curated_insights.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error("❌ Error exporting to Excel:", err);
    }
  };

  const chartColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#00C49F", "#FFBB28"];

  return (
    <div className="chat-page-container">
      <div className="flex justify-between items-center">
        <h2 className="section-title">📊 Curated Insights</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700 transition"
          >
            🟩 Export to Excel
          </button>
          {/* <button
            onClick={exportToPDF}
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            📄 Export to PDF
          </button>*/}
        </div>
      </div>

      {loading ? (
        <p>⏳ Loading insights...</p>
      ) : (
        insights.map((insight, index) => {
          const hasData = insight?.rows?.length > 0 && insight?.columns?.length >= 2;
          const keyX = insight?.columns?.[0] || "label";
          const keyY = insight?.columns?.[1] || "value";

          return (
            <div key={index} className="insight-card">
              <h3>{insight.title}</h3>
              <p className="text-gray-600 text-sm mb-2">{insight.description}</p>

              {insight.type === "table" && hasData && (
                <div className="insight-table-container">
                  <table className="insight-table">
                    <thead>
                      <tr>
                        {insight.columns.map((col, idx) => (
                          <th key={idx}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {insight.rows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {insight.columns.map((col, cIdx) => (
                            <td key={cIdx}>{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {insight.type === "chart" && insight.chart_type === "bar" && hasData && (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart data={insight.rows}>
                      <XAxis dataKey={keyX} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey={keyY} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {insight.type === "chart" && insight.chart_type === "pie" && hasData && (
                <div style={{ width: "100%", height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={insight.rows}
                        dataKey={keyY}
                        nameKey={keyX}
                        outerRadius={100}
                        fill="#82ca9d"
                        label
                      >
                        {insight.rows.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={chartColors[idx % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {!hasData && (
                <p className="text-sm italic text-gray-500">⚠ No data available for this insight.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default CuratedInsights;
