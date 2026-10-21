# Mini Pokédex

> Enterprise-grade Single Page Application built with **Angular 21**, **Signals**, **RxJS Custom Store**, **TypeScript + TypeORM + SQLite Backend**, **GraphQL Resolvers**, and **JWT Authentication**.

---

## 🌟 Key Architecture & Features

### 1. Front-End Architecture
- **Angular 21 Standalone Components**: Modern signal-based inputs/outputs (`input()`, `output()`), zero legacy decorators, 100% `ChangeDetectionStrategy.OnPush`.
- **Custom RxJS State Management** (No NgRx/Akita/NgXS):
  - `PokemonStore`: `BehaviorSubject`-based store caching catalog data, with `shareReplay(1)` and resilient retry backoff.
  - `pokemon.selectors.ts`: Composable derived selector streams (`combineLatest`, `distinctUntilChanged`, `map`).
  - `TeamStore`: Optimistic state machine for team creation/deletion with automatic snapshot rollback and toast notifications on failure.
- **Signals Bridge**: Store selector streams bridged via `toSignal()` into templates, plus `computed()` signals for real-time team stats aggregate and type distribution.
- **Optimized CDK Virtual Infinite Scroll**:
  - Utilizes `@angular/cdk/scrolling` (`cdk-virtual-scroll-viewport`) with fixed item size (64px) and DOM recycling.
  - `IntersectionObserver` sentinel anchor prefetching subsequent pages before reaching the bottom.
  - Zero layout shifts with shimmer skeleton rows (`%sk-shimmer`).
- **Interactive Detail Panel**:
  - 393px slide-in drawer displaying animated **ECharts (`ngx-echarts`) Radar Chart** of base stats, official artwork, and abilities.
- **Strict Reactive Forms UX**:
  - Team builder with debounced **asynchronous uniqueness validator** against existing teams.
  - Pokémon typeahead autocomplete picker displaying selected members as removable chips (min 1, max 6).
  - Inline error feedback respecting `dirty`/`touched` states (zero alerts).

### 2. Microservice Backend & Persistence
- **TypeScript + TypeORM + SQLite**:
  - Standalone backend microservice running on port `4000`.
  - Database: `server/database/pokedex.sqlite` file-backed persistence.
  - Entities: `TrainerEntity` and `TeamEntity`.
  - Auto-seeder initializes default trainers (Ash Ketchum, Misty Waterflower) with hashed passwords and starter teams.
- **GraphQL API Resolvers**:
  - Queries: `teams`, `team(id)`, `trainers`, `me`.
  - Mutations: `createTeam`, `deleteTeam`, and `login`.
- **JWT Token Authentication & Interceptors**:
  - Signed tokens generated on login and stored securely in `CacheService`.
  - Angular `JwtInterceptor` injecting `Authorization: Bearer <token>`.
  - Functional `authGuard` and `homeGuard` protecting routes.

### 3. Evaluator Advantage: Interactive "Network Chaos Toggle"
- Located directly in the top header:
  - 🟢 **Online (Normal)**: Default operation.
  - 🟡 **Slow 3G Latency**: Injects synthetic latency (2500ms) to inspect loading skeletons.
  - 🔴 **Network Offline / Error**: Injects synthetic network failure to immediately demonstrate the **Error State** and the interactive **Retry** action with one click!

### 4. Multi-Tier Caching System
1. **Tier 1 - In-Memory RxJS Cache**: Instant memory resolution for already fetched Pokémon batches.
2. **Tier 2 - Persistent Browser Storage**: `CacheService` backing active session tokens and teams with TTL expiry.
3. **Tier 3 - Sprite Preload Cache**: In-app memory map caching decoded sprite objects.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20.19+ or v22.12+ (v22 recommended)
- **NPM**: v10+

### Single-Command Start (Concurrent Backend + Frontend)
```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start both the TypeScript TypeORM backend (:4000) and Angular app (:4200)
npm run dev
```

The application will be live at:
- Frontend Client: `http://localhost:4200`
- Backend GraphQL Microservice: `http://localhost:4000/graphql`

### Default Demo Credentials
- **Ash Ketchum**: `ash@pokemon.com` / `pikachu123`
- **Misty Waterflower**: `misty@pokemon.com` / `pikachu123`

---

## 🧪 Running Unit Tests

Unit tests are written with **Vitest**:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage Highlights:
- ✅ **Optimistic Store Rollback** (`team.store.spec.ts`): Verifies immediate UI update and automatic rollback to snapshot on server error.
- ✅ **Derived Selectors** (`pokemon.selectors.spec.ts`): Verifies query debouncing, type filtering, and multi-stat sorting.
- ✅ **Async Form Validator** (`team-name.validator.spec.ts`): Tests 300ms debounced team name uniqueness checks.
- ✅ **Multi-Tier Cache** (`cache.service.spec.ts`): Verifies in-memory retrieval and TTL expiration.
- ✅ **Root Application** (`app.spec.ts`): Verifies component initialization.

---

## 📁 Project Directory Structure

```
angualr_assignment/
├── server/                                    # TypeScript + TypeORM Microservice (Port 4000)
│   ├── src/
│   │   ├── index.ts                           # Server entrypoint with GraphQL Yoga
│   │   ├── data-source.ts                     # TypeORM SQLite configuration
│   │   ├── entities/
│   │   │   ├── trainer.entity.ts              # Trainer/User entity
│   │   │   └── team.entity.ts                 # Team entity (JSON pokemon_ids)
│   │   ├── schema/
│   │   │   └── type-defs.ts                   # GraphQL schema SDL
│   │   ├── resolvers/
│   │   │   ├── auth.resolver.ts               # Login mutation & JWT issuance
│   │   │   └── team.resolver.ts               # Teams query, createTeam, deleteTeam
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts             # JWT header parser
│   │   └── seed/
│   │       └── initial-seed.ts                # Auto-seeder for starter teams
│   └── database/
│       └── pokedex.sqlite                     # SQLite persistent storage
│
└── src/                                       # Angular 21 Standalone Frontend (Port 4200)
    ├── styles.scss                            # CSS custom properties & design tokens
    └── app/
        ├── core/                              # Infrastructure singletons
        │   ├── auth/                          # AuthService, authGuard, homeGuard
        │   ├── interceptors/                  # jwtInterceptor, errorInterceptor, chaosInterceptor
        │   └── services/                      # logger, notification, chaos
        ├── common/                            # Shared components & utilities
        │   ├── components/
        │   │   ├── data-state-view/           # 4-State UI container (loading/empty/error/data)
        │   │   ├── skeleton-loader/           # %sk-shimmer loader
        │   │   ├── toast/                     # Feedback toast notification container
        │   │   └── header/                    # Top navigation with Evaluator Chaos Toggle
        │   └── services/
        │       └── cache.service.ts           # Storage + memory cache per Developer Guide
        ├── auth/                              # Login page component (Signals + RxJS)
        ├── pokedex/                           # Pokédex Feature (Microservice Domain 1)
        │   ├── state/
        │   │   ├── pokemon.store.ts           # BehaviorSubject cache store + pagination
        │   │   └── pokemon.selectors.ts       # Derived filtered/sorted streams
        │   └── components/
        │       ├── pokemon-table/             # CDK virtual infinite scroll table
        │       └── pokemon-detail-panel/      # Animated ECharts radar chart panel
        └── teams/                             # Teams Feature (Microservice Domain 2)
            ├── state/
            │   └── team.store.ts              # Optimistic updates + snapshot rollback
            ├── validators/
            │   └── team-name.validator.ts     # Debounced async uniqueness validator
            └── components/
                ├── team-list/                 # Grid/list of SQLite persisted teams
                └── team-builder/              # Reactive form + typeahead chip picker
```

---

## 🔮 What I Would Improve With More Time

1. **Progressive Web App (PWA) Offline Engine**: Add `@angular/service-worker` to enable fully offline browsing of cached Pokémon sprites and teams when disconnected from the internet.
2. **Web Worker Chart Calculation**: Offload stat calculations and type weakness/advantage matrices to a background Web Worker for extreme performance on low-end mobile devices.
3. **CDK Drag & Drop Team Roster**: Implement `@angular/cdk/drag-drop` to allow dragging Pokémon directly from the table into squad slots and re-ordering team priority.
4. **End-to-End Test Suite**: Add comprehensive Playwright test suites covering throttled offline network recovery, optimistic rollback assertions, and team creation workflows.
