-- Momento Database Schema (Firebase Auth version)
-- Run: psql postgresql://momento_admin:Momento%402025!@127.0.0.1:5432/momento -f schema.sql

CREATE TABLE IF NOT EXISTS books (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT        NOT NULL,
  author           TEXT        NOT NULL,
  year             INT,
  gutenberg_id     TEXT,
  cover_url        TEXT,
  opening_passage  TEXT,
  bg_color         TEXT,
  spine_color      TEXT,
  fg_color         TEXT,
  style            TEXT,
  deco             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid         TEXT        UNIQUE NOT NULL,
  first_name           TEXT        NOT NULL,
  last_name            TEXT        NOT NULL,
  email                TEXT        UNIQUE NOT NULL,
  readername           TEXT        UNIQUE NOT NULL,
  bio                  TEXT,
  gender               TEXT,
  photo_url            TEXT,
  dark_mode            BOOLEAN     NOT NULL DEFAULT FALSE,
  moments_layout_mode  TEXT        NOT NULL DEFAULT 'clip-by-books',
  passage_first        BOOLEAN     NOT NULL DEFAULT TRUE,
  last_read_book_id    UUID        REFERENCES books(id),
  onboarding_complete  BOOLEAN     NOT NULL DEFAULT FALSE,
  consent_given        BOOLEAN     NOT NULL DEFAULT FALSE,
  consent_at           TIMESTAMPTZ,
  guide_book_gut_id    TEXT,
  last_hero_gut_id     TEXT,
  reading_state        JSONB       DEFAULT '{}',
  last_captured_type   TEXT,
  last_captured_shelf_id TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at        TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS reading_signatures (
  user_id      UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  r            NUMERIC(5,2) NOT NULL DEFAULT 0,
  c            NUMERIC(5,2) NOT NULL DEFAULT 0,
  d            NUMERIC(5,2) NOT NULL DEFAULT 0,
  rt           NUMERIC(5,2) NOT NULL DEFAULT 0,
  ct           NUMERIC(5,2) NOT NULL DEFAULT 0,
  dt           NUMERIC(5,2) NOT NULL DEFAULT 0,
  rf           NUMERIC(5,2) NOT NULL DEFAULT 0,
  cf           NUMERIC(5,2) NOT NULL DEFAULT 0,
  df           NUMERIC(5,2) NOT NULL DEFAULT 0,
  cover_bg     TEXT        NOT NULL DEFAULT '#EEE0C4',
  strip_fill   TEXT        NOT NULL DEFAULT '#C8B48A',
  stitch_color TEXT        NOT NULL DEFAULT '#8B6914',
  glyph_col_bg TEXT        NOT NULL DEFAULT 'rgba(0,0,0,0.22)',
  text_color   TEXT        NOT NULL DEFAULT '#2C1A08',
  teaser_color TEXT        NOT NULL DEFAULT 'rgba(44,26,8,0.82)',
  muted_color  TEXT        NOT NULL DEFAULT 'rgba(44,26,8,0.48)',
  border_color TEXT        NOT NULL DEFAULT 'rgba(139,105,20,0.28)',
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_pages (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id   UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  page_num  INT         NOT NULL,
  chapter   TEXT,
  content   TEXT        NOT NULL,
  UNIQUE (book_id, page_num)
);

CREATE TABLE IF NOT EXISTS gutenberg_book_cache (
  gutenberg_id  TEXT        PRIMARY KEY,
  book_id       UUID        REFERENCES books(id),
  epub_url      TEXT,
  text_url      TEXT,
  parsed_pages  JSONB,
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_book_progress (
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id       UUID        NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  current_page  INT         NOT NULL DEFAULT 1,
  last_read_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, book_id)
);

CREATE TABLE IF NOT EXISTS moments (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id                   UUID        NOT NULL REFERENCES books(id),
  passage                   TEXT        NOT NULL,
  chapter                   TEXT,
  page_num                  INT,
  interpretation            TEXT        CHECK (interpretation IS NULL OR length(interpretation) >= 12),
  interpretation_updated_at TIMESTAMPTZ,
  is_deleted                BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reader_waves (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  waved_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  wave_back     BOOLEAN     NOT NULL DEFAULT FALSE,
  wave_back_at  TIMESTAMPTZ,
  UNIQUE (from_user_id, to_user_id),
  CHECK (from_user_id <> to_user_id)
);

CREATE TABLE IF NOT EXISTS close_readers (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_b   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id_a < user_id_b),
  UNIQUE (user_id_a, user_id_b)
);

CREATE TABLE IF NOT EXISTS whisper_threads (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_a        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id_b        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at  TIMESTAMPTZ,
  CHECK (user_id_a < user_id_b),
  UNIQUE (user_id_a, user_id_b)
);

CREATE TABLE IF NOT EXISTS whisper_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID        NOT NULL REFERENCES whisper_threads(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id),
  type        TEXT        NOT NULL CHECK (type IN ('whisper', 'moment')),
  body        TEXT,
  moment_id   UUID        REFERENCES moments(id),
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (type = 'whisper' AND body IS NOT NULL AND moment_id IS NULL) OR
    (type = 'moment'  AND moment_id IS NOT NULL AND body IS NULL)
  )
);

CREATE TABLE IF NOT EXISTS shared_moments (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id             UUID        NOT NULL REFERENCES moments(id),
  from_user_id          UUID        NOT NULL REFERENCES users(id),
  to_user_id            UUID        NOT NULL REFERENCES users(id),
  message_id            UUID        NOT NULL REFERENCES whisper_messages(id),
  saved_by_recipient    BOOLEAN     NOT NULL DEFAULT FALSE,
  shared_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activity_feed (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id   UUID        NOT NULL REFERENCES users(id),
  signal_type     TEXT        NOT NULL CHECK (signal_type IN ('wave', 'wave_back', 'shared_moment', 'whisper')),
  moment_id       UUID        REFERENCES moments(id),
  message_id      UUID        REFERENCES whisper_messages(id),
  book_id         UUID        REFERENCES books(id),
  is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id),
  event       TEXT        NOT NULL CHECK (event IN ('given', 'revoked')),
  ip_address  INET,
  user_agent  TEXT,
  logged_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_trees (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  created_by  UUID        NOT NULL REFERENCES users(id),
  book_id     UUID        REFERENCES books(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading_tree_members (
  tree_id    UUID        NOT NULL REFERENCES reading_trees(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tree_id, user_id)
);

CREATE TABLE IF NOT EXISTS reading_tree_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id     UUID        NOT NULL REFERENCES reading_trees(id) ON DELETE CASCADE,
  sender_id   UUID        NOT NULL REFERENCES users(id),
  moment_id   UUID        REFERENCES moments(id),
  body        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (moment_id IS NOT NULL OR body IS NOT NULL)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_readername     ON users(readername);
CREATE INDEX IF NOT EXISTS idx_users_firebase       ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_moments_user         ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_book         ON moments(book_id);
CREATE INDEX IF NOT EXISTS idx_moments_user_book    ON moments(user_id, book_id);
CREATE INDEX IF NOT EXISTS idx_moments_passage      ON moments(passage);
CREATE INDEX IF NOT EXISTS idx_moments_interp       ON moments(user_id) WHERE interpretation IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_waves_from           ON reader_waves(from_user_id);
CREATE INDEX IF NOT EXISTS idx_waves_to             ON reader_waves(to_user_id);
CREATE INDEX IF NOT EXISTS idx_close_a              ON close_readers(user_id_a);
CREATE INDEX IF NOT EXISTS idx_close_b              ON close_readers(user_id_b);
CREATE INDEX IF NOT EXISTS idx_threads_a            ON whisper_threads(user_id_a);
CREATE INDEX IF NOT EXISTS idx_threads_b            ON whisper_threads(user_id_b);
CREATE INDEX IF NOT EXISTS idx_messages_thread      ON whisper_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread      ON whisper_messages(thread_id) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feed_owner_time      ON activity_feed(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_unread          ON activity_feed(owner_user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_pages_book           ON book_pages(book_id, page_num);
CREATE INDEX IF NOT EXISTS idx_progress_user        ON user_book_progress(user_id, last_read_at DESC);
