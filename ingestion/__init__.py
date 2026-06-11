"""Data ingestion package.

Mirrors open data from the Sejm REST API into PostgreSQL. ``sejm_client`` does
the HTTP I/O, ``models`` parses payloads into typed records, ``repository`` and
``migrate`` handle persistence, and ``sync`` orchestrates a full or incremental
run (``python -m ingestion``).
"""
