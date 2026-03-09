'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import { JobDto } from '@/lib/types';
import JobCard from '@/components/JobCard';
import { SkeletonCard } from '@/components/Skeleton';

export default function HomePage() {
  const router = useRouter();
  const [recent, setRecent]   = useState<JobDto[]>([]);
  const [trending, setTrending] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    Promise.all([
      jobsApi.recent(6),
      jobsApi.trending(4),
    ]).then(([r, t]) => {
      setRecent(r ?? []);
      setTrending(t ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/jobs?keyword=${encodeURIComponent(search)}`);
    else router.push('/jobs');
  };

  const sources = [
    { label: 'GitHub',         icon: '⌥', color: '#58a6ff', desc: 'Issues hiring' },
    { label: 'Stack Overflow', icon: '◈', color: '#f48024', desc: 'RSS feed' },
    { label: 'Remote.ok',      icon: '◎', color: '#10b981', desc: 'API publique' },
    { label: 'WeWorkRemotely', icon: '⬡', color: '#8b5cf6', desc: 'RSS par catégorie' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="grid-bg" style={{
        position: 'relative', overflow: 'hidden',
        padding: '7rem 1.5rem 5rem',
        textAlign: 'center',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', left: '50%', transform: 'translateX(-50%)',
          width: 700, height: 700, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(0,200,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto' }}>
          <div className="animate-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)',
            borderRadius: 20, padding: '0.35rem 1rem', marginBottom: '1.5rem',
          }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-cyan)', letterSpacing: '0.08em' }}>
              ⚡ AGRÉGATEUR D&apos;OFFRES TECH
            </span>
          </div>
          <h1 className="animate-fade-up" style={{
            fontSize: 'clamp(2.2rem, 6vw, 4rem)',
            fontWeight: 900, lineHeight: 1.1,
            color: 'var(--color-text)', margin: '0 0 1.25rem',
            animationDelay: '0.05s',
          }}>
            Trouvez votre prochain<br />
            <span className="grad-text">rôle tech</span>
          </h1>
          <p className="animate-fade-up" style={{
            fontSize: '1.1rem', color: 'var(--color-muted2)',
            maxWidth: 520, margin: '0 auto 2.5rem',
            lineHeight: 1.7, animationDelay: '0.1s',
          }}>
            Offres agrégées en temps réel depuis GitHub, Stack Overflow, Remote.ok et WeWorkRemotely.
          </p>
          <form className="animate-fade-up" onSubmit={handleSearch}
            style={{ display: 'flex', gap: 10, maxWidth: 560, margin: '0 auto', animationDelay: '0.15s' }}>
            <input className="input-dark" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="React, Python, DevOps…"
              style={{ flex: 1, height: 48, fontSize: '0.95rem' }} />
            <button type="submit" className="btn-primary" style={{ height: 48, padding: '0 1.75rem', fontSize: '0.95rem' }}>
              Rechercher
            </button>
          </form>
        </div>
      </section>

      {/* Sources */}
      <section style={{ padding: '3rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            {sources.map(s => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 10, padding: '0.75rem 1.25rem',
              }}>
                <span style={{ fontSize: '1.3rem', color: s.color }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{s.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      <section style={{ padding: '4rem 1.5rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px' }}>
                🔥 Offres populaires
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: 0 }}>Les plus consultées</p>
            </div>
            <Link href="/jobs?sortBy=popular" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : trending.map(job => <JobCard key={job.id} job={job} />)}
          </div>
        </div>
      </section>

      {/* Recent */}
      <section style={{ padding: '0 1.5rem 4rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)', margin: '0 0 4px' }}>
                ✨ Dernières offres
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: 0 }}>Ajoutées récemment</p>
            </div>
            <Link href="/jobs?sortBy=newest" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>
              Voir tout →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
              : recent.map(job => <JobCard key={job.id} job={job} />)}
          </div>
          {!loading && recent.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌐</div>
              <p>Aucune offre disponible. Lancez le scraping depuis le panneau Admin.</p>
              <Link href="/admin" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1rem' }}>
                ⚡ Admin Scraping
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}









































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































