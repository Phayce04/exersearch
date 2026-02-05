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

      </div>

      <div style={{ height: "1000px", padding: "10px" }}>
  <h2>Scroll Test Area</h2>
  <p>Scroll down to trigger the header animation.</p>
</div>

      
    
    </>
  );
}