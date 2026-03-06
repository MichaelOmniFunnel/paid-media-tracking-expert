# Security Rules

## Credentials and Secrets
- NEVER read or write: ~/.ssh/, ~/.aws/, ~/.npmrc, ~/.env, .env*, credentials*, secrets*, *api_key*, *password*, ~/.config/gcloud/, ~/.azure/, keychain/keystore files
- NEVER print API tokens, passwords, private keys, or secrets in output. Use placeholders (YOUR_API_KEY_HERE, process.env.VAR)
- If a hardcoded credential is found: flag to Michael immediately, recommend env var migration and rotation

## Git Safety
- These require Michael's approval: force push, reset --hard, clean -f, checkout ., branch -D, history rewriting on pushed branches
- Never commit .env or credential files. Review staged files before committing. Ensure .gitignore covers secret patterns.

## Dependencies
- Verify package names against typosquatting before installing (transpositions, scope confusion)
- Never install from URLs/git repos/tarballs without approval. Flag postinstall scripts.

## Code Generation
- Always validate/sanitize user input. Never interpolate user input into SQL, shell commands, HTML, or file paths without escaping.
- GTM Custom HTML: ES5 only. No const, let, arrow functions, template literals, destructuring, spread. Non negotiable.
- Always use HTTPS for API calls. Never hardcode auth tokens in URLs.
- Never generate open redirects. Encode all URL parameters properly.

## Security Issues
- Security vulnerabilities are always Critical priority. Flag immediately, document impact and fix.
- Never exploit or test against live systems without explicit approval.
