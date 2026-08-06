-- ==============================================================================
-- Migration: V30__waitlist_and_launch_config.sql
-- Description: Waitlist and Founding Member Dynamic Pricing Engine (Supabase / Postgres)
-- ==============================================================================

-- 1. Create launch_config Table (Single-row configuration pattern)
CREATE TABLE IF NOT EXISTS launch_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    founding_member_price NUMERIC(10, 2) NOT NULL DEFAULT 1499.00,
    public_starter_price NUMERIC(10, 2) NOT NULL DEFAULT 1999.00,
    founding_member_cap INT NOT NULL DEFAULT 20,
    founding_members_claimed INT NOT NULL DEFAULT 0 CHECK (founding_members_claimed <= founding_member_cap),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial single row if not exists
INSERT INTO launch_config (id, founding_member_price, public_starter_price, founding_member_cap, founding_members_claimed)
VALUES (1, 1499.00, 1999.00, 20, 0)
ON CONFLICT (id) DO NOTHING;


-- 2. Create waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL UNIQUE,
    agency_name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
    invited_at TIMESTAMPTZ NULL,
    converted_to_paid BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index for quick lookups by WhatsApp number
CREATE INDEX IF NOT EXISTS idx_waitlist_whatsapp ON waitlist(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_waitlist_founding ON waitlist(is_founding_member);


-- 3. Atomic Stored Procedure: Mark Founding Member (Handles Cap Safely)
CREATE OR REPLACE FUNCTION mark_founding_member(p_waitlist_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_claimed INT;
    v_cap INT;
    v_already_founding BOOLEAN;
    v_whatsapp TEXT;
BEGIN
    -- Lock launch_config row for concurrency safety
    SELECT founding_members_claimed, founding_member_cap 
    INTO v_current_claimed, v_cap
    FROM launch_config 
    WHERE id = 1 
    FOR UPDATE;

    -- Check if target user exists and get current status
    SELECT is_founding_member, whatsapp_number 
    INTO v_already_founding, v_whatsapp
    FROM waitlist 
    WHERE id = p_waitlist_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Waitlist entry % not found.', p_waitlist_id;
    END IF;

    IF v_already_founding THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'User is already marked as a Founding Member.',
            'whatsapp_number', v_whatsapp
        );
    END IF;

    -- Enforce capacity cap
    IF v_current_claimed >= v_cap THEN
        RAISE EXCEPTION 'Founding Member cap of % spots has been reached (% claimed).', v_cap, v_current_claimed;
    END IF;

    -- Mark waitlist entry and increment claimed count atomically
    UPDATE waitlist 
    SET is_founding_member = TRUE, 
        invited_at = NOW()
    WHERE id = p_waitlist_id;

    UPDATE launch_config 
    SET founding_members_claimed = founding_members_claimed + 1,
        updated_at = NOW()
    WHERE id = 1;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Founding Member status granted successfully.',
        'whatsapp_number', v_whatsapp,
        'claimed_spots', v_current_claimed + 1,
        'total_cap', v_cap
    );
END;
$$;


-- 4. Dynamic Pricing Calculation Function for Checkout
CREATE OR REPLACE FUNCTION get_effective_subscription_price(p_whatsapp_number TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_is_founding BOOLEAN := FALSE;
    v_founding_price NUMERIC;
    v_public_price NUMERIC;
BEGIN
    -- Fetch active pricing from launch_config
    SELECT founding_member_price, public_starter_price 
    INTO v_founding_price, v_public_price
    FROM launch_config 
    WHERE id = 1;

    -- Check if user is a verified Founding Member
    IF p_whatsapp_number IS NOT NULL AND p_whatsapp_number <> '' THEN
        SELECT is_founding_member 
        INTO v_is_founding
        FROM waitlist 
        WHERE whatsapp_number = p_whatsapp_number;
    END IF;

    IF COALESCE(v_is_founding, FALSE) THEN
        RETURN v_founding_price;
    ELSE
        RETURN v_public_price;
    END IF;
END;
$$;


-- 5. Strict Row Level Security (RLS) Configuration
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_config ENABLE ROW LEVEL SECURITY;

-- Clear any existing policies
DROP POLICY IF EXISTS "Public can insert waitlist signups" ON waitlist;
DROP POLICY IF EXISTS "Service role & admin can read waitlist" ON waitlist;
DROP POLICY IF EXISTS "Public can view launch config pricing" ON launch_config;
DROP POLICY IF EXISTS "Service role & admin full launch config access" ON launch_config;

-- Waitlist Table RLS Policies:
-- A) Public (anon/authenticated) can ONLY INSERT via signup form (cannot SELECT or UPDATE)
CREATE POLICY "Public can insert waitlist signups" 
ON waitlist 
FOR INSERT 
TO public 
WITH CHECK (true);

-- B) Service role / Owner role has full access (SELECT, UPDATE, DELETE)
CREATE POLICY "Service role & admin can read waitlist" 
ON waitlist 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);


-- Launch Config Table RLS Policies:
-- A) Public can READ pricing & cap info (for landing page / checkout calculation)
CREATE POLICY "Public can view launch config pricing" 
ON launch_config 
FOR SELECT 
TO public 
USING (true);

-- B) Service role / Owner role can UPDATE config parameters
CREATE POLICY "Service role & admin full launch config access" 
ON launch_config 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);
