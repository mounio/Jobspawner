'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { UserRole } from '@/lib/types';

type Step = 'role' | 'identity' | 'company' | 'done';

interface FormState {
  role:               UserRole;
  firstName:          string;
  lastName:           string;
  email:              string;
  password:           string;
  confirm:            string;
  phone:              string;
  city:               string;
  country:            string;
  // Employer
  companyName:        string;
  companyDescription: string;
  website:            string;
  industry:           string;
  companySize:        string;
  companyLocation:    string;
}

const INDUSTRIES = ['Technologie', 'Finance', 'Santé', 'E-commerce', 'Éducation', 'Média', 'Conseil', 'Industrie', 'Autre'];
const SIZES      = ['1-10', '11-50', '51-200', '201-500', '500+'];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const  toast = useToast();
  const [step,    setStep]    = useState<Step>('role');
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState<FormState>({
    role: 'CANDIDATE', firstName: '', lastName: '', email: '', password: '', confirm: '',
    phone: '', city: '', country: '',
    companyName: '', companyDescription: '', website: '', industry: '', companySize: '', companyLocation: '',
  });

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (form.password !== form.confirm) { toast('Les mots de passe ne correspondent pas.', 'error'); return; }
    if (form.password.length < 8)       { toast('Mot de passe trop court (min 8 caractères).', 'error'); return; }
    if (form.role === 'EMPLOYER' && !form.companyName) { toast('Le nom de l\'entreprise est requis.', 'error'); return; }

    setLoading(true);
    try {
      const res = await authApi.register({
        firstName:          form.firstName,
        lastName:           form.lastName,
        email:              form.email,
        password:           form.password,
        role:               form.role,
        phone:              form.phone  || undefined,
        city:               form.city   || undefined,
        country:            form.country|| undefined,
        companyName:        form.companyName        || undefined,
        companyDescription: form.companyDescription || undefined,
        website:            form.website            || undefined,
        industry:           form.industry           || undefined,
        companySize:        form.companySize         || undefined,
        companyLocation:    form.companyLocation     || undefined,
      });
      login(res.token, res.user);
      toast(`Bienvenue, ${res.user.firstName} ! 🎉`);
      router.push(res.user.role === 'EMPLOYER' ? '/employer' : '/dashboard');
    } catch (err: any) {
      toast(err.message ?? 'Erreur lors de l\'inscription', 'error');
    } finally { setLoading(false); }
  };

  // ── Step 1: Choose role ───────────────────────────────────────────────────
  const RoleStep = () => (
    <div>
      <h1 style={styles.heading}>Créer un compte</h1>
      <p style={styles.sub}>Vous êtes…</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {([
          { role: 'CANDIDATE' as UserRole, emoji: '🔍', title: 'Candidat', desc: 'Je cherche un emploi tech' },
          { role: 'EMPLOYER'  as UserRole, emoji: '🏢', title: 'Employeur', desc: 'Je recrute des talents' },
        ] as const).map(opt => (
          <button key={opt.role} onClick={() => { setForm(f => ({ ...f, role: opt.role })); setStep('identity'); }}
            style={{
              ...styles.roleCard,
              borderColor: form.role === opt.role ? 'var(--color-cyan)' : 'var(--color-border)',
              background:  form.role === opt.role ? 'rgba(0,200,255,0.06)' : 'var(--color-surface)',
            }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>{opt.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text)', marginBottom: 4 }}>{opt.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{opt.desc}</div>
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
        Déjà un compte ? <Link href="/login" style={{ color: 'var(--color-cyan)', textDecoration: 'none' }}>Se connecter</Link>
      </p>
    </div>
  );

  // ── Step 2: Identity ──────────────────────────────────────────────────────
  const IdentityStep = () => (
    <div>
      <div style={styles.stepBack}>
        <button onClick={() => setStep('role')} style={styles.backBtn}>← Retour</button>
        <span style={styles.stepTag}>{form.role === 'EMPLOYER' ? '🏢 Employeur' : '🔍 Candidat'} — Étape 1/2</span>
      </div>
      <h2 style={styles.heading}>Vos informations</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {field('Prénom *',    form.firstName, set('firstName'), 'Jean')}
        {field('Nom *',       form.lastName,  set('lastName'),  'Dupont')}
      </div>
      {field('Email *', form.email, set('email'), 'jean@exemple.com', 'email')}
      <div style={{ marginBottom: 14 }} />
      {field('Mot de passe * (min 8 caractères)', form.password, set('password'), '••••••••', 'password')}
      <div style={{ marginBottom: 14 }} />
      {field('Confirmer le mot de passe *', form.confirm, set('confirm'), '••••••••', 'password')}
      <div style={{ marginBottom: 14 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {field('Téléphone', form.phone,   set('phone'),   '+32 xxx xx xx xx', 'tel')}
        {field('Ville',     form.city,    set('city'),    'Bruxelles')}
        {field('Pays',      form.country, set('country'), 'Belgique')}
      </div>

      <button className="btn-primary" style={{ width: '100%', marginTop: 24, padding: '0.85rem' }}
        onClick={() => {
          if (!form.firstName || !form.lastName || !form.email || !form.password)
            return toast('Veuillez remplir tous les champs obligatoires.', 'error');
          form.role === 'EMPLOYER' ? setStep('company') : handleSubmit();
        }}
        disabled={loading}>
        {form.role === 'EMPLOYER' ? 'Suivant →' : (loading ? '⏳ Création…' : 'Créer mon compte 🚀')}
      </button>
    </div>
  );

  // ── Step 3: Company (employer only) ──────────────────────────────────────
  const CompanyStep = () => (
    <div>
      <div style={styles.stepBack}>
        <button onClick={() => setStep('identity')} style={styles.backBtn}>← Retour</button>
        <span style={styles.stepTag}>🏢 Employeur — Étape 2/2</span>
      </div>
      <h2 style={styles.heading}>Votre entreprise</h2>

      {field('Nom de l\'entreprise *', form.companyName, set('companyName'), 'Acme Corp')}
      <div style={{ marginBottom: 14 }} />

      <div style={{ marginBottom: 14 }}>
        <label style={styles.label}>Description de l&apos;entreprise</label>
        <textarea className="input" rows={3}
          placeholder="Ce que fait votre entreprise, vos valeurs…"
          value={form.companyDescription}
          onChange={set('companyDescription')}
          style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {field('Site web', form.website, set('website'), 'https://acme.com', 'url')}
        {field('Localisation', form.companyLocation, set('companyLocation'), 'Bruxelles / Remote')}
      </div>
      <div style={{ marginBottom: 14 }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label style={styles.label}>Secteur</label>
          <select className="input" value={form.industry} onChange={set('industry')}>
            <option value="">Sélectionner…</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={styles.label}>Taille de l&apos;équipe</label>
          <select className="input" value={form.companySize} onChange={set('companySize')}>
            <option value="">Sélectionner…</option>
            {SIZES.map(s => <option key={s} value={s}>{s} personnes</option>)}
          </select>
        </div>
      </div>

      <button className="btn-primary" style={{ width: '100%', marginTop: 24, padding: '0.85rem' }}
        onClick={handleSubmit} disabled={loading}>
        {loading ? '⏳ Création…' : 'Créer mon compte employeur 🚀'}
      </button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 18, padding: '2.5rem 2rem' }}>
        {step === 'role'     && <RoleStep />}
        {step === 'identity' && <IdentityStep />}
        {step === 'company'  && <CompanyStep />}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function field(label: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder = '', type = 'text') {
  return (
    <div style={{ marginBottom: 2 }}>
      <label style={styles.label}>{label}</label>
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete={type === 'password' ? 'new-password' : undefined} />
    </div>
  );
}

const styles = {
  heading:  { fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text)', margin: '0 0 8px' } as React.CSSProperties,
  sub:      { color: 'var(--color-text-muted)', marginBottom: 24, fontSize: '0.9rem' } as React.CSSProperties,
  label:    { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' } as React.CSSProperties,
  roleCard: { border: '1px solid', borderRadius: 12, padding: '1.5rem 1rem', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' as const, background: 'none' },
  stepBack: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as React.CSSProperties,
  backBtn:  { background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem', padding: 0 } as React.CSSProperties,
  stepTag:  { fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-cyan)', background: 'rgba(0,200,255,0.08)', padding: '0.25rem 0.7rem', borderRadius: 8 } as React.CSSProperties,
};





















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































