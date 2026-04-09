import os
from google.cloud import bigquery

BQ_PROJECT = os.getenv("BQ_PROJECT", "moment-486719")
BQ_DATASET = os.getenv("BQ_DATASET", "new_moments_processed")
# Stored as env var so renaming compatibility_results → compat_results
# only requires updating this one variable, not touching any code.
BQ_TABLE_COMPAT = os.getenv("BQ_TABLE_COMPAT", "compatibility_results")
BQ_TABLE_USERS = os.getenv("BQ_TABLE_USERS", "users_processed")

_client = bigquery.Client(project=BQ_PROJECT)


def get_bq_client() -> bigquery.Client:
    return _client
