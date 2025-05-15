import React, { useState, useEffect } from 'react';

const AdminConsole = () => {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminData, setAdminData] = useState([]);
  const [message, setMessage] = useState('');
  const [editStates, setEditStates] = useState({});

  const apiBase = 'http://localhost:7860';

  const handleAdminLogin = async () => {
    try {
      const res = await fetch(`${apiBase}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ ${data.error}`);
        return;
      }

      setAdminToken(data.token);

      const meRes = await fetch(`${apiBase}/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const me = await meRes.json();

      if (me.role !== 'admin') {
        setMessage('❌ Access denied. Not an admin.');
        return;
      }

      setMessage(`✅ Welcome Admin ${me.display_name}`);
      loadUsers(data.token);
    } catch {
      setMessage('❌ Error logging in');
    }
  };

  const loadUsers = async (token) => {
    const res = await fetch(`${apiBase}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const resData = await res.json();
    const users = resData.users || resData;

    const editMap = {};
    users.forEach((u) => {
      editMap[u.username] = { role: u.role, password: '' };
    });

    setEditStates(editMap);
    setAdminData(users || []);
  };

  const handleFieldChange = (username, field, value) => {
    setEditStates((prev) => ({
      ...prev,
      [username]: {
        ...prev[username],
        [field]: value,
      },
    }));
  };

  const handleRoleSubmit = async (username) => {
    const { role } = editStates[username];

    try {
      const res = await fetch(`${apiBase}/update-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ username, role }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      alert('✅ Role updated successfully!');
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };




  const handleRefreshKB = async () => {
    try {
      const res = await fetch(`${apiBase}/list-kb-folders`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
  
      if (!res.ok) throw new Error('Failed to refresh KB');
  
      alert("✅ KB manually refreshed!");
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };


  const handlePasswordSubmit = async (username) => {
    const { password } = editStates[username];

    try {
      const res = await fetch(`${apiBase}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ username, password }),
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error);
      alert('✅ Password reset successfully!');
      handleFieldChange(username, 'password', '');
    } catch (err) {
      alert(`❌ ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Console</h2>
      <input
        type="text"
        placeholder="Admin Username"
        value={adminUsername}
        onChange={(e) => setAdminUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Admin Password"
        value={adminPassword}
        onChange={(e) => setAdminPassword(e.target.value)}
      />
      <button onClick={handleAdminLogin} style={loginBtn}>Login to Admin Console</button>
      {/*<button onClick={handleRefreshKB} style={refreshBtn}>🔄 Refresh KB</button>*/}

      {message && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}

      {adminData.length > 0 && (
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={th}>Username</th>
              <th style={th}>Display Name</th>
              <th style={th}>Role</th>
              <th style={th}>Reset Password</th>
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
                    value={editStates[user.username]?.role || ''}
                    onChange={(e) =>
                      handleFieldChange(user.username, 'role', e.target.value)
                    }
                    style={{ padding: '6px', width: '100%' }}
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
                    value={editStates[user.username]?.password || ''}
                    onChange={(e) =>
                      handleFieldChange(user.username, 'password', e.target.value)
                    }
                    style={{ padding: '6px', width: '100%' }}
                  />
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleRoleSubmit(user.username)}
                      style={btn}
                    >
                      Update Role
                    </button>
                    <button
                      onClick={() => handlePasswordSubmit(user.username)}
                      style={btn}
                    >
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
  );
};

const th = {
  border: '1px solid #ccc',
  padding: '10px',
  background: '#f4f4f4',
};

const td = {
  border: '1px solid #ccc',
  padding: '10px',
};

const btn = {
  backgroundColor: '#ff5c5c',
  color: 'white',
  padding: '6px 12px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};

const loginBtn = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '8px 16px',
  border: 'none',
  marginLeft: '10px',
  borderRadius: '4px',
};

const refreshBtn = {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    marginLeft: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
  };
  
 

export default AdminConsole;
