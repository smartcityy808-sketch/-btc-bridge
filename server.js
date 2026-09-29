const http = require("http");
const net = require("net");
const WebSocket = require("ws");

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("BTC Bridge Online ✅");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  const tcp = net.createConnection({
    host: "stratum.braiins.com",
    port: 3333
  });

  tcp.on("connect", () => {
    ws.send("BRAIINS_TCP_CONNECTED");
  });

  tcp.on("data", (data) => {
    ws.send(data.toString());
  });

  tcp.on("error", (err) => {
    ws.send("TCP_ERROR: " + err.message);
    ws.close();
  });

  ws.on("message", (message) => {
    tcp.write(message.toString());
  });

  ws.on("close", () => {
    tcp.destroy();
  });
});

const PORT = process.env.PORT || 10000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bridge running on port ${PORT}`);
});
