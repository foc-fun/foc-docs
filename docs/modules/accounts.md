---
sidebar_position: 2
---

# Accounts Module

The Accounts module provides comprehensive account management for Starknet within the foc.fun ecosystem. It handles account creation, deployment, management, and provides utilities for working with different account implementations.

## Overview

The Accounts module simplifies Starknet account management by providing:

- Account creation and deployment
- Multiple account implementation support (OpenZeppelin, Argent, Braavos)
- Account abstraction features
- Key management and signing
- Multi-signature support
- Session keys for improved UX

## Configuration

Configure the Accounts module in your `foc.config.yml`:

```yaml
modules:
  accounts:
    enabled: true
    default_implementation: "openzeppelin"  # or "argent", "braavos"
    auto_deploy: true                      # Auto-deploy accounts on creation
    storage:
      type: encrypted_local                # Storage backend
      path: ./data/accounts
      encryption_key: ${ACCOUNTS_ENCRYPTION_KEY}
    session_keys:
      enabled: true
      default_duration: 86400              # 24 hours in seconds
    multicall:
      enabled: true
      max_calls: 100
```

## API Reference

### Initialize the Module

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine();
const accounts = engine.getModule('accounts');
```

### Core Methods

#### create(options)

Create a new account:

```javascript
// Create with default settings
const account = await accounts.create();

// Create with specific implementation
const argentAccount = await accounts.create({
  implementation: 'argent',
  deploy: true  // Deploy immediately
});

// Create without deploying
const pendingAccount = await accounts.create({
  deploy: false
});

// Returns
{
  address: '0x123...',
  publicKey: '0x456...',
  implementation: 'openzeppelin',
  deployed: true,
  deploymentTx: '0x789...'
}
```

#### deploy(address)

Deploy a previously created account:

```javascript
const deploymentTx = await accounts.deploy('0x123...');
await deploymentTx.wait();
```

#### get(address)

Get account details:

```javascript
const accountInfo = await accounts.get('0x123...');
// Returns
{
  address: '0x123...',
  publicKey: '0x456...',
  implementation: 'openzeppelin',
  deployed: true,
  nonce: 5,
  balance: {
    eth: '1000000000000000000',  // Wei
    strk: '5000000000000000000'   // STRK tokens
  }
}
```

#### list(options)

List managed accounts:

```javascript
// List all accounts
const allAccounts = await accounts.list();

// Filter by implementation
const argentAccounts = await accounts.list({
  implementation: 'argent'
});

// Only deployed accounts
const deployedAccounts = await accounts.list({
  deployed: true
});
```

#### fund(address, amount)

Fund an account (devnet only):

```javascript
// Fund with ETH
await accounts.fund('0x123...', '1000000000000000000'); // 1 ETH

// Fund with specific token
await accounts.fund('0x123...', '1000', {
  token: 'STRK'
});
```

## Advanced Features

### Multi-Signature Accounts

Create and manage multi-sig accounts:

```javascript
// Create multi-sig account
const multiSig = await accounts.createMultiSig({
  signers: [
    '0xsigner1...',
    '0xsigner2...',
    '0xsigner3...'
  ],
  threshold: 2  // Require 2 of 3 signatures
});

// Propose transaction
const proposal = await accounts.proposeTransaction({
  account: multiSig.address,
  to: '0xtarget...',
  selector: 'transfer',
  calldata: ['0xrecipient...', '1000']
});

// Sign proposal (by different signers)
await accounts.signProposal(proposal.id, { signer: '0xsigner1...' });
await accounts.signProposal(proposal.id, { signer: '0xsigner2...' });

// Execute when threshold reached
const tx = await accounts.executeProposal(proposal.id);
```

### Session Keys

Implement session keys for better UX:

```javascript
// Create session key
const session = await accounts.createSession({
  account: '0x123...',
  permissions: {
    contracts: ['0xtoken...'],      // Allowed contracts
    selectors: ['transfer'],        // Allowed functions
    maxAmount: '1000000000000000',  // Max value per tx
    validUntil: Date.now() + 86400000  // 24 hours
  }
});

// Use session key for transaction
const tx = await contract.invoke('transfer', {
  to: '0x456...',
  amount: '1000'
}, {
  sessionKey: session.key
});

// Revoke session
await accounts.revokeSession(session.id);
```

### Account Abstraction Features

#### Custom Validation

Implement custom validation logic:

```javascript
// Deploy account with custom validator
const customAccount = await accounts.create({
  implementation: 'custom',
  validator: {
    class_hash: '0xvalidator...',
    constructor_args: {
      allowed_callers: ['0x123...', '0x456...'],
      daily_limit: '1000000000000000000'
    }
  }
});
```

#### Paymaster Integration

Use accounts with paymaster:

```javascript
// Configure account for paymaster
await accounts.configurePaymaster({
  account: '0x123...',
  paymaster: '0xpaymaster...',
  policy: {
    type: 'subscription',
    validUntil: Date.now() + 2592000000  // 30 days
  }
});

// Transactions will now use paymaster
const tx = await contract.invoke('transfer', args, {
  account: '0x123...'
  // Fee paid by paymaster automatically
});
```

### Key Management

#### Export/Import Keys

```javascript
// Export account keys (encrypted)
const backup = await accounts.exportKeys('0x123...', {
  password: 'strong-password'
});

// Import keys
const imported = await accounts.importKeys(backup, {
  password: 'strong-password'
});
```

#### Key Rotation

```javascript
// Rotate account keys
const rotation = await accounts.rotateKeys('0x123...');
// Returns new public key and updates account
```

### Account Recovery

Implement social recovery:

```javascript
// Setup recovery
await accounts.setupRecovery({
  account: '0x123...',
  guardians: [
    '0xguardian1...',
    '0xguardian2...',
    '0xguardian3...'
  ],
  threshold: 2
});

// Initiate recovery (by guardian)
const recovery = await accounts.initiateRecovery({
  account: '0x123...',
  newOwner: '0xnewowner...',
  guardian: '0xguardian1...'
});

// Confirm recovery (by another guardian)
await accounts.confirmRecovery({
  recoveryId: recovery.id,
  guardian: '0xguardian2...'
});
```

## Account Implementations

### OpenZeppelin

The default implementation with standard features:

```javascript
const ozAccount = await accounts.create({
  implementation: 'openzeppelin',
  options: {
    proxy: true  // Use proxy for upgradeability
  }
});
```

### Argent

Argent implementation with enhanced security:

```javascript
const argentAccount = await accounts.create({
  implementation: 'argent',
  options: {
    guardian: '0xguardian...',  // Optional guardian
    daily_limit: '1000000000000000000'  // Daily spending limit
  }
});
```

### Braavos

Braavos implementation with hardware wallet support:

```javascript
const braavosAccount = await accounts.create({
  implementation: 'braavos',
  options: {
    hardware_signer: true,
    device: 'ledger'
  }
});
```

## Events

Subscribe to account events:

```javascript
// Account created
accounts.on('accountCreated', (event) => {
  console.log('New account:', event.address);
});

// Account deployed
accounts.on('accountDeployed', (event) => {
  console.log('Deployed:', event.address, event.txHash);
});

// Transaction executed
accounts.on('transactionExecuted', (event) => {
  console.log('Tx from:', event.account, 'Hash:', event.txHash);
});

// Key rotated
accounts.on('keyRotated', (event) => {
  console.log('Keys rotated for:', event.account);
});
```

## CLI Commands

```bash
# Create new account
foc-engine accounts create

# Create with specific implementation
foc-engine accounts create --implementation argent

# List accounts
foc-engine accounts list

# Get account info
foc-engine accounts info 0x123...

# Fund account (devnet)
foc-engine accounts fund 0x123... 1

# Export account
foc-engine accounts export 0x123... --output account-backup.json

# Import account
foc-engine accounts import account-backup.json
```

## Security Best Practices

### 1. Key Storage

Never store private keys in plain text:

```javascript
// Bad
const privateKey = '0x1234...';

// Good - Use encrypted storage
await accounts.create({
  storage: 'encrypted_local'
});
```

### 2. Session Key Permissions

Limit session key permissions:

```javascript
// Restrictive session
const session = await accounts.createSession({
  account: '0x123...',
  permissions: {
    contracts: ['0xspecific...'],  // Only one contract
    selectors: ['view_only'],      // Read-only function
    maxAmount: '0',                // No value transfer
    validUntil: Date.now() + 3600000,  // 1 hour only
    maxUsages: 10                  // Limited uses
  }
});
```

### 3. Multi-Sig Configuration

Use appropriate threshold:

```javascript
// For 5 signers, require majority
const multiSig = await accounts.createMultiSig({
  signers: [...],  // 5 signers
  threshold: 3     // Majority required
});
```

## Error Handling

```javascript
try {
  const account = await accounts.create();
} catch (error) {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE':
      console.error('Not enough ETH for deployment');
      break;
    case 'INVALID_IMPLEMENTATION':
      console.error('Unknown account implementation');
      break;
    case 'DEPLOYMENT_FAILED':
      console.error('Account deployment failed');
      break;
    default:
      console.error('Account creation failed:', error);
  }
}
```

## Performance Optimization

### Batch Operations

```javascript
// Create multiple accounts efficiently
const accountPromises = Array(10).fill(null).map(() => 
  accounts.create({ deploy: false })
);
const newAccounts = await Promise.all(accountPromises);

// Batch deploy
const deployments = await accounts.batchDeploy(
  newAccounts.map(a => a.address)
);
```

### Caching

```javascript
// Enable account caching
const accounts = engine.getModule('accounts', {
  cache: {
    enabled: true,
    ttl: 3600,  // 1 hour
    max: 1000   // Max cached accounts
  }
});
```

## Migration Guide

### From External Wallets

```javascript
// Import existing Starknet account
const imported = await accounts.import({
  address: '0xexisting...',
  privateKey: '0xprivatekey...',
  implementation: 'argent'  // Detect or specify
});
```

### Upgrading Accounts

```javascript
// Upgrade account implementation
const upgrade = await accounts.upgrade({
  account: '0x123...',
  newImplementation: '0xnewimpl...',
  initData: { /* new settings */ }
});
```

## Next Steps

- Learn about [Paymaster Module](./paymaster) for gasless transactions
- Explore [Events Module](./events) for real-time notifications
- Check [Registry Module](./registry) for contract management