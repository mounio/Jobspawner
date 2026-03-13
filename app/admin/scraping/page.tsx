'use client';

import React, { useState } from 'react';
import { adminApi } from '@/lib/api';

export default function AdminScrapingPage() {
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshed, setAutoRefreshed] = useState(false);

  const handleRefreshAll = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.refreshAll();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du scraping');
    } finally {
      setLoading(false);
    }
  };

  // Refresh automatique au chargement, une seule fois, avec refreshAllInternal
  React.useEffect(() => {
    if (!autoRefreshed) {
      setAutoRefreshed(true);
      setLoading(true);
      setError(null);
      adminApi.refreshAllInternal()
        .then(setResult)
        .catch(err => setError(err.message || 'Erreur lors du scraping'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshed]);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: 8 }}>Scraping Admin</h1>
      <button onClick={handleRefreshAll} disabled={loading} style={{ padding: '0.5rem 1.5rem', marginBottom: 16 }}>Lancer le scraping complet</button>
      {loading && <div>Chargement...</div>}
      {error && <div style={{ color: 'var(--color-red)' }}>{error}</div>}
      {result && (
        <div>
          <p>Total importé : {result.totalImported}</p>
          <ul>
            {Object.entries(result.importedBySource || {}).map(([source, count]) => {
              return <li key={String(source)}>{String(source)} : {String(count)}</li>;
            })}
          </ul>
          <p>Terminé le : {result.completedAt}</p>
        </div>
      )}
    </div>
  );
}
