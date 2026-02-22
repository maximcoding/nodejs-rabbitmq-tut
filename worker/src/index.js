// worker/src/index.js  (ESM)
import amqp from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL;
const QUEUE = process.env.QUEUE || "tasks";
const PREFETCH = Number(process.env.PREFETCH || 5);

if (!RABBIT_URL) throw new Error("Missing env RABBIT_URL");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const conn = await amqp.connect(RABBIT_URL);
const ch = await conn.createChannel();

await ch.assertQueue(QUEUE, {durable: true});
ch.prefetch(PREFETCH);

console.log(`[worker] consuming ${QUEUE} prefetch=${PREFETCH}`);

ch.consume(
    QUEUE,
    async (msg) => {
        if (!msg) return;

        try {
            const task = JSON.parse(msg.content.toString("utf8"));
            console.log("[worker] got", task);

            // simulate work
            await sleep(Number(task.ms || 300));

            // demo failure path
            if (task.fail) throw new Error("forced fail");

            ch.ack(msg);
            console.log("[worker] ack", task.taskId);
        } catch (e) {
            console.log("[worker] reject", e.message);
            ch.reject(msg, false); // no requeue
        }
    },
    {noAck: false}
);

process.on("SIGINT", async () => {
    await ch.close();
    await conn.close();
    process.exit(0);
});