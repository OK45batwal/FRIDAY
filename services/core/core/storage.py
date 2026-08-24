"""Crash-safe JSON persistence shared by the memory and learning stores."""

import json
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)


def atomic_write_json(path: Path, data: Any) -> None:
    """
    Write JSON to a temp file in the same directory, fsync, then os.replace it
    into place.

    Both stores previously used a plain `open(path, "w") + json.dump`. That
    truncates the file before writing, so a crash, a full disk, or two
    overlapping writers left invalid JSON on disk. The loader then treated the
    unparseable file as empty and silently discarded every learned fact.
    os.replace is atomic within a filesystem: a reader sees either the complete
    old file or the complete new one.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_fd, tmp_name = tempfile.mkstemp(dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp")
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def load_json(path: Path, default: Any, *, expect: Optional[type] = None) -> Any:
    """
    Load JSON, quarantining the file instead of silently discarding it.

    An unreadable store is renamed to `<name>.corrupt` so the data can be
    recovered by hand, and a warning is logged. The previous behaviour reset to
    empty with no record that anything had been lost.
    """
    if not path.exists():
        return default
    try:
        with open(path, "r", encoding="utf-8") as f:
            loaded = json.load(f)
    except Exception:
        logger.warning("Store %s is unreadable; quarantining as .corrupt", path, exc_info=True)
        try:
            path.replace(path.with_suffix(path.suffix + ".corrupt"))
        except OSError:
            logger.warning("Could not quarantine %s", path, exc_info=True)
        return default

    if expect is not None and not isinstance(loaded, expect):
        logger.warning("Store %s had type %s, expected %s; ignoring.", path, type(loaded).__name__, expect.__name__)
        return default
    return loaded


def _self_check() -> None:
    import shutil

    tmpdir = Path(tempfile.mkdtemp())
    try:
        target = tmpdir / "store.json"

        # Round-trip.
        atomic_write_json(target, {"a": 1})
        assert load_json(target, {}, expect=dict) == {"a": 1}

        # No temp files left behind.
        assert list(tmpdir.glob("*.tmp")) == [], list(tmpdir.glob("*.tmp"))

        # Overwrite is atomic and complete (no trailing bytes from the old,
        # longer file — the bug a truncating write would produce).
        atomic_write_json(target, {"a": 1, "bbbbbbbbbbbbbbbb": 2})
        atomic_write_json(target, {"z": 0})
        assert load_json(target, {}, expect=dict) == {"z": 0}

        # Corrupt input is quarantined, not silently dropped, and the default
        # is returned so the caller keeps running.
        target.write_text("{not json", encoding="utf-8")
        assert load_json(target, {"fallback": True}, expect=dict) == {"fallback": True}
        assert target.with_suffix(".json.corrupt").exists(), "corrupt file was not quarantined"
        assert not target.exists()

        # Wrong top-level type is rejected rather than handed back.
        atomic_write_json(target, [1, 2, 3])
        assert load_json(target, {}, expect=dict) == {}
        assert load_json(target, [], expect=list) == [1, 2, 3]

        # Missing file returns the default without creating anything.
        assert load_json(tmpdir / "nope.json", "d") == "d"
        assert not (tmpdir / "nope.json").exists()

        print("storage self-check OK")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    _self_check()
