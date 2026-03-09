'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, isCandidate, isEmployer, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const linkStyle = (href: string): React.CSSProperties => ({
    textDecoration: 'none',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: isActive(href) ? 'var(--color-cyan)' : 'var(--color-text-muted)',
    transition: 'color 0.2s',
    padding: '0.35rem 0',
    borderBottom: isActive(href) ? '2px solid var(--color-cyan)' : '2px solid transparent',
  });

  const RoleBadge = () => {
    if (!user) return null;
    const map = {
      ADMIN:     { label: 'Admin',     bg: 'rgba(239,68,68,0.15)',   color: '#ef4444' },
      EMPLOYER:  { label: 'Employeur', bg: 'rgba(139,92,246,0.15)',  color: '#8b5cf6' },
      CANDIDATE: { label: 'Candidat',  bg: 'rgba(0,200,255,0.10)',   color: '#00c8ff' },
    };
    const b = map[user.role] ?? map.CANDIDATE;
    return (
      <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 6, background: b.bg, color: b.color }}>
        {b.label}
      </span>
    );
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(6,9,15,0.92)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 58,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 900, fontSize: '1.15rem', background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          JobSpawner
        </span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>BETA</span>
      </Link>

      {/* Desktop nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {/* Always visible */}
        <Link href="/jobs" style={linkStyle('/jobs')}>Offres</Link>

        {/* Candidate only */}
        {(isCandidate || isAdmin) && <Link href="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>}
        {(isCandidate || isAdmin) && <Link href="/applications" style={linkStyle('/applications')}>Candidatures</Link>}
        {(isCandidate || isAdmin) && <Link href="/preferences" style={linkStyle('/preferences')}>Préférences</Link>}

        {/* Employer only */}
        {(isEmployer || isAdmin) && <Link href="/employer" style={linkStyle('/employer')}>Mon espace</Link>}
        {(isEmployer || isAdmin) && <Link href="/employer/post-job" style={linkStyle('/employer/post-job')}>Publier</Link>}
        {(isEmployer || isAdmin) && <Link href="/employer/candidates" style={linkStyle('/employer/candidates')}>Candidats</Link>}

        {/* Admin only */}
        {isAdmin && <Link href="/admin" style={{ ...linkStyle('/admin'), color: isActive('/admin') ? '#ef4444' : 'var(--color-text-muted)' }}>Admin</Link>}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {user ? (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setOpen(o => !o)} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  cursor: 'pointer',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#000' }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)' }}>{user.firstName}</span>
              <RoleBadge />
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>▾</span>
            </button>

            {open && (
              <div onClick={() => setOpen(false)} style={{
                position: 'fixed', inset: 0, zIndex: 998,
              }} />
            )}
            {open && (
              <div style={{
                position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                background: 'var(--color-card)', border: '1px solid var(--color-border)',
                borderRadius: 12, padding: '0.5rem', minWidth: 180, zIndex: 999,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}>
                <DropItem href="/profile"  label="👤 Mon profil" onClick={() => setOpen(false)} />
                {(isCandidate || isAdmin) && <DropItem href="/preferences" label="⚡ Préférences" onClick={() => setOpen(false)} />}
                {(isEmployer  || isAdmin) && <DropItem href="/employer"   label="🏢 Mon entreprise" onClick={() => setOpen(false)} />}
                <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                <button onClick={() => { setOpen(false); logout(); }} style={{
                  width: '100%', textAlign: 'left', background: 'none', border: 'none',
                  cursor: 'pointer', padding: '0.55rem 0.75rem', borderRadius: 8,
                  fontSize: '0.82rem', color: '#ef4444', fontWeight: 600,
                }}>
                  ⎋ Se déconnecter
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/login"    style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textDecoration: 'none', fontWeight: 600 }}>Connexion</Link>
            <Link href="/register" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.82rem', padding: '0.45rem 1.1rem' }}>S&apos;inscrire</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function DropItem({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{
      display: 'block', padding: '0.55rem 0.75rem', borderRadius: 8,
      fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text)',
      textDecoration: 'none', transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-surface)'}
    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      {label}
    </Link>
  );
}
