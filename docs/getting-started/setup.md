---
sidebar_position: 3
---

# Setup

After installing foc-engine, this guide will help you set up your development environment and configure your first foc.fun application.

## Initial Configuration

# TODO: Change the organization from this to 1. Project structure 2. create config file 3. environment setup

### 1. Environment Setup

Create a `.env` file in your project directory to configure foc-engine:

# TODO: Add a note that this is only required for sepolia/mainnet deployments

```bash
# .env

# If using a custom account (starkli):
STARKNET_KEYSTORE=$HOME/.starkli-sepolia/starkli-keystore.json
STARKNET_ACCOUNT=$HOME/.starkli-sepolia/starkli-account.json
```

### 2. Project Structure

A typical foc.fun project structure looks like:

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

### 3. Create Configuration File

Create a `foc.config.yml` file:

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

# TODO: Explain class_name field ( myst match the name of the contract within the cairo code )
# TODO: Explain ACCOUNT & other built-in KEYS which link to data from foc-engine
# TODO: Explain env vars and other aspects of yaml

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

### Accounts Module

Configure account management:

```yaml
modules:
  accounts:
    enabled: true
    default_account_class: "OpenZeppelin"
    auto_deploy: true
```

### Paymaster Module

Set up the paymaster for gasless transactions:

```yaml
modules:
  paymaster:
    enabled: true
    policies:
      - type: "whitelist"
        addresses: ["0x123...", "0x456..."]
      - type: "quota"
        max_transactions: 100
```

### Events Module

Configure event streaming:

```yaml
modules:
  events:
    enabled: true
    websocket_port: 8081
    filters:
      - contract: "*"
        events: ["Transfer", "Approval"]
```

## Development Workflow

### 1. Start Local Devnet

```bash
# This is usually started automatically with foc-engine
# But can be started separately if needed
starknet-devnet --seed 0
```

### 2. Deploy Contracts

```bash
# Deploy your contracts to the local devnet
foc-engine deploy --contract ./contracts/MyContract.cairo
```

### 3. Connect Frontend

In your frontend application:

```javascript
import { FocEngine } from 'foc-engine';

const engine = new FocEngine({
  url: 'http://localhost:8080',
  modules: ['accounts', 'events']
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
