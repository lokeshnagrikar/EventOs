-- Seed OWNER role
INSERT INTO roles (id, name, description, permissions_json) VALUES
(uuid_generate_v4(), 'OWNER', 'Workspace Owner with full privileges', '["all"]')
ON CONFLICT (name) DO NOTHING;
