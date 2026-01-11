import React from 'react';
import { logout } from '../../utils/auth';

export default function Dashboard() {
  return (
    <div>
      <h1>Owner Dashboard</h1>
      <button onClick={logout} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Logout
      </button>
    </div>
  );
}
