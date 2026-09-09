"""FRIDAY Structured Logging Utility."""

import logging
import sys
from backend.config.settings import settings

LOG_FORMAT = "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"


def get_logger(name: str) -> logging.Logger:
    """Return a configured logger with standard formatting."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(LOG_FORMAT, datefmt="%H:%M:%S")
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    level_name = getattr(settings, "LOG_LEVEL", "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)
    logger.setLevel(level)
    return logger
