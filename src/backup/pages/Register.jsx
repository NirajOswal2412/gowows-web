import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import gowowsLogo from "../assets/gowows-logo.png"; // ✅ your logo path

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    display_name: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:7860/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("✅ Registered successfully. Please log in.");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setMessage("❌ Something went wrong.");
    }
  };

  return (
    <div
      className="register-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
      }}
    >
      <form
        onSubmit={(e) => e.preventDefault()}
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
          style={{ width: "100%", marginBottom: "8px", marginTop: "-10px" }}
        />

        <h2 style={{ marginBottom: "20px" }}>
          Register to <span style={{ color: "#c62828" }}>GoWowsSaathi</span>
        </h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "12px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <input
          type="text"
          name="display_name"
          placeholder="Display Name"
          value={formData.display_name}
          onChange={handleChange}
          required
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "18px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <button
          type="button"
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: "#c62828",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          Register
        </button>

        {message && (
          <p
            style={{
              marginTop: "15px",
              fontWeight: "bold",
              color: message.startsWith("✅") ? "green" : "red",
              fontSize: "14px",
            }}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default Register;
