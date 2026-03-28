
-- ── MIGRATIONS: IP, activity logs, password resets ───────────

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip        VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at  TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_activity_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     VARCHAR(60)  NOT NULL,
  detail     TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_activity_user    ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ts_activity_created ON user_activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ts_reset_token ON password_reset_tokens(token);
