const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const net = require("net");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

// Bitcoin Testnet4 low-difficulty pool
const POOL_HOST = "pool.xaxamining.com";
const POOL_PORT = 3335;

app.get("/", (req, res) => {
  res.send("Bitcoin Testnet4 Stratum Bridge OK");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    pool: `${POOL_HOST}:${POOL_PORT}`
  });
});

const wss = new WebSocket.Server({
  server,
  path: "/"
});

wss.on("connection", (ws, req) => {
  console.log("iPhone connected:", req.socket.remoteAddress);

  const tcp = new net.Socket();

  let closed = false;

  tcp.connect(POOL_PORT, POOL_HOST, () => {
    console.log("Connected to Testnet4 pool");
  });

  // iPhone -> Pool
  ws.on("message", (data) => {
    if (closed) return;

    const message = data.toString();

    console.log("WS -> TCP:", message.trim());

    tcp.write(message.endsWith("\n") ? message : message + "\n");
  });

  // Pool -> iPhone
  tcp.on("data", (data) => {
    if (closed) return;

    const message = data.toString();

    console.log("TCP -> WS:", message.trim());

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  tcp.on("error", (err) => {
    console.error("TCP error:", err.message);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          error: "POOL_CONNECTION_ERROR",
          message: err.message
        })
      );
    }
  });

  tcp.on("close", () => {
    console.log("Pool connection closed");

    if (!closed) {
      closed = true;

      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    }
  });

  ws.on("close", () => {
    console.log("iPhone disconnected");

    closed = true;

    if (!tcp.destroyed) {
      tcp.destroy();
    }
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);

    closed = true;

    if (!tcp.destroyed) {
      tcp.destroy();
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bridge running on port ${PORT}`);
});
