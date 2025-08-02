---
sidebar_position: 3
---

# Setup

After installing foc-engine, this guide will help you set up your development environment and configure your first foc.fun application.

## Initial Configuration

Setting up foc-engine involves three main steps:

1. **Project Structure** - Organizing your application files
2. **Create Config File** - Setting up foc.config.yml
3. **Environment Setup** - Configuring environment variables

### 1. Project Structure

First, create a proper project structure for your foc.fun application:

```
my-foc-app/
├── .env                    # Environment configuration
├── foc.config.yml          # foc-engine configuration
├── contracts/              # Cairo smart contracts
│   ├── src/
│   ├── scripts/            # contract init/setup scripts
│   └── Scarb.toml
├── frontend/              # Frontend application
│   ├── src/
│   └── package.json
├── modules/               # Custom modules
└── ...
```

### 2. Create Configuration File

Create a `foc.config.yml` file in your project root:

```yaml
name: my-foc-app
version: 0.1.0

engine_url: http://localhost:8080

starknet:
  network: devnet
  node_url: http://localhost:5050

contracts:
  - name: my-app-contract
    version: 0.1.0
    class_name: MyAppClass
    constructor:
      - ${ACCOUNT}
      - 0x10
      - Hello!
      - ${ENV_VAR_1}
    init_commands:
      - setup-contracts.sh

modules:
  - registry
  - accounts
  - paymaster
  - events
```

#### Configuration Field Explanations

**class_name**: This field must match the exact name of the contract class defined in your Cairo code. For example, if your Cairo contract is defined as `#[starknet::contract] mod MyAppClass`, then `class_name` should be `MyAppClass`.

**Built-in Variables**: foc-engine provides several built-in variables that can be used in your configuration:
- `${ACCOUNT}` - The account address which deploys/manages the contracts

**Environment Variables**: You can reference any environment variable using `$\{ENV_VAR_NAME\}` syntax. This allows you to keep sensitive data and/or pass in variables using your `.env` file while referencing it in your configuration.

**Constructor Parameters**: The constructor array accepts various data types:
- Addresses (0x prefix)
- Numbers (decimal or hex)
- Strings (for ByteArray conversion)
- Environment variables (`$\{VAR_NAME\}`)
- Built-in foc-engine variables

### 3. Environment Setup

Create a `.env` file in your project directory to configure foc-engine:

```bash
# .env

# If using a custom account (starkli):
STARKNET_KEYSTORE=$HOME/.starkli-sepolia/starkli-keystore.json
STARKNET_ACCOUNT=$HOME/.starkli-sepolia/starkli-account.json
```

> **Note**: Starkli account configuration is only required for Sepolia testnet and mainnet deployments. For local devnet development, foc-engine handles account creation automatically.

## Start you apps Development Environment

### Using ASDF Installation

If you installed via ASDF:

```bash
# Start foc-engine
foc-engine run

# Or with custom config
foc-engine run --config ./foc.config.yml
```

### Using Docker Installation

If you're using the Docker setup:

```bash
# Start all services
docker compose -f docker-compose-devnet.yml up

# Start in detached mode
docker compose -f docker-compose-devnet.yml up -d

# View logs
docker compose -f docker-compose-devnet.yml logs -f
```

## Configuring Modules

### Registry Module

The Registry module manages contract deployments and module registration:

```yaml
modules:
  registry:
    enabled: true
    auto_register: true
    contracts_path: ./contracts/deployments
```

# TODO: Add note with link to registry module docs to get more info

### Accounts Module

Configure account management:

```yaml
modules:
  accounts:
    enabled: true
    metadata:
      - max_fields: 3
      - field_id: 0
        limits:
          - alphanumeric
      - field_id: 1
        limits:
          - integer
          - max_value: 100
      - field_id: 2
        limits:
          - email
```

# TODO: Add note with link to accounts module docs to get more info

### Paymaster Module

Set up the paymaster for gasless transactions:

```yaml
modules:
  paymaster:
    enabled: true
    policies:
      - type: "contracts"
        addresses: ["my-app-contract", "0x456..."]
      - type: "quota"
        max_transactions: 100
        reset: daily
```

# TODO: Add note with link to paymaster modules docs to get more info

### Events Module

Configure event streaming:

```yaml
modules:
  events:
    enabled: true
    websocket_port: 8081
    filters:
      - contract: "*"
        tags: ["ERC20", "Unrug"]
        events: ["Transfer", "Approval"]
      - contract: "my-app-contract"]
```

# TODO: Add note with link to paymaster modules docs to get more info

## Development Workflow

### 1. Start Foc-Engine

# TODO: Add note to be at your project root

```bash
foc-engine run
```

### 2. Start Your App Frontend

```bash
cd frontend/
npm run start
```

### 3. Connect Frontend

In your frontend application:

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  url: 'http://localhost:8080',
});

await engine.connect();
```

## Environment Variables

Key environment variables for foc-engine:

| Variable | Description | Default |
|----------|-------------|---------|
| `FOC_ENGINE_PORT` | Engine API port | 8080 |
| `FOC_ENGINE_HOST` | Engine host | 0.0.0.0 |
| `FOC_ENGINE_DEVNET_URL` | Starknet devnet URL | http://localhost:5050 |
| `FOC_ENGINE_LOG_LEVEL` | Logging level | info |
| `FOC_ENGINE_DATA_DIR` | Data directory | ./data |

## Verifying Setup

Check that everything is running correctly:

```bash
# Check engine status
curl http://localhost:8080/health

# Check devnet status
curl http://localhost:5050/is_alive
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "modules": ["registry", "accounts", "paymaster", "events"]
}
```

## Common Setup Issues

### Port Already in Use

If ports are already in use:
```bash
# Find process using port
lsof -i :8080

# Change port in configuration
FOC_ENGINE_PORT=8090 foc-engine run
```

### Module Loading Errors

If modules fail to load:
1. Check module names in configuration
2. Ensure module dependencies are met
3. Check logs: `docker logs foc-engine`

### Connection Issues

If frontend can't connect:
1. Verify engine is running: `curl http://localhost:8080/health`
2. Check CORS settings in configuration
3. Ensure firewall allows connections

## Next Steps

With your environment set up, you're ready to start building! Check out the [Usage guide](./usage) to learn how to build your first foc.fun application.
