---
sidebar_position: 3
---

# Transaction Building & Signing

FOC Engine provides comprehensive transaction building and signing capabilities with support for paymaster transactions, multicall operations, and various signing methods.

## Transaction Lifecycle

### Basic Transaction Flow

```javascript
// 1. Build transaction
const transaction = await accounts.buildTransaction({
  contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  entrypoint: 'transfer',
  calldata: [
    '0x123...', // recipient
    '1000000000000000000', // amount (1 ETH in wei)
    '0' // high part for u256
  ]
});

// 2. Sign transaction
const signedTx = await accounts.signTransaction(transaction, {
  account: '0xmyaccount...',
  maxFee: '1000000000000000' // Max fee in wei
});

// 3. Submit transaction
const result = await accounts.submitTransaction(signedTx);

// 4. Wait for confirmation
await result.wait();
```

### Transaction Structure

```javascript
// Complete transaction object
const transaction = {
  contractAddress: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
  entrypoint: 'transfer',
  calldata: ['0x123...', '1000000000000000000', '0'],
  
  // Optional fields
  version: 1,
  maxFee: '1000000000000000',
  nonce: 42,
  
  // Account abstraction fields
  accountAddress: '0xmyaccount...',
  signature: ['0x...', '0x...'], // r, s values
  
  // Metadata
  chainId: 'SN_SEPOLIA',
  timestamp: Date.now()
};
```

## Paymaster Transactions

### Gasless Transaction Building

```javascript
// Build transaction for paymaster submission
const paymasterTx = await accounts.buildPaymasterTransaction({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: '0xmyaccount...',
  
  // Paymaster configuration
  paymaster: {
    address: '0xpaymaster...', // Optional: uses FOC default
    sponsorshipType: 'full',   // 'full' or 'partial'
    maxSponsoredFee: '1000000000000000'
  }
});

// Transaction includes paymaster fields
console.log(paymasterTx);
/*
{
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  
  // Paymaster-specific fields
  paymasterData: {
    paymaster: '0xpaymaster...',
    sponsorshipProof: '0x...',
    validUntil: 1234567890
  },
  
  // User pays no gas
  maxFee: '0'
}
*/
```

### Submitting Gasless Transactions

```javascript
// Submit via FOC Engine paymaster API
const result = await accounts.invokeWithPaymaster({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: '0xmyaccount...',
  
  // Network-specific paymaster
  network: 'sepolia'
});

// Alternative: Direct paymaster submission
const paymasterResult = await accounts.submitToPaymaster({
  transaction: paymasterTx,
  endpoint: 'https://api.foc.fun/paymaster/sepolia',
  apiKey: 'your-api-key' // If required
});
```

### Fallback Handling

```javascript
// Automatic fallback to regular transaction
const txWithFallback = async (txData) => {
  try {
    // Try paymaster first
    return await accounts.invokeWithPaymaster(txData);
  } catch (paymasterError) {
    console.warn('Paymaster failed, falling back to regular transaction');
    
    // Build regular transaction
    const regularTx = await accounts.buildTransaction({
      ...txData,
      maxFee: '1000000000000000' // User pays gas
    });
    
    // Sign and submit
    const signed = await accounts.signTransaction(regularTx);
    return await accounts.submitTransaction(signed);
  }
};
```

## Multicall Operations

### Batch Multiple Calls

```javascript
// Build multicall transaction
const multicall = await accounts.buildMulticall([
  {
    contractAddress: '0xtoken1...',
    entrypoint: 'approve',
    calldata: ['0xspender...', '1000']
  },
  {
    contractAddress: '0xtoken2...',
    entrypoint: 'transfer',
    calldata: ['0xrecipient...', '500']
  },
  {
    contractAddress: '0xnft...',
    entrypoint: 'mint',
    calldata: ['0xrecipient...', '1']
  }
]);

// Execute all calls in single transaction
const result = await accounts.executeMulticall(multicall, {
  account: '0xmyaccount...',
  maxFee: '5000000000000000' // Higher fee for multiple calls
});
```

### Conditional Execution

```javascript
// Execute calls with conditions
const conditionalMulticall = await accounts.buildConditionalMulticall([
  {
    condition: 'balance_check',
    contractAddress: '0xtoken...',
    entrypoint: 'balanceOf',
    calldata: ['0xmyaccount...'],
    expectedResult: { operator: 'gte', value: '1000' }
  },
  {
    dependsOn: 0, // Depends on previous call success
    contractAddress: '0xtoken...',
    entrypoint: 'transfer',
    calldata: ['0xrecipient...', '1000']
  }
]);
```

## Advanced Signing

### Hardware Wallet Signing

```javascript
// Sign with hardware wallet
const hwSignature = await accounts.signTransaction(transaction, {
  account: '0xmyaccount...',
  signer: {
    type: 'hardware',
    device: 'ledger',
    path: "m/44'/9004'/0'/0/0"
  }
});

// Verify hardware signature
const isValid = await accounts.verifySignature({
  transaction,
  signature: hwSignature.signature,
  publicKey: hwSignature.publicKey
});
```

### Multi-Signature Transactions

```javascript
// Create multi-sig transaction
const multiSigTx = await accounts.buildMultiSigTransaction({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  
  // Multi-sig account details
  account: '0xmultisig...',
  threshold: 2, // Require 2 signatures
  signers: ['0xsigner1...', '0xsigner2...', '0xsigner3...']
});

// Collect signatures from multiple signers
const signatures = [];

// Signer 1
const sig1 = await accounts.signTransaction(multiSigTx, {
  account: '0xsigner1...',
  privateKey: '0xkey1...'
});
signatures.push(sig1.signature);

// Signer 2  
const sig2 = await accounts.signTransaction(multiSigTx, {
  account: '0xsigner2...',
  privateKey: '0xkey2...'
});
signatures.push(sig2.signature);

// Combine signatures and submit
const combinedTx = await accounts.combineMultiSigSignatures({
  transaction: multiSigTx,
  signatures,
  threshold: 2
});

const result = await accounts.submitTransaction(combinedTx);
```

### Session Key Signing

```javascript
// Create session key for limited operations
const sessionKey = await accounts.createSessionKey({
  account: '0xmyaccount...',
  permissions: {
    contracts: ['0xtoken...'],
    entrypoints: ['transfer', 'approve'],
    maxAmount: '1000000000000000000', // 1 ETH
    validUntil: Date.now() + 86400000 // 24 hours
  }
});

// Sign transaction with session key
const sessionSignedTx = await accounts.signWithSessionKey({
  transaction,
  sessionKey: sessionKey.privateKey,
  sessionProof: sessionKey.proof
});
```

## Gas Management

### Fee Estimation

```javascript
// Estimate transaction fees
const feeEstimate = await accounts.estimateFee({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: '0xmyaccount...'
});

console.log(feeEstimate);
/*
{
  gasConsumed: '21000',
  gasPrice: '1000000000',
  overallFee: '21000000000000',
  unit: 'wei',
  
  // Alternative fee currencies
  alternatives: [
    { token: 'ETH', amount: '21000000000000' },
    { token: 'STRK', amount: '210000000000000000' }
  ]
}
*/
```

### Dynamic Fee Adjustment

```javascript
// Build transaction with dynamic fee
const dynamicFeeTx = await accounts.buildTransaction({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  
  feeStrategy: {
    type: 'dynamic',
    priority: 'standard', // 'low', 'standard', 'high'
    maxFeeMultiplier: 1.5, // Allow up to 1.5x estimated fee
    feeToken: 'ETH' // or 'STRK'
  }
});
```

### Fee Token Selection

```javascript
// Pay fees with STRK tokens
const strkFeeTx = await accounts.buildTransaction({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  
  feePayment: {
    token: 'STRK',
    tokenAddress: '0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d',
    maxFee: '1000000000000000000' // 1 STRK
  }
});
```

## Transaction Monitoring

### Real-time Status Tracking

```javascript
// Submit transaction with monitoring
const tx = await accounts.submitTransaction(signedTx);

// Monitor transaction status
tx.on('pending', () => {
  console.log('Transaction submitted to mempool');
});

tx.on('confirmed', (receipt) => {
  console.log('Transaction confirmed:', receipt.transactionHash);
});

tx.on('failed', (error) => {
  console.error('Transaction failed:', error);
});

// Wait for specific confirmations
await tx.waitForConfirmations(3);
```

### Advanced Monitoring

```javascript
// Monitor with detailed events
const monitor = accounts.createTransactionMonitor(tx.hash);

monitor.on('statusChange', (status) => {
  console.log('Status:', status); // 'pending', 'confirmed', 'failed'
});

monitor.on('blockIncluded', (blockNumber) => {
  console.log('Included in block:', blockNumber);
});

monitor.on('gasUsed', (gasAmount) => {
  console.log('Gas consumed:', gasAmount);
});

// Custom timeout and retry logic
await monitor.wait({
  timeout: 300000, // 5 minutes
  retries: 3,
  onTimeout: () => {
    console.log('Transaction timeout, checking mempool...');
  }
});
```

## Error Handling

### Transaction Failures

```javascript
const handleTransactionError = async (txData) => {
  try {
    const result = await accounts.submitTransaction(txData);
    return await result.wait();
  } catch (error) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        console.error('Not enough ETH for gas fees');
        // Try paymaster or request funding
        return await accounts.invokeWithPaymaster(txData);
        
      case 'NONCE_TOO_HIGH':
        console.error('Nonce issue, retrying with correct nonce');
        const currentNonce = await accounts.getNonce(txData.account);
        return await accounts.submitTransaction({
          ...txData,
          nonce: currentNonce
        });
        
      case 'TRANSACTION_REVERTED':
        console.error('Transaction reverted:', error.reason);
        // Analyze revert reason and suggest fixes
        break;
        
      case 'NETWORK_ERROR':
        console.error('Network issue, retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return await handleTransactionError(txData);
        
      default:
        console.error('Unknown error:', error);
    }
  }
};
```

### Signature Validation

```javascript
// Validate signature before submission
const validateSignature = async (transaction, signature) => {
  try {
    const isValid = await accounts.verifySignature({
      transaction,
      signature,
      account: transaction.accountAddress
    });
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    return true;
  } catch (error) {
    console.error('Signature validation failed:', error);
    return false;
  }
};
```

## Performance Optimization

### Transaction Batching

```javascript
// Batch multiple transactions efficiently
const batchSubmit = async (transactions) => {
  // Group by account for nonce management
  const groupedByAccount = transactions.reduce((groups, tx) => {
    const account = tx.accountAddress;
    if (!groups[account]) groups[account] = [];
    groups[account].push(tx);
    return groups;
  }, {});
  
  // Submit batches in parallel
  const promises = Object.entries(groupedByAccount).map(async ([account, txs]) => {
    let nonce = await accounts.getNonce(account);
    
    return Promise.all(txs.map(async (tx) => {
      const txWithNonce = { ...tx, nonce: nonce++ };
      return await accounts.submitTransaction(txWithNonce);
    }));
  });
  
  return await Promise.all(promises);
};
```

### Caching and Optimization

```javascript
// Cache transaction building for repeated operations
const txCache = new Map();

const buildCachedTransaction = async (txKey, txData) => {
  if (txCache.has(txKey)) {
    const cached = txCache.get(txKey);
    // Update only dynamic fields
    return {
      ...cached,
      nonce: await accounts.getNonce(txData.account),
      timestamp: Date.now()
    };
  }
  
  const tx = await accounts.buildTransaction(txData);
  txCache.set(txKey, tx);
  return tx;
};
```

## Best Practices

### Security
- Always validate transaction data before signing
- Use hardware wallets for high-value transactions
- Implement proper nonce management
- Verify recipient addresses

### Performance
- Batch transactions when possible
- Use multicall for related operations
- Cache transaction templates
- Monitor gas prices for optimal timing

### User Experience
- Provide clear transaction previews
- Show estimated fees and confirmation times
- Handle errors gracefully with user-friendly messages
- Support transaction cancellation when possible

## Related Documentation

- [Accounts Module](../modules/accounts) - Account management and signing
- [Paymaster Module](../modules/paymaster) - Gasless transaction configuration
- [Security Guide](./security) - Transaction security best practices