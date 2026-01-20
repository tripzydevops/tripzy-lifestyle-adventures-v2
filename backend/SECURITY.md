# Security Best Practices for Tripzy Backend

**Date**: January 20, 2026  
**Version**: 1.0

---

## Overview

This document outlines security best practices for the Tripzy backend, focusing on API key management, database access, and secure coding patterns.

---

## API Key Management

### Environment Variables

**✅ DO**:

```python
# Load from environment
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
```

**❌ DON'T**:

```python
# Never hardcode secrets
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # BAD!
```

### Logging Sensitive Data

**✅ DO**:

```python
from utils.logger import get_logger, mask_sensitive_data

logger = get_logger(__name__)
safe_data = mask_sensitive_data({"api_key": key, "user": "john"})
logger.info(f"Request data: {safe_data}")
# Logs: {"api_key": "***REDACTED***", "user": "john"}
```

**❌ DON'T**:

```python
print(f"Using key: {api_key}")  # Exposes key in logs!
logger.error(f"Failed with key {key}")  # BAD!
```

---

## Database Access Patterns

### Service Role Key vs. Anon Key

#### Service Role Key (Bypass RLS)

**When to Use**:

- Admin scripts that need full database access
- Data migration/backfill operations
- System maintenance tasks

**Security Implications**:

- ⚠️ **Bypasses Row Level Security (RLS)**
- ⚠️ **Full read/write access to all data**
- ⚠️ **If compromised, entire database is exposed**

**Best Practice**:

```python
# Only use when absolutely necessary
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Add comment explaining why service role is needed
# SECURITY: Using service role key for admin data export
```

#### Anon Key (Respects RLS)

**When to Use**:

- User-facing API endpoints
- Frontend applications
- Any script that doesn't need admin access

**Best Practice**:

```python
# Prefer anon key when possible
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
```

### Current Usage Audit

**Scripts Using Service Role Key** (16 scripts):

**Check Scripts** (7):

- ✅ `check_dates.py` - Legitimate (inspects all posts)
- ✅ `check_maps.py` - Legitimate (validates all post-map relationships)
- ✅ `check_models.py` - N/A (doesn't use Supabase)
- ✅ `check_posts_summary.py` - Legitimate (admin view of all posts)
- ✅ `check_rpcs.py` - Could use anon key ⚠️
- ✅ `check_schema.py` - Legitimate (admin schema analysis)
- ✅ `check_storage.py` - Legitimate (admin bucket inspection)

**Fix Scripts** (5):

- ✅ All fix scripts - Legitimate (admin data correction)

**Verify Scripts** (4):

- ✅ All verify scripts - Legitimate (admin verification)

**Recommendation**:

- 15/16 scripts appropriately use service role key
- Consider using anon key for `check_rpcs.py` if it doesn't need admin access

---

## Timeout Configuration

### Network Call Timeouts

**✅ DO**:

```python
timeout = aiohttp.ClientTimeout(
    total=None,
    connect=10.0,    # Prevent indefinite connection attempts
    sock_read=30.0   # Prevent hanging on slow responses
)

async with aiohttp.ClientSession(timeout=timeout) as session:
    async with session.get(url, headers=headers) as resp:
        ...
```

**❌ DON'T**:

```python
# No timeout = security risk (DoS, resource exhaustion)
async with aiohttp.ClientSession() as session:
    async with session.get(url, headers=headers) as resp:
        ...
```

---

## Input Validation

### User Input Sanitization

**✅ DO**:

```python
from pydantic import BaseModel, Field

class PostQuery(BaseModel):
    query: str = Field(..., max_length=500)
    limit: int = Field(default=10, ge=1, le=100)
```

**❌ DON'T**:

```python
# No validation = SQL injection, XSS risks
query = request.json["query"]  # Dangerous!
```

### SQL Injection Prevention

**✅ DO**:

```python
# Use parameterized queries with Supabase client
result = supabase.table("posts").select("*").eq("id", post_id).execute()
```

**❌ DON'T**:

```python
# String interpolation in SQL = SQL injection risk
query = f"SELECT * FROM posts WHERE id = '{post_id}'"  # NEVER!
```

---

## Error Handling

### Avoid Information Leakage

**✅ DO**:

```python
try:
    result = await api_call()
except Exception as e:
    logger.error("API call failed", exc_info=True)  # Logs full trace
    return {"error": "An error occurred"}  # Generic user message
```

**❌ DON'T**:

```python
try:
    result = await api_call()
except Exception as e:
    return {"error": str(e)}  # Exposes internal details!
```

---

## File System Security

### Path Traversal Prevention

**✅ DO**:

```python
from pathlib import Path

ALLOWED_DIR = Path("/app/uploads").resolve()

def save_file(filename: str, content: bytes):
    filepath = (ALLOWED_DIR / filename).resolve()

    # Verify path is within allowed directory
    if not str(filepath).startswith(str(ALLOWED_DIR)):
        raise ValueError("Invalid file path")

    filepath.write_bytes(content)
```

**❌ DON'T**:

```python
# Path traversal vulnerability
def save_file(filename: str, content: bytes):
    with open(f"/app/uploads/{filename}", "wb") as f:  # Dangerous!
        f.write(content)
# User could pass "../../../etc/passwd"
```

---

## Dependency Security

### Regular Updates

```bash
# Check for vulnerabilities
pip-audit

# Update dependencies
pip install --upgrade -r requirements.txt
```

### Pin Versions

**✅ DO**:

```txt
# requirements.txt
aiohttp==3.9.1
pydantic==2.5.0
```

**❌ DON'T**:

```txt
# Unpinned versions = security risk
aiohttp
pydantic
```

---

## Rate Limiting

### API Call Limits

**✅ DO**:

```python
from utils.async_utils import RateLimiter

rate_limiter = RateLimiter(max_calls=100, period=60)  # 100 calls/min

async def api_call():
    async with rate_limiter:
        response = await make_request()
```

---

## Security Checklist

Before deploying any script:

- [ ] No hardcoded secrets or API keys
- [ ] Sensitive data masked in logs
- [ ] Appropriate key used (service vs. anon)
- [ ] Timeout configurations in place
- [ ] Input validation implemented
- [ ] Error messages don't leak internal details
- [ ] File paths validated (no traversal)
- [ ] Dependencies up to date
- [ ] Rate limiting where applicable
- [ ] Code reviewed for security issues

---

## Incident Response

If a security issue is discovered:

1. **Immediately** rotate compromised API keys
2. Review access logs for suspicious activity
3. Document the incident in `backend/logs/security/`
4. Update this document with lessons learned
5. Notify the team

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)

---

**Last Updated**: January 20, 2026  
**Next Review**: February 20, 2026
