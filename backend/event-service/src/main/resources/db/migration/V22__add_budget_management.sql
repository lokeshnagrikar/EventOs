-- Create Booking Budgets Table
CREATE TABLE booking_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    total_budget_limit DECIMAL(19, 4) NOT NULL DEFAULT 0.00,
    alert_threshold_percentage DECIMAL(5, 2) NOT NULL DEFAULT 90.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Budget Category Allocations Table
CREATE TABLE budget_category_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    estimated_cost DECIMAL(19, 4) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_category UNIQUE (tenant_id, booking_id, category)
);

-- Create Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(19, 4) NOT NULL DEFAULT 0.00,
    expense_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    vendor_contract_id UUID REFERENCES vendor_contracts(id) ON DELETE SET NULL,
    payment_method VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Budget Alerts Table
CREATE TABLE budget_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    category VARCHAR(50),
    alert_type VARCHAR(50) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    triggered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for isolation boundaries and performance
CREATE INDEX IDX_booking_budgets_tenant ON booking_budgets(tenant_id);
CREATE INDEX IDX_budget_category_allocations_tenant ON budget_category_allocations(tenant_id);
CREATE INDEX IDX_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IDX_expenses_booking ON expenses(booking_id);
CREATE INDEX IDX_budget_alerts_tenant ON budget_alerts(tenant_id);
CREATE INDEX IDX_budget_alerts_booking ON budget_alerts(booking_id);
