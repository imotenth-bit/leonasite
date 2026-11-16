export interface SocialLinks {
  github: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  email: string;
}

export interface ProfileData {
  name: string;
  welcomeHeading: string;
  tagline: string;
  shortIntro: string;
  location: string;
  university: string;
  graduationYear: string;
  profileImage: string;
  heroBannerImage: string;
  social: SocialLinks;
}

export interface AboutData {
  headline: string;
  bioParagraphs: string[];
  interestsSummary: string;
  futureAmbitions: string;
  quote: string;
  highlights: { label: string; value: string }[];
}

export interface PhotoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  storagePath?: string;
  dateTaken: string;
  location?: string;
  featured?: boolean;
  createdAt: string;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  period: string;
  location: string;
  gpaOrHonors: string;
  description: string;
  highlights: string[];
}

export interface SubjectItem {
  id: string;
  name: string;
  area: string;
  note: string;
}

export interface EducationData {
  timeline: EducationEntry[];
  favoriteSubjects: SubjectItem[];
  academicAchievements: string[];
  educationalGoals: string;
}

export interface HobbyItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  description: string;
  imageUrl: string;
}

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  category: string;
  description: string;
  imageUrl: string;
}

export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  context: string;
  detail: string;
}

export interface AchievementsData {
  certificates: CertificateItem[];
  milestones: MilestoneItem[];
}

export interface SiteData {
  profile: ProfileData;
  about: AboutData;
  categories: string[];
  photos: PhotoItem[];
  education: EducationData;
  hobbies: HobbyItem[];
  achievements: AchievementsData;
  updatedAt: string;
}

export interface AdminStatus {
  authenticated: boolean;
  hasPasswordConfigured: boolean;
  usingEnvPassword: boolean;
}

export interface ContactServiceStatus {
  configured: boolean;
  provider: 'resend' | 'none';
  databaseReady?: boolean;
}

export interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  emailDelivered: boolean;
  createdAt: string;
}

export interface SupabaseStatus {
  projectId: string;
  url: string;
  configured: boolean;
  tablesReady: boolean;
  storageReady: boolean;
  hasSecretKey: boolean;
  lastError?: string | null;
  schemaSql: string;
}
