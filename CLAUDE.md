# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the documentation site for foc.fun - a multi-repository project ecosystem. Built with Docusaurus v3 and TypeScript, this site documents all components of the foc.fun platform including the core engine, SDKs, builder tools, and app templates.

## Project Context

foc.fun is a multi-repo project with the following components:
- **foc-engine**: Core engine implementation - https://github.com/b-j-roberts/foc-engine
- **asdf-foc-engine**: ASDF plugin for foc-engine version management - https://github.com/b-j-roberts/asdf-foc-engine  
- **foc-engine.js**: JavaScript/TypeScript SDK - https://github.com/b-j-roberts/foc-engine.js
- **foc-builder**: Builder tool (WIP) - https://github.com/b-j-roberts/foc-builder
- **foc-fun**: Main project repository - https://github.com/b-j-roberts/foc-fun

## Commands

### Development
- `npm start` - Start local development server with hot reload (default port 3000)
- `npm run build` - Build static site to `build/` directory
- `npm run serve` - Serve built site locally for testing
- `npm run typecheck` - Run TypeScript type checking
- `npm run clear` - Clear Docusaurus cache

### Deployment
- `npm run deploy` - Deploy to GitHub Pages
  - With SSH: `USE_SSH=true npm run deploy`
  - Without SSH: `GIT_USER=<username> npm run deploy`

## Architecture

### Core Structure
- **Docusaurus Configuration**: `docusaurus.config.ts` - Main configuration including site metadata, presets, themes, and navigation
- **Sidebar Configuration**: `sidebars.ts` - Auto-generates sidebar from docs folder structure
- **TypeScript**: Full TypeScript support with `@docusaurus/types` for type safety

### Content Organization
- `docs/` - Main documentation content in Markdown/MDX
  - `intro.md` - Landing page for docs section
  - `tutorial-basics/` - Basic tutorial content
  - `tutorial-extras/` - Advanced tutorial content
- `blog/` - Blog posts with author and tag support
- `src/` - React components and custom styling
  - `components/` - Reusable React components
  - `css/custom.css` - Global custom styles
  - `pages/` - Custom pages (homepage, standalone pages)
- `static/` - Static assets served directly

### Key Features
- **MDX Support**: Mix JSX components in Markdown files
- **Dark Mode**: Default dark mode with system preference respect
- **Auto-generated Sidebars**: Sidebars generated from file structure
- **Blog**: Full blog with RSS/Atom feeds, reading time, and author profiles
- **Prism Syntax Highlighting**: GitHub theme (light) and Dracula theme (dark)

### Development Workflow
1. Add/edit content in `docs/` or `blog/` directories
2. Custom components go in `src/components/`
3. Global styles in `src/css/custom.css`
4. Run `npm run typecheck` before committing to ensure type safety
5. Use `npm run build` to verify production build before deployment

## Documentation Structure

The documentation is organized into 5 main sections:

1. **Getting Started**
   - Intro - Introduction to foc.fun
   - Install - Installation instructions
   - Setup - Initial setup and configuration
   - Usage - Basic usage examples

2. **Modules**
   - Registry - Module registry documentation
   - Accounts - Account management
   - Paymaster - Paymaster functionality
   - Events - Event system documentation

3. **SDKs**
   - js/ts - JavaScript/TypeScript SDK documentation

4. **Builder** (WIP)
   - Teaser - Coming soon content

5. **App Templates** (WIP)
   - Teaser - Coming soon content

## Updating Documentation

When asked to "update the docs", follow these steps:
1. Study the relevant repositories listed above for the latest changes
2. Check for API changes, new features, or deprecated functionality
3. Update the corresponding documentation sections
4. Ensure code examples are up-to-date and working
5. Maintain consistency across all documentation sections

### Repository Study Guidelines
- **foc-engine**: Core functionality, APIs, modules, configuration
- **asdf-foc-engine**: Installation and version management details
- **foc-engine.js**: JavaScript/TypeScript SDK APIs and usage
- **foc-builder**: Builder tool features and workflows
- **foc-fun**: Overall project structure and integration points