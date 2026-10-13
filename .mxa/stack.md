# Stack Map — daybook-public   (greenfield · **prototype** · internal, published openly)

**Boundary:** none. Tasks live in the visitor's browser. The only server code is a route that fetches iCloud calendar feeds (https *.icloud.com only).

**Baselines:** evergreen + Safari 17+ · current iPhone, one Android, a laptop · 375 / 1280 · WCAG 2.2 AA (defaults, unconfirmed: prototype) · MIT-family licences

| Stage | Purpose | Tool | Source | Status |
|-------|---------|------|--------|--------|
| Plan    | spec      | in-repo markdown (docs/specs/daybook.md) | ideal-default | added |
| Plan    | track     | — (tasks live in the spec)  | none           | gap |
| Design  | tokens    | @designtools/tokens          | ideal-default  | added |
| Design  | ui        | Base UI                      | ideal-default  | present |
| Design  | motion    | CSS + motion                 | ideal-default  | added |
| Design  | system    | ds/ folder (internal), no docs yet | ideal-default | gap |
| Build   | framework | Next.js + React + TS         | ideal-default  | present |
| Build   | styling   | Tailwind v4                  | ideal-default  | present |
| Build   | api       | none (browser storage) + iCloud feed route | none | present |
| Build   | auth      | —                            | none           | no private pages |
| Verify  | tests     | jest (unit, 40 tests)        | ideal-default  | added |
| Verify  | precommit / pr / merge / promote | lefthook+biome / lean / github-checks / — | ideal-default | gap |
| Ship    | deploy    | Vercel (vcs: github), daybook-three-wheat.vercel.app | ideal-default  | added |
| Operate | observe / measure | Sentry / PostHog     | ideal-default  | gap |

**Gaps to fill now:** none for a prototype. Not gaps: auth (nothing private).
