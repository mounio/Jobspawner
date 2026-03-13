'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { employersApi } from '@/lib/api';
import type { EmployerDto, JobDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, parseTechStack } from '@/lib/utils';

export default function EmployerPage() {
  const { user, isLoading, hasToken, isEmployer, isAdmin } = useAuth();
  const  toast = useToast();
  const router = useRouter();

  const [employer, setEmployer] = useState<EmployerDto | null>(null);
  const [myJobs,   setMyJobs]   = useState<JobDto[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!hasToken) { router.replace('/login'); return; }
    if (!user || (!isEmployer && !isAdmin)) { router.replace('/dashboard'); return; }

    let cancelled = false;

    const loadEmployerData = async () => {
      setLoading(true);

      try {
        const employerProfile = await employersApi.profile().catch(() => null);
        if (cancelled) return;

        setEmployer(employerProfile);

        if (!employerProfile) {
          setMyJobs([]);
          return;
        }

        const jobs = await employersApi.jobs().catch(() => []);
        if (!cancelled) {
          setMyJobs(jobs);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadEmployerData();

    return () => {
      cancelled = true;
    };
  }, [hasToken, isAdmin, isEmployer, isLoading, router, user]);

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette offre ?')) return;
    setDeleting(id);
    try {
      await employersApi.deleteJob(id);
      setMyJobs(j => j.filter(x => x.id !== id));
      toast('Offre supprimée.');
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setDeleting(null); }
  };

  if (isLoading) return null;

  const stats = [
    { label: 'Offres publiées', value: myJobs.length, icon: '📋', color: '#00c8ff' },
    { label: 'Vues totales', value: myJobs.reduce((s, j) => s + j.views, 0), icon: '👁', color: '#8b5cf6' },
    { label: 'Candidatures reçues', value: myJobs.reduce((s, j) => s + j.applications, 0), icon: '📨', color: '#10b981' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: '0 0 4px', color: 'var(--color-text)' }}>
            🏢 {employer?.companyName ?? 'Mon espace recruteur'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {employer?.industry && `${employer.industry} · `}{employer?.location}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/employer/post-job" className="btn-primary" style={{ textDecoration: 'none' }}>
            + Publier une offre
          </Link>
          <Link href="/employer/candidates" className="btn-secondary" style={{ textDecoration: 'none' }}>
            👥 Voir les candidats
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: '2.5rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
        {/* Company profile card */}
        {employer && (
          <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: employer.isVerified ? '#10b981' : 'var(--color-text-muted)', marginBottom: 6 }}>
              {employer.isVerified ? '✓ VÉRIFIÉ' : '⏳ EN ATTENTE'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Profil entreprise</div>
          </div>
        )}
      </div>

      {/* Company description */}
      {employer?.companyDescription && (
        <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>À PROPOS</h3>
          <p style={{ color: 'var(--color-text)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{employer.companyDescription}</p>
          {employer.website && (
            <a href={employer.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', marginTop: 12, fontSize: '0.82rem', color: 'var(--color-cyan)', textDecoration: 'none' }}>
              🌐 {employer.website} ↗
            </a>
          )}
        </div>
      )}

      {/* My job listings */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--color-text)' }}>
          Mes offres publiées ({myJobs.length})
        </h2>
        {loading ? (
          <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '3rem' }}>Chargement…</div>
        ) : myJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Vous n&apos;avez pas encore publié d&apos;offre.</p>
            <Link href="/employer/post-job" className="btn-primary" style={{ textDecoration: 'none' }}>
              Publier votre première offre
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myJobs.map(job => (
              <div key={job.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none' }}>
                    <h3 style={{ fontWeight: 700, margin: '0 0 4px', color: 'var(--color-text)', fontSize: '0.95rem' }}>{job.title}</h3>
                  </Link>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    <span>📍 {job.location}</span>
                    <span>💼 {job.jobType ?? 'Non spécifié'}</span>
                    {job.isRemote && <span style={{ color: '#10b981' }}>🌐 Remote</span>}
                    <span>👁 {job.views} vues</span>
                    <span>📨 {job.applications} candidatures</span>
                    <span>📅 {formatDate(job.createdAt)}</span>
                  </div>
                  {job.applicationEmail ? (
                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--color-cyan)' }}>
                      Candidatures recues sur {job.applicationEmail}
                    </div>
                  ) : null}
                  {job.techStack && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                      {parseTechStack(job.techStack).slice(0, 5).map((t, index) => (
                        <span key={`${job.id}-${t}-${index}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', borderRadius: 4, background: 'rgba(139,92,246,0.1)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)', fontFamily: 'monospace' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Link href={`/employer/post-job?edit=${job.id}`} className="btn-ghost" style={{ textDecoration: 'none', fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
                    ✏️ Modifier
                  </Link>
                  <button className="btn-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}
                    onClick={() => handleDelete(job.id)} disabled={deleting === job.id}>
                    {deleting === job.id ? '⏳' : '🗑️'} Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































