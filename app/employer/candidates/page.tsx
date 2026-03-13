'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { downloadProtectedFile, employersApi } from '@/lib/api';
import type {
  ApplicationStatus,
  EmployerApplicationDto,
  JobApplicationSummaryDto,
} from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

const statuses: Array<ApplicationStatus | 'ALL'> = [
  'ALL',
  'PENDING',
  'REVIEWED',
  'ACCEPTED',
  'REJECTED',
];

const statusColors: Record<ApplicationStatus, string> = {
  PENDING: '#f59e0b',
  REVIEWED: '#38bdf8',
  ACCEPTED: '#10b981',
  REJECTED: '#ef4444',
};

export default function CandidatesPage() {
  const { user, isLoading, isEmployer, isAdmin } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [status, setStatus] = useState<ApplicationStatus | 'ALL'>('ALL');
  const [summary, setSummary] = useState<JobApplicationSummaryDto[]>([]);
  const [applications, setApplications] = useState<EmployerApplicationDto[]>([]);
  const [selected, setSelected] = useState<EmployerApplicationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!isEmployer && !isAdmin)) {
      router.replace('/employer');
      return;
    }

    setLoading(true);
    Promise.all([
      employersApi.applicationsSummary().catch(() => []),
      employersApi.applications(status === 'ALL' ? undefined : status).catch(() => []),
    ])
      .then(([summaryItems, applicationItems]) => {
        setSummary(summaryItems);
        setApplications(applicationItems);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, isEmployer, isLoading, router, status, user]);

  const groupedByJob = useMemo(() => {
    const map = new Map<number, EmployerApplicationDto[]>();
    for (const application of applications) {
      const current = map.get(application.jobId) ?? [];
      current.push(application);
      map.set(application.jobId, current);
    }
    return map;
  }, [applications]);

  const handleSelect = async (applicationId: number) => {
    const detail = await employersApi.applicationDetail(applicationId);
    setSelected(detail);
    setApplications((current) =>
      current.map((item) => (item.id === detail.id ? detail : item)),
    );
  };

  const handleStatusChange = async (
    applicationId: number,
    nextStatus: ApplicationStatus,
  ) => {
    setUpdatingId(applicationId);
    try {
      const updated = await employersApi.updateApplicationStatus(
        applicationId,
        nextStatus,
      );
      setApplications((current) =>
        current.map((item) => (item.id === applicationId ? updated : item)),
      );
      setSelected((current) => (current?.id === applicationId ? updated : current));
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              margin: '0 0 4px',
              color: 'var(--color-text)',
            }}
          >
            Candidatures recues
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Suivi des candidatures par offre et par statut.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {statuses.map((item) => (
            <button
              key={item}
              type="button"
              className={status === item ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setStatus(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: '2rem',
        }}
      >
        {summary.map((item) => (
          <div
            key={item.jobId}
            style={{
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 14,
              padding: '1rem 1.25rem',
            }}
          >
            <div
              style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}
            >
              {item.jobTitle}
            </div>
            <div style={{ color: 'var(--color-muted)', fontSize: '0.82rem', marginBottom: 10 }}>
              {item.jobLocation}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 6,
                fontSize: '0.8rem',
              }}
            >
              <span>Total: {item.totalApplications}</span>
              <span>Pending: {item.pending}</span>
              <span>Reviewed: {item.reviewed}</span>
              <span>Accepted: {item.accepted}</span>
              <span>Rejected: {item.rejected}</span>
              <span>{item.lastAppliedAt ? formatDate(item.lastAppliedAt) : 'Aucune date'}</span>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          Chargement...
        </div>
      ) : applications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem',
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
          }}
        >
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>
            Aucune candidature pour ce filtre.
          </p>
          <Link href="/employer/post-job" className="btn-primary" style={{ textDecoration: 'none' }}>
            Publier une offre
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {Array.from(groupedByJob.entries()).map(([jobId, items]) => (
            <div
              key={jobId}
              style={{
                background: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 16,
                padding: '1.25rem',
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  {items[0].jobTitle}
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-muted)' }}>
                  {items[0].jobLocation}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
                        {item.firstName} {item.lastName}
                      </div>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          color: 'var(--color-muted)',
                          marginTop: 4,
                        }}
                      >
                        {item.email}
                        {item.phone ? ` · ${item.phone}` : ''}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--color-muted2)',
                          marginTop: 4,
                        }}
                      >
                        {[item.city, item.country].filter(Boolean).join(', ') ||
                          'Localisation non precisee'}
                      </div>
                      <div
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: statusColors[item.status],
                          marginTop: 8,
                        }}
                      >
                        {item.status}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" className="btn-ghost" onClick={() => void handleSelect(item.id)}>
                        Voir
                      </button>
                      <select
                        className="input-dark"
                        value={item.status}
                        onChange={(event) =>
                          void handleStatusChange(
                            item.id,
                            event.target.value as ApplicationStatus,
                          )
                        }
                        disabled={updatingId === item.id}
                        style={{ minWidth: 140 }}
                      >
                        {statuses
                          .filter((entry): entry is ApplicationStatus => entry !== 'ALL')
                          .map((entry) => (
                            <option key={entry} value={entry}>
                              {entry}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1000,
          }}
          onClick={(event) => event.target === event.currentTarget && setSelected(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 680,
              background: 'var(--color-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 16,
              padding: '1.75rem',
            }}
          >
            <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.2rem', fontWeight: 800 }}>
              {selected.firstName} {selected.lastName}
            </h2>
            <p style={{ margin: '0 0 1rem', color: 'var(--color-muted)' }}>{selected.email}</p>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
              <strong>Offre:</strong> {selected.jobTitle}
            </p>
            <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text)' }}>
              <strong>Lieu:</strong> {selected.jobLocation}
            </p>
            <p style={{ margin: '0 0 1rem', color: statusColors[selected.status] }}>
              <strong>Statut:</strong> {selected.status}
            </p>

            {selected.coverLetter && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 12,
                  padding: '1rem',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  marginBottom: '1rem',
                }}
              >
                {selected.coverLetter}
              </div>
            )}

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {selected.cvPath && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={async () => {
                      try {
                        await downloadProtectedFile(
                          selected.cvPath!,
                          `${selected.firstName}-${selected.lastName}-CV`,
                        );
                      } catch (err: any) {
                        toast(err.message ?? 'Impossible de telecharger le CV.', 'error');
                      }
                    }}
                  >
                    Telecharger le CV
                  </button>
              )}
              {selected.linkedInUrl && (
                <a
                  href={selected.linkedInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ textDecoration: 'none' }}
                >
                  LinkedIn
                </a>
              )}
              {selected.gitHubUrl && (
                <a
                  href={selected.gitHubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ textDecoration: 'none' }}
                >
                  GitHub
                </a>
              )}
              <button type="button" className="btn-primary" onClick={() => setSelected(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
