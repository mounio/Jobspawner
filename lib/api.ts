import type {
  AuthResponseDto, UserRegistrationDto, UserLoginDto,
  UserProfileDto, UserPreferenceDto, UserPreferenceCreateDto,
  JobDto, JobCreateDto, JobSearchDto, PaginatedResult,
  ApplicationDto, ApplicationCreateDto,
  EmployerDto, EmployerCreateDto,
  ScrapingResultDto, ScrapeSourceResultDto,
} from './types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7248/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message); this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr: any) {
    const isRefused = networkErr?.message?.includes('ERR_CONNECTION_REFUSED') ||
                      networkErr?.message?.includes('Failed to fetch');
    if (isRefused)
      throw new ApiError(0,
        `Impossible de joindre le backend (${BASE_URL}).\n` +
        `Vérifiez que le serveur ASP.NET Core tourne et que vous avez accepté le certificat SSL.`);
    throw new ApiError(0, networkErr?.message ?? 'Erreur réseau');
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_user');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expirée.');
  }

  if (!res.ok) {
    let msg = `Erreur ${res.status}`;
    try {
      const body = await res.json();
      msg = body.message ?? body.title ?? body.error ??
            body.errors?.[Object.keys(body.errors ?? {})[0]]?.[0] ??
            `Erreur serveur (${res.status})`;
    } catch {}
    throw new ApiError(res.status, msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Convert empty strings to null before sending
function json(data: object): string {
  return JSON.stringify(data, (_key, value) => value === '' ? null : value);
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: UserRegistrationDto) =>
    request<AuthResponseDto>('/auth/register', { method: 'POST', body: json(data) }),
  login: (data: UserLoginDto) =>
    request<AuthResponseDto>('/auth/login', { method: 'POST', body: json(data) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: (pageNumber = 1, pageSize = 10, sortBy?: string) => {
    const p = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) });
    if (sortBy) p.set('sortBy', sortBy);
    return request<PaginatedResult<JobDto>>(`/jobs?${p}`);
  },
  get:      (id: number) => request<JobDto>(`/jobs/${id}`),
  search:   (techStack?: string, location?: string) => {
    const p = new URLSearchParams();
    if (techStack) p.set('techStack', techStack);
    if (location)  p.set('location', location);
    return request<JobDto[]>(`/jobs/search?${p}`);
  },
  advanced: (data: JobSearchDto) =>
    request<PaginatedResult<JobDto>>('/jobs/search/advanced', { method: 'POST', body: json(data) }),
  trending: (limit = 10) => request<JobDto[]>(`/jobs/trending?limit=${limit}`),
  recent:   (limit = 10) => request<JobDto[]>(`/jobs/recent?limit=${limit}`),
  matched:  ()           => request<JobDto[]>('/jobs/matched'),
  create:   (data: JobCreateDto) =>
    request<JobDto>('/jobs', { method: 'POST', body: json(data) }),
  update:   (id: number, data: JobCreateDto) =>
    request<JobDto>(`/jobs/${id}`, { method: 'PUT', body: json(data) }),
  delete:   (id: number) => request<void>(`/jobs/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  profile:          () => request<UserProfileDto>('/users/profile'),
  updateProfile:    (data: Partial<UserProfileDto>) =>
    request<UserProfileDto>('/users/profile', { method: 'PUT', body: json(data) }),
  preferences:      () => request<UserPreferenceDto>('/users/preferences'),
  savePreferences:  (data: UserPreferenceCreateDto) =>
    request<UserPreferenceDto>('/users/preferences', { method: 'POST', body: json(data) }),
  userApplications: (userId: number) => request<ApplicationDto[]>(`/users/${userId}/applications`),
};

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const applicationsApi = {
  list:   () => request<ApplicationDto[]>('/applications'),
  get:    (id: number) => request<ApplicationDto>(`/applications/${id}`),
  apply:  (data: ApplicationCreateDto) =>
    request<ApplicationDto>('/applications', { method: 'POST', body: json(data) }),
  delete: (id: number) => request<void>(`/applications/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYERS
// ─────────────────────────────────────────────────────────────────────────────
export const employersApi = {
  list:   () => request<EmployerDto[]>('/employers'),
  get:    (id: number) => request<EmployerDto>(`/employers/${id}`),
  create: (data: EmployerCreateDto) =>
    request<EmployerDto>('/employers', { method: 'POST', body: json(data) }),
  update: (id: number, data: EmployerCreateDto) =>
    request<EmployerDto>(`/employers/${id}`, { method: 'PUT', body: json(data) }),
  delete: (id: number) => request<void>(`/employers/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / SCRAPING
// ─────────────────────────────────────────────────────────────────────────────
export const adminApi = {
  refreshAll: () =>
    request<ScrapingResultDto>('/admin/scrape/refresh-all', { method: 'POST' }),
  scrapeSource: (source: 'github' | 'stackoverflow' | 'remoteok' | 'weworkremotely' | 'linkedin', limit = 50) =>
    request<ScrapeSourceResultDto>(`/admin/scrape/${source}?limit=${limit}`, { method: 'POST' }),
};
