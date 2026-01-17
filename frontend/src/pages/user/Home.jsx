import React from 'react';
import { logout } from '../../utils/auth';
import Header from './Header-user';
import Footer from './Footer';


export default function Home() {
  return (
    <>
      <Header />
      
      <div>
        <h1>User Home Page</h1>
        <button onClick={logout} style={{ marginTop: '20px', padding: '10px 20px' }}>
          Logout
        </button>
      </div>
      
      <Footer />
    </>
  );
}