# 🎯 Quick Fix: Admin Dashboard Blank Screen

## Root Cause

The admin dashboard is blank because the `public.check_is_admin()` function doesn't exist in your Supabase database, causing RLS policies to fail.

## ⚡ Quick Fix (5 minutes)

### Step 1: Run Prerequisites Migration

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy & paste this:

```sql
-- Create admin check function
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view counter function
CREATE OR REPLACE FUNCTION public.increment_post_views(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE blog.posts
  SET views = COALESCE(views, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. Click **Run**

### Step 2: Set Your User as Admin

Replace `your-email@example.com` with your actual email:

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your-email@example.com';
```

### Step 3: Verify Setup

```sql
-- Should return 'admin'
SELECT raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 4: Refresh Dashboard

1. Go to http://localhost:3000/admin/dashboard
2. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. ✅ You should now see the dashboard!

## If Still Blank

Check browser console (F12) for errors and share them with me.

## Files Created

- ✅ `supabase/migrations/000_prerequisites.sql` - Full prerequisite migration
- ✅ `docs/DATABASE_SETUP.md` - Complete setup guide
- ✅ Updated `001_blog_schema.sql` - Added missing `views` column
