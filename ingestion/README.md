# Data ingestion module

Mirrors open data from the [Sejm API](https://api.sejm.gov.pl) into PostgreSQL:
terms, MPs, clubs, sittings, and votings.

- `sejm_client.py` — thin wrapper over the Sejm REST API (skeleton).

Status: skeleton. Method signatures are defined; request and persistence logic
are not implemented yet.
