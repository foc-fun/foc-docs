---
sidebar_position: 4
---

# Usage

Learn how to use foc.fun to build and deploy your Starknet applications. This guide covers common workflows and best practices.

## Basic Commands

### Starting foc-engine

```bash
# Start with default configuration
foc-engine run

# Start with custom config
foc-engine run --config ./my-config.yml

# Start in development mode with hot reload
foc-engine run --dev

# Start with specific modules
foc-engine run --modules registry,accounts
```

### Managing Your Application

```bash
# Check status
foc-engine status

# View logs
foc-engine logs

# Stop the engine
foc-engine stop

# Restart the engine
foc-engine restart
```

## Working with Contracts

### Deploying Contracts

```bash
# Deploy a single contract
foc-engine deploy contract ./contracts/MyToken.cairo

# Deploy with constructor arguments
foc-engine deploy contract ./contracts/MyToken.cairo \
  --args "name=MyToken,symbol=MTK,decimals=18"

# Deploy multiple contracts
foc-engine deploy batch ./contracts/deployments.json
```

### Interacting with Contracts

Using the CLI:

```bash
# Call a view function
foc-engine call 0x123... balanceOf --args "account=0x456..."

# Send a transaction
foc-engine invoke 0x123... transfer \
  --args "to=0x789...,amount=1000" \
  --account 0xabc...
```

Using the JavaScript SDK:

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  url: 'http://localhost:8080'
});

// Deploy a contract
const contract = await engine.deploy({
  contract: 'MyToken',
  constructorArgs: {
    name: 'MyToken',
    symbol: 'MTK',
    decimals: 18
  }
});

// Call a function
const balance = await contract.call('balanceOf', {
  account: '0x456...'
});

// Send a transaction
const tx = await contract.invoke('transfer', {
  to: '0x789...',
  amount: 1000
});

await tx.wait();
```

## Module Usage

### Registry Module

The Registry module manages your deployed contracts:

```javascript
// Get deployed contract
const registry = engine.getModule('registry');
const tokenContract = await registry.getContract('MyToken');

// Register a new contract
await registry.register({
  name: 'MyDAO',
  address: '0xdef...',
  abi: daoAbi
});

// List all contracts
const contracts = await registry.list();
```

### Accounts Module

Manage Starknet accounts easily:

```javascript
const accounts = engine.getModule('accounts');

// Create a new account
const account = await accounts.create();
console.log('Account address:', account.address);

// Get account details
const details = await accounts.get(account.address);

// Fund account (in devnet)
await accounts.fund(account.address, '1000000000000000000'); // 1 ETH

// Use account for transactions
const tx = await contract.invoke('transfer', {
  to: '0x789...',
  amount: 1000
}, {
  account: account.address
});
```

### Paymaster Module

Enable gasless transactions:

```javascript
const paymaster = engine.getModule('paymaster');

// Configure paymaster policy
await paymaster.setPolicy({
  type: 'whitelist',
  addresses: ['0x123...', '0x456...']
});

// Send gasless transaction
const tx = await contract.invoke('transfer', {
  to: '0x789...',
  amount: 1000
}, {
  paymaster: true
});
```

### Events Module

Subscribe to blockchain events:

```javascript
const events = engine.getModule('events');

// Subscribe to specific events
const subscription = await events.subscribe({
  contract: '0x123...',
  event: 'Transfer',
  callback: (event) => {
    console.log('Transfer event:', event);
  }
});

// Subscribe to all events from a contract
await events.subscribeToContract('0x123...', (event) => {
  console.log('Contract event:', event);
});

// Unsubscribe
subscription.unsubscribe();
```

## Building a Simple DApp

Here's a complete example of building a token transfer DApp:

```javascript
import { FocEngine } from 'foc-engine';

async function main() {
  // Initialize engine
  const engine = new FocEngine({
    url: 'http://localhost:8080',
    modules: ['accounts', 'registry', 'events']
  });
  
  await engine.connect();
  
  // Get or deploy token contract
  const registry = engine.getModule('registry');
  let token = await registry.getContract('MyToken');
  
  if (!token) {
    token = await engine.deploy({
      contract: 'MyToken',
      constructorArgs: {
        name: 'MyToken',
        symbol: 'MTK',
        decimals: 18,
        totalSupply: '1000000000000000000000' // 1000 tokens
      }
    });
  }
  
  // Create accounts
  const accounts = engine.getModule('accounts');
  const alice = await accounts.create();
  const bob = await accounts.create();
  
  // Fund accounts in devnet
  await accounts.fund(alice.address, '1000000000000000000');
  await accounts.fund(bob.address, '1000000000000000000');
  
  // Subscribe to transfer events
  const events = engine.getModule('events');
  await events.subscribe({
    contract: token.address,
    event: 'Transfer',
    callback: (event) => {
      console.log(`Transfer: ${event.from} -> ${event.to}: ${event.amount}`);
    }
  });
  
  // Transfer tokens
  const tx = await token.invoke('transfer', {
    to: bob.address,
    amount: '100000000000000000000' // 100 tokens
  }, {
    account: alice.address
  });
  
  console.log('Transaction hash:', tx.hash);
  await tx.wait();
  
  // Check balances
  const aliceBalance = await token.call('balanceOf', { account: alice.address });
  const bobBalance = await token.call('balanceOf', { account: bob.address });
  
  console.log('Alice balance:', aliceBalance);
  console.log('Bob balance:', bobBalance);
}

main().catch(console.error);
```

## Best Practices

### 1. Error Handling

Always wrap your operations in try-catch blocks:

```javascript
try {
  const tx = await contract.invoke('transfer', args);
  await tx.wait();
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    console.error('Not enough tokens');
  } else {
    console.error('Transaction failed:', error);
  }
}
```

### 2. Transaction Management

Monitor transaction status:

```javascript
const tx = await contract.invoke('transfer', args);

// Wait with timeout
await tx.wait({ timeout: 60000 }); // 60 seconds

// Or check status manually
const status = await tx.getStatus();
if (status === 'ACCEPTED_ON_L2') {
  console.log('Transaction confirmed!');
}
```

### 3. Gas Optimization

Use multicall for batch operations:

```javascript
const multicall = await engine.multicall([
  token.populateTransaction('approve', { spender: '0x123...', amount: 1000 }),
  token.populateTransaction('transfer', { to: '0x456...', amount: 500 })
]);

await multicall.execute();
```

### 4. Event Handling

Implement proper event cleanup:

```javascript
const subscriptions = [];

// Subscribe to events
subscriptions.push(
  await events.subscribe({ /* ... */ })
);

// Cleanup on shutdown
process.on('SIGINT', () => {
  subscriptions.forEach(sub => sub.unsubscribe());
  process.exit();
});
```

## Debugging

### Enable Debug Logging

```bash
FOC_ENGINE_LOG_LEVEL=debug foc-engine run
```

### Inspect Transaction Details

```javascript
const tx = await contract.invoke('transfer', args, {
  debug: true
});

console.log('Transaction details:', tx.details);
console.log('Estimated fee:', tx.estimatedFee);
```

### Network Monitoring

```bash
# Monitor all network activity
foc-engine monitor

# Monitor specific contract
foc-engine monitor --contract 0x123...

# Export monitoring data
foc-engine monitor --export ./monitoring.json
```

## Next Steps

- Explore the [Modules documentation](../modules/registry) for in-depth module features
- Check out the [SDK reference](../sdks/js-ts) for complete API documentation
- Stay tuned for [Builder](../builder/teaser) and [App Templates](../app-templates/teaser) coming soon!

Happy building with foc.fun! 🚀