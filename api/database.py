import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.engine.url import URL

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME", "")


def _build_engine():
    if INSTANCE_CONNECTION_NAME:
        # Production: Cloud SQL Connector (private IP, no public IP needed)
        from google.cloud.sql.connector import Connector, IPTypes
        connector = Connector()

        async def getconn():
            return await connector.connect_async(
                INSTANCE_CONNECTION_NAME,
                "asyncpg",
                user=DB_USER,
                password=DB_PASS,
                db=DB_NAME,
                ip_type=IPTypes.PRIVATE,
            )

        return create_async_engine(
            "postgresql+asyncpg://",
            async_creator=getconn,
            echo=False,
        )
    else:
        # Local dev: direct connection to Docker PostgreSQL
        url = URL.create(
            "postgresql+asyncpg",
            username=DB_USER,
            password=DB_PASS,
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
        )
        return create_async_engine(url, echo=False, connect_args={"ssl": False})


engine = _build_engine()

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
