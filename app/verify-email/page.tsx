'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setEmail(searchParams.get('email') ?? '');
  }, [searchParams]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    if (!trimmedEmail) {
      setError('Veuillez entrer votre email.');
      return;
    }

    if (!/^\d{6}$/.test(trimmedCode)) {
      setError('Le code doit contenir exactement 6 chiffres.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.verifyEmail({ email: trimmedEmail, code: trimmedCode });
      setMessage(res.message);
      toast(res.message);
      setTimeout(() => {
        router.push('/login');
      }, 800);
    } catch (err: any) {
      const nextError = err?.message ?? 'Verification impossible.';
      setError(nextError);
      toast(nextError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Veuillez entrer votre email pour renvoyer le code.');
      return;
    }

    setError('');
    setMessage('');
    setResending(true);

    try {
      const res = await authApi.resendCode(trimmedEmail);
      setMessage(res.message);
      toast(res.message);
    } catch (err: any) {
      const nextError = err?.message ?? 'Renvoi impossible.';
      setError(nextError);
      toast(nextError, 'error');
    } finally {
      setResending(false);
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
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 18,
          padding: '2rem',
        }}
      >
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.78rem',
            color: 'var(--color-cyan)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Verification email
        </p>
        <h1
          style={{
            margin: '0 0 0.75rem',
            fontSize: '1.7rem',
            fontWeight: 900,
            color: 'var(--color-text)',
          }}
        >
          Entrez votre code
        </h1>
        <p style={{ margin: '0 0 1.5rem', color: 'var(--color-muted2)', lineHeight: 1.6 }}>
          Saisissez le code a 6 chiffres envoye par email pour activer votre compte.
        </p>

        {error && <MessageBox tone="error">{error}</MessageBox>}
        {message && <MessageBox tone="success">{message}</MessageBox>}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>EMAIL</label>
            <input
              className="input-dark"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="vous@exemple.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label style={labelStyle}>CODE A 6 CHIFFRES</label>
            <input
              className="input-dark"
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              autoComplete="one-time-code"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Verification...' : 'Verifier mon email'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
          <button
            type="button"
            className="btn-ghost"
            disabled={resending}
            onClick={() => void handleResend()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            {resending ? 'Renvoi...' : 'Renvoyer le code'}
          </button>
          <Link
            href="/login"
            className="btn-ghost"
            style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
          >
            Retour connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

function MessageBox({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'success' | 'error';
}) {
  return (
    <div
      style={{
        marginBottom: '1rem',
        borderRadius: 10,
        padding: '0.85rem 1rem',
        fontSize: '0.84rem',
        lineHeight: 1.6,
        border:
          tone === 'success'
            ? '1px solid rgba(16,185,129,0.3)'
            : '1px solid rgba(239,68,68,0.35)',
        background:
          tone === 'success'
            ? 'rgba(16,185,129,0.08)'
            : 'rgba(239,68,68,0.08)',
        color: tone === 'success' ? '#6ee7b7' : '#fca5a5',
      }}
    >
      {children}
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
