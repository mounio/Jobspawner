'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import type { UserRole } from '@/lib/types';

type Step = 'role' | 'identity' | 'company';

interface FormState {
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
  phone: string;
  city: string;
  country: string;
  companyName: string;
  companyDescription: string;
  website: string;
  industry: string;
  companySize: string;
  companyLocation: string;
}

type ChangeHandler = (
  event: React.ChangeEvent<
    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  >,
) => void;

const INDUSTRIES = [
  'Technologie',
  'Finance',
  'Sante',
  'E-commerce',
  'Education',
  'Media',
  'Conseil',
  'Industrie',
  'Autre',
];

const SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'];

const ROLE_OPTIONS = [
  {
    role: 'CANDIDATE' as UserRole,
    badge: 'Candidat',
    title: 'Candidat',
    desc: 'Je cherche un emploi tech',
  },
  {
    role: 'EMPLOYER' as UserRole,
    badge: 'Employeur',
    title: 'Employeur',
    desc: 'Je recrute des talents',
  },
];

const INITIAL_FORM: FormState = {
  role: 'CANDIDATE',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirm: '',
  phone: '',
  city: '',
  country: '',
  companyName: '',
  companyDescription: '',
  website: '',
  industry: '',
  companySize: '',
  companyLocation: '',
};

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<Step>('role');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const setField =
    (key: keyof FormState): ChangeHandler =>
    (event) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const validateIdentity = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast('Veuillez remplir tous les champs obligatoires.', 'error');
      return false;
    }

    if (form.password !== form.confirm) {
      toast('Les mots de passe ne correspondent pas.', 'error');
      return false;
    }

    if (form.password.length < 8) {
      toast('Mot de passe trop court (minimum 8 caracteres).', 'error');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateIdentity()) return;

    if (form.role === 'EMPLOYER' && !form.companyName.trim()) {
      toast("Le nom de l'entreprise est requis.", 'error');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
        city: form.city || undefined,
        country: form.country || undefined,
        companyName: form.companyName || undefined,
        companyDescription: form.companyDescription || undefined,
        website: form.website || undefined,
        industry: form.industry || undefined,
        companySize: form.companySize || undefined,
        companyLocation: form.companyLocation || undefined,
      });

      toast(res.message || 'Compte cree. Verifiez votre email.');

      if (res.requiresVerification) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email.trim().toLowerCase())}`);
        return;
      }

      router.push('/login');
    } catch (err: any) {
      toast(err.message ?? "Erreur lors de l'inscription", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {step === 'role' && (
          <RoleStep
            selectedRole={form.role}
            onSelectRole={(role) => {
              setForm((current) => ({ ...current, role }));
              setStep('identity');
            }}
          />
        )}

        {step === 'identity' && (
          <IdentityStep
            form={form}
            loading={loading}
            setField={setField}
            onBack={() => setStep('role')}
            onNext={() => {
              if (!validateIdentity()) return;
              if (form.role === 'EMPLOYER') {
                setStep('company');
                return;
              }
              void handleSubmit();
            }}
          />
        )}

        {step === 'company' && (
          <CompanyStep
            form={form}
            loading={loading}
            setField={setField}
            onBack={() => setStep('identity')}
            onSubmit={() => void handleSubmit()}
          />
        )}
      </div>
    </div>
  );
}

function RoleStep({
  selectedRole,
  onSelectRole,
}: {
  selectedRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}) {
  return (
    <div>
      <h1 style={styles.heading}>Creer un compte</h1>
      <p style={styles.sub}>Vous etes...</p>

      <div style={styles.roleGrid}>
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.role}
            type="button"
            onClick={() => onSelectRole(option.role)}
            style={{
              ...styles.roleCard,
              borderColor:
                selectedRole === option.role
                  ? 'var(--color-cyan)'
                  : 'var(--color-border)',
              background:
                selectedRole === option.role
                  ? 'rgba(0,200,255,0.06)'
                  : 'var(--color-surface)',
            }}
          >
            <div style={styles.roleBadge}>{option.badge}</div>
            <div style={styles.roleTitle}>{option.title}</div>
            <div style={styles.roleDesc}>{option.desc}</div>
          </button>
        ))}
      </div>

      <p style={styles.footerText}>
        Deja un compte ?{' '}
        <Link href="/login" style={styles.inlineLink}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function IdentityStep({
  form,
  loading,
  setField,
  onBack,
  onNext,
}: {
  form: FormState;
  loading: boolean;
  setField: (key: keyof FormState) => ChangeHandler;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div style={styles.stepBack}>
        <button type="button" onClick={onBack} style={styles.backBtn}>
          Retour
        </button>
        <span style={styles.stepTag}>
          {form.role === 'EMPLOYER' ? 'Employeur' : 'Candidat'} - Etape 1/2
        </span>
      </div>

      <h2 style={styles.heading}>Vos informations</h2>

      <div style={styles.formGrid}>
        <InputField
          label="Prenom *"
          value={form.firstName}
          onChange={setField('firstName')}
          placeholder="Jean"
          autoComplete="given-name"
        />
        <InputField
          label="Nom *"
          value={form.lastName}
          onChange={setField('lastName')}
          placeholder="Dupont"
          autoComplete="family-name"
        />
      </div>

      <InputField
        label="Email *"
        type="email"
        value={form.email}
        onChange={setField('email')}
        placeholder="jean@exemple.com"
        autoComplete="email"
      />

      <div style={styles.formGrid}>
        <InputField
          label="Mot de passe *"
          type="password"
          value={form.password}
          onChange={setField('password')}
          placeholder="Minimum 8 caracteres"
          autoComplete="new-password"
        />
        <InputField
          label="Confirmer le mot de passe *"
          type="password"
          value={form.confirm}
          onChange={setField('confirm')}
          placeholder="Retapez le mot de passe"
          autoComplete="new-password"
        />
      </div>

      <div style={styles.formGridTriple}>
        <InputField
          label="Telephone"
          type="tel"
          value={form.phone}
          onChange={setField('phone')}
          placeholder="+32 xxx xx xx xx"
          autoComplete="tel"
        />
        <InputField
          label="Ville"
          value={form.city}
          onChange={setField('city')}
          placeholder="Bruxelles"
          autoComplete="address-level2"
        />
        <InputField
          label="Pays"
          value={form.country}
          onChange={setField('country')}
          placeholder="Belgique"
          autoComplete="country-name"
        />
      </div>

      <button
        className="btn-primary"
        type="button"
        style={styles.submitButton}
        onClick={onNext}
        disabled={loading}
      >
        {form.role === 'EMPLOYER'
          ? 'Suivant'
          : loading
            ? 'Creation...'
            : 'Creer mon compte'}
      </button>
    </div>
  );
}

function CompanyStep({
  form,
  loading,
  setField,
  onBack,
  onSubmit,
}: {
  form: FormState;
  loading: boolean;
  setField: (key: keyof FormState) => ChangeHandler;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <div>
      <div style={styles.stepBack}>
        <button type="button" onClick={onBack} style={styles.backBtn}>
          Retour
        </button>
        <span style={styles.stepTag}>Employeur - Etape 2/2</span>
      </div>

      <h2 style={styles.heading}>Votre entreprise</h2>

      <InputField
        label="Nom de l'entreprise *"
        value={form.companyName}
        onChange={setField('companyName')}
        placeholder="Acme Corp"
        autoComplete="organization"
      />

      <TextAreaField
        label="Description de l'entreprise"
        value={form.companyDescription}
        onChange={setField('companyDescription')}
        placeholder="Ce que fait votre entreprise, vos valeurs..."
        rows={4}
      />

      <div style={styles.formGrid}>
        <InputField
          label="Site web"
          type="url"
          value={form.website}
          onChange={setField('website')}
          placeholder="https://acme.com"
          autoComplete="url"
        />
        <InputField
          label="Localisation"
          value={form.companyLocation}
          onChange={setField('companyLocation')}
          placeholder="Bruxelles / Remote"
        />
      </div>

      <div style={styles.formGrid}>
        <SelectField
          label="Secteur"
          value={form.industry}
          onChange={setField('industry')}
          placeholder="Selectionner..."
          options={INDUSTRIES.map((industry) => ({
            label: industry,
            value: industry,
          }))}
        />
        <SelectField
          label="Taille de l'equipe"
          value={form.companySize}
          onChange={setField('companySize')}
          placeholder="Selectionner..."
          options={SIZES.map((size) => ({
            label: `${size} personnes`,
            value: size,
          }))}
        />
      </div>

      <button
        className="btn-primary"
        type="button"
        style={styles.submitButton}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? 'Creation...' : 'Creer mon compte employeur'}
      </button>
    </div>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: ChangeHandler;
  placeholder?: string;
};

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.fieldWrap}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  autoComplete,
}: FieldProps & { type?: string; autoComplete?: string }) {
  return (
    <FieldShell label={label}>
      <input
        className="input-dark"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </FieldShell>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
}: FieldProps & { rows?: number }) {
  return (
    <FieldShell label={label}>
      <textarea
        className="input-dark"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        style={styles.textarea}
      />
    </FieldShell>
  );
}

function SelectField({
  label,
  value,
  onChange,
  placeholder = '',
  options,
}: FieldProps & { options: Array<{ label: string; value: string }> }) {
  return (
    <FieldShell label={label}>
      <select className="input-dark" value={value} onChange={onChange}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1rem',
  } as React.CSSProperties,
  card: {
    width: '100%',
    maxWidth: 560,
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 18,
    padding: '2.25rem 2rem',
    boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
  } as React.CSSProperties,
  heading: {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: 'var(--color-text)',
    margin: '0 0 0.5rem',
  } as React.CSSProperties,
  sub: {
    color: 'var(--color-muted2)',
    marginBottom: 24,
    fontSize: '0.95rem',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: 'var(--color-muted2)',
    marginBottom: 6,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
  fieldWrap: {
    marginBottom: 14,
  } as React.CSSProperties,
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: 16,
    marginBottom: 32,
  } as React.CSSProperties,
  roleCard: {
    border: '1px solid',
    borderRadius: 14,
    padding: '1.5rem 1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
    color: 'var(--color-text)',
  } as React.CSSProperties,
  roleBadge: {
    fontSize: '0.78rem',
    fontWeight: 700,
    color: 'var(--color-cyan)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 10,
  } as React.CSSProperties,
  roleTitle: {
    fontWeight: 700,
    fontSize: '1.05rem',
    marginBottom: 4,
  } as React.CSSProperties,
  roleDesc: {
    fontSize: '0.84rem',
    color: 'var(--color-muted2)',
  } as React.CSSProperties,
  footerText: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--color-muted2)',
    margin: 0,
  } as React.CSSProperties,
  inlineLink: {
    color: 'var(--color-cyan)',
    textDecoration: 'none',
  } as React.CSSProperties,
  stepBack: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  } as React.CSSProperties,
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-muted2)',
    cursor: 'pointer',
    fontSize: '0.88rem',
    padding: 0,
  } as React.CSSProperties,
  stepTag: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--color-cyan)',
    background: 'rgba(0,200,255,0.08)',
    padding: '0.25rem 0.7rem',
    borderRadius: 8,
  } as React.CSSProperties,
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 14,
  } as React.CSSProperties,
  formGridTriple: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 14,
  } as React.CSSProperties,
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    marginTop: 16,
    padding: '0.85rem 1rem',
  } as React.CSSProperties,
  textarea: {
    resize: 'vertical',
    minHeight: 112,
    lineHeight: 1.6,
  } as React.CSSProperties,
};
