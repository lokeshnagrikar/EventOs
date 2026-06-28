-- 1. Create sessions tracking table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    refresh_token_id UUID NOT NULL UNIQUE,
    device_model VARCHAR(100),
    os_name VARCHAR(100),
    ip_address VARCHAR(45) NOT NULL,
    last_active_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Modify refresh_tokens table to use hashes
ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- 3. Add foreign key linking session to refresh token record
ALTER TABLE sessions ADD CONSTRAINT fk_sessions_refresh_token 
FOREIGN KEY (refresh_token_id) REFERENCES refresh_tokens(id) ON DELETE CASCADE;

-- 4. Create invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Add indexes for lookup performance
CREATE INDEX idx_sessions_user_tenant ON sessions(user_id, tenant_id);
CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
CREATE INDEX idx_invitations_email_tenant ON invitations(email, tenant_id);
