# Tripzy Backend Tests

This directory contains all unit tests, integration tests, and system tests for the Tripzy backend.

## Structure

```
tests/
├── admin/           # Tests for admin utilities
│   ├── test_check_scripts.py
│   └── test_verify_scripts.py
├── agents/          # Tests for agent logic
├── utils/           # Tests for utility functions
└── integration/     # End-to-end integration tests
```

## Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/admin/test_check_scripts.py

# Run with coverage
pytest --cov=backend --cov-report=html

# Run with verbose output
pytest -v
```

## Writing Tests

Follow the existing patterns in test files. Use async tests for async functions:

```python
import pytest

@pytest.mark.asyncio
async def test_my_async_function():
    result = await my_function()
    assert result is not None
```

## Test Data

Test data and fixtures are stored in `tests/fixtures/`.
