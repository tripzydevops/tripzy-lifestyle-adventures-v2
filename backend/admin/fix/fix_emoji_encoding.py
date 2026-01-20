"""
Fix Emoji Encoding Issues Across Backend
Replaces emoji characters with ASCII text markers to prevent UnicodeEncodeError on Windows cp1254 console.
"""

import os
import re

# Mapping of common emojis to text equivalents
EMOJI_REPLACEMENTS = {
    '[SEARCH]': '[SEARCH]',
    '[OK]': '[OK]',
    '[ERROR]': '[ERROR]',
    '[WARNING]': '[WARNING]',
    '[FIX]': '[FIX]',
    '[TIP]': '[TIP]',
    '[DATA]': '[DATA]',
    '[TARGET]': '[TARGET]',
    '[START]': '[START]',
    '[DELETE]': '[DELETE]',
    '[IMAGE]': '[IMAGE]',
    '[MAP]': '[MAP]',
    '[CONFIG]': '[CONFIG]',
    '[NOTE]': '[NOTE]',
    '[SECURITY]': '[SECURITY]',
    '[KEY]': '[KEY]',
    '[FILE]': '[FILE]',
    '[FOLDER]': '[FOLDER]',
    '[SAVE]': '[SAVE]',
    '[UPLOAD]': '[UPLOAD]',
    '[DOWNLOAD]': '[DOWNLOAD]',
    '[REFRESH]': '[REFRESH]',
    '[WAIT]': '[WAIT]',
    '[NEW]': '[NEW]',
    '[SUCCESS]': '[SUCCESS]',
    '[CRASH]': '[CRASH]',
    '[BUG]': '[BUG]',
    '[HOT]': '[HOT]',
    '[COLD]': '[COLD]',
    '[WEB]': '[WEB]',
    '[HOME]': '[HOME]',
    '[LOCATION]': '[LOCATION]',
    '[TAG]': '[TAG]',
    '[PIN]': '[PIN]',
    '[LINK]': '[LINK]',
    '[EMAIL]': '[EMAIL]',
    '[USER]': '[USER]',
    '[USERS]': '[USERS]',
    '[BOT]': '[BOT]',
    '[COMMENT]': '[COMMENT]',
    '[ANNOUNCE]': '[ANNOUNCE]',
    '[NOTIFY]': '[NOTIFY]',
    '[STAR]': '[STAR]',
    '[!]': '[!]',
    '[?]': '[?]',
    '[->]': '[->]',
    '[<-]': '[<-]',
    '[UP]': '[UP]',
    '[DOWN]': '[DOWN]',
    '[RED]': '[RED]',
    '[GREEN]': '[GREEN]',
    '[YELLOW]': '[YELLOW]',
    '[BLUE]': '[BLUE]',
}

def fix_file(filepath):
    """Fix emojis in a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"   [SKIP] Cannot read (encoding issue): {filepath}")
        return 0
    
    original_content = content
    replacements_made = 0
    
    for emoji, replacement in EMOJI_REPLACEMENTS.items():
        if emoji in content:
            count = content.count(emoji)
            content = content.replace(emoji, replacement)
            replacements_made += count
    
    if replacements_made > 0:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   [OK] Fixed {replacements_made} emojis in: {os.path.basename(filepath)}")
    
    return replacements_made

def main():
    print("[START] Scanning backend directory for emoji characters...")
    
    backend_dir = "backend"
    total_fixed = 0
    files_fixed = 0
    
    for root, dirs, files in os.walk(backend_dir):
        # Skip __pycache__ directories
        dirs[:] = [d for d in dirs if d != '__pycache__']
        
        for filename in files:
            if filename.endswith('.py'):
                filepath = os.path.join(root, filename)
                fixed = fix_file(filepath)
                if fixed > 0:
                    total_fixed += fixed
                    files_fixed += 1
    
    print(f"\n--- Summary ---")
    print(f"Files modified: {files_fixed}")
    print(f"Total emoji replacements: {total_fixed}")
    print(f"[OK] Emoji cleanup complete!")

if __name__ == "__main__":
    main()
