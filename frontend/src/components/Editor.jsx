import React from "react";

export default function Editor({
  roomId,
  text,
  presence,
  version,
  status,
  handleChange,
  handleExitRoom,
}) {
  return (
    <section className="editor-container">
      <div className="editor-header">
        <span>Room: {roomId || "—"}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <div className="chip">{presence} users</div>
          <div className="chip">v{version}</div>
        </div>
      </div>

      <textarea
        disabled={!roomId}
        placeholder={roomId ? "" : "Join or create a room first"}
        value={text}
        onChange={handleChange}
      />

      {roomId && (
        <button
          style={{
            marginTop: "10px",
            alignSelf: "flex-end",
            background: "#ef4444",
            border: "none",
            color: "#fff",
            borderRadius: "8px",
            padding: "8px 14px",
            cursor: "pointer",
            transition: "background 0.2s ease",
          }}
          onClick={handleExitRoom}
        >
          Exit Room
        </button>
      )}

      <p className="muted">{status}</p>
    </section>
  );
}
