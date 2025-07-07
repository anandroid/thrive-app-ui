import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-warm-gray/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-sage">Thrive</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/services" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
              Services
            </Link>
            <Link href="/practitioners" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
              Practitioners
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/book" className="hidden sm:inline-flex items-center justify-center rounded-md bg-sage px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sage/90">
            Book Appointment
          </Link>
          <Link href="/login" className="text-sm font-medium text-foreground/60 transition-colors hover:text-foreground">
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}