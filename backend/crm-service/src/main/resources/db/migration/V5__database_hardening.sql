-- Index definitions for database hardening
CREATE INDEX IF NOT EXISTS IDX_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS IDX_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS IDX_leads_email_lookup ON leads(tenant_id, email);
