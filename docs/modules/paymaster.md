---
sidebar_position: 3
---

# Paymaster Module

The Paymaster module enables gasless transactions in your foc.fun applications by sponsoring transaction fees on behalf of users. This dramatically improves user experience by removing the need for users to hold ETH for gas fees.

## Overview

The Paymaster module provides:

- Gasless transaction sponsorship
- Flexible sponsorship policies
- Usage quotas and limits
- Multi-token fee payment support
- Analytics and monitoring
- Policy management APIs

## How It Works

1. User initiates a transaction without ETH
2. Paymaster evaluates the transaction against policies
3. If approved, Paymaster sponsors the transaction fee
4. Transaction executes with Paymaster paying the fee
5. Usage is tracked and policies are enforced

## Configuration

Configure the Paymaster module in your `foc.config.yml`:

```yaml
modules:
  paymaster:
    enabled: true
    master_account: ${PAYMASTER_ACCOUNT}  # Account that pays fees
    master_key: ${PAYMASTER_PRIVATE_KEY}  # Private key (secure this!)
    policies:
      default_policy: "whitelist"
      max_fee_per_tx: "1000000000000000"  # 0.001 ETH
      daily_budget: "1000000000000000000"  # 1 ETH per day
    storage:
      type: postgres
      url: ${DATABASE_URL}
    monitoring:
      enabled: true
      webhook_url: ${MONITORING_WEBHOOK}
```

## API Reference

### Initialize the Module

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine();
const paymaster = engine.getModule('paymaster');
```

### Core Methods

#### sponsor(transaction)

Sponsor a transaction:

```javascript
// Sponsor a transaction
const sponsoredTx = await paymaster.sponsor({
  account: '0xuser...',
  to: '0xcontract...',
  selector: 'transfer',
  calldata: ['0xrecipient...', '1000']
});

// Execute the sponsored transaction
const result = await sponsoredTx.execute();
```

#### createPolicy(policy)

Create a sponsorship policy:

```javascript
// Whitelist policy
const whitelistPolicy = await paymaster.createPolicy({
  name: 'vip-users',
  type: 'whitelist',
  config: {
    addresses: ['0xuser1...', '0xuser2...'],
    contracts: ['0xtoken...'],  // Optional: limit to specific contracts
    selectors: ['transfer', 'approve']  // Optional: limit to specific functions
  }
});

// Quota policy
const quotaPolicy = await paymaster.createPolicy({
  name: 'daily-quota',
  type: 'quota',
  config: {
    per_address: {
      daily_transactions: 10,
      daily_spend: '100000000000000000'  // 0.1 ETH
    }
  }
});

// Time-based policy
const timePolicy = await paymaster.createPolicy({
  name: 'weekend-promo',
  type: 'time_based',
  config: {
    start_time: '2024-01-01T00:00:00Z',
    end_time: '2024-01-31T23:59:59Z',
    days_of_week: [6, 0],  // Saturday and Sunday
    hours_of_day: [10, 11, 12, 13, 14, 15, 16, 17, 18]  // 10 AM to 6 PM
  }
});
```

#### applyPolicy(address, policyName)

Apply a policy to an address:

```javascript
// Apply policy to specific user
await paymaster.applyPolicy('0xuser...', 'vip-users');

// Apply policy to all users
await paymaster.applyPolicy('*', 'daily-quota');

// Apply multiple policies
await paymaster.applyPolicies('0xuser...', [
  'vip-users',
  'weekend-promo'
]);
```

#### getUsage(address, options)

Get usage statistics:

```javascript
// Get current day usage
const todayUsage = await paymaster.getUsage('0xuser...');

// Get usage for date range
const monthlyUsage = await paymaster.getUsage('0xuser...', {
  from: '2024-01-01',
  to: '2024-01-31'
});

// Returns
{
  address: '0xuser...',
  period: { from: '2024-01-01', to: '2024-01-31' },
  transactions: 45,
  totalSpent: '450000000000000000',  // 0.45 ETH
  byDay: { /* daily breakdown */ },
  byContract: { /* per contract breakdown */ }
}
```

## Policy Types

### Whitelist Policy

Allow specific addresses:

```javascript
await paymaster.createPolicy({
  name: 'allowed-users',
  type: 'whitelist',
  config: {
    addresses: ['0x123...', '0x456...'],
    // Optional restrictions
    contracts: ['0xtoken...'],
    selectors: ['transfer'],
    max_fee_per_tx: '1000000000000000'
  }
});
```

### Quota Policy

Limit usage per address:

```javascript
await paymaster.createPolicy({
  name: 'user-limits',
  type: 'quota',
  config: {
    per_address: {
      daily_transactions: 100,
      daily_spend: '1000000000000000000',  // 1 ETH
      weekly_transactions: 500,
      weekly_spend: '5000000000000000000',  // 5 ETH
      monthly_transactions: 1000,
      monthly_spend: '10000000000000000000'  // 10 ETH
    },
    global: {
      daily_spend: '100000000000000000000'  // 100 ETH total
    }
  }
});
```

### Token-Based Policy

Accept alternative tokens as payment:

```javascript
await paymaster.createPolicy({
  name: 'token-payment',
  type: 'token_payment',
  config: {
    accepted_tokens: {
      'USDC': {
        address: '0xusdc...',
        rate: 3000,  // 1 ETH = 3000 USDC
        max_slippage: 2  // 2% slippage allowed
      },
      'STRK': {
        address: '0xstrk...',
        rate: 5000,
        max_slippage: 5
      }
    },
    oracle: '0xoracle...'  // Optional: use oracle for rates
  }
});
```

### Contract-Specific Policy

Sponsor only specific contracts:

```javascript
await paymaster.createPolicy({
  name: 'game-contracts',
  type: 'contract_specific',
  config: {
    contracts: {
      '0xgame...': {
        selectors: ['play', 'claim_reward'],
        max_fee: '500000000000000'  // 0.0005 ETH per tx
      },
      '0xnft...': {
        selectors: ['mint'],
        max_fee: '2000000000000000',  // 0.002 ETH per tx
        per_address_daily_limit: 5
      }
    }
  }
});
```

### Composite Policy

Combine multiple conditions:

```javascript
await paymaster.createPolicy({
  name: 'vip-weekend',
  type: 'composite',
  config: {
    all_of: [  // All conditions must be met
      { policy: 'vip-users' },
      { policy: 'weekend-promo' }
    ],
    any_of: [  // At least one must be met
      { policy: 'token-holder' },
      { policy: 'nft-owner' }
    ]
  }
});
```

## Advanced Features

### Dynamic Policies

Create policies that adapt based on conditions:

```javascript
// Volume-based discounts
await paymaster.createDynamicPolicy({
  name: 'volume-discount',
  type: 'dynamic',
  evaluate: async (context) => {
    const usage = await paymaster.getUsage(context.address, {
      from: context.startOfMonth
    });
    
    // More usage = higher sponsorship
    if (usage.transactions > 100) {
      return { sponsor: true, feeMultiplier: 1.0 };  // 100% sponsored
    } else if (usage.transactions > 50) {
      return { sponsor: true, feeMultiplier: 0.5 };  // 50% sponsored
    } else {
      return { sponsor: true, feeMultiplier: 0.1 };  // 10% sponsored
    }
  }
});
```

### Policy Templates

Use pre-built policy templates:

```javascript
// Gaming policy template
await paymaster.useTemplate('gaming', {
  game_contract: '0xgame...',
  daily_plays: 10,
  reward_claims: 3,
  nft_mints: 1
});

// DeFi policy template
await paymaster.useTemplate('defi', {
  dex_contract: '0xdex...',
  daily_swaps: 5,
  max_swap_fee: '2000000000000000',
  liquidity_ops: 2
});
```

### Monitoring and Analytics

Track Paymaster performance:

```javascript
// Get analytics
const analytics = await paymaster.getAnalytics({
  period: 'last_30_days',
  groupBy: 'day'
});

// Set up alerts
await paymaster.createAlert({
  name: 'high-usage',
  condition: {
    metric: 'daily_spend',
    threshold: '10000000000000000000',  // 10 ETH
    operator: 'greater_than'
  },
  actions: ['email', 'webhook']
});

// Export data
const report = await paymaster.exportUsageReport({
  format: 'csv',
  period: 'last_month',
  includeDetails: true
});
```

### Fee Strategies

Implement different fee payment strategies:

```javascript
// Partial sponsorship
await paymaster.setFeeStrategy({
  type: 'partial',
  config: {
    sponsor_percentage: 80,  // Sponsor 80% of fee
    min_user_balance: '100000000000000'  // User needs 0.0001 ETH
  }
});

// Tiered sponsorship
await paymaster.setFeeStrategy({
  type: 'tiered',
  config: {
    tiers: [
      { min_transactions: 0, sponsor_percentage: 50 },
      { min_transactions: 10, sponsor_percentage: 75 },
      { min_transactions: 50, sponsor_percentage: 90 },
      { min_transactions: 100, sponsor_percentage: 100 }
    ]
  }
});
```

## Events

Subscribe to Paymaster events:

```javascript
// Transaction sponsored
paymaster.on('transactionSponsored', (event) => {
  console.log('Sponsored:', {
    user: event.address,
    fee: event.fee,
    policy: event.policy
  });
});

// Policy violated
paymaster.on('policyViolation', (event) => {
  console.log('Violation:', {
    user: event.address,
    policy: event.policy,
    reason: event.reason
  });
});

// Budget alert
paymaster.on('budgetAlert', (event) => {
  console.log('Budget alert:', {
    spent: event.spent,
    budget: event.budget,
    percentage: event.percentage
  });
});
```

## CLI Commands

```bash
# Create policy
foc-engine paymaster create-policy \
  --name "vip-users" \
  --type whitelist \
  --addresses 0x123,0x456

# Apply policy
foc-engine paymaster apply-policy \
  --address 0x789 \
  --policy vip-users

# Check usage
foc-engine paymaster usage 0x789 --period today

# List policies
foc-engine paymaster list-policies

# Monitor spending
foc-engine paymaster monitor --real-time

# Export report
foc-engine paymaster export \
  --period last_month \
  --format csv \
  --output report.csv
```

## Security Considerations

### 1. Private Key Management

Never expose the Paymaster private key:

```javascript
// Bad
const paymaster = {
  private_key: '0x1234...'  // Never hardcode!
};

// Good
const paymaster = {
  private_key: process.env.PAYMASTER_PRIVATE_KEY
};
```

### 2. Policy Validation

Always validate policies:

```javascript
// Implement policy limits
await paymaster.createPolicy({
  name: 'safe-policy',
  type: 'quota',
  config: {
    per_address: {
      daily_spend: '1000000000000000000',  // Max 1 ETH
      max_fee_per_tx: '10000000000000000'   // Max 0.01 ETH per tx
    },
    global: {
      daily_spend: '10000000000000000000',  // Max 10 ETH total
      emergency_stop: true  // Can pause if needed
    }
  }
});
```

### 3. Monitoring

Set up comprehensive monitoring:

```javascript
// Monitor for abuse
await paymaster.enableMonitoring({
  abnormal_usage_detection: true,
  rate_limit_per_address: {
    transactions_per_minute: 10,
    transactions_per_hour: 100
  },
  alert_channels: ['email', 'slack', 'pagerduty']
});
```

## Best Practices

### 1. Start Conservative

Begin with restrictive policies:

```javascript
// Initial launch policy
await paymaster.createPolicy({
  name: 'beta-users',
  type: 'composite',
  config: {
    all_of: [
      { type: 'whitelist', addresses: betaUsers },
      { type: 'quota', daily_transactions: 5 },
      { type: 'contract_specific', contracts: [mainContract] }
    ]
  }
});
```

### 2. Regular Reviews

Regularly review usage:

```javascript
// Weekly review automation
const review = await paymaster.weeklyReview();
if (review.anomalies.length > 0) {
  await paymaster.pausePolicy(review.anomalies[0].policy);
}
```

### 3. Emergency Controls

Implement emergency stops:

```javascript
// Emergency pause
await paymaster.emergencyPause();

// Gradual resume
await paymaster.resume({
  gradual: true,
  initial_percentage: 10,
  increase_daily: 10
});
```

## Integration Examples

### Gaming Integration

```javascript
// Game-specific Paymaster setup
const gamePaymaster = await paymaster.createGameIntegration({
  contract: '0xgame...',
  policies: {
    new_players: {
      free_plays: 10,
      tutorial_completion_bonus: 5
    },
    active_players: {
      daily_plays: 5,
      achievement_rewards: true
    },
    vip_players: {
      unlimited_plays: true,
      premium_features: true
    }
  }
});
```

### DeFi Integration

```javascript
// DeFi protocol Paymaster
const defiPaymaster = await paymaster.createDefiIntegration({
  protocol: '0xdefi...',
  policies: {
    swaps: {
      small_trades: { max_value: '100', fully_sponsored: true },
      medium_trades: { max_value: '1000', sponsor_percentage: 50 },
      large_trades: { max_value: 'unlimited', sponsor_percentage: 10 }
    },
    liquidity: {
      add_liquidity: { sponsor_percentage: 100 },
      remove_liquidity: { sponsor_percentage: 0 }
    }
  }
});
```

## Troubleshooting

### Transaction Not Sponsored

```javascript
try {
  await paymaster.sponsor(transaction);
} catch (error) {
  switch (error.code) {
    case 'POLICY_NOT_MET':
      console.log('User does not meet policy requirements');
      break;
    case 'QUOTA_EXCEEDED':
      console.log('User has exceeded their quota');
      break;
    case 'INSUFFICIENT_PAYMASTER_BALANCE':
      console.log('Paymaster needs funding');
      break;
  }
}
```

### Performance Issues

```javascript
// Enable caching for better performance
const paymaster = engine.getModule('paymaster', {
  cache: {
    enabled: true,
    policy_ttl: 3600,      // 1 hour
    usage_ttl: 300,        // 5 minutes
    redis_url: 'redis://localhost:6379'
  }
});
```

## Next Steps

- Explore [Events Module](./events) for transaction monitoring
- Learn about [Registry Module](./registry) for contract management
- Check [Accounts Module](./accounts) for account integration