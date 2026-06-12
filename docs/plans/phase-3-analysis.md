# Phase 3 — Analysis (plan + council review)

Status: accepted (self-reviewed; owner asleep during the autonomous run).
TDD is mandatory here — these are the numbers the product exists to compute, so
every definition is pinned by a hand-checked test before implementation.

## Goal

Defection (rebel) score per MP and club cohesion per club, in `analysis/`,
computed from the **real stored votes**. Absences and ties handled explicitly;
**null where data is insufficient** (never a fabricated 0).

## Definitions (the contract the tests encode)

Only **ELECTRONIC** votings count (ON_LIST records `VOTE_VALID`, not a yes/no).
A "countable" vote is one the MP actually cast: `YES`, `NO`, or `ABSTAIN`.
`ABSENT` is not countable (absence is not defection). The club attributed to a
vote is the club recorded **on that vote** (club at the time of voting).

**Club majority position (per voting):** the single most common countable vote
among that club's members on that voting. If the top is tied (e.g. 4 YES / 4 NO)
→ **no majority** → that voting is excluded from defection denominators for that
club. A club needs ≥1 countable vote to have a position.

**Defection score (per MP):**
```
considered = ELECTRONIC votings where the MP cast a countable vote
             AND the MP's club had a majority position that voting
defections = considered votings where MP.vote != club_majority
score      = defections / considered      (None if considered == 0)
```
Range 0–1. Worked example pinned in tests: a club voting 7 YES / 1 NO → the lone
NO voter defected on that voting; the 7 did not.

**Club cohesion (per club):** mean **Rice index** across ELECTRONIC votings.
```
Rice(club, voting) = |yes - no| / (yes + no)     # countable yes/no only
cohesion(club)     = mean(Rice over votings where yes+no > 0)   (None if none)
```
Rice is the standard party-unity measure: 1.0 = perfectly unified, 0.0 = evenly
split. ABSTAIN/ABSENT are excluded from the Rice numerator/denominator.

## Architecture

```
analysis/
  metrics.py          # PURE functions over VoteRecord — the TDD target
  data.py             # psycopg reader: stored ELECTRONIC votes -> VoteRecord[]
  voting_patterns.py  # public API (club_cohesion(term), rebel_score(mp_id))
```

Same shape as ingestion: a pure core (no I/O, fully fixture-testable) plus a
thin DB-reading shell. `VoteRecord = (voting_id, mp_id, club, vote)`.

## Provenance / honesty

`rebel_score` and `club_cohesion` return `None` (not 0) when the input is
insufficient (no countable votes / no majority / empty club). The DB reader
filters to `kind = 'ELECTRONIC'`; nothing is invented. Derived numbers will
carry their term + the run's data extent when surfaced by the API (Phase 4).

## Tests (hand-checked fixtures, written first)

1. majority: 7 YES / 1 NO → YES; 4/4 tie → None; single voter → that vote.
2. defection: the lone dissenter scores 1.0 on a unanimous-but-one voting; a
   with-the-line voter scores 0.0; mixed across votings → exact fraction.
3. absence: ABSENT never counts as defection and never inflates the denominator.
4. insufficient: MP with only ABSENT votes → None; empty club → None cohesion.
5. cohesion: 7/1 split → Rice 0.75; unanimous → 1.0; 5 YES/5 NO → 0.0;
   abstains ignored.
6. (DB-gated) end-to-end against the ingested term-10 data: scores are within
   [0,1] and a known unanimous voting contributes cohesion 1.0.

## Council review (self-conducted)

**Statistician.** Rice vs Agreement Index (Hix/Attinà)? Rice chosen: simpler,
directly hand-checkable, and the canonical unity measure; AI mainly differs in
how it folds abstentions, which we deliberately exclude. Defection against the
*modal* position (not just YES-vs-NO) is correct because abstaining with a
majority-abstain club is not defection. Tie handling must drop the voting, not
pick arbitrarily → encoded as None-majority.

**Honesty auditor.** The 0-vs-None distinction is the crux: an MP who never cast
a countable vote must be `None`, not a loyal-looking 0.0. Pinned by test 4.

**Data engineer.** Compute the club position once per (voting, club), not per
MP, to stay O(votes). Read only ELECTRONIC votes from the DB. Pure core means
no DB needed for the maths tests; one gated integration test guards the wiring.

**Test engineer.** Fixtures are tiny hand-built vote sets with arithmetic done
by hand in the test, so a definition change can't silently pass. Verdict:
proceed; Rice + modal-defection + None-on-insufficient.
