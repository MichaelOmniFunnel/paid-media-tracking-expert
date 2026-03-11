# Initialize planning files for a new session
# Usage: .\init-session.ps1 [project-name]

param(
    [string]$ProjectName = "project"
)

$DATE = Get-Date -Format "yyyy-MM-dd"

Write-Host "Initializing planning files for: $ProjectName"

# Create task_plan.md if it doesn't exist
if (-not (Test-Path "task_plan.md")) {
    @"
# Task Plan: [Brief Description]

## Goal
[One sentence describing the end state]

## Current Phase
Phase 1

## Phases

### Phase 1: Discovery
- [ ] Understand requirements
- [ ] Identify constraints
- [ ] Document in findings.md
- **Status:** in_progress

### Phase 2: Analysis
- [ ] Execute analysis
- [ ] Record findings
- **Status:** pending

### Phase 3: Synthesis
- [ ] Compile results
- [ ] Draft deliverable
- **Status:** pending

### Phase 4: Verification
- [ ] Verify completeness
- [ ] Check quality
- **Status:** pending

### Phase 5: Delivery
- [ ] Present results
- [ ] Update Asana
- **Status:** pending

## Decisions Made
| Decision | Rationale |
|----------|-----------|

## Errors Encountered
| Error | Resolution |
|-------|------------|
"@ | Out-File -FilePath "task_plan.md" -Encoding UTF8
    Write-Host "Created task_plan.md"
} else {
    Write-Host "task_plan.md already exists, skipping"
}

# Create findings.md if it doesn't exist
if (-not (Test-Path "findings.md")) {
    @"
# Findings

## Key Data Points
-

## Evidence
-

## Issues Found
| Issue | Severity | Evidence | Impact |
|-------|----------|----------|--------|

## Technical Notes
-
"@ | Out-File -FilePath "findings.md" -Encoding UTF8
    Write-Host "Created findings.md"
} else {
    Write-Host "findings.md already exists, skipping"
}

# Create progress.md if it doesn't exist
if (-not (Test-Path "progress.md")) {
    @"
# Progress Log

## Session: $DATE

### Current Status
- **Phase:** 1 - Discovery
- **Started:** $DATE

### Actions Taken
-

### Verification Results
| Check | Method | Result | Status |
|-------|--------|--------|--------|

### Errors
| Error | Resolution |
|-------|------------|
"@ | Out-File -FilePath "progress.md" -Encoding UTF8
    Write-Host "Created progress.md"
} else {
    Write-Host "progress.md already exists, skipping"
}

Write-Host ""
Write-Host "Planning files initialized!"
Write-Host "Files: task_plan.md, findings.md, progress.md"
