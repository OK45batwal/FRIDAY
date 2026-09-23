"""Bounded LRU sliding-window rate limiter for HTTP and WebSocket sessions."""

import time
from collections import OrderedDict
from typing import Optional


class BoundedRateLimiter:
    """Sliding-window rate limiter with bounded capacity and automatic expiration."""

    def __init__(self, max_keys: int = 10000):
        self.max_keys = max_keys
        self._cache: OrderedDict[str, list[float]] = OrderedDict()

    def check(self, key: str, max_requests: int = 120, window_seconds: int = 60) -> bool:
        """Check if request for `key` is permitted under the rate limit."""
        now = time.time()
        cutoff = now - window_seconds

        # Retrieve or initialize timestamps
        timestamps = self._cache.get(key)
        if timestamps is not None:
            # Move to MRU position
            self._cache.move_to_end(key)
            # Prune expired timestamps
            filtered = [t for t in timestamps if t > cutoff]
        else:
            filtered = []

        if len(filtered) >= max_requests:
            self._cache[key] = filtered
            return False

        filtered.append(now)
        self._cache[key] = filtered

        # Enforce LRU capacity bound
        while len(self._cache) > self.max_keys:
            self._cache.popitem(last=False)

        return True

    def reset(self):
        """Clear all rate limit history."""
        self._cache.clear()


# Global rate limiter instance
rate_limiter = BoundedRateLimiter(max_keys=10000)


def check_rate_limit(key: str, max_requests: int = 120, window_seconds: int = 60) -> bool:
    """Check rate limit using global limiter instance."""
    return rate_limiter.check(key, max_requests=max_requests, window_seconds=window_seconds)
