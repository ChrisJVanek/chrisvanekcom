import Link from "next/link";
import { getBlogPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — Chris Vanek",
  description: "Writing about projects, crypto, longevity, and life.",
};

export default function BlogPage() {
  const posts = getBlogPosts();

  return (
    <main className="max-w-2xl mx-auto px-5 py-16 md:py-24">
      <Link
        href="/"
        className="text-sm text-mute hover:text-accent transition-colors mb-8 inline-block"
      >
        ← Back home
      </Link>

      <header className="mb-12">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-2">
          Blog
        </h1>
        <p className="text-mute">
          Stories, experiments, and the occasional cautionary tale.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="text-mute">Nothing here yet.</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-5 sm:p-6 hover:border-accent/30 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-200"
              >
                <time
                  className="font-display text-xs font-medium uppercase tracking-wider text-mute whitespace-nowrap shrink-0"
                  dateTime={post.date}
                >
                  {post.date
                    ? new Date(post.date + "T12:00:00").toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" }
                      )
                    : ""}
                </time>
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-semibold text-ink group-hover:text-accent transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-mute text-sm mt-1 leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
