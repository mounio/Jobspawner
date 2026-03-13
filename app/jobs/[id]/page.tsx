'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { applicationsApi, jobsApi, usersApi } from '@/lib/api';
import type { JobDetailsDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, formatSalary, parseTechStack, sourceLabel, timeAgo } from '@/lib/utils';

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading, updateUser } = useAuth();
  const toast = useToast();
  const jobId = Number(params?.id);
  const [job, setJob] = useState<JobDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const cvInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!Number.isFinite(jobId) || jobId <= 0) {
      setError("Identifiant d'offre invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    jobsApi
      .getDetails(jobId)
      .then((data) => setJob(data))
      .catch((err) => setError(err.message || 'Erreur lors du chargement'))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return <CenteredMessage>Chargement...</CenteredMessage>;
  }

  if (error) {
    return <CenteredMessage tone="error">{error}</CenteredMessage>;
  }

  if (!job) {
    return <CenteredMessage>Aucune offre trouvee.</CenteredMessage>;
  }

  const stack = parseTechStack(job.techStack);

  const salary =
    job.salaryDisplay ||
    formatSalary(job.minSalary ?? undefined, job.maxSalary ?? undefined, job.currency ?? 'EUR');

  const openApplyFlow = () => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?next=/jobs/${jobId}`);
      return;
    }

    if (job.hasAppliedByCurrentUser) {
      toast('Vous avez deja postule a cette offre.');
      return;
    }

    setSelectedCvFile(null);
    setShowApplyModal(true);
  };

  const handleApply = async () => {
    if (!user) return;

    if (!user.cvPath && !selectedCvFile) {
      toast('Ajoutez un CV avant d envoyer votre candidature.', 'error');
      return;
    }

    setApplying(true);
    try {
      if (selectedCvFile) {
        const upload = await usersApi.uploadCv(selectedCvFile);
        updateUser({ ...user, cvPath: upload.cvPath });
      }

      await applicationsApi.apply({ jobId });
      setJob((current) =>
        current
          ? {
              ...current,
              hasAppliedByCurrentUser: true,
              totalApplications: (current.totalApplications ?? 0) + 1,
            }
          : current,
      );
      setShowApplyModal(false);
      toast("Votre candidature a ete envoyee a l'employeur par email.", 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur lors de la candidature', 'error');
      if (typeof err?.message === 'string' && err.message.includes('Un CV est obligatoire')) {
        setShowApplyModal(false);
        router.push('/profile');
      }
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={styles.page}>
      <section style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div>
            <p style={styles.eyebrow}>Detail de l'offre</p>
            <h1 style={styles.title}>{job.title}</h1>
            <p style={styles.companyLine}>
              {job.company} · {job.location}
              {job.isRemote ? ' · Remote' : ''}
            </p>
          </div>

          <div style={styles.statusColumn}>
            <div style={styles.salaryBadge}>{salary}</div>
            {job.source ? <div style={styles.sourceBadge}>{sourceLabel(job.source)}</div> : null}
          </div>
        </div>

        <div style={styles.metaRow}>
          <MetaPill label="Publiee" value={job.createdAt ? formatDate(job.createdAt) : '-'} />
          <MetaPill
            label="Fraicheur"
            value={typeof job.daysAgo === 'number' ? `Il y a ${job.daysAgo} jour(s)` : timeAgo(job.createdAt)}
          />
          <MetaPill label="Vues" value={String(job.totalViews ?? 0)} />
          <MetaPill label="Candidatures" value={String(job.totalApplications ?? 0)} />
          <MetaPill label="Sauvegardes" value={String(job.totalSaves ?? 0)} />
        </div>

        <div style={styles.actionsRow}>
          <button
            type="button"
            className="btn-primary"
            style={styles.primaryAction}
            onClick={openApplyFlow}
            disabled={applying || authLoading || Boolean(job.hasAppliedByCurrentUser)}
          >
            {job.hasAppliedByCurrentUser ? 'Candidature envoyee' : applying ? 'Envoi...' : 'Postuler'}
          </button>
          {job.applyUrl ? (
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={styles.secondaryAction}
            >
              Lien externe
            </a>
          ) : null}
          {job.hasAppliedByCurrentUser ? (
            <span style={styles.infoChip}>Deja candidate</span>
          ) : null}
          {!user?.cvPath ? (
            <span style={styles.warningChip}>CV requis pour postuler</span>
          ) : null}
          {job.isSavedByCurrentUser ? (
            <span style={styles.infoChip}>Deja sauvegardee</span>
          ) : null}
        </div>
      </section>

      <section style={styles.contentGrid}>
        <article style={styles.mainCard}>
          <h2 style={styles.sectionTitle}>Description</h2>
          <p style={styles.description}>{job.description}</p>

          <h3 style={styles.subTitle}>Stack technique</h3>
          <div style={styles.tagWrap}>
            {stack.length > 0 ? (
              stack.map((item) => (
                <span key={item} style={styles.tag}>
                  {item}
                </span>
              ))
            ) : (
              <span style={styles.mutedText}>Non precisee</span>
            )}
          </div>

          {(job.matchingScore || job.matchingReason) && (
            <>
              <h3 style={styles.subTitle}>Matching</h3>
              <div style={styles.matchBox}>
                {typeof job.matchingScore === 'number' ? (
                  <p style={styles.matchScore}>
                    Score: {Math.round(job.matchingScore)}%
                  </p>
                ) : null}
                {job.matchingReason ? (
                  <p style={styles.matchReason}>{job.matchingReason}</p>
                ) : null}
              </div>
            </>
          )}
        </article>

        <aside style={styles.sideCard}>
          <h2 style={styles.sectionTitle}>Informations</h2>
          <InfoRow label="Entreprise" value={job.company} />
          <InfoRow label="Lieu" value={`${job.location}${job.isRemote ? ' / Remote' : ''}`} />
          <InfoRow label="Salaire" value={salary} />
          <InfoRow label="Source" value={job.source ? sourceLabel(job.source) : 'Non precisee'} />
          <InfoRow
            label="Mise a jour"
            value={job.updatedAt ? formatDate(job.updatedAt) : 'Non precisee'}
          />
        </aside>
      </section>

      {job.similarJobs && job.similarJobs.length > 0 && (
        <section style={styles.similarSection}>
          <h2 style={styles.sectionTitle}>Offres similaires</h2>
          <div style={styles.similarGrid}>
            {job.similarJobs.map((similar) => (
              <Link
                key={similar.id}
                href={`/jobs/${similar.id}`}
                style={styles.similarLink}
              >
                <article style={styles.similarCard}>
                  <h3 style={styles.similarTitle}>{similar.title}</h3>
                  <p style={styles.similarMeta}>
                    {similar.company} · {similar.location}
                    {similar.isRemote ? ' · Remote' : ''}
                  </p>
                  <p style={styles.similarMeta}>
                    {typeof similar.daysAgo === 'number'
                      ? `Il y a ${similar.daysAgo} jour(s)`
                      : 'Recent'}
                  </p>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showApplyModal && (
        <div style={styles.modalOverlay} onClick={(event) => event.target === event.currentTarget && !applying && setShowApplyModal(false)}>
          <div style={styles.modalCard}>
            <h2 style={styles.modalTitle}>Envoyer votre candidature</h2>
            <p style={styles.modalText}>
              Un CV est obligatoire. Si un CV est deja enregistre dans votre profil, il sera utilise automatiquement.
            </p>

            <div style={styles.cvStatusBox}>
              <strong style={{ display: 'block', color: user?.cvPath || selectedCvFile ? '#34d399' : '#f87171', marginBottom: 6 }}>
                {selectedCvFile
                  ? `CV selectionne: ${selectedCvFile.name}`
                  : user?.cvPath
                    ? 'CV de profil pret a etre utilise'
                    : 'Aucun CV detecte'}
              </strong>
              <p style={{ ...styles.modalText, margin: 0 }}>
                {selectedCvFile
                  ? 'Ce fichier remplacera votre CV actuel pour cette candidature.'
                  : user?.cvPath
                    ? 'Vous pouvez envoyer votre candidature directement ou choisir un autre fichier.'
                    : 'Ajoutez un CV pour activer l envoi de votre candidature.'}
              </p>
            </div>

            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(event) => setSelectedCvFile(event.target.files?.[0] ?? null)}
            />

            {!user?.cvPath && !selectedCvFile && (
              <div style={styles.modalWarning}>
                Aucun CV n&apos;a ete trouve. Ajoutez-en un pour poursuivre.
              </div>
            )}

            <div style={styles.modalActions}>
              <button type="button" className="btn-ghost" onClick={() => setShowApplyModal(false)} disabled={applying}>
                Annuler
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => cvInputRef.current?.click()}
                disabled={applying}
                style={styles.modalPrimaryButton}
              >
                {selectedCvFile || user?.cvPath ? 'Ajouter un CV' : 'Ajouter un CV'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleApply()}
                disabled={applying || (!user?.cvPath && !selectedCvFile)}
                style={styles.modalPrimaryButton}
              >
                {applying ? 'Envoi...' : 'Envoyer ma candidature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CenteredMessage({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'error';
}) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        color: tone === 'error' ? 'var(--color-red)' : 'var(--color-text)',
      }}
    >
      {children}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.metaPill}>
      <span style={styles.metaLabel}>{label}</span>
      <span style={styles.metaValue}>{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.infoRow}>
      <span style={styles.infoLabel}>{label}</span>
      <span style={styles.infoValue}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2.5rem 1.5rem 4rem',
  } as React.CSSProperties,
  heroCard: {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 18,
    padding: '2rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  heroTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  eyebrow: {
    margin: '0 0 0.5rem',
    fontSize: '0.78rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: 'var(--color-cyan)',
    fontWeight: 700,
  } as React.CSSProperties,
  title: {
    margin: '0 0 0.5rem',
    fontSize: '2rem',
    fontWeight: 900,
    color: 'var(--color-text)',
  } as React.CSSProperties,
  companyLine: {
    margin: 0,
    color: 'var(--color-muted2)',
    fontSize: '1rem',
  } as React.CSSProperties,
  statusColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    alignItems: 'flex-end',
  } as React.CSSProperties,
  salaryBadge: {
    padding: '0.65rem 0.9rem',
    borderRadius: 999,
    background: 'rgba(16,185,129,0.12)',
    color: '#34d399',
    fontWeight: 700,
    border: '1px solid rgba(16,185,129,0.25)',
  } as React.CSSProperties,
  sourceBadge: {
    padding: '0.45rem 0.75rem',
    borderRadius: 999,
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    fontSize: '0.82rem',
    fontWeight: 600,
  } as React.CSSProperties,
  metaRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginTop: '1.5rem',
  } as React.CSSProperties,
  metaPill: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '0.9rem',
  } as React.CSSProperties,
  metaLabel: {
    display: 'block',
    fontSize: '0.76rem',
    color: 'var(--color-muted2)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 4,
  } as React.CSSProperties,
  metaValue: {
    color: 'var(--color-text)',
    fontWeight: 700,
  } as React.CSSProperties,
  actionsRow: {
    display: 'flex',
    gap: 10,
    marginTop: '1.5rem',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  primaryAction: {
    border: 'none',
    padding: '0.8rem 1.5rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  secondaryAction: {
    textDecoration: 'none',
    padding: '0.8rem 1.2rem',
  } as React.CSSProperties,
  infoChip: {
    padding: '0.45rem 0.8rem',
    borderRadius: 999,
    background: 'rgba(0,200,255,0.1)',
    color: 'var(--color-cyan)',
    border: '1px solid rgba(0,200,255,0.18)',
    fontSize: '0.84rem',
    fontWeight: 600,
  } as React.CSSProperties,
  warningChip: {
    padding: '0.45rem 0.8rem',
    borderRadius: 999,
    background: 'rgba(245,158,11,0.12)',
    color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.2)',
    fontSize: '0.84rem',
    fontWeight: 600,
  } as React.CSSProperties,
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)',
    gap: 20,
  } as React.CSSProperties,
  mainCard: {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 18,
    padding: '1.75rem',
  } as React.CSSProperties,
  sideCard: {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 18,
    padding: '1.75rem',
    height: 'fit-content',
  } as React.CSSProperties,
  sectionTitle: {
    margin: '0 0 1rem',
    fontSize: '1.15rem',
    fontWeight: 800,
    color: 'var(--color-text)',
  } as React.CSSProperties,
  subTitle: {
    margin: '1.4rem 0 0.8rem',
    fontSize: '0.98rem',
    fontWeight: 700,
    color: 'var(--color-text)',
  } as React.CSSProperties,
  description: {
    margin: 0,
    color: 'var(--color-text)',
    lineHeight: 1.7,
    whiteSpace: 'pre-wrap',
  } as React.CSSProperties,
  tagWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  } as React.CSSProperties,
  tag: {
    padding: '0.4rem 0.7rem',
    borderRadius: 999,
    background: 'rgba(0,200,255,0.08)',
    border: '1px solid rgba(0,200,255,0.16)',
    color: 'var(--color-cyan)',
    fontSize: '0.84rem',
    fontWeight: 600,
  } as React.CSSProperties,
  mutedText: {
    color: 'var(--color-muted2)',
  } as React.CSSProperties,
  matchBox: {
    padding: '1rem',
    borderRadius: 14,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
  } as React.CSSProperties,
  matchScore: {
    margin: '0 0 0.5rem',
    color: 'var(--color-cyan)',
    fontWeight: 800,
  } as React.CSSProperties,
  matchReason: {
    margin: 0,
    color: 'var(--color-text)',
    lineHeight: 1.6,
  } as React.CSSProperties,
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    padding: '0.8rem 0',
    borderBottom: '1px solid var(--color-border)',
  } as React.CSSProperties,
  infoLabel: {
    color: 'var(--color-muted2)',
    fontSize: '0.88rem',
  } as React.CSSProperties,
  infoValue: {
    color: 'var(--color-text)',
    fontWeight: 600,
    textAlign: 'right',
  } as React.CSSProperties,
  similarSection: {
    marginTop: '1.5rem',
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 18,
    padding: '1.75rem',
  } as React.CSSProperties,
  similarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 14,
  } as React.CSSProperties,
  similarLink: {
    textDecoration: 'none',
  } as React.CSSProperties,
  similarCard: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 14,
    padding: '1rem',
    height: '100%',
  } as React.CSSProperties,
  similarTitle: {
    margin: '0 0 0.45rem',
    color: 'var(--color-text)',
    fontSize: '1rem',
    fontWeight: 700,
  } as React.CSSProperties,
  similarMeta: {
    margin: '0.2rem 0 0',
    color: 'var(--color-muted2)',
    fontSize: '0.88rem',
  } as React.CSSProperties,
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    zIndex: 1000,
  } as React.CSSProperties,
  modalCard: {
    width: '100%',
    maxWidth: 620,
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 16,
    padding: '1.5rem',
  } as React.CSSProperties,
  modalTitle: {
    margin: '0 0 0.75rem',
    fontSize: '1.2rem',
    fontWeight: 800,
    color: 'var(--color-text)',
  } as React.CSSProperties,
  modalText: {
    margin: '0 0 0.75rem',
    color: 'var(--color-text-muted)',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  } as React.CSSProperties,
  cvStatusBox: {
    marginTop: 12,
    background: 'var(--color-surface)',
    borderRadius: 12,
    border: '1px solid var(--color-border)',
    padding: '1rem',
  } as React.CSSProperties,
  modalWarning: {
    marginTop: 12,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: '#fca5a5',
    borderRadius: 12,
    padding: '0.9rem 1rem',
    fontSize: '0.88rem',
    lineHeight: 1.6,
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: '1rem',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  modalPrimaryButton: {
    minHeight: 46,
    minWidth: 190,
    justifyContent: 'center',
  } as React.CSSProperties,
};
