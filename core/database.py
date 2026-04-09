import os
from google.cloud.sql.connector import Connector
import sqlalchemy

INSTANCE_CONNECTION_NAME = os.getenv("INSTANCE_CONNECTION_NAME", "moment-486719:us-central1:moment-db")
DB_NAME = os.getenv("DB_NAME", "momento")
DB_USER = os.getenv("DB_USER", "momento_admin")
DB_PASS = os.getenv("DB_PASS", "")

_connector = Connector()


def _getconn():
    return _connector.connect(
        INSTANCE_CONNECTION_NAME,
        "pg8000",
        user=DB_USER,
        password=DB_PASS,
        db=DB_NAME,
    )


engine = sqlalchemy.create_engine(
    "postgresql+pg8000://",
    creator=_getconn,
    pool_size=5,
    max_overflow=2,
    pool_timeout=30,
    pool_recycle=1800,
)


def get_db():
    with engine.connect() as conn:
        yield conn
