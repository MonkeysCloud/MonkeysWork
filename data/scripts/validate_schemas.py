#!/usr/bin/env python3
"""Validate all JSON event schemas."""
import json
import glob
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("Install jsonschema: pip install jsonschema")
    sys.exit(1)

schema_dir = Path(__file__).parent.parent / "schemas"
errors = 0

for schema_file in sorted(schema_dir.glob("*.json")):
    try:
        with open(schema_file) as f:
            schema = json.load(f)
        jsonschema.Draft7Validator.check_schema(schema)
        print(f"  ✅ {schema_file.name}")
    except Exception as e:
        print(f"  ❌ {schema_file.name}: {e}")
        errors += 1

if errors:
    print(f"\n{errors} schema(s) failed validation")
    sys.exit(1)
else:
    print(f"\nAll schemas valid!")
