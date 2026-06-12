"""Parsing tests — pure, offline, against real captured payloads."""

from __future__ import annotations

from datetime import date

from ingestion.models import MP, VOTE_VALUES, Club, ProceedingDay, Term, Voting


def test_parse_current_term(load_fixture) -> None:
    terms = [Term.from_api(t) for t in load_fixture("terms.json")]
    current = terms[-1]
    assert current.num == 10
    assert current.current is True
    assert current.date_from == date(2023, 11, 13)


def test_parse_mp_full_record(load_fixture) -> None:
    mp = MP.from_api(load_fixture("mps.json")[0], term=10)
    assert mp.id == 1
    assert mp.last_name == "Adamczyk"
    assert mp.club == "PiS"
    assert mp.district_num == 13
    assert mp.active is True
    assert mp.birth_date == date(1959, 1, 4)


def test_parse_mp_tolerates_missing_optionals() -> None:
    mp = MP.from_api({"id": 99, "firstName": "Jan", "lastName": "Kowalski"}, term=10)
    assert mp.second_name is None
    assert mp.club is None
    assert mp.district_num is None
    assert mp.birth_date is None
    assert mp.active is False


def test_parse_club(load_fixture) -> None:
    club = Club.from_api(load_fixture("clubs.json")[0], term=10)
    assert club.id == "Centrum"
    assert club.members_count == 15
    assert "Centrum" in club.name


def test_parse_proceeding_day(load_fixture) -> None:
    day = ProceedingDay.from_api(load_fixture("proceedings.json")[0])
    assert day.proceeding == 1
    assert day.votings_num == 8
    assert day.date == date(2023, 11, 13)


def test_parse_electronic_voting_with_votes(load_fixture) -> None:
    voting = Voting.from_api(load_fixture("voting_electronic.json"))
    assert voting.kind == "ELECTRONIC"
    assert voting.term == 10
    assert voting.sitting == 1
    assert voting.voting_number == 8
    assert len(voting.votes) == 15
    first = voting.votes[0]
    assert first.mp_id == 1
    assert first.vote in {"YES", "NO", "ABSTAIN", "ABSENT"}
    assert first.club == "PiS"


def test_parse_on_list_voting_keeps_raw_vote_value(load_fixture) -> None:
    voting = Voting.from_api(load_fixture("voting_on_list.json"))
    assert voting.kind == "ON_LIST"
    # ON_LIST records VOTE_VALID; analysis ignores it, ingestion stores it as-is.
    assert {v.vote for v in voting.votes} == {"VOTE_VALID"}


def test_parse_quorum_voting_present_is_a_known_vote_value(load_fixture) -> None:
    voting = Voting.from_api(load_fixture("voting_quorum.json"))
    assert voting.topic == "wniosek o stwierdzenie kworum"
    # Quorum roll-calls record PRESENT/ABSENT; both must be storable values.
    assert {v.vote for v in voting.votes} == {"PRESENT", "ABSENT"}
    assert {v.vote for v in voting.votes} <= VOTE_VALUES


def test_summary_without_votes_has_empty_votes(load_fixture) -> None:
    summary = Voting.from_api(load_fixture("sitting_votings.json")[0])
    assert summary.votes == ()
