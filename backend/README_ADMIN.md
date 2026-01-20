# Tripzy Backend Admin Scripts

This directory contains administrative and utility scripts for the Tripzy backend system.

## Quick Reference

| Script        | Purpose                   | Usage                           |
| ------------- | ------------------------- | ------------------------------- |
| `check_*.py`  | Diagnostic scripts        | `python check_maps.py`          |
| `test_*.py`   | Test utilities            | `python test_research_agent.py` |
| `verify_*.py` | Verification scripts      | `python verify_memory_setup.py` |
| `fix_*.py`    | Data correction utilities | `python fix_seo.py`             |

## Prerequisites

```bash
# Ensure environment variables are set
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
VITE_GEMINI_API_KEY=your_gemini_key
```

## Common Tasks

### Check System Status

```bash
# Check if all posts have maps
python check_maps.py

# Check database schema
python check_schema.py

# Check storage bucket
python check_storage.py

# Check available models
python check_models.py
```

### Run Tests

```bash
# Test research agent
python test_research_agent.py

# Test visual search
python test_visual_search.py

# Run all unit tests
cd tests && pytest
```

### Verify Setup

```bash
# Verify memory agent setup
python verify_memory_setup.py

# Verify metadata status
python verify_metadata.py
```

## Script Categories

### 📊 Check Scripts (`check_*.py`)

Diagnostic scripts that inspect the system state and report issues.

- **check_dates.py** - Verify post date formats
- **check_maps.py** - Ensure all posts have map entries
- **check_models.py** - List available Gemini models
- **check_posts_summary.py** - Show recent posts summary
- **check_rpcs.py** - List exposed RPC functions
- **check_schema.py** - Analyze database schema
- **check_storage.py** - Inspect Supabase storage bucket

### 🧪 Test Scripts (`test_*.py`)

Test individual components and agents.

- **test_agent_direct.py** - Test agent workflow directly
- **test_research_agent.py** - Test research/scout functionality
- **test_visual_search.py** - Test visual memory

search

- **test_seo_tool.py** - Test SEO utilities
- **test_unsplash.py** - Test Unsplash integration

### ✅ Verify Scripts (`verify_*.py`)

Verification scripts that confirm system setup and data integrity.

- **verify_memory_setup.py** - Verify memory agent configuration
- **verify_metadata.py** - Check post metadata completeness
- **verify_consensus.py** - Test consensus agent
- **verify_repairs.py** - Verify data repair operations

### 🔧 Fix/Utility Scripts

One-off utilities for data manipulation and fixes.

- **fix_seo.py** - Fix SEO metadata for posts
- **fix_emoji_encoding.py** - Fix emoji encoding issues
- **generate_content.py** - Generate blog posts with AI
- **refine_post_metadata.py** - Add granular location metadata
- **list_posts_by_location.py** - List posts grouped by location

## Best Practices

### Using the Logger

All new scripts should use the centralized logger:

```python
from utils.logger import get_logger

logger = get_logger(__name__)

logger.info("Operation started")
logger.error("Operation failed", exc_info=True)
```

### Using the Template

For new admin scripts, start with the template:

```bash
cp utils/admin_script_template.py my_new_script.py
```

The template includes:

- ✅ UTF-8 encoding
- ✅ Proper timeout configuration
- ✅ Environment variable validation
- ✅ Error handling
- ✅ Structured logging

### Async Best Practices

```python
# ✅ GOOD: Proper timeout configuration
timeout = aiohttp.ClientTimeout(total=None, connect=10.0, sock_read=30.0)
async with aiohttp.ClientSession(timeout=timeout) as session:
    ...

# ✅ GOOD: Thread-safe blocking calls
result = await asyncio.to_thread(blocking_function, args)

# ❌ BAD: Blocking call in async function
result = blocking_function(args)  # Don't do this!
```

## Troubleshooting

### Script Freezes

If a script hangs indefinitely:

1. Check network connectivity
2. Verify API keys are correct
3. Check timeout configurations
4. Review error logs in `backend/logs/`

### Environment Variable Errors

```bash
# Verify environment variables
python check_keys.py

# Or check manually
python -c "import os; print(os.getenv('VITE_SUPABASE_URL'))"
```

### Permission Errors

Ensure you're using the correct Supabase key:

- **Service Role Key**: Full database access (use cautiously)
- **Anon Key**: Limited access with RLS enforcement

## Development Workflow

1. **Write new script** using the template
2. **Add logging** instead of print statements
3. **Add documentation** (module docstring + usage examples)
4. **Write tests** in `tests/admin/`
5. **Test locally** before committing
6. **Document** in this README

## Logs

All scripts log to:

- **Console**: Colored output for immediate feedback
- **File**: `backend/logs/admin_YYYYMMDD.log`

View today's logs:

```bash
cat backend/logs/admin_$(date +%Y%m%d).log
```

## Getting Help

- Check script docstring: `python script.py --help` (if implemented)
- View source code: All scripts are well-commented
- Ask the team: Reference the R&D design logs in `docs/rd_archive/`

## Related Documentation

- [Admin Script Template](utils/admin_script_template.py)
- [Logging Utility](utils/logger.py)
- [Test Suite](tests/README.md)
- [R&D Archive](../docs/rd_archive/)
