# BioCatch SDK TypeScript Migration Guide

This guide outlines the gradual migration strategy from the JavaScript SDK to TypeScript.

## Migration Strategy

The TypeScript BioCatchClient is designed to closely mimic the original JavaScript implementation while providing:

1. **Type Safety**: Full TypeScript interfaces and type checking
2. **Backward Compatibility**: Ability to work with existing JavaScript dependencies
3. **Gradual Migration**: Use adapters to wrap JS dependencies while migrating piece by piece

## Current Implementation

### TypeScript BioCatchClient Features

- ✅ Same public API as JavaScript version
- ✅ Proper TypeScript interfaces and types
- ✅ Dependency injection pattern
- ✅ Support for both constructor patterns
- ✅ Browser support checking
- ✅ Proxy interface creation

### Migration Bridge

The `BioCatchClientMigrationBridge` allows you to:

1. **Wrap existing JS dependencies** with TypeScript interfaces
2. **Gradually migrate** individual components
3. **Maintain compatibility** during the transition

## Usage Examples

### 1. Direct TypeScript Usage (Full Migration)

```typescript
import { BioCatchClient, BCProtocolType } from './src';

// With dependencies object
const client = new BioCatchClient({
  client: tsClient,
  dynamicCdApiLoader: tsDynamicCdApiLoader,
  configMapper: tsConfigMapper,
  serverUrlResolver: tsServerUrlResolver,
  remoteConfigurationLoadedCallback: () => console.log('Loaded')
});

// With individual parameters
const client = new BioCatchClient(
  tsClient,
  tsDynamicCdApiLoader,
  tsConfigMapper,
  tsServerUrlResolver,
  () => console.log('Loaded')
);
```

### 2. Gradual Migration (Using JS Dependencies)

```typescript
import { BioCatchClientMigrationBridge } from './src';

// Import your existing JavaScript dependencies
import jsClient from '../js-sdk-legacy/src/main/Client';
import jsDynamicCdApiLoader from '../js-sdk-legacy/src/main/DynamicCdApiLoader';
import jsConfigMapper from '../js-sdk-legacy/src/main/ConfigMapper';
import jsServerUrlResolver from '../js-sdk-legacy/src/main/ServerUrlResolver';

// Create TypeScript client using existing JS dependencies
const client = BioCatchClientMigrationBridge.createFromJSDependencies(
  jsClient,
  jsDynamicCdApiLoader,
  jsConfigMapper,
  jsServerUrlResolver,
  () => console.log('Configuration loaded')
);
```

### 3. Legacy Compatible Factory

```typescript
import { createBioCatchClient } from './src';

// This mimics the original JavaScript constructor exactly
const client = createBioCatchClient(
  jsClient,
  jsDynamicCdApiLoader,
  jsConfigMapper,
  jsServerUrlResolver,
  remoteConfigurationLoadedCallback
);
```

## Migration Steps

### Phase 1: Infrastructure (✅ Complete)
- [x] Create TypeScript interfaces
- [x] Implement BioCatchClient with same API
- [x] Create migration bridge
- [x] Set up adapter pattern

### Phase 2: Gradual Component Migration
1. **Start with utilities** (SupportedBrowserChecker, polyfills)
2. **Migrate core interfaces** one by one
3. **Update dependencies** to use TypeScript versions
4. **Test compatibility** at each step

### Phase 3: Full Migration
1. **Remove migration bridge**
2. **Clean up adapters**
3. **Update all imports** to pure TypeScript
4. **Remove JavaScript dependencies**

## Benefits of This Approach

1. **Risk Mitigation**: Gradual migration reduces the risk of breaking changes
2. **Continuous Integration**: Code remains functional throughout the migration
3. **Type Safety**: Immediate benefits of TypeScript without full rewrite
4. **Testing**: Can test TypeScript and JavaScript versions side by side
5. **Team Adoption**: Team can adopt TypeScript gradually

## Next Steps

1. **Test the current implementation** with existing JavaScript dependencies
2. **Migrate individual utilities** starting with SupportedBrowserChecker
3. **Create TypeScript implementations** for configMapper, serverUrlResolver, etc.
4. **Update polyfills** to TypeScript
5. **Gradually replace** JavaScript dependencies with TypeScript ones

## File Structure

```
src/
├── index.ts                              # Main exports
├── client/
│   ├── BioCatchClient.ts                 # Main TypeScript implementation
│   ├── BioCatchClientMigrationBridge.ts  # Migration utilities
│   └── SupportedBrowserChecker.ts        # Browser support checking
└── types/
    ├── interfaces.ts                     # All TypeScript interfaces
    └── BCProtocolType.ts                 # Protocol type definitions
```

This structure provides a clean separation between the new TypeScript implementation and the migration utilities, making it easy to remove the migration code once the transition is complete.
