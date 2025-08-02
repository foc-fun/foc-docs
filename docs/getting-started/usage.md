---
sidebar_position: 4
---

# Usage

Learn how to use foc.fun to build and deploy your Starknet applications. This guide covers common workflows and best practices.

## Basic Commands

### Starting foc-engine

```bash
# Start with default configuration ( uses config at ./foc.config.yml )
foc-engine run

# Start with custom config
foc-engine run --config ./my-config.yml

# Start in sepolia mode ( Note: you will need to setup .env file w/ sepolia account)
foc-engine run --network sepolia

# Start with specific presets
foc-engine run --preset paymaster

# Check out other potential cmdline arguments
foc-engine run --help
```

### Managing Your Application

```bash
# Cleanup after done ( Erases all state & data )
foc-engine clean

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
  --args '{"name":"MyToken","symbol":"MTK","decimals":18}'

# Deploy contract(s) from a custom deployments configuration
foc-engine deploy batch ./contracts/deployments.yml
```

### Interacting with Contracts

Using the CLI:

```bash
# Call a view function
foc-engine call 0x123... balanceOf --args '{"account":"0x456..."}'

# Send a transaction
foc-engine invoke 0x123... transfer \
  --args '{"to":"0x789...","amount":1000}' \
  --account 0xabc...
```

Using the JavaScript SDK:

#### 1. Get or Deploy Contracts

First, connect to foc-engine and obtain contract instances either by deploying new contracts or retrieving existing ones from the registry:

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  url: 'http://localhost:8080'
});

await engine.connect();

// Option A: Deploy a new contract
const newContract = await engine.deploy({
  contract: 'MyToken',
  constructorArgs: {
    name: 'MyToken',
    symbol: 'MTK',
    decimals: 18
  }
});

// Option B: Get existing contract from registry
const registry = engine.getModule('registry');
const existingContract = await registry.getContract('MyToken', 'latest');
```

#### 2. Interact with Contracts

Once you have a contract instance, you can call view functions and send transactions. foc-engine automatically integrates with the paymaster module for gasless transactions when enabled:

```javascript
// Call a view function (read-only, no gas required)
const balance = await contract.call('balanceOf', {
  account: '0x456...'
});

// Send a transaction (automatically uses paymaster if configured)
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

// List contracts
const contracts = await registry.list();
const runeTokenContracts = await registry.list({ tags: ["ERC20","Runes"], pagination: { page: 1, pageLength: 10 }});
```

> 📖 For complete API reference and advanced features, see the [JavaScript SDK documentation](../sdks/js-ts).

### Accounts Module

Manage Starknet accounts easily:

```javascript
const accounts = engine.getModule('accounts');

// Create a new account ( using paymaster for deployment )
const account = await accounts.create("UniqueUser123", "my-app-contract");
console.log('Account address:', account.address);

// Login to an existing account
const account = await accounts.connect("UniqueUser123", "my-app-contract");
console.log('Account address:', account.address);

// Fund account (Only in devnet)
await accounts.fund(account.address, '1000000000000000000'); // 1 ETH

// Attach account to the engine instance to use this account for all invoke/transaction calls
engine.login(account);
```

> 📖 For complete API reference and advanced features, see the [JavaScript SDK documentation](../sdks/js-ts).

### Events Module

Subscribe to onchain events:

```javascript
const events = engine.getModule('events');

// Subscribe to specific events
const subscription = await events.subscribe({
  contract: 'MyToken',
  event: 'Transfer',
  filters: {
    "from": account.address
  },
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

> 📖 For complete API reference and advanced features, see the [JavaScript SDK documentation](../sdks/js-ts).

## Building a Simple DApp

Here's a complete example of building a token transfer script:

```javascript
import { FocEngine } from 'foc-engine';

async function main() {
  // Initialize engine
  const engine = new FocEngine({
    url: 'http://localhost:8080',
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
  const alice = await accounts.create("Alice", "MyToken");
  const bob = await accounts.create("Bob", "MyToken");
  
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

> 💡 **Quick Start Tip**: For production applications, we recommend using our [App Templates](../app-templates/teaser) which provide complete DApp scaffolding with frontend, backend, and smart contract integrations. Templates let you launch full-featured applications in minutes rather than building everything from scratch!

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
