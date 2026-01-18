"""
Index the Windows encoding incident into MemoryAgent.
Run once to populate the developer_knowledge table.
"""
import sys
# FORCE UTF-8 ENCODING for Windows compatibility
sys.stdout.reconfigure(encoding='utf-8')

import asyncio
import os

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.agents.memory_agent import memory_agent

INCIDENT_CONTEXT = """
INCIDENT ID: ARRE-2026-003-002
DATE: 2026-01-18
TITLE: Windows Terminal Emoji/Unicode Encoding Failure

SYMPTOMS:
- Script crashes with: UnicodeEncodeError: 'charmap' codec can't encode character
- Error mentions characters like '\U0001f4dd' (emoji codepoints)
- Only occurs on Windows terminals using legacy encodings (cp1252, cp1250)
- Scripts work fine on Linux/macOS or in UTF-8 enabled terminals

ROOT CAUSE ANALYSIS:
Windows Command Prompt and PowerShell default to legacy ANSI code pages (e.g., cp1252)
that cannot represent Unicode emojis. When Python tries to print an emoji like "📝",
it asks the terminal "How do I encode this?" and the terminal responds with an error
because the legacy encoding has no mapping for modern Unicode characters.

This is NOT a Python bug—it's a Windows terminal configuration issue that Python
inherits via sys.stdout.encoding.

SOLUTION APPLIED:
Add the following two lines at the VERY TOP of any Python script that prints emojis:

```python
import sys
sys.stdout.reconfigure(encoding='utf-8')
```

This forces Python's stdout to use UTF-8 encoding regardless of the terminal's
default settings. VS Code's integrated terminal handles UTF-8 correctly.

ALTERNATIVE SOLUTIONS:
1. Set PYTHONIOENCODING=utf-8 environment variable (system-wide fix)
2. Use Windows Terminal instead of legacy cmd.exe (supports UTF-8 natively)
3. Remove emojis from print statements (not recommended, reduces UX)

TECH STACK: Python, Windows, PowerShell, UTF-8, Unicode
SEVERITY: Low (cosmetic crash, easy fix)

LESSONS LEARNED:
- Always add sys.stdout.reconfigure(encoding='utf-8') to scripts with emoji output
- This should be a STANDARD TEMPLATE for all new Python scripts in this project
- Windows compatibility requires explicit encoding configuration

FILES FIXED:
- embed_posts.py
- index_async_incident.py

DETECTION PATTERN:
Look for "UnicodeEncodeError" + "charmap" + emoji codepoints starting with \U0001
"""

async def main():
    print("📝 Indexing Windows encoding incident into MemoryAgent...")
    
    try:
        result = await memory_agent.index_problem(
            conversation_context=INCIDENT_CONTEXT,
            metadata={
                "incident_id": "ARRE-2026-003-002",
                "date": "2026-01-18",
                "severity": "low",
                "category": "windows-encoding",
                "files_affected": ["embed_posts.py", "index_async_incident.py"],
                "error_pattern": "UnicodeEncodeError charmap codec"
            }
        )
        print(f"✅ Successfully indexed! Record: {result}")
    except Exception as e:
        print(f"❌ Failed to index: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(main())
