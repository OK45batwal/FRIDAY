"""Security & Trust Boundary tests for Batch P0-A (CR-01, CR-02, WR-03)."""

import pytest
from backend.config.settings import settings, validate_settings


def test_loopback_guard_allows_local_hosts(monkeypatch):
    """Verify loopback hosts are allowed in all environments."""
    for local_host in ["127.0.0.1", "localhost", "::1"]:
        monkeypatch.setattr(settings, "HOST", local_host)
        monkeypatch.setattr(settings, "ENVIRONMENT", "development")
        monkeypatch.setattr(settings, "FRIDAY_ALLOW_REMOTE", False)
        assert validate_settings() == settings


def test_loopback_guard_aborts_on_public_bind_in_development(monkeypatch):
    """Verify non-loopback binding aborts in development."""
    monkeypatch.setattr(settings, "HOST", "0.0.0.0")
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "FRIDAY_ALLOW_REMOTE", False)
    with pytest.raises(RuntimeError) as exc:
        validate_settings()
    assert "Refusing to bind to non-loopback host" in str(exc.value)


def test_loopback_guard_aborts_in_production_without_remote_flag(monkeypatch):
    """Verify non-loopback binding aborts in production if FRIDAY_ALLOW_REMOTE is false."""
    monkeypatch.setattr(settings, "HOST", "0.0.0.0")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "FRIDAY_ALLOW_REMOTE", False)
    with pytest.raises(RuntimeError) as exc:
        validate_settings()
    assert "FRIDAY_ALLOW_REMOTE=true" in str(exc.value)


def test_loopback_guard_permits_public_bind_with_explicit_flags(monkeypatch):
    """Verify non-loopback binding succeeds only when both production and allow_remote are set."""
    monkeypatch.setattr(settings, "HOST", "0.0.0.0")
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "FRIDAY_ALLOW_REMOTE", True)
    assert validate_settings() == settings


def test_bounded_rate_limiter():
    """Verify rate limiter blocks requests exceeding threshold and respects max_keys."""
    from backend.utils.ratelimit import BoundedRateLimiter

    limiter = BoundedRateLimiter(max_keys=3)
    # Under limit
    assert limiter.check("test-client", max_requests=2, window_seconds=60) is True
    assert limiter.check("test-client", max_requests=2, window_seconds=60) is True
    # Limit exceeded
    assert limiter.check("test-client", max_requests=2, window_seconds=60) is False

    # Capacity eviction
    limiter.check("client-1", max_requests=5, window_seconds=60)
    limiter.check("client-2", max_requests=5, window_seconds=60)
    limiter.check("client-3", max_requests=5, window_seconds=60)
    # Oldest key 'test-client' should be evicted
    assert len(limiter._cache) <= 3


def test_api_key_auth_enforcement(client, monkeypatch):
    """Verify anonymous access is denied when API key is set, but health remains open."""
    test_key = "super-secret-key-123"
    monkeypatch.setattr(settings, "FRIDAY_API_KEY", test_key)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    # Health remains public
    res_health = client.get("/api/health")
    assert res_health.status_code == 200

    # Protected routes fail with 401 anonymously
    res_anon = client.get("/api/conversations")
    assert res_anon.status_code == 401

    # Wrong key fails with 401
    res_bad = client.get("/api/conversations", headers={"X-API-Key": "wrong-key"})
    assert res_bad.status_code == 401

    # Valid X-API-Key succeeds
    res_good_header = client.get("/api/conversations", headers={"X-API-Key": test_key})
    assert res_good_header.status_code == 200

    # Valid Authorization: Bearer succeeds
    res_good_bearer = client.get("/api/conversations", headers={"Authorization": f"Bearer {test_key}"})
    assert res_good_bearer.status_code == 200


def test_api_key_dev_mode_bypass(client, monkeypatch):
    """Verify when key is unset in development mode, requests pass anonymously."""
    monkeypatch.setattr(settings, "FRIDAY_API_KEY", None)
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    res = client.get("/api/conversations")
    assert res.status_code == 200


def test_websocket_auth_and_origin_checks(client, monkeypatch):
    """Verify WebSocket handshake enforces Origin allowlist and API key auth."""
    test_key = "ws-secret-456"
    monkeypatch.setattr(settings, "FRIDAY_API_KEY", test_key)
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")

    # 1. Reject unauthorized origin
    with pytest.raises(Exception):
        with client.websocket_connect("/ws/voice", headers={"Origin": "http://evil-attacker.com"}) as ws:
            pass

    # 2. Reject unauthenticated connection
    with pytest.raises(Exception):
        with client.websocket_connect(
            "/ws/voice",
            headers={"Origin": "http://localhost:3000"}
        ) as ws:
            pass

    # 3. Accept with valid API key and valid Origin
    with client.websocket_connect(
        f"/ws/voice?api_key={test_key}",
        headers={"Origin": "http://localhost:3000"}
    ) as ws:
        msg = ws.receive_json()
        assert msg["type"] == "connected"

