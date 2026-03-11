# Context Management Rules

## Compaction Threshold

Target manual /compact at 50% context usage, not 70 to 80%. Quality degrades past 50%.

## Chrome Browser Sessions

Save key findings after every 2 page navigations. Do not accumulate 10+ pages of observations before recording. Write findings to the conversation or a working file before they are lost to compaction.

## MCP Tool Failures

When an MCP tool returns empty results, an authentication error, or a rate limit message: stop immediately. Flag the failure to Michael. Do not proceed with an incomplete data set as if the data does not exist.

## Multi Client Audits

Complete one client fully before starting the next. Do not interleave clients in the same context window.

## Compaction Preservation

When compacting, always preserve: active client name, current task, Asana GIDs, open items, and files modified this session.

## Subagent Delegation

For tasks exceeding 3 search/read operations, delegate to a subagent to protect the main context window. Use the Agent tool with the appropriate subagent_type. Subagents do not share the main context, so provide complete task descriptions including client name, account IDs, and specific questions to answer.

## Token Efficiency

- Avoid requesting full datasets when you only need a summary. Use LIMIT clauses in GAQL, date range filters in GA4, and specific field selections in Meta API calls.
- When tool results exceed 200 lines, extract the relevant data points and discard the rest before continuing. Do not carry raw API responses through the conversation.
