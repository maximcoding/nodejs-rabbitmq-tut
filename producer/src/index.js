import express from "express";
import amqp from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL;
const PORT = Number(process.env.PORT || 3000);

// exchange-based routing (instead of default exchange + sendToQueue)
const EXCHANGE = process.env.EXCHANGE || "tasks.x";
const EXCHANGE_TYPE = process.env.EXCHANGE_TYPE || "direct"; // direct | topic | fanout | headers
const ROUTING_KEY = process.env.ROUTING_KEY || "task.process";
const QUEUE = process.env.QUEUE || "tasks.q";

if (!RABBIT_URL) throw new Error("Missing env RABBIT_URL");

const conn = await amqp.connect(RABBIT_URL);
const ch = await conn.createChannel();

// ---- create topology here ----
await ch.assertExchange(EXCHANGE, EXCHANGE_TYPE, { durable: true });
await ch.assertQueue(QUEUE, { durable: true });
await ch.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);
// -----------------------------

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/tasks", (req, res) => {
  const task = {
    taskId: req.body?.taskId || `task_${Date.now()}`,
    ms: Number(req.body?.ms || 300),
    fail: Boolean(req.body?.fail),
  };

  // publish to your exchange
  ch.publish(
      EXCHANGE,
      ROUTING_KEY,
      Buffer.from(JSON.stringify(task)),
      { persistent: true, contentType: "application/json" }
  );

  res.status(202).json({ accepted: true, taskId: task.taskId });
});

app.listen(PORT, () => console.log(`producer on :${PORT}`));

process.on("SIGINT", async () => {
  await ch.close();
  await conn.close();
  process.exit(0);
});