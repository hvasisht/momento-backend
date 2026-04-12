# Momento — Full Project Handoff

**Read this before starting a new chat. Contains everything needed to continue.**

---

## Active Folders (Mac)

| What | Path |
|---|---|
| Frontend (React) | `/Users/harinivasisht/Downloads/momento frontend` |
| Backend (FastAPI) | `/Users/harinivasisht/Downloads/momento backend` |
| ML Pipeline | `github.com/jyothssena/Moment` (Jyothssena's repo) |

**Never reference `momento_live_v64 - Copy` — that is the old folder.**

---

## How to Run Locally

**Frontend:**
```bash
# Serve static files
python3 -m http.server 4173 --directory "/Users/harinivasisht/Downloads/momento frontend"
# Press Ctrl+C to stop
# Open: http://127.0.0.1:4173/
```

**After any frontend source edit, rebuild first:**
```bash
node scripts/build-v64.js
```

**Backend (local only, optional):**
```bash
cd "/Users/harinivasisht/Downloads/momento backend"
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

---

## GCP Infrastructure

| Resource | Value |
|---|---|
| GCP Project | `moment-486719` |
| Cloud Run service | `momento-api` |
| Live API URL | `https://momento-api-329431711809.us-central1.run.app` |
| Cloud SQL | `moment-db` (PostgreSQL 15, us-central1) |
| Database | `momento` / user: `momento_admin` / pass: `Momento@2025!` |
| BigQuery dataset | `new_moments_processed` |
| Artifact Registry | `us-central1-docker.pkg.dev/moment-486719/momento-api/api` |
| VPC connector | `momento-connector` |
| Cloud Run service account | `329431711809-compute@developer.gserviceaccount.com` |

**GCP Roles on service account (confirmed):**
- BigQuery Data Viewer ✅
- BigQuery Job User ✅
- Cloud SQL Client ✅

**GCP Access:**
- Jyothssena = project admin (only one who can manage IAM)
- Chandrasekar = limited access
- Harini = limited access

---

## Firebase

| Setting | Value |
|---|---|
| Project | `momento` (ID: `momento-504b2`) |
| Auth providers | Email/Password ✅, Google ✅ |
| apiKey | `AIzaSyBrlqOMFKASYACdLqDvCB10XAljIgoJvzs` |
| authDomain | `momento-504b2.firebaseapp.com` |
| appId | `1:58286946946:web:cec84598c760e5e630529b` |

Firebase config + `API_BASE` live in `index.html` (not in source files).

---

## Frontend — Key Facts

- **No npm/Vite** — plain static HTML. Build with `node scripts/build-v64.js`
- **31 source files** compiled → `src/app.compiled.js` via local Babel in `vendor/`
- **Assets**: `just logo.png` (loading screen), `logo-clean.png` (top nav), `opening page image.png` (intro)
- **4 sections**: Read → Moments → Worth → Sharing

### Auth Flow Summary
- `inExplicitAuthFlowRef = useRef(false)` — prevents `onAuthStateChanged` from auto-launching during explicit auth actions (stale closure fix)
- New account → Firebase + `POST /users/me` + send verification email → guide → consent → app
- Return sign-in → check `emailVerified` → if false: `EmailVerificationOverlay`; if true: check consent → app
- Google sign-in → `signInWithPopup` → check `GET /users/me` → exists: launch; 404: `GoogleCompleteProfileOverlay`
- Consent: stored in `consent_logs` DB + `localStorage.momento_consent_given`. NOT cleared on sign-out.

### Frontend Source Files
```
src/shared/CreateAccountOverlay.jsx       Email/password signup
src/shared/EmailVerificationOverlay.jsx   Shown when email not verified on return login
src/shared/GoogleCompleteProfileOverlay.jsx  Shown for new Google users (collect readername)
src/shared/SignInOverlay.jsx              Email + Google sign-in
src/shared/ConsentScreen.jsx             Privacy consent (once per account)
src/shared/ReaderOnboardingOverlay.jsx   4-step new user guide
src/shared/IntroOverlay.jsx              Opening page
src/main/MomentApp.jsx                   Root — all state + auth logic
src/features/worth/data.js               MOCK DATA — replace with real API
src/features/sharing/SharingPanel.jsx    MOCK DATA — replace with real API
```

---

## Backend — Key Facts

**Folder:** `/Users/harinivasisht/Downloads/momento backend`
**Git:** initialized, first commit done. **NOT yet pushed to GitHub.**

### What's built
```
main.py                    FastAPI app + CORS
Dockerfile                 Cloud Run container
core/auth.py               Firebase token verification
core/database.py           Cloud SQL connection (pg8000 + SQLAlchemy)
core/bigquery.py           BigQuery client + table name env vars
core/hashing.py            All 3 hash functions
routers/users.py           /users/me, /users/consent, readername check
routers/moments.py         CRUD for snipped moments
routers/worth.py           /worth/matches — reads BigQuery compat_results
routers/sharing.py         threads, messages, waves, close readers
.github/workflows/deploy.yml  Auto-deploy to Cloud Run on push to main
```

### All Endpoints
```
GET  /health                                   Public health check
POST /users/me                                 Create user after signup
GET  /users/me                                 Get user + consent status
POST /users/consent                            Log consent acceptance
GET  /users/readername/{name}/available        Public — readername check
POST /moments                                  Save snipped moment
GET  /moments                                  Get user's moments
PATCH /moments/{id}                            Update interpretation
DELETE /moments/{id}                           Soft delete
GET  /worth/matches?book_id=X                  BigQuery compat results
GET  /worth/profile/{bq_user_id}               BigQuery user profile
GET  /sharing/close-readers                    Close readers list
POST /sharing/waves                            Wave to a reader
GET  /sharing/threads                          All whisper threads
POST /sharing/threads                          Create thread
GET  /sharing/threads/{id}/messages            Get messages (marks read)
POST /sharing/threads/{id}/messages            Send whisper
```

### To Deploy (NOT done yet)
1. Create GitHub repo `momento-backend` under Harini's account
2. Run in terminal:
   ```bash
   cd "/Users/harinivasisht/Downloads/momento backend"
   git remote add origin https://github.com/harinivasisht/momento-backend.git
   git push -u origin main
   ```
3. Add GitHub Secrets (Settings → Secrets → Actions):
   - `DB_PASS` = `Momento@2025!`
   - `GCP_CREDENTIALS` = service account JSON (ask Jyothssena to generate from `329431711809-compute@developer.gserviceaccount.com` → Keys → Add Key → JSON)
4. Push to main → GitHub Actions auto-deploys to Cloud Run

---

## Hash Functions (must match ML pipeline)

```python
import farmhash, struct, hashlib

# 1. BigQuery user_id — farmhash of "First Last"
def make_user_id(name: str) -> int:
    raw = farmhash.hash64(name)
    signed = struct.unpack('q', struct.pack('Q', raw))[0]
    return abs(signed)

# 2. passage_key — SHA256 of bare Gutenberg ID + passage
#    book_id = "84" not "gut_84" or "Frankenstein"
#    Backend strips "gut_" prefix before calling this
def compute_passage_key(book_id: str, passage: str) -> str:
    text = str(book_id) + "|" + passage[:200].lower().strip()
    return hashlib.sha256(text.encode()).hexdigest()[:32]

# 3. run_id — farmhash of user pair + book + passage
def make_run_id(user_a, user_b, book_id, passage_id) -> int:
    raw = farmhash.hash64(str(user_a) + str(user_b) + book_id + passage_id)
    signed = struct.unpack('q', struct.pack('Q', raw))[0]
    return abs(signed)
```

**Canonical Gutenberg IDs (use these as book_id):**
| Book | ID |
|---|---|
| Frankenstein | `"84"` |
| Pride and Prejudice | `"1342"` |
| The Great Gatsby | `"64317"` |
| Jane Eyre | `"1260"` |
| Sherlock Holmes | `"48320"` |

---

## BigQuery — ML Pipeline

**Dataset:** `new_moments_processed` in project `moment-486719`

| Table | Contents |
|---|---|
| `compatibility_results` | Pairwise reader compatibility — `user_a`, `user_b`, `book_id`, `passage_id`, `confidence`, `dominant_think/feel`, `think/feel_D/C/R`, `think/feel_rationale`, `verdict` |
| `users_processed` | 50 synthetic users — `user_id` (farmhash), `character_name`, `gender`, `age`, `profession` |
| `rankings` | Passage rankings with weights per book |

**Current state:** All data is synthetic (50 character personas, passage IDs = "passage_1" etc.)

**Pending from Jyothssena:**
1. Update pipeline to use `compute_passage_key(gutenberg_id, passage_text)` for `passage_id` instead of "passage_1" etc.
2. Generate service account JSON key for GitHub Actions (`GCP_CREDENTIALS` secret)

**Code to send Jyothssena:**
```python
import hashlib

GUTENBERG_IDS = {
    "Frankenstein": "84",
    "Pride and Prejudice": "1342",
    "The Great Gatsby": "64317",
    "Jane Eyre": "1260",
    "The Adventures of Sherlock Holmes": "48320",
}

def compute_passage_key(book_id: str, passage: str) -> str:
    # book_id = bare Gutenberg ID e.g. "84"
    text = str(book_id) + "|" + passage[:200].lower().strip()
    return hashlib.sha256(text.encode()).hexdigest()[:32]

# Replace passage_id = f"passage_{i}" with:
# passage_id = compute_passage_key(GUTENBERG_IDS[book_title], passage_text)
```

---

## Database Cleanup Log (Apr 11 2026)

- Deleted all real user accounts and their moments (synthetic users kept intact)
- Removed duplicate book entries — stubs (author = 'Unknown') merged into proper seeded entries
- Trimmed moments from 727 → 360 (120 per book, matching BigQuery `new_moments_processed.moments_processed`)
- Set `gutenberg_id` on all 3 books: Frankenstein=84, Pride & Prejudice=1342, Great Gatsby=64317
- Cloud SQL now has: 3 books (Mary Shelley, Jane Austen, F. Scott Fitzgerald), 360 synthetic moments
- BigQuery `book_id` format: `gutenberg_84` — Cloud SQL stores bare number `84` in `gutenberg_id`; Jyothssena will handle mapping

---

## What's Done ✅

- Firebase Auth — Email/Password + Google sign-in/signup
- Email verification gate (send on signup, check on return login)
- Google new user flow (readername collection overlay)
- Consent screen (once per account, stored in DB + localStorage)
- All auth overlays wired end-to-end
- Read section — 5 pre-bundled books + 1,000 Gutenberg catalog
- Moments section — snip, drag, edit, delete (frontend only, not yet wired to API)
- Worth section UI — profile cards, wave, whisper (mock data)
- Sharing section UI — threads, feed, close readers (mock data)
- FastAPI backend — all endpoints written
- BigQuery access confirmed on Cloud Run service account
- Backend git initialized and committed

---

## What's Pending ⚠️

| Task | Blocker |
|---|---|
| Push backend to GitHub | Harini needs to create repo + run git push |
| GitHub Secrets added | Needs `GCP_CREDENTIALS` JSON from Jyothssena |
| Backend deployed to Cloud Run | Needs GitHub push + secrets |
| Frontend wired to real moments API | After backend deployed |
| Frontend wired to real worth API | After backend deployed + Jyothssena pipeline fix |
| Frontend wired to real sharing API | After backend deployed |
| Jyothssena pipeline fix (passage_key) | Waiting on her |
| Final merge into jyothssena/Moment repo | Before professor submission |
