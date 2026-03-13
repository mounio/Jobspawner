'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    router.replace(user.role === 'EMPLOYER' ? '/employer' : '/dashboard');
  }, [router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const email = form.email.trim().toLowerCase();

    try {
      const res = await authApi.login({
        email,
        password: form.password,
      });

      if (res.requiresVerification) {
        toast(res.message || 'Veuillez verifier votre email.', 'info');
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (!res.token || !res.user) {
        setError(res.message || 'Connexion impossible.');
        return;
      }

      login(res.token, res.user, form.rememberMe);
      toast(`Connexion reussie. Bienvenue ${res.user.firstName}.`);
      router.push(res.user.role === 'EMPLOYER' ? '/employer' : '/dashboard');
    } catch (err: any) {
      const message = err?.message ?? 'Email ou mot de passe incorrect.';
      if (err?.status === 401) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="grid-bg"
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              fontWeight: 800,
              color: '#000',
              marginBottom: '1.25rem',
            }}
          >
            J
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              margin: '0 0 8px',
              color: 'var(--color-text)',
            }}
          >
            Bon retour
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', margin: 0 }}>
            Connectez-vous a votre compte JobSpawner
          </p>
        </div>

        <div
          style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 18,
            padding: '2rem',
          }}
        >
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.35)',
                borderRadius: 10,
                padding: '0.875rem 1rem',
                marginBottom: '1.25rem',
                color: '#fca5a5',
                fontSize: '0.83rem',
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div>
              <label style={labelStyle}>EMAIL</label>
              <input
                className="input-dark"
                type="email"
                required
                autoFocus
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label style={labelStyle}>MOT DE PASSE</label>
              <input
                className="input-dark"
                type="password"
                required
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
                placeholder="Votre mot de passe"
                autoComplete="current-password"
              />
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--color-text)',
                fontSize: '0.88rem',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={form.rememberMe}
                onChange={(event) =>
                  setForm((current) => ({ ...current, rememberMe: event.target.checked }))
                }
              />
              Se souvenir de moi
            </label>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                height: 46,
                fontSize: '0.95rem',
                marginTop: 4,
              }}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            color: 'var(--color-muted)',
            fontSize: '0.85rem',
          }}
        >
          Pas encore de compte ?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--color-cyan)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            S&apos;inscrire
          </Link>
        </p>

        <p
          style={{
            textAlign: 'center',
            marginTop: '0.75rem',
            color: 'var(--color-muted)',
            fontSize: '0.8rem',
          }}
        >
          Email non verifie ?{' '}
          <Link
            href="/verify-email"
            style={{
              color: 'var(--color-cyan)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Entrer un code
          </Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-muted)',
  marginBottom: 6,
  letterSpacing: '0.05em',
};
