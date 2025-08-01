---
sidebar_position: 1
---

# Registry Module

The Registry module is a core component of foc.fun that manages contract deployments, tracks contract metadata, and provides a centralized interface for contract discovery and interaction.

## Overview

The Registry acts as a single source of truth for all deployed contracts in your foc.fun application. It maintains:

- Contract addresses and deployment information
- Contract ABIs and interfaces
- Contract metadata and tags
- Deployment history and versioning

## Configuration

Add the Registry module to your `foc.config.yml`:

```yaml
modules:
  registry:
    enabled: true
    auto_register: true              # Automatically register deployed contracts
    contracts_path: ./contracts      # Path to contract artifacts
    storage:
      type: local                    # Storage backend: local, redis, or postgres
      path: ./data/registry          # For local storage
    indexing:
      enabled: true                  # Enable contract event indexing
      start_block: 0                 # Block to start indexing from
```

## API Reference

### JavaScript/TypeScript SDK

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine();
const registry = engine.getModule('registry');
```

### Core Methods

#### register(contract)

Register a new contract in the registry:

```javascript
const registration = await registry.register({
  name: 'MyToken',
  address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  abi: tokenAbi,
  tags: ['token', 'erc20'],
  metadata: {
    version: '1.0.0',
    description: 'My custom token contract'
  }
});
```

#### getContract(identifier)

Retrieve a contract by name or address:

```javascript
// By name
const token = await registry.getContract('MyToken');

// By address
const contract = await registry.getContract('0x049d36...');

// Returns
{
  name: 'MyToken',
  address: '0x049d36...',
  abi: [...],
  deploymentBlock: 12345,
  deployer: '0x123...',
  tags: ['token', 'erc20'],
  metadata: { ... }
}
```

#### list(options)

List all registered contracts:

```javascript
// List all contracts
const allContracts = await registry.list();

// Filter by tags
const tokens = await registry.list({
  tags: ['token']
});

// Pagination
const page1 = await registry.list({
  limit: 10,
  offset: 0
});

// Sort by deployment date
const recent = await registry.list({
  sortBy: 'deploymentDate',
  order: 'desc'
});
```

#### update(address, updates)

Update contract metadata:

```javascript
await registry.update('0x049d36...', {
  tags: ['token', 'erc20', 'governance'],
  metadata: {
    version: '1.1.0',
    upgraded: true
  }
});
```

#### remove(address)

Remove a contract from the registry:

```javascript
await registry.remove('0x049d36...');
```

#### getDeploymentHistory(name)

Get deployment history for a contract:

```javascript
const history = await registry.getDeploymentHistory('MyToken');
// Returns array of all deployments with this name
[
  {
    address: '0x049d36...',
    deploymentBlock: 12345,
    deployer: '0x123...',
    timestamp: 1634567890,
    version: '1.0.0'
  },
  // ...
]
```

## Advanced Features

### Contract Verification

Verify contract source code:

```javascript
await registry.verify({
  address: '0x049d36...',
  source: contractSourceCode,
  compiler: {
    version: '0.10.0',
    optimization: true
  }
});
```

### Contract Proxies

Register upgradeable proxy contracts:

```javascript
await registry.registerProxy({
  name: 'MyUpgradeableToken',
  proxy: '0x123...',
  implementation: '0x456...',
  admin: '0x789...',
  type: 'transparent' // or 'uups'
});

// Get current implementation
const impl = await registry.getImplementation('0x123...');
```

### Contract Dependencies

Track contract dependencies:

```javascript
await registry.addDependency({
  contract: '0x123...',
  dependsOn: ['0x456...', '0x789...'],
  type: 'required' // or 'optional'
});

// Get dependency graph
const deps = await registry.getDependencies('0x123...');
```

### Batch Operations

Perform batch operations for efficiency:

```javascript
// Batch register
await registry.batchRegister([
  { name: 'Token1', address: '0x123...', abi: abi1 },
  { name: 'Token2', address: '0x456...', abi: abi2 }
]);

// Batch query
const contracts = await registry.batchGet([
  '0x123...',
  '0x456...',
  'MyToken' // Can mix addresses and names
]);
```

## Events

The Registry module emits events for contract lifecycle:

```javascript
// Contract registered
registry.on('contractRegistered', (event) => {
  console.log('New contract:', event.name, event.address);
});

// Contract updated
registry.on('contractUpdated', (event) => {
  console.log('Updated:', event.address, event.changes);
});

// Contract removed
registry.on('contractRemoved', (event) => {
  console.log('Removed:', event.address);
});

// Contract verified
registry.on('contractVerified', (event) => {
  console.log('Verified:', event.address);
});
```

## CLI Commands

The Registry module provides CLI commands:

```bash
# List all contracts
foc-engine registry list

# Get contract details
foc-engine registry get MyToken

# Register a contract
foc-engine registry add \
  --name MyToken \
  --address 0x049d36... \
  --abi ./abis/MyToken.json

# Update contract tags
foc-engine registry tag 0x049d36... token erc20 defi

# Remove a contract
foc-engine registry remove 0x049d36...

# Export registry
foc-engine registry export --format json > registry.json

# Import registry
foc-engine registry import registry.json
```

## Storage Backends

### Local Storage (Default)

```yaml
storage:
  type: local
  path: ./data/registry
```

### Redis

```yaml
storage:
  type: redis
  url: redis://localhost:6379
  prefix: foc:registry:
```

### PostgreSQL

```yaml
storage:
  type: postgres
  url: postgresql://user:pass@localhost:5432/focdb
  schema: registry
```

## Best Practices

### 1. Consistent Naming

Use a consistent naming convention:

```javascript
// Good
await registry.register({
  name: 'FOC_Token_V1',
  // ...
});

// Avoid
await registry.register({
  name: 'token-v1', // Inconsistent with above
  // ...
});
```

### 2. Comprehensive Metadata

Include detailed metadata:

```javascript
await registry.register({
  name: 'MyToken',
  address: '0x049d36...',
  abi: tokenAbi,
  metadata: {
    version: '1.0.0',
    description: 'FOC platform governance token',
    documentation: 'https://docs.foc.fun/token',
    github: 'https://github.com/foc/token',
    audit: 'https://audit.foc.fun/token-v1',
    contact: 'security@foc.fun'
  }
});
```

### 3. Tag Organization

Use hierarchical tags:

```javascript
tags: [
  'token',
  'token:erc20',
  'token:erc20:mintable',
  'governance',
  'audited:certik'
]
```

### 4. Version Management

Track contract versions:

```javascript
// Register new version
await registry.register({
  name: 'MyToken',
  address: '0xnew...',
  metadata: {
    version: '2.0.0',
    previousVersion: '0xold...',
    changelog: 'Added pause functionality'
  }
});
```

## Troubleshooting

### Contract Not Found

```javascript
try {
  const contract = await registry.getContract('MyToken');
} catch (error) {
  if (error.code === 'CONTRACT_NOT_FOUND') {
    // Handle missing contract
    console.log('Contract not registered');
  }
}
```

### Duplicate Registration

```javascript
try {
  await registry.register({ name: 'MyToken', ... });
} catch (error) {
  if (error.code === 'DUPLICATE_CONTRACT') {
    // Contract already exists
    await registry.update(address, { ... });
  }
}
```

### Storage Issues

If experiencing storage problems:

1. Check storage backend connectivity
2. Verify permissions on local storage path
3. Check available disk space
4. Review storage backend logs

## Security Considerations

1. **Access Control**: Implement proper access control for registry modifications
2. **Verification**: Always verify contract source code when possible
3. **Immutability**: Consider making certain registry entries immutable
4. **Audit Trail**: Maintain audit logs of all registry changes

## Next Steps

- Explore [Accounts Module](./accounts) for account management
- Learn about [Paymaster Module](./paymaster) for gasless transactions
- Understand [Events Module](./events) for real-time updates