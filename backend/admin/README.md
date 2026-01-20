# Admin Scripts

This directory contains all administrative utility scripts organized by purpose.

## Structure

```
admin/
├── check/     # Diagnostic scripts that inspect system state
├── fix/       # Data correction and repair utilities
└── verify/    # Verification scripts that confirm setup
```

## Usage

### Check Scripts

```bash
cd admin/check
python check_maps.py
python check_schema.py
```

### Fix Scripts

```bash
cd admin/fix
python fix_seo.py
python fix_emoji_encoding.py
```

### Verify Scripts

```bash
cd admin/verify
python verify_memory_setup.py
python verify_metadata.py
```

## Documentation

See [backend/README_ADMIN.md](../README_ADMIN.md) for detailed documentation on all scripts.
