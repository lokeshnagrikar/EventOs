-- Migration V36: Password reset security and query optimization indexes
-- Ensures high-performance lookups for password updates and history auditing without modifying V35

CREATE INDEX IF NOT EXISTS idx_users_password_updated_at ON users(password_updated_at);
CREATE INDEX IF NOT EXISTS idx_password_history_user_created ON password_history(user_id, created_at DESC);
