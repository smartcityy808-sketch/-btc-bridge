const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const net = require("net");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 10000;

const POOL_HOST = "pool.xaxamining.com";
const POOL_PORT = 3335;

app.get("/", (req, res) => {
  res.send("Bitcoin Testnet4 Bridge OK");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {

  console.log("IPHONE CONNECTED");

  const tcp = new net.Socket();

  tcp.connect(POOL_PORT, POOL_HOST, () => {
    console.log("TESTNET4 POOL CONNECTED");
  });

  ws.on("message", (data) => {
    const message = data.toString();

    console.log("IPHONE -> POOL:", message.trim());

    if (!tcp.destroyed) {
      tcp.write(
        message.endsWith("\n")
          ? message
          : message + "\n"
      );
    }
  });

  tcp.on("data", (data) => {

    const message = data.toString();

    console.log("POOL -> IPHONE:", message.trim());

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  tcp.on("error", (err) => {
    console.log("POOL ERROR:", err.message);
  });

  tcp.on("close", () => {
    console.log("POOL DISCONNECTED");

    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  ws.on("close", () => {

    console.log("IPHONE DISCONNECTED");

    if (!tcp.destroyed) {
      tcp.destroy();
    }

  });

});

server.listen(PORT, "0.0.0.0", () => {

  console.log("================================");
  console.log("TESTNET4 BRIDGE RUNNING");
  console.log("POOL:", POOL_HOST + ":" + POOL_PORT);
  console.log("PORT:", PORT);
  console.log("================================");

});
