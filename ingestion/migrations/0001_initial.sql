-- CivicLens initial schema (Phase 2).
-- Mirrors the Sejm API resources verified 2026-06-11. Every table carries
-- fetched_at as provenance. Keys are term-scoped because MP ids and voting
-- numbers are only unique within a term / proceeding.

CREATE TABLE IF NOT EXISTS terms (
    num         integer PRIMARY KEY,
    date_from   date NOT NULL,
    date_to     date,
    current     boolean NOT NULL DEFAULT false,
    fetched_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mps (
    term          integer NOT NULL REFERENCES terms(num),
    id            integer NOT NULL,
    first_name    text NOT NULL,
    last_name     text NOT NULL,
    second_name   text,
    club          text,
    district_name text,
    district_num  integer,
    voivodeship   text,
    active        boolean NOT NULL DEFAULT false,
    birth_date    date,
    profession    text,
    fetched_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (term, id)
);

CREATE TABLE IF NOT EXISTS clubs (
    term          integer NOT NULL REFERENCES terms(num),
    id            text NOT NULL,
    name          text NOT NULL,
    members_count integer NOT NULL DEFAULT 0,
    fetched_at    timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (term, id)
);

CREATE TABLE IF NOT EXISTS votings (
    term              integer NOT NULL REFERENCES terms(num),
    sitting           integer NOT NULL,
    voting_number     integer NOT NULL,
    voted_at          timestamptz NOT NULL,
    title             text NOT NULL,
    topic             text,
    description       text,
    kind              text NOT NULL,
    yes               integer NOT NULL DEFAULT 0,
    no                integer NOT NULL DEFAULT 0,
    abstain           integer NOT NULL DEFAULT 0,
    not_participating integer NOT NULL DEFAULT 0,
    total_voted       integer NOT NULL DEFAULT 0,
    majority_type     text,
    majority_votes    integer,
    sitting_day       integer,
    fetched_at        timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (term, sitting, voting_number)
);

CREATE TABLE IF NOT EXISTS mp_votes (
    term          integer NOT NULL,
    sitting       integer NOT NULL,
    voting_number integer NOT NULL,
    mp_id         integer NOT NULL,
    club          text,
    -- Raw API value. VOTE_VALID = ON_LIST voting; analysis whitelists YES/NO/ABSTAIN.
    vote          text CHECK (vote IN ('YES', 'NO', 'ABSTAIN', 'ABSENT', 'VOTE_VALID')),
    PRIMARY KEY (term, sitting, voting_number, mp_id),
    FOREIGN KEY (term, sitting, voting_number)
        REFERENCES votings(term, sitting, voting_number) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mp_votes_mp ON mp_votes(term, mp_id);
CREATE INDEX IF NOT EXISTS idx_mp_votes_club ON mp_votes(term, club);
