import { buildBackKeyboard } from '../../common/keyboards/navigation.keyboard';
import type { NavigationScreenPayload } from '../../common/navigation/navigation-payload';
import { listBotServices } from '../../integrations/api/services.api';

const formatDuration = (durationMinutes: number): string => {
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

export const buildServicesScreenPayload = async (): Promise<NavigationScreenPayload> => {
  const services = await listBotServices();

  if (services.length === 0) {
    return {
      text:
        'Services\n\nThere are no active services available right now. Please check back later or contact the salon directly.',
      replyMarkup: buildBackKeyboard(),
    };
  }

  const groupedServices = new Map<string, typeof services>();

  for (const service of services) {
    const existingGroup = groupedServices.get(service.category.name);

    if (existingGroup) {
      existingGroup.push(service);
      continue;
    }

    groupedServices.set(service.category.name, [service]);
  }

  const sections = Array.from(groupedServices.entries()).map(([categoryName, categoryServices]) => {
    const serviceLines = categoryServices.map((service) => {
      const description = service.description ? `\n   ${service.description}` : '';

      return `- ${service.name} - ${formatDuration(service.durationMinutes)} - ${service.price} ${service.currency}${description}`;
    });

    return `${categoryName}\n${serviceLines.join('\n')}`;
  });

  return {
    text: `Services\n\n${sections.join('\n\n')}`,
    replyMarkup: buildBackKeyboard(),
  };
};
