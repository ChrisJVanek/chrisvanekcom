import Link from "next/link";

export function Nav() {
  return (
    <nav className="font-display text-sm flex items-center gap-6 mb-12" aria-label="Main">
      <Link href="/" className="text-ink font-semibold hover:text-accent transition-colors">
        Chris Vanek
      </Link>
      <Link href="/#projects" className="text-mute hover:text-accent transition-colors">
        Projects
      </Link>
      <Link href="/health" className="text-mute hover:text-accent transition-colors">
        Health
      </Link>
    </nav>
  );
}
