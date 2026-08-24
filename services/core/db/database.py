import logging

from sqlalchemy import event
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from services.core.app.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()


@event.listens_for(engine.sync_engine, "connect")
def _set_sqlite_pragmas(dbapi_connection, _connection_record):
    """
    SQLite ignores foreign keys unless asked, per connection.

    Message.conversation_id declares ondelete="CASCADE", but without this pragma
    SQLite silently ignored it, so deleting a conversation left its messages
    behind as unreachable orphans that still counted against disk. The pragma has
    to be set on every new connection, not once at startup, which is why this is
    a connect-event listener rather than a one-off statement.

    WAL is set for concurrency: the default rollback journal makes readers block
    on the writer, and this database is read by request handlers while the
    WebSocket path writes to it.
    """
    cursor = dbapi_connection.cursor()
    try:
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        # Wait for a lock instead of raising "database is locked" immediately.
        cursor.execute("PRAGMA busy_timeout=5000")
    except Exception:
        logger.warning("Failed to apply SQLite pragmas", exc_info=True)
    finally:
        cursor.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    """
    Yield a session and roll back if the request handler raises.

    Without the rollback a failed handler returned its connection to the pool
    holding an aborted transaction, so the next request to reuse it inherited the
    broken state.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
