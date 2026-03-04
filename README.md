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

## Cronometer sync (database)

The `/health` page shows nutrition data from Cronometer. Data is stored in **PostgreSQL** and loaded dynamically (no git commits).

1. **Database**: Create a PostgreSQL database (e.g. Railway) and set `DATABASE_URL` in your deployment and in GitHub Actions secrets. Run migrations once:
   ```bash
   npx prisma migrate deploy
   ```

2. **Credentials**: In `.env` (local) and in repo **Secrets and variables → Actions** set:
   - `CRONOMETER_EMAIL`
   - `CRONOMETER_PASSWORD`
   - `DATABASE_URL` (PostgreSQL connection string)

3. **Test run** (browser window opens):
   ```bash
   npm run cronometer:sync -- --headed
   ```
   With `DATABASE_URL` set, the script writes to the DB (merge with existing). Without it, it writes to `src/data/cronometer/*` JSON files (legacy).

4. **Scheduled sync**: The GitHub Action runs at **00:00 UTC** and **14:00 UTC** (midnight GMT+10). It does **not** commit; it only writes to the database. The site reads from the DB at request time.

## Deployment

The site runs behind **Cloudflare -> Railway**. To avoid redirect loops:

- **Cloudflare**: SSL/TLS must be set to **Full** or **Full (strict)** -- never **Flexible**. Flexible sends HTTP to Railway, Railway forces HTTPS, creating an infinite redirect loop.

- **Railway**: Set `DATABASE_URL` to your PostgreSQL service. To create Cronometer tables, run migrations on deploy (e.g. set a release/build command that runs `npx prisma migrate deploy` before `npm start`, or run it once manually).
