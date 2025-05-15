import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
  
    try {
      const response = await fetch("http://localhost:7860/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });
  
      const data = await response.json();
  
      if (response.ok && data.token) {
        // ✅ Save token from correct key
        localStorage.setItem("token", data.token);
        window.location.href = "/chat";
      } else {
        setErrorMsg(data.detail || "Login failed");
      }
    } catch (err) {
      setErrorMsg("Server error. Please try again later.");
    }
  };
  
  return (
    <div className="login-container" style={{
      height: "100vh", display: "flex", justifyContent: "center", alignItems: "center",
      background: "#f9f9f9"
    }}>
      <form onSubmit={handleLogin} style={{
        width: "320px", padding: "30px", border: "1px solid #ccc",
        borderRadius: "10px", backgroundColor: "#fff", boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Login</h2>

        <label style={{ fontWeight: "bold" }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Enter your username"
          style={{
            width: "100%", padding: "10px", marginBottom: "15px",
            border: "1px solid #ccc", borderRadius: "5px"
          }}
        />

        <label style={{ fontWeight: "bold" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          style={{
            width: "100%", padding: "10px", marginBottom: "15px",
            border: "1px solid #ccc", borderRadius: "5px"
          }}
        />

        {errorMsg && (
          <div style={{ color: "red", marginBottom: "10px", fontSize: "14px" }}>
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%", padding: "12px", backgroundColor: "#007bff", color: "#fff",
            border: "none", borderRadius: "5px", fontWeight: "bold", fontSize: "16px"
          }}
        >
          Sign In
        </button>

        <p style={{ textAlign: "center", marginTop: "15px", fontSize: "14px" }}>
          New user? <a href="/register" style={{ color: "#007bff", textDecoration: "none" }}>Register</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
