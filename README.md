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

- Push your repository to GitHub.
- In Cloudflare Pages, connect the repo and select the project.
- Build command: `npm run build`
- Output directory: (leave default for Next.js support)
- In Cloudflare Pages, set the environment variable `GEMINI_API_KEY` in the project settings (do not store it in the repo).

Notes:
- The server-side API lives at `/api/gemini` which calls the Gemini API using `process.env.GEMINI_API_KEY` on the server. The client calls this route — the API key never goes to the browser.
- If you prefer Cloudflare Workers + Wrangler, you can use Cloudflare's Next.js support or the `@cloudflare/next-on-pages` adapter; set the same env var in Wrangler/Tunnel settings.
