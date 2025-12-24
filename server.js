import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🩺 Health check endpoint for testing deployment
app.get("/", (req, res) => {
  res.send("✅ Realtime Collab Backend is running!");
});

// Create HTTP + WebSocket servers
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// 🗂️ In-memory room store
const rooms = new Map();

/**
 * Broadcast helper
 */
const broadcastToRoom = (roomId, data) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  for (const client of room.clients) {
    if (client.readyState === 1) {
      client.send(msg);
    }
  }
};

/**
 * WebSocket connection handler
 */
wss.on("connection", (ws) => {
  console.log("🔌 New client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("📩 Received:", data);

      // --- CREATE ROOM ---
      if (data.type === "create") {
        const roomId = data.roomId
          ? data.roomId.toUpperCase()
          : Math.random().toString(36).substring(2, 7).toUpperCase();

        if (rooms.has(roomId)) {
          ws.send(JSON.stringify({ type: "error", error: "Room already exists" }));
          return;
        }

        rooms.set(roomId, {
          password: data.password,
          text: "",
          version: 0,
          clients: new Set([ws]),
          lastActive: Date.now(),
        });

        ws.roomId = roomId;
        ws.send(JSON.stringify({ type: "room_created", roomId }));
        console.log(`✅ Room created: ${roomId}`);
      }

      // --- JOIN ROOM ---
      else if (data.type === "join") {
        const room = rooms.get(data.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: "error", error: "Room not found" }));
          return;
        }

        if (room.password !== data.password) {
          ws.send(JSON.stringify({ type: "error", error: "Invalid password" }));
          return;
        }

        room.clients.add(ws);
        ws.roomId = data.roomId;
        room.lastActive = Date.now();

        // send current state to new user
        ws.send(
          JSON.stringify({
            type: "joined",
            roomId: data.roomId,
            text: room.text,
            version: room.version,
          })
        );

        broadcastToRoom(data.roomId, {
          type: "presence",
          count: room.clients.size,
        });

        console.log(`👥 User joined room ${data.roomId}`);
      }

      // --- EDIT / UPDATE TEXT ---
      else if (data.type === "edit") {
        const room = rooms.get(ws.roomId);
        if (!room) return;

        room.text = data.text;
        room.version++;
        room.lastActive = Date.now();

        broadcastToRoom(ws.roomId, {
          type: "update",
          text: room.text,
          version: room.version,
        });
      }

      // --- LEAVE ROOM ---
      else if (data.type === "leave") {
        const room = rooms.get(data.roomId);
        if (!room) return;

        room.clients.delete(ws);
        ws.roomId = null;

        ws.send(JSON.stringify({ type: "left_room" }));
        console.log(`🚪 User left room ${data.roomId}`);

        broadcastToRoom(data.roomId, {
          type: "presence",
          count: room.clients.size,
        });

        if (room.clients.size === 0) {
          console.log(`🧹 Cleaning up empty room: ${data.roomId}`);
          rooms.delete(data.roomId);
        }
      }
    } catch (err) {
      console.error("❌ Error handling message:", err);
    }
  });

  // --- When a user disconnects unexpectedly ---
  ws.on("close", () => {
    console.log("❌ Client disconnected");
    if (ws.roomId && rooms.has(ws.roomId)) {
      const room = rooms.get(ws.roomId);
      room.clients.delete(ws);

      broadcastToRoom(ws.roomId, {
        type: "presence",
        count: room.clients.size,
      });

      if (room.clients.size === 0) {
        console.log(`🧹 Cleaning up empty room: ${ws.roomId}`);
        rooms.delete(ws.roomId);
      }
    }
  });
});

// --- Auto-clean inactive rooms every 10 minutes ---
setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    if (room.clients.size === 0 && now - room.lastActive > 10 * 60 * 1000) {
      rooms.delete(roomId);
      console.log(`🕒 Deleted inactive room: ${roomId}`);
    }
  }
}, 5 * 60 * 1000);

// --- Start server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 WebSocket ready on ws://localhost:${PORT}`);
});
