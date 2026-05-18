import type { CurrencyCode, PaymentKind, PaymentMethod, PaymentStatus } from '@prisma/client';

export interface PaymentSummaryResponse {
  id: string;
  bookingId: string;
  kind: PaymentKind;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  currency: CurrencyCode;
  externalReference: string | null;
  checkoutUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
}
