// ─────────────────────────────────────────────────────────────────────────────
// ROLES
// ─────────────────────────────────────────────────────────────────────────────
export type UserRole = 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';

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

export interface AuthResponseDto {
  token:   string;
  user:    UserProfileDto;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────
export interface UserProfileDto {
  id:           number;
  firstName:    string;
  lastName:     string;
  email:        string;
  role:         UserRole;
  phone?:       string | null;
  address?:     string | null;
  city?:        string | null;
  country?:     string | null;
  linkedInUrl?: string | null;
  gitHubUrl?:   string | null;
  cvPath?:      string | null;
  coverLetter?: string | null;
  createdAt:    string;
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
  applyUrl:     string;
  jobType?:     string | null;
  isRemote:     boolean;
  minSalary?:   number | null;
  maxSalary?:   number | null;
  currency?:    string | null;
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
  applyUrl:    string;
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
  data:            T[];
  totalCount:      number;
  pageNumber:      number;
  pageSize:        number;
  totalPages:      number;
  hasPreviousPage: boolean;
  hasNextPage:     boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export interface ApplicationCreateDto {
  jobId:        number;
  coverLetter?: string;
}

export interface ApplicationDto {
  id:           number;
  userId:       number;
  jobId:        number;
  cvPath?:      string | null;
  coverLetter?: string | null;
  appliedAt:    string;
  job?:         JobDto;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYERS
// ─────────────────────────────────────────────────────────────────────────────
export interface EmployerCreateDto {
  companyName:        string;
  companyDescription: string;
  website?:           string;
  industry?:          string;
  size?:              string;
  location?:          string;
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
