import { buildBackKeyboard } from '../../common/keyboards/navigation.keyboard';
import type { NavigationScreenPayload } from '../../common/navigation/navigation-payload';
import { buildMastersListKeyboard, buildMasterDetailKeyboard } from '../../common/keyboards/masters.keyboard';
import { getBotMaster, listBotMasters } from '../../integrations/api/masters.api';

const dayLabels: Record<string, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

const formatMinutes = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const buildScheduleSummary = (
  schedules: Array<{
    type: 'WORKING_HOURS' | 'BLOCKED_TIME';
    dayOfWeek: string | null;
    specificDate: string | null;
    startMinute: number;
    endMinute: number;
    isActive: boolean;
  }>,
): string => {
  const visibleSchedules = schedules.filter(
    (schedule) => schedule.type === 'WORKING_HOURS' && schedule.isActive,
  );

  if (visibleSchedules.length === 0) {
    return 'Schedule: not published yet';
  }

  const lines = visibleSchedules.slice(0, 4).map((schedule) => {
    const label = schedule.dayOfWeek
      ? dayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek
      : schedule.specificDate ?? 'Custom';

    return `${label} ${formatMinutes(schedule.startMinute)}-${formatMinutes(schedule.endMinute)}`;
  });

  return `Schedule:\n${lines.join('\n')}`;
};

export const buildMastersListPayload = async (): Promise<NavigationScreenPayload> => {
  const masters = await listBotMasters();

  if (masters.length === 0) {
    return {
      text:
        'Masters\n\nNo specialists are visible right now. Please check again later or contact the salon.',
      replyMarkup: buildBackKeyboard(),
    };
  }

  const lines = masters.map((master, index) => {
    const specialization = master.specializations.length > 0
      ? master.specializations.slice(0, 3).join(', ')
      : 'General specialist';
    const experience =
      master.experienceYears !== null ? `${master.experienceYears} years experience` : 'Experience on request';

    return `${index + 1}. ${master.fullName}\n${specialization}\nRating: ${master.ratingAvg} (${master.reviewCount} reviews)\n${experience}`;
  });

  return {
    text: `Masters\n\n${lines.join('\n\n')}\n\nChoose a master to view details.`,
    replyMarkup: buildMastersListKeyboard(
      masters.map((master) => ({
        id: master.id,
        fullName: master.fullName,
      })),
    ),
  };
};

export const buildMasterDetailPayload = async (
  masterId: string,
): Promise<NavigationScreenPayload> => {
  const master = await getBotMaster(masterId);

  const specialization =
    master.specializations.length > 0 ? master.specializations.join(', ') : 'General specialist';
  const experience =
    master.experienceYears !== null ? `${master.experienceYears} years experience` : 'Experience on request';
  const portfolioLine =
    master.portfolio.length > 0 ? `Portfolio items: ${master.portfolio.length}` : 'Portfolio: not published yet';
  const bio = master.bio ? `\n\n${master.bio}` : '';
  const schedule = buildScheduleSummary(master.schedules);

  return {
    text:
      `${master.fullName}\n\n` +
      `Specialization: ${specialization}\n` +
      `Rating: ${master.ratingAvg} (${master.reviewCount} reviews)\n` +
      `${experience}\n` +
      `${portfolioLine}\n` +
      `${schedule}${bio}`,
    replyMarkup: buildMasterDetailKeyboard(),
  };
};
