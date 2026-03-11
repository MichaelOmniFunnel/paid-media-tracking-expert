// UserPromptSubmit hook: detects OFM shorthand flags in user prompts
// and expands them into contextual instructions.
// Cross-platform (Node.js). Referenced from settings.local.json.
//
// Supported flags:
//   -meta    = Meta Ads focus (prefer Meta MCP tools, check CAPI/pixel)
//   -gads    = Google Ads focus (prefer Google Ads MCP, check conversions)
//   -tiktok  = TikTok Ads focus (check pixel, Events API, creative)
//   -audit   = Full audit mode (follow OFM audit order, create Asana task)
//   -track   = Tracking focus (pixels, CAPI, GTM, event dedup)
//   -plan    = Auto-invoke Planning with Files pattern
//   -u       = Urgent/priority flag
//   -bp      = Best practices mode (cite sources, reference frameworks)

var input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', function(chunk) { input += chunk; });
process.stdin.on('end', function() {
    try {
        var event = JSON.parse(input);
        var userMessage = event.user_message || event.message || '';

        // Detect flags (case insensitive, with leading dash or slash)
        var flags = [];
        var flagPatterns = [
            { pattern: /\s[-\/]meta\b/i, key: 'meta' },
            { pattern: /\s[-\/]gads\b/i, key: 'gads' },
            { pattern: /\s[-\/]tiktok\b/i, key: 'tiktok' },
            { pattern: /\s[-\/]audit\b/i, key: 'audit' },
            { pattern: /\s[-\/]track(ing)?\b/i, key: 'track' },
            { pattern: /\s[-\/]plan\b/i, key: 'plan' },
            { pattern: /\s[-\/]u\b/i, key: 'urgent' },
            { pattern: /\s[-\/]bp\b/i, key: 'bp' }
        ];

        // Prepend space so flags at start of message are caught
        var padded = ' ' + userMessage;
        for (var i = 0; i < flagPatterns.length; i++) {
            if (flagPatterns[i].pattern.test(padded)) {
                flags.push(flagPatterns[i].key);
            }
        }

        if (flags.length === 0) {
            process.stdout.write(JSON.stringify({}));
            return;
        }

        var context = [];

        for (var f = 0; f < flags.length; f++) {
            switch (flags[f]) {
                case 'meta':
                    context.push('[FLAG: Meta Ads Focus] Prefer mcp__meta-ads__* tools. Check CAPI health, pixel status, EMQ scores, creative fatigue, learning phase. Reference .claude/skills/meta-ads-tracking/SKILL.md and .claude/agents/signal-architect.md.');
                    break;
                case 'gads':
                    context.push('[FLAG: Google Ads Focus] Prefer mcp__google-ads__* tools. Check conversion actions, Quality Score, search terms, bidding strategies, asset performance. Reference .claude/skills/google-ads-tracking/SKILL.md.');
                    break;
                case 'tiktok':
                    context.push('[FLAG: TikTok Ads Focus] Check TikTok pixel, Events API, creative CTR, conversion tracking. Reference .claude/skills/tiktok-ads-tracking/SKILL.md.');
                    break;
                case 'audit':
                    context.push('[FLAG: Audit Mode] Follow OFM audit order: tracking > structure > bidding > audiences > creative > LP > attribution > wasted spend. Create Asana subtask under the client parent. Use parallel agents for independent work streams. Produce: Executive Summary, Score Snapshot, Issue Inventory by Priority Tier, Detailed Findings, Action Plan.');
                    break;
                case 'track':
                    context.push('[FLAG: Tracking Focus] Check all tracking: pixels firing, CAPI connected, event_id dedup, GTM ES5 compliance, click ID persistence (gclid/fbclid/ttclid), consent mode, server-side via Stape. Reference .claude/skills/tracking-audit/SKILL.md and .claude/skills/server-side-tracking/SKILL.md.');
                    break;
                case 'plan':
                    context.push('[FLAG: Planning Mode] Initialize Planning with Files pattern. Create task_plan.md, findings.md, progress.md in project root. Follow the 2-Action Rule: save findings after every 2 operations. Re-read task_plan.md before major decisions. Reference .claude/skills/planning-with-files/SKILL.md.');
                    break;
                case 'urgent':
                    context.push('[FLAG: URGENT] This is time-sensitive. Prioritize speed. Skip nice-to-have analysis. Focus on the critical path. Flag blockers immediately.');
                    break;
                case 'bp':
                    context.push('[FLAG: Best Practices] Cite specific frameworks from .claude/frameworks/. Reference industry benchmarks. Include source citations where possible. Cross-reference with OFM standards in CLAUDE.md.');
                    break;
            }
        }

        process.stdout.write(JSON.stringify({
            hookSpecificOutput: {
                additionalContext: context.join('\n')
            }
        }));
    } catch (e) {
        // If we can't parse input, pass through silently
        process.stdout.write(JSON.stringify({}));
    }
});
