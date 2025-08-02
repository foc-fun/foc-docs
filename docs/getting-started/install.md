---
sidebar_position: 2
---

# Installation

This guide will walk you through installing foc-engine, the core component of the foc.fun ecosystem.

## Prerequisites

Before installing foc-engine, ensure you have the following installed:

- **Docker** - [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** - Usually comes with Docker Desktop
- **Command-line tools**:
  - `jq` - JSON processor
  - `yq` - YAML processor

### Installing Prerequisites on macOS

```bash
# Install using Homebrew
brew install jq yq
```

### Installing Prerequisites on Linux

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install jq yq

# Fedora/RHEL
sudo dnf install jq yq
```

## Installation Methods

### Method 1: Using ASDF (Recommended)

[ASDF](https://asdf-vm.com/) is a version manager that makes it easy to install and manage multiple versions of foc-engine.

1. **Install ASDF** (if not already installed):
   ```bash
   # macOS
   brew install asdf
   
   # Linux - see https://asdf-vm.com/guide/getting-started.html
   ```

2. **Add the foc-engine plugin**:
   ```bash
   asdf plugin add foc-engine https://github.com/foc-fun/asdf-foc-engine.git
   ```

3. **Install the latest version**:
   ```bash
   asdf install foc-engine latest
   ```

4. **Set as global version**:
   ```bash
   asdf global foc-engine latest
   ```

5. **Verify installation**:
   ```bash
   foc-engine version
   ```

### Method 2: Clone and Build

If you prefer to build from source or need the latest development version:

1. **Clone the repository**:
   ```bash
   git clone git@github.com:foc-fun/foc-engine.git
   cd foc-engine
   ```

2. **Build with Docker Compose**:
   ```bash
   docker compose -f docker-compose-devnet.yml build
   ```

## Verifying Your Installation

After installation, verify everything is working:

```bash
# If using ASDF
foc-engine run

# If using clone method
docker compose -f docker-compose-devnet.yml up
```

You should see the foc-engine build the docker components. Then start up a local devnet, deploy and connect each of the foc-engine modules, and then continue to run in that terminal.

## Troubleshooting

### Docker Issues

If you encounter Docker permission errors:
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER
# Log out and back in for changes to take effect
```

### Port Conflicts

foc-engine uses several ports. If you have conflicts, check the `docker-compose-devnet.yml` file to modify port mappings.

### Build Failures

If the build fails:
1. Ensure all prerequisites are installed
2. Check Docker daemon is running: `docker ps`
3. Clear Docker cache: `docker system prune -a`

## Installing the JavaScript/TypeScript SDK

To use foc.fun in your JavaScript or TypeScript projects:

```bash
# npm
npm install foc-engine

# yarn
yarn add foc-engine

# pnpm
pnpm add foc-engine
```

> **Note**: The JavaScript SDK is currently in early development. Check the [SDK documentation](../sdks/js-ts) for the latest features.

## Next Steps

Now that you have foc-engine installed, proceed to [Setup](./setup) to configure your first application!
