-- Create Share Links Table
CREATE TABLE share_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP,
    password VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for quick lookup and tenant boundaries
CREATE INDEX IDX_share_links_token ON share_links(token);
CREATE INDEX IDX_share_links_tenant ON share_links(tenant_id);
CREATE INDEX IDX_share_links_album ON share_links(album_id);
