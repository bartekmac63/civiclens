-- Quorum roll-calls ("wniosek o stwierdzenie kworum") record vote = PRESENT,
-- e.g. term 10 sitting 18 voting 46 (2024-10-01). Widen the whitelist to match
-- ingestion.models.VOTE_VALUES.
ALTER TABLE mp_votes DROP CONSTRAINT mp_votes_vote_check;
ALTER TABLE mp_votes ADD CONSTRAINT mp_votes_vote_check
    CHECK (vote IN ('YES', 'NO', 'ABSTAIN', 'ABSENT', 'VOTE_VALID', 'PRESENT'));
