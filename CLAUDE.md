# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run webpack:dev` - Bundle TypeScript with webpack to public/customerJs/slothDebug_DevVersion.js
- `npm run devserver` - Start development server with webpack bundling to customerJs/
- `npm run build:watch` - Compile TypeScript with watch mode for development
- `npm run clean` - Remove dist/ directory
- `npm test` - Currently not configured (placeholder)

## Project Overview

This is a **gradual migration project** converting the BioCatch JavaScript SDK to TypeScript. The project maintains API compatibility while adding type safety and modern development practices.

### Migration Strategy

The project follows a **phased migration approach**:

**Phase 1 (✅ Complete)**: Core TypeScript interfaces and BioCatchClient implementation
**Phase 2 (In Progress)**: Gradual dependency migration (SupportedBrowserChecker, BCProtocolType completed)
**Phase 3 (Future)**: Full migration and removal of JavaScript dependencies

### Architecture

#### Core Components

- **BioCatchClient** (`src/client/BioCatchClient.ts`) - Main TypeScript client implementation
- **Migration Bridge** (`src/client/BioCatchClientMigrationBridge.ts`) - Facilitates gradual migration
- **JSBridge** (`src/client/JSBridge.ts`) - Adapter classes for JavaScript interop during migration
- **Interfaces** (`src/types/interfaces.ts`) - Core type definitions matching JS functionality

#### Key Architectural Patterns

1. **Dependency Injection**: BioCatchClient accepts dependencies (IClient, IDynamicCdApiLoader, IConfigMapper, IServerUrlResolver) allowing gradual migration
2. **Adapter Pattern**: JSBridge classes wrap JavaScript dependencies to work with TypeScript interfaces
3. **Interface Segregation**: Clean interfaces mirror existing JavaScript API for compatibility

#### Migration Pattern

```typescript
// Current approach during migration
const tsClient = createBioCatchClientFromJS(
  jsClient,           // JavaScript Client
  jsDynamicLoader,    // JavaScript DynamicCdApiLoader  
  jsConfigMapper,     // JavaScript ConfigMapper
  jsServerResolver,   // JavaScript ServerUrlResolver
  callback
);

// Future pure TypeScript approach
const client = new BioCatchClient({
  client: new TSClient(),
  dynamicCdApiLoader: new TSDynamicCdApiLoader(),
  // ... all TypeScript implementations
});
```

### Legacy JavaScript SDK

The `js-sdk-legacy/` directory contains the original JavaScript implementation. This serves as the reference for migration and provides dependencies during the transition period.

### TypeScript Configuration

- Target: ES2022
- Module: CommonJS  
- Strict mode enabled
- Declaration files generated for type exports
- Excludes test files and legacy JS SDK from compilation

## Migration Priority Order

When working on migrations, follow this order:
1. ConfigMapper → TypeScript ⏳
2. DynamicCdApiLoader → TypeScript
3. ServerUrlResolver → TypeScript  
4. Client → TypeScript
5. Remove adapter classes and complete migration

The project maintains 100% API compatibility throughout the migration process.