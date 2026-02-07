# Model Registry Naming Convention

## Format
```
mw-{model_name}-v{major}.{minor}.{patch}
```

## Examples
- `mw-scope-assistant-v1.0.0`
- `mw-match-v1-v1.2.0`
- `mw-fraud-v1-v1.0.3`

## Versioning Rules
- **MAJOR** — Architecture change, new input/output contract
- **MINOR** — Retraining with new features, improved metrics
- **PATCH** — Same features, different hyperparams or data refresh

## Labels (applied to all models)
- `model_name`: e.g., `mw-scope-assistant`
- `version`: e.g., `v1.0.0`
- `pipeline`: e.g., `mw-scope-assistant-pipeline`
- `environment`: `dev`, `staging`, `prod`
- `trained_at`: ISO timestamp
