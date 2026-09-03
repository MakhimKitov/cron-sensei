# cron-sensei

Paste a cron expression, get it in plain words — plus the next five runs.

Speaks the five-field syntax (`minute hour day-of-month month day-of-week`)
with `*`, plain numbers, comma lists, and three-letter month/day-of-week
names (case-insensitive; `7` is also accepted as Sunday). Ranges, steps,
`@aliases`, timezones and the POSIX day-of-month/day-of-week rule are
tracked in the issues — the error messages point at what is missing.

## Develop

```bash
npm install
npm run dev        # local server
npm test           # vitest
npm run typecheck  # tsc --noEmit
npm run build
```

The core is pure functions under `src/core/` — parsing, explaining and
next-run math never touch the DOM, so every behavior change lands with a
unit test. `src/main.ts` is the only file that talks to the page.
