import React from "react";

export default function Sidebar({
  createRoomId,
  setCreateRoomId,
  createPassword,
  setCreatePassword,
  createRoom,
  joinRoomId,
  setJoinRoomId,
  joinPassword,
  setJoinPassword,
  joinRoom,
}) {
  return (
    <aside className="sidebar">
      {/* Create Room */}
      <div>
        <h2>Create Room</h2>
        <input
          placeholder="Custom Room ID"
          value={createRoomId}
          onChange={(e) => setCreateRoomId(e.target.value.toUpperCase())}
        />
        <input
          type="password"
          placeholder="Set password"
          value={createPassword}
          onChange={(e) => setCreatePassword(e.target.value)}
        />
        <button onClick={createRoom}>Create</button>
      </div>

      {/* Join Room */}
      <div>
        <h2>Join Room</h2>
        <input
          placeholder="Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
        />
        <input
          type="password"
          placeholder="Password"
          value={joinPassword}
          onChange={(e) => setJoinPassword(e.target.value)}
        />
        <button onClick={joinRoom}>Join</button>
      </div>
    </aside>
  );
}
