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

## Deployment

The site runs behind **Cloudflare -> Railway**. To avoid redirect loops:

- **Cloudflare**: SSL/TLS must be set to **Full** or **Full (strict)** -- never **Flexible**. Flexible sends HTTP to Railway, Railway forces HTTPS, creating an infinite redirect loop.
