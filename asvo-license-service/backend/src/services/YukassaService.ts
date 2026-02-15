import { getConfig } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface PaymentParams {
  amount: number;
  currency?: string;
  description: string;
  paymentMethodId?: string;
  returnUrl?: string;
  metadata?: Record<string, string>;
}

interface YukassaPayment {
  id: string;
  status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
  amount: { value: string; currency: string };
  description: string;
  confirmation?: { type: string; confirmation_url: string };
  payment_method?: { id: string; saved: boolean };
  metadata?: Record<string, string>;
}

export class YukassaService {
  private static getHeaders() {
    const config = getConfig();
    const auth = Buffer.from(`${config.YUKASSA_SHOP_ID}:${config.YUKASSA_SECRET_KEY}`).toString('base64');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'Idempotence-Key': uuidv4(),
    };
  }

  private static isMockMode(): boolean {
    const config = getConfig();
    return !config.YUKASSA_SHOP_ID;
  }

  static async createPayment(params: PaymentParams): Promise<YukassaPayment> {
    if (this.isMockMode()) {
      const mockPayment: YukassaPayment = {
        id: `mock_${uuidv4()}`,
        status: 'succeeded',
        amount: { value: String(params.amount), currency: params.currency || 'RUB' },
        description: params.description,
        metadata: params.metadata,
      };
      logger.info({ mockPayment }, 'YuKassa MOCK: createPayment');
      return mockPayment;
    }

    const body: any = {
      amount: {
        value: String(params.amount),
        currency: params.currency || 'RUB',
      },
      description: params.description,
      capture: true,
      metadata: params.metadata,
    };

    if (params.paymentMethodId) {
      body.payment_method_id = params.paymentMethodId;
    } else if (params.returnUrl) {
      body.confirmation = {
        type: 'redirect',
        return_url: params.returnUrl,
      };
    }

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`YuKassa API error: ${response.status} ${errorText}`);
    }

    return response.json() as Promise<YukassaPayment>;
  }

  static async getPayment(paymentId: string): Promise<YukassaPayment> {
    if (this.isMockMode()) {
      const mockPayment: YukassaPayment = {
        id: paymentId,
        status: 'succeeded',
        amount: { value: '0', currency: 'RUB' },
        description: 'Mock payment',
      };
      logger.info({ paymentId }, 'YuKassa MOCK: getPayment');
      return mockPayment;
    }

    const config = getConfig();
    const auth = Buffer.from(`${config.YUKASSA_SHOP_ID}:${config.YUKASSA_SECRET_KEY}`).toString('base64');
    const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      throw new Error(`YuKassa API error: ${response.status}`);
    }

    return response.json() as Promise<YukassaPayment>;
  }

  static async createRefund(paymentId: string, amount: number): Promise<any> {
    if (this.isMockMode()) {
      logger.info({ paymentId, amount }, 'YuKassa MOCK: createRefund');
      return { id: `mock_refund_${uuidv4()}`, status: 'succeeded' };
    }

    const response = await fetch('https://api.yookassa.ru/v3/refunds', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        payment_id: paymentId,
        amount: { value: String(amount), currency: 'RUB' },
      }),
    });

    if (!response.ok) {
      throw new Error(`YuKassa API error: ${response.status}`);
    }

    return response.json();
  }

  private static readonly YUKASSA_IP_RANGES = [
    '185.71.76.', '185.71.77.',     // 185.71.76.0/27, 185.71.77.0/27
    '77.75.153.',                     // 77.75.153.0/25
    '77.75.156.11', '77.75.156.35',  // individual IPs
  ];

  static verifyWebhookIp(clientIp: string): boolean {
    if (this.isMockMode()) return true;
    const ip = clientIp.replace('::ffff:', '');
    return this.YUKASSA_IP_RANGES.some((prefix) => ip.startsWith(prefix) || ip === prefix);
  }
}
