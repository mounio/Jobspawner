// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────
export type UserRole = 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';
export type ApplicationStatus = 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED';
export type AdminScrapeSource =
  | 'remotive'
  | 'arbeitnow'
  | 'remoteok'
  | 'weworkremotely'
  | 'jobicy'
  | 'jooble'
  | 'adzuna'
  | 'linkedin';

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export interface UserRegistrationDto {
  firstName:   string;
  lastName:    string;
  email:       string;
  password:    string;
  role:        UserRole;
  phone?:      string;
  address?:    string;
  city?:       string;
  country?:    string;
  // Employer-specific
  companyName?:        string;
  companyDescription?: string;
  website?:            string;
  industry?:           string;
  companySize?:        string;
  companyLocation?:    string;
}

export interface UserLoginDto {
  email:    string;
  password: string;
}

export interface VerifyEmailDto {
  email: string;
  code: string;
}

export interface AuthResponseDto {
  token: string;
  user: UserProfileDto | null;
  message: string;
  isEmailVerified: boolean;
  requiresVerification: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export interface UserProfileDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  linkedInUrl: string | null;
  gitHubUrl: string | null;
  cvPath: string | null;
  coverLetter: string | null;
  createdAt: string;
}

export interface UserPreferenceCreateDto {
  techStack?:     string;
  location?:      string;
  jobType?:       string;
  remoteAllowed?: boolean;
}

export interface UserPreferenceDto {
  id?:           number;
  userId?:       number;
  techStack?:    string;
  location?:     string;
  jobType?:      string;
  remoteAllowed?: boolean;
  updatedAt?:    string;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────────────────────────────────────
export interface JobDto {
  id:           number;
  company:      string;
  title:        string;
  description:  string;
  location:     string;
  techStack:    string;
  applyUrl?:    string | null;
  applicationEmail?: string | null;
  jobType?:     string | null;
  isRemote:     boolean;
  minSalary?:   number | null;
  maxSalary?:   number | null;
  currency:     string;
  views:        number;
  applications: number;
  source:       string; // GITHUB | STACKOVERFLOW | REMOTEOK | WEWORKREMOTELY | LINKEDIN | MANUAL
  externalJobId?: string | null;
  createdAt:    string;
  updatedAt:    string;
}

export interface JobCreateDto {
  title:       string;
  description: string;
  location:    string;
  techStack:   string;
  applicationEmail: string;
  applyUrl?:   string;
  jobType?:    string;
  isRemote?:   boolean;
  minSalary?:  number;
  maxSalary?:  number;
  currency?:   string;
}

export interface JobSearchDto {
  keyword?:    string | null;
  techStack?:  string | null;
  location?:   string | null;
  jobType?:    string | null;
  company?:    string | null;
  remoteOnly?: boolean | null;
  minSalary?:  number | null;
  maxSalary?:  number | null;
  pageNumber:  number;
  pageSize:    number;
  sortBy:      string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SimilarJobDto {
  id: number;
  title: string;
  company: string;
  location: string;
  isRemote: boolean;
  daysAgo: number;
}

export interface JobDetailsDto {
  id: number;
  title: string;
  company: string;
  description: string;
  location: string;
  isRemote: boolean;
  jobType?: string | null;
  techStack: string;
  source: string;
  applyUrl: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
  salaryDisplay?: string | null;
  createdAt: string;
  updatedAt: string;
  daysAgo: number;
  totalViews: number;
  totalApplications: number;
  totalSaves: number;
  isSavedByCurrentUser?: boolean | null;
  hasAppliedByCurrentUser?: boolean | null;
  matchingScore?: number | null;
  matchingReason?: string | null;
  similarJobs: SimilarJobDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export interface ApplicationCreateDto {
  jobId:        number;
  coverLetter?: string;
}

export interface ApplicationDto {
  id: number;
  userId: number;
  jobId: number;
  status: ApplicationStatus;
  cvPath: string | null;
  coverLetter: string | null;
  appliedAt: string;
  reviewedAt: string | null;
  jobTitle: string | null;
  company: string | null;
  jobLocation: string | null;
}

export interface EmployerApplicationDto {
  id: number;
  status: ApplicationStatus;
  appliedAt: string;
  reviewedAt?: string | null;
  jobId: number;
  jobTitle: string;
  jobLocation: string;
  candidateId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
  cvPath?: string | null;
  coverLetter?: string | null;
  linkedInUrl?: string | null;
  gitHubUrl?: string | null;
}

export interface JobApplicationSummaryDto {
  jobId: number;
  jobTitle: string;
  jobLocation: string;
  totalApplications: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
  lastAppliedAt?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYERS
// ─────────────────────────────────────────────────────────────────────────────
export interface EmployerCreateDto {
  companyName: string;
  companyDescription?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  size?: string;
  location?: string;
  logoUrl?: string;
}

export interface EmployerDto {
  id:                 number;
  userId:             number;
  companyName:        string;
  companyDescription: string;
  website?:           string | null;
  logo?:              string | null;
  industry?:          string | null;
  size?:              string | null;
  location?:          string | null;
  isVerified:         boolean;
  createdAt:          string;
  updatedAt:          string;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / SCRAPING
// ─────────────────────────────────────────────────────────────────────────────
export interface ScrapingResultDto {
  totalImported:    number;
  importedBySource: Record<string, number> | null;
  errors:           string[] | null;
  completedAt:      string;
}

export interface ScrapeSourceResultDto {
  source:   string;
  imported: number;
}

export interface AdminUserListDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  companyName?: string | null;
}

export interface AdminCreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  skipEmailVerification?: boolean;
  phone?: string;
  city?: string;
  country?: string;
  companyName?: string;
  companyDescription?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  companyLocation?: string;
}
