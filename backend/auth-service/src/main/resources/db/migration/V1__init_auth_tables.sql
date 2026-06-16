-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Tenants Table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'STARTER',
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    max_users INTEGER NOT NULL DEFAULT 5,
    max_storage BIGINT NOT NULL DEFAULT 5368709120, -- 5GB in bytes
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Companies Table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(1000),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(50),
    timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create Roles Table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    profile_image VARCHAR(1000),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT UK_users_email UNIQUE (email)
);

-- Create Refresh Tokens Table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Populate Default Roles
INSERT INTO roles (id, name, description, permissions_json) VALUES
(uuid_generate_v4(), 'ADMIN', 'Super administrator with full access to tenant space', '["all"]'),
(uuid_generate_v4(), 'MANAGER', 'Department supervisor managing client campaigns and leads', '["lead_read", "lead_create", "lead_update", "event_read", "event_create", "event_update", "quote_read", "quote_create", "quote_update", "payment_read"]'),
(uuid_generate_v4(), 'STAFF', 'Field employee reviewing assigned tasks and event details', '["lead_read", "event_read", "task_read", "task_update"]'),
(uuid_generate_v4(), 'CLIENT', 'External client reviewing proposals and galleries', '["portal_read", "quote_approve", "payment_read", "gallery_read"]');

-- Index definitions
CREATE INDEX IDX_companies_tenant ON companies(tenant_id);
CREATE INDEX IDX_users_tenant_company ON users(tenant_id, company_id);
CREATE INDEX IDX_users_email ON users(email);
CREATE INDEX IDX_refresh_tokens_token ON refresh_tokens(token);
