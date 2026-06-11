"""Analysis package.

Computes voting-pattern metrics over the Sejm data stored in PostgreSQL.
``metrics`` holds the pure maths (club majority, defection score, Rice
cohesion), ``data`` reads stored votes, and ``voting_patterns`` is the public
DB-backed API.
"""
