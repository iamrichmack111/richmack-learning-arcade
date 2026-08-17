#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
schema_path = ROOT / "schemas" / "learning-result.schema.json"
docs_path = ROOT / "docs" / "LEARNING_RESULT_SCHEMA.md"

schema = json.loads(schema_path.read_text())
required = {"version","student_id","game_id","subject","skill","duration_seconds","timestamp"}

if set(schema.get("required", [])) != required:
    raise SystemExit("Schema required fields mismatch")

props = schema.get("properties", {})
for field in required:
    if field not in props:
        raise SystemExit(f"Missing property: {field}")

if props["version"].get("const") != 1:
    raise SystemExit("Schema version must be 1")

accuracy = props.get("accuracy", {})
if accuracy.get("minimum") != 0 or accuracy.get("maximum") != 1:
    raise SystemExit("Accuracy must be normalized from 0 to 1")

docs = docs_path.read_text()
for phrase in ["Fraction Food Truck","Clownword Desert","Versioning","Privacy","duration_seconds"]:
    if phrase not in docs:
        raise SystemExit(f"Documentation check failed: {phrase}")

print("Learning-result schema PASS")
print("Version: 1")
print(f"Required fields: {len(required)}")
print("Accuracy range: 0..1")
print("Documentation examples: PASS")
