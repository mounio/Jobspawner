'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { applicationsApi, jobsApi } from '@/lib/api';
import type { ApplicationDto, JobDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import JobCard from '@/components/JobCard';
import { SkeletonCard } from '@/components/Skeleton';
import { timeAgo } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  REVIEWED: '#38bdf8',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
};

export default function DashboardPage() {
  const { user, isLoading, isEmployer } = useAuth();
  const router = useRouter();
  const [matched, setMatched] = useState<JobDto[]>([]);
  const [apps, setApps] = useState<ApplicationDto[]>([]);
  const [recent, setRecent] = useState<JobDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (isEmployer) {
      router.replace('/employer');
      return;
    }

    Promise.all([
      jobsApi.matched().catch(() => []),
      applicationsApi.list().catch(() => []),
      jobsApi.recent(3).catch(() => []),
    ])
      .then(([matchedJobs, applications, recentJobs]) => {
        setMatched(matchedJobs ?? []);
        setApps(applications ?? []);
        setRecent(recentJobs ?? []);
      })
      .finally(() => setLoading(false));
  }, [isEmployer, isLoading, router, user]);

  if (isLoading || !user || isEmployer) return null;

  const stats = [
    { label: 'Candidatures', value: apps.length, icon: 'C', color: '#00c8ff' },
    { label: 'Offres matchees', value: matched.length, icon: 'M', color: '#8b5cf6' },
    { label: 'Profil', value: user.cvPath ? 'CV OK' : 'A completer', icon: 'P', color: '#10b981' },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem,4vw,2.25rem)', fontWeight: 900, margin: '0 0 8px', color: 'var(--color-text)' }}>
          Bonjour, <span className="grad-text">{user.firstName}</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
          Votre espace candidat JobSpawner
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: '2.5rem' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>{stat.icon}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
        <div style={{ background: 'linear-gradient(135deg,rgba(0,200,255,0.1),rgba(139,92,246,0.1))', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text)', margin: '0 0 12px' }}>
            Configurez vos preferences pour des offres personnalisees
          </p>
          <Link href="/preferences" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.82rem' }}>
            Mes preferences
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Offres pour vous</h2>
            <Link href="/jobs" style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', textDecoration: 'none' }}>Voir tout</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
              : matched.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)}
            {!loading && matched.length === 0 && (
              <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <p style={{ marginBottom: '0.75rem' }}>Aucune offre matchee pour le moment.</p>
                <Link href="/preferences" className="btn-primary" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem' }}>
                  Configurer
                </Link>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>Mes candidatures</h2>
              <Link href="/applications" style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', textDecoration: 'none' }}>Voir tout</Link>
            </div>
            <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, overflow: 'hidden' }}>
              {loading ? (
                <div style={{ padding: '1.5rem' }}>
                  <div className="skeleton" style={{ height: 60, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 60 }} />
                </div>
              ) : apps.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  <p style={{ marginBottom: '0.75rem' }}>Aucune candidature pour l&apos;instant.</p>
                  <Link href="/jobs" className="btn-ghost" style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.8rem' }}>
                    Explorer les offres
                  </Link>
                </div>
              ) : (
                apps.slice(0, 5).map((application, index) => (
                  <div key={application.id} style={{ padding: '0.875rem 1.25rem', borderBottom: index < Math.min(apps.length, 5) - 1 ? '1px solid var(--color-border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: 2 }}>
                        {application.jobTitle ?? `Offre #${application.jobId}`}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {timeAgo(application.appliedAt)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: statusColors[application.status] ?? 'var(--color-text)', marginTop: 2 }}>
                        {application.status}
                      </div>
                    </div>
                    <Link href={`/jobs/${application.jobId}`} style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', textDecoration: 'none' }}>
                      Voir
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--color-text)' }}>
              Nouvelles offres
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading
                ? Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)
                : recent.map((job) => <JobCard key={job.id} job={job} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
