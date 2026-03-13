'use client';
import Link from 'next/link';
import { JobDto } from '@/lib/types';
import { timeAgo, formatSalary, parseTechStack, sourceBadgeClass, sourceLabel, sourceIcon } from '@/lib/utils';

interface Props { 
  job: JobDto; 
  onClick?: () => void;
}

export default function JobCard({ job }: Props) {
  const techList = parseTechStack(job.techStack).slice(0, 5);
  const extraTech = parseTechStack(job.techStack).length - 5;

  return (
    <Link href={`/jobs/${job.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article className="cyber-border" style={{
        background: 'var(--color-card)',
        borderRadius: 14,
        padding: 'clamp(1rem, 2.4vw, 1.5rem)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)',
              margin: 0, marginBottom: 4,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{job.title}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-cyan)', fontWeight: 600, margin: 0 }}>
              {job.company}
            </p>
          </div>
          <span className={sourceBadgeClass(job.source)} style={{
            fontSize: '0.7rem', fontWeight: 600, padding: '0.25rem 0.6rem',
            borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            {sourceIcon(job.source)} {sourceLabel(job.source)}
          </span>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-muted2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            📍 {job.location}
          </span>
          {job.jobType && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-muted2)', display: 'flex', alignItems: 'center', gap: 4 }}>
              💼 {job.jobType}
            </span>
          )}
          {job.isRemote && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem',
              borderRadius: 4, background: 'rgba(16,185,129,0.12)', color: '#10b981',
              border: '1px solid rgba(16,185,129,0.25)',
            }}>Remote</span>
          )}
          {(job.minSalary || job.maxSalary) && (
            <span style={{ fontSize: '0.8rem', color: 'var(--color-green)', fontWeight: 600 }}>
              💰 {formatSalary(job.minSalary ?? undefined, job.maxSalary ?? undefined, job.currency ?? undefined)}
            </span>
          )}
        </div>

        {/* Description preview */}
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-muted)', margin: '0 0 12px',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          lineHeight: 1.6,
        }}>{job.description?.replace(/<[^>]*>/g, '').substring(0, 180)}...</p>

        {/* Tech stack */}
        {techList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {techList.map((tech, index) => (
              <span key={`${job.id}-${tech}-${index}`} style={{
                fontSize: '0.7rem', fontWeight: 500, padding: '0.2rem 0.55rem',
                borderRadius: 5, background: 'rgba(139,92,246,0.1)',
                color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)',
                fontFamily: 'var(--font-mono)',
              }}>{tech}</span>
            ))}
            {extraTech > 0 && (
              <span style={{
                fontSize: '0.7rem', color: 'var(--color-muted)', padding: '0.2rem 0.5rem',
              }}>+{extraTech}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            {timeAgo(job.createdAt)}
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>👁 {job.views}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>📨 {job.applications}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
