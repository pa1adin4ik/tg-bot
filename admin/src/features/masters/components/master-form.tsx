import { type FormEvent, useEffect, useState } from 'react';

import type {
  MasterFormState,
  MasterPortfolioFormItem,
  MasterScheduleFormItem,
  ServiceOption,
} from '../types/master';
import { createEmptyPortfolioItem, createEmptySchedule } from '../types/master';

const dayOptions = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

interface MasterFormProps {
  title: string;
  initialValue: MasterFormState;
  serviceOptions: ServiceOption[];
  isSaving: boolean;
  onSubmit: (value: MasterFormState) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export const MasterForm = ({
  title,
  initialValue,
  serviceOptions,
  isSaving,
  onSubmit,
  onDelete,
}: MasterFormProps) => {
  const [form, setForm] = useState<MasterFormState>(initialValue);

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  const updateField = <Key extends keyof MasterFormState>(key: Key, value: MasterFormState[Key]) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const updateSchedule = (index: number, value: MasterScheduleFormItem) => {
    setForm((current) => ({
      ...current,
      schedules: current.schedules.map((schedule, scheduleIndex) =>
        scheduleIndex === index ? value : schedule,
      ),
    }));
  };

  const updatePortfolioItem = (index: number, value: MasterPortfolioFormItem) => {
    setForm((current) => ({
      ...current,
      portfolio: current.portfolio.map((item, itemIndex) => (itemIndex === index ? value : item)),
    }));
  };

  const toggleService = (serviceId: string) => {
    setForm((current) => ({
      ...current,
      serviceIds: current.serviceIds.includes(serviceId)
        ? current.serviceIds.filter((id) => id !== serviceId)
        : [...current.serviceIds, serviceId],
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">Profile, services, schedule, and portfolio are managed in one place.</p>
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            Delete
          </button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-slate-700">
          <span>First name</span>
          <input
            value={form.firstName}
            onChange={(event) => updateField('firstName', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
            required
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Last name</span>
          <input
            value={form.lastName}
            onChange={(event) => updateField('lastName', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Phone</span>
          <input
            value={form.phone}
            onChange={(event) => updateField('phone', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Avatar URL</span>
          <input
            value={form.avatarUrl}
            onChange={(event) => updateField('avatarUrl', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
          />
        </label>
        <label className="space-y-2 text-sm text-slate-700">
          <span>Experience (years)</span>
          <input
            type="number"
            min={0}
            max={60}
            value={form.experienceYears}
            onChange={(event) => updateField('experienceYears', event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
          />
        </label>
      </div>

      <label className="block space-y-2 text-sm text-slate-700">
        <span>Bio</span>
        <textarea
          value={form.bio}
          onChange={(event) => updateField('bio', event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 px-3 py-2 outline-none transition focus:border-slate-400"
        />
      </label>

      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.isVisible}
          onChange={(event) => updateField('isVisible', event.target.checked)}
          className="size-4"
        />
        Visible in public channels
      </label>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Specializations</h3>
          <p className="text-sm text-slate-500">Assign services this master can perform.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {serviceOptions.map((service) => (
            <label
              key={service.id}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                checked={form.serviceIds.includes(service.id)}
                onChange={() => toggleService(service.id)}
                className="size-4"
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Work Schedule</h3>
            <p className="text-sm text-slate-500">Recurring rules and one-off availability exceptions.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField('schedules', [...form.schedules, createEmptySchedule()])
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add Schedule
          </button>
        </div>

        <div className="space-y-4">
          {form.schedules.map((schedule, index) => (
            <div key={`${schedule.type}-${index}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">Schedule #{index + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'schedules',
                      form.schedules.filter((_, scheduleIndex) => scheduleIndex !== index),
                    )
                  }
                  className="text-sm font-medium text-rose-600"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Type</span>
                  <select
                    value={schedule.type}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        type: event.target.value as MasterScheduleFormItem['type'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="WORKING_HOURS">Working hours</option>
                    <option value="BLOCKED_TIME">Blocked time</option>
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Timezone</span>
                  <input
                    value={schedule.timezone}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        timezone: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={schedule.isRecurring}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        isRecurring: event.target.checked,
                        specificDate: event.target.checked ? null : schedule.specificDate,
                      })
                    }
                  />
                  Recurring
                </label>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={schedule.isActive}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        isActive: event.target.checked,
                      })
                    }
                  />
                  Active
                </label>

                {schedule.isRecurring ? (
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Day of week</span>
                    <select
                      value={schedule.dayOfWeek ?? 'MONDAY'}
                      onChange={(event) =>
                        updateSchedule(index, {
                          ...schedule,
                          dayOfWeek: event.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    >
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="space-y-2 text-sm text-slate-700">
                    <span>Specific date</span>
                    <input
                      type="date"
                      value={schedule.specificDate ?? ''}
                      onChange={(event) =>
                        updateSchedule(index, {
                          ...schedule,
                          specificDate: event.target.value || null,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </label>
                )}

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Start minute</span>
                  <input
                    type="number"
                    min={0}
                    max={1439}
                    value={schedule.startMinute}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        startMinute: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>End minute</span>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={schedule.endMinute}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        endMinute: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Valid from</span>
                  <input
                    type="date"
                    value={schedule.validFrom ?? ''}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        validFrom: event.target.value || null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Valid to</span>
                  <input
                    type="date"
                    value={schedule.validTo ?? ''}
                    onChange={(event) =>
                      updateSchedule(index, {
                        ...schedule,
                        validTo: event.target.value || null,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Portfolio Gallery</h3>
            <p className="text-sm text-slate-500">Images and videos shown in public master profiles.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField('portfolio', [...form.portfolio, createEmptyPortfolioItem()])
            }
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Add Portfolio Item
          </button>
        </div>

        <div className="space-y-4">
          {form.portfolio.map((item, index) => (
            <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900">Portfolio #{index + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    updateField(
                      'portfolio',
                      form.portfolio.filter((_, itemIndex) => itemIndex !== index),
                    )
                  }
                  className="text-sm font-medium text-rose-600"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Title</span>
                  <input
                    value={item.title}
                    onChange={(event) =>
                      updatePortfolioItem(index, {
                        ...item,
                        title: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Media URL</span>
                  <input
                    value={item.mediaUrl}
                    onChange={(event) =>
                      updatePortfolioItem(index, {
                        ...item,
                        mediaUrl: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Media type</span>
                  <select
                    value={item.mediaType}
                    onChange={(event) =>
                      updatePortfolioItem(index, {
                        ...item,
                        mediaType: event.target.value as MasterPortfolioFormItem['mediaType'],
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Sort order</span>
                  <input
                    type="number"
                    min={0}
                    value={item.sortOrder}
                    onChange={(event) =>
                      updatePortfolioItem(index, {
                        ...item,
                        sortOrder: Number(event.target.value),
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2 text-sm text-slate-700">
                <span>Description</span>
                <textarea
                  value={item.description ?? ''}
                  onChange={(event) =>
                    updatePortfolioItem(index, {
                      ...item,
                      description: event.target.value,
                    })
                  }
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 px-3 py-2"
                />
              </label>

              <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={item.isPublished}
                  onChange={(event) =>
                    updatePortfolioItem(index, {
                      ...item,
                      isPublished: event.target.checked,
                    })
                  }
                />
                Published
              </label>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save Master'}
        </button>
      </div>
    </form>
  );
};
