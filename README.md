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

## Deployment (avoid “too many redirects”)

Redirects are defined only in `next.config.mjs` (www → non-www). To prevent redirect loops:

- **Vercel**: In Project → Settings → Domains, set **chrisvanek.com** as the primary domain. Add **www.chrisvanek.com** as an alias; do **not** add a separate “Redirect to…” for www in the dashboard (the app already redirects www → non-www).
- **Cloudflare** (if used): Set SSL/TLS to **Full** or **Full (strict)**. Do not use **Flexible**, or the origin sees HTTP and can create a redirect loop.
