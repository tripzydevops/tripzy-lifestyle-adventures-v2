# ⚠️ IMPORTANT: Shared Database Warning

## Critical Information

**This blog project shares the same Supabase database with Tripzy.travel main app!**

### What This Means:

1. **`public` schema** - Contains tables from Tripzy.travel (deals, users, profiles, etc.)
2. **`blog` schema** - Contains blog-specific tables (isolated from main app)

### Safe Migration Strategy:

✅ **Safe to run:**

- `000_prerequisites.sql` - Uses `CREATE OR REPLACE`, won't break existing functions
- `001_blog_schema.sql` - Everything in `blog` schema, isolated
- `002_additional_tables.sql` - Only creates blog-specific tables

❌ **DO NOT:**

- Drop or modify existing `public` schema tables
- Change existing functions without checking Tripzy.travel dependencies
- Modify `public.profiles` table structure

### Existing Tables (from Tripzy.travel):

These already exist in your database:

- ✅ `public.profiles` - User profiles
- ✅ `public.deals` - Travel deals
- ✅ `public.vendors` - Partner vendors
- ✅ `public.check_is_admin()` - Admin check function (probably)

### New Tables (Blog-specific):

These will be created in the `blog` schema:

- 🆕 `blog.posts`
- 🆕 `blog.categories`
- 🆕 `blog.comments`
- 🆕 `blog.media`
- 🆕 `blog.settings`
- 🆕 `blog.user_signals`
- 🆕 `blog.youtube_videos`
- 🆕 `blog.social_links`
- 🆕 `blog.newsletter_subscribers`

### Schema Isolation Benefits:

✅ Blog tables won't interfere with Tripzy.travel
✅ Can have separate RLS policies
✅ Can backup/restore blog data independently
✅ Easier to manage permissions

### Before Running Migrations:

1. **Backup your database** (just in case)
2. **Check if `check_is_admin()` already exists:**
   ```sql
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name = 'check_is_admin';
   ```
3. **Verify blog schema doesn't exist yet:**
   ```sql
   SELECT schema_name
   FROM information_schema.schemata
   WHERE schema_name = 'blog';
   ```

### Migration Order:

```
1. 000_prerequisites.sql  ← Safe (CREATE OR REPLACE)
2. 001_blog_schema.sql    ← Safe (blog schema only)
3. 002_additional_tables.sql ← Safe (blog schema only)
```

### Cross-Schema Integration:

Both apps can share:

- ✅ `auth.users` - Authentication
- ✅ `public.profiles` - User profiles
- ✅ Admin users can manage both apps

Blog can reference Tripzy deals:

- ✅ `blog.posts.related_deal_ids` - Link blog posts to deals
- ✅ Cross-promotion between blog and main app

---

**Bottom Line:** The migrations are designed to be safe and won't affect your existing Tripzy.travel app! 🎉
