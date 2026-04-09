# Momento Backend

FastAPI backend for the Momento app. Deployed on GCP Cloud Run.

**Live URL:** `https://momento-api-329431711809.us-central1.run.app`

---

## Stack

- **Runtime**: FastAPI + Uvicorn (Python 3.11)
- **Auth**: Firebase Admin SDK (verifies ID tokens from frontend)
- **Database**: Cloud SQL PostgreSQL 15 (`momento` on `moment-db`, us-central1)
- **ML Results**: Google BigQuery (`new_moments_processed` dataset, project `moment-486719`)
- **Deploy**: Cloud Run via GitHub Actions (push to `main` → auto-deploy)

---

## Project Structure

```
main.py                          FastAPI app entry point + CORS
Dockerfile                       Cloud Run container
requirements.txt
core/
  auth.py                        Firebase token verification (get_current_user dependency)
  database.py                    Cloud SQL connection pool (pg8000 + SQLAlchemy)
  bigquery.py                    BigQuery client + table name constants
  hashing.py                     All hash functions (see below)
routers/
  users.py                       User CRUD + consent logging + readername check
  moments.py                     Save/fetch/update/delete snipped moments
  worth.py                       Worth matches — reads BigQuery compat results
  sharing.py                     Whisper threads, messages, waves, close readers
.github/workflows/deploy.yml     CI/CD: push to main → build Docker → deploy to Cloud Run
```

---

## Endpoints

### Users
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/users/me` | ✅ | Create user record after Firebase signup |
| GET | `/users/me` | ✅ | Get user + consent status |
| POST | `/users/consent` | ✅ | Log consent acceptance |
| GET | `/users/readername/{name}/available` | ❌ | Public — check readername availability |

### Moments
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/moments` | ✅ | Save a snipped passage + interpretation |
| GET | `/moments` | ✅ | Get all user's moments |
| PATCH | `/moments/{id}` | ✅ | Update interpretation |
| DELETE | `/moments/{id}` | ✅ | Soft delete |

### Worth (BigQuery)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/worth/matches?book_id=X` | ✅ | Get compatible readers from BigQuery |
| GET | `/worth/profile/{bq_user_id}` | ✅ | Get a matched user's BigQuery profile |

### Sharing (PostgreSQL)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/sharing/close-readers` | ✅ | Get close readers list |
| POST | `/sharing/waves` | ✅ | Wave to a reader |
| GET | `/sharing/threads` | ✅ | Get all whisper threads |
| POST | `/sharing/threads` | ✅ | Create a new thread |
| GET | `/sharing/threads/{id}/messages` | ✅ | Get messages in thread (marks as read) |
| POST | `/sharing/threads/{id}/messages` | ✅ | Send a whisper |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | ❌ | Returns `{"status": "ok"}` |

---

## Hash Functions (`core/hashing.py`)

Three hash functions that must stay in sync with the ML pipeline:

```python
# 1. BigQuery user ID — farmhash of full name
make_user_id("Harini Vasisht")  # → int

# 2. Passage key — SHA256 of bare Gutenberg ID + passage text
#    book_id must be bare number ("84"), NOT "gut_84" or title
compute_passage_key("84", passage_text)  # → 32-char hex

# 3. Run ID — farmhash of user pair + book + passage
make_run_id(user_a, user_b, book_id, passage_id)  # → int
```

**Important:** When the frontend sends `book_id = "gut_84"`, the backend strips `"gut_"` before computing `passage_key`. The full `"gut_84"` is still stored in the `book_id` column for the frontend's use.

---

## BigQuery Tables (`new_moments_processed` dataset)

| Table | Description | Config env var |
|---|---|---|
| `compatibility_results` | Pairwise reader compatibility (RCD scores, rationale, confidence) | `BQ_TABLE_COMPAT` |
| `users_processed` | Synthetic user profiles (character_name, age, profession) | `BQ_TABLE_USERS` |
| `rankings` | Passage rankings with weights | — |

**Note on table rename:** If `compatibility_results` is renamed to `compat_results`, update the `BQ_TABLE_COMPAT` environment variable in Cloud Run — no code changes needed.

**Note on passage IDs:** The ML pipeline currently uses `"passage_1"`, `"passage_2"` etc. (synthetic data). For real users, Jyothssena must update the pipeline to use `compute_passage_key(gutenberg_id, passage_text)` so passage IDs match between BigQuery and PostgreSQL.

---

## Database (PostgreSQL)

**GCP:** `moment-486719:us-central1:moment-db` | database: `momento` | user: `momento_admin`

Key tables used by this API:
- `users` — `firebase_uid`, `first_name`, `last_name`, `email`, `readername`
- `moments` — `id`, `firebase_uid`, `book_id`, `book_title`, `passage`, `passage_key`, `interpretation`, `chapter`, `page`, `is_deleted`
- `consent_logs` — `firebase_uid`, `created_at`
- `reader_waves` — `id`, `from_firebase_uid`, `to_firebase_uid`
- `close_readers` — `id`, `firebase_uid`, `reader_firebase_uid`
- `whisper_threads` — `id`, `user_a_firebase_uid`, `user_b_firebase_uid`, `updated_at`
- `whisper_messages` — `id`, `thread_id`, `sender_firebase_uid`, `content`, `moment_id`, `is_read`

---

## Environment Variables

Set in Cloud Run (via GitHub Actions deploy step):

| Variable | Value |
|---|---|
| `INSTANCE_CONNECTION_NAME` | `moment-486719:us-central1:moment-db` |
| `DB_NAME` | `momento` |
| `DB_USER` | `momento_admin` |
| `DB_PASS` | *(from GitHub Secret)* |
| `FIREBASE_PROJECT_ID` | `momento-504b2` |
| `BQ_PROJECT` | `moment-486719` |
| `BQ_DATASET` | `new_moments_processed` |
| `BQ_TABLE_COMPAT` | `compatibility_results` |
| `BQ_TABLE_USERS` | `users_processed` |

---

## CI/CD Setup

**Auto-deploys to Cloud Run on every push to `main`.**

### GitHub Secrets required (Settings → Secrets → Actions):

| Secret | How to get it |
|---|---|
| `DB_PASS` | `Momento@2025!` |
| `GCP_CREDENTIALS` | GCP Console → IAM → Service Accounts → `329431711809-compute@developer.gserviceaccount.com` → Keys → Add Key → JSON. Ask Jyothssena (project admin) to generate this. |

### What the workflow does:
1. Authenticates to GCP using `GCP_CREDENTIALS`
2. Builds Docker image → pushes to `us-central1-docker.pkg.dev/moment-486719/momento-api/api`
3. Deploys to `momento-api` Cloud Run service with all env vars

---

## Local Development

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

Note: Cloud SQL and BigQuery connections require GCP credentials locally. Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON file.

---

## What's Pending

| Item | Blocker |
|---|---|
| Real user worth matches | Jyothssena must update ML pipeline to use `compute_passage_key()` for passage IDs |
| Frontend wired to real API | Next step — replace mock data in `worth/data.js` and `SharingPanel.jsx` |
| `GCP_CREDENTIALS` secret | Jyothssena needs to generate service account JSON key |
