-- Create Vendors Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    service_type VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Vendor Contracts Table
CREATE TABLE vendor_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    details TEXT,
    total_cost DECIMAL(19, 4) NOT NULL DEFAULT 0.00,
    actual_cost DECIMAL(19, 4) NOT NULL DEFAULT 0.00,
    contract_url VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vendor_contracts_number UNIQUE (tenant_id, contract_number)
);

-- Create Vendor Assignments Table
CREATE TABLE vendor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    task_id UUID REFERENCES timeline_tasks(id) ON DELETE SET NULL,
    role_description VARCHAR(500),
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance and isolation boundaries
CREATE INDEX IDX_vendors_tenant ON vendors(tenant_id);
CREATE INDEX IDX_vendor_contracts_tenant ON vendor_contracts(tenant_id);
CREATE INDEX IDX_vendor_contracts_booking ON vendor_contracts(booking_id);
CREATE INDEX IDX_vendor_assignments_tenant ON vendor_assignments(tenant_id);
CREATE INDEX IDX_vendor_assignments_booking ON vendor_assignments(booking_id);

-- Migrate existing event statuses to 'PLANNING'
UPDATE events SET status = 'PLANNING' WHERE status IN ('DRAFT', 'PLANNED', 'ARCHIVED');
