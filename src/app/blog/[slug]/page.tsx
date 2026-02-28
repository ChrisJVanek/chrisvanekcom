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
        href="/#blog"
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
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-p:leading-relaxed prose-p:mb-4
            prose-headings:font-display prose-headings:font-semibold
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
        />
      </article>
    </main>
  );
}

function formatContent(md: string): string {
  return md
    .split("\n")
    .map((line) => {
      if (/^### /.test(line))
        return `<h3 class="text-lg font-semibold mt-8 mb-2">${escape(line.slice(4))}</h3>`;
      if (/^## /.test(line))
        return `<h2 class="text-xl font-semibold mt-8 mb-2">${escape(line.slice(3))}</h2>`;
      if (/^# /.test(line))
        return `<h1 class="text-2xl font-semibold mt-8 mb-2">${escape(line.slice(2))}</h1>`;
      if (line.trim() === "") return "<p><br></p>";
      const linked = line.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-accent hover:underline">$1</a>'
      );
      const bold = linked.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
      );
      return `<p class="mb-4">${bold}</p>`;
    })
    .join("\n");
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
