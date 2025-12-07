<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app (Next.js)

This project has been migrated to Next.js. The frontend runs in Next and all calls to Gemini are proxied through a secure server API so your API key stays private.

## Run Locally

**Prerequisites:** Node.js (recommended 18+)

1. Install dependencies:
   `npm install`
2. Create `.env.local` with your Gemini API key (DO NOT commit this file):
   `GEMINI_API_KEY=your_real_key_here`
3. Run in development mode:
   `npm run dev`

## Deploy to Cloudflare Pages


Notes:

## Purging secrets from git history (optional but recommended)

- I removed `.env.local` from the current working tree and added it to `.gitignore`.
- To remove the sensitive file from your repository history permanently you must rewrite git history and force-push. I performed a local rewrite to remove `.env.local` from commits. To update the remote repository run the commands below from your machine.

Commands to force-push the cleaned history to GitHub (run only if you understand the implications — this rewrites history and requires collaborators to re-clone or reset):

```bash
# 1. Create a backup (already done locally by this script):
git branch backup-before-filter

# 2. (If you didn't run it here) Remove `.env.local` from all commits locally:
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env.local" --prune-empty --tag-name-filter cat -- --all
rm -rf .git/refs/original/ && git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 3. Force-push the rewritten history (this will update GitHub and overwrite remote branches):
git push origin --force --all
git push origin --force --tags
```

If you want me to run the final `git push --force` from this environment, say so — but note I will need permission to push (and force-pushing will rewrite the remote history). If you prefer, run the commands above locally after verifying everything.
