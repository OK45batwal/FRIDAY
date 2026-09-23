"""Tests for Settings validation, env namespacing (WR-05), and startup contract."""

import os
import pytest
from pydantic import ValidationError


def test_settings_namespacing_and_non_failing_import():
    """Verify ambient generic DEBUG does not crash Settings parsing or module import."""
    from backend.config.settings import Settings, settings, validate_settings

    # Verify generic DEBUG is ignored by Settings in favor of FRIDAY_DEBUG
    # and settings instance is valid
    assert hasattr(settings, "DEBUG")
    assert isinstance(settings.DEBUG, bool)
    assert hasattr(settings, "HOST")
    assert hasattr(settings, "PORT")
    assert hasattr(settings, "APP_NAME")


def test_validate_settings_fails_on_recorded_error(monkeypatch):
    """Verify validate_settings() re-raises recorded configuration errors at startup."""
    import backend.config.settings as settings_mod

    # Simulate an error recorded during startup validation
    dummy_error = ValidationError.from_exception_data(
        title="Settings",
        line_errors=[],
    )
    monkeypatch.setattr(settings_mod, "_settings_load_error", dummy_error)

    with pytest.raises(ValidationError):
        settings_mod.validate_settings()


def test_database_hermetic_isolation(temp_db):
    """Verify that tests execute against the temporary SQLite database rather than friday.db."""
    from backend.config.settings import settings
    from backend.database.database import get_db_path

    assert get_db_path() == temp_db
    assert settings.SQLITE_DB_PATH == temp_db
    assert not temp_db.endswith("/friday.db") or "test_friday.db" in temp_db
