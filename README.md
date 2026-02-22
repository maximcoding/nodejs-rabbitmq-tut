# RabbitMQ Node.js Demo

A modular microservices application demonstrating producer-consumer pattern with RabbitMQ.

## Project Structure

```
rabbitmq-node-demo/
├── docker-compose.yml
├── producer/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js       # Application entry point
│       ├── config.js      # Configuration management
│       ├── utils.js       # Logging utilities
│       ├── routes.js      # Express routes
│       ├── task.js        # Task validation & normalization
│       ├── producer.js    # Message producer logic
│       └── rabbit.js      # RabbitMQ connection management
└── worker/
    ├── Dockerfile
    ├── package.json
    └── src/
        ├── index.js       # Application entry point
        ├── config.js      # Configuration management
        ├── utils.js       # Logging utilities
        ├── task.js        # Task processing logic
        └── rabbit.js      # RabbitMQ connection management
```

## Module Architecture

### Producer Service (6 modules)

#### `config.js`
Centralized configuration management with environment variables.

#### `utils.js`
Logging functions and helper utilities.

#### `task.js`
Task validation and normalization with default values.

#### `rabbit.js`
RabbitMQ connection management with automatic retry logic.

#### `routes.js`
Express routes and API endpoints.
- `GET /health` - Health check
- `POST /tasks` - Submit a task

#### `index.js`
Application bootstrap and lifecycle management.

### Worker Service (5 modules)

#### `config.js`
Service configuration and environment variables.

#### `utils.js`
Logging utilities and helper functions.

#### `task.js`
Task processing with simulated work and error handling.

#### `rabbit.js`
RabbitMQ consumer - connects and starts message consumption with automatic retry.

#### `index.js`
Worker startup and graceful shutdown.

## Quick Start

### Using Docker Compose

```bash
docker-compose up
```

This starts:
- RabbitMQ (port 5672, UI on 15672)
- Producer service (port 3000)
- Worker service

### Manual Setup

**Producer:**
```bash
cd producer
npm install
npm start
```

**Worker:**
```bash
cd worker
npm install
npm start
```

**RabbitMQ:**
```bash
docker run -d -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## API Endpoints

### Health Check
```bash
GET http://localhost:3000/health
```

Response:
```json
{ "ok": true }
```

### Submit Task
```bash
POST http://localhost:3000/tasks
Content-Type: application/json

{
  "taskId": "my-task-1",    // optional: auto-generated if omitted
  "ms": 500,                // optional: processing time (default: 300)
  "fail": false             // optional: simulate failure (default: false)
}
```

Response (202 Accepted):
```json
{
  "accepted": true,
  "taskId": "my-task-1"
}
```

## Design Principles

### Separation of Concerns
- Each module has a single responsibility
- Clear module dependencies
- Easy to test and maintain

### Configuration Management
- All settings in `config.js`
- Environment variables support
- Sensible defaults

### Error Handling
- Graceful shutdown on signals
- Uncaught exception handling
- Automatic retry with backoff
- Message nack/requeue on failures

### Logging
- Consistent log formatting
- Prefixed messages for service identification
- Error tracking and debugging

### RabbitMQ Features
- **Durable queues**: Survive RabbitMQ restarts
- **Persistent messages**: Saved to disk
- **Prefetch**: Load balancing across workers
- **Acknowledgment**: Manual message ACK/NACK
- **Requeue**: Failed messages requeued automatically

## Development

### Adding New Features

1. **New Endpoint**: Add route in `routes.js`
2. **New Config**: Add to `config.js`
3. **New Logic**: Create dedicated module
4. **New Utility**: Add to `utils.js`

### Testing

Run producer in one terminal:
```bash
npm run dev
```

Submit test tasks:
```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"ms": 2000, "fail": false}'
```

Watch worker process tasks in another terminal.

## Environment Variables

### Producer
- `RABBIT_URL`: RabbitMQ connection string
- `QUEUE`: Queue name (default: tasks)
- `PORT`: HTTP port (default: 3000)

### Worker
- `RABBIT_URL`: RabbitMQ connection string
- `QUEUE`: Queue name (default: tasks)
- `PREFETCH`: Messages to process concurrently (default: 5)

## Performance Tips

1. Adjust `PREFETCH` based on task complexity
2. Use connection pooling for high throughput
3. Implement circuit breakers for fault tolerance
4. Monitor queue depth and processing times

## License

ISC


