---
name: test-all
description: Runs the complete test suite for both backend and frontend. Use to verify all tests pass.
---

# Test All Skill

Runs the complete test suite for both backend and frontend.

## Usage

```
/test-all
```

## Steps

1. Run backend tests from the root directory:
   ```bash
   npm test
   ```

2. Run frontend tests:
   ```bash
   cd frontend && npm test
   ```

3. Report results summary to the user, including any failures.
