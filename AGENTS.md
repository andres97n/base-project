# AGENTS.md

## Package Manager
Uses **pnpm** (not npm or yarn). All commands must use `pnpm`.

## Developer Commands
```bash
pnpm install          # Install dependencies
pnpm run start        # Development server
pnpm run start:dev    # Watch mode (auto-reload)
pnpm run start:prod   # Production (run dist/main)
pnpm run lint         # ESLint + fix
pnpm run format       # Prettier format
pnpm run test         # Unit tests (Jest)
pnpm run test:watch   # Jest watch mode
pnpm run test:cov     # Coverage report
pnpm run test:e2e     # E2E tests (uses test/jest-e2e.json)
```

## Run Order
`lint -> format -> test` before committing (or at least before pushing).

## Architecture
- **src/** - All source code
  - `main.ts` - Application entry point
  - `app.module.ts` - Root module
  - **auth/** - Authentication module (controllers, services, DTOs, entities)
  - **common/** - Shared: constants, decorators, entities, enums, exceptions, filters, helpers, interceptors, interfaces, repositories, services, types, utils
  - **core/** - Core module
  - **modules/** - Feature modules

## Testing Notes
- Jest config: `rootDir: "src"` (tests must be in src, not root)
- Test files: `*.spec.ts`
- E2E config: `test/jest-e2e.json`

## Key Dependencies
- NestJS 11.x
- MongoDB (mongoose)
- JWT authentication (@nestjs/jwt, passport-jwt, passport-local)
- Validation (class-validator, class-transformer)
- Caching & throttling (@nestjs/cache-manager, @nestjs/throttler)
- Swagger (@nestjs/swagger)
- Config management (@nestjs/config with Joi)

## TypeScript
- Uses `ts-node` for dev, compiles to `dist/` for prod
- Paths configured via `tsconfig-paths` (use `@/` imports)