export interface PaymentSessionResult {
  externalReference: string;
  checkoutUrl: string;
}

export interface PaymentProvider {
  createSession(input: {
    paymentId: string;
    amount: string;
    currency: string;
  }): Promise<PaymentSessionResult>;

  capture(externalReference: string): Promise<'captured' | 'failed'>;
  cancel(externalReference: string): Promise<void>;
}
