'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { employersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { EmployerApplicationDto } from '@/lib/types';
import { timeAgo } from '@/lib/utils';

type NotificationBaseline = {
  appliedAt: string;
  id: number;
};

const NOTIFICATION_POLL_MS = 30000;
const MAX_NOTIFICATIONS = 6;

function getNotificationStorageKey(userId: number) {
  return `employer_notifications_last_seen_${userId}`;
}

function parseBaseline(value: string | null): NotificationBaseline | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as NotificationBaseline;
    if (!parsed?.appliedAt || typeof parsed.id !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function sortApplications(items: EmployerApplicationDto[]) {
  return [...items].sort((a, b) => {
    const timeDiff = new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    if (timeDiff !== 0) return timeDiff;
    return b.id - a.id;
  });
}

function getLatestBaseline(items: EmployerApplicationDto[]): NotificationBaseline | null {
  if (items.length === 0) return null;

  const [latest] = sortApplications(items);
  return { appliedAt: latest.appliedAt, id: latest.id };
}

function isUnread(
  application: EmployerApplicationDto,
  baseline: NotificationBaseline | null,
) {
  if (!baseline) return false;

  const applicationTime = new Date(application.appliedAt).getTime();
  const baselineTime = new Date(baseline.appliedAt).getTime();

  if (applicationTime > baselineTime) return true;
  if (applicationTime < baselineTime) return false;

  return application.id > baseline.id;
}

function countUnread(
  items: EmployerApplicationDto[],
  baseline: NotificationBaseline | null,
) {
  return items.filter((item) => isUnread(item, baseline)).length;
}

export default function Navbar() {
  const { user, isCandidate, isEmployer, isAdmin, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentApplications, setRecentApplications] = useState<EmployerApplicationDto[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notificationBaseline, setNotificationBaseline] = useState<NotificationBaseline | null>(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState<number | null>(null);
  const profileHref = isEmployer && !isAdmin ? '/employer/profile' : '/profile';
  const canSeeNotifications = Boolean(user) && (isEmployer || isAdmin);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string) => `nav-link${isActive(href) ? ' nav-link-active' : ''}`;

  const navigationLinks = [
    { href: '/jobs', label: 'Offres', show: true },
    { href: '/dashboard', label: 'Dashboard', show: isCandidate || isAdmin },
    { href: '/applications', label: 'Candidatures', show: isCandidate || isAdmin },
    { href: '/preferences', label: 'Preferences', show: isCandidate || isAdmin },
    { href: '/employer', label: 'Mon espace', show: isEmployer || isAdmin },
    { href: '/employer/post-job', label: 'Publier', show: isEmployer || isAdmin },
    { href: '/employer/candidates', label: 'Candidats', show: isEmployer || isAdmin },
    { href: '/admin', label: 'Admin', show: isAdmin },
  ].filter((item) => item.show);

  const roleBadge = (() => {
    if (!user) return null;

    const map = {
      ADMIN: { label: 'Admin', bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
      EMPLOYER: { label: 'Employeur', bg: 'rgba(139,92,246,0.15)', color: '#8b5cf6' },
      CANDIDATE: { label: 'Candidat', bg: 'rgba(0,200,255,0.10)', color: '#00c8ff' },
    };
    const badge = map[user.role] ?? map.CANDIDATE;

    return (
      <span
        style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: 999,
          background: badge.bg,
          color: badge.color,
        }}
      >
        {badge.label}
      </span>
    );
  })();

  const closeAll = () => {
    setOpen(false);
    setMobileOpen(false);
    setNotificationsOpen(false);
  };

  useEffect(() => {
    if (!user || !canSeeNotifications) {
      setRecentApplications([]);
      setUnseenCount(0);
      setNotificationBaseline(null);
      setSelectedNotificationId(null);
      return;
    }

    let cancelled = false;

    const syncNotifications = async () => {
      try {
        const items = sortApplications(await employersApi.applications());
        if (cancelled) return;

        const storageKey = getNotificationStorageKey(user.id);
        const storedBaseline = parseBaseline(localStorage.getItem(storageKey));
        const latestBaseline = getLatestBaseline(items);
        const effectiveBaseline = storedBaseline ?? latestBaseline;

        if (!storedBaseline && latestBaseline) {
          localStorage.setItem(storageKey, JSON.stringify(latestBaseline));
        }

        setNotificationBaseline(effectiveBaseline);
        setRecentApplications(items.slice(0, MAX_NOTIFICATIONS));
        setUnseenCount(countUnread(items, effectiveBaseline));
      } catch {
        if (!cancelled) {
          setRecentApplications([]);
          setUnseenCount(0);
        }
      }
    };

    void syncNotifications();
    const intervalId = window.setInterval(() => {
      void syncNotifications();
    }, NOTIFICATION_POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [canSeeNotifications, user]);

  const markNotificationAsSeen = (application: EmployerApplicationDto) => {
    if (!user) return;

    const nextBaseline = { appliedAt: application.appliedAt, id: application.id };
    localStorage.setItem(
      getNotificationStorageKey(user.id),
      JSON.stringify(nextBaseline),
    );
    setNotificationBaseline(nextBaseline);
    setUnseenCount(countUnread(recentApplications, nextBaseline));
  };

  return (
    <nav className="navbar-shell">
      <div className="navbar-inner">
        <Link href="/" onClick={closeAll} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontWeight: 900,
              fontSize: '1.15rem',
              background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            JobSpawner
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              padding: '0.14rem 0.45rem',
              borderRadius: 999,
            }}
          >
            BETA
          </span>
        </Link>

        <div className="navbar-links desktop-only">
          {navigationLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(item.href)}
              style={item.href === '/admin' && !isActive('/admin') ? { color: '#f87171' } : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="navbar-actions desktop-only">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {canSeeNotifications && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => {
                      setNotificationsOpen((current) => !current);
                      setOpen(false);
                    }}
                    aria-label="Ouvrir les notifications"
                    style={{
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 42,
                      height: 42,
                      padding: '0 0.9rem',
                      background: 'none',
                      cursor: 'pointer',
                      borderRadius: 12,
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                    }}
                  >
                    Alertes
                    {unseenCount > 0 && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          minWidth: 20,
                          height: 20,
                          padding: '0 6px',
                          borderRadius: 999,
                          background: '#ef4444',
                          color: '#fff',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 8px 18px rgba(239,68,68,0.35)',
                        }}
                      >
                        {unseenCount > 9 ? '9+' : unseenCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 'calc(100% + 8px)',
                        width: 340,
                        background: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 14,
                        padding: '0.75rem',
                        zIndex: 999,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          marginBottom: 10,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            Nouvelles candidatures
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                            {unseenCount > 0
                              ? `${unseenCount} nouvelle(s) depuis votre derniere visite`
                              : 'Aucune nouvelle candidature'}
                          </div>
                        </div>
                        <Link
                          href="/employer/candidates"
                          onClick={closeAll}
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--color-cyan)',
                            textDecoration: 'none',
                            fontWeight: 700,
                          }}
                        >
                          Voir tout
                        </Link>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {recentApplications.length === 0 ? (
                          <div
                            style={{
                              borderRadius: 12,
                              border: '1px solid var(--color-border)',
                              padding: '0.9rem',
                              color: 'var(--color-muted)',
                              fontSize: '0.84rem',
                            }}
                          >
                            Les candidatures apparaitront ici.
                          </div>
                        ) : (
                          recentApplications.map((application) => (
                            <Link
                              key={application.id}
                              href="/employer/candidates"
                              onClick={() => {
                                setSelectedNotificationId(application.id);
                                markNotificationAsSeen(application);
                                closeAll();
                              }}
                              style={{
                                display: 'block',
                                textDecoration: 'none',
                                color: 'inherit',
                                borderRadius: 12,
                                border: '1px solid var(--color-border)',
                                padding: '0.85rem 0.9rem',
                                background:
                                  selectedNotificationId === application.id
                                    ? 'rgba(16,185,129,0.14)'
                                    : isUnread(application, notificationBaseline)
                                      ? 'rgba(0,200,255,0.08)'
                                      : 'var(--color-surface)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                    {application.firstName} {application.lastName}
                                  </div>
                                  <div style={{ fontSize: '0.79rem', color: 'var(--color-muted)', marginTop: 3 }}>
                                    {application.jobTitle}
                                  </div>
                                </div>
                                {isUnread(application, notificationBaseline) && (
                                  <span
                                    style={{
                                      flexShrink: 0,
                                      alignSelf: 'flex-start',
                                      padding: '0.2rem 0.45rem',
                                      borderRadius: 999,
                                      background: 'rgba(239,68,68,0.12)',
                                      color: '#f87171',
                                      fontSize: '0.68rem',
                                      fontWeight: 800,
                                    }}
                                  >
                                    NEW
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-muted2)', marginTop: 8 }}>
                                {timeAgo(application.appliedAt)}
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => {
                    setOpen((current) => !current);
                    setNotificationsOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'none',
                    cursor: 'pointer',
                    padding: '0.45rem 0.8rem',
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      color: '#000',
                      flexShrink: 0,
                    }}
                  >
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{user.firstName}</span>
                  {roleBadge}
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>v</span>
                </button>

                {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />}

                {open && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      background: 'var(--color-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 14,
                      padding: '0.5rem',
                      minWidth: 210,
                      zIndex: 999,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    <DropItem href={profileHref} label="Mon profil" onClick={() => setOpen(false)} />
                    {(isCandidate || isAdmin) && (
                      <DropItem href="/preferences" label="Preferences" onClick={() => setOpen(false)} />
                    )}
                    {(isEmployer || isAdmin) && (
                      <DropItem href="/employer" label="Mon entreprise" onClick={() => setOpen(false)} />
                    )}
                    <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />
                    <button
                      onClick={() => {
                        setOpen(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.65rem 0.8rem',
                        borderRadius: 10,
                        fontSize: '0.84rem',
                        color: '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      Se deconnecter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-link" style={{ borderBottom: 'none', padding: 0 }}>
                Connexion
              </Link>
              <Link href="/register" className="btn-primary" style={{ textDecoration: 'none' }}>
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="mobile-only btn-ghost"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label="Ouvrir le menu"
          style={{ paddingInline: '0.9rem' }}
        >
          {mobileOpen ? 'Fermer' : 'Menu'}
        </button>

        {mobileOpen && (
          <div className="navbar-mobile-panel mobile-only">
            <div className="navbar-mobile-links">
              {navigationLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeAll}
                  className={navLinkClass(item.href)}
                  style={{
                    borderBottomWidth: 0,
                    padding: '0.85rem 1rem',
                    border: '1px solid var(--color-border)',
                    borderRadius: 12,
                    background: 'var(--color-card)',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="navbar-mobile-actions">
              {user ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.9rem 1rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 12,
                      background: 'var(--color-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg,#00c8ff,#8b5cf6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: '#000',
                          flexShrink: 0,
                        }}
                      >
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{`${user.firstName} ${user.lastName}`}</span>
                    </div>
                    {roleBadge}
                  </div>
                  {canSeeNotifications && (
                    <Link href="/employer/candidates" onClick={closeAll} className="btn-ghost" style={{ textDecoration: 'none' }}>
                      {unseenCount > 0 ? `Alertes candidatures (${unseenCount})` : 'Alertes candidatures'}
                    </Link>
                  )}
                  <Link href={profileHref} onClick={closeAll} className="btn-ghost" style={{ textDecoration: 'none' }}>
                    Mon profil
                  </Link>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => {
                      closeAll();
                      logout();
                    }}
                  >
                    Se deconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={closeAll} className="btn-ghost" style={{ textDecoration: 'none' }}>
                    Connexion
                  </Link>
                  <Link href="/register" onClick={closeAll} className="btn-primary" style={{ textDecoration: 'none' }}>
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function DropItem({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: 'block',
        padding: '0.65rem 0.8rem',
        borderRadius: 10,
        fontSize: '0.84rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background = 'var(--color-surface)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
    </Link>
  );
}
