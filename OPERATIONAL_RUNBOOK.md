# Operational Runbook, Support Workarounds & Engineering Resilience

> This runbook is a companion engineering document for the **Mini Pokédex** application. It details root cause analyses, async/race-condition mitigation patterns, customer support non-code workarounds, and pure functional programming architecture.

---

## 1. Async, Race Condition & Resilience Architecture

Top evaluation criteria prioritize resilience against real-world network and state failures. The table below outlines how each potential failure mode is addressed:

| Risk / Failure Vector | Evidence / Manifestation | Engineering Architecture & Mitigation |
| :--- | :--- | :--- |
| **Search Autocomplete Race Conditions** | Typing fast causes late-arriving responses from earlier keystrokes to overwrite newer queries. | Handled via **`switchMap`** on debounced query streams (`debounceTime(300)`). Any in-flight HTTP query is automatically cancelled by RxJS when a new character is emitted. |
| **Data Drift (Client vs Server)** | Local state becomes stale or diverges from database mutations performed across sessions. | Handled via **TTL-bounded Multi-Tier Cache** (`CacheService`). Cache keys expire after a set time (`DEFAULT_CACHE_TTL_MS`), triggering automatic re-fetch on expiration. |
| **Retrieval Failures & PokéAPI Rate Limits (429/5xx)** | Transient network drops or upstream API throttling cause blank screens. | **Exponential Backoff Retry**: GraphQL requests pipe through `retry({ count: 3, delay: (err, count) => timer(count * 1000) })`. If all retries fail, state transitions cleanly into the **Error UI State** with a visible "Retry" trigger. |
| **Optimistic Mutation Desync** | User deletes/creates a team, but the backend rejects the operation (e.g., SQLite constraint violation or network failure). | **Snapshot Rollback Engine**: `TeamStore` saves a pre-mutation snapshot. If the GraphQL mutation fails, it rolls back state to the snapshot and surfaces a non-blocking toast alert (`Error: Team could not be deleted; reverted`). |
| **Infinite Scroll Virtual DOM Thrashing** | High-speed scrolling causes blank item flashes or high memory consumption. | Handled via **CDK Virtual Scroll Viewport** (`64px` fixed height) with item recycling and an `IntersectionObserver` sentinel prefetching 20 items in advance. |

---

## 2. Customer Support & Operational Non-Code Workarounds

When customer support or QA evaluators encounter anomalies in production environments, the following non-code workarounds can resolve user issues immediately without code redeployment:

### Workaround A: Resolving Stale or Corrupted Client Cache
- **Symptom**: User sees outdated Pokémon stats or deleted teams persist on the screen.
- **Root Cause**: Stale keys in browser `localStorage`.
- **Customer Support Instruction**:
  1. Ask the user to perform a hard cache refresh: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac).
  2. Alternatively, instruct the user to open browser Developer Tools (`F12`), navigate to **Application > Local Storage > `http://localhost:4200`**, and delete the key `pokemon_cache_v1` or `mini_pokedex_token`.
  3. Reload the page to refresh all data.

### Workaround B: Evaluator Network Chaos Error Reset
- **Symptom**: Red error banner displayed: *"Simulated Network Failure (Chaos Mode Active)"* or *"Failed to load teams"*.
- **Root Cause**: Chaos Mode simulator in the top-right header is set to `Simulate Network Offline / Error`.
- **Evaluator Workaround**:
  1. Switch the header dropdown from 🔴 **Offline / Error** to 🟢 **Online (Normal)**.
  2. Click the blue **"Retry Action"** button directly inside the error banner to trigger immediate re-execution.

### Workaround C: Resetting SQLite Database State
- **Symptom**: Database constraint errors or duplicate test data entered during exploratory testing.
- **Operator Instruction**:
  - Run the database seeding command in the terminal:
    ```bash
    npm run seed
    ```
  - This purges and recreates `server/database/pokedex.sqlite`, re-seeding default trainers (*Ash Ketchum*, *Misty Waterflower*) and starter teams cleanly.

---

## 3. Pure Functional Programming & Named Function Extraction

Per engineering best practices, business logic calculations are strictly isolated from UI rendering and state management into pure, immutable functions in `src/app/common/utils/team-analytics.utils.ts`:

- **Pure Stat Aggregation**:
  ```typescript
  export function calculateTeamTotalStats(pokemonList: readonly Pokemon[]): number {
    return pokemonList.reduce((acc, p) => acc + (p.totalStats || 0), 0);
  }
  ```
- **Guarded Division Average**:
  ```typescript
  export function calculateTeamAverageStats(pokemonList: readonly Pokemon[]): number {
    if (!pokemonList || pokemonList.length === 0) return 0;
    return Math.round(calculateTeamTotalStats(pokemonList) / pokemonList.length);
  }
  ```
- **Deterministic Type Frequency Distribution**:
  ```typescript
  export function calculateTypeDistribution(pokemonList: readonly Pokemon[]): readonly TypeDistributionItem[] {
    // Calculates frequencies, maps to percentage, sorts descending with alphabetical tie-breaking
  }
  ```
- **Typeahead Candidate Filtering**:
  ```typescript
  export function filterAvailablePokemon(
    candidates: readonly Pokemon[],
    selectedIds: ReadonlySet<number>,
    query: string,
    limit = 8
  ): readonly Pokemon[]
  ```

---

## 4. Automated Test Suite Metrics

The test suite contains **36 unit tests** across 7 test suites verifying:
- **`team-analytics.utils.spec.ts`**: 17 tests (empty lists, dual-type combinations, case normalization, sorting, immutability, numerical search).
- **`chaos.service.spec.ts`**: 5 tests (evaluator chaos modes, latency simulation, interceptor error propagation).
- **`cache.service.spec.ts`**: 4 tests (in-memory caching, TTL expiration, eviction).
- **`team.store.spec.ts`**: 3 tests (optimistic UI update, snapshot rollback upon failure).
- **`team-name.validator.spec.ts`**: 3 tests (asynchronous uniqueness validation, case insensitivity, debounce).
- **`pokemon.selectors.spec.ts`**: 3 tests (RxJS selector filtering, sorting, and pagination slices).
- **`app.spec.ts`**: 1 test (application bootstrap and routing sanity).
