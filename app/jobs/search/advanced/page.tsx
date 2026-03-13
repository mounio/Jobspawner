'use client';

import { useState } from 'react';
import { jobsApi } from '@/lib/api';

export default function AdvancedSearchPage() {
  const [filters, setFilters] = useState({ keyword: '', techStack: '', location: '', jobType: '', company: '', remoteOnly: false, minSalary: '', maxSalary: '', pageNumber: 1, pageSize: 10, sortBy: 'date' });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.advanced({ ...filters, minSalary: filters.minSalary ? Number(filters.minSalary) : undefined, maxSalary: filters.maxSalary ? Number(filters.maxSalary) : undefined });
      setResults(data.items);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Recherche avancée</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <input placeholder="Mot-clé" value={filters.keyword} onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Stack technique" value={filters.techStack} onChange={e => setFilters(f => ({ ...f, techStack: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Localisation" value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Entreprise" value={filters.company} onChange={e => setFilters(f => ({ ...f, company: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Type de poste" value={filters.jobType} onChange={e => setFilters(f => ({ ...f, jobType: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Salaire min" type="number" value={filters.minSalary} onChange={e => setFilters(f => ({ ...f, minSalary: e.target.value }))} style={{ marginRight: 8 }} />
        <input placeholder="Salaire max" type="number" value={filters.maxSalary} onChange={e => setFilters(f => ({ ...f, maxSalary: e.target.value }))} style={{ marginRight: 8 }} />
        <label style={{ marginRight: 8 }}><input type="checkbox" checked={filters.remoteOnly} onChange={e => setFilters(f => ({ ...f, remoteOnly: e.target.checked }))} /> Remote only</label>
        <button type="submit" disabled={loading} style={{ padding: '0.5rem 1.5rem' }}>Rechercher</button>
      </form>
      {loading && <div>Chargement...</div>}
      {error && <div style={{ color: 'var(--color-red)' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {results.map(job => (
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
