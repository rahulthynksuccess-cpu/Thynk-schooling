// ─────────────────────────────────────────────────────────────
// THYNK SCHOOLING — Shared TypeScript Types
// ─────────────────────────────────────────────────────────────

export type Role = 'parent' | 'school_admin' | 'counsellor' | 'super_admin'

export interface User {
  id: string
  phone: string
  email?: string
  fullName?: string
  role: Role
  avatarUrl?: string
  isVerified: boolean
  isActive: boolean
  profileCompleted: boolean
  createdAt: string
}

// ── Dropdown (Settings-driven, never hardcoded) ───────────────
export interface DropdownOption {
  id: string
  category: string
  label: string
  value: string
  sortOrder: number
  isActive: boolean
  parentValue?: string
}

// ── School ────────────────────────────────────────────────────
export interface School {
  id: string
  name: string
  slug: string
  schoolType: string
  board: string[]
  genderPolicy: string
  mediumOfInstruction: string
  religion: string
  affiliationNo?: string
  foundingYear?: number
  tagline?: string
  description: string
  addressLine1: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
  phone?: string
  email?: string
  websiteUrl?: string
  monthlyFeeMin?: number
  monthlyFeeMax?: number
  annualFee?: number
  classesFrom: string
  classesTo: string
  totalStudents?: number
  studentTeacherRatio?: string
  recognition?: string
  logoUrl?: string
  coverImageUrl?: string
  galleryImages?: string[]
  isVerified: boolean
  isFeatured: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  avgRating: number
  totalReviews: number
  facilities?: SchoolFacilities
  admissionInfo?: AdmissionInfo
  pricePerLead?: number
  subscriptionPlan?: 'free' | 'silver' | 'gold' | 'platinum'
}

export interface SchoolFacilities {
  transport: boolean
  swimmingPool: boolean
  sportsGround: boolean
  scienceLab: boolean
  computerLab: boolean
  library: boolean
  cafeteria: boolean
  hostel: boolean
  infirmary: boolean
  smartClassrooms: boolean
}

export interface AdmissionInfo {
  academicYear: string
  admissionOpen: boolean
  lastDate?: string
  documentsRequired: string[]
}

// ── Student ───────────────────────────────────────────────────
export interface Student {
  id: string
  parentId: string
  fullName: string
  dob: string
  gender: string
  currentClass: string
  applyingForClass: string
  academicYear: string
  currentSchool?: string
  bloodGroup?: string
  specialNeeds?: string
  photoUrl?: string
}

// ── Lead ──────────────────────────────────────────────────────
export interface Lead {
  id: string
  parentId: string
  studentId?: string
  schoolId: string
  // Masked fields (before purchase)
  maskedPhone: string
  maskedName: string
  // Full fields (after purchase)
  fullPhone?: string
  fullName?: string
  childName: string
  classApplyingFor: string
  academicYear: string
  city: string
  locality?: string
  latitude?: number
  longitude?: number
  status: string
  source: string
  isPurchased: boolean
  createdAt: string
  expiresAt?: string
}

// ── Lead Package ──────────────────────────────────────────────
export interface LeadPackage {
  id: string
  name: string
  leadCredits: number
  price: number
  validityDays: number
  isActive: boolean
  description?: string
}

// ── Lead Credits ──────────────────────────────────────────────
export interface LeadCredits {
  schoolId: string
  totalCredits: number
  usedCredits: number
  availableCredits: number
  lastPurchaseAt?: string
  expiresAt?: string
}

// ── Review ────────────────────────────────────────────────────
export interface Review {
  id: string
  schoolId: string
  parentId: string
  parentName: string
  rating: number
  title: string
  body: string
  schoolReply?: string
  createdAt: string
}

// ── Counselling ───────────────────────────────────────────────
export interface CounsellingSlot {
  id: string
  counsellorId: string
  counsellorName: string
  counsellorAvatar?: string
  date: string
  time: string
  isBooked: boolean
}

// ── Application ───────────────────────────────────────────────
export interface Application {
  id: string
  schoolId: string
  schoolName: string
  schoolLogo?: string
  studentId: string
  studentName: string
  status: string
  academicYear: string
  submittedAt: string
  updatedAt: string
}

// ── Subscription Plan ─────────────────────────────────────────
export interface SubscriptionPlan {
  id: string
  name: 'free' | 'silver' | 'gold' | 'platinum'
  priceMonthly: number
  priceAnnual: number
  leadCreditsPerMonth: number
  features: string[]
  maxImages: number
  isFeatured: boolean
}

// ── API Responses ─────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

// ── Search / Filter ───────────────────────────────────────────
export interface SchoolSearchFilters {
  city?: string
  board?: string[]
  schoolType?: string
  genderPolicy?: string
  medium?: string
  classFrom?: string
  feeMin?: number
  feeMax?: number
  rating?: number
  isFeatured?: boolean
  query?: string
  page?: number
  limit?: number
  sortBy?: 'rating' | 'fee_asc' | 'fee_desc' | 'newest'
}

// ── Dashboard Stats ───────────────────────────────────────────
export interface SchoolDashboardStats {
  totalLeads: number
  newLeadsToday: number
  totalApplications: number
  totalReviews: number
  avgRating: number
  availableCredits: number
  profileCompleteness: number
}

export interface ParentDashboardStats {
  totalChildren: number
  totalApplications: number
  savedSchools: number
  upcomingSessions: number
}
