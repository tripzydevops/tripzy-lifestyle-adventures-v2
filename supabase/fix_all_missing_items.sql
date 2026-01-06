-- =============================================
-- UNIFIED FIX SCRIPT FOR TRIPZY
-- =============================================
-- This script fixes ALL missing tables and functions.
-- Run this in the Supabase SQL Editor.

-- 1. Enable pgvector extension (Required for AI Search)
create extension if not exists vector with schema extensions;

-- 2. Create 'blog' schema if it doesn't exist
create schema if not exists blog;

-- =============================================
-- FIX 1: USER SIGNALS TABLE (Fixes "relation does not exist" error)
-- =============================================
create table if not exists blog.user_signals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  signal_type text not null, -- 'view', 'click', 'search', 'time_spent'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS
alter table blog.user_signals enable row level security;

-- Policies for Signals (Drop first to ensure idempotency)
drop policy if exists "Public can insert signals" on blog.user_signals;
create policy "Public can insert signals"
  on blog.user_signals for insert
  with check (true);

drop policy if exists "Users see their own signals" on blog.user_signals;
create policy "Users see their own signals"
  on blog.user_signals for select
  using (auth.uid() = user_id);

-- =============================================
-- FIX 2: VECTOR SEARCH (Fixes "function match_posts not found" error)
-- =============================================

-- Ensure posts table has embedding column
alter table blog.posts 
add column if not exists embedding vector(768);

-- Create the search function (Drop first to avoid return type conflicts)
drop function if exists blog.match_posts;
create or replace function blog.match_posts (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  slug text,
  category text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    blog.posts.id,
    blog.posts.title,
    blog.posts.slug,
    blog.posts.category,
    1 - (blog.posts.embedding <=> query_embedding) as similarity
  from blog.posts
  where 1 - (blog.posts.embedding <=> query_embedding) > match_threshold
  order by blog.posts.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- =============================================
-- FIX 3: PERMISSIONS (Fixes "403 Permission Denied" errors)
-- =============================================

-- Grant Usage on Schema
grant usage on schema blog to postgres, anon, authenticated, service_role;

-- Grant Table Permissions
grant all privileges on all tables in schema blog to postgres, service_role;
grant select, insert, update on all tables in schema blog to anon, authenticated;
grant all privileges on all sequences in schema blog to anon, authenticated;

-- Grant Function Permissions (Crucial for match_posts)
grant execute on function blog.match_posts to anon, authenticated, service_role;

-- Verify
select 'SUCCESS: All tables and functions created.' as result;
