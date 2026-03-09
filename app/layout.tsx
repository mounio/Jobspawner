import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'JobSpawner — Find Your Next Tech Role',
  description: 'Aggregate tech job listings from GitHub, Stack Overflow, RemoteOK and WeWorkRemotely.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main style={{ minHeight: 'calc(100vh - 64px)' }}>
              {children}
            </main>
            <footer style={{
              borderTop: '1px solid var(--color-border)',
              padding: '2rem 1.5rem',
              textAlign: 'center',
              color: 'var(--color-muted)',
              fontSize: '0.8rem',
              background: 'var(--color-surface)',
            }}>
              <span className="grad-text" style={{ fontWeight: 700 }}>JobSpawner</span>
              {' '}· Agrégateur d&apos;offres tech · {new Date().getFullYear()}
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
