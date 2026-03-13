'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type {
  AdminCreateUserDto,
  AdminScrapeSource,
  AdminUserListDto,
  ScrapeSourceResultDto,
  ScrapingResultDto,
  UserRole,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

type RoleFilter = 'ALL' | UserRole;

const ROLE_FILTERS: RoleFilter[] = ['ALL', 'CANDIDATE', 'EMPLOYER', 'ADMIN'];
const SCRAPE_SOURCES: Array<{ key: AdminScrapeSource; label: string; hint: string }> = [
  { key: 'remotive', label: 'Remotive', hint: 'API remote generaliste' },
  { key: 'arbeitnow', label: 'Arbeitnow', hint: 'Remote jobs Europe' },
  { key: 'remoteok', label: 'RemoteOK', hint: 'Flux remote historique' },
  { key: 'weworkremotely', label: 'WeWorkRemotely', hint: 'Board remote' },
  { key: 'jobicy', label: 'Jobicy', hint: 'Feed remote tech' },
  { key: 'jooble', label: 'Jooble', hint: 'Agregateur' },
  { key: 'adzuna', label: 'Adzuna', hint: 'Search API' },
  { key: 'linkedin', label: 'LinkedIn', hint: 'Guest jobs' },
];

const EMPTY_CREATE_FORM: AdminCreateUserDto = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'CANDIDATE',
  skipEmailVerification: true,
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

export default function AdminPage() {
  const { user, isLoading, isAdmin } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [users, setUsers] = useState<AdminUserListDto[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUserListDto | null>(null);
  const [search, setSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);
  const [userActionId, setUserActionId] = useState<number | null>(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<AdminCreateUserDto>(EMPTY_CREATE_FORM);
  const [creatingUser, setCreatingUser] = useState(false);

  const [scrapeLimit, setScrapeLimit] = useState(50);
  const [scrapeRunning, setScrapeRunning] = useState(false);
  const [activeSource, setActiveSource] = useState<AdminScrapeSource | null>(null);
  const [scrapeResult, setScrapeResult] = useState<ScrapingResultDto | null>(null);
  const [sourceResult, setSourceResult] = useState<ScrapeSourceResultDto | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user || !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, router, user]);

  useEffect(() => {
    if (isLoading || !user || !isAdmin) return;
    void loadUsers(roleFilter);
  }, [isAdmin, isLoading, roleFilter, user]);

  const loadUsers = async (role: RoleFilter) => {
    setUsersLoading(true);
    try {
      const nextUsers = await adminApi.getUsers(role === 'ALL' ? undefined : role);
      setUsers(nextUsers);
      setSelectedUser((current) => {
        if (!current) return nextUsers[0] ?? null;
        return nextUsers.find((entry) => entry.id === current.id) ?? nextUsers[0] ?? null;
      });
    } catch (err: any) {
      toast(err.message ?? 'Erreur de chargement des utilisateurs', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((entry) => {
      const haystack = [
        entry.firstName,
        entry.lastName,
        entry.email,
        entry.role,
        entry.companyName ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [search, users]);

  const stats = useMemo(() => {
    const total = users.length;
    const candidates = users.filter((entry) => entry.role === 'CANDIDATE').length;
    const employers = users.filter((entry) => entry.role === 'EMPLOYER').length;
    const admins = users.filter((entry) => entry.role === 'ADMIN').length;
    const active = users.filter((entry) => entry.isActive).length;
    const verified = users.filter((entry) => entry.isEmailVerified).length;
    const unverified = total - verified;
    return {
      total,
      candidates,
      employers,
      admins,
      active,
      inactive: total - active,
      verified,
      unverified,
    };
  }, [users]);

  const newestUsers = useMemo(
    () =>
      [...users]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [users],
  );

  const openCreateForm = (role: UserRole) => {
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      role,
      skipEmailVerification: true,
    });
    setShowCreateForm(true);
  };

  const handleSelectUser = async (id: number) => {
    try {
      const detail = await adminApi.getUser(id);
      setSelectedUser(detail);
    } catch (err: any) {
      toast(err.message ?? 'Utilisateur introuvable', 'error');
    }
  };

  const handleRoleChange = async (id: number, role: UserRole) => {
    setUserActionId(id);
    try {
      const updated = await adminApi.updateRole(id, role);
      patchUser(updated);
      toast(`Role mis a jour: ${updated.email}`, 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de mise a jour du role', 'error');
    } finally {
      setUserActionId(null);
    }
  };

  const handleStatusToggle = async (entry: AdminUserListDto) => {
    setUserActionId(entry.id);
    try {
      const updated = await adminApi.updateStatus(entry.id, !entry.isActive);
      patchUser(updated);
      toast(updated.isActive ? 'Compte reactive' : 'Compte desactive', updated.isActive ? 'success' : 'error');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de mise a jour du statut', 'error');
    } finally {
      setUserActionId(null);
    }
  };

  const handleDeleteUser = async (entry: AdminUserListDto, force: boolean) => {
    const label = force ? 'suppression definitive' : 'desactivation';
    if (!confirm(`Confirmer ${label} pour ${entry.email} ?`)) return;

    setUserActionId(entry.id);
    try {
      await adminApi.deleteUser(entry.id, force);
      setUsers((current) => current.filter((item) => item.id !== entry.id));
      setSelectedUser((current) => (current?.id === entry.id ? null : current));
      toast(force ? 'Utilisateur supprime' : 'Utilisateur desactive', 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de suppression', 'error');
    } finally {
      setUserActionId(null);
    }
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingUser(true);

    try {
      const payload: AdminCreateUserDto = {
        ...createForm,
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        phone: createForm.phone?.trim() || undefined,
        city: createForm.city?.trim() || undefined,
        country: createForm.country?.trim() || undefined,
        companyName: createForm.role === 'EMPLOYER' ? createForm.companyName?.trim() || undefined : undefined,
        companyDescription:
          createForm.role === 'EMPLOYER' ? createForm.companyDescription?.trim() || undefined : undefined,
        website: createForm.role === 'EMPLOYER' ? createForm.website?.trim() || undefined : undefined,
        industry: createForm.role === 'EMPLOYER' ? createForm.industry?.trim() || undefined : undefined,
        companySize: createForm.role === 'EMPLOYER' ? createForm.companySize?.trim() || undefined : undefined,
        companyLocation:
          createForm.role === 'EMPLOYER' ? createForm.companyLocation?.trim() || undefined : undefined,
      };

      const created = await adminApi.createUser(payload);
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateForm(false);
      setUsers((current) => [created, ...current]);
      setSelectedUser(created);
      toast(`Compte cree: ${created.email}`, 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de creation utilisateur', 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleScrapeAll = async () => {
    setScrapeRunning(true);
    setActiveSource(null);
    setSourceResult(null);

    try {
      const result = await adminApi.scrapeAll();
      setScrapeResult(result);
      toast(`${result.totalImported} offres importees`, 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de scraping global', 'error');
    } finally {
      setScrapeRunning(false);
    }
  };

  const handleScrapeSource = async (source: AdminScrapeSource) => {
    setScrapeRunning(true);
    setActiveSource(source);
    setSourceResult(null);

    try {
      const result = await adminApi.scrapeSource(source, scrapeLimit);
      setSourceResult(result);
      toast(`${result.imported} offres depuis ${result.source}`, 'success');
    } catch (err: any) {
      toast(err.message ?? 'Erreur de scraping source', 'error');
    } finally {
      setScrapeRunning(false);
      setActiveSource(null);
    }
  };

  const patchUser = (updated: AdminUserListDto) => {
    setUsers((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
    setSelectedUser((current) => (current?.id === updated.id ? updated : current));
  };

  if (isLoading || !user || !isAdmin) return null;

  return (
    <main style={pageStyle}>
      <section style={heroStyle}>
        <div>
          <div style={heroEyebrow}>Super Admin Console</div>
          <h1 style={heroTitle}>Pilotage produit, comptes et ingestion</h1>
          <p style={heroText}>
            Vue d&apos;ensemble du produit, creation de comptes privilegies, moderation des utilisateurs et orchestration du scraping.
          </p>
        </div>
        <div style={heroActions}>
          <button className="btn-primary" onClick={() => openCreateForm('ADMIN')}>
            Creer un admin
          </button>
          <button className="btn-secondary" onClick={() => openCreateForm('EMPLOYER')}>
            Creer un employeur
          </button>
          <button className="btn-ghost" onClick={() => void handleScrapeAll()} disabled={scrapeRunning}>
            {scrapeRunning && !activeSource ? 'Refresh en cours...' : 'Refresh all'}
          </button>
        </div>
      </section>

      <section style={statsGridStyle}>
        <MetricWidget label="Comptes totaux" value={stats.total} tone="#00c8ff" detail={`${stats.active} actifs / ${stats.inactive} inactifs`} />
        <MetricWidget label="Candidats" value={stats.candidates} tone="#34d399" detail="Base candidats" />
        <MetricWidget label="Employeurs" value={stats.employers} tone="#f59e0b" detail="Comptes entreprise" />
        <MetricWidget label="Admins" value={stats.admins} tone="#8b5cf6" detail="Privileges eleves" />
        <MetricWidget label="Emails verifies" value={stats.verified} tone="#10b981" detail={`${stats.unverified} en attente`} />
        <MetricWidget
          label="Dernier refresh"
          value={scrapeResult ? formatDate(scrapeResult.completedAt) : 'Aucun'}
          tone="#38bdf8"
          detail={scrapeResult ? `${scrapeResult.totalImported} offres importees` : 'Scraping manuel disponible'}
        />
      </section>

      <section style={topGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitle}>Widgets produit</h2>
              <p style={sectionHint}>Actions rapides pour administrer la plateforme sans naviguer entre plusieurs ecrans.</p>
            </div>
          </div>

          <div style={widgetGridStyle}>
            <ActionWidget
              title="Creation de comptes"
              description="Creer rapidement un candidat, un employeur ou un admin pre-verifie."
              actions={[
                { label: 'Nouveau candidat', onClick: () => openCreateForm('CANDIDATE') },
                { label: 'Nouvel employeur', onClick: () => openCreateForm('EMPLOYER') },
                { label: 'Nouvel admin', onClick: () => openCreateForm('ADMIN') },
              ]}
            />

            <ActionWidget
              title="Qualite des comptes"
              description="Surveiller les comptes non verifies ou desactives."
              actions={[
                { label: `${stats.unverified} non verifies`, onClick: () => setSearch('') },
                { label: `${stats.inactive} inactifs`, onClick: () => setSearch('') },
              ]}
              footer="Utilise la table de moderation ci-dessous pour corriger les comptes."
            />

            <ActionWidget
              title="Ingestion des offres"
              description="Declencher un refresh global ou cibler une source precise."
              actions={[
                {
                  label: scrapeRunning && !activeSource ? 'Refresh global en cours...' : 'Refresh all',
                  onClick: () => void handleScrapeAll(),
                  disabled: scrapeRunning,
                },
                {
                  label: activeSource ? `Source active: ${activeSource}` : 'Voir les sources',
                  onClick: () => window.scrollTo({ top: 1100, behavior: 'smooth' }),
                },
              ]}
              footer={scrapeResult ? `Dernier refresh: ${scrapeResult.totalImported} offres` : 'Aucun refresh recent'}
            />
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitle}>Activite recente</h2>
              <p style={sectionHint}>Comptes recents et etat du dernier scraping.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <div style={subPanelStyle}>
              <div style={widgetLabelStyle}>Nouveaux comptes</div>
              {newestUsers.length === 0 ? (
                <div style={mutedBoxStyle}>Aucun utilisateur charge.</div>
              ) : (
                newestUsers.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => void handleSelectUser(entry.id)}
                    style={listButtonStyle}
                  >
                    <div>
                      <div style={listPrimaryStyle}>{entry.firstName} {entry.lastName}</div>
                      <div style={listSecondaryStyle}>{entry.email}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <RolePill role={entry.role} />
                      <div style={listSecondaryStyle}>{formatDate(entry.createdAt)}</div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div style={subPanelStyle}>
              <div style={widgetLabelStyle}>Etat scraping</div>
              {scrapeResult ? (
                <>
                  <DetailRow label="Total importe" value={String(scrapeResult.totalImported)} />
                  <DetailRow label="Termine le" value={formatDate(scrapeResult.completedAt)} />
                  <DetailRow label="Erreurs" value={String(scrapeResult.errors?.length ?? 0)} />
                </>
              ) : sourceResult ? (
                <>
                  <DetailRow label="Derniere source" value={sourceResult.source} />
                  <DetailRow label="Importees" value={String(sourceResult.imported)} />
                </>
              ) : (
                <div style={mutedBoxStyle}>Aucun scraping execute dans cette session.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={mainGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <div>
              <h2 style={sectionTitle}>Gestion utilisateurs</h2>
              <p style={sectionHint}>Filtrage, recherche, changement de role, activation et suppression.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowCreateForm((current) => !current)}>
              {showCreateForm ? 'Fermer le createur' : 'Ouvrir le createur'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateUser} style={{ ...subPanelStyle, marginBottom: '1rem' }}>
              <div style={formSectionTitleStyle}>Nouveau compte</div>
              <div style={formGrid}>
                <Field label="Prenom *">
                  <input className="input" value={createForm.firstName} onChange={(e) => setCreateForm((c) => ({ ...c, firstName: e.target.value }))} />
                </Field>
                <Field label="Nom *">
                  <input className="input" value={createForm.lastName} onChange={(e) => setCreateForm((c) => ({ ...c, lastName: e.target.value }))} />
                </Field>
                <Field label="Email *">
                  <input className="input" type="email" value={createForm.email} onChange={(e) => setCreateForm((c) => ({ ...c, email: e.target.value }))} />
                </Field>
                <Field label="Mot de passe *">
                  <input className="input" type="password" value={createForm.password} onChange={(e) => setCreateForm((c) => ({ ...c, password: e.target.value }))} />
                </Field>
                <Field label="Role *">
                  <select className="input" value={createForm.role} onChange={(e) => setCreateForm((c) => ({ ...c, role: e.target.value as UserRole }))}>
                    <option value="CANDIDATE">CANDIDATE</option>
                    <option value="EMPLOYER">EMPLOYER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </Field>
                <Field label="Verification email">
                  <label style={checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={createForm.skipEmailVerification ?? true}
                      onChange={(e) => setCreateForm((c) => ({ ...c, skipEmailVerification: e.target.checked }))}
                    />
                    Compte pre-verifie
                  </label>
                </Field>
                <Field label="Telephone">
                  <input className="input" value={createForm.phone ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, phone: e.target.value }))} />
                </Field>
                <Field label="Ville">
                  <input className="input" value={createForm.city ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, city: e.target.value }))} />
                </Field>
                <Field label="Pays">
                  <input className="input" value={createForm.country ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, country: e.target.value }))} />
                </Field>
              </div>

              {createForm.role === 'EMPLOYER' && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={formSectionTitleStyle}>Configuration employeur</div>
                  <div style={formGrid}>
                    <Field label="Entreprise *">
                      <input className="input" value={createForm.companyName ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, companyName: e.target.value }))} />
                    </Field>
                    <Field label="Website">
                      <input className="input" value={createForm.website ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, website: e.target.value }))} />
                    </Field>
                    <Field label="Secteur">
                      <input className="input" value={createForm.industry ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, industry: e.target.value }))} />
                    </Field>
                    <Field label="Taille">
                      <input className="input" value={createForm.companySize ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, companySize: e.target.value }))} />
                    </Field>
                    <Field label="Localisation entreprise">
                      <input className="input" value={createForm.companyLocation ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, companyLocation: e.target.value }))} />
                    </Field>
                    <Field label="Description entreprise">
                      <textarea className="input" rows={4} value={createForm.companyDescription ?? ''} onChange={(e) => setCreateForm((c) => ({ ...c, companyDescription: e.target.value }))} />
                    </Field>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button className="btn-primary" disabled={creatingUser}>
                  {creatingUser ? 'Creation...' : 'Creer le compte'}
                </button>
              </div>
            </form>
          )}

          <div style={toolbarStyle}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ROLE_FILTERS.map((entry) => (
                <button
                  key={entry}
                  className={roleFilter === entry ? 'btn-primary' : 'btn-ghost'}
                  onClick={() => setRoleFilter(entry)}
                >
                  {entry}
                </button>
              ))}
            </div>
            <input
              className="input"
              style={{ width: 320, maxWidth: '100%' }}
              placeholder="Rechercher nom, email, entreprise..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {usersLoading ? (
            <div style={emptyStateStyle}>Chargement des utilisateurs...</div>
          ) : filteredUsers.length === 0 ? (
            <div style={emptyStateStyle}>Aucun utilisateur pour ce filtre.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Utilisateur', 'Role', 'Statut', 'Email', 'Creation', 'Actions'].map((label) => (
                      <th key={label} style={tableHeaderStyle}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((entry) => (
                    <tr key={entry.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={tableCellStyle}>
                        <button style={userButtonStyle} onClick={() => void handleSelectUser(entry.id)}>
                          <strong>{entry.firstName} {entry.lastName}</strong>
                          <span style={listSecondaryInlineStyle}>{entry.email}</span>
                          {entry.companyName ? <span style={listCompanyStyle}>{entry.companyName}</span> : null}
                        </button>
                      </td>
                      <td style={tableCellStyle}>
                        <select
                          className="input"
                          value={entry.role}
                          disabled={userActionId === entry.id}
                          onChange={(e) => void handleRoleChange(entry.id, e.target.value as UserRole)}
                          style={{ minWidth: 140 }}
                        >
                          <option value="CANDIDATE">CANDIDATE</option>
                          <option value="EMPLOYER">EMPLOYER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'grid', gap: 8 }}>
                          <StatusBadge active={entry.isActive}>{entry.isActive ? 'Actif' : 'Inactif'}</StatusBadge>
                          <StatusBadge active={entry.isEmailVerified}>
                            {entry.isEmailVerified ? 'Verifie' : 'A verifier'}
                          </StatusBadge>
                        </div>
                      </td>
                      <td style={tableCellStyle}>{entry.email}</td>
                      <td style={tableCellStyle}>{formatDate(entry.createdAt)}</td>
                      <td style={tableCellStyle}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn-ghost" disabled={userActionId === entry.id} onClick={() => void handleStatusToggle(entry)}>
                            {entry.isActive ? 'Desactiver' : 'Activer'}
                          </button>
                          <button className="btn-ghost" disabled={userActionId === entry.id} onClick={() => void handleDeleteUser(entry, false)}>
                            Soft delete
                          </button>
                          <button className="btn-danger" disabled={userActionId === entry.id} onClick={() => void handleDeleteUser(entry, true)}>
                            Hard delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={sectionTitle}>Fiche utilisateur</h2>
                <p style={sectionHint}>Detail d&apos;un compte charge depuis l&apos;API admin.</p>
              </div>
            </div>

            {selectedUser ? (
              <div style={subPanelStyle}>
                <DetailRow label="Nom" value={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                <DetailRow label="Email" value={selectedUser.email} />
                <DetailRow label="Role" value={selectedUser.role} />
                <DetailRow label="Entreprise" value={selectedUser.companyName || 'Aucune'} />
                <DetailRow label="Actif" value={selectedUser.isActive ? 'Oui' : 'Non'} />
                <DetailRow label="Email verifie" value={selectedUser.isEmailVerified ? 'Oui' : 'Non'} />
                <DetailRow label="Creation" value={formatDate(selectedUser.createdAt)} />
              </div>
            ) : (
              <div style={emptyStateStyle}>Selectionnez un utilisateur dans la table.</div>
            )}
          </section>

          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <h2 style={sectionTitle}>Centre de scraping</h2>
                <p style={sectionHint}>Controle global et par source pour alimenter le produit en annonces.</p>
              </div>
            </div>

            <div style={subPanelStyle}>
              <Field label="Limite par source">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={200}
                  value={scrapeLimit}
                  onChange={(e) => setScrapeLimit(Number(e.target.value))}
                />
              </Field>
              <button className="btn-primary" onClick={() => void handleScrapeAll()} disabled={scrapeRunning} style={{ width: '100%', marginTop: 12 }}>
                {scrapeRunning && !activeSource ? 'Scraping global en cours...' : 'Refresh all'}
              </button>
            </div>

            <div style={sourceGridStyle}>
              {SCRAPE_SOURCES.map((source) => (
                <div key={source.key} style={sourceCardStyle}>
                  <div style={{ fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>{source.label}</div>
                  <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: 12 }}>{source.hint}</div>
                  <button
                    className="btn-secondary"
                    onClick={() => void handleScrapeSource(source.key)}
                    disabled={scrapeRunning}
                    style={{ width: '100%' }}
                  >
                    {activeSource === source.key ? 'En cours...' : 'Scraper'}
                  </button>
                </div>
              ))}
            </div>

            {scrapeResult && (
              <div style={{ ...subPanelStyle, marginTop: '1rem' }}>
                <div style={widgetLabelStyle}>Dernier refresh global</div>
                <DetailRow label="Total importe" value={String(scrapeResult.totalImported)} />
                <DetailRow label="Termine le" value={formatDate(scrapeResult.completedAt)} />
                <div style={{ marginTop: 10 }}>
                  {Object.entries(scrapeResult.importedBySource ?? {}).map(([key, value]) => (
                    <div key={key} style={sourceRowStyle}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{key}</span>
                      <strong style={{ color: 'var(--color-text)' }}>{value}</strong>
                    </div>
                  ))}
                </div>
                {scrapeResult.errors?.length ? (
                  <div style={scrapeErrorBoxStyle}>
                    {scrapeResult.errors.map((entry, index) => (
                      <div key={`${entry}-${index}`}>{entry}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {sourceResult && (
              <div style={{ ...subPanelStyle, marginTop: '1rem' }}>
                <div style={widgetLabelStyle}>Derniere source scrapee</div>
                <DetailRow label="Source" value={sourceResult.source} />
                <DetailRow label="Importees" value={String(sourceResult.imported)} />
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricWidget({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string | number;
  tone: string;
  detail: string;
}) {
  return (
    <div style={metricWidgetStyle}>
      <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-muted)', marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: tone, marginBottom: 6 }}>{value}</div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>{detail}</div>
    </div>
  );
}

function ActionWidget({
  title,
  description,
  actions,
  footer,
}: {
  title: string;
  description: string;
  actions: Array<{ label: string; onClick: () => void; disabled?: boolean }>;
  footer?: string;
}) {
  return (
    <div style={widgetCardStyle}>
      <div style={widgetLabelStyle}>{title}</div>
      <div style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem', lineHeight: 1.6, marginBottom: 14 }}>
        {description}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            className="btn-ghost"
            onClick={action.onClick}
            disabled={action.disabled}
            style={{ width: '100%' }}
          >
            {action.label}
          </button>
        ))}
      </div>
      {footer ? <div style={{ marginTop: 12, color: 'var(--color-cyan)', fontSize: '0.8rem' }}>{footer}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      <strong style={{ color: 'var(--color-text)', textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

function StatusBadge({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.35rem 0.65rem',
        borderRadius: 999,
        background: active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        color: active ? '#34d399' : '#f87171',
        border: `1px solid ${active ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
        fontSize: '0.78rem',
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const tone =
    role === 'ADMIN' ? '#8b5cf6' : role === 'EMPLOYER' ? '#f59e0b' : '#10b981';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.28rem 0.58rem',
        borderRadius: 999,
        border: `1px solid ${tone}33`,
        background: `${tone}1a`,
        color: tone,
        fontSize: '0.75rem',
        fontWeight: 800,
        marginBottom: 6,
      }}
    >
      {role}
    </span>
  );
}

const pageStyle: React.CSSProperties = {
  maxWidth: 1480,
  margin: '0 auto',
  padding: '2.5rem 1.5rem 4rem',
};

const heroStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(280px, 0.8fr)',
  gap: 20,
  alignItems: 'center',
  marginBottom: '1.5rem',
  padding: '1.5rem',
  background: 'linear-gradient(135deg, rgba(0,200,255,0.08), rgba(139,92,246,0.08))',
  border: '1px solid rgba(0,200,255,0.15)',
  borderRadius: 20,
};

const heroEyebrow: React.CSSProperties = {
  marginBottom: 8,
  color: 'var(--color-cyan)',
  fontSize: '0.78rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const heroTitle: React.CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '2.2rem',
  fontWeight: 900,
  color: 'var(--color-text)',
};

const heroText: React.CSSProperties = {
  margin: 0,
  color: 'var(--color-text-muted)',
  lineHeight: 1.7,
  maxWidth: 760,
};

const heroActions: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  alignItems: 'stretch',
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
  marginBottom: '1.5rem',
};

const topGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.9fr)',
  gap: 20,
  marginBottom: '1.5rem',
};

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 1fr)',
  gap: 20,
};

const panelStyle: React.CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 18,
  padding: '1.25rem',
};

const metricWidgetStyle: React.CSSProperties = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: 16,
  padding: '1.15rem',
};

const widgetCardStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: '1rem',
};

const subPanelStyle: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 14,
  padding: '1rem',
};

const panelHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const sectionTitle: React.CSSProperties = {
  margin: '0 0 0.3rem',
  fontSize: '1.08rem',
  fontWeight: 800,
  color: 'var(--color-text)',
};

const sectionHint: React.CSSProperties = {
  margin: 0,
  color: 'var(--color-text-muted)',
  fontSize: '0.84rem',
};

const widgetGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const widgetLabelStyle: React.CSSProperties = {
  fontWeight: 800,
  color: 'var(--color-text)',
  marginBottom: 8,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const emptyStateStyle: React.CSSProperties = {
  ...subPanelStyle,
  textAlign: 'center',
  color: 'var(--color-text-muted)',
};

const mutedBoxStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.84rem',
};

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.85rem 0.75rem',
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableCellStyle: React.CSSProperties = {
  padding: '0.85rem 0.75rem',
  verticalAlign: 'top',
  color: 'var(--color-text)',
};

const userButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'transparent',
  border: 'none',
  padding: 0,
  textAlign: 'left',
  color: 'inherit',
  cursor: 'pointer',
};

const listButtonStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  width: '100%',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 12,
  padding: '0.85rem 0.9rem',
  textAlign: 'left',
  cursor: 'pointer',
};

const listPrimaryStyle: React.CSSProperties = {
  color: 'var(--color-text)',
  fontWeight: 800,
  marginBottom: 4,
};

const listSecondaryStyle: React.CSSProperties = {
  color: 'var(--color-text-muted)',
  fontSize: '0.8rem',
};

const listSecondaryInlineStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--color-text-muted)',
  marginTop: 4,
};

const listCompanyStyle: React.CSSProperties = {
  display: 'block',
  color: 'var(--color-cyan)',
  marginTop: 4,
};

const formGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const formSectionTitleStyle: React.CSSProperties = {
  marginBottom: '0.8rem',
  color: 'var(--color-text)',
  fontWeight: 800,
};

const checkboxLabel: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: 'var(--color-text)',
  minHeight: 42,
};

const sourceGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
  marginTop: '1rem',
};

const sourceCardStyle: React.CSSProperties = {
  ...subPanelStyle,
  padding: '0.9rem',
};

const sourceRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '0.25rem 0',
};

const scrapeErrorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  color: '#fca5a5',
  fontSize: '0.82rem',
};
