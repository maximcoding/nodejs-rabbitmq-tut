# RabbitMQ Node.js Demo

A lightweight microservices application demonstrating producer-consumer pattern with RabbitMQ using exchange-based routing.

## Project Structure

```
nodejsRabbitMq/
├── docker-compose.yml      # Docker compose setup for RabbitMQ, Producer, and Worker
├── package.json            # Root workspace configuration (ESM)
├── producer/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js        # Express API + RabbitMQ producer
└── worker/
    ├── Dockerfile
    ├── package.json
    └── src/
        └── index.js        # RabbitMQ consumer
```

## Architecture

### Producer Service
- **Framework**: Express.js
- **Endpoints**:
  - `GET /health` - Health check endpoint
  - `POST /tasks` - Submit a task for processing
- **RabbitMQ**: Publishes messages to exchange with routing key
- **Port**: 3000

### Worker Service
- **RabbitMQ**: Consumes messages from queue
- **Features**: 
  - Simulated task processing with configurable delay
  - Error handling with message rejection
  - Graceful shutdown on SIGINT
  - Configurable message prefetch

## Quick Start

### Using Docker Compose (Recommended)

```bash
docker-compose up
```

This starts:
- **RabbitMQ** - Message broker (port 5672, Management UI on 15672)
- **Producer** - REST API (port 3000)
- **Worker** - Message consumer

### Manual Setup

**Prerequisites**: Node.js 18+, RabbitMQ running locally

**Start RabbitMQ**:
```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

**Install dependencies**:
```bash
npm install
```

**Run Producer** (Terminal 1):
```bash
npm run producer
# or with auto-reload:
# cd producer && npm run dev
```

**Run Worker** (Terminal 2):
```bash
npm run worker
# or with auto-reload:
# cd worker && npm run dev
```

## API Usage

### Health Check
```bash
curl http://localhost:3000/health
```

Response:
```json
{ "ok": true }
```

### Submit Task
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "my-task-1",
    "ms": 500,
    "fail": false
  }'
```

**Request Fields**:
- `taskId` (optional): Unique task identifier. Auto-generated if omitted (`task_<timestamp>`)
- `ms` (optional): Processing time in milliseconds (default: 300)
- `fail` (optional): Simulate task failure for testing (default: false)

Response (202 Accepted):
```json
{
  "accepted": true,
  "taskId": "my-task-1"
}
```

## RabbitMQ Configuration

The project uses exchange-based routing with the following topology:

| Component | Value |
|-----------|-------|
| Exchange | `tasks.x` |
| Exchange Type | `direct` |
| Queue | `tasks.q` |
| Routing Key | `task.process` |
| Queue Durability | Yes (durable: true) |
| Message Persistence | Yes (persistent: true) |
| Prefetch Count | 5 messages |

## Environment Variables

### Producer
```env
RABBIT_URL=amqp://guest:guest@localhost:5672
EXCHANGE=tasks.x
EXCHANGE_TYPE=direct
ROUTING_KEY=task.process
QUEUE=tasks.q
PORT=3000
```

### Worker
```env
RABBIT_URL=amqp://guest:guest@localhost:5672
EXCHANGE=tasks.x
EXCHANGE_TYPE=direct
ROUTING_KEY=task.process
QUEUE=tasks.q
PREFETCH=5
```

## How It Works

1. **Producer** receives HTTP POST request with task details
2. **Producer** publishes message to RabbitMQ exchange with routing key
3. **Message** is routed to queue based on exchange and routing key
4. **Worker** consumes message from queue
5. **Worker** processes task (simulated delay + optional failure)
6. **Worker** acknowledges (ack) on success or rejects (nack) on failure
7. **Failed messages** are not requeued and are discarded

## RabbitMQ Features Used

- **Durable Exchanges & Queues**: Survive broker restarts
- **Persistent Messages**: Saved to disk, survive broker restarts
- **Direct Exchange**: Reliable routing based on routing key
- **Consumer Prefetch**: Load balancing and QoS control
- **Manual Acknowledgment**: Explicit message processing confirmation
- **Message Rejection**: Failed messages handled gracefully

## Testing

### Test Successful Task Processing
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"ms": 1000}'
```

Watch worker logs - should process and ack the message.

### Test Failed Task Processing
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"ms": 500, "fail": true}'
```

Watch worker logs - should reject the message.

### Test Multiple Tasks
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/tasks \
    -H "Content-Type: application/json" \
    -d "{\"ms\": $((RANDOM % 2000 + 100))}"
done
```

## RabbitMQ Management UI

Access the RabbitMQ Management Console:
- **URL**: http://localhost:15672
- **Username**: guest
- **Password**: guest

Features:
- Monitor queues and message counts
- View exchange bindings
- Test publish/subscribe
- Monitor connections

## Troubleshooting

### Producer Connection Error
- Ensure RabbitMQ is running and accessible at `RABBIT_URL`
- Check network connectivity and firewall rules
- Verify credentials in environment variables

### No Messages in Queue
- Check producer logs for publish errors
- Verify routing key matches in producer and worker
- Ensure exchange and queue exist (should be auto-created on startup)

### Worker Not Processing Messages
- Verify worker is connected (check logs)
- Check `PREFETCH` setting doesn't exceed available workers
- Ensure queue name matches between producer and worker

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

## Development Notes

- **ESM Format**: Project uses ES modules (`type: "module"` in package.json)
- **No Transpilation**: Uses native Node.js 18+ features
- **Monorepo**: Root package.json manages workspace dependencies
- **Graceful Shutdown**: Both services handle SIGINT (Ctrl+C) properly

## Performance Considerations

1. **Prefetch Settings**: Adjust `PREFETCH` env var based on worker throughput
   - Lower for long-running tasks
   - Higher for short tasks
2. **Message Persistence**: Enabled by default, slight performance impact
3. **Queue Durability**: Recommended for production reliability
4. **Connection Pooling**: Currently single connection per service, suitable for demo

## License

ISC

