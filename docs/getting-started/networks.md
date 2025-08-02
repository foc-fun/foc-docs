---
sidebar_position: 5
---

# Network Configuration

FOC Engine supports multiple Starknet networks with network-specific configurations for optimal performance and compatibility. This guide covers network setup, account class hashes, and paymaster endpoints.

## Supported Networks

### Mainnet
Production Starknet network for live applications:

```javascript
const engine = new FocEngine({
  network: 'mainnet',
  rpc: 'https://starknet-mainnet.public.blastapi.io'
});
```

**Network Details:**
- Chain ID: `SN_MAIN`
- Account Class Hash: `0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f`
- Engine Endpoint: `https://api.foc.fun`

### Sepolia Testnet
Testing network for development and staging:

```javascript
const engine = new FocEngine({
  network: 'sepolia',
  rpc: 'https://starknet-sepolia.public.blastapi.io'
});
```

**Network Details:**
- Chain ID: `SN_SEPOLIA`
- Account Class Hash: `0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f`
- Engine Endpoint: `https://api.foc.fun`

### Local Devnet
Local development environment:

```javascript
const engine = new FocEngine({
  network: 'devnet',
  rpc: 'http://localhost:5050'
});
```

**Network Details:**
- Chain ID: `SN_DEVNET`
- Account Class Hash: `0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918`
- Engine Endpoint: `http://localhost:8080` (if running locally)

## Account Class Hashes

Different networks use different account implementations and class hashes:

| Network | Class Hash | Implementation | Notes |
|---------|------------|----------------|-------|
| **Mainnet** | `0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f` | OpenZeppelin | Production-ready, SNIP-9 compatible |
| **Sepolia** | `0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f` | OpenZeppelin | Same as mainnet for testing |
| **Devnet** | `0x025ec026985a3bf9d0cc1fe17326b245dfdc3ff89b8fde106542a3ea56c5a918` | Argent-X | Local development account |

FOC Engine automatically selects the correct class hash based on network:

```javascript
// Auto-selects appropriate class hash for network
const account = await accounts.create({
  network: 'sepolia',
  implementation: 'openzeppelin'
  // class_hash automatically set based on network
});
```

### Custom Class Hashes

Use custom account implementations:

```javascript
const account = await accounts.create({
  network: 'sepolia',
  classHash: '0x...your-custom-class-hash',
  constructorCalldata: [
    // Custom constructor arguments
    '0x...',
    '42'
  ]
});
```

> ⚠️ **Important**: Custom account implementations must support [SNIP-9 (Outside Execution)](https://community.starknet.io/t/snip-outside-execution/101058) for paymaster functionality to work properly. The paymaster requires the ability to execute transactions on behalf of users through the `execute_from_outside` entrypoint.

## Network Selection

### Automatic Detection

FOC Engine can detect network from RPC endpoint:

```javascript
// Auto-detects network from RPC
const engine = new FocEngine({
  rpc: 'https://starknet-sepolia.public.blastapi.io'
  // network: 'sepolia' - automatically inferred
});
```

### Environment-Based Configuration

```javascript
// Use environment variables
const engine = new FocEngine({
  network: process.env.STARKNET_NETWORK || 'sepolia',
  rpc: process.env.STARKNET_RPC || 'https://starknet-sepolia.public.blastapi.io'
});
```

### Dynamic Network Switching

```javascript
// Switch networks at runtime
await engine.switchNetwork({
  network: 'mainnet',
  rpc: 'https://starknet-mainnet.public.blastapi.io'
});

// All subsequent operations use new network
const account = await accounts.create(); // Uses mainnet config
```

## Paymaster Configuration

### Network-Specific Paymasters

```javascript
// Configure paymaster per network
const paymasterEndpoints = {
  mainnet: 'https://api.foc.fun/paymaster/mainnet',
  sepolia: 'https://api.foc.fun/paymaster/sepolia',
  devnet: 'http://localhost:3000/paymaster'
};

// FOC Engine automatically selects correct endpoint
const account = await accounts.deployWithPaymaster({
  username: 'alice',
  network: 'sepolia'
  // paymaster endpoint auto-selected
});
```

### Custom Paymaster Endpoints

```javascript
// Use custom paymaster
const account = await accounts.deployWithPaymaster({
  username: 'alice',
  network: 'mainnet',
  paymasterEndpoint: 'https://your-custom-paymaster.com/api'
});
```

### Fallback Configuration

```javascript
// Configure multiple paymaster options
const engine = new FocEngine({
  network: 'sepolia',
  paymaster: {
    primary: 'https://api.foc.fun/paymaster/sepolia',
    fallback: 'https://avnu-paymaster.example.com',
    retries: 3,
    timeout: 10000
  }
});
```

## Migration Between Networks

### Account Migration

```javascript
// Export account from one network
const accountData = await accounts.export('0x123...', {
  network: 'sepolia',
  includeMetadata: true
});

// Deploy same account on different network
const migratedAccount = await accounts.deployWithPaymaster({
  username: accountData.username,
  metadata: accountData.metadata,
  network: 'mainnet',
  privateKey: accountData.privateKey // Same keys, different address
});
```

### Configuration Migration

```javascript
// Migration helper
const migrateNetwork = async (fromNetwork, toNetwork) => {
  const accounts = await engine.accounts.list({ network: fromNetwork });
  
  const migrations = await Promise.all(
    accounts.map(account => 
      accounts.deployWithPaymaster({
        username: account.username,
        metadata: account.metadata,
        network: toNetwork,
        privateKey: account.privateKey
      })
    )
  );
  
  return migrations;
};
```

## Network-Specific Features

### Mainnet Considerations

```javascript
// Mainnet requires real ETH for gas
const account = await accounts.create({
  network: 'mainnet',
  initialFunding: '0.01' // ETH amount needed
});

// Use paymaster for gasless transactions
const tx = await accounts.invokeWithPaymaster({
  network: 'mainnet',
  contractAddress: '0x...',
  entrypoint: 'transfer',
  calldata: ['0x...', '1000']
});
```

### Sepolia Features

```javascript
// Sepolia has faucet funding available
const account = await accounts.create({
  network: 'sepolia',
  deploy: true
});

// Fund from faucet (testnet only)
await accounts.fundFromFaucet('0x123...', {
  network: 'sepolia',
  amount: '1.0' // Test ETH
});
```

### Devnet Optimizations

```javascript
// Devnet allows faster block times
const engine = new FocEngine({
  network: 'devnet',
  rpc: 'http://localhost:5050',
  options: {
    blockTime: 1000, // 1 second blocks
    autoMining: true
  }
});
```

## Best Practices

### Network Validation

```javascript
const validateNetwork = (network) => {
  const supportedNetworks = ['mainnet', 'sepolia', 'devnet'];
  if (!supportedNetworks.includes(network)) {
    throw new Error(`Unsupported network: ${network}`);
  }
};

// Use before initialization
validateNetwork(process.env.STARKNET_NETWORK);
```

### Environment Configuration

```javascript
// Recommended configuration structure
const config = {
  development: {
    network: 'devnet',
    rpc: 'http://localhost:5050',
    paymaster: 'http://localhost:3000/paymaster'
  },
  staging: {
    network: 'sepolia',
    rpc: 'https://starknet-sepolia.public.blastapi.io',
    paymaster: 'https://api.foc.fun/paymaster/sepolia'
  },
  production: {
    network: 'mainnet',
    rpc: 'https://starknet-mainnet.public.blastapi.io',
    paymaster: 'https://api.foc.fun/paymaster/mainnet'
  }
};

const engine = new FocEngine(config[process.env.NODE_ENV]);
```

### Error Handling

```javascript
try {
  const account = await accounts.deployWithPaymaster({
    username: 'alice',
    network: 'mainnet'
  });
} catch (error) {
  if (error.code === 'NETWORK_UNAVAILABLE') {
    // Fallback to different RPC
    await engine.switchNetwork({
      network: 'mainnet',
      rpc: 'https://backup-rpc.example.com'
    });
  } else if (error.code === 'UNSUPPORTED_NETWORK') {
    console.error('Network not supported:', error.network);
  }
}
```

## Troubleshooting

### Common Issues

**Wrong Class Hash for Network:**
```javascript
// Error: Account deployment failed
// Solution: Ensure correct class hash for network
const account = await accounts.create({
  network: 'sepolia',
  // Don't specify classHash - let FOC Engine auto-select
});
```

**RPC Endpoint Mismatch:**
```javascript
// Error: Network mismatch
// Solution: Align RPC endpoint with network
const engine = new FocEngine({
  network: 'sepolia',
  rpc: 'https://starknet-sepolia.public.blastapi.io' // Must match network
});
```

**Paymaster Unavailable:**
```javascript
// Configure fallback paymaster
const account = await accounts.deployWithPaymaster({
  username: 'alice',
  network: 'sepolia',
  fallbackToRegularDeploy: true // Falls back if paymaster fails
});
```

## Related Documentation

- [Accounts Module](../modules/accounts) - Account management and deployment
- [Paymaster Module](../modules/paymaster) - Gasless transaction configuration
- [Setup Guide](./setup) - Initial FOC Engine configuration
