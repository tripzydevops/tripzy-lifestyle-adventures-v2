-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the developer_knowledge table
CREATE TABLE IF NOT EXISTS public.developer_knowledge (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_title TEXT NOT NULL,
    description TEXT NOT NULL,
    root_cause TEXT,
    solution TEXT NOT NULL,
    tech_stack TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    embedding vector(768), -- Dimension for Gemini text-embedding-004
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search configuration
    fts tsvector GENERATED ALWAYS AS (
        to_tsvector('english', problem_title || ' ' || description)
    ) STORED
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_dev_knowledge_embedding ON public.developer_knowledge USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_dev_knowledge_fts ON public.developer_knowledge USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_dev_knowledge_metadata ON public.developer_knowledge USING gin(metadata);

-- Function to match related problems (Semantic Search)
CREATE OR REPLACE FUNCTION match_developer_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  problem_title TEXT,
  description TEXT,
  root_cause TEXT,
  solution TEXT,
  tech_stack TEXT[],
  metadata JSONB,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dk.id,
    dk.problem_title,
    dk.description,
    dk.root_cause,
    dk.solution,
    dk.tech_stack,
    dk.metadata,
    1 - (dk.embedding <=> query_embedding) AS similarity
  FROM developer_knowledge dk
  WHERE 1 - (dk.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
