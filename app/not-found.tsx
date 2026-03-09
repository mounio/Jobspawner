import Link from 'next/link';
export default function NotFound() {
  return (
    <div style={{ minHeight: 'calc(100vh - 128px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
      <div>
        <div style={{ fontSize: '5rem', marginBottom: '1rem', lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: 8 }}>Page introuvable</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
        <Link href="/" className="btn-primary" style={{ textDecoration: 'none' }}>← Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
