// PostToolUse hook: validates MCP tool responses contain real data
// Catches auth errors, empty results, and rate limits BEFORE the agent proceeds
// with incomplete data. Prevents silent audit failures.
// Cross-platform (Node.js). Referenced from settings.local.json.

var input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) { input += chunk; });
process.stdin.on('end', function() {
    try {
        var event = JSON.parse(input);
        var toolName = event.tool_name || '';
        var output = event.tool_output || '';

        // Only validate MCP tool responses
        if (toolName.indexOf('mcp__') !== 0) {
            process.stdout.write(JSON.stringify({}));
            return;
        }

        var warnings = [];

        // Check for authentication failures
        var authPatterns = [
            'unauthorized',
            'authentication failed',
            'invalid token',
            'token expired',
            'access denied',
            'permission denied',
            'invalid credentials',
            'oauth',
            '401',
            '403',
            'not authenticated',
            'login required'
        ];
        var outputLower = output.toLowerCase();
        for (var i = 0; i < authPatterns.length; i++) {
            if (outputLower.indexOf(authPatterns[i]) !== -1) {
                warnings.push('AUTH_FAILURE: MCP tool ' + toolName + ' returned an authentication error. Do not proceed with incomplete data. Flag this to Michael.');
                break;
            }
        }

        // Check for rate limiting
        var ratePatterns = [
            'rate limit',
            'too many requests',
            '429',
            'quota exceeded',
            'throttled',
            'retry after'
        ];
        for (var i = 0; i < ratePatterns.length; i++) {
            if (outputLower.indexOf(ratePatterns[i]) !== -1) {
                warnings.push('RATE_LIMITED: MCP tool ' + toolName + ' was rate limited. Wait before retrying. Do not proceed with partial data.');
                break;
            }
        }

        // Check for empty/null results on data queries
        var dataTools = [
            'get_campaign_performance',
            'get_ad_performance',
            'get_insights',
            'run_gaql',
            'run_report',
            'search_analytics',
            'get_campaigns',
            'get_adsets',
            'get_ads',
            'get_pixels',
            'execute_gaql_query'
        ];
        var isDataTool = false;
        for (var i = 0; i < dataTools.length; i++) {
            if (toolName.indexOf(dataTools[i]) !== -1) {
                isDataTool = true;
                break;
            }
        }

        if (isDataTool) {
            // Check for truly empty responses
            var trimmed = output.trim();
            if (trimmed === '' || trimmed === '[]' || trimmed === '{}' || trimmed === 'null' || trimmed === 'None') {
                warnings.push('EMPTY_RESULT: MCP tool ' + toolName + ' returned no data. Verify the account ID, date range, and filters. Do not report "no issues found" based on empty data.');
            }
        }

        if (warnings.length > 0) {
            process.stdout.write(JSON.stringify({
                hookSpecificOutput: {
                    warnings: warnings
                }
            }));
        } else {
            process.stdout.write(JSON.stringify({}));
        }
    } catch (e) {
        // If we can't parse input, pass through silently
        process.stdout.write(JSON.stringify({}));
    }
});
