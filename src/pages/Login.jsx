import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import gowowsLogo from "../assets/gowows-logo.png";
import "../index.css";
import {BASE_URL} from "../config";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
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
    <div
      className="login-container"
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f9f9f9",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "350px",
          padding: "30px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          backgroundColor: "#fff",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <img
          src={gowowsLogo}
          alt="GoWows Logo"
          style={{ width: "100%", marginBottom: "8px", marginTop: "-20px" }}
        />

        <h2 style={{ marginBottom: "20px" }}>Welcome to <span style={{ color: "#c62828" }}>GoWowsSaathi</span></h2>

        <label style={{ fontWeight: "bold", display: "block", textAlign: "left" }}>Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Enter your username"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <label style={{ fontWeight: "bold", display: "block", textAlign: "left" }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter your password"
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "15px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        {errorMsg && (
          <div
            style={{
              color: "red",
              marginBottom: "10px",
              fontSize: "14px",
              textAlign: "left",
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#c62828", // matching WOWS red
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Sign In
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
            fontSize: "14px",
          }}
        >
          New user?{" "}
          <a
            href="/register"
            style={{
              color: "#c62828",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
