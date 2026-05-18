import { apiRequest } from '../../../api/client/http-client';
import type {
  AdminMasterDetail,
  AdminMasterListItem,
  MasterFormState,
  ServiceOption,
} from '../types/master';

const normalizeMasterPayload = (form: MasterFormState) => ({
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim() || undefined,
  email: form.email.trim() || undefined,
  phone: form.phone.trim() || undefined,
  avatarUrl: form.avatarUrl.trim() || undefined,
  bio: form.bio.trim() || undefined,
  experienceYears: form.experienceYears ? Number(form.experienceYears) : undefined,
  isVisible: form.isVisible,
  serviceIds: form.serviceIds,
  schedules: form.schedules.map((schedule) => ({
    type: schedule.type,
    dayOfWeek: schedule.isRecurring ? schedule.dayOfWeek ?? undefined : undefined,
    specificDate: schedule.isRecurring ? undefined : schedule.specificDate ?? undefined,
    startMinute: schedule.startMinute,
    endMinute: schedule.endMinute,
    timezone: schedule.timezone.trim(),
    isRecurring: schedule.isRecurring,
    isActive: schedule.isActive,
    validFrom: schedule.validFrom ?? undefined,
    validTo: schedule.validTo ?? undefined,
  })),
  portfolio: form.portfolio.map((item) => ({
    title: item.title.trim(),
    description: item.description?.trim() || undefined,
    mediaUrl: item.mediaUrl.trim(),
    mediaType: item.mediaType,
    sortOrder: item.sortOrder,
    isPublished: item.isPublished,
  })),
});

export const listAdminMasters = async (token: string): Promise<AdminMasterListItem[]> => {
  return apiRequest<AdminMasterListItem[]>('/admin/masters', {
    method: 'GET',
    token,
  });
};

export const getAdminMaster = async (
  token: string,
  masterId: string,
): Promise<AdminMasterDetail> => {
  return apiRequest<AdminMasterDetail>(`/admin/masters/${masterId}`, {
    method: 'GET',
    token,
  });
};

export const createAdminMaster = async (
  token: string,
  form: MasterFormState,
): Promise<AdminMasterDetail> => {
  return apiRequest<AdminMasterDetail>('/admin/masters', {
    method: 'POST',
    token,
    body: JSON.stringify(normalizeMasterPayload(form)),
  });
};

export const updateAdminMaster = async (
  token: string,
  masterId: string,
  form: MasterFormState,
): Promise<AdminMasterDetail> => {
  return apiRequest<AdminMasterDetail>(`/admin/masters/${masterId}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(normalizeMasterPayload(form)),
  });
};

export const deleteAdminMaster = async (token: string, masterId: string): Promise<void> => {
  await apiRequest(`/admin/masters/${masterId}`, {
    method: 'DELETE',
    token,
  });
};

export const listServiceOptions = async (): Promise<ServiceOption[]> => {
  const services = await apiRequest<Array<{ id: string; name: string; slug: string }>>('/services', {
    method: 'GET',
  });

  return services.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
  }));
};
