"""Foundation smoke tests.

These confirm the test runner is wired up and the packages import. Real
behaviour is covered by the per-module test suites added in later phases
(ingestion parsing, defection score, cohesion, API routes).
"""

from api.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def test_packages_import() -> None:
    import analysis  # noqa: F401
    import ingestion  # noqa: F401


def test_health_endpoint_is_live() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_identifies_the_service() -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "civiclens"
