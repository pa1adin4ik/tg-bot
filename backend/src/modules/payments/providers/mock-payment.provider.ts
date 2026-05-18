import type { PaymentProvider, PaymentSessionResult } from './payment-provider.interface';

export class MockPaymentProvider implements PaymentProvider {
  public async createSession(input: {
    paymentId: string;
    amount: string;
    currency: string;
  }): Promise<PaymentSessionResult> {
    const externalReference = `mock_${input.paymentId}`;

    return {
      externalReference,
      checkoutUrl: `mock://pay/${input.paymentId}?amount=${input.amount}&currency=${input.currency}`,
    };
  }

  public async capture(_externalReference: string): Promise<'captured' | 'failed'> {
    return 'captured';
  }

  public async cancel(_externalReference: string): Promise<void> {
    return;
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
