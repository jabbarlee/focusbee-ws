const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
require("dotenv").config();

// Create HTTP server
const server = http.createServer();

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
});

// Track connected clients and sessions
const sessionRooms = new Map();
const clientSessions = new Map();

io.on("connection", (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  // Join a session room
  socket.on("join-session", (sessionId) => {
    if (!sessionId || typeof sessionId !== "string") {
      console.error(`Invalid sessionId provided: ${sessionId}`);
      return;
    }

    console.log(
      `[${new Date().toISOString()}] Client ${
        socket.id
      } joining session ${sessionId}`
    );

    // Leave previous session if exists
    const previousSession = clientSessions.get(socket.id);
    if (previousSession) {
      socket.leave(previousSession);
      console.log(
        `Client ${socket.id} left previous session ${previousSession}`
      );
    }

    // Join new session
    socket.join(sessionId);
    clientSessions.set(socket.id, sessionId);

    // Track session room
    if (!sessionRooms.has(sessionId)) {
      sessionRooms.set(sessionId, new Set());
    }
    sessionRooms.get(sessionId).add(socket.id);

    console.log(
      `[${new Date().toISOString()}] Client ${
        socket.id
      } joined session ${sessionId}`
    );

    // Notify others in the session
    socket.to(sessionId).emit("client-joined", {
      clientId: socket.id,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle phone connection
  socket.on("phone-connected", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid phone-connected data:", data);
      return;
    }

    console.log(
      `[${new Date().toISOString()}] Phone connected to session: ${
        data.sessionId
      }`
    );
    socket.to(data.sessionId).emit("phone-connected", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle ritual step updates
  socket.on("ritual-step", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid ritual-step data:", data);
      return;
    }

    console.log(`[${new Date().toISOString()}] Ritual step update:`, {
      sessionId: data.sessionId,
      step: data.step,
      stepNumber: data.stepNumber,
      totalSteps: data.totalSteps,
    });

    socket.to(data.sessionId).emit("ritual-step", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle timer selection
  socket.on("timer-selected", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid timer-selected data:", data);
      return;
    }

    console.log(`[${new Date().toISOString()}] Timer selected:`, {
      sessionId: data.sessionId,
      timer: data.timer,
      timerName: data.timerName,
    });

    socket.to(data.sessionId).emit("timer-selected", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle ritual completion
  socket.on("ritual-complete", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid ritual-complete data:", data);
      return;
    }

    console.log(`[${new Date().toISOString()}] Ritual complete:`, {
      sessionId: data.sessionId,
      timer: data.timer,
    });

    socket.to(data.sessionId).emit("ritual-complete", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle focus session start
  socket.on("focus-session-start", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid focus-session-start data:", data);
      return;
    }

    console.log(`[${new Date().toISOString()}] Focus session started:`, {
      sessionId: data.sessionId,
      duration: data.duration,
    });

    socket.to(data.sessionId).emit("focus-session-start", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle focus session end
  socket.on("focus-session-end", (data) => {
    if (!data || !data.sessionId) {
      console.error("Invalid focus-session-end data:", data);
      return;
    }

    console.log(`[${new Date().toISOString()}] Focus session ended:`, {
      sessionId: data.sessionId,
    });

    socket.to(data.sessionId).emit("focus-session-end", {
      ...data,
      timestamp: new Date().toISOString(),
    });
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    console.log(
      `[${new Date().toISOString()}] Client disconnected: ${
        socket.id
      }, reason: ${reason}`
    );

    // Clean up session tracking
    const sessionId = clientSessions.get(socket.id);
    if (sessionId) {
      const sessionClients = sessionRooms.get(sessionId);
      if (sessionClients) {
        sessionClients.delete(socket.id);
        if (sessionClients.size === 0) {
          sessionRooms.delete(sessionId);
          console.log(`Session ${sessionId} is now empty and removed`);
        }
      }
      clientSessions.delete(socket.id);

      // Notify others in the session
      socket.to(sessionId).emit("client-left", {
        clientId: socket.id,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Handle ping for connection testing
  socket.on("ping", (callback) => {
    if (typeof callback === "function") {
      callback({
        timestamp: new Date().toISOString(),
        serverId: process.env.SERVER_ID || "unknown",
      });
    }
  });
});

// Health check endpoint
const healthCheckHandler = (req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      status: "healthy",
      timestamp: new Date().toISOString(),
      connections: io.engine.clientsCount,
      activeSessions: sessionRooms.size,
    })
  );
};

server.on("request", (req, res) => {
  if (req.url === "/health") {
    healthCheckHandler(req, res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

// Server configuration
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`🚀 WebSocket server running on ${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || "development"}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
