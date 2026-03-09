'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import type { JobDto, PaginatedResult, JobSearchDto } from '@/lib/types';
import JobCard from '@/components/JobCard';
import { SkeletonCard, Pagination } from '@/components/Skeleton';


function JobsContent() {
  const sp     = useSearchParams();
  const router = useRouter();

  const [result,   setResult]   = useState<PaginatedResult<JobDto> | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [inputVal, setInputVal] = useState(sp.get('keyword') ?? '');

  const [filters, setFilters] = useState<JobSearchDto>({
    keyword:    sp.get('keyword')   || null,
    techStack:  sp.get('techStack') || null,
    location:   sp.get('location')  || null,
    jobType:    sp.get('jobType')   || null,
    remoteOnly: sp.get('remoteOnly') === 'true' ? true : null,
    pageNumber: 1,
    pageSize:   12,
    sortBy:     sp.get('sortBy') ?? 'newest',
  });

  const load = useCallback(async (f: JobSearchDto) => {
    setLoading(true); setError('');
    try {
      const data = await jobsApi.advanced(f);
      setResult(data);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filters); }, [filters, load]);

  // Debounce keyword input
  useEffect(() => {
    const t = setTimeout(() => {
      const kw = inputVal.trim() || null;
      if (kw !== filters.keyword) setFilters(f => ({ ...f, keyword: kw, pageNumber: 1 }));
    }, 350);
    return () => clearTimeout(t);
  }, [inputVal]);

  const setFilter = <K extends keyof JobSearchDto>(key: K, val: JobSearchDto[K]) =>
    setFilters(f => ({ ...f, [key]: val, pageNumber: 1 }));

  const sortOptions = [
    { value: 'newest',      label: 'Plus récents' },
    { value: 'popular',     label: 'Populaires'   },
    { value: 'salary_high', label: 'Salaire ↓'    },
    { value: 'salary_low',  label: 'Salaire ↑'    },
  ];

  const jobTypes = [
    { value: null,       label: 'Tous les types' },
    { value: 'Full-time',label: 'Full-time'       },
    { value: 'Part-time',label: 'Part-time'       },
    { value: 'Contract', label: 'Contract'        },
    { value: 'Freelance',label: 'Freelance'       },
    { value: 'Internship',label:'Stage'           },
  ];

  return (
    <main className="page-container" style={{ paddingTop: 'var(--space-8)' }}>

      {/* ── Barre de recherche ── */}
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 220 }}
            placeholder="🔍  Rechercher un poste, technologie, entreprise…"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
          />
          <input
            className="input"
            style={{ width: 180 }}
            placeholder="📍  Lieu"
            value={filters.location ?? ''}
            onChange={e => setFilter('location', e.target.value.trim() || null)}
          />
          <input
            className="input"
            style={{ width: 160 }}
            placeholder="⚡  TechStack"
            value={filters.techStack ?? ''}
            onChange={e => setFilter('techStack', e.target.value.trim() || null)}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Type de contrat */}
          <select
            className="input"
            style={{ width: 170 }}
            value={filters.jobType ?? ''}
            onChange={e => setFilter('jobType', e.target.value || null)}
          >
            {jobTypes.map(o => (
              <option key={o.value ?? ''} value={o.value ?? ''}>{o.label}</option>
            ))}
          </select>

          {/* Tri */}
          <select
            className="input"
            style={{ width: 160 }}
            value={filters.sortBy}
            onChange={e => setFilter('sortBy', e.target.value)}
          >
            {sortOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Remote only */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-text)' }}>
            <input
              type="checkbox"
              checked={filters.remoteOnly === true}
              onChange={e => setFilter('remoteOnly', e.target.checked ? true : null)}
            />
            Remote only
          </label>

          {/* Reset */}
          <button
            className="btn-ghost"
            style={{ marginLeft: 'auto', fontSize: '0.85rem' }}
            onClick={() => {
              setInputVal('');
              setFilters({ keyword: null, techStack: null, location: null, jobType: null, remoteOnly: null, pageNumber: 1, pageSize: 12, sortBy: 'newest' });
            }}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* ── Résultats ── */}
      {error && (
        <div className="card" style={{ color: 'var(--color-error)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {loading ? 'Chargement…' : result ? `${result.totalCount} offre${result.totalCount > 1 ? 's' : ''} trouvée${result.totalCount > 1 ? 's' : ''}` : ''}
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : result?.data?.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>🔍</div>
          <p>Aucune offre ne correspond à vos critères.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Essayez de modifier ou réinitialiser vos filtres.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {result?.data?.map(job => (
            <JobCard key={job.id} job={job} onClick={() => router.push(`/jobs/${job.id}`)} />
          ))}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <div style={{ marginTop: 'var(--space-8)' }}>
          <Pagination
            currentPage={result.pageNumber}
            totalCount={result.totalCount}
            pageSize={result.pageSize}
            onChange={(p) => setFilters(f => ({ ...f, pageNumber: p }))}
          />
        </div>
      )}
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ paddingTop: 'var(--space-8)' }}>Chargement…</div>}>
      <JobsContent />
    </Suspense>
  );
}




















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































