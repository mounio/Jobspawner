'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { applicationsApi } from '@/lib/api';
import type { ApplicationDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PENDING: '#f59e0b',
  REVIEWED: '#38bdf8',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
};

export default function ApplicationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    applicationsApi
      .list()
      .then((items) => setApplications(items ?? []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [isLoading, router, user]);

  const handleWithdraw = async (applicationId: number) => {
    setRemovingId(applicationId);
    try {
      await applicationsApi.delete(applicationId);
      setApplications((current) => current.filter((item) => item.id !== applicationId));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '0 0 6px' }}>
          Mes candidatures
        </h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>
          Suivez le statut de vos postulations.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-muted)' }}>
          Chargement...
        </div>
      ) : applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14 }}>
          <p style={{ color: 'var(--color-muted)', marginBottom: 16 }}>
            Vous n&apos;avez pas encore candidate.
          </p>
          <Link href="/jobs" className="btn-primary" style={{ textDecoration: 'none' }}>
            Voir les offres
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {applications.map((application) => (
            <div key={application.id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                  {application.jobTitle ?? `Offre #${application.jobId}`}
                </div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.86rem', marginTop: 4 }}>
                  {application.company ?? 'Entreprise'} · {application.jobLocation ?? 'Localisation non precisee'}
                </div>
                <div style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginTop: 6 }}>
                  Postule le {formatDate(application.appliedAt)}
                  {application.reviewedAt ? ` · Relu le ${formatDate(application.reviewedAt)}` : ''}
                </div>
                <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 700, color: statusColors[application.status] ?? 'var(--color-text)' }}>
                  {application.status}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Link href={`/jobs/${application.jobId}`} style={{ color: 'var(--color-cyan)', textDecoration: 'none', fontWeight: 600 }}>
                  Voir l&apos;offre
                </Link>
                {application.status === 'PENDING' && (
                  <button
                    type="button"
                    className="btn-danger"
                    disabled={removingId === application.id}
                    onClick={() => void handleWithdraw(application.id)}
                  >
                    {removingId === application.id ? 'Retrait...' : 'Retirer'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
