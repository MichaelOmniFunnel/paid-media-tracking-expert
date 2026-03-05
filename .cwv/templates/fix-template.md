# Fix: {{fix_title}}

**Fix ID:** {{fix_id}}
**Priority:** {{priority}} (Impact Score: {{impact_score}})
**Metric:** {{target_metric}}
**Status:** {{status}}

---

## Issue Description

{{issue_description}}

### Evidence

- **PSI Audit:** {{psi_audit_id}}
- **Current Value:** {{current_value}}
- **Target Value:** {{target_value}}
- **Potential Savings:** {{savings}}

### Affected Pages

| Page | URL | Current Metric Value |
|------|-----|---------------------|
{{affected_pages}}

---

## Root Cause

{{root_cause}}

---

## Implementation

### Complete Code

{{implementation_code}}

### Step-by-Step Instructions

{{step_by_step}}

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
{{files_table}}

---

## Expected Improvement

| Metric | Before | Expected After | Improvement |
|--------|--------|----------------|-------------|
{{expected_improvement}}

---

## Verification

1. {{verification_step_1}}
2. {{verification_step_2}}
3. {{verification_step_3}}

### Quick Verification Command

```bash
bash scripts/psi-fetch.sh "{{page_url}}" "MOBILE" "<api_key>" ".cwv/scans/verify-{{fix_id}}.json"
```

---

## Rollback Plan

If this fix causes regressions:

{{rollback_plan}}
