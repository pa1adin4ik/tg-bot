import { Prisma } from '@prisma/client';

import { AppError } from '../../common/errors/app-error';
import type { AuthContext } from '../../common/middleware';
import { ADMIN_ROLE_CODES } from '../auth';
import { serviceQueries } from './services.queries';
import type {
  ListServiceCategoriesQuery,
  ListServicesQuery,
  ServiceCategoryResponse,
  ServiceResponse,
} from './services.types';

export class ServicesService {
  public async listServices(
    query: ListServicesQuery,
    auth?: AuthContext,
  ): Promise<ServiceResponse[]> {
    this.assertStatusAccess(query.status, auth);

    const services = await serviceQueries.listServices(query);

    return services
      .filter((service) => service.category.deletedAt === null)
      .filter((service) => query.status !== 'active' || service.category.isActive)
      .map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: this.toMoneyString(service.price),
        currency: service.currency,
        prepaymentRequired: service.prepaymentRequired,
        prepaymentAmount: service.prepaymentAmount
          ? this.toMoneyString(service.prepaymentAmount)
          : null,
        isActive: service.isActive,
        category: {
          id: service.category.id,
          name: service.category.name,
          slug: service.category.slug,
        },
      }));
  }

  public async listCategories(
    query: ListServiceCategoriesQuery,
    auth?: AuthContext,
  ): Promise<ServiceCategoryResponse[]> {
    this.assertStatusAccess(query.status, auth);

    const categories = await serviceQueries.listCategories(query);

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      isActive: category.isActive,
      servicesCount: category._count.services,
    }));
  }

  private assertStatusAccess(status: ListServicesQuery['status'], auth?: AuthContext): void {
    if (status === 'active') {
      return;
    }

    const hasAdminRole = auth?.roles.some((role) =>
      ADMIN_ROLE_CODES.includes(role as (typeof ADMIN_ROLE_CODES)[number]),
    );

    if (!hasAdminRole) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'Inactive or full service listings are available only for admin roles',
      );
    }
  }

  private toMoneyString(value: Prisma.Decimal): string {
    return value.toFixed(2);
  }
}

export const servicesService = new ServicesService();
