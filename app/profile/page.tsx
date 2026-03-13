'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usersApi } from '@/lib/api';
import type { UserProfileDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate, resolveAssetUrl } from '@/lib/utils';

type ProfileUpdateForm = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  linkedInUrl?: string | null;
  gitHubUrl?: string | null;
  coverLetter?: string | null;
};

export default function ProfilePage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const cvInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<ProfileUpdateForm>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'EMPLOYER') {
      router.replace('/employer/profile');
      return;
    }

    usersApi
      .profile()
      .then((profile) => {
        setForm({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone ?? '',
          address: profile.address ?? '',
          city: profile.city ?? '',
          country: profile.country ?? '',
          linkedInUrl: profile.linkedInUrl ?? '',
          gitHubUrl: profile.gitHubUrl ?? '',
          coverLetter: profile.coverLetter ?? '',
        });
      })
      .catch(() =>
        setForm({
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone ?? '',
          address: user.address ?? '',
          city: user.city ?? '',
          country: user.country ?? '',
          linkedInUrl: user.linkedInUrl ?? '',
          gitHubUrl: user.gitHubUrl ?? '',
          coverLetter: user.coverLetter ?? '',
        }),
      )
      .finally(() => setLoading(false));
  }, [isLoading, router, user]);

  const setField =
    (key: keyof ProfileUpdateForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      let nextUser = await usersApi.updateProfile({
        firstName: form.firstName?.trim(),
        lastName: form.lastName?.trim(),
        phone: form.phone?.trim() || '',
        address: form.address?.trim() || '',
        city: form.city?.trim() || '',
        country: form.country?.trim() || '',
        linkedInUrl: form.linkedInUrl?.trim() || '',
        gitHubUrl: form.gitHubUrl?.trim() || '',
        coverLetter: form.coverLetter?.trim() || '',
      });

      if (cvFile) {
        const upload = await usersApi.uploadCv(cvFile);
        nextUser = { ...nextUser, cvPath: upload.cvPath };
        toast(upload.message);
        setCvFile(null);
      }

      updateUser(nextUser);
      toast('Profil mis a jour.');
    } catch (err: any) {
      toast(err.message ?? 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="skeleton"
            style={{ height: 48, marginBottom: 16, borderRadius: 10 }}
          />
        ))}
      </div>
    );
  }

  const displayName = `${form.firstName ?? ''} ${form.lastName ?? ''}`.trim();

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 900,
            margin: '0 0 6px',
            color: 'var(--color-text)',
          }}
        >
          Mon profil
        </h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.88rem', margin: 0 }}>
          Membre depuis {user?.createdAt ? formatDate(user.createdAt) : '-'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          marginBottom: '2rem',
          padding: '1.5rem',
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            fontWeight: 800,
            color: '#000',
            flexShrink: 0,
          }}
        >
          {(form.firstName?.[0] ?? '?').toUpperCase()}
          {(form.lastName?.[0] ?? '').toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)' }}>
            {displayName || 'Profil'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: 2 }}>
            {user?.email}
          </div>
          <div style={{ marginTop: 10 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.3rem 0.7rem',
                borderRadius: 999,
                background: user?.cvPath ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${user?.cvPath ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                color: user?.cvPath ? '#34d399' : '#f87171',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              {user?.cvPath ? 'CV uploadé' : 'CV manquant'}
            </span>
          </div>
          {(form.city || form.country) && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted2)', marginTop: 2 }}>
              {[form.city, form.country].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Section title="Informations personnelles">
          <div style={gridStyle}>
            <InputField label="PRENOM" value={form.firstName ?? ''} onChange={setField('firstName')} />
            <InputField label="NOM" value={form.lastName ?? ''} onChange={setField('lastName')} />
            <InputField label="TELEPHONE" value={form.phone ?? ''} onChange={setField('phone')} />
            <InputField label="ADRESSE" value={form.address ?? ''} onChange={setField('address')} />
            <InputField label="VILLE" value={form.city ?? ''} onChange={setField('city')} />
            <InputField label="PAYS" value={form.country ?? ''} onChange={setField('country')} />
          </div>
        </Section>

        <Section title="Liens professionnels">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InputField
              label="LINKEDIN URL"
              type="url"
              value={form.linkedInUrl ?? ''}
              onChange={setField('linkedInUrl')}
            />
            <InputField
              label="GITHUB URL"
              type="url"
              value={form.gitHubUrl ?? ''}
              onChange={setField('gitHubUrl')}
            />
          </div>
        </Section>

        <Section title="Mon CV">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              padding: '1rem',
              borderRadius: 12,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  {cvFile
                    ? cvFile.name
                    : user?.cvPath
                      ? 'CV disponible dans votre profil'
                      : 'Aucun CV enregistre'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginTop: 6 }}>
                  {cvFile
                    ? 'Le fichier sera televerse lors de la sauvegarde du profil.'
                    : user?.cvPath
                      ? `Fichier actuel: ${user.cvPath}`
                      : 'Ajoutez un CV pour pouvoir postuler rapidement.'}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.35rem 0.7rem',
                  borderRadius: 999,
                  background: user?.cvPath || cvFile ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  color: user?.cvPath || cvFile ? '#34d399' : '#f87171',
                  border: `1px solid ${user?.cvPath || cvFile ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                {user?.cvPath || cvFile ? 'Pret pour candidater' : 'CV introuvable'}
              </span>
            </div>

            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={() => cvInputRef.current?.click()}
                style={{
                  minHeight: 48,
                  padding: '0.85rem 1.2rem',
                  border: '1px solid rgba(0,200,255,0.45)',
                  boxShadow: '0 12px 28px rgba(0,200,255,0.22)',
                  background: 'linear-gradient(135deg, #1ee3ff 0%, #00a7d6 55%, #007fa3 100%)',
                  color: '#02131d',
                  fontSize: '0.92rem',
                  letterSpacing: '0.01em',
                }}
              >
                Televerser mon CV
              </button>
              {user?.cvPath && (
                <a
                  href={resolveAssetUrl(user.cvPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="btn-ghost"
                  style={{ textDecoration: 'none' }}
                >
                  Voir mon CV actuel
                </a>
              )}
              {cvFile && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => {
                    setCvFile(null);
                    if (cvInputRef.current) {
                      cvInputRef.current.value = '';
                    }
                  }}
                >
                  Retirer ce fichier
                </button>
              )}
            </div>

            {!user?.cvPath && !cvFile && (
              <div
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.25)',
                  color: '#fbbf24',
                  borderRadius: 10,
                  padding: '0.85rem 1rem',
                  fontSize: '0.85rem',
                  lineHeight: 1.6,
                }}
              >
                Aucun CV n&apos;a ete trouve. Veuillez choisir un fichier depuis votre bureau ou un autre dossier, puis sauvegarder votre profil.
              </div>
            )}
          </div>
        </Section>

        <Section title="Description du profil">
          <p style={{ color: 'var(--color-muted)', fontSize: '0.86rem', lineHeight: 1.6, margin: '0 0 0.9rem' }}>
            Cette description presente votre profil candidat et peut aussi servir de texte par defaut lors des candidatures.
          </p>
          <textarea
            className="input-dark"
            rows={6}
            placeholder="Presentez votre parcours, vos competences, vos objectifs..."
            value={form.coverLetter ?? ''}
            onChange={setField('coverLetter')}
            style={{ resize: 'vertical', fontFamily: 'var(--font-sans)', lineHeight: 1.6 }}
          />
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" className="btn-ghost" onClick={() => router.push('/dashboard')}>
            Annuler
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
            style={{ padding: '0.75rem 2.5rem', fontSize: '0.95rem' }}
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid var(--color-border)',
        borderRadius: 14,
        padding: '1.75rem',
        marginBottom: '1.25rem',
      }}
    >
      <h2
        style={{
          fontSize: '0.8rem',
          fontWeight: 700,
          color: 'var(--color-muted)',
          letterSpacing: '0.06em',
          margin: '0 0 1.25rem',
          textTransform: 'uppercase',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input className="input-dark" type={type} value={value} onChange={onChange} />
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.72rem',
  fontWeight: 700,
  color: 'var(--color-muted)',
  marginBottom: 6,
  letterSpacing: '0.05em',
};
