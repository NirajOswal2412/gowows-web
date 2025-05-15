import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatLayout from './layouts/ChatLayout';
import NormalChat from './pages/NormalChat';
import AskKB from './pages/AskKB'; // 👈 New import
import AskPDF from './pages/AskPDF'; // ✅ import the component
import AskDB from "./pages/AskDB";
import Login from './pages/Login'; 

function App() {
  const [tokenValid, setTokenValid] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = "/react_login.html";
      return;
    }

    fetch("http://localhost:7860/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          setUserData(data);
          setTokenValid(true);
        } else {
          localStorage.removeItem("token");
          window.location.href = "/react_login.html";
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/react_login.html";
      });
  }, []);

  if (!tokenValid || !userData) return <div>🔐 Checking credentials...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" />} />
        <Route path="/chat" element={<ChatLayout><NormalChat /></ChatLayout>} />
        <Route path="/ask-kb" element={<ChatLayout><AskKB /></ChatLayout>} /> {/* ✅ Added */}
        <Route path="/ask-pdf"  element={<ChatLayout><AskPDF /></ChatLayout>} /> {/* ✅ Added */}
        <Route path="/ask-db"  element={<ChatLayout><AskDB /></ChatLayout>} /> {/* ✅ Added */}
      </Routes>
    </Router>
  );
}

export default App;
