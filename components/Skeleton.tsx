'use client';

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid var(--color-border)',
      borderRadius: 14,
      padding: 'clamp(1rem, 2.4vw, 1.5rem)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div className="skeleton" style={{ width: 220, height: 18, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: 120, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: 90, height: 24, borderRadius: 6 }} />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div className="skeleton" style={{ width: 80, height: 14 }} />
        <div className="skeleton" style={{ width: 70, height: 14 }} />
        <div className="skeleton" style={{ width: 50, height: 14 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[90, 70, 80].map((w, i) => (
          <div key={i} className="skeleton" style={{ width: w, height: 22, borderRadius: 5 }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid var(--color-border)' }}>
        <div className="skeleton" style={{ width: 80, height: 12 }} />
        <div className="skeleton" style={{ width: 60, height: 12 }} />
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ currentPage, totalCount, pageSize, onChange }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btn = (label: string | number, page: number | null, disabled = false, active = false) => (
    <button
      key={`${label}-${page}`}
      disabled={disabled || page === null}
      onClick={() => page && onChange(page)}
     style={{
      minWidth: 36,
      height: 36,
      borderRadius: 8,
      padding: '0 0.6rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-sans)',
      fontSize: '0.85rem',
      fontWeight: active ? 700 : 500,
      background: active ? 'linear-gradient(135deg,#00c8ff,#007fa3)' : 'var(--color-surface)',
      color: active ? '#000' : disabled ? 'var(--color-muted)' : 'var(--color-muted2)',
      border: active ? 'none' : '1px solid var(--color-border)',
      transition: 'all 0.15s',
    }}
    >{label}</button>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32 }}>
      {btn('←', currentPage > 1 ? currentPage - 1 : null, currentPage === 1)}
      {pages.map((p, i) =>
        p === '...' ? <span key={`dots-${i}`} style={{ color: 'var(--color-muted)', padding: '0 4px' }}>…</span>
          : btn(p, p as number, false, p === currentPage)
      )}
      {btn('→', currentPage < totalPages ? currentPage + 1 : null, currentPage === totalPages)}
    </div>
  );
}
