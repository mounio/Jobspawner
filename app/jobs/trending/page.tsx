'use client';

import { useEffect, useState } from 'react';
import { jobsApi } from '@/lib/api';

export default function TrendingJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobsApi.trending(10)
      .then(setJobs)
      .catch(err => setError(err.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (error) return <div style={{ color: 'var(--color-red)', padding: '2rem', textAlign: 'center' }}>{error}</div>;
  if (!jobs.length) return <div style={{ padding: '2rem', textAlign: 'center' }}>Aucune offre tendance.</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Offres tendance</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {jobs.map(job => (
          <div key={job.id} style={{ background: 'var(--color-card)', borderRadius: 14, padding: '1rem', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{job.title}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>{job.company} · {job.location}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: 4 }}>{job.techStack}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
