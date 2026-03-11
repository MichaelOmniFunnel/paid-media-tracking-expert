#!/bin/bash
# Initialize planning files for a new session
# Usage: ./init-session.sh [project-name]

set -e

PROJECT_NAME="${1:-project}"
DATE=$(date +%Y-%m-%d)

echo "Initializing planning files for: $PROJECT_NAME"

# Create task_plan.md if it doesn't exist
if [ ! -f "task_plan.md" ]; then
    cat > task_plan.md << 'EOF'
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
EOF
    echo "Created task_plan.md"
else
    echo "task_plan.md already exists, skipping"
fi

# Create findings.md if it doesn't exist
if [ ! -f "findings.md" ]; then
    cat > findings.md << 'EOF'
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
EOF
    echo "Created findings.md"
else
    echo "findings.md already exists, skipping"
fi

# Create progress.md if it doesn't exist
if [ ! -f "progress.md" ]; then
    cat > progress.md << EOF
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
EOF
    echo "Created progress.md"
else
    echo "progress.md already exists, skipping"
fi

echo ""
echo "Planning files initialized!"
echo "Files: task_plan.md, findings.md, progress.md"
