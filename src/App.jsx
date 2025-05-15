import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatLayout from './layouts/ChatLayout';
import NormalChat from './pages/NormalChat';
import AskKB from './pages/AskKB';
import AskPDF from './pages/AskPDF';
import AskDB from "./pages/AskDB";
import AskWebsiteLite from './pages/AskWebsiteLite';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminConsole from './pages/AdminConsole';
import CuratedInsights from './pages/CuratedInsights';
import {BASE_URL} from './config'

function App() {
  const [tokenValid, setTokenValid] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${BASE_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.display_name) {
          setUserData(data);
          setTokenValid(true);
        } else {
          localStorage.removeItem("token");
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setLoading(false);
      });
  }, []);

  return (
    <Router>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <Routes>
          {/* Always accessible routes */}
          <Route path="/" element={<Navigate to={tokenValid ? "/chat" : "/login"} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/adminconsole" element={<AdminConsole />} />

          {/* Protected routes */}
          {tokenValid && userData ? (
            <>
              <Route path="/chat" element={<ChatLayout><NormalChat /></ChatLayout>} />
              <Route path="/ask-kb" element={<ChatLayout><AskKB /></ChatLayout>} />
              <Route path="/ask-pdf" element={<ChatLayout><AskPDF /></ChatLayout>} />
              <Route path="/ask-db" element={<ChatLayout><AskDB /></ChatLayout>} />
              <Route path="/ask-web-lite" element={<ChatLayout><AskWebsiteLite /></ChatLayout>} />
              <Route path="/curated-insights" element={<ChatLayout><CuratedInsights /></ChatLayout>} />
              <Route path="*" element={<Navigate to="/chat" />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" />} />
          )}
        </Routes>
      )}
    </Router>
  );
}

export default App;
