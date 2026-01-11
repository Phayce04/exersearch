import React from 'react';
import { logout } from '../../utils/auth';

export default function Home() {
  return (
    <div>
      <h1>User Home Page</h1>
      <button onClick={logout} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Logout
      </button>
    </div>
  );
}
