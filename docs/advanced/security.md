---
sidebar_position: 2
---

# Key Storage & Security

FOC Engine provides robust security features for private key management, secure storage, and cryptographic operations. This guide covers the security architecture and best practices.

## Key Generation

### Secure Random Generation

FOC Engine uses the browser's Web Crypto API for cryptographically secure key generation:

```javascript
// Generate a new private key
const keys = await accounts.generatePrivateKey();
// Returns: { privateKey: '0x...', publicKey: '0x...' }

// The generation process:
// 1. Uses crypto.getRandomValues() for entropy
// 2. Generates 32 bytes (256 bits) of random data
// 3. Ensures proper key format and validation
// 4. Derives public key using Starknet curves
```

### Key Derivation

```javascript
// Derive keys from seed
const keys = await accounts.deriveKeys({
  seed: '0x...', // 32-byte seed
  path: "m/44'/9004'/0'/0/0" // Starknet derivation path
});

// Generate deterministic keys
const deterministicKeys = await accounts.generatePrivateKey({
  entropy: 'user-provided-entropy',
  salt: 'additional-randomness'
});
```

### Hardware Security Module (HSM) Support

```javascript
// Use hardware wallet for key generation
const hsmKeys = await accounts.generatePrivateKey({
  provider: 'ledger',
  path: "m/44'/9004'/0'/0/0"
});

// Keep private key on hardware device
const account = await accounts.create({
  publicKey: hsmKeys.publicKey,
  signer: 'hardware', // Uses hardware for signing
  device: 'ledger'
});
```

## Storage Architecture

### Network-Namespaced Storage

FOC Engine stores keys with network-specific namespacing to prevent cross-network confusion:

```javascript
// Storage key format: foc_{network}_{address}
// Examples:
// - foc_mainnet_0x123... (mainnet account)
// - foc_sepolia_0x456... (sepolia account)  
// - foc_devnet_0x789... (devnet account)

// Automatic network isolation
const mainnetAccount = await accounts.create({ network: 'mainnet' });
const sepoliaAccount = await accounts.create({ network: 'sepolia' });
// Stored separately, no conflicts
```

### Encryption Methods

```javascript
// Default: AES-256-GCM encryption
const account = await accounts.create({
  username: 'alice',
  storage: {
    type: 'encrypted_local',
    encryption: 'aes-256-gcm',
    keyDerivation: 'pbkdf2'
  }
});

// Advanced encryption options
const secureAccount = await accounts.create({
  username: 'bob',
  storage: {
    type: 'encrypted_local',
    encryption: 'aes-256-gcm',
    keyDerivation: {
      algorithm: 'argon2id',
      iterations: 100000,
      memory: 64 * 1024, // 64MB
      parallelism: 4
    },
    masterPassword: await promptSecurePassword()
  }
});
```

### Storage Backends

#### Local Encrypted Storage

```javascript
// Browser localStorage with encryption
const account = await accounts.create({
  storage: {
    type: 'encrypted_local',
    namespace: 'my-app', // Optional app-specific namespace
    compression: true    // Compress before encryption
  }
});

// Storage location:
// - Browser: localStorage['foc_sepolia_0x123...']
// - Node.js: ~/.foc/keys/sepolia/0x123...
```

#### Secure Enclave (Mobile/Desktop)

```javascript
// Use platform secure storage
const account = await accounts.create({
  storage: {
    type: 'secure_enclave',
    requireBiometric: true, // Require fingerprint/face unlock
    invalidateOnBiometricChange: true
  }
});
```

#### External Key Management

```javascript
// Integration with external KMS
const account = await accounts.create({
  storage: {
    type: 'external_kms',
    provider: 'aws-kms',
    keyId: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    region: 'us-east-1'
  }
});
```

## Access Control

### Authentication Requirements

```javascript
// Password-protected accounts
const account = await accounts.create({
  username: 'alice',
  password: 'strong-password-123',
  auth: {
    minPasswordLength: 12,
    requireSpecialChars: true,
    sessionTimeout: 3600 // 1 hour
  }
});

// Unlock account for use
await accounts.unlock('0x123...', {
  password: 'strong-password-123'
});
```

### Session Management

```javascript
// Create authenticated session
const session = await accounts.createSession({
  account: '0x123...',
  password: 'strong-password-123',
  duration: 3600, // 1 hour
  permissions: {
    maxTransactionValue: '1000000000000000000', // 1 ETH
    allowedContracts: ['0xtoken...', '0xnft...'],
    rateLimit: {
      transactionsPerHour: 10
    }
  }
});

// Use session for transactions
const tx = await accounts.invoke({
  session: session.token,
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000']
});
```

### Multi-Factor Authentication

```javascript
// Enable 2FA for account
await accounts.enable2FA({
  account: '0x123...',
  method: 'totp', // or 'sms', 'email'
  secret: 'base32-encoded-secret'
});

// Transaction with 2FA
const tx = await accounts.invoke({
  account: '0x123...',
  twoFactorCode: '123456',
  contractAddress: '0x...',
  entrypoint: 'transfer',
  calldata: ['0x...', '1000']
});
```

## Key Recovery

### Social Recovery

```javascript
// Setup social recovery
await accounts.setupSocialRecovery({
  account: '0x123...',
  guardians: [
    { address: '0xguardian1...', weight: 1 },
    { address: '0xguardian2...', weight: 1 },
    { address: '0xguardian3...', weight: 1 }
  ],
  threshold: 2, // Require 2 out of 3 guardians
  recoveryDelay: 86400 // 24 hours delay
});

// Initiate recovery (by guardian)
const recovery = await accounts.initiateRecovery({
  account: '0x123...',
  newOwner: '0xnewowner...',
  guardian: '0xguardian1...',
  reason: 'Lost private key'
});
```

### Backup and Restore

```javascript
// Create encrypted backup
const backup = await accounts.createBackup({
  accounts: ['0x123...', '0x456...'],
  password: 'backup-password-456',
  metadata: {
    timestamp: Date.now(),
    version: '1.0',
    description: 'Monthly backup'
  }
});

// Secure backup storage
await storeBackupSecurely(backup, {
  locations: ['local', 'cloud', 'hardware'],
  encryption: 'additional-layer'
});

// Restore from backup
const restored = await accounts.restoreFromBackup(backup, {
  password: 'backup-password-456',
  verifyIntegrity: true
});
```

### Seed Phrase Recovery

```javascript
// Generate mnemonic for recovery
const mnemonic = await accounts.generateMnemonic({
  strength: 256, // 24 words
  language: 'english'
});

// Create account from mnemonic
const account = await accounts.createFromMnemonic({
  mnemonic: 'word1 word2 ... word24',
  path: "m/44'/9004'/0'/0/0",
  network: 'sepolia'
});

// Recover account
const recovered = await accounts.recoverFromMnemonic({
  mnemonic: 'word1 word2 ... word24',
  path: "m/44'/9004'/0'/0/0"
});
```

## Security Auditing

### Access Logging

```javascript
// Enable comprehensive logging
const engine = new FocEngine({
  security: {
    logging: {
      enabled: true,
      level: 'detailed', // 'basic', 'detailed', 'paranoid'
      events: [
        'key_generation',
        'account_creation',
        'transaction_signing',
        'authentication',
        'key_access'
      ],
      destination: 'secure-log-service'
    }
  }
});

// Audit trail example
const auditLog = await accounts.getAuditLog('0x123...', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  events: ['transaction_signing', 'authentication']
});
```

### Security Monitoring

```javascript
// Real-time security monitoring
accounts.on('securityEvent', (event) => {
  switch (event.type) {
    case 'unusual_transaction':
      // Large or unusual transaction detected
      alertSecurityTeam(event);
      break;
    case 'multiple_failed_auth':
      // Multiple authentication failures
      temporarilyLockAccount(event.account);
      break;
    case 'new_device_access':
      // Access from new device/location
      requireAdditionalVerification(event);
      break;
  }
});
```

### Key Rotation

```javascript
// Automated key rotation
await accounts.enableKeyRotation({
  account: '0x123...',
  schedule: 'monthly', // or specific date
  rotationType: 'seamless', // No downtime
  backupOldKeys: true,
  notifyBeforeRotation: 86400 // 24 hours notice
});

// Manual key rotation
const newKeys = await accounts.rotateKeys('0x123...', {
  reason: 'security_upgrade',
  invalidateOldSessions: true,
  updateMetadata: true
});
```

## Best Practices

### Key Management

```javascript
// ✅ Good practices
const account = await accounts.create({
  username: 'alice',
  storage: 'encrypted_local',
  password: generateStrongPassword(),
  backup: {
    enabled: true,
    frequency: 'weekly',
    locations: ['local', 'secure_cloud']
  }
});

// ❌ Avoid these practices
const badAccount = await accounts.create({
  storage: 'plain_text', // Never store keys in plain text
  password: '123456',     // Weak password
  backup: false          // No backup strategy
});
```

### Environment Separation

```javascript
// Separate keys by environment
const config = {
  development: {
    network: 'devnet',
    storage: 'memory', // Temporary storage for dev
    keyGeneration: 'deterministic' // Predictable for testing
  },
  production: {
    network: 'mainnet',
    storage: 'secure_enclave',
    keyGeneration: 'hardware_random',
    monitoring: 'enabled'
  }
};
```

### Network Isolation

```javascript
// Prevent cross-network key usage
const enforceNetworkIsolation = (account, targetNetwork) => {
  if (account.network !== targetNetwork) {
    throw new Error(`Account ${account.address} is for ${account.network}, cannot use on ${targetNetwork}`);
  }
};

// Safe network switching
const switchNetwork = async (account, newNetwork) => {
  // Export account data
  const accountData = await accounts.export(account.address);
  
  // Create new account on target network
  const newAccount = await accounts.create({
    ...accountData,
    network: newNetwork
  });
  
  return newAccount;
};
```

## Security Checklist

### Development
- [ ] Use secure random number generation
- [ ] Enable encrypted storage
- [ ] Implement proper error handling
- [ ] Never log private keys
- [ ] Use network isolation
- [ ] Implement session timeouts

### Production
- [ ] Enable comprehensive logging
- [ ] Set up monitoring and alerting
- [ ] Implement key rotation
- [ ] Configure backup strategy
- [ ] Enable multi-factor authentication
- [ ] Regular security audits

### User Education
- [ ] Strong password requirements
- [ ] Backup procedure documentation
- [ ] Security awareness training
- [ ] Recovery process testing
- [ ] Regular security updates

## Related Documentation

- [Network Configuration](./networks) - Network-specific security considerations
- [Accounts Module](../modules/accounts) - Account security features
- [Setup Guide](../getting-started/setup) - Secure initial configuration