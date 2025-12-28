# 🚀 Tripzy Lifestyle Adventures - Database Setup Guide

## Overview

This guide will help you set up the Supabase database for the Tripzy Lifestyle Adventures blog platform.

## Prerequisites

- Active Supabase project
- Supabase credentials configured in `.env.local`
- Admin access to Supabase SQL Editor

## 📋 Migration Files

The database setup consists of two migration files that must be run **in order**:

### 1. `000_prerequisites.sql` - Foundation Functions

Contains:

- ✅ `check_is_admin()` - Admin role verification function
- ✅ `increment_post_views()` - Post view counter
- ✅ Optional: Vector search functions for semantic search

### 2. `001_blog_schema.sql` - Main Blog Schema

Contains:

- ✅ Blog schema creation
- ✅ All blog tables (posts, categories, comments, media, etc.)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for auto-updates
- ✅ Seed data for categories and social links

## 🔧 Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run Prerequisites Migration

1. Open `supabase/migrations/000_prerequisites.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. ✅ Verify: You should see "Success. No rows returned"

### Step 3: Run Blog Schema Migration

1. Open `supabase/migrations/001_blog_schema.sql`
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click **Run** or press `Ctrl+Enter`
5. ✅ Verify: You should see "Success. No rows returned"

### Step 4: Verify Installation

Run this verification query in the SQL Editor:

```sql
-- Check if blog schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'blog';

-- Check if tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'blog'
ORDER BY table_name;

-- Check if categories were seeded
SELECT name, slug, color FROM blog.categories;

-- Check if admin function exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'check_is_admin';
```

Expected results:

- ✅ Schema: `blog`
- ✅ Tables: `categories`, `comments`, `media`, `newsletter_subscribers`, `posts`, `social_links`, `youtube_videos`
- ✅ Categories: 6 rows (Adventure, Food & Travel, Guides, Lifestyle, Culture, Tips)
- ✅ Function: `check_is_admin`

## 👤 Setting Up Admin User

Your admin user needs the correct role metadata. Run this in SQL Editor:

```sql
-- Replace 'your-user-id' with your actual user ID from auth.users
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

To find your user ID:

```sql
SELECT id, email FROM auth.users;
```

## 🔐 Row Level Security (RLS) Policies

The migration automatically sets up these RLS policies:

### Public Access:

- ✅ Read published posts
- ✅ Read all categories
- ✅ Read approved comments
- ✅ Insert new comments
- ✅ Read YouTube videos
- ✅ Read active social links

### Admin Access:

- ✅ Full CRUD on all tables (requires `check_is_admin()` to return true)

## 🐛 Troubleshooting

### Issue: "function public.check_is_admin() does not exist"

**Solution:** Run `000_prerequisites.sql` first

### Issue: "schema blog does not exist"

**Solution:** Run `001_blog_schema.sql`

### Issue: "Admin can't see posts in dashboard"

**Solution:**

1. Verify your user has admin role:
   ```sql
   SELECT raw_user_meta_data->>'role' as role
   FROM auth.users
   WHERE email = 'your-email@example.com';
   ```
2. Should return `admin`
3. If not, run the "Setting Up Admin User" SQL above

### Issue: "Posts have no views column"

**Solution:** The updated migration now includes the `views` column. If you ran the old version:

```sql
ALTER TABLE blog.posts ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
```

## 📊 Optional: Enable Semantic Search

To enable AI-powered semantic search with embeddings:

1. Uncomment the vector search section in `000_prerequisites.sql`
2. Uncomment the `embedding` column in `001_blog_schema.sql`
3. Run both migrations again (they're idempotent)
4. Ensure `VITE_GEMINI_API_KEY` is set in `.env.local`

## ✅ Post-Setup Checklist

- [ ] Both migration files executed successfully
- [ ] Blog schema exists
- [ ] All 7 tables created
- [ ] 6 categories seeded
- [ ] 4 social links seeded
- [ ] Admin user role set
- [ ] Admin can access `/admin/dashboard`
- [ ] No errors in browser console

## 🎉 Next Steps

Once setup is complete:

1. Refresh your admin dashboard at `http://localhost:3000/admin/dashboard`
2. You should see stats cards with zeros (no posts yet)
3. Create your first post via "New Adventure" button
4. Start building your content!

## 📞 Need Help?

If you encounter issues:

1. Check browser console (F12) for detailed errors
2. Check Supabase logs in the dashboard
3. Verify `.env.local` has correct credentials
4. Ensure you're logged in as an admin user
