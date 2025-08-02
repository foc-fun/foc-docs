---
sidebar_position: 8
---

# Paymaster Fallback Mechanism

FOC Engine provides a robust fallback mechanism for gasless transactions using AVNU's paymaster service. When the FOC Engine paymaster is unavailable or you prefer direct integration, the system automatically falls back to AVNU SDK for seamless gasless transactions.

## Overview

The fallback mechanism works in two modes:

1. **FOC Engine Paymaster** (Primary): Uses FOC Engine's hosted paymaster service
2. **AVNU Direct Integration** (Fallback): Uses AVNU SDK directly with your API key

## Configuration

### Basic Fallback Setup

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  network: 'sepolia',
  paymaster: {
    // Primary: FOC Engine paymaster
    primary: {
      type: 'foc-engine',
      endpoint: 'https://api.foc.fun/paymaster/sepolia'
    },
    
    // Fallback: AVNU direct integration
    fallback: {
      type: 'avnu',
      apiKey: process.env.AVNU_API_KEY, // Your AVNU API key
      endpoint: 'https://paymaster.avnu.fi'
    },
    
    // Fallback behavior
    retries: 3,
    timeout: 10000, // 10 seconds
    fallbackOnError: true
  }
});
```

### Environment Variables

```bash
# .env file
AVNU_API_KEY=your_avnu_api_key_here
STARKNET_NETWORK=sepolia
STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
```

## Automatic Fallback

### Default Behavior

The fallback mechanism automatically activates when:

```javascript
// This will try FOC Engine paymaster first, then fall back to AVNU
const account = await engine.accounts.deployWithPaymaster({
  username: 'alice_stark',
  network: 'sepolia'
  // Fallback happens automatically if FOC paymaster fails
});

// Transaction execution with automatic fallback
const tx = await engine.accounts.invokeWithPaymaster({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: account.address
  // Falls back to AVNU if FOC paymaster unavailable
});
```

### Fallback Triggers

The system falls back to AVNU when:

- FOC Engine paymaster service is unavailable (503, 504 errors)
- Request timeout (configurable, default 10 seconds)
- Rate limiting from FOC paymaster
- Network connectivity issues to FOC endpoints
- Invalid response from FOC paymaster

```javascript
// Example of fallback trigger scenarios
try {
  const tx = await engine.accounts.invokeWithPaymaster(txData);
} catch (error) {
  // These errors trigger automatic fallback:
  // - 'PAYMASTER_UNAVAILABLE'
  // - 'PAYMASTER_TIMEOUT' 
  // - 'PAYMASTER_RATE_LIMITED'
  // - 'NETWORK_ERROR'
  
  console.log('Fallback reason:', error.fallbackReason);
  console.log('Using AVNU paymaster');
}
```

## AVNU Direct Integration

### API Key Setup

To use AVNU fallback, you need an AVNU API key:

1. Sign up at [AVNU](https://avnu.fi)
2. Generate your API key from the dashboard
3. Add it to your environment variables

```javascript
// Direct AVNU configuration (no FOC Engine paymaster)
const engine = new FocEngine({
  network: 'sepolia',
  paymaster: {
    type: 'avnu-only', // Skip FOC paymaster entirely
    apiKey: process.env.AVNU_API_KEY,
    endpoint: 'https://paymaster.avnu.fi'
  }
});
```

### AVNU-Only Transactions

```javascript
// Force use of AVNU paymaster (bypass FOC Engine)
const tx = await engine.accounts.invokeWithPaymaster({
  contractAddress: '0xtoken...',
  entrypoint: 'transfer',
  calldata: ['0xrecipient...', '1000'],
  account: account.address,
  
  // Force AVNU usage
  paymaster: {
    provider: 'avnu',
    apiKey: process.env.AVNU_API_KEY
  }
});
```

### AVNU Configuration Options

```javascript
const avnuConfig = {
  apiKey: process.env.AVNU_API_KEY,
  endpoint: 'https://paymaster.avnu.fi',
  
  // AVNU-specific options
  options: {
    maxFeePercentage: 10, // Max 10% of transaction value as fee
    validityPeriod: 3600, // 1 hour validity
    gaslessTokens: ['ETH', 'USDC', 'USDT'], // Supported tokens
    
    // Rate limiting
    rateLimit: {
      requestsPerMinute: 60,
      burstLimit: 10
    }
  }
};
```

## Advanced Fallback Configuration

### Custom Fallback Logic

```javascript
const engine = new FocEngine({
  network: 'sepolia',
  paymaster: {
    // Custom fallback strategy
    strategy: 'smart', // 'immediate', 'smart', 'manual'
    
    primary: {
      type: 'foc-engine',
      endpoint: 'https://api.foc.fun/paymaster/sepolia',
      retries: 2,
      timeout: 5000
    },
    
    fallback: {
      type: 'avnu',
      apiKey: process.env.AVNU_API_KEY,
      retries: 3,
      timeout: 8000
    },
    
    // Smart strategy options
    smartFallback: {
      healthCheckInterval: 30000, // Check FOC health every 30s
      consecutiveFailuresThreshold: 3, // Fall back after 3 failures
      backToFocAfter: 300000 // Try FOC again after 5 minutes
    }
  }
});
```

### Fallback with Multiple Providers

```javascript
const engine = new FocEngine({
  network: 'sepolia',
  paymaster: {
    providers: [
      {
        type: 'foc-engine',
        priority: 1,
        endpoint: 'https://api.foc.fun/paymaster/sepolia'
      },
      {
        type: 'avnu',
        priority: 2,
        apiKey: process.env.AVNU_API_KEY
      },
      {
        type: 'custom',
        priority: 3,
        endpoint: 'https://your-custom-paymaster.com/api',
        apiKey: process.env.CUSTOM_PAYMASTER_KEY
      }
    ],
    
    // Try providers in priority order
    cascadingFallback: true,
    maxAttempts: 3
  }
});
```

## Monitoring and Analytics

### Fallback Tracking

```javascript
// Monitor fallback usage
engine.paymaster.on('fallbackTriggered', (event) => {
  console.log('Fallback triggered:', {
    reason: event.reason,
    primaryProvider: event.primary,
    fallbackProvider: event.fallback,
    transactionHash: event.txHash,
    timestamp: event.timestamp
  });
  
  // Send analytics
  analytics.track('paymaster_fallback', {
    reason: event.reason,
    provider: event.fallback
  });
});

// Monitor provider health
engine.paymaster.on('providerHealthChange', (event) => {
  console.log('Provider health:', {
    provider: event.provider,
    status: event.status, // 'healthy', 'degraded', 'down'
    latency: event.latency,
    successRate: event.successRate
  });
});
```

### Fallback Statistics

```javascript
// Get fallback statistics
const stats = await engine.paymaster.getFallbackStats({
  timeframe: '24h' // '1h', '24h', '7d', '30d'
});

console.log(stats);
/*
{
  totalTransactions: 1000,
  focEngineSuccess: 850,
  avnuFallback: 150,
  fallbackRate: 0.15,
  
  avgResponseTime: {
    focEngine: 1200, // ms
    avnu: 800
  },
  
  errorBreakdown: {
    timeout: 80,
    unavailable: 50,
    rateLimit: 20
  }
}
*/
```

## Error Handling and Recovery

### Graceful Degradation

```javascript
const executeTransactionWithFallback = async (txData) => {
  const maxAttempts = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Try transaction with current paymaster strategy
      const result = await engine.accounts.invokeWithPaymaster(txData);
      return result;
      
    } catch (error) {
      lastError = error;
      
      if (error.code === 'PAYMASTER_UNAVAILABLE' && attempt < maxAttempts) {
        console.log(`Attempt ${attempt} failed, trying fallback...`);
        
        // Force next attempt to use fallback
        txData.paymaster = { provider: 'avnu' };
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // If all paymasters fail, offer regular transaction
      if (attempt === maxAttempts) {
        console.warn('All paymasters failed, offering regular transaction');
        
        const userConfirms = await confirmRegularTransaction();
        if (userConfirms) {
          return await executeRegularTransaction(txData);
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
};
```

### Network-Specific Fallback

```javascript
const getNetworkPaymasterConfig = (network) => {
  const baseConfig = {
    retries: 3,
    timeout: 10000,
    fallbackOnError: true
  };
  
  switch (network) {
    case 'mainnet':
      return {
        ...baseConfig,
        primary: {
          type: 'foc-engine',
          endpoint: 'https://api.foc.fun/paymaster/mainnet'
        },
        fallback: {
          type: 'avnu',
          apiKey: process.env.AVNU_MAINNET_API_KEY,
          endpoint: 'https://paymaster.avnu.fi/mainnet'
        }
      };
      
    case 'sepolia':
      return {
        ...baseConfig,
        primary: {
          type: 'foc-engine',
          endpoint: 'https://api.foc.fun/paymaster/sepolia'
        },
        fallback: {
          type: 'avnu',
          apiKey: process.env.AVNU_SEPOLIA_API_KEY,
          endpoint: 'https://paymaster.avnu.fi/sepolia'
        }
      };
      
    default:
      // Devnet: FOC Engine only (no AVNU support)
      return {
        type: 'foc-engine-only',
        endpoint: 'http://localhost:3000/paymaster'
      };
  }
};
```

## Best Practices

### Development vs Production

```javascript
// Development: Use FOC Engine with AVNU fallback
const devConfig = {
  network: 'sepolia',
  paymaster: {
    primary: { type: 'foc-engine' },
    fallback: { 
      type: 'avnu',
      apiKey: process.env.AVNU_TESTNET_API_KEY 
    }
  }
};

// Production: Consider load balancing
const prodConfig = {
  network: 'mainnet',
  paymaster: {
    strategy: 'load-balance', // Balance between providers
    providers: [
      { type: 'foc-engine', weight: 70 },
      { type: 'avnu', weight: 30, apiKey: process.env.AVNU_API_KEY }
    ]
  }
};
```

### Cost Optimization

```javascript
// Monitor costs and optimize provider usage
const costOptimizedConfig = {
  paymaster: {
    strategy: 'cost-optimized',
    
    // Use cheaper provider for small transactions
    rules: [
      {
        condition: 'transactionValue < 0.01', // < 0.01 ETH
        provider: 'avnu' // Usually cheaper for small txs
      },
      {
        condition: 'transactionValue >= 0.01',
        provider: 'foc-engine' // Better rates for larger txs
      }
    ]
  }
};
```

### Security Considerations

```javascript
// Secure API key management
const secureConfig = {
  paymaster: {
    fallback: {
      type: 'avnu',
      // Never expose API keys in frontend
      apiKey: process.env.AVNU_API_KEY, // Server-side only
      
      // For frontend, use proxy endpoint
      endpoint: '/api/paymaster/avnu', // Your backend proxy
      
      // Additional security
      validateResponses: true,
      maxTransactionValue: '1000000000000000000', // 1 ETH limit
      allowedContracts: ['0xtoken...', '0xnft...'] // Whitelist
    }
  }
};
```

## Related Documentation

- [Paymaster Module](../modules/paymaster) - Core paymaster functionality
- [Network Configuration](./networks) - Network-specific paymaster setup
- [Security Guide](./security) - Paymaster security considerations
- [JavaScript SDK](../sdks/js-ts) - SDK paymaster methods