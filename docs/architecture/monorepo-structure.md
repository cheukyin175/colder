# Colder Monorepo Structure

## Overview

This project uses a monorepo structure managed by pnpm workspaces. This setup allows us to share code between the Chrome extension and backend API while maintaining clear separation of concerns.

## Directory Structure

```
colder/
├── apps/                           # Application packages
│   ├── extension/                  # Chrome extension frontend
│   │   ├── src/                   # React components and content scripts
│   │   ├── assets/                # Static assets
│   │   ├── build/                 # Production build output
│   │   └── package.json           # Extension dependencies
│   │
│   └── backend/                    # NestJS API backend
│       ├── src/                   # API source code
│       ├── prisma/                # Database schema and migrations
│       ├── dist/                  # Compiled JavaScript output
│       └── package.json           # Backend dependencies
│
├── packages/                       # Shared packages
│   └── shared-types/              # TypeScript type definitions
│       ├── src/                   # Type definitions
│       └── package.json           # Package configuration
│
├── infrastructure/                # Infrastructure configuration
│   └── docker/                    # Docker configurations
│
├── scripts/                       # Build and deployment scripts
├── docs/                          # Documentation
│   ├── api/                       # API documentation
│   ├── architecture/              # Architecture documentation
│   └── development/               # Development guides
│
├── pnpm-workspace.yaml            # Workspace configuration
├── package.json                   # Root package.json with workspace scripts
└── tsconfig.base.json             # Base TypeScript configuration
```

## Workspace Packages

### Applications

#### @colder/extension
- **Location**: `apps/extension`
- **Purpose**: Chrome extension for LinkedIn outreach
- **Technologies**: React, TypeScript, Plasmo, Tailwind CSS
- **Scripts**:
  - `pnpm dev` - Start development server
  - `pnpm build` - Build for production
  - `pnpm package` - Create Chrome extension package

#### @colder/backend
- **Location**: `apps/backend`
- **Purpose**: REST API for message generation and user management
- **Technologies**: NestJS, Prisma, PostgreSQL, Supabase
- **Scripts**:
  - `pnpm dev` - Start development server with hot reload
  - `pnpm build` - Build for production
  - `pnpm start:prod` - Run production build

### Shared Packages

#### @colder/shared-types
- **Location**: `packages/shared-types`
- **Purpose**: Shared TypeScript type definitions
- **Exports**: User, Profile, Message, and API types

## Development Workflow

### Installation

```bash
# Install all dependencies
pnpm install
```

### Running Applications

```bash
# Run all applications in parallel
pnpm dev

# Run specific application
pnpm dev:extension
pnpm dev:backend

# Or navigate to app directory
cd apps/extension && pnpm dev
cd apps/backend && pnpm dev
```

### Building

```bash
# Build all applications
pnpm build

# Build specific application
pnpm build:extension
pnpm build:backend
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests for specific app
pnpm --filter @colder/extension test
pnpm --filter @colder/backend test
```

### Cleaning

```bash
# Clean all build artifacts and dependencies
pnpm clean

# Clean specific application
pnpm --filter @colder/extension clean
```

### Database Management (Prisma)

The backend uses Prisma for database management. All Prisma files are located in `apps/backend/prisma/`.

```bash
# Generate Prisma client
pnpm prisma:generate

# Run database migrations (development)
pnpm prisma:migrate

# Open Prisma Studio (database GUI)
pnpm prisma:studio

# Push schema changes to database (without migration)
pnpm prisma:push

# Or run directly from backend directory
cd apps/backend
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio
```

**Note**: All Prisma commands can be run from the root directory using the convenience scripts, or directly from the backend directory.

## Benefits of This Structure

1. **Code Sharing**: Share types, utilities, and components between applications
2. **Independent Development**: Each app can be developed and deployed independently
3. **Unified Tooling**: Consistent development experience across all packages
4. **Better Organization**: Clear separation between applications and shared code
5. **Scalability**: Easy to add new applications or packages
6. **Dependency Management**: Centralized dependency management with pnpm
7. **Type Safety**: Shared types ensure consistency across the entire codebase

## Adding New Packages

To add a new package to the workspace:

1. Create a new directory under `apps/` or `packages/`
2. Add a `package.json` with a unique name (e.g., `@colder/new-package`)
3. Run `pnpm install` from the root to link the new package
4. Import the package in other apps using its name: `import { Something } from '@colder/new-package'`

## Best Practices

1. **Keep packages focused**: Each package should have a single, clear purpose
2. **Use workspace protocol**: Reference workspace packages using `workspace:*` in package.json
3. **Share common configs**: Use the base tsconfig and extend it in each package
4. **Document package APIs**: Each package should have its own README
5. **Version together**: Keep all packages at the same version for simplicity

## Common Commands

```bash
# Install a dependency to a specific package
pnpm --filter @colder/backend add express

# Run a script in all packages
pnpm -r build

# Run a script in parallel
pnpm --parallel -r dev

# List all workspace packages
pnpm ls -r --depth 0

# Update all dependencies
pnpm update -r
```

## Troubleshooting

### Module Resolution Issues
- Ensure TypeScript paths are correctly configured in tsconfig.json
- Run `pnpm install` after adding new packages

### Build Order Issues
- Dependencies are built automatically in the correct order
- Use `dependsOn` in turbo.json if using Turborepo

### Type Errors
- Ensure shared-types is built first: `pnpm --filter @colder/shared-types build`
- Check that TypeScript versions match across packages