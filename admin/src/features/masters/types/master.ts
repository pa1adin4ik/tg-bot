export interface AdminMasterListItem {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  experienceYears: number | null;
  ratingAvg: string;
  reviewCount: number;
  isVisible: boolean;
  specializations: string[];
  email: string | null;
  phone: string | null;
  createdAt: string;
}

export interface AdminMasterDetail extends Omit<AdminMasterListItem, 'createdAt' | 'email' | 'phone'> {
  user: {
    firstName: string;
    lastName: string | null;
    email: string | null;
    phone: string | null;
  };
  services: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  schedules: MasterScheduleFormItem[];
  portfolio: MasterPortfolioFormItem[];
}

export interface MasterScheduleFormItem {
  id?: string;
  type: 'WORKING_HOURS' | 'BLOCKED_TIME';
  dayOfWeek: string | null;
  specificDate: string | null;
  startMinute: number;
  endMinute: number;
  timezone: string;
  isRecurring: boolean;
  isActive: boolean;
  validFrom: string | null;
  validTo: string | null;
}

export interface MasterPortfolioFormItem {
  id?: string;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  sortOrder: number;
  isPublished: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  slug: string;
}

export interface MasterFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  bio: string;
  experienceYears: string;
  isVisible: boolean;
  serviceIds: string[];
  schedules: MasterScheduleFormItem[];
  portfolio: MasterPortfolioFormItem[];
}

export const createEmptySchedule = (): MasterScheduleFormItem => ({
  type: 'WORKING_HOURS',
  dayOfWeek: 'MONDAY',
  specificDate: null,
  startMinute: 540,
  endMinute: 1080,
  timezone: 'Asia/Tashkent',
  isRecurring: true,
  isActive: true,
  validFrom: null,
  validTo: null,
});

export const createEmptyPortfolioItem = (): MasterPortfolioFormItem => ({
  title: '',
  description: '',
  mediaUrl: '',
  mediaType: 'IMAGE',
  sortOrder: 0,
  isPublished: true,
});

export const createEmptyMasterForm = (): MasterFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  avatarUrl: '',
  bio: '',
  experienceYears: '',
  isVisible: true,
  serviceIds: [],
  schedules: [createEmptySchedule()],
  portfolio: [],
});

export const mapMasterDetailToForm = (master: AdminMasterDetail): MasterFormState => ({
  firstName: master.user.firstName,
  lastName: master.user.lastName ?? '',
  email: master.user.email ?? '',
  phone: master.user.phone ?? '',
  avatarUrl: master.avatarUrl ?? '',
  bio: master.bio ?? '',
  experienceYears: master.experienceYears !== null ? String(master.experienceYears) : '',
  isVisible: master.isVisible,
  serviceIds: master.services.map((service) => service.id),
  schedules: master.schedules.length > 0 ? master.schedules : [createEmptySchedule()],
  portfolio: master.portfolio,
});
