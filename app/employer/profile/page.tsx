'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { employersApi } from '@/lib/api';
import type { EmployerCreateDto, EmployerDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';

type EmployerProfileForm = {
  companyName: string;
  companyDescription: string;
  website: string;
  industry: string;
  companySize: string;
  location: string;
  logoUrl: string;
};

const INITIAL_FORM: EmployerProfileForm = {
  companyName: '',
  companyDescription: '',
  website: '',
  industry: '',
  companySize: '',
  location: '',
  logoUrl: '',
};

export default function EmployerProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [profile, setProfile] = useState<EmployerDto | null>(null);
  const [form, setForm] = useState<EmployerProfileForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!user || (user.role !== 'EMPLOYER' && user.role !== 'ADMIN')) {
      router.replace('/login');
      return;
    }

    employersApi
      .profile()
      .then((data) => {
        setProfile(data);
        setForm({
          companyName: data.companyName ?? '',
          companyDescription: data.companyDescription ?? '',
          website: data.website ?? '',
          industry: data.industry ?? '',
          companySize: data.size ?? '',
          location: data.location ?? '',
          logoUrl: '',
        });
      })
      .catch(() => {
        setProfile(null);
        setForm(INITIAL_FORM);
      })
      .finally(() => setLoading(false));
  }, [isLoading, router, user]);

  const setField =
    (key: keyof EmployerProfileForm) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.companyName.trim()) {
      setError("Le nom de l'entreprise est requis.");
      return;
    }

    setSaving(true);

    try {
      const requestBody: EmployerCreateDto = {
        companyName: form.companyName.trim(),
        companyDescription: form.companyDescription.trim() || undefined,
        website: form.website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        size: form.companySize.trim() || undefined,
        location: form.location.trim() || undefined,
        logoUrl: form.logoUrl.trim() || undefined,
      };

      const nextProfile = profile
        ? await employersApi.updateProfile(requestBody)
        : await employersApi.createProfile(requestBody);

      setProfile(nextProfile);
      setForm({
        companyName: nextProfile.companyName ?? '',
        companyDescription: nextProfile.companyDescription ?? '',
        website: nextProfile.website ?? '',
        industry: nextProfile.industry ?? '',
        companySize: nextProfile.size ?? '',
        location: nextProfile.location ?? '',
        logoUrl: '',
      });
      toast(profile ? 'Profil employeur mis a jour.' : 'Profil employeur cree.');
    } catch (err: any) {
      const message = err.message ?? 'Erreur lors de la sauvegarde';
      setError(message);
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 8px' }}>
          Profil employeur
        </h1>
        <p style={{ color: 'var(--color-muted)', margin: 0 }}>
          {profile
            ? `Derniere mise a jour: ${formatDate(profile.updatedAt)}`
            : 'Creez votre profil entreprise pour publier des offres.'}
        </p>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            borderRadius: 12,
            padding: '0.95rem 1rem',
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSave}
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: '1.75rem',
        }}
      >
        <div style={gridStyle}>
          <InputField label="NOM ENTREPRISE *" value={form.companyName} onChange={setField('companyName')} />
          <InputField label="SITE WEB" value={form.website} onChange={setField('website')} type="url" />
          <InputField label="INDUSTRIE" value={form.industry} onChange={setField('industry')} />
          <InputField label="TAILLE" value={form.companySize} onChange={setField('companySize')} />
          <InputField label="LOCALISATION" value={form.location} onChange={setField('location')} />
          <InputField label="LOGO URL" value={form.logoUrl} onChange={setField('logoUrl')} type="url" />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea
            className="input-dark"
            rows={6}
            value={form.companyDescription}
            onChange={setField('companyDescription')}
            style={{ resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button type="button" className="btn-ghost" onClick={() => router.push('/employer')}>
            Retour
          </button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Sauvegarde...' : profile ? 'Mettre a jour' : 'Creer le profil'}
          </button>
        </div>
      </form>
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
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
