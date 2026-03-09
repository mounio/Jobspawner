'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { jobsApi } from '@/lib/api';
import type { JobCreateDto } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

function PostJobForm() {
  const router = useRouter();
  const sp     = useSearchParams();
  const editId = sp.get('edit') ? Number(sp.get('edit')) : null;
  const { user, isLoading, isEmployer, isAdmin } = useAuth();
  const  toast  = useToast();

  const [saving, setSaving] = useState(false);
  const [techs,  setTechs]  = useState<string[]>([]);
  const [techIn, setTechIn] = useState('');
  const [form, setForm] = useState<JobCreateDto>({
    title: '', description: '', location: '', techStack: '', applyUrl: '',
    jobType: 'Full-time', isRemote: false, currency: 'EUR',
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user || (!isEmployer && !isAdmin)) { router.replace('/employer'); return; }

    if (editId) {
      jobsApi.get(editId).then(j => {
        setForm({ title: j.title, description: j.description, location: j.location, techStack: j.techStack, applyUrl: j.applyUrl, jobType: j.jobType ?? 'Full-time', isRemote: j.isRemote, minSalary: j.minSalary ?? undefined, maxSalary: j.maxSalary ?? undefined, currency: j.currency ?? 'EUR' });
        setTechs(j.techStack ? j.techStack.split(',').map(t => t.trim()).filter(Boolean) : []);
      }).catch(() => toast('Offre introuvable.', 'error'));
    }
  }, [editId, isLoading, user]);

  const set = (k: keyof JobCreateDto, v: string | boolean | number | undefined) =>
    setForm(f => ({ ...f, [k]: v }));

  const addTech = (t: string) => {
    const clean = t.trim();
    if (!clean || techs.includes(clean)) return;
    setTechs(p => [...p, clean]);
    setTechIn('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.location || !form.applyUrl)
      return toast('Veuillez remplir les champs obligatoires.', 'error');

    const payload: JobCreateDto = { ...form, techStack: techs.join(', ') };
    setSaving(true);
    try {
      if (editId) {
        await jobsApi.update(editId, payload);
        toast('Offre mise à jour ✓');
      } else {
        await jobsApi.create(payload);
        toast('Offre publiée avec succès ! 🎉');
      }
      router.push('/employer');
    } catch (e: any) { toast(e.message ?? 'Erreur', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 900, margin: '0 0 4px', color: 'var(--color-text)' }}>
        {editId ? '✏️ Modifier l\'offre' : '+ Publier une offre'}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
        Votre offre sera visible par tous les candidats.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Basic info */}
        <div style={card}>
          <h3 style={cardTitle}>INFORMATIONS GÉNÉRALES</h3>
          {inp('Intitulé du poste *', form.title, v => set('title', v), 'Ex: Senior React Developer')}
          <div style={{ marginTop: 14 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>TYPE DE CONTRAT</label>
              <select className="input" value={form.jobType ?? ''} onChange={e => set('jobType', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            {inp('Localisation *', form.location ?? '', v => set('location', v), 'Bruxelles, Remote, Paris…')}
          </div>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-text)' }}>
              <input type="checkbox" checked={form.isRemote} onChange={e => set('isRemote', e.target.checked)} />
              🌐 Poste remote / télétravail possible
            </label>
          </div>
        </div>

        {/* Salary */}
        <div style={card}>
          <h3 style={cardTitle}>SALAIRE (optionnel)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: 14 }}>
            <div>
              <label style={lbl}>MIN</label>
              <input className="input" type="number" placeholder="Ex: 40000" value={form.minSalary ?? ''} onChange={e => set('minSalary', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={lbl}>MAX</label>
              <input className="input" type="number" placeholder="Ex: 60000" value={form.maxSalary ?? ''} onChange={e => set('maxSalary', e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <label style={lbl}>DEVISE</label>
              <select className="input" value={form.currency ?? 'EUR'} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tech stack */}
        <div style={card}>
          <h3 style={cardTitle}>STACK TECHNIQUE</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 32 }}>
            {techs.map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '0.25rem 0.65rem', borderRadius: 8, background: 'rgba(139,92,246,0.12)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'monospace' }}>
                {t}
                <button type="button" onClick={() => setTechs(p => p.filter(x => x !== t))} style={{ background: 'none', border: 'none', color: '#a78bfa', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" value={techIn} onChange={e => setTechIn(e.target.value)}
              placeholder="React, TypeScript, Node.js…"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTech(techIn); } }}
              style={{ flex: 1 }} />
            <button type="button" className="btn-ghost" onClick={() => addTech(techIn)}>+</button>
          </div>
        </div>

        {/* Description */}
        <div style={card}>
          <h3 style={cardTitle}>DESCRIPTION DU POSTE *</h3>
          <textarea className="input" rows={10} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Décrivez le poste, les missions, le profil recherché, les avantages…"
            style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.7 }} />
        </div>

        {/* Apply URL */}
        <div style={card}>
          <h3 style={cardTitle}>LIEN DE CANDIDATURE *</h3>
          {inp('URL de candidature', form.applyUrl ?? '', v => set('applyUrl', v), 'https://votre-site.com/careers/…', 'url')}
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn-ghost" onClick={() => router.push('/employer')}>Annuler</button>
          <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.75rem 2.5rem' }}>
            {saving ? '⏳ Publication…' : editId ? '✓ Mettre à jour' : '🚀 Publier l\'offre'}
          </button>
        </div>
      </form>
    </div>
  );
}

function inp(label: string, value: string, onChange: (v: string) => void, placeholder = '', type = 'text') {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <input className="input" type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

const card: React.CSSProperties = { background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 14, padding: '1.5rem' };
const cardTitle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.06em', margin: '0 0 1rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6, letterSpacing: '0.04em' };

export default function PostJobPage() {
  return (
    <Suspense>
      <PostJobForm />
    </Suspense>
  );
}





















































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































