import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";

export default function App() {
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState("Connecting...");

  // Create room inputs
  const [createRoomId, setCreateRoomId] = useState("");
  const [createPassword, setCreatePassword] = useState("");

  // Join room inputs
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");

  // Editor data
  const [roomId, setRoomId] = useState("");
  const [text, setText] = useState("");
  const [presence, setPresence] = useState(0);
  const [version, setVersion] = useState(0);

  const isApplyingRemote = useRef(false);

  // 🔌 Connect WebSocket
  useEffect(() => {
    const url = import.meta.env.VITE_SOCKET_URL || "ws://localhost:3000";
    const socket = new WebSocket(url);
    setWs(socket);

    socket.onopen = () => {
      setConnected(true);
      setStatus("Connected ✅");
      console.log("✅ WebSocket connected");
    };

    socket.onclose = () => {
      setConnected(false);
      setStatus("Disconnected ❌");
      console.warn("WebSocket disconnected");
    };

    socket.onmessage = (e) => {
      let m;
      try {
        m = JSON.parse(e.data);
      } catch {
        return;
      }
      handleMessage(m);
    };

    return () => socket.close();
  }, []);

  // 📩 Handle messages from backend
  const handleMessage = (m) => {
    console.log("📨 Message:", m);

    switch (m.type) {
      case "room_created":
      case "joined":
        setRoomId(m.roomId);
        setStatus(m.type === "room_created" ? "Room created" : "Joined room");
        setText(m.text || "");
        break;

      case "update":
        isApplyingRemote.current = true;
        setText(m.text || "");
        setVersion(m.version || 0);
        isApplyingRemote.current = false;
        break;

      case "presence":
        setPresence(m.count || 0);
        break;

      case "ack":
        setVersion((v) => Math.max(v, m.version || 0));
        break;

      case "left_room":
        setStatus("Exited room");
        break;

      case "error":
        setStatus(`Error: ${m.error}`);
        break;

      default:
        break;
    }
  };

  // 🧠 Send helper
  const send = (obj) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setStatus("⚠️ WebSocket not connected");
      return;
    }
    ws.send(JSON.stringify(obj));
  };

  // 🏗 Create Room
  const createRoom = () => {
    if (!createPassword) return setStatus("Enter password first");

    send({
      type: "create",
      roomId: createRoomId || null, // optional custom room ID
      password: createPassword,
    });
  };

  // 🔗 Join Room
  const joinRoom = () => {
    if (!joinRoomId || !joinPassword)
      return setStatus("Enter room ID and password");
    send({ type: "join", roomId: joinRoomId, password: joinPassword });
  };

  // ✏️ Handle editor text change
  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (!isApplyingRemote.current)
      send({ type: "edit", text: val, baseVersion: version });
  };

  // 🚪 Exit Room
  const handleExitRoom = () => {
    if (!roomId) return;
    if (!window.confirm("Are you sure you want to exit this room?")) return;

    send({ type: "leave", roomId });

    // reset everything
    setRoomId("");
    setText("");
    setPresence(0);
    setVersion(0);
    setStatus("Exited room");

    // 🧹 clear inputs
    setCreateRoomId("");
    setCreatePassword("");
    setJoinRoomId("");
    setJoinPassword("");
  };

  return (
    <>
      <Header connected={connected} status={status} />
      <main>
        <Editor
          roomId={roomId}
          text={text}
          presence={presence}
          version={version}
          status={status}
          handleChange={handleChange}
          handleExitRoom={handleExitRoom}
        />

        <Sidebar
          createRoomId={createRoomId}
          setCreateRoomId={setCreateRoomId}
          createPassword={createPassword}
          setCreatePassword={setCreatePassword}
          createRoom={createRoom}
          joinRoomId={joinRoomId}
          setJoinRoomId={setJoinRoomId}
          joinPassword={joinPassword}
          setJoinPassword={setJoinPassword}
          joinRoom={joinRoom}
        />
      </main>
    </>
  );
}
