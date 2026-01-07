-- Create a function to search for media by vector similarity
create or replace function public.match_media (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  public_url text,
  title text,
  ai_description text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    media_library.id,
    media_library.public_url,
    media_library.title,
    media_library.ai_description,
    1 - (media_library.embedding <=> query_embedding) as similarity
  from public.media_library
  where 1 - (media_library.embedding <=> query_embedding) > match_threshold
  order by media_library.embedding <=> query_embedding
  limit match_count;
end;
$$;
