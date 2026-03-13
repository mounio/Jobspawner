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
    <html lang="fr" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>
          <ToastProvider>
            <Navbar />
            <main className="app-shell-main">
              {children}
            </main>
            <footer className="footer-shell">
              <span className="grad-text" style={{ fontWeight: 700 }}>JobSpawner</span>
              {' '}· Agrégateur d&apos;offres tech · {new Date().getFullYear()}
            </footer>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
