import React, { useState } from "react";
import gowowsLogo from "../assets/gowows-logo.png";

const AdminConsole = () => {
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [adminData, setAdminData] = useState([]);
  const [editStates, setEditStates] = useState({});
  const [message, setMessage] = useState("");

  const apiBase = "http://localhost:7860";

  const handleAdminLogin = async () => {
    setAdminData([]);
    setMessage("");
    try {
      const res = await fetch(`${apiBase}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(`❌ ${data.error}`);
        return;
      }

      setAdminToken(data.token);
      localStorage.setItem("adminToken", data.token);

      const meRes = await fetch(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const me = await meRes.json();

      if (me.role !== "admin") {
        setMessage("❌ Access denied. Not an admin.");
        return;
      }

      setMessage(`✅ Welcome Admin ${me.display_name}`);
      loadUsers(data.token);
    } catch {
      setMessage("❌ Error logging in.");
    }
  };

  const loadUsers = async (token) => {
    try {
      const res = await fetch(`${apiBase}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await res.json();
      const users = resData.users || resData;

      const editMap = {};
      users.forEach((u) => {
        editMap[u.username] = { role: u.role, password: "" };
      });

      setEditStates(editMap);
      setAdminData(users);
    } catch {
      setMessage("❌ Failed to load users.");
    }
  };

  const handleFieldChange = (username, field, value) => {
    setEditStates((prev) => ({
      ...prev,
      [username]: { ...prev[username], [field]: value },
    }));
  };

  const handleRoleSubmit = async (username) => {
    const { role } = editStates[username];
    try {
      const res = await fetch(`${apiBase}/update-role`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ username, role }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert("✅ Role updated successfully!");
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  const handlePasswordSubmit = async (username) => {
    const { password } = editStates[username];
    try {
      const res = await fetch(`${apiBase}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      alert("✅ Password reset successfully!");
      handleFieldChange(username, "password", "");
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f9f9f9",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "95%",
          maxWidth: "1000px",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ textAlign: "center" }}>
              <img
        src={gowowsLogo}
        alt="GoWows Logo"
        style={{
          width: "300px",              // 👈 set a fixed width
          maxWidth: "100%",            // 👈 responsive on smaller screens
          marginBottom: "10px",
          marginTop: "-10px",
        }}
      />
          <h2 style={{ color: "#c62828", marginBottom: "20px" }}>Admin Console</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px",
           maxWidth: "400px",        // 👈 narrow width
           marginInline: "auto",     // 👈 center horizontally
         }}>
          <input
            type="text"
            placeholder="Admin Username"
            value={adminUsername}
            onChange={(e) => setAdminUsername(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Admin Password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleAdminLogin} style={loginBtn}>
            Login
          </button>
        </div>


        {message && (
          <p style={{ marginTop: "10px", fontWeight: "bold", color: message.startsWith("✅") ? "green" : "red" }}>
            {message}
          </p>
        )}

        {adminData.length > 0 && (
          <table style={{ width: "100%", marginTop: "20px", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Username</th>
                <th style={th}>Display Name</th>
                <th style={th}>Role</th>
                <th style={th}>New Password</th>
                <th style={th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminData.map((user) => (
                <tr key={user.username}>
                  <td style={td}>{user.username}</td>
                  <td style={td}>{user.display_name}</td>
                  <td style={td}>
                    <select
                      value={editStates[user.username]?.role || ""}
                      onChange={(e) => handleFieldChange(user.username, "role", e.target.value)}
                      style={{ padding: "6px", width: "100%" }}
                    >
                      <option value="user">User</option>
                      <option value="super_user">Super User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td style={td}>
                    <input
                      type="password"
                      placeholder="New Password"
                      value={editStates[user.username]?.password || ""}
                      onChange={(e) => handleFieldChange(user.username, "password", e.target.value)}
                      style={{ padding: "6px", width: "100%" }}
                    />
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => handleRoleSubmit(user.username)} style={btn}>
                        Update Role
                      </button>
                      <button onClick={() => handlePasswordSubmit(user.username)} style={btn}>
                        Reset Password
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const th = {
  border: "1px solid #ccc",
  padding: "10px",
  background: "#f4f4f4",
  textAlign: "left",
};

const td = {
  border: "1px solid #ccc",
  padding: "10px",
};

const btn = {
  backgroundColor: "#c62828",
  color: "white",
  padding: "6px 12px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const loginBtn = {
  backgroundColor: "#c62828",
  color: "white",
  padding: "10px 16px",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontWeight: "bold",
};

const inputStyle = {
  flex: 1,
  padding: "10px",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

export default AdminConsole;
