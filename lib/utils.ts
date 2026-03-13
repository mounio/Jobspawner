// ─── Date formatting ──────────────────────────────────────────────────────────
export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60)    return 'à l\'instant';
  if (diff < 3600)  return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800)return `il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function resolveAssetUrl(path?: string | null): string {
  if (!path) return '';

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.replace(/\\/g, '/');
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7248')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  if (normalizedPath.startsWith('/')) {
    return `${apiBase}${normalizedPath}`;
  }

  return `${apiBase}/${normalizedPath}`;
}

// ─── Salary formatting ────────────────────────────────────────────────────────
export function formatSalary(min?: number, max?: number, currency = 'USD'): string {
  if (!min && !max) return 'Salaire non communiqué';
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `À partir de ${fmt(min)}`;
  return `Jusqu\'à ${fmt(max!)}`;
}

// ─── Tech stack parsing ───────────────────────────────────────────────────────
export function parseTechStack(techStack: string): string[] {
  if (!techStack) return [];
  const seen = new Set<string>();
  return techStack
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ─── Source badge ─────────────────────────────────────────────────────────────
export function sourceBadgeClass(source: string): string {
  const map: Record<string, string> = {
    GITHUB:          'badge-github',
    STACKOVERFLOW:   'badge-stackoverflow',
    REMOTEOK:        'badge-remoteok',
    WEWORKREMOTELY:  'badge-weworkremotely',
    MANUAL:          'badge-manual',
    LINKEDIN:        'badge-linkedin',
  };
  return map[source?.toUpperCase()] ?? 'badge-manual';
}

export function sourceLabel(source: string): string {
  const map: Record<string, string> = {
    GITHUB:          'GitHub',
    STACKOVERFLOW:   'Stack Overflow',
    REMOTEOK:        'Remote.ok',
    WEWORKREMOTELY:  'WeWorkRemotely',
    MANUAL:          'JobSpawner',
    LINKEDIN:        'LinkedIn',
  };
  return map[source?.toUpperCase()] ?? source;
}

export function sourceIcon(source: string): string {
  const map: Record<string, string> = {
    GITHUB:          '⌥',
    STACKOVERFLOW:   '◈',
    REMOTEOK:        '◎',
    WEWORKREMOTELY:  '⬡',
    MANUAL:          '✦',
    LINKEDIN:        '💼',
  };
  return map[source?.toUpperCase()] ?? '●';
}

// ─── cn helper ────────────────────────────────────────────────────────────────
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
