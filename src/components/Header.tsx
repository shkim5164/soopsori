import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full border-b border-black">
      <div className="container-fluid flex items-center justify-between py-6">
        {/* Logo */}
        <Link href="/" className="text-h3 font-medium hover:opacity-70 transition-opacity">
          F&amp;F
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-8">
          <Link href="/project" className="text-body hover:underline underline-offset-4 decoration-1">
            Work
          </Link>
          <Link href="/about" className="text-body hover:underline underline-offset-4 decoration-1">
            About
          </Link>
          <a href="mailto:hello@frameandform.com" className="text-body hover:underline underline-offset-4 decoration-1">
            Contact
          </a>
        </nav>
      </div>
    </header>
  );
}
