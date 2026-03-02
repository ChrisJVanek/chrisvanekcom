import Link from "next/link";
import Image from "next/image";
import { getBlogPosts } from "@/lib/blog";
import { projects } from "@/data/projects";

export default function HomePage() {
  const posts = getBlogPosts();

  return (
    <main className="max-w-2xl mx-auto px-5 py-16 md:py-24">
      <header className="mb-20 animate-fade-in">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink mb-4">
          Chris Vanek
        </h1>
        <p className="text-mute text-lg leading-relaxed max-w-md">
          I build things on the web — games, tools, and the occasional blog post.
        </p>
        <Link
          href="/health"
          className="inline-block mt-4 text-sm font-medium text-accent hover:underline"
        >
          Health (weight & calories) →
        </Link>
      </header>

      <section id="projects" className="mb-24 scroll-mt-16">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-8 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          Projects
        </h2>
        <ul className="space-y-10">
          {projects.map((project, i) => (
            <li
              key={project.slug}
              className="animate-slide-up opacity-0"
              style={{ animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <article className="group">
                <Link
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 mb-4 ring-0 transition-all duration-300 group-hover:ring-2 group-hover:ring-accent/30 group-hover:border-accent/40">
                    <Image
                      src={project.image}
                      alt={`${project.title} screenshot`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 672px) 100vw, 672px"
                    />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-ink group-hover:text-accent transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-mute mt-1.5 leading-relaxed">
                    {project.description}
                  </p>
                  <span className="inline-block mt-2 text-sm text-accent font-medium">
                    {project.url.replace(/^https?:\/\//, "")} →
                  </span>
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </section>

      <section id="blog" className="scroll-mt-16">
        <h2 className="font-display text-sm font-medium uppercase tracking-widest text-mute mb-8">
          Blog
        </h2>
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block"
              >
                <h3 className="font-display text-lg font-semibold text-ink group-hover:text-accent transition-colors">
                  {post.title}
                </h3>
                <time className="text-sm text-mute" dateTime={post.date}>
                  {post.date}
                </time>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-24 pt-8 border-t border-black/10 dark:border-white/10">
        <p className="text-sm text-mute">
          © {new Date().getFullYear()} Chris Vanek
          {" · "}
          <a
            href="https://x.com/chrisjvanek"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            X
          </a>
        </p>
      </footer>
    </main>
  );
}
