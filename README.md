# Mood Garden

A calm, private mood garden. Works fully offline and without an account; gardens are saved in the browser.
Optional: sign in with an email link to sync gardens across devices.

```bash
npm install
npm run dev      # http://localhost:5199
npm run build
```

## Free-tier hosting

**Frontend: Cloudflare Pages** (Vercel/Netlify also work)
- Connect the repo; build command `npm run build`, output directory `dist`.
- Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (see below) to enable sync.

**Sync (optional): Supabase free project**
1. Create a project, then run `supabase/schema.sql` in the SQL editor.
2. Authentication -> URL Configuration: set Site URL to your deployed URL and add `http://localhost:5199` to Redirect URLs.
3. Copy Project URL and anon key (Settings -> API) into `.env.local` (see `.env.example`) and into the Pages env vars.

Without those two variables the sign-in option is hidden and no cloud code is loaded.
