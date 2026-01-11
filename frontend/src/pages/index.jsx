import React from "react";
import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div style={{ textAlign: "center", padding: "100px" }}>
      <h1>Welcome to ExerSearch</h1>
      <p>Your fitness companion app</p>
      <Link to="/login">
        <button style={{ padding: "10px 20px", fontSize: "16px" }}>Login</button>
      </Link>
    </div>
  );
}
