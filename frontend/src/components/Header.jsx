import React from "react";

export default function Header({ connected, status }) {
  return (
    <header>
      <h1>Realtime TXT Editor</h1>
      <div className="status">
        <div className={`status-dot ${connected ? "connected" : ""}`}></div>
        <span>{status}</span>
      </div>
    </header>
  );
}
