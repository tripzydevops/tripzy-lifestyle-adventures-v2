-- Create Usage Logs table for Financial Observability
CREATE TABLE IF NOT EXISTS blog.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_name TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    session_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Index for faster reporting
    CONSTRAINT fk_agent_name CHECK (agent_name IN ('CrossDomainAgent', 'VisualIntelligenceAgent', 'ConsensusAgent', 'RecommendationEngine'))
);

-- Enable RLS (Senior Scientist standard)
ALTER TABLE blog.usage_logs ENABLE ROW LEVEL SECURITY;

-- Allow Service Role full access for backend logging
DROP POLICY IF EXISTS "Public Insert Access" ON blog.usage_logs;
CREATE POLICY "Public Insert Access" ON blog.usage_logs
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow Service Role full access
DROP POLICY IF EXISTS "Service Role Full Access" ON blog.usage_logs;
CREATE POLICY "Service Role Full Access" ON blog.usage_logs
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Explicitly grant permissions to anon (public) for R&D access
GRANT USAGE ON SCHEMA blog TO anon;
GRANT USAGE ON SCHEMA blog TO authenticated;
GRANT ALL ON TABLE blog.usage_logs TO anon;
GRANT ALL ON TABLE blog.usage_logs TO authenticated;
