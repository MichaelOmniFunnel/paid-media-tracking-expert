# Core Web Vitals Optimization Report

**Client:** {{client_name}}
**Domain:** {{domain}}
**Date:** {{date}}
**Prepared by:** Claude Code — CWV Optimization System

---

## Executive Summary

{{executive_summary}}

---

## Score Dashboard

### Current Scores

| Metric | Mobile | Desktop | Target | Status |
|--------|--------|---------|--------|--------|
| Performance Score | {{mobile_score}} | {{desktop_score}} | 90+ | {{score_status}} |
| LCP | {{mobile_lcp}} | {{desktop_lcp}} | ≤ 2.5s | {{lcp_status}} |
| CLS | {{mobile_cls}} | {{desktop_cls}} | ≤ 0.1 | {{cls_status}} |
| INP | {{mobile_inp}} | {{desktop_inp}} | ≤ 200ms | {{inp_status}} |
| FCP | {{mobile_fcp}} | {{desktop_fcp}} | ≤ 1.8s | {{fcp_status}} |
| TTFB | {{mobile_ttfb}} | {{desktop_ttfb}} | ≤ 800ms | {{ttfb_status}} |

### Before / After Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Performance Score | {{before_score}} | {{after_score}} | {{score_delta}} |
| LCP | {{before_lcp}} | {{after_lcp}} | {{lcp_delta}} |
| CLS | {{before_cls}} | {{after_cls}} | {{cls_delta}} |
| INP | {{before_inp}} | {{after_inp}} | {{inp_delta}} |

---

## Pages Analyzed

| Page | URL | Template Type | Performance Score |
|------|-----|---------------|-------------------|
{{pages_table}}

---

## Prioritized Fix List

Fixes are ordered by impact score: `(metric_impact x severity x pages_affected) / effort`

{{prioritized_fixes}}

---

## Implementation Roadmap

### Phase 1: Quick Wins (1-2 days)
High impact, low effort changes that can be deployed immediately.

{{quick_wins}}

### Phase 2: Medium Effort (3-5 days)
Significant improvements requiring moderate development work.

{{medium_fixes}}

### Phase 3: Architecture Changes (1-2 weeks)
Structural changes for long-term performance gains.

{{architecture_fixes}}

---

## Verification Instructions

After implementing each fix:

1. Run PSI scan: `bash scripts/psi-fetch.sh "{{domain}}" "MOBILE" "<api_key>" ".cwv/scans/verify-$(date +%s).json"`
2. Compare scores against baseline in `.cwv/history.json`
3. Verify field data improvements in CrUX after 28 days
4. Check for regressions on other pages

---

## Technical Notes

{{technical_notes}}

---

## Appendix: Raw Data

- Baseline scan: `.cwv/scans/{{baseline_scan}}`
- Latest scan: `.cwv/scans/{{latest_scan}}`
- Fix queue: `.cwv/fixes/queue.json`
- Score history: `.cwv/history.json`
