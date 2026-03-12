import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getBlogPosts } from "@/lib/blog";

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Post not found" };
  return { title: `${post.title} — Chris Vanek` };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main className="max-w-2xl mx-auto px-5 py-16 md:py-24">
      <Link
        href="/blog"
        className="text-sm text-mute hover:text-accent transition-colors mb-8 inline-block"
      >
        ← Back to blog
      </Link>
      <article>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-2">
          {post.title}
        </h1>
        <time className="text-mute text-sm block mb-10" dateTime={post.date}>
          {post.date}
        </time>
        <div
          className="max-w-none [&_a]:text-accent [&_a]:no-underline hover:[&_a]:underline"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
      </article>
    </main>
  );
}

function formatContent(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (/^### /.test(line)) {
      out.push(`<h3 class="text-lg font-semibold mt-8 mb-2 font-display">${escape(line.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (/^## /.test(line)) {
      out.push(`<h2 class="text-xl font-semibold mt-8 mb-2 font-display">${escape(line.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (/^# /.test(line)) {
      out.push(`<h1 class="text-2xl font-semibold mt-8 mb-2 font-display">${escape(line.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (line.trim() === "") {
      out.push("<p><br></p>");
      i++;
      continue;
    }
    // Group consecutive non-empty lines into one paragraph
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      paraLines.push(lines[i]);
      i++;
    }
    const paraContent = parseInlineMarkdown(paraLines.join(" "));
    out.push(`<p class="mb-4 leading-relaxed">${paraContent}</p>`);
  }

  return out.join("\n");
}

/** Parse inline markdown and return safe HTML (links, bold). Escapes HTML first to prevent XSS. */
function parseInlineMarkdown(line: string): string {
  const escaped = escape(line);
  const linked = escaped.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      const href = url.trim();
      if (!/^https?:\/\//i.test(href)) return match; // only allow http(s) links
      return `<a href="${escapeAttr(href)}" class="text-accent hover:underline" rel="noopener noreferrer" target="_blank">${text}</a>`;
    }
  );
  const bold = linked.replace(
    /\*\*([^*]+)\*\*/g,
    "<strong>$1</strong>"
  );
  return bold;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
