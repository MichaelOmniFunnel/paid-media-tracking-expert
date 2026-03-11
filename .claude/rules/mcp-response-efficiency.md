# MCP Response Efficiency Rules

## Problem

MCP tools can return massive responses that consume context tokens. GA4 reports, Google Ads GAQL results, and Meta Ads insights can each produce hundreds of lines. Without discipline, a single multi-platform audit can fill 30%+ of the context window with raw data.

## High Volume Tools (most likely to produce large responses)

| Tool | Typical Size | Mitigation |
|---|---|---|
| mcp__google-ads__run_gaql / execute_gaql_query | 50 to 500+ rows | Always use LIMIT clause. Default to LIMIT 50 unless more is specifically needed. |
| mcp__google-ads__get_campaign_performance | All campaigns | Filter by date range, request only needed metrics |
| mcp__google-analytics__run_report | Varies by dimensions | Limit dimensions to 2 to 3 max. Use date range filters. Request row limit. |
| mcp__meta-ads__get_insights | Full breakdown data | Specify date_preset, limit fields to what's needed |
| mcp__meta-ads__get_campaigns / get_adsets / get_ads | All entities | Filter by status (ACTIVE) unless specifically auditing paused items |
| mcp__google-search-console__search_analytics | 1000+ rows possible | Use row_limit parameter. Filter by query or page when possible. |

## Rules

1. **Always filter at the source.** Use date ranges, status filters, LIMIT clauses, and field selections in every MCP call. Never pull "everything" when you need a subset.

2. **Extract and discard.** After receiving a large response, extract the relevant data points into a concise summary. Do not carry the full raw response through the conversation.

3. **Paginate deliberately.** If a tool supports pagination, pull only the first page. Check if it answers the question before requesting more.

4. **Delegate large pulls to subagents.** If a task requires pulling data from 5+ accounts or running 10+ queries, delegate to a subagent. The subagent's context is separate. It pulls the data, summarizes it, and returns only the summary.

5. **Metric selection.** Request only the metrics relevant to the current question. A creative fatigue check needs impressions, frequency, CTR, and CPM. It does not need every available metric.

## GAQL Best Practices

```sql
-- Good: focused query with limits
SELECT campaign.name, metrics.cost_micros, metrics.conversions
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.cost_micros DESC
LIMIT 20

-- Bad: unbounded query
SELECT * FROM campaign
```

## GA4 Best Practices

- Use dateRanges with specific start/end dates, not unbounded
- Limit dimensions to what's needed (don't add eventName + pagePath + source + medium when you only need source)
- Use dimensionFilter or metricFilter to reduce response size at the API level
