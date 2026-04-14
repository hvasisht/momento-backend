import os
from google.cloud import bigquery

BQ_PROJECT     = os.getenv("BQ_PROJECT",       "moment-486719")
BQ_DATASET     = os.getenv("BQ_DATASET",       "new_moments_processed")
BQ_TABLE_COMPAT        = os.getenv("BQ_TABLE_COMPAT",        "compatibility_results")
BQ_TABLE_USERS         = os.getenv("BQ_TABLE_USERS",         "users_processed")
BQ_TABLE_BOOK_COMPAT   = os.getenv("BQ_TABLE_BOOK_COMPAT",   "book_compatibility")
BQ_TABLE_PROFILE_COMPAT = os.getenv("BQ_TABLE_PROFILE_COMPAT", "profile_compatibility")

_client = bigquery.Client(project=BQ_PROJECT)


def get_bq_client() -> bigquery.Client:
    return _client
