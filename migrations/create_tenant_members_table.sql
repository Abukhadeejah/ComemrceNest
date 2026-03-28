-- Create tenant_members table for admin access control
CREATE TABLE IF NOT EXISTS tenant_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);

-- Add RLS policies
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own memberships
CREATE POLICY "Users can view own memberships" ON tenant_members
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Tenant admins can manage memberships for their tenant
CREATE POLICY "Tenant admins can manage memberships" ON tenant_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm 
            WHERE tm.tenant_id = tenant_members.tenant_id 
            AND tm.user_id = auth.uid() 
            AND tm.role = 'tenant_admin'
        )
    );

-- Insert a default admin user (you'll need to update the user_id)
-- This is commented out - run manually with actual user ID
-- INSERT INTO tenant_members (tenant_id, user_id, role) 
-- VALUES ('1e4c9aa7-e7af-4fe7-999b-c9c46219fa3c', 'YOUR_USER_ID_HERE', 'tenant_admin')
-- ON CONFLICT (tenant_id, user_id) DO NOTHING;