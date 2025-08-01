---
sidebar_position: 4
---

# Events Module

The Events module provides real-time event streaming and historical event querying for your foc.fun applications. It enables reactive applications by delivering blockchain events instantly to your frontend or backend services.

## Overview

The Events module offers:

- Real-time event streaming via WebSocket
- Historical event querying and filtering
- Event indexing and search
- Custom event transformations
- Multi-protocol support (WebSocket, SSE, Webhooks)
- Event replay and recovery

## Architecture

The Events module operates as a high-performance event pipeline:

1. **Event Capture**: Monitors blockchain for relevant events
2. **Processing**: Filters, transforms, and enriches events
3. **Storage**: Indexes events for historical queries
4. **Delivery**: Streams events to subscribers in real-time

## Configuration

Configure the Events module in your `foc.config.yml`:

```yaml
modules:
  events:
    enabled: true
    protocols:
      websocket:
        enabled: true
        port: 8081
        path: /ws
      sse:
        enabled: true
        path: /events
      webhooks:
        enabled: true
        retry_attempts: 3
        retry_delay: 1000
    indexing:
      enabled: true
      storage: postgres
      retention_days: 90
    processing:
      batch_size: 100
      workers: 4
      max_retries: 3
```

## API Reference

### Initialize the Module

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine();
const events = engine.getModule('events');
```

### WebSocket Connection

```javascript
// Connect to WebSocket
const ws = await events.connectWebSocket();

// Subscribe to all events
ws.subscribe('*', (event) => {
  console.log('Event received:', event);
});

// Subscribe to specific contract
ws.subscribe({
  contract: '0x123...',
  callback: (event) => {
    console.log('Contract event:', event);
  }
});

// Subscribe to specific event type
ws.subscribe({
  contract: '0x123...',
  event: 'Transfer',
  callback: (event) => {
    console.log('Transfer:', event);
  }
});
```

### Core Methods

#### subscribe(options)

Subscribe to live events:

```javascript
// Simple subscription
const subscription = await events.subscribe({
  contract: '0xtoken...',
  event: 'Transfer',
  callback: (event) => {
    console.log(`Transfer: ${event.from} -> ${event.to}: ${event.amount}`);
  }
});

// Advanced subscription with filters
const filtered = await events.subscribe({
  contract: '0xtoken...',
  event: 'Transfer',
  filters: {
    from: '0xspecific...',  // Only transfers from this address
    amount: { gt: '1000000000000000000' }  // Only transfers > 1 token
  },
  callback: (event) => {
    console.log('Large transfer detected:', event);
  }
});

// Multiple events
const multi = await events.subscribe({
  contract: '0xtoken...',
  events: ['Transfer', 'Approval', 'Mint'],
  callback: (event) => {
    console.log(`${event.name} event:`, event);
  }
});
```

#### query(options)

Query historical events:

```javascript
// Query all events from a contract
const allEvents = await events.query({
  contract: '0xtoken...',
  fromBlock: 1000,
  toBlock: 'latest'
});

// Query specific event type
const transfers = await events.query({
  contract: '0xtoken...',
  event: 'Transfer',
  fromBlock: 1000,
  toBlock: 2000
});

// Query with filters
const largeTransfers = await events.query({
  contract: '0xtoken...',
  event: 'Transfer',
  filters: {
    amount: { gt: '1000000000000000000' }
  },
  fromBlock: 0,
  toBlock: 'latest',
  limit: 100,
  orderBy: 'blockNumber',
  order: 'desc'
});

// Query with time range
const recentEvents = await events.query({
  contract: '0xtoken...',
  fromTime: Date.now() - 86400000,  // Last 24 hours
  toTime: Date.now()
});
```

#### aggregate(options)

Aggregate event data:

```javascript
// Count events by type
const eventCounts = await events.aggregate({
  contract: '0xtoken...',
  groupBy: 'eventName',
  aggregate: 'count'
});

// Sum transfer amounts
const totalTransferred = await events.aggregate({
  contract: '0xtoken...',
  event: 'Transfer',
  field: 'amount',
  aggregate: 'sum'
});

// Complex aggregation
const dailyVolume = await events.aggregate({
  contract: '0xdex...',
  event: 'Swap',
  groupBy: {
    time: 'day',
    field: 'tokenIn'
  },
  aggregate: {
    volume: { sum: 'amountIn' },
    count: 'count',
    unique_users: { distinct: 'sender' }
  },
  fromTime: Date.now() - 30 * 86400000  // Last 30 days
});
```

## Advanced Features

### Event Transformations

Transform events before delivery:

```javascript
// Add custom transformation
events.addTransformation({
  contract: '0xtoken...',
  event: 'Transfer',
  transform: async (event) => {
    // Enrich with USD value
    const price = await getTokenPrice(event.contract);
    return {
      ...event,
      amountUSD: (BigInt(event.amount) * price) / 10n**18n
    };
  }
});

// Chain transformations
events.addTransformation({
  contract: '0xnft...',
  event: 'Transfer',
  transforms: [
    enrichWithMetadata,
    addRarityScore,
    convertPrices
  ]
});
```

### Event Filters

Create complex event filters:

```javascript
// Composite filters
const complexFilter = await events.createFilter({
  name: 'whale-activity',
  conditions: {
    or: [
      {
        event: 'Transfer',
        amount: { gt: '1000000000000000000000' }  // > 1000 tokens
      },
      {
        event: 'Swap',
        amountUSD: { gt: 100000 }
      }
    ]
  }
});

// Apply filter to subscription
const whaleWatch = await events.subscribe({
  filter: 'whale-activity',
  callback: (event) => {
    alert('Whale activity detected!', event);
  }
});
```

### Webhooks

Configure webhook endpoints:

```javascript
// Register webhook
await events.registerWebhook({
  url: 'https://api.example.com/events',
  secret: 'webhook-secret',
  events: {
    contract: '0xtoken...',
    types: ['Transfer', 'Approval']
  },
  retry: {
    attempts: 3,
    backoff: 'exponential'
  }
});

// Webhook with custom headers
await events.registerWebhook({
  url: 'https://api.example.com/events',
  headers: {
    'Authorization': 'Bearer token',
    'X-Custom-Header': 'value'
  },
  transform: async (event) => ({
    id: event.transactionHash,
    type: event.name,
    data: event
  })
});
```

### Event Replay

Replay historical events:

```javascript
// Replay events from specific point
await events.replay({
  fromBlock: 1000,
  toBlock: 2000,
  speed: 2,  // 2x speed
  contracts: ['0xtoken...', '0xnft...'],
  callback: (event) => {
    // Process replayed event
    console.log('Replayed:', event);
  }
});

// Replay with state reconstruction
const stateReplay = await events.replayWithState({
  contract: '0xtoken...',
  fromBlock: 0,
  toBlock: 'latest',
  stateHandler: {
    initial: { balances: {} },
    Transfer: (state, event) => {
      state.balances[event.from] -= event.amount;
      state.balances[event.to] = (state.balances[event.to] || 0) + event.amount;
      return state;
    }
  }
});
```

### Server-Sent Events (SSE)

For simpler real-time updates:

```javascript
// Client-side SSE connection
const eventSource = new EventSource('http://localhost:8080/events');

eventSource.addEventListener('Transfer', (e) => {
  const event = JSON.parse(e.data);
  console.log('Transfer event:', event);
});

// Server-side SSE setup
app.get('/events', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  
  const subscription = await events.subscribe({
    contract: '0xtoken...',
    callback: (event) => {
      res.write(`event: ${event.name}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  });
  
  req.on('close', () => {
    subscription.unsubscribe();
  });
});
```

## Event Types

### Standard Events

Common event patterns:

```javascript
// ERC20 Transfer
{
  name: 'Transfer',
  contract: '0xtoken...',
  from: '0x123...',
  to: '0x456...',
  amount: '1000000000000000000',
  blockNumber: 12345,
  transactionHash: '0xabc...',
  timestamp: 1234567890
}

// ERC721 Transfer
{
  name: 'Transfer',
  contract: '0xnft...',
  from: '0x123...',
  to: '0x456...',
  tokenId: '42',
  blockNumber: 12345,
  transactionHash: '0xabc...',
  timestamp: 1234567890
}

// Custom Game Event
{
  name: 'BattleComplete',
  contract: '0xgame...',
  winner: '0x123...',
  loser: '0x456...',
  rewards: {
    xp: '1000',
    gold: '500',
    items: ['sword', 'shield']
  },
  blockNumber: 12345,
  transactionHash: '0xabc...',
  timestamp: 1234567890
}
```

### System Events

Module-specific events:

```javascript
// Connection events
events.on('connected', () => {
  console.log('Connected to event stream');
});

events.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
});

// Subscription events
events.on('subscribed', (subscription) => {
  console.log('New subscription:', subscription.id);
});

// Error events
events.on('error', (error) => {
  console.error('Event error:', error);
});
```

## Performance Optimization

### Batch Processing

Process events in batches:

```javascript
// Batch subscription
const batchSub = await events.subscribeBatch({
  contract: '0xtoken...',
  batchSize: 100,
  batchTimeout: 5000,  // 5 seconds
  callback: (events) => {
    console.log(`Processing ${events.length} events`);
    // Bulk process events
  }
});
```

### Event Caching

Cache frequently accessed events:

```javascript
// Enable caching
const events = engine.getModule('events', {
  cache: {
    enabled: true,
    ttl: 300,  // 5 minutes
    maxSize: 10000,
    redis: 'redis://localhost:6379'
  }
});

// Cached query
const cachedEvents = await events.query({
  contract: '0xtoken...',
  event: 'Transfer',
  cache: true,
  cacheKey: 'recent-transfers'
});
```

### Compression

Enable compression for large event streams:

```javascript
// WebSocket with compression
const ws = await events.connectWebSocket({
  compression: true,
  compressionLevel: 6
});

// SSE with compression
const sse = await events.connectSSE({
  compression: 'gzip'
});
```

## Monitoring and Analytics

Track event system performance:

```javascript
// Get event statistics
const stats = await events.getStats();
console.log({
  totalEvents: stats.total,
  eventsPerSecond: stats.rate,
  activeSubscriptions: stats.subscriptions,
  queueSize: stats.queue
});

// Monitor specific contract
const contractStats = await events.getContractStats('0xtoken...');
console.log({
  eventTypes: contractStats.types,
  totalEvents: contractStats.total,
  lastEvent: contractStats.lastEventTime
});

// Set up performance alerts
await events.createAlert({
  metric: 'queue_size',
  threshold: 10000,
  action: 'email'
});
```

## Error Handling

Handle event errors gracefully:

```javascript
// Subscription with error handling
const subscription = await events.subscribe({
  contract: '0xtoken...',
  callback: (event) => {
    try {
      processEvent(event);
    } catch (error) {
      console.error('Event processing failed:', error);
    }
  },
  onError: (error) => {
    console.error('Subscription error:', error);
    // Attempt reconnection
    if (error.code === 'CONNECTION_LOST') {
      subscription.reconnect();
    }
  }
});

// Global error handler
events.on('error', (error) => {
  switch (error.type) {
    case 'INDEXING_ERROR':
      console.error('Failed to index event:', error);
      break;
    case 'DELIVERY_ERROR':
      console.error('Failed to deliver event:', error);
      // Retry delivery
      events.retryDelivery(error.eventId);
      break;
  }
});
```

## CLI Commands

```bash
# Monitor events in real-time
foc-engine events monitor --contract 0xtoken...

# Query historical events
foc-engine events query \
  --contract 0xtoken... \
  --event Transfer \
  --from-block 1000 \
  --to-block 2000

# Export events
foc-engine events export \
  --contract 0xtoken... \
  --format csv \
  --output events.csv

# Replay events
foc-engine events replay \
  --from-block 1000 \
  --to-block 2000 \
  --speed 2

# Event statistics
foc-engine events stats --contract 0xtoken...
```

## Integration Examples

### React Integration

```jsx
import { useEffect, useState } from 'react';
import { useFocEngine } from '@foc/react';

function TransferMonitor({ tokenAddress }) {
  const [transfers, setTransfers] = useState([]);
  const { events } = useFocEngine();
  
  useEffect(() => {
    const subscription = events.subscribe({
      contract: tokenAddress,
      event: 'Transfer',
      callback: (event) => {
        setTransfers(prev => [...prev, event]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [tokenAddress]);
  
  return (
    <div>
      <h3>Recent Transfers</h3>
      {transfers.map((transfer, i) => (
        <div key={i}>
          {transfer.from} → {transfer.to}: {transfer.amount}
        </div>
      ))}
    </div>
  );
}
```

### Node.js Backend

```javascript
// Event processor service
class EventProcessor {
  constructor(engine) {
    this.events = engine.getModule('events');
    this.db = new Database();
  }
  
  async start() {
    // Process Transfer events
    await this.events.subscribe({
      contract: process.env.TOKEN_CONTRACT,
      event: 'Transfer',
      callback: async (event) => {
        await this.processTransfer(event);
      }
    });
    
    // Process in batches for efficiency
    await this.events.subscribeBatch({
      contract: process.env.NFT_CONTRACT,
      batchSize: 50,
      callback: async (events) => {
        await this.db.insertBatch('nft_transfers', events);
      }
    });
  }
  
  async processTransfer(event) {
    // Update balances
    await this.db.updateBalance(event.from, -event.amount);
    await this.db.updateBalance(event.to, event.amount);
    
    // Check for notable transfers
    if (BigInt(event.amount) > 10n**21n) {  // > 1000 tokens
      await this.notifyWhaleAlert(event);
    }
  }
}
```

## Best Practices

### 1. Efficient Subscriptions

```javascript
// Good: Specific subscriptions
await events.subscribe({
  contract: '0xtoken...',
  event: 'Transfer',
  filters: { to: userAddress }
});

// Avoid: Overly broad subscriptions
await events.subscribe({
  contract: '*',  // All contracts
  event: '*'      // All events
});
```

### 2. Resource Management

```javascript
// Always clean up subscriptions
const subscriptions = new Set();

function subscribe(options) {
  const sub = events.subscribe(options);
  subscriptions.add(sub);
  return sub;
}

function cleanup() {
  subscriptions.forEach(sub => sub.unsubscribe());
  subscriptions.clear();
}

process.on('SIGINT', cleanup);
```

### 3. Error Recovery

```javascript
// Implement reconnection logic
class ResilientEventSubscriber {
  async connect() {
    try {
      this.subscription = await events.subscribe(this.options);
    } catch (error) {
      console.error('Failed to subscribe:', error);
      // Retry with exponential backoff
      setTimeout(() => this.connect(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 2, 60000);
    }
  }
}
```

## Next Steps

- Review [Getting Started](../getting-started/intro) for basics
- Explore [Registry Module](./registry) for contract management
- Learn about [Paymaster Module](./paymaster) for gas sponsorship