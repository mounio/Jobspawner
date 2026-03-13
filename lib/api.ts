import type {
  AdminCreateUserDto,
  AdminScrapeSource,
  AdminUserListDto,
  ApplicationCreateDto,
  ApplicationDto,
  ApplicationStatus,
  AuthResponseDto,
  EmployerApplicationDto,
  EmployerCreateDto,
  EmployerDto,
  JobApplicationSummaryDto,
  JobCreateDto,
  JobDetailsDto,
  JobDto,
  JobSearchDto,
  PaginatedResult,
  ScrapeSourceResultDto,
  ScrapingResultDto,
  SimilarJobDto,
  UserLoginDto,
  UserPreferenceCreateDto,
  UserPreferenceDto,
  UserProfileDto,
  UserRegistrationDto,
  VerifyEmailDto,
} from './types';
import { resolveAssetUrl } from './utils';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '').replace(/\/api$/, '');
}

const BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? 'https://localhost:7248');

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jwt_token') ?? sessionStorage.getItem('jwt_token');
}

function getFileName(path: string, fallbackName: string): string {
  const normalized = path.replace(/\\/g, '/');
  const rawName = normalized.split('/').pop() || fallbackName;

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers ?? {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (networkErr: any) {
    const isRefused =
      networkErr?.message?.includes('ERR_CONNECTION_REFUSED') ||
      networkErr?.message?.includes('Failed to fetch');
    if (isRefused) {
      throw new ApiError(
        0,
        `Impossible de joindre le backend (${BASE_URL}). Verifiez que le serveur ASP.NET Core tourne et que le certificat SSL est accepte.`,
      );
    }
    throw new ApiError(0, networkErr?.message ?? 'Erreur reseau');
  }

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('jwt_user');
      sessionStorage.removeItem('jwt_token');
      sessionStorage.removeItem('jwt_user');
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Session expiree.');
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;

    try {
      const body = await res.json();
      const validationErrors = Object.values(body.errors ?? {})
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .filter(Boolean);

      message =
        body.message ??
        body.title ??
        body.error ??
        (validationErrors.length > 0 ? validationErrors.join(' | ') : undefined) ??
        `Erreur serveur (${res.status})`;
    } catch {
      // keep default message
    }

    throw new ApiError(res.status, message);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function json(data: object): string {
  return JSON.stringify(data, (_key, value) => (value === '' ? null : value));
}

export async function downloadProtectedFile(path: string, fallbackName = 'document'): Promise<void> {
  const token = getToken();
  const headers = new Headers();

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveAssetUrl(path), {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `Telechargement impossible (${response.status}).`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = getFileName(path, fallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

function normalizePaginatedResult<T>(
  payload: any,
  fallbackPageNumber = 1,
  fallbackPageSize = 10,
): PaginatedResult<T> {
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  const totalCount =
    typeof payload?.totalCount === 'number'
      ? payload.totalCount
      : typeof payload?.count === 'number'
        ? payload.count
        : items.length;
  const pageNumber =
    typeof payload?.pageNumber === 'number'
      ? payload.pageNumber
      : typeof payload?.currentPage === 'number'
        ? payload.currentPage
        : fallbackPageNumber;
  const pageSize =
    typeof payload?.pageSize === 'number'
      ? payload.pageSize
      : typeof payload?.page_size === 'number'
        ? payload.page_size
        : fallbackPageSize;
  const totalPages =
    typeof payload?.totalPages === 'number'
      ? payload.totalPages
      : Math.max(1, Math.ceil(totalCount / Math.max(pageSize, 1)));

  return {
    items,
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
  };
}

export const authApi = {
  register: (data: UserRegistrationDto) =>
    request<AuthResponseDto>('/api/auth/register', { method: 'POST', body: json(data) }),
  login: (data: UserLoginDto) =>
    request<AuthResponseDto>('/api/auth/login', { method: 'POST', body: json(data) }),
  verifyEmail: (data: VerifyEmailDto) =>
    request<{ message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: json(data),
    }),
  resendCode: (email: string) =>
    request<{ message: string }>('/api/auth/resend-code', {
      method: 'POST',
      body: json({ email }),
    }),
};

export const usersApi = {
  profile: () => request<UserProfileDto>('/api/users/profile'),
  updateProfile: (data: Partial<UserProfileDto>) =>
    request<UserProfileDto>('/api/users/profile', { method: 'PUT', body: json(data) }),
  preferences: () => request<UserPreferenceDto>('/api/users/preferences'),
  savePreferences: (data: UserPreferenceCreateDto) =>
    request<UserPreferenceDto>('/api/users/preferences', {
      method: 'POST',
      body: json(data),
    }),
  uploadCv: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ cvPath: string; message: string }>('/api/users/upload-cv', {
      method: 'POST',
      body: formData,
    });
  },
};

export const jobsApi = {
  list: async (pageNumber = 1, pageSize = 10, sortBy?: string) => {
    const params = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    if (sortBy) params.set('sortBy', sortBy);
    const payload = await request<any>(`/api/jobs?${params.toString()}`);
    return normalizePaginatedResult<JobDto>(payload, pageNumber, pageSize);
  },
  get: (id: number) => request<JobDto>(`/api/jobs/${id}`),
  search: (techStack?: string, location?: string) => {
    const params = new URLSearchParams();
    if (techStack) params.set('techStack', techStack);
    if (location) params.set('location', location);
    return request<JobDto[]>(`/api/jobs/search?${params.toString()}`);
  },
  advanced: async (data: JobSearchDto) => {
    const payload = await request<any>('/api/jobs/search/advanced', {
      method: 'POST',
      body: json(data),
    });
    return normalizePaginatedResult<JobDto>(payload, data.pageNumber, data.pageSize);
  },
  trending: (limit = 10) => request<JobDto[]>(`/api/jobs/trending?limit=${limit}`),
  recent: (limit = 10) => request<JobDto[]>(`/api/jobs/recent?limit=${limit}`),
  matched: () => request<JobDto[]>('/api/jobs/matched'),
  getDetails: (jobId: number) => request<JobDetailsDto>(`/api/jobs-details/${jobId}`),
  getSimilar: (jobId: number, limit = 5) =>
    request<SimilarJobDto[]>(`/api/jobs-details/${jobId}/similar?limit=${limit}`),
  getMatchScore: (jobId: number) =>
    request<{ score: number; reason: string }>(`/api/jobs-details/${jobId}/match-score`),
};

export const applicationsApi = {
  list: () => request<ApplicationDto[]>('/api/applications/my-applications'),
  get: (id: number) => request<ApplicationDto>(`/api/applications/${id}`),
  apply: (data: ApplicationCreateDto) =>
    request<ApplicationDto>('/api/applications/apply', {
      method: 'POST',
      body: json(data),
    }),
  delete: (id: number) => request<void>(`/api/applications/${id}`, { method: 'DELETE' }),
};

export const employersApi = {
  profile: () => request<EmployerDto>('/api/employers/profile'),
  createProfile: (data: EmployerCreateDto) =>
    request<EmployerDto>('/api/employers/profile', { method: 'POST', body: json(data) }),
  updateProfile: (data: EmployerCreateDto) =>
    request<EmployerDto>('/api/employers/profile', { method: 'PUT', body: json(data) }),
  jobs: () => request<JobDto[]>('/api/employers/jobs'),
  getJob: (jobId: number) => request<JobDto>(`/api/employers/jobs/${jobId}`),
  createJob: (data: JobCreateDto) =>
    request<JobDto>('/api/employers/jobs', { method: 'POST', body: json(data) }),
  updateJob: (jobId: number, data: JobCreateDto) =>
    request<JobDto>(`/api/employers/jobs/${jobId}`, { method: 'PUT', body: json(data) }),
  deleteJob: (jobId: number) =>
    request<void>(`/api/employers/jobs/${jobId}`, { method: 'DELETE' }),
  applicationsSummary: () =>
    request<JobApplicationSummaryDto[]>('/api/employers/applications/summary'),
  applications: (status?: ApplicationStatus) =>
    request<EmployerApplicationDto[]>(
      `/api/employers/applications${status ? `?status=${status}` : ''}`,
    ),
  jobApplications: (jobId: number, status?: ApplicationStatus) =>
    request<EmployerApplicationDto[]>(
      `/api/employers/jobs/${jobId}/applications${status ? `?status=${status}` : ''}`,
    ),
  applicationDetail: (applicationId: number) =>
    request<EmployerApplicationDto>(`/api/employers/applications/${applicationId}`),
  updateApplicationStatus: (applicationId: number, status: ApplicationStatus) =>
    request<EmployerApplicationDto>(`/api/employers/applications/${applicationId}/status`, {
      method: 'PUT',
      body: json({ status }),
    }),
};

export const adminApi = {
  getUsers: (role?: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN') =>
    request<AdminUserListDto[]>(`/api/admin/users${role ? `?role=${role}` : ''}`),
  getUser: (id: number) => request<AdminUserListDto>(`/api/admin/users/${id}`),
  createUser: (data: AdminCreateUserDto) =>
    request<AdminUserListDto>('/api/admin/users', { method: 'POST', body: json(data) }),
  updateRole: (id: number, role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN') =>
    request<AdminUserListDto>(`/api/admin/users/${id}/role`, {
      method: 'PUT',
      body: json({ role }),
    }),
  updateStatus: (id: number, isActive: boolean) =>
    request<AdminUserListDto>(`/api/admin/users/${id}/status`, {
      method: 'PUT',
      body: json({ isActive }),
    }),
  deleteUser: (id: number, force = false) =>
    request<void>(`/api/admin/users/${id}?force=${force}`, { method: 'DELETE' }),
  scrapeAll: () =>
    request<ScrapingResultDto>('/api/admin/scrape/refresh-all', { method: 'POST' }),
  refreshAll: () =>
    request<ScrapingResultDto>('/api/admin/scrape/refresh-all', { method: 'POST' }),
  refreshAllInternal: () =>
    request<ScrapingResultDto>('/api/internal/scrape/refresh-all', {
      method: 'POST',
      headers: { 'X-Internal-Key': '1e698661d8779790b6154b313eed29c5fd1e6ffdfe089394705956bbdfeb8098' },
    }),
  scrapeSource: (source: AdminScrapeSource, limit = 50) =>
    request<ScrapeSourceResultDto>(`/api/admin/scrape/${source}?limit=${limit}`, {
      method: 'POST',
    }),
};
