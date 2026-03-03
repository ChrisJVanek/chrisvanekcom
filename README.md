# chrisvanek.com

Personal site — homepage, projects, and blog.

- **Homepage**: Short intro + Projects + Blog sections
- **Projects**: [Build My Park](https://buildmypark.com), [Ratprice](https://ratprice.com)
- **Blog**: Markdown articles in `src/content/blog/`

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Cronometer sync

The `/health` page can show nutrition data from Cronometer. To pull data automatically:

1. **Credentials**: Create a `.env` (do not commit it) with:
   ```bash
   CRONOMETER_EMAIL=your@email.com
   CRONOMETER_PASSWORD=your-password
   ```

2. **Test run** (browser window opens so you can see the flow):
   ```bash
   npm run cronometer:sync -- --headed
   ```
   The script logs in at cronometer.com, goes to Account, clicks Export Data, selects last 7 days, exports "Daily nutrition" and "Food & recipe entries", saves the CSVs to `src/data/cronometer/`, then merges them into the JSON store (no duplicate days; backdated/updated days overwrite).

3. **Merge only** (if you already have new CSVs in `src/data/cronometer/`):
   ```bash
   npm run cronometer:merge
   ```

4. **Midnight run**: A GitHub Action (`.github/workflows/cronometer-sync.yml`) runs at **00:00 UTC** every day. Add repo secrets `CRONOMETER_EMAIL` and `CRONOMETER_PASSWORD` in Settings → Secrets and variables → Actions. The workflow commits updated `src/data/cronometer/*` if anything changed.

## Deployment

The site runs behind **Cloudflare -> Railway**. To avoid redirect loops:

- **Cloudflare**: SSL/TLS must be set to **Full** or **Full (strict)** -- never **Flexible**. Flexible sends HTTP to Railway, Railway forces HTTPS, creating an infinite redirect loop.
