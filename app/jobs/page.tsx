'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi, jobsApi } from '@/lib/api';
import type { JobDto, JobSearchDto, PaginatedResult } from '@/lib/types';
import JobCard from '@/components/JobCard';
import { Pagination, SkeletonCard } from '@/components/Skeleton';

const SORT_OPTIONS = [
  { value: 'date', label: 'Plus recents' },
  { value: 'relevance', label: 'Pertinence' },
  { value: 'salary', label: 'Salaire' },
] as const;

const JOB_TYPES = [
  { value: null, label: 'Tous les types' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Internship', label: 'Stage' },
] as const;

function normalizeSortBy(value: string | null): 'date' | 'relevance' | 'salary' {
  if (value === 'salary' || value === 'salary_high' || value === 'salary_low') return 'salary';
  if (value === 'relevance' || value === 'popular') return 'relevance';
  return 'date';
}

function hasActiveAdvancedFilters(filters: JobSearchDto): boolean {
  return Boolean(
    filters.keyword ||
      filters.techStack ||
      filters.location ||
      filters.jobType ||
      filters.company ||
      filters.remoteOnly ||
      filters.minSalary ||
      filters.maxSalary,
  );
}

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [result, setResult] = useState<PaginatedResult<JobDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inputValue, setInputValue] = useState(searchParams.get('keyword') ?? '');
  const hasTriggeredRefreshRef = useRef(false);
  const hasRecoveredEmptyPageRef = useRef(false);

  const [filters, setFilters] = useState<JobSearchDto>({
    keyword: searchParams.get('keyword') || null,
    techStack: searchParams.get('techStack') || null,
    location: searchParams.get('location') || null,
    jobType: searchParams.get('jobType') || null,
    remoteOnly: searchParams.get('remoteOnly') === 'true' ? true : null,
    pageNumber: 1,
    pageSize: 12,
    sortBy: normalizeSortBy(searchParams.get('sortBy')),
  });

  const load = useCallback(async (nextFilters: JobSearchDto) => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const useAdvancedSearch = hasActiveAdvancedFilters(nextFilters);
      const data = useAdvancedSearch
        ? await jobsApi.advanced(nextFilters)
        : await jobsApi.list(nextFilters.pageNumber ?? 1, nextFilters.pageSize ?? 12, nextFilters.sortBy);

      if (
        !hasRecoveredEmptyPageRef.current &&
        data.totalCount > 0 &&
        (data.items?.length ?? 0) === 0 &&
        (nextFilters.pageNumber ?? 1) > 1
      ) {
        hasRecoveredEmptyPageRef.current = true;
        setFilters((current) => ({ ...current, pageNumber: 1 }));
        return;
      }

      if (useAdvancedSearch && data.totalCount > 0 && (data.items?.length ?? 0) === 0) {
        const fallback = await jobsApi.list(nextFilters.pageNumber ?? 1, nextFilters.pageSize ?? 12, nextFilters.sortBy);
        setResult(fallback);
        setNotice('Les filtres avances ont renvoye une page vide. Affichage de la liste standard.');
        return;
      }

      if (
        !hasTriggeredRefreshRef.current &&
        data.totalCount === 0 &&
        (nextFilters.pageNumber ?? 1) === 1 &&
        !nextFilters.keyword &&
        !nextFilters.techStack &&
        !nextFilters.location &&
        !nextFilters.jobType &&
        !nextFilters.company &&
        !nextFilters.remoteOnly &&
        !nextFilters.minSalary &&
        !nextFilters.maxSalary
      ) {
        hasTriggeredRefreshRef.current = true;
        setSyncing(true);
        await adminApi.refreshAllInternal().catch(() => null);
        const refreshed = await jobsApi.advanced(nextFilters);
        setResult(refreshed);
        return;
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message ?? 'Erreur de chargement');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  useEffect(() => {
    hasRecoveredEmptyPageRef.current = false;
    const timeoutId = setTimeout(() => {
      const keyword = inputValue.trim() || null;
      if (keyword !== filters.keyword) {
        setFilters((current) => ({ ...current, keyword, pageNumber: 1 }));
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [filters.keyword, inputValue]);

  const setFilter = <K extends keyof JobSearchDto>(key: K, value: JobSearchDto[K]) => {
    setFilters((current) => ({ ...current, [key]: value, pageNumber: 1 }));
  };

  return (
    <main className="page-container" style={{ paddingTop: 'var(--space-8)' }}>
      <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div className="filter-grid filter-grid-top">
          <input
            className="input"
            style={{ flex: 1, minWidth: 220 }}
            placeholder="Rechercher un poste, une technologie ou une entreprise..."
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
          />
          <input
            className="input"
            style={{ minWidth: 0 }}
            placeholder="Lieu"
            value={filters.location ?? ''}
            onChange={(event) => setFilter('location', event.target.value.trim() || null)}
          />
          <input
            className="input"
            style={{ minWidth: 0 }}
            placeholder="Tech stack"
            value={filters.techStack ?? ''}
            onChange={(event) => setFilter('techStack', event.target.value.trim() || null)}
          />
        </div>

        <div className="filter-grid filter-grid-bottom" style={{ marginTop: 'var(--space-3)' }}>
          <select
            className="input"
            style={{ minWidth: 0 }}
            value={filters.jobType ?? ''}
            onChange={(event) => setFilter('jobType', event.target.value || null)}
          >
            {JOB_TYPES.map((option) => (
              <option key={option.value ?? ''} value={option.value ?? ''}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="input"
            style={{ minWidth: 0 }}
            value={filters.sortBy}
            onChange={(event) => setFilter('sortBy', event.target.value)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--color-text)', minHeight: 46 }}
          >
            <input
              type="checkbox"
              checked={filters.remoteOnly === true}
              onChange={(event) => setFilter('remoteOnly', event.target.checked ? true : null)}
            />
            Remote only
          </label>

          <button
            className="btn-ghost"
            style={{ marginLeft: 'auto', fontSize: '0.85rem', justifyContent: 'center' }}
            onClick={() => {
              setInputValue('');
              setFilters({
                keyword: null,
                techStack: null,
                location: null,
                jobType: null,
                remoteOnly: null,
                pageNumber: 1,
                pageSize: 12,
                sortBy: 'date',
              });
            }}
          >
            Reinitialiser
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ color: 'var(--color-error)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {error}
        </div>
      )}

      {notice && !error && (
        <div className="card" style={{ color: 'var(--color-cyan)', padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {notice}
        </div>
      )}

      <div className="section-heading" style={{ marginBottom: 'var(--space-4)' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          {loading
            ? syncing
              ? 'Synchronisation automatique des offres...'
              : 'Chargement...'
            : result
              ? `${result.totalCount} offre${result.totalCount > 1 ? 's' : ''} trouvee${result.totalCount > 1 ? 's' : ''}`
              : ''}
        </p>
      </div>

      {loading ? (
        syncing ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-3)' }}>↻</div>
            <p style={{ margin: 0, color: 'var(--color-text)' }}>Aucune offre detectee.</p>
            <p style={{ fontSize: '0.9rem', marginTop: 8 }}>
              Synchronisation automatique en cours avec le backend...
            </p>
          </div>
        ) : (
          <div className="results-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        )
      ) : (result?.items?.length ?? 0) === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>?</div>
          <p>Aucune offre ne correspond a vos criteres.</p>
          <p style={{ fontSize: '0.85rem', marginTop: 8 }}>Essayez de modifier ou reinitialiser vos filtres.</p>
        </div>
      ) : (
        <div className="results-grid">
          {result?.items.map((job) => (
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
            onChange={(page) => setFilters((current) => ({ ...current, pageNumber: page }))}
          />
        </div>
      )}
    </main>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="page-container" style={{ paddingTop: 'var(--space-8)' }}>Chargement...</div>}>
      <JobsContent />
    </Suspense>
  );
}
