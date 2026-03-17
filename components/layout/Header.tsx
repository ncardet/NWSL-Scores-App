import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 pt-safe" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '0.5px solid #38383A' }}>
      <div className="flex items-center justify-between px-4 h-12 max-w-2xl mx-auto">
        <Link href="/schedule" className="flex items-center gap-2">
          <span className="text-white font-bold text-lg tracking-tight">NWSL</span>
          <span style={{ color: '#8E8E93', fontSize: 13, fontWeight: 500 }}>Scores</span>
        </Link>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1C1C1E' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </div>
      </div>
    </header>
  );
}
