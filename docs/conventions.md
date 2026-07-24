# File & Code Organization

How code is split across files in this base project — where every constant, type, interface, enum,
and reusable function must live so that logic files stay pure logic.
See also [architecture.md](./architecture.md) and [api.md](./api.md).

**This is a hard rule for any change, human or AI.** When you add a symbol, it goes in the matching
category file — appended to an existing file when a suitable one exists, or a new file created (and
re-exported through the folder barrel) when none fits. The codebase is already built this way; keep
it that way.

## Layout of a category

Every scope groups symbols by *kind* into a category folder, and every category folder ships an
`index.ts` barrel:

```
src/common/                 # shared / infrastructure (used by 2+ modules)
├── constants/
│   ├── global.constants.ts
│   ├── http.constant.ts
│   └── index.ts            # barrel: export * from './global.constants'; ...
├── enums/
├── interfaces/
├── types/
├── utils/
└── helpers/

src/modules/<feature>/      # feature-specific (used by one module)
├── constants/
├── enums/
├── interfaces/
├── helpers/
└── ...
```

## Where does each symbol go?

| Symbol | Folder | File suffix | Naming | Reference |
|---|---|---|---|---|
| Constants / magic values | `constants/` | `*.constant.ts` | `SCREAMING_SNAKE_CASE` | `src/common/constants/global.constants.ts` |
| Enums | `enums/` | `*.enum.ts` | `PascalCase` | `src/modules/auth/enums/roles.enum.ts` (`UserRoles`) |
| Interfaces | `interfaces/` | `*.interface.ts` | `PascalCase` (optional `...Interface` suffix) | `src/common/interfaces/config.interface.ts` |
| Type aliases | `types/` | `*.type.ts` | `PascalCase` | `src/common/types/global.type.ts` |
| Reusable pure utilities (generic) | `utils/` | `*.util.ts` | `camelCase` functions | `src/common/utils/string.util.ts` |
| Reusable domain helpers | `helpers/` | `*.helper.ts` | `camelCase` functions | `src/modules/auth/helpers/user.helper.ts` |

File names are kebab-case + the suffix above.

## The rules

1. **Logic files hold logic only.** Controllers, services, repositories, guards, strategies,
   filters, and interceptors must not declare exported constants, magic values, standalone
   types/interfaces, enums, or reusable pure functions inline. Extract them into the matching
   category folder.

2. **Group by domain/topic — not one symbol per file.** A category file collects the *related*
   symbols of its kind. `config.interface.ts` holds all six `*ConfigInterface` types
   (`AppConfigInterface`, `DatabaseConfigInterface`, `JwtConfigInterface`, `CacheConfigInterface`,
   `HttpConfigInterface`, `PostgresConfigInterface`); `global.constants.ts` holds the app-wide
   constants (`API_SUB_PATH`, `DEFAULT_PAGE`, `JWT_TIME`, …). Prefer **appending to the right
   existing file** over creating a new one; create a new topic file only when the symbol belongs to
   a genuinely new domain (e.g. `swagger.constant.ts`, `http.constant.ts`).

3. **Reuse before you create.** Before adding a helper/util, search the existing `utils/` and
   `helpers/` files for one that already does the job — `isEmail` / `isPasswordValid`
   (`string.util.ts`), `encodeCursor` / `decodeCursor` (`cursor.util.ts`), `compareUserPassword` /
   `toAuthResponse` (`user.helper.ts`). `utils/` = generic and pure; `helpers/` = domain-aware.

4. **Barrels, always.** Every new file in a category folder must be re-exported from that folder's
   `index.ts`. Imports use the **folder specifier**, never a deep path to the individual file:

   ```ts
   import { API_SUB_PATH } from 'src/common/constants'; // ✅ barrel
   import { UserRoles } from '../enums';                // ✅ relative barrel
   import { API_SUB_PATH } from 'src/common/constants/global.constants'; // ❌ deep path
   ```

   There is no `@/` alias — use `src/...` absolute specifiers (see [architecture.md](./architecture.md)).

5. **Shared vs feature placement.** If a symbol is used by more than one module, it belongs in
   `src/common/<category>/`. If it is specific to one feature, it belongs in that module's category
   folder (`src/modules/<feature>/<category>/`). `common/` must never import from `modules/` — the
   dependency direction is one-way.

6. Create narrowly scoped files only when a missing responsibility warrants it.

7. Update imports using configured path aliases.

8. Add or update unit tests for changed behavior.

9. Run lint, typecheck, tests, and build before considering the task complete.

## File ownership rule

Before adding code to an existing file, determine whether it has an independent responsibility.

Create or reuse a dedicated file when adding:
- A reusable helper or pure utility function.
- A domain, shared, or cross-file constant.
- An enum.
- A TypeScript interface used outside its defining file.
- A type used outside its defining file.
- A repository contract.
- A DTO, entity, schema, mapper, guard, decorator, filter, interceptor, or provider.

If a matching file already exists, extend it instead of creating a duplicate.

Keep declarations local only when ALL conditions apply:
- They are private to one file.
- They are not business/domain concepts.
- They are not expected to be reused.
- Extracting them would make navigation worse than keeping them local.

Never add reusable helpers, shared types, enums, or constants inside:
- Controllers
- Services
- Use cases
- Repositories
- Modules
- `main.ts`

## Decision checklist

Follow top-down when you're about to write a symbol:

1. Is it a constant/type/interface/enum/reusable function? → It does **not** belong inline in a
   logic file. Continue.
2. Which kind is it? → Pick the folder + suffix from the table above.
3. Is it used by 2+ modules? → `src/common/<category>/`. Otherwise → the feature's
   `src/modules/<feature>/<category>/`.
4. Does a topic file for this domain already exist? → **Append** to it. Otherwise → create a new
   kebab-case `*.suffix.ts` file.
5. New file? → Add `export * from './<file>';` to the folder's `index.ts`.
6. Import it through the folder barrel.

## Before / after

A constant inlined in a service:

```ts
// ❌ setting.service.ts
@Injectable()
export class SettingService {
  private readonly CACHE_TTL = 300000; // magic value living in logic
}
```

Extracted to its category file and imported through the barrel:

```ts
// ✅ src/common/constants/global.constants.ts  (append here)
export const CACHE_TIME_DURATION = 300000; // 5 min in ms

// ✅ src/common/constants/index.ts already re-exports global.constants

// ✅ setting.service.ts
import { CACHE_TIME_DURATION } from 'src/common/constants';
```

## Known Gaps

- **Granularity is intentionally coarse.** The rule is *domain-grouped files*, not one-symbol-per-file.
  Some interfaces are already grouped (`config.interface.ts` = six interfaces) while others are
  standalone because they stand alone in their domain
  (`interfaces/repositories/cursor-paginated-result.interface.ts` = one `CursorPaginatedResult<T>`).
  Both are correct; use judgment about what counts as "one domain."
- **This governs new additions, not a retro-refactor.** Existing files are not required to be split
  further to satisfy this doc. Move code into compliance opportunistically when you're already
  editing a file, not as a standalone sweep.
- **Schemas/entities are an exception by design.** A schema file colocates its document type alias
  and its factory with the class (e.g. `setting.schema.ts` exports `SettingDocument` + `Setting` +
  `SettingSchema` together) — see [database.md](./database.md#schema-conventions). Don't scatter
  those into `types/`.
