-- Index definitions for database hardening
CREATE INDEX IF NOT EXISTS IDX_albums_tenant_lookup ON albums(tenant_id);
CREATE INDEX IF NOT EXISTS IDX_gallery_items_tenant_lookup ON gallery_items(tenant_id);
