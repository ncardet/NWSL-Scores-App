import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#003087] border-b border-[#004AAD] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/schedule" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight hover:opacity-90 transition-opacity">
          <span className="text-2xl">⚽</span>
          <span>NWSL <span className="font-light">Schedule</span></span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-blue-200">
          <Link href="/schedule" className="hover:text-white transition-colors">
            Schedule
          </Link>
        </nav>
      </div>
    </header>
  );
}
