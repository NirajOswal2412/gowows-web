import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    display_name: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({
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
        setTimeout(() => navigate("/login"), 1000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setMessage("❌ Something went wrong.");
    }
  };

  return (
    <div className="container">
      <img alt="Saathi Logo" src="/assets/logo.png" style={{ display: "block", margin: "0 auto 20px", height: "50px" }} />
      <h2>Register</h2>
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={formData.username}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
      />
      <input
        type="text"
        name="display_name"
        placeholder="Display Name"
        value={formData.display_name}
        onChange={handleChange}
      />
      <button onClick={handleRegister}>Register</button>
      <p style={{ marginTop: "10px", fontWeight: "bold" }}>{message}</p>
    </div>
  );
};

export default Register;
