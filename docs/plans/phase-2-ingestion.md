# Phase 2 — Ingestion (plan + council review)

Status: accepted (self-reviewed; owner asleep during the autonomous build run).
Source of truth for shapes: live `https://api.sejm.gov.pl` payloads captured
2026-06-11 (see `tests/fixtures/sejm/`). Honesty rule applies — real source
only; fail loudly and store null where data is genuinely absent.

## Goal (from CLAUDE_BUILD Phase 2)

Replace the Sejm client skeleton with a real `httpx` client (terms, MPs, clubs,
votings, individual votes); a PostgreSQL schema + migrations with upsert and
incremental sync since the last voting. **Done when:** a real run populates the
DB from the API, with parsing covered by fixture tests.

## Verified API surface (term 10, captured 2026-06-11)

| Resource | Endpoint | Shape (relevant fields) |
|---|---|---|
| Terms | `GET /sejm/term` | `[{num, from, to?, current, prints}]` |
| MPs | `GET /sejm/term{t}/MP` | 499 × `{id, firstName, lastName, secondName?, club, districtName, districtNum, voivodeship, active, birthDate?, profession?}` |
| Clubs | `GET /sejm/term{t}/clubs` | 11 × `{id, name, membersCount, members:[{id, firstName, lastName, function?, joinDate}]}` |
| Proceedings | `GET /sejm/term{t}/votings` | 148 × `{date, proceeding, votingsNum}` (one row per sitting-day) |
| Sitting votings | `GET /sejm/term{t}/votings/{p}` | summaries × `{sitting, votingNumber, date, title, topic, description, kind, yes, no, abstain, notParticipating, totalVoted, majorityType?, majorityVotes?, sittingDay}` |
| Voting detail | `GET /sejm/term{t}/votings/{p}/{n}` | summary + `votes:[{MP, club, vote}]`, `vote ∈ {YES, NO, ABSTAIN, ABSENT}`, `kind ∈ {ELECTRONIC, ON_LIST}` |

Key facts that shape the design:
- MP `id` is unique **within a term** → composite key `(term, id)`.
- `proceeding` (a.k.a. sitting) spans multiple days; `votingNumber` is unique
  within a proceeding. The proceedings list is per-day, so expected votings for
  a proceeding = **sum of `votingsNum`** across its days.
- The per-MP `club` is recorded **on each vote** — this is the correct club for
  cohesion/defection (club at the time of the vote), better than current MP.club.
- `ON_LIST` votings (e.g. electing the Marshal) record list choices, not
  YES/NO; their per-MP `vote` is not a simple value → store null, let analysis
  ignore them.

## Architecture

```
ingestion/
  models.py       # dataclasses + pure from_api() parsers (TDD target)
  sejm_client.py  # httpx client; one method per endpoint, returns models
  db.py           # psycopg connection from DATABASE_URL
  migrations/     # 0001_initial.sql … (plain SQL, forward-only)
  migrate.py      # applies pending migrations, tracks schema_migrations
  repository.py   # idempotent upserts + incremental-state queries
  sync.py         # orchestration: full + incremental; CLI entry (__main__)
```

### Schema (PostgreSQL)

- `terms(num PK, date_from, date_to, current, fetched_at)`
- `mps(term, id, first_name, last_name, second_name, club, district_name,
  district_num, voivodeship, active, birth_date, profession, fetched_at,
  PK(term,id))` FK term→terms
- `clubs(term, id, name, members_count, fetched_at, PK(term,id))`
- `votings(term, sitting, voting_number, voted_at, title, topic, description,
  kind, yes, no, abstain, not_participating, total_voted, majority_type,
  majority_votes, sitting_day, fetched_at, PK(term,sitting,voting_number))`
- `mp_votes(term, sitting, voting_number, mp_id, club, vote, PK(term,sitting,
  voting_number,mp_id))` FK→votings; `vote` nullable text + CHECK in the known
  set or null

`fetched_at` on every table = provenance. A `schema_migrations(version,
applied_at)` table tracks DDL.

### Incremental sync ("since the last voting")

1. Fetch proceedings list → `expected[proceeding] = Σ votingsNum`.
2. For each proceeding `p`: `stored = count(votings where sitting=p)`. If
   `stored < expected[p]`, fetch `/votings/{p}` summaries and the **detail** for
   each missing `votingNumber` only; upsert.
3. Finished proceedings are skipped → naturally resumable/idempotent. A full
   run is just an incremental run against an empty DB.

This is idempotent (upserts) and re-entrant; re-running fetches only the gap.

### Verification run (honest + bounded)

The full term is thousands of votings × 460 MPs = thousands of HTTP calls. The
real run for the done-criterion is **bounded** (e.g. `--max-votings 40`) but
genuinely hits the live API and writes real rows. This is stated, not hidden;
the same command without the bound performs a full ingest. If the API is
unreachable, the run **fails loudly** (non-zero exit), never seeds fake data.

## Testing

- **Parsing (offline, deterministic):** real captured payloads in
  `tests/fixtures/sejm/`; unit tests on every `from_api()` incl. ABSENT votes,
  missing optional fields, and ON_LIST → null vote.
- **Client (respx):** mock httpx to assert URL construction + model integration
  without network.
- **Repository (real Postgres):** upsert idempotency + incremental gap detection
  against the live local cluster; skipped automatically if `DATABASE_URL` is
  unset so the suite stays green in CI without a DB.

---

## Council review (self-conducted)

Four lenses applied to the plan above; changes folded back in.

**1. Data engineer.** Risk: per-day proceedings vs per-proceeding voting
numbering could double-count or miss. → Resolved by summing `votingsNum` per
proceeding and counting stored rows per `sitting`. Risk: rate/volume on full
run. → Bounded verification run + incremental resumability; add a small polite
delay/timeout and reuse one client connection.

**2. DB architect.** Composite keys correct (term-scoped MP ids). `mp_votes`
without FK to `mps` is deliberate — a vote's club/MP is authoritative even if the
MP list lags; enforce FK only to `votings` (the parent we always ingest first).
`vote` as nullable text + CHECK rather than a PG enum, so a new API value never
hard-fails ingestion (forward-compatible; analysis whitelists values).

**3. Honesty/provenance auditor.** `fetched_at` per row satisfies provenance.
Bounded run must be labelled in output and docs (done). Null-on-absence for
ON_LIST and missing fields (done). No fabrication path exists: failure → raise.

**4. Test engineer.** Parsing must be a pure function of input (no I/O) to be
fixture-testable → `from_api` classmethods, client only does I/O. DB tests gated
on `DATABASE_URL` to avoid a hard CI dependency now (CI Postgres comes in
Phase 8). Fixtures are real captures, not hand-typed, to avoid schema drift.

**Verdict:** proceed. The one call that needed a decision — enum vs text for
`vote` — goes to **text + CHECK** for forward-compatibility, matching the
honesty/robustness bar.
