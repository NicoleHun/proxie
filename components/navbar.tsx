import Link from "next/link"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Portfolio
        </Link>
      </nav>
    </header>
  )
}
