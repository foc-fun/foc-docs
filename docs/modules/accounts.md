---
sidebar_position: 2
---

# Accounts Module

The Accounts module provides comprehensive account management for Starknet within the foc.fun ecosystem. It handles account creation, deployment, management, and provides utilities for working with different account implementations.

## Overview

The Accounts module simplifies Starknet account management by providing:

- Account creation and deployment with username registration
- Username store for unique identity management
- Metadata store for flexible account information
- Paymaster integration for gasless transactions
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

## Core Concepts

### Username Store

The username store provides a decentralized identity system:

- **Unique Usernames**: Each account can claim a unique username (3-31 characters, alphanumeric and underscores)
- **Contract-Specific**: Usernames can be scoped to specific contracts or global
- **Validation**: Built-in validation ensures usernames meet format requirements
- **Ownership**: Username ownership is tracked and prevents duplicate claims

### Metadata Store

The metadata store enables flexible account information:

- **Dynamic Storage**: Store arbitrary metadata as hex-encoded strings
- **Contract Scoping**: Metadata can be contract-specific or general
- **Updates**: Account owners can update their metadata at any time
- **Use Cases**: Profile information, settings, preferences, etc.

## API Reference

### Initialize the Module

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine();
const accounts = engine.getModule('accounts');
```

### Core Methods

#### Username Management

##### claimUsername(username, contractAddress?)

Claim a unique username for an account:

```javascript
// Claim global username
const result = await accounts.claimUsername('alice_stark');

// Claim contract-specific username
const contractUsername = await accounts.claimUsername(
  'alice_game',
  '0xcontract...'
);

// Check if username is available
const isAvailable = await accounts.isUsernameUnique('bob_stark');

// Validate username format
const isValid = accounts.isUsernameValid('alice-123'); // false (hyphens not allowed)
```

##### getUsername(address, contractAddress?)

Retrieve username for an account:

```javascript
// Get global username
const username = await accounts.getUsername('0xaddress...');

// Get contract-specific username
const gameUsername = await accounts.getUsername(
  '0xaddress...',
  '0xgamecontract...'
);
```

#### Metadata Management

##### setMetadata(metadata, contractAddress?)

Update account metadata:

```javascript
// Set global metadata
await accounts.setMetadata({
  name: 'Alice',
  avatar: 'https://example.com/avatar.png',
  bio: 'Building on Starknet',
  social: {
    twitter: '@alice',
    github: 'alice-dev'
  }
});

// Set contract-specific metadata
await accounts.setMetadata(
  { level: 42, score: 1000 },
  '0xgamecontract...'
);
```

##### getMetadata(address, contractAddress?)

Retrieve account metadata:

```javascript
// Get account metadata
const metadata = await accounts.getMetadata('0xaddress...');
// Returns parsed metadata object
```

#### create(options)

Create a new account with optional username and metadata:

```javascript
// Create with username and metadata
const account = await accounts.create({
  username: 'alice_stark',  // Optional: 3-31 chars, alphanumeric + underscores
  metadata: {
    name: 'Alice',
    avatar: 'ipfs://...',
    bio: 'Starknet developer'
  },
  deploy: true  // Deploy immediately
});

// Create with specific implementation
const argentAccount = await accounts.create({
  implementation: 'argent',
  username: 'bob_argent',
  deploy: true
});

// Create without deploying
const pendingAccount = await accounts.create({
  username: 'charlie',
  deploy: false
});

// Returns
{
  address: '0x123...',
  publicKey: '0x456...',
  username: 'alice_stark',
  metadata: { /* metadata object */ },
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

Get account details including username and metadata:

```javascript
const accountInfo = await accounts.get('0x123...');
// Returns
{
  address: '0x123...',
  publicKey: '0x456...',
  username: 'alice_stark',        // If claimed
  metadata: {                     // If set
    name: 'Alice',
    avatar: 'https://...',
    bio: 'Building on Starknet'
  },
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

## Paymaster Account Deployment

The FOC Engine provides seamless paymaster integration for gasless account deployment and transactions:

### Deployment Flow

```javascript
// Complete gasless deployment with username
const newAccount = await accounts.deployWithPaymaster({
  // Account configuration
  username: 'alice_stark',      // Required: unique username
  metadata: {                   // Optional: account metadata
    name: 'Alice',
    avatar: 'https://...',
    bio: 'Starknet builder'
  },
  
  // Network selection
  network: 'sepolia',           // 'mainnet', 'sepolia', or 'devnet'
  
  // Optional: specific account implementation
  implementation: 'openzeppelin', // default
  
  // Optional: custom class hash
  classHash: '0x...'            // Uses default if not specified
});

// Returns deployed account with:
{
  address: '0x123...',
  publicKey: '0x456...',
  privateKey: '0x789...',      // Stored securely
  username: 'alice_stark',
  deployed: true,
  network: 'sepolia',
  deploymentTx: '0xabc...'
}
```

### Authentication Methods

```javascript
// Generate new account keys
const keys = await accounts.generatePrivateKey();

// Calculate account address before deployment
const address = await accounts.generateAccountAddress({
  privateKey: keys.privateKey,
  classHash: '0x...',  // Account class hash
  network: 'sepolia'
});

// Connect existing account
const connected = await accounts.connectAccount({
  privateKey: '0xexisting...',
  address: '0xaccount...',
  network: 'sepolia'
});
```

### Gasless Transactions

```javascript
// Execute transaction via paymaster
const result = await accounts.invokeWithPaymaster({
  // Transaction details
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: [
    '0xrecipient...',
    '1000000000000000000'  // 1 token
  ],
  
  // Account to use
  account: '0xmyaccount...',
  
  // Optional: specific paymaster
  paymasterAddress: '0xcustom...'  // Uses FOC default if not set
});

// Monitor transaction
await result.wait();
```

### Network-Specific Configuration

```javascript
// Mainnet deployment
const mainnetAccount = await accounts.deployWithPaymaster({
  username: 'alice_main',
  network: 'mainnet',
  // Uses mainnet paymaster and class hashes
});

// Sepolia testnet
const sepoliaAccount = await accounts.deployWithPaymaster({
  username: 'alice_test',
  network: 'sepolia',
  // Uses Sepolia paymaster and class hashes
});

// Local devnet
const devnetAccount = await accounts.deployWithPaymaster({
  username: 'alice_dev',
  network: 'devnet',
  // Uses local devnet configuration
});
```

### Error Handling

```javascript
try {
  const account = await accounts.deployWithPaymaster({
    username: 'alice',
    network: 'sepolia'
  });
} catch (error) {
  if (error.message.includes('Username already taken')) {
    console.error('Please choose a different username');
  } else if (error.message.includes('Paymaster unavailable')) {
    console.error('Paymaster service is temporarily unavailable');
    // Fallback to regular deployment
    const account = await accounts.create({ 
      username: 'alice',
      deploy: true 
    });
  }
}
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

Deploy and use accounts with paymaster for gasless transactions:

```javascript
// Deploy account using paymaster (gasless)
const account = await accounts.deployWithPaymaster({
  username: 'alice_stark',
  metadata: { name: 'Alice' },
  network: 'sepolia'  // or 'mainnet', 'devnet'
});

// Execute gasless transaction
const tx = await accounts.invokeWithPaymaster({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: account.address
});

// The paymaster deployment process:
// 1. Generates account keys securely
// 2. Calculates contract address
// 3. Deploys via FOC Engine paymaster API
// 4. Falls back to AVNU SDK if needed
// 5. Registers username and metadata

// Configure existing account for paymaster
await accounts.configurePaymaster({
  account: '0x123...',
  paymaster: 'foc-engine',  // or custom paymaster address
  policy: {
    type: 'subscription',
    validUntil: Date.now() + 2592000000  // 30 days
  }
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
  console.log('Username:', event.username);
});

// Account deployed
accounts.on('accountDeployed', (event) => {
  console.log('Deployed:', event.address, event.txHash);
});

// Username claimed
accounts.on('usernameClaimed', (event) => {
  console.log('Username claimed:', event.username);
  console.log('By account:', event.address);
});

// Metadata updated
accounts.on('metadataUpdated', (event) => {
  console.log('Metadata updated for:', event.address);
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
# Create new account with username
foc-engine accounts create --username alice_stark

# Create with paymaster (gasless)
foc-engine accounts create --username bob --paymaster --network sepolia

# Create with specific implementation
foc-engine accounts create --implementation argent --username charlie

# Claim username for existing account
foc-engine accounts claim-username alice_stark --address 0x123...

# Check username availability
foc-engine accounts check-username alice_stark

# Set metadata
foc-engine accounts set-metadata --address 0x123... --data '{"name":"Alice"}'

# List accounts
foc-engine accounts list

# Get account info (includes username/metadata)
foc-engine accounts info 0x123...

# Fund account (devnet)
foc-engine accounts fund 0x123... 1

# Export account
foc-engine accounts export 0x123... --output account-backup.json

# Import account
foc-engine accounts import account-backup.json
```

## Username Validation Rules

Usernames must follow these validation rules:

```javascript
// Valid usernames
'alice'          // ✓ Simple username
'alice_stark'    // ✓ With underscore
'alice123'       // ✓ With numbers
'a_b_c'          // ✓ Multiple underscores
'123alice'       // ✓ Starting with numbers

// Invalid usernames
'al'             // ✗ Too short (min 3 chars)
'alice-stark'    // ✗ Hyphens not allowed
'alice.stark'    // ✗ Dots not allowed
'alice@stark'    // ✗ Special characters not allowed
'a'.repeat(32)   // ✗ Too long (max 31 chars)
'Alice'          // ✗ Uppercase not allowed
'alice '         // ✗ Spaces not allowed

// Validation function
const isValid = accounts.isUsernameValid(username);
// Returns: boolean

// Check availability
const isAvailable = await accounts.isUsernameUnique(username);
// Returns: boolean
```

## Security Best Practices

### 1. Key Storage

Private keys are securely stored with network-specific namespacing:

```javascript
// Keys are automatically encrypted and stored securely
const account = await accounts.deployWithPaymaster({
  username: 'alice',
  network: 'sepolia'
});
// Private key stored as: foc_sepolia_0x123...

// Never expose private keys
// Bad
const privateKey = '0x1234...';

// Good - Use secure storage
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
  implementation: 'argent',  // Detect or specify
  username: 'existing_user'  // Optional: claim username
});

// Connect with existing username
const connected = await accounts.connectAccount({
  privateKey: '0xprivatekey...',
  address: '0xexisting...',
  network: 'sepolia'
});
// Retrieves existing username and metadata automatically
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

## Related Code & Resources

### Source Code
- **Accounts Cairo Contract**: [foc-engine/onchain/src/accounts.cairo](https://github.com/foc-fun/foc-engine/blob/main/onchain/src/accounts.cairo)
- **Accounts Module Implementation**: [foc-engine/modules/accounts](https://github.com/foc-fun/foc-engine/tree/main/modules/accounts)
- **JavaScript SDK Accounts**: [foc-engine.js/src/modules/accounts](https://github.com/foc-fun/foc-engine.js/tree/main/src/modules/accounts)
- **Account Abstraction Core**: [foc-engine/core/accounts](https://github.com/foc-fun/foc-engine/tree/main/core/accounts)

### Examples
- **Account Management Examples**: [foc-engine/examples/accounts](https://github.com/foc-fun/foc-engine/tree/main/examples/accounts)
- **Multi-sig Implementation**: [foc-engine/examples/multisig](https://github.com/foc-fun/foc-engine/tree/main/examples/multisig)
- **Session Keys Demo**: [foc-engine/examples/session-keys](https://github.com/foc-fun/foc-engine/tree/main/examples/session-keys)

### Smart Contracts
- **Account Contracts**: [foc-engine/contracts/accounts](https://github.com/foc-fun/foc-engine/tree/main/contracts/accounts)
- **OpenZeppelin Account**: [foc-engine/contracts/accounts/openzeppelin](https://github.com/foc-fun/foc-engine/tree/main/contracts/accounts/openzeppelin)
- **Argent Account**: [foc-engine/contracts/accounts/argent](https://github.com/foc-fun/foc-engine/tree/main/contracts/accounts/argent)

### Tests
- **Accounts Module Tests**: [foc-engine/tests/modules/accounts](https://github.com/foc-fun/foc-engine/tree/main/tests/modules/accounts)
- **Account Abstraction Tests**: [foc-engine/tests/accounts](https://github.com/foc-fun/foc-engine/tree/main/tests/accounts)

## Next Steps

- Learn about [Paymaster Module](./paymaster) for gasless transactions
- Explore [Events Module](./events) for real-time notifications
- Check [Registry Module](./registry) for contract management