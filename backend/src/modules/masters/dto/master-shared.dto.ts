import { DayOfWeek, PortfolioMediaType, ScheduleType } from '@prisma/client';
import { z } from 'zod';

const baseScheduleSchema = z.object({
  type: z.nativeEnum(ScheduleType),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  specificDate: z.string().date().optional(),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  timezone: z.string().trim().min(1).max(64),
  isRecurring: z.boolean().default(true),
  isActive: z.boolean().default(true),
  validFrom: z.string().date().optional(),
  validTo: z.string().date().optional(),
});

export const masterScheduleSchema = baseScheduleSchema.superRefine((value, ctx) => {
  if (value.startMinute >= value.endMinute) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endMinute'],
      message: 'endMinute must be greater than startMinute',
    });
  }

  if (value.isRecurring) {
    if (!value.dayOfWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dayOfWeek'],
        message: 'dayOfWeek is required for recurring schedules',
      });
    }

    if (value.specificDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['specificDate'],
        message: 'specificDate must be omitted for recurring schedules',
      });
    }
  } else if (!value.specificDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['specificDate'],
      message: 'specificDate is required for non-recurring schedules',
    });
  }

  if (value.validFrom && value.validTo && value.validFrom > value.validTo) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['validTo'],
      message: 'validTo must be on or after validFrom',
    });
  }
});

export const portfolioWorkSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  mediaUrl: z.string().trim().url(),
  mediaType: z.nativeEnum(PortfolioMediaType),
  sortOrder: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
});

const masterBodyObject = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().max(80).optional(),
  email: z.string().trim().email().max(255).optional(),
  phone: z.string().trim().min(5).max(30).optional(),
  avatarUrl: z.string().trim().url().optional(),
  bio: z.string().trim().max(2000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  isVisible: z.boolean().default(true),
  serviceIds: z.array(z.string().uuid()).default([]),
  schedules: z.array(masterScheduleSchema).default([]),
  portfolio: z.array(portfolioWorkSchema).default([]),
});

const requireEmailOrPhone = (value: { email?: string; phone?: string }, ctx: z.RefinementCtx) => {
  if (!value.email && !value.phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'Either email or phone is required',
    });
  }
};

export const createMasterBodySchema = masterBodyObject.superRefine(requireEmailOrPhone);
export const updateMasterBodySchema = masterBodyObject.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
    });
  }

  if ('email' in value || 'phone' in value) {
    const hasEmail = typeof value.email === 'string' && value.email.length > 0;
    const hasPhone = typeof value.phone === 'string' && value.phone.length > 0;

    if (!hasEmail && !hasPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['email'],
        message: 'Either email or phone must remain defined',
      });
    }
  }
});

export type CreateMasterBodyDto = z.infer<typeof createMasterBodySchema>;
export type UpdateMasterBodyDto = z.infer<typeof updateMasterBodySchema>;
