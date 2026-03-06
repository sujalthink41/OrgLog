import asyncpg

from app.core.config import settings

db_pool = None


async def get_db_pool():
    global db_pool

    if db_pool is None:
        db_pool = await asyncpg.create_pool(
            user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_HOST,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
            min_size=2,  # minimum number of connections in the pool
            max_size=10,  # maximum number of connections in the pool
        )

    return db_pool
