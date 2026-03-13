'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import type { SimilarJobDto } from '@/lib/types';

export default function SimilarJobsPage() {
  const params = useParams<{ jobId: string }>();
  const jobId = Number(params?.jobId);
  const [jobs, setJobs] = useState<SimilarJobDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId) || jobId <= 0) {
      setError('Identifiant de job invalide.');
      setLoading(false);
      return;
    }

    jobsApi
      .getSimilar(jobId, 5)
      .then(setJobs)
      .catch((err: Error) => setError(err.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  if (error) return <div style={{ color: 'var(--color-red)', padding: '2rem', textAlign: 'center' }}>{error}</div>;
  if (!jobs.length) return <div style={{ padding: '2rem', textAlign: 'center' }}>Aucune offre similaire.</div>;

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Offres similaires</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {jobs.map((job) => (
          <div key={job.id} style={{ background: 'var(--color-card)', borderRadius: 14, padding: '1rem', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>{job.title}</div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.95rem' }}>
              {job.company} · {job.location}
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: 4 }}>
              {job.isRemote ? 'Remote' : 'Sur site'} · {job.daysAgo} jour(s)
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
