---
sidebar_position: 1
---

# JavaScript/TypeScript SDK

The foc-engine JavaScript/TypeScript SDK provides a comprehensive client library for interacting with foc.fun applications from JavaScript and TypeScript environments.

## Installation

Install the SDK using your preferred package manager:

```bash
# npm
npm install foc-engine

# yarn
yarn add foc-engine

# pnpm
pnpm add foc-engine
```

## Quick Start

```javascript
import { FocEngine } from 'foc-engine';

// Initialize the engine
const engine = new FocEngine({
  url: 'http://localhost:8080',
  modules: ['registry', 'accounts', 'events', 'paymaster']
});

// Connect to the engine
await engine.connect();

// Start using modules
const registry = engine.getModule('registry');
const accounts = engine.getModule('accounts');
```

## Configuration

### Basic Configuration

```javascript
const engine = new FocEngine({
  url: 'http://localhost:8080',     // Engine URL
  wsUrl: 'ws://localhost:8081',      // WebSocket URL for events
  timeout: 30000,                    // Request timeout (ms)
  retries: 3,                        // Retry failed requests
  modules: ['registry', 'accounts']  // Modules to load
});
```

### Advanced Configuration

```javascript
const engine = new FocEngine({
  url: 'http://localhost:8080',
  wsUrl: 'ws://localhost:8081',
  
  // Request configuration
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  
  // Module configuration
  modules: {
    registry: {
      cache: true,
      cacheTimeout: 300000  // 5 minutes
    },
    accounts: {
      autoConnect: true,
      defaultImplementation: 'openzeppelin'
    },
    events: {
      reconnect: true,
      reconnectDelay: 5000,
      maxReconnectAttempts: 10
    },
    paymaster: {
      enabled: true
    }
  },
  
  // Network configuration
  network: 'devnet',  // 'devnet', 'testnet', 'mainnet'
  
  // Logging
  debug: true,
  logger: console
});
```

## Core API

### Engine Methods

#### connect()

Connect to the foc-engine:

```javascript
await engine.connect();

// With connection options
await engine.connect({
  timeout: 10000,
  retries: 5
});
```

#### disconnect()

Disconnect from the engine:

```javascript
await engine.disconnect();
```

#### getModule(name)

Get a module instance:

```javascript
const registry = engine.getModule('registry');
const accounts = engine.getModule('accounts');
const events = engine.getModule('events');
const paymaster = engine.getModule('paymaster');
```

#### isConnected()

Check connection status:

```javascript
if (engine.isConnected()) {
  console.log('Engine is connected');
}
```

#### getStatus()

Get engine status:

```javascript
const status = await engine.getStatus();
console.log(status);
// {
//   connected: true,
//   version: '1.0.0',
//   modules: ['registry', 'accounts', 'events', 'paymaster'],
//   network: 'devnet',
//   blockNumber: 12345
// }
```

## Contract Interaction

### Deploying Contracts

```javascript
// Deploy a contract
const contract = await engine.deploy({
  contract: 'MyToken',  // Contract name or path
  constructorArgs: {
    name: 'My Token',
    symbol: 'MTK',
    decimals: 18,
    totalSupply: '1000000000000000000000'
  }
});

console.log('Deployed at:', contract.address);
```

### Contract Class

Work with deployed contracts:

```javascript
// Get contract instance
const token = await engine.getContract('0x123...');

// Or from registry
const registry = engine.getModule('registry');
const token = await registry.getContract('MyToken');

// Call read function
const balance = await token.call('balanceOf', {
  account: '0x456...'
});

// Send transaction
const tx = await token.invoke('transfer', {
  to: '0x789...',
  amount: '1000000000000000000'
});

// Wait for confirmation
await tx.wait();
console.log('Transaction confirmed:', tx.hash);
```

### Transaction Options

```javascript
// With custom options
const tx = await token.invoke('transfer', {
  to: '0x789...',
  amount: '1000'
}, {
  account: '0xmyaccount...',     // Specific account to use
  maxFee: '1000000000000000',    // Max fee in wei
  nonce: 5,                       // Custom nonce
  paymaster: true,                // Use paymaster
  waitForAccept: true             // Wait for L2 acceptance
});
```

### Multicall

Execute multiple calls in one transaction:

```javascript
// Prepare calls
const calls = [
  token.populateTransaction('approve', {
    spender: '0xdex...',
    amount: '1000000'
  }),
  dex.populateTransaction('swap', {
    tokenIn: token.address,
    tokenOut: '0xother...',
    amountIn: '1000000'
  })
];

// Execute multicall
const tx = await engine.multicall(calls);
await tx.wait();
```

## Type Safety with TypeScript

### Basic Types

```typescript
import { FocEngine, Contract, Transaction } from 'foc-engine';

const engine: FocEngine = new FocEngine({
  url: 'http://localhost:8080'
});

const contract: Contract = await engine.getContract('0x123...');
const tx: Transaction = await contract.invoke('transfer', {
  to: '0x456...',
  amount: '1000'
});
```

### Generated Types

Generate TypeScript types from your contracts:

```bash
# Generate types
foc-engine generate-types --output ./types
```

Use generated types:

```typescript
import { MyToken } from './types/MyToken';

const token = await engine.getContract<MyToken>('0x123...');

// Type-safe calls
const balance = await token.balanceOf({ account: '0x456...' });
const tx = await token.transfer({
  to: '0x789...',
  amount: BigInt('1000000000000000000')
});
```

### Module Types

```typescript
import {
  Registry,
  Accounts,
  Events,
  Paymaster
} from 'foc-engine';

const registry: Registry = engine.getModule('registry');
const accounts: Accounts = engine.getModule('accounts');
const events: Events = engine.getModule('events');
const paymaster: Paymaster = engine.getModule('paymaster');
```

## Event Handling

### Basic Event Subscription

```javascript
const events = engine.getModule('events');

// Subscribe to events
const subscription = await events.subscribe({
  contract: '0xtoken...',
  event: 'Transfer',
  callback: (event) => {
    console.log(`Transfer: ${event.from} -> ${event.to}`);
  }
});

// Unsubscribe later
subscription.unsubscribe();
```

### Event Emitter Pattern

```javascript
// Get event emitter
const emitter = await token.events();

// Listen to specific event
emitter.on('Transfer', (from, to, amount) => {
  console.log(`Transfer: ${from} -> ${to}: ${amount}`);
});

// Listen to all events
emitter.on('*', (eventName, ...args) => {
  console.log(`Event ${eventName}:`, args);
});

// Remove listeners
emitter.off('Transfer', handler);
emitter.removeAllListeners();
```

## Error Handling

### Error Types

```javascript
import {
  FocEngineError,
  ConnectionError,
  ContractError,
  TransactionError,
  ModuleError
} from 'foc-engine';

try {
  await engine.connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Failed to connect:', error.message);
  } else if (error instanceof ModuleError) {
    console.error('Module error:', error.module, error.message);
  }
}
```

### Transaction Errors

```javascript
try {
  const tx = await token.invoke('transfer', {
    to: '0x789...',
    amount: '1000000'
  });
  await tx.wait();
} catch (error) {
  if (error instanceof TransactionError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        console.error('Not enough tokens');
        break;
      case 'REVERTED':
        console.error('Transaction reverted:', error.reason);
        break;
      case 'TIMEOUT':
        console.error('Transaction timed out');
        break;
    }
  }
}
```

## Utilities

### Address Utilities

```javascript
import { utils } from 'foc-engine';

// Validate address
if (utils.isValidAddress('0x123...')) {
  console.log('Valid address');
}

// Format address
const formatted = utils.formatAddress('0x123...');

// Get address from public key
const address = utils.getAddressFromPublicKey('0xpubkey...');
```

### Number Utilities

```javascript
// Convert between units
const wei = utils.parseEther('1.5');  // 1.5 ETH to wei
const eth = utils.formatEther('1500000000000000000');  // wei to ETH

// BigInt utilities
const sum = utils.addBigInt('1000', '2000');
const product = utils.multiplyBigInt('1000', '2');
```

### Encoding Utilities

```javascript
// Encode function call
const calldata = utils.encodeCall('transfer', {
  to: '0x789...',
  amount: '1000'
});

// Decode event
const decoded = utils.decodeEvent('Transfer', eventData);
```

## React Integration

### Provider Component

```jsx
import { FocEngineProvider } from 'foc-engine/react';

function App() {
  return (
    <FocEngineProvider
      config={{
        url: 'http://localhost:8080',
        modules: ['registry', 'accounts', 'events']
      }}
    >
      <YourApp />
    </FocEngineProvider>
  );
}
```

### Hooks

```jsx
import {
  useFocEngine,
  useContract,
  useAccount,
  useEvents
} from 'foc-engine/react';

function TokenBalance({ tokenAddress, accountAddress }) {
  const engine = useFocEngine();
  const token = useContract(tokenAddress);
  const [balance, setBalance] = useState('0');
  
  useEffect(() => {
    if (token) {
      token.call('balanceOf', { account: accountAddress })
        .then(setBalance);
    }
  }, [token, accountAddress]);
  
  return <div>Balance: {balance}</div>;
}
```

## Testing

### Mock Engine

```javascript
import { MockEngine } from 'foc-engine/testing';

describe('MyComponent', () => {
  let mockEngine;
  
  beforeEach(() => {
    mockEngine = new MockEngine();
    mockEngine.mockContract('0xtoken...', {
      balanceOf: async ({ account }) => '1000000',
      transfer: async ({ to, amount }) => ({
        hash: '0xmocktx...',
        wait: async () => ({ status: 'success' })
      })
    });
  });
  
  test('should transfer tokens', async () => {
    const token = await mockEngine.getContract('0xtoken...');
    const tx = await token.invoke('transfer', {
      to: '0x789...',
      amount: '1000'
    });
    expect(tx.hash).toBe('0xmocktx...');
  });
});
```

### Test Utilities

```javascript
import { testUtils } from 'foc-engine/testing';

// Create test accounts
const accounts = await testUtils.createTestAccounts(5);

// Fund accounts
await testUtils.fundAccounts(accounts, '1000000000000000000');

// Deploy test token
const token = await testUtils.deployTestToken({
  name: 'Test Token',
  symbol: 'TEST',
  supply: '1000000'
});
```

## Performance

### Connection Pooling

```javascript
const engine = new FocEngine({
  url: 'http://localhost:8080',
  pool: {
    min: 2,
    max: 10,
    idleTimeout: 30000
  }
});
```

### Caching

```javascript
// Enable caching
const engine = new FocEngine({
  cache: {
    enabled: true,
    ttl: 300000,  // 5 minutes
    max: 1000     // Max cached items
  }
});

// Cache specific calls
const balance = await token.call('balanceOf', {
  account: '0x456...'
}, {
  cache: true,
  cacheKey: `balance-${account}`,
  cacheTTL: 60000  // 1 minute
});
```

### Batch Requests

```javascript
// Batch multiple calls
const results = await engine.batch([
  token.populateCall('balanceOf', { account: '0x123...' }),
  token.populateCall('balanceOf', { account: '0x456...' }),
  token.populateCall('totalSupply')
]);

console.log(results);  // [balance1, balance2, totalSupply]
```

## Migration Guide

### From Web3.js

```javascript
// Web3.js
const balance = await token.methods.balanceOf(account).call();
await token.methods.transfer(to, amount).send({ from: account });

// foc-engine
const balance = await token.call('balanceOf', { account });
await token.invoke('transfer', { to, amount }, { account });
```

### From Ethers.js

```javascript
// Ethers.js
const balance = await token.balanceOf(account);
const tx = await token.transfer(to, amount);
await tx.wait();

// foc-engine
const balance = await token.call('balanceOf', { account });
const tx = await token.invoke('transfer', { to, amount });
await tx.wait();
```

## Best Practices

### 1. Resource Management

Always clean up resources:

```javascript
const engine = new FocEngine({ /* config */ });

try {
  await engine.connect();
  // Use engine
} finally {
  await engine.disconnect();
}
```

### 2. Error Handling

Implement comprehensive error handling:

```javascript
async function safeTransfer(token, to, amount) {
  try {
    const tx = await token.invoke('transfer', { to, amount });
    return await tx.wait();
  } catch (error) {
    if (error.code === 'INSUFFICIENT_BALANCE') {
      throw new Error('Not enough tokens');
    }
    throw error;
  }
}
```

### 3. Type Safety

Use TypeScript for better development experience:

```typescript
interface TokenTransferParams {
  to: string;
  amount: bigint;
}

async function transfer(
  token: Contract,
  params: TokenTransferParams
): Promise<Transaction> {
  return token.invoke('transfer', params);
}
```

## Troubleshooting

### Connection Issues

```javascript
// Enable debug logging
const engine = new FocEngine({
  url: 'http://localhost:8080',
  debug: true
});

// Listen to connection events
engine.on('connected', () => console.log('Connected'));
engine.on('disconnected', () => console.log('Disconnected'));
engine.on('error', (error) => console.error('Error:', error));
```

### Performance Issues

```javascript
// Monitor performance
const metrics = await engine.getMetrics();
console.log({
  requestsPerSecond: metrics.rps,
  averageLatency: metrics.avgLatency,
  activeConnections: metrics.connections
});
```

## Related Code & Resources

### Source Code
- **Main SDK Repository**: [foc-engine.js](https://github.com/foc-fun/foc-engine.js)
- **Core SDK Implementation**: [foc-engine.js/src/core](https://github.com/foc-fun/foc-engine.js/tree/main/src/core)
- **Module Implementations**: [foc-engine.js/src/modules](https://github.com/foc-fun/foc-engine.js/tree/main/src/modules)

### TypeScript Types
- **Type Definitions**: [foc-engine.js/src/types](https://github.com/foc-fun/foc-engine.js/tree/main/src/types)
- **Generated Contract Types**: [foc-engine.js/types](https://github.com/foc-fun/foc-engine.js/tree/main/types)

### React Integration
- **React Hooks**: [foc-engine.js/src/react](https://github.com/foc-fun/foc-engine.js/tree/main/src/react)
- **Provider Components**: [foc-engine.js/src/react/providers](https://github.com/foc-fun/foc-engine.js/tree/main/src/react/providers)

### Examples & Templates
- **SDK Examples**: [foc-engine.js/examples](https://github.com/foc-fun/foc-engine.js/tree/main/examples)
- **Integration Examples**: [foc-fun/examples](https://github.com/foc-fun/foc-fun/tree/main/examples)
- **Sample Applications**: [foc-examples](https://github.com/foc-fun/foc-examples)

### Testing & Development
- **Test Suite**: [foc-engine.js/tests](https://github.com/foc-fun/foc-engine.js/tree/main/tests)
- **Mock Utilities**: [foc-engine.js/src/testing](https://github.com/foc-fun/foc-engine.js/tree/main/src/testing)
- **Development Tools**: [foc-engine.js/tools](https://github.com/foc-fun/foc-engine.js/tree/main/tools)

### Build & Configuration
- **Build Scripts**: [foc-engine.js/scripts](https://github.com/foc-fun/foc-engine.js/tree/main/scripts)
- **Configuration Files**: [foc-engine.js/config](https://github.com/foc-fun/foc-engine.js/tree/main/config)

## Next Steps

- Explore the [Getting Started guide](../getting-started/intro)
- Learn about [Modules](../modules/registry)
- Check out [example applications](https://github.com/foc-fun/foc-examples)