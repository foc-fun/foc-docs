---
sidebar_position: 2
---

# Integration Patterns

This guide covers best practices and patterns for integrating FOC Engine into modern web applications, including React, Next.js, Vue, and other frameworks.

## React Integration

### Context Provider Pattern

```tsx
// contexts/FocEngineContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { FocEngine } from 'foc-engine';

interface FocEngineContextType {
  engine: FocEngine | null;
  account: any | null;
  isConnected: boolean;
  connect: (username?: string) => Promise<void>;
  disconnect: () => void;
  loading: boolean;
}

const FocEngineContext = createContext<FocEngineContextType | undefined>(undefined);

export const FocEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [engine, setEngine] = useState<FocEngine | null>(null);
  const [account, setAccount] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize FOC Engine
    const initEngine = async () => {
      try {
        const focEngine = new FocEngine({
          network: process.env.NEXT_PUBLIC_STARKNET_NETWORK || 'sepolia',
          rpc: process.env.NEXT_PUBLIC_STARKNET_RPC
        });
        
        setEngine(focEngine);
        
        // Check for existing session
        const savedAccount = localStorage.getItem('foc_current_account');
        if (savedAccount) {
          const accountData = JSON.parse(savedAccount);
          setAccount(accountData);
        }
      } catch (error) {
        console.error('Failed to initialize FOC Engine:', error);
      }
    };

    initEngine();
  }, []);

  const connect = async (username?: string) => {
    if (!engine) throw new Error('FOC Engine not initialized');
    
    setLoading(true);
    try {
      let connectedAccount;
      
      if (username) {
        // Create new account with paymaster
        connectedAccount = await engine.accounts.deployWithPaymaster({
          username,
          network: engine.network
        });
      } else {
        // Connect existing account (implement your logic)
        connectedAccount = await connectExistingAccount(engine);
      }
      
      setAccount(connectedAccount);
      localStorage.setItem('foc_current_account', JSON.stringify(connectedAccount));
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    localStorage.removeItem('foc_current_account');
  };

  return (
    <FocEngineContext.Provider
      value={{
        engine,
        account,
        isConnected: !!account,
        connect,
        disconnect,
        loading
      }}
    >
      {children}
    </FocEngineContext.Provider>
  );
};

export const useFocEngine = () => {
  const context = useContext(FocEngineContext);
  if (!context) {
    throw new Error('useFocEngine must be used within FocEngineProvider');
  }
  return context;
};
```

### Custom Hooks

```tsx
// hooks/useAccount.ts
import { useState, useEffect } from 'react';
import { useFocEngine } from '../contexts/FocEngineContext';

export const useAccount = () => {
  const { engine, account } = useFocEngine();
  const [balance, setBalance] = useState<string>('0');
  const [metadata, setMetadata] = useState<any>(null);

  useEffect(() => {
    if (!engine || !account) return;

    const fetchAccountData = async () => {
      try {
        // Get account balance
        const accountInfo = await engine.accounts.get(account.address);
        setBalance(accountInfo.balance.eth);
        
        // Get account metadata
        const meta = await engine.accounts.getMetadata(account.address);
        setMetadata(meta);
      } catch (error) {
        console.error('Failed to fetch account data:', error);
      }
    };

    fetchAccountData();
  }, [engine, account]);

  return {
    account,
    balance,
    metadata,
    updateMetadata: async (newMetadata: any) => {
      if (!engine || !account) return;
      await engine.accounts.setMetadata(newMetadata);
      setMetadata(newMetadata);
    }
  };
};

// hooks/useTransactions.ts
import { useState, useCallback } from 'react';
import { useFocEngine } from '../contexts/FocEngineContext';

export const useTransactions = () => {
  const { engine, account } = useFocEngine();
  const [pending, setPending] = useState<string[]>([]);

  const sendTransaction = useCallback(async (txData: any) => {
    if (!engine || !account) throw new Error('Not connected');

    try {
      // Try paymaster first, fallback to regular transaction
      const result = await engine.accounts.invokeWithPaymaster({
        ...txData,
        account: account.address
      });

      setPending(prev => [...prev, result.hash]);
      
      // Wait for confirmation
      await result.wait();
      
      setPending(prev => prev.filter(hash => hash !== result.hash));
      return result;
    } catch (paymasterError) {
      console.warn('Paymaster failed, using regular transaction');
      
      const tx = await engine.accounts.buildTransaction({
        ...txData,
        account: account.address,
        maxFee: '1000000000000000' // 0.001 ETH
      });
      
      const signed = await engine.accounts.signTransaction(tx);
      const result = await engine.accounts.submitTransaction(signed);
      
      setPending(prev => [...prev, result.hash]);
      await result.wait();
      setPending(prev => prev.filter(hash => hash !== result.hash));
      
      return result;
    }
  }, [engine, account]);

  return {
    sendTransaction,
    pendingTransactions: pending
  };
};
```

### Component Examples

```tsx
// components/AccountConnector.tsx
import React, { useState } from 'react';
import { useFocEngine } from '../contexts/FocEngineContext';

export const AccountConnector: React.FC = () => {
  const { isConnected, connect, disconnect, loading, account } = useFocEngine();
  const [username, setUsername] = useState('');

  const handleConnect = async () => {
    if (username.trim()) {
      try {
        await connect(username);
      } catch (error) {
        alert(`Connection failed: ${error.message}`);
      }
    }
  };

  if (isConnected) {
    return (
      <div className="account-info">
        <p>Connected as: {account.username}</p>
        <p>Address: {account.address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="account-connector">
      <input
        type="text"
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />
      <button 
        onClick={handleConnect} 
        disabled={loading || !username.trim()}
      >
        {loading ? 'Connecting...' : 'Connect with FOC'}
      </button>
    </div>
  );
};

// components/TransactionButton.tsx
import React from 'react';
import { useTransactions } from '../hooks/useTransactions';

interface TransactionButtonProps {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
  children: React.ReactNode;
}

export const TransactionButton: React.FC<TransactionButtonProps> = ({
  contractAddress,
  entrypoint,
  calldata,
  children
}) => {
  const { sendTransaction, pendingTransactions } = useTransactions();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await sendTransaction({
        contractAddress,
        entrypoint,
        calldata
      });
      alert('Transaction successful!');
    } catch (error) {
      alert(`Transaction failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading || pendingTransactions.length > 0}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
};
```

## Next.js Integration

### App Router Pattern (Next.js 13+)

```tsx
// app/providers.tsx
'use client';

import { FocEngineProvider } from '../contexts/FocEngineContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FocEngineProvider>
      {children}
    </FocEngineProvider>
  );
}

// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### API Routes for Server-Side Operations

```typescript
// app/api/foc/account/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  network: process.env.STARKNET_NETWORK!,
  rpc: process.env.STARKNET_RPC!
});

export async function POST(request: NextRequest) {
  try {
    const { username, metadata } = await request.json();
    
    // Server-side account creation (for admin operations)
    const account = await engine.accounts.deployWithPaymaster({
      username,
      metadata,
      network: engine.network
    });
    
    return NextResponse.json({ 
      success: true, 
      account: {
        address: account.address,
        username: account.username
        // Don't expose private key
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }
}

// app/api/foc/username/check/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }
  
  try {
    const isAvailable = await engine.accounts.isUsernameUnique(username);
    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Middleware for Authentication

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for FOC account in cookies/headers
  const focAccount = request.cookies.get('foc_account');
  
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!focAccount) {
      return NextResponse.redirect(new URL('/connect', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*']
};
```

## Vue.js Integration

### Composition API Pattern

```typescript
// composables/useFocEngine.ts
import { ref, reactive, onMounted } from 'vue';
import { FocEngine } from 'foc-engine';

const engine = ref<FocEngine | null>(null);
const account = ref<any | null>(null);
const loading = ref(false);

export const useFocEngine = () => {
  const initializeEngine = async () => {
    try {
      engine.value = new FocEngine({
        network: import.meta.env.VITE_STARKNET_NETWORK || 'sepolia',
        rpc: import.meta.env.VITE_STARKNET_RPC
      });
    } catch (error) {
      console.error('Failed to initialize FOC Engine:', error);
    }
  };

  const connect = async (username: string) => {
    if (!engine.value) throw new Error('Engine not initialized');
    
    loading.value = true;
    try {
      const connectedAccount = await engine.value.accounts.deployWithPaymaster({
        username,
        network: engine.value.network
      });
      
      account.value = connectedAccount;
      localStorage.setItem('foc_account', JSON.stringify(connectedAccount));
    } finally {
      loading.value = false;
    }
  };

  const disconnect = () => {
    account.value = null;
    localStorage.removeItem('foc_account');
  };

  onMounted(() => {
    initializeEngine();
    
    // Restore session
    const savedAccount = localStorage.getItem('foc_account');
    if (savedAccount) {
      account.value = JSON.parse(savedAccount);
    }
  });

  return {
    engine: readonly(engine),
    account: readonly(account),
    loading: readonly(loading),
    connect,
    disconnect,
    isConnected: computed(() => !!account.value)
  };
};
```

### Vue Plugin

```typescript
// plugins/foc-engine.ts
import { App } from 'vue';
import { FocEngine } from 'foc-engine';

export default {
  install(app: App, options: any) {
    const engine = new FocEngine(options);
    
    app.config.globalProperties.$focEngine = engine;
    app.provide('focEngine', engine);
  }
};

// main.ts
import { createApp } from 'vue';
import App from './App.vue';
import FocEnginePlugin from './plugins/foc-engine';

const app = createApp(App);

app.use(FocEnginePlugin, {
  network: import.meta.env.VITE_STARKNET_NETWORK,
  rpc: import.meta.env.VITE_STARKNET_RPC
});

app.mount('#app');
```

## State Management Integration

### Redux Toolkit

```typescript
// store/focEngineSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { FocEngine } from 'foc-engine';

interface FocEngineState {
  engine: FocEngine | null;
  account: any | null;
  loading: boolean;
  error: string | null;
}

const initialState: FocEngineState = {
  engine: null,
  account: null,
  loading: false,
  error: null
};

export const initializeEngine = createAsyncThunk(
  'focEngine/initialize',
  async (config: any) => {
    const engine = new FocEngine(config);
    return engine;
  }
);

export const connectAccount = createAsyncThunk(
  'focEngine/connect',
  async ({ username, engine }: { username: string; engine: FocEngine }) => {
    const account = await engine.accounts.deployWithPaymaster({
      username,
      network: engine.network
    });
    return account;
  }
);

const focEngineSlice = createSlice({
  name: 'focEngine',
  initialState,
  reducers: {
    disconnect: (state) => {
      state.account = null;
      localStorage.removeItem('foc_account');
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeEngine.fulfilled, (state, action) => {
        state.engine = action.payload;
      })
      .addCase(connectAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.account = action.payload;
        localStorage.setItem('foc_account', JSON.stringify(action.payload));
      })
      .addCase(connectAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Connection failed';
      });
  }
});

export const { disconnect, clearError } = focEngineSlice.actions;
export default focEngineSlice.reducer;
```

### Zustand

```typescript
// store/focEngineStore.ts
import { create } from 'zustand';
import { FocEngine } from 'foc-engine';

interface FocEngineStore {
  engine: FocEngine | null;
  account: any | null;
  loading: boolean;
  
  initialize: (config: any) => Promise<void>;
  connect: (username: string) => Promise<void>;
  disconnect: () => void;
  sendTransaction: (txData: any) => Promise<any>;
}

export const useFocEngineStore = create<FocEngineStore>((set, get) => ({
  engine: null,
  account: null,
  loading: false,
  
  initialize: async (config) => {
    const engine = new FocEngine(config);
    set({ engine });
  },
  
  connect: async (username) => {
    const { engine } = get();
    if (!engine) throw new Error('Engine not initialized');
    
    set({ loading: true });
    try {
      const account = await engine.accounts.deployWithPaymaster({
        username,
        network: engine.network
      });
      set({ account, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  
  disconnect: () => {
    set({ account: null });
    localStorage.removeItem('foc_account');
  },
  
  sendTransaction: async (txData) => {
    const { engine, account } = get();
    if (!engine || !account) throw new Error('Not connected');
    
    return await engine.accounts.invokeWithPaymaster({
      ...txData,
      account: account.address
    });
  }
}));
```

## Real-time Event Handling

### WebSocket Integration

```typescript
// services/focEvents.ts
import { FocEngine } from 'foc-engine';
import { EventEmitter } from 'events';

export class FocEventService extends EventEmitter {
  private engine: FocEngine;
  private ws: WebSocket | null = null;
  
  constructor(engine: FocEngine) {
    super();
    this.engine = engine;
  }
  
  connect() {
    const wsUrl = `wss://api.foc.fun/events/${this.engine.network}`;
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data);
    };
    
    this.ws.onopen = () => {
      console.log('Connected to FOC events');
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from FOC events');
      // Reconnect logic
      setTimeout(() => this.connect(), 5000);
    };
  }
  
  subscribeToAccount(address: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe',
        address
      }));
    }
  }
  
  disconnect() {
    this.ws?.close();
  }
}

// React hook for events
export const useFocEvents = (account?: any) => {
  const [events, setEvents] = useState<any[]>([]);
  
  useEffect(() => {
    if (!account) return;
    
    const eventService = new FocEventService(engine);
    eventService.connect();
    eventService.subscribeToAccount(account.address);
    
    eventService.on('transaction', (event) => {
      setEvents(prev => [event, ...prev]);
    });
    
    eventService.on('usernameChanged', (event) => {
      // Handle username updates
    });
    
    return () => {
      eventService.disconnect();
    };
  }, [account]);
  
  return events;
};
```

## Testing Patterns

### Unit Testing with Jest

```typescript
// __tests__/focEngine.test.ts
import { FocEngine } from 'foc-engine';

// Mock FOC Engine for testing
jest.mock('foc-engine', () => ({
  FocEngine: jest.fn().mockImplementation(() => ({
    accounts: {
      deployWithPaymaster: jest.fn(),
      invokeWithPaymaster: jest.fn(),
      get: jest.fn()
    }
  }))
}));

describe('FOC Engine Integration', () => {
  let engine: FocEngine;
  
  beforeEach(() => {
    engine = new FocEngine({
      network: 'sepolia',
      rpc: 'https://test-rpc.example.com'
    });
  });
  
  it('should create account with paymaster', async () => {
    const mockAccount = {
      address: '0x123...',
      username: 'test_user'
    };
    
    (engine.accounts.deployWithPaymaster as jest.Mock)
      .mockResolvedValue(mockAccount);
    
    const result = await engine.accounts.deployWithPaymaster({
      username: 'test_user',
      network: 'sepolia'
    });
    
    expect(result).toEqual(mockAccount);
  });
});
```

### E2E Testing with Playwright

```typescript
// e2e/foc-integration.spec.ts
import { test, expect } from '@playwright/test';

test('FOC Engine account connection flow', async ({ page }) => {
  await page.goto('/');
  
  // Fill username
  await page.fill('input[placeholder="Enter username"]', 'test_user_123');
  
  // Click connect
  await page.click('button:has-text("Connect with FOC")');
  
  // Wait for connection
  await expect(page.locator('text=Connected as:')).toBeVisible();
  
  // Verify account info is displayed
  await expect(page.locator('text=test_user_123')).toBeVisible();
  await expect(page.locator('text=0x')).toBeVisible(); // Address
});
```

## Performance Best Practices

### Lazy Loading

```typescript
// Lazy load FOC Engine only when needed
const FocEngineComponent = lazy(() => import('./FocEngineComponent'));

// Code splitting for network-specific features
const loadNetworkConfig = async (network: string) => {
  switch (network) {
    case 'mainnet':
      return import('./configs/mainnet').then(m => m.config);
    case 'sepolia':
      return import('./configs/sepolia').then(m => m.config);
    default:
      return import('./configs/devnet').then(m => m.config);
  }
};
```

### Caching Strategies

```typescript
// Cache account data
const useAccountCache = () => {
  const [cache, setCache] = useState(new Map());
  
  const getAccount = useCallback(async (address: string) => {
    if (cache.has(address)) {
      return cache.get(address);
    }
    
    const account = await engine.accounts.get(address);
    setCache(prev => new Map(prev).set(address, account));
    return account;
  }, [cache, engine]);
  
  return { getAccount };
};
```

## Related Documentation

- [JavaScript/TypeScript SDK](./js-ts) - Core SDK documentation
- [Accounts Module](../modules/accounts) - Account management
- [Network Configuration](../advanced/networks) - Network setup